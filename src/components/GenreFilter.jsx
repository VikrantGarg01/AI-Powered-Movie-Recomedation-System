import React from 'react';

export const GenreFilter = ({
  genres = [],
  selectedGenre = "All",
  onSelectGenre,
  className = ""
}) => {
  // Guarantee "All" is always the first chip
  const sortedGenres = React.useMemo(() => {
    const list = Array.isArray(genres) ? genres.filter((g) => g && g !== 'All') : [];
    return ['All', ...list];
  }, [genres]);

  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 ${className}`}>
      {sortedGenres.map((genre) => {
        const isSelected = selectedGenre === genre;
        return (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
              isSelected
                ? 'bg-cinema-accent text-white shadow-cinema-accent/30 shadow-md scale-105'
                : 'bg-cinema-850 hover:bg-cinema-750 text-slate-300 hover:text-white border border-cinema-700/60'
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
};
