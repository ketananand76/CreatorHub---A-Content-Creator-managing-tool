import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ChevronRight, ArrowLeft } from 'lucide-react';

export default function GoogleAuthModal({ isOpen, onClose, onSelectUser }) {
  const [step, setStep] = useState(1); // 1 = Chooser, 2 = Custom Input
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const mockAccounts = [
    { name: 'Ketan Anand', email: 'ketananand1110@gmail.com', googleId: 'google-oauth-mock-1110' }
  ];

  const handleSelect = (account) => {
    onSelectUser(account);
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    onSelectUser({
      name: customName,
      email: customEmail,
      googleId: `google-oauth-mock-${Math.random().toString(36).substring(2, 9)}`
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-slate-800 dark:text-slate-200"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header Logo */}
            <div className="flex flex-col items-center mb-6 mt-2">
              <svg className="w-6 h-6 mb-3" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h2 className="text-lg font-bold font-outfit">Sign in with Google</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                to continue to <span className="font-semibold text-brand-500">CreatorHub</span>
              </p>
            </div>

            {step === 1 ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-1">
                  Choose an account
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {mockAccounts.map((acc, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(acc)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{acc.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{acc.email}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </button>
                  ))}

                  <button
                    onClick={() => setStep(2)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left text-xs font-medium text-brand-500 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span>Use another account</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Chooser
                </button>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Hunter"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-brand-500/10"
                >
                  Continue to CreatorHub
                </button>
              </form>
            )}

            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-6 leading-relaxed">
              Google will share your name, email address, language preference, and profile picture with CreatorHub.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
