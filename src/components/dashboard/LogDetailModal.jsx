import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit2, FiStar, FiCalendar, FiActivity, FiMoon, FiDollarSign, FiSmile, FiDroplet, FiMonitor, FiSun, FiBook, FiFilm, FiLayout, FiCoffee } from 'react-icons/fi';
import { format } from 'date-fns';

const MOODS = [
    { emoji: '😊', label: 'Happy', color: 'bg-yellow-400' },
    { emoji: '🤩', label: 'Fantastic', color: 'bg-amber-400' },
    { emoji: '🥰', label: 'Romantic', color: 'bg-pink-400' },
    { emoji: '😐', label: 'Normal', color: 'bg-emerald-300' },
    { emoji: '😫', label: 'Stressed', color: 'bg-orange-500' },
    { emoji: '😴', label: 'Tired', color: 'bg-purple-300' },
    { emoji: '😠', label: 'Angry', color: 'bg-red-600' },
    { emoji: '😢', label: 'Sad', color: 'bg-blue-400' }
];

const LogDetailModal = ({ isOpen, onClose, date, data, onEdit }) => {
    if (!isOpen || !data) return null;

    const formattedDate = date ? format(new Date(date), 'EEEE, MMMM do, yyyy') : '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
                className="relative bg-white dark:bg-[#111] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <FiCalendar size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">{date}</span>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                            {formattedDate}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content Scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Primary Stats Row */}
                    <div className="flex gap-4">
                        {/* Rating */}
                        <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-yellow-100 dark:border-yellow-900/30">
                            <span className="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-500 tracking-wider">Rating</span>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <span className="text-3xl font-black">{data.rating || '-'}</span>
                                <FiStar className="fill-current" />
                            </div>
                        </div>

                        {/* Mood */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Mood</span>
                            {data.mood !== undefined && data.mood !== null ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl">{MOODS[data.mood]?.emoji}</span>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-1">{MOODS[data.mood]?.label}</span>
                                </div>
                            ) : (
                                <span className="text-gray-300">-</span>
                            )}
                        </div>
                    </div>

                    {/* Weather */}
                    {data.weather && data.weather.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {data.weather.map(w => (
                                <div key={w} className="px-3 py-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 rounded-full text-xs font-bold flex items-center gap-1">
                                    <FiSun size={12} /> {w}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl flex flex-col items-center gap-1">
                            <FiActivity className="text-blue-500" />
                            <span className="text-[10px] font-bold uppercase text-blue-400">Steps</span>
                            <span className="font-bold text-sm">{data.steps || '-'}</span>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-2xl flex flex-col items-center gap-1">
                            <FiMoon className="text-purple-500" />
                            <span className="text-[10px] font-bold uppercase text-purple-400">Sleep</span>
                            <span className="font-bold text-sm">{data.sleep ? `${data.sleep}h` : '-'}</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl flex flex-col items-center gap-1">
                            <FiDollarSign className="text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase text-emerald-400">Spend</span>
                            <span className="font-bold text-sm">{data.spend === '0' ? 'No Spend' : (data.spend || '-')}</span>
                        </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-2 gap-2">
                         {data.water && (
                             <div className="bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded-2xl flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-cyan-900/30 rounded-full text-cyan-500">
                                    <FiDroplet size={14} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-cyan-400 block">Water</span>
                                    <span className="font-bold text-sm">{data.water}L</span>
                                </div>
                             </div>
                         )}
                         {data.screenTime && (
                             <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-2xl flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-indigo-900/30 rounded-full text-indigo-500">
                                    <FiMonitor size={14} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-indigo-400 block">Screen Time</span>
                                    <span className="font-bold text-sm">{data.screenTime}h</span>
                                </div>
                             </div>
                         )}
                    </div>
                    
                    {/* Activities */}
                    {(data.ateOutside || data.watchedMovie || data.readBook) && (
                        <div>
                             <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Activities</h3>
                             <div className="space-y-2">
                                {data.ateOutside && (
                                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
                                        <FiCoffee className="text-orange-500" />
                                        <span className="text-sm font-medium">Ate Outside</span>
                                    </div>
                                )}
                                {data.watchedMovie && (
                                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                        <FiFilm className="text-red-500" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Watched: {data.movieData?.name || 'Movie'}</span>
                                            {data.movieData?.platform && <span className="text-xs text-red-400">{data.movieData.platform}</span>}
                                        </div>
                                    </div>
                                )}
                                {data.readBook && (
                                    <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/10 rounded-xl">
                                        <FiBook className="text-teal-500" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Read: {data.bookData?.name || 'Book'}</span>
                                            {data.bookData?.author && <span className="text-xs text-teal-400">by {data.bookData.author}</span>}
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                     {/* Habits */}
                     {data.habits && data.habits.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Completed Habits</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.habits.map(habit => (
                                    <span key={habit} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                                        {habit}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {(data.note || data.longNote) && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Notes</h3>
                            {data.longNote && (
                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-2">
                                    {data.longNote}
                                </p>
                            )}
                             {data.note && (
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 italic">
                                    "{data.note}"
                                </p>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0">
                    <button 
                        onClick={onEdit}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                        <FiEdit2 size={16} /> Edit Entry
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default LogDetailModal;