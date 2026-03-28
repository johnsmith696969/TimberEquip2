# Tier 2 Enterprise QA + SEO Cleanup TODO

## Immediate Production Fixes
- [x] Enable Firebase Phone auth provider so SMS MFA can actually send verification texts.
- [x] Verify SMS MFA enrollment end-to-end on production with a live number flow.
  Notes:
  Production SMS MFA now works with standard reCAPTCHA phone enforcement. The previous blocker was Identity Platform SMS toll-fraud enforcement. Caleb's number was also configured as a Firebase test number, which prevented real texts until that override was removed.
- [x] Fix Financing page placeholders:
  - [x] Business structure default should be `-Select-`
  - [x] Legal entity placeholder should be `Legal Entity Name`
  - [x] Stop prefilling legal entity name from QA dealer/company data
- [x] Fix Financing hero rendering in dusk mode so the hero remains readable and branded.
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
- [ ] Remove QA/test labeling from public listing/storefront surfaces.
- [ ] Move listing URLs toward canonical `/equipment/...` structure.
- [ ] Ensure only live listings are indexable; keep QA/drafts/previews out of the index.
- [ ] Improve listing title/meta/description quality for public inventory pages.
- [ ] Strengthen internal linking across inventory, categories, manufacturers, dealers, and states.

## Tier 2 Enterprise Follow-Through
- [ ] Keep seller/admin critical flows off brittle Firestore read dependencies.
- [ ] Continue admin-facing lifecycle controls and audit views rollout.
- [ ] Validate staging equivalents after production fixes land.
- [ ] Document any remaining infra blockers for full Tier 2 completion.
