# Tier 2 Enterprise QA + SEO Cleanup TODO

## Immediate Production Fixes
- [ ] Enable Firebase Phone auth provider so SMS MFA can actually send verification texts.
- [ ] Verify SMS MFA enrollment end-to-end on production with a real phone number.
- [ ] Fix Financing page placeholders:
  - [ ] Business structure default should be `-Select-`
  - [ ] Legal entity placeholder should be `Legal Entity Name`
  - [ ] Stop prefilling legal entity name from QA dealer/company data
- [ ] Fix Financing hero rendering in dusk mode so the hero remains readable and branded.
- [ ] Fix listing detail fallback so live inventory does not incorrectly show `Equipment Not Found`.
- [ ] Fix Google Maps on listing detail pages so location previews and open-in-maps actions work reliably.

## Home / Categories / Inventory Accuracy
- [ ] Make home page category counts reflect live listed inventory instead of zero fallbacks.
- [ ] Add shared top-level category model so home and categories use the same live category set.
- [ ] Include main marketplace families on home, including construction equipment, trucks, trailers, tree service, etc.
- [ ] Add a selector/dropdown on home for major equipment families if needed for density.
- [ ] Make the categories directory include all categories represented on home.
- [ ] Ensure SSR categories and client categories stay aligned with live approved inventory.

## Dealer / Storefront Functionality
- [ ] Audit dealer profile / storefront behavior end to end.
- [ ] Replace placeholder-ish dealer profile blocks with functional storefront actions and real inventory context.
- [ ] Improve dealer profile contact, call, site, and inquiry behavior.
- [ ] Strengthen dealer storefront inventory/category filtering.

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