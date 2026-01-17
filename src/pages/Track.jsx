import { useState, useEffect } from 'react';
import { 
  format, 
  subDays,
  isToday, 
  startOfMonth, 
  endOfMonth,
  isFuture
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
    FiSettings,
    FiCheck,
    FiX,
    FiInfo
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION & HELPERS ---

const getHabitConfig = (name) => {
    const lower = name.toLowerCase();
    // Default
    let config = { 
        icon: <FiZap />, 
        color: 'text-gray-600', 
        bg: 'bg-gray-100 dark:bg-gray-800',
        activeFill: 'bg-black dark:bg-white',
        text: 'text-gray-500' 
    };

    if (lower.includes('workout') || lower.includes('gym') || lower.includes('exercise')) {
        config = { icon: <FiActivity />, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', activeFill: 'bg-teal-500', text: 'text-teal-500' };
    } else if (lower.includes('water') || lower.includes('drink')) {
        config = { icon: <FiDroplet />, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30', activeFill: 'bg-cyan-500', text: 'text-cyan-500' };
    } else if (lower.includes('read') || lower.includes('book') || lower.includes('study')) {
        config = { icon: <FiBook />, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', activeFill: 'bg-amber-500', text: 'text-amber-500' };
    } else if (lower.includes('sleep') || lower.includes('rest')) {
        config = { icon: <FiMoon />, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', activeFill: 'bg-indigo-500', text: 'text-indigo-500' };
    } else if (lower.includes('food') || lower.includes('diet') || lower.includes('junk')) {
         config = { icon: <FiShield />, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', activeFill: 'bg-green-500', text: 'text-green-500' };
    } else if (lower.includes('quality time') || lower.includes('family') || lower.includes('love')) {
         config = { icon: <FiHeart />, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30', activeFill: 'bg-pink-500', text: 'text-pink-500' };
    } else if (lower.includes('work') || lower.includes('job')) {
        config = { icon: <FiBriefcase />, color: 'text-slate-600', bg: 'bg-slate-200 dark:bg-slate-800', activeFill: 'bg-slate-500', text: 'text-slate-500' };
    }
    return config;
};

const BASE_HABITS = ['Exercise / Yoga', 'Quality Time', 'Read 10 mins', 'Sleep < 11PM', 'No Junk Food', 'Workout'];

// --- COMPONENTS ---

const HabitGuide = ({ onClose }) => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl p-8 shadow-2xl relative border border-gray-100 dark:border-gray-800"
        >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX size={20} className="text-gray-400" />
            </button>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Welcome to Habits</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Consistency is the bridge between goals and accomplishment. Track your daily progress here.
            </p>
            <button onClick={onClose} className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-xl">Let's Go</button>
        </motion.div>
    </motion.div>
);

const DeleteConfirm = ({ habit, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl max-w-xs w-full shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-lg mb-2 dark:text-white">Delete "{habit}"?</h3>
            <p className="text-sm text-gray-500 mb-6">This will remove it from your list. History is preserved.</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold text-sm">Cancel</button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm">Delete</button>
            </div>
        </div>
    </div>
);

// --- MAIN PAGE ---

const Track = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [habitToDelete, setHabitToDelete] = useState(null);
    const [loading, setLoading] = useState(true);

    // Data State
    const [logs, setLogs] = useState({});
    const [trackedHabits, setTrackedHabits] = useState([]);
    const [displayDates, setDisplayDates] = useState([]);

    // --- COMPUTED DATES (Last 5 Days) ---
    useEffect(() => {
        // Generate last 5 days including today
        const dates = [];
        const today = new Date();
        for (let i = 4; i >= 0; i--) {
            dates.push(subDays(today, i));
        }
        setDisplayDates(dates);
    }, []);

    // --- EFFECTS ---

    // 1. First Time Guide
    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenHabitGuide_v3');
        if (!hasSeen) setShowGuide(true);
    }, []);

    const closeGuide = () => {
        localStorage.setItem('hasSeenHabitGuide_v3', 'true');
        setShowGuide(false);
    };

    // 2. Fetch Data
    useEffect(() => {
        if (!currentUser || displayDates.length === 0) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch context: Start of first date to end of last date (simple range)
                const startRange = format(displayDates[0], 'yyyy-MM-dd');
                const endRange = format(displayDates[displayDates.length - 1], 'yyyy-MM-dd');

                // Extend fetch range to catch streaks (e.g. last 365 days)
                const streakStart = format(subDays(new Date(), 365), 'yyyy-MM-dd');
                
                const logsRef = collection(db, 'users', currentUser.uid, 'logs');
                // We'll query from streakStart to now to get decent streak data
                const q = query(logsRef, where('date', '>=', streakStart));
                const snap = await getDocs(q);
                
                const data = {};
                snap.forEach(doc => { data[doc.id] = doc.data(); });
                setLogs(data);

                // Load tracked habits from LocalStorage or Default
                const savedHabits = localStorage.getItem('user_tracked_habits');
                if (savedHabits) {
                    setTrackedHabits(JSON.parse(savedHabits));
                } else {
                    const defaults = [...BASE_HABITS];
                    setTrackedHabits(defaults);
                    localStorage.setItem('user_tracked_habits', JSON.stringify(defaults));
                }

            } catch (error) {
                console.error("Error loading habits:", error);
                toast.error("Could not load habit data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, displayDates]); 

    // --- HANDLERS ---

    const toggleHabit = async (dateStr, habit) => {
        // 1. Optimistic Update
        const oldLogs = { ...logs };
        const dayLog = logs[dateStr] || {};
        const currentHabits = dayLog.habits || [];
        const isDone = currentHabits.includes(habit);
        
        let newHabitsList;
        if (isDone) {
            newHabitsList = currentHabits.filter(h => h !== habit);
        } else {
            newHabitsList = [...currentHabits, habit];
        }

        setLogs(prev => ({
            ...prev,
            [dateStr]: { ...dayLog, habits: newHabitsList }
        }));

        // 2. Persist
        try {
            const logRef = doc(db, 'users', currentUser.uid, 'logs', dateStr);
            await setDoc(logRef, { habits: newHabitsList, date: dateStr }, { merge: true });
        } catch (error) {
            console.error("Save failed", error);
            setLogs(oldLogs); // Revert
            toast.error("Failed to save changes");
        }
    };

    const confirmDelete = () => {
        if (!habitToDelete) return;
        const newList = trackedHabits.filter(h => h !== habitToDelete);
        setTrackedHabits(newList);
        localStorage.setItem('user_tracked_habits', JSON.stringify(newList));
        toast.success("Habit removed");
        setHabitToDelete(null);
    };

    const calculateSimpleStreak = (habit) => {
        // UI approximation for streak
        let streak = 0;
        let d = new Date();
        const todayStr = format(d, 'yyyy-MM-dd');
        
        // If done today
        if (logs[todayStr]?.habits?.includes(habit)) {
            streak++;
            d = subDays(d, 1);
        } else {
            // Check yesterday
            d = subDays(d, 1);
            if (!logs[format(d, 'yyyy-MM-dd')]?.habits?.includes(habit)) {
                return 0; // Broken
            }
        }

        for (let i = 0; i < 365; i++) { 
            const str = format(d, 'yyyy-MM-dd');
            if (logs[str]?.habits?.includes(habit)) {
                streak++;
                d = subDays(d, 1);
            } else {
                break;
            }
        }
        return streak;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#000000] text-gray-900 dark:text-white font-sans transition-colors duration-300">
             <AnimatePresence>
                {showGuide && <HabitGuide onClose={closeGuide} />}
                {habitToDelete && (
                    <DeleteConfirm 
                        habit={habitToDelete} 
                        onConfirm={confirmDelete} 
                        onCancel={() => setHabitToDelete(null)} 
                    />
                )}
            </AnimatePresence>

            {/* --- HEADER --- */}
            <div className="pt-12 px-6 pb-2">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-2">
                         <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
                         <button onClick={() => setShowGuide(true)} className="text-gray-300 hover:text-gray-500 transition-colors">
                             <FiInfo size={20} />
                         </button>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2.5 rounded-xl transition-all ${isEditing ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-[#1C1C1E] text-gray-500 dark:text-gray-400'}`}
                    >
                         {isEditing ? <FiCheck size={18} /> : <FiSettings size={18} />}
                    </button>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="px-6 pb-32">
                
                {/* Scrollable Container for List Items */}
                <div className="w-full">
                    {/* Header Row (Dates) - Right Aligned */}
                    <div className="flex justify-end mb-6">
                        <div className="flex gap-2">
                            {displayDates.map(date => {
                                const isTodayDate = isToday(date);
                                return (
                                    <div key={date.toString()} className="w-8 flex flex-col items-center">
                                        <span className="text-[10px] font-bold uppercase text-gray-400">
                                            {format(date, 'EEE')}
                                        </span>
                                        <span className={`text-xs font-bold ${isTodayDate ? 'text-black dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                                            {format(date, 'dd')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Habit Rows */}
                    <div className="space-y-8">
                        {trackedHabits.map((habit, idx) => {
                            const style = getHabitConfig(habit);
                            const streak = calculateSimpleStreak(habit);
                            const streakText = streak > 0 ? `${streak} DAY STREAK` : 'START TODAY';

                            // Determine active colors based on config
                            // If streak > 0, we can color the text, else keep it neutral or 'start today' color
                            const statusColor = streak > 0 ? 'text-green-500' : style.text;

                            return (
                                <motion.div 
                                    key={habit}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between group"
                                >
                                    {/* Left: Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                        {isEditing ? (
                                             <button 
                                                onClick={() => setHabitToDelete(habit)}
                                                className="w-12 h-12 rounded-full bg-red-50 text-red-500 dark:bg-red-900/20 flex items-center justify-center shrink-0"
                                            >
                                                <FiTrash2 size={20} />
                                            </button>
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full ${style.bg} ${style.color} flex items-center justify-center text-xl shrink-0`}>
                                                {style.icon}
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-tight">{habit}</h3>
                                            {!isEditing && (
                                                <span className={`text-[10px] font-extrabold uppercase mt-1 tracking-wide ${statusColor}`}>
                                                    {streakText}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: The 5-Day Grid */}
                                    <div className={`flex gap-2 transition-opacity ${isEditing ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                        {displayDates.map(date => {
                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const isFutureDate = isFuture(date);
                                            const isDone = logs[dateStr]?.habits?.includes(habit);

                                            return (
                                                <button
                                                    key={dateStr}
                                                    disabled={isFutureDate}
                                                    onClick={() => toggleHabit(dateStr, habit)}
                                                    className={`
                                                        w-8 h-8 rounded-[10px] transition-all duration-200
                                                        ${isDone ? style.activeFill : 'bg-gray-100 dark:bg-[#1C1C1E]'}
                                                        ${isFutureDate ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                                                    `}
                                                />
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Empty State */}
                {!loading && trackedHabits.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <p>No habits tracked. Tap + to start.</p>
                    </div>
                )}
            </div>

            {/* FAB */}
            <div className="fixed bottom-24 right-5 md:hidden text-white drop-shadow-2xl z-50">
                <button 
                    onClick={() => navigate('/add-habit')}
                    className="w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
                >
                    <FiPlus size={24} />
                </button>
            </div>

        </div>
    );
};

export default Track;
