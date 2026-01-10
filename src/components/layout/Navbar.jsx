import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiCheckSquare, FiGrid, FiBook, FiUser, FiLogOut, FiPlus, FiCalendar, FiActivity } from 'react-icons/fi';

const Navbar = () => {
    const location = useLocation();
    
    // Check if we are on the dashboard
    const isDashboard = location.pathname === '/dashboard' && !location.search.includes('action');

  const navItems = [
    { to: '/dashboard', icon: <FiHome size={22} />, label: 'Home' },
    { to: '/track', icon: <FiActivity size={22} />, label: 'Habits' },
    { to: '/month', icon: <FiCalendar size={22} />, label: 'Month' },
    { to: '/logs', icon: <FiGrid size={22} />, label: 'Journal' },
    { to: '/profile', icon: <FiUser size={22} />, label: 'Profile' },
  ];

  return (
    <>
      {/* Absolute FAB - Custom Add */}
      {isDashboard && (
          <div className="md:hidden fixed bottom-32 right-6 z-50">
                <NavLink
                    to="/add-habit"
                    className="flex flex-col items-center justify-center"
                >
                    <div className="w-14 h-14 bg-[#FFB800] rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-300/40 transform transition-all active:scale-90 hover:scale-105 border-4 border-white/20 dark:border-black/20 backdrop-blur-sm">
                        <FiPlus size={26} />
                    </div>
                </NavLink>
          </div>
      )}

      {/* Mobile Bottom Navigation - Floating Glass Design */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 h-[72px]">
         <div className="absolute inset-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none"></div>
         
         <div className="relative z-10 h-full flex justify-between items-center px-2"> 
            {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'} // Only exact match for dashboard home
                  className={({ isActive }) =>
                    `flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-300 rounded-3xl relative group`
                  }
                >
                   {({ isActive }) => (
                      <>
                        {/* Active Indicator Background */}
                        {isActive && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black dark:bg-white rounded-full transition-all duration-300 shadow-md"></div>
                        )}
                        
                        <div className={`relative z-10 transition-all duration-300 ${isActive ? 'text-white dark:text-black translate-y-0' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                            {item.icon}
                        </div>
                        
                        {/* Optional: Label (Hidden on this minimal design or show only active?) */}
                        {/* Let's keep it minimal icon-only for the floating look, or maybe small dot for active? 
                            The user likes "Modern". Icon inside circle is very modern. 
                        */}
                      </>
                   )}
                </NavLink>
              ))}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:flex flex-col w-72 bg-white dark:bg-black border-r border-gray-100 dark:border-gray-900 h-screen sticky top-0 p-6">
        <div className="mb-10 px-2">
          <h1 className="text-3xl font-black tracking-tighter text-black dark:text-white">MyJournle.</h1>
        </div>
        
        <div className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-gray-200 dark:shadow-none'
                    : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white'
                }`
              }
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </div>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-900">
          <button className="flex items-center space-x-4 px-6 py-4 w-full text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-2xl transition-all duration-300">
            <FiLogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
