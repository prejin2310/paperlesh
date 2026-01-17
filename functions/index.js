const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { format, subDays, addDays, parseISO, isSameDay } = require("date-fns");

admin.initializeApp();

const db = admin.firestore();

// Helper to send notification
const sendPush = async (uid, title, body, data = {}) => {
  const userDoc = await db.collection("users").doc(uid).get();
  const token = userDoc.data()?.fcmToken;

  if (!token) return;

  const payload = {
    notification: {
      title: title,
      body: body,
    },
    data: data
  };

  // 1. Send to FCM
  try {
    // Prefer the HTTP v1 style message for web push to ensure proper webpush headers
    const message = {
      token: token,
      webpush: {
        notification: {
          title: payload.notification.title,
          body: payload.notification.body,
          icon: payload.notification.icon || '/pwa-192x192.png',
          badge: payload.notification.badge || '/pwa-192x192.png'
        }
      },
      data: Object.keys(data || {}).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {})
    };

    await admin.messaging().send(message);
    console.log(`Sent to ${uid}`);
  } catch (e) {
    console.error(`Error sending to ${uid}`, e);
  }

  // 2. Save to Firestore (In-App Notification History)
  await db.collection("users").doc(uid).collection("notifications").add({
    title,
    body,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...data
  });
};

// Scheduled Job: Runs every day at 8:00 PM
exports.checkDailyLog = functions.pubsub.schedule("every day 20:00").timeZone("Asia/Kolkata").onRun(async (context) => {
  const usersSnap = await db.collection("users").get();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const promises = usersSnap.docs.map(async (doc) => {
    const uid = doc.id;
    
    // Check if logged today
    const logSnap = await db.collection("users").doc(uid).collection("logs").doc(todayStr).get();
    
    if (!logSnap.exists) {
        await sendPush(
            uid, 
            "📝 Don't break your streak!", 
            "You haven't logged your day yet. Take a minute to reflect.", 
            { type: "missed_log" }
        );
    }
  });

  await Promise.all(promises);
  return null;
});

// Scheduled Job: Runs every day at 10:00 PM - second reminder for missed logs
exports.checkDailyLogLate = functions.pubsub.schedule("every day 22:00").timeZone("Asia/Kolkata").onRun(async (context) => {
  const usersSnap = await db.collection("users").get();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const promises = usersSnap.docs.map(async (doc) => {
    const uid = doc.id;
    const logSnap = await db.collection("users").doc(uid).collection("logs").doc(todayStr).get();

    if (!logSnap.exists) {
      await sendPush(
        uid,
        "🕙 Final reminder: Log your day",
        "This is a quick reminder to submit today's log before the day ends.",
        { type: "missed_log_late" }
      );
    }
  });

  await Promise.all(promises);
  return null;
});

// Scheduled Job: Runs every day at 9:00 AM for Important Dates
exports.checkImportantDates = functions.pubsub.schedule("every day 09:00").timeZone("Asia/Kolkata").onRun(async (context) => {
  const usersSnap = await db.collection("users").get();
  const today = new Date();
  
  const promises = usersSnap.docs.map(async (userDoc) => {
    const uid = userDoc.id;
    // 1. Check Important Dates Tool
    const toolDoc = await db.collection("users").doc(uid).collection("tools").doc("important_dates").get();
    
    if (toolDoc.exists) {
        const items = toolDoc.data().items || [];
        items.forEach(async (item) => {
            if (!item.date) return;
            // item.date is usually YYYY-MM-DD
            const itemDate = parseISO(item.date);
            
            // Allow ignoring year for birthdays if needed, but for now simple exact date match or same month/day
            // Let's match just Month and Day for "Birthdays" recurring
            const isSameMonthAndDay = itemDate.getMonth() === today.getMonth() && itemDate.getDate() === today.getDate();
            
            if (isSameMonthAndDay) {
                await sendPush(uid, "🎉 Important Date Today!", `It's ${item.title}: ${item.subtitle || ''}`, { type: "event" });
            }
        });
    }
  });
  
  await Promise.all(promises);
});

// Scheduled Job: Cleanup old notifications (Run weekly)
exports.cleanupNotifications = functions.pubsub.schedule("every sunday 03:00").onRun(async (context) => {
    const users = await db.collection("users").get();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const promises = users.docs.map(async (user) => {
        const notifs = await db.collection("users").doc(user.id).collection("notifications")
            .where("createdAt", "<", thirtyDaysAgo)
            .get();
            
        const batch = db.batch();
        notifs.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    });
    
    await Promise.all(promises);
});

// Scheduled Job: Runs every day at 8:02 AM to send Good Morning messages and reminders
exports.morningGreeting = functions.pubsub.schedule("every day 08:02").timeZone("Asia/Kolkata").onRun(async (context) => {
  const usersSnap = await db.collection("users").get();

  const greetings = [
   "Good morning 🌿 Take a deep breath and begin.",
  "Good morning ☀️ A fresh day, a fresh page.",
  "Wake up gently 🌸 Today is yours.",
  "Good morning ✨ Let today flow naturally.",
  "A new morning, a new chance 🌤️",
  "Good morning 🌼 Start slow. Start kind.",
  "Rise and reflect 🌅 Your day begins now.",
  "Good morning 🤍 Write today with intention."
  ];

  const promises = usersSnap.docs.map(async (doc) => {
    const uid = doc.id;
    // Pick a random greeting
    const body = greetings[Math.floor(Math.random() * greetings.length)];
    await sendPush(uid, "Good Morning!", body, { type: "good_morning" });
  });

  await Promise.all(promises);
  return null;
});