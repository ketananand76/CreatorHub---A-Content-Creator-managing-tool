import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import AdSenseBanner from './AdSenseBanner';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  DollarSign,
  Users,
  Award,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LifeBuoy,
  Settings
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Creator', 'Team Member'] },
    { path: '/calendar', label: 'Content Calendar', icon: Calendar, roles: ['Creator', 'Team Member'] },
    { path: '/crm', label: 'Brand CRM', icon: Layers, roles: ['Creator'] },
    { path: '/earnings', label: 'Earnings Tracker', icon: DollarSign, roles: ['Creator'] },
    { path: '/team', label: 'Team Hub', icon: Users, roles: ['Creator', 'Team Member'] },
    { path: '/settings', label: 'Settings & Profile', icon: Settings, roles: ['Creator', 'Team Member'] },
    { path: '/subscription', label: 'Premium Upgrades', icon: Award, roles: ['Creator'] },
    { path: '/admin', label: 'Admin Panel', icon: Shield, roles: ['Admin', 'Super Admin'] },
    { path: '/support', label: 'Help & Tickets', icon: LifeBuoy, roles: ['Creator', 'Team Member'] },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <motion.aside
      animate={{ width: collapsed ? '80px' : '280px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="sticky top-0 left-0 h-screen flex flex-col justify-between border-r glass backdrop-blur-md z-30 select-none overflow-hidden"
    >
      {/* Header / Logo */}
      <div className="p-5 flex items-center justify-between border-b dark:border-slate-800">
        <div className="flex items-center min-w-0">
          <Logo size={28} showText={!collapsed} textClassName="text-lg font-bold font-outfit text-gradient tracking-wide" />
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronLeft className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile Toggle */}
      <div className="p-4 border-t dark:border-slate-800 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-slate-600 dark:text-slate-300"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-amber-400" />
              {!collapsed && <span className="text-sm font-medium">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-indigo-500" />
              {!collapsed && <span className="text-sm font-medium">Dark Mode</span>}
            </>
          )}
        </button>

        {!collapsed && <AdSenseBanner type="sidebar" />}

        {/* User Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-base shadow-md uppercase">
              {user.name.charAt(0)}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <h4 className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-200 truncate">
                    {user.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 uppercase leading-none">
                      {user.role}
                    </span>
                    {user.isPremium && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 uppercase leading-none">
                        PRO
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
