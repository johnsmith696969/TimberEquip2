import React, { useMemo, useState } from 'react';
import {
  X, Save, Send, Globe, Calendar, RotateCcw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { BlogPost } from '../../types';
import { cmsService } from '../../services/cmsService';
import { useAuth } from '../AuthContext';

interface Props {
  post: BlogPost | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = [
  'Industry News', 'Equipment Guide', 'Maintenance Tips',
  'Market Trends', 'Safety', 'Technology', 'Buying Guide', 'Company News'
];

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Draft',       color: 'bg-muted/10 text-muted' },
  in_review:  { label: 'In Review',   color: 'bg-yellow-500/10 text-yellow-500' },
  scheduled:  { label: 'Scheduled',   color: 'bg-blue-500/10 text-blue-500' },
  published:  { label: 'Published',   color: 'bg-data/10 text-data' }
};

export function CmsEditor({ post, onClose, onSaved }: Props) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    title:          post?.title          ?? '',
    excerpt:        post?.excerpt        ?? '',
    content:        post?.content        ?? '',
    authorUid:      post?.authorUid      ?? user?.uid ?? '',
    authorName:     post?.authorName     ?? (user as any)?.name ?? user?.displayName ?? 'Admin',
    category:       post?.category       ?? 'Industry News',
    tags:           post?.tags           ?? [] as string[],
    image:          post?.image          ?? '',
    status:         post?.status         ?? 'draft' as BlogPost['status'],
    reviewStatus:   post?.reviewStatus   ?? 'draft' as NonNullable<BlogPost['reviewStatus']>,
    scheduledAt:    post?.scheduledAt    ?? null as string | null,
    seoTitle:       post?.seoTitle       ?? '',
    seoDescription: post?.seoDescription ?? '',
    seoKeywords:    post?.seoKeywords    ?? [] as string[],
    seoSlug:        post?.seoSlug        ?? ''
  });

  const [newTag,        setNewTag]        = useState('');
  const [newKeyword,    setNewKeyword]    = useState('');
  const [scheduledDate, setScheduledDate] = useState(post?.scheduledAt ?? '');
  const [showSeo,       setShowSeo]       = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showSchedule,  setShowSchedule]  = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [actionMsg,     setActionMsg]     = useState('');

  const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

  const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ');

  const buildFirstTwoSentences = (value: string) => {
    const normalized = normalizeText(stripHtml(value));
    if (!normalized) return '';

    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const firstTwo = sentences.slice(0, 2).join(' ');
    return firstTwo || normalized.slice(0, 160);
  };

  const buildDefaultKeywords = (title: string) => {
    const baseTitle = normalizeText(title);
    const titleParts = baseTitle
      .split(',')
      .map((part) => normalizeText(part))
      .filter(Boolean);

    const defaults = [...titleParts, baseTitle, 'logging industry news', 'forestry equipment news'];
    return Array.from(new Set(defaults.filter(Boolean)));
  };

  const derivedSeoDescription = useMemo(() => {
    return buildFirstTwoSentences(form.excerpt || form.content);
  }, [form.content, form.excerpt]);

  const derivedSeoKeywords = useMemo(() => buildDefaultKeywords(form.title), [form.title]);

  const reviewStatus = form.reviewStatus ?? 'draft';
  const badge = STATUS_BADGE[reviewStatus] ?? STATUS_BADGE.draft;

  const flash = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setForm(f => ({ ...f, seoSlug: slug }));
  };

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && newTag.trim()) {
      e.preventDefault();
      const t = newTag.trim();
      if (!form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setNewTag('');
    }
  };

  const onKwKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && newKeyword.trim()) {
      e.preventDefault();
      const kw = newKeyword.trim();
      if (!form.seoKeywords.includes(kw)) setForm(f => ({ ...f, seoKeywords: [...f.seoKeywords, kw] }));
      setNewKeyword('');
    }
  };

  const handleSave = async (targetStatus?: NonNullable<BlogPost['reviewStatus']>) => {
    setSaving(true);
    try {
      const payload = { ...form } as any;
      payload.authorUid = user?.uid || payload.authorUid;
      payload.authorName = (user as any)?.name || user?.displayName || payload.authorName || 'Admin';
      payload.excerpt = normalizeText(payload.excerpt || '') || derivedSeoDescription;
      payload.seoTitle = normalizeText(payload.seoTitle || '') || normalizeText(payload.title || '');
      payload.seoDescription = normalizeText(payload.seoDescription || '') || derivedSeoDescription;
      payload.seoKeywords = Array.isArray(payload.seoKeywords) && payload.seoKeywords.length > 0 ? payload.seoKeywords : derivedSeoKeywords;
      payload.tags = Array.isArray(payload.tags) && payload.tags.length > 0 ? payload.tags : derivedSeoKeywords;
      payload.seoSlug = normalizeText(payload.seoSlug || '') || String(payload.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      if (targetStatus) {
        payload.reviewStatus = targetStatus;
        if (targetStatus === 'published') payload.status = 'published';
        if (targetStatus === 'draft')     payload.status = 'draft';
      }
      if (post?.id) {
        await cmsService.updatePost(post.id, payload);
      } else {
        await cmsService.createPost(payload);
      }
      setForm(f => ({ ...f, reviewStatus: payload.reviewStatus, status: payload.status }));
      flash(
        targetStatus === 'published' ? 'Published!' :
        targetStatus === 'in_review' ? 'Submitted for review' :
        'Draft saved'
      );
      onSaved();
    } catch (err) {
      console.error('CMS save error:', err);
      flash('Error saving — check console');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!post?.id || !scheduledDate) return;
    setSaving(true);
    try {
      await cmsService.schedulePost(post.id, scheduledDate);
      setForm(f => ({ ...f, reviewStatus: 'scheduled', scheduledAt: scheduledDate }));
      flash('Scheduled!');
      onSaved();
    } catch (err) {
      console.error('Schedule error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (rev: NonNullable<BlogPost['revisions']>[number]) => {
    if (!post?.id) return;
    if (!window.confirm(`Restore content saved on ${new Date(rev.savedAt).toLocaleString()}?`)) return;
    setSaving(true);
    try {
      await cmsService.rollbackToRevision(post.id, rev);
      setForm(f => ({ ...f, title: rev.title, content: rev.content }));
      flash('Rolled back');
      onSaved();
    } catch (err) {
      console.error('Rollback error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-surface border-b border-line flex items-center justify-between px-8 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center text-muted hover:text-ink text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <X size={14} className="mr-2" /> Close
          </button>
          <span className="text-line">|</span>
          <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {actionMsg && (
            <span className="text-[10px] font-bold text-data uppercase tracking-widest animate-pulse">
              {actionMsg}
            </span>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="btn-industrial py-2 px-4 text-[10px] flex items-center gap-1.5"
          >
            <Save size={12} /> Save Draft
          </button>
          {reviewStatus === 'draft' && (
            <button
              onClick={() => handleSave('in_review')}
              disabled={saving}
              className="btn-industrial py-2 px-4 text-[10px] flex items-center gap-1.5"
            >
              <Send size={12} /> Submit for Review
            </button>
          )}
          {(reviewStatus === 'draft' || reviewStatus === 'in_review') && (
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="btn-industrial btn-accent py-2 px-4 text-[10px] flex items-center gap-1.5"
            >
              <Globe size={12} /> Publish
            </button>
          )}
          {reviewStatus === 'published' && (
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="btn-industrial py-2 px-4 text-[10px]"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {/* Editor body */}
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">

        {/* Title */}
        <div className="space-y-1">
          <label className="label-micro">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Post title…"
            className="input-industrial w-full"
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-1">
          <label className="label-micro">Excerpt / Summary</label>
          <textarea
            value={form.excerpt}
            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            placeholder="Short summary shown in post listings…"
            rows={2}
            className="input-industrial w-full resize-none"
          />
        </div>

        {/* Content */}
        <div className="space-y-1">
          <label className="label-micro">Content (Markdown supported)</label>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your post content here…"
            rows={18}
            className="input-industrial w-full resize-y font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cover Image */}
          <div className="space-y-1">
            <label className="label-micro">Cover Image URL</label>
            <input
              type="url"
              value={form.image}
              onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
              placeholder="https://…"
              className="input-industrial w-full"
            />
            {form.image && (
              <img src={form.image} alt="preview" className="mt-2 h-24 object-cover rounded-sm border border-line" />
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="label-micro">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="select-industrial w-full"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="label-micro">Tags</label>
          <div className="flex flex-wrap gap-2 min-h-[40px] items-center p-3 bg-bg border border-line rounded-sm">
            {form.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-surface text-[9px] font-black uppercase tracking-widest text-ink rounded-sm border border-line">
                {tag}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}
                  className="text-muted hover:text-accent ml-1"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={onTagKey}
              placeholder="Add tag + Enter"
              className="bg-transparent text-[10px] font-bold uppercase outline-none border-none flex-1 min-w-[100px] text-ink placeholder:text-muted"
            />
          </div>
        </div>

        {/* ── SEO Panel ──────────────────────────────────────────── */}
        <div className="border border-line rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="w-full flex items-center justify-between p-4 bg-surface text-xs font-black uppercase tracking-wide text-ink hover:bg-surface/70 transition-colors"
          >
            <span>SEO Settings</span>
            {showSeo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showSeo && (
            <div className="p-6 space-y-4 bg-bg">
              <div className="space-y-1">
                <label className="label-micro">SEO Title</label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                  placeholder={form.title || 'Override title for search engines…'}
                  className="input-industrial w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="label-micro">Meta Description <span className="text-muted">(max 160)</span></label>
                <textarea
                  value={form.seoDescription}
                  onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value.slice(0, 160) }))}
                  rows={2}
                  placeholder={derivedSeoDescription}
                  className="input-industrial w-full resize-none"
                />
                <span className="text-[9px] font-bold text-muted">{form.seoDescription.length}/160</span>
              </div>
              <div className="space-y-1">
                <label className="label-micro">URL Slug</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.seoSlug}
                    onChange={e => setForm(f => ({
                      ...f,
                      seoSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    }))}
                    placeholder="url-slug-here"
                    className="input-industrial flex-1"
                  />
                  <button type="button" onClick={generateSlug} className="btn-industrial px-3 py-2 text-[10px]">
                    Auto
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="label-micro">SEO Keywords</label>
                <div className="flex flex-wrap gap-2 min-h-[40px] items-center p-3 bg-surface border border-line rounded-sm">
                  {form.seoKeywords.map(kw => (
                    <span key={kw} className="flex items-center gap-1 px-2 py-1 bg-bg text-[9px] font-black uppercase tracking-widest text-muted rounded-sm border border-line">
                      {kw}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, seoKeywords: f.seoKeywords.filter(k => k !== kw) }))}
                        className="ml-1 hover:text-accent"
                      >
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={onKwKey}
                    placeholder={derivedSeoKeywords.length ? `${derivedSeoKeywords.join(', ')}` : 'Add keyword + Enter'}
                    className="bg-transparent text-[10px] font-bold uppercase outline-none border-none flex-1 min-w-[100px] text-ink placeholder:text-muted"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Revision History ──────────────────────────────────── */}
        {post?.revisions && post.revisions.length > 0 && (
          <div className="border border-line rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRevisions(!showRevisions)}
              className="w-full flex items-center justify-between p-4 bg-surface text-xs font-black uppercase tracking-wide text-ink hover:bg-surface/70 transition-colors"
            >
              <span>Revision History ({post.revisions.length})</span>
              {showRevisions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showRevisions && (
              <div className="bg-bg divide-y divide-line max-h-80 overflow-y-auto">
                {[...post.revisions].reverse().map(rev => (
                  <div key={rev.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col min-w-0 mr-4">
                      <span className="text-[10px] font-black uppercase tracking-tight text-ink truncate">
                        {rev.title || '(Untitled)'}
                      </span>
                      <span className="text-[9px] font-bold text-muted uppercase">
                        {rev.authorName} · {new Date(rev.savedAt).toLocaleString()}
                        {rev.note ? ` — ${rev.note}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRollback(rev)}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent hover:underline flex-shrink-0"
                    >
                      <RotateCcw size={10} /> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Schedule Publishing ───────────────────────────────── */}
        {post?.id && reviewStatus !== 'published' && (
          <div className="border border-line rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between p-4 bg-surface text-xs font-black uppercase tracking-wide text-ink hover:bg-surface/70 transition-colors"
            >
              <span>Schedule Publishing{form.scheduledAt ? ` — ${new Date(form.scheduledAt).toLocaleString()}` : ''}</span>
              {showSchedule ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showSchedule && (
              <div className="p-6 bg-bg flex items-end gap-4">
                <div className="flex-1 space-y-1">
                  <label className="label-micro">Publish Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="input-industrial w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={!scheduledDate || saving}
                  className="btn-industrial btn-accent py-2 px-4 text-[10px] flex items-center gap-1.5"
                >
                  <Calendar size={12} /> Schedule
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom save row */}
        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <button onClick={onClose} className="btn-industrial py-2 px-6 text-[10px]">Cancel</button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="btn-industrial btn-accent py-2 px-6 text-[10px]"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
