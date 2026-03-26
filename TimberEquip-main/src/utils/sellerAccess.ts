import type { UserProfile } from '../types';

const ADMIN_PUBLISHER_ROLES = new Set(['admin', 'super_admin', 'developer']);
const SELLER_OVERRIDE_ROLES = new Set(['individual_seller', 'dealer', 'pro_dealer']);
const DEALER_OS_ROLES = new Set(['dealer', 'pro_dealer']);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
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

export function hasAdminPublishingAccess(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return ADMIN_PUBLISHER_ROLES.has(normalizeRole(user.role));
}

export function hasManagedSellerAccess(user: UserProfile | null | undefined): boolean {
  if (!user) return false;

  const normalizedRole = normalizeRole(user.role);
  const accessSource = normalizeAccountAccessSource(user.accountAccessSource);

  return !!(
    normalizedRole &&
    SELLER_OVERRIDE_ROLES.has(normalizedRole) &&
    user.accountStatus === 'active' &&
    accessSource === 'admin_override'
  );
}

export function hasActiveSellerSubscription(user: UserProfile | null | undefined): boolean {
  if (!user) return false;

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
  return hasAdminPublishingAccess(user) || hasActiveSellerSubscription(user) || hasManagedSellerAccess(user);
}

export function canUserPostListings(user: UserProfile | null | undefined): boolean {
  return hasSellerWorkspaceAccess(user);
}

export function canAccessDealerOs(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const normalizedRole = normalizeRole(user.role);

  if (hasAdminPublishingAccess(user)) return true;
  if (!DEALER_OS_ROLES.has(normalizedRole)) return false;

  return hasActiveSellerSubscription(user) || hasManagedSellerAccess(user);
}

export function getDealerInventoryOwnerUid(user: UserProfile | null | undefined): string {
  if (!user) return '';
  return String(user.parentAccountUid || user.uid || '').trim();
}

export function getFeaturedListingCap(user: UserProfile | null | undefined): number {
  const role = normalizeRole(user?.role);
  if (role === 'dealer') return 3;
  if (role === 'pro_dealer') return 6;
  return 0;
}

export function getListEquipmentPath(user: UserProfile | null | undefined, isAuthenticated: boolean): string {
  if (!isAuthenticated) {
    return '/sell';
  }

  if (!canUserPostListings(user)) {
    return '/ad-programs?intent=list-equipment';
  }

  return '/sell';
}
