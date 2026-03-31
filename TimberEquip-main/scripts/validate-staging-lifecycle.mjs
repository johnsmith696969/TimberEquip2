import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_BASE_URL = 'https://timberequip-staging.web.app';
const DEFAULT_PASSWORD = 'Forestry Equipment Sales!QA2026';

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
  if (!condition) throw new Error(message);
}

function resolveApiBaseUrl(baseUrl) {
  const normalizedBaseUrl = String(baseUrl || '').trim().replace(/\/+$/u, '').toLowerCase();
  if (
    normalizedBaseUrl.includes('timberequip-staging.web.app')
    || normalizedBaseUrl.includes('timberequip-staging.firebaseapp.com')
  ) {
    return 'https://us-central1-timberequip-staging.cloudfunctions.net/apiProxy';
  }
  return normalizedBaseUrl;
}

async function loadStagingApiKey(explicitApiKey = '') {
  const normalizedExplicit = String(explicitApiKey || '').trim();
  if (normalizedExplicit) return normalizedExplicit;

  const envApiKey = String(process.env.FIREBASE_WEB_API_KEY || process.env.STAGING_FIREBASE_WEB_API_KEY || '').trim();
  if (envApiKey) return envApiKey;

  const localConfigPath = path.join(repoRoot, '.firebase-web-config.local.json');
  const raw = await fs.readFile(localConfigPath, 'utf8').catch(() => '');
  if (!raw) throw new Error('Missing staging Firebase web API key.');
  const parsed = JSON.parse(raw);
  const apiKey = String(parsed?.staging?.apiKey || '').trim();
  if (!apiKey) throw new Error('Missing staging.apiKey in .firebase-web-config.local.json.');
  return apiKey;
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = String(
      payload?.error?.message
      || payload?.error
      || payload?.message
      || `Request failed: ${response.status} ${response.statusText}`
    );
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function buildIdentityHeaders(allowedOrigin) {
  return {
    'Content-Type': 'application/json',
    Origin: allowedOrigin,
    Referer: `${allowedOrigin.replace(/\/+$/u, '')}/login`,
  };
}

async function signIn({ apiKey, email, password, allowedOrigin }) {
  const payload = await jsonFetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: buildIdentityHeaders(allowedOrigin),
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  return {
    uid: payload.localId,
    email,
    idToken: payload.idToken,
  };
}

async function authFetch(apiBaseUrl, webBaseUrl, pathName, idToken, options = {}) {
  const allowedOrigin = new URL(webBaseUrl).origin;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${idToken}`);
  headers.set('Origin', allowedOrigin);
  headers.set('Referer', `${allowedOrigin.replace(/\/+$/u, '')}/profile`);
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

function buildListingPayload(listingId) {
  const imageUrls = Array.from({ length: 5 }, (_, index) => `https://placehold.co/1200x900/16311e/f4f7f2?text=Staging+QA+${index + 1}`);

  return {
    id: listingId,
    title: 'Staging QA Owner-Operator Listing',
    category: 'Skidders',
    subcategory: 'Logging Equipment',
    make: 'Tigercat',
    manufacturer: 'Tigercat',
    brand: 'Tigercat',
    model: '620E',
    year: 2021,
    hours: 1980,
    condition: 'Used',
    price: 265000,
    location: 'Bemidji, Minnesota, USA',
    city: 'Bemidji',
    state: 'Minnesota',
    country: 'USA',
    description: 'Staging QA listing used to validate the canonical create -> review -> lifecycle path.',
    images: imageUrls,
    videoUrls: ['https://example.com/staging-qa-video'],
    featured: false,
  };
}

async function writeArtifact(relativePath, payload) {
  const artifactPath = path.join(repoRoot, relativePath);
  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, JSON.stringify(payload, null, 2));
  return artifactPath;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = String(args['base-url'] || DEFAULT_BASE_URL).trim().replace(/\/+$/u, '');
  const apiBaseUrl = resolveApiBaseUrl(baseUrl);
  const allowedOrigin = new URL(baseUrl).origin;
  const apiKey = await loadStagingApiKey(args['api-key'] || '');
  const password = String(args.password || process.env.STAGING_QA_PASSWORD || DEFAULT_PASSWORD).trim();
  const ownerOperatorEmail = String(args['owner-operator-email'] || 'staging.matrix.owneroperator.20260329@example.com').trim().toLowerCase();
  const adminEmail = String(args['admin-email'] || 'staging.matrix.admin.20260329@example.com').trim().toLowerCase();
  const listingId = String(args['listing-id'] || `staging-lifecycle-${Date.now()}`).trim();
  const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();

  const ownerOperatorSession = await signIn({
    apiKey,
    email: ownerOperatorEmail,
    password,
    allowedOrigin,
  });

  const adminSession = await signIn({
    apiKey,
    email: adminEmail,
    password,
    allowedOrigin,
  });

  const artifact = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    apiBaseUrl,
    listingId,
    steps: [],
  };

  const created = await authFetch(apiBaseUrl, baseUrl, '/account/listings', ownerOperatorSession.idToken, {
    method: 'POST',
    body: {
      listing: buildListingPayload(listingId),
    },
  });
  artifact.steps.push({
    step: 'create_and_submit',
    result: created,
  });

  assert(created?.lifecycleAction === 'submit', 'Expected listing creation to auto-submit into review.');

  const rejected = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, adminSession.idToken, {
    method: 'POST',
    body: {
      action: 'reject',
      reason: 'Staging QA rejection path validation.',
    },
  });
  artifact.steps.push({
    step: 'reject',
    result: rejected,
  });

  assert(rejected?.listing?.approvalStatus === 'rejected', 'Expected listing to be rejected.');

  const resubmitted = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, ownerOperatorSession.idToken, {
    method: 'POST',
    body: {
      action: 'submit',
      reason: 'Staging QA resubmission after rejection.',
    },
  });
  artifact.steps.push({
    step: 'resubmit',
    result: resubmitted,
  });

  const approved = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, adminSession.idToken, {
    method: 'POST',
    body: {
      action: 'approve',
      reason: 'Staging QA approval path validation.',
    },
  });
  artifact.steps.push({
    step: 'approve',
    result: approved,
  });

  const paymentConfirmed = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, adminSession.idToken, {
    method: 'POST',
    body: {
      action: 'payment_confirmed',
      reason: 'Staging QA payment confirmation path validation.',
      metadata: {
        planId: 'individual_seller',
        amountUsd: 0,
        expiresAt,
      },
    },
  });
  artifact.steps.push({
    step: 'payment_confirmed',
    result: paymentConfirmed,
  });

  const maybePublishedStatus = String(paymentConfirmed?.listing?.status || approved?.listing?.status || '').toLowerCase();
  let published = null;
  if (maybePublishedStatus !== 'active') {
    published = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, adminSession.idToken, {
      method: 'POST',
      body: {
        action: 'publish',
        reason: 'Staging QA publish path validation.',
        metadata: {
          expiresAt,
        },
      },
    });
    artifact.steps.push({
      step: 'publish',
      result: published,
    });
  }

  const sold = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, adminSession.idToken, {
    method: 'POST',
    body: {
      action: 'mark_sold',
      reason: 'Staging QA sold path validation.',
    },
  });
  artifact.steps.push({
    step: 'mark_sold',
    result: sold,
  });

  const relisted = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, adminSession.idToken, {
    method: 'POST',
    body: {
      action: 'relist',
      reason: 'Staging QA relist path validation.',
      metadata: {
        expiresAt,
      },
    },
  });
  artifact.steps.push({
    step: 'relist',
    result: relisted,
  });

  const archived = await authFetch(apiBaseUrl, baseUrl, `/listings/${encodeURIComponent(listingId)}/lifecycle`, adminSession.idToken, {
    method: 'POST',
    body: {
      action: 'archive',
      reason: 'Staging QA archive path validation.',
    },
  });
  artifact.steps.push({
    step: 'archive',
    result: archived,
  });

  const audit = await authFetch(apiBaseUrl, baseUrl, `/admin/listings/${encodeURIComponent(listingId)}/lifecycle-audit`, adminSession.idToken, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  artifact.steps.push({
    step: 'lifecycle_audit',
    result: audit,
  });

  assert(
    ['active', 'sold', 'archived', 'pending'].includes(String(approved?.listing?.status || '').toLowerCase()),
    'Expected approval response to include a valid listing status.'
  );
  assert(String(paymentConfirmed?.listing?.paymentStatus || '').toLowerCase() === 'paid', 'Expected payment confirmation to mark listing paid.');
  assert(String((published?.listing?.status || paymentConfirmed?.listing?.status || '').toLowerCase()) === 'active', 'Expected listing to become active.');
  assert(String(sold?.listing?.status || '').toLowerCase() === 'sold', 'Expected listing to be marked sold.');
  assert(String(relisted?.listing?.status || '').toLowerCase() === 'active', 'Expected relist to restore active status.');
  assert(String(archived?.listing?.status || '').toLowerCase() === 'archived', 'Expected archive to mark listing archived.');
  const lifecycleAuditReport = audit?.report || audit?.auditReport || null;
  assert(lifecycleAuditReport?.listingId === listingId, 'Expected lifecycle audit report for the staged listing.');

  const artifactPath = await writeArtifact(
    path.join('output', 'qa', 'staging-lifecycle-smoke-20260329.json'),
    artifact
  );

  console.log(JSON.stringify({
    ok: true,
    artifactPath,
    listingId,
    summary: {
      createdStatus: created?.listing?.status,
      rejectedStatus: rejected?.listing?.approvalStatus,
      approvedStatus: approved?.listing?.status,
      paymentStatus: paymentConfirmed?.listing?.paymentStatus,
      relistedStatus: relisted?.listing?.status,
      archivedStatus: archived?.listing?.status,
      anomalyCodes: Array.isArray(lifecycleAuditReport?.anomalyCodes) ? lifecycleAuditReport.anomalyCodes : [],
    },
  }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
