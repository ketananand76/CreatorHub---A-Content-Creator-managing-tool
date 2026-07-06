import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, Lock, User, UserCheck, Shield, Eye, EyeOff, Youtube, Facebook, Instagram } from 'lucide-react';

export default function Register() {
  const { register, socialLoginSuccess } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Creator'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register(formData.name, formData.email, formData.password, formData.role);
      if (data.success) {
        if (data.requiresVerification) {
          showNotification('Account created! A verification link has been sent to your email. Please click it to verify.', 'success');
          navigate('/verify-otp', { state: { email: formData.email, simulatedLink: data.simulatedLink } });
        } else {
          showNotification('Registration successful!', 'success');
          if (data.user?.role === 'Admin' || data.user?.role === 'Super Admin') navigate('/admin');
          else navigate('/');
        }
      } else {
        showNotification(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const redirectErr = sessionStorage.getItem('authRedirectError');
    if (redirectErr) {
      sessionStorage.removeItem('authRedirectError');
      showNotification(redirectErr, 'error');
    }
  }, [showNotification]);

  const handleSocialRegister = (platform) => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `/social-auth-popup?platform=${platform}&isRegister=true`,
      'Authorize CreatorHub',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'social-auth-success') {
        const { data } = event.data;
        if (data.success) {
          socialLoginSuccess(data);
          showNotification(`Successfully registered via ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`, 'success');
          navigate('/');
        } else {
          showNotification(data.message || 'Social registration failed', 'error');
        }
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] px-4 relative overflow-hidden">
      {/* Background Neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-premium p-8 rounded-3xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size={42} showText={true} textClassName="text-3xl font-bold font-outfit text-gradient tracking-wide" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Register and coordinate your content campaigns
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
              />
            </div>
          </div>

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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Password
            </label>
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

          {/* Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Account Type / Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Creator' })}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'Creator'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Creator / Agency
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Team Member' })}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'Team Member'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                Team Member
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t dark:border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 dark:bg-dark-card px-2 text-slate-400">Or Register With</span></div>
        </div>

        {/* Social Logins */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialRegister('youtube')}
            disabled={loading}
            className="w-full py-3 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-xl font-bold text-sm text-red-600 dark:text-red-400 transition-all flex items-center justify-center gap-2"
          >
            <Youtube className="w-4 h-4" />
            Register with YouTube
          </button>

          <button
            type="button"
            onClick={() => handleSocialRegister('instagram')}
            disabled={loading}
            className="w-full py-3 border border-pink-200 dark:border-pink-900/30 hover:bg-pink-50 dark:hover:bg-pink-950/15 rounded-xl font-bold text-sm text-pink-600 dark:text-pink-400 transition-all flex items-center justify-center gap-2"
          >
            <Instagram className="w-4 h-4" />
            Register with Instagram
          </button>

          <button
            type="button"
            onClick={() => handleSocialRegister('facebook')}
            disabled={loading}
            className="w-full py-3 border border-blue-200 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-950/15 rounded-xl font-bold text-sm text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center gap-2"
          >
            <Facebook className="w-4 h-4" />
            Register with Facebook
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
