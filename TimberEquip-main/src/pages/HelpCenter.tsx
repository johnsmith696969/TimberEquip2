import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, HelpCircle, ChevronRight, BookOpen } from 'lucide-react';
import { Seo } from '../components/Seo';
import { helpArticles, HELP_CATEGORIES } from '../data/helpArticles';

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '...';
}

export function HelpCenter() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return helpArticles.filter((a) => {
      if (activeCategory && a.category !== activeCategory) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Help Center | Forestry Equipment Sales"
        description="Search our help center for answers about buying, selling, auctions, subscriptions, dealer tools, and account management."
        canonicalPath="/help"
      />

      {/* Hero */}
      <section className="border-b border-line bg-surface px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 flex items-center gap-3">
            <HelpCircle className="text-accent" size={20} />
            <span className="label-micro text-accent">Help Center</span>
          </div>
          <h1 className="mb-4 text-4xl font-black uppercase tracking-tight md:text-6xl">
            How Can We <span className="text-muted">Help?</span>
          </h1>
          <p className="mb-10 max-w-2xl text-sm font-medium leading-relaxed text-muted md:text-base">
            Search articles or browse by category to find answers about our forestry equipment marketplace.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full border border-line bg-bg py-3 pl-12 pr-4 text-sm font-medium text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-b border-line bg-bg px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
              activeCategory === null
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-surface text-muted hover:border-accent hover:text-ink'
            }`}
          >
            All
          </button>
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                activeCategory === cat
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-surface text-muted hover:border-accent hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Article grid */}
      <section className="px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-[1600px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="mb-4 text-muted" size={40} />
              <p className="text-sm font-black uppercase tracking-widest text-muted">
                No articles found
              </p>
              <p className="mt-2 text-sm text-muted">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((article) => (
                <Link
                  key={article.slug}
                  to={`/help/${article.slug}`}
                  className="group flex flex-col border border-line bg-surface p-6 transition-colors hover:border-accent"
                >
                  <span className="label-micro mb-2 text-accent">{article.category}</span>
                  <h2 className="mb-2 text-base font-black uppercase tracking-tight group-hover:text-accent md:text-lg">
                    {article.title}
                  </h2>
                  <p className="mb-4 flex-1 text-sm font-medium leading-relaxed text-muted">
                    {truncate(article.content, 100)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-accent">
                    Read More <ChevronRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
