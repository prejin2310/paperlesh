import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHash, FiShield, FiArrowRight, FiLock, FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';

const SetMpin = () => {
    const navigate = useNavigate();
    const { currentUser, reauthenticate, verifySession } = useAuth();
    
    const [step, setStep] = useState('loading'); // loading, verify, set
    const [mpin, setMpin] = useState('');
    const [confirmMpin, setConfirmMpin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If no user is logged in, redirect to login
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        } else {
            // Check if user is fresh (registered < 5 mins ago)
            const creationTime = new Date(currentUser.metadata.creationTime).getTime();
            const now = Date.now();
            const isFresh = (now - creationTime) < 5 * 60 * 1000;

            if (isFresh) {
                setStep('set');
            } else {
                setStep('verify');
            }
        }
    }, [currentUser, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await reauthenticate(password);
            setStep('set');
        } catch (err) {
            console.error(err);
            setError('Incorrect password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

     const handleSetMpin = async (e) => {
        e.preventDefault();
        
        if (mpin.length !== 4) {
            return setError('MPIN must be exactly 4 digits');
        }
        if (mpin !== confirmMpin) {
            return setError('MPINs do not match');
        }

        try {
            setError('');
            setLoading(true);
            
            // Save MPIN to Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                mpin: mpin,
                hasMpin: true
            });

            // Mark session as verified
            verifySession();

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Failed to save MPIN.');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'loading') return (
        <div className="flex justify-center items-center h-screen bg-white">
            <div className="w-8 h-8 bg-black rounded-full animate-ping"></div>
        </div>
    );

    return (
         <div className="min-h-screen bg-white text-gray-900 font-sans p-6 md:p-12 flex flex-col relative overflow-hidden">
             
             {/* Background Blooms */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-100 rounded-full blur-[100px] opacity-40 pointer-events-none"
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
                            <FiShield />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-gray-900">
                             {step === 'verify' ? 'Security Check' : 'Create PIN'}
                        </h1>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                            {step === 'verify' 
                                ? 'Please confirm your password to set a new security PIN.' 
                                : 'Set a 4-digit PIN to secure your journal entries.'}
                        </p>
                    </div>

                    {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-red-50 text-red-600 font-bold text-sm rounded-2xl text-center">
                            {error}
                        </motion.div>
                    )}

                    {step === 'verify' ? (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiLock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black transition-colors cursor-pointer"
                                >
                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-black text-white text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? 'Verifying...' : 'Verify Identity'}
                            </button>
                        </form>
                    ) : (
                         <form onSubmit={handleSetMpin} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                        <FiHash size={20} />
                                    </div>
                                    <input
                                        type="tel"
                                        maxLength="4"
                                        required
                                        value={mpin}
                                        onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                        placeholder="Enter 4-digit PIN"
                                    />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                        <FiShield size={20} />
                                    </div>
                                    <input
                                        type="tel"
                                        maxLength="4"
                                        required
                                        value={confirmMpin}
                                        onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                        placeholder="Confirm 4-digit PIN"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-black text-white text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? 'Securing Account...' : 'Set PIN & Continue'}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default SetMpin;
