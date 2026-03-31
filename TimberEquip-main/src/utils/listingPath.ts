import { Listing } from '../types';

const DISALLOWED_PUBLIC_TOKENS = new Set([
  'qa',
  'test',
  'testing',
  'demo',
  'probe',
  'sandbox',
  'sample',
  'staging',
]);

export const NOINDEX_ROBOTS = 'noindex, nofollow, noarchive, nosnippet, noimageindex';

type ListingPathRecord = Pick<Listing, 'id' | 'title' | 'year' | 'model' | 'category' | 'subcategory' | 'location'> & {
  make?: string;
  manufacturer?: string;
  brand?: string;
};

function splitPublicTokens(value: string): string[] {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function isPublicQaOrTestRecord(...values: Array<string | number | null | undefined>): boolean {
  return values.some((value) =>
    splitPublicTokens(String(value || '')).some((token) => DISALLOWED_PUBLIC_TOKENS.has(token))
  );
}

export function sanitizePublicSeoLabel(value: string, fallback = ''): string {
  const cleaned = String(value || '')
    .replace(/\b(qa|test|testing|demo|probe|sandbox|sample|staging)\b/gi, ' ')
    .replace(/[_|/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || fallback;
}

function normalizeSeoSlug(value: string, fallback = ''): string {
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

function getLocationSeoParts(value: string): { city: string; state: string } {
  const parts = String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return { city: parts[0], state: parts[parts.length - 2] };
  }

  if (parts.length === 2) {
    return { city: parts[0], state: parts[1] };
  }

  return { city: parts[0] || '', state: '' };
}

function dedupeSlugParts(parts: string[]): string[] {
  const seen = new Set<string>();
  return parts.filter((part) => {
    if (!part || seen.has(part)) return false;
    seen.add(part);
    return true;
  });
}

export function buildListingSeoSlug(listing: ListingPathRecord): string {
  const manufacturer = sanitizePublicSeoLabel(listing?.make || listing?.manufacturer || listing?.brand || '', '');
  const model = sanitizePublicSeoLabel(listing?.model || '', '');
  const machineType = sanitizePublicSeoLabel(listing?.subcategory || listing?.category || '', 'equipment');
  const { city, state } = getLocationSeoParts(listing?.location || '');
  const fallbackTitle = sanitizePublicSeoLabel(listing?.title || '', 'equipment listing');

  const rawParts = [
    listing?.year ? String(listing.year) : '',
    manufacturer,
    model,
    machineType,
    sanitizePublicSeoLabel(city, ''),
    sanitizePublicSeoLabel(state, ''),
  ]
    .map((part) => normalizeSeoSlug(part))
    .filter(Boolean);

  const uniqueParts = dedupeSlugParts(rawParts).slice(0, 10);
  if (uniqueParts.length) {
    return uniqueParts.join('-');
  }

  return normalizeSeoSlug(fallbackTitle, 'equipment-listing');
}

export function encodeListingPublicKey(listingId: string): string {
  const safeId = String(listingId || '').trim();
  if (!safeId) return '';

  const bytes = new TextEncoder().encode(safeId);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeListingPublicKey(publicKey: string): string {
  const normalizedKey = String(publicKey || '').trim();
  if (!normalizedKey) return '';

  try {
    const padded = normalizedKey
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(normalizedKey.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes).trim();
  } catch {
    return '';
  }
}

export function buildListingPath(listing: ListingPathRecord): string {
  const publicKey = encodeListingPublicKey(String(listing?.id || '').trim());
  const safeSlug = buildListingSeoSlug(listing);

  if (!publicKey) {
    return `/equipment/${safeSlug}`;
  }

  return `/equipment/${safeSlug}/${publicKey}`;
}
