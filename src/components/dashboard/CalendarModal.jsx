import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  getDay, 
  addMonths, 
  subMonths,
  isToday,
  isFuture 
} from 'date-fns';
import { FiX, FiChevronLeft, FiChevronRight, FiMaximize2 } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarModal = ({ isOpen, onClose, logs, onSelectDate }) => {
  const { isDarkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start); // 0 = Sunday

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Mood Colors Mapping (0-7) - keeping consistent with Dashboard/Logs
  const moodColors = [
    'bg-yellow-100 text-yellow-800', // Happy
    'bg-pink-100 text-pink-800',     // Fantastic
    'bg-rose-100 text-rose-800',     // Romantic
    'bg-emerald-100 text-emerald-800', // Normal
    'bg-orange-100 text-orange-800', // Stressed
    'bg-indigo-100 text-indigo-800', // Tired
    'bg-red-100 text-red-800',         // Angry
    'bg-blue-100 text-blue-800'       // Sad
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden ${
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
            }`}
        >
             {/* Header */}
            <div className={`p-6 pb-2 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <div>
                    <h2 className="text-2xl font-black">{format(currentDate, 'MMMM yyyy')}</h2>
                    <p className={`text-sm font-medium opacity-60`}>Your Journey Log</p>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={prevMonth} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}>
                        <FiChevronLeft size={20} />
                     </button>
                     <button onClick={nextMonth} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}>
                        <FiChevronRight size={20} />
                     </button>
                     <button onClick={onClose} className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ml-2`}>
                        <FiX size={18} />
                     </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
                <div className="grid grid-cols-7 mb-4">
                     {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                         <div key={i} className="text-center text-xs font-bold opacity-40 uppercase tracking-widest">
                            {d}
                         </div>
                     ))}
                </div>
                <div className="grid grid-cols-7 gap-3">
                    {[...Array(startDayOfWeek)].map((_, i) => <div key={`empty-${i}`} />)}
                    
                    {days.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const log = logs[dayStr];
                        const hasLog = !!log;
                        const isTodayDate = isSameDay(day, new Date());
                        const isFutureDate = isFuture(day);
                        const isMissed = !hasLog && !isFutureDate && !isTodayDate;
                        
                        let cellStyle = "";

                        if (isTodayDate) {
                             if(hasLog) {
                                // Today + Logged = Green Highlight
                                cellStyle = isDarkMode 
                                 ? 'bg-emerald-900/40 text-white border border-emerald-500 shadow-md shadow-emerald-500/20' 
                                 : 'bg-emerald-50 text-emerald-950 border border-emerald-500 shadow-md shadow-emerald-200';
                             } else {
                                // Today + Not Logged = Black/White Action
                                cellStyle = isDarkMode ? 'bg-white text-black ring-2 ring-white z-10' : 'bg-black text-white ring-2 ring-black z-10';
                             }
                        } else if (isFutureDate) {
                            // Upcoming = Freeze
                            cellStyle = isDarkMode ? 'bg-gray-900/40 text-gray-700 opacity-50 grayscale cursor-not-allowed' : 'bg-gray-50/50 text-gray-300 opacity-40 cursor-not-allowed';
                        } else if (hasLog) {
                             // Logged = Light Green (Consistent with Dashboard)
                             cellStyle = isDarkMode ? 'bg-emerald-900/20 text-emerald-300 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-900 border border-emerald-200';
                        } else if (isMissed) {
                            // Missed = Light Red
                            cellStyle = isDarkMode ? 'bg-red-900/20 text-red-500 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200';
                        } else {
                            // Fallback
                             cellStyle = isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400';
                        }
                        
                        return (
                            <motion.button 
                                disabled={isFutureDate}
                                whileHover={!isFutureDate ? { scale: 1.1 } : {}}
                                whileTap={!isFutureDate ? { scale: 0.9 } : {}}
                                key={dayStr}
                                onClick={() => {
                                    if(!isFutureDate) {
                                        onSelectDate(dayStr);
                                        onClose();
                                    }
                                }}
                                className={`relative flex flex-col items-center justify-center aspect-square ${isFutureDate ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all shadow-sm ${cellStyle}`}>
                                    {format(day, 'd')}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
            
            <div className={`p-4 text-center text-xs font-medium border-t ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                Select a date to view or edit entry
            </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CalendarModal;
