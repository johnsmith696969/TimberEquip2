import { describe, expect, it } from 'vitest';
import {
  isDealerSellerRole,
  isOperatorOnlyRole,
  isSellerRole,
  normalizeScopedUserRole,
  supportsDealerOsRole,
  supportsStorefrontRole,
} from '../utils/roleScopes';

describe('role scope taxonomy', () => {
  it('classifies privileged roles as operator-only', () => {
    expect(isOperatorOnlyRole('super_admin')).toBe(true);
    expect(isOperatorOnlyRole('admin')).toBe(true);
    expect(isOperatorOnlyRole('developer')).toBe(true);
    expect(isOperatorOnlyRole('content_manager')).toBe(true);
    expect(isOperatorOnlyRole('editor')).toBe(true);
  });

  it('does not classify seller roles as operators', () => {
    expect(isOperatorOnlyRole('dealer')).toBe(false);
    expect(isOperatorOnlyRole('pro_dealer')).toBe(false);
    expect(isOperatorOnlyRole('individual_seller')).toBe(false);
    expect(isOperatorOnlyRole('member')).toBe(false);
  });

  it('normalizes legacy dealer aliases into seller roles', () => {
    expect(normalizeScopedUserRole('dealer_staff')).toBe('dealer');
    expect(normalizeScopedUserRole('dealer_manager')).toBe('pro_dealer');
    expect(normalizeScopedUserRole('buyer')).toBe('member');
  });

  it('keeps storefront and DealerOS access seller-only', () => {
    expect(isSellerRole('dealer')).toBe(true);
    expect(isSellerRole('pro_dealer')).toBe(true);
    expect(isSellerRole('individual_seller')).toBe(true);
    expect(isSellerRole('admin')).toBe(false);

    expect(isDealerSellerRole('dealer')).toBe(true);
    expect(isDealerSellerRole('pro_dealer')).toBe(true);
    expect(isDealerSellerRole('individual_seller')).toBe(false);
    expect(isDealerSellerRole('admin')).toBe(false);

    expect(supportsStorefrontRole('dealer')).toBe(true);
    expect(supportsStorefrontRole('individual_seller')).toBe(true);
    expect(supportsStorefrontRole('super_admin')).toBe(false);

    expect(supportsDealerOsRole('dealer')).toBe(true);
    expect(supportsDealerOsRole('pro_dealer')).toBe(true);
    expect(supportsDealerOsRole('individual_seller')).toBe(false);
    expect(supportsDealerOsRole('admin')).toBe(false);
  });
});
