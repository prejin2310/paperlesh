import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck, FiChevronRight, FiChevronLeft, FiStar } from 'react-icons/fi';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MOODS = ['Fantastic', 'Happy', 'Romantic', 'Normal', 'Tired', 'Stressed', 'Sad', 'Angry'];
const MOOD_EMOJIS = ['🤩', '🙂', '🥰', '😐', '😴', '😫', '😭', '😡'];

// Updated Weather options
const WEATHER_OPTIONS = [
  { label: 'Sunny', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { label: 'Partly Cloudy', color: 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300' },
  { label: 'Cloudy', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  { label: 'Stormy', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { label: 'Rainy', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
  { label: 'Cold', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { label: 'Hot', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' }
];

const STEPS_OPTIONS = ['1k - 2.5K', '2.5k-5k', '5k-10k', '>10k'];

// Updated Habits list logic will be handled via state
const DEFAULT_HABITS = ['Workout', 'Skin Care', 'Wake up early', 'Meditation'];

const SPEND_OPTIONS = ['0', '<500', '<1000', '<2500', '<5000', '>5000'];

const DailyLogModal = ({ isOpen, onClose, date, initialData, onSave }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    note: '',
    mood: 3, // Default to Normal (index 3)
    rating: 3,
    spend: '0',
    steps: '1k - 2.5K',
    sleep: 7,
    weather: [],
    
    // Habits & Stats
    habits: [],
    water: '',
    screenTime: '',
    longNote: '',

    // Questions
    ateOutside: false,
    watchedMovie: false,
    movieData: {
      name: '',
      platform: 'OTT', // OTT or Theatre
      rating: 0,
      theatreLocation: '',
      withWhom: ''
    },
    
    readBook: false,
    bookData: {
      name: '',
      genre: '',
      author: '',
      rating: 0
    }
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1); // Reset to first step
      if (initialData) {
        setFormData({
            note: initialData.note || '',
            mood: initialData.mood !== undefined ? initialData.mood : 3,
            rating: initialData.rating || 3,
            spend: initialData.spend !== undefined ? initialData.spend : '0',
            steps: initialData.steps || '1k - 2.5K',
            sleep: initialData.sleep || 7,
            weather: initialData.weather || [],
            
            habits: initialData.habits || [],
            water: initialData.water || '',
            screenTime: initialData.screenTime || '',
            longNote: initialData.longNote || '',

            ateOutside: initialData.ateOutside || false,
            watchedMovie: initialData.watchedMovie || false,
            movieData: initialData.movieData || { name: '', platform: 'OTT', rating: 0, theatreLocation: '', withWhom: '' },
            readBook: initialData.readBook || false,
            bookData: initialData.bookData || { name: '', genre: '', author: '', rating: 0 },
        });
      } else {
        // Reset defaults
        setFormData({
            note: '',
            mood: 3,
            rating: 3,
            spend: '0',
            steps: '1k - 2.5K',
            sleep: 7,
            weather: [],
            habits: [],
            water: '',
            screenTime: '',
            longNote: '',
            ateOutside: false,
            watchedMovie: false,
            movieData: { name: '', platform: 'OTT', rating: 0, theatreLocation: '', withWhom: '' },
            readBook: false,
            bookData: { name: '', genre: '', author: '', rating: 0 },
        });
      }
    }
  }, [isOpen, initialData]);

  const toggleWeather = (w) => {
    setFormData(prev => {
        const current = prev.weather;
        if (current.includes(w)) {
            return { ...prev, weather: current.filter(i => i !== w) };
        }
        if (current.length >= 2) return prev; // Max 2
        return { ...prev, weather: [...current, w] };
    });
  };

  const toggleHabit = (h) => {
    setFormData(prev => ({
        ...prev,
        habits: prev.habits.includes(h) 
            ? prev.habits.filter(i => i !== h)
            : [...prev.habits, h]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const logData = {
        ...formData,
        date: date,
        updatedAt: new Date().toISOString()
      };

      const logRef = doc(db, 'users', currentUser.uid, 'logs', date);
      await setDoc(logRef, logData, { merge: true });
      
      toast.success('Log saved successfully!');
      onSave(logData); 
      onClose();
    } catch (error) {
      console.error('Error saving log:', error);
      toast.error('Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />

      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#FDFBF9] dark:bg-gray-900 w-full max-w-xl md:rounded-[2rem] rounded-t-[2rem] shadow-2xl pointer-events-auto h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-20">
            <div>
                 <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    {step === 1 && "Daily Overview"}
                    {step === 2 && "Habits & Health"}
                    {step === 3 && "Reflections"}
                 </h2>
                 <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">Step {step} of {totalSteps}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#FDFBF9] dark:bg-gray-900">
            <AnimatePresence mode='wait'>
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Highlight */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Highlight of the day</label>
                            <input 
                                value={formData.note}
                                onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                placeholder="How was your day in one line?"
                                className="w-full bg-white dark:bg-gray-800 border-none rounded-2xl p-4 text-base font-semibold text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                            />
                        </div>

                         {/* Rating & Mood */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-orange-400">Day Rating</label>
                                <div className="flex justify-between px-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setFormData(prev => ({ ...prev, rating: s }))}
                                            className="transition-transform active:scale-90"
                                        >
                                            <FiStar 
                                                className={`w-8 h-8 ${
                                                    formData.rating >= s ? 'fill-orange-400 text-orange-400' : 'text-gray-200 dark:text-gray-700'
                                                }`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400">Mood</label>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {MOODS.map((m, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setFormData(prev => ({ ...prev, mood: i }))}
                                            title={m}
                                            className={`text-2xl transition-transform p-1 rounded-lg ${
                                                formData.mood === i ? 'bg-blue-50 scale-125' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                                            }`}
                                        >
                                            {MOOD_EMOJIS[i]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                         </div>

                         {/* Spend & Steps */}
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Spend</label>
                                <select 
                                    value={formData.spend}
                                    onChange={e => setFormData(prev => ({ ...prev, spend: e.target.value }))}
                                    className="w-full bg-white dark:bg-gray-800 rounded-2xl py-4 px-4 font-bold text-gray-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 appearance-none"
                                >
                                    {SPEND_OPTIONS.map(opt => <option key={opt} value={opt} className="dark:bg-gray-800">{opt}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Steps</label>
                                <select 
                                    value={formData.steps}
                                    onChange={e => setFormData(prev => ({ ...prev, steps: e.target.value }))}
                                    className="w-full bg-white dark:bg-gray-800 rounded-2xl py-4 px-4 font-bold text-gray-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 appearance-none"
                                >
                                    {STEPS_OPTIONS.map(opt => <option key={opt} value={opt} className="dark:bg-gray-800">{opt}</option>)}
                                </select>
                            </div>
                         </div>

                        {/* Weather */}
                        <div className="space-y-2">
                             <div className="flex justify-between">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Weather (Max 2)</label>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {WEATHER_OPTIONS.map((w) => {
                                    const isSelected = formData.weather.includes(w.label);
                                    return (
                                        <button
                                            key={w.label}
                                            onClick={() => toggleWeather(w.label)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                                                isSelected 
                                                ? `${w.color} border-transparent shadow-sm scale-105` 
                                                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-transparent hover:border-gray-100 dark:hover:border-gray-700'
                                            }`}
                                        >
                                            {w.label}
                                        </button>
                                    )
                                })}
                             </div>
                        </div>

                        {/* Sleep Slider */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">Sleep</label>
                                <span className="text-2xl font-black text-indigo-900 dark:text-indigo-400">{formData.sleep} <span className="text-sm text-gray-400 dark:text-gray-500 font-bold">hrs</span></span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="12" 
                                step="0.5"
                                value={formData.sleep}
                                onChange={e => setFormData(prev => ({ ...prev, sleep: parseFloat(e.target.value) }))}
                                className="w-full accent-indigo-500 h-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                                <span>1h</span>
                                <span>12h</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-6"
                    >
                         {/* Default Habits */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Daily Habits</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {DEFAULT_HABITS.map(habit => (
                                    <button
                                        key={habit}
                                        onClick={() => toggleHabit(habit)}
                                        className={`p-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all ${
                                            formData.habits.includes(habit)
                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {habit}
                                        {formData.habits.includes(habit) && <FiCheck />}
                                    </button>
                                ))}
                            </div>
                            <button className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 block w-full text-center py-2">
                                + Add/Edit Habits in Profile
                            </button>
                        </div>

                        {/* Water & Screen Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400">Water</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={formData.water}
                                        onChange={e => setFormData(prev => ({ ...prev, water: e.target.value }))}
                                        className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">L</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-purple-400">Screen Time</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={formData.screenTime}
                                        onChange={e => setFormData(prev => ({ ...prev, screenTime: e.target.value }))}
                                        className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">H</span>
                                </div>
                            </div>
                        </div>

                         {/* Long Note */}
                         <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Daily Journal</label>
                            <textarea
                                value={formData.longNote}
                                onChange={e => setFormData(prev => ({ ...prev, longNote: e.target.value }))}
                                placeholder="Pour your thoughts here..."
                                className="w-full bg-white dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none resize-none h-40 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white leading-relaxed"
                            />
                         </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-8"
                    >
                         {/* Outside Food */}
                         <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                            <span className="font-bold text-gray-900 dark:text-white">Did you eat outside today?</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, ateOutside: true }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.ateOutside ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >Yes</button>
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, ateOutside: false }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!formData.ateOutside ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >No</button>
                            </div>
                         </div>

                         {/* Movie / Series */}
                         <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                                <span className="font-bold text-gray-900 dark:text-white">Detailed Review: Watched anything?</span>
                                 <div className="flex gap-2">
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, watchedMovie: true }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.watchedMovie ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >Yes</button>
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, watchedMovie: false }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!formData.watchedMovie ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >No</button>
                            </div>
                            </div>
                            {formData.watchedMovie && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    <input placeholder="Movie / Series Name" className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl text-sm font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                        value={formData.movieData.name} onChange={e => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, name: e.target.value } }))}
                                    />
                                    <div className="flex gap-2">
                                        {['OTT', 'Theatre'].map(p => (
                                            <button key={p} onClick={() => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, platform: p } }))}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold ${formData.movieData.platform === p ? 'bg-purple-100 text-purple-600' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>{p}</button>
                                        ))}
                                    </div>
                                    {/* Additional fields for Theatre */}
                                    {formData.movieData.platform === 'Theatre' && (
                                        <div className="grid grid-cols-2 gap-2">
                                             <input placeholder="Where?" className="bg-white dark:bg-gray-800 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                                value={formData.movieData.theatreLocation} onChange={e => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, theatreLocation: e.target.value } }))}
                                             />
                                             <input placeholder="With whom?" className="bg-white dark:bg-gray-800 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                                 value={formData.movieData.withWhom} onChange={e => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, withWhom: e.target.value } }))}
                                             />
                                        </div>
                                    )}
                                     <input type="number" placeholder="Rating (1-10)" className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                        value={formData.movieData.rating} onChange={e => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, rating: e.target.value } }))}
                                     />
                                </motion.div>
                            )}
                         </div>

                         {/* Book */}
                         <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                                <span className="font-bold text-gray-900 dark:text-white">Detailed Review: Read a book?</span>
                                 <div className="flex gap-2">
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, readBook: true }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.readBook ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >Yes</button>
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, readBook: false }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!formData.readBook ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >No</button>
                            </div>
                            </div>
                            {formData.readBook && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    <input placeholder="Book Name" className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl text-sm font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                        value={formData.bookData.name} onChange={e => setFormData(prev => ({ ...prev, bookData: { ...prev.bookData, name: e.target.value } }))}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input placeholder="Author" className="bg-white dark:bg-gray-800 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                            value={formData.bookData.author} onChange={e => setFormData(prev => ({ ...prev, bookData: { ...prev.bookData, author: e.target.value } }))}
                                        />
                                        <input placeholder="Genre" className="bg-white dark:bg-gray-800 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                            value={formData.bookData.genre} onChange={e => setFormData(prev => ({ ...prev, bookData: { ...prev.bookData, genre: e.target.value } }))}
                                        />
                                    </div>
                                    <input type="number" placeholder="Rating (1-5)" className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                        value={formData.bookData.rating} onChange={e => setFormData(prev => ({ ...prev, bookData: { ...prev.bookData, rating: e.target.value } }))}
                                    />
                                </motion.div>
                            )}
                         </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex gap-4 z-20">
            {step > 1 && (
                <button 
                    onClick={prevStep}
                    className="px-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Back
                </button>
            )}
            
            {step < totalSteps ? (
                <button 
                    onClick={nextStep}
                    className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl shadow-gray-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                    Next Step <FiChevronRight />
                </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-4 bg-[#8B93FF] text-white rounded-2xl font-bold shadow-xl shadow-[#8B93FF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {loading ? 'Saving Entry...' : 'Save Today\'s Log'}
                </button>
            )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default DailyLogModal;
