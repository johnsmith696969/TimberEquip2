import { describe, it, expect, vi } from 'vitest';
import { UNLIMITED_LISTING_CAP } from '../utils/listingCaps';

// Mock Firebase before importing billingService (it transitively imports firebase.ts)
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null, onAuthStateChanged: vi.fn(() => vi.fn()) },
  storage: {},
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

import { SELLER_PLAN_DEFINITIONS, isSubscriptionTrulyActive, type ListingPlanId, type Subscription } from '../services/billingService';

describe('SELLER_PLAN_DEFINITIONS', () => {
  it('contains exactly 3 plans', () => {
    expect(SELLER_PLAN_DEFINITIONS).toHaveLength(3);
  });

  it('has individual_seller, dealer, and fleet_dealer plan IDs', () => {
    const ids = SELLER_PLAN_DEFINITIONS.map((p) => p.id);
    expect(ids).toContain('individual_seller');
    expect(ids).toContain('dealer');
    expect(ids).toContain('fleet_dealer');
  });

  it('all plans have required fields', () => {
    SELLER_PLAN_DEFINITIONS.forEach((plan) => {
      expect(plan.id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(plan.price).toBeGreaterThan(0);
      expect(plan.period).toBe('month');
      expect(plan.summary).toBeTruthy();
      expect(plan.listingCap).toBeGreaterThan(0);
    });
  });

  it('individual_seller has lowest listing cap', () => {
    const individual = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'individual_seller')!;
    const dealer = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'dealer')!;
    const fleet = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'fleet_dealer')!;
    expect(individual.listingCap).toBeLessThan(dealer.listingCap);
    expect(dealer.listingCap).toBeLessThan(fleet.listingCap);
  });

  it('prices increase with plan tier', () => {
    const individual = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'individual_seller')!;
    const dealer = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'dealer')!;
    const fleet = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'fleet_dealer')!;
    expect(individual.price).toBeLessThan(dealer.price);
    expect(dealer.price).toBeLessThan(fleet.price);
  });

  it('dealer and fleet_dealer have managedAccountCap', () => {
    const dealer = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'dealer')!;
    const fleet = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'fleet_dealer')!;
    expect(dealer.managedAccountCap).toBeGreaterThan(0);
    expect(fleet.managedAccountCap).toBeGreaterThan(0);
  });

  it('individual_seller has no managedAccountCap', () => {
    const individual = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'individual_seller')!;
    expect(individual.managedAccountCap).toBeUndefined();
  });

  it('individual_seller has 1 listing cap', () => {
    const individual = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'individual_seller')!;
    expect(individual.listingCap).toBe(1);
  });

  it('dealer has 50 listing cap', () => {
    const dealer = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'dealer')!;
    expect(dealer.listingCap).toBe(50);
  });

  it('fleet_dealer uses the unlimited listing cap sentinel', () => {
    const fleet = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'fleet_dealer')!;
    expect(fleet.listingCap).toBe(UNLIMITED_LISTING_CAP);
  });

  it('dealer and fleet_dealer expose the new launch trials', () => {
    const dealer = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'dealer')!;
    const fleet = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'fleet_dealer')!;
    expect(dealer.trialMonths).toBe(6);
    expect(fleet.trialMonths).toBe(3);
  });

  it('uses the updated dealer pricing', () => {
    const dealer = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'dealer')!;
    const fleet = SELLER_PLAN_DEFINITIONS.find((p) => p.id === 'fleet_dealer')!;
    expect(dealer.price).toBe(250);
    expect(fleet.price).toBe(500);
  });
});

describe('ListingPlanId type', () => {
  it('plan IDs match the ListingPlanId union type', () => {
    const validIds: ListingPlanId[] = ['individual_seller', 'dealer', 'fleet_dealer'];
    SELLER_PLAN_DEFINITIONS.forEach((plan) => {
      expect(validIds).toContain(plan.id);
    });
  });
});

// ── isSubscriptionTrulyActive tests ─────────────────────────────────────────

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub_1',
    userUid: 'user_1',
    planId: 'dealer',
    status: 'active',
    stripeSubscriptionId: 'sub_stripe_1',
    currentPeriodEnd: Date.now() + 86_400_000, // 1 day in the future
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

describe('isSubscriptionTrulyActive', () => {
  it('returns true for active subscription with future period end (ms number)', () => {
    const sub = makeSub({ currentPeriodEnd: Date.now() + 86_400_000 });
    expect(isSubscriptionTrulyActive(sub)).toBe(true);
  });

  it('returns true for active subscription with future period end (seconds number)', () => {
    const futureSeconds = Math.floor(Date.now() / 1000) + 86_400;
    const sub = makeSub({ currentPeriodEnd: futureSeconds });
    expect(isSubscriptionTrulyActive(sub)).toBe(true);
  });

  it('returns true for active subscription with Firestore Timestamp object (toMillis)', () => {
    const futureMs = Date.now() + 86_400_000;
    const sub = makeSub({ currentPeriodEnd: { toMillis: () => futureMs } });
    expect(isSubscriptionTrulyActive(sub)).toBe(true);
  });

  it('returns true for active subscription with seconds-based object', () => {
    const futureSeconds = Math.floor(Date.now() / 1000) + 86_400;
    const sub = makeSub({ currentPeriodEnd: { seconds: futureSeconds } });
    expect(isSubscriptionTrulyActive(sub)).toBe(true);
  });

  it('returns true for active subscription with future ISO string', () => {
    const futureDate = new Date(Date.now() + 86_400_000).toISOString();
    const sub = makeSub({ currentPeriodEnd: futureDate });
    expect(isSubscriptionTrulyActive(sub)).toBe(true);
  });

  it('returns false when status is canceled', () => {
    const sub = makeSub({ status: 'canceled' });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false when status is past_due', () => {
    const sub = makeSub({ status: 'past_due' });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false when status is trialing', () => {
    const sub = makeSub({ status: 'trialing' });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false when currentPeriodEnd is in the past (ms number)', () => {
    const sub = makeSub({ currentPeriodEnd: Date.now() - 86_400_000 });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false when currentPeriodEnd is in the past (seconds number)', () => {
    const pastSeconds = Math.floor(Date.now() / 1000) - 86_400;
    const sub = makeSub({ currentPeriodEnd: pastSeconds });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false when currentPeriodEnd is missing', () => {
    const sub = makeSub({ currentPeriodEnd: null });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false when currentPeriodEnd is undefined', () => {
    const sub = makeSub({ currentPeriodEnd: undefined });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false for past Firestore Timestamp object', () => {
    const pastMs = Date.now() - 86_400_000;
    const sub = makeSub({ currentPeriodEnd: { toMillis: () => pastMs } });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false for past seconds-based object', () => {
    const pastSeconds = Math.floor(Date.now() / 1000) - 86_400;
    const sub = makeSub({ currentPeriodEnd: { seconds: pastSeconds } });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });

  it('returns false for past ISO string', () => {
    const pastDate = new Date(Date.now() - 86_400_000).toISOString();
    const sub = makeSub({ currentPeriodEnd: pastDate });
    expect(isSubscriptionTrulyActive(sub)).toBe(false);
  });
});
