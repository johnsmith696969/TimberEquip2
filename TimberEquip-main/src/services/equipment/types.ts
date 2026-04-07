import type { Listing, ListingLifecycleStateSnapshot } from '../../types';

export type MarketComparableSpecs = {
  listingId?: string;
  category?: string;
  manufacturer?: string;
  make?: string;
  model?: string;
  price?: number;
  year?: number;
  hours?: number;
};

export type ResolvedMarketComparableSpecs = {
  listingId?: string;
  category?: string;
  manufacturer: string;
  model: string;
  price: number;
  year: number;
  hours: number;
};

export type MarketComparableInsights = {
  marketValueEstimate: number | null;
  recommendations: Listing[];
};

export interface CategoryInventoryMetric {
  category: string;
  activeCount: number;
  previousWeekCount: number;
  weeklyChangePercent: number;
  averagePrice: number | null;
}

export type AdminListingsCursor = string | null;

export interface AdminListingsPage {
  listings: Listing[];
  nextCursor: AdminListingsCursor;
  hasMore: boolean;
}

export interface AdminListingsCollectionResult {
  listings: Listing[];
  pageCount: number;
  truncated: boolean;
}

export interface ListingReviewSummary {
  listingId: string;
  status: string;
  summary: string;
  anomalyCodes: string[];
  anomalyCount: number;
  shadowState: ListingLifecycleStateSnapshot | null;
  rawState?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

export interface HomeMarketplaceData {
  featuredListings: Listing[];
  recentSoldListings: Listing[];
  categoryMetrics: CategoryInventoryMetric[];
  topLevelCategoryMetrics: CategoryInventoryMetric[];
  heroStats: {
    totalActive: number;
    totalMarketValue: number;
  };
  asOf?: string;
}
