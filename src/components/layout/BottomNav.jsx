import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiCalendar, FiList, FiUser } from 'react-icons/fi';

const BottomNav = () => {
  const navItems = [
    { to: '/home', icon: <FiHome className="w-6 h-6" />, label: 'Home' },
    { to: '/track', icon: <FiGrid className="w-6 h-6" />, label: 'Track' },
    { to: '/month', icon: <FiCalendar className="w-6 h-6" />, label: 'Month' },
    { to: '/logs', icon: <FiList className="w-6 h-6" />, label: 'Logs' },
    { to: '/profile', icon: <FiUser className="w-6 h-6" />, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`
            }
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
