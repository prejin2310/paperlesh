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
    await admin.messaging().sendToDevice(token, payload);
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