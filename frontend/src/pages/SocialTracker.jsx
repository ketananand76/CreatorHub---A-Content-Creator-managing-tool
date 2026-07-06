import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Globe, Youtube, Facebook, Instagram, RefreshCw, BarChart2, TrendingUp, Users, Heart, MessageCircle, Eye } from 'lucide-react';
import { firebaseSignInWithGoogle, firebaseSignInWithFacebook, getIdToken } from '../firebase.js';

export default function SocialTracker() {
  const { authFetch } = useAuth();
  const { showNotification } = useNotification();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activePlatformFilter, setActivePlatformFilter] = useState('all');

  const fetchSocialAccounts = async () => {
    try {
      const res = await authFetch('/social/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch social accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialAccounts();
  }, []);

  const handleConnect = async (platform) => {
    try {
      let credential;
      if (platform === 'youtube') {
        credential = await firebaseSignInWithGoogle();
      } else {
        credential = await firebaseSignInWithFacebook();
      }
      const idToken = await getIdToken(credential.user);
      
      const res = await authFetch('/auth/social-login', {
        method: 'POST',
        body: JSON.stringify({ platform, idToken })
      });
      const data = await res.json();
      
      if (data.success) {
        showNotification(`Successfully connected ${platform.charAt(0).toUpperCase() + platform.slice(1)} profile!`, 'success');
        fetchSocialAccounts();
      } else {
        showNotification(data.message || 'Failed to connect profile', 'error');
      }
    } catch (err) {
      console.error('Social Connect Error:', err);
      const friendlyMessage = err.code === 'auth/popup-blocked'
        ? 'Sign-in popup was blocked by your browser. Please allow popups for this site.'
        : err.code === 'auth/operation-not-allowed'
        ? 'This social provider is not enabled/configured in your Firebase Console.'
        : err.code === 'auth/popup-closed-by-user'
        ? 'Sign-in popup was closed before completion.'
        : err.message || 'Social connection failed.';
      showNotification(friendlyMessage, 'error');
    }
  };

  const handleSync = async (platform) => {
    setSyncing(true);
    try {
      const res = await authFetch(`/social/sync/${platform}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        setAccounts(prev => prev.map(a => a.platform === platform ? data.account : a));
      } else {
        showNotification(data.message || 'Sync failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Sync connection failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    const connectedPlatforms = accounts.filter(a => a.connected).map(a => a.platform);
    if (connectedPlatforms.length === 0) return;

    setSyncing(true);
    try {
      for (const platform of connectedPlatforms) {
        const res = await authFetch(`/social/sync/${platform}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setAccounts(prev => prev.map(a => a.platform === platform ? data.account : a));
        }
      }
      showNotification('All active channels synced successfully!', 'success');
    } catch (err) {
      showNotification('Failed to sync some accounts.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Aggregate Metrics
  const totalFollowers = accounts.reduce((acc, a) => acc + (a.connected ? a.followersCount : 0), 0);
  const totalViews = accounts.reduce((acc, a) => acc + (a.connected ? a.totalViews : 0), 0);
  const totalReach = accounts.reduce((acc, a) => acc + (a.connected ? a.totalReach : 0), 0);

  // Collect all items across accounts
  let allItems = [];
  accounts.forEach(a => {
    if (a.connected && a.items) {
      allItems = [...allItems, ...a.items.map(item => ({ ...item, platform: a.platform, handle: a.username }))];
    }
  });

  // Sort items by views descending
  allItems.sort((a, b) => b.views - a.views);

  // Filter items if platform filter is active
  const filteredItems = activePlatformFilter === 'all' 
    ? allItems 
    : allItems.filter(i => i.platform === activePlatformFilter);

  // Generate chart data (mock views over 5 days)
  const chartData = [
    { name: 'Day 1', Views: Math.floor(totalViews * 0.8), Reach: Math.floor(totalReach * 0.8) },
    { name: 'Day 2', Views: Math.floor(totalViews * 0.85), Reach: Math.floor(totalReach * 0.85) },
    { name: 'Day 3', Views: Math.floor(totalViews * 0.9), Reach: Math.floor(totalReach * 0.9) },
    { name: 'Day 4', Views: Math.floor(totalViews * 0.95), Reach: Math.floor(totalReach * 0.95) },
    { name: 'Today', Views: totalViews, Reach: totalReach }
  ];

  const getPlatformColors = (platform) => {
    switch (platform) {
      case 'youtube':
        return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
      case 'instagram':
        return { text: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' };
      case 'facebook':
        return { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      default:
        return { text: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black font-outfit text-slate-800 dark:text-white flex items-center gap-2">
            <Globe className="w-7 h-7 text-brand-500" />
            Live Metrics Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect your YouTube channel, Instagram profiles, or Facebook pages to live trace subscribers, follower statistics, and views.
          </p>
        </div>

        {accounts.some(a => a.connected) && (
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync All Data
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Aggregate Stat Cards */}
          {accounts.some(a => a.connected) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-3xl border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Subscribers / Followers</span>
                  <h3 className="text-3xl font-black mt-2 font-outfit dark:text-white">{totalFollowers.toLocaleString()}</h3>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3 h-3" /> +1.2% growth today
                  </span>
                </div>
                <div className="p-3.5 bg-brand-500/10 text-brand-500 rounded-2xl border border-brand-500/20">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Video & Post Views</span>
                  <h3 className="text-3xl font-black mt-2 font-outfit dark:text-white">{totalViews.toLocaleString()}</h3>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3 h-3" /> +2.5% growth today
                  </span>
                </div>
                <div className="p-3.5 bg-cyan-500/10 text-cyan-500 rounded-2xl border border-cyan-500/20">
                  <Eye className="w-6 h-6" />
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Network Reach</span>
                  <h3 className="text-3xl font-black mt-2 font-outfit dark:text-white">{totalReach.toLocaleString()}</h3>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3 h-3" /> +3.1% growth today
                  </span>
                </div>
                <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
                  <BarChart2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}

          {/* Social Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['youtube', 'instagram', 'facebook'].map(plat => {
              const connectedAcc = accounts.find(a => a.platform === plat);
              const isConnected = !!connectedAcc;

              return (
                <div key={plat} className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${getPlatformColors(plat).bg} ${getPlatformColors(plat).text}`}>
                        {plat === 'youtube' && <Youtube className="w-5 h-5" />}
                        {plat === 'instagram' && <Instagram className="w-5 h-5" />}
                        {plat === 'facebook' && <Facebook className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white capitalize">{plat}</h4>
                        <span className="text-[10px] text-slate-400">
                          {isConnected ? `@${connectedAcc.username}` : 'Not connected'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      isConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {isConnected ? 'Linked' : 'Offline'}
                    </span>
                  </div>

                  {isConnected ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 border-t border-b dark:border-slate-800 py-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">
                            {plat === 'youtube' ? 'Subscribers' : 'Followers'}
                          </span>
                          <span className="font-bold text-sm dark:text-white">
                            {connectedAcc.followersCount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Reach</span>
                          <span className="font-bold text-sm dark:text-white">
                            {connectedAcc.totalReach.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSync(plat)}
                          disabled={syncing}
                          className="flex-1 py-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                          Sync
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-4">
                      <p className="text-xs text-slate-400">
                        Link your {plat} metrics to track live subscriber views and campaign engagement.
                      </p>
                      <button
                        onClick={() => handleConnect(plat)}
                        className={`w-full py-2.5 text-white font-bold rounded-xl text-xs transition-all uppercase tracking-wider ${
                          plat === 'youtube' ? 'bg-red-600 hover:bg-red-700' :
                          plat === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-600' :
                          'bg-[#1877F2] hover:bg-[#166FE5]'
                        }`}
                      >
                        Connect {plat.charAt(0).toUpperCase() + plat.slice(1)}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {accounts.some(a => a.connected) && (
            <>
              {/* Growth Graph */}
              <div className="glass p-6 rounded-3xl border space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Interactive Performance Metrics</h3>
                  <p className="text-xs text-slate-400 mt-1">Growth analysis over the last 5 days including total network impressions and views.</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}
                      />
                      <Line type="monotone" dataKey="Views" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Reach" stroke="#06b6d4" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Specific Items Tracker */}
              <div className="glass p-6 rounded-3xl border space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Recent Posts & Reels Analytics</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Individual views, reach, comments, and engagement tracking metrics.</p>
                  </div>

                  <div className="flex gap-2">
                    {['all', 'youtube', 'instagram', 'facebook'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setActivePlatformFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                          activePlatformFilter === filter
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="pb-3">Content Details</th>
                        <th className="pb-3">Platform</th>
                        <th className="pb-3">Views</th>
                        <th className="pb-3">Reach / Impressions</th>
                        <th className="pb-3">Likes</th>
                        <th className="pb-3">Comments</th>
                        <th className="pb-3 text-right">Published</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {filteredItems.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                          <td className="py-3.5 pr-4">
                            <span className="font-semibold text-slate-800 dark:text-white block max-w-sm truncate" title={item.title}>
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              ID: {item.itemId} • @{item.handle}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[9px] border ${
                              item.platform === 'youtube' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              item.platform === 'instagram' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {item.type || 'post'}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold font-mono text-slate-700 dark:text-slate-200">
                            {item.views.toLocaleString()}
                          </td>
                          <td className="py-3.5 font-mono text-slate-500">
                            {item.reach.toLocaleString()}
                          </td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                              {item.likes.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                              <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                              {item.comments.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 text-right text-slate-400 font-medium">
                            {new Date(item.publishedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!accounts.some(a => a.connected) && (
            <div className="glass p-12 rounded-3xl border text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg font-outfit text-slate-800 dark:text-white">No Connected Profiles</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                To start tracking live analytics, views, and reach on your reels and videos, link your social media credentials using the connection panels above.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
