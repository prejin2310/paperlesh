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

  // Detect unsupported browsers (iOS Safari lacks Web Push support)
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isIOS = /iP(hone|od|ad)/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua);
    const lacksPush = !( 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined' );
    if (isIOS && isSafari && lacksPush) {
      setUnsupported(true);
      // show banner promptly
      setVisible(true);
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
        <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 max-w-lg mx-4">
          <button aria-label="Close" onClick={() => setVisible(false)} className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white rounded-full p-1">×</button>
          <h3 className="text-lg font-bold mb-2">Enable notifications to stay up to date</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">We need permission to send reminders and important updates. Please enable notifications to continue using full features.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={enable} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Enable</button>
          </div>
        </div>
      </div>
    );
  }

  // If browser is unsupported for web-push (iOS Safari), show recommendation banner
  if (unsupported) {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
        <div className="relative bg-yellow-50 dark:bg-yellow-900/80 rounded-xl shadow-xl p-4 border flex items-start gap-3">
          <div className="flex-1">
            <div className="font-bold text-sm mb-1">Browser not fully supported</div>
            <div className="text-xs text-slate-700 dark:text-yellow-200 mb-3">Safari on iOS does not support Web Push. To receive push notifications, please open this site in Chrome or Edge (Android/desktop) or use the web on a supported browser.</div>
            <div className="flex gap-2">
              <button onClick={() => window.location.href = '/'} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">Go to Homepage</button>
              <button onClick={() => setVisible(false)} className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-sm rounded-md">Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl p-4 border flex items-start gap-3">
        <button aria-label="Close" onClick={() => setVisible(false)} className="absolute top-2 right-2 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white rounded-full p-1">×</button>
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
