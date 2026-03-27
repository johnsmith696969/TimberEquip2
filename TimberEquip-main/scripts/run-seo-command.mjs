import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  normalizeEnvironment,
  resolveFirebaseClientConfig,
} from './firebase-environment-config.mjs';

const [, , mode, ...commandParts] = process.argv;

if (!['indexable', 'noindex'].includes(mode || '')) {
  console.error('Usage: node scripts/run-seo-command.mjs <indexable|noindex> <command...>');
  process.exit(1);
}

if (!commandParts.length) {
  console.error('A command is required after the mode.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const allowIndexing = mode === 'indexable' ? 'true' : 'false';
const firebaseEnvironment = normalizeEnvironment(process.env.FIREBASE_ENVIRONMENT || '') || (mode === 'indexable' ? 'production' : 'staging');
const firebaseClientConfig = resolveFirebaseClientConfig(firebaseEnvironment);

process.env.ALLOW_INDEXING = allowIndexing;
process.env.VITE_ALLOW_INDEXING = allowIndexing;
process.env.FIREBASE_ENVIRONMENT = firebaseEnvironment;
process.env.VITE_FIREBASE_API_KEY = firebaseClientConfig.apiKey;
process.env.VITE_FIREBASE_PROJECT_ID = firebaseClientConfig.projectId;
process.env.VITE_FIREBASE_APP_ID = firebaseClientConfig.appId;
process.env.VITE_FIREBASE_AUTH_DOMAIN = firebaseClientConfig.authDomain;
process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID = firebaseClientConfig.firestoreDatabaseId;
process.env.VITE_FIREBASE_STORAGE_BUCKET = firebaseClientConfig.storageBucket;
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = firebaseClientConfig.messagingSenderId;
process.env.VITE_FIREBASE_MEASUREMENT_ID = firebaseClientConfig.measurementId;

await import(pathToFileURL(path.join(rootDir, 'scripts', 'prepare-seo-mode.mjs')).href);

const command = commandParts.join(' ');
const child = spawn(command, {
  cwd: rootDir,
  env: process.env,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
