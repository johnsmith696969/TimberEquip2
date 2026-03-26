import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VALID_ENVIRONMENTS,
  normalizeEnvironment,
  parseArgs,
  readFirebaseRc,
  resolveProjectId,
} from './firebase-environment-config.mjs';

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const args = parseArgs(process.argv.slice(2));
const environment = normalizeEnvironment(args.env || args._[0] || process.env.FIREBASE_ENVIRONMENT);
const requireSmoke = args['require-smoke'] === true || process.env.REQUIRE_SMOKE_BASE_URL === 'true';
const requirePreviewChannel = args['require-preview-channel'] === true || process.env.REQUIRE_PREVIEW_CHANNEL === 'true';

if (!VALID_ENVIRONMENTS.has(environment)) {
  console.error('Usage: node scripts/validate-deploy-config.mjs --env <preview|staging|production> [--require-smoke] [--require-preview-channel]');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const aliases = readFirebaseRc(rootDir);

let projectResolution;
try {
  projectResolution = resolveProjectId(environment, aliases);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (requireSmoke) {
  const smokeBaseUrl = String(process.env.SMOKE_BASE_URL || '').trim();
  if (!smokeBaseUrl) {
    console.error('SMOKE_BASE_URL is required for this validation run.');
    process.exit(1);
  }

  if (!isValidHttpUrl(smokeBaseUrl)) {
    console.error(`SMOKE_BASE_URL must be a valid http or https URL. Received: ${smokeBaseUrl}`);
    process.exit(1);
  }
}

if (environment === 'preview' && requirePreviewChannel) {
  const previewChannel = String(process.env.FIREBASE_PREVIEW_CHANNEL || '').trim();
  if (!previewChannel) {
    console.error('FIREBASE_PREVIEW_CHANNEL is required for preview validation.');
    process.exit(1);
  }
}

console.log(`Validated ${environment} config`);
console.log(`Project: ${projectResolution.projectId} (${projectResolution.source})`);
if (requireSmoke) {
  console.log(`Smoke URL: ${process.env.SMOKE_BASE_URL}`);
}
