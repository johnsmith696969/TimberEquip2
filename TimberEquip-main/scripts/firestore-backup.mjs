import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const firebaseAppletConfigPath = path.join(repoRoot, 'firebase-applet-config.json');
const defaultLifecycleFile = path.join(repoRoot, 'ops', 'backups', 'firestore-backup-retention.30d.json');

function loadFirebaseAppletConfig() {
  if (!existsSync(firebaseAppletConfigPath)) return {};
  try {
    return JSON.parse(readFileSync(firebaseAppletConfigPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to parse firebase-applet-config.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseCliArgs(argv) {
  const parsed = {
    positionals: [],
    flags: new Map(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      parsed.positionals.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      parsed.flags.set(rawKey, inlineValue);
      continue;
    }

    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      parsed.flags.set(rawKey, 'true');
      continue;
    }

    parsed.flags.set(rawKey, nextToken);
    index += 1;
  }

  return parsed;
}

function normalizeBucketName(value) {
  return String(value || '').trim().replace(/^gs:\/\//i, '').replace(/\/+$/, '');
}

function requireValue(label, value) {
  if (String(value || '').trim()) return String(value).trim();
  throw new Error(`Missing required ${label}. Provide it with --${label} or the matching environment variable.`);
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
}

function getBackupOutputUri(bucket, prefix) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const normalizedPrefix = String(prefix || '').replace(/^\/+|\/+$/g, '');
  return `gs://${bucket}/${normalizedPrefix}/${year}/${month}/${day}/${timestamp}`;
}

function main() {
  const parsedArgs = parseCliArgs(process.argv.slice(2));
  const command = parsedArgs.positionals[0] || 'export';
  const firebaseAppletConfig = loadFirebaseAppletConfig();

  const projectId = String(
    parsedArgs.flags.get('project')
      || process.env.FIREBASE_PROJECT_ID
      || process.env.GOOGLE_CLOUD_PROJECT
      || firebaseAppletConfig.projectId
      || '',
  ).trim();

  const databaseId = String(
    parsedArgs.flags.get('database')
      || process.env.FIRESTORE_DATABASE_ID
      || firebaseAppletConfig.firestoreDatabaseId
      || '(default)',
  ).trim();

  const backupBucket = normalizeBucketName(
    parsedArgs.flags.get('bucket')
      || process.env.FIRESTORE_BACKUP_BUCKET
      || '',
  );

  const backupPrefix = String(
    parsedArgs.flags.get('prefix')
      || process.env.FIRESTORE_BACKUP_PREFIX
      || `firestore-backups/${projectId}/${databaseId}`,
  ).trim();

  const lifecycleFile = String(
    parsedArgs.flags.get('lifecycle-file')
      || process.env.FIRESTORE_BACKUP_LIFECYCLE_FILE
      || defaultLifecycleFile,
  ).trim();

  if (command === 'apply-retention') {
    requireValue('project', projectId);
    requireValue('bucket', backupBucket);

    if (!existsSync(lifecycleFile)) {
      throw new Error(`Lifecycle policy file not found: ${lifecycleFile}`);
    }

    runCommand('gcloud', [
      'storage',
      'buckets',
      'update',
      `gs://${backupBucket}`,
      `--lifecycle-file=${lifecycleFile}`,
      `--project=${projectId}`,
    ]);

    console.log(JSON.stringify({
      command: 'apply-retention',
      projectId,
      bucket: backupBucket,
      lifecycleFile,
    }, null, 2));
    return;
  }

  if (command === 'export') {
    requireValue('project', projectId);
    requireValue('bucket', backupBucket);

    const outputUri = getBackupOutputUri(backupBucket, backupPrefix);
    const exportArgs = [
      'firestore',
      'export',
      outputUri,
      `--project=${projectId}`,
      `--database=${databaseId}`,
      '--async',
    ];

    const collectionIds = String(
      parsedArgs.flags.get('collection-ids')
        || process.env.FIRESTORE_BACKUP_COLLECTION_IDS
        || '',
    ).trim();
    if (collectionIds) {
      exportArgs.push(`--collection-ids=${collectionIds}`);
    }

    const snapshotTime = String(
      parsedArgs.flags.get('snapshot-time')
        || process.env.FIRESTORE_BACKUP_SNAPSHOT_TIME
        || '',
    ).trim();
    if (snapshotTime) {
      exportArgs.push(`--snapshot-time=${snapshotTime}`);
    }

    runCommand('gcloud', exportArgs);

    console.log(JSON.stringify({
      command: 'export',
      projectId,
      databaseId,
      outputUri,
      collectionIds: collectionIds || null,
      snapshotTime: snapshotTime || null,
      startedAt: new Date().toISOString(),
    }, null, 2));
    return;
  }

  throw new Error(`Unsupported command "${command}". Use "export" or "apply-retention".`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
