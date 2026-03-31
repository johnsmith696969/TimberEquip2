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

const NOINDEX_ROBOTS = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
const REGION_ABBREVIATIONS = {
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

function normalizeText(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function splitPublicTokens(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

function sanitizePublicSeoLabel(value, fallback = '') {
  const cleaned = String(value || '')
    .replace(/\b(qa|test|testing|demo|probe|sandbox|sample|staging)\b/gi, ' ')
    .replace(/[_|/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || fallback;
}

function normalizeSeoSlug(value, fallback = '') {
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

function getLocationSeoParts(value) {
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

function abbreviateRegionForSeo(value) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';

  if (/^[a-z]{2}$/i.test(normalizedValue)) {
    return normalizedValue.toUpperCase();
  }

  return REGION_ABBREVIATIONS[normalizedValue.toLowerCase()] || normalizedValue;
}

function dedupeSlugParts(parts) {
  const seen = new Set();
  return parts.filter((part) => {
    if (!part || seen.has(part)) return false;
    seen.add(part);
    return true;
  });
}

function buildListingSeoSlug(listing) {
  const manufacturer = sanitizePublicSeoLabel(listing?.make || listing?.manufacturer || listing?.brand || '', '');
  const model = sanitizePublicSeoLabel(listing?.model || '', '');
  const { city, state } = getLocationSeoParts(listing?.location);
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

function encodeListingPublicKey(listingId) {
  const normalizedId = normalizeText(listingId);
  if (!normalizedId) return '';

  return Buffer.from(normalizedId, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function extractListingPublicKeyFromSlug(slugOrKey) {
  const normalizedValue = normalizeText(slugOrKey);
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

function decodeListingPublicKey(publicKey) {
  const normalizedKey = extractListingPublicKeyFromSlug(publicKey);
  if (!normalizedKey) return '';

  try {
    const padded = normalizedKey
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(normalizedKey.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64').toString('utf8').trim();
  } catch {
    return '';
  }
}

function buildListingPublicPath(listing) {
  const publicKey = normalizeText(listing?.id);
  const slug = buildListingSeoSlug(listing);

  if (!publicKey) {
    return `/equipment/${slug}`;
  }

  if (/^[A-Za-z0-9]{8,}$/.test(publicKey)) {
    return `/equipment/${slug}-${publicKey}`;
  }

  return `/equipment/${slug}--${publicKey}`;
}

function isPublicQaOrTestRecord(...values) {
  return values.some((value) =>
    splitPublicTokens(value).some((token) => DISALLOWED_PUBLIC_TOKENS.has(token))
  );
}

module.exports = {
  NOINDEX_ROBOTS,
  buildListingPublicPath,
  buildListingSeoSlug,
  decodeListingPublicKey,
  encodeListingPublicKey,
  extractListingPublicKeyFromSlug,
  isPublicQaOrTestRecord,
  normalizeSeoSlug,
  sanitizePublicSeoLabel,
};
