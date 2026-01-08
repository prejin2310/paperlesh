import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

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
    
    // Basic validation
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
      
      // Redirect to MPIN setup instead of dashboard
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h1>
            <p className="text-gray-500 text-sm font-medium">Require information to account creations</p>
        </div>

        {/* Feedback */}
        {error && (
             <div className="mb-6 p-4 bg-red-50 text-red-500 text-sm font-medium rounded-2xl">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                 <input
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                    placeholder="Full Name"
                />
            </div>

            <div className="space-y-1">
                <input
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
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

             <div className="space-y-1 relative">
                <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                    placeholder="Repeat Password"
                />
                 <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
            </div>

            {/* Gender Selection */}
            <div className="flex gap-4">
                {['Male', 'Female'].map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gender: option }))}
                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
                            formData.gender === option 
                            ? 'bg-black text-white shadow-lg shadow-gray-900/20' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-black text-white rounded-full text-sm font-bold tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
            >
                {loading ? 'Creating...' : 'Continue'}
            </button>
        </form>

        <div className="mt-10 text-center">
            <p className="text-sm font-medium text-gray-400">
                Already have an Account?{' '}
                <Link to="/login" className="text-red-500 hover:text-red-600 font-bold ml-1 transition-colors uppercase text-xs tracking-wider">
                Login
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
