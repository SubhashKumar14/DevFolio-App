import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/roleRoutes';

export function ProtectedRoute({ children, allowedRoles }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeUser = useAuthStore((state) => state.user);
  const location = useLocation();

  // This calls getMe to fetch user data on mount whenever user is authenticated
  const { isLoading, user: queryUser } = useAuth();
  const user = queryUser || storeUser;

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

  if (allowedRoles?.length && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return children;
}