import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { MovieProvider } from './context/MovieContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TrailerModal } from './components/TrailerModal';

import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

// Scroll to top on route navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Layout wrapper to hide Navbar/Footer on /login if preferred, or keep them consistent
const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login';

  return (
    <div className="flex flex-col min-h-screen bg-cinema-900 text-slate-100">
      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isAuthPage && <Footer />}
      <TrailerModal />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MovieProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/movie/:id" element={<MovieDetailsPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Layout>
          </Router>
        </MovieProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
