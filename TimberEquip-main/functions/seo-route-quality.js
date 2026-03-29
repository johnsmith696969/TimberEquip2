const THIN_ROUTE_ROBOTS = 'noindex, follow';

const ROUTE_THRESHOLDS = {
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

function getRouteThreshold(routeType) {
  return ROUTE_THRESHOLDS[String(routeType || '').trim()] || 2;
}

function meetsRouteThreshold(routeType, count) {
  return Number(count || 0) >= getRouteThreshold(routeType);
}

function filterLinksByRouteThreshold(links, routeType) {
  if (!Array.isArray(links)) return [];
  return links.filter((link) => meetsRouteThreshold(routeType, Number(link?.count || 0)));
}

function evaluateRouteQuality(routeType, count, options = {}) {
  const numericCount = Number(count || 0);
  const threshold = getRouteThreshold(routeType);

  if (numericCount <= 0) {
    return {
      threshold,
      count: numericCount,
      qualifies: false,
      redirectPath: options.fallbackPath || null,
      robots: THIN_ROUTE_ROBOTS,
    };
  }

  if (numericCount < threshold) {
    return {
      threshold,
      count: numericCount,
      qualifies: false,
      redirectPath: null,
      robots: THIN_ROUTE_ROBOTS,
    };
  }

  return {
    threshold,
    count: numericCount,
    qualifies: true,
    redirectPath: null,
    robots: undefined,
  };
}

module.exports = {
  THIN_ROUTE_ROBOTS,
  evaluateRouteQuality,
  filterLinksByRouteThreshold,
  meetsRouteThreshold,
};
