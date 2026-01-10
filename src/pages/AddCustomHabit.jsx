import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiType, FiHash, FiActivity, FiSmile, FiDroplet, FiBook, FiCode, FiCoffee, FiMusic, FiSun, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const TRACKER_TYPES = [
    { id: 'boolean', label: 'Yes / No', icon: FiCheck, desc: 'Simple completion tracking' },
    { id: 'count', label: 'Counter', icon: FiHash, desc: 'Track number of times' },
    { id: 'scale', label: 'Scale 1-5', icon: FiActivity, desc: 'Rate intensity or quality' },
    { id: 'text', label: 'Short Text', icon: FiType, desc: 'Brief notes or inputs' },
];

const ICONS = [
    { id: 'smile', icon: FiSmile },
    { id: 'drop', icon: FiDroplet },
    { id: 'book', icon: FiBook },
    { id: 'code', icon: FiCode },
    { id: 'coffee', icon: FiCoffee },
    { id: 'music', icon: FiMusic },
    { id: 'sun', icon: FiSun },
    { id: 'moon', icon: FiMoon },
    { id: 'check', icon: FiCheck },
];

const COLORS = [
    'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-800'
];

const AddCustomHabit = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [question, setQuestion] = useState('');
    const [type, setType] = useState('boolean');
    const [selectedIcon, setSelectedIcon] = useState('smile');
    const [selectedColor, setSelectedColor] = useState('bg-black');

    const handleSave = () => {
        if (!name.trim()) return toast.error("Please name your habit");
        
        // Save logic to Firestore would go here
        // For now, we simulate success
        
        toast.success("Custom Tracker Created!");
        navigate(-1);
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#F6F5F2] dark:bg-[#0a0a0a] transition-colors duration-500 pt-6 pb-24 px-4">
            
            {/* Ambient Background Animation - Scaled Down */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3], 
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-10 -left-10 w-72 h-72 bg-amber-200/40 dark:bg-amber-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-3xl"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.6, 0.3],
                        x: [0, -30, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-20 -right-10 w-60 h-60 bg-rose-200/40 dark:bg-rose-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-3xl"
                />
            </div>

            <div className="relative z-10 max-w-md mx-auto space-y-5">
                {/* Glassy Header - Compact */}
                <div className="flex items-center gap-3 mb-1">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-full border border-white/50 dark:border-gray-700 shadow-sm hover:scale-105 transition-all text-gray-800 dark:text-white"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">New Tracker</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-xs">Design your habit</p>
                    </div>
                </div>

                {/* 1. Name Section - Compact Glass Card */}
                <section className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl p-5 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-white/50 dark:border-gray-700 relative overflow-hidden group">
                    <div className="relative z-10">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">What to track?</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Meditation" 
                            className="w-full text-xl font-black bg-transparent border-b-2 border-gray-200 dark:border-gray-700 pb-1 outline-none focus:border-black dark:focus:border-white transition-colors placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white"
                            autoFocus
                        />
                        <input 
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Prompt Question? (Optional)" 
                            className="w-full mt-3 text-sm font-medium bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-600 dark:text-gray-300"
                        />
                    </div>
                </section>

                {/* 2. Type Selection - Compact Grid */}
                <section>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 block ml-4">Tracker Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        {TRACKER_TYPES.map((t) => {
                            const Icon = t.icon;
                            const isSelected = type === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setType(t.id)}
                                    className={`p-3 rounded-2xl flex items-center gap-3 transition-all text-left border ${
                                        isSelected 
                                        ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-lg scale-[1.01]' 
                                        : 'bg-white/60 dark:bg-gray-800/40 backdrop-blur-md border-white/50 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-full w-fit ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm leading-tight">{t.label}</div>
                                        <div className={`text-[9px] uppercase font-bold tracking-wide opacity-70`}>{t.desc.split(' ')[0]}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 3. Style Selection - Compact */}
                <section className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl p-5 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-white/50 dark:border-gray-700">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 block">Customize Look</label>
                    
                    {/* Icons */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
                        {ICONS.map((iconOpt) => {
                            const Icon = iconOpt.icon;
                            const isSelected = selectedIcon === iconOpt.id;
                            return (
                                <button
                                    key={iconOpt.id}
                                    onClick={() => setSelectedIcon(iconOpt.id)}
                                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                        isSelected 
                                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg scale-110' 
                                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <Icon size={18} />
                                </button>
                            )
                        })}
                    </div>

                    {/* Colors */}
                     <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1 pl-1">
                        {COLORS.map((color) => {
                            const isSelected = selectedColor === color;
                            return (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`flex-shrink-0 w-8 h-8 rounded-full transition-all ${color} ${isSelected ? 'ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-600 scale-110 shadow-lg' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                />
                            )
                        })}
                    </div>
                </section>

                {/* Preview */}
                <div className="relative">
                    <label className="absolute -top-2 left-6 px-2 bg-[#F6F5F2] dark:bg-black text-[9px] font-bold uppercase tracking-widest text-gray-400 z-20">Preview Card</label>
                    <motion.div 
                        layout
                        className="p-4 rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-xl shadow-gray-200/50 dark:shadow-none"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-[0.8rem] ${selectedColor} flex items-center justify-center text-white shadow-lg shadow-gray-300 dark:shadow-none`}>
                                <FiActivity size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">{name || 'Tracker Name'}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{type}</p>
                            </div>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-full text-[10px] font-bold text-gray-400 border border-gray-100 dark:border-gray-800">
                            Updates Daily
                        </div>
                    </motion.div>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full py-4 bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black rounded-[2rem] font-black text-base shadow-2xl shadow-gray-400/50 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Create Tracker
                </button>

            </div>
        </div>
    );
};

export default AddCustomHabit;
