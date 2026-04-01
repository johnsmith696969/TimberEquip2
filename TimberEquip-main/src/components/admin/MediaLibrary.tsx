import React, { useState } from 'react';
import { Trash2, X, Image, Search } from 'lucide-react';
import { MediaItem } from '../../types';
import { cmsService } from '../../services/cmsService';
import { useAuth } from '../AuthContext';

interface Props {
  items: MediaItem[];
  onRefresh: () => void;
}

export function MediaLibrary({ items, onRefresh }: Props) {
  const { user } = useAuth();
  const [search,       setSearch]       = useState('');
  const [tagFilter,    setTagFilter]    = useState('');
  const [editTagsId,   setEditTagsId]   = useState<string | null>(null);
  const [newTagInput,  setNewTagInput]  = useState('');
  const [adding,       setAdding]       = useState(false);
  const [newMedia, setNewMedia] = useState({
    url: '', filename: '', mimeType: 'image/jpeg', altText: '', tagInput: ''
  });

  const allTags = Array.from(new Set(items.flatMap(i => i.tags)));

  const filtered = items.filter(item => {
    const matchSearch = !search || item.filename.toLowerCase().includes(search.toLowerCase());
    const matchTag    = !tagFilter || item.tags.includes(tagFilter);
    return matchSearch && matchTag;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedia.url || !newMedia.filename) return;
    setAdding(true);
    try {
      const tags = newMedia.tagInput
        ? newMedia.tagInput.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      await cmsService.addMedia({
        url:             newMedia.url,
        filename:        newMedia.filename,
        mimeType:        newMedia.mimeType,
        altText:         newMedia.altText,
        tags,
        uploadedBy:      (user as any)?.uid ?? '',
        uploadedByName:  (user as any)?.name ?? user?.displayName ?? 'Admin',
        sizeBytes:       0
      });
      setNewMedia({ url: '', filename: '', mimeType: 'image/jpeg', altText: '', tagInput: '' });
      onRefresh();
    } catch (err) {
      console.error('Media add error:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this media item?')) return;
    await cmsService.deleteMedia(id);
    onRefresh();
  };

  const handleAddTag = async (item: MediaItem) => {
    const tag = newTagInput.trim();
    if (!tag) return;
    const updated = item.tags.includes(tag) ? item.tags : [...item.tags, tag];
    await cmsService.updateMediaTags(item.id, updated);
    setEditTagsId(null);
    setNewTagInput('');
    onRefresh();
  };

  const handleRemoveTag = async (item: MediaItem, tag: string) => {
    await cmsService.updateMediaTags(item.id, item.tags.filter(t => t !== tag));
    onRefresh();
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className="space-y-6">
      {/* Add Media form */}
      <form onSubmit={handleAdd} className="bg-bg border border-line rounded-sm p-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="url"
          value={newMedia.url}
          onChange={e => setNewMedia(m => ({ ...m, url: e.target.value }))}
          placeholder="IMAGE URL"
          className="input-industrial md:col-span-2"
          required
        />
        <input
          type="text"
          value={newMedia.filename}
          onChange={e => setNewMedia(m => ({ ...m, filename: e.target.value }))}
          placeholder="FILENAME"
          className="input-industrial"
          required
        />
        <input
          type="text"
          value={newMedia.tagInput}
          onChange={e => setNewMedia(m => ({ ...m, tagInput: e.target.value }))}
          placeholder="TAGS (comma-separated)"
          className="input-industrial"
        />
        <button type="submit" disabled={adding} className="btn-industrial btn-accent py-2">
          {adding ? 'Adding…' : 'Add Media'}
        </button>
      </form>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="input-industrial w-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
          />
          <Search size={14} className="text-muted shrink-0" />
        </div>
        <select
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          className="select-industrial"
        >
          <option value="">All Tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {tagFilter && (
          <button onClick={() => setTagFilter('')} className="btn-industrial px-3 py-2 text-[10px]">
            Clear
          </button>
        )}
      </div>

      {/* Media grid */}
      {filtered.length === 0 ? (
        <div className="bg-bg border border-dashed border-line rounded-sm p-12 flex flex-col items-center text-center">
          <Image size={40} className="text-muted/30 mb-4" />
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">No media items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-bg border border-line rounded-sm overflow-hidden group">
              {/* Preview */}
              <div className="relative aspect-video bg-surface">
                {isImage(item.mimeType) ? (
                  <img
                    src={item.url}
                    alt={item.altText || item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={32} className="text-muted/30" />
                  </div>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-accent/90 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete media"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-tight text-ink truncate" title={item.filename}>
                  {item.filename}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-surface border border-line text-[8px] font-black uppercase tracking-widest text-muted rounded-sm">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(item, tag)}
                        className="ml-0.5 hover:text-accent"
                      >
                        <X size={8} />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => { setEditTagsId(item.id); setNewTagInput(''); }}
                    className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-accent border border-accent/30 rounded-sm hover:bg-accent/5"
                  >
                    + Tag
                  </button>
                </div>

                {/* Inline tag input */}
                {editTagsId === item.id && (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(item); } }}
                      placeholder="TAG"
                      className="input-industrial text-[9px] flex-1 py-1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddTag(item)}
                      className="btn-industrial px-2 py-1 text-[9px]"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setEditTagsId(null)}
                      className="btn-industrial px-2 py-1 text-[9px]"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
