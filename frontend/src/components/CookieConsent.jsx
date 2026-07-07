import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CookieConsent() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Only show if user is logged in AND hasn't accepted in this session
    if (user && !sessionStorage.getItem('cookieConsent')) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleAccept = () => {
    sessionStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  const handleReject = () => {
    // Even if rejected, we store it so it doesn't keep popping up on every click, 
    // but we use sessionStorage so it resets on next login/tab open.
    sessionStorage.setItem('cookieConsent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
            {/* Top Bar */}
            <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-brand-500" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white mb-1">
                  We value your privacy
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  We use essential cookies to make our platform work and keep your session secure. 
                  We also use optional cookies to analyze site traffic and personalize your experience.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center"
                >
                  {detailsOpen ? 'Hide Details' : 'Cookie Details'}
                </button>
                <button
                  onClick={handleReject}
                  className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center"
                >
                  Decline Optional
                </button>
                <button
                  onClick={handleAccept}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 rounded-xl transition-all hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept All
                </button>
              </div>
            </div>

            {/* Details Panel */}
            <AnimatePresence>
              {detailsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                >
                  <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Strictly Necessary</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        These cookies are essential for you to browse the platform and use its features, such as accessing secure areas and maintaining your active session. They cannot be disabled.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-brand-500" />
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Analytics & Performance</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        These cookies collect information about how you use our platform, like which pages you visited and which links you clicked on. This helps us improve our service.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
