import { describe, expect, it } from 'vitest';
import {
  buildAuctionRegistrationLoginPath,
  buildAuctionRegistrationPath,
  resolveAuctionTermsHref,
} from '../utils/auctionLinks';

describe('auctionLinks', () => {
  it('falls back to the always-open bidder registration route when no auction slug exists', () => {
    expect(buildAuctionRegistrationPath(undefined)).toBe('/bidder-registration');
    expect(buildAuctionRegistrationPath('', '/auctions')).toBe('/bidder-registration?returnTo=%2Fauctions');
  });

  it('builds auction-scoped registration paths when a slug exists', () => {
    expect(buildAuctionRegistrationPath('spring-sale')).toBe('/auctions/spring-sale/register');
    expect(buildAuctionRegistrationLoginPath('spring-sale', '/auctions/spring-sale')).toBe('/login?redirect=%2Fauctions%2Fspring-sale%2Fregister%3FreturnTo%3D%252Fauctions%252Fspring-sale');
  });

  it('keeps auction terms anchored to the auction terms section when no explicit url exists', () => {
    expect(resolveAuctionTermsHref('')).toBe('/terms#auction-marketplace-bidding-terms');
  });
});
