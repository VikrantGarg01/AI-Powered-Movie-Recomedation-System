import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = "Search movies by title, director, actors...",
  className = ""
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 rounded-2xl bg-cinema-850 border border-cinema-700/80 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cinema-cyan/70 focus:ring-1 focus:ring-cinema-cyan/70 transition-all shadow-inner"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-cinema-700 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
