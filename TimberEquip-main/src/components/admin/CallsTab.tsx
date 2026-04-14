import React from 'react';
import { Download, Archive, ArchiveRestore } from 'lucide-react';
import type { CallLog } from '../../types';

interface CallsTabProps {
  calls: CallLog[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  displayCount: number;
  onDisplayCountChange: (updater: (prev: number) => number) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  archivedCount: number;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onExportCSV: () => void;
  formatTimestamp: (value: unknown) => string;
}

export function CallsTab({
  calls,
  searchQuery,
  onSearchQueryChange,
  displayCount,
  onDisplayCountChange,
  showArchived,
  onToggleArchived,
  archivedCount,
  onArchive,
  onUnarchive,
  onExportCSV,
  formatTimestamp,
}: CallsTabProps) {
  const cq = searchQuery.toLowerCase();
  const archiveFilteredCalls = showArchived ? calls : calls.filter((c) => !c.archivedAt);
  const filteredCalls = cq
    ? archiveFilteredCalls.filter((call) =>
        (call.callerName || '').toLowerCase().includes(cq) ||
        (call.callerEmail || '').toLowerCase().includes(cq) ||
        (call.callerPhone || '').toLowerCase().includes(cq) ||
        (call.listingTitle || '').toLowerCase().includes(cq) ||
        (call.sellerName || '').toLowerCase().includes(cq) ||
        (call.status || '').toLowerCase().includes(cq)
      )
    : archiveFilteredCalls;
  const visibleCalls = filteredCalls.slice(0, displayCount);
  const hasMoreCalls = filteredCalls.length > displayCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Call Monitoring</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => { onSearchQueryChange(e.target.value); onDisplayCountChange(() => 20); }}
              className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-2 placeholder:text-muted focus:outline-none focus:border-accent w-48"
            />
          </div>
          <span className="text-[10px] font-black text-data uppercase">Total: {filteredCalls.length}</span>
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={onToggleArchived}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm border transition-colors ${showArchived ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-surface text-muted hover:text-ink'}`}
            >
              {showArchived ? 'Hide Archived' : `Show Archived (${archivedCount})`}
            </button>
          )}
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
          >
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>
      <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-bg">
              <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                <th className="px-6 py-4">Caller</th>
                <th className="px-6 py-4">Ad</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Audio</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Authenticated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibleCalls.map(call => (
                <tr key={call.id} className={`hover:bg-surface/20 transition-colors ${call.archivedAt ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-ink">{call.callerName}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.callerEmail || 'NO EMAIL'}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.callerPhone}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">UID: {call.callerUid || 'GUEST'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-ink">#{call.listingId}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.listingTitle || 'Unknown Listing'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-ink">{call.sellerName || 'Unknown Seller'}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.sellerPhone || 'NO PHONE'}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">UID: {call.sellerUid || call.sellerId || 'UNKNOWN'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-ink">{call.duration}s</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${call.status === 'Completed' ? 'text-data' : call.status === 'Initiated' ? 'text-ink' : 'text-accent'}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 normal-case">
                    {call.recordingUrl ? (
                      <div className="flex flex-col gap-2">
                        <audio controls preload="none" className="max-w-[220px]">
                          <source src={`/api/admin/calls/${encodeURIComponent(call.id)}/recording`} type="audio/mpeg" />
                        </audio>
                        <a
                          href={`/api/admin/calls/${encodeURIComponent(call.id)}/recording`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-accent hover:text-ink transition-colors"
                        >
                          Open audio
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted">No audio</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-muted uppercase">
                    {formatTimestamp(call.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">
                    {call.isAuthenticated ? 'YES' : 'NO'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {call.archivedAt ? (
                      <button
                        type="button"
                        onClick={() => onUnarchive(call.id)}
                        title="Restore call"
                        className="text-data hover:text-ink transition-colors"
                      >
                        <ArchiveRestore size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onArchive(call.id)}
                        title="Archive call"
                        className="text-muted hover:text-ink transition-colors"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMoreCalls && (
          <div className="p-4 border-t border-line flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Showing {visibleCalls.length} of {filteredCalls.length} calls
            </span>
            <button
              type="button"
              onClick={() => onDisplayCountChange((prev) => prev + 20)}
              className="btn-industrial py-1.5 px-4 text-[10px]"
            >
              View More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
