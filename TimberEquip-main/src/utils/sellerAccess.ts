import type { UserProfile } from '../types';

const ADMIN_PUBLISHER_ROLES = new Set(['admin', 'super_admin', 'developer']);
const MANAGED_SELLER_ROLES = new Set(['dealer', 'pro_dealer']);
const DEALER_OS_ROLES = new Set(['dealer', 'pro_dealer', 'admin', 'super_admin', 'developer']);

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

export function canUserPostListings(user: UserProfile | null | undefined): boolean {
  if (!user) return false;

  const adminCanPublishWithoutPayment = !!(user.role && ADMIN_PUBLISHER_ROLES.has(user.role));
  const hasActiveSellerPlan = !!(user.activeSubscriptionPlanId && user.accountStatus === 'active');
  const hasManagedSellerAccess = !!(user.role && MANAGED_SELLER_ROLES.has(user.role) && user.accountStatus === 'active');

  return adminCanPublishWithoutPayment || hasActiveSellerPlan || hasManagedSellerAccess;
}

export function canAccessDealerOs(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return DEALER_OS_ROLES.has(normalizeRole(user.role));
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