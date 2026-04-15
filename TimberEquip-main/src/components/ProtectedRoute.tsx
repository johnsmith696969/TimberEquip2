import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { canAccessDealerOs } from '../utils/sellerAccess';
import { auth } from '../firebase';
import { isOperatorOnlyRole } from '../utils/roleScopes';

const ADMIN_ROLES = ['super_admin', 'admin', 'developer', 'content_manager', 'editor'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireDealerOs?: boolean;
  requireVerified?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireDealerOs = false, requireVerified = false }: ProtectedRouteProps) {
  const { authLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const state = location.state as { returnTo?: unknown } | null;
  const returnTo = typeof state?.returnTo === 'string' && state.returnTo.startsWith('/')
    ? state.returnTo
    : '';
  const hasFirebaseSession = Boolean(auth.currentUser);
  const hasResolvedProfile = Boolean(user);
  const hasSession = Boolean(isAuthenticated || hasFirebaseSession);

  const hasAdminAccess = !!(user && user.role && ADMIN_ROLES.includes(user.role));
  const isOperatorAccount = Boolean(user && isOperatorOnlyRole(user.role));
  const hasDealerOsAccess = canAccessDealerOs(user);

  if (authLoading && !hasSession) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
        <div className="text-[11px] font-black uppercase tracking-widest text-muted">Loading Account...</div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          ...(returnTo ? { returnTo } : {}),
        }}
      />
    );
  }

  if (!hasResolvedProfile) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
        <div className="text-[11px] font-black uppercase tracking-widest text-muted">Loading Account...</div>
      </div>
    );
  }

  if (requireAdmin && !hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  if (requireDealerOs && !hasDealerOsAccess) {
    return <Navigate to={isOperatorAccount ? '/admin' : '/profile'} replace state={{ from: `${location.pathname}${location.search}` }} />;
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
