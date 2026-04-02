import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Globe, Mail, MapPin } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { equipmentService } from '../services/equipmentService';
import { Seller } from '../types';
import { buildDealerPath } from '../utils/seoRoutes';

function getDealerRoleLabel(role?: string): string {
  return String(role || '').trim().toLowerCase() === 'pro_dealer' ? 'Pro Dealer' : 'Dealer';
}

function getDealerDisplayName(dealer: Seller): string {
  return String(dealer.storefrontName || dealer.name || 'Dealer Storefront').trim();
}

function normalizeQueryValue(value?: string): string {
  return String(value || '').trim().toLowerCase();
}

function getWebsiteLabel(website?: string): string {
  return String(website || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/g, '');
}

export function Dealers() {
  const { theme } = useTheme();
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-secondary';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';
  const [dealers, setDealers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    const loadDealers = async () => {
      setLoading(true);
      const payload = await equipmentService.getPublicDealerDirectory();
      if (!active) return;
      setDealers(payload);
      setLoading(false);
    };

    void loadDealers();

    return () => {
      active = false;
    };
  }, []);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeQueryValue(deferredQuery);

  const sortedDealers = useMemo(() => {
    return [...dealers].sort((left, right) => getDealerDisplayName(left).localeCompare(getDealerDisplayName(right)));
  }, [dealers]);

  const filteredDealers = useMemo(() => {
    if (!normalizedQuery) {
      return sortedDealers;
    }

    return sortedDealers.filter((dealer) => {
      const haystack = [
        getDealerDisplayName(dealer),
        dealer.location,
        dealer.email,
        dealer.website,
        getDealerRoleLabel(dealer.role),
      ]
        .map((value) => normalizeQueryValue(value))
        .join(' ');

      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, sortedDealers]);

  const stats = useMemo(() => {
    const dealerCount = sortedDealers.filter((dealer) => String(dealer.role || '').trim().toLowerCase() === 'dealer').length;
    const proDealerCount = sortedDealers.filter((dealer) => String(dealer.role || '').trim().toLowerCase() === 'pro_dealer').length;

    return {
      total: sortedDealers.length,
      dealerCount,
      proDealerCount,
    };
  }, [sortedDealers]);

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Dealer Network | Active Dealer Storefronts | Forestry Equipment Sales"
        description="Browse active Forestry Equipment Sales dealer and pro dealer storefronts. Search the directory and open dealer inventory storefronts directly."
        canonicalPath="/dealers"
        imagePath="/page-photos/Forestry-Equipment-Sales-Dealers.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: 'Dealer Network',
              description: 'Browse active dealer and pro dealer storefronts on Forestry Equipment Sales.',
              url: 'https://www.forestryequipmentsales.com/dealers',
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.forestryequipmentsales.com/' },
                { '@type': 'ListItem', position: 2, name: 'Dealer Network', item: 'https://www.forestryequipmentsales.com/dealers' },
              ],
            },
            {
              '@type': 'ItemList',
              name: 'Active dealer storefronts',
              numberOfItems: sortedDealers.length,
              itemListElement: sortedDealers.slice(0, 50).map((dealer, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `https://www.forestryequipmentsales.com${buildDealerPath(dealer)}`,
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

      <Breadcrumbs
        items={[
          { label: 'Dealer Network', path: '/dealers' },
        ]}
      />

      <ImageHero
        imageSrc="/page-photos/Forestry-Equipment-Sales-Dealers.png"
        imageAlt="Forestry Equipment Sales dealer network"
        imageClassName="object-center"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Building2 size={20} className="text-accent" />
            <span className="label-micro text-accent">Dealer Network</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            Active Dealer <br />
            <span className={heroSecondaryClass}>Storefronts</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            Search every active dealer storefront on Forestry Equipment Sales. Results are ordered alphabetically and open
            directly to the seller&apos;s live storefront.
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
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-ink md:text-3xl">Search The Directory</h2>
              <p className="mt-2 text-sm font-medium text-muted">
                Search by dealer name, location, email, website, or account type.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full lg:max-w-xl">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dealers, pro dealers, locations, or websites"
                className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
              />

            </div>
          </div>

          {loading ? (
            <div className="border border-line bg-surface px-8 py-16 text-center">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">Loading Active Dealer Directory...</div>
            </div>
          ) : filteredDealers.length === 0 ? (
            <div className="border border-dashed border-line bg-surface px-8 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-bg text-accent">
                <Building2 size={24} />
              </div>
              <h3 className="mt-6 text-2xl font-black uppercase tracking-tight text-ink">No Dealers Match This Search</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted">
                Try a broader search term or clear the search field to view the full alphabetical dealer directory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {filteredDealers.map((dealer) => {
                const dealerName = getDealerDisplayName(dealer);
                const dealerPath = buildDealerPath(dealer);
                const websiteLabel = getWebsiteLabel(dealer.website);

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
                            <img src={dealer.logo} alt={dealerName} className="h-full w-full object-cover" />
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
                          </div>
                          <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
                            Active seller storefront on Forestry Equipment Sales.
                          </p>
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
                        <span className="break-all leading-relaxed">{dealer.email || 'Contact email available on storefront'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe size={16} className="mt-0.5 shrink-0 text-accent" />
                        <span className="break-all leading-relaxed">{websiteLabel || 'Website linked on storefront'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
