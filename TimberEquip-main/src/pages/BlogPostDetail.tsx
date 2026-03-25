import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { equipmentService } from '../services/equipmentService';
import { NewsPost } from '../types';
import { Seo } from '../components/Seo';

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
      <Seo title={`TimberEquip.com | ${post.title}`} description={post.summary} canonicalPath={`/blog/${post.id}`} />

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
          <img src={post.image} alt={post.title} className="aspect-[21/9] w-full object-cover" referrerPolicy="no-referrer" />
        </div>

        <article className="space-y-6">
          <p className="text-lg font-medium leading-relaxed text-muted">{post.summary}</p>
          <div className="prose prose-neutral max-w-none text-ink">
            <div className="whitespace-pre-wrap text-sm leading-8">{post.content}</div>
          </div>
        </article>
      </div>
    </div>
  );
}