import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes, FaSearch, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-gray-900 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-secondary">
          MovieApp
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/" className="hover:text-secondary">
            Home
          </NavLink>
          <NavLink to="/search" className="hover:text-secondary">
            Search
          </NavLink>
          <NavLink to="/favorites" className="hover:text-secondary">
            Favorites
          </NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className="hover:text-secondary">
                Login
              </NavLink>
              <NavLink to="/register" className="hover:text-secondary">
                Register
              </NavLink>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <FaUserCircle className="text-xl" />
              <button
                onClick={logout}
                className="rounded bg-red-500 px-3 py-1 text-sm hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-2xl focus:outline-none"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 text-white border-t border-gray-700">
          <div className="flex flex-col px-6 py-4 space-y-4">
            <NavLink
              to="/"
              onClick={closeMenu}
              className="text-white hover:text-secondary"
            >
              Home
            </NavLink>

            <NavLink
              to="/search"
              onClick={closeMenu}
              className="text-white hover:text-secondary"
            >
              Search
            </NavLink>

            <NavLink
              to="/favorites"
              onClick={closeMenu}
              className="text-white hover:text-secondary"
            >
              Favorites
            </NavLink>

            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className="text-white hover:text-secondary"
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className="text-white hover:text-secondary"
                >
                  Register
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/profile"
                  onClick={closeMenu}
                  className="text-white hover:text-secondary"
                >
                  Profile
                </NavLink>

                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="text-left text-red-400 hover:text-red-500"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;