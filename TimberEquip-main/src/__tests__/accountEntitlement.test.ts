import { describe, it, expect } from 'vitest';
import { resolveAccountEntitlement } from '../utils/accountEntitlement';

describe('resolveAccountEntitlement', () => {
  it('returns operator-only access for super_admin role', () => {
    const result = resolveAccountEntitlement({ role: 'super_admin' });
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.adminWorkspaceAccess).toBe(true);
    expect(result.sellerAccessMode).toBe('none');
    expect(result.canPostListings).toBe(false);
    expect(result.dealerOsAccess).toBe(false);
    expect(result.effectiveSellerCapability).toBe('none');
    expect(result.publicListingVisibility).toBe('not_applicable');
  });

  it('returns operator-only access for admin role', () => {
    const result = resolveAccountEntitlement({ role: 'admin' });
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.adminWorkspaceAccess).toBe(true);
    expect(result.sellerAccessMode).toBe('none');
    expect(result.dealerOsAccess).toBe(false);
  });

  it('returns operator-only access for developer role', () => {
    const result = resolveAccountEntitlement({ role: 'developer' });
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.adminWorkspaceAccess).toBe(true);
    expect(result.sellerAccessMode).toBe('none');
  });

  it('returns subscription-backed access for active individual_seller', () => {
    const result = resolveAccountEntitlement({
      role: 'individual_seller',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'individual_seller',
      subscriptionStatus: 'active',
    });
    expect(result.sellerWorkspaceAccess).toBe(true);
    expect(result.adminWorkspaceAccess).toBe(false);
    expect(result.sellerAccessMode).toBe('subscription');
    expect(result.canPostListings).toBe(true);
    expect(result.publicListingVisibility).toBe('publicly_eligible');
    expect(result.effectiveSellerCapability).toBe('owner_operator');
    expect(result.billingLabel).toBe('Forestry Equipment Sales');
  });

  it('returns subscription-backed access for active dealer', () => {
    const result = resolveAccountEntitlement({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'active',
    });
    expect(result.sellerWorkspaceAccess).toBe(true);
    expect(result.adminWorkspaceAccess).toBe(false);
    expect(result.dealerOsAccess).toBe(true);
    expect(result.effectiveSellerCapability).toBe('dealer');
    expect(result.billingLabel).toBe('Forestry Equipment Sales DealerOS');
  });

  it('returns subscription-backed access for active fleet_dealer', () => {
    const result = resolveAccountEntitlement({
      role: 'pro_dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'fleet_dealer',
      subscriptionStatus: 'active',
    });
    expect(result.sellerWorkspaceAccess).toBe(true);
    expect(result.adminWorkspaceAccess).toBe(false);
    expect(result.dealerOsAccess).toBe(true);
    expect(result.effectiveSellerCapability).toBe('pro_dealer');
    expect(result.billingLabel).toBe('Forestry Equipment Sales DealerOS');
  });

  it('returns hidden_due_to_billing when subscription is past_due', () => {
    const result = resolveAccountEntitlement({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'past_due',
    });
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.publicListingVisibility).toBe('hidden_due_to_billing');
    expect(result.visibilityReason).toBe('inactive_subscription');
  });

  it('returns admin_override access for seller with admin_override source', () => {
    const result = resolveAccountEntitlement({
      role: 'individual_seller',
      accountStatus: 'active',
      accountAccessSource: 'admin_override',
    });
    expect(result.sellerWorkspaceAccess).toBe(true);
    expect(result.sellerAccessMode).toBe('admin_override');
    expect(result.overrideSource).toBe('admin_override');
    expect(result.publicListingVisibility).toBe('admin_override');
  });

  it('returns no seller access for member role', () => {
    const result = resolveAccountEntitlement({ role: 'member' });
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.adminWorkspaceAccess).toBe(false);
    expect(result.canPostListings).toBe(false);
  });

  it('returns dealerOsAccess false for individual_seller with active subscription', () => {
    const result = resolveAccountEntitlement({
      role: 'individual_seller',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'individual_seller',
      subscriptionStatus: 'active',
    });
    expect(result.dealerOsAccess).toBe(false);
  });

  it('normalizes dealer_staff to dealer', () => {
    const result = resolveAccountEntitlement({
      role: 'dealer_staff' as any,
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'active',
    });
    expect(result.sellerWorkspaceAccess).toBe(true);
    expect(result.dealerOsAccess).toBe(true);
  });

  it('handles null user', () => {
    const result = resolveAccountEntitlement(null);
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.adminWorkspaceAccess).toBe(false);
    expect(result.canPostListings).toBe(false);
    expect(result.subscriptionState).toBe('none');
    expect(result.billingLabel).toBe('n/a');
  });

  it('handles undefined user', () => {
    const result = resolveAccountEntitlement(undefined);
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.canPostListings).toBe(false);
  });

  it('handles suspended account', () => {
    const result = resolveAccountEntitlement({
      role: 'dealer',
      accountStatus: 'suspended',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'active',
    });
    expect(result.sellerWorkspaceAccess).toBe(false);
    expect(result.publicListingVisibility).toBe('hidden_due_to_billing');
    expect(result.visibilityReason).toBe('suspended_account');
  });
});
