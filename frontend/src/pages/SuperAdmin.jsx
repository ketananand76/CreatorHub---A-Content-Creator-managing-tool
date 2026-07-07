import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Users,
  Award,
  DollarSign,
  UserX,
  Check,
  X,
  Activity,
  History,
  LifeBuoy,
  MessageSquare,
  Lock,
  Globe,
  Trophy,
  Brain
} from 'lucide-react';

export default function SuperAdmin() {
  const { authFetch } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('overview');
  const [referralNetwork, setReferralNetwork] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({}); // overview, leaderboard, users, admins, broadcast, payments, tickets, sessions, adsense
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalRevenue: 0,
    openTickets: 0,
    pendingTransactions: 0
  });

  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatorMetrics, setCreatorMetrics] = useState([]);
  const [selectedCreatorMetrics, setSelectedCreatorMetrics] = useState(null);

  // Modal reply ticket state
  const [replyTicketId, setReplyTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // AdSense integration state
  const [adCode, setAdCode] = useState('');
  const [savingAdCode, setSavingAdCode] = useState(false);

  // Leaderboard & AI Analyser state
  const [leaderboard, setLeaderboard] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Broadcast notice state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  
  const fetchBroadcastHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await authFetch('/notifications/broadcasts');
      const data = await res.json();
      if (data.success) {
        setBroadcastHistory(data.broadcasts);
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'broadcast') {
      fetchBroadcastHistory();
    }
  }, [activeTab]);

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      const res = await authFetch(`/notifications/broadcast/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('Broadcast deleted successfully', 'success');
        fetchBroadcastHistory();
      } else {
        showNotification(data.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      showNotification('Server error', 'error');
    }
  };

  const handleRemindBroadcast = async (id) => {
    if (!window.confirm('Send a reminder for this broadcast? This will bump it to the top.')) return;
    try {
      const res = await authFetch(`/notifications/broadcast/${id}/reminder`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('Reminder sent successfully', 'success');
        fetchBroadcastHistory();
      } else {
        showNotification(data.message || 'Failed to send reminder', 'error');
      }
    } catch (err) {
      showNotification('Server error', 'error');
    }
  };

  const fetchAdminData = async () => {
    try {
      // Stats
      const statRes = await authFetch('/admin/stats');
      const statData = await statRes.json();
      if (statData.success) setStats(statData.stats);

      // Users
      const uRes = await authFetch('/admin/users');
      const uData = await uRes.json();
      if (uData.success) setUsers(uData.users);

      // Payment Logs
      const pRes = await authFetch('/admin/payment-logs');
      const pData = await pRes.json();
      if (pData.success) setPayments(pData.logs);

      // Support Tickets
      const tRes = await authFetch('/admin/tickets');
      const tData = await tRes.json();
      if (tData.success) setTickets(tData.tickets);

      // Sessions
      const sRes = await authFetch('/admin/session-history');
      const sData = await sRes.json();
      if (sData.success) setSessions(sData.logs);

      // AdSense Settings
      const adRes = await authFetch('/admin/settings/adsense');
      const adData = await adRes.json();
      if (adData.success) setAdCode(adData.adCode || '');

      // Leaderboard stand-stats
      const lbRes = await authFetch('/admin/performance/leaderboard');
      const lbData = await lbRes.json();
      if (lbData.success) setLeaderboard(lbData.leaderboard || []);

      // Creator Metrics
      try {
        const cmRes = await authFetch('/social/admin/metrics');
        const cmData = await cmRes.json();
        if (cmData.success) setCreatorMetrics(cmData.metrics || []);
      } catch (cmErr) {
        console.error('Error fetching creator metrics:', cmErr);
      }
    } catch (e) {
      console.error(e);
      showNotification('Admin reports failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateUserStatus = async (userId, nextStatus) => {
    try {
      const res = await authFetch(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchAdminData();
      }
    } catch (e) {
      showNotification('Status update failed', 'error');
    }
  };

  const handleToggleUserPremium = async (userId) => {
    try {
      const res = await authFetch(`/admin/users/${userId}/toggle-premium`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchAdminData();
      }
    } catch (e) {
      showNotification('Failed to toggle premium status', 'error');
    }
  };

  const handleUpdateUserRole = async (userId, nextRole) => {
    try {
      const res = await authFetch(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchAdminData();
      }
    } catch (e) {
      showNotification('Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await authFetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchAdminData();
      }
    } catch (e) {
      showNotification('Delete user failed', 'error');
    }
  };

  const handleApprovePayment = async (txId) => {
    try {
      const res = await authFetch(`/admin/payment-logs/${txId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchAdminData();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Approval failed', 'error');
    }
  };

  const handleRejectPayment = async (txId) => {
    try {
      const res = await authFetch(`/admin/payment-logs/${txId}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchAdminData();
      }
    } catch (e) {
      showNotification('Rejection failed', 'error');
    }
  };

  const handleMasterEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/admin/users/${editingUser._id || editingUser.id}/edit`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('User Master Updated', 'success');
        setUsers(users.map(u => (u._id === (editingUser._id || editingUser.id) ? data.user : u)));
        setEditingUser(null);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (err) {
      showNotification('Failed to master edit user', 'error');
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const res = await authFetch(`/admin/tickets/${replyTicketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        setReplyTicketId(null);
        setReplyText('');
        fetchAdminData();
      }
    } catch (e) {
      showNotification('Reply submission failed', 'error');
    }
  };

  const handleSaveAdsense = async () => {
    setSavingAdCode(true);
    try {
      const res = await authFetch('/admin/settings/adsense', {
        method: 'POST',
        body: JSON.stringify({ adCode })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Failed to update AdSense settings', 'error');
    } finally {
      setSavingAdCode(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await authFetch('/admin/performance/ai-analysis');
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
        showNotification('AI Analysis generated successfully!', 'success');
      } else {
        showNotification(data.message || 'AI generation failed', 'error');
      }
    } catch (e) {
      showNotification('Failed to run AI audit', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    try {
      const res = await authFetch('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('System broadcast notice published successfully!', 'success');
        setBroadcastTitle('');
        setBroadcastMessage('');
        fetchBroadcastHistory();
      } else {
        showNotification(data.message || 'Failed to send broadcast', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Server communication failure', 'error');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const creatorsAndTeam = users.filter(u => u.role !== 'Admin' && u.role !== 'Super Admin');
  const adminUsers = users.filter(u => u.role === 'Admin' || u.role === 'Super Admin');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Tab Switcher */}
      <div className="flex overflow-x-auto gap-4 border-b dark:border-slate-800 pb-3 scrollbar-hide">
        {[
          { id: 'overview', label: 'Analytics System', icon: Activity },
          { id: 'leaderboard', label: 'Creator Standings', icon: Trophy },
          { id: 'creatorMetrics', label: 'Creator Metrics', icon: Globe },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'admins', label: 'Admin Profiles', icon: Lock },
          { id: 'broadcast', label: 'System Broadcasts', icon: MessageSquare },
          { id: 'payments', label: 'Payment Logs Queue', icon: DollarSign },
          { id: 'tickets', label: 'Support Queue', icon: LifeBuoy },
          { id: 'sessions', label: 'Security Logs', icon: History },
          { id: 'adsense', label: 'Google AdSense', icon: Globe },
          { id: 'referrals', label: 'Referral Folders', icon: FolderTree }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === t.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon className="w-4 h-4 text-slate-400" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* --- TAB: OVERVIEW --- */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Analytics metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Registered Creators', value: creatorsAndTeam.length, desc: `${stats.activeUsers} active sessions`, icon: Users, color: 'text-brand-500 bg-brand-500/10 border-brand-500/20' },
                  { label: 'Pro Subscriptions', value: stats.premiumUsers, desc: 'Premium workspace tiers', icon: Award, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                  { label: 'Platform Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, desc: 'Via verified UPI payments', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Support Open Tickets', value: stats.openTickets, desc: 'Awaiting resolutions', icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
                ].map((s, i) => (
                  <div key={i} className="glass p-6 rounded-2xl border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.label}</span>
                      <h3 className="text-2xl font-black mt-2 font-outfit dark:text-white">{s.value}</h3>
                      <span className="text-[10px] text-slate-400 block mt-1">{s.desc}</span>
                    </div>
                    <div className={`p-3.5 border rounded-xl ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action alert box */}
              {stats.pendingTransactions > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" /> You have {stats.pendingTransactions} pending subscription verification requests in queue.
                  </span>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-amber-600 transition-colors uppercase whitespace-nowrap"
                  >
                    Open Logs Queue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: LEADERBOARD & AI ANALYSER --- */}
          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leaderboard Table */}
              <div className="lg:col-span-2 glass p-6 rounded-2xl border space-y-6 overflow-hidden">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Platform Creator Leaderboard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Live standing ranking of creators based on earnings, task completion rates, and post activity volumes.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="pb-3">Rank</th>
                        <th className="pb-3">Creator Details</th>
                        <th className="pb-3">Total Earnings</th>
                        <th className="pb-3">Tasks Completed</th>
                        <th className="pb-3">Calendar Posts</th>
                        <th className="pb-3">Score</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {leaderboard.map((item, idx) => {
                        let rankBadgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                        if (idx === 0) rankBadgeColor = 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
                        else if (idx === 1) rankBadgeColor = 'bg-slate-400/10 text-slate-500 border border-slate-400/20';
                        else if (idx === 2) rankBadgeColor = 'bg-amber-600/10 text-amber-700 border border-amber-600/20';

                        return (
                          <tr key={item.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                            <td className="py-4">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${rankBadgeColor}`}>
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="font-semibold dark:text-white">{item.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{item.email}</div>
                            </td>
                            <td className="py-4 font-bold text-slate-700 dark:text-slate-200">
                              ₹{item.totalDealsValue.toLocaleString()}
                            </td>
                            <td className="py-4">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.tasksCompleted}</span>
                              <span className="text-slate-400">/{item.totalTasks}</span>
                            </td>
                            <td className="py-4 font-medium text-slate-700 dark:text-slate-300">
                              {item.calendarEventsCount} posts
                            </td>
                            <td className="py-4">
                              <span className="px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black rounded font-mono">
                                {item.score}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                item.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Performance Analyzer */}
              <div className="glass p-6 rounded-2xl border flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">AI Performance Insight</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Runs an automated smart audit evaluating creator campaigns, task throughput, and growth bottlenecks.
                  </p>

                  <div className="border-t dark:border-slate-800 pt-4">
                    {analyzing ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                        <span className="text-xs text-slate-400 animate-pulse">Running AI Audit...</span>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border dark:border-slate-800/80 max-h-[380px] overflow-y-auto text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-xs text-slate-400 border border-dashed dark:border-slate-800 rounded-2xl">
                        Click the button below to generate an AI performance analysis report.
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleRunAIAnalysis}
                  disabled={analyzing || leaderboard.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4" /> Run AI Performance Audit
                </button>
              </div>
            </div>
          )}

          {/* --- TAB: CREATOR METRICS --- */}
          {activeTab === 'creatorMetrics' && (
            <div className="glass p-6 rounded-2xl border space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-brand-500" />
                    Aggregate Creator Analytics
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Monitor connected social media metrics and live post views for all digital creators.</p>
                </div>
                <div className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-lg border border-brand-500/20">
                  {creatorMetrics.length} Linked Creators
                </div>
              </div>

              {/* Creator Metrics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Creator</th>
                      <th className="pb-3">Connected Channels</th>
                      <th className="pb-3">Total Followers</th>
                      <th className="pb-3">Total Views</th>
                      <th className="pb-3">Total Reach</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {creatorMetrics.map(cm => (
                      <tr key={cm.creatorId} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                        <td className="py-4">
                          <span className="font-semibold text-slate-800 dark:text-white block">{cm.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{cm.email}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-1.5">
                            {cm.accounts.map(acc => (
                              <span
                                key={acc.platform}
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                  acc.platform === 'youtube' ? 'bg-red-500/10 text-red-500 border-red-500/25' :
                                  acc.platform === 'instagram' ? 'bg-pink-500/10 text-pink-500 border-pink-500/25' :
                                  'bg-blue-500/10 text-blue-500 border-blue-500/25'
                                }`}
                                title={`@${acc.username}`}
                              >
                                {acc.platform}
                              </span>
                            ))}
                            {cm.accounts.length === 0 && (
                              <span className="text-slate-400 text-[10px] font-medium">None linked</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 font-bold font-mono text-slate-700 dark:text-slate-200">
                          {cm.aggregateMetrics.followers.toLocaleString()}
                        </td>
                        <td className="py-4 font-bold font-mono text-slate-700 dark:text-slate-200">
                          {cm.aggregateMetrics.views.toLocaleString()}
                        </td>
                        <td className="py-4 font-mono text-slate-500">
                          {cm.aggregateMetrics.reach.toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setSelectedCreatorMetrics(cm)}
                            disabled={cm.accounts.length === 0}
                            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:bg-slate-850 disabled:text-slate-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {creatorMetrics.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          No creators registered or linked.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Drawer Modal for Detailed Statistics */}
              <AnimatePresence>
                {selectedCreatorMetrics && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white dark:bg-[#0e1322] border dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-xl relative max-h-[90vh] overflow-y-auto"
                    >
                      <div className="flex justify-between items-start border-b dark:border-slate-800 pb-4">
                        <div>
                          <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white">
                            {selectedCreatorMetrics.name}'s Social Statistics
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{selectedCreatorMetrics.email}</p>
                        </div>
                        <button
                          onClick={() => setSelectedCreatorMetrics(null)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Channels Followers</span>
                          <span className="text-xl font-black mt-1 font-mono block dark:text-white">
                            {selectedCreatorMetrics.aggregateMetrics.followers.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Channel Views</span>
                          <span className="text-xl font-black mt-1 font-mono block dark:text-white">
                            {selectedCreatorMetrics.aggregateMetrics.views.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Network Reach</span>
                          <span className="text-xl font-black mt-1 font-mono block dark:text-white">
                            {selectedCreatorMetrics.aggregateMetrics.reach.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Recent Posts / Videos & Reels</h4>
                        <div className="overflow-x-auto border dark:border-slate-800 rounded-2xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900/40 border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                                <th className="p-3">Title / Caption</th>
                                <th className="p-3">Platform</th>
                                <th className="p-3">Views</th>
                                <th className="p-3">Reach</th>
                                <th className="p-3">Likes</th>
                                <th className="p-3">Comments</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                              {selectedCreatorMetrics.accounts.flatMap(acc =>
                                (acc.items || []).map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-100/10 dark:hover:bg-slate-800/10">
                                    <td className="p-3 font-semibold dark:text-white max-w-xs truncate">{item.title}</td>
                                    <td className="p-3">
                                      <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[8px] border ${
                                        acc.platform === 'youtube' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        acc.platform === 'instagram' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                      }`}>
                                        {acc.platform}
                                      </span>
                                    </td>
                                    <td className="p-3 font-bold font-mono dark:text-slate-200">{item.views.toLocaleString()}</td>
                                    <td className="p-3 font-mono text-slate-400">{item.reach.toLocaleString()}</td>
                                    <td className="p-3 text-slate-500">{item.likes.toLocaleString()}</td>
                                    <td className="p-3 text-slate-500">{item.comments.toLocaleString()}</td>
                                  </tr>
                                ))
                              )}
                              {selectedCreatorMetrics.accounts.every(acc => !acc.items || acc.items.length === 0) && (
                                <tr>
                                  <td colSpan={6} className="text-center py-6 text-slate-400">
                                    No posts recorded for this creator.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t dark:border-slate-800">
                        <button
                          onClick={() => setSelectedCreatorMetrics(null)}
                          className="px-5 py-2 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500"
                        >
                          Close Details
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* --- TAB: USERS --- */}
          {activeTab === 'users' && (
            <div className="glass p-6 rounded-2xl border space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Creator Directory</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage and control standard creator and agency team accounts</p>
                </div>
                <div className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-lg border border-brand-500/20">
                  {creatorsAndTeam.length} Active Accounts
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Account Role</th>
                      <th className="pb-3">Subscription</th>
                      <th className="pb-3">Permissions Demote</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {creatorsAndTeam.map(u => (
                      <tr key={u.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                        <td className="py-3 font-semibold dark:text-white">{u.name}</td>
                        <td className="py-3 text-slate-400 font-mono">{u.email}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black uppercase text-[9px] border border-brand-500/20">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleUserPremium(u.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 ${
                              u.isPremium
                                ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25'
                                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-200'
                            }`}
                            title="Toggle Premium Status"
                          >
                            <Award className="w-3.5 h-3.5" />
                            {u.isPremium ? 'PRO (Active)' : 'FREE (Basic)'}
                          </button>
                        </td>
                        <td className="py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-lg text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-1 focus:ring-brand-500 text-[10px]"
                          >
                            <option value="Creator">Creator</option>
                            <option value="Team Member">Team Member</option>
                            <option value="Admin">Admin</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                            u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2 whitespace-nowrap">
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                              className="px-2.5 py-1 border border-amber-500/25 hover:bg-amber-500/10 text-amber-500 rounded-lg font-bold text-[10px]"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'active')}
                              className="px-2.5 py-1 border border-emerald-500/25 hover:bg-emerald-500/10 text-emerald-500 rounded-lg font-bold text-[10px]"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg inline-flex items-center"
                            title="Delete Permanently"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB: ADMINS --- */}
          {activeTab === 'admins' && (
            <div className="glass p-6 rounded-2xl border space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Admin Command Profiles</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control administrative access and roles</p>
                </div>
                <div className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-500/20">
                  {adminUsers.length} Administrators
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Admin Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Security Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Permissions Change</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {adminUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                        <td className="py-3 font-semibold dark:text-white">{u.name}</td>
                        <td className="py-3 text-slate-400 font-mono">{u.email}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-black uppercase text-[9px] border border-red-500/20">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                            u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-lg text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-1 focus:ring-brand-500 text-[10px]"
                          >
                            <option value="Super Admin">Super Admin</option>
                            <option value="Admin">Admin</option>
                            <option value="Creator">Creator</option>
                            <option value="Team Member">Team Member</option>
                          </select>
                        </td>
                        <td className="py-3 text-right space-x-2 whitespace-nowrap">
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                              className="px-2.5 py-1 border border-amber-500/25 hover:bg-amber-500/10 text-amber-500 rounded-lg font-bold text-[10px]"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'active')}
                              className="px-2.5 py-1 border border-emerald-500/25 hover:bg-emerald-500/10 text-emerald-500 rounded-lg font-bold text-[10px]"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg inline-flex items-center"
                            title="Delete Permanently"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB: SYSTEM BROADCASTS --- */}
          {activeTab === 'broadcast' && (
            <div className="glass p-6 rounded-2xl border space-y-6">
              <div className="border-b dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-500" />
                  Publish System Notice Broadcast
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Send system-wide broadcast notification alerts instantly to all registered creators and team members on the platform.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Notice Title
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance, System Upgrade, Platform News..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Notice Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Write detailed announcements, update release descriptions, or notices..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  {sendingBroadcast ? 'Publishing...' : 'Publish System Notice'}
                </button>
              </form>
            </div>
          )}

          {/* --- TAB: PAYMENTS --- */}
          {activeTab === 'payments' && (
            <div className="glass p-6 rounded-2xl border space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">UPI Subscription Review Logs</h3>
              {payments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No payment verification requests received.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="pb-3">User</th>
                        <th className="pb-3">UTR Reference</th>
                        <th className="pb-3">UPI ID</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {payments.map(p => (
                        <tr key={p._id || p.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                          <td className="py-3">
                            <span className="font-semibold dark:text-white block">{p.userEmail}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">ID: {p.userId}</span>
                          </td>
                          <td className="py-3 font-mono font-bold tracking-wider">{p.utr}</td>
                          <td className="py-3 text-slate-400">{p.upiId}</td>
                          <td className="py-3 font-bold">₹{p.amount}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              p.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                              p.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
                              'bg-amber-500/10 text-amber-600'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {p.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleApprovePayment(p._id || p.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg font-bold text-[10px]"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p._id || p.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white rounded-lg font-bold text-[10px]"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: TICKETS --- */}
          {activeTab === 'tickets' && (
            <div className="glass p-6 rounded-2xl border space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Support Ticket Backlog</h3>
              {tickets.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No support tickets open.
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(t => (
                    <div key={t._id || t.id} className="p-4 rounded-xl border dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400">{t.userEmail}</span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {t.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm dark:text-white truncate">{t.subject}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 break-words">{t.message}</p>
                        {t.reply && (
                          <div className="p-3 bg-brand-500/5 border dark:border-brand-500/10 rounded-lg text-xs">
                            <span className="font-bold text-brand-500 block mb-0.5">Admin Reply:</span>
                            <span className="text-slate-600 dark:text-slate-300 break-words">{t.reply}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-start">
                        {t.status === 'open' && (
                          <button
                            onClick={() => setReplyTicketId(t._id || t.id)}
                            className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all w-full sm:w-auto"
                          >
                            Reply & Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

                    {/* --- TAB: REFERRALS --- */}
          {activeTab === 'referrals' && (
            <div className="glass p-6 rounded-2xl border space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b dark:border-slate-800 pb-4">
                <FolderTree className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Referral Network Monitor</h3>
              </div>

              {referralNetwork.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No referral data found.</div>
              ) : (
                <div className="space-y-4">
                  {referralNetwork.map((net, idx) => (
                    <div key={idx} className="border dark:border-slate-800 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-900/50">
                      <button 
                        onClick={() => setExpandedFolders({ ...expandedFolders, [idx]: !expandedFolders[idx] })}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FolderTree className="w-5 h-5 text-yellow-500" />
                          <div className="text-left">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">{net.referrer.name}</h4>
                            <p className="text-xs text-slate-500">{net.referrer.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold px-2 py-1 bg-brand-500/10 text-brand-600 rounded-lg">
                            {net.referredUsers.length} Referrals
                          </span>
                        </div>
                      </button>
                      
                      {expandedFolders[idx] && (
                        <div className="border-t dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/50">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-slate-400 font-bold uppercase border-b dark:border-slate-800">
                                <th className="pb-2">User Name</th>
                                <th className="pb-2">Email</th>
                                <th className="pb-2 text-right">Joined On</th>
                              </tr>
                            </thead>
                            <tbody>
                              {net.referredUsers.map((ru, i) => (
                                <tr key={i} className="border-b dark:border-slate-800 last:border-0">
                                  <td className="py-2 font-semibold text-slate-700 dark:text-slate-300">{ru.name}</td>
                                  <td className="py-2 text-slate-500">{ru.email}</td>
                                  <td className="py-2 text-right text-slate-500">{new Date(ru.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB: SESSIONS --- */}
          {activeTab === 'sessions' && (
            <div className="glass p-6 rounded-2xl border space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Login Security Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3">User</th>
                      <th className="pb-3">IP Address</th>
                      <th className="pb-3">Device Target</th>
                      <th className="pb-3">Browser</th>
                      <th className="pb-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {sessions.map((s, idx) => (
                      <tr key={s._id || idx} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                        <td className="py-3 font-semibold dark:text-white">{s.email}</td>
                        <td className="py-3 font-mono">{s.ipAddress}</td>
                        <td className="py-3 text-slate-400">{s.device}</td>
                        <td className="py-3 text-slate-400">{s.browser}</td>
                        <td className="py-3 text-right text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB: GOOGLE ADSENSE --- */}
          {activeTab === 'adsense' && (
            <div className="glass p-6 rounded-2xl border space-y-6">
              <div className="border-b dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-brand-500" />
                  Google AdSense Integration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Paste your Google AdSense code script, iframe, or custom HTML advertisement tag here. It will render dynamically in real-time on all Creator dashboards!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    AdSense Script/HTML Code
                  </label>
                  <textarea
                    rows={8}
                    value={adCode}
                    onChange={(e) => setAdCode(e.target.value)}
                    placeholder="<!-- Paste Google AdSense Script Code or Custom HTML Banner Here -->&#10;<div style='text-align:center; padding:10px; background:#1e293b; color:#fff; border-radius:8px;'>Custom Live Banner Advertisement</div>"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl gap-4">
                  <div className="text-xs">
                    <span className="font-bold text-brand-500 block">Live Verification</span>
                    <span className="text-slate-400">Saving this setting will immediately push the ad block to all user interfaces.</span>
                  </div>
                  <button
                    onClick={handleSaveAdsense}
                    disabled={savingAdCode}
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 w-full md:w-auto"
                  >
                    {savingAdCode ? 'Saving Code...' : 'Save & Publish Ads'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- MASTER EDIT USER MODAL --- */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold font-outfit text-slate-800 dark:text-white border-b dark:border-slate-800 pb-3 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-500" />
                Master Edit User
              </h3>

              <form onSubmit={handleMasterEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Name</label>
                    <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Email</label>
                    <input type="email" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Role</label>
                    <select value={editFormData.role || 'Creator'} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white">
                      <option value="Creator">Creator</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Status</label>
                    <select value={editFormData.status || 'active'} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white">
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Premium Status</label>
                    <select value={editFormData.isPremium ? 'true' : 'false'} onChange={e => setEditFormData({...editFormData, isPremium: e.target.value === 'true'})} className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white">
                      <option value="true">Premium</option>
                      <option value="false">Free</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Referral Count</label>
                    <input type="number" value={editFormData.referralCount || 0} onChange={e => setEditFormData({...editFormData, referralCount: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-500/10 mt-6"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REPLY TICKET MODAL --- */}
      <AnimatePresence>
        {replyTicketId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative"
            >
              <button
                onClick={() => setReplyTicketId(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white border-b dark:border-slate-800 pb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                Reply to Support Ticket
              </h3>

              <form onSubmit={handleReplyTicket} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Response Message</label>
                  <textarea
                    required
                    placeholder="Provide answers or confirm subscription approval..."
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/10"
                >
                  Send Response & Close Ticket
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
