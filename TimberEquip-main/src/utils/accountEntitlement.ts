import type { AccountEntitlement, UserProfile } from '../types';
import { isDealerSellerRole, isOperatorOnlyRole, isSellerRole, normalizeScopedUserRole } from './roleScopes';

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(role: unknown): string {
  return normalizeScopedUserRole(String(role || ''));
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
    return 'TimberEquip DealerOS';
  }
  if (planId === 'individual_seller' || role === 'individual_seller') {
    return 'TimberEquip';
  }
  return 'n/a';
}

export function resolveAccountEntitlement(user: Partial<UserProfile> | null | undefined): AccountEntitlement {
  const role = normalizeRole(user?.role);
  const accountStatus = normalizeAccountStatus(user?.accountStatus);
  const accountAccessSource = normalizeAccessSource(user?.accountAccessSource);
  const activeSubscriptionPlanId = normalizePlanId(user?.activeSubscriptionPlanId);
  const subscriptionState = normalizeSubscriptionState(user?.subscriptionStatus);

  const adminWorkspaceAccess = isOperatorOnlyRole(role);
  const adminOverrideAccess = !adminWorkspaceAccess
    && isSellerRole(role)
    && accountStatus === 'active'
    && accountAccessSource === 'admin_override';
  const subscriptionBackedAccess = !adminWorkspaceAccess
    && accountStatus === 'active'
    && accountAccessSource === 'subscription'
    && !!activeSubscriptionPlanId
    && subscriptionState !== 'past_due'
    && subscriptionState !== 'pending';
  const sellerWorkspaceAccess = adminOverrideAccess || subscriptionBackedAccess;

  let publicListingVisibility: AccountEntitlement['publicListingVisibility'] = 'not_applicable';
  let visibilityReason: AccountEntitlement['visibilityReason'] = 'non_seller_role';
  if (adminOverrideAccess) {
    publicListingVisibility = 'admin_override';
    visibilityReason = 'admin_override';
  } else if (subscriptionBackedAccess) {
    publicListingVisibility = 'publicly_eligible';
    visibilityReason = 'active_subscription';
  } else if (isSellerRole(role) || !!activeSubscriptionPlanId || accountAccessSource === 'subscription') {
    publicListingVisibility = 'hidden_due_to_billing';
    visibilityReason = accountStatus === 'suspended' ? 'suspended_account' : 'inactive_subscription';
  }

  const planCapability = capabilityFromPlan(activeSubscriptionPlanId);
  const roleCapability = capabilityFromRole(role);
  const effectiveSellerCapability = (subscriptionBackedAccess || adminOverrideAccess)
    ? (planCapability !== 'none' ? planCapability : roleCapability)
    : 'none';

  return {
    subscriptionState,
    effectiveSellerCapability,
    sellerAccessMode: adminOverrideAccess ? 'admin_override' : subscriptionBackedAccess ? 'subscription' : 'none',
    sellerWorkspaceAccess,
    adminWorkspaceAccess,
    canPostListings: sellerWorkspaceAccess,
    dealerOsAccess: isDealerSellerRole(role) && sellerWorkspaceAccess,
    publicListingVisibility,
    visibilityReason,
    billingLabel: resolveBillingLabel(activeSubscriptionPlanId, role),
    overrideSource: adminOverrideAccess ? 'admin_override' : null,
  };
}

export function withResolvedAccountEntitlement<T extends UserProfile>(profile: T): T {
  return {
    ...profile,
    entitlement: resolveAccountEntitlement(profile),
  };
}
