import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_TOKEN_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const FIREBASE_CLIENT_ID = process.env.FIREBASE_CLIENT_ID || '';
const FIREBASE_CLIENT_SECRET = process.env.FIREBASE_CLIENT_SECRET || '';

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '');
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function resolveFirebaseToolsConfigPath() {
  const candidates = [
    path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json'),
    path.join(process.env.APPDATA || '', 'configstore', 'firebase-tools.json'),
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function getFirebaseCliTokens() {
  const configPath = resolveFirebaseToolsConfigPath();
  if (!configPath) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const tokens = parsed?.tokens;
  if (!tokens) {
    return null;
  }

  return {
    configPath,
    parsed,
    tokens,
  };
}

function getValidFirebaseCliAccessToken() {
  const state = getFirebaseCliTokens();
  if (!state) {
    return null;
  }

  const accessToken = state.tokens.access_token;
  const expiresAt = Number(state.tokens.expires_at || 0);

  if (!accessToken || !expiresAt) {
    return null;
  }

  const now = Date.now();
  if (expiresAt <= now + 60_000) {
    return null;
  }

  return accessToken;
}

async function refreshFirebaseCliAccessToken(scope) {
  const state = getFirebaseCliTokens();
  const refreshToken = state?.tokens?.refresh_token;

  if (!state || !refreshToken) {
    return null;
  }

  const response = await requestJson('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.FIREBASE_CLIENT_ID || FIREBASE_CLIENT_ID,
      client_secret: process.env.FIREBASE_CLIENT_SECRET || FIREBASE_CLIENT_SECRET,
      grant_type: 'refresh_token',
      scope,
    }),
  });

  const expiresIn = Number(response.expires_in || 3600);
  const refreshedTokens = {
    ...state.tokens,
    ...response,
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
    scopes: scope.split(' '),
  };

  const nextParsed = {
    ...state.parsed,
    tokens: refreshedTokens,
  };

  fs.writeFileSync(state.configPath, `${JSON.stringify(nextParsed, null, 2)}\n`, 'utf8');
  return refreshedTokens.access_token || null;
}

async function getServiceAccountAccessToken(scope) {
  const credentialsPath = String(process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (!credentialsPath) {
    return null;
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(`Service account file at ${credentialsPath} is missing client_email or private_key.`);
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';
  const audience = tokenUri;
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope,
    aud: audience,
    iat: issuedAt,
    exp: expiresAt,
  };

  const unsignedJwt = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsignedJwt).sign(credentials.private_key);
  const assertion = `${unsignedJwt}.${encodeBase64Url(signature)}`;

  const response = await requestJson(tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  return response.access_token || null;
}

export async function getGoogleAccessToken(scope = DEFAULT_TOKEN_SCOPE) {
  const serviceAccountToken = await getServiceAccountAccessToken(scope);
  if (serviceAccountToken) {
    return {
      accessToken: serviceAccountToken,
      source: 'service-account',
    };
  }

  const firebaseCliToken = getValidFirebaseCliAccessToken();
  if (firebaseCliToken) {
    return {
      accessToken: firebaseCliToken,
      source: 'firebase-cli',
    };
  }

  const refreshedFirebaseCliToken = await refreshFirebaseCliAccessToken(scope);
  if (refreshedFirebaseCliToken) {
    return {
      accessToken: refreshedFirebaseCliToken,
      source: 'firebase-cli-refresh',
    };
  }

  throw new Error(
    'Unable to resolve a Google access token. Set GOOGLE_APPLICATION_CREDENTIALS or refresh the Firebase CLI login.',
  );
}
