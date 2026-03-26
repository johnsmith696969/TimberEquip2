const THIN_ROUTE_ROBOTS = 'noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const ROUTE_MIN_LISTINGS = Object.freeze({
  category: 2,
  manufacturer: 2,
  manufacturerModel: 2,
  manufacturerCategory: 2,
  manufacturerModelCategory: 2,
  stateMarket: 2,
  stateCategory: 2,
  dealer: 3,
  dealerCategory: 2,
});

function getRouteMinimumListings(routeType) {
  return ROUTE_MIN_LISTINGS[routeType];
}

function meetsRouteThreshold(routeType, listingCount) {
  return Number(listingCount || 0) >= getRouteMinimumListings(routeType);
}

function filterLinksByRouteThreshold(links, routeType) {
  return links.filter((link) => meetsRouteThreshold(routeType, Number(link?.count || 0)));
}

function evaluateRouteQuality(routeType, listingCount, { fallbackPath }) {
  const minimumListings = getRouteMinimumListings(routeType);
  const normalizedCount = Number(listingCount || 0);

  if (normalizedCount <= 0) {
    return {
      indexable: false,
      minimumListings,
      listingCount: normalizedCount,
      redirectPath: fallbackPath,
      robots: THIN_ROUTE_ROBOTS,
    };
  }

  if (normalizedCount < minimumListings) {
    return {
      indexable: false,
      minimumListings,
      listingCount: normalizedCount,
      robots: THIN_ROUTE_ROBOTS,
    };
  }

  return {
    indexable: true,
    minimumListings,
    listingCount: normalizedCount,
  };
}

module.exports = {
  THIN_ROUTE_ROBOTS,
  ROUTE_MIN_LISTINGS,
  evaluateRouteQuality,
  filterLinksByRouteThreshold,
  getRouteMinimumListings,
  meetsRouteThreshold,
};
