import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react';

export default function VerifyOTP() {
  const { verifyOTP } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  // If email was not passed in routing state, redirect to register
  useEffect(() => {
    if (!email) {
      showNotification('Please register an account first.', 'warning');
      navigate('/register');
    }
  }, [email, navigate, showNotification]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      showNotification('Please enter a valid 6-digit code.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOTP(email, otp);
      if (data.success) {
        showNotification('Email verified! You are now logged in.', 'success');
        const role = data?.user?.role;
        if (role === 'Admin' || role === 'Super Admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        showNotification(data.message || 'Incorrect OTP code. Please try again.', 'error');
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
      const API_BASE_RAW = String(
        import.meta.env.VITE_API_BASE ||
        import.meta.env.VITE_API_TARGET ||
        import.meta.env.VITE_API_URL ||
        ''
      ).replace(/\/$/, '');
      const API_URL = API_BASE_RAW.includes('/api') ? `${API_BASE_RAW}/auth/resend-otp` : `${API_BASE_RAW}/api/auth/resend-otp`;

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        showNotification('A new security code has been sent successfully!', 'success');
        setTimer(60);
      } else {
        showNotification(data.message || 'Resend failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to resend verification email.', 'error');
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
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-3">Confirm Your Account</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-4 leading-relaxed">
            Enter the 6-digit OTP code sent to{' '}
            <span className="font-semibold text-brand-500">{email}</span>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
              Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. 123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-center font-mono font-bold text-xl tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Verifying...' : 'Verify OTP & Login'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading || timer > 0}
            className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {timer > 0 ? `Resend available in ${timer}s` : 'Resend Verification Code'}
          </button>
        </form>

        <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>📧 Hint:</strong> If SMTP is not configured in `.env`, the verification code prints in the backend console logs.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
