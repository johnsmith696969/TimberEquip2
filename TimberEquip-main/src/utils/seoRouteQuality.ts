type RouteQualityType =
  | 'category'
  | 'manufacturer'
  | 'manufacturerModel'
  | 'manufacturerCategory'
  | 'manufacturerModelCategory'
  | 'stateMarket'
  | 'stateCategory'
  | 'dealer'
  | 'dealerCategory';

type RouteQualityOptions = {
  fallbackPath?: string;
};

type RouteQualityResult = {
  threshold: number;
  count: number;
  qualifies: boolean;
  redirectPath: string | null;
  robots: string | undefined;
};

type CountLink = {
  label: string;
  count: number;
  path: string;
};

const ROUTE_THRESHOLDS: Record<RouteQualityType, number> = {
  category: 2,
  manufacturer: 2,
  manufacturerModel: 2,
  manufacturerCategory: 2,
  manufacturerModelCategory: 2,
  stateMarket: 2,
  stateCategory: 2,
  dealer: 3,
  dealerCategory: 2,
};

function getRouteThreshold(routeType: RouteQualityType): number {
  return ROUTE_THRESHOLDS[routeType] || 2;
}

export function meetsRouteThreshold(routeType: RouteQualityType, count: number): boolean {
  return count >= getRouteThreshold(routeType);
}

export function filterLinksByRouteThreshold(links: CountLink[], routeType: RouteQualityType): CountLink[] {
  return links.filter((link) => meetsRouteThreshold(routeType, link.count));
}

export function evaluateRouteQuality(
  routeType: RouteQualityType,
  count: number,
  options: RouteQualityOptions = {}
): RouteQualityResult {
  const threshold = getRouteThreshold(routeType);

  if (count <= 0) {
    return {
      threshold,
      count,
      qualifies: false,
      redirectPath: options.fallbackPath || null,
      robots: 'noindex, follow',
    };
  }

  if (count < threshold) {
    return {
      threshold,
      count,
      qualifies: false,
      redirectPath: null,
      robots: 'noindex, follow',
    };
  }

  return {
    threshold,
    count,
    qualifies: true,
    redirectPath: null,
    robots: undefined,
  };
}
