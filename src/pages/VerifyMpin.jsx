import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHash, FiShield, FiLock, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';

const VerifyMpin = () => {
    const navigate = useNavigate();
    const { currentUser, verifySession, logout } = useAuth();
    
    const [mpin, setMpin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If no user is logged in, redirect to login
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleVerifyMpin = async (e) => {
        e.preventDefault();
        
        if (mpin.length !== 4) {
            return setError('MPIN must be exactly 4 digits');
        }

        try {
            setError('');
            setLoading(true);

            // Get user profile from Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.mpin === mpin) {
                    // Correct MPIN, go to dashboard
                    verifySession();
                    navigate('/dashboard');
                } else {
                     setError('Incorrect MPIN. Please try again.');
                     setMpin(''); // Clear field on error
                }
            } else {
                setError('User data not found.');
            }

        } catch (err) {
            console.error(err);
            setError('Failed to verify MPIN. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-6 md:p-12 flex flex-col relative overflow-hidden">
             
             {/* Background Blooms */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-40 pointer-events-none"
            />
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
                className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100 rounded-full blur-[100px] opacity-40 pointer-events-none"
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex items-center justify-center relative z-10"
            >
                <div className="w-full max-w-md space-y-8">
                    
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-black rounded-3xl mx-auto flex items-center justify-center text-white text-2xl shadow-xl">
                            <FiLock />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-gray-900">
                             Welcome Back
                        </h1>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                            Enter your security PIN to access your journal.
                        </p>
                    </div>

                    {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-red-50 text-red-600 font-bold text-sm rounded-2xl text-center">
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleVerifyMpin} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                <FiHash size={20} />
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength="4"
                                required
                                value={mpin}
                                onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                placeholder="Enter 4-digit PIN"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-black text-white text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? 'Verifying...' : 'Unlock Journal'}
                        </button>
                    </form>

                    <div className="text-center">
                         <button 
                            onClick={handleLogout}
                            className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                            <FiLogOut className="mr-2" />
                            Log out & switch account
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyMpin;
