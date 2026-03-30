import { describe, it, expect } from 'vitest';
import {
  normalizeSellerPlanId,
  getSellerPlanMarketingLabel,
  getSellerPlanPurchaseLabel,
  getSellerPlanChangeDirection,
} from '../utils/sellerPlans';

describe('normalizeSellerPlanId', () => {
  it('returns individual_seller for valid input', () => {
    expect(normalizeSellerPlanId('individual_seller')).toBe('individual_seller');
  });

  it('returns dealer for valid input', () => {
    expect(normalizeSellerPlanId('dealer')).toBe('dealer');
  });

  it('returns fleet_dealer for valid input', () => {
    expect(normalizeSellerPlanId('fleet_dealer')).toBe('fleet_dealer');
  });

  it('returns null for invalid input', () => {
    expect(normalizeSellerPlanId('pro_dealer')).toBeNull();
    expect(normalizeSellerPlanId('garbage')).toBeNull();
    expect(normalizeSellerPlanId('')).toBeNull();
    expect(normalizeSellerPlanId(null)).toBeNull();
    expect(normalizeSellerPlanId(undefined)).toBeNull();
  });

  it('normalizes case and whitespace', () => {
    expect(normalizeSellerPlanId('  DEALER  ')).toBe('dealer');
    expect(normalizeSellerPlanId('Fleet_Dealer')).toBe('fleet_dealer');
  });
});

describe('getSellerPlanMarketingLabel', () => {
  it('returns Owner-Operator for individual_seller', () => {
    expect(getSellerPlanMarketingLabel('individual_seller')).toBe('Owner-Operator');
  });

  it('returns Dealer for dealer', () => {
    expect(getSellerPlanMarketingLabel('dealer')).toBe('Dealer');
  });

  it('returns Pro Dealer for fleet_dealer', () => {
    expect(getSellerPlanMarketingLabel('fleet_dealer')).toBe('Pro Dealer');
  });

  it('returns fallback for invalid', () => {
    expect(getSellerPlanMarketingLabel('unknown')).toBe('No active seller plan');
    expect(getSellerPlanMarketingLabel(null)).toBe('No active seller plan');
  });
});

describe('getSellerPlanPurchaseLabel', () => {
  it('returns correct labels', () => {
    expect(getSellerPlanPurchaseLabel('individual_seller')).toBe('Owner-Operator Ad Program');
    expect(getSellerPlanPurchaseLabel('dealer')).toBe('Dealer');
    expect(getSellerPlanPurchaseLabel('fleet_dealer')).toBe('Pro Dealer');
    expect(getSellerPlanPurchaseLabel(null)).toBe('Choose a Plan');
  });
});

describe('getSellerPlanChangeDirection', () => {
  it('detects upgrade from individual_seller to dealer', () => {
    expect(getSellerPlanChangeDirection('individual_seller', 'dealer')).toBe('upgrade');
  });

  it('detects upgrade from dealer to fleet_dealer', () => {
    expect(getSellerPlanChangeDirection('dealer', 'fleet_dealer')).toBe('upgrade');
  });

  it('detects downgrade from fleet_dealer to dealer', () => {
    expect(getSellerPlanChangeDirection('fleet_dealer', 'dealer')).toBe('downgrade');
  });

  it('detects same plan', () => {
    expect(getSellerPlanChangeDirection('dealer', 'dealer')).toBe('same');
  });

  it('returns new when current is null', () => {
    expect(getSellerPlanChangeDirection(null, 'dealer')).toBe('new');
  });

  it('returns new when next is invalid', () => {
    expect(getSellerPlanChangeDirection('dealer', null)).toBe('new');
  });
});
