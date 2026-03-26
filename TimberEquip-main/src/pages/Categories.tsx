import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Hammer, Settings, Activity,
  Zap, ArrowRight, Info, TrendingUp
} from 'lucide-react';
import { useLocale } from '../components/LocaleContext';
import { equipmentService } from '../services/equipmentService';
import { Seo } from '../components/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { buildCategoryPath } from '../utils/seoRoutes';

const CATEGORIES = [
  { 
    name: 'Skidders', 
    icon: Truck, 
    
    color: 'bg-blue-500/10 text-blue-500',
    description: 'Heavy-duty log extraction vehicles for all terrain types.'
  },
  { 
    name: 'Feller Bunchers', 
    icon: Hammer, 
    
    color: 'bg-orange-500/10 text-orange-500',
    description: 'High-production felling machines for clear-cutting operations.'
  },
  { 
    name: 'Harvesters', 
    icon: Settings, 
    
    color: 'bg-emerald-500/10 text-emerald-500',
    description: 'Precision felling and processing units for selective logging.'
  },
  { 
    name: 'Forwarders', 
    icon: Truck, 
    
    color: 'bg-purple-500/10 text-purple-500',
    description: 'Efficient log transport from stump to landing.'
  },
  { 
    name: 'Log Loaders', 
    icon: Activity, 
    
    color: 'bg-red-500/10 text-red-500',
    description: 'High-capacity loading systems for trucks and decks.'
  },
  { 
    name: 'Firewood Processors', 
    icon: Zap, 
    
    color: 'bg-amber-500/10 text-amber-500',
    description: 'Dedicated cut, split, and processing systems for firewood production.'
  },
];

export function Categories() {
  const [categoryMetrics, setCategoryMetrics] = useState<Record<string, { activeCount: number; weeklyChangePercent: number; averagePrice: number | null }>>({});

  const { formatNumber } = useLocale();
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const metrics = await equipmentService.getCategoryInventoryMetrics();
        const metricMap = metrics.reduce<Record<string, { activeCount: number; weeklyChangePercent: number; averagePrice: number | null }>>((acc, metric) => {
          acc[metric.category] = {
            activeCount: metric.activeCount,
            weeklyChangePercent: metric.weeklyChangePercent,
            averagePrice: metric.averagePrice
          };
          return acc;
        }, {});
        setCategoryMetrics(metricMap);
      } catch (error) {
        console.error('Error loading category metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  const categoryCards = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        count: categoryMetrics[cat.name]?.activeCount || 0,
        weeklyChangePercent: categoryMetrics[cat.name]?.weeklyChangePercent ?? 0
      })),
    [categoryMetrics]
  );

  const sortedByInventory = useMemo(
    () => [...categoryCards].sort((a, b) => b.count - a.count),
    [categoryCards]
  );

  const mostActive = sortedByInventory[0];
  const highestVelocity = [...categoryCards].sort((a, b) => Math.abs(b.weeklyChangePercent) - Math.abs(a.weeklyChangePercent))[0];
  const totalActive = categoryCards.reduce((sum, cat) => sum + cat.count, 0);
  const totalPreviousWeek = categoryCards.reduce(
    (sum, cat) => sum + Math.max(0, Math.round(cat.count / (1 + cat.weeklyChangePercent / 100))),
    0
  );
  const inventoryChange = totalPreviousWeek > 0 ? ((totalActive - totalPreviousWeek) / totalPreviousWeek) * 100 : 0;

  const seoTitle = 'Equipment Categories | Browse Logging Equipment by Type | Forestry Equipment Sales';
  const seoDescription =
    'Browse logging equipment by category: Skidders, Feller Bunchers, Harvesters, Forwarders, Log Loaders, Firewood Processors. Real-time inventory metrics.';

  const categoriesSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Equipment Categories',
    description: seoDescription,
    url: 'https://timberequip.com/categories',
    hasPart: CATEGORIES.map(cat => ({
      '@type': 'Collection',
      name: cat.name,
      description: cat.description,
      url: `https://timberequip.com${buildCategoryPath(cat.name)}`
    }))
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo title={seoTitle} description={seoDescription} canonicalPath="/categories" jsonLd={categoriesSchemaData} />
      <Breadcrumbs />
      {/* Header */}
      <div className="bg-surface border-b border-line py-24 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-[1600px] mx-auto relative z-10">
          <span className="label-micro text-accent mb-4 block">Equipment Classification</span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
            Equipment <br />
            <span className="text-muted">Categories</span>
          </h1>
          <p className="text-muted font-medium max-w-2xl leading-relaxed">
            Browse our global inventory of heavy forestry equipment classified by operational utility. 
            All units are indexed with real-time market intelligence and technical specifications.
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
                  to={buildCategoryPath(cat.name)}
                  className="btn-industrial btn-accent py-4 w-full text-center"
                >
                  Browse Inventory
                  <ArrowRight className="ml-2" size={14} />
                </Link>
                <div className="flex items-center justify-between pt-6 border-t border-line">
                  <div className="flex items-center text-[10px] font-bold text-data uppercase tracking-widest">
                    <TrendingUp size={12} className="mr-2" />
                    {`${cat.weeklyChangePercent >= 0 ? '+' : ''}${cat.weeklyChangePercent.toFixed(1)}% WoW`}
                  </div>
                  <button className="text-[10px] font-bold text-muted uppercase hover:text-ink flex items-center">
                    AMV Index <Info size={12} className="ml-1.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Pulse CTA */}
      <section className="py-24 bg-ink px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col">
            <span className="label-micro text-accent mb-4 block">Market Intelligence</span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-8 leading-none">
              Access The <br />
              <span className="text-accent">Intelligence Report</span>
            </h2>
            <p className="text-white/60 text-lg font-medium mb-12 max-w-lg">
              Get detailed analysis on price trends, inventory velocity, and regional demand across all equipment categories.
            </p>
            <Link to="/blog" className="btn-industrial btn-accent py-5 px-12 w-fit">
              View Market Reports
            </Link>
          </div>
          <div className="bg-white/5 border border-white/10 p-12 rounded-sm">
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
                <div key={i} className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div className="flex flex-col">
                    <span className="label-micro text-white/40 mb-1">{stat.label}</span>
                    <span className="text-2xl font-black text-white tracking-tighter uppercase">{stat.value}</span>
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
