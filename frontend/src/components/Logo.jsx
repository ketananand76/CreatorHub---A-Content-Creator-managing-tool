import React from 'react';

export default function Logo({ size = 32, showText = false, textClassName = "text-xl font-bold font-outfit text-gradient" }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Logo SVG */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6" />
            <stop offset="50%" stop-color="#7c3aed" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          
          <linearGradient id="logoAccentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ec4899" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>

          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path 
          d="M 390 140 A 170 170 0 1 0 390 372" 
          fill="none" 
          stroke="url(#logoBrandGrad)" 
          stroke-width="42" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />

        <path 
          d="M 270 140 L 290 220 L 370 240 L 290 260 L 270 340 L 250 260 L 170 240 L 250 220 Z" 
          fill="url(#logoAccentGrad)" 
          filter="url(#logoGlow)"
        />

        <circle cx="390" cy="140" r="16" fill="#06b6d4" />
        <circle cx="390" cy="372" r="16" fill="#ec4899" />
        <circle cx="100" cy="240" r="12" fill="#8b5cf6" />
      </svg>

      {/* Optional Title Text */}
      {showText && (
        <span className={textClassName}>
          CreatorHub
        </span>
      )}
    </div>
  );
}
