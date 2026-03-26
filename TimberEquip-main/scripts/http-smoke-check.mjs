const DEFAULT_ROUTES = [
  { path: '/sitemap.xml', type: 'xml' },
  { path: '/forestry-equipment-for-sale', type: 'html' },
  { path: '/categories', type: 'html' },
  { path: '/manufacturers', type: 'html' },
  { path: '/states', type: 'html' },
  { path: '/dealers', type: 'html' },
];

function parseArgs(argv) {
  const parsed = {
    _: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }

    const [flag, inlineValue] = token.split('=', 2);
    const key = flag.slice(2);

    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

const args = parseArgs(process.argv.slice(2));
const positionalBaseUrl = args._[0];
const positionalMode = args._[1];
const baseUrl = normalizeBaseUrl(String(args['base-url'] || positionalBaseUrl || process.env.SMOKE_BASE_URL || '').trim());
const mode = String(args.mode || positionalMode || process.env.SMOKE_EXPECT_MODE || 'indexable').trim();

if (!baseUrl) {
  console.error('Usage: node scripts/http-smoke-check.mjs --base-url https://example.com [--mode indexable|noindex]');
  process.exit(1);
}

let failures = 0;

for (const route of DEFAULT_ROUTES) {
  const response = await fetch(`${baseUrl}${route.path}`);

  const body = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (response.status >= 400) {
    console.error(`FAIL ${route.path}: status ${response.status}`);
    failures += 1;
    continue;
  }

  if (route.type === 'xml') {
    const isXml = contentType.includes('xml') || body.includes('<urlset') || body.includes('<sitemapindex');
    if (!isXml) {
      console.error(`FAIL ${route.path}: expected XML sitemap content`);
      failures += 1;
      continue;
    }

    console.log(`PASS ${route.path}: ${response.status}`);
    continue;
  }

  if (!body.includes('<html')) {
    console.error(`FAIL ${route.path}: expected HTML document`);
    failures += 1;
    continue;
  }

  if (!body.includes('rel="canonical"')) {
    console.error(`FAIL ${route.path}: canonical tag missing`);
    failures += 1;
    continue;
  }

  const xRobotsTag = (response.headers.get('x-robots-tag') || '').toLowerCase();
  if (mode === 'noindex' && !xRobotsTag.includes('noindex')) {
    console.error(`FAIL ${route.path}: expected noindex header`);
    failures += 1;
    continue;
  }

  if (mode === 'indexable' && xRobotsTag.includes('noindex')) {
    console.error(`FAIL ${route.path}: unexpected noindex header`);
    failures += 1;
    continue;
  }

  console.log(`PASS ${route.path}: ${response.status}`);
}

if (failures > 0) {
  process.exit(1);
}
