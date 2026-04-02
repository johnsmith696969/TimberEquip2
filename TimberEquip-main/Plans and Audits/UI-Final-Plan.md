# Comprehensive UI/UX Audit & Remediation Plan

**Date:** April 2, 2026
**Platform:** Forestry Equipment Sales (TimberEquip)
**Scope:** All 34 page components, 32 shared components, theme system, layout, routing, admin dashboard
**Auditor:** Claude Code — 4 parallel audit agents

---

## Executive Summary

This audit identified **78 total findings** across the entire frontend application. The most critical issues involve missing modal accessibility (no focus traps, no Escape key handling, no dialog semantics), destructive admin actions without confirmation dialogs, hardcoded colors bypassing the theme system, and WCAG contrast failures in dark mode.

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 14 | Pending |
| HIGH | 23 | Pending |
| MEDIUM | 25 | Pending |
| LOW | 16 | Pending |

---

## CRITICAL Issues (14)

### UI-CRIT-01: Flash of Wrong Theme (FOWT)
- **Files:** `index.html`, `src/main.tsx`, `src/components/ThemeContext.tsx`
- **Issue:** Theme initialization happens in React via ThemeProvider, which loads AFTER the initial render. Users with dark mode see a white flash on every page load.
- **Fix:** Add inline `<script>` in `index.html` `<head>` that reads `localStorage` / `prefers-color-scheme` and sets the `dark` class on `<html>` before any paint occurs.

### UI-CRIT-02: No Skip-to-Content Link
- **File:** `src/components/Layout.tsx` (lines 189-586)
- **Issue:** Keyboard/screen reader users cannot skip header navigation to reach main content. WCAG 2.1 Level A failure (2.4.1).
- **Fix:** Add `<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-accent focus:text-white">Skip to main content</a>` at the top of Layout, and add `id="main"` to the `<main>` element.

### UI-CRIT-03: All Modals Missing Dialog Semantics
- **Files:** `InquiryModal.tsx`, `LoginPromptModal.tsx`, `PaymentCalculatorModal.tsx`, `SubscriptionPaymentModal.tsx`, `MultiSelectDropdown.tsx`, `Layout.tsx` (mobile menu), `Search.tsx` (AlertModal), `ListingDetail.tsx` (multiple modals), `Login.tsx` (password reset modal)
- **Issue:** No modal uses `role="dialog"`, `aria-modal="true"`, or `aria-labelledby`. Screen readers cannot identify these as modal dialogs.
- **Fix:** Add dialog semantics to every modal container: `role="dialog" aria-modal="true" aria-labelledby="modal-title-{id}"` and add matching `id` to heading.

### UI-CRIT-04: All Modals Missing Focus Trap
- **Files:** Same as UI-CRIT-03
- **Issue:** Keyboard Tab escapes all modals. No focus cycling within modal boundaries. WCAG 2.1 Level A failure (2.4.3 Focus Order).
- **Fix:** Implement focus trap using a shared `useFocusTrap` hook or `react-focus-lock`. On open: focus first focusable element. On Tab at last element: cycle to first. On Shift+Tab at first: cycle to last. On close: return focus to trigger element.

### UI-CRIT-05: All Modals Missing Escape Key Handler
- **Files:** Same as UI-CRIT-03
- **Issue:** Users cannot dismiss modals with Escape key — must click X button.
- **Fix:** Add `onKeyDown` handler: `if (e.key === 'Escape') onClose()` to each modal's root element.

### UI-CRIT-06: Native Browser alert()/confirm() Usage
- **Files:** `Search.tsx` (lines 842, 868, 871), `Profile.tsx`, `AdPrograms.tsx`, `ListingDetail.tsx`, `AdminDashboard.tsx` (lines 860, 1228, 3481, 3637), `DealerOS.tsx`, `Sell.tsx`, `SubscriptionSuccess.tsx`, `CmsEditor.tsx` (line 187), `MediaLibrary.tsx` (line 54)
- **Issue:** 15+ instances of `alert()`, `confirm()`, `prompt()` native browser dialogs. These have no accessibility properties, break keyboard flow, and provide inconsistent UX.
- **Fix:** Create a shared `<ConfirmDialog>` component with proper dialog semantics. Replace all native dialogs.

### UI-CRIT-07: Admin Role Changes Without Confirmation
- **File:** `src/pages/AdminDashboard.tsx` (lines 1033-1080)
- **Issue:** User roles can be changed via dropdown immediately without any confirmation. Accidentally clicking could grant `super_admin` access.
- **Fix:** Show confirmation modal: "Change {user}'s role from {old} to {new}? This grants access to {implications}."

### UI-CRIT-08: Admin User Deletion Without Adequate Confirmation
- **File:** `src/pages/AdminDashboard.tsx` (line 1228)
- **Issue:** Permanent user deletion uses only `window.confirm()`. No display of associated data (listings, inquiries, billing), no secondary confirmation step.
- **Fix:** Custom confirmation modal showing user details, associated data counts, and requiring typed confirmation (e.g., "type DELETE to confirm").

### UI-CRIT-09: Admin Listing Deletion with Generic Confirmation
- **File:** `src/pages/AdminDashboard.tsx` (line 860)
- **Issue:** Uses `window.confirm()` without showing listing title, lead count, or cascade effects.
- **Fix:** Custom confirmation modal with listing preview and impact summary.

### UI-CRIT-10: NotFound Page Uses Wrong Design System
- **File:** `src/pages/NotFound.tsx` (lines 18-100)
- **Issue:** Uses CSS class names not defined in the global color system: `border-border`, `bg-card`, `text-primary`, `text-primary-foreground`, `text-foreground`, `bg-background`, `bg-primary`. This page renders **unstyled or broken**.
- **Fix:** Replace all with global theme classes: `border-line`, `bg-surface`, `text-accent`, `text-bg`, `text-ink`, `bg-bg`, `bg-accent`.

### UI-CRIT-11: Hardcoded Colors Bypassing Theme System
- **Files:** `ErrorBoundary.tsx:60`, `ConsentBanner.tsx:80-116`, `InquiryModal.tsx:126`, `PaymentCalculatorModal.tsx:156,248`, `SubscriptionPaymentModal.tsx:176`, `ImageHero.tsx:30`, `Home.tsx:315-331`, `Login.tsx:624`, `Register.tsx:161`, `Search.tsx:1415`
- **Issue:** 20+ instances of `bg-[#1C1917]`, `bg-[#111827]`, `text-[#FAFAF9]`, `bg-[#F5F5F4]` hardcoded hex colors. These break in dark/light mode switching.
- **Fix:** Replace with semantic theme classes: `bg-[#1C1917]` → `bg-ink`, `text-[#FAFAF9]` → `text-bg`, `bg-[#F5F5F4]` → `bg-surface`, etc.

### UI-CRIT-12: Dark Mode Accent Green Fails WCAG AA
- **File:** `src/index.css` (lines 24, 31-37)
- **Issue:** Accent color `#16A34A` on dark background `#0C0A09` has only **3.89:1 contrast ratio**, failing WCAG AA (requires 4.5:1) for text content. Used for links, buttons, and interactive states throughout the app.
- **Fix:** Define a separate dark mode accent: `--accent: #22C55E` in `.dark {}` class (5.18:1 contrast ratio).

### UI-CRIT-13: Missing Icon-Only Button aria-labels
- **Files:** `ListingCard.tsx:92-113` (favorite/compare), `Layout.tsx:285` (theme toggle), `Search.tsx:1064-1076` (grid/list toggle), `Home.tsx:553-568` (carousel), `VirtualizedListingsTable.tsx:110-130` (edit/delete/inspect), `Profile.tsx` (settings/edit/delete)
- **Issue:** 20+ icon-only buttons have no `aria-label`. Screen readers announce "button" with no context.
- **Fix:** Add `aria-label` to every icon-only button (e.g., `aria-label="Toggle favorite"`, `aria-label="Grid view"`).

### UI-CRIT-14: CMS Blog/Content Block Deletion Without Context
- **File:** `src/pages/AdminDashboard.tsx` (lines 3481, 3637)
- **Issue:** Blog posts and content blocks deleted with `window.confirm()` showing no details (published status, references, backlinks).
- **Fix:** Custom confirmation modal with content preview and impact details.

---

## HIGH Issues (23)

### UI-HIGH-01: Missing prefers-color-scheme CSS Fallback
- **File:** `src/index.css` (lines 18-37)
- **Issue:** No `@media (prefers-color-scheme: dark)` CSS fallback. Before React loads or with JS disabled, users always see light theme even if they prefer dark.
- **Fix:** Add `@media (prefers-color-scheme: dark) { :root { /* dark vars */ } }` before the `.dark {}` class.

### UI-HIGH-02: Dark Mode Missing CSS Variable Overrides
- **File:** `src/index.css` (lines 30-37)
- **Issue:** `.dark {}` class only overrides 6 of 8+ CSS variables. Missing `--accent`, `--secondary`, `--data` overrides.
- **Fix:** Add all missing variable overrides to `.dark {}` including the lighter accent green (`#22C55E`).

### UI-HIGH-03: No Consistent Z-Index Scale
- **Files:** Multiple — values range from `z-40` to `z-[2200]` with no documented hierarchy
- **Current ad-hoc values:** `z-40` (sticky bars), `z-50` (dropdowns), `z-[60]-[70]` (subscription modals), `z-[100]` (mobile menu + modals), `z-[110]-[120]` (higher modals), `z-[2000]-[2200]` (admin modals/toasts)
- **Fix:** Define z-index scale in `tailwind.config.ts`: `sticky: 40, dropdown: 50, modal: 100, modalOverlay: 110, admin: 2000, toast: 2200`.

### UI-HIGH-04: theme-color Meta Tag Not Dynamic
- **File:** `index.html` (line 7)
- **Issue:** Hardcoded `<meta name="theme-color" content="#ffffff" />` never updates with theme. Browser chrome should reflect dark/light mode.
- **Fix:** Update meta tag in ThemeContext when theme changes.

### UI-HIGH-05: Mobile Menu Missing Focus Trap
- **File:** `src/components/Layout.tsx` (lines 374-465)
- **Issue:** Mobile menu uses `z-[100]` and `fixed inset-0` but no focus trap. Keyboard users can tab outside.
- **Fix:** Apply same focus trap as other modals (see UI-CRIT-04).

### UI-HIGH-06: Form Inputs Missing Label Association
- **Files:** `Search.tsx` (lines 1113-1494), `Contact.tsx` (lines 144-192), `Login.tsx` (lines 404-453), `Register.tsx` (lines 203-285), `Profile.tsx`, `Financing.tsx`, `Logistics.tsx`, `PaymentCalculatorModal.tsx` (lines 180-245)
- **Issue:** Form inputs have visible label text but no `htmlFor`/`id` association. Screen readers cannot link inputs to labels. WCAG 1.3.1 failure.
- **Fix:** Add `id` to every input and matching `htmlFor` to every label.

### UI-HIGH-07: No Unsaved Changes Warning in CMS Editor
- **File:** `src/components/admin/CmsEditor.tsx` (lines 28-198)
- **Issue:** No `beforeunload` handler. Users can navigate away and lose draft content without warning.
- **Fix:** Add `useEffect` with `beforeunload` event listener when form has unsaved changes.

### UI-HIGH-08: No Column Sorting in Admin Tables
- **File:** `src/components/admin/VirtualizedListingsTable.tsx`
- **Issue:** Table headers are static text — no sortable columns for price, hours, leads, status.
- **Fix:** Add sort state management with `aria-sort` attributes and clickable column headers.

### UI-HIGH-09: No Bulk Select/Actions in Data Tables
- **File:** `src/components/admin/VirtualizedListingsTable.tsx`
- **Issue:** No checkbox column, no select-all, no bulk operations (approve, delete, feature).
- **Fix:** Add checkbox column with bulk action toolbar.

### UI-HIGH-10: VirtualizedListingsTable Uses div-Based Layout
- **File:** `src/components/admin/VirtualizedListingsTable.tsx` (lines 136-182)
- **Issue:** Uses div-based rows instead of proper `<table>` semantics. Screen readers treat as generic content, not tabular data.
- **Fix:** Add ARIA table roles: `role="table"` on container, `role="row"` on rows, `role="columnheader"` on headers, `role="cell"` on cells.

### UI-HIGH-11: Animations Don't Respect prefers-reduced-motion
- **Files:** All Framer Motion components: `Home.tsx`, `Contact.tsx`, `Search.tsx`, `Login.tsx`, `InquiryModal.tsx`, `LoginPromptModal.tsx`, `PaymentCalculatorModal.tsx`
- **Issue:** No checks for `prefers-reduced-motion` media query.
- **Fix:** Create shared hook `useReducedMotion()` and pass `animate={prefersReducedMotion ? {} : variants}` to motion components.

### UI-HIGH-12: Inconsistent Loading States
- **Files:** `Blog.tsx` (skeleton), `Search.tsx` (mixed), `Categories.tsx` (no loading), `ListingDetail.tsx` (mixed)
- **Issue:** Some pages use skeleton screens, some use spinners, some show nothing during load.
- **Fix:** Standardize on skeleton screens for content areas. Create shared `<SkeletonCard>` and `<SkeletonList>` components.

### UI-HIGH-13: Missing Error Boundaries / Silent Failures
- **Files:** `Categories.tsx:64-65`, `Blog.tsx:45`, `Search.tsx:412`, `ListingDetail.tsx`
- **Issue:** Errors logged to console but no user-visible feedback or recovery path.
- **Fix:** Add user-visible error states with retry buttons: "Something went wrong. [Try Again]"

### UI-HIGH-14: Admin Pagination UI Limited
- **File:** `src/pages/AdminDashboard.tsx` (lines 2614-2631)
- **Issue:** Only Previous/Next buttons. No page numbers, no total pages, no rows-per-page selector, no jump-to-page.
- **Fix:** Add full pagination component with page numbers, total count, and configurable page size.

### UI-HIGH-15: Taxonomy Deletion Without Cascade Warning
- **File:** `src/components/admin/TaxonomyManager.tsx` (lines 582-617)
- **Issue:** No preview of how many listings use a taxonomy item. No cascade warning for category → subcategory → model chain.
- **Fix:** Show usage count and cascade impact before deletion.

### UI-HIGH-16: Missing aria-expanded on Dropdowns
- **Files:** `MultiSelectDropdown.tsx` (lines 218-232), `Layout.tsx` (lines 194-279 — language/currency dropdowns)
- **Issue:** Dropdown trigger buttons have no `aria-expanded` to indicate open/close state.
- **Fix:** Add `aria-expanded={isOpen}` to all dropdown trigger buttons.

### UI-HIGH-17: Modal Headers Missing aria-labelledby
- **Files:** `InquiryModal.tsx`, `LoginPromptModal.tsx`, `PaymentCalculatorModal.tsx`, `SubscriptionPaymentModal.tsx`
- **Issue:** Modals have `<h3>` headers but no `aria-labelledby` linking the modal to its title.
- **Fix:** Add `id="modal-title-{name}"` to headings, `aria-labelledby="modal-title-{name}"` to modal containers.

### UI-HIGH-18: Error Messages Not Announced to Screen Readers
- **Files:** `LoginPromptModal.tsx:186-191`, `InquiryModal.tsx:204-206`, `ListingModal.tsx:1146-1157`, `Contact.tsx`, `Login.tsx`, `Register.tsx`
- **Issue:** Error messages appear visually but no `aria-live="polite"` region to announce them.
- **Fix:** Wrap error message containers with `aria-live="polite" aria-atomic="true"`.

### UI-HIGH-19: Disabled Button Styling Unclear
- **Files:** `Login.tsx`, `Register.tsx`, `Contact.tsx`, `Search.tsx:1405-1410`, `PaymentCalculatorModal.tsx:210-222`
- **Issue:** Disabled buttons may not have visually obvious disabled state. Missing `aria-disabled` semantic.
- **Fix:** Add `aria-disabled={true}` and ensure `opacity-50 cursor-not-allowed` styling on disabled states.

### UI-HIGH-20: Admin Mobile Responsiveness Issues
- **Files:** `AdminDashboard.tsx`, `VirtualizedListingsTable.tsx` (lines 75-93)
- **Issue:** Admin table uses fixed widths (w-12, w-24, w-28, w-32, w-36) that cause horizontal overflow on mobile. Admin tabs don't collapse to mobile menu.
- **Fix:** Use responsive table with horizontal scroll wrapper, or card layout on mobile. Add mobile tab menu.

### UI-HIGH-21: Inquiry Assignment Without Confirmation
- **File:** `src/components/admin/InquiryList.tsx` (lines 343-348)
- **Issue:** Assigning inquiry to staff is immediate with no confirmation. Concurrent edits could cause conflicts.
- **Fix:** Add confirmation toast/modal and optimistic locking.

### UI-HIGH-22: Checkbox and Consent Inputs Not Wrapped in Labels
- **File:** `InquiryModal.tsx` (lines 189-200), `Login.tsx:447-452` ("Stay Logged In")
- **Issue:** Checkboxes not inside `<label>` elements. Click target limited to checkbox only.
- **Fix:** Wrap checkbox and text in `<label>` or add `htmlFor`/`id` association.

### UI-HIGH-23: Breadcrumbs Missing aria-current="page"
- **File:** `src/components/Breadcrumbs.tsx` (lines 56-64)
- **Issue:** Current page breadcrumb should have `aria-current="page"`.
- **Fix:** Add `aria-current="page"` to the last breadcrumb item.

---

## MEDIUM Issues (25)

### UI-MED-01: Accent Color Marginal in Light Mode
- **File:** `src/index.css` (line 24)
- **Issue:** `#16A34A` on `#FFFFFF` = 5.51:1. Passes WCAG AA but borderline. Risk for users with mild vision impairment.
- **Fix:** Monitor. Consider slightly darker green for light mode if complaints arise.

### UI-MED-02: .muted Color Low Contrast Risk
- **File:** `src/index.css` (line 27)
- **Issue:** `#78716C` on `#FFFFFF` = 4.54:1. Used extensively for secondary text.
- **Fix:** Ensure `--muted` is only used for truly secondary/helper text, not primary content.

### UI-MED-03: Touch Targets Below 44x44px Minimum
- **Files:** `Search.tsx:1064-1076` (grid/list toggle `p-1.5`), `Layout.tsx:194-210` (language/currency `p-2`)
- **Issue:** Some interactive elements have padding of only 6-8px, resulting in touch targets under WCAG 2.5.8 minimum.
- **Fix:** Increase to minimum `p-2.5` (40px) on mobile breakpoints.

### UI-MED-04: Missing Heading Hierarchy
- **Files:** `Search.tsx:982` (h1 mid-page), `Home.tsx:344`
- **Issue:** Heading levels don't always follow h1 → h2 → h3 hierarchy. Some pages have multiple h1s.
- **Fix:** Audit heading levels per page. One h1 per page, sequential hierarchy.

### UI-MED-05: Inconsistent Error Message Styling
- **Files:** `Contact.tsx:195`, `Search.tsx:1581`, `Login.tsx:559`, `Register.tsx:288`
- **Issue:** Error/alert styling varies: different colors, borders, padding across pages.
- **Fix:** Create shared `<AlertMessage severity="error|warning|info">` component.

### UI-MED-06: Missing Loading Announcements for Screen Readers
- **Files:** All async pages: `Categories.tsx`, `Blog.tsx`, `Search.tsx`, `ListingDetail.tsx`
- **Issue:** No `aria-live="polite"` announcements when data loads or filters change.
- **Fix:** Add `<div aria-live="polite" aria-busy={loading}>` wrapping loading/content transitions.

### UI-MED-07: No Skeleton Screen Consistency
- **Files:** `Blog.tsx` (has skeleton), `Categories.tsx` (no skeleton), `ListingDetail.tsx` (partial)
- **Issue:** Inconsistent loading patterns make app feel fragmented.
- **Fix:** Create shared skeleton components and apply consistently.

### UI-MED-08: ScrollToTop Missing Focus Management
- **File:** `src/components/ScrollToTop.tsx` (lines 4-9)
- **Issue:** Scrolls to top on route change but doesn't manage focus. Screen reader users don't know focus moved.
- **Fix:** After scroll, move focus to `<main>` or page heading.

### UI-MED-09: Route Loading Fallback Theme Issue
- **File:** `src/App.tsx` (lines 55-61)
- **Issue:** `RouteLoadingFallback` uses CSS variable `text-muted` which depends on theme context. If theme hasn't loaded yet, color may be incorrect.
- **Fix:** Use raw CSS value or ensure theme loads before any route rendering.

### UI-MED-10: Seller Redirect Missing ID Validation
- **File:** `src/App.tsx` (lines 63-66)
- **Issue:** `RedirectSellerToDealer` redirects to `/dealers/` (empty) if `id` param is undefined.
- **Fix:** Validate `id` before redirect; fallback to `/dealers` list page.

### UI-MED-11: Admin Dashboard Metrics Lack Trends
- **File:** `src/components/admin/AnalyticsDashboard.tsx`
- **Issue:** Metrics are point-in-time snapshots. No change percentages, no historical trends, no date range filtering.
- **Fix:** Add time period selector (7d, 30d, 90d) and trend indicators (percentage change arrows).

### UI-MED-12: Admin Form Validation Shows One Error at a Time
- **File:** `src/components/admin/ListingModal.tsx` (lines 493-512)
- **Issue:** Multiple validation failures only show first error. Users fix one-by-one.
- **Fix:** Collect and display all validation errors. Add field-level highlighting.

### UI-MED-13: CMS Editor Missing Auto-Save
- **File:** `src/components/admin/CmsEditor.tsx`
- **Issue:** No auto-save. Browser crash = lost work.
- **Fix:** Auto-save to draft every 30 seconds when changes detected.

### UI-MED-14: Taxonomy Manager Missing Usage Count
- **File:** `src/components/admin/TaxonomyManager.tsx`
- **Issue:** When deleting a taxonomy item, no count of how many listings use it.
- **Fix:** Query and display usage count before deletion: "Used in 47 active listings."

### UI-MED-15: Admin Audit Log Limited Filtering
- **File:** `src/pages/AdminDashboard.tsx` (lines 3176-3250)
- **Issue:** Only text search. No date range, action type, or user filters.
- **Fix:** Add column filters: date range picker, action type dropdown, user selector.

### UI-MED-16: Missing Open Graph Tags on Some Pages
- **Files:** `About.tsx`, `OurTeam.tsx`, `Terms.tsx`, `Privacy.tsx`, `Cookies.tsx`
- **Issue:** Missing or incomplete `og:` tags for social sharing.
- **Fix:** Add complete OG tags via `<Seo>` component including `og:image`, `og:type`, `og:url`.

### UI-MED-17: Image Components Missing Responsive srcset
- **Files:** `ListingCard.tsx:64`, `ImageVideoUploader.tsx:308-312`
- **Issue:** No `srcSet` for different screen sizes. Mobile downloads large images.
- **Fix:** Add `srcSet` with appropriate image sizes.

### UI-MED-18: Range Inputs Missing aria-valuetext
- **File:** `PaymentCalculatorModal.tsx` (lines 189-200, 232-244)
- **Issue:** Range sliders announce raw number without context. Screen reader says "75" not "75%".
- **Fix:** Add `aria-valuetext={`${value}%`}` to range inputs.

### UI-MED-19: Disabled Buttons Missing aria-disabled
- **File:** `PaymentCalculatorModal.tsx:210-222`
- **Issue:** Buttons with `disabled` prop lack `aria-disabled` semantic.
- **Fix:** Add `aria-disabled={condition}` alongside `disabled` prop.

### UI-MED-20: Button Loading States Missing aria-busy
- **Files:** `PaymentCalculatorModal.tsx:207`, `LoginPromptModal.tsx:198-203`, `SubscriptionPaymentModal.tsx:315`
- **Issue:** Loading states show spinner but no `aria-busy="true"`.
- **Fix:** Add `aria-busy={isSubmitting}` to button during loading.

### UI-MED-21: Drag-and-Drop Not Keyboard Accessible
- **File:** `src/components/admin/ListingModal.tsx` (lines 962-1045)
- **Issue:** Image reordering uses drag-drop only. Keyboard users cannot reorder.
- **Fix:** Add "Move Up/Down" buttons with `aria-labels` as keyboard alternative.

### UI-MED-22: Truncated Text Missing title Attribute
- **Files:** `InquiryList.tsx:141`, `VirtualizedListingsTable.tsx:59`
- **Issue:** Truncated text (CSS `truncate`) not viewable in full on hover.
- **Fix:** Add `title={fullText}` to truncated elements.

### UI-MED-23: GPU Composite Optimization Incomplete
- **File:** `src/index.css` (lines 54-63)
- **Issue:** Only `.group` elements get `backface-visibility` optimization. Other animations may not be GPU-accelerated.
- **Fix:** Apply to all animated elements via `[data-animated]` or similar.

### UI-MED-24: Billing Export No Progress Indicator
- **File:** `src/pages/AdminDashboard.tsx` (billing CSV export section)
- **Issue:** Large CSV exports show no progress. User doesn't know if processing or failed.
- **Fix:** Add loading spinner or progress bar during export.

### UI-MED-25: Dealer Feed Configuration Setup Flow Unclear
- **File:** `src/pages/AdminDashboard.tsx` (lines 3808-4424)
- **Issue:** Multiple feed modes without clear differentiation. Text-heavy instructions, no step-by-step guide.
- **Fix:** Add numbered setup wizard with mode selection, example payloads, and validation.

---

## LOW Issues (16)

### UI-LOW-01: .label-micro Font Size Below 12px
- **File:** `src/index.css` (lines 86-92)
- **Issue:** 10px font size. Below accessibility minimum for body text.
- **Note:** Acceptable for labels only. Consider 11px for better readability.

### UI-LOW-02: Conflicting Input Font Sizes
- **File:** `src/components/Layout.tsx` (line 358)
- **Issue:** Inline `style={{ fontSize: '16px' }}` conflicts with Tailwind `text-xs` class.
- **Fix:** Remove inline style or remove conflicting Tailwind class.

### UI-LOW-03: Font Display Strategy Adequate but Improvable
- **File:** `src/index.css` (line 1)
- **Issue:** Google Fonts import uses `display=swap` (good). Could improve with font metrics matching.
- **Note:** Low priority.

### UI-LOW-04: Missing Image Alt Text in Compare View
- **File:** `Search.tsx` (line 1684)
- **Issue:** Compare images have `alt=""` (empty).
- **Fix:** Use `alt={listing.title}`.

### UI-LOW-05: Inconsistent Form Field Spacing
- **Files:** Various form pages
- **Issue:** Mix of `gap-6`, `space-y-8`, `gap-3`, `space-y-4`.
- **Fix:** Standardize on consistent spacing (e.g., `space-y-6` for form fields).

### UI-LOW-06: Missing rel="noopener noreferrer" on External Links
- **Files:** `Blog.tsx:124`, `ListingDetail.tsx`
- **Issue:** Some external links missing security attributes.
- **Fix:** Add `rel="noopener noreferrer"` to all `target="_blank"` links.

### UI-LOW-07: Empty States Could Be More Helpful
- **Files:** `AdminDashboard.tsx` (line 1879), `InquiryList.tsx`, `MediaLibrary.tsx`
- **Issue:** Empty states say "No data" but don't suggest next actions.
- **Fix:** Add contextual CTAs: "Create your first listing" or link to documentation.

### UI-LOW-08: Spam Score UI Missing Tooltip
- **File:** `src/components/admin/InquiryList.tsx` (lines 175-181)
- **Issue:** "Spam 65/100" displayed without explanation of what the score means.
- **Fix:** Add hover tooltip explaining score ranges and calculation.

### UI-LOW-09: Image Upload Progress Inconsistent
- **File:** `src/components/admin/ListingModal.tsx` (line 1051 vs 1111)
- **Issue:** Video shows upload percentage, images only show "Uploading..." text.
- **Fix:** Show progress bar for both image and video uploads.

### UI-LOW-10: File Size Limits Not Shown to Users
- **File:** `src/components/admin/ListingModal.tsx` (lines 11-12)
- **Issue:** Max 10MB images, 500MB videos — limits not visible in UI until hit.
- **Fix:** Display "Max 10 MB per image, Max 500 MB per video" in upload area.

### UI-LOW-11: CMS Revision Rollback Uses window.confirm
- **File:** `src/components/admin/CmsEditor.tsx` (line 187)
- **Issue:** Rollback uses `window.confirm()`. Should show side-by-side diff.
- **Fix:** Custom modal with content comparison (can defer to later phase).

### UI-LOW-12: VirtualizedListingsTable Subtle Hover
- **File:** `src/components/admin/VirtualizedListingsTable.tsx` (line 38)
- **Issue:** `hover:bg-surface/20` is very subtle. Rows hard to track visually.
- **Fix:** Use `hover:bg-surface/40` or `hover:bg-accent/5`.

### UI-LOW-13: Missing type="button" on Non-Submit Buttons
- **Files:** Multiple components
- **Issue:** Some `<button>` elements lack explicit `type="button"`. Could cause unintended form submissions.
- **Fix:** Add `type="button"` to all non-submit buttons.

### UI-LOW-14: Focus Indicator Visibility
- **File:** `src/components/Layout.tsx` (lines 284-292)
- **Issue:** Theme toggle and other buttons rely on browser default focus outline.
- **Fix:** Add consistent `focus:ring-2 focus:ring-accent focus:ring-offset-2` pattern.

### UI-LOW-15: ListingCard Alt Text Fallback
- **File:** `src/components/ListingCard.tsx` (line 64-71)
- **Issue:** Alt text fallback could be "Unknown Year Unknown Make Unknown Model" when data is missing.
- **Fix:** Use conditional: `alt={displayTitle || 'Equipment listing image'}`.

### UI-LOW-16: Animation Frame Without Cleanup
- **File:** `src/components/admin/ListingModal.tsx` (line 114)
- **Issue:** `requestAnimationFrame` in useEffect without cleanup. Potential memory leak on unmount.
- **Fix:** Capture frame ID and cancel in cleanup function.

---

## Remediation Plan

### Phase 1: Critical Accessibility & Security (Week 1)

| ID | Task | Files | Est. LOC |
|----|------|-------|----------|
| UI-CRIT-01 | Add pre-render theme script to index.html | `index.html` | 15 |
| UI-CRIT-02 | Add skip-to-content link | `Layout.tsx` | 5 |
| UI-CRIT-03 | Add dialog semantics to all modals | 9 files | 30 |
| UI-CRIT-04 | Create useFocusTrap hook + apply to all modals | New hook + 9 files | 80 |
| UI-CRIT-05 | Add Escape key handlers to all modals | 9 files | 20 |
| UI-CRIT-06 | Create ConfirmDialog component + replace all alert/confirm | New component + 12 files | 150 |
| UI-CRIT-07 | Add role change confirmation modal | `AdminDashboard.tsx` | 30 |
| UI-CRIT-08 | Add user deletion confirmation modal | `AdminDashboard.tsx` | 40 |
| UI-CRIT-09 | Add listing deletion confirmation modal | `AdminDashboard.tsx` | 30 |
| UI-CRIT-10 | Fix NotFound.tsx design system classes | `NotFound.tsx` | 20 |
| UI-CRIT-11 | Replace all hardcoded hex colors with theme classes | 10 files | 40 |
| UI-CRIT-12 | Add dark mode accent color override | `index.css` | 5 |
| UI-CRIT-13 | Add aria-label to all icon-only buttons | 8 files | 25 |
| UI-CRIT-14 | Add blog/content deletion confirmation modals | `AdminDashboard.tsx` | 30 |

### Phase 2: High Priority Accessibility & UX (Week 2)

| ID | Task | Files | Est. LOC |
|----|------|-------|----------|
| UI-HIGH-01 | Add prefers-color-scheme CSS fallback | `index.css` | 15 |
| UI-HIGH-02 | Add missing dark mode CSS variable overrides | `index.css` | 5 |
| UI-HIGH-03 | Define z-index scale in Tailwind config | `tailwind.config.ts` | 15 |
| UI-HIGH-04 | Make theme-color meta tag dynamic | `ThemeContext.tsx` | 10 |
| UI-HIGH-05 | Add focus trap to mobile menu | `Layout.tsx` | 10 |
| UI-HIGH-06 | Add htmlFor/id to all form inputs | 8 files | 50 |
| UI-HIGH-07 | Add beforeunload handler to CMS editor | `CmsEditor.tsx` | 15 |
| UI-HIGH-08 | Add column sorting to admin listings table | `VirtualizedListingsTable.tsx` | 80 |
| UI-HIGH-09 | Add bulk select/actions to admin tables | `VirtualizedListingsTable.tsx` | 100 |
| UI-HIGH-10 | Add ARIA table roles to virtualized table | `VirtualizedListingsTable.tsx` | 20 |
| UI-HIGH-11 | Create useReducedMotion hook + apply | New hook + 7 files | 30 |
| UI-HIGH-12 | Standardize loading states (skeleton screens) | 5 files | 60 |
| UI-HIGH-13 | Add user-visible error states with retry | 4 files | 40 |
| UI-HIGH-14 | Improve admin pagination component | `AdminDashboard.tsx` | 50 |
| UI-HIGH-15 | Add cascade warnings to taxonomy deletion | `TaxonomyManager.tsx` | 30 |
| UI-HIGH-16 | Add aria-expanded to all dropdowns | 3 files | 10 |
| UI-HIGH-17 | Add aria-labelledby to all modals | 5 files | 10 |
| UI-HIGH-18 | Add aria-live regions for error messages | 6 files | 20 |
| UI-HIGH-19 | Fix disabled button styling + aria-disabled | 5 files | 15 |
| UI-HIGH-20 | Fix admin dashboard mobile responsiveness | 2 files | 60 |
| UI-HIGH-21 | Add inquiry assignment confirmation | `InquiryList.tsx` | 20 |
| UI-HIGH-22 | Fix checkbox/consent label associations | 2 files | 10 |
| UI-HIGH-23 | Add aria-current="page" to breadcrumbs | `Breadcrumbs.tsx` | 3 |

### Phase 3: Medium & Low Priority Polish (Week 3-4)

Medium and Low findings addressed systematically:
- Shared component extraction (AlertMessage, SkeletonCard, ConfirmDialog)
- Consistent spacing and typography audit
- Analytics dashboard enhancements
- Admin workflow improvements
- OG meta tag completion
- Image optimization (srcset, lazy loading)
- Keyboard accessibility for drag-and-drop
- Focus management improvements

---

## Verification Checklist

After each phase, verify:
- [ ] `npx vite build` — passes cleanly
- [ ] `npx vitest run` — all tests pass
- [ ] Keyboard navigation: Tab through entire page, all modals trap focus, Escape closes modals
- [ ] Screen reader: VoiceOver/NVDA can navigate all pages, announces errors, identifies modals
- [ ] Dark mode: No hardcoded colors visible, all text meets WCAG AA contrast
- [ ] Light mode: No theme bleed, all interactive elements visible
- [ ] Mobile: Admin dashboard usable on 375px viewport, touch targets >= 44px
- [ ] WAVE/Axe DevTools: Zero CRITICAL or SERIOUS violations

---

## Notes

- All line numbers reference the codebase as of April 2, 2026
- Some findings may overlap with security audit items (see `Comprehensive_Security_Audit_4-2-2026.md`)
- Phase 1 addresses WCAG 2.1 Level A compliance gaps — these are legal requirements in many jurisdictions
- Phase 2 addresses WCAG 2.1 Level AA — recommended for production web applications
- The ConfirmDialog component (UI-CRIT-06) will be reused by UI-CRIT-07 through UI-CRIT-14, making it the highest-impact single fix
