import React, { useState, useEffect } from 'react';
import { Package, Gavel, Layers, Edit, Trash2, Search, ArrowLeft, Download } from 'lucide-react';
import { auctionService } from '../../services/auctionService';
import { equipmentService } from '../../services/equipmentService';
import type { Auction, AuctionStatus, AuctionLot } from '../../types';
import { Listing } from '../../types';
import { AuctionLotManager } from '../../components/admin/AuctionLotManager';

// ── Props ───────────────────────────────────────────────────────────────────

export interface AuctionsTabProps {
  onFeedback: (feedback: { tone: 'success' | 'warning' | 'error'; message: string }) => void;
  confirm: (opts: { title: string; message: string; variant?: 'danger' | 'warning' }) => Promise<boolean>;
  formatPrice: (n: number) => string;
}

// ── Component ───────────────────────────────────────────────────────────────

export function AuctionsTab({ onFeedback, confirm, formatPrice }: AuctionsTabProps) {
  const [auctionsList, setAuctionsList] = useState<Auction[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(false);
  const [auctionEditing, setAuctionEditing] = useState<{ mode: 'create' } | { mode: 'edit'; auction: Auction } | null>(null);
  const [managingAuctionId, setManagingAuctionId] = useState<string | null>(null);
  const [auctionLots, setAuctionLots] = useState<AuctionLot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [lotEditing, setLotEditing] = useState<AuctionLot | null>(null);
  const [listingSearch, setListingSearch] = useState('');
  const [listingResults, setListingResults] = useState<Listing[]>([]);
  const [listingSearching, setListingSearching] = useState(false);
  const [addingLotForListingId, setAddingLotForListingId] = useState<string | null>(null);
  const [addLotStartingBid, setAddLotStartingBid] = useState<number>(0);
  const [addLotReservePrice, setAddLotReservePrice] = useState<string>('');
  const [lotEditForm, setLotEditForm] = useState<{ startingBid: number; reservePrice: string; status: string; isTitledItem: boolean; buyerPremiumPercent: string }>({ startingBid: 0, reservePrice: '', status: 'upcoming', isTitledItem: false, buyerPremiumPercent: '' });
  const [managedAuctionId, setManagedAuctionId] = useState('');

  // ── Data loading ───────────────────────────────────────────────────────

  useEffect(() => {
    void loadAuctions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAuctions() {
    setAuctionsLoading(true);
    try {
      const data = await auctionService.getAuctions();
      setAuctionsList(data);
    } catch (e) {
      console.error('Failed to load auctions:', e);
    } finally {
      setAuctionsLoading(false);
    }
  }

  async function handleAuctionStatusChange(auctionId: string, newStatus: AuctionStatus) {
    try {
      await auctionService.updateAuctionStatus(auctionId, newStatus);
      await loadAuctions();
    } catch (e) {
      console.error('Failed to update auction status:', e);
    }
  }

  async function loadLots(auctionId: string) {
    setLotsLoading(true);
    try {
      const lots = await auctionService.getLots(auctionId);
      setAuctionLots(lots);
    } catch (e) {
      console.error('Failed to load lots:', e);
    } finally {
      setLotsLoading(false);
    }
  }

  async function searchListingsForLot(query: string) {
    if (!query.trim()) {
      setListingResults([]);
      return;
    }
    setListingSearching(true);
    try {
      const all = await equipmentService.getListings();
      const q = query.toLowerCase();
      const filtered = all.filter(l =>
        !l.auctionId &&
        (l.title?.toLowerCase().includes(q) ||
         l.manufacturer?.toLowerCase().includes(q) ||
         l.model?.toLowerCase().includes(q) ||
         l.make?.toLowerCase().includes(q))
      );
      setListingResults(filtered.slice(0, 20));
    } catch (e) {
      console.error('Failed to search listings:', e);
    } finally {
      setListingSearching(false);
    }
  }

  async function addLotFromListing(listing: Listing, startingBid: number, reservePrice?: number) {
    if (!managingAuctionId) return;
    const auction = auctionsList.find(a => a.id === managingAuctionId);
    try {
      await auctionService.addLot(managingAuctionId, {
        auctionId: managingAuctionId,
        listingId: listing.id,
        lotNumber: String(auctionLots.length + 1).padStart(3, '0'),
        closeOrder: auctionLots.length,
        startingBid,
        reservePrice: reservePrice || null,
        buyerPremiumPercent: auction?.defaultBuyerPremiumPercent || 10,
        startTime: auction?.startTime || '',
        endTime: auction?.endTime || '',
        originalEndTime: auction?.endTime || '',
        softCloseThresholdMin: auction?.softCloseThresholdMin || 3,
        softCloseExtensionMin: auction?.softCloseExtensionMin || 2,
        softCloseGroupId: null,
        status: 'upcoming',
        promoted: false,
        promotedOrder: 0,
        title: listing.title || '',
        manufacturer: listing.manufacturer || listing.make || '',
        model: listing.model || '',
        year: listing.year || 0,
        thumbnailUrl: (listing.images && listing.images[0]) || '',
        pickupLocation: listing.location || '',
        paymentDeadlineDays: auction?.defaultPaymentDeadlineDays || 3,
        removalDeadlineDays: auction?.defaultRemovalDeadlineDays || 14,
        storageFeePerDay: 0,
      });
      await loadLots(managingAuctionId);
      await loadAuctions();
      setListingSearch('');
      setListingResults([]);
      setAddingLotForListingId(null);
      setAddLotStartingBid(0);
      setAddLotReservePrice('');
    } catch (e) {
      console.error('Failed to add lot:', e);
    }
  }

  async function handleRemoveLot(lotId: string) {
    if (!managingAuctionId) return;
    const ok = await confirm({ title: 'Remove Lot', message: 'Remove this lot from the auction? The listing will become available for other auctions.', variant: 'danger' });
    if (!ok) return;
    try {
      await auctionService.removeLot(managingAuctionId, lotId);
      await loadLots(managingAuctionId);
      await loadAuctions();
    } catch (e) {
      console.error('Failed to remove lot:', e);
    }
  }

  async function handleUpdateLot(lotId: string) {
    if (!managingAuctionId) return;
    try {
      await auctionService.updateLot(managingAuctionId, lotId, {
        startingBid: lotEditForm.startingBid,
        reservePrice: lotEditForm.reservePrice ? Number(lotEditForm.reservePrice) : null,
        status: lotEditForm.status as AuctionLot['status'],
        isTitledItem: lotEditForm.isTitledItem,
        buyerPremiumPercent: lotEditForm.buyerPremiumPercent ? Number(lotEditForm.buyerPremiumPercent) : null,
      });
      setLotEditing(null);
      await loadLots(managingAuctionId);
    } catch (e) {
      console.error('Failed to update lot:', e);
    }
  }

  // ── Inner components ───────────────────────────────────────────────────

  function AuctionEditor({ auction, onSave, onCancel }: { auction?: Auction; onSave: () => void; onCancel: () => void }) {
    const [title, setTitle] = useState(auction?.title || '');
    const [description, setDescription] = useState(auction?.description || '');
    const [startTime, setStartTime] = useState(auction?.startTime?.slice(0, 16) || '');
    const [endTime, setEndTime] = useState(auction?.endTime?.slice(0, 16) || '');
    const [previewStartTime, setPreviewStartTime] = useState(auction?.previewStartTime?.slice(0, 16) || '');
    const [buyerPremium, setBuyerPremium] = useState(auction?.defaultBuyerPremiumPercent ?? 10);
    const [coverImageUrl, setCoverImageUrl] = useState(auction?.coverImageUrl || '');
    const [termsUrl, setTermsUrl] = useState(auction?.termsAndConditionsUrl || '');
    const [featured, setFeatured] = useState(auction?.featured ?? false);
    const [softCloseThreshold, setSoftCloseThreshold] = useState(auction?.softCloseThresholdMin ?? 3);
    const [softCloseExtension, setSoftCloseExtension] = useState(auction?.softCloseExtensionMin ?? 2);
    const [staggerInterval, setStaggerInterval] = useState(auction?.staggerIntervalMin ?? 1);
    const [paymentDeadline, setPaymentDeadline] = useState(auction?.defaultPaymentDeadlineDays ?? 7);
    const [removalDeadline, setRemovalDeadline] = useState(auction?.defaultRemovalDeadlineDays ?? 14);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
      if (!title.trim()) return;
      setSaving(true);
      try {
        const data = {
          title: title.trim(),
          slug: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          description,
          coverImageUrl,
          startTime: startTime ? new Date(startTime).toISOString() : '',
          endTime: endTime ? new Date(endTime).toISOString() : '',
          previewStartTime: previewStartTime ? new Date(previewStartTime).toISOString() : (startTime ? new Date(startTime).toISOString() : ''),
          status: (auction?.status || 'draft') as AuctionStatus,
          defaultBuyerPremiumPercent: buyerPremium,
          termsAndConditionsUrl: termsUrl,
          featured,
          bannerEnabled: auction?.bannerEnabled ?? false,
          bannerImageUrl: auction?.bannerImageUrl || '',
          softCloseThresholdMin: softCloseThreshold,
          softCloseExtensionMin: softCloseExtension,
          staggerIntervalMin: staggerInterval,
          defaultPaymentDeadlineDays: paymentDeadline,
          defaultRemovalDeadlineDays: removalDeadline,
          createdBy: auction?.createdBy || '',
        };
        if (auction?.id) {
          await auctionService.updateAuction(auction.id, data);
        } else {
          await auctionService.createAuction(data);
        }
        onSave();
      } catch (e) {
        console.error('Failed to save auction:', e);
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="border border-line rounded-sm p-6 space-y-4">
        <h3 className="font-black text-sm uppercase tracking-widest">{auction ? 'Edit Auction' : 'Create Auction'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-micro block mb-1">Title</label>
            <input className="input-industrial w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="April 2026 Forestry Equipment Auction" />
          </div>
          <div>
            <label className="label-micro block mb-1">Buyer Premium %</label>
            <input className="input-industrial w-full" type="number" value={buyerPremium} onChange={e => setBuyerPremium(Number(e.target.value))} min={0} max={100} />
          </div>
          <div>
            <label className="label-micro block mb-1">Preview Opens</label>
            <input className="input-industrial w-full" type="datetime-local" value={previewStartTime} onChange={e => setPreviewStartTime(e.target.value)} />
          </div>
          <div>
            <label className="label-micro block mb-1">Bidding Opens</label>
            <input className="input-industrial w-full" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="label-micro block mb-1">First Lot Closes</label>
            <input className="input-industrial w-full" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
          <div>
            <label className="label-micro block mb-1">Cover Image URL</label>
            <input className="input-industrial w-full" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="label-micro block mb-1">Terms & Conditions URL</label>
            <input className="input-industrial w-full" value={termsUrl} onChange={e => setTermsUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="accent-accent" />
              <span className="label-micro">Featured Auction</span>
            </label>
          </div>
        </div>

        <div>
          <label className="label-micro block mb-1">Description</label>
          <textarea className="input-industrial w-full min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Auction description…" />
        </div>

        <div className="border border-line rounded-sm p-4 space-y-3">
          <h4 className="font-black text-[10px] uppercase tracking-widest text-muted">Soft Close Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-micro block mb-1">Threshold (min)</label>
              <input className="input-industrial w-full" type="number" value={softCloseThreshold} onChange={e => setSoftCloseThreshold(Number(e.target.value))} min={1} max={30} />
              <p className="text-[9px] text-muted mt-0.5">Bid within this many minutes of close triggers extension</p>
            </div>
            <div>
              <label className="label-micro block mb-1">Extension (min)</label>
              <input className="input-industrial w-full" type="number" value={softCloseExtension} onChange={e => setSoftCloseExtension(Number(e.target.value))} min={1} max={30} />
              <p className="text-[9px] text-muted mt-0.5">Minutes added when soft close is triggered</p>
            </div>
            <div>
              <label className="label-micro block mb-1">Stagger Interval (min)</label>
              <input className="input-industrial w-full" type="number" value={staggerInterval} onChange={e => setStaggerInterval(Number(e.target.value))} min={0} max={10} />
              <p className="text-[9px] text-muted mt-0.5">Minutes between consecutive lot closes</p>
            </div>
          </div>
        </div>

        <div className="border border-line rounded-sm p-4 space-y-3">
          <h4 className="font-black text-[10px] uppercase tracking-widest text-muted">Post-Auction Deadlines</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-micro block mb-1">Payment Deadline (days)</label>
              <input className="input-industrial w-full" type="number" value={paymentDeadline} onChange={e => setPaymentDeadline(Number(e.target.value))} min={1} max={30} />
            </div>
            <div>
              <label className="label-micro block mb-1">Removal Deadline (days)</label>
              <input className="input-industrial w-full" type="number" value={removalDeadline} onChange={e => setRemovalDeadline(Number(e.target.value))} min={1} max={60} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-industrial btn-accent" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Auction'}</button>
          <button className="btn-industrial btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── CSV export ─────────────────────────────────────────────────────────

  const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const exportAuctionsCSV = () => {
    if (!auctionsList.length) return;
    const headers = ['ID', 'Title', 'Status', 'Start Time', 'End Time', 'Lot Count', 'Total Bids', 'Total GMV', 'Buyer Premium %', 'Featured', 'Created By', 'Created At'];
    const rows = auctionsList.map((a) => [
      a.id, a.title, a.status, a.startTime || '', a.endTime || '',
      String(a.lotCount || 0), String(a.totalBids || 0), String(a.totalGMV || 0),
      String(a.defaultBuyerPremiumPercent ?? ''), a.featured ? 'Yes' : 'No',
      a.createdBy || '', a.createdAt || '',
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auctions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Render helpers ─────────────────────────────────────────────────────

  function renderLotManagement() {
    const managingAuction = auctionsList.find(a => a.id === managingAuctionId);
    const totalStartingBids = auctionLots.reduce((sum, lot) => sum + (lot.startingBid || 0), 0);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="btn-industrial btn-outline text-[9px] flex items-center gap-1"
              onClick={() => { setManagingAuctionId(null); setAuctionLots([]); setListingSearch(''); setListingResults([]); setLotEditing(null); setAddingLotForListingId(null); }}
            >
              <ArrowLeft size={12} /> Back
            </button>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Manage Lots</h2>
              <p className="text-xs text-muted mt-1">{managingAuction?.title || 'Auction'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">{auctionLots.length} lots</span>
            <span className="text-[10px] text-muted ml-3">Total starting: {formatPrice(totalStartingBids)}</span>
          </div>
        </div>

        {/* Search Listings to Add */}
        <div className="border border-line rounded-sm p-4 space-y-3">
          <h3 className="font-black text-[10px] uppercase tracking-widest">Add Lot from Listing</h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input-industrial w-full pl-9"
                value={listingSearch}
                onChange={e => setListingSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') searchListingsForLot(listingSearch); }}
                placeholder="Search by title, manufacturer, or model…"
              />
            </div>
            <button
              className="btn-industrial btn-accent text-[9px]"
              onClick={() => searchListingsForLot(listingSearch)}
              disabled={listingSearching}
            >
              {listingSearching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {listingResults.length > 0 && (
            <div className="border border-line rounded-sm divide-y divide-line max-h-[320px] overflow-y-auto">
              {listingResults.map(listing => (
                <div key={listing.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {listing.images?.[0] && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-12 h-12 object-cover rounded-sm border border-line flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{listing.title}</p>
                      <p className="text-[10px] text-muted">
                        {[listing.manufacturer || listing.make, listing.model, listing.year].filter(Boolean).join(' · ')}
                        {listing.location && ` · ${listing.location}`}
                      </p>
                      {listing.price > 0 && (
                        <p className="text-[10px] text-muted">Listed at {formatPrice(listing.price)}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {addingLotForListingId === listing.id ? (
                        <div className="flex items-end gap-2">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted block mb-0.5">Starting Bid</label>
                            <input
                              type="number"
                              className="input-industrial w-28 text-xs"
                              value={addLotStartingBid || ''}
                              onChange={e => setAddLotStartingBid(Number(e.target.value))}
                              placeholder="0"
                              min={0}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted block mb-0.5">Reserve (opt)</label>
                            <input
                              type="number"
                              className="input-industrial w-28 text-xs"
                              value={addLotReservePrice}
                              onChange={e => setAddLotReservePrice(e.target.value)}
                              placeholder="None"
                              min={0}
                            />
                          </div>
                          <button
                            className="btn-industrial btn-accent text-[9px]"
                            onClick={() => addLotFromListing(listing, addLotStartingBid, addLotReservePrice ? Number(addLotReservePrice) : undefined)}
                            disabled={addLotStartingBid <= 0}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn-industrial btn-outline text-[9px]"
                            onClick={() => { setAddingLotForListingId(null); setAddLotStartingBid(0); setAddLotReservePrice(''); }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-industrial btn-outline text-[9px]"
                          onClick={() => { setAddingLotForListingId(listing.id); setAddLotStartingBid(listing.price || 0); setAddLotReservePrice(''); }}
                        >
                          + Add as Lot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {listingSearch && listingResults.length === 0 && !listingSearching && (
            <p className="text-[10px] text-muted text-center py-3">No matching listings found. Try a different search term.</p>
          )}
        </div>

        {/* Lot List */}
        <div className="space-y-3">
          <h3 className="font-black text-[10px] uppercase tracking-widest">Auction Lots</h3>
          {lotsLoading ? (
            <div className="text-center py-12 text-muted text-sm">Loading lots…</div>
          ) : auctionLots.length === 0 ? (
            <div className="text-center py-12 border border-line rounded-sm">
              <Package size={28} className="mx-auto text-muted mb-3" />
              <p className="text-sm font-bold">No lots added yet</p>
              <p className="text-xs text-muted mt-1">Search for listings above to add lots to this auction.</p>
            </div>
          ) : (
            <div className="border border-line rounded-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface/30 text-[9px] font-black uppercase tracking-widest text-muted border-b border-line">
                    <th className="px-3 py-2 text-left">Lot #</th>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Starting Bid</th>
                    <th className="px-3 py-2 text-right">Reserve</th>
                    <th className="px-3 py-2 text-right">Current Bid</th>
                    <th className="px-3 py-2 text-center">Bids</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {auctionLots.map(lot => (
                    <tr key={lot.id} className="text-xs hover:bg-surface/20">
                      {lotEditing?.id === lot.id ? (
                        <>
                          <td className="px-3 py-2 font-mono text-[10px] font-bold">{lot.lotNumber}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {lot.thumbnailUrl && (
                                <img src={lot.thumbnailUrl} alt={lot.title} className="w-8 h-8 object-cover rounded-sm border border-line" />
                              )}
                              <div>
                                <p className="font-bold text-[11px] truncate max-w-[200px]">{lot.title}</p>
                                <p className="text-[9px] text-muted">{[lot.manufacturer, lot.model, lot.year].filter(Boolean).join(' · ')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input type="number" className="input-industrial w-24 text-xs text-right" value={lotEditForm.startingBid} onChange={e => setLotEditForm({ ...lotEditForm, startingBid: Number(e.target.value) })} min={0} />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input type="number" className="input-industrial w-24 text-xs text-right" value={lotEditForm.reservePrice} onChange={e => setLotEditForm({ ...lotEditForm, reservePrice: e.target.value })} placeholder="None" min={0} />
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{lot.currentBid > 0 ? formatPrice(lot.currentBid) : '—'}</td>
                          <td className="px-3 py-2 text-center">{lot.bidCount}</td>
                          <td className="px-3 py-2 text-center">
                            <select className="input-industrial text-[9px] w-24" value={lotEditForm.status} onChange={e => setLotEditForm({ ...lotEditForm, status: e.target.value })}>
                              <option value="upcoming">Upcoming</option>
                              <option value="preview">Preview</option>
                              <option value="active">Active</option>
                              <option value="closed">Closed</option>
                              <option value="sold">Sold</option>
                              <option value="unsold">Unsold</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right" colSpan={1}>
                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              <label className="flex items-center gap-1 text-[9px]">
                                <input type="checkbox" checked={lotEditForm.isTitledItem} onChange={e => setLotEditForm({ ...lotEditForm, isTitledItem: e.target.checked })} className="accent-accent" />
                                Titled
                              </label>
                              <input type="number" className="input-industrial w-16 text-[9px] text-right" value={lotEditForm.buyerPremiumPercent} onChange={e => setLotEditForm({ ...lotEditForm, buyerPremiumPercent: e.target.value })} placeholder="BP%" min={0} max={100} title="Buyer premium % override" />
                              <button className="btn-industrial btn-accent text-[9px]" onClick={() => handleUpdateLot(lot.id)}>Save</button>
                              <button className="btn-industrial btn-outline text-[9px]" onClick={() => setLotEditing(null)}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 font-mono text-[10px] font-bold">{lot.lotNumber}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {lot.thumbnailUrl && (
                                <img src={lot.thumbnailUrl} alt={lot.title} className="w-8 h-8 object-cover rounded-sm border border-line" />
                              )}
                              <div>
                                <p className="font-bold text-[11px] truncate max-w-[200px]">{lot.title}</p>
                                <p className="text-[9px] text-muted">{[lot.manufacturer, lot.model, lot.year].filter(Boolean).join(' · ')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{formatPrice(lot.startingBid)}</td>
                          <td className="px-3 py-2 text-right font-mono">{lot.reservePrice ? formatPrice(lot.reservePrice) : '—'}</td>
                          <td className="px-3 py-2 text-right font-mono">{lot.currentBid > 0 ? formatPrice(lot.currentBid) : '—'}</td>
                          <td className="px-3 py-2 text-center">{lot.bidCount}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                              lot.status === 'active' || lot.status === 'extended' ? 'bg-accent/10 text-accent' :
                              lot.status === 'preview' ? 'bg-data/10 text-data' :
                              lot.status === 'upcoming' ? 'bg-muted/10 text-muted' :
                              lot.status === 'sold' ? 'bg-green-500/10 text-green-600' :
                              lot.status === 'closed' || lot.status === 'unsold' ? 'bg-ink/10 text-ink' :
                              'bg-muted/10 text-muted'
                            }`}>
                              {lot.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                className="p-1 text-muted hover:text-ink"
                                title="Edit lot"
                                onClick={() => { setLotEditing(lot); setLotEditForm({ startingBid: lot.startingBid, reservePrice: lot.reservePrice != null ? String(lot.reservePrice) : '', status: lot.status, isTitledItem: (lot as any).isTitledItem ?? false, buyerPremiumPercent: (lot as any).buyerPremiumPercent != null ? String((lot as any).buyerPremiumPercent) : '' }); }}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                className="p-1 text-muted hover:text-red-500"
                                title="Remove lot"
                                onClick={() => handleRemoveLot(lot.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAuctions() {
    if (managingAuctionId) {
      return renderLotManagement();
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Auction Management</h2>
            <p className="text-xs text-muted mt-1">Create and manage timed online auctions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportAuctionsCSV}
              disabled={!auctionsList.length}
              className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              <Download size={11} /> Export CSV
            </button>
            <button
              className="btn-industrial btn-accent"
              onClick={() => setAuctionEditing({ mode: 'create' })}
            >
              + Create Auction
            </button>
          </div>
        </div>

        {auctionEditing ? (
          <AuctionEditor
            auction={auctionEditing.mode === 'edit' ? auctionEditing.auction : undefined}
            onSave={async () => { setAuctionEditing(null); await loadAuctions(); }}
            onCancel={() => setAuctionEditing(null)}
          />
        ) : (
          <div className="space-y-3">
            {auctionsLoading ? (
              <div className="text-center py-12 text-muted text-sm">Loading auctions…</div>
            ) : auctionsList.length === 0 ? (
              <div className="text-center py-12 border border-line rounded-sm">
                <Gavel size={32} className="mx-auto text-muted mb-3" />
                <p className="text-sm font-bold">No auctions yet</p>
                <p className="text-xs text-muted mt-1">Create your first auction to get started</p>
              </div>
            ) : (
              auctionsList.map((auction) => {
                const isManagingLots = managedAuctionId === auction.id;
                return (
                <React.Fragment key={auction.id}>
                <div className="border border-line rounded-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                        auction.status === 'active' ? 'bg-accent/10 text-accent' :
                        auction.status === 'preview' ? 'bg-data/10 text-data' :
                        auction.status === 'draft' ? 'bg-muted/10 text-muted' :
                        auction.status === 'closed' || auction.status === 'settled' ? 'bg-ink/10 text-ink' :
                        'bg-muted/10 text-muted'
                      }`}>
                        {auction.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-sm">{auction.title}</h3>
                      <p className="text-[10px] text-muted">
                        {auction.lotCount} lots · {auction.totalBids} bids
                        {auction.startTime && ` · Starts ${new Date(auction.startTime).toLocaleDateString()}`}
                        {auction.endTime && ` · Ends ${new Date(auction.endTime).toLocaleString()}`}
                        {Number.isFinite(Number(auction.totalGMV || 0)) && Number(auction.totalGMV || 0) > 0
                          ? ` · GMV $${Number(auction.totalGMV || 0).toLocaleString()}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {auction.status === 'draft' && (
                      <button
                        className="btn-industrial btn-outline text-[9px]"
                        onClick={() => handleAuctionStatusChange(auction.id, 'preview')}
                      >
                        Publish Preview
                      </button>
                    )}
                    {auction.status === 'preview' && (
                      <button
                        className="btn-industrial btn-accent text-[9px]"
                        onClick={() => handleAuctionStatusChange(auction.id, 'active')}
                      >
                        Go Live
                      </button>
                    )}
                    {auction.status === 'active' && (
                      <button
                        className="btn-industrial btn-outline text-[9px] border-red-300 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          const ok = await confirm({ title: 'Close Auction', message: 'This will close bidding on all lots. Are you sure?', variant: 'warning' });
                          if (ok) await handleAuctionStatusChange(auction.id, 'closed' as AuctionStatus);
                        }}
                      >
                        Close Bidding
                      </button>
                    )}
                    {auction.status === 'closed' && (
                      <button
                        className="btn-industrial btn-accent text-[9px]"
                        onClick={async () => {
                          const ok = await confirm({ title: 'Settle Auction', message: 'This will finalize all lots and generate invoices. Continue?', variant: 'warning' });
                          if (ok) await handleAuctionStatusChange(auction.id, 'settled' as AuctionStatus);
                        }}
                      >
                        Settle Auction
                      </button>
                    )}
                    <button
                      className="btn-industrial btn-outline text-[9px] flex items-center gap-1"
                      onClick={async () => { setManagingAuctionId(auction.id); await loadLots(auction.id); }}
                    >
                      <Layers size={11} /> Lots ({auction.lotCount})
                    </button>
                    <button
                      className="btn-industrial btn-outline text-[9px]"
                      onClick={() => setManagedAuctionId((current) => current === auction.id ? '' : auction.id)}
                    >
                      {isManagingLots ? 'Hide Lots & Results' : 'Manage Lots & Results'}
                    </button>
                    <button
                      className="btn-industrial btn-outline text-[9px]"
                      onClick={() => setAuctionEditing({ mode: 'edit', auction })}
                    >
                      Edit
                    </button>
                  </div>
                </div>
                {isManagingLots && (
                  <div className="border border-line border-t-0 rounded-b-sm bg-bg/40 p-4">
                    <AuctionLotManager auction={auction} onAuctionUpdated={loadAuctions} />
                  </div>
                )}
                </React.Fragment>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return renderAuctions();
}
