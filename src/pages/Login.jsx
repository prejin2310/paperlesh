import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiChevronLeft, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login, resetPassword, currentUser } = useAuth();
  
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(formData.email, formData.password);
      // Navigation will be handled by the useEffect below
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Please check your email and password.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      navigate('/verify-mpin');
    }
  }, [currentUser, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!formData.email) {
        return setError('Please enter your email address to reset password.');
    }
    try {
        setError('');
        setSuccess('');
        setLoading(true);
        await resetPassword(formData.email);
        setSuccess('Check your inbox for further instructions.');
    } catch (err) {
        console.error(err);
        setError('Failed to reset password. ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans p-6 md:p-12 flex flex-col relative overflow-hidden">
       
       {/* Background Decorations */}
       <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60 pointer-events-none"
        />
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-50 rounded-full blur-[100px] opacity-60 pointer-events-none"
        />

       {/* Top Bar */}
       <div className="flex justify-between items-center max-w-md w-full mx-auto relative z-10">
             <Link 
                to="/" 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-900 hover:bg-gray-100 transition-colors"
            >
                <FiChevronLeft size={24} />
            </Link>
            <div className="font-bold text-xl tracking-tight">MyJournle</div>
            <div className="w-10"></div> {/* Spacer */}
       </div>

       {/* Main Content */}
       <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center relative z-10"
       >
           <div className="w-full max-w-md space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">
                        {isResetting ? 'Reset Password' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-500 font-medium text-lg max-w-xs mx-auto">
                        {isResetting ? 'Enter your email to recover your account.' : 'Sign in to continue your journey.'}
                    </p>
                </div>

                 {/* Feedback */}
                {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3">
                        <FiAlertCircle size={20} />
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-green-50 text-green-600 text-sm font-medium rounded-2xl flex items-center gap-3">
                        <FiCheck size={20} />
                        {success}
                    </motion.div>
                )}

                {!isResetting ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiMail size={20} />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Enter your email"
                                />
                            </div>
                             <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <FiLock size={20} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black transition-colors outline-none cursor-pointer"
                                >
                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>
                        </div>

                         <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setIsResetting(true)}
                                className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-black text-white text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                         <p className="text-center text-gray-500 font-medium">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-black font-bold hover:underline decoration-2 underline-offset-4">
                                Create one
                            </Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                         <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                <FiMail size={20} />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl text-base font-bold text-gray-900 placeholder-gray-400 transition-all outline-none"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="flex gap-4">
                             <button
                                type="button"
                                onClick={() => setIsResetting(false)}
                                className="flex-1 py-4 px-6 bg-gray-100 text-gray-900 text-lg font-bold rounded-2xl hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                             <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-4 px-6 bg-black text-white text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 cursor-pointer"
                            >
                                {loading ? "Sending..." : "Send Link"}
                            </button>
                        </div>
                    </form>
                )}
           </div>
       </motion.div>
    </div>
  );
};

export default Login;
