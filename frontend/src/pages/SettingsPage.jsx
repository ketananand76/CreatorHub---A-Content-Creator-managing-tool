import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Info, Youtube, Instagram, Facebook, Save, ShieldCheck } from 'lucide-react';
import SocialHandleModal from '../components/SocialHandleModal';

export default function SettingsPage() {
  const { user, authFetch, updateLocalUser, updateSocialData } = useAuth();
  const { showNotification } = useNotification();

  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState('');
  const [youtubeSubscribers, setYoutubeSubscribers] = useState(0);
  const [instagramFollowers, setInstagramFollowers] = useState(0);
  const [tiktokFollowers, setTiktokFollowers] = useState(0);
  const [averageEngagement, setAverageEngagement] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [tiktokLink, setTiktokLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [facebookFollowers, setFacebookFollowers] = useState(0);

  const [socialModal, setSocialModal] = useState(null); // 'youtube', 'instagram', 'facebook'

  const handleSocialConnectSuccess = (data) => {
    showNotification(data.message, 'success');
    updateSocialData(data.socialLinks, {
      [socialModal]: data.metrics
    });
    // Update local state to reflect new data immediately
    if (socialModal === 'youtube') {
      setYoutubeLink(data.socialLinks.youtubeLink);
      setYoutubeSubscribers(data.metrics.subscribers);
    } else if (socialModal === 'instagram') {
      setInstagramLink(data.socialLinks.instagramLink);
      setInstagramFollowers(data.metrics.followers);
    } else if (socialModal === 'facebook') {
      setFacebookLink(data.socialLinks.facebookLink);
      setFacebookFollowers(data.metrics.followers);
    }
  };

  // Fetch current user details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch('/auth/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          const p = data.profile;
          setName(p.name || '');
          setBio(p.bio || '');
          setNiche(p.niche || '');
          setYoutubeSubscribers(p.youtubeSubscribers || 0);
          setInstagramFollowers(p.instagramFollowers || 0);
          setTiktokFollowers(p.tiktokFollowers || 0);
          setAverageEngagement(p.averageEngagement || '');
          setYoutubeLink(p.youtubeLink || '');
          setInstagramLink(p.instagramLink || '');
          setTiktokLink(p.tiktokLink || '');
          setFacebookLink(p.facebookLink || '');
          setFacebookFollowers(p.facebookFollowers || 0);
          updateLocalUser(p);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          bio,
          niche,
          youtubeSubscribers,
          instagramFollowers,
          tiktokFollowers,
          averageEngagement,
          youtubeLink,
          instagramLink,
          tiktokLink,
          facebookLink,
          facebookFollowers
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        updateLocalUser({ name }); // Sync name in local states
      } else {
        showNotification(data.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black font-outfit text-slate-800 dark:text-white">Settings & Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Coordinate your personal creator niche settings, account analytics, and read workspace policy documentation.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-3 border-b dark:border-slate-800 pb-3">
        {[
          { id: 'profile', label: 'Creator Profile', icon: User },
          { id: 'privacy', label: 'Privacy & Policies', icon: Shield },
          { id: 'about', label: 'About Workspace', icon: Info }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeSubTab === tab.id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Form SubTab */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main profile section (2 columns) */}
          <div className="md:col-span-2 glass p-6 rounded-2xl border space-y-6">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">
              Identity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Display / Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ketan Paswan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Content Niche / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tech, Travel, Fashion"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs outline-none text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Channel / Creator Bio
              </label>
              <textarea
                placeholder="Share details about your audience and style..."
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white resize-none"
              />
            </div>

            <h3 className="font-bold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2 pt-2">
              Social Links & Portfolio
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* YouTube */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">YouTube</span>
                  </div>
                  {user?.youtubeLink ? (
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Connected</span>
                  ) : (
                    <button type="button" onClick={() => setSocialModal('youtube')} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wider">Connect</button>
                  )}
                </div>
                {user?.youtubeLink ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{user.youtubeLink}</div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span><strong className="text-slate-700 dark:text-slate-300">{user.socialMetrics?.youtube?.subscribers?.toLocaleString() || 0}</strong> Subs</span>
                      <span><strong className="text-slate-700 dark:text-slate-300">{user.socialMetrics?.youtube?.views?.toLocaleString() || 0}</strong> Views</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Connect to track live metrics</div>
                )}
              </div>

              {/* Instagram */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Instagram</span>
                  </div>
                  {user?.instagramLink ? (
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Connected</span>
                  ) : (
                    <button type="button" onClick={() => setSocialModal('instagram')} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wider">Connect</button>
                  )}
                </div>
                {user?.instagramLink ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{user.instagramLink}</div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span><strong className="text-slate-700 dark:text-slate-300">{user.socialMetrics?.instagram?.followers?.toLocaleString() || 0}</strong> Followers</span>
                      <span><strong className="text-slate-700 dark:text-slate-300">{user.socialMetrics?.instagram?.posts?.toLocaleString() || 0}</strong> Posts</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Connect to track live metrics</div>
                )}
              </div>

              {/* Facebook */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Facebook</span>
                  </div>
                  {user?.facebookLink ? (
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Connected</span>
                  ) : (
                    <button type="button" onClick={() => setSocialModal('facebook')} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wider">Connect</button>
                  )}
                </div>
                {user?.facebookLink ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{user.facebookLink}</div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span><strong className="text-slate-700 dark:text-slate-300">{user.socialMetrics?.facebook?.followers?.toLocaleString() || 0}</strong> Followers</span>
                      <span><strong className="text-slate-700 dark:text-slate-300">{user.socialMetrics?.facebook?.likes?.toLocaleString() || 0}</strong> Likes</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Connect to track live metrics</div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics section (1 column) */}
          <div className="glass p-6 rounded-2xl border flex flex-col justify-between space-y-6">
            <div className="space-y-6 hidden">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">
                Growth Metrics
              </h3>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  YouTube Subscribers
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={youtubeSubscribers}
                  onChange={(e) => setYoutubeSubscribers(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Instagram Followers
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={instagramFollowers}
                  onChange={(e) => setInstagramFollowers(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Facebook Followers
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={facebookFollowers}
                  onChange={(e) => setFacebookFollowers(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Average Engagement Rate
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4.2%"
                  value={averageEngagement}
                  onChange={(e) => setAverageEngagement(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10"
            >
              <Save className="w-4 h-4" /> Save Profile Details
            </button>
          </div>
        </form>
      )}

      {/* Privacy Policy SubTab */}
      {activeSubTab === 'privacy' && (
        <div className="glass p-8 rounded-2xl border space-y-6 max-w-3xl leading-relaxed text-xs text-slate-600 dark:text-slate-300">
          <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            CreatorHub Privacy & Policies Statement
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] tracking-wider mb-1">1. User Account Data Safety</h4>
              <p>
                All account registration details, hashed passwords, database schemas, and Google OAuth mock integrations are encrypted utilizing security industry standard layers. No plain-text passwords or keys are saved in our database.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] tracking-wider mb-1">2. Growth Analytics Data Logging</h4>
              <p>
                Platform and campaign earnings logged via Brand CRM, calendar bookings, and subscriber metric tallies are stored dynamically in your workspace database. This data is private and is not exposed to other users or external crawl engines.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] tracking-wider mb-1">3. Cookie & LocalStorage Policies</h4>
              <p>
                CreatorHub stores access tokens, login states, and dark/light UI theme choices directly inside your local storage device cache. This allows offline session restoration without repeated API queries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* About SubTab */}
      {activeSubTab === 'about' && (
        <div className="glass p-8 rounded-2xl border space-y-6 max-w-3xl leading-relaxed text-xs text-slate-600 dark:text-slate-300">
          <h3 className="font-bold text-base text-slate-800 dark:text-white">About CreatorHub SaaS Workspace</h3>
          
          <p>
            CreatorHub is a state-of-the-art SaaS workspace engine designed to optimize workflow pipelines for creators, influencers, and digital campaign coordinators. It consolidates post scheduling, brand deals pipelines, team tasks, and earnings tracking under one single responsive interface.
          </p>

          <div className="grid grid-cols-2 gap-4 border-t dark:border-slate-800 pt-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Product Version</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold font-mono">v1.2.0 (Production)</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">SaaS Engine Target</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">NodeJS, React, Express, MongoDB Atlas</span>
            </div>
          </div>
        </div>
      )}
      {/* Social Handle Modal for Connection */}
      <AnimatePresence>
        {socialModal && (
          <SocialHandleModal
            platform={socialModal}
            mode="connect"
            onClose={() => setSocialModal(null)}
            onSuccess={handleSocialConnectSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
