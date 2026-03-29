import { Listing, Seller } from '../types';

export const MARKET_ROUTE_LABELS = {
  logging: 'logging-equipment-for-sale',
  forestry: 'forestry-equipment-for-sale',
} as const;

export type MarketRouteKey = keyof typeof MARKET_ROUTE_LABELS;
export const CANONICAL_MARKET_ROUTE_KEY: MarketRouteKey = 'forestry';

export function normalizeSeoSlug(value: string, fallback = ''): string {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

export function titleCaseSlug(slug: string): string {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function getListingManufacturer(listing: Listing): string {
  return String(listing.make || listing.manufacturer || listing.brand || '').trim();
}

export function getListingCategoryLabel(listing: Listing): string {
  return String(listing.subcategory || listing.category || '').trim();
}

export function getStateFromLocation(location?: string): string {
  const parts = String(location || '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts[parts.length - 2];
  }

  return parts[0] || '';
}

export function buildCategoryPath(category: string): string {
  return `/categories/${normalizeSeoSlug(category, 'equipment')}`;
}

export function buildManufacturerPath(manufacturer: string): string {
  return `/manufacturers/${normalizeSeoSlug(manufacturer, 'brand')}`;
}

export function buildManufacturerModelPath(manufacturer: string, model: string): string {
  return `/manufacturers/${normalizeSeoSlug(manufacturer, 'brand')}/models/${normalizeSeoSlug(model, 'model')}`;
}

export function buildManufacturerModelCategoryPath(manufacturer: string, model: string, category: string): string {
  return `${buildManufacturerModelPath(manufacturer, model)}/${normalizeSeoSlug(category, 'equipment')}-for-sale`;
}

export function buildStateMarketPath(state: string, market: MarketRouteKey): string {
  return `/states/${normalizeSeoSlug(state, 'region')}/${MARKET_ROUTE_LABELS[market]}`;
}

export function buildStateCategoryPath(state: string, category: string): string {
  return `/states/${normalizeSeoSlug(state, 'region')}/${normalizeSeoSlug(category, 'equipment')}-for-sale`;
}

export function buildManufacturerCategoryPath(manufacturer: string, category: string): string {
  return `/manufacturers/${normalizeSeoSlug(manufacturer, 'brand')}/${normalizeSeoSlug(category, 'equipment')}-for-sale`;
}

export function buildDealerPath(seller: Pick<Seller, 'id' | 'storefrontSlug'>): string {
  return `/dealers/${seller.storefrontSlug || seller.id}`;
}

export function isDealerRole(role?: string): boolean {
  return ['dealer', 'dealer_manager', 'dealer_staff', 'admin', 'super_admin', 'developer'].includes(String(role || '').toLowerCase());
}
