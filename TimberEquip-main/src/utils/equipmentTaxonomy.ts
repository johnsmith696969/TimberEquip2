import type { Listing } from '../types';
import type { FullEquipmentTaxonomy } from '../services/taxonomyService';

export interface EquipmentTaxonomySelectionInput {
  category?: string | null;
  subcategory?: string | null;
  manufacturer?: string | null;
  model?: string | null;
}

export interface ResolvedEquipmentTaxonomySelection {
  category: string;
  subcategory: string;
  manufacturer: string;
  model: string;
}

const normalizeLabel = (value?: string | null): string => String(value || '').trim().toLowerCase();

const toUniqueSorted = (values: Iterable<string>): string[] =>
  Array.from(new Set(Array.from(values).map((value) => String(value || '').trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );

const findCanonicalLabel = (labels: Iterable<string>, candidate?: string | null): string => {
  const normalizedCandidate = normalizeLabel(candidate);
  if (!normalizedCandidate) return '';

  for (const label of labels) {
    if (normalizeLabel(label) === normalizedCandidate) {
      return label;
    }
  }

  return '';
};

const toNormalizedSet = (values?: string | string[] | null): Set<string> => {
  const arrayValues = Array.isArray(values) ? values : values ? [values] : [];
  return new Set(arrayValues.map((value) => normalizeLabel(value)).filter(Boolean));
};

const getCategorySubcategoryPairs = (
  taxonomy: FullEquipmentTaxonomy,
  subcategoryCandidate?: string | null
): Array<{ category: string; subcategory: string }> => {
  const normalizedSubcategory = normalizeLabel(subcategoryCandidate);
  if (!normalizedSubcategory) return [];

  const matches: Array<{ category: string; subcategory: string }> = [];
  Object.entries(taxonomy).forEach(([category, subcategories]) => {
    Object.keys(subcategories).forEach((subcategory) => {
      if (normalizeLabel(subcategory) === normalizedSubcategory) {
        matches.push({ category, subcategory });
      }
    });
  });
  return matches;
};

const getSubcategoryCandidatesForCategory = (
  taxonomy: FullEquipmentTaxonomy,
  category: string,
  manufacturerCandidate?: string | null,
  modelCandidate?: string | null
): string[] => {
  const subcategoryMap = taxonomy[category] || {};
  const normalizedManufacturer = normalizeLabel(manufacturerCandidate);
  const normalizedModel = normalizeLabel(modelCandidate);

  return Object.entries(subcategoryMap)
    .filter(([, manufacturers]) => {
      if (!normalizedManufacturer && !normalizedModel) return false;

      const manufacturerLabels = Object.keys(manufacturers);
      const directManufacturer = normalizedManufacturer
        ? manufacturerLabels.some((manufacturer) => normalizeLabel(manufacturer) === normalizedManufacturer)
        : false;

      const directModel = normalizedModel
        ? manufacturerLabels.some((manufacturer) =>
            (manufacturers[manufacturer] || []).some((model) => normalizeLabel(model) === normalizedModel)
          )
        : false;

      return directManufacturer || directModel;
    })
    .map(([subcategory]) => subcategory);
};

const getCategorySubcategoryCandidatesFromMakeOrModel = (
  taxonomy: FullEquipmentTaxonomy,
  manufacturerCandidate?: string | null,
  modelCandidate?: string | null
): Array<{ category: string; subcategory: string }> => {
  const matches: Array<{ category: string; subcategory: string }> = [];

  Object.keys(taxonomy).forEach((category) => {
    getSubcategoryCandidatesForCategory(taxonomy, category, manufacturerCandidate, modelCandidate).forEach((subcategory) => {
      matches.push({ category, subcategory });
    });
  });

  return matches;
};

const getManufacturerForModel = (
  taxonomy: FullEquipmentTaxonomy,
  category: string,
  subcategory: string,
  modelCandidate?: string | null
): string => {
  const normalizedModel = normalizeLabel(modelCandidate);
  if (!normalizedModel) return '';

  const makeMap = taxonomy[category]?.[subcategory] || {};
  const matches = Object.keys(makeMap).filter((manufacturer) =>
    (makeMap[manufacturer] || []).some((model) => normalizeLabel(model) === normalizedModel)
  );

  return matches.length === 1 ? matches[0] : '';
};

const getModelForSelection = (
  taxonomy: FullEquipmentTaxonomy,
  category: string,
  subcategory: string,
  manufacturer: string,
  modelCandidate?: string | null
): string => {
  const modelOptions = taxonomy[category]?.[subcategory]?.[manufacturer] || [];
  return findCanonicalLabel(modelOptions, modelCandidate);
};

export const getTaxonomyCategoryOptions = (taxonomy: FullEquipmentTaxonomy): string[] =>
  toUniqueSorted(Object.keys(taxonomy));

export const getTaxonomySubcategoryOptions = (
  taxonomy: FullEquipmentTaxonomy,
  categorySelection?: string | string[] | null
): string[] => {
  const selectedCategories = toNormalizedSet(categorySelection);
  const includeAllCategories = selectedCategories.size === 0;
  const values = new Set<string>();

  Object.entries(taxonomy).forEach(([category, subcategories]) => {
    if (!includeAllCategories && !selectedCategories.has(normalizeLabel(category))) return;
    Object.keys(subcategories).forEach((subcategory) => values.add(subcategory));
  });

  return toUniqueSorted(values);
};

export const getTaxonomyManufacturerOptions = (
  taxonomy: FullEquipmentTaxonomy,
  categorySelection?: string | string[] | null,
  subcategorySelection?: string | string[] | null
): string[] => {
  const selectedCategories = toNormalizedSet(categorySelection);
  const selectedSubcategories = toNormalizedSet(subcategorySelection);
  const includeAllCategories = selectedCategories.size === 0;
  const includeAllSubcategories = selectedSubcategories.size === 0;
  const values = new Set<string>();

  Object.entries(taxonomy).forEach(([category, subcategories]) => {
    if (!includeAllCategories && !selectedCategories.has(normalizeLabel(category))) return;

    Object.entries(subcategories).forEach(([subcategory, makeMap]) => {
      if (!includeAllSubcategories && !selectedSubcategories.has(normalizeLabel(subcategory))) return;
      Object.keys(makeMap).forEach((manufacturer) => values.add(manufacturer));
    });
  });

  return toUniqueSorted(values);
};

export const getTaxonomyModelOptions = (
  taxonomy: FullEquipmentTaxonomy,
  categorySelection?: string | string[] | null,
  subcategorySelection?: string | string[] | null,
  manufacturerSelection?: string | string[] | null
): string[] => {
  const selectedCategories = toNormalizedSet(categorySelection);
  const selectedSubcategories = toNormalizedSet(subcategorySelection);
  const selectedManufacturers = toNormalizedSet(manufacturerSelection);
  const includeAllCategories = selectedCategories.size === 0;
  const includeAllSubcategories = selectedSubcategories.size === 0;
  const includeAllManufacturers = selectedManufacturers.size === 0;
  const values = new Set<string>();

  Object.entries(taxonomy).forEach(([category, subcategories]) => {
    if (!includeAllCategories && !selectedCategories.has(normalizeLabel(category))) return;

    Object.entries(subcategories).forEach(([subcategory, makeMap]) => {
      if (!includeAllSubcategories && !selectedSubcategories.has(normalizeLabel(subcategory))) return;

      Object.entries(makeMap).forEach(([manufacturer, models]) => {
        if (!includeAllManufacturers && !selectedManufacturers.has(normalizeLabel(manufacturer))) return;
        models.forEach((model) => values.add(model));
      });
    });
  });

  return toUniqueSorted(values);
};

export const getCanonicalOptionLabel = (options: string[], candidate?: string | null): string =>
  findCanonicalLabel(options, candidate);

export const resolveEquipmentTaxonomySelection = (
  taxonomy: FullEquipmentTaxonomy,
  input: EquipmentTaxonomySelectionInput
): ResolvedEquipmentTaxonomySelection => {
  const rawCategory = String(input.category || '').trim();
  const rawSubcategory = String(input.subcategory || '').trim();
  const rawManufacturer = String(input.manufacturer || '').trim();
  const rawModel = String(input.model || '').trim();

  const categoryOptions = Object.keys(taxonomy);
  let category = findCanonicalLabel(categoryOptions, rawCategory);
  let subcategory = '';

  if (category) {
    subcategory = findCanonicalLabel(Object.keys(taxonomy[category] || {}), rawSubcategory);
  }

  if (!category) {
    const categoryFromSubcategory =
      getCategorySubcategoryPairs(taxonomy, rawSubcategory)[0] ||
      getCategorySubcategoryPairs(taxonomy, rawCategory)[0];

    if (categoryFromSubcategory) {
      category = categoryFromSubcategory.category;
      subcategory = categoryFromSubcategory.subcategory;
    }
  }

  if (category && !subcategory) {
    subcategory = findCanonicalLabel(Object.keys(taxonomy[category] || {}), rawCategory);
  }

  if (category && !subcategory) {
    const inferredSubcategories = getSubcategoryCandidatesForCategory(taxonomy, category, rawManufacturer, rawModel);
    if (inferredSubcategories.length === 1) {
      subcategory = inferredSubcategories[0];
    }
  }

  if (!category && !subcategory) {
    const inferredPairs = getCategorySubcategoryCandidatesFromMakeOrModel(taxonomy, rawManufacturer, rawModel);
    if (inferredPairs.length === 1) {
      category = inferredPairs[0].category;
      subcategory = inferredPairs[0].subcategory;
    }
  }

  let manufacturer = '';
  if (category && subcategory) {
    manufacturer = findCanonicalLabel(Object.keys(taxonomy[category]?.[subcategory] || {}), rawManufacturer);
    if (!manufacturer) {
      manufacturer = getManufacturerForModel(taxonomy, category, subcategory, rawModel);
    }
  }

  let model = '';
  if (category && subcategory && manufacturer) {
    model = getModelForSelection(taxonomy, category, subcategory, manufacturer, rawModel);
  }

  return {
    category: category || rawCategory,
    subcategory: subcategory || rawSubcategory,
    manufacturer: manufacturer || rawManufacturer,
    model: model || rawModel,
  };
};

export const resolveListingTaxonomySelection = (
  taxonomy: FullEquipmentTaxonomy,
  listing: Pick<Listing, 'category' | 'subcategory' | 'make' | 'manufacturer' | 'brand' | 'model'>
): ResolvedEquipmentTaxonomySelection =>
  resolveEquipmentTaxonomySelection(taxonomy, {
    category: listing.category,
    subcategory: listing.subcategory,
    manufacturer: listing.make || listing.manufacturer || listing.brand,
    model: listing.model,
  });
