import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiDownload, FiLogIn, FiUserPlus, FiSmartphone, FiWifi, 
  FiZap, FiCheck, FiArrowRight, FiSun, FiMoon
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPrompt from '../components/common/NotificationPrompt';

const Landing = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [activeScreenshot, setActiveScreenshot] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const newMode = !prev;
            if (newMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newMode;
        });
    };

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    // Auto-rotate phone content
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveScreenshot((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const screenshots = [
        { title: "Weekly Insights", color: "bg-yellow-100 text-yellow-900", darkColor: "dark:bg-yellow-900/50 dark:text-yellow-100", emoji: "📊", text: "Track trends." },
        { title: "Mood Tracking", color: "bg-blue-100 text-blue-900", darkColor: "dark:bg-blue-900/50 dark:text-blue-100", emoji: "🙂", text: "Log feelings." },
        { title: "Habit Streaks", color: "bg-green-100 text-green-900", darkColor: "dark:bg-green-900/50 dark:text-green-100", emoji: "🔥", text: "Build discipline." }
    ];

    // Floating animation variants
    const floatingVariant = {
        animate: {
            y: [0, -20, 0],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
    };

    const floatingVariantReverse = {
        animate: {
            y: [0, 20, 0],
            transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
        }
    };

    return (
        <div className={`min-h-screen font-sans selection:bg-indigo-500 selection:text-white overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            
            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white/60 border-white/20'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <img src="/lan.png" alt="MyJournle" className="h-10 w-auto" />
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
                        >
                            {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                        </button>
                        <Link to="/login" className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-black'}`}>Log In</Link>
                        <Link to="/onboarding" className="hidden sm:inline-flex px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-full hover:bg-indigo-700 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20 transition-all">
                            Start Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
                
                {/* Background Blobs - Animated */}
                <motion.div 
                    variants={floatingVariant}
                    animate="animate"
                    className="absolute top-20 left-10 -z-10 w-64 h-64 bg-purple-300/30 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen dark:bg-purple-900/20" 
                />
                <motion.div 
                    variants={floatingVariantReverse}
                    animate="animate"
                    className="absolute bottom-20 right-1/3 -z-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen dark:bg-blue-900/20" 
                />

                {/* Left Text */}
                <div className="flex-1 text-center lg:text-left space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                        className="inline-block mb-4"
                    >
                        <img src="/lan.png" alt="MyJournle" className="h-24 w-auto object-contain" />
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, type: "spring" }}
                        className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1]"
                    >
                        Journaling <br className="hidden lg:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x">
                            simplified.
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                        className={`text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                        Track your habits, mood, and memories in seconds. Visualize your year with beautiful, data-driven insights.
                    </motion.p>

                    {/* App / PWA Highlighting */}
                    <motion.div 
                         initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                         className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
                    >
                        {isInstallable ? (
                            <button 
                                onClick={handleInstallClick}
                                className="group relative w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white dark:text-black text-white rounded-2xl font-bold text-lg hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                                <FiDownload className="group-hover:animate-bounce" />
                                Install App
                            </button>
                        ) : (
                             <Link 
                                to="/onboarding"
                                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:translate-y-[-2px] hover:shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
                            >
                                Get Started Free
                                <FiArrowRight />
                            </Link>
                        )}
                         <div className="flex flex-col items-start text-xs font-semibold pl-2">
                             <span className={`flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                <FiSmartphone size={14} /> 
                                Works offline
                             </span>
                             <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>No App Store needed.</span>
                         </div>
                    </motion.div>
                </div>

                {/* Right Visual - Interactive Phone */}
                <motion.div 
                    initial={{ opacity: 0, x: 50, rotateY: 15 }} 
                    animate={{ opacity: 1, x: 0, rotateY: 12 }} 
                    whileHover={{ rotateY: 0, rotateZ: 0, scale: 1.02 }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="flex-1 w-full max-w-[400px] lg:max-w-md perspective-1000"
                >
                    <div className={`relative w-full aspect-[9/19] rounded-[3.5rem] p-4 shadow-2xl border-8 ring-1 transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-800 ring-slate-700 shadow-slate-900/50' : 'bg-slate-900 border-slate-900 ring-slate-900/10 shadow-xl'}`}>
                         
                         {/* Dynamic Screen Content */}
                         <div className={`w-full h-full rounded-[2.5rem] overflow-hidden relative flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#FDFBF9] text-slate-900'}`}>
                            {/* StatusBar */}
                            <div className="h-10 w-full flex justify-between items-end px-6 pb-2 text-xs font-bold font-mono opacity-50">
                                <span>9:41</span>
                                <div className="flex gap-1">
                                    <div className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}><FiWifi /></div>
                                    <div className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}><FiZap /></div>
                                </div>
                            </div>
                            
                            {/* Animated Content */}
                            <div className="mt-8 px-6">
                                <h3 className="text-3xl font-black mb-6">Hello, You.</h3>
                                <div className="space-y-4">
                                     <AnimatePresence mode='wait'>
                                        <motion.div 
                                            key={activeScreenshot}
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                            transition={{ duration: 0.4 }}
                                            className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-4 text-center p-6 shadow-sm transition-colors duration-300 ${isDarkMode ? screenshots[activeScreenshot].darkColor : screenshots[activeScreenshot].color}`}
                                        >
                                            <div className="text-6xl filter drop-shadow-md">{screenshots[activeScreenshot].emoji}</div>
                                            <div>
                                                <div className="text-xl font-bold">{screenshots[activeScreenshot].title}</div>
                                                <div className="text-sm font-medium opacity-80">{screenshots[activeScreenshot].text}</div>
                                            </div>
                                        </motion.div>
                                     </AnimatePresence>
                                     
                                     {/* Mock List */}
                                     { [1,2].map(i => (
                                         <div key={i} className={`h-16 w-full rounded-2xl border shadow-sm flex items-center px-4 gap-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                            <div className={`w-10 h-10 rounded-full animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                                            <div className="flex-1 space-y-2">
                                                <div className={`w-24 h-2 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                                                <div className={`w-16 h-2 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}></div>
                                            </div>
                                         </div>
                                     ))}
                                </div>
                            </div>

                            {/* Navbar Mock */}
                            <div className={`absolute bottom-0 left-0 right-0 h-20 border-t flex items-center justify-around text-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-white border-slate-50 text-slate-300'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-black text-white'}`}><FiCheck /></div>
                            </div>
                         </div>
                         
                         {/* Reflection/Sheen */}
                         <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-[3.5rem] z-20"></div>
                    </div>
                </motion.div>
            </main>

            {/* PWA Banner Section - "The Real App" vibe */}
            <section className={`py-20 px-6 overflow-hidden relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-black text-white'}`}>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 
                 <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="flex-1 space-y-6">
                        <div className="inline-block px-3 py-1 rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase bg-white/5 backdrop-blur-sm">
                            Native Experience
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                            "It's like a real app, <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">but instant.</span>"
                        </h2>
                        <ul className="space-y-4 font-medium text-lg text-slate-300">
                            {[
                                "Installs to your home screen",
                                "No 100MB downloads",
                                "Works even when offline"
                            ].map((item, idx) => (
                                <motion.li 
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.2 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="p-1 bg-green-500 rounded-full"><FiCheck size={14} className="text-black"/></div>
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                    {/* Visual representation of app icon on grid */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 flex justify-center"
                    >
                        <div className="grid grid-cols-3 gap-6 p-8 bg-white/5 rounded-[3rem] backdrop-blur-md border border-white/10 max-w-sm rotate-3 hover:rotate-0 transition-all duration-500">
                             {[...Array(8)].map((_, i) => (
                                 <div key={i} className="w-16 h-16 bg-white/5 rounded-2xl"></div>
                             ))}
                             {/* The App Icon */}
                             <motion.div 
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/50 flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                             >
                                 M
                             </motion.div>
                        </div>
                    </motion.div>
                 </div>
            </section>

             {/* Bento Grid Features */}
             <section className="py-32 px-6 max-w-7xl mx-auto">
                 <div className="text-center mb-20">
                     <h2 className="text-4xl font-bold">Simple by design.</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
                     {/* Large Left */}
                     <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5 }}
                         className={`md:row-span-2 rounded-[2.5rem] p-10 border shadow-xl flex flex-col justify-between overflow-hidden relative group transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}
                    >
                         <div className="relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 ${isDarkMode ? 'bg-orange-900/50 text-orange-200' : 'bg-orange-100 text-orange-600'}`}><FiSun /></div>
                            <h3 className="text-2xl font-bold mb-2">Log in Seconds</h3>
                            <p className="opacity-70 leading-relaxed">Tap to track mood, rate your day, and log habits. It's the fastest way to keep a diary.</p>
                         </div>
                         <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
                     </motion.div>

                     {/* Top Right */}
                     <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.1 }}
                         className={`md:col-span-2 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-slate-900 text-white border-transparent'}`}
                    >
                         <div className="flex-1 relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Reflect Monthly</h3>
                            <p className="opacity-70 leading-relaxed">Review your progress with auto-generated summaries and insights.</p>
                         </div>
                         <div className="flex-1 flex gap-2 justify-end">
                            <div className="w-12 h-32 bg-white/10 rounded-full animate-pulse"></div>
                            <div className="w-12 h-20 bg-white/20 rounded-full"></div>
                            <div className="w-12 h-40 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
                         </div>
                     </motion.div>

                     {/* Bottom Mid */}
                     <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.2 }}
                         className={`rounded-[2.5rem] p-10 border flex flex-col justify-center text-center items-center transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/20 border-blue-900/50' : 'bg-blue-50 border-blue-100'}`}
                    >
                         <div className="text-4xl mb-4">🧘</div>
                         <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>Mindfulness</h3>
                         <p className={`text-sm opacity-80 ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>Built-in breathing exercises.</p>
                     </motion.div>

                     {/* Bottom Right */}
                     <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.3 }}
                         className={`rounded-[2.5rem] p-10 border shadow-xl flex flex-col justify-center relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}
                    >
                         <div className="relative z-10">
                             <h3 className="text-xl font-bold mb-1">See your year</h3>
                             <p className="text-sm opacity-70">Visualize your life in pixels.</p>
                         </div>
                         <div className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l z-20 ${isDarkMode ? 'from-slate-900 via-slate-900/80' : 'from-white via-white/80'} to-transparent`}></div>
                         <div className="absolute inset-0 opacity-20 flex flex-wrap gap-1 p-4 -z-0">
                             {[...Array(100)].map((_, i) => (
                                 <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.5 ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}`}></div>
                             ))}
                         </div>
                     </motion.div>
                 </div>
             </section>

             <footer className="py-12 text-center opacity-60 text-sm font-semibold">
                 © 2026 MyJournle. Your life, simplified.
             </footer>
            <NotificationPrompt />
        </div>
    );
};

export default Landing;
