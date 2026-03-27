import React from 'react';
import { List, type RowComponentProps } from 'react-window';
import { Edit, Trash2, MapPin, ShieldAlert } from 'lucide-react';
import { Listing } from '../../types';
import { useLocale } from '../LocaleContext';

interface VirtualizedListingsTableProps {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onInspect: (listing: Listing) => void;
  openNativeMap: (location: string) => void;
}

interface ListingRowData {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onInspect: (listing: Listing) => void;
  openNativeMap: (location: string) => void;
}

function ListingRow({
  index,
  style,
  ariaAttributes,
  listings,
  onEdit,
  onDelete,
  onInspect,
  openNativeMap,
}: RowComponentProps<ListingRowData>) {
  const listing = listings[index];
  const { formatPrice } = useLocale();
  
  const thumbnailImage = Array.isArray(listing.images) && listing.images.length > 0 
    ? listing.images[0] 
    : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';

  return (
    <div 
      {...ariaAttributes}
      style={style}
      className="flex items-center hover:bg-surface/20 transition-colors border-b border-line px-6 py-4"
    >
      {/* Equipment */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
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
          <span className="text-xs font-black uppercase tracking-tight text-ink truncate">{listing.title || '(No title)'}</span>
          <span className="text-[9px] font-bold text-muted uppercase truncate">{listing.manufacturer || 'Unknown'} • {listing.year || 'N/A'}</span>
        </div>
      </div>

      {/* Category */}
      <div className="w-24 text-[10px] font-bold text-muted uppercase truncate px-2">
        {listing.category || 'Uncategorized'}
      </div>

      {/* Price */}
      <div className="w-28 text-xs font-black tracking-tighter text-ink px-2 text-right">
        {formatPrice(listing.price || 0, listing.currency || 'USD', 0)}
      </div>

      {/* Hours */}
      <div className="w-20 text-xs font-black text-ink px-2 text-right">
        {(listing.hours || 0).toLocaleString()}
      </div>

      {/* Location */}
      <div className="w-32 px-2">
        <button 
          onClick={() => listing.location && openNativeMap(listing.location)} 
          className="flex items-center text-[10px] font-bold text-accent uppercase hover:underline" 
          disabled={!listing.location}
        >
          <MapPin size={10} className="mr-1 shrink-0" /> 
          <span className="truncate">{listing.location || 'N/A'}</span>
        </button>
      </div>

      {/* Leads */}
      <div className="w-16 text-xs font-black text-ink px-2 text-right">
        {listing.leads || 0}
      </div>

      {/* Lifecycle */}
      <div className="w-36 px-2">
        <div className="flex flex-col items-start gap-1">
          <span className="rounded-sm bg-surface px-2 py-1 text-[9px] font-black uppercase tracking-widest text-ink">
            {listing.status || 'pending'}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-muted">
            {listing.approvalStatus || 'pending'} / {listing.paymentStatus || 'pending'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-28 px-2 flex justify-end space-x-1 shrink-0">
        <button
          onClick={() => onInspect(listing)}
          className="p-2 text-muted hover:text-secondary"
          title="Lifecycle"
        >
          <ShieldAlert size={14} />
        </button>
        <button 
          onClick={() => onEdit(listing)}
          className="p-2 text-muted hover:text-ink"
          title="Edit"
        >
          <Edit size={14} />
        </button>
        <button 
          onClick={() => onDelete(listing.id)}
          className="p-2 text-muted hover:text-accent"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export const VirtualizedListingsTable: React.FC<VirtualizedListingsTableProps> = React.memo(({
  listings,
  onEdit,
  onDelete,
  onInspect,
  openNativeMap,
}) => {
  const ROW_HEIGHT = 72; // Approximate height with padding
  const listHeight = Math.min(listings.length * ROW_HEIGHT, 600); // Max height of 600px
  
  return (
    <div className="border border-line rounded-sm overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center z-10">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12" />
          <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-muted">Equipment</div>
        </div>
        <div className="w-24 text-[10px] font-black uppercase tracking-widest text-muted px-2">Category</div>
        <div className="w-28 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right">Price</div>
        <div className="w-20 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right">Hours</div>
        <div className="w-32 text-[10px] font-black uppercase tracking-widest text-muted px-2">Location</div>
        <div className="w-16 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right">Leads</div>
        <div className="w-36 text-[10px] font-black uppercase tracking-widest text-muted px-2">Lifecycle</div>
        <div className="w-28 text-[10px] font-black uppercase tracking-widest text-muted px-2 text-right">Actions</div>
      </div>

      {/* Virtualized rows */}
      {listings.length > 0 ? (
        <List<ListingRowData>
          rowComponent={ListingRow}
          rowCount={listings.length}
          rowHeight={ROW_HEIGHT}
          rowProps={{ listings, onEdit, onDelete, onInspect, openNativeMap }}
          style={{ height: listHeight, width: '100%' }}
        />
      ) : (
        <div className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-muted">
          No listings match the current filters.
        </div>
      )}
    </div>
  );
});

VirtualizedListingsTable.displayName = 'VirtualizedListingsTable';
