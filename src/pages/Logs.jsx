import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiPlus, FiBook, FiTv, FiCoffee, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Logs = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('books');
  
  const activeTabs = [
    { id: 'books', label: 'Books', icon: FiBook, color: 'text-blue-500', bg: 'bg-blue-50', darkBg: 'bg-blue-900/30' },
    { id: 'movies', label: 'Movies', icon: FiTv, color: 'text-purple-500', bg: 'bg-purple-50', darkBg: 'bg-purple-900/30' },
    { id: 'food', label: 'Food', icon: FiCoffee, color: 'text-orange-500', bg: 'bg-orange-50', darkBg: 'bg-orange-900/30' },
  ];

  // Placeholder data
  const logs = { 
    books: [], 
    movies: [], 
    food: [] 
  };

  return (
    <div className={`min-h-screen font-sans p-6 md:p-12 relative overflow-hidden pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
       
        {/* Background Blooms */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className={`absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}
        />
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}
        />

        <div className="relative z-10 max-w-lg mx-auto h-full flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Collections</h1>
                   <p className={`font-medium mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Track what you consume.</p>
                </div>
                <button className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    <FiPlus className="w-6 h-6" />
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative group mb-8">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-black'}`}>
                    <FiSearch size={20} />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl text-base font-bold transition-all outline-none ${isDarkMode ? 'bg-gray-900 text-white focus:bg-gray-800 focus:border-white placeholder-gray-600' : 'bg-gray-50 text-gray-900 focus:bg-white focus:border-black placeholder-gray-400'}`}
                    placeholder="Search logs..."
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {activeTabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer border-2 ${
                                isActive 
                                ? (isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black')
                                : (isDarkMode ? 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200')
                            }`}
                        >
                            <tab.icon className={isActive ? (isDarkMode ? 'text-black' : 'text-white') : tab.color} /> 
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* List Content */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        {logs[activeTab].length > 0 ? (
                            logs[activeTab].map(item => (
                                <div key={item.id} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                    {/* Item content would go here */}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 ${isDarkMode ? activeTabs.find(t=>t.id===activeTab).darkBg : activeTabs.find(t=>t.id===activeTab).bg}`}>
                                    {(() => {
                                        const Icon = activeTabs.find(t=>t.id===activeTab).icon;
                                        return <Icon className={`w-10 h-10 ${activeTabs.find(t=>t.id===activeTab).color}`} />;
                                    })()}
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    No {activeTabs.find(t=>t.id===activeTab).label} Logged
                                </h3>
                                <p className={`font-medium max-w-[200px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Tap the + button to start tracking your {activeTab}.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    </div>
  );
};

export default Logs;
