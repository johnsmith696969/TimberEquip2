import { db, auth } from '../firebase';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  arrayUnion,
  onSnapshot,
  getDocFromServer,
  runTransaction
} from 'firebase/firestore';
import { Listing, ListingLifecycleAction, ListingLifecycleAuditView, ListingLifecycleStateSnapshot, Seller, NewsPost, Inquiry, FinancingRequest, Account, CallLog, Auction, ListingFilters } from '../types';
import { EQUIPMENT_TAXONOMY } from '../constants/equipmentData';
import {
  AMV_MATCH_HOURS_PERCENT,
  AMV_MATCH_PRICE_PERCENT,
  AMV_MATCH_YEAR_RANGE,
  AMV_MIN_COMPARABLES,
  isWithinPercentRange,
} from '../utils/amvMatching';
import { isPrivilegedAdminEmail, SUPERADMIN_EMAIL } from '../utils/privilegedAdmin';
import { taxonomyService } from './taxonomyService';

const DEMO_CATEGORY_LOCATIONS: Record<string, string[]> = {
  'Logging Equipment': ['Wisconsin, USA', 'Georgia, USA', 'Ontario, Canada'],
  'Land Clearing Equipment': ['Texas, USA', 'South Carolina, USA', 'Alberta, Canada'],
  'Firewood Equipment': ['Maine, USA', 'Vermont, USA', 'Michigan, USA'],
  'Trucks': ['Minnesota, USA', 'Pennsylvania, USA', 'New York, USA'],
  'Trailers': ['Ohio, USA', 'Indiana, USA', 'Quebec, Canada'],
};

const DEMO_CATEGORY_BASE_PRICES: Record<string, number> = {
  'Logging Equipment': 148000,
  'Land Clearing Equipment': 98000,
  'Firewood Equipment': 42000,
  'Trucks': 76000,
  'Trailers': 36000,
};

const FEATURED_LISTING_CAPS: Record<string, number> = {
  individual_seller: 1,
  dealer: 3,
  pro_dealer: 6,
};
const LISTING_SEQUENCE_COUNTER_PATH = ['systemCounters', 'listingSequence'] as const;
const FIRST_SEQUENTIAL_LISTING_ID = 12000;

function normalize(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

async function reserveNextSequentialListingId(): Promise<string> {
  const counterRef = doc(db, ...LISTING_SEQUENCE_COUNTER_PATH);
  const listingsCollectionRef = collection(db, 'listings');

  return runTransaction(db, async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef);
    const currentValue = Number(counterSnapshot.data()?.lastIssuedId);
    let nextValue = Number.isFinite(currentValue) && currentValue >= FIRST_SEQUENTIAL_LISTING_ID
      ? Math.trunc(currentValue) + 1
      : FIRST_SEQUENTIAL_LISTING_ID;

    while (true) {
      const listingRef = doc(listingsCollectionRef, String(nextValue));
      const existingListingSnapshot = await transaction.get(listingRef);
      if (!existingListingSnapshot.exists()) {
        transaction.set(counterRef, {
          lastIssuedId: nextValue,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        return String(nextValue);
      }

      nextValue += 1;
    }
  });
}

type MarketComparableSpecs = {
  listingId?: string;
  category?: string;
  manufacturer?: string;
  make?: string;
  model?: string;
  price?: number;
  year?: number;
  hours?: number;
};

type ResolvedMarketComparableSpecs = {
  listingId?: string;
  category?: string;
  manufacturer: string;
  model: string;
  price: number;
  year: number;
  hours: number;
};

function resolveMarketComparableSpecs(specs: MarketComparableSpecs): ResolvedMarketComparableSpecs | null {
  const manufacturer = normalize(specs.make || specs.manufacturer);
  const model = normalize(specs.model);
  const price = Number(specs.price);
  const year = Number(specs.year);
  const hours = Number(specs.hours);

  if (
    !manufacturer ||
    !model ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(year) ||
    !Number.isFinite(hours)
  ) {
    return null;
  }

  return {
    listingId: specs.listingId,
    category: normalize(specs.category),
    manufacturer,
    model,
    price,
    year,
    hours,
  };
}

function isMarketComparableListing(listing: Listing, specs: ResolvedMarketComparableSpecs): boolean {
  if (specs.listingId && listing.id === specs.listingId) return false;

  const listingManufacturer = normalize(listing.make || listing.manufacturer || listing.brand);
  const listingModel = normalize(listing.model);
  if (listingManufacturer !== specs.manufacturer) return false;
  if (listingModel !== specs.model) return false;

  if (specs.category && normalize(listing.category) !== specs.category) return false;

  if (!Number.isFinite(listing.price) || listing.price <= 0) return false;
  if (!Number.isFinite(listing.year) || Math.abs(listing.year - specs.year) > AMV_MATCH_YEAR_RANGE) return false;
  if (!Number.isFinite(listing.hours) || !isWithinPercentRange(listing.hours, specs.hours, AMV_MATCH_HOURS_PERCENT)) return false;
  if (!isWithinPercentRange(listing.price, specs.price, AMV_MATCH_PRICE_PERCENT)) return false;

  return true;
}

function scoreMarketComparableListing(listing: Listing, specs: ResolvedMarketComparableSpecs): number {
  const yearDelta = Math.abs(listing.year - specs.year);
  const hoursDeltaPercent = Math.abs(((listing.hours - specs.hours) / Math.max(specs.hours, 1)) * 100);
  const priceDeltaPercent = Math.abs(((listing.price - specs.price) / Math.max(specs.price, 1)) * 100);

  return yearDelta * 100 + hoursDeltaPercent * 10 + priceDeltaPercent * 10;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatManufacturerName(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function buildDemoSpecs(subcategory: string, variantIndex: number) {
  const commonSpecs = {
    engine: 'Turbo Diesel',
    horsepower: 180 + variantIndex * 15,
    weight: 12000 + variantIndex * 1500,
    driveType: 'Hydrostatic',
    attachments: ['Work Lights', 'Guarding Kit'],
  };

  switch (subcategory) {
    case 'Skidders':
      return {
        ...commonSpecs,
        grappleType: 'Dual Arch Grapple',
        grappleOpeningIn: 72 + variantIndex * 4,
        archHeight: 84,
        winchCapacityLbs: 42000 + variantIndex * 1500,
        frameArticulation: true,
      };
    case 'Feller Bunchers':
      return {
        ...commonSpecs,
        headType: 'Disc Saw',
        headMake: 'Quadco',
        headModel: `FD${22 + variantIndex}`,
        maxFellingDiameterIn: 22 + variantIndex,
        sawDiameterIn: 58,
        accumulating: variantIndex % 2 === 0,
      };
    case 'Forwarders':
      return {
        ...commonSpecs,
        loadCapacityLbs: 26000 + variantIndex * 2500,
        maxBoomReachFt: 28 + variantIndex,
        bunkWidthIn: 110,
        bunkHeightIn: 62,
        axleCount: variantIndex % 2 === 0 ? 4 : 3,
        grappleOpeningIn: 62,
        boomMake: 'CF Crane',
      };
    case 'Log Loaders':
      return {
        ...commonSpecs,
        loaderType: 'Knuckleboom',
        carrierType: 'Trailer Mount',
        maxLiftCapacityLbs: 10500 + variantIndex * 500,
        swingDegrees: 360,
        reachFt: 29 + variantIndex,
      };
    case 'Firewood Processors':
      return {
        ...commonSpecs,
        engineType: 'Kubota Diesel',
        maxLogDiameterIn: 18 + variantIndex,
        maxLogLengthIn: 24,
        minLogLengthIn: 10,
        splittingForceTons: 22 + variantIndex,
        wedgePattern: variantIndex % 2 === 0 ? '4-Way' : '6-Way',
        cycleTimeSec: 6 + variantIndex,
        sawBladeSizeIn: 24,
        conveyorLengthFt: 12 + variantIndex,
        infeedType: 'Hydraulic Deck',
        conveyorType: 'Folding Discharge',
        selfPropelled: false,
        bulkBagSystem: variantIndex === 2,
        productionRateCordsPerHr: 2 + variantIndex,
      };
    default:
      return commonSpecs;
  }
}

export interface CategoryInventoryMetric {
  category: string;
  activeCount: number;
  previousWeekCount: number;
  weeklyChangePercent: number;
  averagePrice: number | null;
}

export type AdminListingsCursor = string | null;

export interface AdminListingsPage {
  listings: Listing[];
  nextCursor: AdminListingsCursor;
  hasMore: boolean;
}

export interface ListingReviewSummary {
  listingId: string;
  status: string;
  summary: string;
  anomalyCodes: string[];
  anomalyCount: number;
  shadowState: ListingLifecycleStateSnapshot | null;
  rawState?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

export interface HomeMarketplaceData {
  featuredListings: Listing[];
  recentSoldListings: Listing[];
  categoryMetrics: CategoryInventoryMetric[];
  topLevelCategoryMetrics: CategoryInventoryMetric[];
  heroStats: {
    totalActive: number;
    totalMarketValue: number;
  };
  asOf?: string;
}

const toMillis = (value: unknown): number | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : undefined;
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : undefined;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { seconds?: number; nanoseconds?: number };
    if (typeof maybeTimestamp.seconds === 'number') {
      const nanos = typeof maybeTimestamp.nanoseconds === 'number' ? maybeTimestamp.nanoseconds : 0;
      return maybeTimestamp.seconds * 1000 + Math.floor(nanos / 1e6);
    }
  }
  return undefined;
};

const stripHtml = (value: unknown): string =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isPublicBlogPost = (post: Record<string, unknown> | null | undefined) => {
  const status = String(post?.status || '').trim().toLowerCase();
  const reviewStatus = String(post?.reviewStatus || '').trim().toLowerCase();
  return status === 'published' || reviewStatus === 'published';
};

const mapBlogPostToNewsPost = (postId: string, post: Record<string, unknown>): NewsPost => {
  const dateMs = toMillis(post.updatedAt) || toMillis(post.createdAt) || Date.now();
  return {
    id: `blog-${postId}`,
    title: String(post.title || 'Untitled'),
    summary: String(post.excerpt || '').trim() || stripHtml(post.content).slice(0, 220),
    content: String(post.content || ''),
    author: String(post.authorName || 'Forestry Equipment Sales Editorial'),
    date: new Date(dateMs).toISOString(),
    image: String(post.image || '').trim() || '/Forestry_Equipment_Sales_Logo.png?v=20260327c',
    category: String(post.category || 'Industry News'),
    seoTitle: String(post.seoTitle || '').trim(),
    seoDescription: String(post.seoDescription || '').trim(),
    seoKeywords: Array.isArray(post.seoKeywords) ? post.seoKeywords.filter((keyword): keyword is string => typeof keyword === 'string') : [],
    seoSlug: String(post.seoSlug || '').trim(),
  };
};

const normalizeLegacyNewsPost = (postId: string, post: Record<string, unknown>): NewsPost => {
  const dateMs = toMillis(post.date) || toMillis(post.updatedAt) || toMillis(post.createdAt) || Date.now();
  return {
    id: postId,
    title: String(post.title || 'Untitled'),
    summary: String(post.summary || '').trim() || stripHtml(post.content).slice(0, 220),
    content: String(post.content || ''),
    author: String(post.author || 'Forestry Equipment Sales Editorial'),
    date: new Date(dateMs).toISOString(),
    image: String(post.image || '').trim() || '/Forestry_Equipment_Sales_Logo.png?v=20260327c',
    category: String(post.category || 'Industry News'),
    seoTitle: String(post.seoTitle || '').trim(),
    seoDescription: String(post.seoDescription || '').trim(),
    seoKeywords: Array.isArray(post.seoKeywords) ? post.seoKeywords.filter((keyword): keyword is string => typeof keyword === 'string') : [],
    seoSlug: String(post.seoSlug || '').trim(),
  };
};

const wasActiveAt = (listing: Listing, snapshotMs: number): boolean => {
  const createdMs = toMillis(listing.createdAt);
  if (createdMs === undefined || createdMs > snapshotMs) return false;

  const status = normalize(listing.status || 'active');
  if (!['sold', 'archived', 'expired'].includes(status)) return true;

  const soldAtMs = toMillis(listing.updatedAt);
  if (soldAtMs === undefined) return false;

  return soldAtMs > snapshotMs;
};

function validateListingQuality(listing: Partial<Listing>): string[] {
  const errors: string[] = [];

  if (!listing.category) errors.push('Category is required.');
  if (!listing.subcategory) errors.push('Subcategory is required.');
  if (!listing.title) errors.push('Listing title is required.');
  if (!String(listing.make || listing.manufacturer || '').trim()) errors.push('Manufacturer is required.');
  if (!listing.model) errors.push('Model is required.');
  if (!listing.year) errors.push('Year is required.');
  if (listing.hours === undefined || listing.hours === null || !Number.isFinite(Number(listing.hours)) || Number(listing.hours) < 0) {
    errors.push('Operating hours are required.');
  }
  if (!listing.condition) errors.push('Condition is required.');
  if (listing.price === undefined || listing.price === null || !Number.isFinite(Number(listing.price)) || Number(listing.price) < 0) {
    errors.push('Price is required.');
  }
  if (!listing.location) errors.push('Location is required.');

  const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
  if (imageCount < 5) errors.push('Minimum 5 images are required.');
  if (imageCount > 40) errors.push('Maximum 40 images are allowed.');

  if (listing.videoUrls && !listing.videoUrls.every((url) => /^https?:\/\//i.test(url))) {
    errors.push('All video URLs must be valid http/https links.');
  }

  const checklist = listing.conditionChecklist;
  if (checklist) {
    const hydraulicsLeakStatus = checklist.hydraulicsLeakStatus;
    if (hydraulicsLeakStatus && !['yes', 'no'].includes(hydraulicsLeakStatus)) {
      errors.push('Hydraulics leak status must be set to yes or no when provided.');
    }
  }

  return errors;
}

const LISTING_QUALITY_FIELDS = new Set<keyof Listing>([
  'category',
  'subcategory',
  'title',
  'make',
  'manufacturer',
  'model',
  'year',
  'hours',
  'condition',
  'price',
  'location',
  'images',
  'imageVariants',
  'videoUrls',
  'conditionChecklist',
]);

function shouldValidateListingQualityOnUpdate(updates: Partial<Listing>): boolean {
  return Object.keys(updates).some((key) => LISTING_QUALITY_FIELDS.has(key as keyof Listing));
}

function normalizeListingImages(listing: Listing): Listing {
  const variants = Array.isArray(listing.imageVariants) ? listing.imageVariants : [];
  const hasImages = Array.isArray(listing.images) && listing.images.length > 0;
  const normalizedImages = hasImages
    ? listing.images
    : variants.map((v) => v.detailUrl).filter(Boolean);
  const rawTitles = Array.isArray(listing.imageTitles) ? listing.imageTitles : [];
  const imageTitles = normalizedImages.map((_, index) => String(rawTitles[index] || '').trim()).slice(0, normalizedImages.length);

  return {
    ...listing,
    images: normalizedImages,
    imageTitles,
  };
}

function isAdminPublisherRole(role?: string | null): boolean {
  return ['super_admin', 'admin', 'developer'].includes(normalize(role));
}

function isVerifiedSellerRole(role?: string | null): boolean {
  return ['super_admin', 'admin', 'developer', 'dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff'].includes(normalize(role));
}

function getFeaturedListingCapForRole(role?: string | null): number {
  const normalizedRole = normalize(role);
  if (isAdminPublisherRole(normalizedRole)) return Number.POSITIVE_INFINITY;
  return FEATURED_LISTING_CAPS[normalizedRole] || 0;
}

function canReadAllFinancingRequests(role?: string | null): boolean {
  return ['super_admin', 'admin', 'developer', 'content_manager', 'editor'].includes(normalize(role));
}

function canReadAllCalls(role?: string | null): boolean {
  return ['super_admin', 'admin', 'developer'].includes(normalize(role));
}

async function resolveAuthSellerAccessSnapshot(): Promise<{ role: string; ownerUid: string; email: string }> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    return { role: '', ownerUid: '', email: '' };
  }

  let role = '';
  let ownerUid = firebaseUser.uid;
  const email = normalize(firebaseUser.email);

  try {
    const tokenResult = await firebaseUser.getIdTokenResult();
    role = normalize(String(tokenResult.claims.role || ''));
    ownerUid = String(tokenResult.claims.parentAccountUid || firebaseUser.uid || '').trim() || firebaseUser.uid;
  } catch (error) {
    console.error('Unable to resolve auth seller access snapshot:', error);
  }

  if (!role && isPrivilegedAdminEmail(email)) {
    role = 'super_admin';
  }

  return {
    role,
    ownerUid,
    email,
  };
}

function isDemoListing(listing: Listing): boolean {
  const id = normalize(listing.id);
  const seller = normalize(listing.sellerUid || listing.sellerId);
  return id.startsWith('demo-') || id.startsWith('catalog-') || seller.includes('demo');
}

async function getSellerFeatureContext(sellerUid?: string | null): Promise<{ ownerUid: string; role: string; featuredCap: number }> {
  const normalizedSellerUid = String(sellerUid || '').trim();
  if (!normalizedSellerUid) {
    return { ownerUid: '', role: '', featuredCap: 0 };
  }

  const authSnapshot = auth.currentUser?.uid === normalizedSellerUid
    ? await resolveAuthSellerAccessSnapshot()
    : { role: '', ownerUid: normalizedSellerUid, email: '' };

  let ownerUid = String(authSnapshot.ownerUid || normalizedSellerUid).trim() || normalizedSellerUid;
  let role = normalize(authSnapshot.role);

  try {
    const sellerSnapshot = await getDoc(doc(db, 'users', normalizedSellerUid));
    const sellerData = sellerSnapshot.exists() ? (sellerSnapshot.data() as Record<string, unknown>) : {};
    ownerUid = String(sellerData.parentAccountUid || ownerUid || normalizedSellerUid).trim() || normalizedSellerUid;
    const ownerSnapshot = ownerUid && ownerUid !== normalizedSellerUid ? await getDoc(doc(db, 'users', ownerUid)) : sellerSnapshot;
    const ownerData = ownerSnapshot.exists() ? (ownerSnapshot.data() as Record<string, unknown>) : sellerData;
    role = normalize(String(ownerData.role || sellerData.role || role || ''));
  } catch (error) {
    console.warn('Falling back to auth claims for seller feature context:', error);
  }

  return {
    ownerUid,
    role,
    featuredCap: getFeaturedListingCapForRole(role),
  };
}

async function ensureFeaturedListingCapacity(params: { sellerUid?: string | null; listingId?: string; nextFeatured?: boolean }): Promise<{ ownerUid: string; role: string; featuredCap: number }> {
  const nextFeatured = !!params.nextFeatured;
  const context = await getSellerFeatureContext(params.sellerUid);

  if (!nextFeatured || !context.ownerUid || !Number.isFinite(context.featuredCap)) {
    return context;
  }

  if (context.featuredCap < 1) {
    throw new Error('This account role cannot mark listings as featured.');
  }

  const snapshot = await getDocs(query(collection(db, 'listings'), where('sellerUid', '==', context.ownerUid), where('featured', '==', true)));
  const activeFeaturedCount = snapshot.docs.filter((docSnapshot) => {
    if (params.listingId && docSnapshot.id === params.listingId) return false;
    const data = docSnapshot.data() as Partial<Listing>;
    return normalize(String(data.status || 'active')) !== 'sold';
  }).length;

  if (activeFeaturedCount >= context.featuredCap) {
    throw new Error(`This account can feature up to ${context.featuredCap} active ${context.featuredCap === 1 ? 'listing' : 'listings'}. Unfeature one before selecting another.`);
  }

  return context;
}

function buildCatalogDemoListing(
  topLevelCategory: string,
  subcategory: string,
  manufacturer: string,
  categoryIndex: number,
  subcategoryIndex: number,
  manufacturerIndex: number,
  sellerUid: string
): Listing {
  const titleManufacturer = formatManufacturerName(manufacturer);
  const year = 2017 + ((categoryIndex + subcategoryIndex + manufacturerIndex) % 8);
  const modelBase = subcategory.replace(/[^A-Za-z0-9]+/g, '').slice(0, 6).toUpperCase() || 'MODEL';
  const model = `${modelBase}-${manufacturerIndex + 1}`;
  const id = `catalog-${slugify(topLevelCategory)}-${slugify(subcategory)}-${slugify(manufacturer)}`;
  const seedBase = `${slugify(topLevelCategory)}-${slugify(subcategory)}-${slugify(manufacturer)}`;
  const price = (DEMO_CATEGORY_BASE_PRICES[topLevelCategory] || 50000) + subcategoryIndex * 2800 + manufacturerIndex * 1150;
  const hours = 325 + categoryIndex * 140 + subcategoryIndex * 28 + manufacturerIndex * 17;
  const locationPool = DEMO_CATEGORY_LOCATIONS[topLevelCategory] || ['Minnesota, USA'];
  const location = locationPool[(subcategoryIndex + manufacturerIndex) % locationPool.length];
  const condition = manufacturerIndex % 3 === 0 ? 'Used' : manufacturerIndex % 3 === 1 ? 'Rebuilt' : 'New';
  const specs = buildDemoSpecs(subcategory, (manufacturerIndex % 3) + 1);
  const now = new Date().toISOString();

  return normalizeListingImages({
    id,
    sellerUid,
    sellerId: sellerUid,
    title: `${year} ${titleManufacturer} ${subcategory}`,
    category: topLevelCategory,
    subcategory,
    make: titleManufacturer,
    manufacturer: titleManufacturer,
    model,
    year,
    price,
    currency: 'USD',
    hours,
    condition,
    description: `${year} ${titleManufacturer} ${subcategory} catalog listing generated from the Forestry Equipment Sales equipment taxonomy for full category coverage and workflow validation.`,
    images: Array.from({ length: 8 }).map((_, imageIndex) => `https://picsum.photos/seed/${seedBase}-${imageIndex}/1400/900`),
    imageVariants: Array.from({ length: 8 }).map((_, imageIndex) => ({
      detailUrl: `https://picsum.photos/seed/${seedBase}-detail-${imageIndex}/1600/1000`,
      thumbnailUrl: `https://picsum.photos/seed/${seedBase}-thumb-${imageIndex}/480/320`,
      format: 'image/jpeg' as const,
    })),
    videoUrls: [],
    location,
    stockNumber: `${slugify(subcategory).slice(0, 3).toUpperCase()}-${categoryIndex + 1}${subcategoryIndex + 1}${manufacturerIndex + 1}`,
    serialNumber: `${slugify(topLevelCategory).slice(0, 3).toUpperCase()}-${manufacturerIndex + 100}`,
    features: ['Taxonomy Coverage', 'Detail Layout Validation', 'Synthetic Product Data'],
    status: 'active',
    approvalStatus: 'approved',
    approvedBy: sellerUid,
    marketValueEstimate: null,
    featured: manufacturerIndex === 0,
    views: 12 + manufacturerIndex * 3,
    leads: manufacturerIndex % 4,
    createdAt: now,
    updatedAt: now,
    conditionChecklist: {
      engineChecked: true,
      undercarriageChecked: true,
      hydraulicsLeakStatus: 'no',
      serviceRecordsAvailable: true,
      partsManualAvailable: true,
      serviceManualAvailable: true,
    },
    sellerVerified: true,
    qualityValidated: true,
    specs,
  });
}

function buildCatalogDemoInventory(sellerUid: string): Listing[] {
  const listings: Listing[] = [];

  Object.entries(EQUIPMENT_TAXONOMY).forEach(([topLevelCategory, subcategories], categoryIndex) => {
    Object.entries(subcategories).forEach(([subcategory, manufacturers], subcategoryIndex) => {
      manufacturers.forEach((manufacturer, manufacturerIndex) => {
        listings.push(
          buildCatalogDemoListing(
            topLevelCategory,
            subcategory,
            manufacturer,
            categoryIndex,
            subcategoryIndex,
            manufacturerIndex,
            sellerUid
          )
        );
      });
    });
  });

  return listings;
}
async function resolveSuperAdminSellerUid(): Promise<string | undefined> {
  const usersRef = collection(db, 'users');
  const emailQuery = query(usersRef, where('email', '==', SUPERADMIN_EMAIL), limit(1));
  const snapshot = await getDocs(emailQuery);
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  return undefined;
}

function calculateInquirySpamSignal(input: {
  buyerEmail: string;
  buyerPhone: string;
  message: string;
}): { spamScore: number; spamFlags: string[] } {
  const email = normalize(input.buyerEmail);
  const phone = normalize(input.buyerPhone);
  const message = normalize(input.message);
  const flags: string[] = [];
  let score = 0;

  if (!email.includes('@') || email.endsWith('@example.com') || email.endsWith('@test.com')) {
    flags.push('suspicious_email');
    score += 25;
  }

  if (phone.replace(/\D/g, '').length < 10) {
    flags.push('invalid_phone');
    score += 20;
  }

  if (message.length < 15) {
    flags.push('very_short_message');
    score += 20;
  }

  const spamPhrases = ['whatsapp', 'telegram', 'crypto', 'western union', 'urgent transfer', 'wire now'];
  const matchedSpamPhrases = spamPhrases.filter((phrase) => message.includes(phrase));
  if (matchedSpamPhrases.length > 0) {
    flags.push('spam_keywords');
    score += Math.min(40, matchedSpamPhrases.length * 15);
  }

  return {
    spamScore: Math.max(0, Math.min(100, score)),
    spamFlags: flags,
  };
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function getApiRequestUrls(input: RequestInfo | URL): string[] {
  const rawInput = typeof input === 'string' ? input : input instanceof URL ? input.toString() : String(input);
  if (typeof window === 'undefined' || !rawInput.startsWith('/api/')) {
    return [rawInput];
  }

  const urls = [rawInput];
  const hostname = window.location.hostname.trim().toLowerCase();
  if (hostname === 'www.forestryequipmentsales.com') {
    urls.push(`https://www.forestryequipmentsales.com${rawInput}`);
  }

  return Array.from(new Set(urls));
}

async function fetchApiWithFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urls = getApiRequestUrls(input);
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    try {
      const response = await fetch(url, init);
      if (response.ok || index === urls.length - 1 || response.status !== 404) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (index === urls.length - 1) {
        throw error;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error('Equipment API request failed');
}

async function getAuthorizedJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  const currentUser = await waitForAuthenticatedUser();
  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetchApiWithFallback(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawBody = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const fallbackMessage = rawBody.trim() || `Equipment request failed (${response.status}).`;
    throw new Error(String(payload?.error || fallbackMessage));
  }

  return payload as T;
}

async function waitForAuthenticatedUser(timeoutMs = 4000): Promise<FirebaseAuthUser | null> {
  if (auth.currentUser) return auth.currentUser;

  return await new Promise((resolve) => {
    let settled = false;
    const timeoutHandle = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (settled || !nextUser) return;
      settled = true;
      window.clearTimeout(timeoutHandle);
      unsubscribe();
      resolve(nextUser);
    }, () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutHandle);
      unsubscribe();
      resolve(auth.currentUser);
    });
  });
}

async function getPublicJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetchApiWithFallback(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawBody = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const fallbackMessage = rawBody.trim() || `Public equipment request failed (${response.status}).`;
    throw new Error(String(payload?.error || fallbackMessage));
  }

  return payload as T;
}

const PUBLIC_LISTINGS_CACHE_KEY = 'te-public-listings-cache-v1';
const HOME_MARKETPLACE_CACHE_KEY = 'te-home-marketplace-cache-v1';
const PUBLIC_NEWS_CACHE_KEY = 'te-public-news-cache-v1';
const PRIVATE_ACCOUNT_CACHE_PREFIX = 'te-account-cache-v1';

type BrowserCacheEnvelope<T> = {
  savedAt: string;
  data: T;
};

function readBrowserCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as BrowserCacheEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'data' in (parsed as BrowserCacheEnvelope<T>)) {
      return ((parsed as BrowserCacheEnvelope<T>).data ?? null) as T | null;
    }

    return parsed as T;
  } catch (error) {
    console.warn(`Unable to read browser cache for ${key}:`, error);
    return null;
  }
}

function writeBrowserCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const envelope: BrowserCacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.warn(`Unable to write browser cache for ${key}:`, error);
  }
}

function getPrivateBrowserCacheKey(scope: string): string {
  const uid = auth.currentUser?.uid || 'anonymous';
  return `${PRIVATE_ACCOUNT_CACHE_PREFIX}:${uid}:${scope}`;
}

function readPrivateBrowserCache<T>(scope: string): T | null {
  return readBrowserCache<T>(getPrivateBrowserCacheKey(scope));
}

function writePrivateBrowserCache<T>(scope: string, data: T): void {
  writeBrowserCache(getPrivateBrowserCacheKey(scope), data);
}

function clearPrivateBrowserCacheScope(scope: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(getPrivateBrowserCacheKey(scope));
  } catch (error) {
    console.warn(`Unable to clear private browser cache for ${scope}:`, error);
  }
}

function clearPrivateBrowserCachePrefix(scopePrefix: string): void {
  if (typeof window === 'undefined') return;

  try {
    const keyPrefix = getPrivateBrowserCacheKey(scopePrefix);
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(keyPrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn(`Unable to clear private browser cache prefix for ${scopePrefix}:`, error);
  }
}

type QuotaLimitedAccountPayload = {
  firestoreQuotaLimited?: boolean;
  source?: string;
  warning?: string;
};

function isQuotaLimitedAccountPayload(payload: unknown): payload is QuotaLimitedAccountPayload {
  return Boolean(payload)
    && typeof payload === 'object'
    && Boolean((payload as QuotaLimitedAccountPayload).firestoreQuotaLimited);
}

function autoAddTaxonomyEntry(listing: Partial<Listing>): void {
  const category = normalize(listing.category);
  const subcategory = normalize(listing.subcategory);
  const manufacturer = normalize((listing as any).make || (listing as any).manufacturer || '');
  const model = normalize(listing.model);

  if (category && subcategory && manufacturer) {
    taxonomyService.ensureTaxonomyEntry(category, subcategory, manufacturer, model).catch((error) => {
      console.warn('Auto-add taxonomy entry failed (non-blocking):', error);
    });
  }
}

function invalidateListingRelatedCaches(listingId?: string): void {
  clearPrivateBrowserCachePrefix('account-listings:');
  clearPrivateBrowserCachePrefix('listing-lifecycle-audit:');
  clearPrivateBrowserCachePrefix('admin-listing-review-summary:');
  clearPrivateBrowserCachePrefix('seller-listings:');

  if (listingId) {
    clearPrivateBrowserCacheScope(`listing-lifecycle-audit:${listingId}`);
    clearPrivateBrowserCacheScope(`admin-listing-review-summary:${listingId}`);
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(PUBLIC_LISTINGS_CACHE_KEY);
      window.localStorage.removeItem(HOME_MARKETPLACE_CACHE_KEY);
    } catch (error) {
      console.warn('Unable to clear public marketplace caches after listing mutation:', error);
    }
  }
}

function getCachedPublicListingsSnapshot(): Listing[] {
  const cached = readBrowserCache<Listing[]>(PUBLIC_LISTINGS_CACHE_KEY);
  return Array.isArray(cached) ? cached.map((listing) => normalizeListingImages(listing as Listing)) : [];
}

function normalizeHomeMarketplacePayload(payload?: Partial<HomeMarketplaceData> | null): HomeMarketplaceData {
  return {
    featuredListings: Array.isArray(payload?.featuredListings)
      ? payload.featuredListings.map((listing) => normalizeListingImages(listing as Listing))
      : [],
    recentSoldListings: Array.isArray(payload?.recentSoldListings)
      ? payload.recentSoldListings.map((listing) => normalizeListingImages(listing as Listing))
      : [],
    categoryMetrics: Array.isArray(payload?.categoryMetrics) ? payload.categoryMetrics : [],
    topLevelCategoryMetrics: Array.isArray(payload?.topLevelCategoryMetrics) ? payload.topLevelCategoryMetrics : [],
    heroStats: payload?.heroStats || { totalActive: 0, totalMarketValue: 0 },
    asOf: payload?.asOf,
  };
}

function getCachedHomeMarketplaceSnapshot(): HomeMarketplaceData | null {
  const cached = readBrowserCache<Partial<HomeMarketplaceData>>(HOME_MARKETPLACE_CACHE_KEY);
  if (!cached) return null;
  return normalizeHomeMarketplacePayload(cached);
}

function isCacheablePublicListingsRequest(filters?: ListingFilters): boolean {
  if (!filters) return true;

  return !Object.entries(filters).some(([key, value]) => {
    if (value === undefined || value === null || value === '') return false;
    return !['sortBy', 'inStockOnly'].includes(key);
  });
}

function buildListingFilterSearchParams(filters?: ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  return params;
}

export const equipmentService = {
  getCachedPublicListings(): Listing[] {
    return getCachedPublicListingsSnapshot();
  },

  getCachedHomeMarketplaceData(): HomeMarketplaceData | null {
    return getCachedHomeMarketplaceSnapshot();
  },

  async getListings(filters?: ListingFilters): Promise<Listing[]> {
    const path = 'listings';
    try {
      const includeUnapproved = !!filters?.includeUnapproved;
      const normalizedCurrentUid = normalize(auth.currentUser?.uid || '');
      const requestedSellerUid = normalize(String(filters?.sellerUid || ''));
      const isOwnSellerInventory = !includeUnapproved && !!normalizedCurrentUid && requestedSellerUid === normalizedCurrentUid;

      let listings: Listing[] = [];

      if (isOwnSellerInventory) {
        const params = buildListingFilterSearchParams(filters);
        const queryString = params.toString();
        const payload = await getAuthorizedJson<{ listings?: Listing[] }>(`/api/account/listings${queryString ? `?${queryString}` : ''}`);
        listings = Array.isArray(payload.listings) ? payload.listings.map((listing) => normalizeListingImages(listing as Listing)) : [];
      } else if (!includeUnapproved) {
        const params = buildListingFilterSearchParams(filters);
        const queryString = params.toString();
        try {
          const payload = await getPublicJson<{ listings?: Listing[] }>(`/api/public/listings${queryString ? `?${queryString}` : ''}`);
          listings = Array.isArray(payload.listings) ? payload.listings.map((listing) => normalizeListingImages(listing as Listing)) : [];

          if (isCacheablePublicListingsRequest(filters) && listings.length > 0) {
            writeBrowserCache(PUBLIC_LISTINGS_CACHE_KEY, listings);
          }
        } catch (publicError) {
          const cachedListings = getCachedPublicListingsSnapshot();
          if (cachedListings.length > 0) {
            console.warn('Using cached public listings snapshot because live listings are unavailable:', publicError);
            listings = cachedListings;
          } else {
            throw publicError;
          }
        }
      } else {
        const q = query(collection(db, path));
        const querySnapshot = await getDocs(q);
        listings = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Listing))
          .map((listing) => normalizeListingImages(listing));
      }

      const toNumber = (value: unknown): number | undefined => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim().length > 0) {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
      };

      const relevanceScore = (listing: Listing, keyword: string): number => {
        const queryStr = keyword.toLowerCase();
        const title = normalize(listing.title);
        const make = normalize(listing.make || listing.manufacturer || listing.brand);
        const model = normalize(listing.model);
        const description = normalize(listing.description);
        const stockNumber = normalize(listing.stockNumber);
        const serialNumber = normalize(listing.serialNumber);

        let score = 0;
        if (title.includes(queryStr)) score += 15;
        if (make.includes(queryStr)) score += 20;
        if (model.includes(queryStr)) score += 25;
        if (description.includes(queryStr)) score += 5;
        if (stockNumber.includes(queryStr)) score += 30;
        if (serialNumber.includes(queryStr)) score += 30;
        if (`${make} ${model}`.includes(queryStr)) score += 10;
        if (title.startsWith(queryStr) || model.startsWith(queryStr)) score += 8;

        return score;
      };

      const extractCoords = (listing: Listing): { lat?: number; lng?: number } => {
        const lat = toNumber(listing.latitude ?? listing.specs?.latitude ?? listing.specs?.lat);
        const lng = toNumber(listing.longitude ?? listing.specs?.longitude ?? listing.specs?.lng ?? listing.specs?.lon);
        return { lat, lng };
      };

      const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
      const distanceMiles = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
        const earthRadiusMiles = 3958.8;
        const dLat = toRadians(bLat - aLat);
        const dLng = toRadians(bLng - aLng);
        const aa =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
        return earthRadiusMiles * c;
      };

      const locationCenterLat = toNumber(filters?.locationCenterLat);
      const locationCenterLng = toNumber(filters?.locationCenterLng);
      const locationRadius = toNumber(filters?.locationRadius);

      if (filters) {
        if (filters.q) {
          const searchStr = filters.q.toLowerCase();
          listings = listings.filter(l => 
            l.title.toLowerCase().includes(searchStr) || 
            normalize(l.make).includes(searchStr) ||
            normalize(l.manufacturer).includes(searchStr) ||
            normalize(l.model).includes(searchStr) ||
            normalize(l.description).includes(searchStr) ||
            normalize(l.stockNumber).includes(searchStr) ||
            normalize(l.serialNumber).includes(searchStr)
          );
        }
        if (filters.inStockOnly !== false) listings = listings.filter(l => (l.status || 'active') !== 'sold');
        if (filters.featured) listings = listings.filter(l => !!l.featured);
        if (filters.category) listings = listings.filter(l => normalize(l.category) === normalize(filters.category));
        if (filters.subcategory) listings = listings.filter(l => normalize(l.subcategory) === normalize(filters.subcategory));
        if (filters.manufacturer) {
          const manufacturerStr = normalize(filters.manufacturer);
          listings = listings.filter(l => {
            const make = normalize(l.make || l.manufacturer || l.brand);
            return make.includes(manufacturerStr);
          });
        }
        if (filters.model) {
          const modelStr = normalize(filters.model);
          listings = listings.filter(l => normalize(l.model).includes(modelStr));
        }

        if (filters.state) {
          const stateFilter = normalize(filters.state);
          listings = listings.filter(l => {
            const parts = normalize(l.location).split(',').map((part) => part.trim()).filter(Boolean);
            const state = parts.length > 1 ? parts[parts.length - 2] : '';
            return state.includes(stateFilter);
          });
        }

        if (filters.country) {
          const countryFilter = normalize(filters.country);
          listings = listings.filter(l => {
            const parts = normalize(l.location).split(',').map((part) => part.trim()).filter(Boolean);
            const country = parts.length > 0 ? parts[parts.length - 1] : '';
            return country.includes(countryFilter);
          });
        }

        if (filters.sellerUid) {
          const sellerUid = normalize(filters.sellerUid as string);
          listings = listings.filter(l => normalize(l.sellerUid || l.sellerId) === sellerUid);
        }

        const minPrice = toNumber(filters.minPrice);
        if (minPrice !== undefined) listings = listings.filter(l => l.price >= minPrice);

        const maxPrice = toNumber(filters.maxPrice);
        if (maxPrice !== undefined) listings = listings.filter(l => l.price <= maxPrice);

        const minYear = toNumber(filters.minYear);
        if (minYear !== undefined) listings = listings.filter(l => l.year >= minYear);

        const maxYear = toNumber(filters.maxYear);
        if (maxYear !== undefined) listings = listings.filter(l => l.year <= maxYear);

        const minHours = toNumber(filters.minHours);
        if (minHours !== undefined) listings = listings.filter(l => l.hours >= minHours);

        const maxHours = toNumber(filters.maxHours);
        if (maxHours !== undefined) listings = listings.filter(l => l.hours <= maxHours);

        if (filters.condition) {
          listings = listings.filter(l => normalize(l.condition) === normalize(filters.condition));
        }

        if (filters.location) {
          const locationFilter = normalize(filters.location);
          listings = listings.filter(l => normalize(l.location).includes(locationFilter));
        }

        if (locationRadius !== undefined && locationRadius > 0 && locationCenterLat !== undefined && locationCenterLng !== undefined) {
          listings = listings.filter(l => {
            const { lat, lng } = extractCoords(l);
            if (lat === undefined || lng === undefined) return false;
            return distanceMiles(locationCenterLat, locationCenterLng, lat, lng) <= locationRadius;
          });
        }

        if (filters.attachment) {
          const attachmentFilter = normalize(filters.attachment);
          listings = listings.filter(l =>
            (l.specs?.attachments || []).some((attachment: string) => normalize(attachment).includes(attachmentFilter))
          );
        }

        if (filters.feature) {
          const featureFilter = normalize(filters.feature);
          const featureMatches = (listing: Listing) => {
            const topLevelFeatures = Array.isArray(listing.features) ? listing.features : [];
            const specFeatures = Array.isArray(listing.specs?.features) ? listing.specs.features : [];
            return [...topLevelFeatures, ...specFeatures].some((feature) => normalize(feature).includes(featureFilter));
          };
          listings = listings.filter(featureMatches);
        }

        if (filters.stockNumber) {
          const stockFilter = normalize(filters.stockNumber);
          listings = listings.filter(l => normalize(l.stockNumber).includes(stockFilter));
        }

        if (filters.serialNumber) {
          const serialFilter = normalize(filters.serialNumber);
          listings = listings.filter(l => normalize(l.serialNumber).includes(serialFilter));
        }

        const sortBy = filters.sortBy || 'newest';
        const sortWithFeaturedPriority = (compare: (a: Listing, b: Listing) => number, prioritizeFeatured = true) => {
          const sorted = [...listings].sort((a, b) => {
            if (prioritizeFeatured) {
              const featuredDelta = Number(!!b.featured) - Number(!!a.featured);
              if (featuredDelta !== 0) return featuredDelta;
            }
            return compare(a, b);
          });
          listings = sorted;
        };

        if (sortBy === 'price_asc') {
          sortWithFeaturedPriority((a, b) => a.price - b.price);
        } else if (sortBy === 'price_desc') {
          sortWithFeaturedPriority((a, b) => b.price - a.price);
        } else if (sortBy === 'popular') {
          sortWithFeaturedPriority((a, b) => (b.views + b.leads * 3) - (a.views + a.leads * 3));
        } else if (sortBy === 'relevance' && filters.q) {
          sortWithFeaturedPriority((a, b) => relevanceScore(b, filters.q as string) - relevanceScore(a, filters.q as string));
        } else {
          sortWithFeaturedPriority((a, b) => {
            const aTime = new Date(a.createdAt as string).getTime() || 0;
            const bTime = new Date(b.createdAt as string).getTime() || 0;
            return bTime - aTime;
          });
        }
      }

      return listings;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getMyListings(filters?: ListingFilters): Promise<Listing[]> {
    const params = buildListingFilterSearchParams(filters);
    const queryString = params.toString();
    const cacheScope = `account-listings:${queryString || 'all'}`;
    try {
      const payload = await getAuthorizedJson<{ listings?: Listing[] } & QuotaLimitedAccountPayload>(`/api/account/listings${queryString ? `?${queryString}` : ''}`);
      const listings = Array.isArray(payload.listings) ? payload.listings.map((listing) => normalizeListingImages(listing as Listing)) : [];
      if (isQuotaLimitedAccountPayload(payload)) {
        const cached = readPrivateBrowserCache<Listing[]>(cacheScope);
        if (Array.isArray(cached)) {
          console.warn(payload.warning || 'Using cached account listings because the live request is quota-limited.');
          return cached.map((listing) => normalizeListingImages(listing as Listing));
        }
        console.warn(payload.warning || 'Live account listings are temporarily unavailable.');
        return listings;
      }
      writePrivateBrowserCache(cacheScope, listings);
      return listings;
    } catch (error) {
      const cached = readPrivateBrowserCache<Listing[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn('Using cached account listings because the live request is unavailable:', error);
        return cached.map((listing) => normalizeListingImages(listing as Listing));
      }
      handleFirestoreError(error, OperationType.LIST, 'account/listings');
      return [];
    }
  },

  async getMyStorefront(): Promise<Seller | undefined> {
    const cacheScope = 'account-storefront';
    try {
      const payload = await getAuthorizedJson<{ seller?: Seller | null } & QuotaLimitedAccountPayload>('/api/account/storefront');
      const resolvedSeller = payload.seller;
      if (isQuotaLimitedAccountPayload(payload)) {
        const cached = readPrivateBrowserCache<Seller | null>(cacheScope);
        if (cached) {
          console.warn(payload.warning || 'Using cached account storefront because the live request is quota-limited.');
          return cached;
        }
        if (payload.seller) {
          console.warn(payload.warning || 'Using reduced storefront fallback because the live request is quota-limited.');
          return payload.seller;
        }
        return undefined;
      }
      writePrivateBrowserCache(cacheScope, resolvedSeller || null);
      return resolvedSeller || undefined;
    } catch (error) {
      const cached = readPrivateBrowserCache<Seller | null>(cacheScope);
      if (cached) {
        console.warn('Using cached account storefront because the live request is unavailable:', error);
        return cached;
      }
      handleFirestoreError(error, OperationType.GET, 'account/storefront');
      return undefined;
    }
  },

  async getMyInquiries(): Promise<Inquiry[]> {
    const path = 'account/inquiries';
    const cacheScope = 'account-inquiries:mine';
    try {
      const payload = await getAuthorizedJson<{ inquiries?: Inquiry[] } & QuotaLimitedAccountPayload>('/api/account/inquiries');
      const inquiries = Array.isArray(payload.inquiries) ? payload.inquiries : [];
      if (isQuotaLimitedAccountPayload(payload)) {
        const cached = readPrivateBrowserCache<Inquiry[]>(cacheScope);
        if (Array.isArray(cached)) {
          console.warn(payload.warning || 'Using cached account inquiries because the live request is quota-limited.');
          return cached;
        }
        console.warn(payload.warning || 'Live account inquiries are temporarily unavailable.');
        return inquiries;
      }
      writePrivateBrowserCache(cacheScope, inquiries);
      return inquiries;
    } catch (error) {
      const cached = readPrivateBrowserCache<Inquiry[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn('Using cached account inquiries because the live request is unavailable:', error);
        return cached;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getHomeMarketplaceData(): Promise<HomeMarketplaceData> {
    try {
      const payload = await getPublicJson<HomeMarketplaceData>('/api/public/home-data');
      const normalized = normalizeHomeMarketplacePayload(payload);
      const hasMeaningfulData =
        normalized.featuredListings.length > 0 ||
        normalized.recentSoldListings.length > 0 ||
        normalized.categoryMetrics.length > 0 ||
        normalized.topLevelCategoryMetrics.length > 0 ||
        normalized.heroStats.totalActive > 0;

      if (hasMeaningfulData) {
        writeBrowserCache(HOME_MARKETPLACE_CACHE_KEY, normalized);
      }

      return normalized;
    } catch (error) {
      const cachedSnapshot = getCachedHomeMarketplaceSnapshot();
      if (cachedSnapshot) {
        console.warn('Using cached home marketplace snapshot because live home data is unavailable:', error);
        return cachedSnapshot;
      }
      throw error;
    }
  },

  async getAdminListingsPage(options?: {
    pageSize?: number;
    cursor?: AdminListingsCursor;
    includeDemoListings?: boolean;
  }): Promise<AdminListingsPage> {
    const path = 'admin/listings';
    const pageSize = Math.max(1, Math.min(options?.pageSize ?? 50, 100));

    try {
      const params = new URLSearchParams({
        pageSize: String(pageSize),
        includeDemoListings: options?.includeDemoListings ? 'true' : 'false',
      });
      if (options?.cursor) {
        params.set('cursor', options.cursor);
      }

      const payload = await getAuthorizedJson<{
        listings?: Listing[];
        nextCursor?: string | null;
        hasMore?: boolean;
      }>(`/api/admin/listings?${params.toString()}`);

      return {
        listings: Array.isArray(payload.listings)
          ? payload.listings.map((listing) => normalizeListingImages(listing as Listing))
          : [],
        nextCursor: payload.nextCursor || null,
        hasMore: Boolean(payload.hasMore),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return {
        listings: [],
        nextCursor: null,
        hasMore: false,
      };
    }
  },

  async getListingsByIds(ids: string[]): Promise<Listing[]> {
    if (!ids || ids.length === 0) return [];
    try {
      const params = new URLSearchParams({ ids: ids.join(',') });
      const payload = await getPublicJson<{ listings?: Listing[] }>(`/api/public/listings/by-id?${params.toString()}`);
      return Array.isArray(payload.listings) ? payload.listings.map((listing) => normalizeListingImages(listing as Listing)) : [];
    } catch (error) {
      const cachedListings = getCachedPublicListingsSnapshot().filter((listing) => ids.includes(listing.id));
      if (cachedListings.length > 0) {
        console.warn('Using cached listings-by-id fallback because the live request is unavailable:', error);
        return cachedListings;
      }
      handleFirestoreError(error, OperationType.LIST, 'public/listings/by-id');
      return [];
    }
  },

  async getSellerListingUsage(sellerUid: string): Promise<number> {
    const path = 'listings';
    const normalizedSellerUid = String(sellerUid || '').trim();
    if (!normalizedSellerUid) return 0;
    if (!auth.currentUser) return 0;

    try {
      const snapshot = await getDocs(query(collection(db, path), where('sellerUid', '==', normalizedSellerUid)));
      return snapshot.docs.filter((docSnapshot) => {
        const data = docSnapshot.data() as Partial<Listing>;
        const status = normalize(String(data.status || 'active'));
        return status === 'active';
      }).length;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return 0;
    }
  },

  async getSellerFeaturedListingUsage(sellerUid: string): Promise<number> {
    const context = await getSellerFeatureContext(sellerUid);
    if (!context.ownerUid) return 0;

    try {
      const snapshot = await getDocs(query(collection(db, 'listings'), where('sellerUid', '==', context.ownerUid), where('featured', '==', true)));
      return snapshot.docs.filter((docSnapshot) => {
        const data = docSnapshot.data() as Partial<Listing>;
        return normalize(String(data.status || 'active')) !== 'sold';
      }).length;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'listings');
      return 0;
    }
  },

  async getSellerListings(sellerUid: string, options?: { includeSold?: boolean }): Promise<Listing[]> {
    const normalizedSellerUid = String(sellerUid || '').trim();
    if (!normalizedSellerUid) return [];

    const path = 'listings';
    try {
      if (auth.currentUser) {
        const params = new URLSearchParams({
          sellerUid: normalizedSellerUid,
          includeUnapproved: 'true',
        });
        if (options?.includeSold) {
          params.set('inStockOnly', 'false');
        }

        const payload = await getAuthorizedJson<{ listings?: Listing[] }>(`/api/account/listings?${params.toString()}`);
        return Array.isArray(payload.listings)
          ? payload.listings.map((listing) => normalizeListingImages(listing as Listing))
          : [];
      }

      const [sellerUidSnapshot, sellerIdSnapshot] = await Promise.all([
        getDocs(query(collection(db, path), where('sellerUid', '==', normalizedSellerUid))),
        getDocs(query(collection(db, path), where('sellerId', '==', normalizedSellerUid))),
      ]);

      const seen = new Set<string>();
      const merged = [...sellerUidSnapshot.docs, ...sellerIdSnapshot.docs]
        .filter((docSnapshot) => {
          if (seen.has(docSnapshot.id)) return false;
          seen.add(docSnapshot.id);
          return true;
        })
        .map((docSnapshot) => normalizeListingImages({ id: docSnapshot.id, ...docSnapshot.data() } as Listing));

      const includeSold = !!options?.includeSold;
      return merged
        .filter((listing) => includeSold || normalize(String(listing.status || 'active')) !== 'sold')
        .sort((a, b) => {
          const featuredDelta = Number(!!b.featured) - Number(!!a.featured);
          if (featuredDelta !== 0) return featuredDelta;
          const aTime = new Date(a.createdAt as string).getTime() || 0;
          const bTime = new Date(b.createdAt as string).getTime() || 0;
          return bTime - aTime;
        });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getListing(id: string): Promise<Listing | undefined> {
    const path = `listings/${id}`;
    try {
      const cachedPublicListing = getCachedPublicListingsSnapshot().find((listing) => listing.id === id);
      if (cachedPublicListing) {
        return cachedPublicListing;
      }

      const [publicListing] = await this.getListingsByIds([id]);
      if (publicListing) {
        return publicListing;
      }

      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return normalizeListingImages({ id: docSnap.id, ...docSnap.data() } as Listing);
      }
    } catch (error) {
      console.warn('Unable to load listing directly from Firestore:', error, { path });
    }

    return undefined;
  },

  async recordListingView(listingId: string): Promise<boolean> {
    const normalizedListingId = String(listingId || '').trim();
    if (!normalizedListingId) return false;

    try {
      const payload = await getPublicJson<{ recorded?: boolean; warning?: string }>(
        `/api/public/listings/${encodeURIComponent(normalizedListingId)}/view`,
        { method: 'POST' }
      );
      if (payload?.warning) {
        console.warn(payload.warning);
      }
      return Boolean(payload?.recorded);
    } catch (error) {
      console.warn('Unable to record listing view:', error);
      return false;
    }
  },

  async addListing(
    listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'approvalStatus' | 'approvedBy'> & { id?: string }
  ): Promise<string> {
    const path = 'listings';
    try {
      const qualityErrors = validateListingQuality(listing);
      if (qualityErrors.length > 0) {
        throw new Error(`Listing quality validation failed: ${qualityErrors.join(' ')}`);
      }

      const featureContext = await ensureFeaturedListingCapacity({
        sellerUid: listing.sellerUid || auth.currentUser?.uid,
        nextFeatured: listing.featured,
      });
      const sellerScopeUid = featureContext.ownerUid || String(listing.sellerUid || auth.currentUser?.uid || '').trim();

      const authSnapshot = await resolveAuthSellerAccessSnapshot();
      let sellerVerified = false;
      let sellerRole = normalize(featureContext.role || authSnapshot.role);
      let sellerEmail = normalize(auth.currentUser?.email || authSnapshot.email || '');
      if (sellerScopeUid) {
        try {
          const sellerDoc = await getDoc(doc(db, 'users', sellerScopeUid));
          if (sellerDoc.exists()) {
            const sellerData = sellerDoc.data() as any;
            sellerRole = normalize(sellerData.role || sellerRole);
            sellerEmail = normalize(sellerData.email || sellerEmail);
          }
        } catch (error) {
          console.warn('Falling back to auth claims for seller listing metadata:', error);
        }
      }

      sellerVerified = isVerifiedSellerRole(sellerRole);

      if (sellerEmail === SUPERADMIN_EMAIL) {
        sellerRole = 'super_admin';
      }

      const nextApprovalStatus: Listing['approvalStatus'] = 'pending';
      const nextStatus: Listing['status'] = 'pending';
      const requestedPaymentStatus = normalize(String(listing.paymentStatus || 'pending'));
      const nextPaymentStatus: Listing['paymentStatus'] = requestedPaymentStatus === 'paid' ? 'paid' : 'pending';

      if (auth.currentUser) {
        const payload = await getAuthorizedJson<{ listing?: Listing }>(`/api/account/listings`, {
          method: 'POST',
          body: JSON.stringify({
            listing: {
              ...listing,
              sellerUid: sellerScopeUid,
              sellerId: sellerScopeUid,
            },
          }),
        });

        const createdListingId = String(payload.listing?.id || '').trim();
        invalidateListingRelatedCaches(createdListingId);
        autoAddTaxonomyEntry(listing);
        return createdListingId;
      }

      const resolvedListingId = listing.id ? String(listing.id).trim() : await reserveNextSequentialListingId();
      const docRef = doc(db, path, resolvedListingId);
      await setDoc(docRef, {
        ...listing,
        id: docRef.id,
        sellerUid: sellerScopeUid,
        sellerId: sellerScopeUid,
        sellerVerified,
        qualityValidated: true,
        approvalStatus: nextApprovalStatus,
        approvedBy: null,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        publishedAt: null,
        approvedAt: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      invalidateListingRelatedCaches(docRef.id);
      autoAddTaxonomyEntry(listing);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateListing(id: string, updates: Partial<Listing>): Promise<void> {
    const path = `listings/${id}`;
    try {
      const existing = await this.getListing(id);
      const merged = {
        ...(existing || {}),
        ...updates
      } as Partial<Listing>;
      if (shouldValidateListingQualityOnUpdate(updates)) {
        const qualityErrors = validateListingQuality(merged);
        if (qualityErrors.length > 0) {
          throw new Error(`Listing quality validation failed: ${qualityErrors.join(' ')}`);
        }
      }

      const featureContext = await ensureFeaturedListingCapacity({
        sellerUid: merged.sellerUid || auth.currentUser?.uid,
        listingId: id,
        nextFeatured: merged.featured,
      });
      const sellerScopeUid = featureContext.ownerUid || String(merged.sellerUid || auth.currentUser?.uid || '').trim();

      if (auth.currentUser) {
        const requestUpdates: Partial<Listing> = {
          ...updates,
          ...(sellerScopeUid ? { sellerUid: sellerScopeUid, sellerId: sellerScopeUid } : {}),
        };
        await getAuthorizedJson(`/api/account/listings/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(requestUpdates),
        });
        invalidateListingRelatedCaches(id);
        return;
      }

      const docRef = doc(db, 'listings', id);
      await updateDoc(docRef, {
        ...updates,
        ...(sellerScopeUid ? { sellerUid: sellerScopeUid, sellerId: sellerScopeUid } : {}),
        qualityValidated: true,
        updatedAt: serverTimestamp()
      });
      invalidateListingRelatedCaches(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteListing(id: string): Promise<void> {
    const path = `listings/${id}`;
    try {
      if (auth.currentUser) {
        await getAuthorizedJson(`/api/account/listings/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        invalidateListingRelatedCaches(id);
        return;
      }

      await deleteDoc(doc(db, 'listings', id));
      invalidateListingRelatedCaches(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async transitionListingLifecycle(
    id: string,
    action: ListingLifecycleAction,
    options: { reason?: string; metadata?: Record<string, unknown> } = {}
  ): Promise<Partial<Listing> & { id: string }> {
    const payload = await getAuthorizedJson<{
      listing?: Partial<Listing> & { id: string };
    }>(`/api/listings/${encodeURIComponent(id)}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        reason: options.reason || '',
        metadata: options.metadata || {},
      }),
    });

    if (!payload.listing) {
      throw new Error('Lifecycle update response did not include listing data.');
    }

    invalidateListingRelatedCaches(id);
    return payload.listing;
  },

  async getListingLifecycleAudit(id: string): Promise<ListingLifecycleAuditView> {
    const cacheScope = `listing-lifecycle-audit:${id}`;
    try {
      const payload = await getAuthorizedJson<ListingLifecycleAuditView>(
        `/api/admin/listings/${encodeURIComponent(id)}/lifecycle-audit`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const normalized = {
        listingId: payload.listingId || id,
        listing: payload.listing,
        report: payload.report || null,
        mediaAudit: payload.mediaAudit || null,
        transitions: Array.isArray(payload.transitions) ? payload.transitions : [],
      };
      writePrivateBrowserCache(cacheScope, normalized);
      return normalized;
    } catch (error) {
      const cached = readPrivateBrowserCache<ListingLifecycleAuditView>(cacheScope);
      if (cached) {
        console.warn('Using cached listing lifecycle audit because the live request is unavailable:', error);
        return cached;
      }
      throw error;
    }
  },

  async getAdminListingReviewSummaries(ids: string[]): Promise<ListingReviewSummary[]> {
    const normalizedIds = Array.from(
      new Set(
        ids
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      )
    ).slice(0, 50);

    if (normalizedIds.length === 0) {
      return [];
    }

    const params = new URLSearchParams({
      ids: normalizedIds.join(','),
    });

    try {
      const payload = await getAuthorizedJson<{ summaries?: ListingReviewSummary[] }>(
        `/api/admin/listings/review-summaries?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const summaries = Array.isArray(payload.summaries) ? payload.summaries : [];
      summaries.forEach((summary) => {
        const listingId = String(summary?.listingId || '').trim();
        if (listingId) {
          writePrivateBrowserCache(`admin-listing-review-summary:${listingId}`, summary);
        }
      });
      return summaries;
    } catch (error) {
      const cached = normalizedIds
        .map((listingId) => readPrivateBrowserCache<ListingReviewSummary>(`admin-listing-review-summary:${listingId}`))
        .filter((summary): summary is ListingReviewSummary => Boolean(summary));

      if (cached.length > 0) {
        console.warn('Using cached admin listing review summaries because the live request is unavailable:', error);
        return cached;
      }

      throw error;
    }
  },

  subscribeToInquiries(callback: (inquiries: Inquiry[]) => void): () => void {
    const path = 'inquiries';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inquiries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry));
      callback(inquiries);
    }, (error) => {
      console.error('Inquiries snapshot error:', error);
    });
    return unsubscribe;
  },

  async getInquiries(sellerUid?: string): Promise<Inquiry[]> {
    const path = sellerUid ? 'account/inquiries' : 'admin/inquiries';
    const normalizedSellerUid = String(sellerUid || '').trim();
    const cacheScope = normalizedSellerUid ? `account-inquiries:seller:${normalizedSellerUid}` : 'admin-inquiries';
    try {
      if (normalizedSellerUid) {
        const params = new URLSearchParams({ sellerUid: normalizedSellerUid });
        const payload = await getAuthorizedJson<{ inquiries?: Inquiry[] } & QuotaLimitedAccountPayload>(`/api/account/inquiries?${params.toString()}`);
        const inquiries = Array.isArray(payload.inquiries) ? payload.inquiries : [];
        if (isQuotaLimitedAccountPayload(payload)) {
          const cached = readPrivateBrowserCache<Inquiry[]>(cacheScope);
          if (Array.isArray(cached)) {
            console.warn(payload.warning || 'Using cached seller inquiries because the live request is quota-limited.');
            return cached;
          }
          console.warn(payload.warning || 'Live seller inquiries are temporarily unavailable.');
          return inquiries;
        }
        writePrivateBrowserCache(cacheScope, inquiries);
        return inquiries;
      }

      const payload = await getAuthorizedJson<{ inquiries?: Inquiry[] }>('/api/admin/inquiries');
      const inquiries = Array.isArray(payload.inquiries) ? payload.inquiries : [];
      writePrivateBrowserCache(cacheScope, inquiries);
      return inquiries;
    } catch (error) {
      const cached = readPrivateBrowserCache<Inquiry[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn('Using cached inquiries because the live request is unavailable:', error);
        return cached;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getAccounts(): Promise<Account[]> {
    const path = 'users';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.displayName || data.name || 'Unknown User',
          email: data.email || '',
          phone: data.phoneNumber || '',
          company: data.company || '',
          role: data.role || 'buyer',
          status: data.accountStatus === 'suspended' ? 'Suspended' : data.accountStatus === 'pending' ? 'Pending' : 'Active',
          lastLogin: data.lastLogin || data.updatedAt || data.createdAt || '',
          memberSince: data.createdAt || '',
          totalListings: data.totalListings || 0,
          totalLeads: data.totalLeads || 0,
          parentAccountUid: data.parentAccountUid
        } as Account;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getMyCalls(): Promise<CallLog[]> {
    const path = 'account/calls';
    const cacheScope = 'account-calls:mine';
    try {
      const payload = await getAuthorizedJson<{ calls?: CallLog[] } & QuotaLimitedAccountPayload>('/api/account/calls');
      const calls = Array.isArray(payload.calls) ? payload.calls : [];
      if (isQuotaLimitedAccountPayload(payload)) {
        const cached = readPrivateBrowserCache<CallLog[]>(cacheScope);
        if (Array.isArray(cached)) {
          console.warn(payload.warning || 'Using cached account calls because the live request is quota-limited.');
          return cached;
        }
        console.warn(payload.warning || 'Live account calls are temporarily unavailable.');
        return calls;
      }
      writePrivateBrowserCache(cacheScope, calls);
      return calls;
    } catch (error) {
      const cached = readPrivateBrowserCache<CallLog[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn('Using cached account calls because the live request is unavailable:', error);
        return cached;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getCalls(sellerUidOrOptions?: string | { sellerUid?: string; role?: string }): Promise<CallLog[]> {
    const sellerUid = typeof sellerUidOrOptions === 'string' ? sellerUidOrOptions : sellerUidOrOptions?.sellerUid;
    const path = sellerUid ? 'account/calls' : 'admin/calls';
    const normalizedSellerUid = String(sellerUid || '').trim();
    const cacheScope = normalizedSellerUid ? `account-calls:seller:${normalizedSellerUid}` : 'admin-calls';
    try {
      if (normalizedSellerUid) {
        const params = new URLSearchParams({ sellerUid: normalizedSellerUid });
        const payload = await getAuthorizedJson<{ calls?: CallLog[] } & QuotaLimitedAccountPayload>(`/api/account/calls?${params.toString()}`);
        const calls = Array.isArray(payload.calls) ? payload.calls : [];
        if (isQuotaLimitedAccountPayload(payload)) {
          const cached = readPrivateBrowserCache<CallLog[]>(cacheScope);
          if (Array.isArray(cached)) {
            console.warn(payload.warning || 'Using cached seller calls because the live request is quota-limited.');
            return cached;
          }
          console.warn(payload.warning || 'Live seller calls are temporarily unavailable.');
          return calls;
        }
        writePrivateBrowserCache(cacheScope, calls);
        return calls;
      }

      const payload = await getAuthorizedJson<{ calls?: CallLog[] }>('/api/admin/calls');
      const calls = Array.isArray(payload.calls) ? payload.calls : [];
      writePrivateBrowserCache(cacheScope, calls);
      return calls;
    } catch (error) {
      const cached = readPrivateBrowserCache<CallLog[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn('Using cached calls because the live request is unavailable:', error);
        return cached;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async createCallLog(payload: Omit<CallLog, 'id' | 'createdAt'>): Promise<string> {
    const path = 'calls';
    try {
      const docRef = doc(collection(db, path));
      await setDoc(docRef, {
        ...payload,
        id: docRef.id,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateInquiryStatus(id: string, status: Inquiry['status']): Promise<void> {
    const path = `inquiries/${id}`;
    try {
      const docRef = doc(db, 'inquiries', id);
      const existingSnapshot = await getDoc(docRef);
      const existing = existingSnapshot.exists() ? (existingSnapshot.data() as Inquiry) : undefined;

      const nextUpdate: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp()
      };

      const existingFirstResponseAt = existing?.firstResponseAt;
      const respondedStatuses: Inquiry['status'][] = ['Contacted', 'Qualified', 'Won', 'Lost', 'Closed'];
      if (!existingFirstResponseAt && respondedStatuses.includes(status)) {
        const nowMs = Date.now();
        nextUpdate.firstResponseAt = new Date(nowMs).toISOString();
      }

      await updateDoc(docRef, nextUpdate);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async assignInquiry(id: string, assignedToUid: string, assignedToName?: string): Promise<void> {
    const path = `inquiries/${id}`;
    try {
      const docRef = doc(db, 'inquiries', id);
      await updateDoc(docRef, {
        assignedToUid: assignedToUid || null,
        assignedToName: assignedToName || null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async addInquiryInternalNote(
    id: string,
    note: { text: string; authorUid?: string; authorName?: string }
  ): Promise<void> {
    const path = `inquiries/${id}`;
    try {
      const text = (note.text || '').trim();
      if (!text) return;

      const docRef = doc(db, 'inquiries', id);
      await updateDoc(docRef, {
        internalNotes: arrayUnion({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text,
          authorUid: note.authorUid || '',
          authorName: note.authorName || 'Admin',
          createdAt: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getInquiryHistoryByListing(listingId: string): Promise<Inquiry[]> {
    const path = 'inquiries';
    try {
      const querySnapshot = await getDocs(query(collection(db, path), where('listingId', '==', listingId)));
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Inquiry))
        .sort((a, b) => (toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getSeller(id: string): Promise<Seller | undefined> {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) {
      return undefined;
    }

    if (auth.currentUser?.uid && auth.currentUser.uid === normalizedId) {
      const accountStorefront = await this.getMyStorefront();
      if (accountStorefront) {
        return accountStorefront;
      }
    }

    try {
      const payload = await getPublicJson<{ seller?: Seller | null }>(`/api/public/sellers/${encodeURIComponent(normalizedId)}`);
      if (payload?.seller) {
        return payload.seller;
      }
    } catch (error) {
      console.warn('Public seller API unavailable, falling back to Firestore lookup:', error);
    }

    const storefrontPath = `storefronts/${normalizedId}`;
    const fallbackPath = `users/${normalizedId}`;

    try {
      let storefrontSnap = await getDoc(doc(db, 'storefronts', normalizedId));

      if (!storefrontSnap.exists()) {
        const storefrontSlugSnapshot = await getDocs(query(collection(db, 'storefronts'), where('storefrontSlug', '==', normalizedId), limit(1)));
        if (!storefrontSlugSnapshot.empty) {
          storefrontSnap = storefrontSlugSnapshot.docs[0];
        }
      }

      if (storefrontSnap.exists()) {
        const data = storefrontSnap.data() || {};
        const rawRole = String(data.role || '').toLowerCase();
        const isDealerRole = ['dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff', 'admin', 'super_admin', 'developer'].includes(rawRole);

        return {
          id: storefrontSnap.id,
          uid: storefrontSnap.id,
          name: String(data.storefrontName || data.displayName || 'Forestry Equipment Sales Seller'),
          type: isDealerRole ? 'Dealer' : 'Private',
          role: (data.role || 'buyer') as any,
          storefrontSlug: String(data.storefrontSlug || ''),
          location: String(data.location || 'Unknown'),
          phone: String(data.phone || ''),
          email: String(data.email || ''),
          website: String(data.website || ''),
          logo: String(data.logo || ''),
          coverPhotoUrl: String(data.coverPhotoUrl || ''),
          storefrontName: String(data.storefrontName || ''),
          storefrontTagline: String(data.storefrontTagline || ''),
          storefrontDescription: String(data.storefrontDescription || ''),
          seoTitle: String(data.seoTitle || ''),
          seoDescription: String(data.seoDescription || ''),
          seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((keyword: unknown) => typeof keyword === 'string') : [],
          rating: 5.0,
          totalListings: 0,
          memberSince: data.createdAt || new Date().toISOString(),
          verified: Boolean(data.storefrontEnabled),
          manuallyVerified: Boolean(data.manuallyVerified),
          twilioPhoneNumber: String(data.twilioPhoneNumber || ''),
        } as Seller;
      }

      const userRef = doc(db, 'users', normalizedId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() || {};
        const rawRole = String(data.role || '').toLowerCase();
        const isDealerRole = ['dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff', 'admin', 'super_admin', 'developer'].includes(rawRole);

        return {
          id: userSnap.id,
          uid: userSnap.id,
          name: data.displayName || data.name || 'Forestry Equipment Sales Seller',
          type: isDealerRole ? 'Dealer' : 'Private',
          role: (data.role || 'buyer') as any,
          storefrontSlug: data.storefrontSlug || '',
          location: data.location || 'Unknown',
          phone: data.phoneNumber || '',
          email: data.email || '',
          website: data.website || '',
          logo: data.photoURL || data.profileImage,
          coverPhotoUrl: data.coverPhotoUrl || '',
          storefrontName: data.storefrontName || data.displayName || '',
          storefrontTagline: data.storefrontTagline || '',
          storefrontDescription: data.storefrontDescription || data.about || '',
          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
          seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((keyword: unknown) => typeof keyword === 'string') : [],
          rating: 5.0,
          totalListings: 0,
          memberSince: data.createdAt || new Date().toISOString(),
          verified: true,
          manuallyVerified: Boolean(data.manuallyVerified),
          twilioPhoneNumber: String(data.twilioPhoneNumber || ''),
        } as Seller;
      }
      return undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${storefrontPath} | ${fallbackPath}`);
      return undefined;
    }
  },

  async getPublicDealerDirectory(): Promise<Seller[]> {
    try {
      const payload = await getPublicJson<{ dealers?: Seller[] }>('/api/public/dealers');
      return Array.isArray(payload.dealers) ? payload.dealers : [];
    } catch (error) {
      console.warn('Public dealer directory unavailable:', error);
      return [];
    }
  },

  async getAuctions(): Promise<Auction[]> {
    const path = 'auctions';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Auction));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getNews(): Promise<NewsPost[]> {
    const path = 'news|blogPosts';
    try {
      try {
        const payload = await getPublicJson<{ posts?: NewsPost[] }>('/api/public/news');
        const posts = Array.isArray(payload.posts) ? payload.posts : [];
        if (posts.length > 0) {
          writeBrowserCache(PUBLIC_NEWS_CACHE_KEY, posts);
          return posts;
        }
      } catch (publicError) {
        console.warn('Public Equipment News API unavailable, falling back to browser cache / Firestore:', publicError);
      }

      const cachedNews = readBrowserCache<NewsPost[]>(PUBLIC_NEWS_CACHE_KEY);
      if (Array.isArray(cachedNews) && cachedNews.length > 0) {
        return cachedNews;
      }

      let legacyNews: NewsPost[] = [];
      try {
        const legacyNewsSnapshot = await getDocs(collection(db, 'news'));
        legacyNews = legacyNewsSnapshot.docs.map((docSnap) => normalizeLegacyNewsPost(docSnap.id, docSnap.data() as Record<string, unknown>));
      } catch (legacyError) {
        console.warn('Legacy news collection unavailable, continuing with CMS posts only.', legacyError);
      }

      let cmsPublishedNews: NewsPost[] = [];
      try {
        const cmsSnapshots = await Promise.all([
          getDocs(query(collection(db, 'blogPosts'), where('status', '==', 'published'))),
          getDocs(query(collection(db, 'blogPosts'), where('reviewStatus', '==', 'published'))),
        ]);

        const mergedPosts = new Map<string, NewsPost>();
        cmsSnapshots.forEach((snapshot) => {
          snapshot.docs.forEach((docSnap) => {
            const post = docSnap.data() as Record<string, unknown>;
            if (!isPublicBlogPost(post)) {
              return;
            }

            mergedPosts.set(docSnap.id, mapBlogPostToNewsPost(docSnap.id, post));
          });
        });

        cmsPublishedNews = Array.from(mergedPosts.values());
      } catch (cmsError) {
        console.warn('Published CMS posts unavailable for Equipment News feed.', cmsError);
      }

      const newsPosts = [...cmsPublishedNews, ...legacyNews].sort((a, b) => {
        const left = Date.parse(a.date || '') || 0;
        const right = Date.parse(b.date || '') || 0;
        return right - left;
      });
      if (newsPosts.length > 0) {
        writeBrowserCache(PUBLIC_NEWS_CACHE_KEY, newsPosts);
      }
      return newsPosts;
    } catch (error) {
      const cachedNews = readBrowserCache<NewsPost[]>(PUBLIC_NEWS_CACHE_KEY);
      if (Array.isArray(cachedNews) && cachedNews.length > 0) {
        console.warn('Using cached Equipment News feed because the live request is unavailable:', error);
        return cachedNews;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getNewsPost(id: string): Promise<NewsPost | null> {
    const path = `news|blogPosts/${id}`;
    try {
      const normalizedId = String(id || '').trim();
      if (!normalizedId) return null;

      try {
        const payload = await getPublicJson<{ post?: NewsPost | null }>(`/api/public/news/${encodeURIComponent(normalizedId)}`);
        if (payload.post) {
          const cachedFeed = readBrowserCache<NewsPost[]>(PUBLIC_NEWS_CACHE_KEY) || [];
          const mergedFeed = [payload.post, ...cachedFeed.filter((entry) => entry.id !== payload.post?.id)];
          writeBrowserCache(PUBLIC_NEWS_CACHE_KEY, mergedFeed);
          return payload.post;
        }
      } catch (publicError) {
        console.warn('Public Equipment News article API unavailable, falling back to cache / Firestore:', publicError);
      }

      const cachedFeed = readBrowserCache<NewsPost[]>(PUBLIC_NEWS_CACHE_KEY);
      const cachedPost = Array.isArray(cachedFeed) ? cachedFeed.find((entry) => entry.id === normalizedId) || null : null;
      if (cachedPost) {
        return cachedPost;
      }

      if (normalizedId.startsWith('blog-')) {
        const blogPostId = normalizedId.slice(5);
        const blogPostSnap = await getDoc(doc(db, 'blogPosts', blogPostId));
        if (!blogPostSnap.exists()) return null;

        const post = blogPostSnap.data() as Record<string, unknown>;
        if (!isPublicBlogPost(post)) return null;

        return mapBlogPostToNewsPost(blogPostId, post);
      }

      const legacyPostSnap = await getDoc(doc(db, 'news', normalizedId));
      if (!legacyPostSnap.exists()) return null;
      return normalizeLegacyNewsPost(legacyPostSnap.id, legacyPostSnap.data() as Record<string, unknown>);
    } catch (error) {
      const cachedFeed = readBrowserCache<NewsPost[]>(PUBLIC_NEWS_CACHE_KEY);
      const cachedPost = Array.isArray(cachedFeed) ? cachedFeed.find((entry) => entry.id === String(id || '').trim()) || null : null;
      if (cachedPost) {
        console.warn('Using cached Equipment News article because the live request is unavailable:', error);
        return cachedPost;
      }
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const path = 'inquiries';
    try {
      const docRef = doc(collection(db, path));
      const sellerUid = inquiry.sellerUid || inquiry.sellerId || '';
      const spamSignal = calculateInquirySpamSignal({
        buyerEmail: inquiry.buyerEmail,
        buyerPhone: inquiry.buyerPhone,
        message: inquiry.message,
      });

      await setDoc(docRef, {
        ...inquiry,
        sellerUid,
        sellerId: sellerUid,
        buyerUid: auth.currentUser?.uid || null,
        id: docRef.id,
        status: 'New',
        assignedToUid: null,
        assignedToName: null,
        internalNotes: [],
        firstResponseAt: null,
        spamScore: spamSignal.spamScore,
        spamFlags: spamSignal.spamFlags,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async getMarketValue(specs: MarketComparableSpecs): Promise<number | null> {
    const resolvedSpecs = resolveMarketComparableSpecs(specs);
    if (!resolvedSpecs) {
      return null;
    }

    const listings = await this.getListings({
      inStockOnly: false,
      manufacturer: specs.make || specs.manufacturer,
      model: specs.model,
    });
    const comparables = listings.filter((listing) => isMarketComparableListing(listing, resolvedSpecs));

    if (comparables.length < AMV_MIN_COMPARABLES) {
      return null;
    }

    const total = comparables.reduce((sum, listing) => sum + listing.price, 0);
    return Math.round(total / comparables.length);
  },

  async getMarketMatchRecommendations(specs: MarketComparableSpecs, limit = 3): Promise<Listing[]> {
    const resolvedSpecs = resolveMarketComparableSpecs(specs);
    if (!resolvedSpecs || limit <= 0) {
      return [];
    }

    const listings = await this.getListings({
      inStockOnly: true,
      manufacturer: specs.make || specs.manufacturer,
      model: specs.model,
    });

    return listings
      .filter((listing) => isMarketComparableListing(listing, resolvedSpecs))
      .sort((a, b) => scoreMarketComparableListing(a, resolvedSpecs) - scoreMarketComparableListing(b, resolvedSpecs))
      .slice(0, limit);
  },

  async getCategoryInventoryMetrics(): Promise<CategoryInventoryMetric[]> {
    const payload = await getPublicJson<{ metrics?: CategoryInventoryMetric[] }>('/api/public/category-metrics');
    return Array.isArray(payload.metrics) ? payload.metrics : [];
  },

  async submitFinancingRequest(payload: {
    listingId?: string;
    sellerUid?: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    company?: string;
    requestedAmount?: number;
    message?: string;
    contactConsentAccepted?: boolean;
    contactConsentVersion?: string;
    contactConsentScope?: string;
    contactConsentAt?: string;
  }): Promise<string> {
    const path = 'financingRequests';
    try {
      const docRef = doc(collection(db, path));
      await setDoc(docRef, {
        ...payload,
        buyerUid: auth.currentUser?.uid || null,
        status: 'New',
        id: docRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async getFinancingRequests(options?: string | { userUid?: string; role?: string }): Promise<FinancingRequest[]> {
    const userUid = typeof options === 'string' ? options : options?.userUid || auth.currentUser?.uid;
    const role = typeof options === 'string' ? '' : options?.role;
    if (!userUid) return [];
    const cacheScope = `account-financing-requests:${String(userUid || '').trim()}:${String(role || '').trim() || 'self'}`;

    try {
      const params = new URLSearchParams();
      if (userUid) params.set('userUid', userUid);
      if (role) params.set('role', role);
      const payload = await getAuthorizedJson<{ financingRequests?: FinancingRequest[] } & QuotaLimitedAccountPayload>(`/api/account/financing-requests?${params.toString()}`);
      const financingRequests = Array.isArray(payload.financingRequests) ? payload.financingRequests : [];
      if (isQuotaLimitedAccountPayload(payload)) {
        const cached = readPrivateBrowserCache<FinancingRequest[]>(cacheScope);
        if (Array.isArray(cached)) {
          console.warn(payload.warning || 'Using cached financing requests because the live request is quota-limited.');
          return cached;
        }
        console.warn(payload.warning || 'Live financing requests are temporarily unavailable.');
        return financingRequests;
      }
      writePrivateBrowserCache(cacheScope, financingRequests);
      return financingRequests;
    } catch (error) {
      const cached = readPrivateBrowserCache<FinancingRequest[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn('Using cached financing requests because the live request is unavailable:', error);
        return cached;
      }
      handleFirestoreError(error, OperationType.LIST, 'account/financing-requests');
      return [];
    }
  },

  async seedDemoInventory(options?: { sellerUid?: string }): Promise<void> {
    const path = 'listings';
    try {
      const superAdminUid = await resolveSuperAdminSellerUid();
      const sellerUid = options?.sellerUid || superAdminUid || auth.currentUser?.uid || 'demo-seller';
      const demoListings: Listing[] = [];
      const now = new Date().toISOString();

      Object.entries(EQUIPMENT_TAXONOMY).forEach(([topLevelCategory, subcategories], categoryIndex) => {
        Object.entries(subcategories).forEach(([subcategory, manufacturers], subcategoryIndex) => {
          const baseManufacturer = manufacturers[0] || 'FORESTRY EQUIPMENT SALES';
          const baseYear = 2021 + ((categoryIndex + subcategoryIndex) % 3);
          const baseHours = 900 + categoryIndex * 140 + subcategoryIndex * 40;
          for (let variant = 1; variant <= 3; variant++) {
            const manufacturer = baseManufacturer;
            const titleManufacturer = formatManufacturerName(manufacturer);
            const year = baseYear + (variant - 2);
            const model = `${subcategory.replace(/[^A-Za-z0-9]+/g, '').slice(0, 6).toUpperCase()}-${subcategoryIndex + 1}`;
            const id = `demo-${slugify(topLevelCategory)}-${slugify(subcategory)}-${variant}`;
            const seedBase = `${slugify(topLevelCategory)}-${slugify(subcategory)}-${variant}`;
            const price = (DEMO_CATEGORY_BASE_PRICES[topLevelCategory] || 50000) + subcategoryIndex * 3500 + variant * 6250;
            const hours = baseHours + (variant - 2) * 180;
            const locationPool = DEMO_CATEGORY_LOCATIONS[topLevelCategory] || ['Minnesota, USA'];
            const location = locationPool[(subcategoryIndex + variant - 1) % locationPool.length];
            const condition = variant === 1 ? 'Used' : variant === 2 ? 'Rebuilt' : 'New';
            const specs = buildDemoSpecs(subcategory, variant);

            demoListings.push({
              id,
              sellerUid,
              sellerId: sellerUid,
              title: `${year} ${titleManufacturer} ${subcategory} ${variant}`,
              category: topLevelCategory,
              subcategory,
              make: titleManufacturer,
              manufacturer: titleManufacturer,
              model,
              year,
              price,
              currency: 'USD',
              hours,
              condition,
              description: `${year} ${titleManufacturer} ${subcategory} demo listing built from the Forestry Equipment Sales taxonomy for browse, filter, and upload workflow validation.`,
              images: Array.from({ length: 10 }).map((_, imageIndex) => `https://picsum.photos/seed/${seedBase}-${imageIndex}/1200/800`),
              imageVariants: Array.from({ length: 10 }).map((_, imageIndex) => {
                const detailUrl = `https://picsum.photos/seed/${seedBase}-detail-${imageIndex}/1600/1000`;
                const thumbnailUrl = `https://picsum.photos/seed/${seedBase}-thumb-${imageIndex}/480/320`;
                return {
                  detailUrl,
                  thumbnailUrl,
                  format: 'image/jpeg' as const,
                };
              }),
              videoUrls: [],
              location,
              stockNumber: `${slugify(subcategory).slice(0, 3).toUpperCase()}-${categoryIndex + 1}${subcategoryIndex + 1}${variant}`,
              serialNumber: `${slugify(topLevelCategory).slice(0, 3).toUpperCase()}-${subcategoryIndex + 10}-${variant}`,
              features: ['Fresh Demo Inventory', 'Category Coverage', 'Search Validation'],
              status: 'active',
              approvalStatus: 'approved',
              approvedBy: sellerUid,
              marketValueEstimate: null,
              featured: subcategoryIndex === 0 && variant === 1,
              views: 25 + subcategoryIndex * 7 + variant * 12,
              leads: 1 + ((subcategoryIndex + variant) % 4),
              createdAt: now,
              updatedAt: now,
              conditionChecklist: {
                engineChecked: true,
                undercarriageChecked: true,
                hydraulicsLeakStatus: 'no',
                serviceRecordsAvailable: true,
                partsManualAvailable: true,
                serviceManualAvailable: true,
              },
              sellerVerified: true,
              qualityValidated: true,
              specs,
            });
          }
        });
      });

      const catalogCoverageListings = buildCatalogDemoInventory(sellerUid);
      for (const listing of catalogCoverageListings) {
        demoListings.push({
          ...listing,
          sellerUid,
          sellerId: sellerUid,
          approvedBy: sellerUid,
          createdAt: now,
          updatedAt: now,
        });
      }

      for (const listing of demoListings) {
        await setDoc(doc(db, path, listing.id), {
          ...listing,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
