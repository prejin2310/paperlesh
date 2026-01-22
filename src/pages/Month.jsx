import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { FiCalendar, FiSave, FiArrowLeft, FiTrash2, FiEdit2, FiCheckSquare, FiType, FiRefreshCw, FiPlus, FiSmile, FiActivity, FiMoon, FiDollarSign, FiStar, FiMoreHorizontal, FiGrid, FiChevronDown, FiX } from 'react-icons/fi';
import MonthlyJournalBlock from '../components/feature/MonthlyJournalBlock';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDaysInMonth, differenceInDays, eachMonthOfInterval, startOfYear, endOfYear, setMonth, getWeek } from 'date-fns';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import debounce from 'lodash.debounce';

const DEFAULT_BLOCKS = [
    { id: '1', type: 'text', title: 'Challenges and Lessons', content: '' },
    { id: '2', type: 'text', title: 'What I need to improve', content: '' },
    { id: '3', type: 'retrospective', title: 'Stop / Start / Keep', content: { stop: [], start: [], keep: [] } },
    { id: '4', type: 'checklist', title: 'Monthly Shopping List', items: [] },
    { id: '5', type: 'checklist', title: 'Grateful For', items: [] },
    { id: '6', type: 'text', title: 'Highlights & Top Accomplishments', content: '' },
];

const StatCard = ({ title, value, sub, icon, bgClass, textClass, onClick, isDarkMode }) => (
    <div onClick={onClick} className={`p-6 rounded-[2rem] flex flex-col justify-between min-h-[160px] relative overflow-hidden group cursor-pointer transition-all ${isDarkMode ? 'bg-[#1C1C1E] hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} shadow-sm`}>
        <div className="flex justify-between items-start z-10">
            <div className={`p-3 rounded-2xl ${bgClass} bg-opacity-20 ${textClass}`}>
                {icon}
            </div>
            <FiArrowLeft className={`rotate-180 opacity-0 group-hover:opacity-100 transition-opacity ${textClass}`} />
        </div>
        <div className="z-10 mt-4">
            <h3 className="text-3xl font-black tracking-tight">{value}</h3>
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mt-1">{title}</p>
            {sub && <p className="text-[10px] mt-2 opacity-40 font-medium">{sub}</p>}
        </div>
        {/* Decorative Blob */}
        <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${textClass.replace('text', 'bg')}`} />
    </div>
);

const Month = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showYearView, setShowYearView] = useState(false);
  const [calendarMetric, setCalendarMetric] = useState('spend'); // Default to spend
  const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false);
  const currentMonthStr = format(selectedDate, 'yyyy-MM');
  const displayMonth = format(selectedDate, 'MMMM yyyy');

  const [blocks, setBlocks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);

  // Fetch Blocks & Logs
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    const journalRef = doc(db, 'users', currentUser.uid, 'monthly_journals', currentMonthStr);
    const unsubscribeJournal = onSnapshot(journalRef, (docSnap) => {
        if (docSnap.exists()) {
            setBlocks(docSnap.data().blocks || DEFAULT_BLOCKS);
        } else {
            setBlocks(DEFAULT_BLOCKS);
        }
    });

    const fetchLogs = async () => {
        try {
            const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
            const logsQ = query(
                collection(db, 'users', currentUser.uid, 'logs'),
                where('date', '>=', start),
                where('date', '<=', end)
            );
            const snap = await getDocs(logsQ);
            const fetchedLogs = snap.docs.map(d => ({ date: d.id, ...d.data() }));
            setLogs(fetchedLogs.sort((a,b) => a.date.localeCompare(b.date)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    fetchLogs();

    return () => unsubscribeJournal();
  }, [currentUser, currentMonthStr, selectedDate]);

  // --- Analytics Logic ---
  const analytics = useMemo(() => {
      const totalDays = logs.length;
      const daysInMonth = getDaysInMonth(selectedDate);
      const completionPercentage = Math.round((totalDays / daysInMonth) * 100);

      // Streak logic (simplified for month view)
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;
      // Note: This streak logic only counts streaks *within* the fetched month logs
      // A more robust streak needs previous month data, but for this view "Month Streak" is acceptable.
      for (let i = 0; i < daysInMonth; i++) {
          const d = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1), 'yyyy-MM-dd');
          const hasLog = logs.find(l => l.date === d);
          if (hasLog) {
              tempStreak++;
          } else {
              maxStreak = Math.max(maxStreak, tempStreak);
              tempStreak = 0;
          }
      }
      maxStreak = Math.max(maxStreak, tempStreak);
      
      const moodSum = logs.reduce((acc, log) => acc + (log.mood !== undefined ? Number(log.mood) : 3), 0);
      const moodAvg = totalDays ? (moodSum / totalDays).toFixed(1) : 0;
      // Mood Distribution
      const moodCounts = logs.reduce((acc, log) => {
          const m = log.mood || 3;
          acc[m] = (acc[m] || 0) + 1;
          return acc;
      }, {});
      const mostFrequentMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, 3);

      const ratingSum = logs.reduce((acc, log) => acc + Number(log.rating || 0), 0);
      const ratingAvg = totalDays ? (ratingSum / totalDays).toFixed(1) : 0;
      const ratings = logs.map(l => Number(l.rating || 0));
      const bestRating = ratings.length ? Math.max(...ratings) : '-';
      const worstRating = ratings.length ? Math.min(...ratings) : '-';

      const sleepSum = logs.reduce((acc, log) => acc + Number(log.sleep || 0), 0);
      const sleepAvg = totalDays ? (sleepSum / totalDays).toFixed(1) : 0;

      const totalSpend = logs.reduce((acc, log) => {
         let val = 0;
         const s = String(log.spend || '').toLowerCase().replace(/,/g, '');
         if (s.includes('k')) val = parseFloat(s) * 1000;
         else if (s.includes('>')) val = 5500; 
         else val = parseFloat(s);
         return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const highSpendDays = logs.filter(l => {
          const s = String(l.spend || '');
           return s === '>5000' || s === '>5k' || parseFloat(s) > 5000;
      }).length; 
      
      // Steps
      const stepsSum = logs.reduce((acc, log) => {
          let val = 0;
          const s = String(log.steps || '').toLowerCase().replace(/,/g, '');
          if (s.includes('k')) val = parseFloat(s) * 1000;
          else if (s.includes('<')) val = 500; // <1000 -> 500 avg
          else if (s.includes('-')) {
             const parts = s.split('-');
             if (parts.length === 2) val = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2; // Midpoint
          }
          else val = parseFloat(s);
          return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const stepsAvg = totalDays ? Math.round(stepsSum / totalDays) : 0;
      const maxSteps = logs.length ? Math.max(...logs.map(l => Number(l.steps || 0))) : 0;

      // Weekly Analysis
      const weeklyData = {};
      logs.forEach(log => {
          const w = getWeek(new Date(log.date)); // Week Number
          if (!weeklyData[w]) weeklyData[w] = { spend: 0, steps: 0, count: 0, moodSum: 0 };
          
          // Spend
          let spendVal = parseFloat(String(log.spend || 0).replace(/,/g, ''));
          if (String(log.spend).includes('k')) spendVal = parseFloat(log.spend) * 1000;
          if (isNaN(spendVal)) spendVal = 0;
          weeklyData[w].spend += spendVal;

          // Steps
          let stepsVal = parseFloat(String(log.steps || 0).replace(/,/g, ''));
          if (String(log.steps).includes('k')) stepsVal = parseFloat(log.steps) * 1000;
          if (isNaN(stepsVal)) stepsVal = 0;
          weeklyData[w].steps += stepsVal;

          weeklyData[w].count++;
          weeklyData[w].moodSum += (log.mood !== undefined ? Number(log.mood) : 3);
      });

      const weeks = Object.keys(weeklyData);
      const heaviestSpendWeek = weeks.length ? weeks.reduce((a, b) => weeklyData[a].spend > weeklyData[b].spend ? a : b, weeks[0]) : null;
      const activeStepWeek = weeks.length ? weeks.reduce((a, b) => weeklyData[a].steps > weeklyData[b].steps ? a : b, weeks[0]) : null;
      
      const chartData = logs.map(l => ({
          day: format(new Date(l.date), 'd'),
          mood: l.mood !== undefined ? 8 - l.mood : 0, 
          rating: l.rating || 0
      }));

      return { 
          moodAvg, mostFrequentMood, moodCounts,
          ratingAvg, bestRating, worstRating,
          sleepAvg, 
          totalSpend, highSpendDays, 
          stepsAvg, maxSteps, stepsSum,
          chartData, totalDays, completionPercentage, maxStreak,
          weeklyInsights: {
              heaviestSpendWeek: heaviestSpendWeek ? { week: heaviestSpendWeek, amount: weeklyData[heaviestSpendWeek].spend } : null,
              activeStepWeek: activeStepWeek ? { week: activeStepWeek, steps: weeklyData[activeStepWeek].steps } : null
          }
      };
  }, [logs, selectedDate]);


  const saveToDb = useCallback(
    debounce(async (newBlocks) => {
        if (!currentUser) return;
        try {
            const docRef = doc(db, 'users', currentUser.uid, 'monthly_journals', currentMonthStr);
            await setDoc(docRef, { 
                blocks: newBlocks,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            setLastSaved(new Date());
            setTimeout(() => setLastSaved(null), 3000);
        } catch (error) {
            console.error("Error saving monthly journal:", error);
        }
    }, 1000),
    [currentUser, currentMonthStr]
  );
  
  // ... (Keep existing handlers: handleUpdateBlock, handleDeleteBlock, handleAddBlock, getBlockIcon, getBlockSummary) ...
  const handleUpdateBlock = (updatedBlock) => {
      const newBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
      setBlocks(newBlocks);
      saveToDb(newBlocks);
  };

  const handleDeleteBlock = (blockId) => {
      if (window.confirm('Delete this section?')) {
          const newBlocks = blocks.filter(b => b.id !== blockId);
          setBlocks(newBlocks);
          saveToDb(newBlocks);
          if (editingBlockId === blockId) setEditingBlockId(null);
      }
  };

  const handleAddBlock = (type) => {
      const titles = {
          'text': 'New Reflection',
          'checklist': 'New Checklist',
          'retrospective': 'New Retrospective'
      };
      
      const newBlock = {
          id: Date.now().toString(),
          type,
          title: titles[type],
          content: type === 'retrospective' ? { stop:[], start:[], keep:[] } : '',
          items: type === 'checklist' ? [] : undefined
      };
      
      const newBlocks = [...blocks, newBlock];
      setBlocks(newBlocks);
      saveToDb(newBlocks);
      setEditingBlockId(newBlock.id);
  };

  const getBlockIcon = (type) => {
      switch(type) {
          case 'checklist': return <FiCheckSquare size={20} className="text-emerald-600" />;
          case 'retrospective': return <FiRefreshCw size={20} className="text-orange-600" />;
          default: return <FiType size={20} className="text-indigo-600" />;
      }
  };

  const getBlockSummary = (block) => {
      switch(block.type) {
          case 'text':
              return block.content ? 
                <span className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{block.content}</span> : 
                <span className="text-sm italic opacity-40">Write something...</span>;
          case 'checklist':
              const total = block.items?.length || 0;
              const completed = block.items?.filter(i => i.completed)?.length || 0;
              return (
                  <div className="flex items-center gap-2 mt-2">
                       <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-500">{completed}/{total} done</span>
                  </div>
              );
          case 'retrospective':
             const s = (block.content?.start?.length || 0);
             const st = (block.content?.stop?.length || 0);
             const k = (block.content?.keep?.length || 0);
             return (
                 <div className="flex gap-2 mt-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                     <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                     <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                 </div>
             );
          default: return null;
      }
  };


  // --- Views ---

  // Inline editor will be rendered inside the grid to avoid fixed overlay jumps on mobile.

  const renderMonthCalendar = () => {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const days = eachDayOfInterval({ start, end });

      const getDayColor = (date) => {
          const log = logs.find(l => l.date === format(date, 'yyyy-MM-dd'));
          if (!log) return isDarkMode ? 'bg-gray-800' : 'bg-gray-200';
          
          if (calendarMetric === 'rating') {
             const score = Number(log.rating || 0);
             if (score >= 4.5) return 'bg-emerald-400';
             if (score >= 4) return 'bg-teal-400';
             if (score >= 3) return 'bg-yellow-400';
             if (score >= 2) return 'bg-orange-400';
             return 'bg-red-400';
          }
          if (calendarMetric === 'mood') {
              const m = log.mood !== undefined ? Number(log.mood) : 3;
              // 1 (Sad) -> 5 (Happy)
              if (m <= 2) return 'bg-purple-900'; // Very sad/low
              if (m === 3) return 'bg-purple-400'; // Neutral
              return 'bg-pink-400'; // Happy
          }
           if (calendarMetric === 'sleep') {
              const s = Number(log.sleep || 0);
              if (s >= 7) return 'bg-indigo-400'; // Good
              if (s >= 5) return 'bg-indigo-300'; // Okay
              return 'bg-indigo-900'; // Bad
          }
          if (calendarMetric === 'steps') {
              const s = Number(log.steps || 0); // Note: steps might be stored as range string '<1000' etc if using wizard dropdown without parsing. But user asked for global spend classification, will assume steps logic is handled or distinct.
              // Logic for steps (if stored as string range in log from wizard):
              if (log.steps === '>10k') return 'bg-rose-400';
              if (log.steps === '5k-10k') return 'bg-rose-300';
              return 'bg-rose-100';
          }
          if (calendarMetric === 'spend') {
               const val = Number(log.spend || 0);
               if (val === 0) return 'bg-emerald-100 dark:bg-emerald-900/30'; // No spend = Good
               if (val <= 500) return 'bg-emerald-300'; // Low spend
               if (val <= 1000) return 'bg-yellow-300'; // Moderate
               if (val <= 2500) return 'bg-orange-300'; // High
               if (val <= 5000) return 'bg-orange-500'; // Very High
               return 'bg-red-500 text-white'; // Extreme (>5000)
          }
          
          return 'bg-gray-200';
      };

      const getDayContent = (date) => {
          const log = logs.find(l => l.date === format(date, 'yyyy-MM-dd'));
          if (!log) return null;
          
          if (calendarMetric === 'rating') return log.rating;
          if (calendarMetric === 'mood') return log.mood; 
          if (calendarMetric === 'sleep') return log.sleep;
          if (calendarMetric === 'steps') return log.steps ? log.steps.replace('k', '') : '';
          if (calendarMetric === 'spend') {
              const val = Number(log.spend || 0);
              if (val === 0) return '-';
              if (val >= 1000) return (val/1000).toFixed(1) + 'k';
              return val;
          }
          return '';
      };

      return (
          <div className="flex flex-wrap gap-2 justify-between">
              {days.map(day => (
                  <div key={day.toString()} className="flex flex-col items-center gap-1 group relative">
                      <div className={`w-8 h-8 rounded-full ${getDayColor(day)} transition-all hover:scale-110 cursor-pointer flex items-center justify-center`}>
                           <span className="text-[10px] font-black text-black/60">{getDayContent(day)}</span>
                      </div>
                      <span className="text-[10px] font-bold opacity-30">{format(day, 'd')}</span>
                      
                      {/* Simple Tooltip */}
                      <div className="absolute bottom-full mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                          {format(day, 'MMM d')}
                      </div>
                  </div>
              ))}
          </div>
      );
  };
  
    const renderYearView = () => {
        const yearStart = startOfYear(selectedDate);
        const yearEnd = endOfYear(selectedDate);
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

        return (
            <motion.div 
                key="year"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white/90 dark:bg-black/90 backdrop-blur-xl"
            >
                <div className="w-full max-w-sm">
                    <div className="flex justify-between items-center mb-8">
                         <h2 className="text-2xl font-bold font-serif">{format(selectedDate, 'yyyy')}</h2>
                         <button onClick={() => setShowYearView(false)} className="p-2 rounded-full hover:bg-black/5"><FiX size={24}/></button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {months.map(month => {
                            const isSelected = isSameMonth(month, selectedDate);
                            const isFuture = month > new Date();
                            return (
                                <button
                                    key={month.toString()}
                                    disabled={isFuture}
                                    onClick={() => {
                                        setSelectedDate(month);
                                        setShowYearView(false);
                                    }}
                                    className={`
                                        aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-bold transition-all
                                        ${isSelected ? 'bg-black text-white dark:bg-white dark:text-black scale-105 shadow-xl' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}
                                        ${isFuture ? 'opacity-30 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <span>{format(month, 'MMM')}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </motion.div>
        );
    };


  const renderGridView = () => (
      <motion.div 
        key="grid"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="relative z-10 max-w-2xl mx-auto pb-32 pt-6"
      >
        {/* 1. Header & Summary */}
        <div className="mb-10">
             <div className="flex items-center justify-between mb-6">
                 <button onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"><FiArrowLeft/></button>
                 
                 <div className="flex flex-col items-center">
                     <div className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 px-4 py-2 rounded-2xl transition-all" onClick={() => setShowYearView(true)}>
                        <h2 className={`text-xl font-bold font-serif ${isDarkMode ? 'text-gray-100' : 'text-[#2D2D2D]'}`}>{displayMonth}</h2>
                        <FiGrid size={16} className="opacity-40" />
                     </div>
                     <p className="text-xs font-bold uppercase tracking-widest text-[#B0B0B0] mt-1">Monthly Review</p>
                 </div>

                 <button onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} disabled={endOfMonth(selectedDate) >= new Date()} className="p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"><FiArrowLeft className="rotate-180"/></button>
             </div>

             <div className="flex justify-between items-center px-4 md:px-12">
                 <div className="text-center">
                     <span className="block text-2xl font-black">{analytics?.totalDays}</span>
                     <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Days Logged</span>
                 </div>
                 <div className="text-center">
                     <span className="block text-2xl font-black">{analytics?.completionPercentage}%</span>
                     <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Complete</span>
                 </div>
                 <div className="text-center">
                     <span className="block text-2xl font-black">{analytics?.maxStreak}</span>
                     <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Best Streak</span>
                 </div>
             </div>
        </div>

        {/* 2. Visual Calendar */}
        <div className={`mb-10 p-6 rounded-[2.5rem] ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'} shadow-sm`}>
            <div className="flex justify-between items-center mb-6 relative z-30">
                <div className="relative">
                    <button 
                        onClick={() => setIsMetricMenuOpen(!isMetricMenuOpen)}
                        className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
                    >
                        {calendarMetric.charAt(0).toUpperCase() + calendarMetric.slice(1)} Calendar
                        <FiChevronDown className={`transition-transform ${isMetricMenuOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    
                    <AnimatePresence>
                        {isMetricMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden z-50 border border-gray-100 dark:border-gray-700"
                            >
                                {['rating', 'mood', 'sleep', 'steps', 'spend'].map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => {
                                            setCalendarMetric(m);
                                            setIsMetricMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-xs font-bold uppercase transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${calendarMetric === m ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {renderMonthCalendar()}
            
            {/* Dynamic Legend (Moved Below) */}
            <div className="flex flex-wrap justify-center gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                {(() => {
                    let items = [];
                    if (calendarMetric === 'spend') {
                        items = [
                            { color: 'bg-emerald-100 dark:bg-emerald-900', label: '0' },
                            { color: 'bg-emerald-300', label: '<500' },
                            { color: 'bg-yellow-300', label: '<1k' },
                            { color: 'bg-orange-300', label: '<2.5k' },
                            { color: 'bg-orange-500', label: '<5k' },
                            { color: 'bg-red-500', label: '>5k' },
                        ];
                    } else if (calendarMetric === 'rating') {
                        items = [
                            { color: 'bg-red-400', label: '1' },
                            { color: 'bg-orange-400', label: '2' },
                            { color: 'bg-yellow-400', label: '3' },
                            { color: 'bg-teal-400', label: '4' },
                            { color: 'bg-emerald-400', label: '5' },
                        ];
                    } else if (calendarMetric === 'mood') {
                        items = [
                            { color: 'bg-purple-900', label: 'Low' },
                            { color: 'bg-purple-400', label: 'Neu' },
                            { color: 'bg-pink-400', label: 'High' },
                        ];
                    } else if (calendarMetric === 'sleep') {
                        items = [
                            { color: 'bg-indigo-900', label: '<5h' },
                            { color: 'bg-indigo-300', label: '5-7h' },
                            { color: 'bg-indigo-400', label: '8h+' },
                        ];
                    } else if (calendarMetric === 'steps') {
                        items = [
                            { color: 'bg-rose-100', label: '<4k' },
                            { color: 'bg-rose-300', label: '4-8k' },
                            { color: 'bg-rose-400', label: '8k+' },
                        ];
                    }

                    return items.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                            <span className="text-[10px] font-bold opacity-50 uppercase tracking-wide">{item.label}</span>
                        </div>
                    ));
                })()}
            </div>
        </div>

        {/* Metric Highlight Card */}
        <div className="mb-10 px-2">
             {calendarMetric === 'spend' && (
                 <div className="flex gap-4">
                     <div className="flex-1 p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/10 flex flex-col justify-between">
                         <div>
                             <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 opacity-60">Total Month Spend</p>
                             <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-2">
                                 {analytics?.totalSpend > 0 ? `₹${(analytics.totalSpend/1000).toFixed(1)}k` : '₹0'}
                             </h3>
                         </div>
                     </div>
                     <div className="flex-1 p-6 rounded-[2rem] bg-orange-50 dark:bg-orange-900/10 flex flex-col justify-between">
                         <div>
                             <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 opacity-60">Highest Week</p>
                             <h3 className="text-xl font-black text-orange-800 dark:text-orange-300 mt-2">
                                 Week {analytics?.weeklyInsights?.heaviestSpendWeek?.week || '-'}
                             </h3>
                             <p className="text-xs font-bold opacity-40 mt-1">
                                 {analytics?.weeklyInsights?.heaviestSpendWeek ? `₹${(analytics.weeklyInsights.heaviestSpendWeek.amount/1000).toFixed(1)}k` : '-'}
                             </p>
                         </div>
                     </div>
                 </div>
             )}

             {calendarMetric === 'steps' && (
                  <div className="flex gap-4">
                     <div className="flex-1 p-6 rounded-[2rem] bg-rose-50 dark:bg-rose-900/10 flex flex-col justify-between">
                         <div>
                             <p className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 opacity-60">Total Steps</p>
                             <h3 className="text-2xl font-black text-rose-800 dark:text-rose-300 mt-2">
                                 {analytics?.stepsSum > 0 ? `${(analytics.stepsSum/1000).toFixed(0)}k` : '0'}
                             </h3>
                         </div>
                     </div>
                     <div className="flex-1 p-6 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 flex flex-col justify-between">
                         <div>
                             <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 opacity-60">Most Active Week</p>
                              <h3 className="text-xl font-black text-blue-800 dark:text-blue-300 mt-2">
                                 Week {analytics?.weeklyInsights?.activeStepWeek?.week || '-'}
                             </h3>
                             <p className="text-xs font-bold opacity-40 mt-1">
                                 {analytics?.weeklyInsights?.activeStepWeek ? `${(analytics.weeklyInsights.activeStepWeek.steps/1000).toFixed(1)}k steps` : '-'}
                             </p>
                         </div>
                     </div>
                 </div>
             )}
             
             {(calendarMetric === 'mood' || calendarMetric === 'rating' || calendarMetric === 'sleep') && (
                  <div className="p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                      <div>
                          <p className="text-xs font-bold uppercase tracking-widest opacity-40">Monthly Average</p>
                          <h3 className="text-2xl font-black mt-1">
                              {calendarMetric === 'mood' && analytics?.moodAvg}
                              {calendarMetric === 'rating' && analytics?.ratingAvg}
                              {calendarMetric === 'sleep' && analytics?.sleepAvg + 'h'}
                          </h3>
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-widest opacity-40">Best Day</p>
                           <h3 className="text-xl font-black mt-1">
                              {calendarMetric === 'mood' && (analytics?.mostFrequentMood > 3 ? 'Happy' : 'Normal')}
                              {calendarMetric === 'rating' && analytics?.bestRating}
                              {calendarMetric === 'sleep' && '>8h'}
                          </h3>
                      </div>
                  </div>
             )}
        </div>

        {/* 3. Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
            <StatCard 
                title="Avg Rating" 
                value={analytics?.ratingAvg} 
                sub={`Best: ${analytics?.bestRating} / Worst: ${analytics?.worstRating}`}
                icon={<FiStar size={20}/>}
                bgClass="bg-orange-100 dark:bg-orange-900/40"
                textClass="text-orange-600 dark:text-orange-400"
                isDarkMode={isDarkMode}
            />
            <StatCard 
                title="Mood Flow" 
                value={analytics?.mostFrequentMood === '3' ? 'Neutral' : (analytics?.mostFrequentMood > 3 ? 'Happy' : 'Low')} 
                sub="Most frequent mood"
                icon={<FiSmile size={20}/>}
                bgClass="bg-yellow-100 dark:bg-yellow-900/40"
                textClass="text-yellow-600 dark:text-yellow-400"
                isDarkMode={isDarkMode}
            />
            <StatCard 
                title="Avg Sleep" 
                value={`${analytics?.sleepAvg}h`} 
                sub="Daily Average"
                icon={<FiMoon size={20}/>}
                bgClass="bg-indigo-100 dark:bg-indigo-900/40"
                textClass="text-indigo-600 dark:text-indigo-400"
                isDarkMode={isDarkMode}
            />
            <StatCard 
                title="Money" 
                value={analytics?.highSpendDays} 
                sub="High spend days (>5k)"
                icon={<FiDollarSign size={20}/>}
                bgClass="bg-emerald-100 dark:bg-emerald-900/40"
                textClass="text-emerald-600 dark:text-emerald-400"
                isDarkMode={isDarkMode}
            />
             <StatCard 
                title="Activity" 
                value={analytics?.stepsAvg > 0 ? `${(analytics?.stepsAvg/1000).toFixed(1)}k` : '-'} 
                sub="Avg Daily Steps"
                icon={<FiActivity size={20}/>}
                bgClass="bg-rose-100 dark:bg-rose-900/40"
                textClass="text-rose-600 dark:text-rose-400"
                isDarkMode={isDarkMode}
            />
             <StatCard 
                title="Habits" 
                value={`${analytics?.completionPercentage}%`} 
                sub="Log Consistency"
                icon={<FiCheckSquare size={20}/>}
                bgClass="bg-blue-100 dark:bg-blue-900/40"
                textClass="text-blue-600 dark:text-blue-400"
                isDarkMode={isDarkMode}
            />
        </div>

        {/* 4. Reflections (Read-onlyish view) */}
        <div>
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-serif font-bold text-lg">Monthly Reflections</h3>
                <button onClick={() => handleAddBlock('text')} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 transition-colors"><FiPlus/></button>
            </div>
            <div className="flex flex-col gap-4">
                {blocks.map((block, i) => (
                    <div 
                        key={block.id}
                        className={`p-6 rounded-[2rem] border hover:border-indigo-300 transition-all ${isDarkMode ? 'bg-[#1C1C1E] border-gray-800' : 'bg-white border-gray-100'}`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                             {getBlockIcon(block.type)}
                             <h4 className="font-bold">{block.title}</h4>
                             <div className="ml-auto">
                                 <button onClick={() => setEditingBlockId(block.id)} className="p-2 rounded-md text-sm text-indigo-600 hover:bg-indigo-50">Edit</button>
                             </div>
                        </div>

                        {editingBlockId === block.id ? (
                          <div className="pl-0 text-sm opacity-100">
                              <div className={`px-4 py-3 mb-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center gap-3`}> 
                                  <button onClick={() => setEditingBlockId(null)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"><FiArrowLeft/></button>
                                  <div className="flex-1 font-bold">{block.title}</div>
                                  <div className="flex items-center gap-2">
                                      {lastSaved && <span className="text-xs text-green-500 font-bold">Saved</span>}
                                      <button onClick={() => handleDeleteBlock(block.id)} className="text-red-400"><FiTrash2/></button>
                                  </div>
                              </div>
                              <MonthlyJournalBlock 
                                  block={block} 
                                  onUpdate={handleUpdateBlock} 
                                  onDelete={handleDeleteBlock} 
                                  isDarkMode={isDarkMode}
                              />
                          </div>
                        ) : (
                          <div className="pl-8 text-sm opacity-60">
                               {getBlockSummary(block)}
                          </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

      </motion.div>
  );

  return (
    <div className={`min-h-screen font-sans p-6 ${isDarkMode ? 'bg-[#000]' : 'bg-[#FDFBF7] text-[#2D2D2D]'} transition-colors duration-300`}>
         {loading ? (
             <div className="h-screen flex items-center justify-center">
                 <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
             </div>
         ) : (
             <AnimatePresence mode="wait">
                {showYearView && renderYearView()}
                {renderGridView()}
            </AnimatePresence>
         )}
    </div>
  );
};

export default Month;

