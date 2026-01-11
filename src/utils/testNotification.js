import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const sendTestNotification = async (currentUser) => {
    if (!currentUser) return;
    try {
        await addDoc(collection(db, 'users', currentUser.uid, 'notifications'), {
            title: "Test Notification",
            body: "This is how in-app notifications will look!",
            read: false,
            createdAt: new Date(),
            type: 'test'
        });
        toast.success("Test notification sent!");
    } catch (e) {
        console.error(e);
        toast.error("Failed to crate test notification");
    }
};