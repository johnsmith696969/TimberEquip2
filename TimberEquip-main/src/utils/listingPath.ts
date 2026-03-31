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

const REGION_ABBREVIATIONS: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  alberta: 'AB',
  'british columbia': 'BC',
  manitoba: 'MB',
  'new brunswick': 'NB',
  'newfoundland and labrador': 'NL',
  'northwest territories': 'NT',
  'nova scotia': 'NS',
  nunavut: 'NU',
  ontario: 'ON',
  'prince edward island': 'PE',
  quebec: 'QC',
  saskatchewan: 'SK',
  yukon: 'YT',
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

function abbreviateRegionForSeo(value: string): string {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';

  if (/^[a-z]{2}$/i.test(normalizedValue)) {
    return normalizedValue.toUpperCase();
  }

  return REGION_ABBREVIATIONS[normalizedValue.toLowerCase()] || normalizedValue;
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
  const { city, state } = getLocationSeoParts(listing?.location || '');
  const regionAbbreviation = abbreviateRegionForSeo(state);
  const fallbackTitle = sanitizePublicSeoLabel(listing?.title || '', 'equipment listing');

  const rawParts = [
    listing?.year ? String(listing.year) : '',
    manufacturer,
    model,
    sanitizePublicSeoLabel(city, ''),
    sanitizePublicSeoLabel(regionAbbreviation, ''),
  ]
    .map((part) => normalizeSeoSlug(part))
    .filter(Boolean);

  const uniqueParts = dedupeSlugParts(rawParts).slice(0, 10);
  if (uniqueParts.length) {
    return uniqueParts.join('-');
  }

  return normalizeSeoSlug(fallbackTitle, 'equipment');
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

export function extractListingPublicKeyFromSlug(slugOrKey: string): string {
  const normalizedValue = String(slugOrKey || '').trim();
  if (!normalizedValue) return '';

  const delimiterIndex = normalizedValue.lastIndexOf('--');
  if (delimiterIndex === -1) {
    const trailingRawIdMatch = normalizedValue.match(/-([A-Za-z0-9]{8,})$/);
    if (trailingRawIdMatch) {
      return trailingRawIdMatch[1].trim();
    }

    return normalizedValue;
  }

  return normalizedValue.slice(delimiterIndex + 2).trim();
}

export function decodeListingPublicKey(publicKey: string): string {
  const normalizedKey = extractListingPublicKeyFromSlug(publicKey);
  if (!normalizedKey) return '';

  const decodeBase64Key = (value: string): string => {
    const padded = value
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes).trim();
  };

  if (/^[a-zA-Z0-9._-]+$/.test(normalizedKey) && !/[+=/]/.test(normalizedKey)) {
    const legacyDecoded = (() => {
      try {
        return decodeBase64Key(normalizedKey);
      } catch {
        return '';
      }
    })();

    if (legacyDecoded && /^[A-Za-z0-9._+\-]+$/.test(legacyDecoded)) {
      return legacyDecoded;
    }

    return normalizedKey;
  }

  try {
    return decodeBase64Key(normalizedKey);
  } catch {
    return '';
  }
}

export function buildListingPath(listing: ListingPathRecord): string {
  const publicKey = String(listing?.id || '').trim();
  const safeSlug = buildListingSeoSlug(listing);

  if (!publicKey) {
    return `/equipment/${safeSlug}`;
  }

  if (/^[A-Za-z0-9]{8,}$/.test(publicKey)) {
    return `/equipment/${safeSlug}-${publicKey}`;
  }

  return `/equipment/${safeSlug}--${publicKey}`;
}
