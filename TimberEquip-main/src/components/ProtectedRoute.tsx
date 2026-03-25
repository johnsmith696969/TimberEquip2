import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ADMIN_ROLES = ['super_admin', 'admin', 'developer', 'content_manager', 'editor'];
const ADMIN_EMAILS = ['calebhappy@gmail.com'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireVerified = true }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const hasAdminAccess = !!(
    user && (
      (user.role && ADMIN_ROLES.includes(user.role)) ||
      (user.email && ADMIN_EMAILS.includes(user.email.trim().toLowerCase()))
    )
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (requireAdmin && !hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  if (requireVerified && user && !user.emailVerified) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          reason: 'email-verification-required',
          email: user.email,
        }}
      />
    );
  }

  return <>{children}</>;
}
