import { useAuth } from '../context/AuthContext';
import { FiUser, FiSettings, FiShield, FiMoon, FiLogOut, FiChevronRight, FiCreditCard, FiGlobe } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: FiUser, label: 'Personal Information', sub: currentUser?.email },
        { icon: FiShield, label: 'Security & MPIN', sub: 'Manage your access PIN' },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: FiMoon, label: 'Appearance', sub: 'Light Mode' },
        { icon: FiGlobe, label: 'Language', sub: 'English (US)' },
      ]
    }
  ];

  return (
    <div className="pb-24 pt-8 px-6 md:px-12 md:py-12 max-w-3xl mx-auto">
       {/* Header */}
       <div className="mb-12">
          <h1 className="text-4xl font-black text-black tracking-tight mb-2">Profile</h1>
          <p className="text-gray-400 font-medium">Manage your settings and preferences.</p>
      </div>

      {/* User Card */}
      <div className="bg-black text-white rounded-[2.5rem] p-8 mb-12 shadow-2xl shadow-gray-200">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold">
            {currentUser?.fullName?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{currentUser?.fullName || 'User'}</h2>
            <p className="text-white/60 font-medium">{currentUser?.email}</p>
            <div className="mt-4 inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
               Free Plan
            </div>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-10">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 ml-4">
              {group.title}
            </h3>
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
              {group.items.map((item, index) => (
                <button 
                  key={index}
                  className={`w-full text-left px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    index !== group.items.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-black">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">{item.label}</p>
                      {item.sub && <p className="text-gray-400 text-xs mt-0.5">{item.sub}</p>}
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-300 w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-500 font-bold py-5 rounded-[2rem] hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>

         <div className="text-center pt-8">
            <p className="text-gray-300 text-xs font-medium">MyJournle v1.0.0</p>
         </div>
      </div>
    </div>
  );
};

export default Profile;
