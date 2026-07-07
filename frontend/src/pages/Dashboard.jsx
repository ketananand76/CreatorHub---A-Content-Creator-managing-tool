import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import AdSenseBanner from '../components/AdSenseBanner';
import AdCarousel from '../components/AdCarousel';
import {
  Sparkles,
  TrendingUp,
  Briefcase,
  Calendar as CalendarIcon,
  CheckSquare,
  ArrowRight,
  DollarSign,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Dashboard() {
  const { authFetch, user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalDeals: 0,
    activeEvents: 0,
    pendingTasks: 0,
    monthlyEarnings: 0
  });
  const [deals, setDeals] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch CRM
        let crmRes = await authFetch('/crm');
        let crmData = await crmRes.json();
        
        // Fetch Calendar
        let calRes = await authFetch('/calendar');
        let calData = await calRes.json();

        // Fetch Team Tasks
        let teamRes = await authFetch('/team/tasks');
        let teamData = await teamRes.json();

        // Fetch Earnings summary
        let earnRes = await authFetch('/earnings');
        let earnData = await earnRes.json();

        const activeDeals = crmData.deals || [];
        const activeEvts = calData.events || [];
        const activeTsks = teamData.tasks || [];
        const earnLogs = earnData.summary || { totalIncome: 0 };

        setDeals(activeDeals.slice(0, 3));
        setEvents(activeEvts.slice(0, 3));
        setTasks(activeTsks.filter(t => t.status !== 'completed').slice(0, 3));

        setStats({
          totalDeals: activeDeals.length,
          activeEvents: activeEvts.length,
          pendingTasks: activeTsks.filter(t => t.status !== 'completed').length,
          monthlyEarnings: earnLogs.totalIncome || 0
        });
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex justify-center items-center my-4"><Logo animated={true} size={48} /></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-brand-700 via-violet-800 to-indigo-900 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Creator Workspace Live
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-outfit leading-tight">
            Supercharge your content workflow.
          </h1>
          <p className="mt-2 text-sm text-slate-200 leading-relaxed">
            Manage brand sponsorships, map content production dates, deploy team tasks, and review automated revenue forecasting all inside one cohesive dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/calendar')}
              className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs transition-transform hover:-translate-y-0.5"
            >
              Go to Calendar
            </button>
            {user.role === 'Creator' && !user.isPremium && (
              <button
                onClick={() => navigate('/subscription')}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-xs transition-transform hover:-translate-y-0.5 border border-white/10"
              >
                Activate AI Copilot
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Ad Carousel (Only for free users) */}
      {!user?.isPremium && (
        <motion.div variants={itemVariants}>
          <AdCarousel />
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Brand Partnerships', value: stats.totalDeals, icon: Briefcase, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20', path: '/crm' },
          { label: 'Scheduled Content', value: stats.activeEvents, icon: CalendarIcon, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', path: '/calendar' },
          { label: 'Active Tasks', value: stats.pendingTasks, icon: CheckSquare, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', path: '/team' },
          { label: 'Platform Revenue', value: `₹${stats.monthlyEarnings.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', path: '/earnings' }
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => navigate(stat.path)}
            className="p-6 rounded-2xl glass hover:shadow-lg transition-all duration-200 cursor-pointer border flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {stat.label}
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 font-outfit">
                {stat.value}
              </h3>
            </div>
            <div className={`p-3.5 rounded-xl border ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Dashboard Sub-columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming content schedule */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-500" />
                Upcoming Content Schedules
              </h3>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1"
              >
                View Calendar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No scheduled content campaigns found. Create one on the content calendar page.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => (
                  <div
                    key={evt._id || evt.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/30 dark:bg-slate-900/30 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Starts: {evt.start} • Platform: <span className="font-medium text-brand-500">{evt.platform}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase">
                      {evt.platform}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CRM Quick Deals View */}
          <div className="p-6 rounded-2xl glass border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Active Brand Sponsors
              </h3>
              <button
                onClick={() => navigate('/crm')}
                className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1"
              >
                Manage CRM <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {deals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No active sponsor deals logged. Initialize partnership pitches in CRM.
              </div>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div
                    key={deal._id || deal.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/30 dark:bg-slate-900/30 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {deal.sponsorName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Campaign: {deal.dealTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        ₹{deal.dealValue.toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Stage: {deal.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Workspace Sidebar Feeds (Active Tasks) */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="p-6 rounded-2xl glass border h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-500" />
                My To-Do Tasks
              </h3>
              <button
                onClick={() => navigate('/team')}
                className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1"
              >
                Team Hub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Clean board! No pending team tasks.
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task._id || task.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/30 dark:bg-slate-900/30 space-y-2.5"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t dark:border-slate-800 pt-2.5">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Due: {task.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Banner Ad (Only for free users) */}
      {!user?.isPremium && (
        <motion.div variants={itemVariants}>
          <AdSenseBanner type="banner" />
        </motion.div>
      )}
    </motion.div>
  );
}
