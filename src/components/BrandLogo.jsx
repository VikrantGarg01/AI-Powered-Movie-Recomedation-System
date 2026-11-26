import React from 'react';
import { Link } from 'react-router-dom';

/**
 * High-definition vector emblem for Movie+
 * Combines cinema clapperboard, play symbol, and glowing streaming "+" mark
 */
export const MoviePlusIcon = ({ className = "w-9 h-9" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Movie+ Logo"
  >
    <defs>
      <linearGradient id="mpBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#240810" />
        <stop offset="40%" stopColor="#181920" />
        <stop offset="100%" stopColor="#0d0e12" />
      </linearGradient>
      <linearGradient id="mpAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff2a4b" />
        <stop offset="100%" stopColor="#e50914" />
      </linearGradient>
      <linearGradient id="mpBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff3366" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#e50914" stopOpacity="0.2" />
      </linearGradient>
      <filter id="mpGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Dark Glass Squircle Container */}
    <rect 
      x="2" 
      y="2" 
      width="44" 
      height="44" 
      rx="13" 
      fill="url(#mpBgGrad)" 
      stroke="url(#mpBorderGrad)" 
      strokeWidth="1.5" 
    />
    
    {/* Film Clapper Top */}
    <path 
      d="M10 13C10 11.8954 10.8954 11 12 11H26L24 18H10V13Z" 
      fill="#ffffff" 
      fillOpacity="0.95" 
    />
    <path d="M13 11L11 18H15L17 11H13Z" fill="#e50914" />
    <path d="M19 11L17 18H21L23 11H19Z" fill="#e50914" />
    <path d="M25 11L23 18H26.5L28.5 11H25Z" fill="#e50914" />
    
    {/* Vibrant Play Triangle */}
    <path 
      d="M16 23L27 29.5L16 36V23Z" 
      fill="url(#mpAccentGrad)" 
      filter="url(#mpGlow)" 
    />
    
    {/* Prominent Streaming "+" Badge */}
    <circle cx="35" cy="13" r="8" fill="#e50914" filter="url(#mpGlow)" />
    <path 
      d="M35 9V17M31 13H39" 
      stroke="#ffffff" 
      strokeWidth="2.4" 
      strokeLinecap="round" 
    />
  </svg>
);

/**
 * Universal Brand Logo Component for Movie+
 */
export const BrandLogo = ({ size = 'md', to = '/', showText = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const plusSizes = {
    sm: 'text-lg font-black',
    md: 'text-2xl font-black -ml-0.5',
    lg: 'text-3xl font-black -ml-0.5',
    xl: 'text-5xl font-black -ml-1'
  };

  const content = (
    <div className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      <div className="shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1">
        <MoviePlusIcon className={iconSizes[size] || iconSizes.md} />
      </div>
      {showText && (
        <span className={`font-display font-black tracking-tight text-white flex items-center leading-none ${textSizes[size] || textSizes.md}`}>
          <span>MOVIE</span>
          <span className={`bg-gradient-to-tr from-rose-500 via-cinema-accent to-amber-400 bg-clip-text text-transparent drop-shadow-sm ${plusSizes[size] || plusSizes.md}`}>
            +
          </span>
        </span>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="inline-flex focus:outline-none">{content}</Link>;
  }

  return content;
};
