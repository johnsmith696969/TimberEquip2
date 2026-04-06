import { Listing, Seller } from '../types';
import { REGION_ABBREVIATIONS } from '../constants/storefrontRegions';
import { isDealerSellerRole } from './roleScopes';

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

/** Map of known aliases → canonical manufacturer name (uppercase keys). */
const MANUFACTURER_ALIASES: Record<string, string> = {
  CAT: 'CATERPILLAR',
  'BLOUNT CAT': 'CATERPILLAR',
  LOGMAX: 'LOG MAX',
  'CLARK RANGER': 'CLARK',
  'INTERNATIONAL HARVESTER': 'INTERNATIONAL',
  WOODPAKER: 'WOOD-PAKER',
  PETERSON: 'PETERSON PACIFIC',
  'TOWMASTERS': 'TOWERMASTER',
  'OLOFSFORS ECO-TRACKS': 'OLOFSORS ECO-TRACKS',
  'PEWAG ECO-TRACKS': 'OLOFSORS ECO-TRACKS',
};

const ROMAN_NUMERAL_PATTERN = /^(?:M|CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/;

function normalizeManufacturerWhitespace(value: string): string {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function formatManufacturerDisplayName(value: string): string {
  return normalizeManufacturerWhitespace(value)
    .split(/(\s+|[-/]+)/)
    .map((segment) => {
      if (!segment || /^(\s+|[-/]+)$/.test(segment)) {
        return segment;
      }

      if (/\d/.test(segment) || segment.length <= 3 || ROMAN_NUMERAL_PATTERN.test(segment)) {
        return segment.toUpperCase();
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Resolve a raw manufacturer string to its canonical form.
 * Merges known aliases (e.g. "CAT" → "CATERPILLAR").
 */
export function canonicalizeManufacturer(raw: string): string {
  const trimmed = normalizeManufacturerWhitespace(raw);
  if (!trimmed) return trimmed;
  const upper = trimmed.toUpperCase();
  return MANUFACTURER_ALIASES[upper] || upper;
}

export function getListingManufacturer(listing: Listing): string {
  const raw = normalizeManufacturerWhitespace(listing.make || listing.manufacturer || listing.brand || '');
  return formatManufacturerDisplayName(canonicalizeManufacturer(raw));
}

export function getListingCategoryLabel(listing: Listing): string {
  return String(listing.subcategory || listing.category || '').trim();
}

export function getCityFromLocation(location?: string): string {
  const parts = String(location || '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  return parts.length >= 2 ? parts[0] : '';
}

export function getStateFromLocation(location?: string): string {
  const parts = String(location || '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return parts[parts.length - 2];
  }

  if (parts.length === 2) {
    return parts[1];
  }

  return parts[0] || '';
}

export function getListingStateName(listing: Pick<Listing, 'location' | 'state' | 'city'>): string {
  const explicitState = String(listing.state || '').trim();
  const locationParts = String(listing.location || '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const cityCandidate = String(listing.city || '').trim() || (locationParts.length >= 2 ? locationParts[0] : '');

  if (explicitState) {
    const expandedExplicitState = REGION_ABBREVIATIONS[explicitState.toUpperCase()] || explicitState;
    if (!cityCandidate || expandedExplicitState.toLowerCase() !== cityCandidate.toLowerCase()) {
      return expandedExplicitState;
    }
  }

  const parsedState = getStateFromLocation(listing.location);
  if (!parsedState) {
    return '';
  }

  if (cityCandidate && parsedState.toLowerCase() === cityCandidate.toLowerCase()) {
    return '';
  }

  return REGION_ABBREVIATIONS[parsedState.toUpperCase()] || parsedState;
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
  return isDealerSellerRole(role);
}
