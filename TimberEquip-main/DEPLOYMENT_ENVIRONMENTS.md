# Deployment Environments

Last updated: 2026-03-26

## Goal

TimberEquip should deploy through three explicit environments:

- `preview`: short-lived Firebase Hosting preview channels for pull requests
- `staging`: shared noindex validation environment
- `production`: live customer-facing environment

This repo now includes workflow and script scaffolding for that model.

## GitHub Environments

Create these GitHub Environments in the repository settings:

### `preview`

Use for pull request preview channels.

Required configuration:

- secret: `FIREBASE_SERVICE_ACCOUNT`
- variable: `FIREBASE_PROJECT_ID`

Recommended protection:

- no approval requirement
- optional deployment branch restriction to `main`

### `staging`

Use for shared validation deploys from `main`.

Required configuration:

- secret: `FIREBASE_SERVICE_ACCOUNT`
- variable: `FIREBASE_PROJECT_ID`
- variable: `SMOKE_BASE_URL`

Optional configuration:

- variable: `FIREBASE_DEPLOY_SCOPE`
- variable: `SITE_URL`

Recommended protection:

- no manual approval requirement
- limit deployments to `main`

### `production`

Use for manual, approved releases only.

Required configuration:

- secret: `FIREBASE_SERVICE_ACCOUNT`
- variable: `FIREBASE_PROJECT_ID`
- variable: `SMOKE_BASE_URL`

Optional configuration:

- variable: `FIREBASE_DEPLOY_SCOPE`
- variable: `SITE_URL`

Recommended protection:

- required reviewers enabled
- deployment branch restriction to `main`
- production-only service account

## Firebase Project Layout

Recommended project mapping:

- `production`: current live Firebase project
- `staging`: separate Firebase project used for noindex shared testing
- `preview`: usually the same Firebase project as staging, using preview channels

The repo now wires the current shared staging project directly:

- `production`: `mobile-app-equipment-sales`
- `staging`: `timberequip-staging`
- `preview`: `timberequip-staging`

The repo keeps those aliases in `.firebaserc` and ships the same mapping in `.firebaserc.example` for local multi-project setup.

## Local Commands

### Staging deploy

```bash
npm run deploy:staging
```

Requirements:

- either `.firebaserc` alias `staging` exists, or `FIREBASE_PROJECT_ID_STAGING` is set

### Production deploy

```bash
ALLOW_PRODUCTION_DEPLOY=true npm run deploy:production
```

Requirements:

- `.firebaserc` alias `production` exists or `FIREBASE_PROJECT_ID_PRODUCTION` is set
- explicit `ALLOW_PRODUCTION_DEPLOY=true`

### Preview deploy

```bash
FIREBASE_PREVIEW_CHANNEL=local-preview npm run deploy:preview
```

Requirements:

- preview or staging project configured
- hosting-only deploy

## Workflow Files

- `.github/workflows/pr-preview.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

## Deploy Script Behavior

`scripts/firebase-deploy.mjs` now enforces:

- explicit environment selection
- noindex deploys for `preview` and `staging`
- indexable deploys for `production`
- explicit production acknowledgement outside CI
- project ID resolution from environment variables first, then `.firebaserc`

`scripts/validate-deploy-config.mjs` now provides a fast preflight for local and CI setup:

```bash
SMOKE_BASE_URL=https://staging.example.com node scripts/validate-deploy-config.mjs --env staging --require-smoke
```

`scripts/http-smoke-check.mjs` validates core public routes after deploy:

- `/sitemap.xml`
- `/forestry-equipment-for-sale`
- `/categories`
- `/manufacturers`
- `/states`
- `/dealers`

Those routes are now defined centrally in:

- `ops/release/release-contract.json`

Example:

```bash
SMOKE_BASE_URL=https://www.timberequip.com SMOKE_EXPECT_MODE=indexable npm run smoke:routes
```

## Service Account Guidance

Use separate deployment identities for `preview`, `staging`, and `production`.

Minimum guidance:

- do not reuse one broad credential everywhere
- keep production credentials in the `production` environment only
- prefer a dedicated deployment identity per environment
- grant only the permissions needed to deploy Hosting, Functions, and Firestore rules in that target project

## Release Policy

Recommended path:

1. pull request verifies and gets a preview URL
2. merge to `main` deploys to `staging`
3. staging smoke tests pass
4. manual approved dispatch deploys to `production`
5. production smoke tests pass

## Runbooks And Release Assets

Operational assets added for this Tier 2 slice:

- release contract: `ops/release/release-contract.json`
- release notes generator: `npm run release:notes`
- alert policy renderer: `npm run ops:alerts:render -- --project <gcp-project-id> --env production`
- billing webhook failure: `ops/runbooks/BILLING_WEBHOOK_FAILURE.md`
- listing visibility mismatch: `ops/runbooks/LISTING_VISIBILITY_MISMATCH.md`
- dealer feed sync failure: `ops/runbooks/DEALER_FEED_SYNC_FAILURE.md`
- production rollback: `ops/runbooks/PRODUCTION_ROLLBACK.md`
- Firestore quota degradation: `ops/runbooks/FIRESTORE_QUOTA_DEGRADATION.md`
- alert policy applier: `npm run ops:alerts:apply -- --project <gcp-project-id> --env production`
- staging setup bootstrap: `npm run ops:staging:setup`

## Staging Bootstrap

The repo can now bootstrap the shared staging project with the minimum APIs and Firestore database needed for deploy validation:

```bash
npm run ops:staging:setup
```

Defaults:

- project: `timberequip-staging`
- Firestore location: `nam5`

Requirements:

- either `GOOGLE_APPLICATION_CREDENTIALS` points at a service account with rights on the target project
- or the local Firebase CLI login has a still-valid cloud-platform access token

Current status:

- `timberequip-staging` now has Hosting, Monitoring, and a default Firestore database in `nam5`
- baseline Hosting plus Firestore Rules deploys succeed
- full SSR/API parity is still blocked until the staging project is upgraded to Blaze so `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`, and the Cloud Functions v2 stack can be enabled

## Monitoring Policy Application

Render and apply the environment-specific policies:

```bash
npm run ops:alerts:render -- --project mobile-app-equipment-sales --env production
npm run ops:alerts:apply -- --project mobile-app-equipment-sales --env production
```

The apply step replaces any existing alert policy with the same display name so the repo stays the source of truth for the baseline policy set.
