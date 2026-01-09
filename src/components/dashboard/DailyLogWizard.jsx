import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiChevronRight, FiChevronLeft, FiStar, FiSun, FiCloud, FiCloudRain, FiCloudLightning, FiDroplet, FiWind, FiThermometer, FiShoppingBag, FiPlus, FiMinus, FiActivity } from 'react-icons/fi';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MOODS = [
    { emoji: '🙂', label: 'Happy' },
    { emoji: '🤩', label: 'Fantastic' },
    { emoji: '🥰', label: 'Romantic' },
    { emoji: '😐', label: 'Normal' },
    { emoji: '😫', label: 'Stressed' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😠', label: 'Angry' },
    { emoji: '😢', label: 'Sad' }
];

const WEATHER_OPTIONS = [
  { label: 'Sunny', color: 'bg-yellow-100 text-yellow-600', icon: FiSun },
  { label: 'Cloudy', color: 'bg-gray-100 text-gray-600', icon: FiCloud },
  { label: 'Stormy', color: 'bg-indigo-100 text-indigo-600', icon: FiCloudLightning },
  { label: 'Rainy', color: 'bg-blue-100 text-blue-600', icon: FiCloudRain },
  { label: 'Cold', color: 'bg-cyan-50 text-cyan-600', icon: FiWind },
  { label: 'Hot', color: 'bg-orange-100 text-orange-600', icon: FiThermometer }
];

const STEPS_OPTIONS = ['<1000', '1k-2.5k', '2.5k-5k', '5k-10k', '>10k'];

const BASE_HABITS = ['Workout', 'Skin Care', 'Wake up early', 'Meditation'];

const DailyLogWizard = ({ isOpen, onClose, date, initialData, onSave }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showStepsDropdown, setShowStepsDropdown] = useState(false);
  const totalSteps = 3;
  
  // Dynamic Habits based on Gender
  const habitsList = currentUser?.gender === 'Female' 
    ? [...BASE_HABITS, 'Periods'] 
    : BASE_HABITS;

  const [formData, setFormData] = useState({
    note: '',
    mood: null, 
    rating: 0, 
    spend: '',
    steps: '',
    sleep: 0, 
    weather: [],
    
    // Habits & Stats
    habits: [],
    water: 0, 
    screenTime: '',
    longNote: '',

    // Questions
    ateOutside: null,
    watchedMovie: null,
    movieData: {
      name: '',
      platform: 'OTT', 
      rating: 0,
      theatreLocation: '',
      withWhom: ''
    },
    
    readBook: null,
    bookData: {
      name: '',
      genre: '',
      author: '',
      rating: 0
    },

    shopping: null, 
    shoppingData: {
        item: '',
        cost: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1); 
      if (initialData) {
        setFormData({
            note: initialData.note || '',
            mood: initialData.mood !== undefined ? initialData.mood : null,
            rating: initialData.rating || 0,
            spend: initialData.spend || '',
            steps: initialData.steps || '',
            sleep: initialData.sleep || 7, 
            weather: initialData.weather || [],
            
            habits: initialData.habits || [],
            water: initialData.water || 0,
            screenTime: initialData.screenTime || '',
            longNote: initialData.longNote || '',

            ateOutside: initialData.ateOutside !== undefined ? initialData.ateOutside : null,
            watchedMovie: initialData.watchedMovie !== undefined ? initialData.watchedMovie : null,
            movieData: initialData.movieData || { name: '', platform: 'OTT', rating: 0, theatreLocation: '', withWhom: '' },
            readBook: initialData.readBook !== undefined ? initialData.readBook : null,
            bookData: initialData.bookData || { name: '', genre: '', author: '', rating: 0 },
            
            shopping: initialData.shopping !== undefined ? initialData.shopping : null,
            shoppingData: initialData.shoppingData || { item: '', cost: '' }
        });
      } else {
        // Reset defaults
        setFormData({
            note: '',
            mood: null,
            rating: 0,
            spend: '',
            steps: '',
            sleep: 7, 
            weather: [],
            habits: [],
            water: 0,
            screenTime: '',
            longNote: '',
            ateOutside: null,
            watchedMovie: null,
            movieData: { name: '', platform: 'OTT', rating: 0, theatreLocation: '', withWhom: '' },
            readBook: null,
            bookData: { name: '', genre: '', author: '', rating: 0 },
            shopping: null,
            shoppingData: { item: '', cost: '' }
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
        if (current.length >= 2) return prev; 
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

  // Generic Toggle Function for Yes/No with Deselect
  const toggleBooleanParams = (field, value) => {
    setFormData(prev => ({
        ...prev,
        [field]: prev[field] === value ? null : value
    }));
  };
    
  // Toggle Mood separate because it's an index/key
  const toggleMood = (index) => {
     setFormData(prev => ({
        ...prev,
        mood: prev.mood === index ? null : index
     }));
  };
  
  // Toggle Rating
  const toggleRating = (value) => {
    setFormData(prev => ({
        ...prev,
        rating: prev.rating === value ? 0 : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    if (!formData.rating) {
        toast.error("Please rate your day before saving!");
        setLoading(false);
        return;
    }

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

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />

      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#FDFBF9] dark:bg-gray-900 w-full max-w-xl md:rounded-[2rem] rounded-t-[2rem] shadow-2xl pointer-events-auto h-[90vh] flex flex-col overflow-hidden z-50"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
            <div>
                 <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    {step === 1 && "Daily Overview"}
                    {step === 2 && "Habits & Health"}
                    {step === 3 && "Reflections"}
                 </h2>
                 <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">Step {step} of {totalSteps}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
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
                         <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-orange-400">Day Rating</label>
                                <div className="flex justify-between px-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => toggleRating(s)}
                                            className="transition-transform active:scale-90"
                                        >
                                           <FiStar 
                                                className={`w-8 h-8 ${formData.rating >= s ? 'fill-orange-400 text-orange-400' : 'text-gray-200 dark:text-gray-700'}`} 
                                           />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400">Mood</label>
                                <div className="grid grid-cols-4 gap-4">
                                    {MOODS.map((m, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => toggleMood(i)}
                                                className={`text-2xl transition-transform ${
                                                    formData.mood === i ? 'scale-125' : 'opacity-40 grayscale'
                                                }`}
                                            >
                                                {m.emoji}
                                            </button>
                                            <span className={`text-[10px] font-bold ${formData.mood === i ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                                                {m.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         </div>

                         {/* Spend & Steps */}
                         <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Spend</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500">₹</span>
                                    <input 
                                        type="number"
                                        value={formData.spend}
                                        onChange={e => setFormData(prev => ({ ...prev, spend: e.target.value }))}
                                        className="w-full bg-white dark:bg-gray-800 rounded-2xl py-4 pl-8 pr-4 font-bold text-lg text-gray-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2 relative">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Steps</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10"><FiActivity size={20} /></span>
                                    <button
                                        onClick={() => setShowStepsDropdown(!showStepsDropdown)}
                                        className="w-full bg-white dark:bg-gray-800 rounded-2xl py-4 pl-12 pr-10 font-bold text-lg text-gray-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 text-left flex items-center h-[60px]"
                                    >
                                        {formData.steps || <span className="text-gray-400 dark:text-gray-500 text-base">Select count</span>}
                                    </button>
                                    <FiChevronRight 
                                        className={`absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-transform duration-200 pointer-events-none ${showStepsDropdown ? '-rotate-90' : 'rotate-90'}`} 
                                    />
                                    
                                    <AnimatePresence>
                                        {showStepsDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 py-2"
                                            >
                                                {STEPS_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, steps: opt }));
                                                            setShowStepsDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-6 py-3 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center ${
                                                            formData.steps === opt ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {opt}
                                                        {formData.steps === opt && <FiCheck />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
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
                                    const Icon = w.icon;
                                    return (
                                        <button
                                            key={w.label}
                                            onClick={() => toggleWeather(w.label)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2 ${
                                                isSelected 
                                                ? `${w.color} border-transparent shadow-sm scale-105` 
                                                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-transparent hover:border-gray-100 dark:hover:border-gray-700'
                                            }`}
                                        >
                                            <Icon className={isSelected ? 'text-current' : 'text-gray-300 dark:text-gray-600'} />
                                            {w.label}
                                        </button>
                                    )
                                })}
                             </div>
                        </div>

                        {/* Sleep Slider */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">Sleep (Last Night)</label>
                                <span className="text-2xl font-black text-indigo-900 dark:text-indigo-400">{formData.sleep} <span className="text-sm text-gray-400 dark:text-gray-500 font-bold">hrs</span></span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="12" 
                                step="0.5"
                                value={formData.sleep}
                                onChange={e => setFormData(prev => ({ ...prev, sleep: parseFloat(e.target.value) }))}
                                className="w-full accent-indigo-500 h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg appearance-none cursor-pointer"
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
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Which habits did you complete?</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {habitsList.map(habit => (
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
                            <button className="text-xs font-bold text-indigo-500 hover:text-indigo-600 block w-full text-center py-2">
                                + Add/Edit Habits in Profile
                            </button>
                        </div>

                        {/* Water & Screen Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 block">How many glasses of water?</label>
                                <div className="flex items-center justify-between">
                                    <button 
                                        onClick={() => setFormData(p => ({ ...p, water: Math.max(0, p.water - 1) }))}
                                        className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                    >
                                        <FiMinus size={14} />
                                    </button>
                                    <div className="text-center">
                                        <span className="text-xl font-black text-gray-900 dark:text-white">{formData.water}</span>
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Glasses</div>
                                    </div>
                                    <button 
                                        onClick={() => setFormData(p => ({ ...p, water: p.water + 1 }))}
                                        className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                    >
                                        <FiPlus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
                                <label className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 block">Screen Time Duration?</label>
                                <div className="relative mt-2">
                                    <input 
                                        type="number"
                                        value={formData.screenTime}
                                        onChange={e => setFormData(prev => ({ ...prev, screenTime: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl p-3 font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 text-center"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-gray-500">HRS</span>
                                </div>
                            </div>
                        </div>

                         {/* Long Note */}
                         <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Any special thoughts for today?</label>
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
                         {/* Shopping */}
                         <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiShoppingBag className="text-orange-400"/> Did you shop today?</span>
                                 <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleBooleanParams('shopping', true)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.shopping === true ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >Yes</button>
                                <button 
                                    onClick={() => toggleBooleanParams('shopping', false)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.shopping === false ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >No</button>
                            </div>
                            </div>
                            {formData.shopping && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    <input placeholder="What did you buy?" className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl text-sm font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                        value={formData.shoppingData.item} onChange={e => setFormData(prev => ({ ...prev, shoppingData: { ...prev.shoppingData, item: e.target.value } }))}
                                    />
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500 text-xs">₹</span>
                                        <input type="number" placeholder="Cost" className="w-full bg-white dark:bg-gray-900 p-3 pl-6 rounded-xl text-sm font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                            value={formData.shoppingData.cost} onChange={e => setFormData(prev => ({ ...prev, shoppingData: { ...prev.shoppingData, cost: e.target.value } }))}
                                        />
                                    </div>
                                </motion.div>
                            )}
                         </div>

                         {/* Outside Food */}
                         <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                            <span className="font-bold text-gray-900 dark:text-white">Did you eat outside today?</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleBooleanParams('ateOutside', true)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.ateOutside === true ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >Yes</button>
                                <button 
                                    onClick={() => toggleBooleanParams('ateOutside', false)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.ateOutside === false ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >No</button>
                            </div>
                         </div>

                         {/* Movie / Series */}
                         <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                                <span className="font-bold text-gray-900 dark:text-white">Watched anything?</span>
                                 <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleBooleanParams('watchedMovie', true)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.watchedMovie === true ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >Yes</button>
                                <button 
                                    onClick={() => toggleBooleanParams('watchedMovie', false)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.watchedMovie === false ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >No</button>
                            </div>
                            </div>
                            {formData.watchedMovie && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    <input placeholder="Movie / Series Name" className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl text-sm font-bold outline-none dark:text-white dark:placeholder-gray-500" 
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
                                             <input placeholder="Where?" className="bg-white dark:bg-gray-900 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                                value={formData.movieData.theatreLocation} onChange={e => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, theatreLocation: e.target.value } }))}
                                             />
                                             <input placeholder="With whom?" className="bg-white dark:bg-gray-900 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                                 value={formData.movieData.withWhom} onChange={e => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, withWhom: e.target.value } }))}
                                             />
                                        </div>
                                    )}
                                     <input type="number" placeholder="Rating (1-10)" className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                        value={formData.movieData.rating} onChange={e => setFormData(prev => ({ ...prev, movieData: { ...prev.movieData, rating: e.target.value } }))}
                                     />
                                </motion.div>
                            )}
                         </div>

                         {/* Book */}
                         <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                                <span className="font-bold text-gray-900 dark:text-white">Read a book?</span>
                                 <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleBooleanParams('readBook', true)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.readBook === true ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >Yes</button>
                                <button 
                                    onClick={() => toggleBooleanParams('readBook', false)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.readBook === false ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >No</button>
                            </div>
                            </div>
                            {formData.readBook && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    <input placeholder="Book Name" className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl text-sm font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                        value={formData.bookData.name} onChange={e => setFormData(prev => ({ ...prev, bookData: { ...prev.bookData, name: e.target.value } }))}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input placeholder="Author" className="bg-white dark:bg-gray-900 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                            value={formData.bookData.author} onChange={e => setFormData(prev => ({ ...prev, bookData: { ...prev.bookData, author: e.target.value } }))}
                                        />
                                        <input placeholder="Genre" className="bg-white dark:bg-gray-900 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
                                            value={formData.bookData.genre} onChange={e => setFormData(prev => ({ ...prev, bookData: { ...prev.bookData, genre: e.target.value } }))}
                                        />
                                    </div>
                                    <input type="number" placeholder="Rating (1-5)" className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl text-xs font-bold outline-none dark:text-white dark:placeholder-gray-500" 
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
        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4 z-20">
            {step > 1 && (
                <button 
                    onClick={prevStep}
                    className="px-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
    </div>
  );
};

export default DailyLogWizard;
