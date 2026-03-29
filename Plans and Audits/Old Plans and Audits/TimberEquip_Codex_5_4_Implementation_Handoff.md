# TimberEquip Codex 5.4 Implementation Handoff

Date: March 28, 2026

## Completion Notes Through March 28, 2026

The initial handoff priorities have now been implemented and extended:

- `dealerFeedProfiles` Firestore rules are in place
- highest-impact local/prod API drift has been reduced
- `Auctions` no longer presents fake live behavior
- canonical authenticated account/bootstrap and consolidated admin bootstrap paths are live
- seller listing create plus submit now run through the server-owned lifecycle lane
- admin operator visibility has been expanded with listing review filters, billing/account governance audit views, seller legal acceptance views, and dealer-feed operator summaries
- the remaining long-tail account/detail/operator views now use auth-scoped last-good snapshots, including account listings, storefront, inquiries, calls, financing requests, listing lifecycle audit/detail, admin review summaries, and dealer-feed profile/log views
- saved searches and alerts now use the same auth-scoped last-good snapshot pattern, and account access refresh now falls back to the last known billing summary instead of hard-failing under quota pressure
- profile Account Settings now persist lightweight preferences through the authenticated `/api/account/profile` route, and tab switching has been visually re-verified on production for `super_admin` and `pro_dealer`
- profile tab switching now derives directly from the `?tab=` URL instead of bouncing between local state and search-param state, which removed the remaining super-admin tab glitch on production
- the Financing page hero now honors light mode and dusk mode correctly on the live production bundle, with Playwright verification against a fresh cache-busted load
- unknown client routes now render a dedicated noindex `NotFound` experience instead of silently dropping users back onto the homepage
- `Profile -> Account Settings` now exposes a real authenticated `Manage Billing` action that opens the branded Stripe customer portal through `POST /api/billing/create-portal-session`; this was browser-verified on production with the QA Pro Dealer account and then promoted through staging
- seller listing mutation parity is now materially complete: create, edit, submit, and seller-side delete actions all flow through authenticated account/listing API lanes instead of mixing server-owned creation with direct browser edit/delete writes; quality-sensitive edits re-queue approved listings for review, and the slice has been promoted through staging and production
- a repeatable staging role-matrix seed/validation script now exists at `TimberEquip-main/scripts/seed-staging-role-matrix.mjs`; on March 29, 2026 it seeded deterministic staging QA accounts and validated the authenticated `/api/account/bootstrap` contract for `super_admin`, `admin`, `pro_dealer`, `dealer`, `owner_operator`, `free_member`, and `buyer`, with the artifact written to `TimberEquip-main/output/qa/staging-role-matrix-20260329.json`
- a repeatable staging lifecycle smoke script now exists at `TimberEquip-main/scripts/validate-staging-lifecycle.mjs`; on March 29, 2026 it validated the canonical server-owned create -> reject -> resubmit -> approve -> payment_confirmed -> mark_sold -> relist -> archive path in staging, including the admin lifecycle audit endpoint, with the artifact written to `TimberEquip-main/output/qa/staging-lifecycle-smoke-20260329.json`
- the staging lifecycle smoke initially exposed two real blockers that are now fixed: `POST /account/listings` was writing `latitude` / `longitude` as Firestore `undefined`, and the listing-write governance trigger was not passing a database handle into `syncListingGovernanceArtifactsForWrite`
- a repeatable staging billing-start validation script now exists at `TimberEquip-main/scripts/validate-staging-billing-start.mjs`; on March 29, 2026 it created real Stripe checkout sessions in staging for `individual_seller`, `dealer`, and `fleet_dealer`, with the artifact written to `TimberEquip-main/output/qa/staging-billing-start-20260329.json`
- the staging checkout return flow is now fixed: `/subscription-success` no longer requires the browser session to have fully resumed before rendering, the backend can confirm the checkout session without forcing auth first, and a real March 29, 2026 staging `Owner-Operator` payment was verified through to an active seller account state
- authenticated account bootstrap and billing refresh now agree on the live staged seller-plan result after checkout; the earlier mismatch was caused by `buildAccountBootstrapPayload` attempting to use `stripe` without receiving it in scope
- listing detail map embeds now avoid the Google place-card overlay path: when machine coordinates exist the page embeds OpenStreetMap, and when they do not it shows a clean fallback card with an outbound full-map link instead of a Google embedded map
- the public blog/news page no longer contains dead search/filter or newsletter subscribe widgets; those slots now route into live inventory, categories, manufacturers, dealers, states, financing, ad programs, and seller enrollment so the surface is honest and contributes useful internal linking instead of fake controls

The current source of truth for what is still required for full Tier 2 is now:

- `TimberEquip_Tier_2_Enterprise_Checklist.md`
- `TIER2_ENTERPRISE_QA_TODO.md`

## Purpose

Use this file as the implementation brief for Codex 5.4 in VS Code.

This is not a general audit summary. It is a ranked execution plan with concrete file targets, constraints, and acceptance criteria so another coding agent can implement the fixes without re-discovering the problem space.

Source audit:

- `TimberEquip_Functionality_Audit_2026-03-28.md`

Companion checklist:

- `TimberEquip_Tier_2_Enterprise_Checklist.md`

Repository root:

- `/workspaces/TimberEquip2`

App root:

- `/workspaces/TimberEquip2/TimberEquip-main`

## Paste-Ready Prompt For Codex 5.4

```md
You are working in `/workspaces/TimberEquip2/TimberEquip-main`.

Read these files first:
- `/workspaces/TimberEquip2/TimberEquip_Functionality_Audit_2026-03-28.md`
- `/workspaces/TimberEquip2/TimberEquip_Codex_5_4_Implementation_Handoff.md`
- `/workspaces/TimberEquip2/TimberEquip_Tier_2_Enterprise_Checklist.md`

Implement the ranked fix plan in this order:

1. Fix the `dealerFeedProfiles` Firestore rules gap.
2. Reduce local-vs-production API drift for the highest-impact endpoints.
3. Make the Auctions page honest and non-deceptive if auctions are not fully live.

Execution constraints:
- Keep changes minimal and production-oriented.
- Do not redesign unrelated UI.
- Do not blindly switch the repo to indexable mode. Treat indexing as a release-mode decision.
- Treat Firebase Functions `apiProxy` as the production source of truth for `/api/**` behavior.
- If an endpoint exists only in the local server and not in Functions, either add parity safely or remove/hide the dependent UI.
- Remove fake functionality rather than preserving misleading UI.
- After each major change, run `npm run build` in `TimberEquip-main`.
- Update the markdown handoff file with completion notes as you finish items.

Definition of done for this pass:
- `dealerFeedProfiles` is client-accessible under correct Firestore rules.
- Local dev no longer 404s for the most important frontend API calls that already work in Firebase-hosted production.
- Auctions no longer presents fake registration/catalog behavior as if it were live.
- The noindex issue is documented as an intentional staging/default release gate with clear production deployment guidance.

If a product decision is ambiguous, do not guess. Implement the safest honest behavior and document the remaining decision in the markdown.
```

## Working Rules For The Agent

1. Prefer the smallest change set that closes the gap.
2. Preserve public APIs and current data shapes unless the fix requires otherwise.
3. Do not convert the app into indexable production mode by default unless explicitly instructed by the human.
4. Use Firebase Functions behavior as the canonical production API contract.
5. When a feature is incomplete, prefer honest UX over fake interactivity.
6. Re-run the build after each major milestone.

## Ranked Fix Plan

### P0.1 Fix `dealerFeedProfiles` Firestore Rules

Priority: Highest confidence, highest leverage

Problem:

- DealerOS reads and writes `dealerFeedProfiles` from the client.
- Firebase Functions also uses `dealerFeedProfiles` for nightly feed sync.
- `firestore.rules` currently contains no `match /dealerFeedProfiles/{profileId}` block.

Primary files:

- `TimberEquip-main/firestore.rules`
- `TimberEquip-main/src/services/dealerFeedService.ts`
- `TimberEquip-main/src/pages/DealerOS.tsx`
- `TimberEquip-main/functions/index.js`

Required implementation:

1. Add a validator for `dealerFeedProfiles` documents.
2. Add a `match /dealerFeedProfiles/{profileId}` rule block.
3. Allow read/write for:
   - admins
   - the owning dealer account scope via `sellerUid`
4. Prevent dealers from writing profiles for other dealer accounts.
5. Preserve server-managed sync metadata fields only if they are already part of the stored document shape.

Recommended allowed fields:

- `sellerUid`
- `sourceName`
- `sourceType`
- `rawInput`
- `feedUrl`
- `nightlySyncEnabled`
- `lastSyncAt`
- `lastSyncStatus`
- `lastSyncMessage`
- `lastResolvedType`
- `createdAt`
- `updatedAt`

Acceptance criteria:

- DealerOS can save a feed profile.
- DealerOS can reload saved profiles.
- DealerOS can toggle nightly sync on a profile.
- DealerOS can delete a profile.
- Build still passes.

### P0.2 Reduce Local/Production API Drift For High-Impact Endpoints

Priority: High

Problem:

- Firebase Hosting rewrites `/api/**` to `functions.apiProxy`.
- Local dev uses `server.ts` via `npm run dev`.
- The frontend calls several endpoints that exist in Functions but not in `server.ts`.

Primary files:

- `TimberEquip-main/server.ts`
- `TimberEquip-main/functions/index.js`
- `TimberEquip-main/src/pages/Inspections.tsx`
- `TimberEquip-main/src/services/billingService.ts`
- `TimberEquip-main/src/services/marketRatesService.ts`
- `TimberEquip-main/src/components/LocaleContext.tsx`
- `TimberEquip-main/src/pages/Profile.tsx`

Implement these local-server parity endpoints first:

1. `POST /api/inspections/closest-dealer`
2. `POST /api/billing/create-account-checkout-session`
3. `GET /api/market-rates`
4. `GET /api/currency-rates`

Nice-to-have in same pass if straightforward:

5. `POST /api/translate`
6. `POST /api/admin/dealer-feeds/resolve`

Important constraint:

- Do not copy Functions logic blindly if there is already equivalent helper logic in `server.ts`.
- Reuse the local helper functions where possible.

Specific guidance:

#### P0.2.a `POST /api/inspections/closest-dealer`

`server.ts` already contains inspection/geocode helpers similar to Functions.

Goal:

- Make local dev support the same inspection lookup flow that production already supports.

Acceptance criteria:

- `Inspections.tsx` no longer depends on a production-only API for dealer matching.

#### P0.2.b `POST /api/billing/create-account-checkout-session`

Goal:

- Make local dev support seller account checkout start and confirmation, matching the frontend usage in `billingService.ts` and `Sell.tsx` / `AdPrograms.tsx`.

Acceptance criteria:

- `billingService.createAccountCheckoutSession()` works against local dev.
- `billingService.confirmCheckoutSession()` returns a payload compatible with account checkout flows as well as listing checkout flows.

#### P0.2.c `GET /api/market-rates`

Goal:

- Prevent local 404s for `marketRatesService.getRates()`.

Acceptance criteria:

- `Financing` and related rate consumers no longer fail in local dev due to missing route.

#### P0.2.d `GET /api/currency-rates`

Goal:

- Prevent local 404s for `LocaleContext` currency conversion fetches.

Acceptance criteria:

- Non-USD currency conversion path has a local API response shape matching production expectations.

#### P0.2.e `/api/upload` mismatch

Problem:

- `Profile.tsx` exposes a `File Upload Test` panel that posts to `/api/upload`.
- `server.ts` implements `/api/upload`.
- `functions/index.js` does not expose `/upload` through `apiProxy`.

Required action:

- Do not leave misleading production-incompatible UI in place.
- Choose one of these two safe fixes:
  1. Hide/remove the `File Upload Test` panel from normal user-facing UI.
  2. Add a real Functions/API-proxy equivalent if it is genuinely needed.

Preferred option for this pass:

- Remove or hide the panel, because it reads as a diagnostic tool rather than a product feature.

Acceptance criteria:

- No user-facing feature should rely on an API that only exists in the local server.

### P0.3 Make Auctions Honest

Priority: High if auctions are visible publicly

Problem:

- `Auctions.tsx` uses `SAMPLE_AUCTIONS` and local UI-only registration state.
- The page currently looks operational even when no real auction system is live.

Primary files:

- `TimberEquip-main/src/pages/Auctions.tsx`
- optionally `TimberEquip-main/src/App.tsx`

Required implementation:

- Remove fake registration behavior.
- Remove or disable fake catalog CTA behavior.
- If live auctions are not implemented, make the page explicitly say that auctions are upcoming / pilot / private rollout.

Safe implementation options:

1. Keep the route but relabel it as preview or coming soon.
2. Replace interactive buttons with a waitlist/contact CTA.
3. If auctions are out of scope, temporarily remove the route from public navigation.

Acceptance criteria:

- No button on the page should simulate a successful live auction action without backend support.
- Sample data, if retained, must be clearly labeled as sample or preview content.

### P0.4 Treat The `noindex` State As A Release Gate, Not A Blind Code Flip

Priority: High, but requires product/release caution

Problem:

- Current repo state is intentionally `noindex`.
- That blocks public launch, but changing it blindly in source could accidentally expose staging environments.

Primary files:

- `TimberEquip-main/public/robots.txt`
- `TimberEquip-main/firebase.json`
- `TimberEquip-main/scripts/prepare-seo-mode.mjs`
- `TimberEquip-main/package.json`
- `TimberEquip-main/src/components/Seo.tsx`

Required implementation for this pass:

- Do not force default indexing on.
- Instead, make the release path explicit and hard to misuse.

Recommended changes:

1. Keep staging/noindex behavior intact.
2. Clarify deploy script naming if needed.
3. Add a short release note or comment documenting that:
   - `deploy:noindex` is staging/safe mode
   - `deploy:indexable` is production/public mode
4. Ensure all indexing behavior is derived consistently from the same deployment mode.

Acceptance criteria:

- Another engineer can tell, from the repo itself, how to deploy staging vs public production.
- The fix does not accidentally make every deployment indexable.

## P1 Queue After P0 Is Done

### P1.1 Search and Home Data Scaling

Files:

- `TimberEquip-main/src/services/equipmentService.ts`
- `TimberEquip-main/src/pages/Search.tsx`
- `TimberEquip-main/src/pages/Home.tsx`

Goal:

- Reduce full-collection reads and client-side filtering.

### P1.2 Add Real Regression Coverage

Goal:

- Add at least one E2E path for auth, listing creation, account checkout confirmation, DealerOS profile save, and blog publish.

### P1.3 Clean Up Blog Dead UI

Files:

- `TimberEquip-main/src/pages/Blog.tsx`

Goal:

- Wire or remove fake filter/newsletter controls.

### P1.4 Add A Real 404 Route

Files:

- `TimberEquip-main/src/App.tsx`

Goal:

- Stop routing unknown URLs to the homepage.

## Verification Commands

Run after each major milestone:

```bash
cd /workspaces/TimberEquip2/TimberEquip-main && npm run build
```

Optional diagnostics:

```bash
cd /workspaces/TimberEquip2/TimberEquip-main && npm run lint
```

## Manual QA Checklist

### DealerOS

- Save a feed profile
- Reload the profile list
- Toggle nightly sync
- Delete a profile

### Billing

- Start account checkout from `AdPrograms`
- Confirm checkout return handling in `Sell` or `Profile`

### Inspections

- Lookup nearest dealer using listing reference and/or location

### Auctions

- Verify there is no fake successful registration path
- Verify sample/demo content is clearly labeled if still shown

### SEO Mode

- Verify staging mode remains noindex
- Verify public deploy path is explicitly documented

## Open Decisions The Agent Should Not Guess On

1. Whether auctions should remain publicly visible at all.
2. Whether production should become indexable immediately, or only after additional launch checks.
3. Whether translation parity should be implemented locally in this pass, or deferred behind graceful fallback behavior.

## Completion Notes

Agent implementing this brief should append a short completion log here with:

- completed items
- deferred items
- verification performed
- unresolved product decisions
