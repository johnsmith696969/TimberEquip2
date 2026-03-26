import type { UserProfile } from '../types';

const ADMIN_PUBLISHER_ROLES = new Set(['admin', 'super_admin', 'developer']);
const MANAGED_SELLER_ROLES = new Set(['dealer', 'pro_dealer']);
const DEALER_OS_ROLES = new Set(['dealer', 'pro_dealer', 'admin', 'super_admin', 'developer']);
const SELLER_OVERRIDE_ROLES = new Set(['individual_seller', 'dealer', 'pro_dealer']);

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

function normalizeAccountAccessSource(source?: string | null): string {
  return String(source || '').trim().toLowerCase();
}

export function canUserPostListings(user: UserProfile | null | undefined): boolean {
  if (!user) return false;

  const normalizedRole = normalizeRole(user.role);
  const accessSource = normalizeAccountAccessSource(user.accountAccessSource);
  const adminCanPublishWithoutPayment = !!(normalizedRole && ADMIN_PUBLISHER_ROLES.has(normalizedRole));
  const hasActiveSellerPlan = !!(accessSource === 'subscription' && user.activeSubscriptionPlanId && user.accountStatus === 'active');
  const hasManagedSellerAccess = !!(
    normalizedRole &&
    SELLER_OVERRIDE_ROLES.has(normalizedRole) &&
    user.accountStatus === 'active' &&
    (accessSource === 'managed_account' || accessSource === 'admin_override')
  );
  const hasLegacySellerAccess = !!(
    !accessSource &&
    normalizedRole &&
    MANAGED_SELLER_ROLES.has(normalizedRole) &&
    user.accountStatus === 'active'
  );

  return adminCanPublishWithoutPayment || hasActiveSellerPlan || hasManagedSellerAccess || hasLegacySellerAccess;
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
