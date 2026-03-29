import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isPrivilegedAdminEmail } from '../utils/privilegedAdmin';

const ADMIN_ROLES = ['super_admin', 'admin', 'developer', 'content_manager', 'editor'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireDealerOs?: boolean;
  requireVerified?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireDealerOs = false, requireVerified = true }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const hasAdminAccess = !!(
    user && (
      (user.role && ADMIN_ROLES.includes(user.role)) ||
      isPrivilegedAdminEmail(user.email)
    )
  );

  const hasDealerOsAccess = !!(
    user && (
      user.entitlement?.dealerOsAccess ||
      ['dealer', 'pro_dealer', 'admin', 'super_admin', 'developer'].includes(String(user.role || '').trim().toLowerCase())
    )
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (requireAdmin && !hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  if (requireDealerOs && !hasDealerOsAccess) {
    return <Navigate to="/profile" replace state={{ from: `${location.pathname}${location.search}` }} />;
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
