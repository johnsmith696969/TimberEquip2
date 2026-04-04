import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, MapPin, Trees, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { equipmentService } from '../services/equipmentService';
import { Listing } from '../types';
import { CANONICAL_MARKET_ROUTE_KEY, buildStateMarketPath, getListingCategoryLabel, getListingManufacturer, getStateFromLocation } from '../utils/seoRoutes';

type StateCard = {
  name: string;
  count: number;
  manufacturerCount: number;
  topCategories: string[];
  topManufacturers: string[];
};

function buildStateCards(listings: Listing[]): StateCard[] {
  const stateMap = new Map<
    string,
    {
      count: number;
      manufacturers: Set<string>;
      categories: Map<string, number>;
      topManufacturers: Map<string, number>;
    }
  >();

  listings.forEach((listing) => {
    const state = getStateFromLocation(listing.location);
    if (!state) return;

    const manufacturer = getListingManufacturer(listing);
    const category = getListingCategoryLabel(listing);
    const entry = stateMap.get(state) || {
      count: 0,
      manufacturers: new Set<string>(),
      categories: new Map<string, number>(),
      topManufacturers: new Map<string, number>(),
    };

    entry.count += 1;
    if (manufacturer) {
      entry.manufacturers.add(manufacturer);
      entry.topManufacturers.set(manufacturer, (entry.topManufacturers.get(manufacturer) || 0) + 1);
    }
    if (category) {
      entry.categories.set(category, (entry.categories.get(category) || 0) + 1);
    }

    stateMap.set(state, entry);
  });

  const sortCounts = (counts: Map<string, number>) =>
    [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 3)
      .map(([label]) => label);

  return [...stateMap.entries()]
    .map(([name, entry]) => ({
      name,
      count: entry.count,
      manufacturerCount: entry.manufacturers.size,
      topCategories: sortCounts(entry.categories),
      topManufacturers: sortCounts(entry.topManufacturers),
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function States() {
  const { theme } = useTheme();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const inventory = await equipmentService.getListings();
        if (!active) return;
        setListings(inventory);
      } catch (loadError) {
        console.error('Failed to load state index:', loadError);
        if (!active) return;
        setError('Unable to load state markets right now. Please try again.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const stateCards = useMemo(() => buildStateCards(listings), [listings]);
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';
  const formatNumber = useMemo(() => new Intl.NumberFormat('en-US'), []);

  const totalStates = stateCards.length;
  const topState = stateCards[0];
  const totalManufacturers = new Set(listings.map((listing) => getListingManufacturer(listing)).filter(Boolean)).size;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Equipment Markets By State',
    description: 'Browse state-level equipment market routes with direct paths into live public inventory.',
    url: 'https://timberequip.com/states',
    hasPart: stateCards.slice(0, 60).map((state, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: state.name,
      url: `https://timberequip.com${buildStateMarketPath(state.name, CANONICAL_MARKET_ROUTE_KEY)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Equipment Markets By State | Forestry Equipment Sales"
        description="Browse state-level market pages for forestry and logging equipment, with direct paths into live public inventory."
        canonicalPath="/states"
        jsonLd={jsonLd}
        preloadImage="/page-photos/pine-dirt-road.webp"
      />
      <Breadcrumbs />

      <ImageHero imageSrc="/page-photos/pine-dirt-road.webp" imageAlt="Forest road through a pine landscape">
        <div>
          <span className="label-micro text-accent mb-4 block">Regional Directory</span>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            Equipment Markets <br />
            <span className={heroSecondaryClass}>By State</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            Open state routes to browse local inventory, leading machine categories, and the brands currently active in each market.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="border border-line bg-bg/90 p-5 backdrop-blur-sm">
              <div className="label-micro mb-2">Active State Markets</div>
              <div className="text-3xl font-black tracking-tight text-ink">{formatNumber.format(totalStates)}</div>
            </div>
            <div className="border border-line bg-bg/90 p-5 backdrop-blur-sm">
              <div className="label-micro mb-2">Live Listings</div>
              <div className="text-3xl font-black tracking-tight text-ink">{formatNumber.format(listings.length)}</div>
            </div>
            <div className="border border-line bg-bg/90 p-5 backdrop-blur-sm">
              <div className="label-micro mb-2">Top Market</div>
              <div className="text-xl font-black uppercase tracking-tight text-ink">{topState?.name || 'Pending'}</div>
            </div>
          </div>
        </div>
      </ImageHero>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <section className="mb-12 border border-line bg-surface p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="label-micro text-accent mb-3 block">Regional Route Index</span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-ink">Browse Equipment By Geography</h2>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-muted">
                These React-owned state markets replace the conflicting SEO stub pages. Each route points buyers into the local forestry equipment inventory already live on the marketplace.
              </p>
            </div>
            <Link to="/search" className="btn-industrial btn-accent py-4 px-6 w-full md:w-auto text-center">
              Open Full Search
              <ArrowRight className="ml-2" size={14} />
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="border border-line bg-bg p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent/10 text-accent mb-4">
              <Globe2 size={22} />
            </div>
            <div className="label-micro mb-2">Geographic Coverage</div>
            <div className="text-2xl font-black tracking-tight text-ink">{formatNumber.format(totalStates)} Markets</div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">State pages now resolve inside the React app instead of handing off to the conflicting server-rendered directory layer.</p>
          </div>
          <div className="border border-line bg-bg p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent/10 text-accent mb-4">
              <Trees size={22} />
            </div>
            <div className="label-micro mb-2">Active Brands</div>
            <div className="text-2xl font-black tracking-tight text-ink">{formatNumber.format(totalManufacturers)}</div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">Each market page can branch into category and manufacturer routes based on the live public inventory already in your marketplace.</p>
          </div>
          <div className="border border-line bg-bg p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent/10 text-accent mb-4">
              <TrendingUp size={22} />
            </div>
            <div className="label-micro mb-2">Market Leader</div>
            <div className="text-2xl font-black tracking-tight text-ink">{topState?.name || 'Pending'}</div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">The strongest state route is determined by current active listing count, so it stays tied to real marketplace supply instead of static filler content.</p>
          </div>
        </section>

        {error ? (
          <div className="border border-line bg-surface p-8 text-center">
            <p className="text-sm font-bold text-muted">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" aria-live="polite" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border border-line bg-bg p-8 animate-pulse">
                <div className="h-12 w-12 rounded-sm bg-surface mb-6" />
                <div className="h-6 w-1/2 rounded-sm bg-surface mb-3" />
                <div className="h-4 w-3/4 rounded-sm bg-surface mb-8" />
                <div className="h-12 w-full rounded-sm bg-surface" />
              </div>
            ))}
          </div>
        ) : stateCards.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {stateCards.map((state) => (
              <Link
                key={state.name}
                to={buildStateMarketPath(state.name, CANONICAL_MARKET_ROUTE_KEY)}
                className="group border border-line bg-bg p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-accent/10 text-accent">
                    <MapPin size={26} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                    {formatNumber.format(state.count)} Listings
                  </span>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter text-ink mb-3">{state.name}</h3>
                <p className="text-xs font-medium leading-relaxed text-muted mb-6">
                  {state.manufacturerCount} active manufacturers currently represented in this market.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3 text-xs text-muted">
                    <Trees size={14} className="mt-0.5 text-accent" />
                    <div>
                      <span className="label-micro mb-1 block">Top Categories</span>
                      <span className="font-medium">
                        {state.topCategories.length ? state.topCategories.join(', ') : 'Inventory categories populating now'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-muted">
                    <Globe2 size={14} className="mt-0.5 text-accent" />
                    <div>
                      <span className="label-micro mb-1 block">Top Manufacturers</span>
                      <span className="font-medium">
                        {state.topManufacturers.length ? state.topManufacturers.join(', ') : 'Brand coverage populating now'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-accent">
                  Browse State Market
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-line bg-surface p-8 text-center">
            <p className="text-sm font-bold text-muted">State markets will appear here as soon as live marketplace inventory is published.</p>
          </div>
        )}
      </div>
    </div>
  );
}
