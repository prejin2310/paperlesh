import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    FiX, FiCheck, FiChevronRight, FiChevronLeft, FiStar, FiSun, FiCloud, 
    FiCloudRain, FiCloudLightning, FiDroplet, FiWind, FiThermometer, 
    FiShoppingBag, FiPlus, FiMinus, FiActivity, FiAlertCircle, FiCoffee,
    FiTv, FiBook, FiSmile, FiMoon, FiDollarSign, FiLayout
} from 'react-icons/fi';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PIXEL_COLORS = [
    { color: '#ef4444', label: 'Angry', value: 'angry' },
    { color: '#f97316', label: 'Stressed', value: 'stressed' },
    { color: '#eab308', label: 'Mixed', value: 'mixed' }, // Yellow
    { color: '#22c55e', label: 'Productive', value: 'productive' },
    { color: '#3b82f6', label: 'Calm', value: 'calm' },
    { color: '#a855f7', label: 'Romantic', value: 'romantic' },
    { color: '#ec4899', label: 'Happy', value: 'happy' },
    { color: '#6366f1', label: 'Creative', value: 'creative' },
];

const WEATHER_OPTIONS = [
  { label: 'Sunny', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', icon: FiSun },
  { label: 'Cloudy', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: FiCloud },
  { label: 'Rainy', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', icon: FiCloudRain },
  { label: 'Stormy', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', icon: FiCloudLightning },
  { label: 'Windy', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', icon: FiWind },
  { label: 'Snow/Cold', color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400', icon: FiThermometer }
];

const DailyLogWizardNew = ({ isOpen, onClose, date, initialData, onSave }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4; // 1: Essence, 2: Life, 3: Trackers, 4: Review/Custom

  // Config State (Simulated for now, could be passed as props or context)
  const [trackerConfig, setTrackerConfig] = useState({
      spend: false,
      steps: false,
      habits: false
  });

  const [formData, setFormData] = useState({
    // Core
    note: '', // Highlight
    longNote: '', // Special Thought
    pixelColor: null, // Journal Pixel
    pixelLabel: '',
    
    // Lifestyle
    shopping: null,
    shoppingList: [], // { item: '', cost: '' }
    
    ateOutside: null,
    foodItems: [], // Strings
    
    watchedMovie: null, // Just text input now as per req "Optional text input" (wait, req says "Did you watch... Optional text input")
    movieNote: '',
    
    readBook: null,
    bookData: { name: '' },

    // Trackers
    mood: null, // 0-7 index
    weather: [],
    sleep: 7,
    
    // Custom Trackers
    spend: '',
    steps: '',
    habits: []
  });

  // Base habits list
  const [availableHabits, setAvailableHabits] = useState(['Exercise', 'Read', 'Drink Water', 'Meditation', 'No Sugar']);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        const data = initialData || {};
        
        // Check if custom trackers were previously used
        setTrackerConfig({
            spend: !!data.spend || !!localStorage.getItem('config_spend'),
            steps: !!data.steps || !!localStorage.getItem('config_steps'),
            habits: (data.habits && data.habits.length > 0) || !!localStorage.getItem('config_habits')
        });

        setFormData({
            note: data.note || '',
            longNote: data.longNote || '',
            pixelColor: data.pixelColor || null,
            pixelLabel: data.pixelLabel || '',
            
            shopping: data.shoppingList?.length > 0 ? true : (data.shopping === true),
            shoppingList: data.shoppingList || [],
            
            ateOutside: data.foodItems?.length > 0 ? true : (data.ateOutside === true),
            foodItems: data.foodItems || [],
            
            watchedMovie: !!data.movieNote,
            movieNote: data.movieNote || '',
            
            readBook: !!data.bookData?.name,
            bookData: data.bookData || { name: '' },
            
            mood: data.mood ?? null,
            weather: data.weather || [],
            sleep: data.sleep || 7,
            
            spend: data.spend || '',
            steps: data.steps || '',
            habits: data.habits || []
        });
    }
  }, [isOpen, initialData]);

  // Handle Save
  const handleSubmit = async () => {
      setLoading(true);
      try {
          // If shopping is yes but no list, maybe clear list or keep simpler logic
          if (formData.shopping === false) formData.shoppingList = [];
          
          const logData = {
              ...formData,
              date,
              updatedAt: new Date().toISOString()
          };
          
          const logRef = doc(db, 'users', currentUser.uid, 'logs', date);
          await setDoc(logRef, logData, { merge: true });
          
          toast.success('Day logged successfully!');
          onSave(logData);
          onClose();
      } catch (err) {
          console.error(err);
          toast.error("Failed to save.");
      } finally {
          setLoading(false);
      }
  };

  // Helper for Lists
  const addShoppingItem = () => {
      setFormData(p => ({ ...p, shoppingList: [...p.shoppingList, { item: '', cost: '' }] }));
  };
  const updateShoppingItem = (idx, field, val) => {
      const newList = [...formData.shoppingList];
      newList[idx][field] = val;
      setFormData(p => ({ ...p, shoppingList: newList }));
  };
  const removeShoppingItem = (idx) => {
      setFormData(p => ({ ...p, shoppingList: p.shoppingList.filter((_, i) => i !== idx) }));
  };

  const addFoodItem = (val) => {
      if(!val) return;
      setFormData(p => ({ ...p, foodItems: [...p.foodItems, val] }));
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
            onClick={onClose}
        />

        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl h-[85vh] md:h-auto md:max-h-[90vh] bg-[#121212] dark:bg-black text-white relative z-10 rounded-3xl shadow-2xl flex flex-col md:border border-white/10 overflow-hidden"
        >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                        {step}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">
                            {step === 1 ? "The Essence" : step === 2 ? "Daily Life" : step === 3 ? "Vital Signs" : "Trackers"}
                        </h2>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Log for {date}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                    <FiX />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8 bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
                <AnimatePresence mode='wait'>
                    {/* STEP 1: HIGHLIGHT & PIXEL & THOUGHT */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-8"
                        >
                            {/* Highlight */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-indigo-400 uppercase tracking-wider">
                                    <FiStar /> Highlight of the Day
                                </label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="One big thing that happened..."
                                    value={formData.note}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                />
                            </div>

                            {/* Pixel Mark */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase tracking-wider">
                                    <FiLayout /> Pixel Mark
                                </label>
                                <p className="text-xs text-white/50 mb-3">Color this day in your yearly calendar.</p>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                    {PIXEL_COLORS.map((p) => (
                                        <button
                                            key={p.value}
                                            onClick={() => setFormData(prev => ({ ...prev, pixelColor: p.color, pixelLabel: p.label }))}
                                            className={`group relative aspect-square rounded-xl transition-all duration-300 ${formData.pixelColor === p.color ? 'ring-2 ring-white scale-105' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                                            style={{ backgroundColor: p.color }}
                                        >
                                            {formData.pixelColor === p.color && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <FiCheck className="text-white drop-shadow-md" size={20} strokeWidth={3} />
                                                </div>
                                            )}
                                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                {p.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Special Thought */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-pink-400 uppercase tracking-wider">
                                    <FiMoon /> Special Thought
                                </label>
                                <textarea 
                                    placeholder="Reflections, gratitude, or random thoughts..."
                                    rows={4}
                                    value={formData.longNote}
                                    onChange={(e) => setFormData(prev => ({ ...prev, longNote: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: LIFESTYLE (Shop, Eat, Watch, Read) */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-8"
                        >
                            {/* Shopping */}
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider">
                                        <FiShoppingBag /> Did you shop?
                                    </label>
                                    <div className="flex bg-black/20 rounded-lg p-1">
                                        <button onClick={() => setFormData(p => ({ ...p, shopping: true }))} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.shopping === true ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}>Yes</button>
                                        <button onClick={() => setFormData(p => ({ ...p, shopping: false }))} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.shopping === false ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>No</button>
                                    </div>
                                </div>
                                {formData.shopping === true && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        {formData.shoppingList.map((item, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input 
                                                    placeholder="Item name"
                                                    value={item.item}
                                                    onChange={e => updateShoppingItem(i, 'item', e.target.value)}
                                                    className="flex-1 bg-black/20 rounded-lg px-3 py-2 text-sm border border-white/5 focus:border-emerald-500/50 focus:outline-none"
                                                />
                                                <input 
                                                    placeholder="Cost"
                                                    type="number"
                                                    value={item.cost}
                                                    onChange={e => updateShoppingItem(i, 'cost', e.target.value)}
                                                    className="w-24 bg-black/20 rounded-lg px-3 py-2 text-sm border border-white/5 focus:border-emerald-500/50 focus:outline-none"
                                                />
                                                <button onClick={() => removeShoppingItem(i)} className="text-white/20 hover:text-red-400"><FiX /></button>
                                            </div>
                                        ))}
                                        <button onClick={addShoppingItem} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                            <FiPlus /> Add Item
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Eat Outside */}
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-2 text-sm font-bold text-orange-400 uppercase tracking-wider">
                                        <FiCoffee /> Eat Outside?
                                    </label>
                                    <div className="flex bg-black/20 rounded-lg p-1">
                                        <button onClick={() => setFormData(p => ({ ...p, ateOutside: true }))} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.ateOutside === true ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}>Yes</button>
                                        <button onClick={() => setFormData(p => ({ ...p, ateOutside: false }))} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.ateOutside === false ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>No</button>
                                    </div>
                                </div>
                                {formData.ateOutside === true && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.foodItems.map((f, i) => (
                                                <span key={i} className="bg-orange-900/40 text-orange-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-orange-500/20">
                                                    {f} <button onClick={() => setFormData(p => ({...p, foodItems: p.foodItems.filter((_, idx) => idx !== i)}))}><FiX size={12}/></button>
                                                </span>
                                            ))}
                                        </div>
                                        <input 
                                            placeholder="What did you eat? Press Enter"
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter') {
                                                    addFoodItem(e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            className="w-full bg-black/20 rounded-lg px-3 py-2 text-sm border border-white/5 focus:border-orange-500/50 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                           {/* Watch Movie */}
                           <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-2 text-sm font-bold text-sky-400 uppercase tracking-wider">
                                        <FiTv /> Watch Anything?
                                    </label>
                                </div>
                                <input 
                                    placeholder="Movie or Series name (Optional)"
                                    value={formData.movieNote}
                                    onChange={e => setFormData(p => ({ ...p, movieNote: e.target.value, watchedMovie: !!e.target.value }))}
                                    className="w-full bg-black/20 rounded-lg px-3 py-2 text-sm border border-white/5 focus:border-sky-500/50 focus:outline-none"
                                />
                            </div>

                            {/* Read Book */}
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider">
                                        <FiBook /> Read Today?
                                    </label>
                                    <div className="flex bg-black/20 rounded-lg p-1">
                                        <button onClick={() => setFormData(p => ({ ...p, readBook: true }))} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.readBook === true ? 'bg-amber-500 text-white' : 'text-white/40 hover:text-white'}`}>Yes</button>
                                        <button onClick={() => setFormData(p => ({ ...p, readBook: false }))} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${formData.readBook === false ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>No</button>
                                    </div>
                                </div>
                                {formData.readBook === true && (
                                    <input 
                                        placeholder="Book Title"
                                        value={formData.bookData.name}
                                        onChange={e => setFormData(p => ({ ...p, bookData: { ...p.bookData, name: e.target.value } }))}
                                        className="w-full bg-black/20 rounded-lg px-3 py-2 text-sm border border-white/5 focus:border-amber-500/50 focus:outline-none animate-in fade-in"
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: BASE TRACKERS (Mood, Weather, Sleep) */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-8"
                        >
                             {/* Mood */}
                             <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider">
                                    <FiSmile /> Overall Mood
                                </label>
                                <div className="flex justify-between bg-white/5 p-4 rounded-2xl">
                                    {['😡', '😢', '😫', '😴', '😐', '😊', '🥰', '🤩'].map((emoji, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setFormData(p => ({ ...p, mood: idx }))}
                                            className={`text-2xl transition-all hover:scale-125 ${formData.mood === idx ? 'scale-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'opacity-40 hover:opacity-100'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Weather */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase tracking-wider">
                                    <FiCloud /> Weather
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {WEATHER_OPTIONS.map((w) => (
                                        <button
                                            key={w.label}
                                            onClick={() => {
                                                const has = formData.weather.includes(w.label);
                                                setFormData(p => ({
                                                    ...p,
                                                    weather: has ? p.weather.filter(x => x !== w.label) : [...p.weather, w.label]
                                                }))
                                            }}
                                            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all border ${
                                                formData.weather.includes(w.label) 
                                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200' 
                                                : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                                            }`}
                                        >
                                            <w.icon /> {w.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sleep */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-violet-400 uppercase tracking-wider">
                                    <FiMoon /> Sleep (Hours)
                                </label>
                                <div className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl">
                                    <input 
                                        type="range" 
                                        min="0" max="12" step="0.5"
                                        value={formData.sleep}
                                        onChange={(e) => setFormData(p => ({ ...p, sleep: parseFloat(e.target.value) }))}
                                        className="flex-1 accent-violet-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xl font-bold font-mono min-w-[3ch]">{formData.sleep}h</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: CUSTOM TRACKERS (Spend, Steps, Habits) */}
                    {step === 4 && (
                        <motion.div 
                            key="step4"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-8"
                        >
                            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-6 rounded-2xl mb-6">
                                <h3 className="font-bold text-indigo-300 mb-2">My Trackers</h3>
                                <p className="text-sm text-indigo-200/60">Manage your recurring goals here. Configure them in settings to see more.</p>
                            </div>

                            {/* SPEND */}
                            {trackerConfig.spend ? (
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider">
                                        <FiDollarSign /> Daily Spend
                                    </label>
                                    <input 
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.spend}
                                        onChange={(e) => setFormData(p => ({ ...p, spend: e.target.value }))}
                                        className="w-full bg-white/5 border border-emerald-500/20 rounded-xl p-4 text-2xl font-mono text-emerald-400 placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                            ) : (
                                <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
                                    <p className="text-white/40 text-sm mb-2">Spend tracker not configured.</p>
                                    <button onClick={() => { setTrackerConfig(p => ({...p, spend: true})); localStorage.setItem('config_spend', 'true'); }} className="text-xs font-bold text-emerald-400 hover:underline">Enable Tracking</button>
                                </div>
                            )}

                             {/* STEPS */}
                             {trackerConfig.steps ? (
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-bold text-orange-400 uppercase tracking-wider">
                                        <FiActivity /> Steps
                                    </label>
                                    <input 
                                        type="number"
                                        placeholder="Steps count"
                                        value={formData.steps}
                                        onChange={(e) => setFormData(p => ({ ...p, steps: e.target.value }))}
                                        className="w-full bg-white/5 border border-orange-500/20 rounded-xl p-4 text-xl font-mono text-orange-400 placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                </div>
                            ) : (
                                <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
                                    <p className="text-white/40 text-sm mb-2">Step tracker not configured.</p>
                                    <button onClick={() => { setTrackerConfig(p => ({...p, steps: true})); localStorage.setItem('config_steps', 'true'); }} className="text-xs font-bold text-orange-400 hover:underline">Enable Tracking</button>
                                </div>
                            )}

                            {/* HABITS */}
                            {trackerConfig.habits ? (
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-bold text-teal-400 uppercase tracking-wider">
                                        <FiCheck /> Habits
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableHabits.map(h => (
                                            <button
                                                key={h}
                                                onClick={() => {
                                                    const has = formData.habits.includes(h);
                                                    setFormData(p => ({
                                                        ...p,
                                                        habits: has ? p.habits.filter(x => x !== h) : [...p.habits, h]
                                                    }));
                                                }}
                                                className={`p-3 rounded-xl text-sm font-bold text-left transition-all border ${
                                                    formData.habits.includes(h)
                                                    ? 'bg-teal-500/20 border-teal-500 text-teal-200'
                                                    : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                                                }`}
                                            >
                                                {h}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
                                    <p className="text-white/40 text-sm mb-2">Habit tracker not configured.</p>
                                    <button onClick={() => { setTrackerConfig(p => ({...p, habits: true})); localStorage.setItem('config_habits', 'true'); }} className="text-xs font-bold text-teal-400 hover:underline">Enable Tracking</button>
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md flex justify-between items-center">
                <button 
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-white hover:bg-white/10'}`}
                >
                    <FiChevronLeft /> Previous
                </button>

                {step < totalSteps ? (
                    <button 
                        onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        Next Step <FiChevronRight />
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                    >
                        {loading ? 'Saving...' : 'Save & Close'} <FiCheck />
                    </button>
                )}
            </div>
        </motion.div>
    </div>,
    document.body
  );
};

export default DailyLogWizardNew;