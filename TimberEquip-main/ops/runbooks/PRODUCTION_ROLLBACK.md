# Production Rollback Runbook

## Trigger

- smoke tests fail after deploy
- public routes or admin mutations regress
- billing or listing visibility correctness is broken

## Immediate checks

1. Identify blast radius:
   - Hosting only
   - Functions only
   - Rules only
   - mixed deploy
2. Check the failed release commit and deployment job logs.
3. Confirm whether the issue reproduces on production only or also on staging.

## Rollback options

### Hosting rollback

1. Identify the previous stable Hosting release.
2. Redeploy or clone the previous version.

### Functions rollback

1. Identify the last stable function revision or commit.
2. Redeploy only the affected function set.

### Rules rollback

1. Restore the last known-good `firestore.rules` revision.
2. Redeploy rules only.

## Validation after rollback

1. Run the route smoke test.
2. Validate one admin flow.
3. Validate one seller billing flow if the release touched subscriptions.
4. Confirm error rate returns to baseline.

## Exit criteria

- smoke tests pass
- critical user/admin paths recover
- rollback details are recorded in release notes and incident notes
