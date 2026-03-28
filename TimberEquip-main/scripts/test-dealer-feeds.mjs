import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = 'true';
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readSample(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

function resolveApiBaseUrl(baseUrl, override = '') {
  const explicitOverride = String(override || '').trim().replace(/\/+$/u, '');
  if (explicitOverride) {
    return explicitOverride;
  }

  const normalizedBaseUrl = String(baseUrl || '').trim().replace(/\/+$/u, '').toLowerCase();
  if (
    normalizedBaseUrl.includes('timberequip-staging.web.app')
    || normalizedBaseUrl.includes('timberequip-staging.firebaseapp.com')
  ) {
    return 'https://us-central1-timberequip-staging.cloudfunctions.net/apiProxy';
  }

  if (
    normalizedBaseUrl.includes('timberequip.com')
    || normalizedBaseUrl.includes('mobile-app-equipment-sales.web.app')
    || normalizedBaseUrl.includes('mobile-app-equipment-sales.firebaseapp.com')
  ) {
    return 'https://us-central1-mobile-app-equipment-sales.cloudfunctions.net/apiProxy';
  }

  return normalizedBaseUrl;
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status} ${response.statusText}`);
  }
  return payload;
}

async function signIn({ apiKey, email, password, allowedOrigin }) {
  const payload = await jsonFetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(allowedOrigin
          ? {
              Origin: allowedOrigin,
              Referer: `${allowedOrigin.replace(/\/+$/u, '')}/login`,
            }
          : {}),
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  return {
    email,
    uid: payload.localId,
    idToken: payload.idToken,
  };
}

async function authFetch(apiBaseUrl, webBaseUrl, pathName, idToken, options = {}) {
  const allowedOrigin = new URL(webBaseUrl).origin;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${idToken}`);
  headers.set('Origin', allowedOrigin);
  headers.set('Referer', `${allowedOrigin.replace(/\/+$/u, '')}/dealer-os`);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return jsonFetch(`${apiBaseUrl}${pathName}`, {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body),
  });
}

async function registerFeed(apiBaseUrl, webBaseUrl, idToken, payload) {
  const response = await authFetch(apiBaseUrl, webBaseUrl, '/admin/dealer-feeds/register', idToken, {
    method: 'POST',
    body: payload,
  });
  assert(response.feed?.id, 'Expected register feed response to include feed.id');
  return response.feed;
}

async function deleteFeed(apiBaseUrl, webBaseUrl, idToken, feedId) {
  await authFetch(apiBaseUrl, webBaseUrl, `/admin/dealer-feeds/${encodeURIComponent(feedId)}`, idToken, {
    method: 'DELETE',
  });
}

async function resolveFeed(apiBaseUrl, webBaseUrl, idToken, payload) {
  const response = await authFetch(apiBaseUrl, webBaseUrl, '/admin/dealer-feeds/resolve', idToken, {
    method: 'POST',
    body: payload,
  });
  assert(Array.isArray(response.items), 'Expected resolved feed items array');
  return response;
}

async function ingestFeed(apiBaseUrl, webBaseUrl, idToken, payload) {
  const response = await authFetch(apiBaseUrl, webBaseUrl, '/admin/dealer-feeds/ingest', idToken, {
    method: 'POST',
    body: payload,
  });
  assert(typeof response.processed === 'number', 'Expected ingest response to include processed count');
  return response;
}

async function getFeed(apiBaseUrl, webBaseUrl, idToken, feedId, includeSecrets = false) {
  const query = includeSecrets ? '?includeSecrets=1' : '';
  const response = await authFetch(apiBaseUrl, webBaseUrl, `/admin/dealer-feeds/${encodeURIComponent(feedId)}${query}`, idToken);
  assert(response.feed?.id === feedId, 'Expected feed detail response');
  return response.feed;
}

async function syncFeed(apiBaseUrl, webBaseUrl, idToken, feedId, payload = {}) {
  const response = await authFetch(apiBaseUrl, webBaseUrl, `/admin/dealer-feeds/${encodeURIComponent(feedId)}/sync`, idToken, {
    method: 'POST',
    body: payload,
  });
  assert(response.result?.processed >= 0, 'Expected sync result');
  return response;
}

async function getLogs(apiBaseUrl, webBaseUrl, idToken, sellerUid) {
  const response = await authFetch(
    apiBaseUrl,
    webBaseUrl,
    `/admin/dealer-feeds/logs?limit=10&sellerUid=${encodeURIComponent(sellerUid)}`,
    idToken
  );
  assert(Array.isArray(response.logs), 'Expected logs array');
  return response.logs;
}

async function pushDealerApi(ingestUrl, apiKey, payload) {
  const response = await jsonFetch(String(ingestUrl || '').trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dealer-Api-Key': apiKey,
    },
    body: JSON.stringify(payload),
  });
  assert(typeof response.processed === 'number', 'Expected dealer API ingest response');
  return response;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = String(args['base-url'] || process.env.DEALER_FEED_TEST_BASE_URL || 'https://timberequip-staging.web.app').replace(/\/+$/u, '');
  const apiBaseUrl = resolveApiBaseUrl(baseUrl, args['api-base-url'] || process.env.DEALER_FEED_TEST_API_BASE_URL || '');
  const allowedOrigin = new URL(baseUrl).origin;
  const apiKey = String(args['api-key'] || process.env.FIREBASE_WEB_API_KEY || '').trim();
  const password = String(args.password || process.env.DEALER_FEED_TEST_PASSWORD || 'TimberEquip!QA2026').trim();

  assert(apiKey, 'Missing Firebase web API key. Pass --api-key or FIREBASE_WEB_API_KEY.');

  const credentials = {
    superAdmin: {
      email: String(args['super-admin-email'] || process.env.DEALER_FEED_SUPER_ADMIN_EMAIL || 'staging.qa.superadmin.20260328@example.com').trim(),
    },
    dealer: {
      email: String(args['dealer-email'] || process.env.DEALER_FEED_DEALER_EMAIL || 'staging.qa.dealer.20260328@example.com').trim(),
    },
    proDealer: {
      email: String(args['pro-dealer-email'] || process.env.DEALER_FEED_PRO_DEALER_EMAIL || 'staging.qa.prodealer.20260328@example.com').trim(),
    },
  };

  const sampleJson = await readSample('public/samples/dealer-feed-sample.json');
  const sampleCsv = await readSample('public/samples/dealer-feed-sample.csv');
  const sampleFeedUrl = `${baseUrl}/samples/dealer-feed-sample.json`;
  const unique = Date.now();

  const [superAdmin, dealer, proDealer] = await Promise.all([
    signIn({ apiKey, email: credentials.superAdmin.email, password, allowedOrigin }),
    signIn({ apiKey, email: credentials.dealer.email, password, allowedOrigin }),
    signIn({ apiKey, email: credentials.proDealer.email, password, allowedOrigin }),
  ]);

  const cleanup = [];

  try {
    const dealerJsonFeed = await registerFeed(apiBaseUrl, baseUrl, dealer.idToken, {
      sellerUid: dealer.uid,
      sourceName: `QA Dealer JSON ${unique}`,
      sourceType: 'json',
      rawInput: sampleJson,
      nightlySyncEnabled: false,
    });
    cleanup.push({ feedId: dealerJsonFeed.id, idToken: dealer.idToken });
    assert(dealerJsonFeed.apiKey, 'Dealer feed registration should return an API key');

    const dealerJsonResolve = await resolveFeed(apiBaseUrl, baseUrl, dealer.idToken, {
      feedId: dealerJsonFeed.id,
      sourceName: dealerJsonFeed.sourceName,
      sourceType: 'json',
      rawInput: sampleJson,
    });
    assert(dealerJsonResolve.detectedType === 'json', 'Dealer JSON resolve should detect json');
    assert(dealerJsonResolve.itemCount === 2, 'Dealer JSON resolve should find 2 items');

    const dealerJsonDryRun = await ingestFeed(apiBaseUrl, baseUrl, dealer.idToken, {
      feedId: dealerJsonFeed.id,
      sourceName: dealerJsonFeed.sourceName,
      dealerId: dealer.uid,
      dryRun: true,
      items: dealerJsonResolve.items,
    });
    assert(dealerJsonDryRun.dryRun === true, 'Dealer JSON ingest should be dry run');
    assert(dealerJsonDryRun.processed === 2, 'Dealer JSON ingest should process 2 items');

    const dealerCsvResolve = await resolveFeed(apiBaseUrl, baseUrl, dealer.idToken, {
      sourceName: `QA Dealer CSV ${unique}`,
      sourceType: 'csv',
      rawInput: sampleCsv,
    });
    assert(dealerCsvResolve.detectedType === 'csv', 'Dealer CSV resolve should detect csv');
    assert(dealerCsvResolve.itemCount === 2, 'Dealer CSV resolve should find 2 items');

    const dealerCsvDryRun = await ingestFeed(apiBaseUrl, baseUrl, dealer.idToken, {
      sourceName: `QA Dealer CSV ${unique}`,
      dealerId: dealer.uid,
      dryRun: true,
      items: dealerCsvResolve.items,
    });
    assert(dealerCsvDryRun.processed === 2, 'Dealer CSV ingest should process 2 items');

    const dealerUrlFeed = await registerFeed(apiBaseUrl, baseUrl, dealer.idToken, {
      sellerUid: dealer.uid,
      sourceName: `QA Dealer URL ${unique}`,
      sourceType: 'auto',
      feedUrl: sampleFeedUrl,
      nightlySyncEnabled: false,
    });
    cleanup.push({ feedId: dealerUrlFeed.id, idToken: dealer.idToken });

    const dealerUrlResolve = await resolveFeed(apiBaseUrl, baseUrl, dealer.idToken, {
      feedId: dealerUrlFeed.id,
      sourceName: dealerUrlFeed.sourceName,
      sourceType: 'auto',
      feedUrl: sampleFeedUrl,
    });
    assert(dealerUrlResolve.itemCount === 2, 'Dealer URL resolve should find 2 items');

    const dealerUrlSync = await syncFeed(apiBaseUrl, baseUrl, dealer.idToken, dealerUrlFeed.id, { dryRun: true });
    assert(dealerUrlSync.result.processed === 2, 'Dealer URL sync should process 2 items');

    const dealerSecretFeed = await getFeed(apiBaseUrl, baseUrl, dealer.idToken, dealerJsonFeed.id, true);
    assert(dealerSecretFeed.apiKey, 'Dealer should be able to reveal their API key');

    const dealerApiPush = await pushDealerApi(dealerSecretFeed.ingestUrl, dealerSecretFeed.apiKey, {
      sourceType: 'json',
      dryRun: true,
      rawInput: sampleJson,
    });
    assert(dealerApiPush.processed === 2, 'Dealer API push should process 2 items');

    const proDealerJsonFeed = await registerFeed(apiBaseUrl, baseUrl, proDealer.idToken, {
      sellerUid: proDealer.uid,
      sourceName: `QA Pro Dealer JSON ${unique}`,
      sourceType: 'json',
      rawInput: sampleJson,
      nightlySyncEnabled: false,
    });
    cleanup.push({ feedId: proDealerJsonFeed.id, idToken: proDealer.idToken });
    assert(proDealerJsonFeed.apiKey, 'Pro dealer feed registration should return an API key');

    const proDealerJsonResolve = await resolveFeed(apiBaseUrl, baseUrl, proDealer.idToken, {
      feedId: proDealerJsonFeed.id,
      sourceName: proDealerJsonFeed.sourceName,
      sourceType: 'json',
      rawInput: sampleJson,
    });
    assert(proDealerJsonResolve.itemCount === 2, 'Pro dealer JSON resolve should find 2 items');

    const proDealerCsvResolve = await resolveFeed(apiBaseUrl, baseUrl, proDealer.idToken, {
      sourceName: `QA Pro Dealer CSV ${unique}`,
      sourceType: 'csv',
      rawInput: sampleCsv,
    });
    assert(proDealerCsvResolve.detectedType === 'csv', 'Pro dealer CSV resolve should detect csv');

    const proDealerUrlFeed = await registerFeed(apiBaseUrl, baseUrl, proDealer.idToken, {
      sellerUid: proDealer.uid,
      sourceName: `QA Pro Dealer URL ${unique}`,
      sourceType: 'auto',
      feedUrl: sampleFeedUrl,
      nightlySyncEnabled: false,
    });
    cleanup.push({ feedId: proDealerUrlFeed.id, idToken: proDealer.idToken });
    const proDealerUrlSync = await syncFeed(apiBaseUrl, baseUrl, proDealer.idToken, proDealerUrlFeed.id, { dryRun: true });
    assert(proDealerUrlSync.result.processed === 2, 'Pro dealer URL sync should process 2 items');

    const proDealerSecretFeed = await getFeed(apiBaseUrl, baseUrl, proDealer.idToken, proDealerJsonFeed.id, true);
    assert(proDealerSecretFeed.apiKey, 'Pro dealer should be able to reveal their API key');

    const proDealerApiPush = await pushDealerApi(proDealerSecretFeed.ingestUrl, proDealerSecretFeed.apiKey, {
      sourceType: 'json',
      dryRun: true,
      rawInput: sampleJson,
    });
    assert(proDealerApiPush.processed === 2, 'Pro dealer API push should process 2 items');

    const adminJsonResolve = await resolveFeed(apiBaseUrl, baseUrl, superAdmin.idToken, {
      sourceName: `QA Admin JSON ${unique}`,
      sourceType: 'json',
      rawInput: sampleJson,
    });
    assert(adminJsonResolve.itemCount === 2, 'Admin JSON resolve should find 2 items');

    const adminJsonDryRun = await ingestFeed(apiBaseUrl, baseUrl, superAdmin.idToken, {
      sourceName: `QA Admin JSON ${unique}`,
      dealerId: dealer.uid,
      dryRun: true,
      items: adminJsonResolve.items,
    });
    assert(adminJsonDryRun.processed === 2, 'Admin JSON ingest should process 2 items');

    const adminCsvResolve = await resolveFeed(apiBaseUrl, baseUrl, superAdmin.idToken, {
      sourceName: `QA Admin CSV ${unique}`,
      sourceType: 'csv',
      rawInput: sampleCsv,
    });
    assert(adminCsvResolve.itemCount === 2, 'Admin CSV resolve should find 2 items');

    const adminUrlFeed = await registerFeed(apiBaseUrl, baseUrl, superAdmin.idToken, {
      sellerUid: dealer.uid,
      sourceName: `QA Admin URL ${unique}`,
      sourceType: 'auto',
      feedUrl: sampleFeedUrl,
      nightlySyncEnabled: false,
    });
    cleanup.push({ feedId: adminUrlFeed.id, idToken: superAdmin.idToken });

    const adminUrlSync = await syncFeed(apiBaseUrl, baseUrl, superAdmin.idToken, adminUrlFeed.id, { dryRun: true });
    assert(adminUrlSync.result.processed === 2, 'Admin URL sync should process 2 items');

    const adminSecretFeed = await getFeed(apiBaseUrl, baseUrl, superAdmin.idToken, adminUrlFeed.id, true);
    assert(adminSecretFeed.apiKey, 'Admin should be able to reveal the dealer feed API key');

    const adminApiPush = await pushDealerApi(adminSecretFeed.ingestUrl, adminSecretFeed.apiKey, {
      sourceType: 'json',
      dryRun: true,
      rawInput: sampleJson,
    });
    assert(adminApiPush.processed === 2, 'Admin API push should process 2 items');

    const dealerLogs = await getLogs(apiBaseUrl, baseUrl, dealer.idToken, dealer.uid);
    assert(Array.isArray(dealerLogs), 'Dealer log endpoint should return an array');

    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      apiBaseUrl,
      tested: {
        superAdmin: ['json_array', 'csv_upload', 'feed_url', 'api_push'],
        dealer: ['json_array', 'csv_upload', 'feed_url', 'api_push'],
        proDealer: ['json_array', 'csv_upload', 'feed_url', 'api_push'],
      },
      sampleFeedUrl,
      dealerUid: dealer.uid,
      proDealerUid: proDealer.uid,
    }, null, 2));
  } finally {
    await Promise.allSettled(cleanup.map((entry) => deleteFeed(apiBaseUrl, baseUrl, entry.idToken, entry.feedId)));
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
