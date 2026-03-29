# Tier 2 Enterprise QA + SEO Cleanup TODO

Last updated: 2026-03-29

Reference plan:

- [TIER2_ENTERPRISE_COMPLETION_PLAN.md](./TIER2_ENTERPRISE_COMPLETION_PLAN.md)

## Immediate Production Fixes
- [x] Eliminate profile tab flashing/glitching and restore Account Settings save behavior for signed-in profiles.
  Notes:
  Verified on production with Playwright for `super_admin` and `pro_dealer` accounts. Profile tab changes now switch cleanly without the earlier visual remount/jump behavior, and the authenticated `PATCH /api/account/profile` path now supports lightweight preference updates such as notification toggles.
- [x] Enable Firebase Phone auth provider so SMS MFA can actually send verification texts.
- [x] Verify SMS MFA enrollment end-to-end on production with a live number flow.
  Notes:
  Production SMS MFA now works with standard reCAPTCHA phone enforcement. The previous blocker was Identity Platform SMS toll-fraud enforcement. Caleb's number was also configured as a Firebase test number, which prevented real texts until that override was removed.
- [x] Fix Financing page placeholders:
  - [x] Business structure default should be `-Select-`
  - [x] Legal entity placeholder should be `Legal Entity Name`
  - [x] Stop prefilling legal entity name from QA dealer/company data
- [x] Fix Financing hero rendering in both light mode and dusk mode so the page theme is visually correct in each mode.
  Notes:
  Re-verified on production with Playwright on March 29, 2026 using a cache-busted fresh bundle load. Light mode now renders a genuinely light financing hero with dark title/body text, and dusk mode keeps the darker branded forestry treatment.
- [x] Fix listing detail fallback so live inventory does not incorrectly show `Equipment Not Found`.
- [x] Fix Google Maps on listing detail pages so location previews and open-in-maps actions work reliably.

## Home / Categories / Inventory Accuracy
- [x] Make home page category counts reflect live listed inventory instead of zero fallbacks.
- [x] Add shared top-level category model so home and categories use the same live category set.
- [x] Include main marketplace families on home, including construction equipment, trucks, trailers, tree service, etc.
- [x] Add a selector/dropdown on home for major equipment families if needed for density.
- [x] Make the categories directory include all categories represented on home.
- [x] Ensure SSR categories and client categories stay aligned with live approved inventory.

## Dealer / Storefront Functionality
- [x] Audit dealer profile / storefront behavior end to end.
- [x] Replace placeholder-ish dealer profile blocks with functional storefront actions and real inventory context.
- [x] Improve dealer profile contact, call, site, and inquiry behavior.
- [x] Strengthen dealer storefront inventory/category filtering.

## SEO Cleanup Execution
- [x] Remove QA/test labeling from public listing/storefront SEO surfaces.
- [x] Move listing URLs toward canonical `/equipment/...` structure.
- [x] Ensure only live listings are indexable; keep QA/drafts/previews out of the index.
- [x] Improve listing title/meta/description quality for public inventory pages.
 - [x] Remove fake public blog widgets and replace them with real marketplace navigation.
   Notes:
   The blog/news page no longer contains dead search or newsletter subscribe controls. Those areas now route into live marketplace surfaces such as inventory, categories, manufacturers, dealers, states, financing, ad programs, and seller enrollment.
- [ ] Strengthen internal linking across inventory, categories, manufacturers, dealers, and states.
  Notes:
  March 29, 2026 update: blog/news now contributes a real internal-link rail into live marketplace hubs and commercial flows. Remaining work is to broaden that link architecture across more public templates, not just the news surface.

## Tier 2 Enterprise Follow-Through

### Quota-safe account and admin foundation

- [x] Build a single authenticated `/api/account/bootstrap` response for signed-in first load.
- [x] Move `AuthContext`, `Profile`, and admin overview bootstrap onto that response.
- [x] Finish moving the highest-value admin/account reads off direct Firestore snapshot dependence, including overview analytics and the main operational summary surfaces.
- [x] Standardize last-good snapshot behavior for the remaining editor/detail/mutation flows and the long-tail operational/admin tabs.
  Notes:
  Account listings, storefront, inquiries, calls, financing requests, listing lifecycle audit/detail, admin listing review summaries, dealer-feed profile/log views, and saved searches now use auth-scoped last-good browser snapshots. Listing and dealer-feed mutations also clear or refresh the relevant cache scopes so stale data does not linger after edits, and account access refresh now falls back to the last known billing summary instead of hard-failing.
- [x] Standardize last-good snapshot behavior for admin billing, content, users, and dealer feeds.
  Notes:
  Production profile settings saves are now backed by the authenticated `/api/account/profile` route instead of a missing or quota-fragile client path, and lightweight preference changes can fall back safely when Firestore quota pressure is high.
- [x] Add secure billing management from `Profile -> Account Settings` and verify the Stripe customer portal redirect flow.
  Notes:
  `Manage Billing` now opens a real authenticated Stripe billing portal session from `/api/billing/create-portal-session` instead of leaving subscription-side account management incomplete. Re-verified on live production with Playwright on March 29, 2026 using the `qa.prodealer.20260326@example.com` account, including redirect into the branded Stripe billing portal. The same slice was then promoted through staging so the release rail stays aligned.

### Server-owned listing lifecycle

- [x] Move seller listing creation onto the server-owned lifecycle API path.
- [x] Move seller submit/resubmit onto the same lifecycle lane.
- [x] Keep approval mandatory before public visibility for Owner-Operators, Dealers, Pro Dealers, and Admin-created listings.
- [ ] Run the listing governance backfill once quota-safe.
- [x] Finish editor/detail mutation parity so remaining listing writes use the same server-owned lane.
  Notes:
  Seller listing edits now flow through authenticated `PATCH /api/account/listings/:id` with merged payload sanitization, the same quality validation standard used on create, featured-cap enforcement on update, and automatic re-review when quality-sensitive edits materially change an approved listing. Seller-side deletes now also flow through authenticated `DELETE /api/account/listings/:id` instead of direct browser Firestore deletes. This slice was promoted through staging and production on March 29, 2026 with targeted `hosting,functions:apiProxy` deploys and passing route smoke in both environments.

### Operator visibility and audits

- [x] Add account audit views for role changes, entitlement changes, subscription changes, and legal acceptance changes.
  Notes:
  Admin Billing now exposes `Account Governance Audit` and `Seller Legal Acceptances` panels backed by the consolidated `/api/admin/billing/bootstrap` contract, so operators can review role changes, entitlement syncs, subscription-linked account events, and seller legal acceptance records without stitching multiple reads together.
- [x] Add admin review filters for pending approval, paid-not-live, rejected, expired, sold, archived, and anomaly states.
  Notes:
  Admin Machines now exposes loaded-page review filters plus governance-summary counts for `Pending Approval`, `Paid Not Live`, `Rejected`, `Expired`, `Sold`, `Archived`, and `Anomalies`, backed by `/api/admin/listings/review-summaries`.
- [x] Add dealer feed operator summaries for last run, failure reason, and ingest status.
  Notes:
  Admin Dealer Feeds now shows operator summary cards for the current profile including last run time, current feed status, latest failure reason, and nightly-sync/profile status.

### Staging validation

- [ ] Keep using staging as the default high-risk QA lane before production pushes.
- [x] Promote the consolidated account/bootstrap and admin operations slice through staging before production.
- [x] Promote the server-owned seller listing create plus submit slice through staging and production.
- [x] Validate role matrix in staging: super admin, admin, pro dealer, dealer, owner-operator, free member, buyer.
  Notes:
  Added a repeatable staging role-matrix seed and validation script at `TimberEquip-main/scripts/seed-staging-role-matrix.mjs`. On March 29, 2026 it seeded deterministic staging QA accounts for `admin`, `pro_dealer`, `dealer`, `owner_operator`, `free_member`, and `buyer`, then validated the authenticated `/api/account/bootstrap` contract for all seven roles including the existing staging `super_admin`. The generated evidence artifact is `TimberEquip-main/output/qa/staging-role-matrix-20260329.json`, and the validation passed with no mismatches.
- [x] Validate staging create -> approve/reject -> pay -> relist/archive lifecycle and admin approvals before production promotions.
  Notes:
  Added a repeatable staging lifecycle smoke script at `TimberEquip-main/scripts/validate-staging-lifecycle.mjs`. On March 29, 2026 it validated the canonical server-owned create -> reject -> resubmit -> approve -> payment_confirmed -> mark_sold -> relist -> archive path in staging, including the authenticated admin lifecycle audit endpoint. The generated evidence artifact is `TimberEquip-main/output/qa/staging-lifecycle-smoke-20260329.json`, and the validation passed with no lifecycle anomalies.
- [x] Validate staging seller-plan checkout start flows before production promotions.
  Notes:
  Added a repeatable staging billing-start validation script at `TimberEquip-main/scripts/validate-staging-billing-start.mjs`. On March 29, 2026 it created real Stripe checkout sessions in staging for `individual_seller`, `dealer`, and `fleet_dealer`, and wrote the evidence artifact to `TimberEquip-main/output/qa/staging-billing-start-20260329.json`.
- [ ] Validate staging MFA completion and complete the remaining staged post-checkout billing-state matrix before production promotions.
  Notes:
  The staging checkout return flow is now fixed. On March 29, 2026, a real staging `Owner-Operator` checkout completed successfully, the backend confirmed the paid account state, and the authenticated account bootstrap plus billing refresh responses were normalized so they now agree on the live subscription result. Remaining work is the user-entered staging MFA SMS step and the rest of the staged billing-state matrix for the other seller plans.

### Delivery and ops

- [ ] Make preview -> staging -> approved production the default release path.
- [ ] Keep production deploy scope targeted by domain instead of broad full-functions deploys.
- [ ] Rehearse the runbooks for quota degradation, billing webhook failure, listing visibility mismatch, and rollback.

### First Tier 3 foundation

- [ ] Stand up the first staging Cloud SQL plus Data Connect contract for listing governance.
- [ ] Add the first Cloud Run worker for lifecycle or anomaly processing in staging.
