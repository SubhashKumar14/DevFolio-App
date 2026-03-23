import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  // This calls getMe to fetch user data on mount whenever user is authenticated
  const { isLoading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show spinner while fetching user data after page refresh
  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent"></div>
      </div>
    );
  }

  return children;
}