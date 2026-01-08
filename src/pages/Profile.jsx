import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiUser, FiShield, FiMoon, FiLogOut, FiChevronRight, FiGlobe, FiChevronLeft, FiSun } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const menuItems = [
    { 
        title: "Account",
        items: [
            { icon: FiUser, label: 'Personal Information', sub: currentUser?.email, action: () => {} },
            { icon: FiShield, label: 'Security & MPIN', sub: 'Manage access', action: () => navigate('/set-mpin') },
        ]
    },
    {
        title: "App Settings",
        items: [
             { 
                 icon: isDarkMode ? FiSun : FiMoon, 
                 label: 'Appearance', 
                 sub: isDarkMode ? 'Dark Mode On' : 'Light Mode On', 
                 action: toggleTheme 
             },
             { icon: FiGlobe, label: 'Language', sub: 'English', action: () => {} },
        ]
    }
  ];

  return (
    <div className={`min-h-screen font-sans p-6 md:p-12 relative overflow-hidden pb-24 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
       
       {/* Background Blooms */}
       <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className={`absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}
        />
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-pink-900/30' : 'bg-pink-50'}`}
        />

        {/* Content Container */}
        <div className="relative z-10 max-w-lg mx-auto">
            
            {/* Nav */}
            <div className="flex items-center justify-between mb-8">
                <Link to="/dashboard" className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}>
                    <FiChevronLeft size={24} />
                </Link>
                <div className="font-bold text-lg tracking-tight">Settings</div>
                <div className="w-10"></div>
            </div>

            {/* Profile Header */}
             <div className="text-center space-y-4 mb-12">
                <div className={`w-24 h-24 rounded-[2rem] mx-auto flex items-center justify-center text-4xl font-bold shadow-2xl ${isDarkMode ? 'bg-gray-800 text-white shadow-none' : 'bg-black text-white shadow-blue-100'}`}>
                     {currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : currentUser?.email?.[0].toUpperCase()}
                </div>
                <div>
                     <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentUser?.fullName || 'Journiq User'}
                    </h1>
                    <p className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {currentUser?.email}
                    </p>
                </div>
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    Free Member
                </div>
            </div>

            {/* Menu Groups */}
            <div className="space-y-8">
                {menuItems.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-4">
                        <h3 className={`text-sm font-bold uppercase tracking-widest px-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {group.title}
                        </h3>
                        <div className="space-y-3">
                            {group.items.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={item.action}
                                    className={`w-full flex items-center justify-between p-4 transition-colors rounded-2xl group active:scale-[0.99] cursor-pointer ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                                            <item.icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.label}</div>
                                            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{item.sub}</div>
                                        </div>
                                    </div>
                                    <FiChevronRight className={`transition-colors ${isDarkMode ? 'text-gray-600 group-hover:text-white' : 'text-gray-300 group-hover:text-black'}`} size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                 {/* Logout Button */}
                 <div className="pt-4">
                    <button 
                        onClick={handleLogout}
                        className={`w-full py-4 px-6 text-lg font-bold rounded-2xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${isDarkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                    >
                        <FiLogOut />
                        Sign Out
                    </button>
                 </div>

                 <div className="text-center pt-8 pb-8">
                     <p className={`text-xs font-bold tracking-widest uppercase ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>Version 1.0.0</p>
                 </div>
            </div>

        </div>
    </div>
  );
};

export default Profile;
