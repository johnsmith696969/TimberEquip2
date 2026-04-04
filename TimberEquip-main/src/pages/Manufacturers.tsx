import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers3, MapPin, Settings } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { equipmentService } from '../services/equipmentService';
import { Listing } from '../types';
import { buildManufacturerPath, getListingCategoryLabel, getListingManufacturer, getStateFromLocation } from '../utils/seoRoutes';

type ManufacturerCard = {
  name: string;
  count: number;
  averagePrice: number | null;
  topCategories: string[];
  topStates: string[];
};

function buildManufacturerCards(listings: Listing[]): ManufacturerCard[] {
  const manufacturerMap = new Map<
    string,
    {
      count: number;
      priceTotal: number;
      priceSamples: number;
      categories: Map<string, number>;
      states: Map<string, number>;
    }
  >();

  listings.forEach((listing) => {
    const manufacturer = getListingManufacturer(listing);
    if (!manufacturer) return;

    const state = getStateFromLocation(listing.location);
    const category = getListingCategoryLabel(listing);
    const entry = manufacturerMap.get(manufacturer) || {
      count: 0,
      priceTotal: 0,
      priceSamples: 0,
      categories: new Map<string, number>(),
      states: new Map<string, number>(),
    };

    entry.count += 1;
    if (Number.isFinite(listing.price) && listing.price > 0) {
      entry.priceTotal += listing.price;
      entry.priceSamples += 1;
    }
    if (category) entry.categories.set(category, (entry.categories.get(category) || 0) + 1);
    if (state) entry.states.set(state, (entry.states.get(state) || 0) + 1);

    manufacturerMap.set(manufacturer, entry);
  });

  const sortCounts = (counts: Map<string, number>) =>
    [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 3)
      .map(([label]) => label);

  return [...manufacturerMap.entries()]
    .map(([name, entry]) => ({
      name,
      count: entry.count,
      averagePrice: entry.priceSamples > 0 ? Math.round(entry.priceTotal / entry.priceSamples) : null,
      topCategories: sortCounts(entry.categories),
      topStates: sortCounts(entry.states),
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function Manufacturers() {
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
        console.error('Failed to load manufacturer index:', loadError);
        if (!active) return;
        setError('Unable to load manufacturers right now. Please try again.');
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

  const manufacturerCards = useMemo(() => buildManufacturerCards(listings), [listings]);
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';
  const formatNumber = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );

  const totalInventory = listings.length;
  const activeManufacturers = manufacturerCards.length;
  const topManufacturer = manufacturerCards[0];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Equipment Manufacturers',
    description: 'Browse equipment manufacturers with direct paths into live marketplace inventory.',
    url: 'https://timberequip.com/manufacturers',
    hasPart: manufacturerCards.slice(0, 60).map((manufacturer, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: manufacturer.name,
      url: `https://timberequip.com${buildManufacturerPath(manufacturer.name)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Equipment Manufacturers | Forestry Equipment Sales"
        description="Browse equipment manufacturers with direct paths into live marketplace inventory, top machine categories, and regional availability."
        canonicalPath="/manufacturers"
        jsonLd={jsonLd}
        preloadImage="/page-photos/john-deere-harvester.webp"
      />
      <Breadcrumbs />

      <ImageHero imageSrc="/page-photos/john-deere-harvester.webp" imageAlt="Forestry harvester in the field">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Settings size={20} className="text-accent" />
            <span className="label-micro text-accent">Manufacturer Directory</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            Equipment <br />
            <span className={heroSecondaryClass}>Manufacturers</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            Start with the brands buyers trust most. Open a manufacturer page to see who has that make in stock, what machine types are available, and where inventory is showing up right now.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="border border-line bg-bg/90 p-5 backdrop-blur-sm">
              <div className="label-micro mb-2">Active Manufacturers</div>
              <div className="text-3xl font-black tracking-tight text-ink">{formatNumber.format(activeManufacturers)}</div>
            </div>
            <div className="border border-line bg-bg/90 p-5 backdrop-blur-sm">
              <div className="label-micro mb-2">Live Listings</div>
              <div className="text-3xl font-black tracking-tight text-ink">{formatNumber.format(totalInventory)}</div>
            </div>
            <div className="border border-line bg-bg/90 p-5 backdrop-blur-sm">
              <div className="label-micro mb-2">Top Brand</div>
              <div className="text-xl font-black uppercase tracking-tight text-ink">{topManufacturer?.name || 'Pending'}</div>
            </div>
          </div>
        </div>
      </ImageHero>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <section className="mb-12 border border-line bg-surface p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="label-micro text-accent mb-3 block">Route Index</span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-ink">Browse Brands With Live Inventory</h2>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-muted">
                Use these brand pages to compare current market availability, jump into matching machine categories, and find nearby inventory without digging through the full search first.
              </p>
            </div>
            <Link to="/search" className="btn-industrial btn-accent py-4 px-6 w-full md:w-auto text-center">
              Open Full Search
              <ArrowRight className="ml-2" size={14} />
            </Link>
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
        ) : manufacturerCards.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {manufacturerCards.map((manufacturer) => (
              <Link
                key={manufacturer.name}
                to={buildManufacturerPath(manufacturer.name)}
                className="group border border-line bg-bg p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-accent/10 text-accent">
                    <Settings size={26} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                    {formatNumber.format(manufacturer.count)} Listings
                  </span>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter text-ink mb-3">{manufacturer.name}</h3>
                <p className="text-xs font-medium leading-relaxed text-muted mb-6">
                  {manufacturer.averagePrice
                    ? `Average asking price ${formatCurrency.format(manufacturer.averagePrice)} across current public inventory.`
                    : 'Open the manufacturer route to browse current public inventory.'}
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3 text-xs text-muted">
                    <Layers3 size={14} className="mt-0.5 text-accent" />
                    <div>
                      <span className="label-micro mb-1 block">Top Categories</span>
                      <span className="font-medium">
                        {manufacturer.topCategories.length ? manufacturer.topCategories.join(', ') : 'Inventory categories populating now'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-muted">
                    <MapPin size={14} className="mt-0.5 text-accent" />
                    <div>
                      <span className="label-micro mb-1 block">Top Markets</span>
                      <span className="font-medium">
                        {manufacturer.topStates.length ? manufacturer.topStates.join(', ') : 'Regional inventory populating now'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-accent">
                  Browse Manufacturer Route
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-line bg-surface p-8 text-center">
            <p className="text-sm font-bold text-muted">Manufacturers will appear here as soon as live marketplace inventory is published.</p>
          </div>
        )}
      </div>
    </div>
  );
}
