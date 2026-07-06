import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, CheckCircle } from 'lucide-react';
import { firebasePasswordReset } from '../firebase.js';

export default function ResetPassword() {
  const { showNotification } = useNotification();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await firebasePasswordReset(email);
      setSent(true);
      showNotification('Password reset email sent! Check your inbox.', 'success');
    } catch (err) {
      console.error('Reset Password Error:', err.code);
      const messages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many requests. Please try again later.',
        'auth/operation-not-allowed': 'Password reset is not enabled. Enable Email/Password in Firebase Console.',
      };
      showNotification(messages[err.code] || err.message || 'Failed to send reset email.', 'error');
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
            Forgot Password?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-4">
            Enter your account email. Firebase will send you a secure password reset link directly to your inbox.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white">Email Sent!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              A password reset link has been sent to <strong className="text-brand-500">{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <p className="text-[10px] text-slate-400">
              Check your Spam folder if you don't see it in a few minutes.
            </p>
          </div>
        ) : (
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
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-brand-500/20"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Remember your password?   
          <Link to="/login" className="text-brand-500 hover:underline font-semibold ml-1">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
