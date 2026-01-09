import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiDownload, FiArrowRight, FiCheckCircle, FiShield, FiSmartphone } from 'react-icons/fi';
import { useInstallPrompt } from '../context/InstallContext';
import toast from 'react-hot-toast';

const InstallApp = () => {
    const navigate = useNavigate();
    const { deferredPrompt, promptInstall, isInstalled } = useInstallPrompt();

    // If application is already installed, we can redirect or show success
    useEffect(() => {
        if (isInstalled) {
            // Optional: Auto-redirect after delay?
            // setTimeout(() => navigate('/dashboard'), 2000);
        }
    }, [isInstalled, navigate]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            const accepted = await promptInstall();
            if (accepted) {
                // User accepted
            }
        } else {
            // Fallback for iOS or when prompt is not available
            toast('Tap the Share icon -> "Add to Home Screen"', {
                duration: 4000,
                icon: '📱'
            });
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
             
            {/* Background Gradients */}
            <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[100px] pointer-events-none"
            />
             <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 7, repeat: Infinity, delay: 1 }}
                className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px] pointer-events-none"
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center relative z-10 space-y-8"
            >
                {/* Icon/Brand */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black border border-gray-700 rounded-[2rem] flex items-center justify-center shadow-2xl relative">
                        {isInstalled ? <FiCheckCircle size={40} className="text-green-400" /> : <FiSmartphone size={40} className="text-white" />}
                        {/* Notification Dot */}
                        {!isInstalled && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tighter">
                        {isInstalled ? "You're All Set!" : "Install App"}
                    </h1>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        {isInstalled 
                            ? "MyJournle is ready on your home screen." 
                            : "Add MyJournle to your home screen for quick access. no need to visit the website every time."}
                    </p>
                </div>

                {/* Features List */}
                {!isInstalled && (
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-3xl p-6 text-left space-y-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                                <FiDownload size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-200">One-Tap Access</h3>
                                <p className="text-xs text-gray-500">Launch directly from home screen</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                                <FiShield size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-200">Native Experience</h3>
                                <p className="text-xs text-gray-500">Full screen, no browser bars</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-4">
                    {/* Install Button - Always Visible */}
                    {!isInstalled && (
                        <div className="space-y-2">
                            <button
                                onClick={handleInstall}
                                className="w-full py-4 bg-white text-black text-lg font-bold rounded-2xl shadow-lg hover:bg-gray-100 transform transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FiDownload />
                                Install App
                            </button>
                            {!deferredPrompt && (
                                <p className="text-[10px] text-gray-500 font-medium">
                                    If nothing happens, install manually via browser menu.
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSkip}
                        className={`w-full py-4 bg-transparent text-gray-400 font-bold rounded-2xl hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer ${isInstalled ? 'bg-white/10 text-white' : ''}`}
                    >
                        {isInstalled ? "Continue to App" : "Skip"}
                         <FiArrowRight />
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default InstallApp;
