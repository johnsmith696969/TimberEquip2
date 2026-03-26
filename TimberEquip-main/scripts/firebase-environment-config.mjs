import fs from 'node:fs';
import path from 'node:path';

export const VALID_ENVIRONMENTS = new Set(['preview', 'staging', 'production']);

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
