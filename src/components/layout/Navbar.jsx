import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiCalendar, FiList, FiUser, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const navItems = [
    { to: '/dashboard', icon: <FiHome className="w-6 h-6 md:w-5 md:h-5" />, label: 'Home' },
    { to: '/track', icon: <FiGrid className="w-6 h-6 md:w-5 md:h-5" />, label: 'Track' },
    { to: '/month', icon: <FiCalendar className="w-6 h-6 md:w-5 md:h-5" />, label: 'Month' },
    { to: '/logs', icon: <FiList className="w-6 h-6 md:w-5 md:h-5" />, label: 'Logs' },
    { to: '/profile', icon: <FiUser className="w-6 h-6 md:w-5 md:h-5" />, label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-black dark:bg-gray-900 border dark:border-gray-800 text-white dark:text-gray-300 rounded-full shadow-2xl py-4 z-50">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 text-black dark:text-white translate-y-[-4px] shadow-lg scale-110'
                    : 'text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300'
                }`
              }
            >
              {item.icon}
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
