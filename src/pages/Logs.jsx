import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, isSameDay, subDays, parseISO, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiDollarSign, FiActivity, FiMoon, FiDroplet, FiMonitor, FiFilm, FiBook, FiAlertCircle, FiCheckCircle, FiSearch, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MOODS = ['😭', '😢', '😐', '🙂', '🤩'];

const Logs = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Insights
  const [todayLogged, setTodayLogged] = useState(false);
  const [yesterdayLogged, setYesterdayLogged] = useState(false);
  
  useEffect(() => {
    const fetchLogs = async () => {
      if (!currentUser) return;
      try {
        const logsRef = collection(db, 'users', currentUser.uid, 'logs');
        // Fetch last 50 logs for the feed
        const q = query(logsRef, orderBy('date', 'desc'), limit(50));
        const snap = await getDocs(q);
        
        const fetchedLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLogs(fetchedLogs);
        
        // Insights Logic
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        
        setTodayLogged(fetchedLogs.some(l => l.date === todayStr));
        setYesterdayLogged(fetchedLogs.some(l => l.date === yesterdayStr));
        
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [currentUser]);

  const filteredLogs = logs.filter(log => {
      const searchContent = (log.note || '') + (log.longNote || '') + (log.movieData?.name || '') + (log.bookData?.name || '');
      return searchContent.toLowerCase().includes(filter.toLowerCase());
  });

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
      );
  }

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-[#F6F5F2] text-gray-900'}`}>
      
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">My Journal</h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                    Your journey, day by day.
                </p>
            </div>
            
            {/* Search */}
            <div className={`relative group w-full md:w-64`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiSearch />
                </div>
                <input 
                    type="text" 
                    placeholder="Search memories..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={`block w-full pl-10 pr-4 py-2.5 rounded-xl border font-medium outline-none transition-all
                        ${isDarkMode 
                            ? 'bg-gray-900 border-gray-800 focus:border-indigo-500 text-white placeholder-gray-600' 
                            : 'bg-white border-gray-200 focus:border-indigo-500 text-gray-900 placeholder-gray-400'
                        }
                    `}
                />
            </div>
        </div>

        {/* Insight / Status Section */}
        <div className="grid grid-cols-1 gap-4">
            {/* Today Status */}
            {!todayLogged && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-3xl relative overflow-hidden flex flex-col items-start justify-center gap-4 border-l-8 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500' : 'bg-white border-indigo-500 shadow-xl shadow-indigo-100'}`}
                >
                     <div className="z-10">
                        <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold uppercase tracking-wider text-xs">
                             <FiCalendar /> Daily Status
                        </div>
                        <h3 className="text-xl font-bold mb-1">Log Today's Journey</h3>
                        <p className={`text-sm mb-4 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            You haven't recorded your day yet. Capture your moments now.
                        </p>
                        <Link to="/dashboard?action=log" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-indigo-300 dark:shadow-none">
                            Log Now <FiArrowRight />
                        </Link>
                     </div>
                </motion.div>
            )}

            {/* Missed Yesterday Alert */}
            {!yesterdayLogged && !todayLogged && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl border-l-8 border-orange-500 flex items-center gap-4 ${isDarkMode ? 'bg-orange-900/10' : 'bg-orange-50'}`}
                 >
                     <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-full text-orange-600 dark:text-orange-400">
                         <FiAlertCircle size={24} />
                     </div>
                     <div>
                         <h4 className="font-bold text-orange-700 dark:text-orange-400">Missing Entry</h4>
                         <p className="text-sm text-orange-600/80 dark:text-orange-500/80">You missed yesterday's log. Don't let the memories fade!</p>
                     </div>
                 </motion.div>
            )}
            
            {/* All Good State */}
            {todayLogged && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-3xl flex items-center gap-6 border border-transparent ${isDarkMode ? 'bg-green-900/10 border-green-900/30' : 'bg-green-50 border-green-100'}`}
                 >
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
                          <FiCheckCircle size={32} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-green-800 dark:text-green-300">You're all caught up!</h3>
                          <p className="text-green-600 dark:text-green-500 text-sm mt-1">Great job maintaining your journal today.</p>
                      </div>
                 </motion.div>
            )}
        </div>

        {/* Separator */}
        <div className={`h-px w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

        {/* Logs Feed */}
        <div className="space-y-6">
            {filteredLogs.length === 0 ? (
                <div className="py-20 text-center opacity-50">
                    <p>No logs found.</p>
                </div>
            ) : (
                filteredLogs.map((log, index) => (
                    <LogCard key={log.id} log={log} isDark={isDarkMode} index={index} />
                ))
            )}
        </div>
        
      </div>
    </div>
  );
};

const LogCard = ({ log, isDark, index }) => {
    const isTodayLog = isToday(parseISO(log.date));
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
                rounded-[2rem] p-6 md:p-8 
                ${isDark ? 'bg-[#121212] border border-gray-800' : 'bg-white shadow-xl shadow-gray-100 border border-gray-100'}
                relative overflow-hidden group
            `}
        >
            {/* Date Badge */}
            <div className={`absolute top-0 left-0 px-6 py-2 rounded-br-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2
                ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'}
            `}>
                {format(parseISO(log.date), 'MMMM dd, yyyy')} {isTodayLog && <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-2">TODAY</span>}
            </div>
            
            {/* Header Content */}
            <div className="mt-8 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div className="flex-1">
                    {/* Mood & Title */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-4xl filter drop-shadow-sm hover:scale-110 transition-transform cursor-default" title="Mood">
                            {MOODS[log.mood] || '😐'}
                        </span>
                        {log.note && (
                            <h2 className={`text-xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                "{log.note}"
                            </h2>
                        )}
                    </div>
                </div>

                {/* Mini Stats (Right Side) */}
                <div className={`flex flex-wrap gap-2 text-xs font-bold md:justify-end max-w-full md:max-w-xs
                     ${isDark ? 'text-gray-400' : 'text-gray-500'}
                `}>
                    {log.weather?.map((w, i) => (
                        <span key={i} className={`px-3 py-1.5 rounded-lg border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50' }`}>
                            {w.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Main Content - Long Note */}
            {log.longNote && (
                <div className={`mb-6 p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                    {log.longNote}
                </div>
            )}

            {/* Info Grid (View All Details) */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl mb-6 ${isDark ? 'bg-gray-900/30' : 'bg-slate-50'}`}>
                 <StatItem icon={<FiMoon />} label="Sleep" value={`${log.sleep}h`} isDark={isDark} />
                 <StatItem icon={<FiDollarSign />} label="Spend" value={`₹${log.spend || 0}`} isDark={isDark} />
                 <StatItem icon={<FiDroplet />} label="Water" value={log.water || '-'} isDark={isDark} />
                 <StatItem icon={<FiActivity />} label="Steps" value={log.steps || '-'} isDark={isDark} />
                 <StatItem icon={<FiMonitor />} label="Screen" value={log.screenTime ? `${log.screenTime}h` : '-'} isDark={isDark} />
            </div>

            {/* Activities: Book / Movie / Food */}
            <div className="space-y-3">
                {log.watchedMovie && log.movieData?.name && (
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                            <FiFilm />
                        </div>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Watched <strong className={isDark ? 'text-white' : 'text-black'}>{log.movieData.name}</strong> 
                            {log.movieData.rating > 0 && <span className="text-yellow-500 ml-1">★ {log.movieData.rating}</span>}
                        </span>
                    </div>
                )}
                {log.readBook && log.bookData?.name && (
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                            <FiBook />
                        </div>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Reading <strong className={isDark ? 'text-white' : 'text-black'}>{log.bookData.name}</strong>
                             {log.bookData.genre && <span className="opacity-60 text-xs ml-1">({log.bookData.genre})</span>}
                        </span>
                    </div>
                )}
            </div>

            {/* Habits Tag */}
            {log.habits && log.habits.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                    {log.habits.map(habit => (
                        <span key={habit} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {habit}
                        </span>
                    ))}
                </div>
            )}

        </motion.div>
    );
};

const StatItem = ({ icon, label, value, isDark }) => (
    <div className="flex flex-col items-center justify-center text-center gap-1">
        <div className={`text-lg mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{icon}</div>
        <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{value}</div>
        <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{label}</div>
    </div>
);

export default Logs;
