import { useState, useEffect, useRef } from 'react';
import { 
  format, 
  startOfYear, 
  endOfYear, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval, 
  isSameDay, 
  subDays,
  addDays,
  isToday,
  getDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  isFuture
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
import CalendarModal from '../components/dashboard/CalendarModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  // State
  const [logs, setLogs] = useState({}); // Map of dateString -> logData
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();

  const getTimeIcon = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
          return <FiSun className="text-yellow-400 ml-auto" />;
      }
      return <FiMoon className="text-indigo-400 ml-auto" />;
  };




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
       const scrollRef = useRef(null);

       // Scroll to end on mount
       useEffect(() => {
           if (scrollRef.current) {
               scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
           }
       }, []);

       // Display: Today - 6 days ... Today (7 days total)
       const start = subDays(today, 6);
       const end = today;
       const days = eachDayOfInterval({ start, end });

       // Mood Colors Mapping (0-7)
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
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto custom-scrollbar pb-6 pt-2 px-1 scroll-smooth snap-x">
              {days.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const log = logs[dateStr];
                  const hasLog = !!log;
                  const isCurrentDay = isToday(date);
                  const isUpcoming = isFuture(date);
                  const isMissed = !hasLog && !isUpcoming && !isCurrentDay;
                  
                  // Determine Styles
                  let cardStyle = "";
                  
                  if (isCurrentDay) {
                       if (hasLog) {
                           // Today + Logged: Highlighted Green Indication
                           cardStyle = isDarkMode 
                            ? "bg-emerald-900/40 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105 z-10" 
                            : "bg-emerald-50 text-emerald-950 border-2 border-emerald-500 shadow-lg shadow-emerald-200 scale-105 z-10";
                       } else {
                           // Today + No Log: High Contrast Call-to-Action
                           cardStyle = isDarkMode 
                            ? "bg-white text-black shadow-xl shadow-white/10 ring-2 ring-white scale-105 z-10" 
                            : "bg-black text-white shadow-xl shadow-black/20 ring-2 ring-black scale-105 z-10";
                       }
                  } else if (isUpcoming) {
                      // Upcoming - Ghost & Frozen
                      cardStyle = isDarkMode
                        ? "bg-gray-900/30 border border-gray-800 border-dashed opacity-30 pointer-events-none grayscale"
                        : "bg-white/40 border border-gray-200 border-dashed opacity-30 pointer-events-none grayscale";
                  } else if (hasLog) {
                      // Logged (Past) - Light Green
                      cardStyle = isDarkMode
                        ? "bg-emerald-900/20 text-emerald-300 border border-emerald-800/50"
                        : "bg-emerald-50 text-emerald-900 border border-emerald-200";
                  } else if (isMissed) {
                      // Missed (Past) - Light Red
                      cardStyle = isDarkMode
                         ? "bg-red-900/20 text-red-500 border border-red-800/50"
                         : "bg-red-50 text-red-600 border border-red-200";
                  } else {
                        // Empty Fallback
                        cardStyle = isDarkMode
                        ? "bg-gray-800 text-gray-500 border border-gray-700"
                        : "bg-white text-gray-400 border border-gray-100";
                  }

                  return (
                      <div 
                        key={dateStr}
                        onClick={() => !isUpcoming && handleOpenLog(dateStr)}
                        className={`flex-shrink-0 w-28 p-4 rounded-[1.5rem] border-2 transition-all relative overflow-hidden snap-center ${cardStyle} ${!isUpcoming ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'}`}
                      >
                          <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isCurrentDay ? 'opacity-80' : 'opacity-60'}`}>
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
                                      {log.sleep && (
                                          <div className="flex items-center gap-0.5">
                                            <FiMoon size={10} className="fill-current" />
                                            <span className="font-bold text-xs">{log.sleep}h</span>
                                          </div>
                                      )}
                                      {log.rating && (
                                          <div className="flex items-center gap-0.5">
                                            <FiStar size={10} className="fill-current" />
                                            <span className="font-bold text-xs">{log.rating}</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ) : (
                              !isUpcoming && (
                                <div className="flex flex-col justify-end h-10 opacity-50">
                                   <span className="text-[10px] font-bold leading-tight uppercase tracking-wide">
                                       {isMissed ? 'Missed' : 'Log Now'}
                                   </span>
                                   {isMissed && (
                                       <div className="flex mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                       </div>
                                   )}
                                </div>
                              )
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };



  return (
    <div className={`min-h-screen pb-24 md:pb-8 pt-6 px-6 relative overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-[#FDFBF9] text-gray-900'}`}>
      
      {/* Background Illustration & Ambient Color */}
      <div className="absolute top-0 left-0 w-full h-[600px] z-0 pointer-events-none overflow-hidden">
         {/* Warm Sun Glow Top Right */}
         <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-orange-100/80 to-transparent rounded-full blur-3xl dark:from-orange-900/40"
         />
         
         {/* Soft Blue Sky Top Left */}
         <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-blue-50/80 to-transparent rounded-full blur-3xl dark:from-blue-900/40"
         />
         
         {/* Abstract geometric clouds */}
         <motion.div 
            animate={{ y: [0, -15, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-10 w-32 h-32 bg-yellow-100/50 rounded-full blur-2xl dark:bg-yellow-900/20"
         />
         
         <motion.div 
            animate={{ x: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-40 left-10 w-48 h-48 bg-blue-100/40 rounded-full blur-3xl dark:bg-blue-900/20"
         />
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        
        {/* Top Header similar to image */}
        <div className="flex justify-between items-start">
            <div className="p-2 -ml-2">
                {/* Space holder for removed back button or logo can go here */}
            </div>
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => toast('No new notifications', { icon: '🔔' })}
                    className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                >
                    <FiBell size={20} />
                </button>
                <button 
                    onClick={toggleTheme}
                    className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-white text-gray-900'}`}
                >
                    {isDarkMode ? <FiMoon size={20} /> : <FiSun size={20} />}
                </button>
            </div>
        </div>

        {/* Date & Title */}
        <div className="space-y-1">
             <div className={`flex items-center gap-1 font-bold text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>Today, {format(new Date(), 'MMMM d')}</span>
                 {getTimeIcon()}
            </div>
            
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Hello, {currentUser?.fullName || currentUser?.displayName || 'Traveler'}
            </p>
            
            <h1 className={`text-3xl font-black tracking-tight pt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How was your day?
            </h1>
            <p className="text-gray-400 font-medium text-sm">
                Log your day in under 2 minutes.
            </p>
        </div>

        {/* Recent Days Scroll */}
        <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                 <h3 className={`text-base font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>This Week</h3>
                 <button 
                    onClick={() => setIsCalendarOpen(true)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                        isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                 >
                    <FiCalendar size={12} />
                    View All
                 </button>
            </div>
            {renderRecentDays()}
        </div>

        {/* Action Button Card */}
        <div className={`rounded-[2rem] p-2 shadow-xl ${isDarkMode ? 'bg-gray-800 shadow-none' : 'bg-white shadow-gray-100/50'}`}>
             <button 
                onClick={() => handleOpenLog(todayStr)}
                className={`w-full py-4 rounded-[1.5rem] font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-lg cursor-pointer ${
                    isDarkMode ? 'bg-gray-700 text-white shadow-none' : 'bg-black text-white shadow-gray-200'
                }`}
            >
                <div>
                     <span className="block">Log Today's Entry</span>
                </div>
                <div className={`p-1 rounded-full ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-black'}`}>
                    <FiPlus />
                </div>
            </button>
        </div>

        {/* Daily Summary Card */}
        <div className={`rounded-[2rem] p-6 shadow-xl space-y-5 ${isDarkMode ? 'bg-gray-800 shadow-none' : 'bg-white shadow-gray-100/50'}`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{format(new Date(), 'MMMM d')}</h3>
                <div className="flex items-center gap-1 text-gray-400 text-xs font-bold cursor-pointer hover:text-gray-500 transition-colors">
                    Today
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
      
      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        logs={logs}
        onSelectDate={(date) => {
            // Check if future date? CalendarModal already handles selection logic but maybe prevent future?
            // Existing handleOpenLog handles state.
            // isFuture check is good UX but handleOpenLog handles opening modal directly.
            // Let's just open it.
            handleOpenLog(date);
        }}
      />
    </div>
  );
};

export default Dashboard;

