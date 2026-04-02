# SEO Phase 1: Critical Fixes Implementation Plan

Prepared: April 1, 2026
Project: Forestry Equipment Sales (TimberEquip.com → forestryequipmentsales.com)

## Purpose

This plan covers the immediate SEO fixes that can be implemented in the current React/Firebase stack without waiting for PostgreSQL. These changes directly impact crawl quality, rich results eligibility, and ranking potential.

## Domain Context

- Current live domain: `timberequip.com`
- Target canonical domain: `https://www.forestryequipmentsales.com`
- Codebase `BASE_URL` already set to `https://www.forestryequipmentsales.com`
- When the domain cutover happens, `timberequip.com/*` will 301 to `www.forestryequipmentsales.com/*` (path-preserved)

## Legacy URL Migration

The existing forestryequipmentsales.com has legacy listing URLs like:

```
/2366/667/11525/Clark-667D-Cable-Skidder.html
```

Pattern: `/{category-id}/{manufacturer-id}/{listing-id}/{slug}.html`

When the 1,300 legacy listings are imported, each must be mapped to the new canonical format:

```
/equipment/{seo-slug}--{encoded-id}
```

Example:
- Old: `/2366/667/11525/Clark-667D-Cable-Skidder.html`
- New: `/equipment/clark-667d-cable-skidder-southwest-usa--MTExMjU`

A redirect map will be created during the import process. All legacy `/{number}/**/*.html` paths will 301 to their new canonical paths. This will be implemented as a Cloud Function middleware or Firebase Hosting rewrite rule.

---

## Change 1: Noindex /search Page

**File:** `src/pages/Search.tsx`
**Line:** ~752

**Current:**
```tsx
<Seo title={seoTitle} description={seoDescription} canonicalPath="/search" jsonLd={itemListJsonLd} />
```

**Change:**
```tsx
<Seo title={seoTitle} description={seoDescription} canonicalPath="/search" robots="noindex, follow" jsonLd={itemListJsonLd} />
```

**Why:** The search page is a faceted filter experience, not a ranking page. Indexing it creates duplicate intent and thin-content noise. `noindex, follow` lets crawlers discover linked pages without indexing the search UI itself.

---

## Change 2: Add Organization + WebSite Schema to Home Page

**File:** `src/pages/Home.tsx`
**Line:** ~260-290 (existing `homeJsonLd` useMemo)

**Change:** Add `Organization` and `WebSite` entities to the existing `@graph` array.

```json
{
  "@type": "Organization",
  "name": "Forestry Equipment Sales",
  "url": "https://www.forestryequipmentsales.com",
  "logo": "https://www.forestryequipmentsales.com/Forestry_Equipment_Sales_Logo.png",
  "email": "info@forestryequipmentsales.com",
  "description": "New and used logging equipment marketplace connecting buyers, sellers, and dealers across North America.",
  "sameAs": []
},
{
  "@type": "WebSite",
  "name": "Forestry Equipment Sales",
  "url": "https://www.forestryequipmentsales.com"
}
```

**Why:** Google uses Organization schema for Knowledge Panel and entity understanding. WebSite schema establishes the site as a named entity. These are baseline requirements for marketplace authority.

---

## Change 3: Add Article/BlogPosting Schema to Blog Posts

**File:** `src/pages/BlogPostDetail.tsx`
**Line:** ~184 (Seo component)

**Change:** Add `jsonLd` prop with `BlogPosting` and `BreadcrumbList` schema.

```json
{
  "@type": "BlogPosting",
  "headline": "{post.title}",
  "description": "{post.summary}",
  "datePublished": "{post.publishedAt}",
  "dateModified": "{post.updatedAt || post.publishedAt}",
  "author": {
    "@type": "Organization",
    "name": "Forestry Equipment Sales"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Forestry Equipment Sales",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.forestryequipmentsales.com/Forestry_Equipment_Sales_Logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.forestryequipmentsales.com/blog/{slug}"
  },
  "image": "{post.image || default}"
}
```

**Why:** Article/BlogPosting schema enables rich results (author, date, image in search). It signals editorial authority and helps Google understand content type.

---

## Change 4: Fix /seller/* to /dealers/* Canonical Conflict

**File:** `src/pages/SellerProfile.tsx`
**Line:** ~364

**Current:**
```tsx
return `/seller/${seller.storefrontSlug || seller.id}`;
```

This fallback means non-dealer storefronts (owner-operators) canonicalize to `/seller/*` while dealers use `/dealers/*`. This splits link equity.

**Change:** All public storefronts should canonicalize to `/dealers/*` regardless of role. The `/seller/*` route should 301 redirect to `/dealers/*`.

```tsx
return `/dealers/${seller.storefrontSlug || seller.id}`;
```

Also add a redirect in the router or Cloud Function:
- `/seller/{slug}` → 301 → `/dealers/{slug}`
- `/seller/{slug}/inventory` → 301 → `/dealers/{slug}/inventory`

**Why:** Split canonicals fragment link equity between two URL patterns for the same content. Google may index both, diluting authority.

---

## Change 5: Add ContactPage + ContactPoint Schema to Contact Page

**File:** `src/pages/Contact.tsx`
**Line:** ~70

**Change:** Add `jsonLd` prop to the Seo component.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "name": "Contact Forestry Equipment Sales",
      "url": "https://www.forestryequipmentsales.com/contact"
    },
    {
      "@type": "Organization",
      "name": "Forestry Equipment Sales",
      "url": "https://www.forestryequipmentsales.com",
      "email": "info@forestryequipmentsales.com",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "support@forestryequipmentsales.com",
          "availableLanguage": "English"
        },
        {
          "@type": "ContactPoint",
          "contactType": "sales",
          "email": "info@forestryequipmentsales.com",
          "availableLanguage": "English"
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.forestryequipmentsales.com/" },
        { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://www.forestryequipmentsales.com/contact" }
      ]
    }
  ]
}
```

**Why:** ContactPage and ContactPoint schema help Google understand how to reach the business, improving Knowledge Panel completeness and entity trust.

---

## Change 6: Add FAQPage Schema to FAQ Page

**File:** `src/pages/Faq.tsx`
**Line:** ~140

**Change:** Generate FAQPage schema from the existing `faqItems` array and pass as `jsonLd`.

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{answer}"
      }
    }
  ]
}
```

**Why:** FAQPage schema can trigger FAQ rich results in search, showing expandable Q&A directly in the SERP. The data already exists in `faqCategories` — it just needs to be emitted as structured data.

---

## Change 7: Expand Default Robots Directive

**File:** `src/components/Seo.tsx`

**Current default robots (when indexing allowed):**
```tsx
'index, follow'
```

**Change to:**
```tsx
'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
```

**Why:** These directives tell Google it can use large image previews, unlimited text snippets, and video previews in search results. This enables richer, more clickable SERP listings without any downside.

---

## Change 8: Add LocalBusiness Schema with PostalAddress to Dealer Pages

**File:** `src/pages/SellerProfile.tsx`
**Line:** ~367-404

**Current:** Uses `@type: Organization` with `address: seller.location` (freeform string).

**Change:** For dealer/pro_dealer roles, upgrade to `LocalBusiness` with structured address fields. Since dealers currently only have a freeform `location` string, parse what we can and use the string as `streetAddress` fallback.

```json
{
  "@type": "LocalBusiness",
  "name": "{headline}",
  "url": "https://www.forestryequipmentsales.com/dealers/{slug}",
  "logo": "{logoImage}",
  "image": "{coverImage}",
  "description": "{description}",
  "email": "{seller.email}",
  "telephone": "{seller.phone}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{seller.location}"
  }
}
```

**Future improvement (Phase 2):** Expand the `Seller` type with structured address fields (`street1`, `city`, `state`, `postalCode`, `country`, `latitude`, `longitude`) and populate the full `PostalAddress` + `GeoCoordinates` schema.

**Why:** LocalBusiness schema with PostalAddress is how Google Maps, local packs, and dealer-discovery searches find businesses. A freeform string is better than nothing, but structured fields are the target.

---

## Change 9: Normalize Corporate NAP

**Current state:** Multiple email addresses appear across the site:
- `info@forestryequipmentsales.com` — Layout footer, FAQ, Logistics, OurTeam, DMCA
- `support@forestryequipmentsales.com` — Layout footer, Contact, FAQ, Cookies

**Decision needed from leadership:** Which is the primary public contact email?

**Recommended approach:**
- `info@forestryequipmentsales.com` = general/public/sales contact (footer, about, our team)
- `support@forestryequipmentsales.com` = customer service (contact form, FAQ support section)

Both are valid and serve different purposes. The key is consistency:
- Footer should show both with clear labels
- Schema `Organization.email` should use `info@`
- Schema `ContactPoint[customer service]` should use `support@`

**No phone number** is currently shown in the footer or contact page (only in FAQ text). When a corporate phone is decided, it should appear in:
- Footer
- Contact page
- Organization schema
- Google Business Profile

---

## Change 10: Handle /logging-equipment-for-sale

**Current:** `/logging-equipment-for-sale` redirects to `/forestry-equipment-for-sale`

**User decision:** Keep both URLs but serve the same content (the forestry hub) with both "logging" and "forestry" keywords naturally present on the page.

**Implementation:** Instead of a redirect, render the same `ForestryHubPage` component at both routes. The `/logging-equipment-for-sale` route gets a slightly different title and description to capture the "logging" head term:

- Title: `Logging Equipment for Sale | New & Used Forestry Equipment For Sale`
- Description: `Browse new and used logging equipment for sale including skidders, forwarders, feller bunchers, log loaders, delimbers, and more from dealers and owners.`

The page content, listings, and internal links are identical. The canonical for `/logging-equipment-for-sale` self-canonicalizes (it is NOT a duplicate — it has a distinct title and description targeting a different search intent).

**Why:** "logging equipment for sale" and "forestry equipment for sale" are different head terms with different search volumes. Having two distinct entry points with unique metadata but shared inventory captures both intents without creating thin duplicate content.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/Search.tsx` | Add `robots="noindex, follow"` |
| `src/pages/Home.tsx` | Add Organization + WebSite to JSON-LD graph |
| `src/pages/BlogPostDetail.tsx` | Add BlogPosting JSON-LD |
| `src/pages/SellerProfile.tsx` | Fix canonical to always use /dealers/*, upgrade to LocalBusiness schema |
| `src/pages/Contact.tsx` | Add ContactPage + ContactPoint JSON-LD |
| `src/pages/Faq.tsx` | Add FAQPage JSON-LD from existing Q&A data |
| `src/components/Seo.tsx` | Expand default robots to include max-image-preview, max-snippet |
| `src/App.tsx` | Add /logging-equipment-for-sale route (renders ForestryHubPage variant) |
| `src/pages/SeoLandingPages.tsx` | Add LoggingHubPage with logging-specific metadata |

---

## Verification

1. Build passes: `npx vite build`
2. All pages still render correctly
3. View source on each modified page to verify:
   - Correct `<meta name="robots">` value
   - Correct `<script type="application/ld+json">` content
   - Correct `<link rel="canonical">` href
4. Google Rich Results Test: paste JSON-LD from FAQ, Contact, Blog, Dealer, and Home pages
5. Google Search Console: re-submit sitemap after deploy

---

## What This Does NOT Cover (Phase 2+)

- Admin SEO management panel (title/description overrides per route)
- Redirect manager (301 mapping for legacy URLs)
- Social share image generation (Logo + Page Title for static pages)
- Split sitemaps (sitemap-index.xml with type-based splits)
- Structured dealer address fields (street, city, state, zip, geo)
- PostgreSQL SEO read models
- Legacy URL redirect map for 1,300 imported listings
- Content authority layer (/guides/* buying guides)
