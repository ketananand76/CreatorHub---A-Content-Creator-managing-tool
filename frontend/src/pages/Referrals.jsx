import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Gift, Copy, Check, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Referrals() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [copied, setCopied] = useState(false);

  // If user doesn't have a referral code yet (newly added feature), we wait until next login or fallback
  const referralCode = user?.referralCode || 'YOUR_CODE';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  
  const totalReferrals = user?.referralCount || 0;
  const progress = totalReferrals % 10;
  const progressPercentage = (progress / 10) * 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showNotification('Referral Link Copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/20 ring-4 ring-rose-500/20">
          <Gift className="w-10 h-10" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-outfit text-slate-900 dark:text-white leading-tight">
          Refer & Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Premium!</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Invite your creator friends to CreatorHub and unlock exclusive premium features completely free.
        </p>
      </div>

      {/* Rules Card (Bilingual) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 border-2 border-brand-500/20 bg-gradient-to-b from-brand-500/5 to-transparent relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Rules & Rewards
          </h2>
          
          <div className="space-y-4 text-slate-700 dark:text-slate-300">
            <div className="flex gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border">
              <span className="text-xl">🇺🇸</span>
              <div>
                <strong className="block text-slate-900 dark:text-white mb-1">English</strong>
                <p>Refer 10 friends and get 1 Day of Premium Features completely FREE! Your premium status will activate automatically once you hit 10 successful sign-ups.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border">
              <span className="text-xl">🇮🇳</span>
              <div>
                <strong className="block text-slate-900 dark:text-white mb-1">Hindi / हिंदी</strong>
                <p>10 doston ko refer karein aur 1 din ka Premium bilkul FREE payein! Jaise hi aapke link se 10 log register karenge, aapka premium apne aap shuru ho jayega.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Link Sharing & Progress */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Share Link */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-3xl p-8 border space-y-6 flex flex-col justify-center"
        >
          <h3 className="text-xl font-bold">Your Unique Invite Link</h3>
          <p className="text-sm text-slate-500">Share this link with other creators. When they sign up, you get closer to free premium!</p>
          
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={referralLink} 
              readOnly 
              className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button 
              onClick={handleCopy}
              className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all shadow-lg shadow-brand-500/20 shrink-0"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* Progress Tracker */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-3xl p-8 border space-y-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Your Progress
            </h3>
            <span className="text-2xl font-black font-outfit text-brand-500">
              {progress}/10
            </span>
          </div>

          <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-500 to-rose-500 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-center font-medium text-slate-600 dark:text-slate-400">
            {10 - progress} more referrals needed for your next free Premium day!
          </p>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Total Referrals Ever:</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{totalReferrals}</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
