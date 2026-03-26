/**
 * categorySpecs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Research-backed spec field definitions for every major forestry equipment
 * category sold on Forestry Equipment Sales. Each spec field drives:
 *   • Dynamic form rendering in ListingModal (admin) and Sell.tsx (public)
 *   • Server-side validation in equipmentService.validateListingQuality()
 *   • Spec-sheet display on ListingDetail / ListingCard
 *
 * How to add a new category:
 *   1. Add an entry to CATEGORY_SCHEMAS with `displayName`, `specs`,
 *      `attachmentOptions`, and `checklist`.
 *   2. Add the required spec keys to equipmentService REQUIRED_SPECS_BY_CATEGORY.
 */

export type SpecFieldType = 'text' | 'number' | 'select' | 'boolean';

export interface SpecField {
  key: string;
  label: string;
  type: SpecFieldType;
  required: boolean;
  unit?: string;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  description?: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
}

export interface CategorySchema {
  displayName: string;
  specs: SpecField[];
  attachmentOptions: string[];
  checklist: ChecklistItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Common checklist items shared by all categories.
// ─────────────────────────────────────────────────────────────────────────────
export const COMMON_CHECKLIST: ChecklistItem[] = [
  { key: 'engineChecked',            label: 'Engine Inspected & Running' },
  { key: 'undercarriageChecked',     label: 'Drive System Functional' },
  { key: 'hydraulicsLeakStatus',     label: 'Hydraulics Checked - Leaks?' },
];

export const TRAILER_CONDITION_CHECKLIST: ChecklistItem[] = [
  { key: 'frameChecked', label: 'Frame and Welds Inspected' },
  { key: 'runningGearChecked', label: 'Axles, Hubs, Tires, and Brakes Inspected' },
  { key: 'lightingChecked', label: 'Lights and Wiring Harness Tested' },
];

export const PARTS_CONDITION_CHECKLIST: ChecklistItem[] = [
  { key: 'partNumberVerified', label: 'Part Number Verified' },
  { key: 'fitmentVerified', label: 'Fitment / Compatibility Verified' },
  { key: 'conditionGradeVerified', label: 'Condition Grade Verified' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Per-category schemas
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORY_SCHEMAS: Record<string, CategorySchema> = {

  // ── SKIDDERS ───────────────────────────────────────────────────────────────
  Skidders: {
    displayName: 'Skidders',
    specs: [
      // ── Required ──────────────────────────────────────────────────────────
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. John Deere 6.8L T4',
        description: 'Full engine make, displacement, and emissions tier'
      },
      {
        key: 'horsepower', label: 'Engine Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1,
        description: 'Gross engine horsepower (SAE J1995)'
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100,
        description: 'Machine weight with full fluids and standard grapple'
      },
      {
        key: 'driveType', label: 'Drive Configuration', type: 'select',
        required: true,
        options: ['4WD', '6WD', '8WD', 'Bogie / Dual-Tire Tandem', 'Cable Skidder'],
      },
      {
        key: 'grappleType', label: 'Grapple Configuration', type: 'select',
        required: true,
        options: [
          'Fixed Grapple', 'Rotating Grapple', 'Stroke Boom Grapple',
          'Winch Only (No Grapple)', 'Dual Arch'
        ],
      },
      {
        key: 'grappleOpeningIn', label: 'Grapple Opening', type: 'number',
        required: true, unit: 'in', min: 0,
        description: 'Maximum jaw opening diameter in inches'
      },
      // ── Optional ──────────────────────────────────────────────────────────
      {
        key: 'archHeight', label: 'Arch Height', type: 'number',
        required: false, unit: 'in'
      },
      {
        key: 'winchCapacityLbs', label: 'Winch Capacity', type: 'number',
        required: false, unit: 'lbs'
      },
      {
        key: 'tireSize', label: 'Tire Size', type: 'text',
        required: false, placeholder: 'e.g. 30.5R32 or 28L-26'
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Open ROPS', 'No Cab']
      },
      {
        key: 'frameArticulation', label: 'Frame Articulation / Center Pivot',
        type: 'boolean', required: false
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text',
        required: false, placeholder: 'e.g. Hydrostatic, Power Shift'
      },
    ],
    attachmentOptions: [
      'Fixed Grapple', 'Rotating Grapple', 'Stroke Boom', 'Winch',
      'Tire Chains', 'Tracks / Eco-Tracks', 'Olofsfors Eco-Tracks',
      'Front Blade / Dozer Blade', 'Arch Candy', 'Snow Chains'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'grappleChecked',  label: 'Grapple / Winch Function Tested' },
      { key: 'tiresChecked',    label: 'Tires / Tracks Inspected & Measured' },
    ],
  },

  // ── FELLER BUNCHERS ────────────────────────────────────────────────────────
  'Feller Bunchers': {
    displayName: 'Feller Bunchers',
    specs: [
      // ── Required ──────────────────────────────────────────────────────────
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Cummins QSB6.7 T4F',
      },
      {
        key: 'horsepower', label: 'Engine Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Carrier Type', type: 'select', required: true,
        options: ['Track', 'Wheel', 'Swing-to-Tree (STT)', 'Rubber-Tracked Wheel']
      },
      {
        key: 'headType', label: 'Cutting Head / Saw Type', type: 'select',
        required: true,
        options: [
          'Disc Saw', 'Bar Saw', 'Chainsaw', 'Stroke Buncher',
          'Tree Shear', 'Hot Saw', 'Combination Disc/Bar'
        ],
        description: 'Primary cutting mechanism on the felling head'
      },
      {
        key: 'headMake', label: 'Head Manufacturer', type: 'text',
        required: true,
        placeholder: 'e.g. Tigercat, CTR, Quadco, Denharr, Risley',
        description: 'The make of the felling/bunching head (may differ from carrier)'
      },
      {
        key: 'headModel', label: 'Head Model', type: 'text',
        required: true, placeholder: 'e.g. 5185, FS-22, Q76'
      },
      {
        key: 'maxFellingDiameterIn', label: 'Max Felling Diameter', type: 'number',
        required: true, unit: 'in', min: 1,
        description: 'Maximum tree diameter the head is rated to fell'
      },
      // ── Optional ──────────────────────────────────────────────────────────
      {
        key: 'sawDiameterIn', label: 'Saw Blade Diameter', type: 'number',
        required: false, unit: 'in',
        description: 'Disc saw blade diameter (applies to disc saw heads)'
      },
      {
        key: 'accumulating', label: 'Accumulating / Multi-Tree Bunching',
        type: 'boolean', required: false,
        description: 'Can the head accumulate multiple trees before placing?'
      },
      {
        key: 'headSerialNumber', label: 'Head Serial Number', type: 'text',
        required: false
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Open ROPS']
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text',
        required: false, placeholder: 'e.g. Hydrostatic, Torque Converter'
      },
    ],
    attachmentOptions: [
      'Disc Saw Head', 'Bar Saw Head', 'Chainsaw Head', 'Hot Saw Head',
      'Stroke Buncher Head', 'Tree Shear', 'Delimber Attachment',
      'Mulching Head', 'Grapple Saw', 'Carrier Boom Extension'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'headChecked',  label: 'Cutting / Saw Head Function Tested' },
      { key: 'tiresChecked', label: 'Tracks / Undercarriage Inspected' },
    ],
  },

  // ── HARVESTERS ─────────────────────────────────────────────────────────────
  Harvesters: {
    displayName: 'Harvesters',
    specs: [
      // ── Required ──────────────────────────────────────────────────────────
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Volvo D7E, Tier 4 Final'
      },
      {
        key: 'horsepower', label: 'Engine Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Carrier / Drive Configuration', type: 'select',
        required: true,
        options: ['Track', 'Wheel', 'Bogie', '6WD Articulated', '8WD Articulated']
      },
      {
        key: 'headType', label: 'Harvesting Head Type', type: 'select',
        required: true,
        options: [
          'Single-Grip Harvesting Head',
          'Double-Grip Processing Head',
          'Stroke / Bar Saw Processing Head',
          'Combination Head',
        ],
        description: 'Single-grip fells and processes; double-grip processes pre-felled trees'
      },
      {
        key: 'headMake', label: 'Head Manufacturer', type: 'text',
        required: true,
        placeholder: 'e.g. Waratah, Log Max, Kesla, Ponsse, Keto, SP Maskiner'
      },
      {
        key: 'headModel', label: 'Head Model', type: 'text',
        required: true, placeholder: 'e.g. H215E, 7000HD, 928'
      },
      {
        key: 'maxFellingDiameterIn', label: 'Max Felling Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      // ── Optional ──────────────────────────────────────────────────────────
      {
        key: 'maxFeedSpeedFtPerSec', label: 'Max Feed Speed', type: 'number',
        required: false, unit: 'ft/sec',
        description: 'Maximum delimbing and feeding speed'
      },
      {
        key: 'delimbbingKnifeCount', label: 'Delimbing Knife Count', type: 'number',
        required: false, min: 0
      },
      {
        key: 'barLengthIn', label: 'Bar / Guide Bar Length', type: 'number',
        required: false, unit: 'in'
      },
      {
        key: 'sawChain', label: 'Saw Chain Specification', type: 'text',
        required: false, placeholder: 'e.g. .404" pitch × 1.5mm gauge'
      },
      {
        key: 'headSerialNumber', label: 'Head Serial Number', type: 'text',
        required: false
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS (360°)', 'Cab with Leveling', 'Open ROPS']
      },
      {
        key: 'tiltingCab', label: 'Tilting Cab', type: 'boolean', required: false,
        description: 'Does the cab tilt for uphill / steep-slope operation?'
      },
    ],
    attachmentOptions: [
      'Single-Grip Harvesting Head', 'Double-Grip Processing Head',
      'Tilting Cab Kit', 'Winch', 'Lean Tree Device',
      'Stroke Delimber Attachment', 'Log Measurer / Scale'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'headChecked',  label: 'Harvesting Head Tested & Calibrated' },
      { key: 'tiresChecked', label: 'Tracks / Undercarriage Inspected' },
    ],
  },

  // ── FORWARDERS ─────────────────────────────────────────────────────────────
  Forwarders: {
    displayName: 'Forwarders',
    specs: [
      // ── Required ──────────────────────────────────────────────────────────
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. John Deere PowerTech 6.8L PSS'
      },
      {
        key: 'horsepower', label: 'Engine Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'loadCapacityLbs', label: 'Rated Load Capacity', type: 'number',
        required: true, unit: 'lbs', min: 1,
        description: 'Manufacturer-rated payload in lbs'
      },
      {
        key: 'driveType', label: 'Drive Configuration', type: 'select',
        required: true,
        options: [
          '4WD Articulated', '6WD Articulated', '8WD Articulated',
          'Bogie / Dual-Tire Tandem', 'CTL Rubber Track'
        ]
      },
      {
        key: 'maxBoomReachFt', label: 'Max Crane / Boom Reach', type: 'number',
        required: true, unit: 'ft', min: 1
      },
      {
        key: 'bunkWidthIn', label: 'Bunk Width', type: 'number',
        required: true, unit: 'in', min: 1
      },
      // ── Optional ──────────────────────────────────────────────────────────
      {
        key: 'bunkHeightIn', label: 'Bunk Height', type: 'number',
        required: false, unit: 'in'
      },
      {
        key: 'axleCount', label: 'Number of Axles', type: 'number',
        required: false, min: 2
      },
      {
        key: 'grappleOpeningIn', label: 'Grapple Opening', type: 'number',
        required: false, unit: 'in'
      },
      {
        key: 'tireSize', label: 'Tire Size', type: 'text',
        required: false, placeholder: 'e.g. 710/55-26.5 or CTR 700'
      },
      {
        key: 'boomMake', label: 'Crane / Boom Make', type: 'text',
        required: false, placeholder: 'e.g. Rotobec, Kesla, Cranab'
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text',
        required: false, placeholder: 'e.g. Hydrostatic, Power Shift'
      },
    ],
    attachmentOptions: [
      'Rotating Log Grapple', 'Bunk Stakes (Fixed)', 'Bunk Extensions',
      'Pole Bunks', 'Crane / Boom Upgrade', 'Winch',
      'Tire Chains', 'Scale Package', 'Remote Control'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'bunkChecked',  label: 'Bunk / Crane Function Tested' },
      { key: 'tiresChecked', label: 'Tires / Tracks Inspected & Measured' },
    ],
  },

  // ── LOG LOADERS ────────────────────────────────────────────────────────────
  'Log Loaders': {
    displayName: 'Log Loaders',
    specs: [
      // ── Required ──────────────────────────────────────────────────────────
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. CAT C4.4 ACERT T4F'
      },
      {
        key: 'horsepower', label: 'Engine Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'loaderType', label: 'Loader / Boom Type', type: 'select',
        required: true,
        options: [
          'Knuckle Boom', 'Straight Boom', 'Pipe Boom',
          'Log Grab / Swing Machine', 'Self-Loading Crane'
        ]
      },
      {
        key: 'maxBoomReachFt', label: 'Max Boom Reach', type: 'number',
        required: true, unit: 'ft', min: 1
      },
      {
        key: 'grappleOpeningIn', label: 'Grapple / Grab Opening', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'carrierType', label: 'Carrier / Mount Type', type: 'select',
        required: true,
        options: [
          'Tracked Excavator Carrier', 'Wheeled Excavator Carrier',
          'Self-Propelled (Rubber Track)', 'Stationary Mount',
          'Truck Mounted', 'Log Trailer Mounted'
        ]
      },
      // ── Optional ──────────────────────────────────────────────────────────
      {
        key: 'maxLiftCapacityLbs', label: 'Max Lift Capacity', type: 'number',
        required: false, unit: 'lbs',
        description: 'Rated lift capacity at maximum reach'
      },
      {
        key: 'swingDegrees', label: 'Boom Swing', type: 'number',
        required: false, unit: '°',
        description: 'Boom rotation in degrees'
      },
      {
        key: 'cabType', label: 'Operator Station', type: 'select',
        required: false,
        options: ['Enclosed ROPS/FOPS', 'Open Frame / ROPS', 'Remote / No Cab']
      },
      {
        key: 'transmission', label: 'Travel Drive', type: 'text',
        required: false, placeholder: 'e.g. Hydrostatic, Tracked Undercarriage'
      },
    ],
    attachmentOptions: [
      'Log Grapple', 'Sorting Grapple', 'Orange Peel Grapple', 'Clamshell',
      'Thumb Attachment', 'Sorting Fork', 'Tree Shear', 'Scale Package',
      'Cab Protective Screen', 'Extended Boom'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'boomChecked',  label: 'Boom & Grapple Function Tested' },
      { key: 'tiresChecked', label: 'Carrier / Undercarriage Inspected' },
    ],
  },

  // ── FIREWOOD PROCESSORS ────────────────────────────────────────────────────
  'Firewood Processors': {
    displayName: 'Firewood Processors',
    specs: [
      // ── Required ──────────────────────────────────────────────────────────
      {
        key: 'engineType', label: 'Power Source', type: 'select',
        required: true,
        options: ['Diesel', 'Gas / Petrol', 'Electric', 'PTO-Powered', 'Hydraulic-Driven (Host Machine)']
      },
      {
        key: 'horsepower', label: 'Horsepower / Power Rating', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'maxLogDiameterIn', label: 'Max Log Diameter', type: 'number',
        required: true, unit: 'in', min: 1,
        description: 'Maximum diameter log the saw/processor can handle'
      },
      {
        key: 'maxLogLengthIn', label: 'Max Log Length', type: 'number',
        required: true, unit: 'in', min: 1,
        description: 'Maximum total log length the infeed can accept'
      },
      {
        key: 'splittingForceTons', label: 'Splitting Force', type: 'number',
        required: true, unit: 'tons', min: 1,
        description: 'Hydraulic splitting force in short tons'
      },
      {
        key: 'wedgePattern', label: 'Wedge / Splitting Pattern', type: 'select',
        required: true,
        options: [
          '2-Way (Straight Split)', '4-Way', '6-Way', '8-Way',
          '12-Way', '16-Way', 'Variable / Adjustable Pattern'
        ]
      },
      {
        key: 'cycleTimeSec', label: 'Full Cycle Time', type: 'number',
        required: true, unit: 'sec', min: 0.1,
        description: 'Saw-to-split full cycle time in seconds'
      },
      {
        key: 'sawBladeSizeIn', label: 'Saw Blade Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'conveyorLengthFt', label: 'Outfeed Conveyor Length', type: 'number',
        required: true, unit: 'ft', min: 1
      },
      // ── Optional ──────────────────────────────────────────────────────────
      {
        key: 'minLogLengthIn', label: 'Min Log Length', type: 'number',
        required: false, unit: 'in'
      },
      {
        key: 'productionRateCordsPerHr', label: 'Production Rate', type: 'number',
        required: false, unit: 'cords/hr'
      },
      {
        key: 'infeedType', label: 'Infeed / Log Feeding System', type: 'select',
        required: false,
        options: ['Manual / Hand-Fed', 'Semi-Automatic', 'Fully Automatic Log Deck']
      },
      {
        key: 'conveyorType', label: 'Conveyor Type', type: 'select',
        required: false,
        options: ['Chain Conveyor', 'Belt Conveyor', 'Elevator Belt', 'Cross Conveyor']
      },
      {
        key: 'selfPropelled', label: 'Self-Propelled', type: 'boolean',
        required: false
      },
      {
        key: 'bulkBagSystem', label: 'Bulk Bag Filling System', type: 'boolean',
        required: false
      },
      {
        key: 'weight', label: 'Machine Weight', type: 'number',
        required: false, unit: 'lbs'
      },
    ],
    attachmentOptions: [
      'Log Deck / Infeed Deck', 'Infeed Conveyor', 'Cross Conveyor',
      'Outfeed Elevator Conveyor', 'Bulk Bag Filler', 'Trailer Package',
      'Log Splitter Attachment', 'Tumbler / Bark Tumbler', 'Log Grabs',
      'Electric Motor Conversion Kit'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'sawChecked',       label: 'Saw / Cutting Mechanism Tested' },
      { key: 'conveyorChecked',  label: 'Conveyor System Tested & Aligned' },
      { key: 'splitterChecked',  label: 'Splitting Wedge & Ram Fully Tested' },
    ],
  },

  // ── DOZERS ────────────────────────────────────────────────────────────────
  Dozers: {
    displayName: 'Dozers',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. CAT C9.3B, Tier 4 Final'
      },
      {
        key: 'horsepower', label: 'Engine Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Undercarriage Type', type: 'select',
        required: true,
        options: ['Crawler', 'LGP Crawler', 'PAT / 6-Way', 'Hydrostatic Track']
      },
      {
        key: 'bladeType', label: 'Blade Type', type: 'select',
        required: true,
        options: ['S-Blade', 'U-Blade', 'Semi-U Blade', 'PAT / 6-Way Blade']
      },
      {
        key: 'maxLiftCapacityLbs', label: 'Drawbar Pull / Push Force', type: 'number',
        required: false, unit: 'lbs'
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Open ROPS']
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text', required: false,
        placeholder: 'e.g. Power Shift, Hydrostatic'
      },
    ],
    attachmentOptions: [
      'Ripper', 'Winch', 'Root Rake', 'Brush Guard', 'Sweeps',
      'Rear Counterweight', 'PAT Blade Kit', 'Land Clearing Package'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'undercarriageTrackChecked', label: 'Track Chain, Rollers & Sprockets Checked' },
      { key: 'bladeChecked', label: 'Blade / Ripper Cylinders and Pins Checked' },
    ],
  },

  // ── EXCAVATORS ────────────────────────────────────────────────────────────
  Excavators: {
    displayName: 'Excavators',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Isuzu 4HK1, Tier 4 Final'
      },
      {
        key: 'horsepower', label: 'Engine Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Undercarriage / Carrier', type: 'select',
        required: true,
        options: ['Tracked', 'Wheeled', 'Long Reach', 'Forestry Guarded']
      },
      {
        key: 'maxBoomReachFt', label: 'Max Dig / Boom Reach', type: 'number',
        required: true, unit: 'ft', min: 1
      },
      {
        key: 'maxLiftCapacityLbs', label: 'Lift Capacity', type: 'number',
        required: false, unit: 'lbs'
      },
      {
        key: 'swingDegrees', label: 'Swing Degrees', type: 'number',
        required: false, unit: '°', min: 0, max: 360
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Open ROPS', 'Forestry Guarded Cab']
      },
    ],
    attachmentOptions: [
      'Bucket', 'Thumb', 'Grapple', 'Mulcher Head', 'Hydraulic Hammer',
      'Shear', 'Rake', 'Quick Coupler', 'Log Grapple'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'boomChecked', label: 'Boom / Stick Pins and Bushings Checked' },
      { key: 'undercarriageTrackChecked', label: 'Tracks / Rollers / Idlers Checked' },
    ],
  },

  // ── CHIPPERS ──────────────────────────────────────────────────────────────
  Chippers: {
    displayName: 'Chippers',
    specs: [
      {
        key: 'engineType', label: 'Power Source', type: 'select',
        required: true,
        options: ['Diesel', 'Gas / Petrol', 'PTO-Powered', 'Electric']
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'maxFellingDiameterIn', label: 'Max Feed Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'driveType', label: 'Chipper Type', type: 'select',
        required: true,
        options: ['Drum Chipper', 'Disc Chipper', 'Whole Tree Chipper', 'Towable Chipper']
      },
      {
        key: 'weight', label: 'Machine Weight', type: 'number',
        required: false, unit: 'lbs'
      },
      {
        key: 'infeedType', label: 'Infeed Type', type: 'select',
        required: false,
        options: ['Manual Feed', 'Hydraulic Feed Rollers', 'Loader / Crane Fed']
      },
      {
        key: 'conveyorType', label: 'Discharge System', type: 'select',
        required: false,
        options: ['Spout', 'Conveyor', 'Blower', 'Chip Van Discharge']
      },
    ],
    attachmentOptions: [
      'Magnet', 'Loader', 'Crane', 'Live Deck', 'Chip Conveyor',
      'Spare Knife Set', 'Screen Package', 'Remote Control'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'knifeChecked', label: 'Knives / Anvils Inspected and Set' },
      { key: 'feedRollerChecked', label: 'Feed Rollers and Feed Controls Tested' },
    ],
  },

  // ── LOG TRUCKS ────────────────────────────────────────────────────────────
  'Log Trucks': {
    displayName: 'Log Trucks',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Cummins X15'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Axle Configuration', type: 'select',
        required: true,
        options: ['4x2', '6x4', '8x4', '8x6', 'Tri-Drive']
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text',
        required: true, placeholder: 'e.g. Eaton Fuller 18-speed'
      },
      {
        key: 'weight', label: 'GVWR', type: 'number', required: true,
        unit: 'lbs', min: 1
      },
      {
        key: 'loadCapacityLbs', label: 'Payload Capacity', type: 'number',
        required: false, unit: 'lbs'
      },
      {
        key: 'axleCount', label: 'Axle Count', type: 'number',
        required: false, min: 2
      },
    ],
    attachmentOptions: [
      'Log Bunks', 'Headache Rack', 'Trailer Connections', 'Loader Mount',
      'PTO', 'Wet Kit', 'Self-Loading Grapple', 'Scale Package'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'drivetrainChecked', label: 'Axles / Driveline / Differentials Checked' },
      { key: 'brakeChecked', label: 'Brake System and Air System Checked' },
    ],
  },

  // ── LOG TRAILERS ──────────────────────────────────────────────────────────
  'Log Trailers': {
    displayName: 'Log Trailers',
    specs: [
      {
        key: 'loadCapacityLbs', label: 'Load Capacity', type: 'number',
        required: true, unit: 'lbs', min: 1
      },
      {
        key: 'axleCount', label: 'Axle Count', type: 'number',
        required: true, min: 1
      },
      {
        key: 'weight', label: 'Trailer Weight', type: 'number',
        required: true, unit: 'lbs', min: 1
      },
      {
        key: 'driveType', label: 'Trailer Configuration', type: 'select',
        required: true,
        options: ['Pole Trailer', 'Bunk Trailer', 'Fixed Neck', 'Stinger Steer']
      },
      {
        key: 'maxBoomReachFt', label: 'Loader Reach (if equipped)', type: 'number',
        required: false, unit: 'ft', min: 1
      },
      {
        key: 'grappleOpeningIn', label: 'Grapple Opening (if equipped)', type: 'number',
        required: false, unit: 'in', min: 1
      },
    ],
    attachmentOptions: [
      'Bunks', 'Stakes', 'Reach Pole', 'Self-Loading Crane',
      'Log Grapple', 'Air Ride Suspension', 'Tire Inflation System'
    ],
    checklist: [
      ...TRAILER_CONDITION_CHECKLIST,
      { key: 'frameChecked', label: 'Frame, Bunks, and Welds Inspected' },
      { key: 'runningGearChecked', label: 'Axles, Hubs, Tires, and Brakes Inspected' },
    ],
  },

  // ── HORIZONTAL GRINDERS ───────────────────────────────────────────────────
  'Horizontal Grinders': {
    displayName: 'Horizontal Grinders',
    specs: [
      {
        key: 'engineType', label: 'Power Source', type: 'select',
        required: true,
        options: ['Diesel', 'Electric', 'Hybrid']
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Grinder Type', type: 'select',
        required: true,
        options: ['Tracked Horizontal Grinder', 'Wheeled Horizontal Grinder', 'Trailer-Mounted Horizontal Grinder']
      },
      {
        key: 'maxLogDiameterIn', label: 'Max Material Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'infeedType', label: 'Infeed System', type: 'select',
        required: false,
        options: ['Loader Fed', 'Self-Loading Infeed', 'Conveyor Infeed']
      },
      {
        key: 'conveyorType', label: 'Discharge System', type: 'select',
        required: false,
        options: ['Conveyor', 'Stacking Conveyor', 'Blower / Thrower']
      },
    ],
    attachmentOptions: [
      'Magnet', 'Screen Package', 'Remote Control', 'Loader',
      'Cross Belt Magnet', 'Discharge Conveyor', 'Infeed Conveyor'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'grinderDrumChecked', label: 'Grinding Drum / Teeth Inspected' },
      { key: 'conveyorChecked', label: 'Conveyors / Belts / Rollers Checked' },
    ],
  },

  // ── MULCHERS ──────────────────────────────────────────────────────────────
  Mulchers: {
    displayName: 'Mulchers',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. CAT C7.1'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Carrier Type', type: 'select',
        required: true,
        options: ['Tracked Mulcher', 'Wheeled Mulcher', 'Skid Steer Mulcher', 'Excavator Mulcher']
      },
      {
        key: 'headType', label: 'Mulching Head Type', type: 'select',
        required: true,
        options: ['Drum Head', 'Disc Head', 'Fixed-Tooth Rotor', 'Carbide Tooth Rotor']
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number',
        required: true, unit: 'lbs', min: 100
      },
      {
        key: 'maxFellingDiameterIn', label: 'Max Material Diameter', type: 'number',
        required: false, unit: 'in', min: 1
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Forestry Guarded Cab', 'Open ROPS']
      },
    ],
    attachmentOptions: [
      'Forestry Mulcher Head', 'Brush Cutter', 'Root Rake',
      'Guarding Package', 'Winch', 'Debris Deflector'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'headChecked', label: 'Mulching Head / Rotor Checked' },
      { key: 'coolingChecked', label: 'Cooling System and Reversing Fan Checked' },
    ],
  },

  // ── STUMP GRINDERS ────────────────────────────────────────────────────────
  'Stump Grinders': {
    displayName: 'Stump Grinders',
    specs: [
      {
        key: 'engineType', label: 'Power Source', type: 'select',
        required: true,
        options: ['Gas / Petrol', 'Diesel', 'Hydraulic-Driven', 'PTO-Powered']
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Machine Type', type: 'select',
        required: true,
        options: ['Self-Propelled', 'Tow-Behind', 'Skid Steer Attachment', 'Tracked']
      },
      {
        key: 'sawDiameterIn', label: 'Grinding Wheel Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'maxFellingDiameterIn', label: 'Max Stump Diameter', type: 'number',
        required: false, unit: 'in', min: 1
      },
      {
        key: 'weight', label: 'Machine Weight', type: 'number',
        required: false, unit: 'lbs'
      },
      {
        key: 'swingDegrees', label: 'Sweep Angle', type: 'number',
        required: false, unit: '°', min: 0, max: 180
      },
    ],
    attachmentOptions: [
      'Remote Control', 'Rubber Tracks', 'Grease System',
      'Spare Tooth Set', 'Work Light Kit'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'wheelChecked', label: 'Grinding Wheel and Teeth Inspected' },
      { key: 'swingSystemChecked', label: 'Sweep / Swing System Checked' },
    ],
  },

  // ── BUCKET TRUCKS ─────────────────────────────────────────────────────────
  'Bucket Trucks': {
    displayName: 'Bucket Trucks',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Cummins ISB'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number',
        required: true, unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Axle Configuration', type: 'select',
        required: true,
        options: ['4x2', '4x4', '6x4']
      },
      {
        key: 'maxBoomReachFt', label: 'Working Height / Reach', type: 'number',
        required: true, unit: 'ft', min: 1
      },
      {
        key: 'weight', label: 'GVWR', type: 'number',
        required: true, unit: 'lbs', min: 1
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text',
        required: false
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Standard Cab', 'Crew Cab', 'Extended Cab']
      },
    ],
    attachmentOptions: [
      'Outriggers', 'Material Handler Jib', 'Tool Circuit',
      'Insulated Boom', 'Chip Box', 'Winch'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'boomChecked', label: 'Boom and Bucket Controls Tested' },
      { key: 'outriggerChecked', label: 'Outriggers and Safety Interlocks Tested' },
    ],
  },

  // ── LOWBOY TRAILERS ───────────────────────────────────────────────────────
  'Lowboy Trailers': {
    displayName: 'Lowboy Trailers',
    specs: [
      {
        key: 'loadCapacityLbs', label: 'Load Capacity', type: 'number',
        required: true, unit: 'lbs', min: 1
      },
      {
        key: 'axleCount', label: 'Axle Count', type: 'number',
        required: true, min: 1
      },
      {
        key: 'weight', label: 'Trailer Weight', type: 'number',
        required: true, unit: 'lbs', min: 1
      },
      {
        key: 'driveType', label: 'Trailer Type', type: 'select',
        required: true,
        options: ['Fixed Neck', 'Detachable Gooseneck (RGN)', 'Hydraulic Detach', 'Mechanical Detach']
      },
      {
        key: 'maxLogLengthIn', label: 'Deck Length', type: 'number',
        required: false, unit: 'in', min: 1
      },
      {
        key: 'bunkWidthIn', label: 'Deck Width', type: 'number',
        required: false, unit: 'in', min: 1
      },
    ],
    attachmentOptions: [
      'Ramps', 'Winch', 'Toolbox', 'Outriggers',
      'Stinger', 'Extension Deck', 'Air Ride Suspension'
    ],
    checklist: [
      ...TRAILER_CONDITION_CHECKLIST,
      { key: 'frameChecked', label: 'Main Frame and Neck Inspected' },
      { key: 'runningGearChecked', label: 'Suspension, Axles, Hubs, and Brakes Inspected' },
    ],
  },

  // ── SKID STEERS ───────────────────────────────────────────────────────────
  'Skid Steers': {
    displayName: 'Skid Steers',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Kubota V3307'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number', required: true,
        unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Machine Type', type: 'select', required: true,
        options: ['Wheeled Skid Steer', 'Compact Track Loader (CTL)']
      },
      {
        key: 'maxLiftCapacityLbs', label: 'Rated Operating Capacity', type: 'number',
        required: true, unit: 'lbs', min: 1
      },
      {
        key: 'maxBoomReachFt', label: 'Hinge Pin / Reach Height', type: 'number',
        required: false, unit: 'ft', min: 1
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed Cab', 'Open ROPS', 'Forestry Guarded Cab']
      },
    ],
    attachmentOptions: [
      'Bucket', 'Pallet Forks', 'Grapple', 'Mulcher Head', 'Brush Cutter',
      'Stump Grinder', 'Dozer Blade', 'Snow Blower', 'Hydraulic Hammer'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'liftArmChecked', label: 'Lift Arms and Quick Coupler Checked' },
      { key: 'driveSystemChecked', label: 'Drive Motors / Chains / Tracks Checked' },
    ],
  },

  // ── WHEEL LOADERS ─────────────────────────────────────────────────────────
  'Wheel Loaders': {
    displayName: 'Wheel Loaders',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. John Deere PowerTech PSS'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number', required: true,
        unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Drive Configuration', type: 'select', required: true,
        options: ['4WD Articulated', '4WD Rigid Frame']
      },
      {
        key: 'maxLiftCapacityLbs', label: 'Lift Capacity', type: 'number',
        required: true, unit: 'lbs', min: 1
      },
      {
        key: 'bucketCapacityCyd', label: 'Bucket Capacity', type: 'number',
        required: false, unit: 'yd3', min: 0.1
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Open ROPS']
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text', required: false,
        placeholder: 'e.g. Power Shift, CVT'
      },
    ],
    attachmentOptions: [
      'General Purpose Bucket', 'Log Fork / Grapple', 'High-Lift Boom',
      'Quick Coupler', 'Rock Bucket', 'Snow Pusher', 'Pallet Forks'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'articulationChecked', label: 'Center Articulation and Pins Checked' },
      { key: 'loaderArmsChecked', label: 'Loader Arms and Linkage Checked' },
    ],
  },

  // ── DEBARKERS ─────────────────────────────────────────────────────────────
  Debarkers: {
    displayName: 'Debarkers',
    specs: [
      {
        key: 'engineType', label: 'Power Source', type: 'select', required: true,
        options: ['Diesel', 'Electric', 'Hydraulic-Driven']
      },
      {
        key: 'horsepower', label: 'Power Rating', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Debarker Type', type: 'select', required: true,
        options: ['Ring Debarker', 'Rosserhead Debarker', 'Drum Debarker', 'Flail Debarker']
      },
      {
        key: 'maxLogDiameterIn', label: 'Max Log Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'maxLogLengthIn', label: 'Max Log Length', type: 'number',
        required: false, unit: 'in', min: 1
      },
      {
        key: 'productionRateTph', label: 'Production Rate', type: 'number',
        required: false, unit: 'tph', min: 0.1
      },
      {
        key: 'weight', label: 'Machine Weight', type: 'number',
        required: false, unit: 'lbs'
      },
    ],
    attachmentOptions: [
      'Infeed Deck', 'Outfeed Conveyor', 'Waste Conveyor', 'Metal Detector',
      'Hydraulic Power Unit', 'Control Station', 'Chip Separation System'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'rotorChecked', label: 'Rotor / Head / Tooling Inspected' },
      { key: 'feedSystemChecked', label: 'Infeed and Outfeed Systems Tested' },
    ],
  },

  // ── DELIMBERS ─────────────────────────────────────────────────────────────
  Delimbers: {
    displayName: 'Delimbers',
    specs: [
      {
        key: 'engineType', label: 'Power Source', type: 'select', required: true,
        options: ['Diesel', 'Hydraulic-Driven', 'Electric']
      },
      {
        key: 'horsepower', label: 'Power Rating', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Delimber Type', type: 'select', required: true,
        options: ['Stroke Delimber', 'Gate Delimber', 'Chain Flail Delimber', 'Processing Head Delimber']
      },
      {
        key: 'maxFellingDiameterIn', label: 'Max Stem Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'maxBoomReachFt', label: 'Feed / Boom Reach', type: 'number',
        required: false, unit: 'ft', min: 1
      },
      {
        key: 'delimbbingKnifeCount', label: 'Knife Count', type: 'number',
        required: false, min: 1
      },
      {
        key: 'weight', label: 'Machine Weight', type: 'number',
        required: false, unit: 'lbs'
      },
    ],
    attachmentOptions: [
      'Top Saw', 'Measuring Wheel', 'Hydraulic Log Stop', 'Infeed Conveyor',
      'Outfeed Deck', 'Processing Knife Set', 'Remote Controls'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'knifeChecked', label: 'Delimbing Knives and Wear Surfaces Checked' },
      { key: 'feedSystemChecked', label: 'Feed Rollers / Chains / Drive Checked' },
    ],
  },

  // ── SAWMILLS ──────────────────────────────────────────────────────────────
  Sawmills: {
    displayName: 'Sawmills',
    specs: [
      {
        key: 'engineType', label: 'Power Source', type: 'select', required: true,
        options: ['Gas / Petrol', 'Diesel', 'Electric', 'PTO-Powered']
      },
      {
        key: 'horsepower', label: 'Power Rating', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Mill Type', type: 'select', required: true,
        options: ['Portable Band Mill', 'Stationary Band Mill', 'Circular Mill', 'Swing Blade Mill']
      },
      {
        key: 'maxLogDiameterIn', label: 'Max Log Diameter', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'maxLogLengthIn', label: 'Max Log Length', type: 'number',
        required: true, unit: 'in', min: 1
      },
      {
        key: 'sawBladeSizeIn', label: 'Blade / Saw Size', type: 'number',
        required: false, unit: 'in', min: 1
      },
      {
        key: 'weight', label: 'Machine Weight', type: 'number',
        required: false, unit: 'lbs'
      },
      {
        key: 'productionRateBfHr', label: 'Production Rate', type: 'number',
        required: false, unit: 'bf/hr', min: 1
      },
    ],
    attachmentOptions: [
      'Hydraulic Log Loader', 'Debarker', 'Edger', 'Blade Sharpener',
      'Setworks', 'Toe Boards', 'Trailer Package', 'Board Return'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'bladeChecked', label: 'Blade Condition, Tracking, and Tension Checked' },
      { key: 'bedAlignmentChecked', label: 'Mill Bed and Head Alignment Checked' },
    ],
  },

  // ── GRADERS ───────────────────────────────────────────────────────────────
  Graders: {
    displayName: 'Graders',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. CAT C7.1'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number', required: true,
        unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Drive Configuration', type: 'select', required: true,
        options: ['6x4', '6x6', 'AWD']
      },
      {
        key: 'moldboardWidthFt', label: 'Moldboard Width', type: 'number', required: true,
        unit: 'ft', min: 1
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Open ROPS']
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text', required: false,
        placeholder: 'e.g. Power Shift'
      },
    ],
    attachmentOptions: [
      'Ripper', 'Scarifier', 'Front Blade', 'Snow Wing',
      'Circle Saver', 'Grade Control System'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'moldboardChecked', label: 'Moldboard, Circle, and Drawbar Checked' },
      { key: 'tandemDriveChecked', label: 'Tandem Drive and Differential Checked' },
    ],
  },

  // ── TUB GRINDERS ──────────────────────────────────────────────────────────
  'Tub Grinders': {
    displayName: 'Tub Grinders',
    specs: [
      {
        key: 'engineType', label: 'Power Source', type: 'select', required: true,
        options: ['Diesel', 'Electric', 'Hybrid']
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'driveType', label: 'Machine Type', type: 'select', required: true,
        options: ['Towable Tub Grinder', 'Tracked Tub Grinder', 'Wheeled Tub Grinder']
      },
      {
        key: 'tubDiameterFt', label: 'Tub Diameter', type: 'number', required: true,
        unit: 'ft', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number', required: true,
        unit: 'lbs', min: 100
      },
      {
        key: 'conveyorType', label: 'Discharge Conveyor', type: 'select', required: false,
        options: ['Stacking Conveyor', 'Radial Conveyor', 'Fixed Conveyor']
      },
      {
        key: 'productionRateTph', label: 'Production Rate', type: 'number', required: false,
        unit: 'tph', min: 0.1
      },
    ],
    attachmentOptions: [
      'Magnet', 'Screen Package', 'Loader', 'Remote Control',
      'Cross Belt Magnet', 'Spare Hammer Set'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'hammerMillChecked', label: 'Hammermill and Mill Housing Checked' },
      { key: 'tubDriveChecked', label: 'Tub Rotation Drive and Bearings Checked' },
    ],
  },

  // ── MATERIAL HANDLERS ─────────────────────────────────────────────────────
  'Material Handlers': {
    displayName: 'Material Handlers',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Cummins QSB6.7'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number', required: true,
        unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Carrier Type', type: 'select', required: true,
        options: ['Tracked', 'Wheeled', 'Rail Mounted', 'Stationary']
      },
      {
        key: 'maxBoomReachFt', label: 'Max Reach', type: 'number', required: true,
        unit: 'ft', min: 1
      },
      {
        key: 'maxLiftCapacityLbs', label: 'Lift Capacity', type: 'number', required: true,
        unit: 'lbs', min: 1
      },
      {
        key: 'cabType', label: 'Cab Type', type: 'select', required: false,
        options: ['Enclosed ROPS/FOPS', 'Elevated Cab', 'Open ROPS']
      },
    ],
    attachmentOptions: [
      'Log Grapple', 'Orange Peel Grapple', 'Magnet', 'Clamshell',
      'Sorting Grapple', 'Cab Riser'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'boomChecked', label: 'Boom, Stick, and Cylinders Checked' },
      { key: 'rotationChecked', label: 'Upper Rotation and Swing Bearing Checked' },
    ],
  },

  // ── SAWMILL MACHINERY ─────────────────────────────────────────────────────
  'Sawmill Machinery': {
    displayName: 'Sawmill Machinery',
    specs: [
      {
        key: 'machineType', label: 'Machine Type', type: 'select', required: true,
        options: ['Edger', 'Resaw', 'Debarker', 'Sharpener', 'Sorter', 'Conveyor']
      },
      {
        key: 'engineType', label: 'Power Source', type: 'select', required: true,
        options: ['Electric', 'Hydraulic-Driven', 'Diesel']
      },
      {
        key: 'horsepower', label: 'Power Rating', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'maxLogDiameterIn', label: 'Max Workpiece Diameter', type: 'number', required: false,
        unit: 'in', min: 1
      },
      {
        key: 'productionRateBfHr', label: 'Production Rate', type: 'number', required: false,
        unit: 'bf/hr', min: 1
      },
      {
        key: 'weight', label: 'Machine Weight', type: 'number', required: false,
        unit: 'lbs'
      },
    ],
    attachmentOptions: [
      'Infeed Deck', 'Outfeed Conveyor', 'Laser Setworks',
      'Hydraulic Power Unit', 'Dust Collection Port', 'Control Console'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'alignmentChecked', label: 'Machine Alignment and Calibration Checked' },
      { key: 'driveSystemChecked', label: 'Motors, Belts, and Drive Components Checked' },
    ],
  },

  // ── DOZERS WITH WINCH ─────────────────────────────────────────────────────
  'Dozers With Winch': {
    displayName: 'Dozers With Winch',
    specs: [
      {
        key: 'engine', label: 'Engine', type: 'text', required: true,
        placeholder: 'e.g. Komatsu SAA6D114E'
      },
      {
        key: 'horsepower', label: 'Horsepower', type: 'number', required: true,
        unit: 'hp', min: 1
      },
      {
        key: 'weight', label: 'Operating Weight', type: 'number', required: true,
        unit: 'lbs', min: 100
      },
      {
        key: 'driveType', label: 'Undercarriage Type', type: 'select', required: true,
        options: ['Crawler', 'LGP Crawler']
      },
      {
        key: 'bladeType', label: 'Blade Type', type: 'select', required: true,
        options: ['S-Blade', 'U-Blade', 'Semi-U Blade', 'PAT / 6-Way Blade']
      },
      {
        key: 'winchCapacityLbs', label: 'Winch Pull Capacity', type: 'number', required: true,
        unit: 'lbs', min: 1
      },
      {
        key: 'transmission', label: 'Transmission', type: 'text', required: false,
        placeholder: 'e.g. Power Shift'
      },
    ],
    attachmentOptions: [
      'Forestry Winch', 'Arch', 'Ripper', 'Brush Guard',
      'Sweeps', 'Front Fairlead', 'Rear Counterweight'
    ],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'winchChecked', label: 'Winch Drum, Cable, and Controls Checked' },
      { key: 'undercarriageTrackChecked', label: 'Track Chain, Rollers, and Sprockets Checked' },
    ],
  },

  // ── CONVEYORS ─────────────────────────────────────────────────────────────
  Conveyors: {
    displayName: 'Conveyors',
    specs: [
      { key: 'driveType', label: 'Conveyor Type', type: 'select', required: true, options: ['Belt Conveyor', 'Chain Conveyor', 'Live Deck', 'Elevator Conveyor'] },
      { key: 'conveyorLengthFt', label: 'Conveyor Length', type: 'number', required: true, unit: 'ft', min: 1 },
      { key: 'engineType', label: 'Power Source', type: 'select', required: true, options: ['Hydraulic', 'Electric', 'Gas / Diesel'] },
      { key: 'weight', label: 'Machine Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: ['Hopper', 'Discharge Chute', 'Wheels / Axle', 'Height Adjust Kit'],
    checklist: [
      { key: 'beltChecked', label: 'Belt/Chain Condition Checked' },
      { key: 'driveSystemChecked', label: 'Drive Motor and Gearbox Checked' },
    ],
  },

  // ── SPLITTERS ─────────────────────────────────────────────────────────────
  Splitters: {
    displayName: 'Splitters',
    specs: [
      { key: 'engineType', label: 'Power Source', type: 'select', required: true, options: ['Gas / Petrol', 'Diesel', 'Electric', 'PTO-Powered'] },
      { key: 'splittingForceTons', label: 'Splitting Force', type: 'number', required: true, unit: 'tons', min: 1 },
      { key: 'wedgePattern', label: 'Wedge Pattern', type: 'select', required: true, options: ['2-Way', '4-Way', '6-Way', '8-Way', 'Adjustable'] },
      { key: 'cycleTimeSec', label: 'Cycle Time', type: 'number', required: false, unit: 'sec', min: 0.1 },
      { key: 'maxLogDiameterIn', label: 'Max Log Diameter', type: 'number', required: false, unit: 'in', min: 1 },
    ],
    attachmentOptions: ['Log Lift', 'Trailer Package', 'Auto Return Valve', 'Table Extension'],
    checklist: [
      { key: 'splitterChecked', label: 'Wedge and Cylinder Checked' },
      { key: 'hydraulicSystemChecked', label: 'Hydraulic Hoses and Pump Checked' },
    ],
  },

  // ── GENERATORS ────────────────────────────────────────────────────────────
  Generators: {
    displayName: 'Generators',
    specs: [
      { key: 'engineType', label: 'Fuel Type', type: 'select', required: true, options: ['Diesel', 'Gas', 'Natural Gas', 'Dual Fuel'] },
      { key: 'powerOutputKw', label: 'Prime Power Output', type: 'number', required: true, unit: 'kW', min: 1 },
      { key: 'weight', label: 'Unit Weight', type: 'number', required: false, unit: 'lbs' },
      { key: 'driveType', label: 'Mount Type', type: 'select', required: false, options: ['Skid Mount', 'Trailer Mount', 'Containerized'] },
    ],
    attachmentOptions: ['ATS Panel', 'Fuel Tank', 'Sound Attenuation Enclosure', 'Distribution Panel'],
    checklist: [
      { key: 'engineChecked', label: 'Engine Starts and Runs Properly' },
      { key: 'electricalChecked', label: 'Output Voltage and Frequency Checked' },
    ],
  },

  // ── POWERSCREENS ──────────────────────────────────────────────────────────
  Powerscreens: {
    displayName: 'Powerscreens',
    specs: [
      { key: 'driveType', label: 'Machine Type', type: 'select', required: true, options: ['Tracked Screener', 'Wheeled Screener', 'Portable Screener'] },
      { key: 'screenDeckCount', label: 'Screen Deck Count', type: 'number', required: true, min: 1 },
      { key: 'engineType', label: 'Power Source', type: 'select', required: true, options: ['Diesel', 'Electric', 'Hybrid'] },
      { key: 'productionRateTph', label: 'Production Rate', type: 'number', required: false, unit: 'tph', min: 1 },
      { key: 'weight', label: 'Operating Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: ['Scalp Screen', 'Fines Screen', 'Stockpile Conveyor', 'Remote Control'],
    checklist: [
      { key: 'screenDeckChecked', label: 'Screen Decks and Bearings Checked' },
      { key: 'conveyorChecked', label: 'Conveyors and Belts Checked' },
    ],
  },

  // ── ATTACHMENTS ───────────────────────────────────────────────────────────
  Attachments: {
    displayName: 'Attachments',
    specs: [
      { key: 'partNumber', label: 'Part Number', type: 'text', required: true },
      { key: 'fitment', label: 'Fitment', type: 'text', required: true, placeholder: 'Compatible machine makes/models' },
      { key: 'conditionGrade', label: 'Condition Grade', type: 'select', required: true, options: ['New', 'Used', 'Rebuilt'] },
      { key: 'weight', label: 'Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: [],
    checklist: [...PARTS_CONDITION_CHECKLIST],
  },

  // ── LIFTS ─────────────────────────────────────────────────────────────────
  Lifts: {
    displayName: 'Lifts',
    specs: [
      { key: 'driveType', label: 'Lift Type', type: 'select', required: true, options: ['Boom Lift', 'Scissor Lift', 'Bucket Lift'] },
      { key: 'maxBoomReachFt', label: 'Working Height', type: 'number', required: true, unit: 'ft', min: 1 },
      { key: 'engineType', label: 'Power Source', type: 'select', required: true, options: ['Diesel', 'Gas', 'Electric', 'Hybrid'] },
      { key: 'weight', label: 'Operating Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: ['Jib', 'Outriggers', 'Platform Extension'],
    checklist: [
      { key: 'boomChecked', label: 'Boom / Platform Controls Checked' },
      { key: 'safetyInterlockChecked', label: 'Safety Interlocks and Alarms Checked' },
    ],
  },

  // ── TRIMMERS ──────────────────────────────────────────────────────────────
  Trimmers: {
    displayName: 'Trimmers',
    specs: [
      { key: 'engineType', label: 'Power Source', type: 'select', required: true, options: ['Gas / Petrol', 'Diesel', 'Hydraulic-Driven'] },
      { key: 'horsepower', label: 'Power Rating', type: 'number', required: true, unit: 'hp', min: 1 },
      { key: 'driveType', label: 'Trimmer Type', type: 'select', required: true, options: ['Boom Trimmer', 'Brush Trimmer', 'Flail Trimmer'] },
      { key: 'maxBoomReachFt', label: 'Reach', type: 'number', required: false, unit: 'ft', min: 1 },
      { key: 'weight', label: 'Machine Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: ['Flail Head', 'Saw Head', 'Debris Deflector', 'Guarding Package'],
    checklist: [
      { key: 'headChecked', label: 'Cutting Head and Drive Checked' },
      { key: 'hydraulicSystemChecked', label: 'Hydraulic System Checked' },
    ],
  },

  // ── DUMP TRUCKS ───────────────────────────────────────────────────────────
  'Dump Trucks': {
    displayName: 'Dump Trucks',
    specs: [
      { key: 'engine', label: 'Engine', type: 'text', required: true },
      { key: 'horsepower', label: 'Horsepower', type: 'number', required: true, unit: 'hp', min: 1 },
      { key: 'driveType', label: 'Axle Configuration', type: 'select', required: true, options: ['4x2', '6x4', '8x4'] },
      { key: 'weight', label: 'GVWR', type: 'number', required: true, unit: 'lbs', min: 1 },
      { key: 'bodyCapacityYd3', label: 'Body Capacity', type: 'number', required: false, unit: 'yd3', min: 1 },
      { key: 'transmission', label: 'Transmission', type: 'text', required: false },
    ],
    attachmentOptions: ['Tailgate', 'PTO', 'Tarp System', 'Lift Axle'],
    checklist: [
      ...COMMON_CHECKLIST,
      { key: 'hoistChecked', label: 'Dump Hoist and Cylinders Checked' },
      { key: 'brakeChecked', label: 'Brake System Checked' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Fallback schema for categories not explicitly defined above
// ─────────────────────────────────────────────────────────────────────────────
export const GENERIC_SCHEMA: CategorySchema = {
  displayName: 'Equipment',
  specs: [
    { key: 'engine',      label: 'Engine',              type: 'text',   required: false },
    { key: 'horsepower',  label: 'Horsepower',          type: 'number', required: false, unit: 'hp' },
    { key: 'weight',      label: 'Operating Weight',    type: 'number', required: false, unit: 'lbs' },
    { key: 'driveType',   label: 'Drive Type',          type: 'text',   required: false },
  ],
  attachmentOptions: [],
  checklist: [...COMMON_CHECKLIST],
};

const TOP_LEVEL_CATEGORY_SCHEMAS: Record<string, CategorySchema> = {
  'Logging Equipment': {
    displayName: 'Logging Equipment',
    specs: [
      { key: 'engine', label: 'Engine', type: 'text', required: true, placeholder: 'Engine make and model' },
      { key: 'horsepower', label: 'Horsepower', type: 'number', required: true, unit: 'hp', min: 1 },
      { key: 'weight', label: 'Operating Weight', type: 'number', required: true, unit: 'lbs', min: 1 },
      { key: 'driveType', label: 'Drive Type', type: 'text', required: false },
      { key: 'attachments', label: 'Attachments', type: 'text', required: false },
    ],
    attachmentOptions: ['Grapple', 'Winch', 'Dozer Blade', 'Saw Head', 'Delimber', 'Tracks'],
    checklist: [...COMMON_CHECKLIST],
  },
  'Land Clearing Equipment': {
    displayName: 'Land Clearing Equipment',
    specs: [
      { key: 'engine', label: 'Engine', type: 'text', required: true },
      { key: 'horsepower', label: 'Horsepower', type: 'number', required: true, unit: 'hp', min: 1 },
      { key: 'weight', label: 'Operating Weight', type: 'number', required: true, unit: 'lbs', min: 1 },
      { key: 'driveType', label: 'Drive Type', type: 'text', required: false },
      { key: 'attachments', label: 'Attachments', type: 'text', required: false },
    ],
    attachmentOptions: ['Mulcher Head', 'Ripper', 'Bucket', 'Grapple', 'Thumb', 'Winch'],
    checklist: [...COMMON_CHECKLIST],
  },
  'Firewood Equipment': {
    displayName: 'Firewood Equipment',
    specs: [
      { key: 'engineType', label: 'Power Source', type: 'text', required: true },
      { key: 'horsepower', label: 'Power Rating', type: 'number', required: true, unit: 'hp', min: 1 },
      { key: 'maxLogDiameterIn', label: 'Max Log Diameter', type: 'number', required: false, unit: 'in', min: 1 },
      { key: 'splittingForceTons', label: 'Splitting Force', type: 'number', required: false, unit: 'tons', min: 1 },
      { key: 'weight', label: 'Machine Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: ['Infeed Deck', 'Outfeed Conveyor', 'Tumbler', 'Wedge Kit', 'Bag Filler'],
    checklist: [...COMMON_CHECKLIST],
  },
  'Trucks': {
    displayName: 'Trucks',
    specs: [
      { key: 'engine', label: 'Engine', type: 'text', required: true },
      { key: 'horsepower', label: 'Horsepower', type: 'number', required: true, unit: 'hp', min: 1 },
      { key: 'driveType', label: 'Axle / Drive', type: 'text', required: false, placeholder: 'e.g. 4x2, 6x4' },
      { key: 'weight', label: 'GVWR / Weight', type: 'number', required: false, unit: 'lbs' },
      { key: 'transmission', label: 'Transmission', type: 'text', required: false },
    ],
    attachmentOptions: ['Grapple Loader', 'Log Bunks', 'Dump Body', 'PTO', 'Pup Trailer'],
    checklist: [...COMMON_CHECKLIST],
  },
  'Trailers': {
    displayName: 'Trailers',
    specs: [
      { key: 'weight', label: 'Trailer Weight', type: 'number', required: false, unit: 'lbs' },
      { key: 'loadCapacityLbs', label: 'Load Capacity', type: 'number', required: true, unit: 'lbs', min: 1 },
      { key: 'axleCount', label: 'Axle Count', type: 'number', required: true, min: 1 },
      { key: 'driveType', label: 'Configuration', type: 'text', required: false, placeholder: 'e.g. Tandem, Tri-axle' },
    ],
    attachmentOptions: ['Stakes', 'Bunks', 'Ramps', 'Winch', 'Toolbox'],
    checklist: [...TRAILER_CONDITION_CHECKLIST],
  },
  'Sawmill Equipment': {
    displayName: 'Sawmill Equipment',
    specs: [
      { key: 'engineType', label: 'Power Source', type: 'text', required: true },
      { key: 'horsepower', label: 'Power Rating', type: 'number', required: false, unit: 'hp', min: 1 },
      { key: 'maxLogDiameterIn', label: 'Max Log Diameter', type: 'number', required: false, unit: 'in', min: 1 },
      { key: 'maxLogLengthIn', label: 'Max Log Length', type: 'number', required: false, unit: 'in', min: 1 },
      { key: 'weight', label: 'Machine Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: ['Hydraulic Log Loader', 'Debarker', 'Edger', 'Setworks'],
    checklist: [...COMMON_CHECKLIST],
  },
  'Tree Service Equipment': {
    displayName: 'Tree Service Equipment',
    specs: [
      { key: 'engine', label: 'Engine', type: 'text', required: true },
      { key: 'horsepower', label: 'Horsepower', type: 'number', required: false, unit: 'hp', min: 1 },
      { key: 'weight', label: 'Operating Weight', type: 'number', required: false, unit: 'lbs' },
      { key: 'maxBoomReachFt', label: 'Reach Height / Boom Reach', type: 'number', required: false, unit: 'ft', min: 1 },
      { key: 'driveType', label: 'Platform Type', type: 'text', required: false },
    ],
    attachmentOptions: ['Bucket', 'Crane', 'Outriggers', 'Stump Grinder Head', 'Chipper Feed Table'],
    checklist: [...COMMON_CHECKLIST],
  },
  'Parts And Attachments': {
    displayName: 'Parts And Attachments',
    specs: [
      { key: 'partNumber', label: 'Part Number', type: 'text', required: true },
      { key: 'fitment', label: 'Fitment', type: 'text', required: true, placeholder: 'Compatible machines or series' },
      { key: 'conditionGrade', label: 'Condition Grade', type: 'select', required: true, options: ['New', 'Used', 'Rebuilt'] },
      { key: 'weight', label: 'Weight', type: 'number', required: false, unit: 'lbs' },
    ],
    attachmentOptions: [],
    checklist: [...PARTS_CONDITION_CHECKLIST],
  },
};

const SUBCATEGORY_SCHEMA_ALIASES: Record<string, string> = {
  // Firewood variants
  Tumblers: 'Conveyors',
  Bundlers: 'Conveyors',

  // Land clearing variants
  Backhoes: 'Excavators',

  // Logging variants
  'Bogie Skidders': 'Skidders',
  'Combo Harvester/Forwarder': 'Forwarders',
  'Wood Chippers': 'Chippers',
  'Slasher Saws': 'Delimbers',
  Yarders: 'Dozers With Winch',

  // Parts variants
  Grapples: 'Attachments',
  'Grapple Saws': 'Attachments',
  'Masticating Heads': 'Attachments',
  Winches: 'Attachments',

  // Trailer variants
  'Flatbed / Dropdeck Trailers': 'Lowboy Trailers',

  // Tree service variants
  Trimmers: 'Trimmers',

  // Truck variants
  'Chip Trucks': 'Log Trucks',
  'Day Cab Trucks': 'Log Trucks',
  'Grapple Trucks': 'Log Trucks',
  Lifts: 'Lifts',
};

/** Returns the schema for a category, falling back to GENERIC_SCHEMA. */
export function getSchemaForCategory(category: string): CategorySchema {
  return CATEGORY_SCHEMAS[category] ?? GENERIC_SCHEMA;
}

export function getSchemaForListing(topLevelCategory: string, subcategory?: string): CategorySchema {
  if (subcategory && CATEGORY_SCHEMAS[subcategory]) {
    return CATEGORY_SCHEMAS[subcategory];
  }

  if (subcategory && SUBCATEGORY_SCHEMA_ALIASES[subcategory]) {
    const aliasKey = SUBCATEGORY_SCHEMA_ALIASES[subcategory];
    const aliasedSchema = CATEGORY_SCHEMAS[aliasKey];
    if (aliasedSchema) {
      return {
        ...aliasedSchema,
        displayName: subcategory,
      };
    }
  }

  const topLevelSchema = TOP_LEVEL_CATEGORY_SCHEMAS[topLevelCategory];
  if (topLevelSchema) {
    return {
      ...topLevelSchema,
      displayName: subcategory || topLevelSchema.displayName,
    };
  }

  if (subcategory && CATEGORY_SCHEMAS[topLevelCategory]) {
    return {
      ...CATEGORY_SCHEMAS[topLevelCategory],
      displayName: subcategory,
    };
  }

  return {
    ...GENERIC_SCHEMA,
    displayName: subcategory || topLevelCategory || GENERIC_SCHEMA.displayName,
  };
}

/**
 * Returns the keys of all required spec fields for a given category.
 * Used by equipmentService.REQUIRED_SPECS_BY_CATEGORY.
 */
export function getRequiredSpecKeys(categoryOrTopLevel: string, subcategory?: string): string[] {
  const schema = subcategory
    ? getSchemaForListing(categoryOrTopLevel, subcategory)
    : getSchemaForCategory(categoryOrTopLevel);

  return schema
    .specs.filter((f) => f.required)
    .map((f) => f.key);
}
