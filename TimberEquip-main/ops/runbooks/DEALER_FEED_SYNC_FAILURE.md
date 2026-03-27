# Dealer Feed Sync Failure Runbook

## Trigger

- dealer feed ingest fails
- nightly sync stops updating dealer inventory
- feed logs show repeated validation or parse errors

## Immediate checks

1. Open the Dealer Feed Manager and review the latest ingest log.
2. Check `dealerFeedIngestLogs` and relevant Cloud logs.
3. Determine whether the failure is:
   - source feed unavailable
   - auth/credential failure
   - schema validation failure
   - duplicate or reconciliation issue

## Containment

1. Do not retry blindly if the source payload shape changed.
2. If a bad ingest created incorrect listings, archive or correct them through lifecycle controls.
3. Notify the dealer if their source endpoint or credentials are the blocker.

## Recovery

1. Fix the source or parser issue.
2. Run a dry-run ingest first.
3. Run a scoped real ingest.
4. Validate:
   - expected listing count
   - images present
   - lifecycle state correct
   - public visibility correct

## Exit criteria

- the next ingest succeeds
- dealer inventory matches the source
- no unresolved ingest errors remain for the dealer
