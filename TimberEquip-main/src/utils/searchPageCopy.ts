import type { FullEquipmentTaxonomy } from '../services/taxonomyService';

export interface SearchPageCopyFilters {
  q?: string;
  category?: string;
  subcategory?: string;
  manufacturer?: string;
  model?: string;
}

export interface SearchPageCopyCategoryRoute {
  categoryName: string;
  slug: string;
  isTopLevel: boolean;
  parentCategoryName?: string;
  subcategoryName?: string;
}

interface BuildSearchPageCopyInput {
  filters: SearchPageCopyFilters;
  categoryRoute?: SearchPageCopyCategoryRoute;
  resultCount: number;
  taxonomy?: FullEquipmentTaxonomy;
}

export interface SearchPageCopy {
  title: string;
  subject: string;
  eyebrow: string;
  countLabel: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

const parseMultiValue = (value?: string): string[] =>
  String(value || '')
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);

const singleValue = (value?: string): string => {
  const values = parseMultiValue(value);
  return values.length === 1 ? values[0] : '';
};

const normalizeForMatch = (value?: string | null): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const singularizeForMatch = (value: string): string =>
  value.endsWith('ies') && value.length > 4
    ? `${value.slice(0, -3)}y`
    : value.endsWith('s') && value.length > 3
      ? value.slice(0, -1)
      : value;

const titleCaseQuery = (value?: string): string =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => (/[0-9]/.test(word) || word.length <= 3 ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`))
    .join(' ');

const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean))).sort((left, right) => right.length - left.length || left.localeCompare(right));

const getTaxonomyLabels = (taxonomy?: FullEquipmentTaxonomy) => {
  const manufacturers: string[] = [];
  const models: string[] = [];
  const subcategories: string[] = [];

  Object.values(taxonomy || {}).forEach((subcategoryMap) => {
    Object.entries(subcategoryMap || {}).forEach(([subcategory, makeMap]) => {
      subcategories.push(subcategory);
      Object.entries(makeMap || {}).forEach(([manufacturer, modelList]) => {
        manufacturers.push(manufacturer);
        modelList.forEach((model) => models.push(model));
      });
    });
  });

  return {
    manufacturers: uniqueSorted(manufacturers),
    models: uniqueSorted(models),
    subcategories: uniqueSorted(subcategories),
  };
};

const findLabelInQuery = (labels: string[], query?: string): string => {
  const normalizedQuery = normalizeForMatch(query);
  if (!normalizedQuery) return '';

  return labels.find((label) => {
    const normalizedLabel = normalizeForMatch(label);
    if (!normalizedLabel) return false;
    return (
      normalizedQuery.includes(normalizedLabel) ||
      normalizedQuery.includes(singularizeForMatch(normalizedLabel))
    );
  }) || '';
};

const joinSubject = (parts: string[]): string =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, allParts) => allParts.findIndex((candidate) => normalizeForMatch(candidate) === normalizeForMatch(part)) === index)
    .join(' ');

export const formatMachineCountLabel = (count: number): string =>
  `${Math.max(0, count).toLocaleString()} ${count === 1 ? 'Machine' : 'Machines'} Available`;

export function buildSearchPageCopy({
  filters,
  categoryRoute,
  resultCount,
  taxonomy,
}: BuildSearchPageCopyInput): SearchPageCopy {
  const routeParentCategory = categoryRoute?.parentCategoryName || (categoryRoute?.isTopLevel ? categoryRoute.categoryName : '');
  const routeSubcategory = categoryRoute?.subcategoryName || (!categoryRoute?.isTopLevel ? categoryRoute?.categoryName || '' : '');
  const selectedManufacturer = singleValue(filters.manufacturer);
  const selectedModel = singleValue(filters.model);
  const selectedSubcategory = routeSubcategory || singleValue(filters.subcategory);
  const selectedCategory = routeParentCategory || filters.category || '';
  const taxonomyLabels = getTaxonomyLabels(taxonomy);
  const queryManufacturer = !selectedManufacturer ? findLabelInQuery(taxonomyLabels.manufacturers, filters.q) : '';
  const querySubcategory = !selectedSubcategory ? findLabelInQuery(taxonomyLabels.subcategories, filters.q) : '';
  const queryModel = !selectedModel ? findLabelInQuery(taxonomyLabels.models, filters.q) : '';

  let subject = 'Logging Equipment';
  let eyebrow = categoryRoute ? 'Equipment Category' : 'Equipment Marketplace';

  if (categoryRoute?.isTopLevel) {
    subject = categoryRoute.categoryName;
  } else if (categoryRoute) {
    subject = joinSubject([routeParentCategory, routeSubcategory]);
    eyebrow = 'Equipment Subcategory';
  } else if (selectedManufacturer && selectedModel) {
    subject = joinSubject([selectedManufacturer, selectedModel]);
    eyebrow = 'Manufacturer Inventory';
  } else if (selectedManufacturer && selectedSubcategory) {
    subject = joinSubject([selectedManufacturer, selectedSubcategory]);
    eyebrow = 'Manufacturer Inventory';
  } else if (selectedCategory && selectedSubcategory) {
    subject = joinSubject([selectedCategory, selectedSubcategory]);
    eyebrow = 'Filtered Equipment';
  } else if (queryManufacturer && querySubcategory) {
    subject = joinSubject([queryManufacturer, querySubcategory]);
    eyebrow = 'Search Results';
  } else if (queryManufacturer && queryModel) {
    subject = joinSubject([queryManufacturer, queryModel]);
    eyebrow = 'Search Results';
  } else if (selectedManufacturer) {
    subject = `${selectedManufacturer} Equipment`;
    eyebrow = 'Manufacturer Inventory';
  } else if (selectedSubcategory) {
    subject = joinSubject([selectedCategory, selectedSubcategory]);
    eyebrow = 'Filtered Equipment';
  } else if (selectedCategory) {
    subject = selectedCategory;
    eyebrow = 'Filtered Equipment';
  } else if (filters.q?.trim()) {
    subject = titleCaseQuery(filters.q);
    eyebrow = 'Search Results';
  }

  const title = `${subject} For Sale`;
  const countLabel = formatMachineCountLabel(resultCount);
  const description = `Find new and used ${subject} for sale on Forestry Equipment Sales. Filter by year, hours, price, location, manufacturer, and technical specifications.`;

  return {
    title,
    subject,
    eyebrow,
    countLabel,
    description,
    seoTitle: `${title} | New & Used ${subject} | Forestry Equipment Sales`,
    seoDescription: `${countLabel}. ${description}`,
  };
}
