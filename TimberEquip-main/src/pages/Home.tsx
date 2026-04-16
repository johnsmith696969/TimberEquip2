import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  Globe,
  ArrowRight,
  Zap,
  Truck,
  Hammer,
  Settings,
  Activity,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  Package,
  Search as SearchIcon,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Listing } from '../types';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { useLocale } from '../components/LocaleContext';
import { useAuth } from '../components/AuthContext';
import { appendReturnToParam, getListEquipmentPath, rememberSellerReturnTo } from '../utils/sellerAccess';
import {
  buildMarketplaceCategoryFamilies,
  getMarketplaceSubcategories,
} from '../utils/marketplaceCategoryFamilies';
import { compareRegionNames, getListingLocationLabel, normalizeSeoSlug, buildManufacturerPath, buildStateMarketPath, getListingManufacturer, getListingStateName, CANONICAL_MARKET_ROUTE_KEY } from '../utils/seoRoutes';
import { EQUIPMENT_TAXONOMY } from '../constants/equipmentData';
import { buildSiteUrl } from '../utils/siteUrl';
import {
  LoggingEquipmentIcon,
  LandClearingEquipmentIcon,
  FirewoodEquipmentIcon,
  TreeServiceEquipmentIcon,
  SawmillEquipmentIcon,
  TrailersIcon,
  TrucksIcon,
  PartsAndAttachmentsIcon,
} from '../components/CategoryIcons';

const ListingCard = lazy(() => import('../components/ListingCard').then((module) => ({ default: module.ListingCard })));

const TOP_LEVEL_CATEGORY_VISUALS: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  'Logging Equipment': { icon: LoggingEquipmentIcon, color: 'bg-orange-500/10 text-orange-500' },
  'Land Clearing Equipment': { icon: LandClearingEquipmentIcon, color: 'bg-yellow-500/10 text-yellow-500' },
  'Firewood Equipment': { icon: FirewoodEquipmentIcon, color: 'bg-red-500/10 text-red-500' },
  'Tree Service Equipment': { icon: TreeServiceEquipmentIcon, color: 'bg-green-600/10 text-green-600' },
  'Sawmill Equipment': { icon: SawmillEquipmentIcon, color: 'bg-amber-500/10 text-amber-500' },
  Trailers: { icon: TrailersIcon, color: 'bg-blue-600/10 text-blue-600' },
  Trucks: { icon: TrucksIcon, color: 'bg-slate-600/10 text-slate-600' },
  'Parts And Attachments': { icon: PartsAndAttachmentsIcon, color: 'bg-sky-600/10 text-sky-600' },
};

const SUBCATEGORY_MARKET_ORDER = [
  'Bogie Skidders',
  'Chippers',
  'Delimbers',
  'Dozers With Winch',
  'Excavators',
  'Feller Bunchers',
  'Firewood Processors',
  'Forwarders',
  'Harvesters',
  'Log Loaders',
  'Mulchers',
  'Skidders',
];

const HERO_ASSET_VERSION = '20260415a';
const HERO_IMAGE_MOBILE_PATH = `/page-photos/grapple-hero-image-mobile.webp?v=${HERO_ASSET_VERSION}`;
const HERO_IMAGE_1280_PATH = `/page-photos/grapple-hero-image-1280.webp?v=${HERO_ASSET_VERSION}`;
const HERO_IMAGE_1600_PATH = `/page-photos/grapple-hero-image-1600.webp?v=${HERO_ASSET_VERSION}`;
const HERO_IMAGE_SRC_SET = `${HERO_IMAGE_1280_PATH} 1280w, ${HERO_IMAGE_1600_PATH} 1600w`;
const HERO_IMAGE_PRELOAD_SRC_SET = `${HERO_IMAGE_MOBILE_PATH} 768w, ${HERO_IMAGE_1280_PATH} 1280w, ${HERO_IMAGE_1600_PATH} 1600w`;

const formatChange = (value: unknown) => {
  const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(1)}%`;
};

const safeUppercase = (value: unknown, fallback = 'UNKNOWN') => {
  const normalized = String(value || '').trim();
  return normalized ? normalized.toUpperCase() : fallback;
};

const CATEGORY_SINGULAR_LABELS: Record<string, string> = {
  Skidders: 'Skidder',
  'Bogie Skidders': 'Bogie Skidder',
  'Feller Bunchers': 'Feller Buncher',
  Harvesters: 'Harvester',
  Chippers: 'Chipper',
  Delimbers: 'Delimber',
  Forwarders: 'Forwarder',
  'Dozers With Winch': 'Dozer With Winch',
  'Log Loaders': 'Log Loader',
  'Firewood Processors': 'Firewood Processor',
  Excavators: 'Excavator',
  Mulchers: 'Mulcher',
};

const toSingularCategoryLabel = (category: string) => CATEGORY_SINGULAR_LABELS[category] || category;

const HOMEPAGE_SEO_DESCRIPTION =
  'Buy and sell new and used forestry and logging equipment. Browse skidders, forwarders, feller bunchers, chippers, log loaders, processors, and more for sale near you by category, manufacturer, dealer, and state.';

type HomeMarketplaceData = {
  categoryMetrics?: Array<{
    category: string;
    activeCount: number;
    weeklyChangePercent: number;
    averagePrice: number | null;
    previousWeekCount: number;
  }>;
  featuredListings?: Listing[];
  recentSoldListings?: Listing[];
  heroStats?: { totalActive: number; totalMarketValue: number };
};

const buildCategoryMetricMap = (marketplaceData?: HomeMarketplaceData | null) =>
  (marketplaceData?.categoryMetrics || []).reduce<Record<string, { activeCount: number; weeklyChangePercent: number; averagePrice: number | null; previousWeekCount: number }>>((acc, item) => {
    acc[item.category] = {
      activeCount: item.activeCount,
      weeklyChangePercent: item.weeklyChangePercent,
      averagePrice: item.averagePrice,
      previousWeekCount: item.previousWeekCount,
    };
    return acc;
  }, {});

export function Home() {
  const location = useLocation();
  const { theme } = useTheme();
  const { t, formatNumber, formatCurrency } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentSoldListings, setRecentSoldListings] = useState<Listing[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<Record<string, { activeCount: number; weeklyChangePercent: number; averagePrice: number | null; previousWeekCount: number }>>({});
  const [heroStats, setHeroStats] = useState<{ totalActive: number; totalMarketValue: number }>({ totalActive: 0, totalMarketValue: 0 });
  const listEquipmentPath = getListEquipmentPath(user, isAuthenticated);
  const currentReturnPath = `${location.pathname}${location.search}`;
  const listEquipmentHref = appendReturnToParam(listEquipmentPath, currentReturnPath);
  const listEquipmentState = currentReturnPath.startsWith('/') ? { returnTo: currentReturnPath } : undefined;
  const handleListEquipmentClick = () => rememberSellerReturnTo(currentReturnPath);

  const [allListings, setAllListings] = useState<Listing[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const { equipmentService } = await import('../services/equipmentService');
        if (cancelled) return;

        const [marketplaceData, inventory] = await Promise.all([
          equipmentService.getHomeMarketplaceData(),
          equipmentService.getListings().catch((error) => {
            console.warn('State market preview on home page is temporarily unavailable:', error);
            return [] as Listing[];
          }),
        ]);

        setFeaturedListings(marketplaceData.featuredListings);
        setRecentSoldListings(marketplaceData.recentSoldListings);
        setCategoryMetrics(buildCategoryMetricMap(marketplaceData));
        setHeroStats(marketplaceData.heroStats);
        setAllListings(inventory);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    const timeoutId = window.setTimeout(fetchData, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const tickerListings = recentSoldListings.length > 0 ? recentSoldListings : featuredListings;

  const categoryCards = buildMarketplaceCategoryFamilies(
    Object.entries(categoryMetrics).map(([category, metric]) => ({
      category,
      activeCount: metric.activeCount,
      previousWeekCount: metric.previousWeekCount,
      weeklyChangePercent: metric.weeklyChangePercent,
      averagePrice: metric.averagePrice,
    }))
  ).map((category) => {
    const visual = TOP_LEVEL_CATEGORY_VISUALS[category.name] || { icon: Activity, color: 'bg-slate-500/10 text-slate-500' };
    return {
      ...category,
      icon: visual.icon,
      color: visual.color,
    };
  });

  const [selectedCategoryFamily, setSelectedCategoryFamily] = useState('Logging Equipment');

  useEffect(() => {
    if (!categoryCards.length) return;
    if (categoryCards.some((category) => category.name === selectedCategoryFamily)) return;
    setSelectedCategoryFamily(categoryCards[0].name);
  }, [categoryCards, selectedCategoryFamily]);

  const totalActiveListings = heroStats.totalActive;
  const totalMarketValue = heroStats.totalMarketValue;

  // ── Market Intelligence Cards ──────────────────────────────────────────────
  // Build one "Index" card (avg price) + one "Supply" card (active units) for
  // every category that has data.
  const CATEGORY_CARD_META: Record<string, { indexIcon: React.ComponentType<{ size?: number }>; supplyIcon: React.ComponentType<{ size?: number }>; indexColor: string; supplyColor: string }> = {
    Skidders:             { indexIcon: TrendingUp, supplyIcon: Truck,          indexColor: 'bg-blue-500/10 text-blue-500',     supplyColor: 'bg-blue-400/10 text-blue-400' },
    'Feller Bunchers':    { indexIcon: TrendingUp, supplyIcon: Hammer,         indexColor: 'bg-orange-500/10 text-orange-500', supplyColor: 'bg-orange-400/10 text-orange-400' },
    Harvesters:           { indexIcon: TrendingUp, supplyIcon: Settings,        indexColor: 'bg-emerald-500/10 text-emerald-500', supplyColor: 'bg-emerald-400/10 text-emerald-400' },
    Forwarders:           { indexIcon: TrendingUp, supplyIcon: Package,         indexColor: 'bg-cyan-500/10 text-cyan-500',     supplyColor: 'bg-cyan-400/10 text-cyan-400' },
    'Bogie Skidders':     { indexIcon: TrendingUp, supplyIcon: Truck,          indexColor: 'bg-sky-500/10 text-sky-500',       supplyColor: 'bg-sky-400/10 text-sky-400' },
    Chippers:             { indexIcon: TrendingUp, supplyIcon: Zap,            indexColor: 'bg-lime-500/10 text-lime-500',     supplyColor: 'bg-lime-400/10 text-lime-400' },
    Delimbers:            { indexIcon: TrendingUp, supplyIcon: Activity,        indexColor: 'bg-rose-500/10 text-rose-500',     supplyColor: 'bg-rose-400/10 text-rose-400' },
    'Dozers With Winch':  { indexIcon: TrendingUp, supplyIcon: Package,         indexColor: 'bg-yellow-500/10 text-yellow-600', supplyColor: 'bg-yellow-400/10 text-yellow-500' },
    'Log Loaders':        { indexIcon: TrendingUp, supplyIcon: Activity,        indexColor: 'bg-red-500/10 text-red-500',       supplyColor: 'bg-red-400/10 text-red-400' },
    'Firewood Processors':{ indexIcon: TrendingUp, supplyIcon: Zap,            indexColor: 'bg-amber-500/10 text-amber-500',   supplyColor: 'bg-amber-400/10 text-amber-400' },
    Excavators:           { indexIcon: TrendingUp, supplyIcon: LayoutDashboard, indexColor: 'bg-purple-500/10 text-purple-500', supplyColor: 'bg-purple-400/10 text-purple-400' },
    Mulchers:             { indexIcon: TrendingUp, supplyIcon: Hammer,         indexColor: 'bg-teal-500/10 text-teal-500',    supplyColor: 'bg-teal-400/10 text-teal-400' },
  };

  interface MarketCard {
    key: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number }>;
    iconClass: string;
    badge: string;
    badgeClass: string;
    value: string;
    unit: string;
    linkCategory: string;
  }

  const marketCards: MarketCard[] = [
    ...SUBCATEGORY_MARKET_ORDER.flatMap((cat) => {
      const metric = categoryMetrics[cat];
      const meta = CATEGORY_CARD_META[cat];
      if (!meta) return [];
      const singularCat = toSingularCategoryLabel(cat);
      const hasWeeklyChange = typeof metric?.weeklyChangePercent === 'number' && Number.isFinite(metric.weeklyChangePercent);
      const weeklyBadge = metric && hasWeeklyChange ? `${formatChange(metric.weeklyChangePercent)} Weekly` : 'No Data Yet';
      const shortPluralCat = cat.replace(' Bunchers', '').replace(' Processors', ' Proc.').replace('Log ', '');
      const shortSingularCat = toSingularCategoryLabel(cat)
        .replace(' Buncher', '')
        .replace(' Processor', ' Proc.')
        .replace('Log ', '');
      return [
        {
          key: `${cat}-index`,
          title: `${shortSingularCat} Index`,
          description: `Average asking price across all active ${singularCat} listings on the platform.`,
          icon: meta.indexIcon,
          iconClass: meta.indexColor,
          badge: weeklyBadge,
          badgeClass: metric ? 'text-data' : 'text-muted',
          value: typeof metric?.averagePrice === 'number' && Number.isFinite(metric.averagePrice)
            ? formatCurrency(metric.averagePrice, 'USD', 0)
            : 'N/A',
          unit: t('home.avgPrice', 'Avg Price'),
          linkCategory: cat,
        },
        {
          key: `${cat}-supply`,
          title: `${shortPluralCat} Supply`,
          description: `Live active inventory count for ${cat}. Updates as listings are added or sold.`,
          icon: meta.supplyIcon,
          iconClass: meta.supplyColor,
          badge: weeklyBadge,
          badgeClass: metric ? 'text-accent' : 'text-muted',
          value: typeof metric?.activeCount === 'number' && Number.isFinite(metric.activeCount)
            ? formatNumber(metric.activeCount)
            : '0',
          unit: t('home.activeUnits', 'Active Units'),
          linkCategory: cat,
        },
      ];
    })
  ];

  const [carouselIndex, setCarouselIndex] = useState(0);
  const swipeRef = useRef<{ startX: number; swiping: boolean }>({ startX: 0, swiping: false });
  const [mfgSearch, setMfgSearch] = useState('');

  const allManufacturers = useMemo(() => {
    const counts = new Map<string, number>();
    allListings.forEach((listing) => {
      const mfg = getListingManufacturer(listing).trim();
      if (mfg) counts.set(mfg, (counts.get(mfg) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [allListings]);

  const filteredManufacturers = useMemo(() => {
    if (!mfgSearch.trim()) return allManufacturers;
    const q = mfgSearch.trim().toLowerCase();
    return allManufacturers.filter((m) => m.toLowerCase().includes(q));
  }, [allManufacturers, mfgSearch]);

  const topStates = useMemo(() => {
    const counts = new Map<string, number>();
    allListings.forEach((listing) => {
      const state = getListingStateName(listing).trim();
      if (state) counts.set(state, (counts.get(state) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => compareRegionNames(a[0], b[0]))
      .slice(0, 16)
      .map(([name, count]) => ({ name, count }));
  }, [allListings]);

  const visibleCards = marketCards.length <= 3
    ? marketCards
    : [0, 1, 2].map((offset) => marketCards[(carouselIndex + offset) % marketCards.length]);
  const homeJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': buildSiteUrl('/#organization'),
          name: 'Forestry Equipment Sales',
          alternateName: ['FES', 'Forestry Equipment Sales.com'],
          url: buildSiteUrl('/'),
          logo: {
            '@type': 'ImageObject',
            url: buildSiteUrl('/Forestry_Equipment_Sales_Logo.png?v=20260405c'),
            width: 512,
            height: 512,
          },
          email: 'info@forestryequipmentsales.com',
          telephone: '+1-218-720-0933',
          description: HOMEPAGE_SEO_DESCRIPTION,
          address: {
            '@type': 'PostalAddress',
            streetAddress: '1518 E Superior St',
            addressLocality: 'Duluth',
            addressRegion: 'MN',
            postalCode: '55812',
            addressCountry: 'US',
          },
          sameAs: [
            'https://www.facebook.com/ForestryEquipmentSales',
            'https://www.youtube.com/@ForestryequipmentsalesOnline',
            'https://linkedin.com/company/forestryequipmentsales',
          ],
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              telephone: '+1-218-720-0933',
              email: 'support@forestryequipmentsales.com',
              availableLanguage: 'English',
            },
            {
              '@type': 'ContactPoint',
              contactType: 'sales',
              telephone: '+1-218-720-0933',
              email: 'info@forestryequipmentsales.com',
              availableLanguage: 'English',
            },
          ],
        },
        {
          '@type': 'WebSite',
          '@id': buildSiteUrl('/#website'),
          name: 'Forestry Equipment Sales',
          url: buildSiteUrl('/'),
          inLanguage: 'en-US',
          publisher: { '@id': buildSiteUrl('/#organization') },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: buildSiteUrl('/search?q={search_term_string}'),
            },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'WebPage',
          '@id': buildSiteUrl('/#webpage'),
          name: 'Logging Equipment For Sale | Forestry Equipment Sales',
          description: HOMEPAGE_SEO_DESCRIPTION,
          url: buildSiteUrl('/'),
          isPartOf: { '@id': buildSiteUrl('/#website') },
          about: { '@id': buildSiteUrl('/#organization') },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: buildSiteUrl('/Forestry_Equipment_Sales_Logo.png?v=20260405c'),
          },
        },
        {
          '@type': 'CollectionPage',
          name: 'Forestry Equipment For Sale | Equipment Marketplace',
          description: HOMEPAGE_SEO_DESCRIPTION,
          url: buildSiteUrl('/'),
          isPartOf: { '@id': buildSiteUrl('/#website') },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: buildSiteUrl('/') },
          ],
        },
        {
          '@type': 'SiteNavigationElement',
          name: 'Main Navigation',
          url: buildSiteUrl('/'),
          hasPart: [
            { '@type': 'WebPage', name: 'Search Inventory', url: buildSiteUrl('/search') },
            { '@type': 'WebPage', name: 'Equipment Categories', url: buildSiteUrl('/categories') },
            { '@type': 'WebPage', name: 'Ad Programs', url: buildSiteUrl('/ad-programs') },
            { '@type': 'WebPage', name: 'Hosted Websites', url: buildSiteUrl('/dealer-hosting') },
            { '@type': 'WebPage', name: 'Financing', url: buildSiteUrl('/financing') },
            { '@type': 'WebPage', name: 'Dealers', url: buildSiteUrl('/dealers') },
            { '@type': 'WebPage', name: 'Equipment News', url: buildSiteUrl('/blog') },
          ],
        },
        {
          '@type': 'ItemList',
          name: 'Primary marketplace routes',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Forestry Equipment For Sale', url: buildSiteUrl('/forestry-equipment-for-sale') },
            { '@type': 'ListItem', position: 2, name: 'Equipment Categories', url: buildSiteUrl('/categories') },
            { '@type': 'ListItem', position: 3, name: 'Equipment Manufacturers', url: buildSiteUrl('/manufacturers') },
            { '@type': 'ListItem', position: 4, name: 'Equipment Markets By State', url: buildSiteUrl('/states') },
            { '@type': 'ListItem', position: 5, name: 'Equipment Dealers', url: buildSiteUrl('/dealers') },
          ],
        },
      ],
    }),
    []
  );

  const marketIntelligenceSection = (
    <section className="bg-bg px-4 py-24 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-16 flex flex-col justify-between md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="label-micro mb-4 block text-accent">{t('home.marketData', 'Market Data')}</span>
            <h2 className="mb-6 text-4xl font-black uppercase tracking-tighter leading-none md:text-5xl">
              {t('home.analyticsTitleLine1', 'Real-Time')} <br />
              <span className="text-muted">{t('home.analyticsTitleLine2', 'Equipment Analytics')}</span>
            </h2>
            <p className="font-medium text-muted">
              {t('home.analyticsDescription', 'See average market values, recent price changes, and listing counts across every equipment category.')}
            </p>
          </div>
          <div className="mt-8 flex items-center space-x-3 md:mt-0">
            {marketCards.length > 3 && (
              <>
                <button
                  aria-label="Previous"
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + marketCards.length) % marketCards.length)}
                  className="btn-industrial p-2"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest tabular-nums text-muted">
                  {carouselIndex + 1} / {marketCards.length}
                </span>
                <button
                  aria-label="Next"
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % marketCards.length)}
                  className="btn-industrial p-2"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            <Link to="/blog" className="btn-industrial">
              {t('home.accessReports', 'Access Reports')}
              <ChevronRight className="ml-2" size={14} />
            </Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={carouselIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }}
            className="grid grid-cols-1 gap-1 md:grid-cols-3"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={(e) => {
              swipeRef.current = { startX: e.clientX, swiping: true };
            }}
            onPointerMove={(e) => {
              void e;
            }}
            onPointerUp={(e) => {
              if (!swipeRef.current.swiping) return;
              const delta = e.clientX - swipeRef.current.startX;
              swipeRef.current.swiping = false;
              if (delta < -50) {
                setCarouselIndex((prev) => (prev + 1) % marketCards.length);
              } else if (delta > 50) {
                setCarouselIndex((prev) => (prev - 1 + marketCards.length) % marketCards.length);
              }
            }}
            onPointerCancel={() => {
              swipeRef.current.swiping = false;
            }}
          >
            {visibleCards.map((card) => (
              <div
                key={card.key}
                className="flex flex-col rounded-sm border border-line bg-surface p-8 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="mb-12 flex items-start justify-between">
                  <div className={`rounded-sm p-3 ${card.iconClass}`}>
                    <card.icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-black uppercase">{card.title}</h3>
                <p className="mb-8 flex-1 text-xs text-muted">{card.description}</p>
                <div className="flex items-end justify-between">
                  <div className="flex items-end space-x-1">
                    <span className="text-3xl font-black tracking-tighter">{card.value}</span>
                    <span className="mb-1.5 text-[10px] font-bold uppercase text-muted">{card.unit}</span>
                  </div>
                  {card.linkCategory && (
                    <Link
                      to={`/search?subcategory=${encodeURIComponent(card.linkCategory)}`}
                      className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                    >
                      {t('home.view', 'View')} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {marketCards.length > 3 && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-muted animate-pulse md:hidden">
            <ChevronLeft size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Swipe to explore</span>
            <ChevronRight size={12} />
          </div>
        )}

        {marketCards.length > 3 && (
          <div className="mt-4 flex justify-center space-x-1.5">
            {marketCards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                aria-label={`Go to card ${i + 1}`}
                className={`h-3 w-3 touch-manipulation rounded-full transition-colors ${
                  i === carouselIndex ? 'bg-accent' : 'bg-line hover:bg-muted'
                }`}
                style={{ minWidth: 44, minHeight: 44, padding: 16, margin: -14, backgroundClip: 'content-box' }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col">
      <Seo
        title="Logging Equipment For Sale | Forestry Equipment Sales"
        description={HOMEPAGE_SEO_DESCRIPTION}
        canonicalPath="/"
        jsonLd={homeJsonLd}
        imagePath="/Forestry_Equipment_Sales_Logo.png?v=20260405c"
        preloadImage={HERO_IMAGE_1600_PATH}
        preloadImageSrcSet={HERO_IMAGE_PRELOAD_SRC_SET}
        preloadImageSizes="100vw"
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-bg">
        <div className="absolute inset-0 z-0 bg-ink">
          <picture>
            <source media="(max-width: 767px)" srcSet={HERO_IMAGE_MOBILE_PATH} />
            <source srcSet={HERO_IMAGE_SRC_SET} sizes="100vw" />
            <img
              src={HERO_IMAGE_1600_PATH}
              srcSet={HERO_IMAGE_SRC_SET}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              width={1600}
              height={1066}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <div className={`absolute inset-0 ${theme === 'light' ? 'bg-black/30' : 'bg-black/58'}`}></div>
          <div
            className={`absolute inset-0 ${
              theme === 'light'
                ? 'bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.90)_34%,rgba(255,255,255,0.55)_70%,rgba(255,255,255,0.35)_100%)]'
                : 'bg-[linear-gradient(90deg,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.80)_36%,rgba(10,10,10,0.36)_72%,rgba(10,10,10,0.12)_100%)]'
            }`}
          ></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10 pb-20 md:pb-24">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : undefined}
              className="flex items-center space-x-3 mb-8 mt-12 md:mt-16"
            >
              <span className="text-xs font-black tracking-[0.4em] text-accent uppercase">{t('home.network', 'Global Equipment Network')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1 }}
              className={`text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.88] mb-8 uppercase pr-2 sm:pr-0 ${
                theme === 'light' ? 'text-ink' : 'text-white'
              }`}
            >
              {t('home.hero.line1', 'Industrial')} <br />
              <span className="text-accent">{t('home.hero.line2', 'Forestry')}</span> <br />
              <span className="text-accent">{t('home.hero.line2b', 'Equipment')}</span> <br />
              {t('home.hero.line3', 'Marketplace')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 }}
              className={`text-lg font-medium max-w-xl mb-12 leading-relaxed ${
                theme === 'light' ? 'text-ink/70' : 'text-white/70'
              }`}
            >
              {t('home.hero.description', 'The premier platform for buying and selling heavy forestry equipment. Real-time market data, equipment financing, and global logistics.')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3 }}
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Link to="/search" className="btn-industrial btn-accent py-5 px-10 text-base">
                {t('home.browseInventory', 'Browse Inventory')}
                <ArrowRight className="ml-3" size={18} />
              </Link>
              <Link
                to={listEquipmentHref}
                state={listEquipmentState}
                onClick={handleListEquipmentClick}
                className={`btn-industrial py-5 px-10 text-base ${
                  theme === 'light'
                    ? 'bg-ink text-bg border-line hover:opacity-90'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-ink'
                }`}
              >
                {t('home.listEquipment', 'List Equipment')}
              </Link>
            </motion.div>

            <div className="mt-20 mb-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12">
              {[
                { label: t('home.activeListings', 'Active Listings'), value: totalActiveListings > 0 ? formatNumber(totalActiveListings) : '—', icon: Activity },
                {
                  label: t('home.marketValue', 'Listed Equipment Value'),
                  value: (() => {
                    if (totalMarketValue <= 0) return 'N/A';
                    if (totalMarketValue >= 1_000_000_000) return `${formatCurrency(totalMarketValue / 1_000_000_000, 'USD', 1)}B`;
                    if (totalMarketValue >= 1_000_000) return `${formatCurrency(totalMarketValue / 1_000_000, 'USD', 1)}M`;
                    return formatCurrency(Math.round(totalMarketValue), 'USD', 0);
                  })(),
                  icon: TrendingUp
                },
                { label: t('home.globalReach', 'Global Reach'), value: '142 Countries', icon: Globe },
                { label: t('home.securePlatform', 'Secure Platform'), value: t('home.securePlatformValue', 'Firebase Auth + TLS'), icon: ShieldCheck }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center space-x-2 mb-2">
                    <stat.icon className="text-accent" size={14} />
                    <span className={`label-micro ${theme === 'light' ? 'text-ink/60' : 'text-white/50'}`}>{stat.label}</span>
                  </div>
                  <span className={`text-2xl font-black tracking-tighter ${theme === 'light' ? 'text-ink' : 'text-white'}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Ticker */}
        <div className="absolute bottom-0 left-0 right-0 bg-accent py-3 overflow-hidden border-t border-white/15">
          <div className="marquee-track whitespace-nowrap">
            {tickerListings.length > 0 ? (
              [...Array(2)].flatMap((_, loopIndex) =>
                tickerListings.map((listing) => (
                  <div key={`${loopIndex}-${listing.id}`} className="flex items-center space-x-8 px-10">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {t('home.recentTransaction', 'RECENT TRANSACTION')}: {listing.year || 'N/A'} {safeUppercase(listing.make || listing.manufacturer, 'UNBRANDED')} {safeUppercase(listing.model, 'MODEL')} SOLD FOR {listing.currency || 'USD'} {formatNumber(Number.isFinite(listing.price) ? listing.price : 0)} ({safeUppercase(getListingLocationLabel(listing), 'LOCATION PENDING')})
                    </span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </div>
                ))
              )
            ) : (
              <div className="flex items-center space-x-8 px-10">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {t('home.recentTransactionsFallback', 'RECENT TRANSACTIONS WILL APPEAR HERE WHEN EQUIPMENT IS MARKED SOLD')}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

        {/* Categories Grid */}
        <section className="py-24 bg-surface px-4 md:px-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="text-center mb-16">
              <span className="label-micro text-accent mb-4 block">{t('home.equipmentClassification', 'Equipment Classification')}</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
                {t('home.browseByCategory', 'Browse by')} <span className="text-muted">{t('layout.categories', 'Category')}</span>
              </h2>
              <p className="text-muted font-medium max-w-3xl mx-auto">
                Select a category below to see what is currently listed for sale.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {categoryCards.map((cat, i) => (
                <Link
                  key={i}
                  to={cat.searchPath}
                  className="group bg-bg border border-line rounded-sm p-8 flex flex-col text-left shadow-[var(--shadow-card)] hover:border-ink hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-300"
                >
                  <div className={`mb-6 flex h-24 w-24 items-center justify-center rounded-sm ${cat.color} transition-transform group-hover:scale-110`}>
                    <cat.icon size={44} className="max-h-[56px] max-w-[56px]" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-3">{cat.name}</h4>
                  <p className="text-xs text-muted font-medium leading-relaxed mb-6 flex-1">{cat.description}</p>
                  <div className="flex items-end justify-between gap-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{t('home.machines', 'Machines')}</span>
                      <span className="text-3xl font-black tracking-tighter">{formatNumber(cat.activeCount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Subcategories</span>
                      <span className="text-lg font-black tracking-tighter">{formatNumber(cat.subcategoryCount)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 bg-bg border border-line rounded-sm p-6 md:p-8 shadow-[var(--shadow-card)]">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <span className="label-micro text-accent mb-2 block">Category Selector</span>
                  <h4 className="text-2xl font-black uppercase tracking-tighter">{selectedCategoryFamily} Subcategories</h4>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <select
                    value={selectedCategoryFamily}
                    onChange={(event) => setSelectedCategoryFamily(event.target.value)}
                    aria-label="Equipment category family"
                    className="bg-surface border border-line pl-4 pr-10 py-3 text-sm font-black uppercase tracking-widest text-ink focus:border-accent focus:outline-none min-w-0"
                  >
                    {categoryCards.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <Link to={`/categories/${normalizeSeoSlug(selectedCategoryFamily)}`} className="btn-industrial px-5 py-3 text-center whitespace-nowrap">
                    Browse {selectedCategoryFamily}
                  </Link>
                </div>
              </div>
              {(() => {
                const subcategories = getMarketplaceSubcategories(selectedCategoryFamily);
                return subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((sub) => (
                      <Link
                        key={sub}
                        to={`/categories/${normalizeSeoSlug(sub)}`}
                        className="px-4 py-2.5 bg-surface border border-line text-[10px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-colors"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">No subcategories available for this category.</p>
                );
              })()}
            </div>
          </div>
        </section>

        {false ? (
        <section className="py-24 bg-bg px-4 md:px-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
              <div className="max-w-2xl">
                <span className="label-micro text-accent mb-4 block">{t('home.marketData', 'Market Data')}</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-6">
                  {t('home.analyticsTitleLine1', 'Real-Time')} <br />
                  <span className="text-muted">{t('home.analyticsTitleLine2', 'Equipment Analytics')}</span>
                </h2>
                <p className="text-muted font-medium">
                  {t('home.analyticsDescription', 'See average market values, recent price changes, and listing counts across every equipment category.')}
                </p>
              </div>
              <div className="flex items-center space-x-3 mt-8 md:mt-0">
                {marketCards.length > 3 && (
                  <>
                    <button
                      aria-label="Previous"
                      onClick={() => setCarouselIndex((prev) => (prev - 1 + marketCards.length) % marketCards.length)}
                      className="btn-industrial p-2"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest tabular-nums">
                      {carouselIndex + 1} / {marketCards.length}
                    </span>
                    <button
                      aria-label="Next"
                      onClick={() => setCarouselIndex((prev) => (prev + 1) % marketCards.length)}
                      className="btn-industrial p-2"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
                <Link to="/blog" className="btn-industrial">
                  {t('home.accessReports', 'Access Reports')}
                  <ChevronRight className="ml-2" size={14} />
                </Link>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={carouselIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-1"
                style={{ touchAction: 'pan-y' }}
                onPointerDown={(e) => {
                  swipeRef.current = { startX: e.clientX, swiping: true };
                }}
                onPointerMove={(e) => {
                  // Intentionally empty — tracking is handled via startX on pointer up.
                  // Presence of handler ensures pointer events are captured during swipe.
                  void e;
                }}
                onPointerUp={(e) => {
                  if (!swipeRef.current.swiping) return;
                  const delta = e.clientX - swipeRef.current.startX;
                  swipeRef.current.swiping = false;
                  if (delta < -50) {
                    // Swiped left → next
                    setCarouselIndex((prev) => (prev + 1) % marketCards.length);
                  } else if (delta > 50) {
                    // Swiped right → prev
                    setCarouselIndex((prev) => (prev - 1 + marketCards.length) % marketCards.length);
                  }
                }}
                onPointerCancel={() => {
                  swipeRef.current.swiping = false;
                }}
              >
              {visibleCards.map((card) => (
                <div
                  key={card.key}
                  className="bg-surface p-8 border border-line rounded-sm flex flex-col shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lift)] transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start mb-12">
                    <div className={`p-3 rounded-sm ${card.iconClass}`}>
                      <card.icon size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${card.badgeClass}`}>
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase mb-2">{card.title}</h3>
                  <p className="text-xs text-muted mb-8 flex-1">{card.description}</p>
                  <div className="flex items-end justify-between">
                    <div className="flex items-end space-x-1">
                      <span className="text-3xl font-black tracking-tighter">{card.value}</span>
                      <span className="text-[10px] font-bold text-muted uppercase mb-1.5">{card.unit}</span>
                    </div>
                    {card.linkCategory && (
                      <Link
                        to={`/search?subcategory=${encodeURIComponent(card.linkCategory)}`}
                        className="text-[9px] font-black text-accent uppercase tracking-widest hover:underline"
                      >
                        {t('home.view', 'View')} →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              </motion.div>
            </AnimatePresence>

            {/* Swipe hint — mobile only */}
            {marketCards.length > 3 && (
              <div className="flex md:hidden items-center justify-center space-x-2 mt-4 text-muted animate-pulse">
                <ChevronLeft size={12} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Swipe to explore</span>
                <ChevronRight size={12} />
              </div>
            )}

            {/* Dot indicators */}
            {marketCards.length > 3 && (
              <div className="flex justify-center space-x-1.5 mt-4">
                {marketCards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    aria-label={`Go to card ${i + 1}`}
                    className={`w-3 h-3 rounded-full transition-colors touch-manipulation ${
                      i === carouselIndex ? 'bg-accent' : 'bg-line hover:bg-muted'
                    }`}
                    style={{ minWidth: 44, minHeight: 44, padding: 16, margin: -14, backgroundClip: 'content-box' }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
        ) : null}

      {/* Featured Listings */}
      <section className="py-24 bg-bg px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="label-micro text-accent mb-4 block">{t('home.premiumEquipment', 'Premium Equipment')}</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                {t('home.featuredInventory', 'Featured')} <span className="text-muted">{t('layout.inventory', 'Inventory')}</span>
              </h2>
            </div>
            <Link to="/search" className="btn-industrial">
              {t('home.viewAllInventory', 'View All Inventory')}
              <ArrowRight className="ml-2" size={14} />
            </Link>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredListings.map((listing) => (
                <div key={listing.id}>
                  <Suspense fallback={<div className="h-[460px] rounded-sm border border-line bg-surface" />}>
                    <ListingCard listing={listing} />
                  </Suspense>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* Browse by Manufacturer */}
      <section className="py-24 bg-surface px-4 md:px-8 border-y border-line">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
            <div>
              <span className="label-micro text-accent mb-4 block">Browse by Manufacturer</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                Browse by <span className="text-muted">Manufacturer</span>
              </h2>
              <p className="text-muted font-medium mt-4 max-w-xl">
                Find equipment by manufacturer including Caterpillar, John Deere, Multitek, Tigercat, and more.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <SearchIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={mfgSearch}
                onChange={(e) => setMfgSearch(e.target.value)}
                placeholder="Find by manufacturer..."
                className="w-full bg-bg border border-line py-3 pl-12 pr-4 text-xs font-bold uppercase tracking-widest text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {filteredManufacturers.slice(0, 48).map((mfg) => (
              <Link
                key={mfg}
                to={buildManufacturerPath(mfg)}
                className="bg-bg border border-line px-4 py-3 text-[10px] font-black uppercase tracking-widest text-ink text-center hover:border-accent hover:text-accent transition-colors truncate"
              >
                {mfg}
              </Link>
            ))}
          </div>
          {filteredManufacturers.length > 48 && (
            <div className="flex justify-center mt-8">
              <Link to="/manufacturers" className="btn-industrial">
                View All {filteredManufacturers.length} Manufacturers
                <ArrowRight className="ml-2" size={14} />
              </Link>
            </div>
          )}
          {filteredManufacturers.length === 0 && (
            <p className="text-center text-muted text-xs font-bold uppercase tracking-widest py-12">
              No manufacturers match &ldquo;{mfgSearch}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* Browse by State */}
      {topStates.length > 0 && (
        <section className="py-24 bg-bg px-4 md:px-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
              <div>
                <span className="label-micro text-accent mb-4 block">Browse by State</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                  Equipment <span className="text-muted">Near You</span>
                </h2>
                <p className="text-muted font-medium mt-4 max-w-xl">
                  Find forestry and logging equipment for sale in your state and compare inventory from local dealers and private sellers.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {topStates.map((state) => (
                <Link
                  key={state.name}
                  to={buildStateMarketPath(state.name, CANONICAL_MARKET_ROUTE_KEY)}
                  className="bg-surface border border-line px-4 py-4 flex items-center gap-3 hover:border-accent hover:text-accent transition-colors group"
                >
                  <MapPin size={14} className="text-accent shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink group-hover:text-accent transition-colors block truncate">
                      {state.name}
                    </span>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                      {formatNumber(state.count)} Listings
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Link to="/states" className="btn-industrial">
                View All States
                <ArrowRight className="ml-2" size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {marketIntelligenceSection}

      {/* Recent Listings */}
      {allListings.length > 0 && (
        <section className="py-24 px-4 md:px-8 bg-bg">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="label-micro text-accent mb-3 block">Fresh Inventory</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-ink">
                  Recent <span className="text-muted">Listings</span>
                </h2>
              </div>
              <Link to="/search" className="btn-industrial btn-accent hidden sm:inline-flex items-center gap-2">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <Suspense fallback={null}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...allListings]
                  .sort((a, b) => {
                    // Featured first, then by createdAt descending
                    const featDiff = Number(!!b.featured) - Number(!!a.featured);
                    if (featDiff !== 0) return featDiff;
                    const aTime = new Date(a.createdAt || 0).getTime();
                    const bTime = new Date(b.createdAt || 0).getTime();
                    return bTime - aTime;
                  })
                  .slice(0, 4)
                  .map((listing) => (
                    <ListingCard key={listing.id} listing={listing} viewMode="grid" />
                  ))}
              </div>
            </Suspense>
            <div className="mt-8 sm:hidden">
              <Link to="/search" className="btn-industrial btn-accent w-full inline-flex items-center justify-center gap-2">
                View All Inventory <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Us */}
      <section className="py-24 px-4 md:px-8 relative overflow-hidden bg-surface border-y border-line">
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="max-w-3xl">
              <span className="label-micro text-accent mb-4 block">About Us</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-8 text-ink">
                Built For <br />
                <span className="text-accent">Forestry Equipment</span>
              </h2>
              <p className="text-base font-medium mb-6 max-w-2xl text-muted leading-relaxed">
                Forestry Equipment Sales helps buyers, sellers, and dealers move logging equipment with stronger listing presentation, better marketplace visibility, and practical support across financing, logistics, and lead generation.
              </p>
              <div className="space-y-4 mb-10 max-w-2xl">
                <p className="text-sm font-medium text-muted leading-relaxed">
                  <span className="font-black text-ink">Marketplace Focus</span> — New and used forestry, logging, land clearing, sawmill, truck, trailer, and attachment inventory.
                </p>
                <p className="text-sm font-medium text-muted leading-relaxed">
                  <span className="font-black text-ink">Dealer Support</span> — Listing tools, dealer websites, lead delivery, and merchandising support built around equipment sellers.
                </p>
                <p className="text-sm font-medium text-muted leading-relaxed">
                  <span className="font-black text-ink">Buyer Services</span> — Equipment discovery, financing coordination, and logistics help for serious buyers across regional and national markets.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/about" className="btn-industrial btn-accent">
                  About Us
                </Link>
                <Link to="/contact" className="btn-industrial">
                  Contact Us
                </Link>
              </div>
          </div>
        </div>
      </section>
    </div>
  );
}

