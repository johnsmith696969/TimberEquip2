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
  headers.set('Referer', `${allowedOrigin.replace(/\/+$/u, '')}/ad-programs`);
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

function buildEnrollment(planId, email) {
  const isDealerPlan = planId === 'dealer' || planId === 'fleet_dealer';
  return {
    legalFullName: 'Caleb Happy',
    legalTitle: isDealerPlan ? 'Operations Manager' : 'Owner-Operator',
    companyName: isDealerPlan ? 'Staging QA Dealer Group' : '',
    billingEmail: email,
    phoneNumber: '+16125550199',
    website: 'https://timberequip-staging.web.app',
    country: 'United States',
    taxIdOrVat: '',
    notes: `Staging billing start validation for ${planId}.`,
    legalTermsVersion: '2026-03-29',
    acceptedTerms: true,
    acceptedPrivacy: true,
    acceptedRecurringBilling: true,
    acceptedVisibilityPolicy: true,
    acceptedAuthority: true,
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
  const apiBaseUrl = 'https://us-central1-timberequip-staging.cloudfunctions.net/apiProxy';
  const allowedOrigin = new URL(baseUrl).origin;
  const apiKey = await loadStagingApiKey(args['api-key'] || '');
  const password = String(args.password || process.env.STAGING_QA_PASSWORD || DEFAULT_PASSWORD).trim();
  const memberEmail = String(args['member-email'] || 'staging.matrix.member.20260329@example.com').trim().toLowerCase();
  const buyerEmail = String(args['buyer-email'] || 'staging.matrix.buyer.20260329@example.com').trim().toLowerCase();

  const memberSession = await signIn({
    apiKey,
    email: memberEmail,
    password,
    allowedOrigin,
  });

  const buyerSession = await signIn({
    apiKey,
    email: buyerEmail,
    password,
    allowedOrigin,
  });

  const scenarios = [
    { planId: 'individual_seller', quantity: 1, session: memberSession },
    { planId: 'dealer', quantity: 1, session: buyerSession },
    { planId: 'fleet_dealer', quantity: 1, session: buyerSession },
  ];

  const artifact = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    apiBaseUrl,
    scenarios: [],
  };

  for (const scenario of scenarios) {
    const result = await authFetch(apiBaseUrl, baseUrl, '/billing/create-account-checkout-session', scenario.session.idToken, {
      method: 'POST',
      body: {
        planId: scenario.planId,
        returnPath: '/ad-programs',
        quantity: scenario.quantity,
        enrollment: buildEnrollment(scenario.planId, scenario.session.email),
      },
    });

    assert(typeof result?.url === 'string' && result.url.includes('stripe.com'), `Expected Stripe checkout URL for ${scenario.planId}.`);
    assert(typeof result?.sessionId === 'string' && result.sessionId.startsWith('cs_'), `Expected Stripe session id for ${scenario.planId}.`);

    artifact.scenarios.push({
      planId: scenario.planId,
      email: scenario.session.email,
      sessionId: result.sessionId,
      url: result.url,
    });
  }

  const artifactPath = await writeArtifact(
    path.join('output', 'qa', 'staging-billing-start-20260329.json'),
    artifact,
  );

  console.log(JSON.stringify({
    ok: true,
    artifactPath,
    scenarios: artifact.scenarios.map((scenario) => ({
      planId: scenario.planId,
      email: scenario.email,
      sessionId: scenario.sessionId,
      checkoutHost: new URL(scenario.url).host,
    })),
  }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
