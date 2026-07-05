import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react';
import { auth } from '../firebase.js';
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyOTP() {
  const { verifyOTP } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || 'your email';

  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      const data = await verifyOTP(); // internally checks Firebase emailVerified
      if (data.success) {
        showNotification('Email verified! You are now logged in.', 'success');
        // Route admins to admin portal
        const role = data?.user?.role;
        if (role === 'Admin' || role === 'Super Admin') navigate('/admin');
        else navigate('/');
      } else {
        showNotification(data.message || 'Email not verified yet. Please click the link in your inbox.', 'warning');
      }
    } catch (err) {
      showNotification('Verification check failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        showNotification('No active session. Please go back and register first.', 'error');
        return;
      }

      await sendEmailVerification(firebaseUser);
      showNotification('Verification email sent again! Please check your inbox.', 'success');
      setTimer(60);
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Failed to resend verification email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-premium p-8 rounded-3xl z-10"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <Logo size={42} showText={true} textClassName="text-3xl font-bold font-outfit text-gradient tracking-wide" />
          <div className="w-14 h-14 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mt-6 text-brand-500">
            <Mail className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-3">Check Your Email</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-4 leading-relaxed">
            A <strong>verification link</strong> has been sent to{' '}
            <span className="font-semibold text-brand-500">{email}</span>.{' '}
            Click that link, then come back and press the button below.
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Checking...' : "I've Verified My Email →"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading || timer > 0}
            className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {timer > 0 ? `Resend available in ${timer}s` : 'Resend Verification Email'}
          </button>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>📧 Tip:</strong> If you don't see the email, check your <strong>Spam</strong> or{' '}
            <strong>Promotions</strong> folder. The email is sent from Firebase via Google.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
