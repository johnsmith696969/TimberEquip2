import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { BreadcrumbItem, Breadcrumbs } from '../components/Breadcrumbs';
import { ListingCard } from '../components/ListingCard';
import { InquiryModal } from '../components/InquiryModal';
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
  expandRegionName,
  getListingCategoryLabel,
  getListingManufacturer,
  getListingStateName,
  matchesStateSlug,
  normalizeSeoSlug,
  titleCaseSlug,
} from '../utils/seoRoutes';
import { evaluateRouteQuality, filterLinksByRouteThreshold, meetsRouteThreshold } from '../utils/seoRouteQuality';
import { buildListingPath } from '../utils/listingPath';
import { buildSiteUrl } from '../utils/siteUrl';
import { getManufacturerContent } from '../constants/manufacturerContent';
import { getSubcategoryContent, getParentCategory } from '../constants/subcategoryContent';

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
      item: buildSiteUrl(item.path || '/'),
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
        url: buildSiteUrl(canonicalPath),
      },
      buildBreadcrumbJsonLd(breadcrumbs),
      {
        '@type': 'ItemList',
        name: `${name} inventory`,
        itemListElement: listings.slice(0, 24).map((listing, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: buildSiteUrl(buildListingPath(listing)),
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
    <section className="rounded-sm border border-line bg-surface/60 p-6 md:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
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
    <section className="rounded-sm border border-line bg-surface/60 p-6 md:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-black uppercase tracking-tight">Featured Dealers</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dealers.map(({ seller, count }) => (
          <Link
            key={seller.id}
            to={buildDealerPath(seller)}
            className="rounded-sm border border-line bg-bg p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent/35 hover:shadow-xl"
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

type AboutContent = {
  description: string;
  founded?: number;
  headquarters?: string;
};

type SubcategoryExplainerContent = {
  overview: string;
  buyingTips?: string[];
};

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
  aboutContent?: AboutContent;
  subcategoryExplainer?: SubcategoryExplainerContent;
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
  aboutContent,
  subcategoryExplainer,
  searchPath,
  emptyMessage,
}: SeoTemplateProps) {
  const [explainerExpanded, setExplainerExpanded] = useState(false);
  const [selectedListingForInquiry, setSelectedListingForInquiry] = useState<Listing | null>(null);
  const jsonLd = useMemo(
    () => buildCollectionJsonLd(title, description, canonicalPath, listings, breadcrumbs),
    [title, description, canonicalPath, listings, breadcrumbs]
  );
  const featuredListings = listings.slice(0, 12);

  return (
    <div className="min-h-screen bg-bg">
      <Seo title={`${title} | Forestry Equipment Sales`} description={description} canonicalPath={canonicalPath} robots={robots} jsonLd={jsonLd} />
      <Breadcrumbs items={breadcrumbs} />

      <section className="border-b border-line bg-surface/85 px-4 py-20 md:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="max-w-5xl border border-line bg-bg/75 p-8 md:p-10">
            <span className="label-micro mb-4 block text-accent">{eyebrow}</span>
            <h1 className="text-4xl font-black uppercase tracking-tighter md:text-6xl">{title}</h1>
            <p className="mt-6 max-w-3xl text-sm font-medium leading-relaxed text-muted md:text-base">{intro}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
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
        {aboutContent && (
          <section className="rounded-sm border border-line bg-surface/60 p-6 md:p-8">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">About {eyebrow}</h2>
            <p className="text-sm font-medium leading-relaxed text-muted max-w-4xl">{aboutContent.description}</p>
            {(aboutContent.founded || aboutContent.headquarters) && (
              <div className="mt-4 flex flex-wrap gap-6">
                {aboutContent.founded && (
                  <div>
                    <span className="label-micro block mb-1">Founded</span>
                    <div className="text-sm font-black">{aboutContent.founded}</div>
                  </div>
                )}
                {aboutContent.headquarters && (
                  <div>
                    <span className="label-micro block mb-1">Headquarters</span>
                    <div className="text-sm font-black">{aboutContent.headquarters}</div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {subcategoryExplainer && (
          <section className="rounded-sm border border-line bg-surface/60 p-6 md:p-8">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">What Are {eyebrow}?</h2>
            <div className={`text-sm font-medium leading-relaxed text-muted max-w-4xl ${!explainerExpanded ? 'line-clamp-3' : ''}`}>
              <p>{subcategoryExplainer.overview}</p>
            </div>
            {subcategoryExplainer.buyingTips && subcategoryExplainer.buyingTips.length > 0 && (
              <div className={explainerExpanded ? 'mt-4' : 'hidden'}>
                <h3 className="text-sm font-black uppercase tracking-tight mb-3">What to Look for When Buying</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm font-medium text-muted max-w-4xl">
                  {subcategoryExplainer.buyingTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setExplainerExpanded((prev) => !prev)}
              className="mt-3 text-xs font-bold uppercase tracking-widest text-accent hover:underline"
            >
              {explainerExpanded ? 'Show Less' : 'Read More'}
            </button>
          </section>
        )}

        {topCategories.length > 0 && <SectionLinks title="Top Categories" links={topCategories} />}
        {topManufacturers.length > 0 && <SectionLinks title="Top Manufacturers" links={topManufacturers} />}
        {topModels.length > 0 && <SectionLinks title={`Popular ${eyebrow} Models`} links={topModels} />}
        {topStates.length > 0 && <SectionLinks title="Top States" links={topStates} />}
        {featuredDealers.length > 0 && <DealerGrid dealers={featuredDealers} />}

        <section className="rounded-sm border border-line bg-surface/35 p-6 md:p-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="label-micro mb-2 block">Live Inventory</span>
              <h2 className="text-2xl font-black uppercase tracking-tight">Latest Listings</h2>
            </div>
            {searchPath ? (
              <Link to={searchPath} className="btn-industrial btn-accent py-3 px-5 text-center">
                View All Inventory
                <ArrowRight className="ml-2" size={14} />
              </Link>
            ) : null}
          </div>

          {featuredListings.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onInquire={(selected) => setSelectedListingForInquiry(selected)}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-line bg-surface/30 p-8 text-sm font-medium text-muted">{emptyMessage}</div>
          )}
        </section>
      </div>

      {selectedListingForInquiry && (
        <InquiryModal
          isOpen={!!selectedListingForInquiry}
          onClose={() => setSelectedListingForInquiry(null)}
          listing={selectedListingForInquiry}
        />
      )}
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

function useFeaturedDealers(listings: Listing[], loading: boolean): SellerSummary[] {
  const [dealers, setDealers] = useState<SellerSummary[]>([]);

  useEffect(() => {
    let active = true;

    const loadDealers = async () => {
      try {
        const sellerCounts = new Map<string, number>();
        listings.forEach((listing) => {
          const sellerId = String(listing.sellerUid || listing.sellerId || '').trim();
          if (sellerId) sellerCounts.set(sellerId, (sellerCounts.get(sellerId) || 0) + 1);
        });

        const sellerIds = [...sellerCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([id]) => id);

        const loaded = await Promise.all(
          sellerIds.map(async (sellerId) => {
            const seller = await equipmentService.getSeller(sellerId);
            if (!seller) return null;
            return { seller, count: sellerCounts.get(sellerId) || 0 };
          })
        );

        if (active) {
          setDealers(
            loaded
              .filter((entry): entry is SellerSummary => Boolean(entry))
              .filter((entry) => meetsRouteThreshold('dealer', entry.count))
          );
        }
      } catch {
        if (active) setDealers([]);
      }
    };

    if (listings.length) loadDealers();
    else if (!loading && active) setDealers([]);

    return () => { active = false; };
  }, [listings, loading]);

  return dealers;
}

function LoadingState() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
      <div className="text-[11px] font-black uppercase tracking-widest text-muted">Loading SEO Page...</div>
    </div>
  );
}

export function LoggingHubPage() {
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  return (
    <SeoInventoryTemplate
      eyebrow="Logging Equipment"
      title="Logging Equipment For Sale"
      description="Shop new and used logging equipment for sale including skidders, forwarders, feller bunchers, log loaders, delimbers, and more from dealers and owners."
      canonicalPath={`/${MARKET_ROUTE_LABELS.logging}`}
      intro="Browse live logging equipment inventory from dealers and private sellers across North America. Filter by machine type, manufacturer, model, location, and price."
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Logging Equipment For Sale', path: `/${MARKET_ROUTE_LABELS.logging}` },
      ]}
      listings={listings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingCategoryLabel), buildCategoryPath), 'category')}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingStateName), (state) => buildStateMarketPath(state, CANONICAL_MARKET_ROUTE_KEY)), 'stateMarket')}
      searchPath="/search"
      emptyMessage="No active logging inventory is available on this route yet."
    />
  );
}

export function ForestryHubPage() {
  const { listings, loading } = useSeoListings();

  if (loading) return <LoadingState />;

  return (
    <SeoInventoryTemplate
      eyebrow="Equipment Marketplace"
      title="Forestry Equipment for Sale | New & Used Machines"
      description="Browse new and used forestry equipment for sale including logging, land clearing, firewood, sawmill, truck, trailer, and attachment inventory from dealers and owners."
      canonicalPath={`/${MARKET_ROUTE_LABELS.forestry}`}
      intro="Browse the full Forestry Equipment Sales marketplace. Shop live inventory across logging, land clearing, firewood, sawmill, tree service, truck, trailer, and parts categories from dealers and private sellers."
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Forestry Equipment For Sale', path: `/${MARKET_ROUTE_LABELS.forestry}` },
      ]}
      listings={listings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingCategoryLabel), buildCategoryPath), 'category')}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(listings.map(getListingStateName), (state) => buildStateMarketPath(state, CANONICAL_MARKET_ROUTE_KEY)), 'stateMarket')}
      searchPath="/search"
      emptyMessage="No active forestry inventory is available on this route yet."
    />
  );
}

export function CategoryLandingPage() {
  const { categorySlug = '' } = useParams<{ categorySlug: string }>();
  const { listings, loading } = useSeoListings();
  const [resolvedCategory, setResolvedCategory] = useState('');
  const categoryListings = useMemo(() => listings.filter((listing) => normalizeSeoSlug(getListingCategoryLabel(listing)) === categorySlug), [listings, categorySlug]);
  const featuredDealers = useFeaturedDealers(categoryListings, loading);

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

  const quality = evaluateRouteQuality('category', categoryListings.length, { fallbackPath: '/categories' });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  const parentCategory = getParentCategory(resolvedCategory);
  const displayTitle = parentCategory
    ? `${parentCategory} - ${resolvedCategory} For Sale`
    : `${resolvedCategory} For Sale`;
  const explainerContent = getSubcategoryContent(resolvedCategory);

  return (
    <SeoInventoryTemplate
      eyebrow={resolvedCategory}
      title={displayTitle}
      description={`Browse ${resolvedCategory.toLowerCase()} for sale on Forestry Equipment Sales. ${parentCategory ? `Shop ${parentCategory.toLowerCase()} inventory` : 'Shop live inventory'} from dealers and private sellers across North America.`}
      canonicalPath={buildCategoryPath(resolvedCategory)}
      intro={`Shop ${resolvedCategory.toLowerCase()} from trusted dealers and private sellers. Browse live inventory, compare prices, and connect directly with sellers to move fast on the equipment you need.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Categories', path: '/categories' },
        ...(parentCategory ? [{ label: parentCategory, path: buildCategoryPath(parentCategory) }] : []),
        { label: resolvedCategory, path: buildCategoryPath(resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={categoryListings}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(categoryListings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(categoryListings.map(getListingStateName), (state) => buildStateCategoryPath(state, resolvedCategory)), 'stateCategory')}
      featuredDealers={featuredDealers}
      subcategoryExplainer={explainerContent}
      searchPath={`/search?subcategory=${encodeURIComponent(resolvedCategory)}`}
      emptyMessage={`No active ${resolvedCategory.toLowerCase()} listings are available right now.`}
    />
  );
}

export function ManufacturerLandingPage() {
  const { manufacturerSlug = '' } = useParams<{ manufacturerSlug: string }>();
  const { listings, loading } = useSeoListings();
  const mfgListings = useMemo(() => listings.filter((listing) => normalizeSeoSlug(getListingManufacturer(listing)) === manufacturerSlug), [listings, manufacturerSlug]);
  const featuredDealers = useFeaturedDealers(mfgListings, loading);

  if (loading) return <LoadingState />;

  const resolvedManufacturer = listings
    .map(getListingManufacturer)
    .find((manufacturer) => normalizeSeoSlug(manufacturer) === manufacturerSlug) || titleCaseSlug(manufacturerSlug);
  const mfgContent = getManufacturerContent(resolvedManufacturer);
  const quality = evaluateRouteQuality('manufacturer', mfgListings.length, { fallbackPath: '/manufacturers' });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow={resolvedManufacturer}
      title={`${resolvedManufacturer} Equipment For Sale`}
      description={`Browse ${resolvedManufacturer} equipment for sale by make on Forestry Equipment Sales. Shop live ${resolvedManufacturer} inventory from dealers and private sellers across North America.`}
      canonicalPath={buildManufacturerPath(resolvedManufacturer)}
      intro={mfgContent.description}
      aboutContent={mfgContent}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Manufacturers', path: '/manufacturers' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
      ]}
      robots={quality.robots}
      listings={mfgListings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(mfgListings.map(getListingCategoryLabel), (category) => buildManufacturerCategoryPath(resolvedManufacturer, category)), 'manufacturerCategory')}
      topModels={filterLinksByRouteThreshold(buildCountLinks(mfgListings.map((listing) => String(listing.model || '').trim()), (model) => buildManufacturerModelPath(resolvedManufacturer, model)), 'manufacturerModel')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(mfgListings.map(getListingStateName), (state) => buildStateMarketPath(state, CANONICAL_MARKET_ROUTE_KEY)), 'stateMarket')}
      featuredDealers={featuredDealers}
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
      eyebrow={`${resolvedManufacturer} ${resolvedModel}`}
      title={`${resolvedManufacturer} ${resolvedModel} For Sale`}
      description={`Browse ${resolvedManufacturer} ${resolvedModel} for sale on Forestry Equipment Sales. Shop live inventory from dealers and private sellers.`}
      canonicalPath={buildManufacturerModelPath(resolvedManufacturer, resolvedModel)}
      intro={`Find ${resolvedManufacturer} ${resolvedModel} machines for sale from dealers and private sellers. Compare pricing, hours, and condition across available inventory.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Manufacturers', path: '/manufacturers' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
        { label: resolvedModel, path: buildManufacturerModelPath(resolvedManufacturer, resolvedModel) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingCategoryLabel), (category) => buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, category)), 'manufacturerModelCategory')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingStateName), (state) => buildStateMarketPath(state, CANONICAL_MARKET_ROUTE_KEY)), 'stateMarket')}
      searchPath={`/search?manufacturer=${encodeURIComponent(resolvedManufacturer)}&model=${encodeURIComponent(resolvedModel)}`}
      emptyMessage={`No active ${resolvedManufacturer} ${resolvedModel} inventory is available right now.`}
    />
  );
}

export function StateMarketLandingPage({ marketKeyOverride }: { marketKeyOverride?: 'logging' | 'forestry' }) {
  const { stateSlug = '', marketSlug = '' } = useParams<{ stateSlug: string; marketSlug?: string }>();
  const { listings, loading } = useSeoListings();
  const stateListings = useMemo(() => listings.filter((listing) => matchesStateSlug(getListingStateName(listing), stateSlug)), [listings, stateSlug]);
  const featuredDealers = useFeaturedDealers(stateListings, loading);

  if (loading) return <LoadingState />;

  const resolvedState = listings
    .map(getListingStateName)
    .find((state) => matchesStateSlug(state, stateSlug)) || expandRegionName(titleCaseSlug(stateSlug));
  const marketKey = marketKeyOverride || (marketSlug === MARKET_ROUTE_LABELS.logging ? 'logging' : CANONICAL_MARKET_ROUTE_KEY);
  const marketTitle = marketKey === 'forestry' ? 'Forestry Equipment For Sale' : 'Logging Equipment For Sale';
  const quality = evaluateRouteQuality('stateMarket', stateListings.length, { fallbackPath: '/states' });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow={resolvedState}
      title={`${marketTitle} In ${resolvedState}`}
      description={`Browse ${marketTitle.toLowerCase()} in ${resolvedState} on Forestry Equipment Sales. Shop live inventory from local dealers and private sellers.`}
      canonicalPath={buildStateMarketPath(resolvedState, marketKey)}
      intro={`Shop ${marketTitle.toLowerCase()} located in ${resolvedState}. Browse inventory from local dealers and private sellers, compare prices, and connect directly with sellers near you.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'States', path: '/states' },
        { label: resolvedState, path: buildStateMarketPath(resolvedState, marketKey) },
      ]}
      robots={quality.robots}
      listings={stateListings}
      topCategories={filterLinksByRouteThreshold(buildCountLinks(stateListings.map(getListingCategoryLabel), (category) => buildStateCategoryPath(resolvedState, category)), 'stateCategory')}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(stateListings.map(getListingManufacturer), buildManufacturerPath), 'manufacturer')}
      featuredDealers={featuredDealers}
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
    .map(getListingStateName)
    .find((state) => matchesStateSlug(state, stateSlug)) || expandRegionName(titleCaseSlug(stateSlug));
  const resolvedCategory = titleCaseSlug(categorySlug);
  const filteredListings = listings.filter(
    (listing) =>
      matchesStateSlug(getListingStateName(listing), stateSlug) &&
      normalizeSeoSlug(getListingCategoryLabel(listing)) === categorySlug
  );
  const quality = evaluateRouteQuality('stateCategory', filteredListings.length, {
    fallbackPath: buildStateMarketPath(resolvedState, CANONICAL_MARKET_ROUTE_KEY),
  });

  if (quality.redirectPath) return <Navigate replace to={quality.redirectPath} />;

  return (
    <SeoInventoryTemplate
      eyebrow={`${resolvedState} ${resolvedCategory}`}
      title={`${resolvedCategory} For Sale In ${resolvedState}`}
      description={`Browse ${resolvedCategory.toLowerCase()} for sale in ${resolvedState} on Forestry Equipment Sales. Shop live inventory from local dealers and private sellers.`}
      canonicalPath={buildStateCategoryPath(resolvedState, resolvedCategory)}
      intro={`Find ${resolvedCategory.toLowerCase()} for sale in ${resolvedState} from dealers and private sellers. Browse available inventory, compare pricing, and reach out to sellers directly.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'States', path: '/states' },
        { label: resolvedState, path: buildStateMarketPath(resolvedState, CANONICAL_MARKET_ROUTE_KEY) },
        { label: resolvedCategory, path: buildStateCategoryPath(resolvedState, resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topManufacturers={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingManufacturer), (manufacturer) => buildManufacturerCategoryPath(manufacturer, resolvedCategory)), 'manufacturerCategory')}
      subcategoryExplainer={getSubcategoryContent(resolvedCategory)}
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
      eyebrow={`${resolvedManufacturer} ${resolvedCategory}`}
      title={`${resolvedManufacturer} ${resolvedCategory} For Sale`}
      description={`Browse ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} for sale on Forestry Equipment Sales. Shop live inventory from dealers and private sellers.`}
      canonicalPath={buildManufacturerCategoryPath(resolvedManufacturer, resolvedCategory)}
      intro={`Shop ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} from dealers and private sellers. Compare available machines, pricing, and hours across live marketplace inventory.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Manufacturers', path: '/manufacturers' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
        { label: resolvedCategory, path: buildManufacturerCategoryPath(resolvedManufacturer, resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topModels={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map((listing) => String(listing.model || '').trim()), (model) => buildManufacturerModelCategoryPath(resolvedManufacturer, model, resolvedCategory)), 'manufacturerModelCategory')}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingStateName), (state) => buildStateCategoryPath(state, resolvedCategory)), 'stateCategory')}
      subcategoryExplainer={getSubcategoryContent(resolvedCategory)}
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
      eyebrow={`${resolvedManufacturer} ${resolvedModel} ${resolvedCategory}`}
      title={`${resolvedManufacturer} ${resolvedModel} ${resolvedCategory} For Sale`}
      description={`Browse ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} for sale on Forestry Equipment Sales. Shop live inventory from dealers and private sellers.`}
      canonicalPath={buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, resolvedCategory)}
      intro={`Find ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} for sale from dealers and private sellers. Browse pricing, hours, and condition on available inventory.`}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Manufacturers', path: '/manufacturers' },
        { label: resolvedManufacturer, path: buildManufacturerPath(resolvedManufacturer) },
        { label: resolvedModel, path: buildManufacturerModelPath(resolvedManufacturer, resolvedModel) },
        { label: resolvedCategory, path: buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, resolvedCategory) },
      ]}
      robots={quality.robots}
      listings={filteredListings}
      topStates={filterLinksByRouteThreshold(buildCountLinks(filteredListings.map(getListingStateName), (state) => buildStateCategoryPath(state, resolvedCategory)), 'stateCategory')}
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
      description="Browse active dealer storefronts on Forestry Equipment Sales. Find trusted dealers selling new and used logging and forestry equipment."
      canonicalPath="/dealers"
      intro="Browse active dealer storefronts and find trusted sellers of new and used logging and forestry equipment. Open any storefront to view their full inventory."
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
