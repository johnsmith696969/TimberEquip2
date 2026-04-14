/**
 * One-time script: Provision Red Pine Equipment Pro Dealer account.
 *
 * Run from the project root:
 *   node scripts/provision-red-pine.mjs
 *
 * Uses the Firebase CLI's stored OAuth token (from `firebase login`).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ---------- config ----------
const PROJECT_ID = 'mobile-app-equipment-sales';
const EMAIL = 'info@redpineequipment.com';
const PASSWORD = process.env.PROVISION_PASSWORD || '';
if (!PASSWORD || PASSWORD.length < 8) {
  console.error('ERROR: Set PROVISION_PASSWORD environment variable (min 8 characters).');
  process.exit(1);
}
const DISPLAY_NAME = 'Red Pine Equipment';
const COMPANY = 'Red Pine Equipment';
const LOCATION = '4335 Kingston Rd, Duluth, MN 55803';
const PLAN_ID = 'fleet_dealer';
const ROLE = 'pro_dealer';
const LISTING_CAP = 99999;
const PERIOD_END = '2200-01-01T00:00:00.000Z';
// -----------------------------

// Read Firebase CLI credentials
const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const clientId = config.tokens.client_id || process.env.FIREBASE_CLIENT_ID || '';
const clientSecret = config.tokens.client_secret || process.env.FIREBASE_CLIENT_SECRET || '';
if (!clientId || !clientSecret) {
  console.error('ERROR: OAuth credentials not found. Set FIREBASE_CLIENT_ID and FIREBASE_CLIENT_SECRET env vars or ensure Firebase CLI is logged in.');
  process.exit(1);
}
const refreshToken = config.tokens.refresh_token;

// Exchange refresh token for an access token
async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data));
  return data.access_token;
}

// Create or get Firebase Auth user via Identity Toolkit Admin API
async function createOrGetUser(token) {
  // First, try to look up the user by email
  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: [EMAIL] }),
    }
  );
  const lookupData = await lookupRes.json();

  if (lookupData.users && lookupData.users.length > 0) {
    const uid = lookupData.users[0].localId;
    console.log(`Auth user already exists: ${uid}`);
    return uid;
  }

  // Create the user
  const createRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      }),
    }
  );
  const createData = await createRes.json();
  if (createData.error) throw new Error('Create user failed: ' + JSON.stringify(createData.error));
  const uid = createData.localId;
  console.log(`Created auth user: ${uid}`);
  return uid;
}

// Write Firestore user profile via REST API
async function writeFirestoreProfile(token, uid) {
  const now = new Date().toISOString();
  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;

  // Build the Firestore document fields
  const fields = {
    uid: { stringValue: uid },
    email: { stringValue: EMAIL },
    displayName: { stringValue: DISPLAY_NAME },
    company: { stringValue: COMPANY },
    location: { stringValue: LOCATION },
    role: { stringValue: ROLE },
    emailVerified: { booleanValue: true },
    accountStatus: { stringValue: 'active' },
    accountAccessSource: { stringValue: 'admin_override' },
    onboardingIntent: { stringValue: PLAN_ID },
    activeSubscriptionPlanId: { stringValue: PLAN_ID },
    subscriptionStatus: { stringValue: 'active' },
    listingCap: { integerValue: String(LISTING_CAP) },
    managedAccountCap: { integerValue: '10' },
    currentPeriodEnd: { stringValue: PERIOD_END },
    subscriptionStartDate: { stringValue: now },
    storefrontEnabled: { booleanValue: true },
    storefrontName: { stringValue: DISPLAY_NAME },
    storefrontSlug: { stringValue: 'red-pine-equipment' },
    favorites: { arrayValue: { values: [] } },
    createdAt: { timestampValue: now },
    updatedAt: { timestampValue: now },
  };

  // PATCH with updateMask to merge (like set with merge: true)
  const allFieldPaths = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const patchUrl = `${docUrl}?${allFieldPaths}`;

  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  const data = await res.json();
  if (data.error) throw new Error('Firestore write failed: ' + JSON.stringify(data.error));
  console.log(`Firestore profile written for ${uid}`);
}

async function setAuthClaims(token, uid) {
  const claims = {
    role: ROLE,
    subscriptionPlanId: PLAN_ID,
    subscriptionStatus: 'active',
    listingCap: LISTING_CAP,
    managedAccountCap: 10,
    accountAccessSource: 'admin_override',
    accountStatus: 'active',
  };

  const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:update', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      localId: uid,
      targetProjectId: PROJECT_ID,
      displayName: DISPLAY_NAME,
      emailVerified: true,
      customAttributes: JSON.stringify(claims),
      validSince: String(Math.floor(Date.now() / 1000)),
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error('Set auth claims failed: ' + JSON.stringify(data.error));
  console.log(`Auth claims updated for ${uid}`);
}

async function writeStorefrontProfile(token, uid) {
  const now = new Date().toISOString();
  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/storefronts/${uid}`;
  const fields = {
    uid: { stringValue: uid },
    role: { stringValue: ROLE },
    storefrontEnabled: { booleanValue: true },
    storefrontSlug: { stringValue: 'red-pine-equipment' },
    canonicalPath: { stringValue: '/seller/red-pine-equipment' },
    displayName: { stringValue: DISPLAY_NAME },
    storefrontName: { stringValue: DISPLAY_NAME },
    storefrontTagline: { stringValue: 'Pro dealer storefront powered by DealerOS.' },
    storefrontDescription: { stringValue: `Browse forestry and logging equipment from ${DISPLAY_NAME} in ${LOCATION}.` },
    location: { stringValue: LOCATION },
    email: { stringValue: EMAIL },
    seoTitle: { stringValue: `${DISPLAY_NAME} | Pro Dealer on Forestry Equipment Sales` },
    seoDescription: { stringValue: `Browse forestry and logging equipment from ${DISPLAY_NAME} in ${LOCATION}. Verified pro dealer on Forestry Equipment Sales.` },
    seoKeywords: {
      arrayValue: {
        values: [
          { stringValue: DISPLAY_NAME },
          { stringValue: 'forestry equipment' },
          { stringValue: 'logging equipment' },
          { stringValue: 'used logging equipment' },
          { stringValue: 'dealer storefront' },
          { stringValue: 'pro dealer' },
        ],
      },
    },
    createdAt: { timestampValue: now },
    updatedAt: { timestampValue: now },
  };

  const allFieldPaths = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const patchUrl = `${docUrl}?${allFieldPaths}`;

  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  const data = await res.json();
  if (data.error) throw new Error('Storefront write failed: ' + JSON.stringify(data.error));
  console.log(`Storefront profile written for ${uid}`);
}

async function main() {
  console.log('Getting access token from Firebase CLI credentials...');
  const token = await getAccessToken();
  console.log('Access token obtained.');

  const uid = await createOrGetUser(token);
  await setAuthClaims(token, uid);
  await writeFirestoreProfile(token, uid);
  await writeStorefrontProfile(token, uid);

  console.log('');
  console.log('Account details:');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: [set via PROVISION_PASSWORD env var]`);
  console.log(`  Role:     ${ROLE} (Pro Dealer)`);
  console.log(`  Cap:      ${LISTING_CAP} listings`);
  console.log(`  Expires:  ${PERIOD_END}`);
  console.log(`  Access:   admin_override (no Stripe required)`);
}

main().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
