import type { AccountEntitlement, UserProfile } from '../types';

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(role: unknown): string {
  const normalized = normalize(role);
  if (normalized === 'dealer_staff') return 'dealer';
  if (normalized === 'dealer_manager') return 'pro_dealer';
  return normalized;
}

function normalizeAccessSource(source: unknown): UserProfile['accountAccessSource'] {
  const normalized = normalize(source);
  if (normalized === 'free_member' || normalized === 'pending_checkout' || normalized === 'subscription' || normalized === 'admin_override' || normalized === 'managed_account') {
    return normalized;
  }
  return null;
}

function normalizePlanId(planId: unknown): UserProfile['activeSubscriptionPlanId'] {
  const normalized = normalize(planId);
  if (normalized === 'individual_seller' || normalized === 'dealer' || normalized === 'fleet_dealer') {
    return normalized;
  }
  return null;
}

function normalizeSubscriptionState(status: unknown): AccountEntitlement['subscriptionState'] {
  const normalized = normalize(status);
  if (normalized === 'active' || normalized === 'canceled' || normalized === 'past_due' || normalized === 'trialing' || normalized === 'pending') {
    return normalized as AccountEntitlement['subscriptionState'];
  }
  return 'none';
}

function normalizeAccountStatus(status: unknown): UserProfile['accountStatus'] {
  const normalized = normalize(status);
  if (normalized === 'active' || normalized === 'pending' || normalized === 'suspended') {
    return normalized;
  }
  return 'active';
}

function isAdminRole(role: string): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'developer';
}

function isSellerRole(role: string): boolean {
  return role === 'individual_seller' || role === 'dealer' || role === 'pro_dealer';
}

function capabilityFromPlan(planId: UserProfile['activeSubscriptionPlanId']): AccountEntitlement['effectiveSellerCapability'] {
  if (planId === 'individual_seller') return 'owner_operator';
  if (planId === 'dealer') return 'dealer';
  if (planId === 'fleet_dealer') return 'pro_dealer';
  return 'none';
}

function capabilityFromRole(role: string): AccountEntitlement['effectiveSellerCapability'] {
  if (role === 'individual_seller') return 'owner_operator';
  if (role === 'dealer') return 'dealer';
  if (role === 'pro_dealer') return 'pro_dealer';
  return 'none';
}

function resolveBillingLabel(planId: UserProfile['activeSubscriptionPlanId'], role: string): string {
  if (planId === 'dealer' || planId === 'fleet_dealer' || role === 'dealer' || role === 'pro_dealer') {
    return 'FES-DealerOS';
  }
  if (planId === 'individual_seller' || role === 'individual_seller') {
    return 'Forestry Equipment Sales';
  }
  return 'n/a';
}

export function resolveAccountEntitlement(user: Partial<UserProfile> | null | undefined): AccountEntitlement {
  const role = normalizeRole(user?.role);
  const accountStatus = normalizeAccountStatus(user?.accountStatus);
  const accountAccessSource = normalizeAccessSource(user?.accountAccessSource);
  const activeSubscriptionPlanId = normalizePlanId(user?.activeSubscriptionPlanId);
  const subscriptionState = normalizeSubscriptionState(user?.subscriptionStatus);

  const adminAccess = isAdminRole(role);
  const adminOverrideAccess = !adminAccess
    && isSellerRole(role)
    && accountStatus === 'active'
    && accountAccessSource === 'admin_override';
  const subscriptionBackedAccess = !adminAccess
    && accountStatus === 'active'
    && accountAccessSource === 'subscription'
    && !!activeSubscriptionPlanId
    && subscriptionState !== 'past_due'
    && subscriptionState !== 'pending';
  const sellerWorkspaceAccess = adminAccess || adminOverrideAccess || subscriptionBackedAccess;

  let publicListingVisibility: AccountEntitlement['publicListingVisibility'] = 'not_applicable';
  let visibilityReason: AccountEntitlement['visibilityReason'] = 'non_seller_role';
  if (adminAccess || adminOverrideAccess) {
    publicListingVisibility = 'admin_override';
    visibilityReason = adminAccess ? 'admin_role' : 'admin_override';
  } else if (subscriptionBackedAccess) {
    publicListingVisibility = 'publicly_eligible';
    visibilityReason = 'active_subscription';
  } else if (isSellerRole(role) || !!activeSubscriptionPlanId || accountAccessSource === 'subscription') {
    publicListingVisibility = 'hidden_due_to_billing';
    visibilityReason = accountStatus === 'suspended' ? 'suspended_account' : 'inactive_subscription';
  }

  const planCapability = capabilityFromPlan(activeSubscriptionPlanId);
  const roleCapability = capabilityFromRole(role);
  const effectiveSellerCapability = adminAccess
    ? 'admin'
    : (subscriptionBackedAccess || adminOverrideAccess)
      ? (planCapability !== 'none' ? planCapability : roleCapability)
      : 'none';

  return {
    subscriptionState,
    effectiveSellerCapability,
    sellerAccessMode: adminAccess ? 'admin' : adminOverrideAccess ? 'admin_override' : subscriptionBackedAccess ? 'subscription' : 'none',
    sellerWorkspaceAccess,
    canPostListings: sellerWorkspaceAccess,
    dealerOsAccess: adminAccess || ((role === 'dealer' || role === 'pro_dealer') && sellerWorkspaceAccess),
    publicListingVisibility,
    visibilityReason,
    billingLabel: resolveBillingLabel(activeSubscriptionPlanId, role),
    overrideSource: adminOverrideAccess ? 'admin_override' : adminAccess ? 'admin_role' : null,
  };
}

export function withResolvedAccountEntitlement<T extends UserProfile>(profile: T): T {
  return {
    ...profile,
    entitlement: resolveAccountEntitlement(profile),
  };
}
