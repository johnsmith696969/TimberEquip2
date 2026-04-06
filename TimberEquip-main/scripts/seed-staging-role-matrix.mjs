import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_BASE_URL = 'https://timberequip-staging.web.app';
const DEFAULT_SUPER_ADMIN_EMAIL = 'staging.qa.superadmin.20260328@example.com';

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

function resolveApiBaseUrl(baseUrl) {
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

async function loadStagingApiKey(explicitApiKey = '') {
  const normalizedExplicit = String(explicitApiKey || '').trim();
  if (normalizedExplicit) return normalizedExplicit;

  const envApiKey = String(process.env.FIREBASE_WEB_API_KEY || process.env.STAGING_FIREBASE_WEB_API_KEY || '').trim();
  if (envApiKey) return envApiKey;

  const localConfigPath = path.join(repoRoot, '.firebase-web-config.local.json');
  const raw = await fs.readFile(localConfigPath, 'utf8').catch(() => '');
  if (!raw) {
    throw new Error('Missing staging Firebase web API key. Pass --api-key or create .firebase-web-config.local.json.');
  }

  const parsed = JSON.parse(raw);
  const apiKey = String(parsed?.staging?.apiKey || '').trim();
  if (!apiKey) {
    throw new Error('Missing staging.apiKey in .firebase-web-config.local.json.');
  }

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
  if (!allowedOrigin) return { 'Content-Type': 'application/json' };
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

async function signUp({ apiKey, email, password, allowedOrigin }) {
  const payload = await jsonFetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
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

async function ensureKnownPasswordAccount({ apiKey, email, password, allowedOrigin }) {
  try {
    return await signIn({ apiKey, email, password, allowedOrigin });
  } catch (error) {
    const normalizedMessage = String(error?.message || '').toUpperCase();
    if (!normalizedMessage.includes('INVALID_LOGIN_CREDENTIALS') && !normalizedMessage.includes('EMAIL_NOT_FOUND')) {
      throw error;
    }
  }

  try {
    return await signUp({ apiKey, email, password, allowedOrigin });
  } catch (error) {
    const normalizedMessage = String(error?.message || '').toUpperCase();
    if (normalizedMessage.includes('EMAIL_EXISTS')) {
      return await signIn({ apiKey, email, password, allowedOrigin });
    }
    throw error;
  }
}

async function patchUserRole({ apiBaseUrl, webBaseUrl, adminToken, uid, role, displayName, email, company = '', phoneNumber = '' }) {
  return authFetch(apiBaseUrl, webBaseUrl, `/admin/users/${encodeURIComponent(uid)}`, adminToken, {
    method: 'PATCH',
    body: {
      displayName,
      email,
      role,
      company,
      phoneNumber,
    },
  });
}

async function getAccountBootstrap({ apiBaseUrl, webBaseUrl, idToken }) {
  return authFetch(apiBaseUrl, webBaseUrl, '/account/bootstrap', idToken, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
}

function summarizeBootstrap(label, bootstrap) {
  const profile = bootstrap?.profile || {};
  const entitlement = profile?.entitlement || {};
  const seatContext = bootstrap?.seatContext || null;

  return {
    label,
    uid: profile.uid || '',
    role: profile.role || '',
    accountStatus: profile.accountStatus || '',
    accountAccessSource: profile.accountAccessSource || null,
    activeSubscriptionPlanId: profile.activeSubscriptionPlanId || null,
    subscriptionStatus: profile.subscriptionStatus || null,
    listingCap: profile.listingCap ?? null,
    managedAccountCap: profile.managedAccountCap ?? null,
    storefrontEnabled: Boolean(profile.storefrontEnabled),
    firestoreQuotaLimited: Boolean(bootstrap?.firestoreQuotaLimited),
    profileSource: bootstrap?.source || '',
    seatContextSource: bootstrap?.seatContextSource || '',
    seatContext: seatContext
      ? {
          seatLimit: Number(seatContext.seatLimit || 0),
          seatCount: Number(seatContext.seatCount || 0),
          activePlanIds: Array.isArray(seatContext.activePlanIds) ? seatContext.activePlanIds : [],
        }
      : null,
    entitlement: {
      subscriptionState: entitlement.subscriptionState || 'none',
      effectiveSellerCapability: entitlement.effectiveSellerCapability || 'none',
      sellerAccessMode: entitlement.sellerAccessMode || 'none',
      sellerWorkspaceAccess: Boolean(entitlement.sellerWorkspaceAccess),
      canPostListings: Boolean(entitlement.canPostListings),
      dealerOsAccess: Boolean(entitlement.dealerOsAccess),
      publicListingVisibility: entitlement.publicListingVisibility || 'not_applicable',
      visibilityReason: entitlement.visibilityReason || 'non_seller_role',
      billingLabel: entitlement.billingLabel || '',
      overrideSource: entitlement.overrideSource || null,
    },
  };
}

function validateSummary(summary) {
  const role = String(summary.role || '').trim();
  const entitlement = summary.entitlement || {};
  const issues = [];

  if (!role) {
    issues.push('Missing resolved role.');
  }

  if (role === 'member' && entitlement.sellerWorkspaceAccess) {
    issues.push(`Expected non-seller role ${role} to have sellerWorkspaceAccess=false.`);
  }

  if (['individual_seller', 'dealer', 'pro_dealer', 'admin', 'super_admin'].includes(role) && !entitlement.sellerWorkspaceAccess) {
    issues.push(`Expected seller/admin role ${role} to have sellerWorkspaceAccess=true.`);
  }

  if (role === 'individual_seller' && entitlement.effectiveSellerCapability !== 'owner_operator') {
    issues.push('Expected individual_seller to resolve to owner_operator capability.');
  }

  if (role === 'dealer' && entitlement.effectiveSellerCapability !== 'dealer') {
    issues.push('Expected dealer to resolve to dealer capability.');
  }

  if (role === 'pro_dealer' && entitlement.effectiveSellerCapability !== 'pro_dealer') {
    issues.push('Expected pro_dealer to resolve to pro_dealer capability.');
  }

  if (['dealer', 'pro_dealer'].includes(role) && !entitlement.dealerOsAccess) {
    issues.push(`Expected ${role} to have DealerOS access.`);
  }

  if (role === 'individual_seller' && entitlement.dealerOsAccess) {
    issues.push('Expected owner-operator role to not have DealerOS access.');
  }

  return issues;
}

async function writeArtifact(relativePath, payload) {
  const artifactPath = path.join(repoRoot, relativePath);
  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, JSON.stringify(payload, null, 2));
  return artifactPath;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = String(args['base-url'] || process.env.STAGING_ROLE_MATRIX_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/u, '');
  const apiBaseUrl = resolveApiBaseUrl(baseUrl);
  const allowedOrigin = new URL(baseUrl).origin;
  const apiKey = await loadStagingApiKey(args['api-key'] || '');
  const password = String(args.password || process.env.STAGING_QA_PASSWORD || '').trim();
  if (!password) { console.error('Set STAGING_QA_PASSWORD env var or pass --password'); process.exit(1); }
  const superAdminEmail = String(args['super-admin-email'] || process.env.STAGING_ROLE_MATRIX_SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL).trim().toLowerCase();
  const adminTokenOverride = String(args['admin-token'] || process.env.STAGING_ROLE_MATRIX_ADMIN_TOKEN || '').trim();

  const matrixAccounts = [
    {
      label: 'super_admin',
      email: superAdminEmail,
      role: 'super_admin',
      displayName: 'Staging QA Super Admin',
      company: 'TimberEquip',
      phoneNumber: '541-555-0101',
      existing: true,
    },
    {
      label: 'admin',
      email: 'staging.matrix.admin.20260329@example.com',
      role: 'admin',
      displayName: 'Staging QA Admin',
      company: 'TimberEquip',
      phoneNumber: '541-555-0102',
    },
    {
      label: 'pro_dealer',
      email: 'staging.matrix.prodealer.20260329@example.com',
      role: 'pro_dealer',
      displayName: 'Staging QA Pro Dealer',
      company: 'Staging Pro Dealer Group',
      phoneNumber: '541-555-0103',
    },
    {
      label: 'dealer',
      email: 'staging.matrix.dealer.20260329@example.com',
      role: 'dealer',
      displayName: 'Staging QA Dealer',
      company: 'Staging Dealer Group',
      phoneNumber: '541-555-0104',
    },
    {
      label: 'owner_operator',
      email: 'staging.matrix.owneroperator.20260329@example.com',
      role: 'individual_seller',
      displayName: 'Staging QA Owner Operator',
      company: 'Owner Operator Forestry',
      phoneNumber: '541-555-0105',
    },
    {
      label: 'free_member',
      email: 'staging.matrix.member.20260329@example.com',
      role: 'member',
      displayName: 'Staging QA Free Member',
      company: '',
      phoneNumber: '541-555-0106',
    },
    {
      label: 'member',
      email: 'staging.matrix.member.20260329@example.com',
      role: 'member',
      displayName: 'Staging QA Member',
      company: '',
      phoneNumber: '541-555-0107',
    },
  ];

  const superAdminSession = adminTokenOverride
    ? {
        uid: '',
        email: superAdminEmail,
        idToken: adminTokenOverride,
      }
    : await signIn({
        apiKey,
        email: superAdminEmail,
        password,
        allowedOrigin,
      });

  const sessionsByLabel = {};

  for (const account of matrixAccounts.filter((entry) => !entry.existing)) {
    const session = await ensureKnownPasswordAccount({
      apiKey,
      email: account.email,
      password,
      allowedOrigin,
    });

    await patchUserRole({
      apiBaseUrl,
      webBaseUrl: baseUrl,
      adminToken: superAdminSession.idToken,
      uid: session.uid,
      role: account.role,
      displayName: account.displayName,
      email: account.email,
      company: account.company,
      phoneNumber: account.phoneNumber,
    });

    sessionsByLabel[account.label] = await signIn({
      apiKey,
      email: account.email,
      password,
      allowedOrigin,
    });
  }

  const results = [];
  const validationIssues = [];

  for (const account of matrixAccounts) {
    const session = sessionsByLabel[account.label]
      || (account.label === 'super_admin' && adminTokenOverride
        ? superAdminSession
        : await signIn({
            apiKey,
            email: account.email,
            password,
            allowedOrigin,
          }));
    const bootstrap = await getAccountBootstrap({
      apiBaseUrl,
      webBaseUrl: baseUrl,
      idToken: session.idToken,
    });
    const summary = summarizeBootstrap(account.label, bootstrap);
    const issues = validateSummary(summary);
    if (issues.length > 0) {
      validationIssues.push({
        label: account.label,
        email: account.email,
        issues,
      });
    }
    results.push({
      account: {
        label: account.label,
        email: account.email,
        expectedRole: account.role,
        password,
      },
      summary,
    });
  }

  const artifact = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    apiBaseUrl,
    accounts: results,
    validationIssues,
  };

  const artifactPath = await writeArtifact(
    path.join('output', 'qa', 'staging-role-matrix-20260329.json'),
    artifact
  );

  console.log(JSON.stringify({
    ok: validationIssues.length === 0,
    artifactPath,
    validationIssues,
    accounts: results.map((entry) => ({
      label: entry.account.label,
      email: entry.account.email,
      role: entry.summary.role,
      accessSource: entry.summary.accountAccessSource,
      sellerWorkspaceAccess: entry.summary.entitlement.sellerWorkspaceAccess,
      dealerOsAccess: entry.summary.entitlement.dealerOsAccess,
      billingLabel: entry.summary.entitlement.billingLabel,
    })),
  }, null, 2));

  assert(validationIssues.length === 0, 'Role matrix validation found mismatches.');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
