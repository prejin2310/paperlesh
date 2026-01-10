import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  parseISO, 
  getDay,
  isToday,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FiChevronLeft, FiChevronRight, FiPlus, FiCalendar, FiClock, FiTrash2, FiEdit2, FiGrid, FiList, FiBriefcase, FiGift, FiHeart, FiBookmark, FiStar, FiLayout, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl max-w-xs w-full shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-lg mb-2 dark:text-white">Delete Event?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold text-sm">Cancel</button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm">Delete</button>
            </div>
        </div>
    </div>
);

const ImportantDates = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    // State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date()); // For month view navigation
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('strip'); // 'strip' or 'month'
    const [eventToDelete, setEventToDelete] = useState(null);

    // Scroll ref for strip
    const stripRef = useRef(null);

    // Fetch Events
    useEffect(() => {
        const fetchEvents = async () => {
            if (!currentUser) return;
            try {
                const docRef = doc(db, 'users', currentUser.uid, 'tools', 'important_dates');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEvents(docSnap.data().items || []);
                }
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [currentUser]);

    // Derived State
    const eventsForSelectedDay = events.filter(e => e.date && isSameDay(parseISO(e.date), selectedDate));
    eventsForSelectedDay.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calendar Data
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    // Strip Data (Dynamic window around selected date or just current month days)
    // We will show current week + next 2 weeks for context in strip, or just a static range
    // Better: Show the whole current month in strip mode too, but scroll to selected
    
    // Auto-scroll strip to selected date
    useEffect(() => {
        if (viewMode === 'strip' && stripRef.current) {
             const selectedBtn = stripRef.current.querySelector('[data-selected="true"]');
             if (selectedBtn) {
                 selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
             }
        }
    }, [selectedDate, viewMode]);

    const handleDelete = (eventId) => {
        setEventToDelete(eventId);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            const updatedEvents = events.filter(e => e.id !== eventToDelete);
            setEvents(updatedEvents);
            await setDoc(doc(db, 'users', currentUser.uid, 'tools', 'important_dates'), { items: updatedEvents }, { merge: true });
            toast.success('Event deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete');
        } finally {
            setEventToDelete(null);
        }
    };

    // Minimalist Category Icons
    const CATEGORY_ICONS = {
        'Birthday': { icon: <FiGift />, color: 'text-rose-500' },
        'Anniversary': { icon: <FiHeart />, color: 'text-pink-500' },
        'Remember': { icon: <FiBookmark />, color: 'text-yellow-500' },
        'Custom': { icon: <FiStar />, color: 'text-indigo-500' },
        'Meeting': { icon: <FiBriefcase />, color: 'text-orange-500' },
        'Design': { icon: <FiLayout />, color: 'text-emerald-500' },
        'default': { icon: <FiCheckCircle />, color: 'text-gray-400' }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#000000] text-gray-900 dark:text-white flex flex-col items-center">
            
            <AnimatePresence>
                {eventToDelete && (
                    <DeleteConfirmModal 
                        onConfirm={confirmDelete}
                        onCancel={() => setEventToDelete(null)}
                    />
                )}
            </AnimatePresence>

            <div className="w-full max-w-md flex flex-col h-screen relative">
                
                {/* Header Section */}
                <div className="pt-10 pb-4 px-8 bg-white dark:bg-[#000000] z-10 sticky top-0">
                    {/* Top Row: Navigation + Toggle */}
                    <div className="flex justify-between items-start mb-6">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            <FiChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={() => setViewMode(prev => prev === 'strip' ? 'month' : 'strip')}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {viewMode === 'strip' ? <FiCalendar size={24} /> : <FiList size={24} />}
                        </button>
                    </div>

                    {/* Date Formatting Style */}
                    <div className="flex justify-between items-end">
                        <div className="flex items-start gap-3">
                            <h1 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                                {format(selectedDate, 'EEE')}
                            </h1>
                             <h1 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-none opacity-30">
                                {format(selectedDate, 'd')}
                            </h1>
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 animate-pulse" />
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 dark:text-gray-500 font-medium text-sm uppercase tracking-wide">
                                {format(selectedDate, 'MMM d yyyy')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calendar View (Strip or Grid) */}
                <div className="bg-white dark:bg-[#000000]">
                    {viewMode === 'strip' ? (
                        /* Horizontal Strip */
                        <div 
                            ref={stripRef}
                            className="flex overflow-x-auto no-scrollbar gap-4 px-8 py-4 snap-x"
                        >
                           {/* Show prev/next days context roughly +/- 15 days from selected */}
                           {eachDayOfInterval({ 
                               start: subDays(selectedDate, 10), 
                               end: addDays(selectedDate, 14) 
                           }).map((day, i) => {
                               const isSelected = isSameDay(day, selectedDate);
                               const dayEvents = events.filter(e => e.date && isSameDay(parseISO(e.date), day));
                               const hasEvents = dayEvents.length > 0;

                               return (
                                   <button
                                       key={day.toISOString()}
                                       data-selected={isSelected}
                                       onClick={() => setSelectedDate(day)}
                                       className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl snap-center transition-all duration-300
                                            ${isSelected 
                                                ? 'bg-gray-100 dark:bg-[#1C1C1E] shadow-sm transform scale-110' 
                                                : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'}
                                       `}
                                   >
                                       <span className={`text-xl font-bold mb-1 ${isSelected ? 'text-gray-900 dark:text-white' : 'font-medium'}`}>
                                           {format(day, 'd')}
                                       </span>
                                       <span className="text-[10px] font-bold uppercase tracking-widest">
                                           {format(day, 'EEE')}
                                       </span>
                                       {hasEvents && !isSelected && (
                                           <div className="w-1 h-1 bg-red-500 rounded-full mt-1" />
                                       )}
                                   </button>
                               );
                           })}
                        </div>
                    ) : (
                        /* Full Month Grid (Original Style) */
                        <div className="px-6 pb-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><FiChevronLeft /></button>
                                <span className="font-bold">{format(currentMonth, 'MMMM yyyy')}</span>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><FiChevronRight /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-y-4 text-center">
                                {['M','T','W','T','F','S','S'].map(d => <span key={d} className="text-xs text-gray-400 font-bold">{d}</span>)}
                                {[...Array(startDayOfWeek === 0 ? 6 : startDayOfWeek - 1)].map((_, i) => <div key={`e-${i}`} />)}
                                {monthDays.map(day => {
                                    const isSel = isSameDay(day, selectedDate);
                                    const hasEvt = events.some(e => e.date && isSameDay(parseISO(e.date), day));
                                    return (
                                        <button 
                                            key={day.toISOString()}
                                            onClick={() => { setSelectedDate(day); setViewMode('strip'); }}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto text-sm font-bold relative
                                                ${isSel ? 'bg-red-500 text-white' : 'text-gray-700 dark:text-gray-300'}
                                            `}
                                        >
                                            {format(day, 'd')}
                                            {hasEvt && !isSel && <div className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full h-px bg-gray-100 dark:bg-gray-900 my-2" />

                {/* Events List (Design Match) */}
                <div className="flex-1 overflow-y-auto px-8 py-4">
                     {eventsForSelectedDay.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-48 opacity-30">
                             <span className="text-6xl mb-4 grayscale">🌱</span>
                             <p className="font-bold text-gray-400">No events</p>
                         </div>
                     ) : (
                         <div className="flex flex-col gap-6">
                             {eventsForSelectedDay.map((event, idx) => {
                                 const style = CATEGORY_ICONS[event.type] || CATEGORY_ICONS['default'];
                                 // Add a fake time if description has one, otherwise random or default
                                 const timeDisplay = event.description?.match(/\d{2}:\d{2}/)?.[0] || '';

                                 return (
                                     <motion.div 
                                        key={event.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group"
                                     >
                                         <div className="flex items-center gap-5 py-3">
                                             {/* Icon */}
                                             <div className={`text-xl ${style.color}`}>
                                                 {style.icon}
                                             </div>
                                             
                                             {/* Content */}
                                             <div 
                                                className="flex-1 cursor-pointer"
                                                onClick={() => navigate(`/create-event?id=${event.id}`)}
                                             >
                                                 <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                     {event.text}
                                                 </h3>
                                                 {event.description && !timeDisplay && (
                                                     <p className="text-xs text-gray-400 mt-1 line-clamp-1">{event.description}</p>
                                                 )}
                                             </div>

                                             {/* Time / Action */}
                                             <div className="text-right flex items-center gap-0">
                                                 {timeDisplay && (
                                                     <span className="text-gray-400 font-bold text-sm mr-3">{timeDisplay}</span>
                                                 )}
                                                 
                                                 <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/create-event?id=${event.id}`); }}
                                                    className="p-2 text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                                                    title="Edit"
                                                 >
                                                     <FiEdit2 size={16} />
                                                 </button>

                                                 <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                 >
                                                     <FiTrash2 size={16} />
                                                 </button>
                                             </div>
                                         </div>
                                         {/* Dotted Separator */}
                                         <div className="border-b-2 border-dotted border-gray-100 dark:border-gray-800 w-full" />
                                     </motion.div>
                                 );
                             })}
                         </div>
                     )}
                </div>

                {/* Floating Add Button */}
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/create-event?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
                    className="fixed bottom-24 right-8 md:absolute md:bottom-8 md:right-8 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center z-50"
                >
                    <FiPlus size={24} />
                </motion.button>
            </div>
        </div>
    );
};

export default ImportantDates;
