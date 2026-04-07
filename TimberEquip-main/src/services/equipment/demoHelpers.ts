import { db } from '../../firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { Listing } from '../../types';
import { EQUIPMENT_TAXONOMY } from '../../constants/equipmentData';
import { SUPERADMIN_EMAIL } from '../../utils/privilegedAdmin';
import { slugify, formatManufacturerName, normalizeListingImages } from './listingHelpers';

// ── Demo constants ──────────────────────────────────────────────────────────

export const DEMO_CATEGORY_LOCATIONS: Record<string, string[]> = {
  'Logging Equipment': ['Wisconsin, USA', 'Georgia, USA', 'Ontario, Canada'],
  'Land Clearing Equipment': ['Texas, USA', 'South Carolina, USA', 'Alberta, Canada'],
  'Firewood Equipment': ['Maine, USA', 'Vermont, USA', 'Michigan, USA'],
  'Trucks': ['Minnesota, USA', 'Pennsylvania, USA', 'New York, USA'],
  'Trailers': ['Ohio, USA', 'Indiana, USA', 'Quebec, Canada'],
};

export const DEMO_CATEGORY_BASE_PRICES: Record<string, number> = {
  'Logging Equipment': 148000,
  'Land Clearing Equipment': 98000,
  'Firewood Equipment': 42000,
  'Trucks': 76000,
  'Trailers': 36000,
};

// ── Demo specs builder ──────────────────────────────────────────────────────

export function buildDemoSpecs(subcategory: string, variantIndex: number) {
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

// ── Catalog listing builder ─────────────────────────────────────────────────

export function buildCatalogDemoListing(
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

export function buildCatalogDemoInventory(sellerUid: string): Listing[] {
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

// ── Super admin resolution ──────────────────────────────────────────────────

export async function resolveSuperAdminSellerUid(): Promise<string | undefined> {
  const usersRef = collection(db, 'users');
  const emailQuery = query(usersRef, where('email', '==', SUPERADMIN_EMAIL), limit(1));
  const snapshot = await getDocs(emailQuery);
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  return undefined;
}
