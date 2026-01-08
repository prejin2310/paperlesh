import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiBook, FiCalendar, FiDownload } from 'react-icons/fi';
import { RiMentalHealthLine } from 'react-icons/ri';

const Landing = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-brand-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
            Paperlesh
          </div>
          <div className="flex items-center gap-6">
             <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
               Login
             </Link>
             <Link 
               to="/register" 
               className="hidden sm:block px-4 py-2 bg-brand-600 hover:bg-brand-700 !text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-brand-500/20"
             >
               Get Started
             </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 lg:pt-48 lg:pb-32 flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold tracking-wide uppercase mb-4">
            New way to journal
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Your life, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">simplified.</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
            Track your habits, mood, and memories in seconds. Visualize your year with beautiful, data-driven insights.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 w-full sm:w-auto">
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 !text-white font-bold text-lg rounded-2xl shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            Start Journaling Free
          </Link>
          <Link 
            to="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            Log In
          </Link>
        </div>
        
        {/* Simple by design (Moved from bottom) */}
        <div className="mt-24 w-full text-left">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Simple by design</h2>
              <div className="space-y-8">
                <Step 
                  number="1" 
                  title="Log in seconds" 
                  desc="Tap to track mood, rate your day, and log habits. No typing required."
                />
                <Step 
                  number="2" 
                  title="Reflect monthly" 
                  desc="Review your progress with auto-generated summaries and insights."
                />
                <Step 
                  number="3" 
                  title="See your year" 
                  desc="Watch your life visualize into a colorful yearly heatmap."
                />
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand-100 to-blue-50 dark:from-brand-900/30 dark:to-blue-900/10 rounded-3xl p-8 h-[400px] flex items-center justify-center relative overflow-hidden shadow-2xl border border-brand-100 dark:border-brand-900/20">
               <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-2 p-4 opacity-50">
                  {[...Array(36)].map((_, i) => (
                    <div key={i} className={`rounded-md ${Math.random() > 0.5 ? 'bg-brand-400/30' : 'bg-transparent'}`} />
                  ))}
               </div>
               <div className="text-center relative z-10">
                 <p className="text-brand-900 dark:text-brand-100 font-bold text-2xl">Your Year in Review</p>
                 <p className="text-brand-700 dark:text-brand-300 mt-2">Coming to life as you log.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-gray-600 dark:text-gray-400">Designed to be the only journaling app you'll ever need, without the clutter.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={<FiBook className="w-6 h-6 text-brand-600" />} 
              title="Micro Journal" 
              desc="Capture your day in one meaningful line. No pressure to write pages." 
            />
            <FeatureCard 
              icon={<RiMentalHealthLine className="w-6 h-6 text-brand-600" />} 
              title="Mood Tracker" 
              desc="Identify patterns in your emotional well-being over time." 
            />
            <FeatureCard 
              icon={<FiActivity className="w-6 h-6 text-brand-600" />} 
              title="Habit Builder" 
              desc="Build streaks and form lasting positive habits easily." 
            />
            <FeatureCard 
              icon={<FiCalendar className="w-6 h-6 text-brand-600" />} 
              title="Year in Pixels" 
              desc="See your entire year at a glance with beautiful heatmaps." 
            />
          </div>
        </div>
      </section>

      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-brand-100 dark:border-brand-900 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-100 dark:bg-brand-900/50 rounded-xl">
                <FiDownload className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">Install App</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add to home screen</p>
              </div>
            </div>
            <button 
              onClick={handleInstallClick}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 !text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-2xl font-bold tracking-tight text-gray-400 dark:text-gray-600">
            Paperlesh
          </div>
          <p className="font-medium text-gray-500 dark:text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Paperlesh. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-md transition-all flex flex-col items-start text-left space-y-4 group">
    <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-xl group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const Step = ({ number, title, desc }) => (
  <div className="flex gap-5 relative group">
    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border-2 border-brand-100 dark:border-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold z-10 shadow-sm group-hover:scale-110 group-hover:border-brand-500 transition-all duration-300">
      {number}
    </div>
    <div className="pt-2">
      <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Landing;
