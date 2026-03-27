# Firestore Quota Degradation Runbook

## Trigger

- Firestore free-tier or read quota exhaustion
- admin/profile/billing endpoints falling into degraded mode
- logs contain `RESOURCE_EXHAUSTED` or quota warnings

## Immediate checks

1. Confirm the affected database and project.
2. Identify the user-facing surfaces now degraded:
   - profile/account loads
   - admin directory
   - seller billing state
   - marketplace stats
3. Check whether read-model or auth-claim fallback paths are still healthy.

## Containment

1. Avoid introducing new read-heavy operations.
2. Prefer auth/custom-claim or cached/read-model sources for trust-critical paths.
3. If needed, temporarily pause nonessential backfills or scans.

## Recovery

1. Wait for daily quota reset if the issue is temporary and noncritical.
2. Reduce or remove the read-heavy query causing the spike.
3. Shift the affected path onto:
   - cached read model
   - SSR artifact
   - auth/custom claims
   - the next staged data-platform component

## Validation

1. Re-run smoke tests and one admin mutation.
2. Re-check seller subscription summary and listing visibility.
3. Confirm warnings clear from runtime logs.

## Exit criteria

- no trust-critical path hard-fails due to quota pressure
- degraded fallback behavior is either removed or documented and monitored
