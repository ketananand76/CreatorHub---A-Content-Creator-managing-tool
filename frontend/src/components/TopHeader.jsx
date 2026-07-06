import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, HelpCircle, Bell, ArrowUpRight, Menu, Check, ShieldAlert, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification as useAppNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopHeader({ setMobileSidebarOpen }) {
  const { user, authFetch } = useAuth();
  const { showNotification, playNotificationSound } = useAppNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotificationsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications — fully silent, never crashes on network errors or missing endpoint
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await authFetch('/notifications');
      if (!res || !res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        const newNotifications = data.notifications || [];
        const unread = newNotifications.filter(n => !n.isRead).length;

        // Play sound if there are new unread notifications
        if (unread > unreadCount && playNotificationSound) {
          playNotificationSound();
        }

        setNotifications(newNotifications);
        setUnreadCount(unread);
      }
    } catch {
      // Silently ignore — notifications are non-critical, endpoint may not be deployed yet
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await authFetch(`/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) fetchNotifications();
    } catch (error) {
      // Silently ignore
    }
  };

  if (!user) return null;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/calendar': return 'Content Calendar';
      case '/crm': return 'Brand Deals CRM';
      case '/earnings': return 'Earnings Tracker';
      case '/team': return 'Team Workspace';
      case '/subscription': return 'Premium Subscriptions';
      case '/admin': return 'Super Admin Command Panel';
      case '/support': return 'Support Tickets';
      default: return 'CreatorHub';
    }
  };

  return (
    <header className="sticky top-0 right-0 h-20 border-b glass flex items-center justify-between px-4 sm:px-8 z-20">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu on Mobile */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white font-outfit">
            {getPageTitle()}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Welcome back, {user.name} 👋
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Support Link */}
        <button
          onClick={() => navigate('/support')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Get Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Alerts Bell and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotificationsDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 max-h-[420px] overflow-y-auto bg-white dark:bg-dark-card border dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 space-y-3"
              >
                <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => {
                      let typeColor = 'text-blue-500 bg-blue-500/10';
                      if (n.type === 'subscription') typeColor = 'text-amber-500 bg-amber-500/10';
                      else if (n.type === 'broadcast') typeColor = 'text-purple-500 bg-purple-500/10';
                      
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          className={`p-3 rounded-xl border transition-all text-left flex gap-3 relative cursor-pointer ${
                            n.isRead
                              ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/60 opacity-70'
                              : 'bg-brand-500/5 dark:bg-brand-500/5 border-brand-500/20 dark:border-brand-500/20'
                          }`}
                        >
                          <div className={`p-2 rounded-lg flex-shrink-0 w-8 h-8 flex items-center justify-center ${typeColor}`}>
                            {n.type === 'subscription' ? <ShieldAlert className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                          </div>
                          <div className="space-y-1 pr-4 min-w-0 flex-1">
                            <h4 className="font-bold text-xs leading-snug dark:text-white truncate">
                              {n.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal break-words">
                              {n.message}
                            </p>
                            <span className="text-[8px] text-slate-400 block font-medium mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              className="absolute top-3 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Premium Upgrade Button */}
        {user.role === 'Creator' && (
          user.isPremium ? (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-xl text-yellow-600 dark:text-yellow-400 font-bold text-[10px] sm:text-xs select-none">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">AI Premium Active</span>
              <span className="inline xs:hidden">PRO</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold text-[10px] sm:text-xs shadow-md shadow-brand-500/20 transition-all scale-95 hover:scale-100"
            >
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>Go Premium</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )
        )}

        {/* Role tag */}
        <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {user.role} Account
        </span>
      </div>
    </header>
  );
}
