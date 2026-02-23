import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader'; // assuming you have a Loader component

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth(); // ← use loading from context
  const location = useLocation();

  // While auth is still loading (restore from localStorage or just logged in)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="large" /> {/* or any spinner */}
      </div>
    );
  }

  // After loading finished, if no user → redirect to home (and save where they tried to go)
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User exists → show the protected content
  return children;
}