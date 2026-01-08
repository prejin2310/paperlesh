import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHash, FiShield, FiArrowRight, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const VerifyMpin = () => {
    const navigate = useNavigate();
    const { currentUser, verifySession } = useAuth();
    
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

    if (!currentUser) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 font-sans p-4">
            <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl overflow-hidden p-8 relative">
                
                {/* Top Navigation */}
                 <div className="flex justify-between items-center mb-8">
                    <Link to="/login" className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
                        <FiChevronLeft className="w-6 h-6 text-gray-800" />
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Check</h1>
                    <p className="text-gray-500 text-sm font-medium">Please enter your MPIN to continue.</p>
                </div>

                {error && (
                     <div className="mb-6 p-4 bg-red-50 text-red-500 text-sm font-medium rounded-2xl text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerifyMpin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">MPIN</label>
                        <div className="relative group">
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
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                             className="w-full py-3 px-6 bg-black text-white rounded-full text-sm font-bold tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
                        >
                            {loading ? 'Verifying...' : 'Verify & Enter'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyMpin;
