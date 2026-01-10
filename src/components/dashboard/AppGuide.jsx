import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiChevronRight, FiChevronLeft, FiActivity, FiGrid, FiCalendar, FiPlus } from 'react-icons/fi';

const GuideStep = ({ title, description, icon, color }) => (
    <div className="flex flex-col items-center text-center p-6 space-y-6">
        <motion.div 
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`w-32 h-32 rounded-3xl ${color} flex items-center justify-center text-5xl shadow-xl`}
        >
            {icon}
        </motion.div>
        
        <div className="space-y-3">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">
                {description}
            </p>
        </div>
    </div>
);

const AppGuide = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Your Dashboard",
            description: "This is your home. See your weekly progress, streak, and quick mood check-ins all in one place.",
            icon: <FiGrid className="text-indigo-600 dark:text-indigo-300" />,
            color: "bg-indigo-100 dark:bg-indigo-900/40"
        },
        {
            title: "Log Your Day",
            description: "Tap the big '+' button to capture your day. Track habits, mood, weather, and write your story.",
            icon: <FiPlus className="text-amber-600 dark:text-amber-300" />,
            color: "bg-amber-100 dark:bg-amber-900/40"
        },
        {
            title: "Track Habits",
            description: "Visit the 'Habits' tab to see yourconsistency. Build streaks and watch your discipline grow.",
            icon: <FiActivity className="text-green-600 dark:text-green-300" />,
            color: "bg-green-100 dark:bg-green-900/40"
        },
        {
            title: "Monthly Review",
            description: "The 'Month' tab gives you a bird's-eye view of your year. Spot patterns and export your data.",
            icon: <FiCalendar className="text-purple-600 dark:text-purple-300" />,
            color: "bg-purple-100 dark:bg-purple-900/40"
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(prev => prev + 1);
        } else {
            onClose();
            // Reset for next time after a delay? Or keep on last?
            setTimeout(() => setStep(0), 500);
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(prev => prev - 1);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-[#1a1a1a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 flex flex-col min-h-[500px]"
                >
                    {/* Progress Bar */}
                    <div className="flex gap-1 p-2">
                        {steps.map((_, i) => (
                            <div 
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                            />
                        ))}
                    </div>

                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-20"
                    >
                        <FiX size={20} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center mt-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                <GuideStep {...steps[step]} />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="p-6 pt-0 flex items-center justify-between gap-4">
                        <button 
                            onClick={handlePrev}
                            disabled={step === 0}
                            className={`p-4 rounded-2xl transition-colors ${step === 0 ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
                        >
                            <FiChevronLeft size={24} />
                        </button>

                        <button 
                            onClick={handleNext}
                            className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            {step === steps.length - 1 ? (
                                <>Got it <FiCheck /></>
                            ) : (
                                <>Next <FiChevronRight /></>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default AppGuide;
