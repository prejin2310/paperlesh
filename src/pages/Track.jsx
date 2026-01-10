import { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  subDays,
  isFuture,
  isToday,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
    FiPlus, 
    FiZap, 
    FiDroplet, 
    FiBook, 
    FiActivity, 
    FiBriefcase, 
    FiMoon, 
    FiHeart, 
    FiShield, 
    FiTrash2, 
    FiEdit2, 
    FiSettings,
    FiX,
    FiCheck,
    FiInfo
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Helper for Habit Configuration (Icon & Color)
const getHabitConfig = (name) => {
    const lower = name.toLowerCase();
    
    // Default Style
    let config = { 
        icon: <FiZap />, 
        color: 'text-gray-600', 
        bg: 'bg-gray-100 dark:bg-gray-800', 
        fill: 'bg-gray-400' 
    };

    if (lower.includes('workout') || lower.includes('gym') || lower.includes('run')) {
        config = { icon: <FiActivity />, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30', fill: 'bg-rose-500' };
    } else if (lower.includes('yoga') || lower.includes('exercise')) {
        config = { icon: <FiActivity />, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30', fill: 'bg-teal-500' };
    } else if (lower.includes('water') || lower.includes('drink')) {
        config = { icon: <FiDroplet />, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', fill: 'bg-cyan-400' };
    } else if (lower.includes('read') || lower.includes('book') || lower.includes('study')) {
        config = { icon: <FiBook />, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', fill: 'bg-amber-400' };
    } else if (lower.includes('sleep') || lower.includes('meditation') || lower.includes('rest')) {
        config = { icon: <FiMoon />, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', fill: 'bg-indigo-500' };
    } else if (lower.includes('quality time') || lower.includes('family') || lower.includes('love')) {
         config = { icon: <FiHeart />, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', fill: 'bg-pink-500' };
    } else if (lower.includes('junk') || lower.includes('eat') || lower.includes('food')) {
         config = { icon: <FiShield />, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', fill: 'bg-green-500' };
    } else if (lower.includes('period') || lower.includes('cycle')) {
         config = { icon: <FiDroplet />, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', fill: 'bg-rose-600' };
    } else if (lower.includes('work') || lower.includes('job')) {
        config = { icon: <FiBriefcase />, color: 'text-slate-600', bg: 'bg-slate-200 dark:bg-slate-800', fill: 'bg-slate-500' };
    }

    return config;
};

const BASE_HABITS = ['Exercise / Yoga', 'Quality Time', 'Read 10 mins', 'Sleep < 11PM', 'No Junk Food', 'Workout'];

const HabitGuide = ({ onClose }) => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative border border-gray-100 dark:border-gray-800"
        >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <FiX size={20} className="text-gray-400" />
            </button>

            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 text-3xl">
                <FiActivity />
            </div>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Track Your Growth</h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                Consistency is key. Here you can track your daily habits, visualize streaks, and build a better routine.
            </p>

            <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0"><FiEdit2 size={14} /></div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Customize</h4>
                        <p className="text-xs text-gray-500">Remove default habits or add your own unique ones.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><FiZap size={14} /></div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Streaks</h4>
                        <p className="text-xs text-gray-500">Keep the streak alive to build momentum.</p>
                    </div>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg active:scale-95 transition-transform"
            >
                Get Started
            </button>
        </motion.div>
    </motion.div>
);


const ConfirmDeleteModal = ({ habit, onConfirm, onCancel }) => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-center"
        >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                <FiTrash2 />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Habit?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Are you sure you want to stop tracking <span className="font-bold text-gray-900 dark:text-white">"{habit}"</span>?
                <br/>History will remain in your logs.
            </p>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onCancel}
                    className="py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm}
                    className="py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                >
                    Delete
                </button>
            </div>
        </motion.div>
    </motion.div>
);

const Track = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState({});
    const [trackedHabits, setTrackedHabits] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [habitToDelete, setHabitToDelete] = useState(null);
    
    // We show last 5 days including today
    const [displayDates, setDisplayDates] = useState([]);

    // Check First Time Text
    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenHabitGuide_v2');
        if (!hasSeen) {
            setShowGuide(true);
        }
    }, []);

    const closeGuide = () => {
        localStorage.setItem('hasSeenHabitGuide_v2', 'true');
        setShowGuide(false);
    }
    
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

                // Initialize Habits logic
                // If local storage exists, use it.
                // If NOT, use BASE_HABITS + Gender logic, and SAVE it to local storage.
                const saved = localStorage.getItem('user_tracked_habits');
                let initial = [];

                if (saved) {
                    try {
                         initial = JSON.parse(saved);
                    } catch(e){
                        initial = [...BASE_HABITS];
                    }
                } else {
                    initial = [...BASE_HABITS];
                    if (currentUser?.gender && currentUser.gender.toLowerCase() === 'female') {
                        initial.push('Periods');
                    }
                    localStorage.setItem('user_tracked_habits', JSON.stringify(initial));
                }

                // If habits were found in logs that are NOT in the list, should we add them?
                // For now, let's keep the user's explicit list as the source of truth for the UI list.
                // But we can merge if we want historical habits to reappear.
                // Let's just stick to 'user_tracked_habits' for the UI rows.
                
                setTrackedHabits(initial);
                
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

    const initiateDelete = (habit) => {
        setHabitToDelete(habit);
    };

    const confirmDelete = () => {
        if (!habitToDelete) return;
        
        const newList = trackedHabits.filter(h => h !== habitToDelete);
        setTrackedHabits(newList);
        localStorage.setItem('user_tracked_habits', JSON.stringify(newList));
        toast.success('Habit removed');
        setHabitToDelete(null);
    };

    const addNewHabit = () => {
        navigate('/add-habit');
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
            
            <AnimatePresence>
                {showGuide && <HabitGuide onClose={closeGuide} />}
                {habitToDelete && (
                    <ConfirmDeleteModal 
                        habit={habitToDelete} 
                        onConfirm={confirmDelete} 
                        onCancel={() => setHabitToDelete(null)} 
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 p-6 md:p-8 pb-32 max-w-2xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Habits</h1>
                        <button onClick={() => setShowGuide(true)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <FiInfo size={18} />
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-3 rounded-xl transition-all ${isEditing ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                    >
                         {isEditing ? <FiCheck /> : <FiSettings />}
                    </button>
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
                                    {isEditing ? (
                                        <button 
                                            onClick={() => initiateDelete(habit)}
                                            className="w-12 h-12 rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            <FiTrash2 size={20} />
                                        </button>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center ${style.color} text-xl shadow-sm`}>
                                            {style.icon}
                                        </div>
                                    )}
                                    
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{habit}</h3>
                                        {!isEditing && (
                                            <div className={`text-xs font-bold uppercase tracking-wide mt-0.5 ${style.color.replace('text-', 'text-opacity-65 text-')}`}>
                                                {streak}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Checks */}
                                <div className={`flex gap-3 transition-opacity ${isEditing ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
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
