import type { CategoryInventoryMetric } from '../services/equipmentService';
import { EQUIPMENT_TAXONOMY } from '../constants/equipmentData';

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

export function getMarketplaceCategoryFamilyNames(): string[] {
  return Object.keys(EQUIPMENT_TAXONOMY);
}

export function buildMarketplaceCategorySearchPath(categoryName: string): string {
  return `/search?category=${encodeURIComponent(categoryName)}`;
}

export function getMarketplaceSubcategories(categoryName: string): string[] {
  const categoryRecord = EQUIPMENT_TAXONOMY[categoryName as keyof typeof EQUIPMENT_TAXONOMY] || {};
  return Object.keys(categoryRecord).sort((left, right) => left.localeCompare(right));
}

export function buildMarketplaceCategoryFamilies(
  metrics: CategoryInventoryMetric[]
): MarketplaceCategoryFamily[] {
  const metricsByCategory = buildCategoryMetricMap(metrics);

  return getMarketplaceCategoryFamilyNames()
    .map((categoryName) => {
      const metric = getMetricForCategory(categoryName, metricsByCategory);

      return {
        name: categoryName,
        description: CATEGORY_DESCRIPTIONS[categoryName] || 'Live marketplace inventory grouped by equipment family.',
        searchPath: buildMarketplaceCategorySearchPath(categoryName),
        subcategoryCount: getMarketplaceSubcategories(categoryName).length,
        activeCount: metric.activeCount,
        previousWeekCount: metric.previousWeekCount,
        weeklyChangePercent: metric.weeklyChangePercent,
        averagePrice: metric.averagePrice,
      };
    })
    .sort((left, right) => right.activeCount - left.activeCount || left.name.localeCompare(right.name));
}
