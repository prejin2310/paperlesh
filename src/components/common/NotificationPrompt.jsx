import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { requestForToken, db } from '../../lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const NotificationPrompt = () => {
  const { currentUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [denied, setDenied] = useState(false);
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported');
      return;
    }
    const perm = Notification.permission;
    setPermission(perm);
    console.debug('Notification permission on mount:', perm);

    if (perm === 'granted') {
      setVisible(false);
      return;
    }
    if (perm === 'denied') {
      setDenied(true);
      setVisible(true);
      return;
    }
    // default -> show prompt after short delay
    if (perm === 'default') {
      // If user is logged in, force a blocking modal; otherwise show small banner
      const t = setTimeout(() => setVisible(true), currentUser ? 500 : 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const enable = async () => {
    try {
      // Ensure service worker is ready (important for installed PWAs)
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
          console.debug('Service worker ready');
        } catch (swErr) {
          console.debug('Service worker ready error', swErr);
        }
      }
      const token = await requestForToken();
      console.debug('requestForToken returned', token);
      if (token) {
        toast.success('Notifications enabled');
        if (currentUser) {
          await setDoc(doc(db, 'users', currentUser.uid), { fcmToken: token }, { merge: true });
        }
        setVisible(false);
        setPermission('granted');
      } else {
        toast.error('Permission denied or token unavailable');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to enable notifications');
    }
  };

  if (!visible) return null;

  // If logged in and permission is default, force a blocking modal
  if (currentUser && permission === 'default') {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 max-w-lg mx-4">
          <h3 className="text-lg font-bold mb-2">Enable notifications to stay up to date</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">We need permission to send reminders and important updates. Please enable notifications to continue using full features.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={enable} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Enable</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-4 border flex items-start gap-3">
        <div className="flex-1">
          <div className="font-bold text-sm mb-1">Don't miss updates</div>
          <div className="text-xs text-slate-600 dark:text-slate-300 mb-3">Enable push notifications to stay informed about reminders and important updates.</div>
          {denied ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">Notifications are blocked. Please enable them in your browser settings for this site.</div>
          ) : (
            <div className="flex gap-2">
              <button onClick={enable} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">Turn On</button>
              <button onClick={() => setVisible(false)} className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-sm rounded-md">Remind me later</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
