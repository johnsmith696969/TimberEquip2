import type { CategoryInventoryMetric } from '../services/equipmentService';
import type { EquipmentTaxonomy } from '../services/taxonomyService';
import { EQUIPMENT_TAXONOMY } from '../constants/equipmentData';
import { normalizeSeoSlug } from './seoRoutes';

type TaxonomyLike = EquipmentTaxonomy | typeof EQUIPMENT_TAXONOMY;

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Logging Equipment': 'Harvesting, extraction, processing, and landing machines for professional forestry operations.',
  'Land Clearing Equipment': 'Earthmoving, mulching, grinding, and site-preparation equipment for clearing and development work.',
  'Firewood Equipment': 'Processors, splitters, conveyors, and bundling systems for commercial firewood production.',
  'Tree Service Equipment': 'Chippers, stump grinders, aerial support, and specialist gear for arborist and municipal crews.',
  'Sawmill Equipment': 'Milling, handling, and processing equipment for sawmill and wood-yard operations.',
  Trailers: 'Forestry-ready hauling systems for machines, logs, attachments, and support equipment.',
  Trucks: 'Vocational trucks and hauling units used to move machines, logs, crews, and support assets.',
  'Parts And Attachments': 'Heads, grapples, blades, saws, and replacement components that keep operations moving.',
};

export interface MarketplaceCategoryFamily {
  name: string;
  description: string;
  searchPath: string;
  subcategoryCount: number;
  activeCount: number;
  previousWeekCount: number;
  weeklyChangePercent: number;
  averagePrice: number | null;
}

function getMetricForCategory(
  categoryName: string,
  metricsByCategory: Record<string, CategoryInventoryMetric>
): CategoryInventoryMetric {
  return (
    metricsByCategory[categoryName] || {
      category: categoryName,
      activeCount: 0,
      previousWeekCount: 0,
      weeklyChangePercent: 0,
      averagePrice: null,
    }
  );
}

export function buildCategoryMetricMap(
  metrics: CategoryInventoryMetric[]
): Record<string, CategoryInventoryMetric> {
  return metrics.reduce<Record<string, CategoryInventoryMetric>>((accumulator, metric) => {
    accumulator[metric.category] = metric;
    return accumulator;
  }, {});
}

export function getMarketplaceCategoryFamilyNames(taxonomy?: TaxonomyLike): string[] {
  return Object.keys(taxonomy || EQUIPMENT_TAXONOMY);
}

export function buildMarketplaceCategorySearchPath(categoryName: string): string {
  return `/categories/${normalizeSeoSlug(categoryName)}`;
}

export function getMarketplaceSubcategories(categoryName: string, taxonomy?: TaxonomyLike): string[] {
  const source = taxonomy || EQUIPMENT_TAXONOMY;
  const categoryRecord = (source as Record<string, Record<string, unknown>>)[categoryName] || {};
  return Object.keys(categoryRecord).sort((left, right) => left.localeCompare(right));
}

function buildMarketplaceCategoryFamilyMetric(
  categoryName: string,
  metricsByCategory: Record<string, CategoryInventoryMetric>,
  taxonomy?: TaxonomyLike
): CategoryInventoryMetric {
  const familyKeys = [categoryName, ...getMarketplaceSubcategories(categoryName, taxonomy)];
  const familyMetrics = familyKeys
    .map((key) => metricsByCategory[key])
    .filter((metric): metric is CategoryInventoryMetric => Boolean(metric));

  if (familyMetrics.length === 0) {
    return getMetricForCategory(categoryName, metricsByCategory);
  }

  const activeCount = familyMetrics.reduce((sum, metric) => sum + metric.activeCount, 0);
  const previousWeekCount = familyMetrics.reduce((sum, metric) => sum + metric.previousWeekCount, 0);
  const totalPricedUnits = familyMetrics.reduce(
    (sum, metric) => sum + (metric.averagePrice !== null ? metric.activeCount : 0),
    0
  );
  const totalPricedValue = familyMetrics.reduce(
    (sum, metric) => sum + (metric.averagePrice !== null ? metric.averagePrice * metric.activeCount : 0),
    0
  );
  const weeklyChangePercent =
    previousWeekCount === 0 ? 0 : Number((((activeCount - previousWeekCount) / previousWeekCount) * 100).toFixed(1));

  return {
    category: categoryName,
    activeCount,
    previousWeekCount,
    weeklyChangePercent,
    averagePrice: totalPricedUnits > 0 ? Math.round(totalPricedValue / totalPricedUnits) : null,
  };
}

export function buildMarketplaceCategoryFamilies(
  metrics: CategoryInventoryMetric[],
  taxonomy?: TaxonomyLike
): MarketplaceCategoryFamily[] {
  const metricsByCategory = buildCategoryMetricMap(metrics);

  return getMarketplaceCategoryFamilyNames(taxonomy)
    .map((categoryName) => {
      const metric = buildMarketplaceCategoryFamilyMetric(categoryName, metricsByCategory, taxonomy);

      return {
        name: categoryName,
        description: CATEGORY_DESCRIPTIONS[categoryName] || 'Live marketplace inventory grouped by equipment family.',
        searchPath: buildMarketplaceCategorySearchPath(categoryName),
        subcategoryCount: getMarketplaceSubcategories(categoryName, taxonomy).length,
        activeCount: metric.activeCount,
        previousWeekCount: metric.previousWeekCount,
        weeklyChangePercent: metric.weeklyChangePercent,
        averagePrice: metric.averagePrice,
      };
    })
    .sort((left, right) => right.activeCount - left.activeCount || left.name.localeCompare(right.name));
}
