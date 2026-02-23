import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/SearchPage';
import MovieDetails from './pages/MovieDetails';
import Favorites from './pages/Favorites';
import Watchlist from './pages/Watchlist';
import Collections from './pages/Collections';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import AdvancedFilterPage from './pages/AdvancedFilterPage';
import UserAnalyticsPage from './pages/UserAnalyticsPage';
import CuratedCollectionsPage from './pages/CuratedCollectionsPage';
import StreamingCalendarPage from './pages/StreamingCalendarPage';
import PaymentPage from './pages/PaymentPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';

function AppContent() {
  const { user } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState('login');

  // Dark mode on initial load
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedMode !== null) setIsDarkMode(savedMode === 'true');
    else if (prefersDark) setIsDarkMode(true);
  }, []);

  // Persist dark mode and apply class
  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Auto-close modal if user logs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(prev => !prev)}
        openAuthModal={(type = 'login') => {
          if (!user) {
            setAuthModalType(type);
            setShowAuthModal(true);
          }
        }}
      />

      <main className="flex-1 pt-16 md:pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/search/advanced" element={<AdvancedFilterPage />} />
          <Route path="/collections" element={<CuratedCollectionsPage />} />
          <Route path="/streaming-calendar" element={<StreamingCalendarPage />} />
          <Route path="/pricing" element={<PaymentPage />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <UserAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/collections"
            element={
              <ProtectedRoute>
                <Collections />
              </ProtectedRoute>
            }
          />

          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <ToastContainer />

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalType}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}