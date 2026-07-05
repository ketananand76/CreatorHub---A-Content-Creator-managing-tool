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
  Smartphone,
  Globe,
  Trophy,
  Brain
} from 'lucide-react';

export default function SuperAdmin() {
  const { authFetch } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, payments, tickets, sessions
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
      showNotification('Banning failed', 'error');
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Tab Switcher */}
      <div className="flex overflow-x-auto gap-4 border-b dark:border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Analytics System', icon: Activity },
          { id: 'leaderboard', label: 'Creator Standings', icon: Trophy },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'payments', label: 'Payment Logs Queue', icon: DollarSign },
          { id: 'tickets', label: 'Support Queue', icon: LifeBuoy },
          { id: 'sessions', label: 'Security & Device logs', icon: History },
          { id: 'adsense', label: 'Google AdSense', icon: Globe }
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
            <t.icon className="w-4 h-4" /> {t.label}
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
                  { label: 'System Registered Users', value: stats.totalUsers, desc: `${stats.activeUsers} active sessions`, icon: Users, color: 'text-brand-500 bg-brand-500/10 border-brand-500/20' },
                  { label: 'Pro Subscriptions', value: stats.premiumUsers, desc: 'Pro subscriptions active', icon: Award, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                  { label: 'Platform Revenue Earning', value: `₹${stats.totalRevenue.toLocaleString()}`, desc: 'Via approved UPI payments', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Pending Payment Approvals', value: stats.pendingTransactions, desc: 'Awaiting review', icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
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
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> You have {stats.pendingTransactions} pending subscription verification requests in queue.
                  </span>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-amber-600 transition-colors uppercase"
                  >
                    Open Logs
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: LEADERBOARD & AI ANALYSER --- */}
          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leaderboard Table */}
              <div className="lg:col-span-2 glass p-6 rounded-2xl border space-y-6">
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
                  <table className="w-full text-left border-collapse text-xs">
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

          {/* --- TAB: USERS --- */}
          {activeTab === 'users' && (
            <div className="glass p-6 rounded-2xl border overflow-hidden">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Manage System Accounts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Pro Status</th>
                      <th className="pb-3">Account Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                        <td className="py-3 font-semibold dark:text-white">{u.name}</td>
                        <td className="py-3 text-slate-400">{u.email}</td>
                        <td className="py-3"><span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 font-bold uppercase text-[9px]">{u.role}</span></td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${u.isPremium ? 'bg-yellow-500/10 text-yellow-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {u.isPremium ? 'Active Pro' : 'Free User'}
                          </span>
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
                              className="px-2.5 py-1 border border-amber-500/20 hover:bg-amber-500/10 text-amber-500 rounded-lg font-bold"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'active')}
                              className="px-2.5 py-1 border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500 rounded-lg font-bold"
                            >
                              Unban
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg"
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

          {/* --- TAB: PAYMENTS (UPI approvals) --- */}
          {activeTab === 'payments' && (
            <div className="glass p-6 rounded-2xl border">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">UPI Subscription Review Logs</h3>
              {payments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No payment verification requests received.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
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
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg font-bold"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p._id || p.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white rounded-lg font-bold"
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
            <div className="glass p-6 rounded-2xl border">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Support Ticket Backlog</h3>
              {tickets.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No support tickets open.
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(t => (
                    <div key={t._id || t.id} className="p-4 rounded-xl border dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400">{t.userEmail}</span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {t.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm dark:text-white">{t.subject}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.message}</p>
                        {t.reply && (
                          <div className="p-3 bg-brand-500/5 border dark:border-brand-500/10 rounded-lg text-xs">
                            <span className="font-bold text-brand-500 block mb-0.5">Admin Reply:</span>
                            <span className="text-slate-600 dark:text-slate-300">{t.reply}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-start">
                        {t.status === 'open' && (
                          <button
                            onClick={() => setReplyTicketId(t._id || t.id)}
                            className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all"
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

          {/* --- TAB: SESSIONS --- */}
          {activeTab === 'sessions' && (
            <div className="glass p-6 rounded-2xl border">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Login Security Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
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

                <div className="flex items-center justify-between p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl">
                  <div className="text-xs">
                    <span className="font-bold text-brand-500 block">Live Verification</span>
                    <span className="text-slate-400">Saving this setting will immediately push the ad block to all user interfaces.</span>
                  </div>
                  <button
                    onClick={handleSaveAdsense}
                    disabled={savingAdCode}
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {savingAdCode ? 'Saving Code...' : 'Save & Publish Ads'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white border-b dark:border-slate-800 pb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                Reply to Support Ticket
              </h3>

              <form onSubmit={handleReplyTicket} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Response message</label>
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
