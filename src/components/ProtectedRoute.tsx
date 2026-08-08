/**
 * src/components/ProtectedRoute.tsx
 *
 * Guards any route that requires authentication.
 * While the session restore is in progress, renders a full-screen loader.
 * Once loading completes, redirects unauthenticated users to /login,
 * preserving the original path in the `redirect` query param so we can
 * return them there after login.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute() {
  const { accessToken, isLoading } = useAuthStore();
  const location = useLocation();

  // Still doing the silent restore — show full-screen spinner
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not authenticated — bounce to login, preserving where they were going
  if (!accessToken) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Authenticated — render the nested route
  return <Outlet />;
}
