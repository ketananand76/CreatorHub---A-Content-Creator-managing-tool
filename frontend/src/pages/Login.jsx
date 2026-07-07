import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, verifyOTP } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [step, setStep] = useState(1); // 1 = Login, 2 = Verify Email Notice

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(formData.email, formData.password);

      if (data.success) {
        if (data.requiresVerification) {
          setStep(2);
          showNotification(data.message || 'Verification required. OTP sent.', 'info');
        } else {
          showNotification('Welcome back!', 'success');
          navigate('/');
        }
      } else {
        showNotification(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Server error during login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Removed verify OTP logic

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] glass-premium p-8 rounded-3xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size={42} showText={true} textClassName="text-3xl font-bold font-outfit text-gradient tracking-wide" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            {step === 1 ? 'Welcome back, Creator!' : 'Verify your email address'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleLogin} className="space-y-5">
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
                  placeholder="alex@creatorhub.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-500/10">
              <Mail className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black font-outfit text-slate-800 dark:text-white">Verification Required</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your account hasn't been verified yet. We just sent a new verification link to <strong className="text-slate-700 dark:text-slate-300">{formData.email.toLowerCase()}</strong>.
            </p>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 text-sm font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-500 hover:underline font-semibold">
            Register here
          </Link>
        </p>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <Link to="/admin-login" className="text-xs text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 font-semibold uppercase tracking-wider transition-colors">
            Are you an Administrator?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
