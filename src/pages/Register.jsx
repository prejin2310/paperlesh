import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiChevronLeft, FiEye, FiEyeOff, FiAlertCircle, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Register = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);

            await signup(formData.email, formData.password, {
                fullName: formData.fullName,
                gender: formData.gender
            });

            toast.success('Account created successfully!');
            navigate('/set-mpin');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
            } else {
                setError('Failed to create an account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-6 md:p-12 flex flex-col relative overflow-hidden">
            
            {/* Background Decorations */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-100 rounded-full blur-[100px] opacity-60 pointer-events-none"
            />
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
                className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60 pointer-events-none"
            />

            {/* Nav */}
            <div className="flex justify-between items-center max-w-md w-full mx-auto relative z-10">
                <Link
                    to="/"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-900 hover:bg-gray-100 transition-colors"
                >
                    <FiChevronLeft size={24} />
                </Link>
                <div className="font-bold text-xl tracking-tight">MyJournle</div>
                <div className="w-10"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex items-center justify-center py-12 relative z-10"
            >
                <div className="w-full max-w-md space-y-8">
                    
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-gray-900">
                            Create Account
                        </h1>
                        <p className="text-gray-500 font-medium text-lg max-w-xs mx-auto">
                            Start tracking your life today for free.
                        </p>
                    </div>

                    {/* Feedback */}
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3"
                        >
                            <FiAlertCircle size={20} />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            
                            {/* Full Name */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiUser size={20} />
                                </div>
                                <input
                                    name="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Full Name"
                                />
                            </div>

                            {/* Email */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiMail size={20} />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Email Address"
                                />
                            </div>
                            
                            {/* Gender Select - Custom Styled */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors z-10">
                                   {/* You can add a gender icon here if you want */}
                                    <span className="text-xl font-bold">⚥</span>
                                </div>
                               <select
                                    name="gender"
                                    required
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer_not_to_say">Prefer not to say</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiChevronDown size={20} />
                                </div>
                            </div>


                            {/* Password */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiLock size={20} />
                                </div>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Create Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black transition-colors outline-none cursor-pointer"
                                >
                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>

                            {/* Confirm Password */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiLock size={20} />
                                </div>
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Confirm Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black transition-colors outline-none cursor-pointer"
                                >
                                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-black text-white text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                             {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Create Account"
                            )}
                        </button>

                         <p className="text-center text-gray-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-black font-bold hover:underline decoration-2 underline-offset-4">
                                Log in
                            </Link>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
