import type { DealerFeedProfile, DealerFeedSourceType } from '../services/dealerFeedService';

export type DealerFeedSetupMode = 'json' | 'csv' | 'xml' | 'url';

export type DealerFeedSampleFormat = 'json' | 'csv';

type DealerFeedSetupMeta = {
  label: string;
  sourceType: DealerFeedSourceType;
  helper: string;
  placeholder: string;
  accept: string;
  uploadLabel: string;
};

export const DEALER_FEED_SETUP_META: Record<DealerFeedSetupMode, DealerFeedSetupMeta> = {
  json: {
    label: 'JSON Array',
    sourceType: 'json',
    helper: 'Paste a JSON array of machines or upload a JSON export from your current inventory system.',
    placeholder: '[{"externalId":"SKU-1","title":"2021 Tigercat 620E Skidder"}]',
    accept: '.json,application/json,text/json',
    uploadLabel: 'Upload JSON',
  },
  csv: {
    label: 'CSV Upload',
    sourceType: 'csv',
    helper: 'Upload or paste a CSV with headers like externalId, title, price, year, make, model, category, and location.',
    placeholder: 'externalId,title,price,year,manufacturer,model,category,location\nSKU-1,2021 Tigercat 620E Skidder,189500,2021,Tigercat,620E,Skidders,Roseburg OR',
    accept: '.csv,text/csv,application/csv,text/plain',
    uploadLabel: 'Upload CSV',
  },
  xml: {
    label: 'XML Paste',
    sourceType: 'xml',
    helper: 'Paste raw XML inventory feeds when a vendor exports XML directly instead of JSON or CSV.',
    placeholder: '<inventory><item><id>SKU-1</id><title>2021 Tigercat 620E Skidder</title></item></inventory>',
    accept: '.xml,text/xml,application/xml,text/plain',
    uploadLabel: 'Upload XML',
  },
  url: {
    label: 'API / Feed URL',
    sourceType: 'auto',
    helper: 'Point TimberEquip at a live JSON, XML, or CSV endpoint and preview the mapped inventory before importing.',
    placeholder: 'https://dealer.example.com/inventory-feed.json',
    accept: '',
    uploadLabel: 'Upload Feed',
  },
};

const DEALER_FEED_SAMPLE_ITEMS = [
  {
    externalId: 'fes-sample-skidder-620e',
    title: '2021 Tigercat 620E Skidder',
    price: 189500,
    year: 2021,
    manufacturer: 'Tigercat',
    make: 'Tigercat',
    model: '620E',
    category: 'Skidders',
    location: 'Roseburg, OR',
    hours: 3240,
    stockNumber: 'FES-620E-21',
    description: 'Clean sample dealer feed unit for onboarding and QA checks.',
    imageUrls: [
      'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1400&q=80',
    ],
  },
  {
    externalId: 'fes-sample-forwarder-1110g',
    title: '2019 John Deere 1110G Forwarder',
    price: 254000,
    year: 2019,
    manufacturer: 'John Deere',
    make: 'John Deere',
    model: '1110G',
    category: 'Forwarders',
    location: 'Bemidji, MN',
    hours: 4180,
    stockNumber: 'FES-1110G-19',
    description: 'Sample forwarder record used to validate CSV, JSON, and API imports.',
    imageUrls: [
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1400&q=80',
    ],
  },
] as const;

export const DEALER_FEED_SAMPLE_JSON = `${JSON.stringify(DEALER_FEED_SAMPLE_ITEMS, null, 2)}\n`;

export const DEALER_FEED_SAMPLE_CSV = [
  'externalId,title,price,year,manufacturer,make,model,category,location,hours,stockNumber,description,imageUrls',
  '"fes-sample-skidder-620e","2021 Tigercat 620E Skidder","189500","2021","Tigercat","Tigercat","620E","Skidders","Roseburg, OR","3240","FES-620E-21","Clean sample dealer feed unit for onboarding and QA checks.","https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1400&q=80"',
  '"fes-sample-forwarder-1110g","2019 John Deere 1110G Forwarder","254000","2019","John Deere","John Deere","1110G","Forwarders","Bemidji, MN","4180","FES-1110G-19","Sample forwarder record used to validate CSV, JSON, and API imports.","https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1400&q=80"',
].join('\n');

export function getDealerFeedSamplePayload(mode: DealerFeedSetupMode): string {
  if (mode === 'csv') return DEALER_FEED_SAMPLE_CSV;
  if (mode === 'json' || mode === 'url') return DEALER_FEED_SAMPLE_JSON;
  return `<inventory>\n  <item>\n    <externalId>fes-sample-skidder-620e</externalId>\n    <title>2021 Tigercat 620E Skidder</title>\n    <price>189500</price>\n    <year>2021</year>\n    <manufacturer>Tigercat</manufacturer>\n    <model>620E</model>\n    <category>Skidders</category>\n    <location>Roseburg, OR</location>\n  </item>\n</inventory>`;
}

export function buildDealerFeedSampleUrl(origin: string, format: DealerFeedSampleFormat = 'json'): string {
  const normalizedOrigin = String(origin || '').trim().replace(/\/+$/u, '');
  const suffix = format === 'csv' ? 'csv' : 'json';
  return `${normalizedOrigin}/samples/dealer-feed-sample.${suffix}`;
}

export function buildDealerFeedApiCurlSnippet(params: {
  ingestUrl: string;
  apiKey?: string;
  sourceType?: DealerFeedSourceType;
}): string {
  const ingestUrl = String(params.ingestUrl || '').trim();
  const apiKey = String(params.apiKey || 'PASTE_YOUR_API_KEY').trim() || 'PASTE_YOUR_API_KEY';
  const sourceType = String(params.sourceType || 'json').trim() || 'json';
  const payload = sourceType === 'csv'
    ? DEALER_FEED_SAMPLE_CSV
    : DEALER_FEED_SAMPLE_JSON;

  return [
    `curl -X POST "${ingestUrl}" \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "X-Dealer-Api-Key: ${apiKey}" \\`,
    "  --data-binary @- <<'EOF'",
    '{',
    `  "sourceType": "${sourceType}",`,
    '  "dryRun": true,',
    `  "rawInput": ${JSON.stringify(payload)}`,
    '}',
    'EOF',
  ].join('\n');
}

export function getDealerFeedSetupModeFromProfile(profile: Pick<DealerFeedProfile, 'feedUrl' | 'sourceType'>): DealerFeedSetupMode {
  if (profile.feedUrl) return 'url';
  if (profile.sourceType === 'csv') return 'csv';
  if (profile.sourceType === 'xml') return 'xml';
  return 'json';
}

export function getDealerFeedSetupLabel(mode: DealerFeedSetupMode): string {
  return mode === 'url' ? 'API / Feed URL' : DEALER_FEED_SETUP_META[mode].label;
}

export function inferDealerFeedSetupModeFromFileName(fileName: string, fallback: DealerFeedSetupMode = 'json'): DealerFeedSetupMode {
  const normalized = String(fileName || '').trim().toLowerCase();
  if (normalized.endsWith('.csv')) return 'csv';
  if (normalized.endsWith('.xml')) return 'xml';
  if (normalized.endsWith('.json')) return 'json';
  return fallback;
}
