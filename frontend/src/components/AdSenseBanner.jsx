import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdSenseBanner({ type = 'banner' }) {
  const { authFetch, user } = useAuth();
  const [adCode, setAdCode] = useState('');
  const containerRef = useRef(null);
  const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

  useEffect(() => {
    let active = true;
    const fetchAd = async () => {
      try {
        let res = await authFetch('/admin/settings/adsense');
        let data = null;

        if (!res.ok) {
          const fallbackRes = await fetch(`${API_BASE}/admin/settings/adsense`);
          data = await fallbackRes.json();
        } else {
          data = await res.json();
        }

        if (data?.success && active) {
          setAdCode(data.adCode || '');
        }
      } catch (err) {
        console.error('Failed to load ad banner', err);
      }
    };
    fetchAd();
    return () => { active = false; };
  }, [authFetch, API_BASE]);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    if (!adCode) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = adCode;
    containerRef.current.appendChild(wrapper);

    const scripts = wrapper.querySelectorAll('script');
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
        newScript.async = true;
      } else {
        newScript.textContent = script.textContent;
      }
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      document.body.appendChild(newScript);
    });
  }, [adCode]);

  // Hide ads for administrators
  if (user && (user.role === 'Admin' || user.role === 'Super Admin')) {
    return null;
  }

  return (
    <div className={`w-full overflow-hidden ${type === 'sidebar' ? 'px-4 py-2 border-t border-slate-200 dark:border-slate-800/80' : 'my-6'}`}>
      {type === 'sidebar' ? (
        <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-center relative">
          <span className="absolute top-1 right-2 text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sponsored</span>
          <div ref={containerRef} className="text-[10px] text-slate-500 overflow-hidden flex items-center justify-center min-h-[50px] mt-2" />
        </div>
      ) : (
        <div className="glass p-4 rounded-3xl border border-brand-500/10 flex flex-col items-center justify-center relative min-h-[90px]">
          <span className="absolute top-2 right-4 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Advertisement</span>
          <div ref={containerRef} className="w-full flex justify-center mt-3 overflow-hidden" />
        </div>
      )}
    </div>
  );
}
