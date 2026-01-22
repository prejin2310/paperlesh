import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiUser, FiShield, FiMoon, FiLogOut, FiChevronRight, FiGlobe, FiChevronLeft, FiSun, FiCamera, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // State
  const [view, setView] = useState('main'); // 'main', 'personal_info'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [formData, setFormData] = useState({
      fullName: '',
      gender: 'male', // default
      phone: ''
  });

  useEffect(() => {
    if (currentUser) {
        setFormData({
            fullName: currentUser.fullName || '',
            gender: currentUser.gender?.toLowerCase() || 'male',
            phone: currentUser.phone || '' 
        });
    }
  }, [currentUser]);

  // Logout Logic
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out');
    }
  };

  // Update Profile Logic
  const handleUpdateProfile = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
              fullName: formData.fullName,
              gender: formData.gender,
              phone: formData.phone
          });
          toast.success("Profile updated!");
          setView('main');
          // Update local storage or trigger a forced reload if needed, but context might handle generic state.
          // Since we updated firestore, next fetch should be correct.
      } catch (e) {
          console.error(e);
          toast.error("Failed to update profile");
      } finally {
          setLoading(false);
      }
  };

  // Avatar Helper
  const getAvatar = (gender) => {
      const seed = currentUser?.email || 'user';
      if (gender === 'female') {
          return `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&baseColor=f472b6&mouth=smile&eyebrows=up`; // Pinkish base for variety
      } else {
          return `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&baseColor=60a5fa&mouth=smile&eyebrows=up`; // Blueish base
      }
  };

  // Render Logic
  const currentAvatar = getAvatar(formData.gender || currentUser?.gender || 'male');

  return (
    <div className={`min-h-screen font-sans p-6 md:p-8 relative overflow-hidden pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-[#FDFBF9] text-gray-900'}`}>
       
       {/* Background Blooms */}
       <div className={`fixed top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 pointer-events-none ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`} />
       <div className={`fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 pointer-events-none ${isDarkMode ? 'bg-purple-900' : 'bg-purple-100'}`} />

        <div className="relative z-10 max-w-md mx-auto h-full flex flex-col">
            
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-8">
                {view === 'main' ? (
                     <Link to="/dashboard" className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100 shadow-sm'}`}>
                        <FiChevronLeft size={24} />
                    </Link>
                ) : (
                    <button onClick={() => setView('main')} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100 shadow-sm'}`}>
                        <FiChevronLeft size={24} />
                    </button>
                )}
                
                <div className="font-bold text-xl tracking-tight">
                    {view === 'main' ? 'My Profile' : 'Personal Information'}
                </div>
            </div>

            <AnimatePresence mode="wait">
            {view === 'main' ? (
                <motion.div 
                    key="main"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 flex-1"
                >
                    {/* Profile Card */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl">
                                <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover bg-gray-100 dark:bg-gray-700"/>
                            </div>
                            <div className={`absolute bottom-0 right-0 p-2 rounded-full border-4 border-white dark:border-gray-900 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-black text-white'}`}>
                                <FiUser size={14} />
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-black tracking-tight">{currentUser?.fullName || 'User'}</h2>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentUser?.email}</p>
                        </div>
                    </div>

                    {/* Menu Sections */}
                    <div className="space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-3">
                            <h3 className={`text-xs font-bold uppercase tracking-widest px-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Account</h3>
                            <div className={`rounded-3xl overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-sm shadow-indigo-100'}`}>
                                <button onClick={() => setView('personal_info')} className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <FiUser size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Personal Information</div>
                                            <div className="text-[10px] opacity-60 font-medium">Name, Gender, Details</div>
                                        </div>
                                    </div>
                                    <FiChevronRight className="opacity-40" />
                                </button>
                                <div className="h-[1px] bg-gray-100 dark:bg-gray-800 mx-16"></div>
                                <button onClick={() => navigate('/set-mpin')} className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <FiShield size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Security & MPIN</div>
                                            <div className="text-[10px] opacity-60 font-medium">Manage App Lock</div>
                                        </div>
                                    </div>
                                    <FiChevronRight className="opacity-40" />
                                </button>
                            </div>
                        </div>

                         {/* App Settings */}
                         <div className="space-y-3">
                            <h3 className={`text-xs font-bold uppercase tracking-widest px-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>App Settings</h3>
                            <div className={`rounded-3xl overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-sm shadow-indigo-100'}`}>
                                <button onClick={toggleTheme} className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                                            {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Appearance</div>
                                            <div className="text-[10px] opacity-60 font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</div>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-5' : ''}`} />
                                    </div>
                                </button>
                                <div className="h-[1px] bg-gray-100 dark:bg-gray-800 mx-16"></div>
                                <button className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-pink-400' : 'bg-pink-50 text-pink-600'}`}>
                                            <FiGlobe size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Language</div>
                                            <div className="text-[10px] opacity-60 font-medium">English (Default)</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Logout */}
                        <div className="pt-4">
                             <button 
                                onClick={() => setShowLogoutConfirm(true)}
                                className={`w-full py-4 rounded-3xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isDarkMode ? 'bg-red-900/10 text-red-400 hover:bg-red-900/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                             >
                                <FiLogOut size={18} />
                                Log Out
                             </button>
                        </div>
                    </div>
                </motion.div>
            ) : view === 'personal_info' ? (
                <motion.div 
                    key="personal_info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col"
                >
                    <div className={`flex-1 rounded-3xl p-6 space-y-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-sm shadow-indigo-100'}`}>
                        
                        {/* Gender Selection */}
                        <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest opacity-50">Select Gender</label>
                             <div className="grid grid-cols-2 gap-4">
                                 {['Male', 'Female'].map(g => (
                                     <button
                                        key={g}
                                        onClick={() => setFormData({...formData, gender: g.toLowerCase()})}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                            formData.gender === g.toLowerCase() 
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                            : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-400'
                                        }`}
                                     >
                                         <img src={getAvatar(g.toLowerCase())} className="w-12 h-12 rounded-full" />
                                         <span className="font-bold text-sm">{g}</span>
                                     </button>
                                 ))}
                             </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-50">Full Name</label>
                                <input 
                                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.fullName}
                                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                                    placeholder="Enter full name"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-50">Email Address</label>
                                <input 
                                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 font-bold outline-none opacity-60 cursor-not-allowed"
                                    value={currentUser?.email}
                                    disabled
                                />
                                <p className="text-[10px] text-gray-400 px-2">Email cannot be changed.</p>
                             </div>
                        </div>

                    </div>
                    
                    <div className="py-6">
                        <button 
                            onClick={handleUpdateProfile}
                            disabled={loading}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all"
                        >
                            {loading ? 'Updating Profile...' : 'Save Changes'}
                        </button>
                    </div>

                </motion.div>
            ) : null}
            </AnimatePresence>
            
            <div className="mt-auto pt-8 text-center bg-transparent">
                 <p className={`text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                     Developed by PR Labs
                 </p>
            </div>
            
        </div>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                   <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowLogoutConfirm(false)}
                   />
                   <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className={`relative w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
                   >
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <FiLogOut size={32} />
                        </div>
                        <h3 className="text-xl font-black text-center mb-2">Log Out?</h3>
                        <p className="text-center opacity-60 font-medium mb-8">
                            Are you sure you want to sign out of MyJournle? Your data is safe.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors"
                            >
                                Yes, Logout
                            </button>
                        </div>
                   </motion.div>
                </div>
            )}
        </AnimatePresence>

    </div>
  );
};

export default Profile;
