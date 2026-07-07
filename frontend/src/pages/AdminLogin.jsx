import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, Lock, Eye, EyeOff, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password, true);

      if (data.success && (data.user?.role === 'Admin' || data.user?.role === 'Super Admin')) {
        showNotification('Welcome back, Admin!', 'success');
        navigate('/admin');
        window.location.href = '/admin';
      } else {
        showNotification(data.message || 'Invalid admin credentials', 'error');
      }
    } catch (err) {
      console.error('Admin Login Error:', err);
      showNotification('Authentication failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070913] px-4 relative overflow-hidden">
      {/* Matrix-like Cyber Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0f1224]/80 backdrop-blur-xl border border-red-500/30 p-8 rounded-3xl z-10 shadow-2xl shadow-red-500/5"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <Logo size={46} showText={true} textClassName="text-3xl font-bold font-outfit text-white tracking-wider" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/15 border border-red-500/30 rounded-full text-[10px] font-black text-red-500 uppercase tracking-widest mt-4">
            <Terminal className="w-3.5 h-3.5" /> SECURE ADMIN GATEWAY
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="admin@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-[#161a36]/50 focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-800 bg-[#161a36]/50 focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-lg shadow-red-600/10"
          >
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>

        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-[10px] text-amber-400 font-semibold">
            🔒 This portal is restricted to system administrators only.
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Creator workspace?{' '}
          <Link to="/login" className="text-brand-500 hover:underline font-semibold">
            Return to user login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
