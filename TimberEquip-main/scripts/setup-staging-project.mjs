import { getGoogleAccessToken } from './google-auth-token.mjs';

const STAGING_PROJECT_ID = 'timberequip-staging';
const STAGING_DATABASE_LOCATION = 'nam5';
const CORE_SERVICES = [
  'firestore.googleapis.com',
  'monitoring.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'serviceusage.googleapis.com',
];

function parseArgs(argv) {
  const parsed = { _: [] };

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

async function requestJson(url, options, allow404 = false) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    if (allow404 && response.status === 404) {
      return null;
    }

    throw new Error(`Request to ${url} failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

const args = parseArgs(process.argv.slice(2));
const projectId = String(args.project || STAGING_PROJECT_ID).trim();
const location = String(args.location || STAGING_DATABASE_LOCATION).trim();
const services = String(args.services || CORE_SERVICES.join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const { accessToken, source } = await getGoogleAccessToken();
const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};

for (const serviceName of services) {
  const response = await requestJson(
    `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${serviceName}:enable`,
    {
      method: 'POST',
      headers,
      body: '{}',
    },
  );

  if (response.name) {
    console.log(`Enabled request submitted for ${serviceName}: ${response.name}`);
  } else {
    console.log(`Enabled ${serviceName}`);
  }
}

const databasesResponse = await requestJson(
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases`,
  { headers },
  true,
);

const defaultDatabaseExists = Boolean(
  databasesResponse?.databases?.some((database) => database.name?.endsWith('/databases/(default)')),
);

if (!defaultDatabaseExists) {
  console.log(`Creating Firestore default database for ${projectId} in ${location}`);
  await requestJson(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=${encodeURIComponent('(default)')}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        locationId: location,
        type: 'FIRESTORE_NATIVE',
        deleteProtectionState: 'DELETE_PROTECTION_ENABLED',
        pointInTimeRecoveryEnablement: 'POINT_IN_TIME_RECOVERY_DISABLED',
      }),
    },
  );
} else {
  console.log(`Firestore default database already exists for ${projectId}`);
}

console.log(`Staging setup completed for ${projectId} using ${source}.`);
