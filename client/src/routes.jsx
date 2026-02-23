import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import MovieDetails from "./pages/MovieDetails";
import Favorites from "./pages/Favorites";
import Watchlist from "./pages/Watchlist";
import Collections from "./pages/Collections";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "search", element: <SearchPage /> },
      { path: "movie/:id", element: <MovieDetails /> },
      {
        path: "favorites",
        element: (
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        ),
      },
      {
        path: "watchlist",
        element: (
          <ProtectedRoute>
            <Watchlist />
          </ProtectedRoute>
        ),
      },
      {
        path: "collections",
        element: (
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        ),
      },
      { path: "user/:userId", element: <UserProfile /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <SignUp /> },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ✅ Proper 404 handling
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
