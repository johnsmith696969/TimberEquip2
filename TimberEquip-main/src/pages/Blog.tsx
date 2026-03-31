import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Activity, Globe, 
  Clock, ArrowRight,
  LayoutDashboard, ShieldCheck, Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { NewsPost } from '../types';
import { Seo } from '../components/Seo';

function slugifyNewsTitle(value: string) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getNewsPostPath(post: NewsPost) {
  const slug = post.seoSlug || slugifyNewsTitle(post.title);
  return slug ? `/blog/${post.id}/${slug}` : `/blog/${post.id}`;
}

const MARKETPLACE_LINK_GROUPS = [
  {
    heading: 'Marketplace Navigation',
    description: 'Move directly into live buyer and seller surfaces instead of a placeholder content filter.',
    links: [
      { label: 'Live Inventory', to: '/forestry-equipment-for-sale', description: 'Browse public live equipment inventory.' },
      { label: 'Categories', to: '/categories', description: 'Jump into category-level equipment hubs.' },
      { label: 'Manufacturers', to: '/manufacturers', description: 'Browse OEM and model market hubs.' },
      { label: 'Dealer Directory', to: '/dealers', description: 'Explore dealer storefronts and inventory.' },
      { label: 'State Markets', to: '/states', description: 'Navigate regional equipment availability.' },
    ],
  },
  {
    heading: 'Operator Links',
    description: 'Use the same live commercial entry points we expect buyers and sellers to use in production.',
    links: [
      { label: 'Financing Center', to: '/financing', description: 'Institutional equipment financing intake.' },
      { label: 'Ad Programs', to: '/ad-programs', description: 'Seller plans and subscription enrollment.' },
      { label: 'List Equipment', to: '/sell', description: 'Start a seller listing workflow.' },
      { label: 'Search Skidders', to: '/search?q=skidder', description: 'Direct search into a core forestry family.' },
      { label: 'Search Harvesters', to: '/search?q=harvester', description: 'Direct search into another core family.' },
    ],
  },
] as const;

export function Blog() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const data = await equipmentService.getNews();
        setNews(data);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Equipment News | Market Reports & Industry Updates | Forestry Equipment Sales"
        description="Stay up to date with forestry equipment market reports, industry news, price trends, and inventory analysis from Forestry Equipment Sales."
        canonicalPath="/blog"
      />
      {/* Editorial Header */}
      <section className="bg-surface border-b border-line py-24 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-ink flex items-center justify-center rounded-sm">
              <LayoutDashboard className="text-accent" size={20} />
            </div>
            <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">Intelligence Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
            Market <br />
            <span className="text-muted">Intelligence</span>
          </h1>
          <p className="text-muted font-medium max-w-2xl leading-relaxed">
            Institutional-grade analysis, regulatory updates, and global market reports for the forestry equipment industry. 
            Stay ahead of the market with real-time data and expert insights.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/forestry-equipment-for-sale" className="btn-industrial btn-accent px-6 py-3 text-center">
              Browse Live Inventory
            </Link>
            <Link to="/categories" className="btn-industrial bg-bg px-6 py-3 text-center">
              Explore Categories
            </Link>
            <Link to="/dealers" className="btn-industrial bg-bg px-6 py-3 text-center">
              View Dealers
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Main Feed (Left) */}
          <div className="lg:col-span-8 flex flex-col space-y-16">
            {loading ? (
              <div className="space-y-16">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-6 animate-pulse">
                    <div className="aspect-[21/9] bg-surface border border-line"></div>
                    <div className="h-8 bg-surface w-3/4"></div>
                    <div className="h-4 bg-surface w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              news.map((post, i) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group flex flex-col space-y-8"
                >
                  <Link to={getNewsPostPath(post)} className="block aspect-[21/9] overflow-hidden bg-surface border border-line relative">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-6 left-6">
                      <span className="bg-accent text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-lg">
                        {post.category}
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-6 text-[10px] font-bold text-muted uppercase tracking-widest">
                      <div className="flex items-center">
                        <Clock size={12} className="mr-2" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ShieldCheck size={12} className="mr-2" />
                        Verified Report
                      </div>
                    </div>

                    <Link to={getNewsPostPath(post)} className="block">
                      <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter group-hover:text-accent transition-colors leading-tight">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-muted font-medium leading-relaxed max-w-3xl">
                      {post.summary}
                    </p>

                    <Link to={getNewsPostPath(post)} className="flex items-center text-xs font-black uppercase tracking-widest text-accent hover:underline pt-4">
                      Read Full Report
                      <ArrowRight size={14} className="ml-2" />
                    </Link>
                  </div>
                </motion.article>
              ))
            )}
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-12">
              {MARKETPLACE_LINK_GROUPS.map((group) => (
                <div key={group.heading} className="bg-surface border border-line p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <Globe className="text-accent" size={18} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{group.heading}</h4>
                  </div>
                  <p className="text-[11px] font-medium text-muted leading-relaxed mb-6">
                    {group.description}
                  </p>
                  <div className="space-y-3">
                    {group.links.map((link) => (
                      <Link
                        key={link.label}
                        to={link.to}
                        className="group block border border-line bg-bg p-4 transition-colors hover:border-accent/40 hover:bg-surface"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-ink group-hover:text-accent">
                              {link.label}
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed text-muted">
                              {link.description}
                            </p>
                          </div>
                          <ArrowRight size={14} className="shrink-0 text-muted group-hover:text-accent" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Market Pulse */}
              <div className="bg-ink text-white p-8 rounded-sm">
                <div className="flex items-center space-x-3 mb-8">
                  <Activity className="text-accent" size={24} />
                  <h4 className="text-sm font-black uppercase tracking-tighter">Market Pulse</h4>
                </div>
                <div className="space-y-8">
                  {[
                    { label: 'Skidder Index', value: '$285.4K', change: '+12.4%', up: true },
                    { label: 'Harvesters Supply', value: '1,242 Units', change: '-4.2%', up: false },
                    { label: 'Financing APR', value: '6.25%', change: 'Stable', up: null }
                  ].map((pulse, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-white/10 pb-6">
                      <div className="flex flex-col">
                        <span className="label-micro text-white/40 mb-1">{pulse.label}</span>
                        <span className="text-xl font-black tracking-tighter uppercase">{pulse.value}</span>
                      </div>
                      <div className={`flex items-center text-[10px] font-black uppercase tracking-widest ${pulse.up === true ? 'text-data' : pulse.up === false ? 'text-accent' : 'text-white/40'}`}>
                        {pulse.up === true ? <TrendingUp size={12} className="mr-1.5" /> : pulse.up === false ? <TrendingUp size={12} className="mr-1.5 rotate-180" /> : null}
                        {pulse.change}
                      </div>
                    </div>
                  ))}
                </div>
                {news[0] ? (
                  <Link to={getNewsPostPath(news[0])} className="btn-industrial btn-accent w-full mt-10 py-4 text-center">
                    Full Market Overview
                  </Link>
                ) : (
                  <Link to="/blog" className="btn-industrial btn-accent w-full mt-10 py-4 text-center">
                    Full Market Overview
                  </Link>
                )}
              </div>

              <div className="bg-bg border border-line p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <Calculator className="text-accent" size={18} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Action Center</h4>
                </div>
                <p className="text-[11px] font-medium text-muted leading-relaxed mb-6">
                  Continue from intelligence into real commerce flows with live inventory, financing, and seller enrollment.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <Link to="/financing" className="btn-industrial bg-surface py-4 text-center">
                    Financing Center
                  </Link>
                  <Link to="/ad-programs" className="btn-industrial bg-surface py-4 text-center">
                    Seller Ad Programs
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
