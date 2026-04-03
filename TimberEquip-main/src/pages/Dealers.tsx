import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Globe, Mail, MapPin, Navigation, Search, X } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { equipmentService } from '../services/equipmentService';
import { Seller } from '../types';
import { buildDealerPath } from '../utils/seoRoutes';

/* ── helpers ───────────────────────────────────────────────── */

function getDealerRoleLabel(role?: string): string {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'pro_dealer') return 'Pro Dealer';
  if (r === 'individual_seller') return 'Owner-Operator';
  return 'Dealer';
}

function getDealerDisplayName(dealer: Seller): string {
  return String(dealer.storefrontName || dealer.name || 'Dealer Storefront').trim();
}

function norm(value?: string): string {
  return String(value || '').trim().toLowerCase();
}

function getWebsiteLabel(website?: string): string {
  return String(website || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
function distanceMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortMode = 'alpha' | 'nearest';
type Segment = 'all' | 'equipment' | 'parts';

const SELLER_ROLES = new Set(['dealer', 'pro_dealer']);

/* ── component ─────────────────────────────────────────────── */

export function Dealers() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';

  /* ── state ───────────────────────────────────────────────── */
  const [dealers, setDealers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [displayCount, setDisplayCount] = useState(20);

  /* ── data fetch ──────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const payload = await equipmentService.getPublicDealerDirectory();
      if (!active) return;
      setDealers(payload);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  /* ── user profile location as fallback ───────────────────── */
  useEffect(() => {
    if (userCoords) return;
    if (user?.latitude && user?.longitude) {
      setUserCoords({ lat: user.latitude, lng: user.longitude });
    }
  }, [user, userCoords]);

  /* ── geolocation request ─────────────────────────────────── */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationRequested(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortMode('nearest');
        setLocationRequested(false);
      },
      (err) => {
        setLocationError(err.code === 1 ? 'Location permission denied.' : 'Unable to get your location.');
        setLocationRequested(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  /* ── derived filter option lists ─────────────────────────── */
  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    dealers.forEach((d) => {
      if (d.state) set.add(d.state);
      const parts = (d.location || '').split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) set.add(parts[parts.length >= 3 ? parts.length - 2 : 1]);
    });
    return [...set].filter(Boolean).sort();
  }, [dealers]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    dealers.forEach((d) => {
      if (d.country) { set.add(d.country); return; }
      const parts = (d.location || '').split(',').map((p) => p.trim()).filter(Boolean);
      set.add(parts.length >= 3 ? parts[parts.length - 1] : 'United States');
    });
    return [...set].filter(Boolean).sort();
  }, [dealers]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    dealers.forEach((d) => {
      (d.servicesOfferedCategories || []).forEach((c) => set.add(c));
    });
    return [...set].filter(Boolean).sort();
  }, [dealers]);

  /* ── filtering + sorting ─────────────────────────────────── */
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = norm(deferredQuery);

  const filteredDealers = useMemo(() => {
    let result = dealers.filter((d) => SELLER_ROLES.has(norm(d.role)));

    // Segment filter
    if (segment === 'equipment') {
      result = result.filter((d) =>
        (d.servicesOfferedCategories || []).some((c) => !norm(c).includes('parts') && !norm(c).includes('attachment'))
      );
    } else if (segment === 'parts') {
      result = result.filter((d) =>
        (d.servicesOfferedCategories || []).some((c) => norm(c).includes('parts') || norm(c).includes('attachment'))
      );
    }

    // State filter
    if (stateFilter) {
      result = result.filter((d) => {
        if (norm(d.state) === norm(stateFilter)) return true;
        const parts = (d.location || '').split(',').map((p) => p.trim());
        const locState = parts.length >= 3 ? parts[parts.length - 2] : (parts.length === 2 ? parts[1] : '');
        return norm(locState) === norm(stateFilter);
      });
    }

    // Country filter
    if (countryFilter) {
      result = result.filter((d) => {
        if (norm(d.country) === norm(countryFilter)) return true;
        const parts = (d.location || '').split(',').map((p) => p.trim());
        const locCountry = parts.length >= 3 ? parts[parts.length - 1] : 'United States';
        return norm(locCountry) === norm(countryFilter);
      });
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((d) =>
        (d.servicesOfferedCategories || []).some((c) => norm(c) === norm(categoryFilter))
      );
    }

    // Text search
    if (normalizedQuery) {
      result = result.filter((d) => {
        const haystack = [
          getDealerDisplayName(d),
          d.location,
          d.state,
          d.country,
          d.email,
          d.website,
          getDealerRoleLabel(d.role),
          ...(d.servicesOfferedCategories || []),
        ].map(norm).join(' ');
        return haystack.includes(normalizedQuery);
      });
    }

    // Sorting
    if (sortMode === 'nearest' && userCoords) {
      result = [...result].sort((a, b) => {
        const aDist = (a.latitude && a.longitude) ? distanceMiles(userCoords.lat, userCoords.lng, a.latitude, a.longitude) : Infinity;
        const bDist = (b.latitude && b.longitude) ? distanceMiles(userCoords.lat, userCoords.lng, b.latitude, b.longitude) : Infinity;
        return aDist - bDist;
      });
    } else {
      result = [...result].sort((a, b) => getDealerDisplayName(a).localeCompare(getDealerDisplayName(b)));
    }

    return result;
  }, [dealers, normalizedQuery, stateFilter, countryFilter, categoryFilter, segment, sortMode, userCoords]);

  /* ── stats ───────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const dealerCount = dealers.filter((d) => norm(d.role) === 'dealer').length;
    const proDealerCount = dealers.filter((d) => norm(d.role) === 'pro_dealer').length;
    return { total: dealers.length, dealerCount, proDealerCount };
  }, [dealers]);

  /* ── distance label ──────────────────────────────────────── */
  const getDealerDistance = useCallback(
    (dealer: Seller): string | null => {
      if (!userCoords || !dealer.latitude || !dealer.longitude) return null;
      const d = distanceMiles(userCoords.lat, userCoords.lng, dealer.latitude, dealer.longitude);
      if (d < 1) return '< 1 mi';
      return `${Math.round(d)} mi`;
    },
    [userCoords]
  );

  const hasActiveFilters = Boolean(stateFilter || countryFilter || categoryFilter || segment !== 'all' || normalizedQuery);

  const clearAllFilters = () => {
    setQuery('');
    setStateFilter('');
    setCountryFilter('');
    setCategoryFilter('');
    setSegment('all');
    setDisplayCount(20);
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Find Forestry Equipment Dealers & Manufacturers | Forestry Equipment Sales"
        description="Search forestry equipment dealers and manufacturers by name, state, country, and category. Sort by nearest location. Browse dealer and pro dealer storefronts."
        canonicalPath="/dealers"
        imagePath="/page-photos/Forestry-Equipment-Sales-Dealers.png"
        preloadImage="/page-photos/dealers.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: 'Find Forestry Equipment Dealers & Manufacturers',
              description: 'Search forestry equipment dealers and manufacturers by name, state, country, and category.',
              url: 'https://timberequip.com/dealers',
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://timberequip.com/' },
                { '@type': 'ListItem', position: 2, name: 'Dealers', item: 'https://timberequip.com/dealers' },
              ],
            },
            {
              '@type': 'ItemList',
              name: 'Active dealer storefronts',
              numberOfItems: filteredDealers.length,
              itemListElement: filteredDealers.slice(0, 50).map((dealer, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `https://timberequip.com${buildDealerPath(dealer)}`,
                item: {
                  '@type': 'Organization',
                  name: getDealerDisplayName(dealer),
                  address: dealer.location || undefined,
                },
              })),
            },
          ],
        }}
      />

      <Breadcrumbs items={[{ label: 'Dealers & Manufacturers', path: '/dealers' }]} />

      <ImageHero
        imageSrc="/page-photos/dealers.png"
        imageAlt="Forestry Equipment Sales dealer network"
        imageClassName="object-center"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Building2 size={20} className="text-accent" />
            <span className="label-micro text-accent">Dealer & Manufacturer Directory</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            Find Forestry Equipment <br />
            <span className={heroSecondaryClass}>Dealers & Manufacturers</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            Search by name, state, country, or category served. Segment by equipment or parts &amp; attachments.
            Sort by nearest location to find dealers close to you.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-12 max-w-lg sm:grid-cols-3">
            {[
              { label: 'Active Storefronts', value: stats.total },
              { label: 'Dealers', value: stats.dealerCount },
              { label: 'Pro Dealers', value: stats.proDealerCount },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`border border-line p-5 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/35' : 'bg-white/88'}`}
              >
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/50' : 'text-muted'}`}>
                  {stat.label}
                </div>
                <div className={`mt-3 text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-ink'}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ImageHero>

      <section className="px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1600px]">
          {/* ── Search + Filters ─────────────────────────────── */}
          <div className="mb-10 space-y-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-ink md:text-3xl">Search The Directory</h2>
              <p className="mt-2 text-sm font-medium text-muted">
                Search by dealer name, state, country, category served, or sort by nearest.
              </p>
            </div>

            {/* Search bar row */}
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setDisplayCount(20); }}
                  placeholder="Search by name, location, category..."
                  className="input-industrial w-full pl-9 pr-3 text-[10px] font-bold uppercase tracking-widest"
                />
              </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted">State</label>
                <select
                  value={stateFilter}
                  onChange={(e) => { setStateFilter(e.target.value); setDisplayCount(20); }}
                  className="input-industrial px-3 py-2 text-[10px] font-bold uppercase tracking-widest min-w-[140px]"
                >
                  <option value="">All States</option>
                  {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => { setCountryFilter(e.target.value); setDisplayCount(20); }}
                  className="input-industrial px-3 py-2 text-[10px] font-bold uppercase tracking-widest min-w-[140px]"
                >
                  <option value="">All Countries</option>
                  {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted">Category Served</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setDisplayCount(20); }}
                  className="input-industrial px-3 py-2 text-[10px] font-bold uppercase tracking-widest min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted">Segment</label>
                <div className="flex">
                  {([['all', 'All'], ['equipment', 'Equipment'], ['parts', 'Parts & Attachments']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setSegment(key); setDisplayCount(20); }}
                      className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border transition-colors first:rounded-l-sm last:rounded-r-sm ${
                        segment === key
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface border-line text-muted hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted">Sort</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSortMode('alpha')}
                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border rounded-sm transition-colors ${
                      sortMode === 'alpha' ? 'bg-accent text-white border-accent' : 'bg-surface border-line text-muted hover:text-ink'
                    }`}
                  >
                    A-Z
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (userCoords) {
                        setSortMode('nearest');
                      } else {
                        requestLocation();
                      }
                    }}
                    disabled={locationRequested}
                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border rounded-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                      sortMode === 'nearest' ? 'bg-accent text-white border-accent' : 'bg-surface border-line text-muted hover:text-ink'
                    }`}
                  >
                    <Navigation size={12} />
                    {locationRequested ? 'Locating...' : 'Nearest'}
                  </button>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-accent border border-accent/30 rounded-sm hover:bg-accent/5 transition-colors flex items-center gap-1.5"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>

            {locationError && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">{locationError}</p>
            )}
          </div>

          {/* ── Results info ──────────────────────────────────── */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              {filteredDealers.length} dealer{filteredDealers.length !== 1 ? 's' : ''}
              {sortMode === 'nearest' && userCoords ? ' sorted by distance' : ' sorted alphabetically'}
            </span>
          </div>

          {/* ── Dealer cards ─────────────────────────────────── */}
          {loading ? (
            <div className="border border-line bg-surface px-8 py-16 text-center">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">Loading Dealer Directory...</div>
            </div>
          ) : filteredDealers.length === 0 ? (
            <div className="border border-dashed border-line bg-surface px-8 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-bg text-accent">
                <Building2 size={24} />
              </div>
              <h3 className="mt-6 text-2xl font-black uppercase tracking-tight text-ink">No Dealers Match</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted">
                Try a broader search or clear filters to view the full directory.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {filteredDealers.slice(0, displayCount).map((dealer) => {
                  const dealerName = getDealerDisplayName(dealer);
                  const dealerPath = buildDealerPath(dealer);
                  const websiteLabel = getWebsiteLabel(dealer.website);
                  const distance = getDealerDistance(dealer);

                  return (
                    <Link
                      key={dealer.id}
                      to={dealerPath}
                      className="group border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-accent/35 hover:shadow-xl"
                    >
                      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-bg text-accent">
                            {dealer.logo ? (
                              <img src={dealer.logo} alt={dealerName} width={56} height={56} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <Building2 size={24} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="truncate text-2xl font-black uppercase tracking-tight text-ink">{dealerName}</h3>
                              <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent">
                                {getDealerRoleLabel(dealer.role)}
                              </span>
                              {distance && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-data/20 bg-data/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-data">
                                  <Navigation size={10} />
                                  {distance}
                                </span>
                              )}
                            </div>
                            {(dealer.servicesOfferedCategories?.length ?? 0) > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {dealer.servicesOfferedCategories!.slice(0, 4).map((cat) => (
                                  <span key={cat} className="rounded-sm bg-bg border border-line px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                                    {cat}
                                  </span>
                                ))}
                                {(dealer.servicesOfferedCategories!.length > 4) && (
                                  <span className="rounded-sm bg-bg border border-line px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                                    +{dealer.servicesOfferedCategories!.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start text-[11px] font-black uppercase tracking-[0.18em] text-accent">
                          <span>Open Storefront</span>
                          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-muted sm:grid-cols-3">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
                          <span className="leading-relaxed">{dealer.location || 'Location available on storefront'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail size={16} className="mt-0.5 shrink-0 text-accent" />
                          <span className="break-all leading-relaxed">{dealer.email || 'Contact on storefront'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Globe size={16} className="mt-0.5 shrink-0 text-accent" />
                          <span className="break-all leading-relaxed">{websiteLabel || 'Website on storefront'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {filteredDealers.length > displayCount && (
                <button
                  type="button"
                  onClick={() => setDisplayCount((prev) => prev + 20)}
                  className="mt-8 w-full py-4 text-center text-[10px] font-black uppercase tracking-widest text-accent border border-line bg-surface hover:bg-bg transition-colors rounded-sm"
                >
                  View More ({filteredDealers.length - displayCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
