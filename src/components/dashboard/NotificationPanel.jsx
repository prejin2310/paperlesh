import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiTrash2, FiBell, FiSettings } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { sendTestNotification } from '../../utils/testNotification';
import { useAuth } from '../../context/AuthContext';

const NotificationPanel = ({ isOpen, onClose, notifications, onMarkRead, onDelete, onMarkAllRead, onClearAll, permissionStatus, onRequestPermission }) => {
  const { currentUser } = useAuth();
  
  return (
    <>
      <div 
        className="fixed inset-0 z-[50]" 
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute right-4 top-20 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-[51] overflow-hidden flex flex-col max-h-[70vh]"
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FiBell className="text-orange-500" /> Notifications
            </h3>
            <div className="flex gap-3">
                {notifications.length > 0 && (
                    <button onClick={onMarkAllRead} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Read All
                    </button>
                )}
                {notifications.length > 0 && (
                    <button onClick={onClearAll} className="text-xs font-semibold text-red-500 hover:underline">
                        Clear All
                    </button>
                )}
            </div>
        </div>

        {/* Debug / Test Area */}
        {process.env.NODE_ENV === 'development' && (
            <div className="px-4 py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                <button onClick={() => sendTestNotification(currentUser)} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                    Simulate Verification
                </button>
            </div>
        )}

        {permissionStatus === 'default' && (
             <div className="p-4 m-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1">Enable Notifications? 🔔</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-3">Get reminded about your streaks and friends' birthdays.</p>
                <button 
                    onClick={onRequestPermission}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                    Turn On Notifications
                </button>
             </div>
        )}
        
        {permissionStatus === 'denied' && (
             <div className="p-4 m-2 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800/50">
                <p className="text-xs text-red-700 dark:text-red-300">
                    Notifications are blocked. Please enable them in your browser settings to receive updates.
                </p>
             </div>
        )}

        <div className="overflow-y-auto p-2 space-y-2 no-scrollbar">
            {notifications.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FiBell size={20} />
                    </div>
                    <p className="text-sm">No new notifications</p>
                </div>
            ) : (
                notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        className={`p-3 rounded-xl transition-colors relative group ${notif.read ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/30' : 'bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                    >
                        <div className="flex gap-3">
                            <div className="mt-1 min-w-[8px] h-2 rounded-full bg-orange-500 opacity-0 transition-opacity" style={{ opacity: notif.read ? 0 : 1 }}></div>
                            <div className="flex-1">
                                <h4 className={`text-sm ${notif.read ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-900 dark:text-white font-bold'}`}>
                                    {notif.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    {notif.body}
                                </p>
                                <span className="text-[10px] text-gray-400 mt-2 block">
                                    {notif.createdAt?.seconds ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {!notif.read && (
                                    <button onClick={() => onMarkRead(notif.id)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded">
                                        <FiCheck size={14} />
                                    </button>
                                )}
                                <button onClick={() => onDelete(notif.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </motion.div>
    </>
  );
};

export default NotificationPanel;
