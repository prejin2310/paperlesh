import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiHome, FiAlertCircle } from 'react-icons/fi';

const NotFound = () => {
    const navigate = useNavigate();

    // Specific function to clear caches and service workers to "fix" PWA issues
    const handleFixAndReload = async () => {
        try {
            // 1. Clear Cache Storage
            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                await Promise.all(cacheKeys.map(key => caches.delete(key)));
            }
            
            // 2. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(r => r.unregister()));
            }

            // 3. Hard Reload to Dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            console.error("Failed to clear cache:", error);
            // Fallback navigation
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF9] dark:bg-black text-gray-800 dark:text-gray-100 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            
            {/* Background Animated blobs */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-[100px] opacity-50 z-0"
            />
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    rotate: [0, -90, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-orange-200 dark:bg-orange-900/20 rounded-full blur-[100px] opacity-50 z-0"
            />

            <div className="relative z-10 max-w-md w-full">
                {/* CSS Illustration: 404 Glitch */}
                <div className="relative h-40 mb-8 flex items-center justify-center">
                     <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[150px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500 opacity-20 select-none"
                     >
                        404
                     </motion.h1>
                     <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="absolute inset-0 flex items-center justify-center"
                     >
                        <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl flex items-center justify-center transform rotate-12 border-2 border-gray-100 dark:border-gray-700">
                             <FiAlertCircle className="w-12 h-12 text-orange-500" />
                        </div>
                     </motion.div>
                </div>

                <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.3 }}
                >
                    <h2 className="text-3xl font-black mb-3">Oops! Lost in Space?</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg leading-relaxed">
                        We can't seem to find the page you're looking for. It might have been moved or doesn't exist.
                    </p>
                </motion.div>

                <div className="space-y-3">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                    >
                        <FiHome />
                        Go Home
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={handleFixAndReload}
                        className="w-full py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                             <FiRefreshCw />
                        </motion.div>
                        Fix App Issues & Reload
                    </motion.button>
                </div>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-xs text-gray-400"
                >
                    Tap "Fix App Issues" if you're stuck in a loop.
                </motion.p>
            </div>
        </div>
    );
};

export default NotFound;
