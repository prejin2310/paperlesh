import { useState, useEffect } from 'react';
import { 
  format, 
  startOfYear, 
  endOfYear, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval, 
  isSameDay, 
  subDays,
  isToday,
  getDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  isFuture
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { 
  FiEdit2, 
  FiPlus, 
  FiCheck, 
  FiActivity, 
  FiZap,
  FiShoppingCart, 
  FiList, 
  FiFileText,
  FiSmile,
  FiSun,
  FiMoon,
  FiDollarSign,
  FiStar,
  FiChevronLeft,
  FiBell,
  FiChevronRight,
  FiCalendar
} from 'react-icons/fi';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import DailyLogWizard from '../components/dashboard/DailyLogWizard';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  // State
  const [logs, setLogs] = useState({}); // Map of dateString -> logData
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);

  // Fetch Logs (Yearly for stats)
  useEffect(() => {
    const fetchLogs = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const startStr = format(startOfYear(new Date()), 'yyyy-MM-dd');
        const endStr = format(endOfYear(new Date()), 'yyyy-MM-dd');

        const logsRef = collection(db, 'users', currentUser.uid, 'logs');
        const q = query(
            logsRef, 
            where('date', '>=', startStr), 
            where('date', '<=', endStr)
        );
        
        const querySnapshot = await getDocs(q);
        const logsMap = {};
        querySnapshot.forEach((doc) => {
            logsMap[doc.id] = doc.data();
        });
        
        setLogs(prev => ({ ...prev, ...logsMap }));
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentUser]);

  // Derived Values
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLog = logs[todayStr];
  const isLoggedToday = !!todayLog;

  const handleOpenLog = (dateStr) => {
      setSelectedDate(dateStr);
      setIsModalOpen(true);
  };
    
  const renderRecentDays = () => {
       const today = new Date();
       const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
       const end = endOfWeek(today, { weekStartsOn: 1 });
       const days = eachDayOfInterval({ start, end });

       // Mood Colors Mapping (0-7) matching DailyLogWizard
       const moodColors = [
           'bg-yellow-100 text-yellow-800 border-yellow-200', // Happy
           'bg-pink-100 text-pink-800 border-pink-200',     // Fantastic
           'bg-rose-100 text-rose-800 border-rose-200',     // Romantic
           'bg-emerald-100 text-emerald-800 border-emerald-200', // Normal
           'bg-orange-100 text-orange-800 border-orange-200', // Stressed
           'bg-indigo-100 text-indigo-800 border-indigo-200', // Tired
           'bg-red-100 text-red-800 border-red-200',         // Angry
           'bg-blue-100 text-blue-800 border-blue-200'       // Sad
       ];
       
       const moodEmojis = ['🙂', '🤩', '🥰', '😐', '😫', '😴', '😠', '😢'];

      return (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 pt-2 px-1">
              {days.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const log = logs[dateStr];
                  const hasLog = !!log;
                  const isCurrentDay = isToday(date);
                  const isUpcoming = isFuture(date);
                  const isMissed = !hasLog && !isUpcoming && !isCurrentDay;
                  
                  // Determine Styles
                  let cardStyle = "bg-white text-gray-800 border-gray-100 hover:border-gray-300"; // Default Empty
                  
                  if (isUpcoming) {
                      cardStyle = "bg-gray-50 text-gray-300 border-transparent cursor-not-allowed opacity-60";
                  } else if (hasLog) {
                      // Use Mood Color or Fallback to generic logged style
                      const moodIdx = log.mood;
                      if (moodIdx !== undefined && moodColors[moodIdx]) {
                          cardStyle = moodColors[moodIdx] + " shadow-sm";
                      } else {
                          // Logged but no mood? (Shouldn't happen often)
                          cardStyle = "bg-purple-100 text-purple-900 border-purple-200";
                      }
                  } else if (isMissed) {
                      cardStyle = "bg-red-50 text-red-400 border-red-100";  // Missed Style
                  } else if (isCurrentDay) {
                       cardStyle = "bg-gray-900 text-white border-transparent shadow-xl shadow-gray-200"; // Active 'Add' state
                  }

                  return (
                      <div 
                        key={dateStr}
                        onClick={() => !isUpcoming && handleOpenLog(dateStr)}
                        className={`flex-shrink-0 w-28 p-4 rounded-[1.5rem] border-2 transition-all relative overflow-hidden ${cardStyle} ${!isUpcoming ? 'cursor-pointer active:scale-95' : ''}`}
                      >
                          <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">
                              {isCurrentDay ? 'Today' : format(date, 'EEE')}
                          </div>
                          <div className="text-xl font-black mb-3 leading-none">
                              {format(date, 'd')}
                          </div>
                          
                          {/* Content */}
                          {hasLog ? (
                              <div className="flex flex-col gap-1">
                                  <div className="text-3xl">
                                      {moodEmojis[log.mood] || '•'}
                                  </div>
                                   <div className="flex items-center gap-2 opacity-80 mt-1">
                                      <div className="flex items-center gap-0.5">
                                        <FiMoon size={10} className="fill-current" />
                                        <span className="font-bold text-xs">{log.sleep}h</span>
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        <FiStar size={10} className="fill-current" />
                                        <span className="font-bold text-xs">{log.rating}</span>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              !isUpcoming && (
                                <div className="flex flex-col justify-end h-10 opacity-50">
                                   <span className="text-[10px] font-bold leading-tight">
                                       {isMissed ? 'Missed' : 'Log Now'}
                                   </span>
                                   {isMissed && <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />}
                                </div>
                              )
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };

  const renderMonthCalendar = () => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = getDay(start); // 0 = Sunday

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-7 mb-2">
                 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                     <div key={i} className="text-center text-xs font-bold text-gray-300">
                        {d}
                     </div>
                 ))}
             </div>
             <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                {[...Array(startDayOfWeek)].map((_, i) => <div key={`empty-${i}`} />)}
                
                {days.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const hasLog = !!logs[dayStr];
                    const isCurrentDay = isSameDay(day, new Date());
                    
                    return (
                        <button 
                            key={dayStr}
                            onClick={() => handleOpenLog(dayStr)}
                            className="flex flex-col items-center gap-1 relative group"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isCurrentDay 
                                ? 'bg-black text-white shadow-md'
                                : hasLog 
                                    ? 'bg-white text-gray-900 border border-gray-100'
                                    : 'text-gray-400 hover:bg-gray-50'
                            }`}>
                                {format(day, 'd')}
                            </div>
                            {hasLog && (
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute -bottom-1" />
                            )}
                        </button>
                    );
                })}
             </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] pb-24 md:pb-8 pt-6 px-6 relative overflow-hidden font-sans">
      
      {/* Background Illustration & Ambient Color */}
      <div className="absolute top-0 left-0 w-full h-[600px] z-0 pointer-events-none overflow-hidden">
         {/* Warm Sun Glow Top Right */}
         <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-orange-100/80 to-transparent rounded-full blur-3xl"
         />
         
         {/* Soft Blue Sky Top Left */}
         <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-blue-50/80 to-transparent rounded-full blur-3xl"
         />
         
         {/* Abstract geometric clouds */}
         <motion.div 
            animate={{ y: [0, -15, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-10 w-32 h-32 bg-yellow-100/50 rounded-full blur-2xl"
         />
         
         <motion.div 
            animate={{ x: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-40 left-10 w-48 h-48 bg-blue-100/40 rounded-full blur-3xl"
         />
         
         {/* SVG Clouds for Illustration feel */}
         <motion.svg 
            animate={{ x: [0, -10, 0], y: [0, 5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] right-[-5%] text-orange-200/30 w-64 h-64" viewBox="0 0 200 200" fill="currentColor"
         >
            <path d="M40,100 Q60,50 100,100 T160,100 T200,100 V150 H0 V100 Z" className="blur-xl" />
         </motion.svg>
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        
        {/* Top Header similar to image */}
        <div className="flex justify-between items-start">
            <button className="p-2 -ml-2 text-gray-800 transition-colors">
                <FiChevronLeft size={24} />
            </button>
            <button className="p-2 rounded-full bg-white shadow-sm text-gray-400">
                <FiBell size={20} />
            </button>
        </div>

        {/* Date & Title */}
        <div className="space-y-1">
             <div className="flex items-center gap-1 text-gray-600 font-bold text-sm">
                <span>Today, {format(new Date(), 'MMMM d')}</span>
                <FiChevronRight className="rotate-90 text-gray-400" size={14} />
                 <FiSun className="text-yellow-400 ml-auto" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 tracking-tight pt-2">How was your day?</h1>
            <p className="text-gray-400 font-medium text-sm">Log your day in under 2 minutes.</p>
        </div>

        {/* Recent Days Scroll */}
        <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                 <h3 className="text-base font-bold text-gray-800">This Week</h3>
            </div>
            {renderRecentDays()}
        </div>

        {/* Action Button Card */}
        <div className="bg-white rounded-[2rem] p-2 shadow-xl shadow-gray-100/50">
             <button 
                className="w-full py-4 bg-gradient-to-r from-blue-300 to-indigo-300 text-white rounded-[1.5rem] font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-lg"
                onClick={() => handleOpenLog(todayStr)}
            >
                {isLoggedToday ? 'Edit Today\'s Entry' : 'Log Today\'s Entry'}
            </button>
        </div>

        {/* Daily Summary Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-100/50 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-800">{format(new Date(), 'MMMM d')}</h3>
                <div className="flex items-center gap-1 text-gray-400 text-xs font-bold cursor-pointer hover:text-black transition-colors">
                    Today <FiChevronRight />
                </div>
            </div>

            <div className="space-y-6">
                {/* Mood */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <FiSmile size={20} />
                        </div>
                        <span className="font-bold text-gray-700">Mood</span>
                    </div>

                    {isLoggedToday && todayLog?.mood !== undefined ? (
                         <div className="flex flex-col items-end">
                            <span className="text-xl">{['🙂', '🤩', '🥰', '😐', '😫', '😴', '😠', '😢'][todayLog.mood]}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{['Happy', 'Fantastic', 'Romantic', 'Normal', 'Stressed', 'Tired', 'Angry', 'Sad'][todayLog.mood]}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400 font-medium text-sm">Not logged</span>
                    )}
                </div>

                {/* Rating */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-400">
                            <FiStar size={20} />
                        </div>
                        <span className="font-bold text-gray-700">Rating</span>
                    </div>
                     <span className="font-bold text-gray-900">
                        {isLoggedToday && todayLog?.rating 
                            ? <span className="text-orange-400 font-black text-lg">{todayLog.rating}</span>
                            : <span className="text-gray-300 font-medium text-xl">—</span>
                        }
                    </span>
                </div>

                {/* Sleep */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                            <FiMoon size={20} />
                        </div>
                        <span className="font-bold text-gray-700">Sleep</span>
                    </div>
                    <span className="font-bold text-gray-600">
                        {isLoggedToday && todayLog?.sleep 
                            ? `${todayLog.sleep} hr` 
                            : <span className="text-gray-300 font-medium text-sm">— hr</span>
                        }
                    </span>
                </div>

                {/* Spend */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <FiDollarSign size={20} />
                        </div>
                        <span className="font-bold text-gray-700">Spend</span>
                    </div>
                     <span className="font-bold text-gray-600">
                        {isLoggedToday && todayLog?.spend 
                            ? `₹ ${todayLog.spend}` 
                            : <span className="text-gray-300 font-medium text-sm">--</span>
                        }
                    </span>
                </div>

                {/* Habits */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400">
                            <FiCheck size={20} />
                        </div>
                        <span className="font-bold text-gray-700">Habits</span>
                    </div>
                     <span className="font-bold text-gray-600 max-w-[50%] text-right truncate">
                        {isLoggedToday && todayLog?.habits?.length > 0
                            ? todayLog.habits.join(', ')
                            : <span className="text-gray-300 font-medium text-sm">--</span>
                        }
                    </span>
                </div>
            </div>
        </div>

      </div>

      <DailyLogWizard 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        initialData={logs[selectedDate]}
        onSave={(newLog) => {
            setLogs(prev => ({
                ...prev,
                [newLog.date]: newLog
            }));
        }}
      />
    </div>
  );
};

export default Dashboard;

