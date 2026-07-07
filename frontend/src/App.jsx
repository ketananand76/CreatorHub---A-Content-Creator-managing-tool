import Logo from './components/Logo';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import BrandCRM from './pages/BrandCRM';
import Earnings from './pages/Earnings';
import TeamHub from './pages/TeamHub';
import Subscription from './pages/Subscription';
import SuperAdmin from './pages/SuperAdmin';
import Support from './pages/Support';
import SettingsPage from './pages/SettingsPage';
import CookieConsent from './components/CookieConsent';
import SocialTracker from './pages/SocialTracker';
import AuthSuccess from './pages/AuthSuccess';
import Referrals from './pages/Referrals';

// Components
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex justify-center items-center my-4"><Logo animated={true} size={48} /></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin/Super Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex justify-center items-center my-4"><Logo animated={true} size={48} /></div>
      </div>
    );
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

// App Layout Wrapper
const AppLayout = () => {
  const { user } = useAuth();
  const currentRole = user?.role;
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-dark-text transition-colors duration-300">
      <Sidebar mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader setMobileSidebarOpen={setMobileSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-dark-bg/60">
          <Routes>
            <Route path="/" element={currentRole === 'Admin' || currentRole === 'Super Admin' ? <Navigate to="/admin" replace /> : <Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/crm" element={<BrandCRM />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/team" element={<TeamHub />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/support" element={<Support />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/tracker" element={<SocialTracker />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <SuperAdmin />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CookieConsent />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Routes>
              {/* Unprotected Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ResetPassword />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/auth-success" element={<AuthSuccess />} />

              {/* Protected Workspace Layout */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}
