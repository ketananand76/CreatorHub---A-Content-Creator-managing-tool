import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, CheckCircle, Lock, ShieldAlert, Eye, EyeOff, ShieldCheck, ExternalLink } from 'lucide-react';

export default function ResetPassword() {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [simulatedLink, setSimulatedLink] = useState('');

  // Reset form fields (if token is present)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 to 4

  // Check password strength on type
  const handlePasswordChange = (val) => {
    setNewPassword(val);
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setPasswordStrength(Math.min(score, 4));
  };

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
        setSent(true);
        if (data.simulatedLink) {
          setSimulatedLink(data.simulatedLink);
        }
        showNotification('Password reset link sent! Check your email.', 'success');
      } else {
        showNotification(data.message || 'Failed to send reset email.', 'error');
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
    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match.', 'warning');
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
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        showNotification('Your password has been reset successfully!', 'success');
        navigate('/login');
      } else {
        showNotification(data.message || 'Failed to reset password. Link may be expired.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Password reset connection failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-rose-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-emerald-500'
  ];

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
            {token ? 'Reset Password' : 'Forgot Password?'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-4 leading-relaxed font-medium">
            {token 
              ? 'Choose a secure, strong new password to verify and access your account.' 
              : 'Enter your email address. We will send you a secure link to reset your credentials.'
            }
          </p>
        </div>

        {token ? (
          /* --- CHOOSE NEW PASSWORD FORM --- */
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Password Strength</span>
                  <span className={passwordStrength > 0 ? strengthColors[passwordStrength - 1].replace('bg-', 'text-') : 'text-rose-500'}>
                    {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Very Weak'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength >= bar 
                          ? strengthColors[passwordStrength - 1] 
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        ) : sent ? (
          /* --- EMAIL LINK SENT SUCCESS STATE --- */
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white">Email Dispatched!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              A secure password reset link has been successfully dispatched to <strong className="text-brand-500">{email}</strong>.
            </p>
            <p className="text-[10px] text-slate-405 leading-normal px-6">
              Please click the link inside that email to proceed to define a new password. Check your spam directory if it doesn't arrive shortly.
            </p>

            {simulatedLink && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left mt-6">
                <p className="text-xs text-blue-500 leading-relaxed font-semibold mb-2">
                  🧪 developer simulation link:
                </p>
                <a
                  href={simulatedLink}
                  className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1 break-all"
                >
                  Verify and Reset Password directly <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>
        ) : (
          /* --- REQUEST RESET LINK FORM --- */
          <form onSubmit={handleSendReset} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-slate-500" />
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
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-brand-500/20"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Remember your credentials?{' '}
          <Link to="/login" className="text-brand-500 hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
