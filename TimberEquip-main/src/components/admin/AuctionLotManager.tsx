import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Search, Star, Trash2 } from 'lucide-react';
import { auctionService } from '../../services/auctionService';
import type { Auction, AuctionLot, Listing } from '../../types';

interface AuctionLotManagerProps {
  auction: Auction;
  onAuctionUpdated?: () => Promise<void> | void;
}

interface LotDraftState {
  lotNumber: string;
  startingBid: string;
  reservePrice: string;
  promoted: boolean;
  promotedOrder: string;
  isTitledItem: boolean;
}

function deriveSuggestedLotNumber(lots: AuctionLot[]): string {
  const maxLot = lots.reduce((maxValue, lot) => {
    const numeric = Number.parseInt(String(lot.lotNumber || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numeric) ? Math.max(maxValue, numeric) : maxValue;
  }, 0);
  return String(maxLot + 1 || 1);
}

function deriveStartingBid(listing: Listing): string {
  const price = Number(listing.price || 0);
  if (!Number.isFinite(price) || price <= 0) return '1000';
  const rounded = Math.max(100, Math.round((price * 0.6) / 100) * 100);
  return String(rounded);
}

function deriveReservePrice(listing: Listing): string {
  const price = Number(listing.price || 0);
  if (!Number.isFinite(price) || price <= 0) return '';
  return String(Math.round(price));
}

function toLotDraft(lot: AuctionLot): LotDraftState {
  return {
    lotNumber: lot.lotNumber || '',
    startingBid: String(Math.round(Number(lot.startingBid || 0))),
    reservePrice: lot.reservePrice == null ? '' : String(Math.round(Number(lot.reservePrice || 0))),
    promoted: Boolean(lot.promoted),
    promotedOrder: lot.promotedOrder ? String(lot.promotedOrder) : '',
    isTitledItem: Boolean(lot.isTitledItem),
  };
}

export function AuctionLotManager({ auction, onAuctionUpdated }: AuctionLotManagerProps) {
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignableListings, setAssignableListings] = useState<Listing[]>([]);
  const [assignableLoading, setAssignableLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [createDraft, setCreateDraft] = useState<LotDraftState>({
    lotNumber: '',
    startingBid: '',
    reservePrice: '',
    promoted: false,
    promotedOrder: '',
    isTitledItem: false,
  });
  const [lotDrafts, setLotDrafts] = useState<Record<string, LotDraftState>>({});
  const [savingLotId, setSavingLotId] = useState('');
  const [deletingLotId, setDeletingLotId] = useState('');
  const [addingLot, setAddingLot] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLotsLoading(true);
    const unsubscribe = auctionService.onLotsChange(auction.id, (nextLots) => {
      setLots(nextLots);
      setLotDrafts((previous) => {
        const nextDrafts: Record<string, LotDraftState> = {};
        nextLots.forEach((lot) => {
          nextDrafts[lot.id] = previous[lot.id] || toLotDraft(lot);
        });
        return nextDrafts;
      });
      setLotsLoading(false);
    });
    return () => unsubscribe();
  }, [auction.id]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setAssignableLoading(true);
      try {
        const response = await auctionService.getAssignableListings(auction.id, searchQuery);
        if (!cancelled) {
          setAssignableListings(response.listings || []);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load assignable auction listings:', loadError);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load eligible inventory.');
        }
      } finally {
        if (!cancelled) {
          setAssignableLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [auction.id, searchQuery]);

  useEffect(() => {
    if (!selectedListing) return;
    setCreateDraft({
      lotNumber: deriveSuggestedLotNumber(lots),
      startingBid: deriveStartingBid(selectedListing),
      reservePrice: deriveReservePrice(selectedListing),
      promoted: false,
      promotedOrder: '',
      isTitledItem: false,
    });
  }, [selectedListing, lots]);

  const sortedLots = useMemo(() => {
    return [...lots].sort((left, right) => Number(left.closeOrder || 0) - Number(right.closeOrder || 0));
  }, [lots]);

  async function refreshAuctionShell() {
    await onAuctionUpdated?.();
  }

  async function handleAddLot() {
    if (!selectedListing) return;
    setAddingLot(true);
    setError('');
    setFeedback('');
    try {
      await auctionService.createAdminAuctionLot(auction.id, {
        listingId: selectedListing.id,
        lotNumber: createDraft.lotNumber.trim() || undefined,
        startingBid: Number(createDraft.startingBid || 0) || undefined,
        reservePrice: createDraft.reservePrice.trim() ? Number(createDraft.reservePrice) : null,
        promoted: createDraft.promoted,
        promotedOrder: createDraft.promotedOrder.trim() ? Number(createDraft.promotedOrder) : undefined,
        isTitledItem: createDraft.isTitledItem,
      });
      setFeedback(`Lot added for ${selectedListing.title}.`);
      setSelectedListing(null);
      setCreateDraft({
        lotNumber: '',
        startingBid: '',
        reservePrice: '',
        promoted: false,
        promotedOrder: '',
        isTitledItem: false,
      });
      await refreshAuctionShell();
    } catch (addError) {
      console.error('Failed to add auction lot:', addError);
      setError(addError instanceof Error ? addError.message : 'Unable to add auction lot.');
    } finally {
      setAddingLot(false);
    }
  }

  async function handleSaveLot(lot: AuctionLot) {
    const draft = lotDrafts[lot.id];
    if (!draft) return;
    setSavingLotId(lot.id);
    setError('');
    setFeedback('');
    try {
      await auctionService.updateAdminAuctionLot(auction.id, lot.id, {
        listingId: lot.listingId,
        lotNumber: draft.lotNumber.trim() || undefined,
        startingBid: Number(draft.startingBid || 0) || undefined,
        reservePrice: draft.reservePrice.trim() ? Number(draft.reservePrice) : null,
        promoted: draft.promoted,
        promotedOrder: draft.promotedOrder.trim() ? Number(draft.promotedOrder) : undefined,
        isTitledItem: draft.isTitledItem,
      });
      setFeedback(`Updated lot ${draft.lotNumber || lot.lotNumber}.`);
      await refreshAuctionShell();
    } catch (saveError) {
      console.error('Failed to update auction lot:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to update auction lot.');
    } finally {
      setSavingLotId('');
    }
  }

  async function handleDeleteLot(lot: AuctionLot) {
    setDeletingLotId(lot.id);
    setError('');
    setFeedback('');
    try {
      await auctionService.removeAdminAuctionLot(auction.id, lot.id);
      setFeedback(`Removed lot ${lot.lotNumber}.`);
      await refreshAuctionShell();
    } catch (deleteError) {
      console.error('Failed to delete auction lot:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete auction lot.');
    } finally {
      setDeletingLotId('');
    }
  }

  return (
    <div className="mt-4 grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
      <div className="border border-line rounded-sm bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h4 className="text-sm font-black uppercase tracking-widest">Add Auction Lots</h4>
          <p className="mt-1 text-xs text-muted">
            Search approved, paid listings and assign them into this auction catalog.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input-industrial w-full pl-11"
              placeholder="Search by title, make, model, stock number, or location"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="max-h-[320px] overflow-y-auto border border-line rounded-sm">
            {assignableLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" />
                Loading eligible listings...
              </div>
            ) : assignableListings.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted">
                No eligible listings found for this auction.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {assignableListings.map((listing) => (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => setSelectedListing(listing)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-bg ${
                      selectedListing?.id === listing.id ? 'bg-accent/5' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-ink">
                          {listing.year} {listing.make || listing.manufacturer || ''} {listing.model}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {listing.location || 'Location pending'}
                          {listing.stockNumber ? ` • Stock ${listing.stockNumber}` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] font-black text-accent">
                        ${Number(listing.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedListing && (
            <div className="rounded-sm border border-accent/20 bg-accent/5 p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label-micro text-accent">Selected Listing</p>
                  <h5 className="text-sm font-black uppercase tracking-wide">
                    {selectedListing.year} {selectedListing.make || selectedListing.manufacturer || ''} {selectedListing.model}
                  </h5>
                  <p className="mt-1 text-xs text-muted">{selectedListing.location || 'Location pending'}</p>
                </div>
                <button
                  type="button"
                  className="text-xs font-black uppercase tracking-widest text-muted hover:text-ink"
                  onClick={() => setSelectedListing(null)}
                >
                  Clear
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label-micro mb-1 block">Lot Number</label>
                  <input
                    className="input-industrial w-full"
                    value={createDraft.lotNumber}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, lotNumber: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-micro mb-1 block">Starting Bid</label>
                  <input
                    className="input-industrial w-full"
                    type="number"
                    min="0"
                    value={createDraft.startingBid}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, startingBid: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-micro mb-1 block">Reserve Price</label>
                  <input
                    className="input-industrial w-full"
                    type="number"
                    min="0"
                    value={createDraft.reservePrice}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, reservePrice: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label-micro mb-1 block">Featured Order</label>
                  <input
                    className="input-industrial w-full"
                    type="number"
                    min="1"
                    value={createDraft.promotedOrder}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, promotedOrder: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
                  <input
                    type="checkbox"
                    checked={createDraft.promoted}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, promoted: event.target.checked }))}
                  />
                  Featured Lot
                </label>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
                  <input
                    type="checkbox"
                    checked={createDraft.isTitledItem}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, isTitledItem: event.target.checked }))}
                  />
                  Titled Item
                </label>
              </div>

              <button
                type="button"
                className="btn-industrial btn-accent"
                disabled={addingLot}
                onClick={handleAddLot}
              >
                {addingLot ? 'Adding Lot...' : 'Add Lot to Auction'}
              </button>
            </div>
          )}

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          {feedback && <p className="text-xs font-bold text-accent">{feedback}</p>}
        </div>
      </div>

      <div className="border border-line rounded-sm bg-surface">
        <div className="border-b border-line px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest">Assigned Lots</h4>
            <p className="mt-1 text-xs text-muted">
              Review current lot settings, promote featured equipment, or remove lots from the sale.
            </p>
          </div>
          <a
            href={`/auctions/${auction.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-industrial btn-outline text-[10px]"
          >
            View Public Auction
            <ExternalLink size={12} className="ml-1.5" />
          </a>
        </div>

        {lotsLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
            <Loader2 size={14} className="animate-spin" />
            Loading auction lots...
          </div>
        ) : sortedLots.length === 0 ? (
          <div className="px-5 py-10 text-sm text-muted">No lots have been assigned yet.</div>
        ) : (
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 label-micro">Lot</th>
                  <th className="px-4 py-3 label-micro">Equipment</th>
                  <th className="px-4 py-3 label-micro">Starting Bid</th>
                  <th className="px-4 py-3 label-micro">Reserve</th>
                  <th className="px-4 py-3 label-micro">Status</th>
                  <th className="px-4 py-3 label-micro">Flags</th>
                  <th className="px-4 py-3 label-micro">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLots.map((lot) => {
                  const draft = lotDrafts[lot.id] || toLotDraft(lot);
                  return (
                    <tr key={lot.id} className="border-b border-line/80 align-top">
                      <td className="px-4 py-4">
                        <input
                          className="input-industrial w-24"
                          value={draft.lotNumber}
                          onChange={(event) => setLotDrafts((current) => ({
                            ...current,
                            [lot.id]: { ...draft, lotNumber: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-wide text-ink">
                          {lot.year} {lot.manufacturer} {lot.model}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {lot.pickupLocation || 'Pickup pending'} • Current {`$${Number(lot.currentBid || 0).toLocaleString()}`}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          className="input-industrial w-28"
                          type="number"
                          min="0"
                          value={draft.startingBid}
                          onChange={(event) => setLotDrafts((current) => ({
                            ...current,
                            [lot.id]: { ...draft, startingBid: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          className="input-industrial w-28"
                          type="number"
                          min="0"
                          value={draft.reservePrice}
                          onChange={(event) => setLotDrafts((current) => ({
                            ...current,
                            [lot.id]: { ...draft, reservePrice: event.target.value },
                          }))}
                          placeholder="None"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-sm border border-line px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted">
                          {lot.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-muted">
                            <input
                              type="checkbox"
                              checked={draft.promoted}
                              onChange={(event) => setLotDrafts((current) => ({
                                ...current,
                                [lot.id]: { ...draft, promoted: event.target.checked },
                              }))}
                            />
                            <Star size={12} className="text-accent" />
                            Featured
                          </label>
                          <label className="flex items-center gap-2 text-[11px] font-bold text-muted">
                            <input
                              type="checkbox"
                              checked={draft.isTitledItem}
                              onChange={(event) => setLotDrafts((current) => ({
                                ...current,
                                [lot.id]: { ...draft, isTitledItem: event.target.checked },
                              }))}
                            />
                            Titled Item
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            className="btn-industrial btn-outline text-[10px]"
                            disabled={savingLotId === lot.id}
                            onClick={() => handleSaveLot(lot)}
                          >
                            {savingLotId === lot.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="btn-industrial btn-outline text-[10px] text-red-600"
                            disabled={deletingLotId === lot.id}
                            onClick={() => handleDeleteLot(lot)}
                          >
                            {deletingLotId === lot.id ? (
                              'Removing...'
                            ) : (
                              <>
                                <Trash2 size={12} className="mr-1.5" />
                                Remove
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
