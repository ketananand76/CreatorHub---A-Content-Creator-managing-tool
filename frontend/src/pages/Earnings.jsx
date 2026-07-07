import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Earnings() {
  const { authFetch, user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    monthlyBreakdown: []
  });
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: 'income',
    category: 'AdSense',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    description: ''
  });

  const fetchEarningsData = async () => {
    try {
      const res = await authFetch('/earnings');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setSummary(data.summary);
        setForecast(data.forecast);
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to fetch financial reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/earnings', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Financial record logged!', 'success');
        setShowAddModal(false);
        fetchEarningsData();
        setFormData({
          type: 'income',
          category: 'AdSense',
          amount: '',
          date: new Date().toISOString().substring(0, 10),
          description: ''
        });
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Logging failed', 'error');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Are you sure you want to remove this transaction record?')) return;
    try {
      const res = await authFetch(`/earnings/${logId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Transaction record deleted', 'success');
        fetchEarningsData();
      }
    } catch (e) {
      showNotification('Delete failed', 'error');
    }
  };

  const categories = {
    income: ['AdSense', 'Sponsorship', 'Affiliate Marketing', 'Merchandising', 'Consulting', 'Other'],
    expense: ['Software Subscriptions', 'Editing Gear', 'Freelancer Payroll', 'Workspace/Office', 'Marketing/Ads', 'Other']
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="glass p-6 rounded-2xl border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Gross Income</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 font-outfit">
              ₹{summary.totalIncome.toLocaleString()}
            </h3>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Expense Card */}
        <div className="glass p-6 rounded-2xl border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Operational Expenses</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 font-outfit">
              ₹{summary.totalExpense.toLocaleString()}
            </h3>
          </div>
          <div className="p-3.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="glass p-6 rounded-2xl border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Net Profits</span>
            <h3 className={`text-2xl font-black mt-2 font-outfit ${summary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              ₹{summary.netProfit.toLocaleString()}
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/10"
            >
              <Plus className="w-4 h-4" /> Log Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs and Graphs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart mock using custom pure SVG (extremely reliable, no Recharts version errors) */}
          <div className="glass p-6 rounded-2xl border">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6">Monthly Revenue Chart</h3>
            {summary.monthlyBreakdown.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Log invoices or complete brand campaigns to visualize distributions.
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Visualizer */}
                <div className="h-48 w-full flex items-end justify-between border-b dark:border-slate-800 pb-2 px-4 gap-2">
                  {summary.monthlyBreakdown.map((m, idx) => {
                    const maxVal = Math.max(...summary.monthlyBreakdown.map(x => Math.max(x.income, x.expense))) || 1;
                    const incHeight = (m.income / maxVal) * 100;
                    const expHeight = (m.expense / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="flex gap-1 items-end w-full h-full">
                          {/* Income Bar */}
                          <div
                            style={{ height: `${incHeight}%` }}
                            className="bg-brand-500 rounded-t w-1/2 min-h-[4px]"
                            title={`Income: ₹${m.income}`}
                          ></div>
                          {/* Expense Bar */}
                          <div
                            style={{ height: `${expHeight}%` }}
                            className="bg-rose-400 rounded-t w-1/2 min-h-[4px]"
                            title={`Expense: ₹${m.expense}`}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-tight">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 text-[10px] uppercase font-bold text-slate-500">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-brand-500 rounded-full"></span> Income</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-400 rounded-full"></span> Expenses</div>
                </div>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="glass p-6 rounded-2xl border">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Billing Statement Log</h3>
            {loading ? (
              <div className="text-center py-10">
                <div className="flex justify-center items-center my-4"><Logo animated={true} size={32} /></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No financial records logged.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {logs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.date}</td>
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">
                          <span className={`px-2 py-0.5 rounded ${log.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 truncate max-w-[180px]" title={log.description}>{log.description || '—'}</td>
                        <td className={`py-3 font-black ${log.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.type === 'income' ? '+' : '-'}₹{log.amount.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteLog(log._id || log.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* AI Forecasting Side Panel */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border h-full flex flex-col relative overflow-hidden">
            {/* Locked screen if not premium */}
            {!user.isPremium && (
              <div className="absolute inset-0 bg-[#0b0f19]/80 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white font-outfit">AI Revenue Forecasting</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Unlock advanced machine learning algorithms to model your monthly income pipelines, growth rate predictions, and expense curves.
                </p>
                <button
                  onClick={() => navigate('/subscription')}
                  className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-transform hover:scale-105"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to Pro
                </button>
              </div>
            )}

            {/* Content header */}
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-slate-800 dark:text-white font-outfit">AI Predictive Forecasting</h3>
            </div>

            {forecast ? (
              <div className="flex-1 space-y-5">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Based on historical brand deal values and logged invoices, our models project a <span className="font-bold text-emerald-500">steady 5% expansion</span> over the next quarter:
                </p>
                <div className="space-y-3.5">
                  {forecast.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span>{item.month}</span>
                        <span className="text-emerald-500">+{item.growthRate}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-2 border-t dark:border-slate-800/50 text-[10px]">
                        <div>
                          <span className="text-slate-400 block uppercase">Projected In</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">₹{item.projectedIncome.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase">Projected Out</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">₹{item.projectedExpense.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-slate-400">
                Log monthly invoices to enable forecasting predictions.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ADD TRANSACTION MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                <DollarSign className="w-5 h-5 text-brand-500" />
                Log Invoice / Expense
              </h3>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setFormData({
                          ...formData,
                          type: nextType,
                          category: categories[nextType][0]
                        });
                      }}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    >
                      {categories[formData.type].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Amount (INR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 15000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                  <input
                    type="text"
                    placeholder="AdSense payout June or Adobe CC Subscription..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/10"
                >
                  Record Billing Item
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
