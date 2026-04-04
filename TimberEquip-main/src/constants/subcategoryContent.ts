import { EQUIPMENT_TAXONOMY } from './equipmentData';

export interface SubcategoryExplainerContent {
  overview: string;
  buyingTips?: string[];
}

const SUBCATEGORY_CONTENT: Record<string, SubcategoryExplainerContent> = {
  'Feller Bunchers': {
    overview: 'Feller bunchers are mechanized forestry machines that cut and gather trees before felling them in a controlled direction. Available in tracked and wheeled configurations, they are essential for high-production logging operations.',
    buyingTips: ['Check undercarriage/tire condition and hours', 'Verify saw head or shear head condition', 'Look for updated hydraulic systems and controls'],
  },
  'Skidders': {
    overview: 'Skidders are used to pull felled trees from the stump to a landing or roadside for processing. Cable skidders and grapple skidders are the two primary configurations used in logging.',
    buyingTips: ['Inspect grapple or winch condition', 'Check tire or track wear', 'Verify transmission and drivetrain health'],
  },
  'Harvesters': {
    overview: 'Harvesters are cut-to-length forestry machines that fell, delimb, and buck trees into logs in a single pass. They are widely used in Scandinavian-style logging operations and thinning.',
    buyingTips: ['Examine harvester head condition and feed roller wear', 'Check measuring system calibration', 'Look at boom and swing bearing condition'],
  },
  'Forwarders': {
    overview: 'Forwarders carry logs from the stump area to the roadside landing. Unlike skidders that drag logs, forwarders lift and carry them, reducing soil disturbance.',
    buyingTips: ['Inspect bunk and grapple condition', 'Check crane and boom for cracks or leaks', 'Verify load capacity and tire/bogie condition'],
  },
  'Log Loaders': {
    overview: 'Log loaders are knuckleboom or heel-boom machines used to sort, stack, and load logs onto trucks at landings and mill yards.',
    buyingTips: ['Check boom cylinders and pins for wear', 'Inspect rotator and grapple', 'Verify swing bearing and track/carrier condition'],
  },
  'Chippers': {
    overview: 'Wood chippers reduce logs, branches, and brush into chips for biomass, mulch, or disposal. Available as drum, disc, or whole-tree configurations.',
    buyingTips: ['Inspect knives and anvil condition', 'Check feed system rollers and hydraulics', 'Verify engine hours and discharge system'],
  },
  'Grinders': {
    overview: 'Horizontal and tub grinders process wood waste, stumps, and brush into mulch, compost, or biomass fuel. Used in land clearing, recycling, and biomass operations.',
    buyingTips: ['Check hammermill or cutter condition', 'Inspect screen and discharge conveyor', 'Verify engine and hydraulic system hours'],
  },
  'Mulchers': {
    overview: 'Forestry mulchers are attachments or self-propelled machines that clear brush, small trees, and vegetation. Used for land clearing, right-of-way maintenance, and site preparation.',
    buyingTips: ['Inspect teeth or flail condition', 'Check rotor bearing and drive system', 'Verify carrier compatibility and hydraulic flow requirements'],
  },
  'Firewood Processors': {
    overview: 'Firewood processors automate the cutting and splitting of firewood from logs. They combine a saw, conveyor, and splitter into a single machine for commercial firewood production.',
    buyingTips: ['Check saw blade and splitting wedge condition', 'Inspect conveyor chain and hydraulic system', 'Verify processing speed and log diameter capacity'],
  },
  'Splitters': {
    overview: 'Log splitters use hydraulic force to split rounds into firewood. Available in horizontal, vertical, and combination configurations from residential to commercial capacities.',
    buyingTips: ['Check cylinder and wedge condition', 'Verify cycle time and tonnage rating', 'Inspect hydraulic hoses and pump'],
  },
  'Sawmills': {
    overview: 'Portable and stationary sawmills convert logs into lumber. Band sawmills, circular sawmills, and chainsaw mills serve different production scales.',
    buyingTips: ['Inspect blade guides and bearings', 'Check bed and rail alignment', 'Verify blade tension and tracking systems'],
  },
  'Stump Grinders': {
    overview: 'Stump grinders remove tree stumps by chipping the wood into small pieces. Available as self-propelled, tow-behind, and excavator-mounted configurations.',
    buyingTips: ['Check cutting wheel and teeth condition', 'Inspect hydraulic drive system', 'Verify ground clearance and transport width'],
  },
  'Bucket Trucks': {
    overview: 'Bucket trucks (aerial lifts) provide elevated access for tree trimming, removal, and utility line work. Available with insulated or non-insulated booms.',
    buyingTips: ['Verify boom inspection and certification status', 'Check bucket condition and controls', 'Inspect outriggers and leveling system'],
  },
  'Conveyors': {
    overview: 'Firewood conveyors transport split firewood from the processor to a truck or storage pile. Available in various lengths and configurations for efficient firewood handling.',
    buyingTips: ['Inspect chain and slat condition', 'Check motor and drive system', 'Verify length and height adjustment range'],
  },
};

/**
 * Returns the parent category for a given subcategory name.
 * e.g., "Feller Bunchers" → "Logging Equipment"
 */
export function getParentCategory(subcategoryName: string): string | null {
  const taxonomy = EQUIPMENT_TAXONOMY as Record<string, Record<string, unknown>>;
  for (const [parent, subcategories] of Object.entries(taxonomy)) {
    if (Object.keys(subcategories).includes(subcategoryName)) {
      return parent;
    }
  }
  return null;
}

/**
 * Returns explainer content for a subcategory, or null if none exists.
 */
export function getSubcategoryContent(name: string): SubcategoryExplainerContent | undefined {
  return SUBCATEGORY_CONTENT[name];
}
