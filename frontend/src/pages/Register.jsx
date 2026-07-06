import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { Mail, Lock, User, UserCheck, Shield, Eye, EyeOff, Youtube, Facebook, Instagram } from 'lucide-react';
import { firebaseSignInWithGoogle, firebaseSignInWithFacebook, getIdToken } from '../firebase.js';

export default function Register() {
  const { register, socialLogin } = useAuth();
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
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [bypassPlatform, setBypassPlatform] = useState('');
  const [mockProfile, setMockProfile] = useState('ketan');
  const [securityKey, setSecurityKey] = useState('');
  const [showKey, setShowKey] = useState(false);

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

  const handleBypassSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await socialLogin(bypassPlatform, null, securityKey, mockProfile);
      if (data.success) {
        showNotification('Workspace authenticated successfully!', 'success');
        setShowBypassModal(false);
        setSecurityKey('');
        navigate('/');
      } else {
        showNotification(data.message || 'Verification failed. Incorrect Security Key.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Verification request failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (platform) => {
    setLoading(true);
    try {
      let credential;
      if (platform === 'youtube') {
        credential = await firebaseSignInWithGoogle();
      } else {
        credential = await firebaseSignInWithFacebook();
      }
      const idToken = await getIdToken(credential.user);
      
      const data = await socialLogin(platform, idToken);
      if (data.success) {
        showNotification(`Successfully registered via ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`, 'success');
        navigate('/');
      } else {
        showNotification(data.message || 'Social registration failed', 'error');
      }
    } catch (err) {
      console.error('Social Register Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setBypassPlatform(platform);
        setShowBypassModal(true);
      } else {
        const friendlyMessage = err.code === 'auth/popup-blocked'
          ? 'Sign-in popup was blocked by your browser. Please allow popups for this site.'
          : err.code === 'auth/popup-closed-by-user'
          ? 'Sign-in popup was closed before completion.'
          : err.message || 'Social registration failed.';
        showNotification(friendlyMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
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

      {/* Secure Workspace Key validation Modal */}
      <AnimatePresence>
        {showBypassModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0f172a] border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white">Secure Workspace Link</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                  This social provider is unconfigured in your Firebase Console. Enter your Workspace Security Key to verify and link a profile.
                </p>
              </div>

              <form onSubmit={handleBypassSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Select Target Profile
                  </label>
                  <select
                    value={mockProfile}
                    onChange={(e) => setMockProfile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#070b14] focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-xs"
                  >
                    <option value="ketan">Ketan Paswan (YouTube)</option>
                    <option value="alex">Alex Carter (Instagram)</option>
                    <option value="sam">Samantha Vlogs (Facebook)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Workspace Security Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      required
                      placeholder="Enter security key..."
                      value={securityKey}
                      onChange={(e) => setSecurityKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBypassModal(false);
                      setSecurityKey('');
                    }}
                    className="flex-1 py-2.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !securityKey}
                    className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Link'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
