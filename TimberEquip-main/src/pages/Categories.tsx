import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Hammer, Settings, Activity,
  Zap, ArrowRight
} from 'lucide-react';
import { useLocale } from '../components/LocaleContext';
import { equipmentService } from '../services/equipmentService';
import { taxonomyService, type EquipmentTaxonomy } from '../services/taxonomyService';
import { Seo } from '../components/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useTheme } from '../components/ThemeContext';
import { buildMarketplaceCategoryFamilies } from '../utils/marketplaceCategoryFamilies';

const CATEGORY_VISUALS: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string }> = {
  'Logging Equipment': { icon: Truck, color: 'bg-emerald-500/10 text-emerald-500' },
  'Land Clearing Equipment': { icon: Hammer, color: 'bg-orange-500/10 text-orange-500' },
  'Firewood Equipment': { icon: Zap, color: 'bg-amber-500/10 text-amber-500' },
  'Tree Service Equipment': { icon: Activity, color: 'bg-lime-500/10 text-lime-500' },
  'Sawmill Equipment': { icon: Settings, color: 'bg-sky-500/10 text-sky-500' },
  Trailers: { icon: Truck, color: 'bg-cyan-500/10 text-cyan-500' },
  Trucks: { icon: Truck, color: 'bg-blue-500/10 text-blue-500' },
  'Parts And Attachments': { icon: Settings, color: 'bg-purple-500/10 text-purple-500' },
};

export function Categories() {
  const { theme } = useTheme();
  const cachedMarketplaceData = equipmentService.getCachedHomeMarketplaceData();
  const [categoryMetrics, setCategoryMetrics] = useState<Record<string, { activeCount: number; weeklyChangePercent: number; averagePrice: number | null; previousWeekCount: number }>>(() =>
    (cachedMarketplaceData?.topLevelCategoryMetrics || []).reduce<Record<string, { activeCount: number; weeklyChangePercent: number; averagePrice: number | null; previousWeekCount: number }>>((acc, metric) => {
      acc[metric.category] = {
        activeCount: metric.activeCount,
        weeklyChangePercent: metric.weeklyChangePercent,
        averagePrice: metric.averagePrice,
        previousWeekCount: metric.previousWeekCount,
      };
      return acc;
    }, {})
  );

  const { formatNumber } = useLocale();
  const [taxonomy, setTaxonomy] = useState<EquipmentTaxonomy | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketplaceData, mergedTaxonomy] = await Promise.all([
          equipmentService.getHomeMarketplaceData(),
          taxonomyService.getTaxonomy(),
        ]);
        const metricMap = marketplaceData.topLevelCategoryMetrics.reduce<Record<string, { activeCount: number; weeklyChangePercent: number; averagePrice: number | null; previousWeekCount: number }>>((acc, metric) => {
          acc[metric.category] = {
            activeCount: metric.activeCount,
            weeklyChangePercent: metric.weeklyChangePercent,
            averagePrice: metric.averagePrice,
            previousWeekCount: metric.previousWeekCount,
          };
          return acc;
        }, {});
        setCategoryMetrics(metricMap);
        setTaxonomy(mergedTaxonomy);
      } catch (error) {
        console.error('Error loading category data:', error);
      }
    };

    fetchData();
  }, []);

  const categoryCards = useMemo(
    () =>
      buildMarketplaceCategoryFamilies(
        Object.entries(categoryMetrics).map(([category, metric]) => ({
          category,
          activeCount: metric.activeCount,
          previousWeekCount: metric.previousWeekCount,
          weeklyChangePercent: metric.weeklyChangePercent,
          averagePrice: metric.averagePrice,
        })),
        taxonomy || undefined
      ).map((category) => ({
        ...category,
        icon: CATEGORY_VISUALS[category.name]?.icon || Activity,
        color: CATEGORY_VISUALS[category.name]?.color || 'bg-slate-500/10 text-slate-500',
        count: category.activeCount,
      })),
    [categoryMetrics, taxonomy]
  );

  const sortedByInventory = useMemo(
    () => [...categoryCards].sort((a, b) => b.count - a.count),
    [categoryCards]
  );
  const isDuskMode = theme === 'dark';
  const marketNewsStyles = isDuskMode
    ? {
        section: 'py-24 bg-ink px-4 md:px-8',
        heading: 'text-white',
        body: 'text-white/60',
        card: 'bg-white/5 border border-white/10',
        statBorder: 'border-white/10',
        statLabel: 'text-white/40',
        statValue: 'text-white',
      }
    : {
        section: 'py-24 bg-surface px-4 md:px-8 border-y border-line',
        heading: 'text-ink',
        body: 'text-muted',
        card: 'bg-bg border border-line shadow-sm',
        statBorder: 'border-line',
        statLabel: 'text-muted',
        statValue: 'text-ink',
      };

  const mostActive = sortedByInventory[0];
  const highestVelocity = [...categoryCards].sort((a, b) => Math.abs(b.weeklyChangePercent) - Math.abs(a.weeklyChangePercent))[0];
  const totalActive = categoryCards.reduce((sum, cat) => sum + cat.count, 0);
  const totalPreviousWeek = categoryCards.reduce(
    (sum, cat) => sum + Math.max(0, Math.round(cat.count / (1 + cat.weeklyChangePercent / 100))),
    0
  );
  const inventoryChange = totalPreviousWeek > 0 ? ((totalActive - totalPreviousWeek) / totalPreviousWeek) * 100 : 0;

  const seoTitle = 'Equipment Categories | Browse Marketplace Equipment Families | Forestry Equipment Sales';
  const seoDescription =
    'Browse Forestry Equipment Sales inventory by major equipment family including logging equipment, land clearing equipment, firewood equipment, trucks, trailers, and more.';

  const categoriesSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Equipment Categories',
    description: seoDescription,
    url: 'https://www.forestryequipmentsales.com/categories',
    hasPart: categoryCards.map(cat => ({
      '@type': 'Collection',
      name: cat.name,
      description: cat.description,
      url: `https://www.forestryequipmentsales.com/search?category=${encodeURIComponent(cat.name)}`
    }))
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo title={seoTitle} description={seoDescription} canonicalPath="/categories" jsonLd={categoriesSchemaData} />
      <Breadcrumbs />
      {/* Header */}
      <div className="border-b border-line py-24 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#111827]">
          <img
            src="/page-photos/bagged-firewood.jpg"
            alt="Bagged firewood stacks"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/70 to-bg/40 dark:from-bg/50 dark:via-bg/30 dark:to-bg/10" />
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/15 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-[1600px] mx-auto relative z-10">
          <span className="label-micro text-accent mb-4 block">Equipment Classification</span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
            Equipment <br />
            <span className="text-muted">Categories</span>
          </h1>
          <p className="text-muted font-medium max-w-2xl leading-relaxed">
            Find the right machine by category. Every listing includes specs, photos, and pricing.
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoryCards.map((cat, i) => (
            <div
              key={i}
              className="bg-bg border border-line p-10 flex flex-col group hover:border-accent hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-20 h-20 ${cat.color} flex items-center justify-center rounded-sm mb-8 group-hover:scale-110 transition-transform`}>
                <cat.icon size={40} />
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter">{cat.name}</h3>
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">{formatNumber(cat.count)} Machines</span>
              </div>
              
              <p className="text-xs text-muted font-medium leading-relaxed mb-10 flex-1">
                {cat.description}
              </p>
              
              <div className="flex flex-col space-y-4">
                <Link 
                  to={`/search?category=${encodeURIComponent(cat.name)}`}
                  className="btn-industrial btn-accent py-4 w-full text-center"
                >
                  Browse Inventory
                  <ArrowRight className="ml-2" size={14} />
                </Link>
                <div className="pt-6 border-t border-line">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    {formatNumber(cat.subcategoryCount)} Types
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market News CTA */}
      <section className={marketNewsStyles.section}>
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col">
            <span className="label-micro text-accent mb-4 block">Market News</span>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tighter uppercase mb-8 leading-none ${marketNewsStyles.heading}`}>
              Access The <br />
              <span className="text-accent">Industry Insights</span>
            </h2>
            <p className={`text-lg font-medium mb-12 max-w-lg ${marketNewsStyles.body}`}>
              Read the latest equipment news, price reports, and industry updates.
            </p>
            <Link to="/blog" className="btn-industrial btn-accent py-5 px-12 w-fit">
              View Equipment News
            </Link>
          </div>
          <div className={`${marketNewsStyles.card} p-12 rounded-sm`}>
            <div className="flex flex-col space-y-8">
              {[
                {
                  label: 'Most Active Category',
                  value: mostActive?.name || 'N/A',
                  change: mostActive ? `${mostActive.weeklyChangePercent >= 0 ? '+' : ''}${mostActive.weeklyChangePercent.toFixed(1)}%` : 'N/A'
                },
                {
                  label: 'Highest Price Velocity',
                  value: highestVelocity?.name || 'N/A',
                  change: highestVelocity ? `${highestVelocity.weeklyChangePercent >= 0 ? '+' : ''}${highestVelocity.weeklyChangePercent.toFixed(1)}%` : 'N/A'
                },
                {
                  label: 'Weekly Inventory Change',
                  value: `${formatNumber(totalActive)} Active Machines`,
                  change: `${inventoryChange >= 0 ? '+' : ''}${inventoryChange.toFixed(1)}%`
                }
              ].map((stat, i) => (
                <div key={i} className={`flex justify-between items-end border-b pb-6 ${marketNewsStyles.statBorder}`}>
                  <div className="flex flex-col">
                    <span className={`label-micro mb-1 ${marketNewsStyles.statLabel}`}>{stat.label}</span>
                    <span className={`text-2xl font-black tracking-tighter uppercase ${marketNewsStyles.statValue}`}>{stat.value}</span>
                  </div>
                  <span className="text-xs font-black text-data uppercase tracking-widest">{stat.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
