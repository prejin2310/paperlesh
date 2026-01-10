import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { InstallProvider } from './context/InstallContext';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Track from './pages/Track';
import Month from './pages/Month';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import SetMpin from './pages/SetMpin';
import VerifyMpin from './pages/VerifyMpin';
import InstallApp from './pages/InstallApp';
import AddCustomHabit from './pages/AddCustomHabit';
import NotFound from './pages/NotFound';

const RootRoute = () => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/dashboard" replace /> : <Landing />;
};

function App() {
  return (
    <InstallProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/set-mpin" element={<SetMpin />} />
          <Route path="/verify-mpin" element={<VerifyMpin />} />
          <Route path="/install-app" element={<InstallApp />} />
          
          {/* Protected Routes (wrapped in Layout) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/track" element={<Track />} />
            <Route path="/month/:month?" element={<Month />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/add-habit" element={<AddCustomHabit />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </InstallProvider>
  );
}

export default App
