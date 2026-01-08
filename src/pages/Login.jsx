import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  
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
      navigate('/verify-mpin');
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 font-sans p-4">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl overflow-hidden p-8 relative">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
            <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
                <FiChevronLeft className="w-6 h-6 text-gray-800" />
            </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isResetting ? 'Forgot Password' : 'Welcome back!'}
            </h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                {isResetting ? 'Enter your email to recover your account.' : 'Enter your credentials to log in'}
            </p>
        </div>

        {/* Feedback */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 text-sm font-medium rounded-2xl flex items-center">
                <FiAlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {error}
            </div>
        )}
        {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-medium rounded-2xl flex items-center">
                <FiCheck className="w-5 h-5 mr-3 flex-shrink-0" />
                {success}
            </div>
        )}

        {!isResetting ? (
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                        placeholder="Email address"
                    />
                </div>

                <div className="space-y-1 relative">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                        placeholder="Password"
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                </div>

                <div className="flex justify-end pt-1">
                    <button 
                        type="button" 
                        onClick={() => { setIsResetting(true); setError(''); setSuccess(''); }}
                        className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 bg-black text-white rounded-full text-sm font-bold tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
                >
                    {loading ? 'Logging In...' : 'Sign in'}
                </button>
            </form>
        ) : (
             <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-1">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                        placeholder="Email address"
                    />
                </div>

                 <div className="space-y-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-6 bg-black text-white rounded-full text-sm font-bold tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
                    >
                        {loading ? 'Sending...' : 'Send Link'}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => { setIsResetting(false); setError(''); setSuccess(''); }}
                         className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
             </form>
        )}

        {!isResetting && (
            <div className="mt-10 text-center">
                <p className="text-sm font-medium text-gray-400">
                    Don't have an Account?{' '}
                    <Link to="/register" className="text-red-500 hover:text-red-600 font-bold ml-1 transition-colors uppercase text-xs tracking-wider">
                        Register Now
                    </Link>
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Login;
