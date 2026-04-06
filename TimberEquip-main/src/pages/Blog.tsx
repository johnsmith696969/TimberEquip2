import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  Newspaper,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { NewsPost } from '../types';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';

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

export function Blog() {
  const { theme } = useTheme();
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await equipmentService.getNews();
      setNews(data);
    } catch (err) {
      console.error('Error fetching news:', err);
      setNews([]);
      setError('Unable to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Equipment News | Market Reports & Industry Updates | TimberEquip"
        description="Stay up to date with forestry equipment market reports, industry news, price trends, and inventory analysis from TimberEquip."
        canonicalPath="/blog"
        preloadImage="/page-photos/pine-dirt-road.webp"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Blog',
              name: 'TimberEquip Blog',
              description: 'Stay up to date with forestry equipment market reports, industry news, price trends, and inventory analysis from TimberEquip.',
              url: 'https://timberequip.com/blog',
              publisher: {
                '@type': 'Organization',
                name: 'TimberEquip',
                url: 'https://timberequip.com',
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://timberequip.com' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://timberequip.com/blog' },
              ],
            },
          ],
        }}
      />

      <ImageHero imageSrc="/page-photos/pine-dirt-road.webp" imageAlt="Pine dirt road through the forest">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Newspaper size={20} className="text-accent" />
            <span className="label-micro text-accent">Industry Insights</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            Market <br />
            <span className={heroSecondaryClass}>Newsletter</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            Institutional-grade analysis, regulatory updates, and global market reports for the forestry equipment industry.
            Stay ahead of the market with real-time data and expert insights.
          </p>
        </div>
      </ImageHero>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-24" aria-live="polite" aria-busy={loading}>
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-bold text-muted mb-4">{error}</p>
            <button
              onClick={() => { setError(null); fetchNews(); }}
              className="btn-industrial btn-accent px-6 py-3"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-16">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-6 animate-pulse">
                <div className="aspect-[21/9] bg-surface border border-line"></div>
                <div className="h-8 bg-surface w-3/4"></div>
                <div className="h-4 bg-surface w-full"></div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="border border-line bg-surface p-10 md:p-12 space-y-5 text-center">
            <span className="label-micro text-accent block">Equipment News</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-ink">
              Industry Insights Are Refreshing
            </h2>
            <p className="text-sm md:text-base font-medium text-muted leading-relaxed max-w-2xl mx-auto">
              The news feed is temporarily catching up. Refresh in a moment, or continue into live inventory and dealer pages while the latest market coverage loads.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link to="/forestry-equipment-for-sale" className="btn-industrial btn-accent px-6 py-3 text-center">
                Browse Inventory
              </Link>
              <Link to="/dealers" className="btn-industrial bg-bg px-6 py-3 text-center">
                Visit Dealers
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-16">
            {news.map((post) => (
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
                    width={1050}
                    height={450}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
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
                      {post.author || 'TimberEquip'}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
