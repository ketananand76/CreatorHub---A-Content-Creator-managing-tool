import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const { verifyEmailToken } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setLoading(false);
        setMessage('Missing verification security token.');
        return;
      }

      try {
        const data = await verifyEmailToken(token);
        if (data.success) {
          setSuccess(true);
          setMessage('Your email address has been verified successfully!');
          showNotification('Verification successful! Logging you in...', 'success');
          setTimeout(() => {
            const role = data?.user?.role;
            if (role === 'Admin' || role === 'Super Admin') {
              navigate('/admin');
            } else {
              navigate('/');
            }
          }, 2500);
        } else {
          setSuccess(false);
          setMessage(data.message || 'Invalid or expired verification link.');
        }
      } catch (err) {
        console.error(err);
        setSuccess(false);
        setMessage('Failed to connect to authentication server.');
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token, verifyEmailToken, navigate, showNotification]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-premium p-8 rounded-3xl z-10 text-center"
      >
        <div className="flex flex-col items-center mb-6">
          <Logo size={42} showText={true} textClassName="text-3xl font-bold font-outfit text-gradient tracking-wide" />
        </div>

        {loading ? (
          <div className="space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-white mt-4">Verifying Workspace...</h3>
            <p className="text-xs text-slate-400">Communicating with CreatorHub security nodes.</p>
          </div>
        ) : success ? (
          <div className="space-y-6 py-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-500"
            >
              <ShieldCheck className="w-10 h-10" />
            </motion.div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Email Confirmed!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
                {message}
              </p>
            </div>
            
            <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider animate-pulse pt-2">
              Redirecting you to dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Verification Failed</h3>
              <p className="text-xs text-rose-500 px-4 leading-relaxed font-semibold">
                {message}
              </p>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
