# Forestry Equipment Sales - Phase 2 Implementation Plan

## Context
Following initial hardening (auth, SEO, taxonomy, seller signup, dark mode), this plan covers 30+ UI, data, and feature changes before domain cutover to www.forestryequipmentsales.com. API key leak already resolved.

---

## Phase 1: Quick Text & Contact Updates

### 1.1 Home Page Headline
- **File:** `src/pages/Home.tsx:365`
- Change `"The world's premier platform"` to `"The premier platform"`

### 1.2 Contact Page
- **File:** `src/pages/Contact.tsx:218-221`
- `Global Support` / `+1 (800) TIMBER-EQUIP` -> `Support` / `+1 (218) 720-0933` (tel: link)
- `Global HQ` / `4335 Kingston Rd` -> `HQ` / `4788 Rice Lake Rd, Duluth, MN 55803`
- `Market Hours` / `24/7 GLOBAL ACCESS` -> `Hours of Operation` / two lines: `Phone M-F 8am-5pm CST` and `Email 8am-10pm CST`
- `Knowledge Base` -> `Frequently Asked Questions`, button routes to `/faq`

### 1.3 All Addresses Site-Wide
- Files: Contact, Layout, About, Terms, Privacy
- Replace old addresses/phones with `4788 Rice Lake Rd, Duluth, MN 55803` and `(218) 720-0933`

---

## Phase 2: Home Page Content

### 2.1 Remove Subcategories from Category Intelligence Cards
- **File:** `src/pages/Home.tsx:513-523` - Remove subcategory list block

### 2.2 Rename "Market Value" to "Listed Equipment Value"
- **File:** `src/pages/Home.tsx:392-416` - Change label, add daily % change indicator
- Requires stored previous-day snapshot (see Phase 7)

### 2.3 Verify Category Dropdown Updates Dynamically
- **File:** `src/pages/Home.tsx:497-507` - Verify sourced from taxonomy service

### 2.4 Verify Featured Inventory Shows Featured First
- **File:** `src/pages/Home.tsx:632-656` - Featured sort at `equipmentService.ts:1263-1283`

---

## Phase 3: Search & Breadcrumbs

### 3.1 Scrolling Quick Search Bar
- Files: `Search.tsx`, `ListingDetail.tsx`
- Add horizontal pill/chip bar below breadcrumbs showing active filters
- Each pill removable (X), bar scrolls horizontally on mobile

### 3.2 Filter Retention + Breadcrumb Display
- **File:** `Breadcrumbs.tsx:84-103` - Already builds from URL params
- Verify filter selections persist through navigation

### 3.3 SEO Breadcrumb Optimization (ForestryTrader.com style)
- Hierarchy: `Equipment for Sale > [Category] > [Subcategory] > [Manufacturer] > [Listing]`
- JSON-LD BreadcrumbList already present (lines 30-40)

### 3.4 Input Placeholder Audit
- Review all form inputs for correct placeholder text

### 3.5 Verify Inquiry Form on Search Results
- **File:** `Search.tsx:1380-1388` - InquiryModal opens from listing cards

---

## Phase 4: Listing Detail Page

### 4.1 Light/Dusk Mode for Price/Inquiry Section
- **File:** `ListingDetail.tsx:846-896` - Add theme-aware classes

### 4.2 Fix Form Modal Headers (Calc/Financing/Logistics)
- Files: `ListingDetail.tsx:1841-2030`, `PaymentCalculatorModal.tsx`
- Fix black headers in light mode

### 4.3 Enhanced Share Button
- **File:** `ListingDetail.tsx:1033-1046`
- Replace with dropdown: Facebook, Text (SMS), Email (mailto), Copy URL with feedback

### 4.4 Admin Verification Toggle
- **File:** `ListingDetail.tsx:1542-1547`
- Add toggle for admin/super_admin to manually verify sellers
- Add `manuallyVerified` field to user profile
- Update `isVerifiedSellerRole()` in `functions/index.js`

### 4.5 Verify Listing IDs from 12000
- Check `src/utils/listingIdentity.ts` and `functions/index.js` counter

### 4.6 Twilio Phone Numbers
- Verify Dealer/Pro Dealer listings show Twilio tracking number

---

## Phase 5: Other Pages

### 5.1 Compare Page - Mobile Layout
- **File:** `Compare.tsx:76-77` - Switch to vertical card layout on mobile

### 5.2 Compare Page - AMV Parameters
- **File:** `amvMatching.ts` - Current: +/-10% hours. User may want +/-500 fixed. NEEDS CLARIFICATION.

### 5.3 Equipment News
- **File:** `Blog.tsx`
- Line 163: Change "Verified Report" to author first/last name
- Lines 89-95: Remove Browse/Explore/View buttons
- Add Market Pulse: AMV per subcategory with % change, supply counts, 7-day rolling, selectable

### 5.4 Auction Page - Remove Gavel Icon
- **File:** `Auctions.tsx:96` - Remove Gavel icon block

### 5.5 Auction & Financing Overlay Styles
- Match Home.tsx pattern with explicit theme-aware gradients

### 5.6 Financing & Logistics Icons
- Match icon style used on Home/Auction pages

### 5.7 Dealer Network & Storefront Discoverability
- Verify dealers appear and link to storefronts
- Add prominent nav link

### 5.8 Build Comprehensive FAQ Page
- **File:** `src/pages/Faq.tsx` (exists or create)
- Cover: buying, selling, subscriptions, featured, financing, logistics, accounts, dealer program

### 5.9 Remove "Discard Changes?" Popup
- Files: `PaymentCalculatorModal.tsx:142`, `InquiryModal.tsx:52`, `LoginPromptModal.tsx:87`, `Search.tsx:411`, `ListingDetail.tsx:458`
- Remove all `window.confirm` calls, just close modals directly

### 5.10 Hybrid Marketplace Code
- Not found in codebase. May be cached/stale. Verify no alternate routes in App.tsx. Clear service worker if applicable.

---

## Phase 6: Image Processing

### 6.1 Thumbnail Watermark Opacity
- **File:** `functions/index.js:3040-3088`
- Current watermark: 28% opacity on all sizes
- For thumbnails: reduce to ~8% opacity (70% less visible)
- Verify ListingCard uses `imageVariants[0].thumbnailUrl` (AVIF)

---

## Phase 7: Nightly Data Refresh

### 7.1 Nightly Refresh (2AM CST)
- **File:** `functions/index.js`
- New function: `nightlyDataRefresh` at `0 2 * * *` America/Chicago
- Recompute AMV for all active listings, store in Firestore
- Store previous-day totals for daily % comparison
- Per-subcategory aggregates: avg AMV, supply count, new listings
- Store `dataRefreshedAt` timestamp in `system/stats`

### 7.2 Weekly Market Pulse (Monday 3AM CST)
- New function: `weeklyMarketPulse` at `0 3 * * 1`
- 7-day rolling AMV changes per subcategory
- Supply change percentages
- Store in `system/marketPulse`

---

## Phase 8: Featured Listing Purchase Flow
- **File:** `src/pages/Profile.tsx:1629-1646` - Toggle exists
- Verify end-to-end: Owner-Operator (1 slot), Dealer (3), Pro Dealer (6)
- Ensure visible and functional in both profile types

---

## Phase 9: Build, Push, Deploy
1. `npx tsc --noEmit` (0 errors)
2. `npx vitest run` (all pass)
3. `npx vite build` (success)
4. Git commit + push
5. `firebase deploy --only hosting,functions,firestore:rules`

---

## Critical Files

| File | Key Changes |
|------|-------------|
| `src/pages/Home.tsx` | Headline, subcategories, Market Value rename |
| `src/pages/Contact.tsx` | Phone, address, hours, FAQ link |
| `src/pages/Search.tsx` | Quick search bar, discard popup |
| `src/pages/ListingDetail.tsx` | Theme fixes, share, verification, discard popup |
| `src/pages/Blog.tsx` | Author name, Market Pulse |
| `src/pages/Auctions.tsx` | Gavel icon, overlay |
| `src/pages/Financing.tsx` | Overlay, icons |
| `src/pages/Compare.tsx` | Mobile layout |
| `src/pages/Faq.tsx` | Comprehensive FAQ |
| `src/components/Breadcrumbs.tsx` | SEO hierarchy |
| `src/components/Layout.tsx` | Footer, address |
| `src/utils/amvMatching.ts` | Hours tolerance (pending clarification) |
| `functions/index.js` | Nightly refresh, Market Pulse, watermark |
