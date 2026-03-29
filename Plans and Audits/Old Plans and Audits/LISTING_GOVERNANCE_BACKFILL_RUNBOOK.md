# Listing Governance Backfill Runbook

Last updated: 2026-03-26

## Purpose

This runbook backfills `listingAuditReports`, `listingMediaAudit`, and optional synthetic initialization rows in `listingStateTransitions` for the current Firestore catalog.

Use this after deploying the governance shadow writer so legacy inventory is brought up to the same audit standard as future listing writes.

## Safety Model

- default mode is dry-run
- no writes happen unless `--write` is passed
- initialization transition records are skipped by default to avoid polluting historical transition history
- summary output can be written to a JSON file for operator review

## Commands

### Dry run

```bash
node scripts/backfill-listing-governance.cjs --page-size 200 --output output/listing-governance-backfill-dry-run.json
```

### Limited write test

```bash
node scripts/backfill-listing-governance.cjs --write --limit 25 --page-size 25 --output output/listing-governance-backfill-sample.json
```

### Full write

```bash
node scripts/backfill-listing-governance.cjs --write --page-size 200 --output output/listing-governance-backfill-full.json
```

### Optional synthetic initialization transitions

Only use this if you explicitly want append-only initialization rows for legacy listings.

```bash
node scripts/backfill-listing-governance.cjs --write --emit-initialization-transitions
```

## Output Summary

The script prints and optionally writes a JSON summary including:

- `processed`
- `wroteArtifacts`
- `wroteTransitions`
- `anomalyListings`
- `anomalyHistogram`
- `lifecycleHistogram`
- `publicListings`
- `missingPrimaryImage`

## Recommended Production Sequence

1. Deploy the current governance shadow trigger.
2. Run the dry-run command and inspect the anomaly histogram.
3. Run a limited write test against a small sample.
4. Inspect `listingAuditReports` and `listingMediaAudit` in Firestore.
5. Run the full write once satisfied with the sample.
6. Save the JSON summary as the first governance backfill report.

## Operational Notes

- The script uses the named Firestore database id already used by Firebase Functions.
- The script expects Google Application Default Credentials for Admin SDK access when run locally.
- Override the database id only if you intentionally need a different target:

```bash
FIRESTORE_DB_ID=your-database-id node scripts/backfill-listing-governance.cjs
```

- Typical local setup:

```bash
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
$env:GOOGLE_CLOUD_PROJECT="mobile-app-equipment-sales"
node scripts/backfill-listing-governance.cjs --limit 10
```

- The script reads listings ordered by document id and processes them in pages.
- The script is designed for one operator-run migration pass, not continuous cron usage.
