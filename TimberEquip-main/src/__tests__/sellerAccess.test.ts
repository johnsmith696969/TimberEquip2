import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasAdminPublishingAccess,
  hasManagedSellerAccess,
  hasActiveSellerSubscription,
  hasSellerWorkspaceAccess,
  canUserPostListings,
  canAccessDealerOs,
  getFeaturedListingCap,
  getManagedListingCap,
  getListEquipmentPath,
  buildNavigationTargetWithReturn,
  appendReturnToParam,
  rememberSellerReturnTo,
  getRememberedSellerReturnTo,
  clearRememberedSellerReturnTo,
} from '../utils/sellerAccess';
import type { UserProfile } from '../types';

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'test-uid',
    email: 'test@example.com',
    role: 'buyer',
    displayName: 'Test User',
    ...overrides,
  } as UserProfile;
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('hasAdminPublishingAccess', () => {
  it('returns true for super_admin', () => {
    expect(hasAdminPublishingAccess(makeUser({ role: 'super_admin' }))).toBe(true);
  });

  it('returns true for admin', () => {
    expect(hasAdminPublishingAccess(makeUser({ role: 'admin' }))).toBe(true);
  });

  it('returns true for developer', () => {
    expect(hasAdminPublishingAccess(makeUser({ role: 'developer' }))).toBe(true);
  });

  it('returns false for dealer', () => {
    expect(hasAdminPublishingAccess(makeUser({ role: 'dealer' }))).toBe(false);
  });

  it('returns false for buyer', () => {
    expect(hasAdminPublishingAccess(makeUser({ role: 'buyer' }))).toBe(false);
  });

  it('returns false for null', () => {
    expect(hasAdminPublishingAccess(null)).toBe(false);
  });
});

describe('hasManagedSellerAccess', () => {
  it('returns true for admin_override seller', () => {
    expect(hasManagedSellerAccess(makeUser({
      role: 'individual_seller',
      accountStatus: 'active',
      accountAccessSource: 'admin_override',
    }))).toBe(true);
  });

  it('returns false for subscription seller', () => {
    expect(hasManagedSellerAccess(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
    }))).toBe(false);
  });

  it('returns false for null', () => {
    expect(hasManagedSellerAccess(null)).toBe(false);
  });
});

describe('hasActiveSellerSubscription', () => {
  it('returns true for active subscription seller', () => {
    expect(hasActiveSellerSubscription(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'active',
    }))).toBe(true);
  });

  it('returns false for past_due subscription', () => {
    expect(hasActiveSellerSubscription(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'past_due',
    }))).toBe(false);
  });

  it('returns false for no plan', () => {
    expect(hasActiveSellerSubscription(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
    }))).toBe(false);
  });

  it('returns false for null', () => {
    expect(hasActiveSellerSubscription(null)).toBe(false);
  });
});

describe('hasSellerWorkspaceAccess', () => {
  it('returns true for admin', () => {
    expect(hasSellerWorkspaceAccess(makeUser({ role: 'super_admin' }))).toBe(true);
  });

  it('returns true for active role-backed dealer access when entitlement is lagging', () => {
    expect(hasSellerWorkspaceAccess(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: null,
      entitlement: {
        subscriptionState: 'none',
        effectiveSellerCapability: 'none',
        sellerAccessMode: 'none',
        sellerWorkspaceAccess: false,
        canPostListings: false,
        dealerOsAccess: false,
        publicListingVisibility: 'hidden_due_to_billing',
        visibilityReason: 'inactive_subscription',
        billingLabel: 'n/a',
        overrideSource: null,
      },
    }))).toBe(true);
  });

  it('returns true for active subscription seller', () => {
    expect(hasSellerWorkspaceAccess(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'active',
    }))).toBe(true);
  });

  it('returns false for plain buyer', () => {
    expect(hasSellerWorkspaceAccess(makeUser({ role: 'buyer' }))).toBe(false);
  });
});

describe('canUserPostListings', () => {
  it('delegates to hasSellerWorkspaceAccess', () => {
    expect(canUserPostListings(makeUser({ role: 'super_admin' }))).toBe(true);
    expect(canUserPostListings(makeUser({ role: 'buyer' }))).toBe(false);
  });
});

describe('canAccessDealerOs', () => {
  it('returns true for admin', () => {
    expect(canAccessDealerOs(makeUser({ role: 'admin' }))).toBe(true);
  });

  it('returns false for dealer with active status but no subscription', () => {
    expect(canAccessDealerOs(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: null,
      entitlement: {
        subscriptionState: 'none',
        effectiveSellerCapability: 'none',
        sellerAccessMode: 'none',
        sellerWorkspaceAccess: false,
        canPostListings: false,
        dealerOsAccess: false,
        publicListingVisibility: 'hidden_due_to_billing',
        visibilityReason: 'inactive_subscription',
        billingLabel: 'n/a',
        overrideSource: null,
      },
    }))).toBe(false);
  });

  it('returns true for dealer with admin_override access', () => {
    expect(canAccessDealerOs(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'admin_override',
    }))).toBe(true);
  });

  it('returns true for dealer with subscription', () => {
    expect(canAccessDealerOs(makeUser({
      role: 'dealer',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'dealer',
      subscriptionStatus: 'active',
    }))).toBe(true);
  });

  it('returns false for individual_seller', () => {
    expect(canAccessDealerOs(makeUser({
      role: 'individual_seller',
      accountStatus: 'active',
      accountAccessSource: 'subscription',
      activeSubscriptionPlanId: 'individual_seller',
      subscriptionStatus: 'active',
    }))).toBe(false);
  });

  it('returns false for null', () => {
    expect(canAccessDealerOs(null)).toBe(false);
  });
});

describe('getFeaturedListingCap', () => {
  it('returns 3 for dealer', () => {
    expect(getFeaturedListingCap(makeUser({ role: 'dealer' }))).toBe(3);
  });

  it('returns 6 for pro_dealer', () => {
    expect(getFeaturedListingCap(makeUser({ role: 'pro_dealer' }))).toBe(6);
  });

  it('returns 1 for individual_seller', () => {
    expect(getFeaturedListingCap(makeUser({ role: 'individual_seller' }))).toBe(1);
  });

  it('returns 0 for buyer', () => {
    expect(getFeaturedListingCap(makeUser({ role: 'buyer' }))).toBe(0);
  });
});

describe('getManagedListingCap', () => {
  it('returns explicit listing cap when available', () => {
    expect(getManagedListingCap(makeUser({ role: 'dealer', listingCap: 42 }))).toBe(42);
  });

  it('returns dealer fallback cap', () => {
    expect(getManagedListingCap(makeUser({ role: 'dealer', listingCap: 0 }))).toBe(50);
  });

  it('returns pro dealer fallback cap', () => {
    expect(getManagedListingCap(makeUser({ role: 'pro_dealer', listingCap: 0 }))).toBe(150);
  });

  it('returns null for admin unlimited access', () => {
    expect(getManagedListingCap(makeUser({ role: 'super_admin' }))).toBeNull();
  });
});

describe('getListEquipmentPath', () => {
  it('returns /sell for unauthenticated user', () => {
    expect(getListEquipmentPath(null, false)).toBe('/sell');
  });

  it('returns /ad-programs for user without posting access', () => {
    expect(getListEquipmentPath(makeUser({ role: 'buyer' }), true)).toBe('/ad-programs?intent=list-equipment');
  });

  it('returns /sell for user with posting access', () => {
    expect(getListEquipmentPath(makeUser({ role: 'super_admin' }), true)).toBe('/sell');
  });
});

describe('buildNavigationTargetWithReturn', () => {
  it('preserves pathname, appends returnTo search, and includes return state', () => {
    expect(buildNavigationTargetWithReturn('/ad-programs?intent=list-equipment', '/search?q=skidder')).toEqual({
      pathname: '/ad-programs',
      search: '?intent=list-equipment&returnTo=%2Fsearch%3Fq%3Dskidder',
      state: { returnTo: '/search?q=skidder' },
    });
  });

  it('omits return state when not provided', () => {
    expect(buildNavigationTargetWithReturn('/sell')).toEqual({
      pathname: '/sell',
      search: '',
      state: undefined,
    });
  });
});

describe('appendReturnToParam', () => {
  it('adds the returnTo query param to a plain path', () => {
    expect(appendReturnToParam('/sell', '/blog')).toBe('/sell?returnTo=%2Fblog');
  });

  it('preserves existing query params when appending returnTo', () => {
    expect(appendReturnToParam('/sell?plan=dealer', '/search?q=loader')).toBe('/sell?plan=dealer&returnTo=%2Fsearch%3Fq%3Dloader');
  });

  it('leaves the path unchanged when returnTo is invalid', () => {
    expect(appendReturnToParam('/sell', 'https://example.com')).toBe('/sell');
  });
});

describe('remembered seller return targets', () => {
  it('stores and reads a rooted return path', () => {
    rememberSellerReturnTo('/blog');
    expect(getRememberedSellerReturnTo()).toBe('/blog');
  });

  it('clears the remembered return path', () => {
    rememberSellerReturnTo('/search?q=skidder');
    clearRememberedSellerReturnTo();
    expect(getRememberedSellerReturnTo()).toBe('');
  });

  it('ignores invalid return paths', () => {
    rememberSellerReturnTo('https://example.com');
    expect(getRememberedSellerReturnTo()).toBe('');
  });
});
