import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar'; // Renamed from BottomNav for clarity

const Layout = () => {
  const { currentUser, isMpinVerified } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (!isMpinVerified) {
      navigate('/verify-mpin');
    }
  }, [currentUser, isMpinVerified, navigate]);

  if (!currentUser || !isMpinVerified) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
      <Navbar />
      <main className="flex-1 w-full relative overflow-y-auto h-screen pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
