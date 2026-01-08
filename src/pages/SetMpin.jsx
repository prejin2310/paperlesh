import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHash, FiShield, FiArrowRight, FiLock, FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
        if (!/^\d*$/.test(mpin)) {
             return setError('MPIN must only contain numbers');
        }
        if (mpin !== confirmMpin) {
            return setError('MPINs do not match');
        }

        try {
            setError('');
            setLoading(true);

            // Update user profile in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                mpin: mpin,
                mpinSetAt: new Date().toISOString()
            });

            // Redirect to dashboard
            verifySession();
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Failed to set MPIN. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 font-sans p-4">
            
            <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl overflow-hidden p-8 relative">
                
                 {/* Top Navigation */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
                        <FiChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                     <button onClick={() => navigate('/dashboard')} className="text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-wider">
                        Skip Here
                    </button>
                </div>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {step === 'verify' ? 'Password' : 'Set MPIN'}
                    </h1>
                     <p className="text-gray-500 text-sm font-medium">
                        {step === 'verify' ? 'Verify your identity to proceed.' : 'Secure your account with 4-digit PIN.'}
                    </p>
                </div>

                {error && (
                     <div className="mb-6 p-4 bg-red-50 text-red-500 text-sm font-medium rounded-2xl">
                        {error}
                    </div>
                )}

                {step === 'verify' ? (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-1 relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                                placeholder="Enter your password"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                            </button>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                             className="w-full py-3 px-6 bg-black text-white rounded-full text-sm font-bold tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
                        >
                            {loading ? 'Verifying...' : 'Continue'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSetMpin} className="space-y-6">
                        <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">New MPIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    required
                                    value={mpin}
                                    onChange={(e) => setMpin(e.target.value)}
                                    className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-lg font-bold tracking-[0.5em] text-center placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                                    placeholder="••••"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Confirm MPIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    required
                                    value={confirmMpin}
                                    onChange={(e) => setConfirmMpin(e.target.value)}
                                     className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-lg font-bold tracking-[0.5em] text-center placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                                    placeholder="••••"
                                />
                            </div>
                        </div>

                         {/* Steps Indicator */}
                         <div className="flex justify-center py-4 space-x-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        </div>    

                        <button
                            type="submit"
                            disabled={loading}
                             className="w-full py-3 px-6 bg-black text-white rounded-full text-sm font-bold tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
                        >
                            {loading ? 'Saving...' : 'Continue'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SetMpin;
