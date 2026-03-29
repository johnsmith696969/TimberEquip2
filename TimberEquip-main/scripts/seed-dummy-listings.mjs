/**
 * seed-dummy-listings.mjs
 * Creates dummy machine listings under the calebhappy@gmail.com superadmin account.
 * Uses the firebase-tools OAuth token — no service account key needed.
 *
 * Usage:  node scripts/seed-dummy-listings.mjs
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// ── Config ────────────────────────────────────────────────────────────────────
const PROJECT_ID  = 'mobile-app-equipment-sales';
const DATABASE_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const TARGET_EMAIL = 'calebhappy@gmail.com';

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
const AUTH_BASE = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`;

// ── Read firebase-tools token ─────────────────────────────────────────────────
const ftConfig = JSON.parse(
  readFileSync(join(homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8')
);
const ACCESS_TOKEN = ftConfig.tokens?.access_token;
if (!ACCESS_TOKEN) throw new Error('No firebase-tools access token found. Run: npx firebase-tools login');

// ── Helper: Firestore REST value encoding ─────────────────────────────────────
function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean')        return { booleanValue: v };
  if (typeof v === 'number' && Number.isInteger(v)) return { integerValue: String(v) };
  if (typeof v === 'number')         return { doubleValue: v };
  if (typeof v === 'string')         return { stringValue: v };
  if (Array.isArray(v))              return { arrayValue: { values: v.map(encodeValue) } };
  if (v instanceof Date)             return { timestampValue: v.toISOString() };
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) fields[k] = encodeValue(val);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function encodeDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = encodeValue(v);
  return { fields };
}

async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return JSON.parse(text);
}

// ── 1. Look up UID from email ─────────────────────────────────────────────────
async function lookupUid(email) {
  const body = await authFetch(AUTH_BASE, {
    method: 'POST',
    body: JSON.stringify({ email: [email] }),
  });
  const user = body.users?.[0];
  if (!user) throw new Error(`User ${email} not found in Firebase Auth`);
  console.log(`✔ Found user: ${user.email}  uid=${user.localId}`);
  return user.localId;
}

// ── 2. Write a listing to Firestore ──────────────────────────────────────────
async function createListing(sellerUid, listing) {
  const url = `${FS_BASE}/listings?documentId=${listing.id}`;
  await authFetch(url, {
    method: 'POST',
    body: JSON.stringify(encodeDoc({ ...listing, sellerUid })),
  });
  console.log(`  ✔ Created: ${listing.id}  (${listing.title})`);
}

// ── 3. Listing data ───────────────────────────────────────────────────────────
function makeDummyListings(sellerUid) {
  const now = new Date().toISOString();
  return [
    {
      id: 'dummy-001',
      title: '2019 Tigercat 610E Skidder',
      category: 'Skidders',
      subcategory: 'Logging Equipment',
      make: 'TIGERCAT',
      model: '610E',
      year: 2019,
      price: 189000,
      currency: 'USD',
      hours: 4200,
      condition: 'Used',
      description: 'Well-maintained 2019 Tigercat 610E grapple skidder. Rotating grapple, 4WD, John Deere 6.8L engine. Recent service, tires at 70%.',
      images: ['https://placehold.co/800x600/2d4a22/ffffff?text=Tigercat+610E'],
      location: 'Northern Minnesota',
      stockNumber: 'TE-SK-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      views: 0,
      marketValueEstimate: 195000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', grappleChecked: true, tiresChecked: true },
      specs: { engine: 'John Deere 6.8L T4', horsepower: 173, weight: 35200, driveType: '4WD', grappleType: 'Rotating Grapple', grappleOpeningIn: 56, tireSize: '710/55R30' },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-002',
      title: '2021 John Deere 953MH Harvester',
      category: 'Harvesters',
      subcategory: 'Logging Equipment',
      make: 'JOHN DEERE',
      model: '953MH',
      year: 2021,
      price: 395000,
      currency: 'USD',
      hours: 2800,
      condition: 'Used',
      description: '2021 John Deere 953MH harvester with Waratah HTH623C head. Single-grip, 6-wheel drive. Excellent condition, full service history. Head recently serviced.',
      images: ['https://placehold.co/800x600/1a3a1a/ffffff?text=JD+953MH+Harvester'],
      location: 'British Columbia, Canada',
      stockNumber: 'TE-HV-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      views: 0,
      marketValueEstimate: 410000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', headChecked: true },
      specs: { engine: 'John Deere 6.8L T4', horsepower: 235, weight: 47000, headType: 'Single-Grip Harvesting Head', headMake: 'WARATAH', headModel: 'HTH623C', maxFellingDiameterIn: 26, driveType: '6WD' },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-003',
      title: '2018 Caterpillar 522B Feller Buncher',
      category: 'Feller Bunchers',
      subcategory: 'Logging Equipment',
      make: 'CATERPILLAR',
      model: '522B',
      year: 2018,
      price: 245000,
      currency: 'USD',
      hours: 6100,
      condition: 'Used',
      description: '2018 Caterpillar 522B track feller buncher. Disc saw head, accumulating arms. Tracks recently rebuilt. Ready to work.',
      images: ['https://placehold.co/800x600/3a2d10/ffffff?text=Cat+522B+Feller+Buncher'],
      location: 'Alabama',
      stockNumber: 'TE-FB-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      views: 0,
      marketValueEstimate: 255000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', headChecked: true },
      specs: { engine: 'Caterpillar C9.3 T4F', horsepower: 310, weight: 58500, headType: 'Disc Saw', accumulating: true, sawDiameterIn: 24, maxFellingDiameterIn: 22 },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-004',
      title: '2020 Komatsu 845YD Forwarder',
      category: 'Forwarders',
      subcategory: 'Logging Equipment',
      make: 'KOMATSU',
      model: '845YD',
      year: 2020,
      price: 298000,
      currency: 'USD',
      hours: 3500,
      condition: 'Used',
      description: '2020 Komatsu 845YD 8-wheel forwarder. 17-tonne load capacity. MaxiXT crane. Low hours for the year. Clean machine.',
      images: ['https://placehold.co/800x600/0d2b3e/ffffff?text=Komatsu+845YD+Forwarder'],
      location: 'Ontario, Canada',
      stockNumber: 'TE-FW-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      views: 0,
      marketValueEstimate: 315000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', bunkChecked: true },
      specs: { engine: 'Cummins QSB6.7 T4F', horsepower: 210, weight: 42500, loadCapacityLbs: 37480, axleCount: 8, boomMake: 'MaxiXT', maxBoomReachFt: 27 },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-005',
      title: '2017 Bandit 1890 Whole Tree Chipper',
      category: 'Chippers',
      subcategory: 'Logging Equipment',
      make: 'BANDIT',
      model: '1890',
      year: 2017,
      price: 118000,
      currency: 'USD',
      hours: 5800,
      condition: 'Used',
      description: 'Bandit 1890 track chipper, 18" capacity, Detroit Diesel engine. Infeed hydraulics work great. Drum recently inspected.',
      images: ['https://placehold.co/800x600/3d4e1a/ffffff?text=Bandit+1890+Chipper'],
      location: 'Oregon',
      stockNumber: 'TE-CH-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      views: 0,
      marketValueEstimate: 122000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no' },
      specs: { engine: 'Detroit Diesel', horsepower: 335, weight: 28000 },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-006',
      title: '2022 Tigercat 720G Skidder',
      category: 'Skidders',
      subcategory: 'Logging Equipment',
      make: 'TIGERCAT',
      model: '720G',
      year: 2022,
      price: 275000,
      currency: 'USD',
      hours: 1400,
      condition: 'Used',
      description: 'Like-new 2022 Tigercat 720G. Stroke boom grapple, 4WD. Extended warranty still active. Only 1,400 hours.',
      images: ['https://placehold.co/800x600/2d4a22/ffffff?text=Tigercat+720G'],
      location: 'Northern Ontario, Canada',
      stockNumber: 'TE-SK-002',
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      views: 0,
      marketValueEstimate: 285000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', grappleChecked: true, tiresChecked: true },
      specs: { engine: 'Tigercat FPT N67', horsepower: 188, weight: 38200, driveType: '4WD', grappleType: 'Stroke Boom Grapple', grappleOpeningIn: 60, tireSize: '710/55R30' },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-007',
      title: '2016 John Deere 437D Log Loader',
      category: 'Log Loaders',
      subcategory: 'Logging Equipment',
      make: 'JOHN DEERE',
      model: '437D',
      year: 2016,
      price: 165000,
      currency: 'USD',
      hours: 9200,
      condition: 'Used',
      description: 'John Deere 437D wheeled log loader. Prentice grapple, 40K lb lift capacity. Good working unit, priced to sell.',
      images: ['https://placehold.co/800x600/1e2a0e/ffffff?text=JD+437D+Log+Loader'],
      location: 'Mississippi',
      stockNumber: 'TE-LL-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      views: 0,
      marketValueEstimate: 172000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', boomChecked: true },
      specs: { engine: 'John Deere 4045T', horsepower: 125, weight: 39800, loaderType: 'Knuckle Boom', carrierType: 'Wheeled', maxLiftCapacityLbs: 40000, reachFt: 24 },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-008',
      title: '2019 Multitek 2040XP Firewood Processor',
      category: 'Firewood Processors',
      subcategory: 'Firewood Equipment',
      make: 'MULTITEK',
      model: '2040XP',
      year: 2019,
      price: 82000,
      currency: 'USD',
      hours: 2100,
      condition: 'Used',
      description: '2019 Multitek 2040XP self-propelled firewood processor. Auto-feed infeed, 20" saw, 40-ton splitter. Hydraulically folding conveyor.',
      images: ['https://placehold.co/800x600/4a2a0a/ffffff?text=Multitek+2040XP'],
      location: 'Wisconsin',
      stockNumber: 'TE-FP-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      views: 0,
      marketValueEstimate: 87000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', sawChecked: true, conveyorChecked: true, splitterChecked: true },
      specs: { engine: 'Honda GX690', horsepower: 22, selfPropelled: true, maxLogDiameterIn: 20, splittingForceTons: 40, sawBladeSizeIn: 20, conveyorLengthFt: 16, infeedType: 'Auto-Feed Roller' },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-009',
      title: '2020 John Deere 8320RT Dozer with Winch',
      category: 'Dozers With Winch',
      subcategory: 'Logging Equipment',
      make: 'JOHN DEERE',
      model: '8320RT',
      year: 2020,
      price: 212000,
      currency: 'USD',
      hours: 2900,
      condition: 'Used',
      description: '2020 John Deere 8320RT track tractor with Igland 8301 logging winch. Front dozer blade. 320hp. Well-maintained.',
      images: ['https://placehold.co/800x600/2a1e0e/ffffff?text=JD+8320RT+Winch+Dozer'],
      location: 'Washington State',
      stockNumber: 'TE-DW-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      views: 0,
      marketValueEstimate: 220000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no' },
      specs: { engine: 'John Deere PowerTech Plus 9.0L T4', horsepower: 320, weight: 36800, winchCapacityLbs: 35000 },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-010',
      title: '2021 Caterpillar 323 Excavator',
      category: 'Excavators',
      subcategory: 'Land Clearing Equipment',
      make: 'CATERPILLAR',
      model: '323',
      year: 2021,
      price: 178000,
      currency: 'USD',
      hours: 3100,
      condition: 'Used',
      description: '2021 Caterpillar 323 hydraulic excavator. 24" bucket, thumb attachment. 51,000 lb operating weight. Clean and ready to work.',
      images: ['https://placehold.co/800x600/1a0e0e/ffffff?text=Cat+323+Excavator'],
      location: 'Georgia',
      stockNumber: 'TE-EX-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      views: 0,
      marketValueEstimate: 185000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no' },
      specs: { engine: 'Caterpillar C7.1 T4F', horsepower: 176, weight: 51000, driveType: 'Track' },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-011',
      title: '2022 Fecon FTX148L Mulcher',
      category: 'Mulchers',
      subcategory: 'Land Clearing Equipment',
      make: 'FECON',
      model: 'FTX148L',
      year: 2022,
      price: 148000,
      currency: 'USD',
      hours: 1800,
      condition: 'Used',
      description: '2022 Fecon FTX148L forestry mulcher. Caterpillar C3.8 engine, 148hp. Forestry-grade undercarriage. Bull Hog BH80SS drum head. Low hours.',
      images: ['https://placehold.co/800x600/0d3020/ffffff?text=Fecon+FTX148L+Mulcher'],
      location: 'Texas',
      stockNumber: 'TE-MU-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      views: 0,
      marketValueEstimate: 155000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no' },
      specs: { engine: 'Caterpillar C3.8', horsepower: 148, weight: 18500, driveType: 'Track' },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dummy-012',
      title: '2015 John Deere 748H Bogie Skidder',
      category: 'Bogie Skidders',
      subcategory: 'Logging Equipment',
      make: 'JOHN DEERE',
      model: '748H',
      year: 2015,
      price: 98000,
      currency: 'USD',
      hours: 11400,
      condition: 'Used',
      description: 'John Deere 748H bogie skidder. Dual-tire tandem rear axle. Grapple, 4WD. High hours but well-maintained; engine recently overhauled.',
      images: ['https://placehold.co/800x600/1a2e10/ffffff?text=JD+748H+Bogie+Skidder'],
      location: 'Georgia',
      stockNumber: 'TE-BS-001',
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      views: 0,
      marketValueEstimate: 103000,
      conditionChecklist: { engineChecked: true, undercarriageChecked: true, hydraulicsLeakStatus: 'no', grappleChecked: true, tiresChecked: true },
      specs: { engine: 'John Deere 6.8L T3', horsepower: 185, weight: 41000, driveType: 'Bogie / Dual-Tire Tandem', grappleType: 'Fixed Grapple', grappleOpeningIn: 52 },
      sellerVerified: true,
      qualityValidated: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nFirestore seed script — project: ${PROJECT_ID}\n`);

  const sellerUid = await lookupUid(TARGET_EMAIL);

  const listings = makeDummyListings(sellerUid);
  console.log(`\nCreating ${listings.length} dummy listings…\n`);

  let created = 0;
  let skipped = 0;
  for (const listing of listings) {
    try {
      await createListing(sellerUid, listing);
      created++;
    } catch (err) {
      if (err.message.includes('409') || err.message.includes('ALREADY_EXISTS')) {
        console.log(`  ↩ Skipped (already exists): ${listing.id}`);
        skipped++;
      } else {
        console.error(`  ✘ Failed: ${listing.id} — ${err.message}`);
      }
    }
  }

  console.log(`\n✅  Done — ${created} created, ${skipped} skipped.\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
