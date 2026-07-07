import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import {
  Plus,
  Trash2,
  DollarSign,
  Paperclip,
  CheckCircle,
  TrendingUp,
  X,
  FileText,
  Briefcase,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';

const STAGES = [
  'Lead',
  'Pitching',
  'Negotiating',
  'Contract Signed',
  'Payment Pending',
  'Completed'
];

const STAGE_COLORS = {
  'Lead': 'border-t-slate-400 bg-slate-500/5 text-slate-600 dark:text-slate-400',
  'Pitching': 'border-t-cyan-400 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400',
  'Negotiating': 'border-t-amber-400 bg-amber-500/5 text-amber-600 dark:text-amber-400',
  'Contract Signed': 'border-t-indigo-400 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400',
  'Payment Pending': 'border-t-rose-400 bg-rose-500/5 text-rose-600 dark:text-rose-400',
  'Completed': 'border-t-emerald-400 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
};

export default function BrandCRM() {
  const { authFetch } = useAuth();
  const { showNotification } = useNotification();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  // New Deal Form State
  const [formData, setFormData] = useState({
    sponsorName: '',
    dealTitle: '',
    dealValue: '',
    stage: 'Lead',
    notes: '',
    contractUrl: ''
  });

  const fetchDeals = async () => {
    try {
      const res = await authFetch('/crm');
      const data = await res.json();
      if (data.success) {
        setDeals(data.deals);
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to fetch brand deals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/crm', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Brand partnership logged!', 'success');
        setShowAddModal(false);
        fetchDeals();
        setFormData({
          sponsorName: '',
          dealTitle: '',
          dealValue: '',
          stage: 'Lead',
          notes: '',
          contractUrl: ''
        });
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Create failed', 'error');
    }
  };

  const handleUpdateStage = async (dealId, nextStage) => {
    try {
      const res = await authFetch(`/crm/${dealId}`, {
        method: 'PUT',
        body: JSON.stringify({ stage: nextStage })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Deal moved to ${nextStage}`, 'success');
        fetchDeals();
        if (selectedDeal && selectedDeal._id === dealId) {
          setSelectedDeal(data.deal);
        }
      }
    } catch (e) {
      showNotification('Stage update failed', 'error');
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!confirm('Are you sure you want to delete this brand deal?')) return;
    try {
      const res = await authFetch(`/crm/${dealId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Brand deal removed', 'success');
        setShowDetailModal(false);
        fetchDeals();
      }
    } catch (e) {
      showNotification('Delete failed', 'error');
    }
  };

  const handleUpdateDealDetails = async (fields) => {
    try {
      const res = await authFetch(`/crm/${selectedDeal._id || selectedDeal.id}`, {
        method: 'PUT',
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Deal updated', 'success');
        setSelectedDeal(data.deal);
        fetchDeals();
      }
    } catch (e) {
      showNotification('Failed to update details', 'error');
    }
  };

  // Pipeline calculations
  const totalPipelineValue = deals.reduce((acc, d) => acc + (Number(d.dealValue) || 0), 0);
  const closedWonValue = deals.filter(d => d.stage === 'Completed').reduce((acc, d) => acc + (Number(d.dealValue) || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* CRM Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass p-5 rounded-2xl border flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Campaign pipeline</span>
            <h4 className="text-xl font-bold dark:text-white mt-1">₹{totalPipelineValue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Closed / Won Earnings</span>
            <h4 className="text-xl font-bold dark:text-white mt-1">₹{closedWonValue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Active Partnerships</span>
              <h4 className="text-xl font-bold dark:text-white mt-1">{deals.length} Campaigns</h4>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/10"
          >
            <Plus className="w-4 h-4" /> Add Deal
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center my-4"><Logo animated={true} size={40} /></div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 select-none">
          {STAGES.map((colName) => {
            const stageDeals = deals.filter(d => d.stage === colName);
            const colTotal = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);

            return (
              <div
                key={colName}
                className="w-80 flex-shrink-0 flex flex-col glass rounded-2xl border dark:border-slate-800 p-4 kanban-column"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {colName}
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-0.5 block">
                      {stageDeals.length} Deals
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                    ₹{(colTotal / 1000).toFixed(1)}k
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-xl dark:border-slate-800">
                      Empty column.
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <motion.div
                        key={deal._id || deal.id}
                        layoutId={deal._id || deal.id}
                        onClick={() => {
                          setSelectedDeal(deal);
                          setShowDetailModal(true);
                        }}
                        className={`p-4 rounded-xl bg-white dark:bg-[#121826] border-t-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${STAGE_COLORS[colName]}`}
                      >
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                          {deal.sponsorName}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                          {deal.dealTitle}
                        </p>

                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            ₹{deal.dealValue.toLocaleString()}
                          </span>
                          {/* Cycle stage button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIdx = STAGES.indexOf(deal.stage);
                              const nextIdx = (currentIdx + 1) % STAGES.length;
                              handleUpdateStage(deal._id || deal.id, STAGES[nextIdx]);
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-500"
                            title="Cycle Stage"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD DEAL MODAL --- */}
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
                <Briefcase className="w-5 h-5 text-brand-500" />
                Add Brand Partnership
              </h3>

              <form onSubmit={handleCreateDeal} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Sponsor / Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google India"
                    value={formData.sponsorName}
                    onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Campaign Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. YouTube Ad Campaign"
                      value={formData.dealTitle}
                      onChange={(e) => setFormData({ ...formData, dealTitle: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Value (INR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 75000"
                      value={formData.dealValue}
                      onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Initial Stage</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    >
                      {STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Contract Agreement URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://docs.google.com/..."
                      value={formData.contractUrl}
                      onChange={(e) => setFormData({ ...formData, contractUrl: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Campaign Notes</label>
                  <textarea
                    placeholder="Provide pricing details, video references, or custom instructions..."
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/10"
                >
                  Create Sponsor Campaign
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DEAL DETAIL PANEL MODAL --- */}
      <AnimatePresence>
        {showDetailModal && selectedDeal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                    Sponsor Detail
                  </span>
                  <select
                    value={selectedDeal.stage}
                    onChange={(e) => handleUpdateStage(selectedDeal._id, e.target.value)}
                    className="px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold font-outfit text-slate-800 dark:text-white">
                    {selectedDeal.sponsorName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Campaign: {selectedDeal.dealTitle}
                  </p>
                </div>

                {/* Deal Value */}
                <div className="flex items-center gap-2 p-3 bg-brand-500/5 rounded-xl border dark:border-slate-800">
                  <DollarSign className="w-5 h-5 text-brand-500" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Deal Value</span>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                      ₹{selectedDeal.dealValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Campaign Notes & Details</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap min-h-[60px]">
                    {selectedDeal.notes || 'No description notes logged.'}
                  </div>
                </div>

                {/* Contract Attachment */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Attached Documents</span>
                  {selectedDeal.contractUrl ? (
                    <a
                      href={selectedDeal.contractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-brand-500/30 hover:bg-brand-500/5 text-brand-600 dark:text-brand-400 transition-colors text-xs font-semibold"
                    >
                      <FileText className="w-4 h-4" /> Link to Campaign Contract Agreement
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        const url = prompt('Enter Contract URL / Google Doc link:');
                        if (url) {
                          handleUpdateDealDetails({ contractUrl: url });
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      <Paperclip className="w-4 h-4" /> Add Contract Link
                    </button>
                  )}
                </div>

                {/* Delete Deal */}
                <div className="flex items-center justify-between border-t dark:border-slate-800 pt-4 mt-6">
                  <button
                    onClick={() => handleDeleteDeal(selectedDeal._id)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Remove Deal
                  </button>

                  <button
                    onClick={() => {
                      const note = prompt('Append campaign notes:', selectedDeal.notes);
                      if (note) {
                        handleUpdateDealDetails({ notes: note });
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Append Notes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
