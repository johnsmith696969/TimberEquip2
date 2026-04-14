import { useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Seo } from '../components/Seo';
import { helpArticles } from '../data/helpArticles';

export function HelpArticle() {
  const { slug } = useParams<{ slug: string }>();

  const article = useMemo(() => helpArticles.find((a) => a.slug === slug), [slug]);

  const related = useMemo(() => {
    if (!article) return [];
    return helpArticles
      .filter((a) => a.category === article.category && a.slug !== article.slug)
      .slice(0, 5);
  }, [article]);

  if (!article) return <Navigate to="/help" replace />;

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title={`${article.title} | Help Center`}
        description={article.content.slice(0, 160)}
        canonicalPath={`/help/${article.slug}`}
      />

      <section className="px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div>
            {/* Breadcrumb */}
            <nav className="mb-8 flex flex-wrap items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted">
              <Link to="/help" className="hover:text-accent">Help Center</Link>
              <ChevronRight size={10} />
              <span>{article.category}</span>
              <ChevronRight size={10} />
              <span className="text-ink">{article.title}</span>
            </nav>

            <span className="label-micro mb-3 block text-accent">{article.category}</span>
            <h1 className="mb-6 text-3xl font-black uppercase tracking-tight md:text-5xl">
              {article.title}
            </h1>

            <div className="prose max-w-none text-sm font-medium leading-relaxed text-muted md:text-base">
              {article.content.split('\n').map((p, i) => (
                <p key={i} className="mb-4">{p}</p>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-line bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              to="/help"
              className="mt-10 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-accent hover:underline"
            >
              <ArrowLeft size={14} /> Back to Help Center
            </Link>
          </div>

          {/* Related articles sidebar */}
          {related.length > 0 && (
            <aside>
              <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                Related Articles
              </h2>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/help/${r.slug}`}
                    className="group flex items-center justify-between border border-line bg-surface p-4 transition-colors hover:border-accent"
                  >
                    <span className="text-sm font-black uppercase tracking-tight group-hover:text-accent">
                      {r.title}
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-muted group-hover:text-accent" />
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
