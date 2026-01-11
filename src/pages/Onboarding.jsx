import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiShield, FiActivity, FiSmile, FiLock, FiCheck, FiBarChart2, FiCalendar } from 'react-icons/fi';

const TrackIllustration = () => (
    <div className="relative w-full h-full flex items-center justify-center">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-32 h-40 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-3 relative z-10"
        >
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-2xl">📝</div>
            <div className="space-y-2">
                <motion.div 
                    initial={{ width: "20%" }} animate={{ width: "80%" }} transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full" 
                />
                <motion.div 
                    initial={{ width: "20%" }} animate={{ width: "60%" }} transition={{ delay: 0.7, duration: 0.8 }}
                    className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full" 
                />
                <motion.div 
                    initial={{ width: "20%" }} animate={{ width: "90%" }} transition={{ delay: 0.9, duration: 0.8 }}
                    className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full" 
                />
            </div>
            <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring" }}
                className="absolute -right-2 -top-2 bg-green-500 text-white p-1 rounded-full shadow-lg"
            >
                <FiCheck size={16} />
            </motion.div>
        </motion.div>
        
        {/* Floating elements */}
        <motion.div 
            animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-10 right-10 text-4xl"
        >
            ✨
        </motion.div>
    </div>
);

const GrowthIllustration = () => (
    <div className="relative w-full h-full flex items-end justify-center pb-12 gap-3 px-8">
        {[0.3, 0.45, 0.4, 0.6, 0.55, 0.85].map((height, i) => (
            <div key={i} className="relative h-full flex items-end group">
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: height * 70 + "%" }}
                    transition={{ delay: 0.2 + (i * 0.1), duration: 1, type: "spring", damping: 12 }}
                    className={`w-8 rounded-t-xl shadow-lg relative ${i === 5 ? 'bg-gradient-to-t from-indigo-500 to-purple-500 z-10' : 'bg-purple-200 dark:bg-purple-900/40'}`}
                >
                    {i === 5 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-300 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xl border border-purple-100 dark:border-purple-900 flex flex-col items-center min-w-[80px]"
                        >
                            <span className="text-xs">🔥 12 Days</span>
                            <span>Streak!</span>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 rotate-45 border-r border-b border-purple-100 dark:border-purple-900"></div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        ))}
        
        {/* Floating growth stats */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
            className="absolute top-12 left-8 bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2"
        >
             <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                 <FiBarChart2 size={14} />
             </div>
             <div>
                 <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Growth</div>
                 <div className="text-sm font-black text-gray-800 dark:text-white">+24%</div>
             </div>
        </motion.div>
    </div>
);

const SecurityIllustration = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center pt-8">
        <div className="relative">
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.1, 1] }}
                transition={{ duration: 0.5 }}
                className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10"
            >
                <FiShield size={64} />
                <motion.div
                    initial={{ opacity: 0, scale: 2 }}
                    animate={{ opacity: 0, scale: 1 }} // Pulse effect
                    className="absolute inset-0 border-4 border-emerald-500 rounded-full"
                />
            </motion.div>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-4 -right-4 z-20 bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800"
            >
                <FiLock size={24} className="text-emerald-500" />
            </motion.div>
        </div>

        {/* E2E Encryption Label */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-black/5 dark:bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-black/10 dark:border-white/10 flex items-center gap-2"
        >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">End-to-End Encryption</span>
        </motion.div>
        
        {/* Binary Rain Effect - Simplified */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none -z-10">
             {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 300, opacity: [0, 1, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                    className="absolute text-[10px] font-mono font-bold text-emerald-600 top-0"
                    style={{ left: `${15 + (i * 12)}%` }}
                >
                    101101
                </motion.div>
             ))}
        </div>
    </div>
);


const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    const slides = [
        {
            title: "Journal in Seconds",
            subtitle: "No more blank pages. Capture your day with quick prompts, mood tracking, and photos.",
            component: <TrackIllustration />,
            color: "bg-indigo-50 dark:bg-indigo-900/20",
        },
        {
            title: "Visualize Your Growth",
            subtitle: "Identify patterns in your mood and habits. Let data guide your personal development journey.",
            component: <GrowthIllustration />,
            color: "bg-purple-50 dark:bg-purple-900/20",
        },
        {
            title: "Private & Secure",
            subtitle: "Your thoughts are yours alone. We use End-to-End Encryption to ensure complete privacy.",
            component: <SecurityIllustration />,
            color: "bg-emerald-50 dark:bg-emerald-900/20",
            badge: "Encrypted Vault"
        }
    ];

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(prev => prev + 1);
        } else {
            navigate('/set-mpin');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white flex flex-col items-center justify-between p-6 relative overflow-hidden font-sans">
            
            {/* Background Animations */}
            <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                transition={{ duration: 20, repeat: Infinity }}
                className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -z-10"
            />
            <motion.div 
                animate={{ scale: [1, 1.3, 1], rotate: [0, -30, 0] }}
                transition={{ duration: 15, repeat: Infinity }}
                className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10"
            />

            {/* Top Bar */}
            <div className="w-full flex justify-between items-center p-2">
                <div className="flex gap-1">
                    {slides.map((_, i) => (
                        <motion.div 
                            key={i}
                            animate={{ 
                                width: step >= i ? 24 : 8,
                                opacity: step >= i ? 1 : 0.3
                            }}
                            className={`h-1.5 rounded-full ${step >= i ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                        />
                    ))}
                </div>
                <button 
                    onClick={() => navigate('/set-mpin')}
                    className="text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    Skip
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md my-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center text-center w-full"
                    >
                        {/* Illustration Container */}
                        <div className={`w-72 h-72 rounded-[3rem] ${slides[step].color} mb-12 overflow-hidden relative shadow-inner`}>
                            {slides[step].component}
                        </div>

                        {/* Text */}
                        <div className="space-y-4 px-4">
                            <h2 className="text-3xl font-black tracking-tight leading-tight">
                                {slides[step].title}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                                {slides[step].subtitle}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="w-full max-w-md pb-6">
                <button
                    onClick={handleNext}
                    className="group w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
                >
                    {step === slides.length - 1 ? (
                        <span>Start My Journey</span>
                    ) : (
                        <span>Continue</span>
                    )}
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
