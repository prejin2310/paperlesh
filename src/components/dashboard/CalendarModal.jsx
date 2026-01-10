import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  addMonths, 
  subMonths,
  isToday,
  isFuture,
  parseISO
} from 'date-fns';
import { FiX, FiChevronLeft, FiChevronRight, FiCalendar, FiList } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarModal = ({ isOpen, onClose, logs, onDateSelect }) => {
  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [currentDate, setCurrentDate] = useState(new Date());

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start); // 0 = Sunday

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Sort logs for List View - Descending
  const historyList = Object.keys(logs || {})
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({ date, ...logs[date] }));

  const MOOD_EMOJI = ['😊', '🤩', '🥰', '😌', '😓', '😴', '😡', '😢'];

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
       <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: "100%" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: "100%" }}
            className={`relative z-10 w-full max-w-lg h-[85vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden mb-20 md:mb-0 ${isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'}`}
        >
            {/* Header */}
            <div className={`p-6 pb-2`}>
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-black">History</h2>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                         <FiX size={24} />
                     </button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
                    <button 
                         onClick={() => setViewMode('calendar')}
                         className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <FiCalendar /> Calendar
                    </button>
                    <button 
                         onClick={() => setViewMode('list')}
                         className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <FiList /> All Entries
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                
                {/* CALENDAR VIEW */}
                {viewMode === 'calendar' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex justify-between items-center mb-6 px-1">
                             <h3 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h3>
                             <div className="flex gap-2">
                                 <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><FiChevronLeft /></button>
                                 <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><FiChevronRight /></button>
                             </div>
                        </div>

                         <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                             {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                 <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-widest">{d}</div>
                             ))}
                         </div>
                         <div className="grid grid-cols-7 gap-2">
                             {[...Array(startDayOfWeek)].map((_, i) => <div key={`e-${i}`} />)}
                             {days.map(day => {
                                 const dateStr = format(day, 'yyyy-MM-dd');
                                 const log = logs?.[dateStr];
                                 
                                 return (
                                     <button
                                         key={dateStr}
                                         onClick={() => {
                                             onDateSelect(dateStr); // Use correct prop name from Dashboard
                                             onClose();
                                         }}
                                         disabled={isFuture(day)}
                                         className={`
                                            aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all group
                                            ${log ? (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100') : ''}
                                            ${isToday(day) ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-black' : ''}
                                            ${isFuture(day) ? 'opacity-30 cursor-not-allowed' : ''}
                                         `}
                                     >
                                         <span className={`text-sm font-bold ${!log ? 'text-gray-400' : ''}`}>{format(day, 'd')}</span>
                                         {log && (
                                            <div className="mt-1">
                                                {log.mood !== undefined ? (
                                                    <span className="text-xs filter grayscale-[0.3] group-hover:grayscale-0 transition-all">{MOOD_EMOJI[log.mood]}</span>
                                                ) : (
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                )}
                                            </div>
                                         )}
                                     </button>
                                 )
                             })}
                         </div>
                    </motion.div>
                )}

                {/* LIST VIEW (FEED) */}
                {viewMode === 'list' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {historyList.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <span className="text-4xl block mb-2">📭</span>
                                <p>No journal entries yet.</p>
                            </div>
                        ) : (
                             historyList.map(entry => (
                                 <motion.div 
                                    key={entry.date} 
                                    layout
                                    onClick={() => { onDateSelect(entry.date); onClose(); }}
                                    className={`p-5 rounded-[1.5rem] cursor-pointer transition-transform hover:scale-[1.02] border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}
                                 >
                                     <div className="flex items-start gap-4">
                                         <div className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl ${entry.mood !== undefined ? 'bg-transparent' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                             {entry.mood !== undefined ? MOOD_EMOJI[entry.mood] : '📝'}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <div className="flex justify-between items-center mb-1">
                                                 <span className="font-bold text-lg">{format(parseISO(entry.date), 'MMMM do, yyyy')}</span>
                                                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(parseISO(entry.date), 'EEE')}</span>
                                             </div>
                                             
                                             <p className="text-gray-600 dark:text-gray-300 line-clamp-2 text-sm font-medium leading-relaxed">
                                                 {entry.note || entry.longNote || entry.story || "No text written."}
                                             </p>
                                             
                                             {(entry.tags || []).length > 0 && (
                                                <div className="flex gap-2 mt-3 overflow-hidden">
                                                    {entry.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-md text-gray-500 uppercase">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                             )}
                                         </div>
                                     </div>
                                 </motion.div>
                             ))
                        )}
                        <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest py-8">End of History</p>
                    </motion.div>
                )}

            </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default CalendarModal;
