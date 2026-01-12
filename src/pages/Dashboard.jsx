import { useState, useEffect, useRef, useMemo } from 'react';
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
  isFuture,
  differenceInDays,
  getHours
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInstallPrompt } from '../context/InstallContext';
import { 
  FiEdit2,
  FiTrash2, 
  FiPlus, 
  FiZap,
  FiSun,
  FiMoon,
  FiStar,
  FiChevronLeft,
  FiBell,
  FiChevronRight,
  FiCalendar,
  FiHelpCircle
} from 'react-icons/fi';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ConfirmationModal from '../components/common/ConfirmationModal';
import DailyLogWizard from '../components/dashboard/DailyLogWizard';
import LogDetailModal from '../components/dashboard/LogDetailModal';
import CalendarModal from '../components/dashboard/CalendarModal';
import QuickAccessManager from '../components/dashboard/QuickAccessManager';
import QuickToolModal from '../components/dashboard/QuickToolModal';
import AppGuide from '../components/dashboard/AppGuide';
import NotificationPanel from '../components/dashboard/NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MOOD_COLORS = ['#fbbf24', '#facc15', '#ec4899', '#9ca3af', '#60a5fa', '#818cf8', '#ef4444', '#3b82f6']; // Approximate colors for moods

const DEFAULT_QUICK_LINKS = [
    { id: 'tool-important-dates', title: 'Important Dates', emoji: '🎂', subtitle: 'Birthdays & Events', type: 'important-dates', color: 'pink' },
    { id: 'tool-bucket', title: '2026 Goals', emoji: '🌍', subtitle: 'Dream big', type: 'bucket-list-2026', color: 'orange' },
    { id: 'log-pause', title: 'Pause & Reflect', emoji: '🌱', subtitle: 'Gratitude check', type: 'log', color: 'rose' },
    { id: 'tool-todo', title: 'Daily Tasks', emoji: '📝', subtitle: 'Get things done', type: 'todo-list', color: 'indigo' },
];

const Dashboard = () => {

  const { currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Notifications
  const { unreadCount, notifications, markAsRead, markAllRead, deleteNotification, clearAllNotifications, permissionStatus, requestPermission } = useNotifications(currentUser);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Install Prompt Logic
  const navigate = useNavigate();
  const { isInstalled } = useInstallPrompt();

  useEffect(() => {
    // If not in standalone mode (not installed PWA), prompt install
    if (isInstalled === false) {
         const hasSeenPrompt = sessionStorage.getItem('install_prompt_seen');
         if (!hasSeenPrompt) {
             const timer = setTimeout(() => {
                 navigate('/install-app');
                 sessionStorage.setItem('install_prompt_seen', 'true');
             }, 3000); // 3s delay
             return () => clearTimeout(timer);
         }
    }
  }, [isInstalled, navigate]);

  // Time of Day Logic for Hero Section
  const [timeOfDay, setTimeOfDay] = useState('morning');
  
  // Quick Links State
  const [quickLinks, setQuickLinks] = useState(DEFAULT_QUICK_LINKS);
  const [customTools, setCustomTools] = useState([]); // User defined tools
  const [isQuickManagerOpen, setIsQuickManagerOpen] = useState(false);
  const [isAppGuideOpen, setIsAppGuideOpen] = useState(false);
  const [activeQuickTool, setActiveQuickTool] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {},
    type: 'danger'
  });

  useEffect(() => {
    const savedLinks = localStorage.getItem('userQuickLinks');
    if (savedLinks) {
        try {
            setQuickLinks(JSON.parse(savedLinks));
        } catch (e) {
            console.error(e);
        }
    }
    
    const savedCustom = localStorage.getItem('userCustomTools');
    if (savedCustom) {
        try {
            setCustomTools(JSON.parse(savedCustom));
        } catch(e) {}
    }
  }, []);

  const handleUpdateQuickLinks = (newLinks) => {
      setQuickLinks(newLinks);
      localStorage.setItem('userQuickLinks', JSON.stringify(newLinks));
  };

  const handleCreateCustomTool = (newTool) => {
      const updatedCustom = [...customTools, newTool];
      setCustomTools(updatedCustom);
      localStorage.setItem('userCustomTools', JSON.stringify(updatedCustom));
      
      // Auto-add to quick links
      handleUpdateQuickLinks([...quickLinks, newTool]);
  };


  const handleQuickLinkClick = (link) => {
      if (link.type === 'log') {
          handleOpenLog(todayStr); // Or specific step if supported later
      } else if (link.type === 'important-dates') {
          navigate('/important-dates');
      } else {
          setActiveQuickTool(link);
      }
  };
  
  useEffect(() => {
      const updateTime = () => {
          const hour = new Date().getHours();
          if (hour >= 5 && hour < 12) setTimeOfDay('morning');
          else if (hour >= 12 && hour < 17) setTimeOfDay('noon');
          else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
          else setTimeOfDay('night');
      };
      updateTime();
      const timer = setInterval(updateTime, 60000 * 10);
      return () => clearInterval(timer);
  }, []);

  // State
  const [logs, setLogs] = useState({}); // Map of dateString -> logData
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [importantDates, setImportantDates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [dismissedCards, setDismissedCards] = useState([]);

  useEffect(() => {
    setDismissedCards([]);
  }, [selectedDate]);

  // Weekly Stats Logic
  const weeklyStats = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
        start: start,
        end: addDays(start, 6)
    });

    return weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return {
            date: dateStr,
            dayName: format(day, 'EEE'),
            hasLog: !!logs[dateStr],
            mood: logs[dateStr]?.mood,
            spend: logs[dateStr]?.spend
        };
    });
  }, [logs]);

  // Scroll ref for date strip
  const scrollRef = useRef(null);

  // Fetch Logs (Yearly for stats)
  useEffect(() => {
    const fetchLogs = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const startStr = format(subDays(new Date(), 365), 'yyyy-MM-dd'); // Fetch last 365 days for streaks
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

        // Fetch Important Dates
        try {
            const datesRef = doc(db, 'users', currentUser.uid, 'tools', 'important_dates');
            const datesSnap = await getDoc(datesRef);
            if (datesSnap.exists()) {
                setImportantDates(datesSnap.data().items || []);
            }
        } catch (e) {
            console.error("Error fetching dates", e);
        }

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

  const handleOpenLog = (dateStr) => {
      setSelectedDate(dateStr);
      if (logs[dateStr]) {
          setIsLogDetailOpen(true);
      } else {
          setIsModalOpen(true);
      }
  };
  
  // Handle Deep Link / Action param
  useEffect(() => {
      if (searchParams.get('action') === 'log') {
          handleOpenLog(todayStr);
          // Clear param
          setSearchParams(prev => {
              const newParams = new URLSearchParams(prev);
              newParams.delete('action');
              return newParams;
          }, { replace: true });
      }
  }, [searchParams, setSearchParams, todayStr]);

  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    let current = today;
    
    // If today is logged, count it
    if (logs[format(today, 'yyyy-MM-dd')]) {
        // Continue checking backwards
    } else {
        // If today not logged, start checking from yesterday
        current = subDays(today, 1);
    }

    while (true) {
        const dateStr = format(current, 'yyyy-MM-dd');
        if (logs[dateStr]) {
            streak++;
            current = subDays(current, 1);
        } else {
            break;
        }
        if (differenceInDays(today, current) > 365) break;
    }
    return streak;
  };

  const performDeleteLog = async (dateStr) => {
    try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'logs', dateStr));
        setLogs(prev => {
            const newLogs = {...prev};
            delete newLogs[dateStr];
            return newLogs;
        });
        toast.success("Log deleted.");
    } catch(err) {
        console.error(err);
        toast.error("Failed to delete.");
    }
  };

  const handleDeleteLog = (dateStr) => {
    setConfirmModal({
        isOpen: true,
        title: 'Delete Log?',
        message: 'Are you sure you want to delete this daily log? This action cannot be undone.',
        onConfirm: () => performDeleteLog(dateStr),
        type: 'danger'
    });
  };

  const renderDateStrip = () => {
       const today = new Date();
       
       // Display: Mon-Sun of current week
       const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
       const end = endOfWeek(today, { weekStartsOn: 1 });
       const days = eachDayOfInterval({ start, end });

      return (
          <div className="mb-6 mt-4 relative z-10 hidden">
          </div>
      );
  };

  const renderDateStrip_REAL = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
        <div className="mb-6 mt-4 relative z-10">
            <div className="flex justify-between items-end mb-4 px-1">
               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">This Week</h3>
               <button 
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all shadow-sm backdrop-blur-md bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
               >
                  <FiCalendar size={14} />
                  View Month
               </button>
            </div>

            <div className="flex justify-between items-center">
                {days.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isDayToday = isSameDay(date, today);
                    const isLogged = logs[dateStr];
                    const isFutureDay = isFuture(date);
                    const isMissed = !isLogged && !isFutureDay && !isDayToday;

                    let bubbleClass = "w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 relative ";
                    let labelClass = "text-sm font-medium mb-3 text-gray-400 dark:text-gray-500";

                    if (isDayToday) {
                        bubbleClass += "bg-amber-400 text-amber-950 shadow-amber-200/50 shadow-lg scale-110 z-10";
                        labelClass = "text-sm font-bold mb-3 text-amber-600 dark:text-amber-400";
                    } else if (isLogged) {
                        bubbleClass += "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 ring-2 ring-green-200 dark:ring-green-900";
                    } else if (isMissed) {
                         bubbleClass += "bg-red-50 text-red-500 dark:bg-red-900/10 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900/30";
                    } else {
                        bubbleClass += "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400 shadow-sm";
                    }

                    return (
                        <button 
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className="flex flex-col items-center group relative"
                        >
                            <span className={labelClass}>
                                {format(date, 'EEE')}
                            </span>
                            <div className={`${bubbleClass} ${selectedDate === dateStr ? 'scale-105 ring-2 ring-amber-300 ring-offset-2 dark:ring-offset-gray-900' : ''}`}>
                                {format(date, 'd')}
                                
                                {isLogged && (
                                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
                                )}
                                {isMissed && !isDayToday && selectedDate !== dateStr && (
                                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
  };

  const renderGreetings = () => {
      const name = currentUser?.fullName || currentUser?.displayName || 'Friend';
      const streak = calculateStreak();

      return (
          <div className="flex justify-between items-start mb-8 pt-6 relative z-10">
              <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                      Hi, {name}
                  </h1>
                  <p className="text-sm font-medium mt-1 text-gray-500 dark:text-gray-400 transition-colors">
                      {format(new Date(), 'EEEE, MMM d')}
                  </p>
                  
                  {streak > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 w-fit px-3 py-1.5 rounded-full shadow-sm bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                          <FiZap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                              {streak} Day Streak
                          </span>
                      </div>
                  )}
              </div>

              <div className="flex items-center gap-1 backdrop-blur-md p-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 shadow-sm transition-all hover:scale-105 duration-300">
                   <button 
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? <FiMoon size={18} /> : <FiSun size={18} />}
                    </button>

                   <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 opacity-50"></div>

                   <button 
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Notifications"
                    >
                        <FiBell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
                        )}
                    </button>
                    
                   <button 
                        onClick={() => setIsAppGuideOpen(true)}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Help Guide"
                    >
                        <FiHelpCircle size={18} />
                   </button>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F6F5F2] dark:bg-[#0a0a0a] font-sans transition-colors duration-500">
      
      {/* Ambient Background Animation - Time Based */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-1000 ease-in-out">
           {/* Base Gradient Layer */}
           <div className={`absolute inset-0 transition-colors duration-1000 ${
               timeOfDay === 'morning' ? 'bg-orange-50/50 dark:bg-[#0f0c08]' :
               timeOfDay === 'noon' ? 'bg-sky-50/50 dark:bg-[#080c14]' :
               timeOfDay === 'evening' ? 'bg-indigo-50/50 dark:bg-[#0a0612]' :
               'bg-slate-50/50 dark:bg-[#050505]'
           }`} />

           {/* Animated Blobs */}
           <div className={`absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-blob transition-colors duration-1000 ${
               timeOfDay === 'morning' ? 'bg-amber-200/40 dark:bg-amber-800/20' :
               timeOfDay === 'noon' ? 'bg-sky-200/40 dark:bg-sky-800/20' :
               timeOfDay === 'evening' ? 'bg-purple-300/40 dark:bg-purple-800/20' :
               'bg-indigo-900/20 dark:bg-indigo-900/20'
           }`} />
           
           <div className={`absolute top-20 -right-40 w-[500px] h-[500px] rounded-full mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-blob animation-delay-2000 transition-colors duration-1000 ${
               timeOfDay === 'morning' ? 'bg-rose-200/40 dark:bg-rose-800/20' :
               timeOfDay === 'noon' ? 'bg-cyan-200/40 dark:bg-cyan-800/20' :
               timeOfDay === 'evening' ? 'bg-pink-300/40 dark:bg-pink-800/20' :
               'bg-violet-900/20 dark:bg-violet-900/20'
           }`} />
           
           <div className={`absolute -bottom-20 left-1/3 w-[600px] h-[600px] rounded-full mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-blob animation-delay-4000 transition-colors duration-1000 ${
               timeOfDay === 'morning' ? 'bg-yellow-100/40 dark:bg-yellow-800/10' :
               timeOfDay === 'noon' ? 'bg-blue-100/40 dark:bg-blue-800/10' :
               timeOfDay === 'evening' ? 'bg-orange-200/40 dark:bg-orange-800/10' :
               'bg-slate-800/20 dark:bg-slate-800/10'
           }`} />
      </div>

      <div className="relative z-10 pb-32 pt-12 px-6">
        {/* Dynamic Hero Visuals based on Time of Day */}
        <div className="absolute top-0 left-0 right-0 h-[600px] z-[-1] overflow-hidden pointer-events-none select-none">
             
             {/* Morning: Sun & Rays */}
             {timeOfDay === 'morning' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
                    {/* Sun Position */}
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="absolute top-20 right-[10%] w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full blur-[2px] shadow-[0_0_60px_rgba(253,224,71,0.6)]" 
                    />
                    {/* Sun glow */}
                    <div className="absolute top-10 right-[5%] w-[300px] h-[300px] bg-amber-200/20 rounded-full blur-[60px]" />
                    
                    {/* Subtle Rays */}
                    <div className="absolute top-[30%] right-[20%] w-20 h-1 bg-gradient-to-r from-transparent via-yellow-100/30 to-transparent blur-[1px] -rotate-12" />
                    <div className="absolute top-[35%] right-[15%] w-32 h-1 bg-gradient-to-r from-transparent via-yellow-100/20 to-transparent blur-[1px] -rotate-12" />
                </motion.div>
             )}

             {/* Noon: Bright Sun High Up */}
             {timeOfDay === 'noon' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
                    {/* Intense High Sun */}
                     <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="absolute -top-10 right-[20%] w-32 h-32 bg-white rounded-full blur-xl opacity-80 shadow-[0_0_100px_rgba(255,255,255,0.8)]" 
                    />
                    {/* Clouds */}
                    <div className="absolute top-[15%] left-[10%] w-32 h-10 bg-white/40 blur-xl rounded-full animate-pulse duration-[4000ms]" />
                    <div className="absolute top-[25%] right-[30%] w-48 h-12 bg-white/30 blur-xl rounded-full animate-pulse duration-[5000ms]" />
                </motion.div>
             )}

             {/* Evening: Setting Sun & Purple Hues */}
             {timeOfDay === 'evening' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
                    {/* Setting Sun low */}
                    <div className="absolute bottom-[20%] left-[10%] w-40 h-40 bg-gradient-to-t from-orange-500 to-rose-400 rounded-full blur-md opacity-80" />
                    <div className="absolute bottom-0 left-[-10%] w-[600px] h-[400px] bg-gradient-to-tr from-purple-500/30 via-pink-400/20 to-transparent blur-[90px]" />
                    
                    {/* Early stars */}
                    <div className="absolute top-10 right-[20%] w-1 h-1 bg-white/60 blur-[1px] animate-pulse" />
                </motion.div>
             )}

             {/* Night: Moon & Stars */}
             {timeOfDay === 'night' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
                    {/* Moon */}
                    <motion.div 
                        initial={{ rotate: -10, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1.2 }}
                        className="absolute top-16 right-[15%]"
                    >
                         {/* SVG Crescent Moon */}
                         <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                            <path d="M78 52.4C76.25 29.6 56.4 12.25 33.6 14C39.4 6 49.6 1.25 60.25 2.5C79.75 4.75 94 22.25 91.75 41.75C90.5 52.4 84.4 61.25 76.25 66.5C77.75 62 78.4 57.25 78 52.4Z" fill="#F8FAFC" className="dark:fill-slate-100" />
                         </svg>
                    </motion.div>

                    {/* Stars with varying opacity and delays */}
                    <div className="absolute top-[20%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" />
                    <div className="absolute top-[40%] left-[10%] w-0.5 h-0.5 bg-white/50 rounded-full animate-pulse animation-delay-700" />
                    <div className="absolute top-[15%] right-[40%] w-1 h-1 bg-blue-100/80 rounded-full blur-[0.5px] animate-pulse animation-delay-1500" />
                    <div className="absolute top-[5%] right-[10%] w-1.5 h-1.5 bg-white rounded-full blur-[1px] animate-pulse animation-delay-1000" />
                    <div className="absolute top-[30%] right-[20%] w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse" />
                    
                    {/* Nebula glow */}
                    <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-900/30 via-purple-900/10 to-transparent blur-[100px]" />
                </motion.div>
             )}
        </div>

        <div className="max-w-md mx-auto relative">
      
      {/* 1. Header Section */}
      {renderGreetings()}

      {/* 2. Date Strip */}
      {renderDateStrip_REAL()}


      {/* 3. My Journal Section - DYNAMIC STACK */}
      <div className="mt-8">
          <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">My Journal</h2>
          </div>

          <div className="relative w-full h-[320px] md:h-[300px] perspective-1000">
              <AnimatePresence mode='popLayout'>
                  {(() => {
                        const activeLog = logs[selectedDate];
                        let stack = [];
                        
                        const isDayToday = isSameDay(parseISO(selectedDate), new Date());
                        const dayName = format(parseISO(selectedDate), 'EEE');
                        const monthDay = format(parseISO(selectedDate), 'MM-dd');

                        // 1. PROMPT (High Priority - If NOT logged & Today)
                        if (!activeLog && isDayToday) {
                            stack.push({
                                id: 'prompt',
                                type: 'prompt',
                                bg: 'bg-[#FFD55F] dark:bg-amber-600',
                                zIndex: 50
                            });
                        }

                        // 1.5 MISSED (High Priority - If NOT logged & Past)
                        const isFutureDate = isFuture(parseISO(selectedDate));
                        const isMissed = !activeLog && !isDayToday && !isFutureDate;
                        if (isMissed) {
                            stack.push({
                                id: 'missed',
                                type: 'missed',
                                bg: 'bg-red-50 dark:bg-red-900/20',
                                zIndex: 50
                            });
                        }

                        // 1.6 FUTURE (High Priority - If Future)
                        if (isFutureDate) {
                             stack.push({
                                id: 'future',
                                type: 'future',
                                bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                                zIndex: 50
                            });
                        }

                        // 2. IMPORTANT EVENTS (Birthday / Holidays / Weekend)
                        if (importantDates && importantDates.length > 0) {
                            const events = importantDates.filter(d => d.date && format(parseISO(d.date), 'MM-dd') === monthDay);

                            events.forEach((evt, idx) => {
                                // Map Types to Visuals
                                const TYPE_MAP = {
                                    'Birthday': { emoji: '🎂', bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-600 dark:text-pink-400' },
                                    'Anniversary': { emoji: '💍', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400' },
                                    'Meeting': { emoji: '🤝', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400' },
                                    'Remember': { emoji: '🎗️', bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-600 dark:text-indigo-400' },
                                    'Design': { emoji: '🎨', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400' },
                                    'Custom': { emoji: '✨', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400' }, 
                                };

                                const style = TYPE_MAP[evt.type] || TYPE_MAP['Custom'];

                                stack.push({
                                    id: `event-${evt.id || idx}`,
                                    type: 'event',
                                    title: `${evt.text} ${style.emoji}`,
                                    desc: evt.description || 'Don\'t forget for this special day!',
                                    bg: style.bg,
                                    accent: style.text,
                                    zIndex: 60 + idx // Higher priority than prompt(50)
                                });
                            });
                        }

                        // 3. LOGGED STATS (If Logged)
                        if (activeLog) {
                            stack.push({
                                id: 'stats',
                                type: 'stats',
                                data: activeLog,
                                zIndex: 20
                            });
                        }

                         // 4. SHOPPING / TASKS
                        if (activeLog?.shopping && activeLog?.shoppingData?.item) {
                            stack.push({
                                id: 'shopping',
                                type: 'shopping',
                                data: activeLog.shoppingData,
                                zIndex: 10
                            });
                        }

                        // 5. QUICK NOTE (Fallback or if note exists)
                        if (activeLog?.shortNote || (!activeLog && !isDayToday)) {
                             stack.push({
                                id: 'note',
                                type: 'note',
                                text: activeLog?.shortNote || "No logs for this day.",
                                zIndex: 5
                            });
                        }


                        // Filter out dismissed
                        stack = stack.filter(c => !dismissedCards.includes(c.id));

                        // Sort by Priority (Highest Z-Index First)
                        stack.sort((a, b) => b.zIndex - a.zIndex);

                        if (stack.length === 0) {
                            // Empty State
                             return (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700"
                                >
                                    <span className="text-4xl mb-2">🍃</span>
                                    <p className="text-gray-400 font-medium">All caught up!</p>
                                    <button onClick={() => setDismissedCards([])} className="text-xs text-indigo-500 font-bold mt-4 hover:underline">Reset Cards</button>
                                </motion.div>
                             )
                        }

                        return stack.map((card, index) => {
                            const isTop = index === 0;
                            // Visual Stack Effect
                            const scale = 1 - (index * 0.05); // shrinking down
                            const translateY = index * 12; // moving down
                            const rotate = index === 0 ? 0 : (index % 2 === 0 ? 3 : -3); // slight messy rotation for depth
                            const zIndex = card.zIndex || (50 - index);
                            
                            const opacity = 1 - (index * 0.15); // fading out at back

                            const dragProps = (isTop) ? {
                                drag: "x",
                                dragConstraints: { left: 0, right: 0 },
                                dragElastic: 0.1, // Feeling of resistance
                                onDragEnd: (e, { offset, velocity }) => {
                                    if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
                                        setDismissedCards(prev => [...prev, card.id]);
                                    }
                                }
                            } : {};

                            // Shared card styles
                            const baseStyle = `absolute inset-x-0 h-full rounded-[2.5rem] shadow-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-2xl`;
                            
                            // Render Content Based on Type
                            let content;
                            
                            if (card.type === 'prompt') {
                                 content = (
                                    <div 
                                        onClick={(e) => { 
                                            // Handle main card click
                                            setIsModalOpen(true); 
                                        }}
                                        className={`${card.bg} ${baseStyle} p-8 text-amber-900 dark:text-amber-50 group`}
                                    >
                                         <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
                                            <div>
                                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                                                     {timeOfDay === 'morning' ? "Let's start your day" : "How is your day?"}
                                                </h3>
                                                <p className="text-gray-800/80 dark:text-gray-100/90 font-bold text-lg max-w-[90%] leading-tight mb-1">
                                                     {timeOfDay === 'morning' ? "Begin with mindful morning reflections." : "Capture your moments, habits & mood."}
                                                </p>
                                                {timeOfDay !== 'morning' && (
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 opacity-90">
                                                        Enter your today journal
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 pointer-events-auto">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-black/10 dark:bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-black/20 dark:hover:bg-white/30 transition-colors"
                                                >
                                                    Tap to Log
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reference Graphic: Cute Sun */}
                                        <div className="absolute -bottom-10 -right-10 transform rotate-12 transition-transform duration-700 group-hover:rotate-45">
                                            <div className="relative w-48 h-48 bg-orange-400 rounded-full border-4 border-orange-300 flex items-center justify-center shadow-inner">
                                                <div className="w-32 h-32 bg-orange-300/50 rounded-full blur-md absolute top-4 left-4"></div>
                                                {/* Face */}
                                                <div className="relative z-10 flex flex-col items-center mt-4">
                                                    <div className="flex gap-4 mb-2">
                                                        <div className="w-3 h-3 bg-gray-900 rounded-full animate-bounce"></div>
                                                        <div className="w-3 h-3 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    </div>
                                                    <div className="w-6 h-3 border-b-4 border-gray-900 rounded-full"></div>
                                                    <div className="w-4 h-2 bg-pink-400/60 rounded-full blur-sm absolute top-4 -right-2"></div>
                                                    <div className="w-4 h-2 bg-pink-400/60 rounded-full blur-sm absolute top-4 -left-2"></div>
                                                </div>
                                                {/* Rays */}
                                                {[...Array(8)].map((_, i) => (
                                                    <div key={i} className="absolute w-4 h-12 bg-orange-400 rounded-full top-1/2 left-1/2 origin-bottom -translate-x-1/2 -translate-y-[120%]" style={{ transform: `translate(-50%, 0) rotate(${i * 45}deg) translateY(-80px)` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                 );
                            } else if (card.type === 'missed') {
                                content = (
                                   <div 
                                        onClick={(e) => { 
                                            // Make whole card clickable
                                            setIsModalOpen(true); 
                                        }}
                                        className={`${card.bg} ${baseStyle} p-8 text-red-900 dark:text-red-50 overflow-hidden cursor-pointer group`}
                                   >
                                        <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
                                           <div>
                                               <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                                                    You missed a log
                                               </h3>
                                               <p className="text-gray-800/80 dark:text-gray-100/90 font-medium text-lg max-w-[80%]">
                                                    Remember the moment and add it here...
                                               </p>
                                           </div>
                                           
                                           <div className="flex items-center gap-2 pointer-events-auto">
                                               <button 
                                                   onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                                   className="px-6 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-full text-sm font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all flex items-center gap-2"
                                               >
                                                   <FiPlus size={16} />
                                                   Add Log
                                               </button>
                                           </div>
                                       </div>

                                       {/* Sad Sun Graphic */}
                                       <div className="absolute -bottom-12 -right-12 transform rotate-12 opacity-90 grayscale-[0.2] group-hover:rotate-0 transition-transform duration-500">
                                           <div className="relative w-48 h-48 bg-red-300 rounded-full border-4 border-red-200 flex items-center justify-center shadow-inner">
                                               <div className="w-32 h-32 bg-red-200/50 rounded-full blur-md absolute top-4 left-4"></div>
                                               {/* Face */}
                                               <div className="relative z-10 flex flex-col items-center mt-6">
                                                   <div className="flex gap-6 mb-3">
                                                       {/* Eyes */}
                                                       <div className="w-3 h-1 bg-red-900 rounded-full transform rotate-12"></div>
                                                       <div className="w-3 h-1 bg-red-900 rounded-full transform -rotate-12"></div>
                                                   </div>
                                                   {/* Mouth inverted */}
                                                   <div className="w-5 h-2 border-t-4 border-red-900 rounded-full"></div>
                                                   
                                                   {/* Tear */}
                                                   <motion.div 
                                                       animate={{ y: [0, 20], opacity: [1, 0] }}
                                                       transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                                       className="absolute top-6 -right-2 w-2 h-3 bg-blue-300 rounded-full"
                                                   />
                                               </div>
                                               {/* Rays */}
                                               {[...Array(8)].map((_, i) => (
                                                   <div key={i} className="absolute w-3 h-8 bg-red-300 rounded-full top-1/2 left-1/2 origin-bottom -translate-x-1/2 -translate-y-[120%]" style={{ transform: `translate(-50%, 0) rotate(${i * 45}deg) translateY(-80px)` }} />
                                               ))}
                                           </div>
                                       </div>
                                   </div>
                                );
                            } else if (card.type === 'future') {
                                 content = (
                                   <div className={`${card.bg} ${baseStyle} p-8 text-indigo-900 dark:text-indigo-50 overflow-hidden`}>
                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                           <div>
                                               <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                                                    The Future Awaits
                                               </h3>
                                               <p className="text-gray-800/80 dark:text-gray-100/90 font-medium text-lg max-w-[80%]">
                                                    "The best way to predict the future is to create it."
                                               </p>
                                           </div>
                                           
                                           <div className="flex items-center gap-2">
                                               <button 
                                                   onClick={() => setSelectedDate(todayStr)}
                                                   className="px-6 py-3 bg-white/50 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md text-indigo-600 dark:text-indigo-300 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                                               >
                                                   <FiChevronLeft size={16} />
                                                   Back to Today
                                               </button>
                                           </div>
                                       </div>

                                       {/* Future Graphic - Crystal Ball / Stars */}
                                       <div className="absolute -bottom-10 -right-10 transform -rotate-12 opacity-80">
                                           <div className="relative w-56 h-56 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
                                               <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                                               {/* Stars inside */}
                                                <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
                                                <div className="absolute bottom-12 right-16 w-3 h-3 bg-white rounded-full blur-[1px] animate-pulse"></div>
                                                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full"></div>
                                                
                                                {/* Mist */}
                                                <motion.div 
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                    className="w-full h-full absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent rounded-full"
                                                />
                                           </div>
                                       </div>
                                       {/* Floating Stars */}
                                       <div className="absolute top-10 right-10 text-indigo-400 text-2xl animate-bounce">✨</div>
                                       <div className="absolute bottom-32 left-8 text-purple-400 text-xl animate-pulse">🌙</div>
                                   </div>
                                );
                            } else if (card.type === 'event') {
                                content = (
                                    <div className={`${card.bg} ${baseStyle} p-8 flex flex-col justify-center text-gray-800 dark:text-gray-100`}>
                                         <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
                                            {card.icon || <FiStar size={100}/>}
                                         </div>
                                         <div className="relative z-10">
                                             <div className={`p-3 rounded-2xl w-fit mb-4 bg-white dark:bg-gray-800 shadow-sm ${card.accent}`}>
                                                {card.icon || <FiStar size={24} />}
                                             </div>
                                             <h3 className="text-3xl font-black mb-2">{card.title}</h3>
                                             <p className="text-lg opacity-80 font-medium">{card.desc}</p>
                                         </div>
                                    </div>
                                );
                            } else if (card.type === 'stats') {
                                // Updated Emoji List to fix happy emoji rendering
                                const MOOD_EMOJIS = ['😊', '🤩', '🥰', '😌', '😓', '😴', '😡', '😢'];
                                const MOOD_NAMES = ['Happy', 'Fantastic', 'Romantic', 'Normal', 'Stress', 'Tired', 'Angry', 'Sad'];
                                
                                content = (
                                     <div className={`bg-gradient-to-br from-[#FFFBF0] to-[#FFF0E0] dark:from-gray-800 dark:to-gray-900 border border-orange-100 dark:border-gray-700 ${baseStyle} flex flex-col`}>
                                        
                                        {/* Header */}
                                        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 tracking-tight">Daily Insight</h3>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                                                >
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLog(card.data.date); }}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-900/10 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-red-500 dark:text-red-400 transition-all"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Highlight Section */}
                                        <div className="flex-1 px-6 flex flex-col gap-4">
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                                className="relative group cursor-pointer py-1"
                                            >
                                                {card.data.story || card.data.longNote || card.data.note ? (
                                                    <p className="text-xl md:text-2xl font-serif italic text-gray-700 dark:text-gray-200 leading-relaxed line-clamp-3">
                                                        "{card.data.story || card.data.longNote || card.data.note}"
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic text-lg">No highlight added yet...</p>
                                                )}
                                                
                                                {(!card.data.mood || !card.data.story) && (
                                                     <div className="inline-flex items-center gap-2 mt-3 text-orange-500 font-bold text-[10px] uppercase tracking-widest animate-pulse border border-orange-200 dark:border-orange-800/50 px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-900/10">
                                                         <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                         Complete Log
                                                     </div>
                                                )}
                                            </div>

                                            {/* Pills Row */}
                                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear">
                                                {/* Mood */}
                                                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 pl-3 pr-4 py-2.5 rounded-xl flex-shrink-0">
                                                    <span className="text-2xl leading-none">{card.data.mood !== undefined ? MOOD_EMOJIS[card.data.mood] : '😶'}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold uppercase text-blue-400 dark:text-blue-300 tracking-wider">Mood</span>
                                                        <span className="text-xs font-bold text-blue-900 dark:text-blue-100">
                                                            {card.data.mood !== undefined ? MOOD_NAMES[card.data.mood] : '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Rating */}
                                                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 rounded-xl flex-shrink-0">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                             <div key={i} className={`w-1 h-4 rounded-full ${i < (card.data.rating || 0) ? "bg-amber-400" : "bg-amber-200 dark:bg-amber-800/50"}`} />
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold uppercase text-amber-500 tracking-wider">Rate</span>
                                                        <span className="text-xs font-bold text-amber-900 dark:text-amber-100">{card.data.rating || 0}/5</span>
                                                    </div>
                                                </div>

                                                {/* Sleep */}
                                                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2.5 rounded-xl flex-shrink-0">
                                                    <FiMoon className="text-indigo-500" size={16} />
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-wider">Sleep</span>
                                                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-100">{card.data.sleep || 0}h</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Spend */}
                                        <div className="bg-gray-50 dark:bg-black/20 px-6 py-4 mt-auto">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Weekly Spend</span>
                                                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                                    <span className="text-xs mr-0.5">₹</span>
                                                    {weeklyStats.reduce((acc, day) => {
                                                        const val = parseFloat(day.spend);
                                                        return acc + (isNaN(val) ? 0 : val);
                                                    }, 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center h-4">
    {weeklyStats.map((day) => {
    const spendVal = parseFloat(day.spend) || 0;
    const isActive = spendVal > 0;
    const isTodayDate = isSameDay(parseISO(day.date), new Date());

    return (
        <div key={day.date} className="group relative flex-1 flex justify-center items-center h-full cursor-default">
            {isActive && (
                <div className="absolute -top-6 bg-gray-900 text-white text-[9px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-mono">
                    ₹{spendVal}
                </div>
            )}
            <div className={`
                rounded-full transition-all duration-300
                ${isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-none w-2 h-2' : 'bg-gray-200 dark:bg-gray-700 w-1.5 h-1.5'}
                ${isTodayDate && !isActive ? 'ring-2 ring-gray-300 dark:ring-gray-600' : ''}
            `} />
        </div>
    )
    })}
</div>
                                        </div>
                                     </div>
                                );
                            } else if (card.type === 'shopping') {
                                content = (
                                    <div className={`bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 ${baseStyle} p-8 flex flex-col justify-center`}>
                                         <span className="text-rose-500 font-bold tracking-widest uppercase text-xs mb-2">Reminder</span>
                                         <h3 className="text-2xl font-bold text-gray-800 dark:text-rose-100 mb-4 flex items-center gap-3">
                                             <span className="line-through decoration-rose-400 decoration-2">{card.data.item}</span>
                                         </h3>
                                         <div className="w-full h-1 border-t-2 border-dashed border-rose-200 dark:border-rose-800/50"></div>
                                    </div>
                                )
                            } else {
                                // Default Note
                                content = (
                                    <div className={`bg-white dark:bg-gray-800 border-l-4 border-gray-300 dark:border-gray-600 ${baseStyle} p-8 flex flex-col justify-center`}>
                                        <h3 className="text-gray-400 font-bold uppercase text-xs mb-2">Quick Note</h3>
                                        <p className="text-xl font-medium text-gray-700 dark:text-gray-200">
                                            {card.text}
                                        </p>
                                    </div>
                                )
                            }

                            return (
                                <motion.div
                                    key={card.id}
                                    layoutId={card.id}
                                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                    animate={{ opacity, scale, y: translateY, rotate: rotate, zIndex, x: 0 }}
                                    exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    {...dragProps}
                                    style={{ touchAction: 'none', transformOrigin: "bottom center" }}
                                    className="absolute inset-x-0 h-full"
                                >
                                    {content}
                                    
                                    {/* Stack Indicator (Only for top card) */}
                                    {isTop && stack.length > 1 && (
                                        <motion.div 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }}
                                            className="absolute bottom-4 left-0 right-0 flex justify-center gap-1"
                                        >
                                            {[...Array(Math.min(stack.length, 3))].map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-black dark:bg-white' : 'bg-black/20 dark:bg-white/20'}`} />
                                            ))}
                                            {stack.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20 text-[6px] flex items-center justify-center">+</div>}
                                        </motion.div>
                                    )}
                                </motion.div>
                            );

                        });
                  })()}
              </AnimatePresence>
          </div>
      </div>

       {/* 4. Quick Journal */}
       <div className="mt-8">
          <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Quick Daily</h2>
              <button 
                onClick={() => setIsQuickManagerOpen(true)}
                className="text-sm text-indigo-500 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full"
              >
                  Customize
              </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
               {quickLinks.map((link) => {
                   // Dynamic Colors
                   const colors = {
                       rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-100',
                       indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-100',
                       emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-100',
                       orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-100',
                       blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-100',
                       yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-100',
                       pink: 'bg-pink-100 dark:bg-pink-900/50 text-pink-100',
                   };
                   const bgClass = colors[link.color] || colors.rose;
                   // const textClass = `text-${link.color}-500`; // Simplify text color for badge

                   return (
                    <motion.div 
                        key={link.id}
                        layoutId={link.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickLinkClick(link)}
                        className={`min-w-[170px] h-48 ${bgClass} rounded-[2rem] p-5 flex flex-col justify-between flex-shrink-0 snap-center cursor-pointer relative overflow-hidden group`}
                    >   
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{link.emoji}</span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 leading-tight mb-1">
                                {link.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                                {link.subtitle}
                            </p>
                        </div>
                        
                        <div className="relative z-10 flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-400 uppercase tracking-wider">Quick Access</span>
                            <div className={`w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                <FiChevronRight size={14} className="text-gray-900 dark:text-white" />
                            </div>
                        </div>

                        {/* Decor */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    </motion.div>
                   );
               })}

               {/* Add New Placeholer */}
               <motion.button
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setIsQuickManagerOpen(true)}
                 className="min-w-[80px] h-48 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 snap-center"
               >
                   <FiPlus size={24} />
                   <span className="text-xs font-bold">Add</span>
               </motion.button>
          </div>
       </div>

      
      {/* Modals */}
      <QuickAccessManager 
        isOpen={isQuickManagerOpen}
        onClose={() => setIsQuickManagerOpen(false)}
        currentItems={quickLinks}
        onUpdate={handleUpdateQuickLinks}
        customTools={customTools}
        onCreateCustomTool={handleCreateCustomTool}
      />

      {activeQuickTool && (
        <QuickToolModal
            isOpen={!!activeQuickTool}
            onClose={() => setActiveQuickTool(null)}
            tool={activeQuickTool}
            onUpdate={async () => {
                // Refresh Important Dates if that was the tool used
                 if (activeQuickTool.type === 'important-dates') {
                    try {
                        const datesRef = doc(db, 'users', currentUser.uid, 'tools', 'important_dates');
                        const datesSnap = await getDoc(datesRef);
                        if (datesSnap.exists()) {
                            setImportantDates(datesSnap.data().items || []);
                        }
                    } catch (e) { console.error(e); }
                }
            }}
        />
      )}
      
      <AppGuide 
           isOpen={isAppGuideOpen}
           onClose={() => setIsAppGuideOpen(false)}
      />

            <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                onDateSelect={handleOpenLog}
                logs={logs}
            />

            <LogDetailModal
                isOpen={isLogDetailOpen}
                onClose={() => setIsLogDetailOpen(false)}
                date={selectedDate}
                data={logs[selectedDate]}
                onEdit={() => {
                        setIsLogDetailOpen(false);
                        setIsModalOpen(true);
                }}
            />

      <AnimatePresence>
        {isModalOpen && (
            <DailyLogWizard 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                date={selectedDate}
                initialData={logs[selectedDate]}
                onSave={(newLog) => {
                    setLogs(prev => ({ ...prev, [newLog.date]: newLog }));
                }}
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationsOpen && (
            <NotificationPanel 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
                notifications={notifications}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
                onClearAll={clearAllNotifications}
                onMarkAllRead={markAllRead}
                permissionStatus={permissionStatus}
                onRequestPermission={requestPermission}
            />
        )}
      </AnimatePresence>

      <ConfirmationModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            type={confirmModal.type}
      />

      </div>
      </div>
    </div>
  );
};

export default Dashboard;
