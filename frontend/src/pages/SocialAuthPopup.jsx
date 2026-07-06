import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Youtube, Facebook, Instagram, ShieldAlert, CheckCircle } from 'lucide-react';

export default function SocialAuthPopup() {
  const [searchParams] = useSearchParams();
  const platform = searchParams.get('platform') || 'youtube';
  const isRegister = searchParams.get('isRegister') === 'true';

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Prefill mock accounts for quick testing
  const mockAccounts = {
    youtube: [
      { name: 'Ketan Paswan Vlogs', username: 'ketan_vlogs', email: 'ketanpaswan53@gmail.com' },
      { name: 'Alex Tech Review', username: 'alex_reviews', email: 'alex@creatorhub.com' },
      { name: 'Sam FitLife', username: 'sam_fit', email: 'samfit@gmail.com' }
    ],
    instagram: [
      { name: 'Ketan Paswan', username: 'ketan_paswan', email: 'ketanpaswan53@gmail.com' },
      { name: 'Alex Morgan', username: 'alex_morgan_official', email: 'alex@creatorhub.com' },
      { name: 'Travel Daily', username: 'travel_daily', email: 'traveldaily@outlook.com' }
    ],
    facebook: [
      { name: 'Ketan Paswan Community', username: 'ketan.community', email: 'ketanpaswan53@gmail.com' },
      { name: 'Alex Morgan Official', username: 'alex.morgan.creations', email: 'alex@creatorhub.com' },
      { name: 'Foodies Global', username: 'foodies.global.page', email: 'foodies@gmail.com' }
    ]
  };

  const currentMockList = mockAccounts[platform] || [];

  const handlePrefill = (account) => {
    setName(account.name);
    setUsername(account.username);
    setEmail(account.email);
  };

  const handleAuthorize = async (e) => {
    e.preventDefault();
    if (!name || !username) {
      setError('Please fill in the profile details.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        platform,
        email: email || `${platform}_${username}@creatorhub.mock`,
        name,
        socialId: username,
        profilePicture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`
      };

      const API_BASE = String(
        import.meta.env.VITE_API_BASE ||
        import.meta.env.VITE_API_TARGET ||
        import.meta.env.VITE_API_URL ||
        ''
      ).replace(/\/$/, '');
      const API_URL = API_BASE.includes('/api') ? `${API_BASE}/auth/social-login` : `${API_BASE}/api/auth/social-login`;

      const headers = { 'Content-Type': 'application/json' };
      
      // If user is already logged in, send token to link the social account
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('refreshToken'); // simple token check
      if (storedUser && token) {
        // Send access token if available from opener
        try {
          const authData = window.opener?.localStorage.getItem('user');
          // We can read it directly from the opener
        } catch (_) {}
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        // Post message back to parent window
        if (window.opener) {
          window.opener.postMessage(
            { type: 'social-auth-success', data },
            window.location.origin
          );
        }
        setTimeout(() => {
          window.close();
        }, 1200);
      } else {
        setError(data.message || 'Authorization failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Set page titles
  useEffect(() => {
    document.title = `Authorize ${platform.toUpperCase()} | CreatorHub Secure Auth`;
  }, [platform]);

  // Color schemes based on platform
  const colors = {
    youtube: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      accent: 'border-red-500/20 text-red-500 bg-red-500/5',
      logo: <Youtube className="w-10 h-10 text-red-600" />
    },
    instagram: {
      bg: 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600',
      text: 'text-pink-600',
      btn: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 focus:ring-pink-500',
      accent: 'border-pink-500/20 text-pink-500 bg-pink-500/5',
      logo: <Instagram className="w-10 h-10 text-pink-500" />
    },
    facebook: {
      bg: 'bg-[#1877F2]',
      text: 'text-[#1877F2]',
      btn: 'bg-[#1877F2] hover:bg-[#166FE5] focus:ring-[#1877F2]',
      accent: 'border-blue-500/20 text-blue-500 bg-blue-500/5',
      logo: <Facebook className="w-10 h-10 text-[#1877F2]" />
    }
  }[platform] || {
    bg: 'bg-slate-800',
    text: 'text-slate-800',
    btn: 'bg-slate-800 hover:bg-slate-900',
    accent: 'border-slate-500/20 text-slate-500 bg-slate-500/5',
    logo: <Youtube className="w-10 h-10 text-slate-800" />
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b14] p-4 text-slate-800 dark:text-slate-200">
      <div className="absolute top-0 left-0 w-full h-1.5 overflow-hidden">
        <div className={`h-full w-full ${colors.bg} animate-pulse`}></div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-900 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
        {success ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-lg font-outfit text-slate-800 dark:text-white">Authorization Successful</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Connecting back to CreatorHub and closing this secure tab...
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner">
                {colors.logo}
              </div>
              <h3 className="font-bold text-lg font-outfit text-slate-800 dark:text-white">
                Link Your {platform.charAt(0).toUpperCase() + platform.slice(1)} Channel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
                Authorize <strong className="text-slate-800 dark:text-white">CreatorHub Workspace</strong> to access your channel analytics, view counts, and follower stats.
              </p>
            </div>

            {/* Mock Quick Select */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Select Mock Account
              </label>
              <div className="grid grid-cols-3 gap-2">
                {currentMockList.map((acc, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePrefill(acc)}
                    className="p-2 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-[10px] text-center font-semibold truncate transition-colors text-slate-600 dark:text-slate-300"
                    title={acc.name}
                  >
                    {acc.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAuthorize} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Display Name / Channel Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ketan Paswan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Handle / Username (without @)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ketan_vlogs"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. ketanpaswan53@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.close()}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${colors.btn} disabled:opacity-50`}
                >
                  {loading ? 'Authorizing...' : 'Allow & Link'}
                </button>
              </div>
            </form>

            <div className={`p-3 border rounded-xl flex items-start gap-2 ${colors.accent}`}>
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] leading-relaxed">
                <strong>🔒 Secure Connection:</strong> CreatorHub communicates via SSL and uses mock credentials to secure and pre-populate your live growth tracking panel details.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
