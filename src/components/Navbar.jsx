import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Film, 
  Search, 
  Bookmark, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Compass, 
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMovies } from '../context/MovieContext';
import { GlobalSearchModal } from './GlobalSearchModal';
import { BrandLogo } from './BrandLogo';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { watchlist, watched } = useMovies();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: Film },
    { name: 'Discover', path: '/discover', icon: Compass },
    { 
      name: 'Watchlist', 
      path: '/watchlist', 
      icon: Bookmark,
      badge: (watchlist || []).length
    },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-nav shadow-lg shadow-black/40 py-3'
            : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <BrandLogo size="md" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'text-white bg-cinema-800/90 shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-cinema-800/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-cinema-accent text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cinema-800/70 border border-cinema-700/60 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-xs"
              aria-label="Open search dialog"
            >
              <Search className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-cinema-900 text-slate-400 border border-cinema-700">
                ⌘K
              </kbd>
            </button>

            {/* User Dropdown / Login CTA */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-cinema-800/80 hover:bg-cinema-750 border border-cinema-700/60 transition-all group"
                  aria-expanded={isUserMenuOpen}
                >
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                    alt={user?.name || "User"}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-cinema-accent/60"
                  />
                  <span className="hidden sm:inline text-xs font-semibold text-slate-200 group-hover:text-white max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl py-2 z-50 border border-cinema-700 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-cinema-700/60">
                      <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-cinema-700/40 text-[11px] text-slate-300">
                        <span className="flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-cinema-accent" />
                          {(watchlist || []).length} saved
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          {(watched || []).length} watched
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-cinema-700/60 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile & Preferences
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-cinema-700/60">
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-semibold shadow-md shadow-cinema-accent/30 transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-cinema-800/80 border border-cinema-700/60"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pt-3 pb-5 glass-nav border-t border-cinema-700/50 mt-3 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'text-white bg-cinema-800'
                          : 'text-slate-300 hover:text-white hover:bg-cinema-800/50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cinema-accent text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              {isAuthenticated && (
                <div className="pt-3 mt-2 border-t border-cinema-800 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-white">{user?.name}</p>
                      <p className="text-[10px] text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
