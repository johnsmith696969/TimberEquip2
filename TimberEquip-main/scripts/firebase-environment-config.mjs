import fs from 'node:fs';
import path from 'node:path';

export const VALID_ENVIRONMENTS = new Set(['preview', 'staging', 'production']);
export const DEFAULT_FIRESTORE_DATABASE_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';

const FIREBASE_CLIENT_CONFIGS = Object.freeze({
  production: Object.freeze({
    projectId: 'mobile-app-equipment-sales',
    appId: '1:547811102681:web:3065d1745c6b8dac4993c8',
    authDomain: 'mobile-app-equipment-sales.firebaseapp.com',
    firestoreDatabaseId: DEFAULT_FIRESTORE_DATABASE_ID,
    storageBucket: 'mobile-app-equipment-sales.firebasestorage.app',
    messagingSenderId: '547811102681',
    measurementId: '',
  }),
  staging: Object.freeze({
    projectId: 'timberequip-staging',
    appId: '1:252674789146:web:7ef151827eb55ef90aa6a3',
    authDomain: 'timberequip-staging.firebaseapp.com',
    firestoreDatabaseId: '(default)',
    storageBucket: 'timberequip-staging.firebasestorage.app',
    messagingSenderId: '252674789146',
    measurementId: '',
  }),
});

export function parseArgs(argv) {
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

export function normalizeEnvironment(value) {
  return String(value || '').trim().toLowerCase();
}

export function resolveFirebaseClientEnvironment(environment) {
  return environment === 'preview' ? 'staging' : environment;
}

export function resolveFirebaseClientConfig(environment) {
  const normalizedEnvironment = resolveFirebaseClientEnvironment(normalizeEnvironment(environment));
  const config = FIREBASE_CLIENT_CONFIGS[normalizedEnvironment];

  if (!config) {
    throw new Error(`No Firebase client config is defined for "${environment}".`);
  }

  return {
    ...config,
  };
}

function readFirebaseWebConfigLocal(rootDir) {
  const localConfigPath = path.join(rootDir, '.firebase-web-config.local.json');

  if (!fs.existsSync(localConfigPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read .firebase-web-config.local.json: ${error.message}`);
  }
}

export function resolveFirebaseWebApiKey(environment, rootDir) {
  const normalizedEnvironment = resolveFirebaseClientEnvironment(normalizeEnvironment(environment));
  const upperEnvironment = normalizedEnvironment.toUpperCase();
  const envKeys = [
    `FIREBASE_WEB_API_KEY_${upperEnvironment}`,
    `VITE_FIREBASE_API_KEY_${upperEnvironment}`,
    'FIREBASE_WEB_API_KEY',
    'VITE_FIREBASE_API_KEY',
  ];

  for (const envKey of envKeys) {
    const value = process.env[envKey];
    if (value && value.trim()) {
      return {
        apiKey: value.trim(),
        source: `env:${envKey}`,
      };
    }
  }

  const localConfig = readFirebaseWebConfigLocal(rootDir);
  const localValue = String(localConfig?.[normalizedEnvironment]?.apiKey || '').trim();
  if (localValue) {
    return {
      apiKey: localValue,
      source: `.firebase-web-config.local.json:${normalizedEnvironment}`,
    };
  }

  throw new Error(
    `No Firebase web API key configured for "${environment}". Set FIREBASE_WEB_API_KEY_${upperEnvironment}, VITE_FIREBASE_API_KEY_${upperEnvironment}, FIREBASE_WEB_API_KEY, VITE_FIREBASE_API_KEY, or add ${normalizedEnvironment}.apiKey to .firebase-web-config.local.json.`,
  );
}

export function readFirebaseRc(rootDir) {
  const firebaseRcPath = path.join(rootDir, '.firebaserc');

  if (!fs.existsSync(firebaseRcPath)) {
    return {};
  }

  try {
    const contents = fs.readFileSync(firebaseRcPath, 'utf8');
    const parsed = JSON.parse(contents);
    return parsed.projects || {};
  } catch (error) {
    throw new Error(`Unable to read .firebaserc: ${error.message}`);
  }
}

export function resolveProjectId(environment, aliases) {
  const upperEnvironment = environment.toUpperCase();
  const preferredEnvKeys = [
    `FIREBASE_PROJECT_ID_${upperEnvironment}`,
    'FIREBASE_PROJECT_ID',
  ];

  for (const envKey of preferredEnvKeys) {
    const value = process.env[envKey];
    if (value && value.trim()) {
      return {
        projectId: value.trim(),
        source: `env:${envKey}`,
      };
    }
  }

  if (aliases[environment]) {
    return {
      projectId: aliases[environment],
      source: `.firebaserc:${environment}`,
    };
  }

  if (environment === 'production' && aliases.production) {
    return {
      projectId: aliases.production,
      source: '.firebaserc:production',
    };
  }

  if (environment === 'production' && aliases.default) {
    return {
      projectId: aliases.default,
      source: '.firebaserc:default',
    };
  }

  if (environment === 'preview' && aliases.preview) {
    return {
      projectId: aliases.preview,
      source: '.firebaserc:preview',
    };
  }

  if ((environment === 'preview' || environment === 'staging') && aliases.staging) {
    return {
      projectId: aliases.staging,
      source: '.firebaserc:staging',
    };
  }

  throw new Error(
    `No Firebase project ID configured for "${environment}". Set FIREBASE_PROJECT_ID_${upperEnvironment}, FIREBASE_PROJECT_ID, or add the alias to .firebaserc.`,
  );
}
