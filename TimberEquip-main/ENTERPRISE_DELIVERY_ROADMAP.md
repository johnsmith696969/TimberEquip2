# TimberEquip Enterprise Delivery Roadmap

Last updated: 2026-03-26

Reference plans:

- [ENTERPRISE_DATA_PLATFORM_PLAN.md](./ENTERPRISE_DATA_PLATFORM_PLAN.md)
- [ENTERPRISE_SEO_ARCHITECTURE_PLAN.md](./ENTERPRISE_SEO_ARCHITECTURE_PLAN.md)
- [EXECUTION_CHECKLIST.md](./EXECUTION_CHECKLIST.md)

## Purpose

This roadmap ranks the highest-leverage delivery and operations changes needed to turn TimberEquip into a safer enterprise platform without stalling product progress.

The point is not to "enterprise-wash" the repo. The point is to remove operational fragility in the order that most reduces business risk.

## Ranked Priorities

### 1. Environment isolation and gated deploys

Why first:

- the current repo is still too easy to deploy straight to production
- production changes are not formally promoted from a safer environment
- SEO, billing, functions, and rules changes need a controlled release path

Target state:

- dedicated Firebase projects for `preview`, `staging`, and `production`
- GitHub Actions verifies every pull request
- pull requests get preview URLs from Firebase Hosting preview channels
- `main` auto-promotes to `staging`
- `production` deploys are manual and protected by GitHub Environment approval
- every deploy finishes with route smoke tests

Status:

- in progress in this slice

### 2. Release observability and rollback discipline

Why next:

- gated deploys are only half the story
- operators need to know whether a release damaged public routes, APIs, or dealer workflows

Target state:

- structured deploy logs
- route smoke tests on `preview`, `staging`, and `production`
- Cloud Monitoring alerts for error rate and latency
- rollback runbook for Hosting and Functions
- release notes tied to commits and deployment jobs

### 3. Least-privilege deployment identities

Why next:

- enterprise delivery should not depend on broad, long-lived credentials
- each environment should use its own deployment identity

Target state:

- separate deployment service accounts for `preview`, `staging`, and `production`
- GitHub Environment-scoped secrets or Workload Identity Federation
- production deploy identity has only the permissions needed for Hosting, Functions, and Rules deployment

### 4. Async job and event backbone

Why next:

- feed ingestion, lifecycle checks, anomaly scans, and rebuilds should not pile up inside one Functions monolith

Target state:

- Cloud Tasks for bounded, retryable work
- Cloud Run Jobs or services for heavy async processing
- domain events for listing lifecycle, ingestion, and route invalidation

### 5. Service decomposition by domain

Why next:

- `functions/index.js` is still too central for long-term enterprise operations

Target state:

- separate listing governance, dealer ingestion, notifications, billing, and public SEO runtimes
- smaller deploy blast radius
- clearer ownership by domain

### 6. Cloud SQL and Data Connect production hardening

Why next:

- the new enterprise data platform will only be trustworthy if the delivery discipline above is already in place

Target state:

- staging and production Cloud SQL instances
- backups, PITR, and failover posture defined before cutover
- Data Connect contracts promoted through the same release pipeline

### 7. Security edge and rate governance

Why next:

- dealer APIs, embeds, and public routes need abuse resistance as traffic grows

Target state:

- Cloud Armor in front of public APIs
- route-level and API-level rate policies
- authenticated operator surfaces separated from public edges

### 8. Warehouse and BI operations

Why later:

- essential, but it compounds the value of the earlier release and data governance work

Target state:

- BigQuery marts for lifecycle, ingestion, dealer performance, and SEO
- operator dashboards and SLA reporting

## Near-Term Execution Order

### Slice A: deploy discipline

- add `preview`, `staging`, and `production` deployment paths
- add explicit environment-aware deploy scripts
- add GitHub workflow gates and smoke tests
- remove ambiguous deploy habits from the README

### Slice B: release safety

- add environment setup documentation
- add production approval rules in GitHub Environments
- define rollback and smoke-test runbooks

### Slice C: identity tightening

- replace shared deploy credentials with environment-specific identities
- move from broad secrets to stronger auth where possible

### Slice D: runtime decomposition

- peel off listing governance and public SEO from the Functions monolith first

## Success Markers

- no one deploys production by muscle memory
- preview URLs exist on active pull requests
- staging is always the first shared validation environment
- production deploys require explicit approval
- deploy jobs prove that core public routes still work before a release is considered done
- the later Cloud SQL and Data Connect rollout has a safe release rail to use

## Immediate Follow-Up After This Slice

1. Create the actual staging Firebase project and attach its project ID to GitHub environment vars.
2. Configure `preview`, `staging`, and `production` GitHub Environments with environment-specific secrets.
3. Add required reviewers to the `production` environment.
4. Run one preview deploy, one staging deploy, and one production dry run through the new workflows.
