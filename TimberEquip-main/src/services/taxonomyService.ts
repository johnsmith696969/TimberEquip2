import { EQUIPMENT_TAXONOMY } from '../constants/equipmentData';

export type EquipmentTaxonomy = Record<string, Record<string, string[]>>;
export type FullEquipmentTaxonomy = Record<string, Record<string, Record<string, string[]>>>;

interface TaxonomyResponse {
  taxonomy?: EquipmentTaxonomy;
}

let taxonomyCache: EquipmentTaxonomy | null = null;
let fullTaxonomyCache: FullEquipmentTaxonomy | null = null;
const taxonomyAssetUrl = new URL('../../final_taxonomy_with_manufacturer_buying_guides.json', import.meta.url).href;

const EMPTY_FULL_TAXONOMY: FullEquipmentTaxonomy = {};

function cloneBundledTaxonomy(): EquipmentTaxonomy {
  const cloned: EquipmentTaxonomy = {};

  Object.entries(EQUIPMENT_TAXONOMY).forEach(([category, subcategories]) => {
    cloned[category] = {};
    Object.entries(subcategories).forEach(([subcategory, manufacturers]) => {
      cloned[category][subcategory] = [...manufacturers];
    });
  });

  return cloned;
}

function buildFullTaxonomyFallback(): FullEquipmentTaxonomy {
  const full: FullEquipmentTaxonomy = {};
  Object.entries(EQUIPMENT_TAXONOMY).forEach(([category, subcategoryMap]) => {
    full[category] = {};
    Object.entries(subcategoryMap).forEach(([subcategory, manufacturers]) => {
      full[category][subcategory] = Object.fromEntries(
        manufacturers.map((manufacturer) => [manufacturer, [] as string[]])
      );
    });
  });
  return full;
}

function normalizeFullTaxonomy(raw: unknown): FullEquipmentTaxonomy {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_FULL_TAXONOMY;
  }

  const normalized: FullEquipmentTaxonomy = {};

  for (const [category, subcategoryMap] of Object.entries(raw as Record<string, unknown>)) {
    if (!subcategoryMap || typeof subcategoryMap !== 'object') continue;

    const subcategories: Record<string, Record<string, string[]>> = {};

    for (const [subcategory, manufacturers] of Object.entries(subcategoryMap as Record<string, unknown>)) {
      if (!manufacturers || typeof manufacturers !== 'object') continue;

      const makeMap: Record<string, string[]> = {};
      for (const [manufacturer, models] of Object.entries(manufacturers as Record<string, unknown>)) {
        const modelList = Array.isArray(models)
          ? models
              .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
              .map((value) => value.trim())
          : [];

        if (manufacturer.trim().length > 0) {
          makeMap[manufacturer.trim()] = modelList;
        }
      }

      if (Object.keys(makeMap).length > 0) {
        subcategories[subcategory] = makeMap;
      }
    }

    if (Object.keys(subcategories).length > 0) {
      normalized[category] = subcategories;
    }
  }

  return normalized;
}

function normalizeTaxonomy(raw: unknown): EquipmentTaxonomy {
  const full = normalizeFullTaxonomy(raw);
  const reduced: EquipmentTaxonomy = {};

  Object.entries(full).forEach(([category, subcategoryMap]) => {
    reduced[category] = {};
    Object.entries(subcategoryMap).forEach(([subcategory, makeMap]) => {
      reduced[category][subcategory] = Object.keys(makeMap);
    });
  });

  return Object.keys(reduced).length > 0 ? reduced : cloneBundledTaxonomy();
}

export const taxonomyService = {
  async getTaxonomy(): Promise<EquipmentTaxonomy> {
    if (taxonomyCache) {
      return taxonomyCache;
    }

    try {
      const response = await fetch(taxonomyAssetUrl);
      if (!response.ok) {
        taxonomyCache = cloneBundledTaxonomy();
        return taxonomyCache;
      }

      const payload = (await response.json()) as TaxonomyResponse;
      taxonomyCache = normalizeTaxonomy(payload.taxonomy);
      return taxonomyCache;
    } catch (error) {
      console.error('Failed to load taxonomy file, falling back to bundled taxonomy:', error);
      taxonomyCache = cloneBundledTaxonomy();
      return taxonomyCache;
    }
  },

  async getFullTaxonomy(): Promise<FullEquipmentTaxonomy> {
    if (fullTaxonomyCache) {
      return fullTaxonomyCache;
    }

    try {
      const response = await fetch(taxonomyAssetUrl);
      if (!response.ok) {
        fullTaxonomyCache = buildFullTaxonomyFallback();
        return fullTaxonomyCache;
      }

      const payload = (await response.json()) as { taxonomy?: unknown };
      const normalized = normalizeFullTaxonomy(payload.taxonomy);
      fullTaxonomyCache = Object.keys(normalized).length > 0 ? normalized : buildFullTaxonomyFallback();
      return fullTaxonomyCache;
    } catch (error) {
      console.error('Failed to load full taxonomy file, falling back to bundled taxonomy:', error);
      fullTaxonomyCache = buildFullTaxonomyFallback();
      return fullTaxonomyCache;
    }
  },

  clearCache(): void {
    taxonomyCache = null;
    fullTaxonomyCache = null;
  },
};
