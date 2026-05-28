
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function AuthGuard({ children }) {
  const { isAuthenticated, currentUser, loading } = useAuth();
  // While restoring session from backend, don't redirect yet
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser && !currentUser.isApproved) return <Navigate to="/pending-approval" replace />;
  return children;
}

export function RoleGuard({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) return <Navigate to="/access-denied" replace />;
  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  // Wait for session restore before deciding
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}
