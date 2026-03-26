import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Package2, Tag } from 'lucide-react';
import { BreadcrumbItem, Breadcrumbs } from '../components/Breadcrumbs';
import { ListingCard } from '../components/ListingCard';
import { Seo } from '../components/Seo';
import { equipmentService } from '../services/equipmentService';
import { taxonomyService } from '../services/taxonomyService';
import { Listing, Seller } from '../types';
import {
  CANONICAL_MARKET_ROUTE_KEY,
  MARKET_ROUTE_LABELS,
  buildCategoryPath,
  buildDealerPath,
  buildManufacturerCategoryPath,
  buildManufacturerModelCategoryPath,
  buildManufacturerModelPath,
  buildManufacturerPath,
  buildStateCategoryPath,
  buildStateMarketPath,
  getListingCategoryLabel,
  getListingManufacturer,
  getStateFromLocation,
  normalizeSeoSlug,
  titleCaseSlug,
} from '../utils/seoRoutes';
import { evaluateRouteQuality, filterLinksByRouteThreshold, meetsRouteThreshold } from '../utils/seoRouteQuality';

type CountLink = {
  label: string;
  count: number;
  path: string;
};

type SellerSummary = {
  seller: Seller;
  count: number;
};

function parseForSaleSlug(value: string): string {
  return String(value || '').replace(/-for-sale$/, '');
}

function buildCountLinks(values: string[], pathBuilder: (label: string) => string, limit = 6): CountLink[] {
  const counts = new Map<string, number>();

  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, path: pathBuilder(label) }));
}

function buildBreadcrumbJsonLd(breadcrumbs: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://timberequip.com${item.path || '/'}`,
    })),
  };
}

function buildCollectionJsonLd(name: string, description: string, canonicalPath: string, listings: Listing[], breadcrumbs: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name,
        description,
        url: `https://timberequip.com${canonicalPath}`,
      },
      buildBreadcrumbJsonLd(breadcrumbs),
      {
        '@type': 'ItemList',
        name: `${name} inventory`,
        itemListElement: listings.slice(0, 24).map((listing, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://timberequip.com/listing/${listing.id}`,
          item: {
            '@type': 'Product',
            name: `${listing.year} ${getListingManufacturer(listing)} ${listing.model}`.trim(),
            brand: {
              '@type': 'Brand',
              name: getListingManufacturer(listing) || 'Forestry Equipment Sales',
            },
            category: getListingCategoryLabel(listing) || 'Equipment',
            model: listing.model || undefined,
            offers: {
              '@type': 'Offer',
              priceCurrency: listing.currency || 'USD',
              price: listing.price,
              availability: (listing.status || 'active') === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            },
          },
        })),
      },
    ],
  };
}

function SectionLinks({ title, links }: { title: string; links: CountLink[] }) {
  if (!links.length) return null;

  return (
    <section className="border border-line bg-surface/50 p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
        <span className="label-micro">Clean Route Links</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="flex items-center justify-between gap-3 border border-line bg-bg px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors hover:border-accent hover:text-accent"
          >
            <span>{link.label}</span>
            <span className="text-muted">{link.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DealerGrid({ dealers }: { dealers: SellerSummary[] }) {
  if (!dealers.length) return null;

  return (
    <section className="border border-line bg-surface/50 p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-tight">Featured Dealers</h2>
        <span className="label-micro">Storefront Surfaces</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dealers.map(({ seller, count }) => (
          <Link
            key={seller.id}
            to={buildDealerPath(seller)}
            className="border border-line bg-bg p-5 transition-colors hover:border-accent"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-line bg-surface text-accent">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-tight text-ink">{seller.storefrontName || seller.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted">{count} active listings</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </div>
            <div className="text-xs font-medium text-muted">{seller.location || 'Location pending'}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

type SeoTemplateProps = {
  eyebrow: string;
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
  intro: string;
  breadcrumbs: BreadcrumbItem[];
  listings: Listing[];
  topCategories?: CountLink[];
  topManufacturers?: CountLink[];
  topModels?: CountLink[];
  topStates?: CountLink[];
  featuredDealers?: SellerSummary[];
  searchPath?: string;
  emptyMessage: string;
};

function SeoInventoryTemplate({
  eyebrow,
  title,
  description,
  canonicalPath,
  robots,
  intro,
  breadcrumbs,
  listings,
  topCategories = [],
  topManufacturers = [],
  topModels = [],
  topStates = [],
  featuredDealers = [],
  searchPath,
  emptyMessage,
}: SeoTemplateProps) {
  const jsonLd = useMemo(
    () => buildCollectionJsonLd(title, description, canonicalPath, listings, breadcrumbs),
    [title, description, canonicalPath, listings, breadcrumbs]
  );
  const featuredListings = listings.slice(0, 12);

  return (
    <div className="min-h-screen bg-bg">
      <Seo title={`${title} | Forestry Equipment Sales`} description={description} canonicalPath={canonicalPath} robots={robots} jsonLd={jsonLd} />
      <Breadcrumbs items={breadcrumbs} />

      <section className="border-b border-line bg-surface px-4 py-20 md:px-8">
        <div className="mx-auto max-w-[1600px]">
          <span className="label-micro mb-4 block text-accent">{eyebrow}</span>
          <h1 className="max-w-5xl text-4xl font-black uppercase tracking-tighter md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-sm font-medium leading-relaxed text-muted md:text-base">{intro}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="border border-line bg-bg p-5">
              <div className="label-micro mb-2">Active Listings</div>
              <div className="text-3xl font-black tracking-tight text-ink">{listings.length}</div>
            </div>
            <div className="border border-line bg-bg p-5">
              <div className="label-micro mb-2">Top Category</div>
              <div className="text-xl font-black uppercase tracking-tight text-ink">{topCategories[0]?.label || 'Pending'}</div>
            </div>
            <div className="border border-line bg-bg p-5">
              <div className="label-micro mb-2">Top Manufacturer</div>
              <div className="text-xl font-black uppercase tracking-tight text-ink">{topManufacturers[0]?.label || 'Pending'}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 py-12 md:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border border-line bg-surface/50 p-6">
            <div className="mb-2 flex items-center gap-2 text-accent"><Package2 size={16} /><span className="label-micro">Inventory Slice</span></div>
            <p className="text-sm font-medium leading-relaxed text-muted">This route is powered by the live marketplace inventory feed so the title, related links, and listing archive stay aligned to a real commercial intent.</p>
          </div>
          <div className="border border-line bg-surface/50 p-6">
            <div className="mb-2 flex items-center gap-2 text-accent"><MapPin size={16} /><span className="label-micro">Canonical Surface</span></div>
            <p className="text-sm font-medium leading-relaxed text-muted">Use this clean route as the stable landing page for supported category, manufacturer, state, and dealer discovery instead of relying on ad hoc search query strings.</p>
          </div>
          <div className="border border-line bg-surface/50 p-6">
            <div className="mb-2 flex items-center gap-2 text-accent"><Tag size={16} /><span className="label-micro">Phase 1 Template</span></div>
            <p className="text-sm font-medium leading-relaxed text-muted">Editorial copy, FAQs, and stronger internal-link modules can deepen this page later without changing the route contract or slug pattern.</p>
          </div>
        </div>

        {topCategories.length > 0 && <SectionLinks title="Top Categories" links={topCategories} />}
        {topManufacturers.length > 0 && <SectionLinks title="Top Manufacturers" links={topManufacturers} />}
        {topModels.length > 0 && <SectionLinks title="Top Models" links={topModels} />}
        {topStates.length > 0 && <SectionLinks title="Top States" links={topStates} />}
        {featuredDealers.length > 0 && <DealerGrid dealers={featuredDealers} />}

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="label-micro mb-2 block">Live Inventory</span>
              <h2 className="text-2xl font-black uppercase tracking-tight">Featured Listings</h2>
            </div>
            {searchPath ? (
              <Link to={searchPath} className="btn-industrial btn-accent py-3 px-5 text-center">
                Open Search View
                <ArrowRight className="ml-2" size={14} />
              </Link>
            ) : null}
          </div>

          {featuredListings.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-line bg-surface/30 p-8 text-sm font-medium text-muted">{emptyMessage}</div>
          )}
        </section>
      </div>
    </div>
  );
}

function useSeoListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const nextListings = await equipmentService.getListings();
        if (active) {
          setListings(nextListings);
        }
      } catch (error) {
        console.error('Failed to load SEO listings:', error);
        if (active) {
          setListings([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return { listings, loading };
}

function LoadingState() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
      <div className="text-[11px] font-black uppercase tracking-widest text-muted">Loading SEO Page...</div>
    </div>
  );
}

export function LoggingHubPage() {
  return <ForestryHubPage />;
}

export function ForestryHubPage() {
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  return (
    <SeoInventoryTemplate
      eyebrow="Phase 1 SEO Hub"
      title="Forestry Equipment For Sale"
      description="Browse Forestry Equipment Sales forestry equipment inventory across core machine types, brands, and regions using the clean Phase 1 route architecture."
      canonicalPath={`/${MARKET_ROUTE_LABELS.forestry}`}
      intro="This is the canonical public market hub for the marketplace. It leads with live inventory, linked route families, and lighter browsing flows before buyers ever need the heavier app experience."
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Forestry Equipment For Sale', path: `/${MARKET_ROUTE_LABELS.forestry}` },
      ]}
      listings={listings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingCategoryLabel), buildCategoryPath), 'category')}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(listings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateMarketPath(state, CANONICAL_MARKET_ROUTE_KEY)), 'stateMarket')}
      searchPath="/search"
      emptyMessage="No active forestry inventory is available on this route yet."
    />
  );
}

export function CategoryLandingPage() {
  const { categorySlug = '' } = useParams<{ categorySlug: string }>();
  const { listings, loading } = useSeoListings();
  const [resolvedCategory, setResolvedCategory] = useState('');

  useEffect(() => {
    let active = true;

    const loadTaxonomy = async () => {
      try {
        const taxonomy = await taxonomyService.getTaxonomy();
        const subcategories = Object.values(taxonomy).flatMap((subMap) => Object.keys(subMap));
        const match = subcategories.find((category) => normalizeSeoSlug(category) === categorySlug);
        if (active) {
          setResolvedCategory(match || titleCaseSlug(categorySlug));
        }
      } catch (error) {
        console.error('Failed to resolve category taxonomy:', error);
        if (active) {
          setResolvedCategory(titleCaseSlug(categorySlug));
        }
      }
    };

    loadTaxonomy();

    return () => {
      active = false;
    };
  }, [categorySlug]);

  if (loading || !resolvedCategory) return <LoadingState />;

  const filteredListings = listings.filter((listing) => normalizeSeoSlug(getListingCategoryLabel(listing)) === categorySlug);
  const quality = evaluateRouteQuality('category', filteredListings.length, { fallbackPath: '/categories' });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow="Category Hub"
      title={`${resolvedCategory} For Sale`}
      description={`Browse ${resolvedCategory.toLowerCase()} listings on Forestry Equipment Sales with clean category routing, live inventory, and internal links to top manufacturers and state markets.`}
      canonicalPath={buildCategoryPath(resolvedCategory)}
      intro={`This category route is the Phase 1 template for ${resolvedCategory.toLowerCase()} demand. It turns the existing filtered-inventory experience into a stable landing page with dedicated metadata and related-route links.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Categories', path: '/categories' },
        { label: resolvedCategory, path: buildCategoryPath(resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateCategoryPath(state, resolvedCategory)), 'stateCategory')}
      searchPath={`/search?subcategory=${encodeURIComponent(resolvedCategory)}`}
      emptyMessage={`No active ${resolvedCategory.toLowerCase()} listings are available right now.`}
    />
  );
}

export function ManufacturerLandingPage() {
  const { manufacturerSlug = '' } = useParams<{ manufacturerSlug: string }>();
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  const resolvedManufacturer = listings
    .map(getListingManufacturer)
    .find((manufacturer) => normalizeSeoSlug(manufacturer) === manufacturerSlug) || titleCaseSlug(manufacturerSlug);
  const filteredListings = listings.filter((listing) => normalizeSeoSlug(getListingManufacturer(listing)) === manufacturerSlug);
  const quality = evaluateRouteQuality('manufacturer', filteredListings.length, { fallbackPath: '/manufacturers' });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow="Manufacturer Hub"
      title={`${resolvedManufacturer} Equipment For Sale`}
      description={`Browse ${resolvedManufacturer} equipment for sale on Forestry Equipment Sales with live inventory, top machine categories, and linked state markets.`}
      canonicalPath={buildManufacturerPath(resolvedManufacturer)}
      intro={`This route is the clean manufacturer landing page for ${resolvedManufacturer}. It replaces an equivalent manufacturer query-string view with a stable canonical surface tied to live marketplace inventory.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Manufacturers', path: '/manufacturers' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingCategoryLabel), (category) => buildManufacturerCategoryPath(resolvedManufacturer, category)), 'manufacturerCategory')}
      topModels={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => String(listing.model || '').trim()), (model) => buildManufacturerModelPath(resolvedManufacturer, model)), 'manufacturerModel')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateMarketPath(state, CANONICAL_MARKET_ROUTE_KEY)), 'stateMarket')}
      searchPath={`/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}`}
      emptyMessage={`No active ${resolvedManufacturer} listings are available right now.`}
    />
  );
}

export function ManufacturerModelLandingPage() {
  const { manufacturerSlug = '', modelSlug = '' } = useParams<{ manufacturerSlug: string; modelSlug: string }>();
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  const filteredListings = listings.filter(
    (listing) =>
      normalizeSeoSlug(getListingManufacturer(listing)) === manufacturerSlug &&
      normalizeSeoSlug(String(listing.model || '')) === modelSlug
  );
  const resolvedManufacturer =
    filteredListings[0] ? getListingManufacturer(filteredListings[0]) : (
      listings.map(getListingManufacturer).find((manufacturer) => normalizeSeoSlug(manufacturer) === manufacturerSlug) || titleCaseSlug(manufacturerSlug)
    );
  const resolvedModel =
    filteredListings[0]?.model || listings.map((listing) => String(listing.model || '').trim()).find((model) => normalizeSeoSlug(model) === modelSlug) || titleCaseSlug(modelSlug);
  const quality = evaluateRouteQuality('manufacturerModel', filteredListings.length, { fallbackPath: buildManufacturerPath(resolvedManufacturer) });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow="Manufacturer + Model Hub"
      title={`${resolvedManufacturer} ${resolvedModel} For Sale`}
      description={`Browse ${resolvedManufacturer} ${resolvedModel} listings with live inventory, related machine-type routes, and state-market discovery links.`}
      canonicalPath={buildManufacturerModelPath(resolvedManufacturer, resolvedModel)}
      intro={`This model route turns a high-intent make-and-model search into a stable landing page with current marketplace inventory, related category paths, and regional discovery links.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Manufacturers', path: '/manufacturers' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
        { label: resolvedModel, path: buildManufacturerModelPath(resolvedManufacturer, resolvedModel) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingCategoryLabel), (category) => buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, category)), 'manufacturerModelCategory')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateMarketPath(state, CANONICAL_MARKET_ROUTE_KEY)), 'stateMarket')}
      searchPath={`/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}&model=${encodeURIComponent(resolvedModel)}`}
      emptyMessage={`No active ${resolvedManufacturer} ${resolvedModel} inventory is available right now.`}
    />
  );
}

export function StateMarketLandingPage({ marketKeyOverride }: { marketKeyOverride?: 'logging' | 'forestry' }) {
  const { stateSlug = '', marketSlug = '' } = useParams<{ stateSlug: string; marketSlug?: string }>();
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  const resolvedState = listings
    .map((listing) => getStateFromLocation(listing.location))
    .find((state) => normalizeSeoSlug(state) === stateSlug) || titleCaseSlug(stateSlug);
  const marketKey = marketKeyOverride || (marketSlug === MARKET_ROUTE_LABELS.logging ? 'logging' : CANONICAL_MARKET_ROUTE_KEY);
  const marketTitle = marketKey === 'forestry' ? 'Forestry Equipment For Sale' : 'Logging Equipment For Sale';
  const filteredListings = listings.filter((listing) => normalizeSeoSlug(getStateFromLocation(listing.location)) === stateSlug);
  const quality = evaluateRouteQuality('stateMarket', filteredListings.length, { fallbackPath: '/states' });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow="State Hub"
      title={`${marketTitle} In ${resolvedState}`}
      description={`Browse ${marketTitle.toLowerCase()} in ${resolvedState} with a clean state-level route, live inventory, and related category and manufacturer links.`}
      canonicalPath={buildStateMarketPath(resolvedState, marketKey)}
      intro={`This state landing page isolates ${resolvedState} inventory for the ${marketKey} market family and gives the SEO architecture a stable regional route pattern without changing how listings are stored.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'States', path: '/states' },
        { label: resolvedState, path: buildStateMarketPath(resolvedState, marketKey) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingCategoryLabel), (category) => buildStateCategoryPath(resolvedState, category)), 'stateCategory')}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      searchPath={`/search?state=${encodeURIComponent(resolvedState)}`}
      emptyMessage={`No active inventory is available in ${resolvedState} right now.`}
    />
  );
}

export function StateCategoryLandingPage() {
  const { stateSlug = '', categorySaleSlug = '' } = useParams<{ stateSlug: string; categorySaleSlug: string }>();
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  const categorySlug = parseForSaleSlug(categorySaleSlug);

  const resolvedState = listings
    .map((listing) => getStateFromLocation(listing.location))
    .find((state) => normalizeSeoSlug(state) === stateSlug) || titleCaseSlug(stateSlug);
  const resolvedCategory = titleCaseSlug(categorySlug);
  const filteredListings = listings.filter(
    (listing) =>
      normalizeSeoSlug(getStateFromLocation(listing.location)) === stateSlug &&
      normalizeSeoSlug(getListingCategoryLabel(listing)) === categorySlug
  );
  const quality = evaluateRouteQuality('stateCategory', filteredListings.length, {
    fallbackPath: buildStateMarketPath(resolvedState, CANONICAL_MARKET_ROUTE_KEY),
  });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow="State + Category Hub"
      title={`${resolvedCategory} For Sale In ${resolvedState}`}
      description={`Browse ${resolvedCategory.toLowerCase()} for sale in ${resolvedState} with a clean combined route backed by live Forestry Equipment Sales inventory.`}
      canonicalPath={buildStateCategoryPath(resolvedState, resolvedCategory)}
      intro={`This combined route is the Phase 1 template for a regional category intent. It narrows inventory to ${resolvedState} ${resolvedCategory.toLowerCase()} demand and links back into the broader route family.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: resolvedState, path: buildStateMarketPath(resolvedState, CANONICAL_MARKET_ROUTE_KEY) },
        { label: resolvedCategory, path: buildStateCategoryPath(resolvedState, resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingManufacturer), (manufacturer) => buildManufacturerCategoryPath(manufacturer, resolvedCategory)), 'manufacturerCategory')}
      searchPath={`/search?state=${encodeURIComponent(resolvedState)}&subcategory=${encodeURIComponent(resolvedCategory)}`}
      emptyMessage={`No active ${resolvedCategory.toLowerCase()} inventory is available in ${resolvedState} right now.`}
    />
  );
}

export function ManufacturerCategoryLandingPage() {
  const { manufacturerSlug = '', categorySaleSlug = '' } = useParams<{ manufacturerSlug: string; categorySaleSlug: string }>();
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  const categorySlug = parseForSaleSlug(categorySaleSlug);

  const resolvedManufacturer = listings
    .map(getListingManufacturer)
    .find((manufacturer) => normalizeSeoSlug(manufacturer) === manufacturerSlug) || titleCaseSlug(manufacturerSlug);
  const resolvedCategory = titleCaseSlug(categorySlug);
  const filteredListings = listings.filter(
    (listing) =>
      normalizeSeoSlug(getListingManufacturer(listing)) === manufacturerSlug &&
      normalizeSeoSlug(getListingCategoryLabel(listing)) === categorySlug
  );
  const quality = evaluateRouteQuality('manufacturerCategory', filteredListings.length, {
    fallbackPath: buildManufacturerPath(resolvedManufacturer),
  });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow="Manufacturer + Category Hub"
      title={`${resolvedManufacturer} ${resolvedCategory} For Sale`}
      description={`Browse ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} listings with a clean manufacturer-category route and live Forestry Equipment Sales inventory.`}
      canonicalPath={buildManufacturerCategoryPath(resolvedManufacturer, resolvedCategory)}
      intro={`This combined route isolates a high-intent make-and-machine query and establishes a stable canonical surface for buyers looking specifically for ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} inventory.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
        { label: resolvedCategory, path: buildManufacturerCategoryPath(resolvedManufacturer, resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topModels={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => String(listing.model || '').trim()), (model) => buildManufacturerModelCategoryPath(resolvedManufacturer, model, resolvedCategory)), 'manufacturerModelCategory')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateCategoryPath(state, resolvedCategory)), 'stateCategory')}
      searchPath={`/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}&subcategory=${encodeURIComponent(resolvedCategory)}`}
      emptyMessage={`No active ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} inventory is available right now.`}
    />
  );
}

export function ManufacturerModelCategoryLandingPage() {
  const { manufacturerSlug = '', modelSlug = '', categorySaleSlug = '' } = useParams<{ manufacturerSlug: string; modelSlug: string; categorySaleSlug: string }>();
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  const categorySlug = parseForSaleSlug(categorySaleSlug);
  const filteredListings = listings.filter(
    (listing) =>
      normalizeSeoSlug(getListingManufacturer(listing)) === manufacturerSlug &&
      normalizeSeoSlug(String(listing.model || '')) === modelSlug &&
      normalizeSeoSlug(getListingCategoryLabel(listing)) === categorySlug
  );
  const resolvedManufacturer =
    filteredListings[0] ? getListingManufacturer(filteredListings[0]) : (
      listings.map(getListingManufacturer).find((manufacturer) => normalizeSeoSlug(manufacturer) === manufacturerSlug) || titleCaseSlug(manufacturerSlug)
    );
  const resolvedModel =
    filteredListings[0]?.model || listings.map((listing) => String(listing.model || '').trim()).find((model) => normalizeSeoSlug(model) === modelSlug) || titleCaseSlug(modelSlug);
  const resolvedCategory = filteredListings[0] ? getListingCategoryLabel(filteredListings[0]) : titleCaseSlug(categorySlug);
  const quality = evaluateRouteQuality('manufacturerModelCategory', filteredListings.length, {
    fallbackPath: buildManufacturerModelPath(resolvedManufacturer, resolvedModel),
  });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow="Manufacturer + Model + Category Hub"
      title={`${resolvedManufacturer} ${resolvedModel} ${resolvedCategory} For Sale`}
      description={`Browse ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} inventory with live listings, dealer storefront links, and related regional routes.`}
      canonicalPath={buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, resolvedCategory)}
      intro={`This route captures the tightest commercial search intent in the marketplace architecture by combining make, model, and machine family on a single clean canonical URL.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Manufacturers', path: '/manufacturers' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
        { label: resolvedModel, path: buildManufacturerModelPath(resolvedManufacturer, resolvedModel) },
        { label: resolvedCategory, path: buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => getStateFromLocation(listing.location)), (state) => buildStateCategoryPath(state, resolvedCategory)), 'stateCategory')}
      searchPath={`/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}&model=${encodeURIComponent(resolvedModel)}&subcategory=${encodeURIComponent(resolvedCategory)}`}
      emptyMessage={`No active ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} inventory is available right now.`}
    />
  );
}

export function DealerDirectoryPage() {
  const { listings, loading } = useSeoListings();
  const [dealers, setDealers] = useState<SellerSummary[]>([]);

  useEffect(() => {
    let active = true;

    const loadDealers = async () => {
      try {
        const sellerCounts = new Map<string, number>();
        listings.forEach((listing) => {
          const sellerId = String(listing.sellerUid || listing.sellerId || '').trim();
          if (!sellerId) return;
          sellerCounts.set(sellerId, (sellerCounts.get(sellerId) || 0) + 1);
        });

        const sellerIds = [...sellerCounts.keys()].slice(0, 24);
        const loadedDealers = await Promise.all(
          sellerIds.map(async (sellerId) => {
            const seller = await equipmentService.getSeller(sellerId);
            if (!seller) return null;
            return { seller, count: sellerCounts.get(sellerId) || 0 };
          })
        );

        if (active) {
          setDealers(
            loadedDealers
              .filter((entry): entry is SellerSummary => Boolean(entry))
              .filter((entry) => meetsRouteThreshold('dealer', entry.count))
              .sort((left, right) => right.count - left.count)
          );
        }
      } catch (error) {
        console.error('Failed to build dealer directory:', error);
        if (active) {
          setDealers([]);
        }
      }
    };

    if (listings.length) {
      loadDealers();
    } else if (!loading && active) {
      setDealers([]);
    }

    return () => {
      active = false;
    };
  }, [listings, loading]);

  if (loading) return <LoadingState />;

  return (
    <SeoInventoryTemplate
      eyebrow="Dealer Directory"
      title="Logging Equipment Dealers"
      description="Browse Forestry Equipment Sales dealer storefronts, inventory-rich sellers, and clean dealer URLs introduced in the Phase 1 SEO architecture."
      canonicalPath="/dealers"
      intro="This directory is the first crawlable dealer surface in the new route family. It keeps legacy seller URLs intact while introducing clean dealer storefront paths backed by live marketplace sellers."
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dealers', path: '/dealers' },
      ]}
      listings={listings.slice(0, 9)}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingCategoryLabel), buildCategoryPath), 'category')}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      featuredDealers={dealers}
      searchPath="/search"
      emptyMessage="No dealer storefronts are available for this directory yet."
    />
  );
}
