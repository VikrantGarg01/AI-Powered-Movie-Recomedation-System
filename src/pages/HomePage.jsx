import React from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { MovieCarousel } from '../components/MovieCarousel';
import { useMovies } from '../context/MovieContext';

export const HomePage = () => {
  const {
    trendingMovies,
    popularMovies,
    topRatedMovies,
    recentlyReleasedMovies,
    indianMovies,
    personalizedRecommendations,
    watched
  } = useMovies();

  return (
    <div className="min-h-screen">
      {/* Cinematic Hero Spotlight Banner */}
      <HeroBanner />

      {/* Main Content Movie Sections */}
      <div className="relative z-20 -mt-10 sm:-mt-16 space-y-2">
        {/* Recommended For You Section */}
        <div className="bg-gradient-to-b from-transparent via-cinema-900/40 to-transparent">
          <MovieCarousel
            title="Recommended For You"
            subtitle={
              (watched || []).length > 0
                ? 'AI-tailored matches based on your watched films & content-similarity vectors'
                : 'Diverse discovery selections — watch and mark any movie to unlock personalized recommendations!'
            }
            movies={(personalizedRecommendations || []).slice(0, 10)}
            viewAllLink="/recommendations"
            badge="AI Powered"
            showMatchScore={true}
          />
        </div>

        {/* Trending Movies */}
        <MovieCarousel
          title="Trending Movies"
          subtitle="What cinema lovers and critics are actively watching right now"
          movies={trendingMovies}
          viewAllLink="/discover?sort=popularity"
          badge="Top Trending"
        />

        {/* Indian Cinema & Bollywood Hits */}
        {indianMovies && indianMovies.length > 0 && (
          <MovieCarousel
            title="Indian Cinema & Blockbusters"
            subtitle="Critically acclaimed Indian masterworks, timeless classics, and cultural phenomena"
            movies={indianMovies}
            viewAllLink="/discover?genre=Indian+Cinema"
            badge="Indian Cinema"
          />
        )}

        {/* Popular Movies */}
        <MovieCarousel
          title="Popular Worldwide"
          subtitle="Blockbusters with massive audience viewership and global acclaim"
          movies={popularMovies}
          viewAllLink="/discover?sort=popularity"
        />

        {/* Top Rated Masterpieces */}
        <MovieCarousel
          title="Top Rated Masterpieces"
          subtitle="Highest scored cinema history classics rated 8.4+ by IMDb & audience consensus"
          movies={topRatedMovies}
          viewAllLink="/discover?sort=rating"
          badge="Critically Acclaimed"
        />

        {/* Recently Released (2023 - 2024) */}
        <MovieCarousel
          title="Recently Released"
          subtitle="Fresh theatrical premieres and newly minted cinematic experiences"
          movies={recentlyReleasedMovies}
          viewAllLink="/discover?sort=year"
          badge="Fresh Premieres"
        />
      </div>
    </div>
  );
};
