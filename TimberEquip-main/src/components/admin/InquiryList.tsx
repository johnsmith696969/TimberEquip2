import React, { useMemo, useState } from 'react';
import { MessageSquare, User, Phone, Mail, Clock, StickyNote, ShieldAlert, Search, X, Filter, Send } from 'lucide-react';
import { Inquiry, Account, Listing } from '../../types';

interface InquiryListProps {
  inquiries: Inquiry[];
  accounts: Account[];
  listings: Listing[];
  onUpdateStatus: (id: string, status: Inquiry['status']) => Promise<void> | void;
  onAssignInquiry: (id: string, assignedToUid: string, assignedToName?: string) => Promise<void> | void;
  onAddNote: (id: string, text: string) => Promise<void> | void;
}

const PIPELINE_STAGES: Inquiry['status'][] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];

const STATUS_COLORS: Record<string, string> = {
  New:       'bg-accent/10 text-accent border-accent/20',
  Contacted: 'bg-secondary/10 text-secondary border-secondary/20',
  Qualified: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  Won:       'bg-data/10 text-data border-data/20',
  Lost:      'bg-red-500/10 text-red-500 border-red-500/20',
  Closed:    'bg-muted/10 text-muted border-muted/20',
};

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTs = value as { seconds?: number; nanoseconds?: number };
    if (typeof maybeTs.seconds === 'number') {
      const nanos = typeof maybeTs.nanoseconds === 'number' ? maybeTs.nanoseconds : 0;
      return maybeTs.seconds * 1000 + Math.floor(nanos / 1e6);
    }
  }
  return 0;
}

export function InquiryList({ inquiries, accounts, listings, onUpdateStatus, onAssignInquiry, onAddNote }: InquiryListProps) {
  // ── Filter state ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState('');
  const [filterStatus, setFilterStatus]     = useState<Inquiry['status'] | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterListingId, setFilterListingId] = useState('');
  const [filterSpam, setFilterSpam]         = useState<'any' | 'clean' | 'suspect' | 'spam'>('any');

  // ── Per-inquiry inline note state ───────────────────────────────
  const [noteInputs, setNoteInputs]         = useState<Record<string, string>>({});
  const [noteOpen, setNoteOpen]             = useState<Record<string, boolean>>({});

  const listingMap = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);

  const listingHistory = useMemo(() => {
    const grouped = new Map<string, { title: string; total: number; lastInquiryAt: number }>();
    inquiries.forEach((inq) => {
      const key = inq.listingId || 'unknown';
      const title = listingMap.get(inq.listingId || '')?.title || 'Unknown Listing';
      const existing = grouped.get(key) || { title, total: 0, lastInquiryAt: 0 };
      existing.total += 1;
      existing.lastInquiryAt = Math.max(existing.lastInquiryAt, toMillis(inq.createdAt));
      grouped.set(key, existing);
    });
    return Array.from(grouped.entries())
      .map(([listingId, summary]) => ({ listingId, ...summary }))
      .sort((a, b) => b.total - a.total);
  }, [inquiries, listingMap]);


  // ── Filtered results ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return inquiries.filter((inq) => {
      if (filterStatus && inq.status !== filterStatus) return false;
      if (filterAssignee === '__unassigned__') {
        if (inq.assignedToUid) return false;
      } else if (filterAssignee && inq.assignedToUid !== filterAssignee) {
        return false;
      }
      if (filterListingId && inq.listingId !== filterListingId) return false;
      if (filterSpam === 'clean'   && (inq.spamScore ?? 0) >= 40)  return false;
      if (filterSpam === 'suspect' && ((inq.spamScore ?? 0) < 40 || (inq.spamScore ?? 0) >= 70)) return false;
      if (filterSpam === 'spam'    && (inq.spamScore ?? 0) < 70)   return false;
      if (q) {
        const haystack = [inq.buyerName, inq.buyerEmail, inq.buyerPhone, inq.message, inq.id]
          .join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [inquiries, searchQuery, filterStatus, filterAssignee, filterListingId, filterSpam]);

  const hasFilters = !!(searchQuery || filterStatus || filterAssignee || filterListingId || filterSpam !== 'any');

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterAssignee('');
    setFilterListingId('');
    setFilterSpam('any');
  };

  const handleAddNote = async (inquiryId: string) => {
    const text = (noteInputs[inquiryId] || '').trim();
    if (!text) return;
    await onAddNote(inquiryId, text);
    setNoteInputs((prev) => ({ ...prev, [inquiryId]: '' }));
    setNoteOpen((prev) => ({ ...prev, [inquiryId]: false }));
  };

  if (inquiries.length === 0) {
    return (
      <div className="p-12 text-center bg-surface/50 border border-line rounded-sm">
        <MessageSquare size={48} className="mx-auto mb-4 text-muted opacity-20" />
        <h4 className="text-lg font-black uppercase tracking-tighter text-ink mb-2">No Active Inquiries</h4>
        <p className="text-xs font-bold text-muted uppercase tracking-widest">When buyers contact you, their messages will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Summary panels ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Per-listing history — click to drill down */}
        <div className="bg-bg border border-line rounded-sm p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Per-Listing Inquiry History</p>
          <div className="space-y-1 max-h-36 overflow-auto pr-1">
            {listingHistory.slice(0, 12).map((row) => (
              <button
                key={row.listingId}
                type="button"
                onClick={() => setFilterListingId(filterListingId === row.listingId ? '' : row.listingId)}
                className={`w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm transition-colors ${
                  filterListingId === row.listingId
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-surface text-ink'
                }`}
              >
                <span className="truncate mr-2 text-left">{row.title}</span>
                <span className="text-muted shrink-0">{row.total}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline mix — click stage to filter */}
        <div className="bg-bg border border-line rounded-sm p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Pipeline Mix</p>
          <div className="grid grid-cols-5 gap-1">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setFilterStatus(filterStatus === stage ? '' : stage)}
                className={`border p-2 text-center transition-colors rounded-sm ${
                  filterStatus === stage
                    ? `${STATUS_COLORS[stage]} border-current`
                    : 'bg-surface border-line hover:border-accent'
                }`}
              >
                <div className="text-[9px] font-black uppercase tracking-widest text-muted">{stage}</div>
                <div className="text-sm font-black tracking-tighter text-ink">{inquiries.filter((i) => i.status === stage).length}</div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Filter bar ──────────────────────────────────────────── */}
      <div className="bg-surface border border-line rounded-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-muted shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted">Filter Leads</span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
            >
              <X size={10} /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Text search */}
          <div className="flex items-center gap-2 lg:col-span-2">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-industrial w-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
            />
            <Search size={14} className="text-muted shrink-0" />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Inquiry['status'] | '')}
            className="select-industrial text-[10px]"
          >
            <option value="">All Statuses</option>
            {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Assignee */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="select-industrial text-[10px]"
          >
            <option value="">All Assignees</option>
            <option value="__unassigned__">Unassigned</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* Spam level */}
          <select
            value={filterSpam}
            onChange={(e) => setFilterSpam(e.target.value as typeof filterSpam)}
            className="select-industrial text-[10px]"
          >
            <option value="any">All Spam Levels</option>
            <option value="clean">Clean (0-39)</option>
            <option value="suspect">Suspect (40-69)</option>
            <option value="spam">Spam (70+)</option>
          </select>
        </div>
        {hasFilters && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted">
            Showing {filtered.length} of {inquiries.length} inquiries
          </p>
        )}
      </div>

      {/* ── Inquiry cards ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center border border-line rounded-sm bg-surface/50">
          <p className="text-xs font-black uppercase tracking-widest text-muted">No inquiries match the active filters.</p>
        </div>
      ) : (
        <div className="max-h-[700px] overflow-y-auto pr-1 space-y-4">
        {filtered.map((inquiry) => (
          <div key={inquiry.id} className="bg-surface border border-line p-6 rounded-sm shadow-sm hover:border-accent transition-colors">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-ink text-accent flex items-center justify-center rounded-sm">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-ink">{inquiry.buyerName}</h4>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{inquiry.type} • ID: {inquiry.id}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm border ${STATUS_COLORS[inquiry.status] ?? 'bg-muted/10 text-muted border-muted/20'}`}>
                    {inquiry.status}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                  <button
                    type="button"
                    onClick={() => setFilterListingId(filterListingId === inquiry.listingId ? '' : (inquiry.listingId || ''))}
                    className="bg-bg border border-line px-2 py-1 rounded-sm text-muted hover:border-accent transition-colors"
                  >
                    {listingMap.get(inquiry.listingId || '')?.title || inquiry.listingId || 'Unknown'}
                  </button>
                  <span className="bg-bg border border-line px-2 py-1 rounded-sm text-muted">
                    {inquiry.assignedToName || 'Unassigned'}
                  </span>
                  <span className={`px-2 py-1 rounded-sm border ${
                    (inquiry.spamScore || 0) >= 70 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    (inquiry.spamScore || 0) >= 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-data/10 text-data border-data/20'
                  }`}>
                    Spam {(inquiry.spamScore ?? 0)}/100
                  </span>
                </div>

                {/* Message */}
                <p className="text-xs font-medium text-ink leading-relaxed bg-bg p-4 border border-line rounded-sm italic">
                  "{inquiry.message}"
                </p>

                {/* Spam flags */}
                {!!inquiry.spamFlags?.length && (
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-red-500">
                    <ShieldAlert size={12} />
                    Flags: {inquiry.spamFlags.join(', ')}
                  </div>
                )}

                {/* Internal notes */}
                <div className="bg-bg border border-line rounded-sm p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted">Internal Notes</span>
                    <button
                      type="button"
                      onClick={() => setNoteOpen((prev) => ({ ...prev, [inquiry.id]: !prev[inquiry.id] }))}
                      className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                    >
                      {noteOpen[inquiry.id] ? 'Cancel' : '+ Add Note'}
                    </button>
                  </div>

                  {/* Inline note form */}
                  {noteOpen[inquiry.id] && (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type note…"
                        value={noteInputs[inquiry.id] || ''}
                        onChange={(e) => setNoteInputs((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(inquiry.id); }}
                        className="flex-1 bg-surface border border-line px-3 py-1.5 text-[10px] font-bold focus:border-accent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNote(inquiry.id)}
                        disabled={!(noteInputs[inquiry.id] || '').trim()}
                        className="btn-industrial btn-accent px-3 py-1.5 text-[10px] disabled:opacity-40"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-1 max-h-28 overflow-auto pr-1">
                    {(inquiry.internalNotes || []).length === 0 ? (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted">No notes yet</p>
                    ) : (
                      (inquiry.internalNotes || []).slice().reverse().map((note) => (
                        <div key={note.id} className="text-[10px]">
                          <div className="flex items-center gap-1 text-muted mb-0.5">
                            <StickyNote size={10} />
                            <span className="font-bold uppercase tracking-widest">{note.authorName || 'Admin'}</span>
                            <span className="font-bold uppercase tracking-widest">• {new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="font-medium text-ink">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-muted">
                    <Mail size={14} />
                    <span className="text-[10px] font-bold uppercase">{inquiry.buyerEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted">
                    <Phone size={14} />
                    <span className="text-[10px] font-bold uppercase">{inquiry.buyerPhone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase">
                      {new Date(toMillis(inquiry.createdAt) || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar controls */}
              <div className="flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
                <select
                  value={inquiry.status}
                  onChange={(e) => onUpdateStatus(inquiry.id, e.target.value as Inquiry['status'])}
                  className="select-industrial min-w-40"
                >
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>

                <select
                  value={inquiry.assignedToUid || ''}
                  onChange={(e) => {
                    const selected = accounts.find((a) => a.id === e.target.value);
                    onAssignInquiry(inquiry.id, e.target.value, selected?.name || undefined);
                  }}
                  className="select-industrial min-w-40"
                >
                  <option value="">Unassigned</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name} ({account.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
