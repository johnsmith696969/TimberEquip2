import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Download, Plus, Edit, Trash2, Layers } from 'lucide-react';
import { cmsService, type AdminContentBootstrapResponse } from '../../services/cmsService';
import type { BlogPost, MediaItem, ContentBlock } from '../../types';
import { CmsEditor } from './CmsEditor';
import { MediaLibrary } from './MediaLibrary';
import { TaxonomyManager } from './TaxonomyManager';

export interface ContentTabProps {
  normalizedAdminRole: string;
  confirm: (opts: { title: string; message: string; variant?: 'danger' | 'warning' }) => Promise<boolean>;
}

export function ContentTab({ normalizedAdminRole, confirm }: ContentTabProps) {
  // ── Content-specific state ──────────────────────────────────────
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showCmsEditor, setShowCmsEditor] = useState(false);
  const [contentSubTab, setContentSubTab] = useState<'posts' | 'media' | 'blocks' | 'categories'>('posts');
  const [newBlock, setNewBlock] = useState<{ type: ContentBlock['type']; content: string; title: string; label: string }>({
    type: 'text', content: '', title: '', label: ''
  });
  const [savingBlock, setSavingBlock] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [contentLoadError, setContentLoadError] = useState('');
  const [blogPostDisplayCount, setBlogPostDisplayCount] = useState(10);
  const [blogPostSearchQuery, setBlogPostSearchQuery] = useState('');

  // ── Utility functions ───────────────────────────────────────────

  const toMillis = (value: unknown): number => {
    if (!value) return 0;
    if (typeof value === 'string') return new Date(value).getTime() || 0;
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    const ts = value as { seconds?: number; toDate?: () => Date };
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    return 0;
  };

  const formatTimestamp = (value: unknown) => {
    const ms = toMillis(value);
    if (!ms) return 'Unknown';
    return new Date(ms).toLocaleString();
  };

  const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const downloadCsv = (filenamePrefix: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isPublishedPost = (post: BlogPost) => {
    const status = String(post.status || '').trim().toLowerCase();
    const reviewStatus = String(post.reviewStatus || '').trim().toLowerCase();
    return status === 'published' || reviewStatus === 'published';
  };

  // ── Data fetching ───────────────────────────────────────────────

  const fetchContentData = async (force = false) => {
    if (contentLoading || (contentLoaded && !force)) return;
    setContentLoading(true);
    setContentLoadError('');
    try {
      const payload: AdminContentBootstrapResponse = await cmsService.getAdminContentBootstrap();
      setBlogPosts(payload.posts);
      setMediaItems(payload.media);
      setContentBlocks(payload.contentBlocks);
      setContentLoaded(true);
      const errorMessages = [payload.errors?.posts, payload.errors?.media, payload.errors?.contentBlocks].filter(Boolean);
      setContentLoadError(errorMessages.join(' '));
    } catch (cmsErr) {
      console.warn('CMS data not available:', cmsErr);
      setContentLoadError(cmsErr instanceof Error ? cmsErr.message : 'Content data is not available right now.');
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    void fetchContentData();
  }, []);

  // ── CSV export ──────────────────────────────────────────────────

  const exportContentCSV = () => {
    const headers = [
      'Content Type', 'ID', 'Title', 'Label Or Filename', 'Status',
      'Category Or Mime Type', 'Owner', 'Tags', 'Primary Date', 'Reference', 'Summary'
    ];

    const postRows = blogPosts.map((post) => [
      'blog_post', post.id, post.title || '', post.seoSlug || '',
      post.reviewStatus || post.status || '', post.category || '',
      post.authorName || '', (post.tags || []).join('|'),
      post.updatedAt ? new Date(post.updatedAt).toLocaleString() : '',
      post.image || '', post.excerpt || '',
    ]);

    const mediaRows = mediaItems.map((item) => [
      'media', item.id, item.altText || '', item.filename || '', '',
      item.mimeType || '', item.uploadedByName || item.uploadedBy || '',
      (item.tags || []).join('|'),
      item.createdAt ? formatTimestamp(item.createdAt) : '',
      item.url || '', '',
    ]);

    const blockRows = contentBlocks.map((block) => [
      'content_block', block.id, block.title || '', block.label || '', '',
      block.type || '', '', '', '', '', block.content || '',
    ]);

    downloadCsv('content', headers, [...postRows, ...mediaRows, ...blockRows]);
  };

  // ── Loading state ───────────────────────────────────────────────

  if (contentLoading && blogPosts.length === 0 && mediaItems.length === 0 && contentBlocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error state (no data) ───────────────────────────────────────

  if (contentLoadError && blogPosts.length === 0 && mediaItems.length === 0 && contentBlocks.length === 0) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-sm border border-red-500/20 bg-red-500/10 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-500">{contentLoadError}</span>
        </div>
        <button
          type="button"
          onClick={() => void fetchContentData(true)}
          className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
        >
          <RefreshCw size={12} className="mr-1.5" /> Retry
        </button>
      </div>
    );
  }

  // ── Blog posts sub-tab helpers ──────────────────────────────────

  const bq = blogPostSearchQuery.toLowerCase();
  const filteredPosts = bq
    ? blogPosts.filter((post) =>
        (post.title || '').toLowerCase().includes(bq) ||
        (post.category || '').toLowerCase().includes(bq) ||
        (post.authorName || '').toLowerCase().includes(bq) ||
        (post.excerpt || '').toLowerCase().includes(bq)
      )
    : blogPosts;
  const visiblePosts = filteredPosts.slice(0, blogPostDisplayCount);
  const hasMorePosts = filteredPosts.length > blogPostDisplayCount;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6">
        {/* Warning banner when error but data exists */}
        {contentLoadError ? (
          <div className="flex items-center gap-3 rounded-sm border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs font-bold text-yellow-600">
            <AlertCircle size={14} className="shrink-0" />
            <span>{contentLoadError}</span>
          </div>
        ) : null}

        {/* CSV export button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={exportContentCSV}
            className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
          >
            <Download size={11} /> Export CSV
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <div className="flex space-x-1 bg-surface border border-line p-2 rounded-sm w-max min-w-full">
            {(['posts', 'media', 'blocks', 'categories'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setContentSubTab(tab)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors whitespace-nowrap ${
                  contentSubTab === tab ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
                }`}
              >
                {tab === 'posts' ? 'Blog Posts' : tab === 'media' ? 'Media Library' : tab === 'categories' ? 'Categories' : 'Content Blocks'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Blog Posts ─────────────────────────────────────────────── */}
        {contentSubTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-surface p-6 border border-line rounded-sm">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-black text-muted uppercase">{blogPosts.length} Posts</span>
                <span className="text-[10px] font-black text-data uppercase">
                  {blogPosts.filter((post) => isPublishedPost(post)).length} Published
                </span>
                <span className="text-[10px] font-black text-yellow-500 uppercase">
                  {blogPosts.filter(p => p.reviewStatus === 'in_review').length} In Review
                </span>
                <span className="text-[10px] font-black text-blue-500 uppercase">
                  {blogPosts.filter(p => p.reviewStatus === 'scheduled').length} Scheduled
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={blogPostSearchQuery}
                    onChange={(e) => { setBlogPostSearchQuery(e.target.value); setBlogPostDisplayCount(10); }}
                    className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-2 placeholder:text-muted focus:outline-none focus:border-accent w-48"
                  />
                </div>
                <button
                  onClick={() => { setEditingPost(null); setShowCmsEditor(true); }}
                  className="btn-industrial btn-accent py-2 px-6 flex items-center"
                >
                  <Plus size={14} className="mr-2" /> New Post
                </button>
              </div>
            </div>

            <div className="bg-bg border border-line rounded-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[860px] text-left">
                  <thead className="sticky top-0 z-10 bg-bg">
                    <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Author</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Updated</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {visiblePosts.map(post => (
                      <tr key={post.id} className="hover:bg-surface/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight text-ink">
                              {post.title || '(Untitled)'}
                            </span>
                            {post.excerpt && (
                              <span className="text-[9px] font-bold text-muted truncate max-w-[240px]">{post.excerpt}</span>
                            )}
                            {post.revisions && post.revisions.length > 0 && (
                              <span className="text-[8px] font-bold text-muted/60 uppercase">
                                {post.revisions.length} revision{post.revisions.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-muted uppercase">{post.category}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-muted uppercase">{post.authorName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                            post.reviewStatus === 'published' ? 'bg-data/10 text-data' :
                            post.reviewStatus === 'in_review'  ? 'bg-yellow-500/10 text-yellow-500' :
                            post.reviewStatus === 'scheduled'  ? 'bg-blue-500/10 text-blue-500' :
                            'bg-muted/10 text-muted'
                          }`}>
                            {post.reviewStatus ?? post.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-muted">
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setEditingPost(post); setShowCmsEditor(true); }}
                              className="p-2 text-muted hover:text-ink"
                              title="Edit post"
                              aria-label="Edit post"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                const ok = await confirm({ title: 'Delete Post', message: 'Delete this post permanently?', variant: 'danger' });
                                if (!ok) return;
                                await cmsService.deletePost(post.id);
                                setBlogPosts(await cmsService.getBlogPosts());
                              }}
                              className="p-2 text-muted hover:text-accent"
                              title="Delete post"
                              aria-label="Delete post"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPosts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                          {blogPostSearchQuery ? 'No posts match your search' : 'No posts yet — click New Post to get started.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {hasMorePosts && (
                <div className="p-4 border-t border-line flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Showing {visiblePosts.length} of {filteredPosts.length} posts
                  </span>
                  <button
                    type="button"
                    onClick={() => setBlogPostDisplayCount((prev) => prev + 10)}
                    className="btn-industrial py-1.5 px-4 text-[10px]"
                  >
                    View More
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Media Library ───────────────────────────────────────────── */}
        {contentSubTab === 'media' && (
          <MediaLibrary
            items={mediaItems}
            onRefresh={async () => setMediaItems(await cmsService.getMedia())}
          />
        )}

        {/* ── Categories (Taxonomy) ───────────────────────────────────── */}
        {contentSubTab === 'categories' && (
          <div className="space-y-4">
            {(normalizedAdminRole === 'super_admin' || normalizedAdminRole === 'admin') ? (
              <TaxonomyManager />
            ) : (
              <div className="bg-surface border border-line rounded-sm p-8 text-center">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Only Admins and Super Admins can manage categories.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Content Blocks ──────────────────────────────────────────── */}
        {contentSubTab === 'blocks' && (
          <div className="space-y-4">
            <div className="bg-surface border border-line rounded-sm p-4">
              <p className="text-[10px] font-bold text-muted uppercase mb-1">
                Reusable content blocks — snippets you can reference in any post (call-to-actions, disclaimers, etc.)
              </p>
            </div>

            {/* Add block form */}
            <div className="bg-bg border border-line rounded-sm p-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-ink">New Content Block</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newBlock.label}
                  onChange={e => setNewBlock(b => ({ ...b, label: e.target.value }))}
                  placeholder="LABEL (e.g. CTA Footer)"
                  className="input-industrial"
                />
                <input
                  type="text"
                  value={newBlock.title}
                  onChange={e => setNewBlock(b => ({ ...b, title: e.target.value }))}
                  placeholder="TITLE (optional)"
                  className="input-industrial"
                />
                <select
                  value={newBlock.type}
                  onChange={e => setNewBlock(b => ({ ...b, type: e.target.value as ContentBlock['type'] }))}
                  className="select-industrial"
                >
                  <option value="text">Text</option>
                  <option value="quote">Quote</option>
                  <option value="callout">Callout</option>
                  <option value="image">Image</option>
                  <option value="html">HTML</option>
                </select>
              </div>
              <textarea
                value={newBlock.content}
                onChange={e => setNewBlock(b => ({ ...b, content: e.target.value }))}
                placeholder="Block content…"
                rows={4}
                className="input-industrial w-full resize-none"
              />
              <button
                disabled={savingBlock || !newBlock.content.trim()}
                onClick={async () => {
                  setSavingBlock(true);
                  try {
                    await cmsService.createContentBlock({
                      type:    newBlock.type,
                      content: newBlock.content,
                      title:   newBlock.title,
                      label:   newBlock.label,
                      order:   contentBlocks.length
                    });
                    setNewBlock({ type: 'text', content: '', title: '', label: '' });
                    setContentBlocks(await cmsService.getContentBlocks());
                  } catch (err) {
                    console.error('Error creating block:', err);
                  } finally {
                    setSavingBlock(false);
                  }
                }}
                className="btn-industrial btn-accent py-2 px-6 text-[10px]"
              >
                {savingBlock ? 'Saving...' : 'Save Block'}
              </button>
            </div>

            {/* Block list */}
            <div className="space-y-3">
              {contentBlocks.map(block => (
                <div key={block.id} className="bg-bg border border-line rounded-sm p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {block.label && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-ink">{block.label}</span>
                      )}
                      <span className="px-1.5 py-0.5 bg-surface border border-line text-[8px] font-black uppercase text-muted rounded-sm">
                        {block.type}
                      </span>
                    </div>
                    {block.title && (
                      <p className="text-[10px] font-bold text-ink mb-1">{block.title}</p>
                    )}
                    <p className="text-[9px] font-medium text-muted line-clamp-2 font-mono">{block.content}</p>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = await confirm({ title: 'Delete Block', message: 'Delete this block?', variant: 'danger' });
                      if (!ok) return;
                      await cmsService.deleteContentBlock(block.id);
                      setContentBlocks(await cmsService.getContentBlocks());
                    }}
                    className="p-2 text-muted hover:text-accent flex-shrink-0"
                    aria-label="Delete content block"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {contentBlocks.length === 0 && (
                <div className="bg-bg border border-dashed border-line rounded-sm p-8 text-center">
                  <Layers size={32} className="text-muted/30 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">No content blocks yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── CMS Editor overlay ──────────────────────────────────────── */}
      {showCmsEditor && (
        <CmsEditor
          post={editingPost}
          onClose={() => { setShowCmsEditor(false); setEditingPost(null); }}
          onSaved={async () => {
            setBlogPosts(await cmsService.getBlogPosts());
          }}
        />
      )}
    </>
  );
}
