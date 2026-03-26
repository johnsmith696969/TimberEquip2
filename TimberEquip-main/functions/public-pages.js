const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const PROJECT_ID = 'mobile-app-equipment-sales';
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_BASE_URL = 'https://www.timberequip.com';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
  });
}

function getDb() {
  return getFirestore(FIRESTORE_DB_ID);
}

function normalizeText(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeSeoSlug(value, fallback = '') {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function titleCaseSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timestampToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6));
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function timestampToIso(value) {
  const parsed = timestampToDate(value);
  return parsed ? parsed.toISOString() : null;
}

function getRequestBaseUrl(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return forwardedHost ? `${forwardedProto || 'https'}://${forwardedHost}` : DEFAULT_BASE_URL;
}

function formatCurrency(price, currency = 'USD') {
  const numericPrice = Number(price || 0);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return 'Request Price';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'USD').toUpperCase(),
      maximumFractionDigits: 0,
    }).format(numericPrice);
  } catch {
    return `${String(currency || 'USD').toUpperCase()} ${numericPrice.toLocaleString('en-US')}`;
  }
}

function normalizeImageUrls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter((entry) => /^https?:\/\//i.test(entry));
}

function getStateFromLocation(location) {
  const parts = String(location || '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts[parts.length - 2];
  }

  return parts[0] || '';
}

function isListingVisible(listing) {
  const approvalStatus = normalizeText(listing.approvalStatus).toLowerCase();
  const paymentStatus = normalizeText(listing.paymentStatus).toLowerCase();
  const status = normalizeText(listing.status, 'active').toLowerCase();

  if (approvalStatus !== 'approved') return false;
  if (paymentStatus !== 'paid') return false;
  if (status === 'sold') return false;

  const expiresAt = timestampToDate(listing.expiresAt);
  return !expiresAt || expiresAt.getTime() > Date.now();
}

function pickManufacturer(listing) {
  return normalizeText(listing.make || listing.manufacturer || listing.brand);
}

function buildListingUrl(id) {
  return `/listing/${encodeURIComponent(id)}`;
}

function buildDealerPath(seller) {
  const publicId = normalizeText(seller?.storefrontSlug || seller?.id);
  return `/dealers/${encodeURIComponent(publicId)}`;
}

function buildCategoryPath(category) {
  return `/categories/${normalizeSeoSlug(category, 'equipment')}`;
}

function buildManufacturerPath(manufacturer) {
  return `/manufacturers/${normalizeSeoSlug(manufacturer, 'brand')}`;
}

function buildManufacturerCategoryPath(manufacturer, category) {
  return `/manufacturers/${normalizeSeoSlug(manufacturer, 'brand')}/${normalizeSeoSlug(category, 'equipment')}-for-sale`;
}

function buildManufacturerModelPath(manufacturer, model) {
  return `/manufacturers/${normalizeSeoSlug(manufacturer, 'brand')}/models/${normalizeSeoSlug(model, 'model')}`;
}

function buildManufacturerModelCategoryPath(manufacturer, model, category) {
  return `${buildManufacturerModelPath(manufacturer, model)}/${normalizeSeoSlug(category, 'equipment')}-for-sale`;
}

function buildStateMarketPath(state, market) {
  return `/states/${normalizeSeoSlug(state, 'region')}/${market === 'forestry' ? 'forestry-equipment-for-sale' : 'logging-equipment-for-sale'}`;
}

function buildStateCategoryPath(state, category) {
  return `/states/${normalizeSeoSlug(state, 'region')}/${normalizeSeoSlug(category, 'equipment')}-for-sale`;
}

function parseForSaleSlug(value) {
  return String(value || '').replace(/-for-sale$/, '');
}

function createCountLinks(values, pathBuilder, limit = 12) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, path: pathBuilder(label) }));
}

let publicInventoryCache = null;

async function loadSellerRecords(sellerUids) {
  const normalizedSellerUids = [...new Set(sellerUids.map((sellerUid) => normalizeText(sellerUid)).filter(Boolean))];
  if (!normalizedSellerUids.length) return new Map();

  const db = getDb();
  const userRefs = normalizedSellerUids.map((sellerUid) => db.collection('users').doc(sellerUid));
  const storefrontRefs = normalizedSellerUids.map((sellerUid) => db.collection('storefronts').doc(sellerUid));
  const [userDocs, storefrontDocs] = await Promise.all([db.getAll(...userRefs), db.getAll(...storefrontRefs)]);

  const sellerMap = new Map();

  normalizedSellerUids.forEach((sellerUid, index) => {
    const userData = userDocs[index]?.exists ? userDocs[index].data() || {} : {};
    const storefrontData = storefrontDocs[index]?.exists ? storefrontDocs[index].data() || {} : {};
    const merged = { ...userData, ...storefrontData };

    sellerMap.set(sellerUid, {
      id: sellerUid,
      uid: sellerUid,
      storefrontSlug: normalizeText(merged.storefrontSlug, sellerUid),
      storefrontName: normalizeText(merged.storefrontName || merged.displayName || merged.name, 'Dealer Storefront'),
      storefrontTagline: normalizeText(merged.storefrontTagline),
      storefrontDescription: normalizeText(merged.storefrontDescription || merged.about),
      location: normalizeText(merged.location),
      phone: normalizeText(merged.phone || merged.phoneNumber),
      email: normalizeText(merged.email),
      website: normalizeText(merged.website),
      logo: normalizeText(merged.logo || merged.photoURL),
      coverPhotoUrl: normalizeText(merged.coverPhotoUrl),
      role: normalizeText(merged.role),
      createdAtIso: timestampToIso(merged.createdAt),
      verified: Boolean(merged.verified ?? true),
    });
  });

  return sellerMap;
}

async function loadPublicInventory(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && publicInventoryCache && now - publicInventoryCache.fetchedAt < CACHE_TTL_MS) {
    return publicInventoryCache;
  }

  const snapshot = await getDb()
    .collection('listings')
    .where('approvalStatus', '==', 'approved')
    .where('paymentStatus', '==', 'paid')
    .get();

  const listings = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};
      const sellerUid = normalizeText(data.sellerUid || data.sellerId);
      const images = normalizeImageUrls(data.images);
      return {
        id: docSnap.id,
        sellerUid,
        title: normalizeText(data.title, 'Equipment Listing'),
        category: normalizeText(data.category, 'Equipment'),
        subcategory: normalizeText(data.subcategory || data.category, 'Equipment'),
        manufacturer: pickManufacturer(data),
        model: normalizeText(data.model),
        year: Number(data.year || 0) || null,
        price: Number(data.price || 0) || 0,
        currency: normalizeText(data.currency, 'USD'),
        hours: Number(data.hours || 0) || 0,
        condition: normalizeText(data.condition, 'Used'),
        description: normalizeText(data.description),
        location: normalizeText(data.location, 'Location pending'),
        images,
        image: images[0] || '',
        featured: Boolean(data.featured),
        status: normalizeText(data.status, 'active'),
        createdAtIso: timestampToIso(data.createdAt),
        updatedAtIso: timestampToIso(data.updatedAt),
        listingUrl: buildListingUrl(docSnap.id),
      };
    })
    .filter((listing) => listing.sellerUid)
    .filter(isListingVisible)
    .sort((left, right) => {
      const featuredDelta = Number(right.featured) - Number(left.featured);
      if (featuredDelta !== 0) return featuredDelta;
      return new Date(right.createdAtIso || 0).getTime() - new Date(left.createdAtIso || 0).getTime();
    });

  const sellerMap = await loadSellerRecords(listings.map((listing) => listing.sellerUid));
  publicInventoryCache = {
    fetchedAt: now,
    listings,
    sellerMap,
  };

  return publicInventoryCache;
}

async function resolveDealer(identity) {
  const normalizedIdentity = normalizeText(identity);
  if (!normalizedIdentity) {
    throw new Error('Dealer identifier is required.');
  }

  const inventory = await loadPublicInventory();
  const fromCache = [...inventory.sellerMap.values()].find(
    (seller) => seller.id === normalizedIdentity || seller.storefrontSlug === normalizedIdentity
  );
  if (fromCache) {
    return fromCache;
  }

  const db = getDb();
  let sellerSnap = await db.collection('storefronts').doc(normalizedIdentity).get();

  if (!sellerSnap.exists) {
    const storefrontSlugSnapshot = await db.collection('storefronts').where('storefrontSlug', '==', normalizedIdentity).limit(1).get();
    if (!storefrontSlugSnapshot.empty) {
      sellerSnap = storefrontSlugSnapshot.docs[0];
    }
  }

  if (!sellerSnap.exists) {
    sellerSnap = await db.collection('users').doc(normalizedIdentity).get();
  }

  if (!sellerSnap.exists) {
    const userSlugSnapshot = await db.collection('users').where('storefrontSlug', '==', normalizedIdentity).limit(1).get();
    if (!userSlugSnapshot.empty) {
      sellerSnap = userSlugSnapshot.docs[0];
    }
  }

  if (!sellerSnap.exists) {
    throw new Error('Dealer storefront was not found.');
  }

  const sellerMap = await loadSellerRecords([sellerSnap.id]);
  const seller = sellerMap.get(sellerSnap.id);
  if (!seller) {
    throw new Error('Dealer storefront was not found.');
  }
  return seller;
}

function baseStyles() {
  return `
    :root {
      color-scheme: light;
      --bg: #f4f1e8;
      --surface: #fbf9f2;
      --surface-strong: #ffffff;
      --line: #d7d0bf;
      --ink: #1e2522;
      --muted: #5c685f;
      --accent: #1e6b52;
      --accent-soft: rgba(30, 107, 82, 0.12);
      --gold: #a36b17;
      --shadow: 0 18px 48px rgba(26, 33, 30, 0.08);
      --radius: 22px;
      --radius-sm: 14px;
      --max: 1280px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: linear-gradient(180deg, #fbf9f2 0%, #f4f1e8 60%, #efe8d8 100%); color: var(--ink); font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
    body { min-height: 100vh; }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; display: block; }
    .shell { width: min(calc(100% - 32px), var(--max)); margin: 0 auto; }
    .topbar { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(18px); background: rgba(251, 249, 242, 0.9); border-bottom: 1px solid rgba(103, 112, 100, 0.12); }
    .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 0; }
    .brand { display: flex; align-items: center; gap: 16px; min-width: 0; }
    .brand img { width: 220px; max-width: 42vw; height: auto; }
    .brand-copy { display: grid; gap: 4px; }
    .brand-copy strong { font-size: 0.82rem; letter-spacing: 0.24em; text-transform: uppercase; }
    .brand-copy span { font-size: 0.82rem; color: var(--muted); }
    .nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
    .nav a { padding: 10px 14px; border-radius: 999px; border: 1px solid rgba(30, 107, 82, 0.12); background: rgba(255, 255, 255, 0.7); font-size: 0.84rem; font-weight: 700; color: var(--muted); }
    .nav a:hover { border-color: rgba(30, 107, 82, 0.32); color: var(--accent); background: var(--surface-strong); }
    .hero { padding: 56px 0 30px; }
    .eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
    .hero h1 { margin: 18px 0 16px; font-size: clamp(2.4rem, 5vw, 4.75rem); line-height: 0.95; letter-spacing: -0.05em; text-transform: uppercase; max-width: 14ch; }
    .hero p { margin: 0; max-width: 68ch; color: var(--muted); font-size: 1.02rem; line-height: 1.75; }
    .hero-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 28px; }
    .stat { padding: 20px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: rgba(255, 255, 255, 0.82); box-shadow: var(--shadow); }
    .stat-label { font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); font-weight: 800; }
    .stat-value { margin-top: 8px; font-size: 1.6rem; font-weight: 900; letter-spacing: -0.03em; }
    .section { margin: 22px 0; padding: 28px; border-radius: var(--radius); border: 1px solid var(--line); background: rgba(255, 255, 255, 0.84); box-shadow: var(--shadow); }
    .section-head { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    .section-head h2 { margin: 0; font-size: 1.4rem; text-transform: uppercase; letter-spacing: -0.03em; }
    .section-head p { margin: 6px 0 0; color: var(--muted); font-size: 0.92rem; }
    .tagline { color: var(--gold); font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; font-size: 0.72rem; }
    .link-grid, .card-grid, .dealer-grid, .listing-grid, .feature-grid { display: grid; gap: 16px; }
    .link-grid { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
    .card-grid, .dealer-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    .listing-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .feature-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .link-card, .dealer-card, .listing-card, .feature-card { display: block; border-radius: 18px; border: 1px solid rgba(92, 104, 95, 0.14); background: rgba(251, 249, 242, 0.72); overflow: hidden; transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease; }
    .link-card:hover, .dealer-card:hover, .listing-card:hover { transform: translateY(-2px); border-color: rgba(30, 107, 82, 0.38); box-shadow: 0 18px 38px rgba(30, 48, 41, 0.12); }
    .link-card-body, .dealer-card-body, .listing-card-body, .feature-card-body { padding: 18px; }
    .link-card strong, .dealer-card strong, .listing-card strong { display: block; font-size: 1rem; line-height: 1.35; }
    .pill { display: inline-flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 999px; background: var(--surface-strong); border: 1px solid rgba(92, 104, 95, 0.12); color: var(--muted); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .pill-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
    .listing-image { aspect-ratio: 4 / 3; background: linear-gradient(135deg, #d9d3c5 0%, #f2ede2 100%); overflow: hidden; }
    .listing-image img { width: 100%; height: 100%; object-fit: cover; }
    .listing-meta, .dealer-meta { display: grid; gap: 10px; color: var(--muted); font-size: 0.92rem; margin-top: 12px; }
    .listing-price { color: var(--accent); font-size: 1.1rem; font-weight: 900; }
    .hero-actions, .section-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
    .button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 13px 18px; border-radius: 999px; border: 1px solid transparent; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; font-size: 0.8rem; }
    .button-primary { background: var(--accent); color: #ffffff; }
    .button-secondary { background: transparent; color: var(--ink); border-color: rgba(92, 104, 95, 0.18); }
    .button:hover { opacity: 0.92; }
    .breadcrumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; color: var(--muted); font-size: 0.84rem; }
    .breadcrumbs a { color: var(--accent); font-weight: 700; }
    .lede { max-width: 76ch; color: var(--muted); font-size: 1rem; line-height: 1.78; }
    .empty { padding: 22px; border: 1px dashed rgba(92, 104, 95, 0.32); border-radius: 18px; color: var(--muted); background: rgba(244, 241, 232, 0.68); }
    footer { padding: 46px 0 68px; color: var(--muted); }
    .footer-card { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 22px; border: 1px solid var(--line); border-radius: 20px; background: rgba(255, 255, 255, 0.78); box-shadow: var(--shadow); }
    .footer-brand { display: flex; align-items: center; gap: 14px; }
    .footer-brand img { width: 96px; height: auto; }
    .footer-copy { display: grid; gap: 4px; }
    .footer-copy strong { font-size: 0.82rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink); }
    .footer-copy span { font-size: 0.9rem; }
    @media (max-width: 960px) {
      .topbar-inner { flex-direction: column; align-items: flex-start; }
      .nav { justify-content: flex-start; }
      .hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .shell { width: min(calc(100% - 24px), var(--max)); }
      .hero { padding-top: 38px; }
      .hero h1 { max-width: none; }
      .hero-grid { grid-template-columns: minmax(0, 1fr); }
      .section { padding: 20px; }
      .brand { align-items: flex-start; }
      .brand img { width: 176px; }
      .footer-card { align-items: flex-start; }
    }
  `;
}

function renderHead({ title, description, canonicalUrl, jsonLd }) {
  return `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(DEFAULT_BASE_URL)}/android-chrome-512x512.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260326b" />
    <link rel="icon" type="image/svg+xml" href="/Forestry_Equipment_Sales_Favicon.svg?v=20260326b" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=20260326b" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=20260326b" />
    <link rel="shortcut icon" href="/favicon.ico?v=20260326b" />
    <link rel="manifest" href="/site.webmanifest?v=20260326b" />
    <style>${baseStyles()}</style>
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  `;
}

function renderShell({ title, description, canonicalUrl, body, jsonLd }) {
  return `<!doctype html>
<html lang="en">
  <head>
    ${renderHead({ title, description, canonicalUrl, jsonLd })}
  </head>
  <body>
    <header class="topbar">
      <div class="shell topbar-inner">
        <a class="brand" href="/">
          <img src="/Forestry_Equipment_Sales_Light_Mode_Logo.svg?v=20260326b" alt="Forestry Equipment Sales" />
          <span class="brand-copy">
            <strong>Hybrid Marketplace</strong>
            <span>Dealer hub, clean routes, and crawlable equipment inventory.</span>
          </span>
        </a>
        <nav class="nav" aria-label="Primary">
          <a href="/logging-equipment-for-sale">Logging</a>
          <a href="/forestry-equipment-for-sale">Forestry</a>
          <a href="/categories">Categories</a>
          <a href="/manufacturers">Manufacturers</a>
          <a href="/states">States</a>
          <a href="/dealers">Dealers</a>
          <a href="/search">Search App</a>
        </nav>
      </div>
    </header>
    ${body}
    <footer>
      <div class="shell">
        <div class="footer-card">
          <div class="footer-brand">
            <img src="/Logo-Transparent.png?v=20260326b" alt="TimberEquip footer logo" />
            <span class="footer-copy">
              <strong>TimberEquip Marketplace</strong>
              <span>Dealer storefronts, live inventory, embeds, and lead-ready public pages.</span>
            </span>
          </div>
          <div class="pill-row">
            <span class="pill">JSON Feed Ready</span>
            <span class="pill">Dealer Storefronts</span>
            <span class="pill">Search + SEO</span>
          </div>
        </div>
      </div>
    </footer>
  </body>
</html>`;
}

function renderBreadcrumbs(items) {
  return `
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      ${items
        .map((item, index) => {
          const label = escapeHtml(item.label);
          if (index === items.length - 1 || !item.path) {
            return `<span>${label}</span>`;
          }
          return `<a href="${escapeHtml(item.path)}">${label}</a><span>/</span>`;
        })
        .join('')}
    </nav>
  `;
}

function renderLinkCards(items, options = {}) {
  if (!items.length) {
    return `<div class="empty">${escapeHtml(options.emptyMessage || 'No items found yet.')}</div>`;
  }

  return `
    <div class="link-grid">
      ${items
        .map(
          (item) => `
            <a class="link-card" href="${escapeHtml(item.path)}">
              <div class="link-card-body">
                <span class="pill">${escapeHtml(String(item.count || 0))} listings</span>
                <strong style="margin-top:14px;">${escapeHtml(item.label)}</strong>
              </div>
            </a>
          `
        )
        .join('')}
    </div>
  `;
}

function renderFeatureCards(cards) {
  return `
    <div class="feature-grid">
      ${cards
        .map(
          (card) => `
            <article class="feature-card">
              <div class="feature-card-body">
                <span class="pill">${escapeHtml(card.eyebrow)}</span>
                <strong style="margin-top:14px;">${escapeHtml(card.title)}</strong>
                <p style="margin:10px 0 0;color:var(--muted);line-height:1.7;">${escapeHtml(card.description)}</p>
              </div>
            </article>
          `
        )
        .join('')}
    </div>
  `;
}

function renderListingCards(listings) {
  if (!listings.length) {
    return '<div class="empty">No active inventory is available on this route yet.</div>';
  }

  return `
    <div class="listing-grid">
      ${listings
        .map((listing) => {
          const subtitle = [listing.year, listing.manufacturer, listing.model].filter(Boolean).join(' ');
          return `
            <a class="listing-card" href="${escapeHtml(listing.listingUrl)}">
              <div class="listing-image">
                ${
                  listing.image
                    ? `<img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.title)}" loading="lazy" />`
                    : ''
                }
              </div>
              <div class="listing-card-body">
                <span class="pill">${escapeHtml(listing.category)}</span>
                <strong style="margin-top:14px;">${escapeHtml(listing.title)}</strong>
                <div class="listing-meta">
                  <span>${escapeHtml(subtitle || 'Equipment listing')}</span>
                  <span>${escapeHtml(listing.location)}</span>
                  <span class="listing-price">${escapeHtml(formatCurrency(listing.price, listing.currency))}</span>
                </div>
              </div>
            </a>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderDealerCards(dealers) {
  if (!dealers.length) {
    return '<div class="empty">No dealer storefronts are available for this directory yet.</div>';
  }

  return `
    <div class="dealer-grid">
      ${dealers
        .map(
          ({ seller, count }) => `
            <a class="dealer-card" href="${escapeHtml(buildDealerPath(seller))}">
              <div class="dealer-card-body">
                <span class="pill">${escapeHtml(String(count))} live listings</span>
                <strong style="margin-top:14px;">${escapeHtml(seller.storefrontName)}</strong>
                <div class="dealer-meta">
                  <span>${escapeHtml(seller.location || 'Location pending')}</span>
                  <span>${escapeHtml(seller.storefrontTagline || seller.storefrontDescription || 'Dealer storefront with live inventory and direct contact paths.')}</span>
                </div>
              </div>
            </a>
          `
        )
        .join('')}
    </div>
  `;
}

function buildBreadcrumbJsonLd(items, canonicalUrl) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.path ? `${DEFAULT_BASE_URL}${item.path}` : canonicalUrl,
    })),
  };
}

function buildListingItemList(name, listings, fallbackBrand) {
  return {
    '@type': 'ItemList',
    name,
    itemListElement: listings.slice(0, 24).map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${DEFAULT_BASE_URL}${listing.listingUrl}`,
      item: {
        '@type': 'Product',
        name: listing.title,
        category: listing.subcategory || listing.category || 'Equipment',
        model: listing.model || undefined,
        brand: {
          '@type': 'Brand',
          name: listing.manufacturer || fallbackBrand || 'Forestry Equipment Sales',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: listing.currency || 'USD',
          price: listing.price || 0,
          availability: 'https://schema.org/InStock',
          url: `${DEFAULT_BASE_URL}${listing.listingUrl}`,
        },
      },
    })),
  };
}

function buildCollectionJsonLd(name, description, canonicalUrl, listings, breadcrumbs = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name,
        description,
        url: canonicalUrl,
        isPartOf: {
          '@type': 'WebSite',
          name: 'TimberEquip',
          url: DEFAULT_BASE_URL,
        },
      },
      ...(breadcrumbs.length ? [buildBreadcrumbJsonLd(breadcrumbs, canonicalUrl)] : []),
      buildListingItemList(`${name} inventory`, listings, 'Forestry Equipment Sales'),
    ],
  };
}

function buildDirectoryJsonLd(name, description, canonicalUrl, breadcrumbs, items) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name,
        description,
        url: canonicalUrl,
        isPartOf: {
          '@type': 'WebSite',
          name: 'TimberEquip',
          url: DEFAULT_BASE_URL,
        },
      },
      buildBreadcrumbJsonLd(breadcrumbs, canonicalUrl),
      {
        '@type': 'ItemList',
        name: `${name} directory`,
        itemListElement: items.slice(0, 50).map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${DEFAULT_BASE_URL}${item.path}`,
          name: item.label,
        })),
      },
    ],
  };
}

function buildDealerJsonLd(seller, listings, canonicalUrl, breadcrumbs = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: seller.storefrontName,
        description: seller.storefrontDescription || seller.storefrontTagline || 'Dealer storefront with live equipment inventory.',
        url: canonicalUrl,
        logo: seller.logo || undefined,
        telephone: seller.phone || undefined,
        email: seller.email || undefined,
        address: seller.location
          ? {
              '@type': 'PostalAddress',
              addressLocality: seller.location,
            }
          : undefined,
      },
      ...(breadcrumbs.length ? [buildBreadcrumbJsonLd(breadcrumbs, canonicalUrl)] : []),
      buildListingItemList(`${seller.storefrontName} inventory`, listings, seller.storefrontName),
    ],
  };
}

function renderInventoryPage({
  title,
  eyebrow,
  description,
  canonicalUrl,
  intro,
  breadcrumbs,
  stats,
  featureCards,
  sections,
  listings,
  primaryAction,
  secondaryAction,
  jsonLd,
}) {
  return renderShell({
    title,
    description,
    canonicalUrl,
    jsonLd,
    body: `
      <main>
        <section class="shell hero">
          <span class="eyebrow">${escapeHtml(eyebrow)}</span>
          ${renderBreadcrumbs(breadcrumbs)}
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(intro)}</p>
          <div class="hero-actions">
            ${primaryAction ? `<a class="button button-primary" href="${escapeHtml(primaryAction.href)}">${escapeHtml(primaryAction.label)}</a>` : ''}
            ${secondaryAction ? `<a class="button button-secondary" href="${escapeHtml(secondaryAction.href)}">${escapeHtml(secondaryAction.label)}</a>` : ''}
          </div>
          <div class="hero-grid">
            ${stats
              .map(
                (stat) => `
                  <article class="stat">
                    <div class="stat-label">${escapeHtml(stat.label)}</div>
                    <div class="stat-value">${escapeHtml(String(stat.value))}</div>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>
        <section class="shell section">
          <div class="section-head">
            <div>
              <span class="tagline">Functional Public Layer</span>
              <h2>Why This Route Exists</h2>
            </div>
          </div>
          <p class="lede">${escapeHtml(description)}</p>
          <div class="section-actions">
            <a class="button button-secondary" href="/sitemap.xml">Open sitemap</a>
            <a class="button button-secondary" href="/api/public/dealer-embed.js">Dealer embed script</a>
          </div>
        </section>
        <section class="shell section">
          <div class="section-head">
            <div>
              <span class="tagline">Marketplace Functionality</span>
              <h2>Built For Search And Dealers</h2>
            </div>
          </div>
          ${renderFeatureCards(featureCards)}
        </section>
        ${sections
          .map(
            (section) => `
              <section class="shell section">
                <div class="section-head">
                  <div>
                    <span class="tagline">${escapeHtml(section.eyebrow || 'Related Routes')}</span>
                    <h2>${escapeHtml(section.title)}</h2>
                    ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ''}
                  </div>
                </div>
                ${section.html}
              </section>
            `
          )
          .join('')}
        <section class="shell section">
          <div class="section-head">
            <div>
              <span class="tagline">Live Inventory</span>
              <h2>Featured Listings</h2>
              <p>These cards are rendered from live approved marketplace listings.</p>
            </div>
            <a class="button button-secondary" href="/search">Open full search</a>
          </div>
          ${renderListingCards(listings.slice(0, 12))}
        </section>
      </main>
    `,
  });
}

function sortDealersByCount(dealerMap, sellerMap) {
  return [...dealerMap.entries()]
    .map(([sellerUid, count]) => ({ seller: sellerMap.get(sellerUid), count }))
    .filter((entry) => entry.seller)
    .sort((left, right) => right.count - left.count || left.seller.storefrontName.localeCompare(right.seller.storefrontName));
}

function getInventoryStats(listings) {
  const states = new Set();
  const manufacturers = new Set();
  const categories = new Set();

  listings.forEach((listing) => {
    const state = getStateFromLocation(listing.location);
    if (state) states.add(state);
    if (listing.manufacturer) manufacturers.add(listing.manufacturer);
    if (listing.subcategory) categories.add(listing.subcategory);
  });

  return {
    listingCount: listings.length,
    manufacturerCount: manufacturers.size,
    stateCount: states.size,
    categoryCount: categories.size,
  };
}

function buildSharedSections(listings, sellerMap, options = {}) {
  const sellerCounts = new Map();
  listings.forEach((listing) => {
    sellerCounts.set(listing.sellerUid, (sellerCounts.get(listing.sellerUid) || 0) + 1);
  });

  const topCategories = createCountLinks(listings.map((listing) => listing.subcategory), buildCategoryPath, options.categoryLimit || 12);
  const topManufacturers = createCountLinks(listings.map((listing) => listing.manufacturer), buildManufacturerPath, options.manufacturerLimit || 12);
  const topStates = createCountLinks(listings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateMarketPath(state, options.marketKey || 'logging'), options.stateLimit || 12);
  const topDealers = sortDealersByCount(sellerCounts, sellerMap).slice(0, options.dealerLimit || 9);

  return {
    topCategories,
    topManufacturers,
    topStates,
    topDealers,
  };
}

function renderIndexPage({
  title,
  eyebrow,
  description,
  canonicalUrl,
  intro,
  breadcrumbs,
  statValue,
  items,
  emptyMessage,
  jsonLd,
}) {
  return renderShell({
    title,
    description,
    canonicalUrl,
    jsonLd,
    body: `
      <main>
        <section class="shell hero">
          <span class="eyebrow">${escapeHtml(eyebrow)}</span>
          ${renderBreadcrumbs(breadcrumbs)}
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(intro)}</p>
          <div class="hero-grid">
            <article class="stat">
              <div class="stat-label">Available Routes</div>
              <div class="stat-value">${escapeHtml(String(statValue))}</div>
            </article>
            <article class="stat">
              <div class="stat-label">SEO Mode</div>
              <div class="stat-value">Indexable</div>
            </article>
            <article class="stat">
              <div class="stat-label">Data Source</div>
              <div class="stat-value">Live Firestore</div>
            </article>
            <article class="stat">
              <div class="stat-label">Use Case</div>
              <div class="stat-value">Dealer Hub</div>
            </article>
          </div>
        </section>
        <section class="shell section">
          <div class="section-head">
            <div>
              <span class="tagline">Clean Route Directory</span>
              <h2>${escapeHtml(title)}</h2>
              <p>${escapeHtml(description)}</p>
            </div>
          </div>
          ${renderLinkCards(items, { emptyMessage })}
        </section>
      </main>
    `,
  });
}

function renderSitemap(baseUrl, inventory) {
  const sellers = [...inventory.sellerMap.values()].sort((left, right) => left.storefrontName.localeCompare(right.storefrontName));
  const shared = buildSharedSections(inventory.listings, inventory.sellerMap, { dealerLimit: 999, categoryLimit: 999, manufacturerLimit: 999, stateLimit: 999 });

  const urls = new Set([
    `${baseUrl}/`,
    `${baseUrl}/logging-equipment-for-sale`,
    `${baseUrl}/forestry-equipment-for-sale`,
    `${baseUrl}/categories`,
    `${baseUrl}/manufacturers`,
    `${baseUrl}/states`,
    `${baseUrl}/dealers`,
    `${baseUrl}/sitemap.xml`,
  ]);

  shared.topCategories.forEach((item) => urls.add(`${baseUrl}${item.path}`));
  shared.topManufacturers.forEach((item) => {
    urls.add(`${baseUrl}${item.path}`);
    const manufacturerListings = inventory.listings.filter((listing) => listing.manufacturer === item.label);
    createCountLinks(manufacturerListings.map((listing) => listing.subcategory), (category) => buildManufacturerCategoryPath(item.label, category), 50).forEach((route) => {
      urls.add(`${baseUrl}${route.path}`);
    });
    createCountLinks(manufacturerListings.map((listing) => listing.model), (model) => buildManufacturerModelPath(item.label, model), 50).forEach((route) => {
      urls.add(`${baseUrl}${route.path}`);
      const modelListings = manufacturerListings.filter((listing) => normalizeSeoSlug(listing.model) === normalizeSeoSlug(route.label));
      createCountLinks(modelListings.map((listing) => listing.subcategory), (category) => buildManufacturerModelCategoryPath(item.label, route.label, category), 50).forEach((categoryRoute) => {
        urls.add(`${baseUrl}${categoryRoute.path}`);
      });
    });
  });
  shared.topStates.forEach((item) => {
    urls.add(`${baseUrl}${item.path}`);
    const stateListings = inventory.listings.filter((listing) => normalizeSeoSlug(getStateFromLocation(listing.location)) === normalizeSeoSlug(item.label));
    createCountLinks(stateListings.map((listing) => listing.subcategory), (category) => buildStateCategoryPath(item.label, category), 50).forEach((route) => {
      urls.add(`${baseUrl}${route.path}`);
    });
  });

  sellers.forEach((seller) => {
    urls.add(`${baseUrl}${buildDealerPath(seller)}`);
    urls.add(`${baseUrl}${buildDealerPath(seller)}/inventory`);
  });

  inventory.listings.slice(0, 5000).forEach((listing) => {
    urls.add(`${baseUrl}${listing.listingUrl}`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
  .sort()
  .map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`)
  .join('\n')}
</urlset>`;
}

function isHybridPublicPath(pathname) {
  return [
    /^\/sitemap\.xml$/i,
    /^\/logging-equipment-for-sale$/i,
    /^\/forestry-equipment-for-sale$/i,
    /^\/categories$/i,
    /^\/categories\/[^/]+$/i,
    /^\/manufacturers$/i,
    /^\/manufacturers\/[^/]+$/i,
    /^\/manufacturers\/[^/]+\/models\/[^/]+$/i,
    /^\/manufacturers\/[^/]+\/models\/[^/]+\/[^/]+$/i,
    /^\/manufacturers\/[^/]+\/[^/]+$/i,
    /^\/states$/i,
    /^\/states\/[^/]+\/logging-equipment-for-sale$/i,
    /^\/states\/[^/]+\/forestry-equipment-for-sale$/i,
    /^\/states\/[^/]+\/[^/]+$/i,
    /^\/dealers$/i,
    /^\/dealers\/[^/]+$/i,
    /^\/dealers\/[^/]+\/inventory$/i,
    /^\/dealers\/[^/]+\/[^/]+$/i,
  ].some((pattern) => pattern.test(pathname));
}

async function renderRoute(req, res) {
  const pathname = decodeURIComponent(req.path || '/');
  const baseUrl = getRequestBaseUrl(req);
  const inventory = await loadPublicInventory();

  if (/^\/sitemap\.xml$/i.test(pathname)) {
    res.status(200).type('application/xml').send(renderSitemap(baseUrl, inventory));
    return true;
  }

  const shared = buildSharedSections(inventory.listings, inventory.sellerMap);
  const stats = getInventoryStats(inventory.listings);

  if (/^\/logging-equipment-for-sale$/i.test(pathname) || /^\/forestry-equipment-for-sale$/i.test(pathname)) {
    const marketKey = /^\/forestry-equipment-for-sale$/i.test(pathname) ? 'forestry' : 'logging';
    const title = marketKey === 'forestry' ? 'Forestry Equipment For Sale' : 'Logging Equipment For Sale';
    const description =
      marketKey === 'forestry'
        ? 'Browse forestry equipment, dealer storefronts, manufacturer routes, and state inventory pages from one crawlable marketplace hub.'
        : 'Browse logging equipment inventory, dealer storefronts, and clean category or state routes from one crawlable marketplace hub.';
    const html = renderInventoryPage({
      title,
      eyebrow: 'Hybrid SEO Hub',
      description,
      canonicalUrl: `${baseUrl}${pathname}`,
      intro:
        marketKey === 'forestry'
          ? 'This hybrid landing page pairs live marketplace inventory with cleaner route architecture so buyers can browse inventory, dealers, and related route families without getting dropped into a heavy app flow first.'
          : 'This hybrid landing page is the lighter, more functional public front door for logging equipment discovery. It keeps the React app for deep workflows while putting live inventory and route context up front.',
      breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: title, path: pathname },
      ],
      stats: [
        { label: 'Live Listings', value: stats.listingCount },
        { label: 'Manufacturers', value: stats.manufacturerCount },
        { label: 'States', value: stats.stateCount },
        { label: 'Dealers', value: shared.topDealers.length },
      ],
      featureCards: [
        {
          eyebrow: 'Hybrid Delivery',
          title: 'Server-rendered public routes',
          description: 'These pages ship complete metadata and content in the first response instead of waiting for client-side React metadata updates.',
        },
        {
          eyebrow: 'Dealer-first',
          title: 'Storefront and feed ready',
          description: 'Dealer pages link directly into inventory, JSON feeds, and embed surfaces so dealers can syndicate listings and still rank organically.',
        },
        {
          eyebrow: 'Lower friction',
          title: 'Less decorative UI, more utility',
          description: 'The public layer focuses on inventory density, route context, and direct actions while the app handles auth, management, and advanced filters.',
        },
      ],
      sections: [
        {
          eyebrow: 'Categories',
          title: 'Top Categories',
          description: 'Highest-volume clean routes from the live marketplace inventory.',
          html: renderLinkCards(shared.topCategories),
        },
        {
          eyebrow: 'Manufacturers',
          title: 'Top Manufacturers',
          description: 'High-intent make pages that can be used as landing pages or ad destinations.',
          html: renderLinkCards(shared.topManufacturers),
        },
        {
          eyebrow: 'States',
          title: 'Top States',
          description: 'Regional route entry points built from live listing locations.',
          html: renderLinkCards(shared.topStates),
        },
        {
          eyebrow: 'Dealer Directory',
          title: 'Featured Dealers',
          description: 'Inventory-rich storefronts surfaced from the marketplace data.',
          html: renderDealerCards(shared.topDealers),
        },
      ],
      listings: inventory.listings,
      primaryAction: { href: '/search', label: 'Open Marketplace Search' },
      secondaryAction: { href: '/dealers', label: 'Browse Dealers' },
      jsonLd: buildCollectionJsonLd(title, description, `${baseUrl}${pathname}`, inventory.listings, [
        { label: 'Home', path: '/' },
        { label: title, path: pathname },
      ]),
    });
    res.status(200).type('html').send(html);
    return true;
  }

  if (/^\/categories$/i.test(pathname)) {
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'Categories', path: '/categories' },
    ];
    res.status(200).type('html').send(
      renderIndexPage({
        title: 'Equipment Categories',
        eyebrow: 'Category Directory',
        description: 'Browse category-specific marketplace routes generated from live approved inventory.',
        canonicalUrl: `${baseUrl}/categories`,
        intro: 'This index gives buyers and search engines a stable way to move through the equipment taxonomy without falling back to noisy query strings.',
        breadcrumbs,
        statValue: shared.topCategories.length,
        items: shared.topCategories,
        emptyMessage: 'Categories will appear here as soon as live marketplace inventory is published.',
        jsonLd: buildDirectoryJsonLd('Equipment Categories', 'Browse category-specific marketplace routes generated from live approved inventory.', `${baseUrl}/categories`, breadcrumbs, shared.topCategories),
      })
    );
    return true;
  }

  if (/^\/manufacturers$/i.test(pathname)) {
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'Manufacturers', path: '/manufacturers' },
    ];
    res.status(200).type('html').send(
      renderIndexPage({
        title: 'Equipment Manufacturers',
        eyebrow: 'Manufacturer Directory',
        description: 'Browse make-specific route hubs generated from live approved marketplace listings.',
        canonicalUrl: `${baseUrl}/manufacturers`,
        intro: 'This is the lighter-weight public manufacturer index designed for crawlability, ad landing pages, and faster buyer discovery.',
        breadcrumbs,
        statValue: shared.topManufacturers.length,
        items: shared.topManufacturers,
        emptyMessage: 'Manufacturers will appear here as soon as live marketplace inventory is published.',
        jsonLd: buildDirectoryJsonLd('Equipment Manufacturers', 'Browse make-specific route hubs generated from live approved marketplace listings.', `${baseUrl}/manufacturers`, breadcrumbs, shared.topManufacturers),
      })
    );
    return true;
  }

  if (/^\/states$/i.test(pathname)) {
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'States', path: '/states' },
    ];
    res.status(200).type('html').send(
      renderIndexPage({
        title: 'Equipment Markets By State',
        eyebrow: 'Regional Directory',
        description: 'Browse state-level inventory routes generated from live marketplace locations.',
        canonicalUrl: `${baseUrl}/states`,
        intro: 'These regional routes give the marketplace cleaner geographic landing pages for buyers, dealers, and organic search.',
        breadcrumbs,
        statValue: shared.topStates.length,
        items: shared.topStates,
        emptyMessage: 'State routes will appear here as soon as live marketplace inventory is published.',
        jsonLd: buildDirectoryJsonLd('Equipment Markets By State', 'Browse state-level inventory routes generated from live marketplace locations.', `${baseUrl}/states`, breadcrumbs, shared.topStates),
      })
    );
    return true;
  }

  if (/^\/categories\/[^/]+$/i.test(pathname)) {
    const categorySlug = pathname.split('/')[2] || '';
    const matchingListings = inventory.listings.filter((listing) => normalizeSeoSlug(listing.subcategory) === categorySlug);
    const resolvedCategory = matchingListings[0]?.subcategory || titleCaseSlug(categorySlug);
    const categoryManufacturers = createCountLinks(matchingListings.map((listing) => listing.manufacturer), buildManufacturerPath, 12);
    const categoryStates = createCountLinks(matchingListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateCategoryPath(state, resolvedCategory), 12);

    const html = renderInventoryPage({
      title: `${resolvedCategory} For Sale`,
      eyebrow: 'Category Hub',
      description: `Browse ${resolvedCategory.toLowerCase()} inventory, related manufacturers, and regional routes from one crawlable category page.`,
      canonicalUrl: `${baseUrl}${pathname}`,
      intro: `This category hub keeps the public browsing layer focused on the machine type itself while still sending buyers into the full search app when they need deeper filtering.`,
      breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: 'Categories', path: '/categories' },
        { label: resolvedCategory, path: pathname },
      ],
      stats: [
        { label: 'Live Listings', value: matchingListings.length },
        { label: 'Manufacturers', value: categoryManufacturers.length },
        { label: 'States', value: categoryStates.length },
        { label: 'Dealer Pages', value: new Set(matchingListings.map((listing) => listing.sellerUid)).size },
      ],
      featureCards: [
        {
          eyebrow: 'Commercial Intent',
          title: 'Dedicated category landing page',
          description: 'The route works as a real category entry point instead of a generic search state hidden behind client-side filtering.',
        },
        {
          eyebrow: 'Dealer Coverage',
          title: 'Connected to dealer inventory',
          description: 'Every category page can push buyers into dealer storefronts or the full marketplace search without losing canonical structure.',
        },
        {
          eyebrow: 'SEO Support',
          title: 'Structured for indexing',
          description: 'Metadata, body copy, internal links, and inventory cards are all present in the first response.',
        },
      ],
      sections: [
        {
          eyebrow: 'Manufacturers',
          title: `${resolvedCategory} Manufacturers`,
          description: 'Popular manufacturers currently publishing public inventory in this machine category.',
          html: renderLinkCards(categoryManufacturers, { emptyMessage: `No manufacturers are publishing ${resolvedCategory.toLowerCase()} inventory yet.` }),
        },
        {
          eyebrow: 'States',
          title: `${resolvedCategory} By State`,
          description: 'Regional routes derived from live listing locations.',
          html: renderLinkCards(categoryStates, { emptyMessage: `No state routes are available for ${resolvedCategory.toLowerCase()} yet.` }),
        },
      ],
      listings: matchingListings,
      primaryAction: { href: `/search?subcategory=${encodeURIComponent(resolvedCategory)}`, label: 'Search This Category' },
      secondaryAction: { href: '/dealers', label: 'Browse Dealers' },
        jsonLd: buildCollectionJsonLd(`${resolvedCategory} For Sale`, `Browse ${resolvedCategory.toLowerCase()} inventory.`, `${baseUrl}${pathname}`, matchingListings, [
          { label: 'Home', path: '/' },
          { label: 'Categories', path: '/categories' },
          { label: resolvedCategory, path: pathname },
        ]),
    });

    res.status(200).type('html').send(html);
    return true;
  }

  if (/^\/manufacturers\/[^/]+$/i.test(pathname)) {
    const manufacturerSlug = pathname.split('/')[2] || '';
    const matchingListings = inventory.listings.filter((listing) => normalizeSeoSlug(listing.manufacturer) === manufacturerSlug);
    const resolvedManufacturer = matchingListings[0]?.manufacturer || titleCaseSlug(manufacturerSlug);
    const manufacturerCategories = createCountLinks(matchingListings.map((listing) => listing.subcategory), (category) => buildManufacturerCategoryPath(resolvedManufacturer, category), 12);
    const manufacturerModels = createCountLinks(matchingListings.map((listing) => listing.model), (model) => buildManufacturerModelPath(resolvedManufacturer, model), 12);
    const manufacturerStates = createCountLinks(matchingListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateMarketPath(state, 'logging'), 12);

    res.status(200).type('html').send(
      renderInventoryPage({
        title: `${resolvedManufacturer} Equipment For Sale`,
        eyebrow: 'Manufacturer Hub',
        description: `Browse ${resolvedManufacturer} marketplace inventory, category combinations, and state markets from a dedicated make page.`,
        canonicalUrl: `${baseUrl}${pathname}`,
        intro: `This page creates a cleaner manufacturer-specific route for buyers searching for ${resolvedManufacturer} inventory while keeping the heavier React search UI available as a secondary step.`,
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: pathname },
        ],
        stats: [
          { label: 'Live Listings', value: matchingListings.length },
          { label: 'Models', value: manufacturerModels.length },
          { label: 'Categories', value: manufacturerCategories.length },
          { label: 'States', value: manufacturerStates.length },
        ],
        featureCards: [
          {
            eyebrow: 'Brand Search',
            title: 'Manufacturer-first browsing',
            description: 'Buyers can land directly on a clean make page instead of working through multiple search controls before they see inventory.',
          },
          {
            eyebrow: 'Route Network',
            title: 'Model and category routes built in',
            description: 'Manufacturer pages automatically surface their strongest model and machine-type pairings for more specific intent and campaign routing.',
          },
          {
            eyebrow: 'Dealer Value',
            title: 'More useful ad destinations',
            description: 'These routes work better as dealer ad or content destinations because they open with relevant inventory immediately.',
          },
        ],
        sections: [
          {
            eyebrow: 'Make + Model',
            title: `${resolvedManufacturer} Model Routes`,
            description: 'Dedicated model surfaces generated from live inventory for the strongest high-intent searches.',
            html: renderLinkCards(manufacturerModels, { emptyMessage: `No model routes are available for ${resolvedManufacturer} yet.` }),
          },
          {
            eyebrow: 'Make + Machine',
            title: `${resolvedManufacturer} Category Routes`,
            description: 'High-intent combinations generated from live inventory.',
            html: renderLinkCards(manufacturerCategories, { emptyMessage: `No category combinations are available for ${resolvedManufacturer} yet.` }),
          },
          {
            eyebrow: 'Regional Markets',
            title: `${resolvedManufacturer} By State`,
            description: 'Related regional routes that keep the browsing path tight.',
            html: renderLinkCards(manufacturerStates, { emptyMessage: `No state routes are available for ${resolvedManufacturer} yet.` }),
          },
        ],
        listings: matchingListings,
        primaryAction: { href: `/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}`, label: 'Search This Manufacturer' },
        secondaryAction: { href: '/manufacturers', label: 'All Manufacturers' },
        jsonLd: buildCollectionJsonLd(`${resolvedManufacturer} Equipment For Sale`, `Browse ${resolvedManufacturer} inventory.`, `${baseUrl}${pathname}`, matchingListings, [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: pathname },
        ]),
      })
    );
    return true;
  }

  if (/^\/manufacturers\/[^/]+\/models\/[^/]+$/i.test(pathname)) {
    const [, , manufacturerSlug, , modelSlug] = pathname.split('/');
    const matchingListings = inventory.listings.filter(
      (listing) => normalizeSeoSlug(listing.manufacturer) === manufacturerSlug && normalizeSeoSlug(listing.model) === modelSlug
    );
    const resolvedManufacturer = matchingListings[0]?.manufacturer || titleCaseSlug(manufacturerSlug);
    const resolvedModel = matchingListings[0]?.model || titleCaseSlug(modelSlug);
    const modelCategories = createCountLinks(matchingListings.map((listing) => listing.subcategory), (category) => buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, category), 12);
    const modelStates = createCountLinks(matchingListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateMarketPath(state, 'logging'), 12);

    res.status(200).type('html').send(
      renderInventoryPage({
        title: `${resolvedManufacturer} ${resolvedModel} For Sale`,
        eyebrow: 'Manufacturer + Model',
        description: `Browse ${resolvedManufacturer} ${resolvedModel} inventory from one focused, crawlable landing page.`,
        canonicalUrl: `${baseUrl}${pathname}`,
        intro: `This model route captures make-and-model demand directly, then fans buyers into the strongest category and regional routes without dropping them into a generic search state first.`,
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
          { label: resolvedModel, path: pathname },
        ],
        stats: [
          { label: 'Live Listings', value: matchingListings.length },
          { label: 'Categories', value: modelCategories.length },
          { label: 'States', value: modelStates.length },
          { label: 'Dealers', value: new Set(matchingListings.map((listing) => listing.sellerUid)).size },
        ],
        featureCards: [
          {
            eyebrow: 'High Intent',
            title: 'Model-first buyer landing page',
            description: 'This route is built for buyers who already know the exact model they want and need live inventory immediately.',
          },
          {
            eyebrow: 'Campaign-ready',
            title: 'Cleaner destination than raw search filters',
            description: 'Make-and-model pages are stronger destinations for ads, email campaigns, and buying-guide links.',
          },
          {
            eyebrow: 'Scalable',
            title: 'Category and state branches stay attached',
            description: 'The route naturally expands into deeper model-category pages and related state-market pages as inventory grows.',
          },
        ],
        sections: [
          {
            eyebrow: 'Model Categories',
            title: `${resolvedManufacturer} ${resolvedModel} Category Routes`,
            description: 'Machine-type combinations currently active for this model.',
            html: renderLinkCards(modelCategories, { emptyMessage: `No category routes are available for ${resolvedManufacturer} ${resolvedModel} yet.` }),
          },
          {
            eyebrow: 'Regional Markets',
            title: `${resolvedManufacturer} ${resolvedModel} By State`,
            description: 'Regional routes with live listings for this model family.',
            html: renderLinkCards(modelStates, { emptyMessage: `No state routes are available for ${resolvedManufacturer} ${resolvedModel} yet.` }),
          },
        ],
        listings: matchingListings,
        primaryAction: { href: `/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}&model=${encodeURIComponent(resolvedModel)}`, label: 'Search This Model' },
        secondaryAction: { href: buildManufacturerPath(resolvedManufacturer), label: `More ${resolvedManufacturer}` },
        jsonLd: buildCollectionJsonLd(`${resolvedManufacturer} ${resolvedModel} For Sale`, `Browse ${resolvedManufacturer} ${resolvedModel} inventory.`, `${baseUrl}${pathname}`, matchingListings, [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
          { label: resolvedModel, path: pathname },
        ]),
      })
    );
    return true;
  }

  if (/^\/manufacturers\/[^/]+\/models\/[^/]+\/[^/]+$/i.test(pathname)) {
    const [, , manufacturerSlug, , modelSlug, categorySaleSlug] = pathname.split('/');
    const categorySlug = parseForSaleSlug(categorySaleSlug);
    const matchingListings = inventory.listings.filter(
      (listing) =>
        normalizeSeoSlug(listing.manufacturer) === manufacturerSlug &&
        normalizeSeoSlug(listing.model) === modelSlug &&
        normalizeSeoSlug(listing.subcategory) === categorySlug
    );
    const resolvedManufacturer = matchingListings[0]?.manufacturer || titleCaseSlug(manufacturerSlug);
    const resolvedModel = matchingListings[0]?.model || titleCaseSlug(modelSlug);
    const resolvedCategory = matchingListings[0]?.subcategory || titleCaseSlug(categorySlug);
    const relatedStates = createCountLinks(matchingListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateCategoryPath(state, resolvedCategory), 12);

    res.status(200).type('html').send(
      renderInventoryPage({
        title: `${resolvedManufacturer} ${resolvedModel} ${resolvedCategory} For Sale`,
        eyebrow: 'Manufacturer + Model + Category',
        description: `Browse ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} listings from one tightly focused landing page.`,
        canonicalUrl: `${baseUrl}${pathname}`,
        intro: `This route is the most precise collection surface in the marketplace architecture, built for exact commercial intent across manufacturer, model, and machine family.`,
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
          { label: resolvedModel, path: buildManufacturerModelPath(resolvedManufacturer, resolvedModel) },
          { label: resolvedCategory, path: pathname },
        ],
        stats: [
          { label: 'Live Listings', value: matchingListings.length },
          { label: 'States', value: relatedStates.length },
          { label: 'Dealers', value: new Set(matchingListings.map((listing) => listing.sellerUid)).size },
          { label: 'Route Type', value: 'Exact' },
        ],
        featureCards: [
          {
            eyebrow: 'Exact Match',
            title: 'Focused on true commercial intent',
            description: 'This route pairs manufacturer, model, and machine family in one page so buyers see the right inventory immediately.',
          },
          {
            eyebrow: 'SEO Utility',
            title: 'Built for long-tail search',
            description: 'These pages give the site a scalable way to cover high-value equipment searches without thin duplicate content patterns.',
          },
          {
            eyebrow: 'Dealer Value',
            title: 'Better route for ads and guides',
            description: 'Dealers and editorial pages can point to a much tighter destination than a generic filter state.',
          },
        ],
        sections: [
          {
            eyebrow: 'State Coverage',
            title: `Where ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory} Inventory Is Active`,
            description: 'Regional machine routes connected to this exact make, model, and category page.',
            html: renderLinkCards(relatedStates, { emptyMessage: `No state routes are available for ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} inventory yet.` }),
          },
        ],
        listings: matchingListings,
        primaryAction: { href: `/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}&model=${encodeURIComponent(resolvedModel)}&subcategory=${encodeURIComponent(resolvedCategory)}`, label: 'Open Exact Search' },
        secondaryAction: { href: buildManufacturerModelPath(resolvedManufacturer, resolvedModel), label: `More ${resolvedModel}` },
        jsonLd: buildCollectionJsonLd(`${resolvedManufacturer} ${resolvedModel} ${resolvedCategory} For Sale`, `Browse ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} inventory.`, `${baseUrl}${pathname}`, matchingListings, [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
          { label: resolvedModel, path: buildManufacturerModelPath(resolvedManufacturer, resolvedModel) },
          { label: resolvedCategory, path: pathname },
        ]),
      })
    );
    return true;
  }

  if (/^\/manufacturers\/[^/]+\/[^/]+$/i.test(pathname)) {
    const [, , manufacturerSlug, categorySaleSlug] = pathname.split('/');
    const categorySlug = parseForSaleSlug(categorySaleSlug);
    const matchingListings = inventory.listings.filter(
      (listing) => normalizeSeoSlug(listing.manufacturer) === manufacturerSlug && normalizeSeoSlug(listing.subcategory) === categorySlug
    );
    const resolvedManufacturer = matchingListings[0]?.manufacturer || titleCaseSlug(manufacturerSlug);
    const resolvedCategory = matchingListings[0]?.subcategory || titleCaseSlug(categorySlug);
    const relatedModels = createCountLinks(matchingListings.map((listing) => listing.model), (model) => buildManufacturerModelCategoryPath(resolvedManufacturer, model, resolvedCategory), 12);
    const relatedStates = createCountLinks(matchingListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateCategoryPath(state, resolvedCategory), 12);

    res.status(200).type('html').send(
      renderInventoryPage({
        title: `${resolvedManufacturer} ${resolvedCategory} For Sale`,
        eyebrow: 'Manufacturer + Category',
        description: `Browse ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} listings from one focused, crawlable landing page.`,
        canonicalUrl: `${baseUrl}${pathname}`,
        intro: `This combination page is built for more precise equipment intent, which makes it useful for SEO, paid traffic, dealer campaigns, and internal linking.`,
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
          { label: resolvedCategory, path: pathname },
        ],
        stats: [
          { label: 'Live Listings', value: matchingListings.length },
          { label: 'Models', value: relatedModels.length },
          { label: 'States', value: relatedStates.length },
          { label: 'Dealers', value: new Set(matchingListings.map((listing) => listing.sellerUid)).size },
        ],
        featureCards: [
          {
            eyebrow: 'Specific Intent',
            title: 'Lower-friction category targeting',
            description: 'Instead of sending buyers into a general search, this route starts at the exact make and machine combination.',
          },
          {
            eyebrow: 'Dealer-usable',
            title: 'Better landing surface for campaigns',
            description: 'These combination pages are more useful for ads, content links, and email campaigns because the context is obvious at a glance.',
          },
          {
            eyebrow: 'Expandable',
            title: 'Ready for buyer guides',
            description: 'This structure supports richer editorial sections later without changing the URL or metadata contract.',
          },
        ],
        sections: [
          {
            eyebrow: 'Model Coverage',
            title: `${resolvedManufacturer} ${resolvedCategory} Models`,
            description: 'Model-specific routes active inside this make and machine family.',
            html: renderLinkCards(relatedModels, { emptyMessage: `No model routes are available for ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} inventory yet.` }),
          },
          {
            eyebrow: 'State Coverage',
            title: `Where ${resolvedManufacturer} ${resolvedCategory} Inventory Is Active`,
            description: 'State routes tied to the same machine category.',
            html: renderLinkCards(relatedStates, { emptyMessage: `No state routes are available for ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} inventory yet.` }),
          },
        ],
        listings: matchingListings,
        primaryAction: { href: `/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}&subcategory=${encodeURIComponent(resolvedCategory)}`, label: 'Open Search With Filters' },
        secondaryAction: { href: buildManufacturerPath(resolvedManufacturer), label: `More ${resolvedManufacturer}` },
        jsonLd: buildCollectionJsonLd(`${resolvedManufacturer} ${resolvedCategory} For Sale`, `Browse ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} inventory.`, `${baseUrl}${pathname}`, matchingListings, [
          { label: 'Home', path: '/' },
          { label: 'Manufacturers', path: '/manufacturers' },
          { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
          { label: resolvedCategory, path: pathname },
        ]),
      })
    );
    return true;
  }

  if (/^\/states\/[^/]+\/logging-equipment-for-sale$/i.test(pathname) || /^\/states\/[^/]+\/forestry-equipment-for-sale$/i.test(pathname)) {
    const parts = pathname.split('/');
    const stateSlug = parts[2] || '';
    const marketKey = /forestry-equipment-for-sale$/i.test(pathname) ? 'forestry' : 'logging';
    const matchingListings = inventory.listings.filter((listing) => normalizeSeoSlug(getStateFromLocation(listing.location)) === stateSlug);
    const resolvedState = getStateFromLocation(matchingListings[0]?.location) || titleCaseSlug(stateSlug);
    const stateCategories = createCountLinks(matchingListings.map((listing) => listing.subcategory), (category) => buildStateCategoryPath(resolvedState, category), 12);
    const stateManufacturers = createCountLinks(matchingListings.map((listing) => listing.manufacturer), buildManufacturerPath, 12);
    const marketTitle = marketKey === 'forestry' ? 'Forestry Equipment For Sale' : 'Logging Equipment For Sale';

    res.status(200).type('html').send(
      renderInventoryPage({
        title: `${marketTitle} In ${resolvedState}`,
        eyebrow: 'Regional Market',
        description: `Browse ${marketTitle.toLowerCase()} in ${resolvedState} with related category and manufacturer links built from live marketplace data.`,
        canonicalUrl: `${baseUrl}${pathname}`,
        intro: `This regional hub keeps buyers anchored in ${resolvedState} while still surfacing the broader route network around categories, manufacturers, and dealer inventory.`,
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'States', path: '/states' },
          { label: resolvedState, path: pathname },
        ],
        stats: [
          { label: 'Live Listings', value: matchingListings.length },
          { label: 'Categories', value: stateCategories.length },
          { label: 'Manufacturers', value: stateManufacturers.length },
          { label: 'Dealers', value: new Set(matchingListings.map((listing) => listing.sellerUid)).size },
        ],
        featureCards: [
          {
            eyebrow: 'Regional SEO',
            title: 'Dedicated state landing page',
            description: 'This page gives the marketplace a stable location route without forcing buyers into a generic filtered search page first.',
          },
          {
            eyebrow: 'Dealer Support',
            title: 'Useful for local dealer promotion',
            description: 'Dealers can point buyers to a state route that already shows nearby inventory and related regional machine types.',
          },
          {
            eyebrow: 'Scalable',
            title: 'Built from live data',
            description: 'The route inventory, internal links, and counts update from live approved listings instead of separate manual pages.',
          },
        ],
        sections: [
          {
            eyebrow: 'State Categories',
            title: `${resolvedState} Categories`,
            description: 'The strongest machine-type routes inside this state market.',
            html: renderLinkCards(stateCategories, { emptyMessage: `No category routes are available in ${resolvedState} yet.` }),
          },
          {
            eyebrow: 'Manufacturers',
            title: `${resolvedState} Manufacturers`,
            description: 'Brands with currently visible inventory in this market.',
            html: renderLinkCards(stateManufacturers, { emptyMessage: `No manufacturers are visible in ${resolvedState} yet.` }),
          },
        ],
        listings: matchingListings,
        primaryAction: { href: `/search?state=${encodeURIComponent(resolvedState)}`, label: 'Search This State' },
        secondaryAction: { href: '/states', label: 'All States' },
        jsonLd: buildCollectionJsonLd(`${marketTitle} In ${resolvedState}`, `Browse inventory in ${resolvedState}.`, `${baseUrl}${pathname}`, matchingListings, [
          { label: 'Home', path: '/' },
          { label: 'States', path: '/states' },
          { label: resolvedState, path: pathname },
        ]),
      })
    );
    return true;
  }

  if (/^\/states\/[^/]+\/[^/]+$/i.test(pathname)) {
    const parts = pathname.split('/');
    const stateSlug = parts[2] || '';
    const categorySlug = parseForSaleSlug(parts[3] || '');
    const matchingListings = inventory.listings.filter(
      (listing) =>
        normalizeSeoSlug(getStateFromLocation(listing.location)) === stateSlug &&
        normalizeSeoSlug(listing.subcategory) === categorySlug
    );
    const resolvedState = getStateFromLocation(matchingListings[0]?.location) || titleCaseSlug(stateSlug);
    const resolvedCategory = matchingListings[0]?.subcategory || titleCaseSlug(categorySlug);
    const stateCategoryManufacturers = createCountLinks(matchingListings.map((listing) => listing.manufacturer), buildManufacturerPath, 12);

    res.status(200).type('html').send(
      renderInventoryPage({
        title: `${resolvedCategory} For Sale In ${resolvedState}`,
        eyebrow: 'Regional Category',
        description: `Browse ${resolvedCategory.toLowerCase()} inventory in ${resolvedState} from one focused regional route.`,
        canonicalUrl: `${baseUrl}${pathname}`,
        intro: `This page is designed for location plus machine-type intent, which makes it a better public destination for search, dealer promotion, and local buying guides.`,
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'States', path: '/states' },
          { label: resolvedState, path: buildStateMarketPath(resolvedState, 'logging') },
          { label: resolvedCategory, path: pathname },
        ],
        stats: [
          { label: 'Live Listings', value: matchingListings.length },
          { label: 'Manufacturers', value: stateCategoryManufacturers.length },
          { label: 'Dealers', value: new Set(matchingListings.map((listing) => listing.sellerUid)).size },
          { label: 'Route Type', value: 'Local' },
        ],
        featureCards: [
          {
            eyebrow: 'Local Intent',
            title: 'Machine + geography combined',
            description: 'The route narrows the browsing context immediately, which is more useful than forcing the buyer to build the state and category filters by hand.',
          },
          {
            eyebrow: 'Commercial Use',
            title: 'Useful for dealer and ad traffic',
            description: 'These routes work as cleaner landing pages for campaigns targeting a machine family inside a specific market.',
          },
          {
            eyebrow: 'Connected',
            title: 'Easy jump to search and dealer pages',
            description: 'The route still links cleanly into deeper search flows or specific storefronts when buyers want more detail.',
          },
        ],
        sections: [
          {
            eyebrow: 'Manufacturers',
            title: `${resolvedCategory} Manufacturers In ${resolvedState}`,
            description: 'Brands with active inventory on this regional category route.',
            html: renderLinkCards(stateCategoryManufacturers, { emptyMessage: `No manufacturers are visible for ${resolvedCategory.toLowerCase()} in ${resolvedState} yet.` }),
          },
        ],
        listings: matchingListings,
        primaryAction: { href: `/search?state=${encodeURIComponent(resolvedState)}&subcategory=${encodeURIComponent(resolvedCategory)}`, label: 'Search This Market' },
        secondaryAction: { href: buildStateMarketPath(resolvedState, 'logging'), label: `${resolvedState} Market` },
        jsonLd: buildCollectionJsonLd(`${resolvedCategory} For Sale In ${resolvedState}`, `Browse ${resolvedCategory.toLowerCase()} inventory in ${resolvedState}.`, `${baseUrl}${pathname}`, matchingListings, [
          { label: 'Home', path: '/' },
          { label: 'States', path: '/states' },
          { label: resolvedState, path: buildStateMarketPath(resolvedState, 'logging') },
          { label: resolvedCategory, path: pathname },
        ]),
      })
    );
    return true;
  }

  if (/^\/dealers$/i.test(pathname)) {
    const dealerCounts = new Map();
    inventory.listings.forEach((listing) => {
      dealerCounts.set(listing.sellerUid, (dealerCounts.get(listing.sellerUid) || 0) + 1);
    });
    const dealers = sortDealersByCount(dealerCounts, inventory.sellerMap).slice(0, 36);

    res.status(200).type('html').send(
      renderInventoryPage({
        title: 'Equipment Dealers',
        eyebrow: 'Dealer Directory',
        description: 'Browse dealer storefronts backed by live marketplace inventory, clean public URLs, and direct paths into inventory or feeds.',
        canonicalUrl: `${baseUrl}/dealers`,
        intro: 'This directory is the lighter-weight public dealer surface for the marketplace. It gives dealers more usable public URLs and gives buyers a clearer path into real storefront inventory.',
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'Dealers', path: '/dealers' },
        ],
        stats: [
          { label: 'Dealer Pages', value: dealers.length },
          { label: 'Live Listings', value: inventory.listings.length },
          { label: 'Manufacturers', value: shared.topManufacturers.length },
          { label: 'States', value: shared.topStates.length },
        ],
        featureCards: [
          {
            eyebrow: 'Dealer Hub',
            title: 'Storefront-first public surface',
            description: 'This page is designed to make dealer inventory and contact surfaces more visible than the older generic UI.',
          },
          {
            eyebrow: 'Feed Ecosystem',
            title: 'Pairs with JSON and embed routes',
            description: 'Every dealer can also expose inventory via the existing public feed and embed endpoints for syndication.',
          },
          {
            eyebrow: 'SEO Value',
            title: 'Crawlable storefront structure',
            description: 'Dealers get cleaner public routes that can rank, be shared directly, and be used as landing pages.',
          },
        ],
        sections: [
          {
            eyebrow: 'Dealer Network',
            title: 'Featured Dealer Storefronts',
            description: 'Inventory-rich storefronts sourced from the live public marketplace.',
            html: renderDealerCards(dealers),
          },
          {
            eyebrow: 'Categories',
            title: 'Top Marketplace Categories',
            description: 'Related route families buyers may explore from the dealer directory.',
            html: renderLinkCards(shared.topCategories),
          },
        ],
        listings: inventory.listings,
        primaryAction: { href: '/search', label: 'Open Search' },
        secondaryAction: { href: '/api/public/dealer-embed.js', label: 'Dealer Embed Script' },
        jsonLd: buildCollectionJsonLd('Equipment Dealers', 'Browse dealer storefronts and inventory.', `${baseUrl}/dealers`, inventory.listings, [
          { label: 'Home', path: '/' },
          { label: 'Dealers', path: '/dealers' },
        ]),
      })
    );
    return true;
  }

  if (/^\/dealers\/[^/]+(?:\/inventory)?$/i.test(pathname) || /^\/dealers\/[^/]+\/[^/]+$/i.test(pathname)) {
    const parts = pathname.split('/');
    const dealerIdentity = parts[2] || '';
    const tail = parts[3] || '';
    const seller = await resolveDealer(dealerIdentity);
    const sellerListings = inventory.listings.filter((listing) => listing.sellerUid === seller.id);

    let filteredListings = sellerListings;
    let routeCategory = '';
    if (tail && tail !== 'inventory') {
      routeCategory = tail;
      filteredListings = sellerListings.filter((listing) => normalizeSeoSlug(listing.subcategory) === routeCategory);
    }

    const visibleCategoryLinks = createCountLinks(sellerListings.map((listing) => listing.subcategory), (category) => `${buildDealerPath(seller)}/${normalizeSeoSlug(category, 'equipment')}`, 12);
    const feedUrl = `${baseUrl}/api/public/dealers/${encodeURIComponent(seller.storefrontSlug || seller.id)}/feed.json`;
    const embedUrl = `${baseUrl}/api/public/dealers/${encodeURIComponent(seller.storefrontSlug || seller.id)}/embed?limit=12`;
    const resolvedCategory = routeCategory ? filteredListings[0]?.subcategory || titleCaseSlug(routeCategory) : '';
    const pageTitle = resolvedCategory
      ? `${seller.storefrontName} ${resolvedCategory} Inventory`
      : `${seller.storefrontName} Equipment Inventory`;
    const pageDescription = resolvedCategory
      ? `Browse ${resolvedCategory.toLowerCase()} inventory from ${seller.storefrontName} on TimberEquip.`
      : `Browse live equipment inventory, contact details, and dealer storefront information for ${seller.storefrontName}.`;

    res.status(200).type('html').send(
      renderInventoryPage({
        title: pageTitle,
        eyebrow: 'Dealer Storefront',
        description: pageDescription,
        canonicalUrl: `${baseUrl}${pathname}`,
        intro:
          seller.storefrontDescription ||
          seller.storefrontTagline ||
          `${seller.storefrontName} has a cleaner public storefront here so buyers can see real inventory, routes, and contact paths before jumping into the heavier app experience.`,
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { label: 'Dealers', path: '/dealers' },
          { label: seller.storefrontName, path: buildDealerPath(seller) },
          ...(resolvedCategory ? [{ label: resolvedCategory, path: pathname }] : []),
        ],
        stats: [
          { label: 'Live Listings', value: filteredListings.length },
          { label: 'Dealer Categories', value: visibleCategoryLinks.length },
          { label: 'Location', value: seller.location || 'Pending' },
          { label: 'Feed', value: 'Ready' },
        ],
        featureCards: [
          {
            eyebrow: 'Dealer Utility',
            title: 'Built for storefront conversion',
            description: 'This page keeps the first screen focused on inventory, contact context, and direct routes instead of decorative browsing chrome.',
          },
          {
            eyebrow: 'Syndication',
            title: 'JSON and embed support',
            description: 'Dealers can use their existing public feed and embed endpoints for off-site inventory widgets and partner placements.',
          },
          {
            eyebrow: 'SEO Surface',
            title: 'Crawlable, shareable, ad-ready',
            description: 'The storefront loads as full HTML with metadata and inventory links in the first response.',
          },
        ],
        sections: [
          {
            eyebrow: 'Dealer Profile',
            title: 'Contact And Dealer Details',
            description: 'Use these direct paths to reach the dealer or syndicate their inventory.',
            html: `
              <div class="card-grid">
                <article class="feature-card"><div class="feature-card-body"><span class="pill">Location</span><strong style="margin-top:14px;">${escapeHtml(seller.location || 'Location pending')}</strong></div></article>
                <article class="feature-card"><div class="feature-card-body"><span class="pill">Phone</span><strong style="margin-top:14px;">${escapeHtml(seller.phone || 'Contact via listing inquiry')}</strong></div></article>
                <article class="feature-card"><div class="feature-card-body"><span class="pill">Email</span><strong style="margin-top:14px;">${escapeHtml(seller.email || 'Use the listing contact form')}</strong></div></article>
                <article class="feature-card"><div class="feature-card-body"><span class="pill">Inventory Feed</span><strong style="margin-top:14px;"><a href="${escapeHtml(feedUrl)}">${escapeHtml(feedUrl)}</a></strong></div></article>
              </div>
              <div class="section-actions">
                <a class="button button-secondary" href="${escapeHtml(feedUrl)}">Open JSON Feed</a>
                <a class="button button-secondary" href="${escapeHtml(embedUrl)}">Open Embed Preview</a>
                <a class="button button-secondary" href="${escapeHtml(buildDealerPath(seller))}/inventory">All Inventory</a>
              </div>
            `,
          },
          {
            eyebrow: 'Dealer Routes',
            title: 'Inventory Categories',
            description: 'Category-specific routes available on this storefront.',
            html: renderLinkCards(visibleCategoryLinks, { emptyMessage: 'This dealer has not published enough inventory for category-specific routes yet.' }),
          },
        ],
        listings: filteredListings,
        primaryAction: { href: `${buildDealerPath(seller)}/inventory`, label: 'Browse Dealer Inventory' },
        secondaryAction: { href: '/search', label: 'Open Marketplace Search' },
        jsonLd: buildDealerJsonLd(seller, filteredListings, `${baseUrl}${pathname}`, [
          { label: 'Home', path: '/' },
          { label: 'Dealers', path: '/dealers' },
          { label: seller.storefrontName, path: buildDealerPath(seller) },
          ...(resolvedCategory ? [{ label: resolvedCategory, path: pathname }] : []),
        ]),
      })
    );
    return true;
  }

  return false;
}

async function handlePublicPagesRequest(req, res, next) {
  try {
    if (!['GET', 'HEAD'].includes(String(req.method || '').toUpperCase())) {
      if (typeof next === 'function') return next();
      res.status(405).send('Method not allowed');
      return;
    }

    if (!isHybridPublicPath(req.path || '/')) {
      if (typeof next === 'function') return next();
      res.status(404).send('Not found');
      return;
    }

    const handled = await renderRoute(req, res);
    if (!handled && typeof next === 'function') {
      return next();
    }
  } catch (error) {
    console.error('Failed to render hybrid public page:', error);
    if (typeof next === 'function') {
      return next(error);
    }

    res.status(500).type('html').send(
      renderShell({
        title: 'Marketplace Page Unavailable',
        description: 'The requested marketplace page could not be generated right now.',
        canonicalUrl: `${getRequestBaseUrl(req)}${req.path || '/'}`,
        body: `
          <main class="shell hero">
            <span class="eyebrow">Temporary Issue</span>
            <h1>Marketplace Page Unavailable</h1>
            <p>We could not generate this public marketplace page right now. The inventory app may still be available while we retry.</p>
            <div class="hero-actions">
              <a class="button button-primary" href="/search">Open Marketplace Search</a>
              <a class="button button-secondary" href="/dealers">Browse Dealers</a>
            </div>
          </main>
        `,
      })
    );
  }
}

module.exports = {
  handlePublicPagesRequest,
  isHybridPublicPath,
};
