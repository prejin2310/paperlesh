import { useState, useEffect } from 'react';
import { eachDayOfInterval, format, startOfYear, endOfYear, getDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FiActivity, FiSmile, FiDollarSign, FiTrendingUp, FiFilter, FiChevronLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Track = () => {
    const { currentUser } = useAuth();
    const { isDarkMode } = useTheme();
    const [year, setYear] = useState(new Date().getFullYear());
    const [logData, setLogData] = useState({});
    const [selectedMetric, setSelectedMetric] = useState('mood');
    const [stats, setStats] = useState({ totalLogged: 0, bestStreak: 0 });
  
    // Fetch yearly data
    useEffect(() => {
      const fetchData = async () => {
        if (!currentUser) return;
        try {
          const startStr = `${year}-01-01`;
          const endStr = `${year}-12-31`;
          const logsRef = collection(db, 'users', currentUser.uid, 'logs');
          const q = query(logsRef, where('date', '>=', startStr), where('date', '<=', endStr));
          const snap = await getDocs(q);
          const data = {};
          let count = 0;
          snap.forEach(doc => {
              data[doc.id] = doc.data();
              count++;
          });
          setLogData(data);
          setStats(prev => ({ ...prev, totalLogged: count }));
        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
    }, [year, currentUser]);
  
    const days = eachDayOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1))
    });
  
    // Helper to get color based on metric
    const getColor = (dateStr) => {
      const log = logData[dateStr];
      const emptyColor = isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100';
      
      if (!log) return emptyColor;
  
      switch (selectedMetric) {
        case 'mood':
          // 0:😭, 1:😢, 2:😐, 3:🙂, 4:🤩
          const moodColors = ['bg-red-300', 'bg-orange-300', 'bg-yellow-300', 'bg-green-300', 'bg-green-500'];
          return moodColors[log.mood] || (isDarkMode ? 'bg-gray-700' : 'bg-gray-200');
        case 'rating': 
           // 1-10
           if (!log.rating) return (isDarkMode ? 'bg-gray-700' : 'bg-gray-200');
           return `bg-indigo-${Math.min(Math.ceil(log.rating) * 100, 900)}`;
        case 'spend':
            return log.spend ? 'bg-emerald-400' : emptyColor;
        case 'steps':
            if(!log.steps) return emptyColor;
            return log.steps > 10000 ? 'bg-blue-600' : (log.steps > 5000 ? 'bg-blue-300' : 'bg-blue-200');
        default:
          return emptyColor;
      }
    };

    const metrics = [
        { id: 'mood', label: 'Mood', icon: FiSmile },
        { id: 'rating', label: 'Rating', icon: FiActivity },
        { id: 'spend', label: 'Spend', icon: FiDollarSign },
        { id: 'steps', label: 'Steps', icon: FiTrendingUp },
    ];
  
    return (
        <div className={`min-h-screen font-sans p-6 md:p-12 relative overflow-hidden pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
        
            {/* Background Blooms */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                className={`absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}
            />
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
                className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}
            />

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                 <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div className="flex items-start gap-4">
                        <Link to="/dashboard" className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}>
                            <FiChevronLeft size={24} />
                        </Link>
                        <div>
                            <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Life Grid</h1>
                            <p className={`font-bold text-lg mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Your year in pixels.
                            </p>
                        </div>
                    </div>
                    
                    <div className={`flex items-center gap-4 p-2 rounded-2xl ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                         <div className={`px-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                             {year}
                         </div>
                         <div className={`h-4 w-[1px] ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                         <div className="px-4">
                            <span className="font-black text-xl">{stats.totalLogged}</span> 
                            <span className={`text-xs font-bold ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>ENTRIES</span>
                         </div>
                    </div>
                </div>

                {/* Metric Selector */}
                <div className="flex gap-3 mb-12 overflow-x-auto pb-2 scrollbar-hide">
                    {metrics.map(m => {
                        const isActive = selectedMetric === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMetric(m.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer border-2 ${
                                    isActive 
                                    ? (isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black shadow-lg shadow-gray-200')
                                    : (isDarkMode ? 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200')
                                }`}
                            >
                                <m.icon className={isActive ? (isDarkMode ? 'text-black' : 'text-white') : ''} /> 
                                {m.label}
                            </button>
                        )
                    })}
                </div>

                {/* Heatmap Container */}
                <div className={`rounded-[2.5rem] shadow-xl border p-6 md:p-10 overflow-hidden relative ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-none' : 'bg-white shadow-gray-100 border-gray-100'}`}>
                     <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isDarkMode ? 'from-gray-800 via-gray-700 to-gray-800' : 'from-gray-100 via-gray-200 to-gray-100'}`}></div>
                     
                     <div className="overflow-x-auto pb-4">
                        <div className="min-w-[800px]">
                            {/* Days Grid */}
                            <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
                                {days.map(day => (
                                    <motion.div
                                        key={day.toISOString()}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className={`w-4 h-4 rounded-md ${getColor(format(day, 'yyyy-MM-dd'))} transition-colors hover:scale-125 cursor-pointer ${isDarkMode ? 'hover:ring-white ring-offset-gray-900' : 'hover:ring-black ring-offset-white'} hover:ring-2 ring-offset-1`}
                                        title={`${format(day, 'MMM d')}: ${logData[format(day, 'yyyy-MM-dd')]?.note || 'No Data'}`}
                                    ></motion.div>
                                ))}
                            </div>
                        </div>
                     </div>

                     {/* Legend / Key */}
                     <div className={`mt-8 pt-6 border-t flex items-center justify-between text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                        <div>Less</div>
                        <div className="flex gap-1">
                             <div className={`w-3 h-3 rounded-sm ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                             {selectedMetric === 'mood' && (
                                <>
                                    <div className="w-3 h-3 bg-red-300 rounded-sm"></div>
                                    <div className="w-3 h-3 bg-orange-300 rounded-sm"></div>
                                    <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
                                    <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                </>
                             )}
                              {selectedMetric === 'steps' && (
                                <>
                                    <div className="w-3 h-3 bg-blue-100 rounded-sm"></div>
                                    <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
                                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                                </>
                             )}
                        </div>
                        <div>More</div>
                     </div>
                </div>

            </div>
        </div>
    );
};

export default Track;
