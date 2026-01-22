import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCalendar, FiChevronDown, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DAYS = [
    { label: 'M', value: 0 },
    { label: 'T', value: 1 },
    { label: 'W', value: 2 },
    { label: 'T', value: 3 },
    { label: 'F', value: 4 },
    { label: 'S', value: 5 },
    { label: 'S', value: 6 },
];

const AddCustomHabit = () => {
    const navigate = useNavigate();
    
    // Form State
    const [name, setName] = useState('');
    const [isGoalSet, setIsGoalSet] = useState(false);
    const [goalDate, setGoalDate] = useState('');
    const [goalAmount, setGoalAmount] = useState('');
    
    // Default to all days selected? Or none? Image shows Thursday selected. Let's select current day or none.
    const [repeatDays, setRepeatDays] = useState([3]); // Example: Thursday
    const [hasReminders, setHasReminders] = useState(true);

    const toggleDay = (dayVal) => {
        if (repeatDays.includes(dayVal)) {
            setRepeatDays(prev => prev.filter(d => d !== dayVal));
        } else {
            setRepeatDays(prev => [...prev, dayVal]);
        }
    };

    const handleSave = () => {
        if (!name.trim()) return toast.error("Please name your habit");

        // 1. Get Existing Habits (Simple List of Strings for compatibility)
        const saved = localStorage.getItem('user_tracked_habits');
        let currentHabits = [];
        try {
            currentHabits = saved ? JSON.parse(saved) : [];
        } catch (e) {
            currentHabits = [];
        }

        if (currentHabits.includes(name.trim())) {
            return toast.error("Habit already exists!");
        }

        // 2. Add New Habit Name
        const newHabits = [...currentHabits, name.trim()];
        localStorage.setItem('user_tracked_habits', JSON.stringify(newHabits));

        // 3. Save Detailed Config (Future Proofing)
        const configData = {
            name: name.trim(),
            goal: isGoalSet ? { date: goalDate, amount: goalAmount } : null,
            repeatDays,
            reminders: hasReminders,
            createdAt: new Date().toISOString()
        };
        
        // Load existing configs
        const storedConfigs = localStorage.getItem('habit_configs');
        let configs = {};
        try { configs = storedConfigs ? JSON.parse(storedConfigs) : {}; } catch(e) {}
        
        configs[name.trim()] = configData;
        localStorage.setItem('habit_configs', JSON.stringify(configs));

        toast.success("Habit created successfully!");
        navigate(-1);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] dark:bg-[#121212] flex flex-col overflow-hidden transition-colors duration-300">
            {/* Header */}
            <div className="px-6 py-6 flex items-center justify-between">
                <div className="w-10" /> {/* Spacer */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">New habit</h1>
                <button 
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors shadow-sm"
                >
                    <FiX size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-24">
                <div className="max-w-md mx-auto space-y-8">
                    
                    {/* Illustration */}
                    <div className="flex justify-center py-4">
                        <div className="relative">
                            {/* Cute Calendar Graphic */}
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 25H20C14.4772 25 10 29.4772 10 35V100C10 105.523 14.4772 110 20 110H100C105.523 110 110 105.523 110 100V35C110 29.4772 105.523 25 100 25Z" fill="#A3D92A" stroke="#658818" strokeWidth="3"/>
                                <rect x="25" y="45" width="20" height="20" rx="4" fill="white" stroke="#3F3F46" strokeWidth="2"/>
                                <rect x="50" y="45" width="20" height="20" rx="4" fill="white" stroke="#3F3F46" strokeWidth="2"/>
                                <rect x="75" y="45" width="20" height="20" rx="4" fill="white" stroke="#3F3F46" strokeWidth="2"/>
                                <rect x="25" y="70" width="20" height="20" rx="4" fill="white" stroke="#3F3F46" strokeWidth="2"/>
                                <rect x="50" y="70" width="20" height="20" rx="4" fill="#A3D92A" stroke="#658818" strokeWidth="2"/>
                                <rect x="75" y="70" width="20" height="20" rx="4" fill="white" stroke="#3F3F46" strokeWidth="2"/>
                                
                                {/* Spirals */}
                                <path d="M30 15V35" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
                                <path d="M50 15V35" stroke="#A3D92A" strokeWidth="4" strokeLinecap="round"/>
                                <path d="M70 15V35" stroke="#A3D92A" strokeWidth="4" strokeLinecap="round"/>
                                <path d="M90 15V35" stroke="#A3D92A" strokeWidth="4" strokeLinecap="round"/>

                                {/* Squiggles */}
                                <path d="M5 45C5 45 0 40 5 35" stroke="#F97316" strokeWidth="3" strokeLinecap="round"/>
                                <path d="M115 40L118 35" stroke="#F472B6" strokeWidth="3" strokeLinecap="round"/>
                                <path d="M112 45L115 40" stroke="#F472B6" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-3">
                        <label className="text-gray-600 dark:text-gray-400 text-sm font-medium ml-1">Name your habit</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Morning Meditations"
                            className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl text-lg font-medium text-gray-900 dark:text-white border-none shadow-sm placeholder-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Goal Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-gray-600 dark:text-gray-400 text-sm font-medium ml-1">Set a goal</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isGoalSet} onChange={(e) => setIsGoalSet(e.target.checked)} className="sr-only peer" />
                                <div className={`w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-md transition-all flex items-center justify-center ${isGoalSet ? 'bg-orange-500 border-orange-500' : 'bg-transparent'}`}>
                                    {isGoalSet && <FiCheck className="text-white" size={16} />}
                                </div>
                            </label>
                        </div>
                        
                        <AnimatePresence>
                            {isGoalSet && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="flex gap-3 overflow-hidden"
                                >
                                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <span className="text-gray-400 text-sm">Add date</span>
                                        <FiCalendar className="text-gray-400" />
                                    </div>
                                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <span className="text-gray-400 text-sm">Add amount</span>
                                        <FiChevronDown className="text-gray-400" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Repeat Days */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-gray-600 dark:text-gray-400 text-sm font-medium ml-1">Repeat days</label>
                            {/* <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-md"></div>
                            </label> */}
                        </div>
                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm">
                            {DAYS.map((day) => {
                                const isSelected = repeatDays.includes(day.value);
                                return (
                                    <button
                                        key={day.value}
                                        onClick={() => toggleDay(day.value)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                            isSelected 
                                            ? 'bg-gray-900 text-white dark:bg-white dark:text-black scale-105 shadow-md' 
                                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reminders */}
                    <div className="flex items-center justify-between pt-2">
                        <label className="text-gray-600 dark:text-white text-md font-medium ml-1">Get reminders</label>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={hasReminders}
                                onChange={(e) => setHasReminders(e.target.checked)}
                                className="sr-only peer" 
                            />
                            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>

                </div>
            </div>

            {/* Footer Action */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent dark:from-[#121212] dark:via-[#121212] z-20">
                <button 
                    onClick={handleSave}
                    className="w-full bg-[#FA7C15] hover:bg-[#E66B0D] text-white font-bold text-lg py-4 rounded-[20px] shadow-lg shadow-orange-500/30 transition-all transform active:scale-95"
                >
                    Save Habit
                </button>
                <div className="h-1 w-32 bg-black/10 dark:bg-white/10 mx-auto rounded-full mt-6" />
            </div>
        </div>
    );
};

export default AddCustomHabit;
