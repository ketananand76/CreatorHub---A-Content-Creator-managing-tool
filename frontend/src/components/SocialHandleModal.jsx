import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Instagram, Facebook, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api';

const PLATFORM_CONFIG = {
  youtube: {
    label: 'YouTube',
    color: 'red',
    icon: Youtube,
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    placeholder: 'https://youtube.com/@mkbhd'
  },
  instagram: {
    label: 'Instagram',
    color: 'pink',
    icon: Instagram,
    gradient: 'from-pink-500 to-purple-600',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    border: 'border-pink-200 dark:border-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    placeholder: 'https://instagram.com/cristiano'
  },
  facebook: {
    label: 'Facebook',
    color: 'blue',
    icon: Facebook,
    gradient: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    placeholder: 'https://facebook.com/zuck'
  }
};

export default function SocialHandleModal({
  platform,
  onClose,
  onSuccess
}) {
  const cfg = PLATFORM_CONFIG[platform];
  const Icon = cfg.icon;

  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { authFetch } = useAuth();

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!link) {
      setError('Please enter a valid profile link.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authFetch('/social/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform, link })
      });
      
      const data = await res.json();
      if (data.success) {
        onSuccess(data); // Pass back the updated metrics and links
        onClose();
      } else {
        setError(data.message || 'Failed to connect. Make sure the link is correct.');
      }
    } catch (err) {
      console.error(err);
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className={`bg-gradient-to-r ${cfg.gradient} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Connect {cfg.label}</h2>
              <p className="text-white/80 text-xs">Live Real-time Metric Tracking</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleConnect} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Profile URL / Channel Link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={cfg.placeholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-800 dark:text-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Paste your public {cfg.label} link to start live tracking.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 bg-gradient-to-r ${cfg.gradient} text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect & Sync Metrics'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
