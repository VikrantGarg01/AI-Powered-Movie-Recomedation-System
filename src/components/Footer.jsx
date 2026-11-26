import React from 'react';
import { Film, Compass, Bookmark, User, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-cinema-800 bg-cinema-950/80 backdrop-blur-md pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Project Info */}
          <div className="md:col-span-2 space-y-3">
            <BrandLogo size="md" />

            <p className="text-slate-300 leading-relaxed max-w-md">
              Your premier destination for cinema discovery, curated world masterpieces, and intelligent content-based movie recommendations.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full-Stack Architecture • Secure JWT Authentication & TMDB Sync</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-cinema-cyan transition-colors flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-cinema-accent" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/discover" className="hover:text-cinema-cyan transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cinema-cyan" />
                  <span>Discover Catalog</span>
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-cinema-cyan transition-colors flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-cinema-accent" />
                  <span>My Watchlist</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-cinema-cyan transition-colors flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile & Preferences</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore Genres */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Popular Genres
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/discover?genre=Indian+Cinema" className="hover:text-cinema-cyan transition-colors">
                  Indian Cinema & Bollywood
                </Link>
              </li>
              <li>
                <Link to="/discover?genre=Action" className="hover:text-cinema-cyan transition-colors">
                  Action & Thriller
                </Link>
              </li>
              <li>
                <Link to="/discover?genre=Science+Fiction" className="hover:text-cinema-cyan transition-colors">
                  Science Fiction & Space
                </Link>
              </li>
              <li>
                <Link to="/discover?genre=Drama" className="hover:text-cinema-cyan transition-colors">
                  Drama & Masterpieces
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-cinema-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 Movie+ Recommendation System. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Powered by TMDB</span>
            <span>•</span>
            <span className="text-slate-300">Content-Based Recommendation Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
