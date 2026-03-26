export const THIN_ROUTE_ROBOTS = 'noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

export const ROUTE_MIN_LISTINGS = {
  category: 2,
  manufacturer: 2,
  manufacturerModel: 2,
  manufacturerCategory: 2,
  manufacturerModelCategory: 2,
  stateMarket: 2,
  stateCategory: 2,
  dealer: 3,
  dealerCategory: 2,
} as const;

export type RouteQualityKey = keyof typeof ROUTE_MIN_LISTINGS;

type RouteQualityOptions = {
  fallbackPath: string;
};

export type RouteQualityResult = {
  indexable: boolean;
  minimumListings: number;
  listingCount: number;
  redirectPath?: string;
  robots?: string;
};

export function getRouteMinimumListings(routeType: RouteQualityKey): number {
  return ROUTE_MIN_LISTINGS[routeType];
}

export function meetsRouteThreshold(routeType: RouteQualityKey, listingCount: number): boolean {
  return listingCount >= getRouteMinimumListings(routeType);
}

export function filterLinksByRouteThreshold<T extends { count: number }>(links: T[], routeType: RouteQualityKey): T[] {
  return links.filter((link) => meetsRouteThreshold(routeType, Number(link.count || 0)));
}

export function evaluateRouteQuality(
  routeType: RouteQualityKey,
  listingCount: number,
  { fallbackPath }: RouteQualityOptions
): RouteQualityResult {
  const minimumListings = getRouteMinimumListings(routeType);

  if (listingCount <= 0) {
    return {
      indexable: false,
      minimumListings,
      listingCount,
      redirectPath: fallbackPath,
      robots: THIN_ROUTE_ROBOTS,
    };
  }

  if (listingCount < minimumListings) {
    return {
      indexable: false,
      minimumListings,
      listingCount,
      robots: THIN_ROUTE_ROBOTS,
    };
  }

  return {
    indexable: true,
    minimumListings,
    listingCount,
  };
}
