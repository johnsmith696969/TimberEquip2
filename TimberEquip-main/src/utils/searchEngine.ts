import Fuse from 'fuse.js';
import type { Listing } from '../types';

/**
 * Fuse.js configuration for fuzzy equipment search.
 *
 * Field weights reflect business priority:
 *   - title / make / model are the strongest signals
 *   - category and subcategory help broad intent queries
 *   - description and sellerName are low-signal but still useful
 */
const FUSE_OPTIONS: Fuse.IFuseOptions<Listing> = {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'manufacturer', weight: 2 },
    { name: 'make', weight: 2 },
    { name: 'brand', weight: 2 },
    { name: 'model', weight: 2 },
    { name: 'category', weight: 1.5 },
    { name: 'subcategory', weight: 1 },
    { name: 'location', weight: 1 },
    { name: 'stockNumber', weight: 2.5 },
    { name: 'serialNumber', weight: 2.5 },
    { name: 'description', weight: 0.5 },
    { name: 'sellerName', weight: 0.5 },
  ],
  threshold: 0.35,
  distance: 200,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
  useExtendedSearch: false,
};

/**
 * Build a Fuse index over the given listings.
 * Intended to be called inside a `useMemo` so the index is rebuilt only when
 * the listing array reference changes.
 */
export function createSearchIndex(listings: readonly Listing[]): Fuse<Listing> {
  return new Fuse([...listings], FUSE_OPTIONS);
}

/**
 * Run a fuzzy search and return matching listings ordered by relevance.
 * Returns an empty array when the query is blank so callers can fall back to
 * the full listing set for filter-only browsing.
 */
export function fuzzySearch(index: Fuse<Listing>, query: string): Listing[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const results = index.search(trimmed);
  return results.map((r) => r.item);
}

/**
 * Convenience: return a Set of listing IDs that match the fuzzy query.
 * Useful for integrating with an existing filter pipeline that needs to
 * check membership rather than iterate an ordered result list.
 */
export function fuzzySearchIdSet(index: Fuse<Listing>, query: string): Set<string> {
  const matches = fuzzySearch(index, query);
  return new Set(matches.map((l) => l.id));
}

export interface FuzzySearchResult {
  /** Set of listing IDs that match the query (for O(1) membership checks). */
  ids: Set<string>;
  /** Map of listing ID to relevance rank (0 = best match). Lower is better. */
  ranks: Map<string, number>;
}

/**
 * Run a fuzzy search and return both the matching ID set and a rank map.
 * The rank map preserves Fuse.js relevance ordering so the caller can sort
 * filtered results by search relevance without re-running the search.
 *
 * Returns null when the query is blank (no text filter active).
 */
export function fuzzySearchWithRanks(
  index: Fuse<Listing>,
  query: string,
): FuzzySearchResult | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const results = index.search(trimmed);
  const ids = new Set<string>();
  const ranks = new Map<string, number>();

  for (let i = 0; i < results.length; i++) {
    const id = results[i].item.id;
    ids.add(id);
    ranks.set(id, i);
  }

  return { ids, ranks };
}
