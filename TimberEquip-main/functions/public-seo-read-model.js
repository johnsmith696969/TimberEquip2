const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');
const { filterLinksByRouteThreshold, meetsRouteThreshold } = require('./seo-route-quality.js');
const { buildListingPublicPath, encodeListingPublicKey } = require('./listing-public-paths.js');
const { isDealerSellerRole, isOperatorOnlyRole } = require('./role-scopes.js');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_PROJECT_ID = 'mobile-app-equipment-sales';
const PUBLIC_SEO_COLLECTIONS = Object.freeze({
  listings: 'publicListings',
  dealers: 'publicDealers',
  routes: 'seoRouteIndex',
});
const MARKET_ROUTE_LABELS = Object.freeze({
  logging: 'logging-equipment-for-sale',
  forestry: 'forestry-equipment-for-sale',
});
const CANONICAL_MARKET_KEY = 'forestry';
const MAX_ROUTE_LISTINGS = 24;
const MAX_ROUTE_LINKS = 18;
const MAX_DIRECTORY_ITEMS = 150;
const SERVICE_AREA_SCOPE_OPTIONS = Object.freeze(['State', 'USA', 'Canada', 'Global']);
const SERVICE_AREA_SCOPE_LOOKUP = new Map(
  SERVICE_AREA_SCOPE_OPTIONS.map((value) => [String(value).toLowerCase(), value])
);

function normalizeNonEmptyString(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function resolveProjectId() {
  return normalizeNonEmptyString(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.PROJECT_ID, DEFAULT_PROJECT_ID);
}

function resolveFirestoreDatabaseId() {
  const configuredDatabaseId = normalizeNonEmptyString(
    process.env.FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID,
    '',
  );

  if (configuredDatabaseId) {
    return configuredDatabaseId;
  }

  return resolveProjectId() === 'timberequip-staging' ? '(default)' : DEFAULT_FIRESTORE_DB_ID;
}

const PROJECT_ID = resolveProjectId();
const FIRESTORE_DB_ID = resolveFirestoreDatabaseId();

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

function normalizeServiceAreaScopes(value, maxItems = 8) {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((entry) => normalizeText(entry))
    .filter(Boolean)
    .map((entry) => SERVICE_AREA_SCOPE_LOOKUP.get(entry.toLowerCase()) || null)
    .filter(Boolean);

  return [...new Set(normalized)].slice(0, maxItems);
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

function normalizeImageUrls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter((entry) => /^https?:\/\//i.test(entry));
}

function isListingVisible(listing) {
  const approvalStatus = normalizeText(listing?.approvalStatus).toLowerCase();
  const paymentStatus = normalizeText(listing?.paymentStatus).toLowerCase();
  const status = normalizeText(listing?.status, 'active').toLowerCase();

  if (approvalStatus !== 'approved') return false;
  if (paymentStatus !== 'paid') return false;
  if (['sold', 'expired', 'archived', 'pending'].includes(status)) return false;

  const expiresAt = timestampToDate(listing?.expiresAt);
  return !expiresAt || expiresAt.getTime() > Date.now();
}

function pickManufacturer(listing) {
  return normalizeText(listing?.make || listing?.manufacturer || listing?.brand);
}

function buildListingUrl(listing) {
  return buildListingPublicPath(listing);
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

function buildStateMarketPath(state, market = CANONICAL_MARKET_KEY) {
  return `/states/${normalizeSeoSlug(state, 'region')}/${MARKET_ROUTE_LABELS[market]}`;
}

function buildStateCategoryPath(state, category) {
  return `/states/${normalizeSeoSlug(state, 'region')}/${normalizeSeoSlug(category, 'equipment')}-for-sale`;
}

function createCountLinks(values, pathBuilder, limit = MAX_ROUTE_LINKS) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, path: pathBuilder(label) }));
}

function pickLastmod(listings) {
  const timestamps = listings
    .map((listing) => timestampToDate(listing.updatedAtIso || listing.createdAtIso || listing.lastmod))
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime());

  return timestamps[0] ? timestamps[0].toISOString() : null;
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function sortListings(listings) {
  return [...listings].sort((left, right) => {
    const featuredDelta = Number(Boolean(right.featured)) - Number(Boolean(left.featured));
    if (featuredDelta !== 0) return featuredDelta;

    const rightUpdated = timestampToDate(right.updatedAtIso || right.updatedAt || right.createdAtIso || right.createdAt)?.getTime() || 0;
    const leftUpdated = timestampToDate(left.updatedAtIso || left.updatedAt || left.createdAtIso || left.createdAt)?.getTime() || 0;
    if (rightUpdated !== leftUpdated) return rightUpdated - leftUpdated;

    return normalizeText(left.title).localeCompare(normalizeText(right.title));
  });
}

function summarizeListing(listingId, data) {
  const sellerUid = normalizeText(data?.sellerUid || data?.sellerId);
  if (!sellerUid || !isListingVisible(data)) {
    return null;
  }

  const manufacturer = pickManufacturer(data);
  const category = normalizeText(data?.category, 'Equipment');
  const subcategory = normalizeText(data?.subcategory || category, 'Equipment');
  const model = normalizeText(data?.model);
  const state = normalizeText(getStateFromLocation(data?.location));
  const images = normalizeImageUrls(data?.images);

  return {
    id: listingId,
    sellerUid,
    title: normalizeText(data?.title, 'Equipment Listing'),
    category,
    categorySlug: normalizeSeoSlug(category, 'equipment'),
    subcategory,
    subcategorySlug: normalizeSeoSlug(subcategory, 'equipment'),
    manufacturer,
    manufacturerSlug: normalizeSeoSlug(manufacturer, 'brand'),
    model,
    modelSlug: normalizeSeoSlug(model, 'model'),
    year: Number(data?.year || 0) || null,
    price: Number(data?.price || 0) || 0,
    currency: normalizeText(data?.currency, 'USD'),
    hours: Number(data?.hours || 0) || 0,
    condition: normalizeText(data?.condition, 'Used'),
    description: normalizeText(data?.description),
    location: normalizeText(data?.location, 'Location pending'),
    state,
    stateSlug: normalizeSeoSlug(state, 'region'),
    images,
    image: images[0] || '',
    featured: Boolean(data?.featured),
    status: normalizeText(data?.status, 'active'),
    createdAtIso: timestampToIso(data?.createdAt),
    updatedAtIso: timestampToIso(data?.updatedAt),
    lastmod: timestampToIso(data?.updatedAt) || timestampToIso(data?.createdAt) || new Date().toISOString(),
    publicKey: encodeListingPublicKey(listingId),
    listingUrl: buildListingUrl({
      id: listingId,
      title: data?.title,
      year: data?.year,
      make: data?.make,
      manufacturer: data?.manufacturer,
      brand: data?.brand,
      model,
      category,
      subcategory,
      location: data?.location,
    }),
  };
}

async function loadSellerSnapshot(sellerUid) {
  const normalizedSellerUid = normalizeText(sellerUid);
  if (!normalizedSellerUid) {
    return { id: '', userData: {}, storefrontData: {} };
  }

  const [userDoc, storefrontDoc] = await Promise.all([
    getDb().collection('users').doc(normalizedSellerUid).get(),
    getDb().collection('storefronts').doc(normalizedSellerUid).get(),
  ]);

  return {
    id: normalizedSellerUid,
    userData: userDoc.exists ? userDoc.data() || {} : {},
    storefrontData: storefrontDoc.exists ? storefrontDoc.data() || {} : {},
  };
}

async function syncPublicListingSummary(listingId, listingData) {
  const ref = getDb().collection(PUBLIC_SEO_COLLECTIONS.listings).doc(String(listingId));
  const summary = summarizeListing(String(listingId), listingData);

  if (!summary) {
    await ref.delete().catch(() => undefined);
    return null;
  }

  await ref.set(
    {
      ...summary,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return summary;
}

async function syncPublicDealerSummary(sellerUid) {
  const normalizedSellerUid = normalizeText(sellerUid);
  if (!normalizedSellerUid) return null;

  const db = getDb();
  const [{ userData, storefrontData }, listingsSnapshot] = await Promise.all([
    loadSellerSnapshot(normalizedSellerUid),
    db.collection(PUBLIC_SEO_COLLECTIONS.listings).where('sellerUid', '==', normalizedSellerUid).get(),
  ]);

  const merged = { ...userData, ...storefrontData };
  if (isOperatorOnlyRole(merged.role)) {
    await db.collection(PUBLIC_SEO_COLLECTIONS.dealers).doc(normalizedSellerUid).delete().catch(() => undefined);
    return null;
  }
  const sellerPath = buildDealerPath({
    storefrontSlug: normalizeText(merged.storefrontSlug, normalizedSellerUid),
    id: normalizedSellerUid,
  });
  const listings = sortListings(
    listingsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
  );

  const summary = {
    id: normalizedSellerUid,
    uid: normalizedSellerUid,
    storefrontSlug: normalizeText(merged.storefrontSlug, normalizedSellerUid),
    storefrontName: normalizeText(merged.storefrontName || merged.displayName || merged.name, 'Dealer Storefront'),
    storefrontTagline: normalizeText(merged.storefrontTagline),
    storefrontDescription: normalizeText(merged.storefrontDescription || merged.about),
    businessName: normalizeText(merged.businessName || merged.company),
    street1: normalizeText(merged.street1),
    street2: normalizeText(merged.street2),
    city: normalizeText(merged.city),
    state: normalizeText(merged.state),
    county: normalizeText(merged.county),
    postalCode: normalizeText(merged.postalCode),
    country: normalizeText(merged.country),
    latitude: Number.isFinite(Number(merged.latitude)) ? Number(merged.latitude) : undefined,
    longitude: Number.isFinite(Number(merged.longitude)) ? Number(merged.longitude) : undefined,
    location: normalizeText(merged.location),
    phone: normalizeText(merged.phone || merged.phoneNumber),
    email: normalizeText(merged.email),
    website: normalizeText(merged.website),
    logo: normalizeText(merged.logo || merged.storefrontLogoUrl || merged.photoURL),
    coverPhotoUrl: normalizeText(merged.coverPhotoUrl),
    serviceAreaScopes: normalizeServiceAreaScopes(merged.serviceAreaScopes, 8),
    serviceAreaStates: Array.isArray(merged.serviceAreaStates) ? merged.serviceAreaStates.map((entry) => normalizeText(entry)).filter(Boolean) : [],
    serviceAreaCounties: Array.isArray(merged.serviceAreaCounties) ? merged.serviceAreaCounties.map((entry) => normalizeText(entry)).filter(Boolean) : [],
    servicesOfferedCategories: Array.isArray(merged.servicesOfferedCategories) ? merged.servicesOfferedCategories.map((entry) => normalizeText(entry)).filter(Boolean) : [],
    servicesOfferedSubcategories: Array.isArray(merged.servicesOfferedSubcategories) ? merged.servicesOfferedSubcategories.map((entry) => normalizeText(entry)).filter(Boolean) : [],
    role: normalizeText(merged.role),
    createdAtIso: timestampToIso(merged.createdAt),
    verified: Boolean(merged.manuallyVerified === true || isDealerSellerRole(normalizeText(merged.role)) || merged.verified === true),
    listingCount: listings.length,
    featuredListingCount: listings.filter((listing) => listing.featured).length,
    categoryCount: uniqueCount(listings.map((listing) => listing.subcategory)),
    manufacturerCount: uniqueCount(listings.map((listing) => listing.manufacturer)),
    stateCount: uniqueCount(listings.map((listing) => listing.state)),
    lastmod: pickLastmod(listings),
    topCategories: filterLinksByRouteThreshold(
      createCountLinks(
        listings.map((listing) => listing.subcategory),
        (category) => `${sellerPath}/${normalizeSeoSlug(category, 'equipment')}`,
        MAX_ROUTE_LINKS
      ),
      'dealerCategory'
    ),
    topManufacturers: createCountLinks(listings.map((listing) => listing.manufacturer), buildManufacturerPath, MAX_ROUTE_LINKS),
    topStates: createCountLinks(listings.map((listing) => listing.state), (state) => buildStateMarketPath(state), MAX_ROUTE_LINKS),
    topListings: listings.slice(0, MAX_ROUTE_LISTINGS),
  };

  const ref = db.collection(PUBLIC_SEO_COLLECTIONS.dealers).doc(normalizedSellerUid);
  await ref.set(
    {
      ...summary,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return summary;
}

async function loadPublicListings() {
  const snapshot = await getDb().collection(PUBLIC_SEO_COLLECTIONS.listings).get();
  return sortListings(
    snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
  );
}

async function loadPublicDealers() {
  const snapshot = await getDb().collection(PUBLIC_SEO_COLLECTIONS.dealers).get();
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .filter((dealer) => !isOperatorOnlyRole(dealer.role));
}

function buildDealerLinkCard(seller, count) {
  return {
    id: seller.id,
    label: seller.storefrontName,
    path: buildDealerPath(seller),
    count,
    subtext: seller.location || 'Dealer storefront',
    image: seller.logo || '',
  };
}

function sortDealersByCount(dealerCountMap, dealerMap) {
  return [...dealerCountMap.entries()]
    .map(([sellerUid, count]) => ({ seller: dealerMap.get(sellerUid), count }))
    .filter((entry) => entry.seller)
    .sort((left, right) => right.count - left.count || left.seller.storefrontName.localeCompare(right.seller.storefrontName));
}

function buildRouteIndexDocuments(listings, dealerDocs) {
  const dealerMap = new Map(
    dealerDocs.map((dealer) => [
      normalizeText(dealer.id),
      {
        ...dealer,
        id: normalizeText(dealer.id),
        storefrontSlug: normalizeText(dealer.storefrontSlug, dealer.id),
        storefrontName: normalizeText(dealer.storefrontName, 'Dealer Storefront'),
      },
    ])
  );

  const sellerCounts = new Map();
  listings.forEach((listing) => {
    sellerCounts.set(listing.sellerUid, (sellerCounts.get(listing.sellerUid) || 0) + 1);
  });

  const allCategoryLinks = filterLinksByRouteThreshold(
    createCountLinks(listings.map((listing) => listing.subcategory), buildCategoryPath, 5000),
    'category'
  );
  const allManufacturerLinks = filterLinksByRouteThreshold(
    createCountLinks(listings.map((listing) => listing.manufacturer), buildManufacturerPath, 5000),
    'manufacturer'
  );
  const allStateLinks = filterLinksByRouteThreshold(
    createCountLinks(listings.map((listing) => listing.state), (state) => buildStateMarketPath(state), 5000),
    'stateMarket'
  );
  const allDealerCards = sortDealersByCount(sellerCounts, dealerMap)
    .filter((entry) => meetsRouteThreshold('dealer', entry.count))
    .map((entry) => buildDealerLinkCard(entry.seller, entry.count));

  const routeDocs = new Map();
  const overallLastmod = pickLastmod(listings);

  routeDocs.set('market:forestry', {
    routeType: 'marketHub',
    path: `/${MARKET_ROUTE_LABELS[CANONICAL_MARKET_KEY]}`,
    lastmod: overallLastmod,
    sitemapEligible: true,
    stats: {
      listingCount: listings.length,
      manufacturerCount: uniqueCount(listings.map((listing) => listing.manufacturer)),
      stateCount: uniqueCount(listings.map((listing) => listing.state)),
      categoryCount: uniqueCount(listings.map((listing) => listing.subcategory)),
      dealerCount: allDealerCards.length,
    },
    listings: listings.slice(0, MAX_ROUTE_LISTINGS),
    topCategories: allCategoryLinks.slice(0, 12),
    topManufacturers: allManufacturerLinks.slice(0, 12),
    topStates: allStateLinks.slice(0, 12),
    topDealers: allDealerCards.slice(0, 9),
  });

  routeDocs.set('directory:categories', {
    routeType: 'directory',
    path: '/categories',
    lastmod: overallLastmod,
    sitemapEligible: true,
    items: allCategoryLinks.slice(0, MAX_DIRECTORY_ITEMS),
    stats: {
      itemCount: allCategoryLinks.length,
    },
  });

  routeDocs.set('directory:manufacturers', {
    routeType: 'directory',
    path: '/manufacturers',
    lastmod: overallLastmod,
    sitemapEligible: true,
    items: allManufacturerLinks.slice(0, MAX_DIRECTORY_ITEMS),
    stats: {
      itemCount: allManufacturerLinks.length,
    },
  });

  routeDocs.set('directory:states', {
    routeType: 'directory',
    path: '/states',
    lastmod: overallLastmod,
    sitemapEligible: true,
    items: allStateLinks.slice(0, MAX_DIRECTORY_ITEMS),
    stats: {
      itemCount: allStateLinks.length,
    },
  });

  routeDocs.set('directory:dealers', {
    routeType: 'directory',
    path: '/dealers',
    lastmod: overallLastmod,
    sitemapEligible: true,
    items: allDealerCards.slice(0, MAX_DIRECTORY_ITEMS),
    stats: {
      itemCount: allDealerCards.length,
      listingCount: listings.length,
    },
  });

  allCategoryLinks.forEach((item) => {
    const categorySlug = normalizeSeoSlug(item.label, 'equipment');
    const matchingListings = listings.filter((listing) => listing.subcategorySlug === categorySlug);
    const topManufacturers = filterLinksByRouteThreshold(
      createCountLinks(matchingListings.map((listing) => listing.manufacturer), buildManufacturerPath, MAX_ROUTE_LINKS),
      'manufacturer'
    );
    const topStates = filterLinksByRouteThreshold(
      createCountLinks(matchingListings.map((listing) => listing.state), (state) => buildStateCategoryPath(state, item.label), MAX_ROUTE_LINKS),
      'stateCategory'
    );

    routeDocs.set(`category:${categorySlug}`, {
      routeType: 'category',
      path: item.path,
      label: item.label,
      lastmod: pickLastmod(matchingListings),
      sitemapEligible: true,
      stats: {
        listingCount: matchingListings.length,
        dealerCount: uniqueCount(matchingListings.map((listing) => listing.sellerUid)),
        manufacturerCount: uniqueCount(matchingListings.map((listing) => listing.manufacturer)),
        stateCount: uniqueCount(matchingListings.map((listing) => listing.state)),
      },
      listings: matchingListings.slice(0, MAX_ROUTE_LISTINGS),
      topManufacturers,
      topStates,
    });
  });

  allManufacturerLinks.forEach((item) => {
    const manufacturerSlug = normalizeSeoSlug(item.label, 'brand');
    const matchingListings = listings.filter((listing) => listing.manufacturerSlug === manufacturerSlug);
    const topCategories = filterLinksByRouteThreshold(
      createCountLinks(matchingListings.map((listing) => listing.subcategory), (category) => buildManufacturerCategoryPath(item.label, category), MAX_ROUTE_LINKS),
      'manufacturerCategory'
    );
    const topModels = filterLinksByRouteThreshold(
      createCountLinks(matchingListings.map((listing) => listing.model), (model) => buildManufacturerModelPath(item.label, model), 5000),
      'manufacturerModel'
    );
    const topStates = filterLinksByRouteThreshold(
      createCountLinks(matchingListings.map((listing) => listing.state), buildStateMarketPath, MAX_ROUTE_LINKS),
      'stateMarket'
    );

    routeDocs.set(`manufacturer:${manufacturerSlug}`, {
      routeType: 'manufacturer',
      path: item.path,
      label: item.label,
      lastmod: pickLastmod(matchingListings),
      sitemapEligible: true,
      stats: {
        listingCount: matchingListings.length,
        dealerCount: uniqueCount(matchingListings.map((listing) => listing.sellerUid)),
        categoryCount: uniqueCount(matchingListings.map((listing) => listing.subcategory)),
        modelCount: uniqueCount(matchingListings.map((listing) => listing.model)),
        stateCount: uniqueCount(matchingListings.map((listing) => listing.state)),
      },
      listings: matchingListings.slice(0, MAX_ROUTE_LISTINGS),
      topCategories: topCategories.slice(0, MAX_ROUTE_LINKS),
      topModels: topModels.slice(0, MAX_ROUTE_LINKS),
      topStates: topStates.slice(0, MAX_ROUTE_LINKS),
    });

    topModels.forEach((modelRoute) => {
      const modelSlug = normalizeSeoSlug(modelRoute.label, 'model');
      const modelListings = matchingListings.filter((listing) => listing.modelSlug === modelSlug);
      const modelCategories = filterLinksByRouteThreshold(
        createCountLinks(modelListings.map((listing) => listing.subcategory), (category) => buildManufacturerModelCategoryPath(item.label, modelRoute.label, category), MAX_ROUTE_LINKS),
        'manufacturerModelCategory'
      );
      const modelStates = filterLinksByRouteThreshold(
        createCountLinks(modelListings.map((listing) => listing.state), buildStateMarketPath, MAX_ROUTE_LINKS),
        'stateMarket'
      );

      routeDocs.set(`manufacturerModel:${manufacturerSlug}:${modelSlug}`, {
        routeType: 'manufacturerModel',
        path: modelRoute.path,
        label: modelRoute.label,
        manufacturer: item.label,
        lastmod: pickLastmod(modelListings),
        sitemapEligible: true,
        stats: {
          listingCount: modelListings.length,
          dealerCount: uniqueCount(modelListings.map((listing) => listing.sellerUid)),
          categoryCount: uniqueCount(modelListings.map((listing) => listing.subcategory)),
          stateCount: uniqueCount(modelListings.map((listing) => listing.state)),
        },
        listings: modelListings.slice(0, MAX_ROUTE_LISTINGS),
        topCategories: modelCategories.slice(0, MAX_ROUTE_LINKS),
        topStates: modelStates.slice(0, MAX_ROUTE_LINKS),
      });

      modelCategories.forEach((categoryRoute) => {
        const routeCategorySlug = normalizeSeoSlug(categoryRoute.label, 'equipment');
        const categoryListings = modelListings.filter((listing) => listing.subcategorySlug === routeCategorySlug);
        const relatedStates = filterLinksByRouteThreshold(
          createCountLinks(categoryListings.map((listing) => listing.state), (state) => buildStateCategoryPath(state, categoryRoute.label), MAX_ROUTE_LINKS),
          'stateCategory'
        );

        routeDocs.set(`manufacturerModelCategory:${manufacturerSlug}:${modelSlug}:${routeCategorySlug}`, {
          routeType: 'manufacturerModelCategory',
          path: categoryRoute.path,
          label: categoryRoute.label,
          manufacturer: item.label,
          model: modelRoute.label,
          lastmod: pickLastmod(categoryListings),
          sitemapEligible: true,
          stats: {
            listingCount: categoryListings.length,
            dealerCount: uniqueCount(categoryListings.map((listing) => listing.sellerUid)),
            stateCount: uniqueCount(categoryListings.map((listing) => listing.state)),
          },
          listings: categoryListings.slice(0, MAX_ROUTE_LISTINGS),
          topStates: relatedStates.slice(0, MAX_ROUTE_LINKS),
        });
      });
    });

    topCategories.forEach((categoryRoute) => {
      const routeCategorySlug = normalizeSeoSlug(categoryRoute.label, 'equipment');
      const categoryListings = matchingListings.filter((listing) => listing.subcategorySlug === routeCategorySlug);
      const relatedModels = filterLinksByRouteThreshold(
        createCountLinks(categoryListings.map((listing) => listing.model), (model) => buildManufacturerModelCategoryPath(item.label, model, categoryRoute.label), MAX_ROUTE_LINKS),
        'manufacturerModelCategory'
      );
      const relatedStates = filterLinksByRouteThreshold(
        createCountLinks(categoryListings.map((listing) => listing.state), (state) => buildStateCategoryPath(state, categoryRoute.label), MAX_ROUTE_LINKS),
        'stateCategory'
      );

      routeDocs.set(`manufacturerCategory:${manufacturerSlug}:${routeCategorySlug}`, {
        routeType: 'manufacturerCategory',
        path: categoryRoute.path,
        label: categoryRoute.label,
        manufacturer: item.label,
        lastmod: pickLastmod(categoryListings),
        sitemapEligible: true,
        stats: {
          listingCount: categoryListings.length,
          dealerCount: uniqueCount(categoryListings.map((listing) => listing.sellerUid)),
          modelCount: uniqueCount(categoryListings.map((listing) => listing.model)),
          stateCount: uniqueCount(categoryListings.map((listing) => listing.state)),
        },
        listings: categoryListings.slice(0, MAX_ROUTE_LISTINGS),
        topModels: relatedModels.slice(0, MAX_ROUTE_LINKS),
        topStates: relatedStates.slice(0, MAX_ROUTE_LINKS),
      });
    });
  });

  allStateLinks.forEach((item) => {
    const stateSlug = normalizeSeoSlug(item.label, 'region');
    const matchingListings = listings.filter((listing) => listing.stateSlug === stateSlug);
    const topCategories = filterLinksByRouteThreshold(
      createCountLinks(matchingListings.map((listing) => listing.subcategory), (category) => buildStateCategoryPath(item.label, category), 5000),
      'stateCategory'
    );
    const topManufacturers = filterLinksByRouteThreshold(
      createCountLinks(matchingListings.map((listing) => listing.manufacturer), buildManufacturerPath, MAX_ROUTE_LINKS),
      'manufacturer'
    );

    routeDocs.set(`stateMarket:${stateSlug}`, {
      routeType: 'stateMarket',
      path: item.path,
      label: item.label,
      lastmod: pickLastmod(matchingListings),
      sitemapEligible: true,
      stats: {
        listingCount: matchingListings.length,
        dealerCount: uniqueCount(matchingListings.map((listing) => listing.sellerUid)),
        categoryCount: uniqueCount(matchingListings.map((listing) => listing.subcategory)),
        manufacturerCount: uniqueCount(matchingListings.map((listing) => listing.manufacturer)),
      },
      listings: matchingListings.slice(0, MAX_ROUTE_LISTINGS),
      topCategories: topCategories.slice(0, MAX_ROUTE_LINKS),
      topManufacturers: topManufacturers.slice(0, MAX_ROUTE_LINKS),
    });

    topCategories.forEach((categoryRoute) => {
      const routeCategorySlug = normalizeSeoSlug(categoryRoute.label, 'equipment');
      const categoryListings = matchingListings.filter((listing) => listing.subcategorySlug === routeCategorySlug);
      const relatedManufacturers = filterLinksByRouteThreshold(
        createCountLinks(categoryListings.map((listing) => listing.manufacturer), (manufacturer) => buildManufacturerCategoryPath(manufacturer, categoryRoute.label), MAX_ROUTE_LINKS),
        'manufacturerCategory'
      );

      routeDocs.set(`stateCategory:${stateSlug}:${routeCategorySlug}`, {
        routeType: 'stateCategory',
        path: categoryRoute.path,
        label: categoryRoute.label,
        state: item.label,
        lastmod: pickLastmod(categoryListings),
        sitemapEligible: true,
        stats: {
          listingCount: categoryListings.length,
          dealerCount: uniqueCount(categoryListings.map((listing) => listing.sellerUid)),
          manufacturerCount: uniqueCount(categoryListings.map((listing) => listing.manufacturer)),
        },
        listings: categoryListings.slice(0, MAX_ROUTE_LISTINGS),
        topManufacturers: relatedManufacturers.slice(0, MAX_ROUTE_LINKS),
      });
    });
  });

  allDealerCards.forEach((dealerCard) => {
    const seller = dealerMap.get(dealerCard.id);
    if (!seller) return;

    const sellerListings = listings.filter((listing) => listing.sellerUid === seller.id);
    const categoryLinks = filterLinksByRouteThreshold(
      createCountLinks(sellerListings.map((listing) => listing.subcategory), (category) => `${buildDealerPath(seller)}/${normalizeSeoSlug(category, 'equipment')}`, 5000),
      'dealerCategory'
    );
    const stats = {
      listingCount: sellerListings.length,
      featuredCount: sellerListings.filter((listing) => listing.featured).length,
      categoryCount: uniqueCount(sellerListings.map((listing) => listing.subcategory)),
      manufacturerCount: uniqueCount(sellerListings.map((listing) => listing.manufacturer)),
      stateCount: uniqueCount(sellerListings.map((listing) => listing.state)),
    };

    routeDocs.set(`dealer:${seller.storefrontSlug}`, {
      routeType: 'dealer',
      path: buildDealerPath(seller),
      lastmod: pickLastmod(sellerListings),
      sitemapEligible: true,
      seller,
      stats,
      listings: sellerListings.slice(0, MAX_ROUTE_LISTINGS),
      categoryLinks: categoryLinks.slice(0, MAX_ROUTE_LINKS),
    });

    routeDocs.set(`dealerInventory:${seller.storefrontSlug}`, {
      routeType: 'dealerInventory',
      path: `${buildDealerPath(seller)}/inventory`,
      lastmod: pickLastmod(sellerListings),
      sitemapEligible: true,
      seller,
      stats,
      listings: sellerListings.slice(0, MAX_ROUTE_LISTINGS),
      categoryLinks: categoryLinks.slice(0, MAX_ROUTE_LINKS),
    });

    categoryLinks.forEach((categoryRoute) => {
      const routeCategorySlug = normalizeSeoSlug(categoryRoute.label, 'equipment');
      const categoryListings = sellerListings.filter((listing) => listing.subcategorySlug === routeCategorySlug);
      routeDocs.set(`dealerCategory:${seller.storefrontSlug}:${routeCategorySlug}`, {
        routeType: 'dealerCategory',
        path: categoryRoute.path,
        lastmod: pickLastmod(categoryListings),
        sitemapEligible: true,
        seller,
        category: categoryRoute.label,
        stats: {
          listingCount: categoryListings.length,
          manufacturerCount: uniqueCount(categoryListings.map((listing) => listing.manufacturer)),
          stateCount: uniqueCount(categoryListings.map((listing) => listing.state)),
        },
        listings: categoryListings.slice(0, MAX_ROUTE_LISTINGS),
        categoryLinks: categoryLinks.slice(0, MAX_ROUTE_LINKS),
      });
    });
  });

  return routeDocs;
}

function chunk(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

async function writeRouteIndexDocuments(routeDocs) {
  const db = getDb();
  const collectionRef = db.collection(PUBLIC_SEO_COLLECTIONS.routes);
  const existingSnapshot = await collectionRef.get();
  const existingIds = new Set(existingSnapshot.docs.map((docSnap) => docSnap.id));
  const nextEntries = [...routeDocs.entries()];

  nextEntries.forEach(([docId, routeDoc]) => {
    existingIds.delete(docId);
    routeDoc.routeId = docId;
  });

  const writes = [
    ...nextEntries.map(([docId, routeDoc]) => ({ type: 'set', docId, data: routeDoc })),
    ...[...existingIds].map((docId) => ({ type: 'delete', docId })),
  ];

  for (const batchWrites of chunk(writes, 400)) {
    const batch = db.batch();
    batchWrites.forEach((write) => {
      const ref = collectionRef.doc(write.docId);
      if (write.type === 'delete') {
        batch.delete(ref);
        return;
      }

      batch.set(
        ref,
        {
          ...write.data,
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  }
}

async function rebuildSeoRouteIndex() {
  const [listings, dealers] = await Promise.all([loadPublicListings(), loadPublicDealers()]);
  const routeDocs = buildRouteIndexDocuments(listings, dealers);
  await writeRouteIndexDocuments(routeDocs);
  return {
    listingCount: listings.length,
    dealerCount: dealers.length,
    routeCount: routeDocs.size,
  };
}

async function rebuildPublicSeoReadModel() {
  const db = getDb();
  const listingsSnapshot = await db.collection('listings').get();
  const touchedSellerUids = new Set();

  for (const docSnap of listingsSnapshot.docs) {
    const listingData = docSnap.data() || {};
    touchedSellerUids.add(normalizeText(listingData.sellerUid || listingData.sellerId));
    await syncPublicListingSummary(docSnap.id, listingData);
  }

  const [usersSnapshot, storefrontsSnapshot] = await Promise.all([
    db.collection('users').get(),
    db.collection('storefronts').get(),
  ]);

  usersSnapshot.docs.forEach((docSnap) => touchedSellerUids.add(normalizeText(docSnap.id)));
  storefrontsSnapshot.docs.forEach((docSnap) => touchedSellerUids.add(normalizeText(docSnap.id)));

  for (const sellerUid of touchedSellerUids) {
    if (!sellerUid) continue;
    await syncPublicDealerSummary(sellerUid);
  }

  const rebuildSummary = await rebuildSeoRouteIndex();
  logger.info('Rebuilt public SEO read model', rebuildSummary);
  return rebuildSummary;
}

async function syncPublicSeoForListingChange({ listingId, before, after }) {
  const touchedSellerUids = new Set([
    normalizeText(before?.sellerUid || before?.sellerId),
    normalizeText(after?.sellerUid || after?.sellerId),
  ]);

  await syncPublicListingSummary(listingId, after);

  for (const sellerUid of touchedSellerUids) {
    if (!sellerUid) continue;
    await syncPublicDealerSummary(sellerUid);
  }

  return rebuildSeoRouteIndex();
}

async function syncPublicSeoForSellerChange(sellerUid) {
  await syncPublicDealerSummary(sellerUid);
  return rebuildSeoRouteIndex();
}

module.exports = {
  PUBLIC_SEO_COLLECTIONS,
  rebuildPublicSeoReadModel,
  rebuildSeoRouteIndex,
  syncPublicDealerSummary,
  syncPublicListingSummary,
  syncPublicSeoForListingChange,
  syncPublicSeoForSellerChange,
};
