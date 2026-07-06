import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, Lock, Eye, EyeOff, Youtube, Instagram, Facebook } from 'lucide-react';
import {
  firebaseSignInWithGoogle,
  firebaseSignInWithFacebook,
  startInstagramOAuth
} from '../firebase.js';

export default function Login() {
  const { login, savePendingSocialPlatform } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegisterAlert, setShowRegisterAlert] = useState(false);

  // Check for success redirect after Firebase OAuth returns
  useEffect(() => {
    const success = sessionStorage.getItem('socialLoginSuccess');
    if (success) {
      sessionStorage.removeItem('socialLoginSuccess');
      showNotification('Successfully signed in!', 'success');
      navigate('/');
    }
  }, [navigate, showNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.success) {
        showNotification('Successfully logged in!', 'success');
        if (data.user?.role === 'Admin' || data.user?.role === 'Super Admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        if (data.requiresVerification) {
          showNotification('Please verify your email first. Check your inbox!', 'warning');
          navigate('/verify-otp', { state: { email } });
        } else if (data.message && (
          data.message.toLowerCase().includes('register first') ||
          data.message.toLowerCase().includes('not found') ||
          data.message.toLowerCase().includes('not exist')
        )) {
          setShowRegisterAlert(true);
        } else {
          showNotification(data.message || 'Invalid email or password', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Official OAuth Redirects ──────────────────────────────────
  // Clicking any social button redirects the user to the REAL
  // Google / Facebook / Instagram login page. No fake forms.
  // After the user authenticates on the official page, they are
  // sent back to our app and AuthContext.jsx reads the result.
  const handleSocialLogin = async (platform) => {
    setLoading(true);
    try {
      // Save which platform triggered so AuthContext knows after redirect
      savePendingSocialPlatform(platform);

      if (platform === 'youtube') {
        // Opens Google's official login page → user enters Google account
        await firebaseSignInWithGoogle();
        // Page navigates away — code below won't run during redirect
      } else if (platform === 'facebook') {
        // Opens Facebook's official login page → user enters Facebook account
        await firebaseSignInWithFacebook();
        // Page navigates away — code below won't run during redirect
      } else if (platform === 'instagram') {
        // Opens Instagram's official OAuth page directly
        startInstagramOAuth();
      }
    } catch (err) {
      console.error('Social redirect error:', err);
      showNotification(err.message || 'Failed to start social sign-in. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] px-4 relative overflow-hidden">
      {/* Admin Login (top-right) */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => navigate('/admin-login')}
          className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#161a36]/50 hover:bg-white dark:hover:bg-[#161a36]/80 transition-colors text-slate-700 dark:text-slate-200"
        >
          Admin Login
        </button>
      </div>

      {/* Background Neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-premium p-8 rounded-3xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size={42} showText={true} textClassName="text-3xl font-bold font-outfit text-gradient tracking-wide" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Sign in to your CreatorHub Workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
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

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-brand-500 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-50 dark:bg-dark-card px-2 text-slate-400">Or continue with</span>
          </div>
        </div>

        {/* Social Logins — open official platform pages */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialLogin('youtube')}
            disabled={loading}
            className="w-full py-3 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-xl font-bold text-sm text-red-600 dark:text-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Youtube className="w-4 h-4" />
            Continue with Google (YouTube)
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('instagram')}
            disabled={loading}
            className="w-full py-3 border border-pink-200 dark:border-pink-900/30 hover:bg-pink-50 dark:hover:bg-pink-950/15 rounded-xl font-bold text-sm text-pink-600 dark:text-pink-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Instagram className="w-4 h-4" />
            Continue with Instagram
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={loading}
            className="w-full py-3 border border-blue-200 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-950/15 rounded-xl font-bold text-sm text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Facebook className="w-4 h-4" />
            Continue with Facebook
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          New to CreatorHub?{' '}
          <Link to="/register" className="text-brand-500 hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </motion.div>

      {/* Account Not Registered Alert */}
      <AnimatePresence>
        {showRegisterAlert && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-xl relative text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white">Account Not Registered</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This email is not registered in our system. Only genuine creators can access the workspace. Please sign up to create a new workspace!
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegisterAlert(false)}
                  className="flex-1 py-2.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRegisterAlert(false);
                    navigate('/register');
                  }}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Register Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
