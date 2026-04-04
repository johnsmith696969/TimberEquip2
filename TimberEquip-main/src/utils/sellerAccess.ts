import type { UserProfile } from '../types';
import { UNLIMITED_LISTING_CAP } from './listingCaps';
import { isOperatorOnlyRole, isSellerRole, normalizeScopedUserRole, supportsDealerOsRole } from './roleScopes';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const SELLER_RETURN_TO_STORAGE_KEY = 'fes:sell-return-to';
const SELLER_RETURN_TO_MAX_AGE_MS = 30 * 60 * 1000;
const ROLE_BASED_LISTING_CAPS: Record<string, number> = {
  dealer: 50,
  pro_dealer: UNLIMITED_LISTING_CAP,
};
function normalizeRole(role?: string | null): string {
  return normalizeScopedUserRole(role);
}

function normalizeAccountAccessSource(source?: string | null): string {
  return String(source || '').trim().toLowerCase();
}

function normalizeSubscriptionPlanId(planId?: string | null): string {
  return String(planId || '').trim().toLowerCase();
}

function normalizeSubscriptionStatus(status?: string | null): string {
  return String(status || '').trim().toLowerCase();
}

function normalizeReturnToPath(returnTo?: string | null): string {
  const normalizedReturnTo = String(returnTo || '').trim();
  return normalizedReturnTo.startsWith('/') ? normalizedReturnTo : '';
}

export function hasAdminPublishingAccess(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return isOperatorOnlyRole(user.role);
}

export function hasManagedSellerAccess(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.entitlement) {
    return user.entitlement.sellerAccessMode === 'admin_override';
  }

  const normalizedRole = normalizeRole(user.role);
  const accessSource = normalizeAccountAccessSource(user.accountAccessSource);

  return !!(
    normalizedRole &&
    isSellerRole(normalizedRole) &&
    user.accountStatus === 'active' &&
    accessSource === 'admin_override'
  );
}

export function hasActiveSellerSubscription(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.entitlement) {
    return user.entitlement.sellerAccessMode === 'subscription';
  }

  const normalizedPlanId = normalizeSubscriptionPlanId(user.activeSubscriptionPlanId);
  const normalizedStatus = normalizeSubscriptionStatus(user.subscriptionStatus);
  const accessSource = normalizeAccountAccessSource(user.accountAccessSource);
  const hasAllowedBillingStatus = !normalizedStatus || ACTIVE_SUBSCRIPTION_STATUSES.has(normalizedStatus);

  return !!(
    normalizedPlanId &&
    ['individual_seller', 'dealer', 'fleet_dealer'].includes(normalizedPlanId) &&
    user.accountStatus === 'active' &&
    accessSource === 'subscription' &&
    hasAllowedBillingStatus
  );
}

export function hasSellerWorkspaceAccess(user: UserProfile | null | undefined): boolean {
  if (user?.entitlement?.sellerWorkspaceAccess) {
    return true;
  }

  const normalizedRole = normalizeRole(user?.role);
  const isRoleBackedSeller =
    isSellerRole(normalizedRole) &&
    String(user?.accountStatus || '').trim().toLowerCase() === 'active';

  return hasActiveSellerSubscription(user) || hasManagedSellerAccess(user) || isRoleBackedSeller;
}

export function canUserPostListings(user: UserProfile | null | undefined): boolean {
  return hasSellerWorkspaceAccess(user);
}

export function canAccessDealerOs(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.entitlement?.dealerOsAccess) {
    return true;
  }
  const normalizedRole = normalizeRole(user.role);

  if (isOperatorOnlyRole(normalizedRole)) return false;
  if (!supportsDealerOsRole(normalizedRole)) return false;

  return hasActiveSellerSubscription(user) || hasManagedSellerAccess(user);
}

export function getDefaultAccountWorkspacePath(user: UserProfile | null | undefined): '/admin' | '/dealer-os' | '/profile' {
  if (user && isOperatorOnlyRole(user.role)) {
    return '/admin';
  }

  if (canAccessDealerOs(user)) {
    return '/dealer-os';
  }

  return '/profile';
}

export function getDealerInventoryOwnerUid(user: UserProfile | null | undefined): string {
  if (!user) return '';
  return String(user.parentAccountUid || user.uid || '').trim();
}

export function getFeaturedListingCap(user: UserProfile | null | undefined): number {
  const role = normalizeRole(user?.role);
  if (role === 'individual_seller') return 1;
  if (role === 'dealer') return 3;
  if (role === 'pro_dealer') return 6;
  return 0;
}

export function getManagedListingCap(user: UserProfile | null | undefined): number | null {
  if (!user) return null;
  if (hasAdminPublishingAccess(user)) return null;

  if (typeof user.listingCap === 'number' && Number.isFinite(user.listingCap) && user.listingCap > 0) {
    return user.listingCap;
  }

  return ROLE_BASED_LISTING_CAPS[normalizeRole(user.role)] || null;
}

export function getListEquipmentPath(user: UserProfile | null | undefined, isAuthenticated: boolean): string {
  if (!isAuthenticated) {
    return '/sell';
  }

  if (hasAdminPublishingAccess(user)) {
    return '/admin?tab=listings';
  }

  if (!canUserPostListings(user)) {
    return '/ad-programs?intent=list-equipment';
  }

  return '/sell';
}

export function buildNavigationTargetWithReturn(path: string, returnTo?: string | null) {
  const normalizedPath = String(path || '').trim() || '/';
  const questionMarkIndex = normalizedPath.indexOf('?');
  const pathname = questionMarkIndex >= 0 ? normalizedPath.slice(0, questionMarkIndex) : normalizedPath;
  const existingSearch = questionMarkIndex >= 0 ? normalizedPath.slice(questionMarkIndex + 1) : '';
  const normalizedReturnTo = normalizeReturnToPath(returnTo);
  const normalizedSearchParams = new URLSearchParams(existingSearch);

  if (normalizedReturnTo) {
    normalizedSearchParams.set('returnTo', normalizedReturnTo);
  }

  const search = normalizedSearchParams.toString();

  return {
    pathname,
    search: search ? `?${search}` : '',
    state: normalizedReturnTo ? { returnTo: normalizedReturnTo } : undefined,
  };
}

export function appendReturnToParam(path: string, returnTo?: string | null): string {
  const normalizedPath = String(path || '').trim() || '/';
  const normalizedReturnTo = normalizeReturnToPath(returnTo);

  if (!normalizedPath.startsWith('/') || !normalizedReturnTo) {
    return normalizedPath;
  }

  const questionMarkIndex = normalizedPath.indexOf('?');
  const pathname = questionMarkIndex >= 0 ? normalizedPath.slice(0, questionMarkIndex) : normalizedPath;
  const search = questionMarkIndex >= 0 ? normalizedPath.slice(questionMarkIndex + 1) : '';
  const params = new URLSearchParams(search);
  params.set('returnTo', normalizedReturnTo);
  const nextSearch = params.toString();

  return nextSearch ? `${pathname}?${nextSearch}` : pathname;
}

export function rememberSellerReturnTo(returnTo?: string | null): void {
  if (typeof window === 'undefined') return;

  const normalizedReturnTo = normalizeReturnToPath(returnTo);
  if (!normalizedReturnTo) {
    window.sessionStorage.removeItem(SELLER_RETURN_TO_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    SELLER_RETURN_TO_STORAGE_KEY,
    JSON.stringify({
      path: normalizedReturnTo,
      savedAt: Date.now(),
    })
  );
}

export function getRememberedSellerReturnTo(): string {
  if (typeof window === 'undefined') return '';

  try {
    const rawValue = window.sessionStorage.getItem(SELLER_RETURN_TO_STORAGE_KEY);
    if (!rawValue) return '';

    const parsedValue = JSON.parse(rawValue) as { path?: string; savedAt?: number } | null;
    const normalizedReturnTo = normalizeReturnToPath(parsedValue?.path);
    const savedAt = Number(parsedValue?.savedAt || 0);

    if (!normalizedReturnTo || !Number.isFinite(savedAt) || (Date.now() - savedAt) > SELLER_RETURN_TO_MAX_AGE_MS) {
      window.sessionStorage.removeItem(SELLER_RETURN_TO_STORAGE_KEY);
      return '';
    }

    return normalizedReturnTo;
  } catch {
    window.sessionStorage.removeItem(SELLER_RETURN_TO_STORAGE_KEY);
    return '';
  }
}

export function clearRememberedSellerReturnTo(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SELLER_RETURN_TO_STORAGE_KEY);
}
