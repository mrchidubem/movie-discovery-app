import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaMoon, FaSun, FaSearch, FaUser, FaSignOutAlt, FaBars, FaTimes, FaHeart, FaFilm, FaBell, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { showToast } from './ToastContainer';
import { searchMovies, getImageUrl } from '../services/tmdbApi';

const Navbar = ({ isDarkMode, toggleDarkMode, openAuthModal }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const featuresMenuRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live search suggestions with debounce
  useEffect(() => {
    if (!searchVisible) {
      setSuggestions([]);
      setSuggestError(null);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      return;
    }

    const query = searchInput.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setSuggestError(null);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        setSuggestError(null);
        const data = await searchMovies(query, 1);
        setSuggestions((data?.results || []).slice(0, 6));
      } catch (e) {
        console.error('Search suggestions failed', e);
        setSuggestError('Unable to load suggestions');
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput, searchVisible]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (featuresMenuRef.current && !featuresMenuRef.current.contains(e.target)) setFeaturesMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    logout();
    setUserMenuOpen(false);
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput('');
      setSearchVisible(false);
      setSuggestions([]);
      setSuggestError(null);
    }
  };

  const handleSuggestionClick = (movieId) => {
    navigate(`/movie/${movieId}#watch`);
    setSearchVisible(false);
    setSearchInput('');
    setSuggestions([]);
    setSuggestError(null);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-sm bg-white/80 shadow-md dark:bg-gray-900/75' : 'bg-transparent'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center text-2xl font-bold text-secondary hover:scale-105 transition-transform">
            <div className="flex items-center justify-center h-9 w-9 mr-2 rounded-full bg-gradient-to-br from-secondary to-indigo-500 text-white shadow-md">
              <FaFilm />
            </div>
            <span className="hidden sm:inline tracking-tight text-lg">MovieVerse</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-3">
            <NavLink to="/" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-secondary' : 'text-gray-800 hover:text-secondary dark:text-gray-200'}`}>Home</NavLink>
            <NavLink to="/search" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-secondary' : 'text-gray-800 hover:text-secondary dark:text-gray-200'}`}>Discover</NavLink>
            {user && <NavLink to="/favorites" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-secondary' : 'text-gray-800 hover:text-secondary dark:text-gray-200'}`}>❤️ Favorites</NavLink>}
            {user && <NavLink to="/watchlist" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-secondary' : 'text-gray-800 hover:text-secondary dark:text-gray-200'}`}>⏰ Watchlist</NavLink>}

            {/* Features Dropdown */}
            <div className="relative" ref={featuresMenuRef}>
              <button
                onClick={() => setFeaturesMenuOpen(prev => !prev)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:text-secondary dark:text-gray-200 flex items-center gap-1"
              >
                ✨ More <FaChevronDown size={12} className={`transition-transform ${featuresMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {featuresMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl ring-1 ring-black ring-opacity-5 z-10">
                  <NavLink to="/search/advanced" onClick={() => setFeaturesMenuOpen(false)} className={({ isActive }) => `flex items-center px-4 py-2 text-sm ${isActive ? 'bg-secondary text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>🔍 Advanced Search</NavLink>
                  <NavLink to="/collections" onClick={() => setFeaturesMenuOpen(false)} className={({ isActive }) => `flex items-center px-4 py-2 text-sm ${isActive ? 'bg-secondary text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>📚 Curated Collections</NavLink>
                  <NavLink to="/streaming-calendar" onClick={() => setFeaturesMenuOpen(false)} className={({ isActive }) => `flex items-center px-4 py-2 text-sm ${isActive ? 'bg-secondary text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>📅 Streaming Calendar</NavLink>
                  <NavLink to="/pricing" onClick={() => setFeaturesMenuOpen(false)} className={({ isActive }) => `flex items-center px-4 py-2 text-sm border-t ${isActive ? 'bg-secondary text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700'}`}>💳 Upgrade Plan</NavLink>
                </div>
              )}
            </div>
          </div>

          {/* Right section – visible on all sizes, smaller on mobile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Search toggle */}
            <button onClick={() => setSearchVisible(prev => !prev)} className="rounded-full p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <FaSearch className="text-lg sm:text-xl" />
            </button>

            {/* Dark mode toggle – always visible */}
            <button onClick={toggleDarkMode} className="rounded-full p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              {isDarkMode ? <FaSun className="text-lg sm:text-xl" /> : <FaMoon className="text-lg sm:text-xl" />}
            </button>

            {/* Auth / User */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(prev => !prev)} className="flex rounded-full text-sm">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-gradient-to-br from-secondary to-pink-500 text-white shadow-md">
                    {user.name ? user.name[0].toUpperCase() : <FaUser className="text-sm sm:text-base" />}
                  </div>
                </button>

                {userMenuOpen && (
                  <div ref={userMenuRef} className="absolute right-0 mt-2 w-56 rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl ring-1 ring-black ring-opacity-5 z-50">
                    <div className="border-b px-4 py-2 dark:border-gray-700">
                      <p className="text-sm font-semibold">{user.name || 'User'}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">👤 Profile</Link>
                    <Link to="/analytics" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">📊 Analytics</Link>
                    <Link to="/favorites" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">❤️ Favorites</Link>
                    <Link to="/watchlist" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">⏰ Watchlist</Link>
                    <Link to="/collections" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">📂 Collections</Link>
                    <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">⚙️ Settings</Link>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">🚪 Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="rounded-full border border-secondary px-3 py-1.5 text-xs sm:text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(prev => !prev)} className="ml-1 md:hidden rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
              {mobileOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3">
            <div className="px-4 space-y-2">
              <NavLink to="/" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Home</NavLink>
              <NavLink to="/search" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Discover</NavLink>
              {user && <NavLink to="/favorites" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>❤️ Favorites</NavLink>}
              {user && <NavLink to="/watchlist" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>⏰ Watchlist</NavLink>}
              <hr className="my-2 dark:border-gray-700" />
              <NavLink to="/search/advanced" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>🔍 Advanced Search</NavLink>
              <NavLink to="/collections" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>📚 Collections</NavLink>
              <NavLink to="/streaming-calendar" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>📅 Calendar</NavLink>
              <NavLink to="/pricing" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-secondary text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>💳 Upgrade</NavLink>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {searchVisible && (
          <div className="border-t border-gray-200 py-3 px-4 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <form onSubmit={handleSearch}>
              <div className="relative flex gap-2">
                <div className="relative flex-grow">
                  <FaSearch className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search for movies..."
                    className="w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-10 text-gray-900 placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-secondary dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      <FaTimes className="text-gray-500 hover:text-secondary" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Live suggestions */}
            {(suggestions.length > 0 || suggestLoading || suggestError) && (
              <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {suggestLoading && (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                    Searching…
                  </div>
                )}
                {suggestError && !suggestLoading && (
                  <div className="px-4 py-3 text-sm text-red-500">{suggestError}</div>
                )}
                {!suggestLoading &&
                  !suggestError &&
                  suggestions.map((movie) => (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => handleSuggestionClick(movie.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {movie.poster_path ? (
                        <img
                          src={getImageUrl(movie.poster_path, 'w92')}
                          alt={movie.title}
                          className="h-12 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-300 text-xs text-gray-600">
                          N/A
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {movie.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'} •{' '}
                          {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;