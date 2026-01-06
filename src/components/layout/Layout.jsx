import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-16">
      <main className="max-w-md mx-auto min-h-screen bg-white dark:bg-gray-950 shadow-xl overflow-hidden relative">
        <Outlet />
        <BottomNav />
      </main>
    </div>
  );
};

export default Layout;
