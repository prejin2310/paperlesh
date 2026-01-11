import { useState, useEffect } from 'react';
import { requestForToken, onMessageListener, db } from '../lib/firebase';
import { doc, setDoc, collection, onSnapshot, query, orderBy, limit, deleteDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useNotifications = (currentUser) => {
  const [notificationToken, setNotificationToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);

  // Poll permission status occasionally to handle external changes (e.g. browser settings)
  useEffect(() => {
    const check = () => setPermissionStatus(Notification.permission);
    const timer = setInterval(check, 2000);
    return () => clearInterval(timer);
  }, []);

  const requestPermission = async () => {
    try {
      const token = await requestForToken();
      if (token) {
        setNotificationToken(token);
        setPermissionStatus('granted');
        if (currentUser) {
            await setDoc(doc(db, 'users', currentUser.uid), { fcmToken: token }, { merge: true });
        }
        toast.success("Notifications enabled!");
        return true;
      }
    } catch (error) {
      console.error("Permission setup error", error);
      toast.error("Could not enable notifications");
    }
    return false;
  };

  // 1. Setup Messaging (Token & Foreground Listener) if search permission is already granted
  useEffect(() => {
    if (!currentUser) return;
    
    if (Notification.permission === 'granted') {
        requestPermission();
    }

    // Foreground Message Listener
    const unsubscribeMessage = onMessageListener().then(payload => {
      toast(payload?.notification?.title + ": " + payload?.notification?.body, {
        icon: '🔔',
        duration: 5000
      });
      // Optionally add to local state if not using Firestore stream for real-time
    }).catch(err => console.log('failed: ', err));

    return () => {}; // Cleanup if needed
  }, [currentUser]);

  // 2. Listen to Firestore Notifications Collection
  useEffect(() => {
    if (!currentUser) return;

    const notifsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const q = query(notifsRef, orderBy('createdAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      
      // Auto-delete old notifications locally (or trigger cloud function logic)
      // Here we just display. Background cleanup is better for "auto-delete after days"
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (id) => {
    if (!currentUser) return;
    try {
      const notifRef = doc(db, 'users', currentUser.uid, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    // Batch update usually, or loop
    // For simplicity in client:
    notifications.forEach(n => {
        if(!n.read) markAsRead(n.id);
    });
  };

  const deleteNotification = async (id) => {
      if(!currentUser) return;
      await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', id));
  }

  const clearAllNotifications = async () => {
    if(!currentUser) return;
    const batch = parseInt(notifications.length); // Use simple loop for client simplicity if batch is annoying
    // Better to just map delete promises
    const promises = notifications.map(n => deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', n.id)));
    await Promise.all(promises);
  }

  return {
    notificationToken,
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
    permissionStatus,
    requestPermission
  };
};
