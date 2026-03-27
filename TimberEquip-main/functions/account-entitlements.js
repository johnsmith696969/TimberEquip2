function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(role) {
  const normalized = normalize(role);
  if (normalized === 'dealer_staff') return 'dealer';
  if (normalized === 'dealer_manager') return 'pro_dealer';
  return normalized;
}

function normalizeAccountAccessSource(source) {
  const normalized = normalize(source);
  if (['free_member', 'pending_checkout', 'subscription', 'admin_override', 'managed_account'].includes(normalized)) {
    return normalized;
  }
  return '';
}

function normalizeAccountStatus(status) {
  const normalized = normalize(status);
  if (['active', 'pending', 'suspended'].includes(normalized)) {
    return normalized;
  }
  return '';
}

function normalizePlanId(planId) {
  const normalized = normalize(planId);
  if (['individual_seller', 'dealer', 'fleet_dealer'].includes(normalized)) {
    return normalized;
  }
  return '';
}

function normalizeSubscriptionStatus(status) {
  const normalized = normalize(status);
  if (['active', 'canceled', 'past_due', 'trialing', 'pending'].includes(normalized)) {
    return normalized;
  }
  return '';
}

function normalizePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isAdminRole(role) {
  return ['super_admin', 'admin', 'developer'].includes(normalizeRole(role));
}

function isSellerRole(role) {
  return ['individual_seller', 'dealer', 'pro_dealer'].includes(normalizeRole(role));
}

function planIdToCapability(planId) {
  if (planId === 'individual_seller') return 'owner_operator';
  if (planId === 'dealer') return 'dealer';
  if (planId === 'fleet_dealer') return 'pro_dealer';
  return 'none';
}

function roleToCapability(role) {
  if (role === 'individual_seller') return 'owner_operator';
  if (role === 'dealer') return 'dealer';
  if (role === 'pro_dealer') return 'pro_dealer';
  return 'none';
}

function resolveBillingLabel(planId, role) {
  if (planId === 'dealer' || planId === 'fleet_dealer' || role === 'dealer' || role === 'pro_dealer') {
    return 'FES-DealerOS';
  }
  if (planId === 'individual_seller' || role === 'individual_seller') {
    return 'Forestry Equipment Sales';
  }
  return 'n/a';
}

function buildAccountEntitlementSnapshot(rawState = {}) {
  const role = normalizeRole(rawState.role);
  const accountStatus = normalizeAccountStatus(rawState.accountStatus) || 'active';
  const accountAccessSource = normalizeAccountAccessSource(rawState.accountAccessSource);
  const activeSubscriptionPlanId = normalizePlanId(
    rawState.activeSubscriptionPlanId || rawState.subscriptionPlanId || rawState.planId
  );
  const subscriptionState = normalizeSubscriptionStatus(rawState.subscriptionStatus);
  const listingCap = normalizePositiveNumber(rawState.listingCap);
  const managedAccountCap = normalizePositiveNumber(rawState.managedAccountCap);
  const currentSubscriptionId = String(rawState.currentSubscriptionId || '').trim() || null;
  const currentPeriodEnd = String(rawState.currentPeriodEnd || '').trim() || null;

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
  const canPostListings = sellerWorkspaceAccess;
  const dealerOsAccess = adminAccess || (
    ['dealer', 'pro_dealer'].includes(role) &&
    sellerWorkspaceAccess
  );

  let publicListingVisibility = 'not_applicable';
  let visibilityReason = 'non_seller_role';
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

  const planCapability = planIdToCapability(activeSubscriptionPlanId);
  const roleCapability = roleToCapability(role);
  const effectiveSellerCapability = adminAccess
    ? 'admin'
    : (subscriptionBackedAccess || adminOverrideAccess)
      ? (planCapability !== 'none' ? planCapability : roleCapability)
      : 'none';

  const sellerAccessMode = adminAccess
    ? 'admin'
    : adminOverrideAccess
      ? 'admin_override'
      : subscriptionBackedAccess
        ? 'subscription'
        : 'none';

  return {
    subscriptionState: subscriptionState || 'none',
    effectiveSellerCapability,
    sellerAccessMode,
    sellerWorkspaceAccess,
    canPostListings,
    dealerOsAccess,
    publicListingVisibility,
    visibilityReason,
    billingLabel: resolveBillingLabel(activeSubscriptionPlanId, role),
    overrideSource: adminOverrideAccess ? 'admin_override' : (adminAccess ? 'admin_role' : null),
    role: role || 'buyer',
    accountStatus,
    accountAccessSource: accountAccessSource || null,
    activeSubscriptionPlanId: activeSubscriptionPlanId || null,
    subscriptionStatus: subscriptionState || null,
    listingCap,
    managedAccountCap,
    currentSubscriptionId,
    currentPeriodEnd,
  };
}

function buildCompactAccountState(rawState = {}) {
  const entitlement = rawState.entitlement || buildAccountEntitlementSnapshot(rawState);

  return {
    role: entitlement.role,
    accountStatus: entitlement.accountStatus,
    accountAccessSource: entitlement.accountAccessSource,
    activeSubscriptionPlanId: entitlement.activeSubscriptionPlanId,
    subscriptionStatus: entitlement.subscriptionStatus,
    listingCap: entitlement.listingCap,
    managedAccountCap: entitlement.managedAccountCap,
    currentSubscriptionId: entitlement.currentSubscriptionId,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    entitlement: {
      subscriptionState: entitlement.subscriptionState,
      effectiveSellerCapability: entitlement.effectiveSellerCapability,
      sellerAccessMode: entitlement.sellerAccessMode,
      sellerWorkspaceAccess: entitlement.sellerWorkspaceAccess,
      canPostListings: entitlement.canPostListings,
      dealerOsAccess: entitlement.dealerOsAccess,
      publicListingVisibility: entitlement.publicListingVisibility,
      visibilityReason: entitlement.visibilityReason,
      billingLabel: entitlement.billingLabel,
      overrideSource: entitlement.overrideSource,
    },
  };
}

module.exports = {
  buildAccountEntitlementSnapshot,
  buildCompactAccountState,
};
