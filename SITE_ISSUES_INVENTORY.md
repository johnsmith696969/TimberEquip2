# Forestry Equipment Sales Site Issues - Comprehensive Inventory & Action Plan

**Audit Date:** March 25, 2026  
**Status:** Ready for systematic fixes  
**Total Issues:** 23 (across P0/P1/P2 priority levels)

---

## 🔴 P0 - CRITICAL PRODUCTION BLOCKERS (Fixes Required Before Going Live)

### 1. Ad Programs Checkout Failing (IMPACT: Revenue Loss)
- **Description:** Ad Programs checkout returns "Internal server error"
- **Root Cause:** Stripe Authorization header malformed due to `STRIPE_SECRET_KEY` containing whitespace/invalid characters in production
- **Evidence:** Production logs show `StripeConnectionError` and `Invalid character in header content ["Authorization"]`
- **Affected Files:**
  - `functions/index.js` - Stripe initialization
  - `src/pages/AdPrograms.tsx` - Checkout UI
  - `src/services/billingService.ts` - Stripe API calls
- **Status:** Not Started
- **Fix Complexity:** LOW (environment variable fix + redeploy + test)
- **Action:** 
  1. Verify `STRIPE_SECRET_KEY` in Firebase secrets (no whitespace)
  2. Redeploy `apiProxy` function
  3. Test checkout flow end-to-end

### 2. CMS Publish Not Persisting to Public News (IMPACT: Content Management Broken)
- **Description:** CMS blog posts don't reliably appear on Equipment News page after publish
- **Root Causes:**
  - Public page not reading `blogPosts` as canonical source (still uses legacy `news` collection)
  - Firestore rules/query mismatch preventing public reads of `blogPosts`
  - CMS save/publish depends on author identity and rule compatibility
- **Affected Files:**
  - `src/services/cmsService.ts` - CRUD logic
  - `src/components/admin/CmsEditor.tsx` - Save/publish UI
  - `src/services/equipmentService.ts` - News feed query
  - `firestore.rules` - Access control rules
  - `src/pages/Blog.tsx` - Public news page display
- **Status:** Not Started
- **Fix Complexity:** MEDIUM (rule updates + canonical source consolidation + testing)
- **Action:**
  1. Make Blog.tsx read ONLY from `blogPosts` collection
  2. Add `blogPosts` to Firestore rules with proper public read access
  3. Test save/publish/refresh cycle
  4. Consider deprecation timeline for `news` collection

### 3. SMTP Notifications Failing (IMPACT: Broken Email Communications)
- **Description:** All email notifications failing in production
- **Root Cause:** SMTP authentication error: `535 Authentication failed: Bad username / password`
- **Affected Features:**
  - Contact form responses
  - Media kit request confirmations
  - Inquiry confirmations
  - Financing request notifications
  - Billing receipts
  - Support flows
- **Affected Files:**
  - `functions/index.js` - Email sending logic
  - `functions/email-templates/index.js` - Email templates
- **Status:** Not Started
- **Fix Complexity:** LOW (credentials fix + verification)
- **Action:**
  1. Verify Firebase secret: `SENDGRID_API_KEY` is correct
  2. Verify `EMAIL_FROM` sender address is correct
  3. Run email test suite (all 25 templates)
  4. Verify emails reach inbox (not spam folder)

---

## 🟠 P1 - HIGH-PRIORITY FUNCTIONAL DEFECTS (Fix Before Public Launch)

### 4. Listing State Machine Not Fully Enforced
- **Description:** Listing status transitions (draft → published → sold → expired) not formally validated
- **Impact:** Listings can get stuck in invalid states, causing visibility/search issues
- **Affected Files:**
  - `src/services/equipmentService.ts`
  - `firestore.rules` - No validation rules present
  - `functions/index.js` - Listing update endpoints
- **Status:** Not Started
- **Fix Complexity:** MEDIUM (add validation logic + backend rules)
- **Action:**
  1. Define valid state transitions: draft → published, published → sold, published → expired
  2. Add client-side validation in Sell.tsx and ListingModal
  3. Add server-side validation in `apiProxy`
  4. Add Firestore custom claim validation rules

### 5. Listing Expiration Logic Incomplete
- **Description:** Listings with `expiresAt` in past still visible in search/public pages
- **Impact:** Stale listings showing up in results
- **Affected Files:**
  - `src/services/equipmentService.ts` - Query filtering
  - `firestore.rules` - No expiration filtering at DB level
- **Status:** Not Started
- **Fix Complexity:** LOW-MEDIUM (query updates + rules)
- **Action:**
  1. Filter out expired listings in all public queries
  2. Add `expiresAt` field validation and defaults
  3. Add expiration check to Firestore rules
  4. Consider async cleanup job for old listings

### 6. Public Listing Visibility Depends on Field Consistency
- **Description:** Listings can fail to appear if any required field is missing/invalid
- **Fields with Known Issues:**
  - `approvalStatus` (not always set)
  - `paymentStatus` (not always set)
  - `status` (inconsistent values)
  - `expiresAt` (missing on old listings)
- **Impact:** Inconsistent search/browse results
- **Status:** Not Started
- **Fix Complexity:** MEDIUM (audit + migration + rules)
- **Action:**
  1. Audit all existing listings for field completeness
  2. Add mandatory field defaults in Firestore rules
  3. Create migration script to backfill missing fields
  4. Add field validation to Sell flow

### 7. Listing Detail Page Hook Ordering Issue
- **Description:** React hook ordering can cause runtime crashes on ListingDetail page
- **Root Cause:** Hooks called conditionally or in different order on re-renders
- **Affected Files:**
  - `src/pages/ListingDetail.tsx`
- **Status:** Partially Fixed (hook fix was applied in code but needs runtime validation)
- **Fix Complexity:** LOW (already fixed, needs QA)
- **Action:**
  1. Test listing detail page across multiple listings
  2. Test with different user roles (seller, buyer, admin)
  3. Verify no console errors

### 8. Content Studio Mobile Usability Poor
- **Description:** CMS editor difficult to use on mobile devices
- **Impact:** Staff can't edit content from mobile
- **Affected Files:**
  - `src/components/admin/CmsEditor.tsx`
- **Status:** Not Started
- **Fix Complexity:** MEDIUM (responsive design improvements)
- **Action:**
  1. Add horizontal scrolling for mobile
  2. Stack toolbar vertically on small screens
  3. Test on real mobile devices

### 9. Media Library Not Fully Audited Against Rules
- **Description:** Media upload/management not verified to work with Firestore rules
- **Affected Files:**
  - `src/components/admin/MediaLibrary.tsx`
  - `src/services/storageService.ts`
  - `storage.rules`
- **Status:** Not Started
- **Fix Complexity:** MEDIUM
- **Action:**
  1. Test media upload as admin
  2. Test media tag/categorization
  3. Verify Firestore rules allow media metadata writes
  4. Test cleanup of orphaned images

### 10. Homepage Animation Performance Needs Audit
- **Description:** Homepage reported as laggy on mobile, especially animations
- **Affected Files:**
  - `src/pages/Home.tsx`
  - Motion/animation components
- **Status:** Not Started
- **Fix Complexity:** MEDIUM (profiling + optimization)
- **Action:**
  1. Profile rendering performance (React DevTools Profiler)
  2. Identify animation bottlenecks
  3. Consider disabling animations on mobile or slow devices
  4. Optimize re-renders with memoization

---

## 🟡 P2 - STRUCTURAL IMPROVEMENTS (Technical Debt)

### 11. Legacy `news` Collection Duplication
- **Description:** Both `news` and CMS `blogPosts` collections exist; creates confusion
- **Impact:** Maintenance burden, inconsistent content
- **Affected Files:**
  - `src/services/equipmentService.ts`
  - `src/pages/Blog.tsx`
- **Status:** Not Started
- **Fix Complexity:** LOW (deprecation + cleanup)
- **Action:**
  1. Migrate any remaining articles from `news` to `blogPosts`
  2. Remove `news` collection reads from code
  3. Plan timeline for `news` collection deletion
  4. Document in API changelog

### 12. Dealer Feed Logging Collection Missing from Firestore Rules
- **Description:** Code uses `dealerFeedIngestLogs` collection but it's not in firestore.rules
- **Impact:** Permission errors when logging dealer feed imports
- **Affected Files:**
  - `src/services/dealerFeedService.ts`
  - `functions/index.js`
  - `firestore.rules`
- **Status:** Not Started
- **Fix Complexity:** LOW (rules update)
- **Action:**
  1. Add `dealerFeedIngestLogs` read/write rules for admin
  2. Test dealer feed ingestion end-to-end
  3. Verify logs are created on import

### 13. Saved Searches Alert Delivery Not Fully Implemented
- **Description:** Saved search feature exists but alert notifications not implemented
- **Affected Files:**
  - `src/services/userService.ts`
  - `src/pages/Search.tsx`
  - Notification system (missing)
- **Status:** Partially Implemented
- **Fix Complexity:** MEDIUM (requires notification system)
- **Action:**
  1. Decide on notification channels (email? push? in-app?)
  2. Implement alert trigger logic
  3. Create notification queue system
  4. Test end-to-end with sample search

### 14. Bookmarks/Favorites Not Fully Validated Across Auth States
- **Description:** Bookmark feature exists but not tested against deleted listings, auth changes
- **Affected Files:**
  - `src/services/userService.ts`
  - `src/pages/Bookmarks.tsx`
  - `src/components/AuthContext.tsx`
- **Status:** Not Started
- **Fix Complexity:** LOW-MEDIUM (QA + edge case handling)
- **Action:**
  1. Test adding/removing bookmarks as authenticated user
  2. Test bookmark persistence across login/logout
  3. Test deleting bookmarked listing
  4. Add graceful handling for deleted listings

### 15. Financing Requests End-to-End Not Fully Audited
- **Description:** Financing request submission exists but full workflow (admin handling, confirmations) not fully tested
- **Affected Files:**
  - `src/pages/ListingDetail.tsx`
  - `src/services/equipmentService.ts`
  - `functions/index.js`
- **Status:** Partially Implemented
- **Fix Complexity:** MEDIUM
- **Action:**
  1. Test submission from buyer side
  2. Test admin notification/receipt
  3. Test email confirmation to buyer
  4. Test admin dashboard financing requests view

### 16. Calls Logging Not Fully Validated End-to-End
- **Description:** Call logs written to Firestore but full path from listing → seller → admin not tested
- **Affected Files:**
  - `src/pages/ListingDetail.tsx`
  - `src/services/equipmentService.ts`
  - `firestore.rules`
- **Status:** Partially Implemented
- **Fix Complexity:** MEDIUM
- **Action:**
  1. Test logging a call from listing detail
  2. Verify call appears in seller profile
  3. Verify call appears in admin dashboard
  4. Test call search/filtering

### 17. Profile Page Not Fully Audited
- **Description:** Profile CRUD, saved assets, searches all exist but consistency not fully validated
- **Affected Files:**
  - `src/pages/Profile.tsx`
  - `src/services/userService.ts`
  - `src/services/equipmentService.ts`
- **Status:** Partially Implemented
- **Fix Complexity:** MEDIUM
- **Action:**
  1. Test profile edit (name, email, phone)
  2. Test email update/verification flow
  3. Test saved searches display
  4. Test user export
  5. Test user delete (GDPR)

### 18. Seller Profile Page Not Fully Audited
- **Description:** Route and fetch exist but not runtime-tested against Firestore consistency
- **Affected Files:**
  - `src/pages/SellerProfile.tsx`
  - `src/services/equipmentService.ts`
- **Status:** Partially Implemented
- **Fix Complexity:** LOW-MEDIUM
- **Action:**
  1. Load seller profile as public visitor
  2. Load seller profile as authenticated buyer
  3. Load seller profile as seller
  4. Test seller inventory display
  5. Test contact seller flow

### 19. Admin Users Management Recent Rewiring Not Fully QA'd
- **Description:** Admin user CRUD endpoints recently rewired; needs browser validation
- **Affected Files:**
  - `functions/index.js` - Backend endpoints
  - `src/services/adminUserService.ts` - Client SDK
  - `src/pages/AdminDashboard.tsx` - Admin UI
  - `firestore.rules` - Permissions
- **Status:** Partially Implemented
- **Fix Complexity:** MEDIUM
- **Action:**
  1. Test creating new admin user
  2. Test editing admin user details
  3. Test locking/unlocking user
  4. Test resetting user password
  5. Test deleting user account
  6. Verify all error states handled

### 20. Dealer Feed Partial Implementation
- **Description:** Ingest endpoint exists but not fully wired to dealer account model
- **Affected Files:**
  - `src/services/dealerFeedService.ts`
  - `functions/index.js`
- **Status:** Partially Implemented
- **Fix Complexity:** MEDIUM
- **Action:**
  1. Test CSV import flow
  2. Test field mapping customization
  3. Test error handling on malformed CSV
  4. Test listing creation from feed
  5. Verify logs recorded

### 21. Auctions Page Mostly Static
- **Description:** Auctions page and collection exist but not fully integrated with active workflows
- **Impact:** No real auction functionality
- **Status:** Partially Implemented
- **Fix Complexity:** HIGH (requires auction system implementation)
- **Action:** Evaluate if auctions are in Phase 1 scope or defer to Phase 2

### 22. Compare Page Needs Runtime Validation
- **Description:** Compare route and cards exist but listing schema consistency not verified
- **Affected Files:**
  - `src/pages/Compare.tsx`
- **Status:** Partially Implemented
- **Fix Complexity:** LOW
- **Action:**
  1. Select 2-3 listings to compare
  2. Verify all comparison fields display correctly
  3. Test on mobile view

### 23. Auth/Login/Register Not Fully Error-Tested
- **Description:** Auth flows exist but not validated across all error states
- **Affected Files:**
  - `src/pages/Login.tsx`
  - `src/pages/Register.tsx`
  - `src/components/AuthContext.tsx`
- **Status:** Partially Implemented
- **Fix Complexity:** MEDIUM
- **Action:**
  1. Test failed login with wrong password
  2. Test registration with duplicate email
  3. Test reCAPTCHA flow
  4. Test Google OAuth integration
  5. Test password reset email
  6. Test email verification flow

---

## 📊 Summary Statistics

| Priority | Count | Blocker | Status |
|----------|-------|---------|--------|
| P0 (Critical) | 3 | YES | Ready for Fix |
| P1 (High) | 7 | YES | Ready for Fix |
| P2 (Structural) | 13 | NO | Ongoing Maintenance |
| **TOTAL** | **23** | **10** | **In Progress** |

---

## 🚀 Recommended Fix Order

### Phase A - Critical Blockers (Days 1-2)
1. Fix Stripe secret and redeploy
2. Test Ad Programs checkout
3. Fix SMTP credentials
4. Run email test suite
5. Fix CMS publish flow

### Phase B - High-Priority Defects (Days 3-5)
6. Enforce listing state machine
7. Fix listing expiration filtering
8. Audit and backfill listing fields
9. QA listing detail page hook fix
10. Validate admin user management changes

### Phase C - Structural Improvements (Days 6-8)
11. Complete remaining feature QA
12. Audit and optimize performance
13. Clean up technical debt
14. Update Firestore rules collection

---

## 📝 Notes

- All issues require code review before deploy
- Recommend testing in staging environment first
- Run full regression test suite before production deploy
- Update documentation for fixed issues
- Close issues in GitHub as they're resolved
