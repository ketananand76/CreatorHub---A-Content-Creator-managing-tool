import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, HelpCircle, Bell, ArrowUpRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TopHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <header className="sticky top-0 right-0 h-20 border-b glass flex items-center justify-between px-8 z-20">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
          {getPageTitle()}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Welcome back, {user.name} 👋
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Support Link */}
        <button
          onClick={() => navigate('/support')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Get Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Alerts Bell */}
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>

        {/* Premium Upgrade Button */}
        {user.role === 'Creator' && (
          user.isPremium ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-xl text-yellow-600 dark:text-yellow-400 font-bold text-xs select-none">
              <Sparkles className="w-3.5 h-3.5" />
              AI Premium Active
            </div>
          ) : (
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 transition-all scale-95 hover:scale-100"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Go Premium
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )
        )}

        {/* Role tag */}
        <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {user.role} Account
        </span>
      </div>
    </header>
  );
}
