# Firestore Backup And Restore

## Purpose

This runbook defines the TimberEquip baseline backup posture for Firestore:

- daily managed exports to Cloud Storage
- 30-day retention on the dedicated backup bucket
- a documented restore path for emergency recovery and drills

## Repo Assets

- workflow: `.github/workflows/firestore-backup.yml`
- export script: `scripts/firestore-backup.mjs`
- retention policy: `ops/backups/firestore-backup-retention.30d.json`

## Preconditions

1. Use a dedicated Cloud Storage bucket for Firestore exports.
2. Enable billing on the target project.
3. Grant the Firestore import/export identity write access to the backup bucket.
4. Set GitHub Environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIRESTORE_BACKUP_BUCKET`
   - `FIRESTORE_DATABASE_ID`
5. Keep `FIREBASE_SERVICE_ACCOUNT` available in the production environment.

## IAM Guidance

Grant the Firestore import/export service identity:

- `Cloud Datastore Import Export Admin`
- `Storage Admin` on the backup bucket

The scheduled GitHub workflow also needs a deploy/service credential that can:

- authenticate to the target project
- update the bucket lifecycle policy
- start Firestore export operations

## Backup Schedule

The repo workflow is scheduled daily:

- `.github/workflows/firestore-backup.yml`

It performs:

1. configuration guard
2. lifecycle policy application
3. async Firestore export start

## Manual Export

```bash
npm run ops:firestore:backup
```

Environment variables:

- `FIREBASE_PROJECT_ID`
- `FIRESTORE_BACKUP_BUCKET`
- `FIRESTORE_DATABASE_ID`

Optional:

- `FIRESTORE_BACKUP_PREFIX`
- `FIRESTORE_BACKUP_COLLECTION_IDS`
- `FIRESTORE_BACKUP_SNAPSHOT_TIME`

## Manual Retention Policy Apply

```bash
npm run ops:firestore:backup:apply-retention
```

This applies `ops/backups/firestore-backup-retention.30d.json` to the configured bucket.

## Validate Backup Execution

1. Check the GitHub Actions run history for `Firestore Backup`.
2. Confirm the workflow reached the export step without auth or bucket errors.
3. Verify a new export prefix exists in the bucket.
4. Confirm Firestore export operations show success in Google Cloud.

## Restore Procedure

1. Pause writes if the incident requires point-in-time consistency.
2. Identify the target export in the backup bucket.
3. Confirm the destination database and blast radius.
4. Run a restore into staging first when possible.
5. Validate:
   - critical public routes
   - one seller account flow
   - one admin workflow
   - billing/account bootstrap
6. Only then restore into production if required.

Example import command:

```bash
gcloud firestore import gs://YOUR_BACKUP_BUCKET/firestore-backups/YOUR_PROJECT/YOUR_DATABASE/YYYY/MM/DD/TIMESTAMP \
  --project=YOUR_PROJECT_ID \
  --database=YOUR_DATABASE_ID
```

## Exit Criteria

- latest daily export exists
- retention policy is applied
- restore path is documented and drill-ready
- backup bucket contains no older-than-policy data once retention has aged in
