import type { Listing } from '../../types';
import {
  AMV_MATCH_HOURS_PERCENT,
  AMV_MATCH_PRICE_PERCENT,
  AMV_MATCH_YEAR_RANGE,
  isWithinPercentRange,
} from '../../utils/amvMatching';
import { normalize } from './listingHelpers';
import type { MarketComparableSpecs, ResolvedMarketComparableSpecs } from './types';

export function resolveMarketComparableSpecs(specs: MarketComparableSpecs): ResolvedMarketComparableSpecs | null {
  const manufacturer = normalize(specs.make || specs.manufacturer);
  const model = normalize(specs.model);
  const price = Number(specs.price);
  const year = Number(specs.year);
  const hours = Number(specs.hours);

  if (
    !manufacturer ||
    !model ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(year) ||
    !Number.isFinite(hours)
  ) {
    return null;
  }

  return {
    listingId: specs.listingId,
    category: normalize(specs.category),
    manufacturer,
    model,
    price,
    year,
    hours,
  };
}

export function isMarketComparableListing(listing: Listing, specs: ResolvedMarketComparableSpecs): boolean {
  if (specs.listingId && listing.id === specs.listingId) return false;

  const listingManufacturer = normalize(listing.make || listing.manufacturer || listing.brand);
  const listingModel = normalize(listing.model);
  if (listingManufacturer !== specs.manufacturer) return false;
  if (listingModel !== specs.model) return false;

  if (specs.category && normalize(listing.category) !== specs.category) return false;

  if (!Number.isFinite(listing.price) || listing.price <= 0) return false;
  if (!Number.isFinite(listing.year) || Math.abs(listing.year - specs.year) > AMV_MATCH_YEAR_RANGE) return false;
  if (!Number.isFinite(listing.hours) || !isWithinPercentRange(listing.hours, specs.hours, AMV_MATCH_HOURS_PERCENT)) return false;
  if (!isWithinPercentRange(listing.price, specs.price, AMV_MATCH_PRICE_PERCENT)) return false;

  return true;
}

export function scoreMarketComparableListing(listing: Listing, specs: ResolvedMarketComparableSpecs): number {
  const yearDelta = Math.abs(listing.year - specs.year);
  const hoursDeltaPercent = Math.abs(((listing.hours - specs.hours) / Math.max(specs.hours, 1)) * 100);
  const priceDeltaPercent = Math.abs(((listing.price - specs.price) / Math.max(specs.price, 1)) * 100);

  return yearDelta * 100 + hoursDeltaPercent * 10 + priceDeltaPercent * 10;
}
