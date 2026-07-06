import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, CheckCircle, Lock, ShieldAlert } from 'lucide-react';

export default function ResetPassword() {
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedOTP, setSimulatedOTP] = useState('');

  const handleSendReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API_BASE_RAW = String(
        import.meta.env.VITE_API_BASE ||
        import.meta.env.VITE_API_TARGET ||
        import.meta.env.VITE_API_URL ||
        ''
      ).replace(/\/$/, '');
      const API_URL = API_BASE_RAW.includes('/api') ? `${API_BASE_RAW}/auth/forgot-password` : `${API_BASE_RAW}/api/auth/forgot-password`;

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        setUserId(data.tempUserId);
        if (data.simulatedOTP) {
          setSimulatedOTP(data.simulatedOTP);
        }
        setStep(2);
        showNotification('Security reset code sent! Check your inbox.', 'success');
      } else {
        showNotification(data.message || 'Failed to send reset code.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Connection to server failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      showNotification('Please enter a valid 6-digit OTP code.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const API_BASE_RAW = String(
        import.meta.env.VITE_API_BASE ||
        import.meta.env.VITE_API_TARGET ||
        import.meta.env.VITE_API_URL ||
        ''
      ).replace(/\/$/, '');
      const API_URL = API_BASE_RAW.includes('/api') ? `${API_BASE_RAW}/auth/reset-password` : `${API_BASE_RAW}/api/auth/reset-password`;

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        showNotification('Password has been reset successfully! You can now log in.', 'success');
        navigate('/login');
      } else {
        showNotification(data.message || 'Verification of OTP code failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Password reset failed.', 'error');
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
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-6">
            {step === 1 ? 'Forgot Password?' : 'Enter New Password'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-4">
            {step === 1 
              ? 'Enter your account email. We will send you a 6-digit OTP code to verify and reset your credentials.' 
              : `Enter the code sent to your inbox and define a secure new password.`
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendReset} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Request OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-center font-mono font-bold text-xl tracking-widest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
                />
              </div>
            </div>

            {simulatedOTP && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Simulated Reset Code: <strong>{simulatedOTP}</strong> (prints in terminal too)</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || newPassword.length < 6}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-500 hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
