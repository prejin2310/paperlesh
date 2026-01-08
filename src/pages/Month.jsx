import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiCheckSquare, FiTarget, FiCalendar, FiPlus, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Month = () => {
  const { isDarkMode } = useTheme();
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Mock Data
  const habits = [
    { name: 'Read 30 mins', streak: 12, completed: true },
    { name: 'Workout', streak: 5, completed: false },
    { name: 'Drink Water', streak: 20, completed: true },
  ];

  const goals = [
    { name: 'Finish Project A', progress: 75, color: 'bg-blue-500' },
    { name: 'Save $500', progress: 40, color: 'bg-green-500' },
  ];

  return (
    <div className={`min-h-screen font-sans p-6 md:p-12 relative overflow-hidden pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
       
        {/* Background Blooms */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className={`absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}
        />
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}
        />

        <div className="relative z-10 max-w-lg mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>This Month</h1>
                   <p className={`font-bold text-lg mt-1 flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <FiCalendar className="text-gray-400" /> {currentMonth}
                   </p>
                </div>
                <button className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-50 text-black hover:bg-gray-100'}`}>
                    <FiMoreHorizontal className="w-6 h-6" />
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className={`p-5 rounded-[2rem] shadow-xl ${isDarkMode ? 'bg-gray-800 text-white shadow-none' : 'bg-gray-900 text-white shadow-gray-200'}`}>
                    <div className="text-3xl font-black mb-1">85%</div>
                    <div className="text-white/60 text-xs font-bold uppercase tracking-wider">Habit Score</div>
                </div>
                <div className={`p-5 rounded-[2rem] ${isDarkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-100 text-orange-900'}`}>
                    <div className="text-3xl font-black mb-1">12</div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-200/60' : 'text-orange-800/60'}`}>Pending Tasks</div>
                </div>
            </div>

            {/* Habits Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-5 px-2">
                    <h2 className={`text-lg font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <FiCheckSquare className="text-gray-400" /> Habits
                    </h2>
                     <button className={`w-8 h-8 flex items-center justify-center rounded-full hover:scale-105 transition-transform cursor-pointer ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        <FiPlus size={16} />
                    </button>
                </div>
                <div className="space-y-3">
                    {habits.map((habit, idx) => (
                        <motion.div 
                            key={idx}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                                habit.completed 
                                ? (isDarkMode ? 'bg-green-900/20' : 'bg-green-50')
                                : (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')
                            }`}
                        >
                            <span className={`font-bold ${habit.completed ? (isDarkMode ? 'text-green-400' : 'text-green-800') : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>{habit.name}</span>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${habit.completed ? (isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700') : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')}`}>
                                    🔥 {habit.streak}
                                </span>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${habit.completed ? 'bg-green-500 border-green-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')}`}>
                                    {habit.completed && <FiCheckSquare className="text-white w-3 h-3" />}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Goals Section */}
            <div className="mb-10">
                 <div className="flex items-center justify-between mb-5 px-2">
                    <h2 className={`text-lg font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <FiTarget className="text-gray-400" /> Monthly Goals
                    </h2>
                     <button className={`text-xs font-bold transition-colors uppercase tracking-wider ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                        View All
                    </button>
                </div>
                <div className="space-y-4">
                    {goals.map((goal, idx) => (
                        <div key={idx} className={`p-5 rounded-[2rem] ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-end mb-3">
                                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{goal.name}</span>
                                <span className="font-bold text-gray-400 text-xs">{goal.progress}%</span>
                            </div>
                            <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${goal.progress}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className={`h-full ${goal.color}`} 
                                />
                            </div>
                        </div>
                    ))}
                    <button className={`w-full py-4 border-2 border-dashed rounded-[2rem] font-bold transition-colors flex items-center justify-center gap-2 ${isDarkMode ? 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600'}`}>
                        <FiPlus /> Add New Goal
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};

export default Month;
