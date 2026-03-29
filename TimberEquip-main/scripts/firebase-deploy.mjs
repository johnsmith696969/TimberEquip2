import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  VALID_ENVIRONMENTS,
  normalizeEnvironment,
  parseArgs,
  readFirebaseRc,
  resolveProjectId,
} from './firebase-environment-config.mjs';

function getBinaryName(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function quoteWindowsArg(value) {
  const stringValue = String(value);

  if (!/[ \t"&()<>^|]/u.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/gu, '""')}"`;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const useCmdShim = process.platform === 'win32' && /\.cmd$/iu.test(command);
    const spawnCommand = useCmdShim ? (process.env.ComSpec || 'cmd.exe') : command;
    const spawnArgs = useCmdShim ? ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')] : args;

    const child = spawn(spawnCommand, spawnArgs, {
      cwd: options.cwd,
      env: options.env || process.env,
      stdio: 'inherit',
      shell: false,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

const args = parseArgs(process.argv.slice(2));
const environment = normalizeEnvironment(args.env || process.env.FIREBASE_ENVIRONMENT);

if (!VALID_ENVIRONMENTS.has(environment)) {
  console.error('Usage: node scripts/firebase-deploy.mjs --env <preview|staging|production> [--scope hosting,functions,firestore:rules] [--channel <id>] [--expires 7d] [--ci]');
  process.exit(1);
}

if (environment === 'production' && !args.ci && process.env.ALLOW_PRODUCTION_DEPLOY !== 'true') {
  console.error('Production deploys require ALLOW_PRODUCTION_DEPLOY=true outside CI.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const aliases = readFirebaseRc(rootDir);
const { projectId } = resolveProjectId(environment, aliases);
const scope = String(
  args.scope ||
  process.env.FIREBASE_DEPLOY_SCOPE ||
  process.env.npm_config_scope ||
  'hosting,functions,firestore:rules',
).trim();
const requestedSeoMode = String(
  args['seo-mode'] ||
  process.env.FIREBASE_SEO_MODE ||
  process.env.SEO_MODE ||
  '',
).trim().toLowerCase();
const seoMode = ['indexable', 'noindex'].includes(requestedSeoMode)
  ? requestedSeoMode
  : environment === 'production'
    ? 'indexable'
    : 'noindex';

console.log(`Preparing ${environment} deploy for Firebase project ${projectId}`);
await runCommand(
  process.execPath,
  [path.join(rootDir, 'scripts', 'run-seo-command.mjs'), seoMode, 'npm', 'run', 'build'],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      FIREBASE_ENVIRONMENT: environment,
    },
  },
);

if (environment === 'preview') {
  const channelId = String(args.channel || process.env.FIREBASE_PREVIEW_CHANNEL || '').trim();
  const expires = String(args.expires || process.env.FIREBASE_PREVIEW_EXPIRES || '7d').trim();

  if (!channelId) {
    console.error('Preview deploys require FIREBASE_PREVIEW_CHANNEL or --channel.');
    process.exit(1);
  }

  await runCommand(
    getBinaryName('npx'),
    [
      'firebase-tools',
      'hosting:channel:deploy',
      channelId,
      '--project',
      projectId,
      '--expires',
      expires,
    ],
    { cwd: rootDir },
  );

  process.exit(0);
}

await runCommand(
  getBinaryName('npx'),
  [
    'firebase-tools',
    'deploy',
    '--project',
    projectId,
    '--only',
    scope,
  ],
  { cwd: rootDir },
);
