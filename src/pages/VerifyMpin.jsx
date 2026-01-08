import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';

const VerifyMpin = () => {
    const navigate = useNavigate();
    const { currentUser, verifySession, logout } = useAuth();
    
    const [mpin, setMpin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    // If no user is logged in, redirect to login
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleVerifyMpin = async (e) => {
        e.preventDefault();
        
        const finalMpin = mpin.join('');
        if (finalMpin.length !== 4) {
             // If manual submit
            return setError('Please enter a 4-digit PIN');
        }

        try {
            setError('');
            setLoading(true);

            // Get user profile from Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.mpin === finalMpin) {
                    // Correct MPIN, go to dashboard
                    verifySession();
                    navigate('/dashboard');
                } else {
                     setError('Incorrect MPIN. Please try again.');
                     setMpin(['', '', '', '']); // Clear field on error
                     inputRefs.current[0].focus();
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

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newMpin = [...mpin];
        newMpin[index] = value.slice(-1); // Only take last char
        setMpin(newMpin);

        // Auto focus next
        if (value && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !mpin[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 4).replace(/\D/g, '');
        if (pastedData) {
            const newMpin = [...mpin]; // copy current state
            // Fill with pasted data
            for (let i = 0; i < 4; i++) {
                if (i < pastedData.length) {
                    newMpin[i] = pastedData[i];
                }
            }
            setMpin(newMpin);
            
            // Focus appropriate field
            const focusIndex = Math.min(pastedData.length, 3);
            inputRefs.current[focusIndex].focus();
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

                    <form onSubmit={handleVerifyMpin} className="space-y-8">
                        
                        <div className="flex justify-center gap-3 sm:gap-4" onPaste={handlePaste}>
                            {mpin.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-3xl font-black text-center text-gray-900 shadow-sm outline-none transition-all placeholder-gray-300"
                                    placeholder="•"
                                />
                            ))}
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
                            type="button"
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
