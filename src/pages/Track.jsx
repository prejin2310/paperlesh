import { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  subDays,
  addDays,
  isFuture,
  isToday,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FiPlus, FiMoreHorizontal, FiZap, FiDroplet, FiBook, FiActivity, FiBriefcase, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Helper for Habit Configuration (Icon & Color)
const getHabitConfig = (name) => {
    const lower = name.toLowerCase();
    
    // Default Style
    let config = { 
        icon: <FiZap />, 
        color: 'text-gray-600', 
        bg: 'bg-gray-100 dark:bg-gray-800', // Box BG
        fill: 'bg-gray-400' // Checkbox Fill
    };

    if (lower.includes('workout') || lower.includes('gym') || lower.includes('run')) {
        config = { icon: <FiActivity />, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30', fill: 'bg-rose-500' };
    } else if (lower.includes('water') || lower.includes('drink')) {
        config = { icon: <FiDroplet />, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', fill: 'bg-cyan-400' };
    } else if (lower.includes('read') || lower.includes('book') || lower.includes('study')) {
        config = { icon: <FiBook />, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', fill: 'bg-amber-400' };
    } else if (lower.includes('meditation') || lower.includes('mindfulness')) {
        config = { icon: <FiMoon />, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', fill: 'bg-indigo-500' };
    } else if (lower.includes('work') || lower.includes('job') || lower.includes('code')) {
        config = { icon: <FiBriefcase />, color: 'text-slate-600', bg: 'bg-slate-200 dark:bg-slate-800', fill: 'bg-slate-500' };
    } else if (lower.includes('clean') || lower.includes('chore')) {
        config = { icon: <FiZap />, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', fill: 'bg-purple-500' };
    } else if (lower.includes('skin') || lower.includes('face')) {
         config = { icon: <FiZap />, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', fill: 'bg-pink-400' };
    }

    return config;
};

const BASE_HABITS = ['Drink water', 'Journaling', 'Workout', 'Reading', 'Eat Healthy'];

const Track = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState({});
    const [trackedHabits, setTrackedHabits] = useState([]);
    
    // We show last 5 days including today
    const [displayDates, setDisplayDates] = useState([]);
    
    // Init Dates
    useEffect(() => {
        const today = new Date();
        // Generate last 5 days
        const dates = [];
        for (let i = 4; i >= 0; i--) {
            dates.push(subDays(today, i));
        }
        setDisplayDates(dates);
    }, []);

    // Load Data
    useEffect(() => {
        if (!currentUser || displayDates.length === 0) return;
        
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // Fetch a range to cover displayed dates + some buffer for streaks (e.g. current month)
                // For simplicity, let's just fetch current month or +/- 7 days range
                const startStr = format(displayDates[0], 'yyyy-MM-dd');
                const endStr = format(displayDates[displayDates.length - 1], 'yyyy-MM-dd');
                
                const logsRef = collection(db, 'users', currentUser.uid, 'logs');
                // Note: ideally query a larger range for streak calc, but for now simple
                const startMonth = startOfMonth(new Date());
                const endMonth = endOfMonth(new Date());
                
                const q = query(logsRef, where('date', '>=', format(startMonth, 'yyyy-MM-dd')), where('date', '<=', format(endMonth, 'yyyy-MM-dd')));
                const snap = await getDocs(q);
                
                const data = {};
                const foundHabits = new Set();
                
                snap.forEach(doc => {
                    const log = doc.data();
                    data[doc.id] = log;
                    if (log.habits) log.habits.forEach(h => foundHabits.add(h));
                });
                
                setLogs(data);

                // Merge habits
                const saved = localStorage.getItem('user_tracked_habits');
                let initial = [...BASE_HABITS];
                if (saved) {
                    try {
                         const parsed = JSON.parse(saved);
                         initial = [...new Set([...initial, ...parsed])];
                    } catch(e){}
                }
                
                // Add found ones
                const combined = [...new Set([...initial, ...Array.from(foundHabits)])];
                setTrackedHabits(combined);
                
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [currentUser, displayDates]);


    const toggleHabit = async (dateStr, habit) => {
        const existingLog = logs[dateStr] || {};
        const currentHabits = existingLog.habits || [];
        const isDone = currentHabits.includes(habit);
        
        let newHabits;
        if (isDone) {
            newHabits = currentHabits.filter(h => h !== habit);
        } else {
            newHabits = [...currentHabits, habit];
        }

        // Optimistic
        setLogs(prev => ({
            ...prev,
            [dateStr]: { ...existingLog, habits: newHabits } 
        }));

        try {
            const logRef = doc(db, 'users', currentUser.uid, 'logs', dateStr);
            await setDoc(logRef, { habits: newHabits, date: dateStr }, { merge: true });
        } catch (e) {
            console.error(e);
            toast.error("Failed to save");
        }
    };

    const addNewHabit = () => {
        const name = prompt("Enter habit name:");
        if (name && name.trim()) {
            const newList = [...trackedHabits, name.trim()];
            setTrackedHabits(newList);
            localStorage.setItem('user_tracked_habits', JSON.stringify(newList));
        }
    };

    const calculateStreak = (habit) => {
        // Simple streak logic: check backwards from Today
        let streak = 0;
        const today = new Date();
        let current = today; // check today first
        
        // If not done today, check yesterday to safe-keep streak
        const todayStr = format(today, 'yyyy-MM-dd');
        const doneToday = logs[todayStr]?.habits?.includes(habit);
        
        if (!doneToday) {
            current = subDays(today, 1);
        }

        while(true) {
            const dStr = format(current, 'yyyy-MM-dd');
            if (logs[dStr]?.habits?.includes(habit)) {
                streak++;
                current = subDays(current, 1);
            } else {
                break;
            }
            if (streak > 365) break; 
        }
        
        if (streak === 0) return "Start today";
        return `${streak} day${streak > 1 ? 's' : ''} streak`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black transition-colors duration-500">
            
            <div className="relative z-10 p-6 md:p-8 pb-32 max-w-2xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Habits</h1>
                    </div>
                </div>

                {/* Date Headers */}
                <div className="flex justify-end mb-4 pr-0">
                     <div className="flex gap-3">
                         {displayDates.map(date => (
                             <div key={date.toString()} className="w-8 text-center">
                                 <span className={`text-xs font-bold uppercase ${isToday(date) ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                                     {format(date, 'EQQ')} {/* Two letter day name? EEE is 3 letter. */}
                                     {/* Custom substring for 2 letter */}
                                     {format(date, 'EEE').substring(0,2)}
                                 </span>
                             </div>
                         ))}
                     </div>
                </div>

                {/* Habits List */}
                <div className="space-y-6">
                    {trackedHabits.map((habit, idx) => {
                        const style = getHabitConfig(habit);
                        const streak = calculateStreak(habit);
                        
                        return (
                            <motion.div 
                                key={habit}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between group"
                            >
                                {/* Left Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center ${style.color} text-xl shadow-sm`}>
                                        {style.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{habit}</h3>
                                        <div className={`text-xs font-bold uppercase tracking-wide mt-0.5 ${style.color.replace('text-', 'text-opacity-65 text-')}`}>
                                            {streak}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Checks */}
                                <div className="flex gap-3">
                                    {displayDates.map(date => {
                                        const dateStr = format(date, 'yyyy-MM-dd');
                                        const isDone = logs[dateStr]?.habits?.includes(habit);
                                        const isFutureDay = isFuture(date);
                                        
                                        return (
                                            <button
                                                key={dateStr}
                                                disabled={isFutureDay}
                                                onClick={() => toggleHabit(dateStr, habit)}
                                                className={`
                                                    w-8 h-8 rounded-[10px] transition-all duration-300
                                                    ${isDone 
                                                        ? `${style.fill} shadow-sm scale-100` 
                                                        : `bg-gray-100 dark:bg-gray-800 scale-90 hover:scale-100`
                                                    }
                                                    ${isFutureDay ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                                                `}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Floating Add Button (Bottom Right) */}
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="fixed bottom-24 right-6 z-40 md:hidden"
                >
                    <button 
                        onClick={addNewHabit}
                        className="w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl shadow-gray-400/50 dark:shadow-none hover:scale-110 active:scale-90 transition-all"
                    >
                        <FiPlus size={28} />
                    </button>
                </motion.div>

                {/* Empty State */}
                {trackedHabits.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-400">
                        <p>No habits tracked yet.</p>
                        <button onClick={addNewHabit} className="text-indigo-500 font-bold mt-2">Add one now</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Track;
