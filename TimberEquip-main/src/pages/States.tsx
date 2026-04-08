import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { equipmentService } from '../services/equipmentService';
import { Listing } from '../types';
import { CANONICAL_MARKET_ROUTE_KEY, buildStateMarketPath, compareRegionNames, getListingCategoryLabel, getListingManufacturer, getListingStateName } from '../utils/seoRoutes';
import { buildSiteUrl } from '../utils/siteUrl';

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
    const state = getListingStateName(listing);
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
    .sort((left, right) => compareRegionNames(left.name, right.name));
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
  const totalManufacturers = new Set(listings.map((listing) => getListingManufacturer(listing)).filter(Boolean)).size;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Equipment Markets By State',
    description: 'Browse state-level equipment market routes with direct paths into live public inventory.',
    url: buildSiteUrl('/states'),
    hasPart: stateCards.slice(0, 60).map((state, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: state.name,
      url: buildSiteUrl(buildStateMarketPath(state.name, CANONICAL_MARKET_ROUTE_KEY)),
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
            Choose a state to browse machines located there, review the strongest categories in that market, and jump straight into live listings from local sellers.
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
              <div className="label-micro mb-2">Manufacturers Represented</div>
              <div className="text-3xl font-black tracking-tight text-ink">{formatNumber.format(totalManufacturers)}</div>
            </div>
          </div>
        </div>
      </ImageHero>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <section className="mb-12 border border-line bg-surface/60 p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="label-micro text-accent mb-3 block">Regional Market Directory</span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-ink">Start With The State You Need</h2>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-muted">
                Open any state market to see what is actually available there right now, then narrow into the categories, makes, and listings that fit your job. This page is meant to help buyers get to live inventory faster, not send them through filler content.
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
            <div className="label-micro mb-2">Shop Local First</div>
            <div className="text-2xl font-black tracking-tight text-ink">{formatNumber.format(totalStates)} State Markets</div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
              Start with the state where you want to buy or move equipment, then drill into the listings already located there.
            </p>
          </div>
          <div className="border border-line bg-bg p-6">
            <div className="label-micro mb-2">Browse Real Supply</div>
            <div className="text-2xl font-black tracking-tight text-ink">{formatNumber.format(listings.length)} Live Listings</div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
              Counts are based on current approved inventory, so these state pages reflect machines buyers can actually shop today.
            </p>
          </div>
          <div className="border border-line bg-bg p-6">
            <div className="label-micro mb-2">Refine By Brand</div>
            <div className="text-2xl font-black tracking-tight text-ink">{formatNumber.format(totalManufacturers)} Manufacturers</div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
              Use each state market to move quickly into the brands and equipment families that already have live inventory in that region.
            </p>
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
                className="group border border-line bg-bg p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-xl"
              >
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="label-micro mb-2 block">State Market</span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-ink">{state.name}</h3>
                  </div>
                  <div className="rounded-sm border border-accent/20 bg-accent/8 px-4 py-3 text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-accent">Active Listings</div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-ink">{formatNumber.format(state.count)}</div>
                  </div>
                </div>

                <p className="text-xs font-medium leading-relaxed text-muted mb-6">
                  {state.manufacturerCount} active manufacturers currently represented in this market.
                </p>

                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  <div className="border border-line bg-surface/60 p-4">
                    <span className="label-micro mb-2 block">Top Categories</span>
                    <span className="text-xs font-medium leading-relaxed text-muted">
                      {state.topCategories.length ? state.topCategories.join(', ') : 'Inventory categories populating now'}
                    </span>
                  </div>
                  <div className="border border-line bg-surface/60 p-4">
                    <span className="label-micro mb-2 block">Top Manufacturers</span>
                    <span className="text-xs font-medium leading-relaxed text-muted">
                      {state.topManufacturers.length ? state.topManufacturers.join(', ') : 'Brand coverage populating now'}
                    </span>
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
