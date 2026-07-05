import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, Send, MessageSquare, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function Support() {
  const { authFetch } = useAuth();
  const { showNotification } = useNotification();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await authFetch('/admin/support/my-tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await authFetch('/admin/support/submit', {
        method: 'POST',
        body: JSON.stringify({ subject, message })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Support ticket submitted successfully! The Super Admin will review.', 'success');
        setSubject('');
        setMessage('');
        fetchTickets();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 glass p-6 rounded-2xl border">
        <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Help Desk & Support</h2>
          <p className="text-xs text-slate-500 mt-1">Submit inquiries, request password updates, or resolve billing details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Submit Ticket Form (1 col) */}
        <div className="glass p-6 rounded-2xl border flex flex-col gap-5 h-fit">
          <h3 className="font-bold text-slate-800 dark:text-white font-outfit">Create Support Request</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Subject Topic</label>
              <input
                type="text"
                required
                placeholder="e.g. Subscription approval pending UTR"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Inquiry / Details</label>
              <textarea
                required
                placeholder="Explain details of UTR transfers, account blocks, or custom integrations..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold uppercase transition-colors shadow-md shadow-brand-500/10"
            >
              {submitting ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>

        {/* Tickets Backlog (2 cols) */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border flex flex-col min-h-[400px]">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Your Tickets History</h3>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500 mx-auto"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-400">
              No tickets submitted.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div
                  key={t._id || t.id}
                  className="p-5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Submitted: {new Date(t.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                      t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {t.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {t.message}
                    </p>
                  </div>

                  {t.reply && (
                    <div className="p-3 bg-brand-500/5 border dark:border-brand-500/10 rounded-lg text-xs mt-3">
                      <span className="font-bold text-brand-500 block mb-0.5 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Support Response:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-normal">
                        {t.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
