import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getGoogleAccessToken } from './google-auth-token.mjs';

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
const projectId = String(args.project || process.env.GCP_PROJECT_ID || '').trim();
const environment = String(args.env || process.env.DEPLOY_ENV || 'production').trim();
const input = path.resolve(String(args.input || `ops/monitoring/generated-alert-policies.${environment}.json`).trim());
const output = path.resolve(
  String(args.output || `ops/monitoring/applied-alert-policies.${environment}.json`).trim(),
);

if (!projectId) {
  console.error('Usage: node scripts/apply-alert-policies.mjs --project <gcp-project-id> [--env production] [--input file]');
  process.exit(1);
}

const rendered = JSON.parse(readFileSync(input, 'utf8'));
const policies = Array.isArray(rendered.policies) ? rendered.policies : [];

if (policies.length === 0) {
  console.error(`No policies found in ${input}`);
  process.exit(1);
}

const { accessToken, source } = await getGoogleAccessToken();
const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};

const baseUrl = `https://monitoring.googleapis.com/v3/projects/${projectId}/alertPolicies`;
const existingPolicies = [];
let nextPageToken = '';

do {
  const suffix = nextPageToken ? `?pageToken=${encodeURIComponent(nextPageToken)}` : '';
  const response = await requestJson(`${baseUrl}${suffix}`, { headers });
  existingPolicies.push(...(response.alertPolicies || []));
  nextPageToken = response.nextPageToken || '';
} while (nextPageToken);

const byDisplayName = new Map(existingPolicies.map((policy) => [policy.displayName, policy]));
const summary = {
  projectId,
  environment,
  authSource: source,
  created: [],
  replaced: [],
};

for (const policy of policies) {
  const existing = byDisplayName.get(policy.displayName);
  if (existing?.name) {
    await requestJson(`https://monitoring.googleapis.com/v3/${existing.name}`, {
      method: 'DELETE',
      headers,
    });
    summary.replaced.push(policy.displayName);
  }

  const created = await requestJson(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(policy),
  });

  summary.created.push({
    displayName: created.displayName,
    name: created.name,
  });
}

mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`Applied ${summary.created.length} alert policies to ${projectId} using ${source}. Summary: ${output}`);
