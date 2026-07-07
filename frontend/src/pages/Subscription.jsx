import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  Smartphone,
  ChevronRight,
  Send,
  Lock,
  MessageSquare,
  Video,
  FileText,
  AlertCircle,
  HelpCircle,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  X
} from 'lucide-react';

export default function Subscription() {
  const { authFetch, user, updateLocalUser } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('billing'); // billing vs ai-toolkit
  const [showPayModal, setShowPayModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [amount, setAmount] = useState('999');
  const [transactions, setTransactions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI Toolkits state
  const [selectedAiTool, setSelectedAiTool] = useState('caption'); // caption, script, viral
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  
  // AI form inputs
  const [captionForm, setCaptionForm] = useState({ platform: 'YouTube', topic: '', tone: 'professional' });
  const [scriptForm, setScriptForm] = useState({ platform: 'YouTube', topic: '', duration: '30' });
  const [viralForm, setViralForm] = useState({ niche: 'Tech' });

  const fetchTransactions = async () => {
    try {
      const res = await authFetch('/admin/subscription/my-transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        // If there's an approved transaction, let's sync local user state
        const hasApproved = data.transactions.some(tx => tx.status === 'approved');
        if (hasApproved && !user.isPremium) {
          updateLocalUser({ isPremium: true });
          showNotification('Your premium account is now active! AI Tools unlocked.', 'success');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTransactions();
    if (user.isPremium) {
      setActiveTab('ai-toolkit');
    }
  }, [user.isPremium]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('9771735011@mbk');
    setCopied(true);
    showNotification('UPI ID copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      showNotification('UTR Transaction Reference number is required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/admin/subscription/submit', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          utr: utrNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        setShowPayModal(false);
        setUtrNumber('');
        fetchTransactions();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Submission error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // AI Tool triggers
  const handleGenerateCaption = async (e) => {
    e.preventDefault();
    if (!captionForm.topic.trim()) return;

    setAiLoading(true);
    setAiOutput('');
    try {
      const res = await authFetch('/ai/caption', {
        method: 'POST',
        body: JSON.stringify(captionForm)
      });
      const data = await res.json();
      if (data.success) {
        setAiOutput(data.text);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('AI Engine failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateScript = async (e) => {
    e.preventDefault();
    if (!scriptForm.topic.trim()) return;

    setAiLoading(true);
    setAiOutput('');
    try {
      const res = await authFetch('/ai/script', {
        method: 'POST',
        body: JSON.stringify(scriptForm)
      });
      const data = await res.json();
      if (data.success) {
        setAiOutput(data.text);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('AI Engine failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateViral = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    setAiOutput('');
    try {
      const res = await authFetch('/ai/viral-suggestions', {
        method: 'POST',
        body: JSON.stringify(viralForm)
      });
      const data = await res.json();
      if (data.success) {
        // Format array as string
        const text = data.suggestions.map((item, idx) => 
          `💡 IDEAS #${idx + 1}:\n📌 Title: ${item.title}\n⚡ Hook: "${item.hook}"\n🧠 Production Angle: ${item.angle}\n`
        ).join('\n');
        setAiOutput(text);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('AI Engine failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Tab Switcher */}
      <div className="flex gap-4 border-b dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'billing'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Billing Plans
        </button>

        <button
          onClick={() => setActiveTab('ai-toolkit')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'ai-toolkit'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
          Pro AI Content Toolkit
        </button>
      </div>

      {/* --- TAB 1: BILLING PLANS --- */}
      {activeTab === 'billing' && (
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl font-extrabold font-outfit text-slate-800 dark:text-white">Upgrade your content engine</h2>
            <p className="text-xs text-slate-500">Choose the package that scales with your growth. Instantly unlock premium tools.</p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="glass p-8 rounded-3xl border flex flex-col justify-between h-[420px]">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Starter Workspace</span>
                <h3 className="text-xl font-bold dark:text-white mt-1">Creator Basic</h3>
                <div className="my-6">
                  <span className="text-3xl font-black dark:text-white">₹0</span>
                  <span className="text-slate-400 text-xs"> / forever</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> Content calendar schedules</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> Brand CRM Kanban board</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> Income/Expense Logs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> Team task assignments</li>
                </ul>
              </div>
              <button disabled className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl text-xs font-bold font-outfit uppercase">
                Active Basic Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="glass p-8 rounded-3xl border-2 border-brand-500 relative flex flex-col justify-between h-[420px] shadow-lg shadow-brand-500/5">
              <span className="absolute -top-3.5 right-6 px-3 py-1 bg-brand-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wider shadow-md">
                Popular Choice
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-brand-500 tracking-wider">Ultimate Toolkit</span>
                <h3 className="text-xl font-bold dark:text-white mt-1">Creator Pro</h3>
                <div className="my-6">
                  <span className="text-3xl font-black dark:text-white">₹999</span>
                  <span className="text-slate-400 text-xs"> / yearly</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> <span className="font-semibold text-brand-500">AI Social Caption generator</span></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> <span className="font-semibold text-brand-500">AI Viral script drafting</span></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> AI Viral suggestions dashboard</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-500" /> ML Revenue Forecasting reports</li>
                </ul>
              </div>
              
              {user.isPremium ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase"
                >
                  Pro Subscriptions Active
                </button>
              ) : (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-transform hover:-translate-y-0.5"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>

          {/* Pending Subscriptions requests tracking logs */}
          {transactions.length > 0 && (
            <div className="glass p-6 rounded-2xl border max-w-3xl mx-auto">
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">Your Payment Submissions</h3>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx._id || tx.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">UTR: {tx.utr}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">Submitted on: {new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300">₹{tx.amount}</span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        tx.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                        tx.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PRO AI TOOLKIT --- */}
      {activeTab === 'ai-toolkit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          
          {/* Lock Cover if not Pro */}
          {!user.isPremium && (
            <div className="absolute inset-0 bg-slate-100/70 dark:bg-slate-950/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-8 rounded-3xl">
              <Lock className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-outfit">AI content tools locked</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                Upgrade to Creator Pro to unlock AI Social Caption generators, AI Scripting assistants, and automated viral suggestions niche feeds.
              </p>
              <button
                onClick={() => setActiveTab('billing')}
                className="mt-6 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md uppercase"
              >
                View Plans
              </button>
            </div>
          )}

          {/* AI Generator settings form panel (1 col wide) */}
          <div className="glass p-6 rounded-2xl border flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white font-outfit">AI Copilot Settings</h3>
              <p className="text-[10px] text-slate-400 mt-1">Configure models to draft custom captions or scripting templates.</p>
            </div>

            {/* Sub toolkit selection */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              {[
                { id: 'caption', label: 'Caption' },
                { id: 'script', label: 'Script' },
                { id: 'viral', label: 'Viral' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedAiTool(t.id)}
                  className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                    selectedAiTool === t.id
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Forms depending on tool selection */}
            {selectedAiTool === 'caption' && (
              <form onSubmit={handleGenerateCaption} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Target Platform</label>
                  <select
                    value={captionForm.platform}
                    onChange={(e) => setCaptionForm({ ...captionForm, platform: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  >
                    <option>YouTube</option>
                    <option>Instagram</option>
                    <option>TikTok</option>
                    <option>Twitter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Topic / Keywords</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My 5 AM Routine as a Software Engineer"
                    value={captionForm.topic}
                    onChange={(e) => setCaptionForm({ ...captionForm, topic: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Tone Style</label>
                  <select
                    value={captionForm.tone}
                    onChange={(e) => setCaptionForm({ ...captionForm, tone: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="funny">Humorous</option>
                    <option value="hype">Hype / Viral</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold uppercase"
                >
                  {aiLoading ? 'Generating...' : 'Draft Caption'}
                </button>
              </form>
            )}

            {selectedAiTool === 'script' && (
              <form onSubmit={handleGenerateScript} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Video Platform</label>
                  <select
                    value={scriptForm.platform}
                    onChange={(e) => setScriptForm({ ...scriptForm, platform: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  >
                    <option>YouTube</option>
                    <option>TikTok</option>
                    <option>Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Video Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 Coding Mistakes to Avoid in 2026"
                    value={scriptForm.topic}
                    onChange={(e) => setScriptForm({ ...scriptForm, topic: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Target Duration (Seconds)</label>
                  <select
                    value={scriptForm.duration}
                    onChange={(e) => setScriptForm({ ...scriptForm, duration: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  >
                    <option value="15">15 Seconds (Shorts)</option>
                    <option value="30">30 Seconds</option>
                    <option value="60">60 Seconds</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold uppercase"
                >
                  {aiLoading ? 'Generating...' : 'Draft Script'}
                </button>
              </form>
            )}

            {selectedAiTool === 'viral' && (
              <form onSubmit={handleGenerateViral} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Content Niche Focus</label>
                  <select
                    value={viralForm.niche}
                    onChange={(e) => setViralForm({ ...viralForm, niche: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  >
                    <option>Tech</option>
                    <option>Finance</option>
                    <option>Lifestyle</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold uppercase"
                >
                  {aiLoading ? 'Analyzing...' : 'Fetch Viral Ideas'}
                </button>
              </form>
            )}
          </div>

          {/* AI Generator Output panel (2 cols wide) */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl border flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white font-outfit">Generator Output</h3>
              {aiOutput && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiOutput);
                    showNotification('Output copied to clipboard!', 'success');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] text-brand-500 font-bold rounded-lg transition-colors border border-brand-500/10"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </button>
              )}
            </div>

            <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-800/80 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 overflow-y-auto whitespace-pre-wrap">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
                  <span className="text-slate-400">Gemini LLM model processing query...</span>
                </div>
              ) : aiOutput ? (
                aiOutput
              ) : (
                <span className="text-slate-400">Provide settings in the left panel and click draft to see output.</span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- UPI PAYMENT MODAL --- */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowPayModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                <Smartphone className="w-5 h-5 text-brand-500" />
                UPI ID Payment Checkout
              </h3>

              <div className="space-y-4">
                <div className="bg-brand-500/5 p-4 rounded-xl border dark:border-slate-800 space-y-2">
                  <p className="text-xs text-slate-500">Please send exactly <span className="font-bold text-slate-800 dark:text-white">₹999</span> to this UPI ID:</p>
                  
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border dark:border-slate-800">
                    <code className="text-sm font-black text-brand-600 dark:text-brand-400 tracking-wider">
                      9771735011@mbk
                    </code>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-brand-500 transition-colors"
                      title="Copy UPI ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Scan to Pay ₹999</span>
                  <div className="w-32 h-32 bg-white flex items-center justify-center mx-auto my-3 rounded-lg p-1">
                    <img 
                      src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent('upi://pay?pa=9771735011@mbk&pn=CreatorHub&am=999&cu=INR')}`} 
                      alt="UPI QR Code"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 px-8 leading-normal">
                    Scan via any UPI App (GPay, PhonePe, Paytm, BHIM) to make the payment.
                  </p>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      UPI Reference Number (UTR / Transaction ID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 12-digit UPI reference ID..."
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/10"
                  >
                    {loading ? 'Submitting...' : 'Submit Payment Proof'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
