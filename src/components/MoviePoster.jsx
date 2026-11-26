import React, { useState } from 'react';
import { Film } from 'lucide-react';

export const MoviePoster = ({ src, alt, className = "", title, genres = [] }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-cinema-800 to-cinema-950 border border-cinema-700/50 text-slate-300 ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-cinema-700/80 flex items-center justify-center mb-2 shadow-inner">
          <Film className="w-6 h-6 text-cinema-accent" />
        </div>
        <p className="text-xs font-bold line-clamp-2 text-white mb-1">{title || alt || "Cinema Title"}</p>
        {genres.length > 0 && (
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-cinema-700/60 text-slate-400">
            {genres[0]}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-cinema-850 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-cinema-800 animate-pulse shimmer-loader" />
      )}
      <img
        src={src}
        alt={alt || title || "Movie poster"}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
