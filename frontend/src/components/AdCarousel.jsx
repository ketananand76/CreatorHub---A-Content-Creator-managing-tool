import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Target, Crown, Gift } from 'lucide-react';

const ads = [
  {
    id: 5,
    title: 'FREE PREMIUM!',
    subtitle: 'Refer 10 Friends & Get 1 Day Pro',
    hindiSubtitle: '10 दोस्तों को रेफर करें और 1 दिन का प्रीमियम पाएं!',
    bgGradient: 'from-fuchsia-600 to-rose-600',
    icon: <Gift className="w-12 h-12 text-white/90 group-hover:scale-110 transition-transform duration-300" />,
    ctaText: 'Get My Link',
    ctaLink: '/referrals',
    isPro: true,
  },
  {
    id: 1,
    title: 'Unlock Creator Pro',
    subtitle: 'Get access to premium analytics, exclusive brand deals, and 24/7 priority support.',
    cta: 'UPGRADE NOW',
    icon: Crown,
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    iconBg: 'bg-amber-100 text-amber-600',
    link: '/subscription'
  },
  {
    id: 2,
    title: 'Sponsorship Network',
    subtitle: 'Connect with top brands actively looking for creators in your niche.',
    cta: 'FIND DEALS',
    icon: Target,
    gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
    link: '/brand-crm'
  },
  {
    id: 3,
    title: 'Creator Bootcamp 2026',
    subtitle: 'Join our exclusive 4-week masterclass to 10x your audience growth and engagement.',
    cta: 'ENROLL FREE',
    icon: Zap,
    gradient: 'from-fuchsia-500 via-purple-600 to-indigo-600',
    iconBg: 'bg-purple-100 text-purple-600',
    link: '#'
  },
  {
    id: 4,
    title: 'Refer & Earn ₹500',
    subtitle: 'Invite other creators to CreatorHub and earn flat ₹500 for every successful Pro upgrade!',
    cta: 'GET REFERRAL LINK',
    icon: Gift,
    gradient: 'from-rose-500 via-red-500 to-orange-500',
    iconBg: 'bg-rose-100 text-rose-600',
    link: '#'
  }
];

export default function AdCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  return (
    <div 
      className="relative w-full overflow-hidden rounded-3xl mb-6 shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[200px] sm:h-[160px] w-full bg-slate-900">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}
            className={`absolute inset-0 w-full h-full bg-gradient-to-r ${ads[currentIndex].gradient} p-1`}
          >
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-sm rounded-[22px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              
              <div className="flex items-center gap-5 sm:gap-6 z-10 w-full sm:w-auto">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${ads[currentIndex].iconBg}`}>
                  {React.createElement(ads[currentIndex].icon, { className: "w-7 h-7 sm:w-8 sm:h-8" })}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase bg-white/20 text-white backdrop-blur-md">
                      Sponsored
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {ads[currentIndex].title}
                  </h3>
                  <p className="text-sm text-white/70 max-w-md leading-relaxed mt-1 hidden sm:block">
                    {ads[currentIndex].subtitle}
                  </p>
                </div>
              </div>

              {/* Mobile Subtitle */}
              <p className="text-xs text-white/70 text-center w-full block sm:hidden z-10">
                {ads[currentIndex].subtitle}
              </p>

              <a 
                href={ads[currentIndex].link}
                className="z-10 w-full sm:w-auto text-center px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                {ads[currentIndex].cta}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className={`absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'}`}>
          <button 
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-20">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
