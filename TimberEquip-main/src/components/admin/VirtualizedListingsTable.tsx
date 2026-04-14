import React, { useState, useMemo, useCallback } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { Edit, Trash2, MapPin, ShieldAlert, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Listing } from '../../types';
import { useLocale } from '../LocaleContext';

interface VirtualizedListingsTableProps {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onInspect: (listing: Listing) => void;
  openNativeMap: (location: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkApprove?: (listings: Listing[]) => void;
  bulkApproveLoading?: boolean;
}

interface ListingRowData {
  listings: Listing[];
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onInspect: (listing: Listing) => void;
  openNativeMap: (location: string) => void;
}

function ListingRow({
  index,
  style,
  ariaAttributes: _ariaAttributes,
  listings,
  selectedIds,
  toggleSelection,
  onEdit,
  onDelete,
  onInspect,
  openNativeMap,
}: RowComponentProps<ListingRowData>) {
  const listing = listings[index];
  const { formatPrice } = useLocale();
  const isSelected = selectedIds.has(listing.id);

  const thumbnailImage = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images[0]
    : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';

  return (
    <div
      style={style}
      role="row"
      aria-rowindex={index + 2}
      className={`flex items-center hover:bg-surface/40 transition-colors border-b border-line px-3 md:px-6 py-4 ${isSelected ? 'bg-accent/5' : ''}`}
    >
      {/* Checkbox */}
      <div role="cell" className="w-10 shrink-0 flex items-center justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelection(listing.id)}
          aria-label={`Select ${listing.title || 'listing'}`}
          className="accent-accent w-4 h-4 cursor-pointer"
        />
      </div>
      {/* Equipment */}
      <div role="cell" className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-12 h-12 bg-surface rounded-sm overflow-hidden border border-line shrink-0">
          <img
            src={thumbnailImage}
            alt={listing.title || 'Equipment'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';
            }}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black uppercase tracking-tight text-ink truncate" title={listing.title || '(No title)'}>{listing.title || '(No title)'}</span>
          <span className="text-[9px] font-bold text-muted uppercase truncate" title={`${listing.manufacturer || 'Unknown'} • ${listing.year || 'N/A'}`}>{listing.manufacturer || 'Unknown'} • {listing.year || 'N/A'}</span>
          <span className="text-[9px] font-bold text-muted uppercase truncate md:hidden">{listing.category || 'Uncategorized'}</span>
        </div>
      </div>

      {/* Category — hidden on mobile */}
      <div role="cell" className="hidden md:block w-24 text-[10px] font-bold text-muted uppercase truncate px-2" title={listing.category || 'Uncategorized'}>
        {listing.category || 'Uncategorized'}
      </div>

      {/* Price */}
      <div role="cell" className="w-24 md:w-28 text-xs font-black tracking-tighter text-ink px-2 text-right shrink-0">
        {formatPrice(listing.price || 0, listing.currency || 'USD', 0)}
      </div>

      {/* Hours — hidden on mobile */}
      <div role="cell" className="hidden lg:block w-20 text-xs font-black text-ink px-2 text-right">
        {(listing.hours || 0).toLocaleString()}
      </div>

      {/* Location — hidden on mobile */}
      <div role="cell" className="hidden lg:block w-32 px-2">
        <button
          onClick={() => listing.location && openNativeMap(listing.location)}
          className="flex items-center text-[10px] font-bold text-accent uppercase hover:underline"
          disabled={!listing.location}
        >
          <MapPin size={10} className="mr-1 shrink-0" />
          <span className="truncate" title={listing.location || 'N/A'}>{listing.location || 'N/A'}</span>
        </button>
      </div>

      {/* Views — hidden on mobile */}
      <div role="cell" className="hidden lg:block w-16 text-xs font-black text-ink px-2 text-right">
        {listing.views || 0}
      </div>

      {/* Leads — hidden on mobile */}
      <div role="cell" className="hidden lg:block w-16 text-xs font-black text-ink px-2 text-right">
        {listing.leads || 0}
      </div>

      {/* Lifecycle */}
      <div role="cell" className="w-24 md:w-36 px-2 shrink-0">
        <div className="flex flex-col items-start gap-1">
          <span className="rounded-sm bg-surface px-2 py-1 text-[9px] font-black uppercase tracking-widest text-ink">
            {listing.status || 'pending'}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-muted hidden md:block">
            {listing.approvalStatus || 'pending'} / {listing.paymentStatus || 'pending'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div role="cell" className="w-20 md:w-28 px-1 md:px-2 flex justify-end space-x-0.5 md:space-x-1 shrink-0">
        <button
          onClick={() => onInspect(listing)}
          className="p-1.5 md:p-2 text-muted hover:text-secondary"
          title="Lifecycle"
          aria-label="Inspect lifecycle"
        >
          <ShieldAlert size={14} />
        </button>
        <button
          onClick={() => onEdit(listing)}
          className="p-1.5 md:p-2 text-muted hover:text-ink"
          title="Edit"
          aria-label="Edit listing"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => onDelete(listing.id)}
          className="p-1.5 md:p-2 text-muted hover:text-accent"
          title="Delete"
          aria-label="Delete listing"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

type SortColumn = 'price' | 'hours' | 'status' | 'createdAt' | null;
type SortDirection = 'asc' | 'desc';

function SortIndicator({ column, sortCol, sortDir }: { column: string; sortCol: SortColumn; sortDir: SortDirection }) {
  if (sortCol !== column) return null;
  return sortDir === 'asc'
    ? <ChevronUp size={10} className="ml-1 inline-block" />
    : <ChevronDown size={10} className="ml-1 inline-block" />;
}

export const VirtualizedListingsTable: React.FC<VirtualizedListingsTableProps> = React.memo(({
  listings,
  onEdit,
  onDelete,
  onInspect,
  openNativeMap,
  onBulkDelete,
  onBulkApprove,
  bulkApproveLoading = false,
}) => {
  const ROW_HEIGHT = 72; // Approximate height with padding

  const [sortCol, setSortCol] = useState<SortColumn>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedListings = useMemo(() => {
    if (!sortCol) return listings;
    return [...listings].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortCol] ?? '';
      const bVal = (b as unknown as Record<string, unknown>)[sortCol] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [listings, sortCol, sortDir]);

  const listHeight = Math.min(sortedListings.length * ROW_HEIGHT, 600); // Max height of 600px

  const ariaSortAttr = (col: string): { 'aria-sort'?: 'ascending' | 'descending' } =>
    sortCol === col
      ? { 'aria-sort': sortDir === 'asc' ? 'ascending' : 'descending' }
      : {};

  const allVisibleIds = useMemo(() => sortedListings.map(l => l.id), [sortedListings]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  }, [allSelected, allVisibleIds]);

  const handleBulkDelete = useCallback(() => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  }, [onBulkDelete, selectedIds]);

  const handleBulkApprove = useCallback(() => {
    if (!onBulkApprove || selectedIds.size === 0) return;
    onBulkApprove(sortedListings.filter((listing) => selectedIds.has(listing.id)));
  }, [onBulkApprove, selectedIds, sortedListings]);

  return (
    <div className="overflow-x-auto">
    {/* Bulk action toolbar */}
    {someSelected && (
      <div className="flex items-center gap-3 px-6 py-3 bg-accent/5 border border-accent/20 rounded-sm mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-ink">
          {selectedIds.size} {selectedIds.size === 1 ? 'listing' : 'listings'} selected
        </span>
        {onBulkApprove && (
          <button
            type="button"
            onClick={handleBulkApprove}
            disabled={bulkApproveLoading}
            className="btn-industrial btn-accent py-1.5 px-3 text-[10px] flex items-center gap-1 disabled:opacity-60"
          >
            <CheckCircle2 size={12} />
            {bulkApproveLoading ? 'Approving...' : 'Approve & Go Live'}
          </button>
        )}
        {onBulkDelete && (
          <button
            type="button"
            onClick={handleBulkDelete}
            className="btn-industrial py-1.5 px-3 text-[10px] flex items-center gap-1 text-accent hover:bg-accent/10"
          >
            <Trash2 size={12} />
            Delete Selected
          </button>
        )}
        <button
          type="button"
          onClick={() => setSelectedIds(new Set())}
          className="btn-industrial py-1.5 px-3 text-[10px] text-muted"
        >
          Clear Selection
        </button>
      </div>
    )}
    <div role="table" aria-label="Listings" className="border border-line rounded-sm overflow-hidden">
      {/* Header */}
      <div role="rowgroup">
        <div role="row" className="sticky top-0 bg-surface border-b border-line px-3 md:px-6 py-4 flex items-center z-10">
          <div role="columnheader" className="w-10 shrink-0 flex items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              aria-label="Select all listings"
              className="accent-accent w-4 h-4 cursor-pointer"
            />
          </div>
          <div role="columnheader" className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 shrink-0" />
            <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-muted">Equipment</div>
          </div>
          <div role="columnheader" className="hidden md:block w-24 text-[10px] font-black uppercase tracking-widest text-muted px-2">Category</div>
          <div
            role="columnheader"
            {...ariaSortAttr('price')}
            className="w-24 md:w-28 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right cursor-pointer select-none shrink-0"
            onClick={() => handleSort('price')}
          >
            Price<SortIndicator column="price" sortCol={sortCol} sortDir={sortDir} />
          </div>
          <div
            role="columnheader"
            {...ariaSortAttr('hours')}
            className="hidden lg:block w-20 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right cursor-pointer select-none"
            onClick={() => handleSort('hours')}
          >
            Hours<SortIndicator column="hours" sortCol={sortCol} sortDir={sortDir} />
          </div>
          <div role="columnheader" className="hidden lg:block w-32 text-[10px] font-black uppercase tracking-widest text-muted px-2">Location</div>
          <div role="columnheader" className="hidden lg:block w-16 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right">Views</div>
          <div role="columnheader" className="hidden lg:block w-16 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right">Leads</div>
          <div
            role="columnheader"
            {...ariaSortAttr('status')}
            className="w-24 md:w-36 text-[10px] font-black uppercase tracking-widest text-muted px-2 cursor-pointer select-none shrink-0"
            onClick={() => handleSort('status')}
          >
            Lifecycle<SortIndicator column="status" sortCol={sortCol} sortDir={sortDir} />
          </div>
          <div role="columnheader" className="w-20 md:w-28 text-[10px] font-black uppercase tracking-widest text-muted px-1 md:px-2 text-right shrink-0">Actions</div>
        </div>
      </div>

      {/* Virtualized rows */}
      {sortedListings.length > 0 ? (
        <List<ListingRowData>
          role="rowgroup"
          rowComponent={ListingRow}
          rowCount={sortedListings.length}
          rowHeight={ROW_HEIGHT}
          rowProps={{ listings: sortedListings, selectedIds, toggleSelection, onEdit, onDelete, onInspect, openNativeMap }}
          style={{ height: listHeight, width: '100%' }}
        />
      ) : (
        <div role="rowgroup">
          <div role="row" className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-muted">
            <div role="cell">No listings match the current filters. Try adjusting your search or filter criteria.</div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
});

VirtualizedListingsTable.displayName = 'VirtualizedListingsTable';
