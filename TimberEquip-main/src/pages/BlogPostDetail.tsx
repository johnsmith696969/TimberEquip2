import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { equipmentService } from '../services/equipmentService';
import { NewsPost } from '../types';
import { Seo } from '../components/Seo';
import { buildSiteUrl } from '../utils/siteUrl';

function slugifyNewsTitle(value: string) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getNewsPostCanonicalPath(post: NewsPost) {
  const slug = post.seoSlug || slugifyNewsTitle(post.title);
  return slug ? `/blog/${post.id}/${slug}` : `/blog/${post.id}`;
}

function renderInlineMarkdown(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={`segment-${index}`}>{segment.slice(2, -2)}</strong>;
    }

    if (segment.startsWith('*') && segment.endsWith('*')) {
      return <em key={`segment-${index}`}>{segment.slice(1, -1)}</em>;
    }

    if (segment.startsWith('`') && segment.endsWith('`')) {
      return (
        <code key={`segment-${index}`} className="rounded-sm bg-surface px-1.5 py-0.5 text-[0.9em] font-semibold text-ink">
          {segment.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={`segment-${index}`}>{segment}</React.Fragment>;
  });
}

function renderMarkdownContent(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return null;

    const headingMatch = block.match(/^(#{1,4})\s+(.+)$/m);
    if (headingMatch && lines.length === 1) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      if (level === 1) {
        return <h2 key={`block-${index}`} className="text-3xl font-black uppercase tracking-tight text-ink">{renderInlineMarkdown(text)}</h2>;
      }

      if (level === 2) {
        return <h3 key={`block-${index}`} className="text-2xl font-black uppercase tracking-tight text-ink">{renderInlineMarkdown(text)}</h3>;
      }

      if (level === 3) {
        return <h4 key={`block-${index}`} className="text-xl font-bold uppercase tracking-wide text-ink">{renderInlineMarkdown(text)}</h4>;
      }

      return <h5 key={`block-${index}`} className="text-lg font-bold uppercase tracking-wide text-ink">{renderInlineMarkdown(text)}</h5>;
    }

    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return (
        <ul key={`block-${index}`} className="list-disc space-y-2 pl-6 text-base leading-8 text-ink">
          {lines.map((line, lineIndex) => (
            <li key={`item-${index}-${lineIndex}`}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      return (
        <ol key={`block-${index}`} className="list-decimal space-y-2 pl-6 text-base leading-8 text-ink">
          {lines.map((line, lineIndex) => (
            <li key={`item-${index}-${lineIndex}`}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>
          ))}
        </ol>
      );
    }

    if (lines.every((line) => line.startsWith('>'))) {
      return (
        <blockquote key={`block-${index}`} className="border-l-4 border-accent pl-5 italic text-muted">
          {lines.map((line, lineIndex) => (
            <p key={`quote-${index}-${lineIndex}`}>{renderInlineMarkdown(line.replace(/^>\s?/, ''))}</p>
          ))}
        </blockquote>
      );
    }

    return (
      <p key={`block-${index}`} className="text-base leading-8 text-ink">
        {lines.map((line, lineIndex) => (
          <React.Fragment key={`line-${index}-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {renderInlineMarkdown(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export function BlogPostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await equipmentService.getNewsPost(id || '');
        if (active) {
          setPost(data);
        }
      } catch (error) {
        console.error('Error fetching news article:', error);
        if (active) {
          setPost(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchPost();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg px-4 py-24 md:px-8">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-6 w-40 bg-surface" />
          <div className="h-14 w-3/4 bg-surface" />
          <div className="aspect-[21/9] w-full bg-surface border border-line" />
          <div className="h-5 w-full bg-surface" />
          <div className="h-5 w-5/6 bg-surface" />
          <div className="h-5 w-2/3 bg-surface" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-bg px-4 py-24 md:px-8">
        <div className="mx-auto max-w-5xl space-y-8 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Article Not Found</h1>
          <p className="text-muted font-medium">This Equipment News article could not be loaded or is no longer published.</p>
          <Link to="/blog" className="btn-industrial btn-accent inline-flex py-4 px-8">
            <ArrowLeft size={16} className="mr-3" />
            Back to Equipment News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title={`${post.seoTitle || post.title} | Forestry Equipment Sales`}
        description={post.seoDescription || post.summary}
        canonicalPath={getNewsPostCanonicalPath(post)}
        ogType="article"
        imagePath={post.image || undefined}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.seoTitle || post.title,
              description: post.seoDescription || post.summary,
              datePublished: post.publishedAt || post.createdAt || undefined,
              dateModified: post.updatedAt || post.publishedAt || post.createdAt || undefined,
              image: post.image || undefined,
              author: { '@type': 'Organization', name: 'Forestry Equipment Sales' },
              publisher: {
                '@type': 'Organization',
                name: 'Forestry Equipment Sales',
                logo: { '@type': 'ImageObject', url: buildSiteUrl('/Forestry_Equipment_Sales_Logo.png') },
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': buildSiteUrl(getNewsPostCanonicalPath(post)),
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: buildSiteUrl('/') },
                { '@type': 'ListItem', position: 2, name: 'Equipment News', item: buildSiteUrl('/blog') },
                { '@type': 'ListItem', position: 3, name: post.seoTitle || post.title, item: buildSiteUrl(getNewsPostCanonicalPath(post)) },
              ],
            },
          ],
        }}
      />

      <section className="bg-surface border-b border-line px-4 py-16 md:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <Link to="/blog" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-accent hover:underline">
            <ArrowLeft size={14} className="mr-2" />
            Back to Equipment News
          </Link>

          <div className="space-y-4">
            <span className="inline-flex bg-accent text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm">
              {post.category}
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-muted uppercase tracking-widest">
              <div className="flex items-center">
                <Clock size={12} className="mr-2" />
                {new Date(post.date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <ShieldCheck size={12} className="mr-2" />
                {post.author}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <div className="overflow-hidden border border-line bg-surface mb-10">
          <img src={post.image} alt={post.title} width={1050} height={450} className="aspect-[21/9] w-full object-cover" referrerPolicy="no-referrer" loading="eager" />
        </div>

        <article className="space-y-6">
          <p className="text-lg font-medium leading-relaxed text-muted">{post.summary}</p>
          <div className="max-w-none space-y-6 text-ink">
            {renderMarkdownContent(post.content)}
          </div>
        </article>
      </div>
    </div>
  );
}
