import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { EQUIPMENT_TAXONOMY } from '../constants/equipmentData';

export type EquipmentTaxonomy = Record<string, Record<string, string[]>>;
export type FullEquipmentTaxonomy = Record<string, Record<string, Record<string, string[]>>>;

interface TaxonomyResponse {
  taxonomy?: EquipmentTaxonomy;
}

interface RuntimeTaxonomyDocument {
  overrides?: unknown;
  removals?: {
    categories?: string[];
    subcategories?: Record<string, string[]>;
    manufacturers?: Record<string, Record<string, string[]>>;
    models?: Record<string, Record<string, Record<string, string[]>>>;
  };
}

interface TaxonomyRemovals {
  categories: string[];
  subcategories: Record<string, string[]>;
  manufacturers: Record<string, Record<string, string[]>>;
  models: Record<string, Record<string, Record<string, string[]>>>;
}

const EMPTY_REMOVALS: TaxonomyRemovals = {
  categories: [],
  subcategories: {},
  manufacturers: {},
  models: {},
};

let taxonomyCache: EquipmentTaxonomy | null = null;
let fullTaxonomyCache: FullEquipmentTaxonomy | null = null;
const taxonomyAssetUrl = new URL('../../final_taxonomy_with_manufacturer_buying_guides.json', import.meta.url).href;
const RUNTIME_TAXONOMY_DOC_PATH = ['publicConfigs', 'equipmentTaxonomy'] as const;

const EMPTY_FULL_TAXONOMY: FullEquipmentTaxonomy = {};

function normalizeLabel(value: unknown): string {
  return String(value || '').trim();
}

function hasOwnValue(record: Record<string, unknown>, candidate: string): boolean {
  const normalizedCandidate = candidate.trim().toLowerCase();
  return Object.keys(record).some((key) => key.trim().toLowerCase() === normalizedCandidate);
}

function findMatchingKey<T>(record: Record<string, T> | undefined, candidate: string): string {
  const normalizedCandidate = candidate.trim().toLowerCase();
  if (!record || !normalizedCandidate) return '';
  return Object.keys(record).find((key) => key.trim().toLowerCase() === normalizedCandidate) || '';
}

function cloneRemovals(removals: TaxonomyRemovals): TaxonomyRemovals {
  const manufacturers: TaxonomyRemovals['manufacturers'] = {};
  Object.entries(removals.manufacturers).forEach(([category, subcategoryMap]) => {
    manufacturers[category] = {};
    Object.entries(subcategoryMap).forEach(([subcategory, makes]) => {
      manufacturers[category][subcategory] = [...makes];
    });
  });

  const models: TaxonomyRemovals['models'] = {};
  Object.entries(removals.models).forEach(([category, subcategoryMap]) => {
    models[category] = {};
    Object.entries(subcategoryMap).forEach(([subcategory, makeMap]) => {
      models[category][subcategory] = {};
      Object.entries(makeMap).forEach(([manufacturer, modelList]) => {
        models[category][subcategory][manufacturer] = [...modelList];
      });
    });
  });

  return {
    categories: [...removals.categories],
    subcategories: Object.fromEntries(
      Object.entries(removals.subcategories).map(([category, subcategories]) => [category, [...subcategories]])
    ),
    manufacturers,
    models,
  };
}

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

function cloneFullTaxonomy(taxonomy: FullEquipmentTaxonomy): FullEquipmentTaxonomy {
  const cloned: FullEquipmentTaxonomy = {};

  Object.entries(taxonomy).forEach(([category, subcategories]) => {
    cloned[category] = {};
    Object.entries(subcategories).forEach(([subcategory, manufacturers]) => {
      cloned[category][subcategory] = {};
      Object.entries(manufacturers).forEach(([manufacturer, models]) => {
        cloned[category][subcategory][manufacturer] = [...models];
      });
    });
  });

  return cloned;
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

      const normalizedSubcategory = subcategory.trim();
      if (normalizedSubcategory.length > 0) {
        subcategories[normalizedSubcategory] = makeMap;
      }
    }

    const normalizedCategory = category.trim();
    if (normalizedCategory.length > 0) {
      normalized[normalizedCategory] = subcategories;
    }
  }

  return normalized;
}

function normalizeRemovals(raw: unknown): TaxonomyRemovals {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_REMOVALS };
  const data = raw as Record<string, unknown>;

  const normalizeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().toLowerCase()) : [];

  const categories = normalizeStringArray(data.categories);

  const subcategories: Record<string, string[]> = {};
  if (data.subcategories && typeof data.subcategories === 'object') {
    for (const [category, subs] of Object.entries(data.subcategories as Record<string, unknown>)) {
      subcategories[category.trim().toLowerCase()] = normalizeStringArray(subs);
    }
  }

  const manufacturers: Record<string, Record<string, string[]>> = {};
  if (data.manufacturers && typeof data.manufacturers === 'object') {
    for (const [category, subcategoryMap] of Object.entries(data.manufacturers as Record<string, unknown>)) {
      if (!subcategoryMap || typeof subcategoryMap !== 'object') continue;
      manufacturers[category.trim().toLowerCase()] = {};
      for (const [subcategory, makes] of Object.entries(subcategoryMap as Record<string, unknown>)) {
        manufacturers[category.trim().toLowerCase()][subcategory.trim().toLowerCase()] = normalizeStringArray(makes);
      }
    }
  }

  const models: Record<string, Record<string, Record<string, string[]>>> = {};
  if (data.models && typeof data.models === 'object') {
    for (const [category, subcategoryMap] of Object.entries(data.models as Record<string, unknown>)) {
      if (!subcategoryMap || typeof subcategoryMap !== 'object') continue;
      models[category.trim().toLowerCase()] = {};
      for (const [subcategory, makeMap] of Object.entries(subcategoryMap as Record<string, unknown>)) {
        if (!makeMap || typeof makeMap !== 'object') continue;
        models[category.trim().toLowerCase()][subcategory.trim().toLowerCase()] = {};
        for (const [manufacturer, modelList] of Object.entries(makeMap as Record<string, unknown>)) {
          models[category.trim().toLowerCase()][subcategory.trim().toLowerCase()][manufacturer.trim().toLowerCase()] = normalizeStringArray(modelList);
        }
      }
    }
  }

  return { categories, subcategories, manufacturers, models };
}

function applyRemovals(taxonomy: FullEquipmentTaxonomy, removals: TaxonomyRemovals): FullEquipmentTaxonomy {
  const result = cloneFullTaxonomy(taxonomy);

  for (const category of removals.categories) {
    for (const key of Object.keys(result)) {
      if (key.trim().toLowerCase() === category) {
        delete result[key];
      }
    }
  }

  for (const [removedCategory, removedSubcategories] of Object.entries(removals.subcategories)) {
    for (const categoryKey of Object.keys(result)) {
      if (categoryKey.trim().toLowerCase() !== removedCategory) continue;
      for (const subcategoryKey of Object.keys(result[categoryKey])) {
        if (removedSubcategories.includes(subcategoryKey.trim().toLowerCase())) {
          delete result[categoryKey][subcategoryKey];
        }
      }
    }
  }

  for (const [removedCategory, subcategoryMap] of Object.entries(removals.manufacturers)) {
    for (const categoryKey of Object.keys(result)) {
      if (categoryKey.trim().toLowerCase() !== removedCategory) continue;
      for (const [removedSubcategory, removedMakes] of Object.entries(subcategoryMap)) {
        for (const subcategoryKey of Object.keys(result[categoryKey])) {
          if (subcategoryKey.trim().toLowerCase() !== removedSubcategory) continue;
          for (const makeKey of Object.keys(result[categoryKey][subcategoryKey])) {
            if (removedMakes.includes(makeKey.trim().toLowerCase())) {
              delete result[categoryKey][subcategoryKey][makeKey];
            }
          }
        }
      }
    }
  }

  for (const [removedCategory, subcategoryMap] of Object.entries(removals.models)) {
    for (const categoryKey of Object.keys(result)) {
      if (categoryKey.trim().toLowerCase() !== removedCategory) continue;
      for (const [removedSubcategory, makeMap] of Object.entries(subcategoryMap)) {
        for (const subcategoryKey of Object.keys(result[categoryKey])) {
          if (subcategoryKey.trim().toLowerCase() !== removedSubcategory) continue;
          for (const [removedMake, removedModels] of Object.entries(makeMap)) {
            for (const makeKey of Object.keys(result[categoryKey][subcategoryKey])) {
              if (makeKey.trim().toLowerCase() !== removedMake) continue;
              result[categoryKey][subcategoryKey][makeKey] = result[categoryKey][subcategoryKey][makeKey].filter(
                (model) => !removedModels.includes(model.trim().toLowerCase())
              );
            }
          }
        }
      }
    }
  }

  return result;
}

function mergeFullTaxonomies(base: FullEquipmentTaxonomy, overrides: FullEquipmentTaxonomy): FullEquipmentTaxonomy {
  const merged = cloneFullTaxonomy(base);

  Object.entries(overrides).forEach(([category, subcategories]) => {
    if (!merged[category]) {
      merged[category] = {};
    }

    Object.entries(subcategories).forEach(([subcategory, manufacturers]) => {
      if (!merged[category][subcategory]) {
        merged[category][subcategory] = {};
      }

      Object.entries(manufacturers).forEach(([manufacturer, models]) => {
        const existingModels = merged[category][subcategory][manufacturer] || [];
        const mergedModels = [...existingModels];

        models.forEach((model) => {
          if (!mergedModels.some((existingModel) => existingModel.trim().toLowerCase() === model.trim().toLowerCase())) {
            mergedModels.push(model);
          }
        });

        merged[category][subcategory][manufacturer] = mergedModels;
      });
    });
  });

  return merged;
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

async function loadBundledFullTaxonomy(): Promise<FullEquipmentTaxonomy> {
  try {
    const response = await fetch(taxonomyAssetUrl);
    if (!response.ok) {
      return buildFullTaxonomyFallback();
    }

    const payload = (await response.json()) as { taxonomy?: unknown };
    const normalized = normalizeFullTaxonomy(payload.taxonomy);
    return Object.keys(normalized).length > 0 ? normalized : buildFullTaxonomyFallback();
  } catch (error) {
    console.error('Failed to load full taxonomy file, falling back to bundled taxonomy:', error);
    return buildFullTaxonomyFallback();
  }
}

async function loadRuntimeDocument(): Promise<{ overrides: FullEquipmentTaxonomy; removals: TaxonomyRemovals }> {
  try {
    const snapshot = await getDoc(doc(db, ...RUNTIME_TAXONOMY_DOC_PATH));
    if (!snapshot.exists()) {
      return { overrides: EMPTY_FULL_TAXONOMY, removals: { ...EMPTY_REMOVALS } };
    }

    const payload = snapshot.data() as RuntimeTaxonomyDocument;
    return {
      overrides: normalizeFullTaxonomy(payload.overrides),
      removals: normalizeRemovals(payload.removals),
    };
  } catch (error) {
    console.warn('Failed to load runtime taxonomy overrides. Falling back to bundled taxonomy only.', error);
    return { overrides: EMPTY_FULL_TAXONOMY, removals: { ...EMPTY_REMOVALS } };
  }
}

async function loadMergedFullTaxonomy(): Promise<FullEquipmentTaxonomy> {
  const [jsonTaxonomy, runtimeDocument] = await Promise.all([
    loadBundledFullTaxonomy(),
    loadRuntimeDocument(),
  ]);

  // Start with the static bundled EQUIPMENT_TAXONOMY as the definitive base
  // so that categories/subcategories in equipmentData.ts are never silently lost
  // when the JSON file is missing entries.
  const base = buildFullTaxonomyFallback();
  const withJsonModels = mergeFullTaxonomies(base, jsonTaxonomy);
  const withOverrides = mergeFullTaxonomies(withJsonModels, runtimeDocument.overrides);
  return applyRemovals(withOverrides, runtimeDocument.removals);
}

async function updateRuntimeTaxonomy(
  mutator: (taxonomy: FullEquipmentTaxonomy) => void,
  removalsMutator?: (removals: TaxonomyRemovals) => void
): Promise<FullEquipmentTaxonomy> {
  const runtimeDoc = await loadRuntimeDocument();
  const nextOverrides = cloneFullTaxonomy(runtimeDoc.overrides);
  mutator(nextOverrides);

  const updatePayload: Record<string, unknown> = {
    overrides: normalizeFullTaxonomy(nextOverrides),
    updatedAt: serverTimestamp(),
    updatedByUid: auth.currentUser?.uid || null,
    updatedByEmail: auth.currentUser?.email || null,
  };

  if (removalsMutator) {
    const nextRemovals = cloneRemovals(runtimeDoc.removals);
    removalsMutator(nextRemovals);
    updatePayload.removals = nextRemovals;
  }

  await setDoc(doc(db, ...RUNTIME_TAXONOMY_DOC_PATH), updatePayload, { merge: true });

  taxonomyService.clearCache();
  return taxonomyService.getFullTaxonomy();
}

export const taxonomyService = {
  async getTaxonomy(): Promise<EquipmentTaxonomy> {
    if (taxonomyCache) {
      return taxonomyCache;
    }

    const fullTaxonomy = await this.getFullTaxonomy();
    taxonomyCache = normalizeTaxonomy(fullTaxonomy);
    return taxonomyCache;
  },

  async getFullTaxonomy(): Promise<FullEquipmentTaxonomy> {
    if (fullTaxonomyCache) {
      return fullTaxonomyCache;
    }

    fullTaxonomyCache = await loadMergedFullTaxonomy();
    return fullTaxonomyCache;
  },

  async addCategory(categoryLabel: string): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    if (!category) {
      throw new Error('Category name is required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    if (hasOwnValue(taxonomy as Record<string, unknown>, category)) {
      throw new Error('That category already exists.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        overrides[category] = overrides[category] || {};
      },
      (removals) => {
        removals.categories = removals.categories.filter((entry) => entry !== category.toLowerCase());
      }
    );
  },

  async addSubcategory(categoryLabel: string, subcategoryLabel: string): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    const subcategory = normalizeLabel(subcategoryLabel);

    if (!category || !subcategory) {
      throw new Error('Category and subcategory are required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    const categoryMap = taxonomy[categoryKey];
    if (!categoryKey || !categoryMap) {
      throw new Error('Choose an existing category before adding a subcategory.');
    }
    if (hasOwnValue(categoryMap as Record<string, unknown>, subcategory)) {
      throw new Error('That subcategory already exists in this category.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        overrides[categoryKey] = overrides[categoryKey] || {};
        overrides[categoryKey][subcategory] = overrides[categoryKey][subcategory] || {};
      },
      (removals) => {
        const catKey = categoryKey.toLowerCase();
        const removalKey = subcategory.toLowerCase();
        removals.subcategories[catKey] = (removals.subcategories[catKey] || []).filter((entry) => entry !== removalKey);
        if (removals.subcategories[catKey].length === 0) {
          delete removals.subcategories[catKey];
        }
      }
    );
  },

  async addManufacturer(categoryLabel: string, subcategoryLabel: string, manufacturerLabel: string): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    const subcategory = normalizeLabel(subcategoryLabel);
    const manufacturer = normalizeLabel(manufacturerLabel);

    if (!category || !subcategory || !manufacturer) {
      throw new Error('Category, subcategory, and manufacturer are required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    const subcategoryKey = findMatchingKey(taxonomy[categoryKey], subcategory);
    const subcategoryMap = taxonomy[categoryKey]?.[subcategoryKey];
    if (!categoryKey || !subcategoryKey || !subcategoryMap) {
      throw new Error('Choose an existing category and subcategory before adding a manufacturer.');
    }
    if (hasOwnValue(subcategoryMap as Record<string, unknown>, manufacturer)) {
      throw new Error('That manufacturer already exists in this subcategory.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        overrides[categoryKey] = overrides[categoryKey] || {};
        overrides[categoryKey][subcategoryKey] = overrides[categoryKey][subcategoryKey] || {};
        overrides[categoryKey][subcategoryKey][manufacturer] = overrides[categoryKey][subcategoryKey][manufacturer] || [];
      },
      (removals) => {
        const catKey = categoryKey.toLowerCase();
        const subKey = subcategoryKey.toLowerCase();
        const removalKey = manufacturer.toLowerCase();
        removals.manufacturers[catKey] = removals.manufacturers[catKey] || {};
        removals.manufacturers[catKey][subKey] = (removals.manufacturers[catKey][subKey] || []).filter((entry) => entry !== removalKey);
        if (removals.manufacturers[catKey][subKey].length === 0) {
          delete removals.manufacturers[catKey][subKey];
        }
        if (Object.keys(removals.manufacturers[catKey]).length === 0) {
          delete removals.manufacturers[catKey];
        }
      }
    );
  },

  async addModel(
    categoryLabel: string,
    subcategoryLabel: string,
    manufacturerLabel: string,
    modelLabel: string
  ): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    const subcategory = normalizeLabel(subcategoryLabel);
    const manufacturer = normalizeLabel(manufacturerLabel);
    const model = normalizeLabel(modelLabel);

    if (!category || !subcategory || !manufacturer || !model) {
      throw new Error('Category, subcategory, manufacturer, and model are required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    const subcategoryKey = findMatchingKey(taxonomy[categoryKey], subcategory);
    const manufacturerKey = findMatchingKey(taxonomy[categoryKey]?.[subcategoryKey], manufacturer);
    const modelList = taxonomy[categoryKey]?.[subcategoryKey]?.[manufacturerKey];
    if (!categoryKey || !subcategoryKey || !manufacturerKey || !modelList) {
      throw new Error('Choose an existing category, subcategory, and manufacturer before adding a model.');
    }
    if (modelList.some((existingModel) => existingModel.trim().toLowerCase() === model.toLowerCase())) {
      throw new Error('That model already exists for this manufacturer.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        overrides[categoryKey] = overrides[categoryKey] || {};
        overrides[categoryKey][subcategoryKey] = overrides[categoryKey][subcategoryKey] || {};
        overrides[categoryKey][subcategoryKey][manufacturerKey] = overrides[categoryKey][subcategoryKey][manufacturerKey] || [];
        overrides[categoryKey][subcategoryKey][manufacturerKey].push(model);
      },
      (removals) => {
        const catKey = categoryKey.toLowerCase();
        const subKey = subcategoryKey.toLowerCase();
        const makeKey = manufacturerKey.toLowerCase();
        const removalKey = model.toLowerCase();
        removals.models[catKey] = removals.models[catKey] || {};
        removals.models[catKey][subKey] = removals.models[catKey][subKey] || {};
        removals.models[catKey][subKey][makeKey] = (removals.models[catKey][subKey][makeKey] || []).filter((entry) => entry !== removalKey);
        if (removals.models[catKey][subKey][makeKey].length === 0) {
          delete removals.models[catKey][subKey][makeKey];
        }
        if (Object.keys(removals.models[catKey][subKey]).length === 0) {
          delete removals.models[catKey][subKey];
        }
        if (Object.keys(removals.models[catKey]).length === 0) {
          delete removals.models[catKey];
        }
      }
    );
  },

  async removeCategory(categoryLabel: string): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    if (!category) {
      throw new Error('Category name is required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    if (!categoryKey) {
      throw new Error('That category does not exist.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        for (const key of Object.keys(overrides)) {
          if (key.trim().toLowerCase() === categoryKey.toLowerCase()) {
            delete overrides[key];
          }
        }
      },
      (removals) => {
        const removalKey = categoryKey.toLowerCase();
        if (!removals.categories.includes(removalKey)) {
          removals.categories.push(removalKey);
        }
      }
    );
  },

  async removeSubcategory(categoryLabel: string, subcategoryLabel: string): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    const subcategory = normalizeLabel(subcategoryLabel);
    if (!category || !subcategory) {
      throw new Error('Category and subcategory are required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    const subcategoryKey = findMatchingKey(taxonomy[categoryKey], subcategory);
    if (!categoryKey || !subcategoryKey) {
      throw new Error('That subcategory does not exist in this category.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        const overrideCategoryKey = findMatchingKey(overrides, categoryKey);
        const overrideSubcategoryKey = findMatchingKey(overrides[overrideCategoryKey], subcategoryKey);
        if (overrideCategoryKey && overrideSubcategoryKey) {
          delete overrides[overrideCategoryKey][overrideSubcategoryKey];
        }
      },
      (removals) => {
        const key = categoryKey.toLowerCase();
        const removalKey = subcategoryKey.toLowerCase();
        if (!removals.subcategories[key]) {
          removals.subcategories[key] = [];
        }
        if (!removals.subcategories[key].includes(removalKey)) {
          removals.subcategories[key].push(removalKey);
        }
      }
    );
  },

  async removeManufacturer(
    categoryLabel: string,
    subcategoryLabel: string,
    manufacturerLabel: string
  ): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    const subcategory = normalizeLabel(subcategoryLabel);
    const manufacturer = normalizeLabel(manufacturerLabel);
    if (!category || !subcategory || !manufacturer) {
      throw new Error('Category, subcategory, and manufacturer are required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    const subcategoryKey = findMatchingKey(taxonomy[categoryKey], subcategory);
    const manufacturerKey = findMatchingKey(taxonomy[categoryKey]?.[subcategoryKey], manufacturer);
    if (!categoryKey || !subcategoryKey || !manufacturerKey) {
      throw new Error('That manufacturer does not exist in this subcategory.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        const overrideCategoryKey = findMatchingKey(overrides, categoryKey);
        const overrideSubcategoryKey = findMatchingKey(overrides[overrideCategoryKey], subcategoryKey);
        const overrideManufacturerKey = findMatchingKey(overrides[overrideCategoryKey]?.[overrideSubcategoryKey], manufacturerKey);
        if (overrideCategoryKey && overrideSubcategoryKey && overrideManufacturerKey) {
          delete overrides[overrideCategoryKey][overrideSubcategoryKey][overrideManufacturerKey];
        }
      },
      (removals) => {
        const catKey = categoryKey.toLowerCase();
        const subKey = subcategoryKey.toLowerCase();
        const removalKey = manufacturerKey.toLowerCase();
        if (!removals.manufacturers[catKey]) {
          removals.manufacturers[catKey] = {};
        }
        if (!removals.manufacturers[catKey][subKey]) {
          removals.manufacturers[catKey][subKey] = [];
        }
        if (!removals.manufacturers[catKey][subKey].includes(removalKey)) {
          removals.manufacturers[catKey][subKey].push(removalKey);
        }
      }
    );
  },

  async removeModel(
    categoryLabel: string,
    subcategoryLabel: string,
    manufacturerLabel: string,
    modelLabel: string
  ): Promise<FullEquipmentTaxonomy> {
    const category = normalizeLabel(categoryLabel);
    const subcategory = normalizeLabel(subcategoryLabel);
    const manufacturer = normalizeLabel(manufacturerLabel);
    const model = normalizeLabel(modelLabel);
    if (!category || !subcategory || !manufacturer || !model) {
      throw new Error('Category, subcategory, manufacturer, and model are required.');
    }

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    const subcategoryKey = findMatchingKey(taxonomy[categoryKey], subcategory);
    const manufacturerKey = findMatchingKey(taxonomy[categoryKey]?.[subcategoryKey], manufacturer);
    const modelList = taxonomy[categoryKey]?.[subcategoryKey]?.[manufacturerKey];
    const modelKey = modelList?.find((m) => m.trim().toLowerCase() === model.toLowerCase()) || '';
    if (!modelList || !modelKey) {
      throw new Error('That model does not exist for this manufacturer.');
    }

    return updateRuntimeTaxonomy(
      (overrides) => {
        const overrideCategoryKey = findMatchingKey(overrides, categoryKey);
        const overrideSubcategoryKey = findMatchingKey(overrides[overrideCategoryKey], subcategoryKey);
        const overrideManufacturerKey = findMatchingKey(overrides[overrideCategoryKey]?.[overrideSubcategoryKey], manufacturerKey);
        if (overrideCategoryKey && overrideSubcategoryKey && overrideManufacturerKey) {
          overrides[overrideCategoryKey][overrideSubcategoryKey][overrideManufacturerKey] = overrides[overrideCategoryKey][overrideSubcategoryKey][overrideManufacturerKey].filter(
            (m) => m.trim().toLowerCase() !== modelKey.toLowerCase()
          );
        }
      },
      (removals) => {
        const catKey = categoryKey.toLowerCase();
        const subKey = subcategoryKey.toLowerCase();
        const makeKey = manufacturerKey.toLowerCase();
        const removalKey = modelKey.toLowerCase();
        if (!removals.models[catKey]) removals.models[catKey] = {};
        if (!removals.models[catKey][subKey]) removals.models[catKey][subKey] = {};
        if (!removals.models[catKey][subKey][makeKey]) removals.models[catKey][subKey][makeKey] = [];
        if (!removals.models[catKey][subKey][makeKey].includes(removalKey)) {
          removals.models[catKey][subKey][makeKey].push(removalKey);
        }
      }
    );
  },

  async ensureTaxonomyEntry(
    categoryLabel: string,
    subcategoryLabel: string,
    manufacturerLabel: string,
    modelLabel: string
  ): Promise<void> {
    const category = normalizeLabel(categoryLabel);
    const subcategory = normalizeLabel(subcategoryLabel);
    const manufacturer = normalizeLabel(manufacturerLabel);
    const model = normalizeLabel(modelLabel);

    if (!category || !subcategory || !manufacturer) return;

    const taxonomy = await this.getFullTaxonomy();
    const categoryKey = findMatchingKey(taxonomy, category);
    if (!categoryKey) {
      console.warn(`Skipped taxonomy auto-add for unknown top-level category: ${category}`);
      return;
    }

    const subcategoryKey = findMatchingKey(taxonomy[categoryKey], subcategory) || subcategory;
    const manufacturerKey = findMatchingKey(taxonomy[categoryKey]?.[subcategoryKey], manufacturer) || manufacturer;
    const existingModels = taxonomy[categoryKey]?.[subcategoryKey]?.[manufacturerKey];
    const manufacturerExists = existingModels !== undefined;
    const modelExists = model && existingModels?.some((m) => m.trim().toLowerCase() === model.toLowerCase());

    if (manufacturerExists && (!model || modelExists)) return;

    await updateRuntimeTaxonomy((overrides) => {
      overrides[categoryKey] = overrides[categoryKey] || {};
      overrides[categoryKey][subcategoryKey] = overrides[categoryKey][subcategoryKey] || {};
      overrides[categoryKey][subcategoryKey][manufacturerKey] = overrides[categoryKey][subcategoryKey][manufacturerKey] || [];
      if (model && !overrides[categoryKey][subcategoryKey][manufacturerKey].some((m) => m.trim().toLowerCase() === model.toLowerCase())) {
        overrides[categoryKey][subcategoryKey][manufacturerKey].push(model);
      }
    });
  },

  clearCache(): void {
    taxonomyCache = null;
    fullTaxonomyCache = null;
  },
};
