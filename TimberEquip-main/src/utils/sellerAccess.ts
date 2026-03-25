import type { UserProfile } from '../types';

const ADMIN_PUBLISHER_ROLES = new Set(['admin', 'super_admin', 'developer']);
const MANAGED_SELLER_ROLES = new Set(['dealer_manager', 'dealer_staff']);

export function canUserPostListings(user: UserProfile | null | undefined): boolean {
  if (!user) return false;

  const adminCanPublishWithoutPayment = !!(user.role && ADMIN_PUBLISHER_ROLES.has(user.role));
  const hasActiveSellerPlan = !!(user.activeSubscriptionPlanId && user.accountStatus === 'active');
  const hasManagedSellerAccess = !!(user.role && MANAGED_SELLER_ROLES.has(user.role) && user.accountStatus === 'active');

  return adminCanPublishWithoutPayment || hasActiveSellerPlan || hasManagedSellerAccess;
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