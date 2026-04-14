export const STOREFRONT_COUNTRY_OPTIONS = ['United States', 'Canada'] as const;

/** Broad scope options displayed at the top of the Service Area selector. */
const BROAD_SCOPE_OPTIONS = ['USA', 'Canada', 'Global'] as const;

/** All US states, listed alphabetically. */
const US_STATE_OPTIONS = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida',
  'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana',
  'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin',
  'Wyoming',
] as const;

/**
 * Combined service area scope options: broad scopes first (USA, Canada, Global),
 * then all 50 US states + DC. Replaces the old separate "State" option and
 * eliminates the duplicate "Service Area States" selector.
 */
export const SERVICE_AREA_SCOPE_OPTIONS = [
  ...BROAD_SCOPE_OPTIONS,
  ...US_STATE_OPTIONS,
] as const;

const SERVICE_AREA_SCOPE_LOOKUP = new Map(
  SERVICE_AREA_SCOPE_OPTIONS.map((value) => [value.toLowerCase(), value] as const)
);

export function sanitizeServiceAreaScopes(value: unknown, maxItems = 8): string[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .map((entry) => {
      // Direct match
      const direct = SERVICE_AREA_SCOPE_LOOKUP.get(entry.toLowerCase());
      if (direct) return direct;
      // Try abbreviation lookup (e.g. "MN" → "Minnesota")
      const fromAbbr = REGION_ABBREVIATIONS[entry.toUpperCase()];
      if (fromAbbr) return SERVICE_AREA_SCOPE_LOOKUP.get(fromAbbr.toLowerCase()) ?? null;
      return null;
    })
    .filter(Boolean) as string[];

  return Array.from(new Set(normalized)).slice(0, maxItems);
}

/** Maps state/province abbreviations to full names for search-by-abbreviation support. */
export const REGION_ABBREVIATIONS: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin',
  WY: 'Wyoming',
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NT: 'Northwest Territories', NS: 'Nova Scotia',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

/** Returns true if the scope/region name matches the query (by name or abbreviation). */
export function matchesRegionQuery(regionName: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (regionName.toLowerCase().includes(q)) return true;
  const matchedName = REGION_ABBREVIATIONS[query.trim().toUpperCase()];
  return matchedName?.toLowerCase() === regionName.toLowerCase();
}

/**
 * @deprecated Use SERVICE_AREA_SCOPE_OPTIONS instead — states are now included in the scope selector.
 * Kept for backward compatibility with existing Firestore data that references serviceAreaStates.
 */
export const SERVICE_AREA_REGION_OPTIONS = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
] as const;
