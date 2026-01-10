import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { 
    format, 
    startOfYear, 
    eachMonthOfInterval, 
    endOfYear, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    getDay, 
    isSameDay,
    parseISO,
    addYears,
    subYears
} from 'date-fns';

const ImportantDatesCalendarModal = ({ isOpen, onClose, events = [] }) => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    if (!isOpen) return null;

    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    // Helper to check if a day has an event
    const getEventsForDay = (day) => {
        return events.filter(e => {
            if (!e.date) return false;
            // Handle recurrent events? For now assume exact date match or match Month/Day for birthdays if we wanted smart logic, but prompt implies simple date marking.
            // Actually, birthdays usually recur. But let's stick to the stored date first.
            // If the user adds "2026-01-10", it shows on 2026-01-10.
            return isSameDay(parseISO(e.date), day);
        });
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-[#121212] w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative z-10"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#121212]">
                        <div className="flex items-center gap-4">
                             <h2 className="text-3xl font-black text-gray-900 dark:text-white">Important Dates</h2>
                             <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button onClick={() => setCurrentYear(p => p - 1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all text-gray-600 dark:text-gray-300"><FiChevronLeft /></button>
                                <span className="font-bold text-lg w-16 text-center text-gray-900 dark:text-white">{currentYear}</span>
                                <button onClick={() => setCurrentYear(p => p + 1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all text-gray-600 dark:text-gray-300"><FiChevronRight /></button>
                             </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FiX size={24} />
                        </button>
                    </div>

                    {/* Content - Year Grid */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA] dark:bg-[#0a0a0a]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {months.map(month => {
                                const daysInMonth = eachDayOfInterval({
                                    start: startOfMonth(month),
                                    end: endOfMonth(month)
                                });
                                const startDay = getDay(startOfMonth(month)); // 0 = Sunday

                                return (
                                    <div key={month.toString()} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 text-center border-b border-gray-100 dark:border-gray-800 pb-2">
                                            {format(month, 'MMMM')}
                                        </h3>
                                        
                                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                            {['S','M','T','W','T','F','S'].map(d => (
                                                <span key={d} className="text-[10px] font-bold text-gray-400 dark:text-gray-600">{d}</span>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {[...Array(startDay)].map((_, i) => <div key={`empty-${i}`} />)}
                                            {daysInMonth.map(day => {
                                                const dayEvents = getEventsForDay(day);
                                                const hasEvent = dayEvents.length > 0;
                                                // Check event types for colors
                                                const isBirthday = dayEvents.some(e => e.type === 'Birthday');
                                                const isCustom = dayEvents.some(e => e.type === 'Custom');
                                                
                                                let bgClass = '';
                                                if (hasEvent) {
                                                    if (isBirthday) bgClass = 'bg-pink-500 text-white shadow-md shadow-pink-200 dark:shadow-none';
                                                    else if (isCustom) bgClass = 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-none';
                                                    else bgClass = 'bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-none';
                                                } else {
                                                    bgClass = 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
                                                }

                                                return (
                                                    <div 
                                                        key={day.toString()} 
                                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold relative group cursor-default transition-transform ${bgClass}`}
                                                    >
                                                        {format(day, 'd')}
                                                        {hasEvent && (
                                                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-black text-white text-[10px] p-2 rounded-lg whitespace-nowrap">
                                                                {dayEvents.map((e, i) => <div key={i}>{e.text}</div>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ImportantDatesCalendarModal;
