import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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

const args = parseArgs(process.argv.slice(2));
const projectId = String(args.project || process.env.GCP_PROJECT_ID || '').trim();
const environment = String(args.env || process.env.DEPLOY_ENV || 'staging').trim();
const notificationChannel = String(args['notification-channel'] || process.env.MONITORING_NOTIFICATION_CHANNEL || '').trim();
const output = path.resolve(String(args.output || `ops/monitoring/generated-alert-policies.${environment}.json`).trim());

if (!projectId) {
  console.error('Usage: node scripts/render-alert-policies.mjs --project mobile-app-equipment-sales [--env staging] [--notification-channel channels/123]');
  process.exit(1);
}

const buildThresholdPolicy = (displayName, filter, documentationContent, thresholdValue = 1, duration = '300s') => ({
  displayName: `[${environment}] ${displayName}`,
  documentation: {
    content: documentationContent,
    mimeType: 'text/markdown',
  },
  conditions: [
    {
      displayName: `${displayName} condition`,
      conditionThreshold: {
        filter,
        comparison: 'COMPARISON_GT',
        duration,
        aggregations: [
          {
            alignmentPeriod: '300s',
            perSeriesAligner: 'ALIGN_RATE',
          },
        ],
        thresholdValue,
        trigger: {
          count: 1,
        },
      },
    },
  ],
  combiner: 'OR',
  enabled: true,
  notificationChannels: notificationChannel ? [notificationChannel] : [],
  alertStrategy: {
    autoClose: '1800s',
  },
  userLabels: {
    environment,
    service: 'timberequip',
  },
});

const buildLogPolicy = (displayName, filter, documentationContent) => ({
  displayName: `[${environment}] ${displayName}`,
  documentation: {
    content: documentationContent,
    mimeType: 'text/markdown',
  },
  conditions: [
    {
      displayName: `${displayName} log condition`,
      conditionMatchedLog: {
        filter,
      },
    },
  ],
  combiner: 'OR',
  enabled: true,
  notificationChannels: notificationChannel ? [notificationChannel] : [],
  alertStrategy: {
    autoClose: '1800s',
    notificationRateLimit: {
      period: '300s',
    },
  },
  userLabels: {
    environment,
    service: 'timberequip',
  },
});

const policies = [
  buildThresholdPolicy(
    'API error rate',
    `resource.type="cloud_run_revision" resource.labels.service_name="apiproxy" metric.type="run.googleapis.com/request_count" metric.labels.response_code_class="5xx"`,
    'Triggers when the production API proxy starts returning server errors. Start with `ops/runbooks/FIRESTORE_QUOTA_DEGRADATION.md` and `ops/runbooks/PRODUCTION_ROLLBACK.md`.',
    0.02
  ),
  buildThresholdPolicy(
    'Public SSR route failures',
    `resource.type="cloud_run_revision" resource.labels.service_name="publicpages" metric.type="run.googleapis.com/request_count" metric.labels.response_code_class="5xx"`,
    'Triggers when the public SSR surface begins failing. Check the public route smoke test and the production rollback runbook.',
    0.02
  ),
  buildLogPolicy(
    'Billing webhook failures',
    `resource.type="cloud_run_revision" resource.labels.service_name="apiproxy" logName="projects/${projectId}/logs/run.googleapis.com%2Fstderr" textPayload:"Stripe webhook" severity>=ERROR`,
    'Triggers when billing webhook processing begins erroring. Start with `ops/runbooks/BILLING_WEBHOOK_FAILURE.md`.'
  ),
  buildLogPolicy(
    'Admin mutation failures',
    `resource.type="cloud_run_revision" resource.labels.service_name="apiproxy" logName="projects/${projectId}/logs/run.googleapis.com%2Fstderr" textPayload:"Admin user request failed" severity>=ERROR`,
    'Triggers when admin account mutations start failing. Validate the admin API and recent entitlement changes before rolling back.'
  ),
  buildLogPolicy(
    'Firestore quota degradation',
    `resource.type="cloud_run_revision" logName="projects/${projectId}/logs/run.googleapis.com%2Fstderr" textPayload:"quota" severity>=WARNING`,
    'Triggers when Firestore quota exhaustion or degraded fallback behavior appears in the runtime logs. Use `ops/runbooks/FIRESTORE_QUOTA_DEGRADATION.md`.'
  ),
];

mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify({ policies }, null, 2)}\n`, 'utf8');
console.log(`Rendered ${policies.length} alert policies for ${projectId} to ${output}`);
