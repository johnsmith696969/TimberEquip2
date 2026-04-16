import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ExternalLink, Loader2, Mail, Search, ShieldCheck, Star, Trash2, UserRound } from 'lucide-react';
import { auctionService, type AuctionLotInvoiceResponse } from '../../services/auctionService';
import type { Auction, AuctionInvoice, AuctionLot, Listing } from '../../types';

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
  const [resultsQuery, setResultsQuery] = useState('');
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
  const [settlingInvoiceId, setSettlingInvoiceId] = useState('');
  const [addingLot, setAddingLot] = useState(false);
  const [lotSettlements, setLotSettlements] = useState<Record<string, AuctionLotInvoiceResponse>>({});
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

  const soldLots = useMemo(() => sortedLots.filter((lot) => lot.status === 'sold'), [sortedLots]);
  const unsoldLots = useMemo(() => sortedLots.filter((lot) => lot.status === 'unsold'), [sortedLots]);
  const endedLots = useMemo(
    () => sortedLots.filter((lot) => ['sold', 'unsold', 'closed'].includes(String(lot.status || '').toLowerCase())),
    [sortedLots],
  );

  useEffect(() => {
    let cancelled = false;

    if (soldLots.length === 0) {
      setLotSettlements({});
      return undefined;
    }

    async function loadLotInvoices() {
      const settlementEntries = await Promise.all(
        soldLots.map(async (lot) => {
          try {
            const response = await auctionService.getLotInvoice(auction.slug, lot.lotNumber);
            return [lot.id, response] as const;
          } catch (invoiceError) {
            console.error(`Failed to load invoice for auction lot ${lot.lotNumber}:`, invoiceError);
            return [lot.id, null] as const;
          }
        }),
      );

      if (cancelled) return;

      const nextSettlements: Record<string, AuctionLotInvoiceResponse> = {};
      settlementEntries.forEach(([lotId, response]) => {
        if (response?.invoice) {
          nextSettlements[lotId] = response;
        }
      });
      setLotSettlements(nextSettlements);
    }

    void loadLotInvoices();

    return () => {
      cancelled = true;
    };
  }, [auction.slug, soldLots]);

  const visibleEndedLots = useMemo(() => {
    const queryValue = resultsQuery.trim().toLowerCase();
    if (!queryValue) return endedLots;

    return endedLots.filter((lot) => {
      const settlement = lotSettlements[lot.id];
      const buyer = settlement?.buyer;
      const haystack = [
        lot.lotNumber,
        lot.year,
        lot.manufacturer,
        lot.model,
        lot.status,
        lot.pickupLocation,
        buyer?.uid,
        buyer?.email,
        buyer?.displayName,
        buyer?.fullName,
        buyer?.firstName,
        buyer?.lastName,
        buyer?.businessName,
        settlement?.invoice?.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(queryValue);
    });
  }, [endedLots, lotSettlements, resultsQuery]);

  const openSettlementCount = useMemo(
    () => soldLots.filter((lot) => {
      const invoice = lotSettlements[lot.id]?.invoice;
      return Boolean(invoice && invoice.status !== 'paid');
    }).length,
    [lotSettlements, soldLots],
  );

  const latestEndTime = useMemo(() => {
    const values = endedLots
      .map((lot) => {
        const parsed = lot.endTime ? new Date(lot.endTime).getTime() : Number.NaN;
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((value): value is number => value !== null);
    if (!values.length) return '';
    return formatDateTime(new Date(Math.max(...values)).toISOString());
  }, [endedLots]);

  function formatCurrency(value: number | null | undefined) {
    return `$${Number(value || 0).toLocaleString()}`;
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString();
  }

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

  async function handleSettleWireInvoice(lot: AuctionLot, invoice: AuctionInvoice) {
    setSettlingInvoiceId(invoice.id);
    setError('');
    setFeedback('');

    try {
      const response = await auctionService.adminSettleAuctionInvoice(invoice.id);
      setLotSettlements((current) => ({
        ...current,
        [lot.id]: current[lot.id]
          ? { ...current[lot.id], invoice: response.invoice }
          : {
            invoice: response.invoice,
            cardEligible: false,
            paymentMethodOptions: ['wire'],
            buyer: null,
          },
      }));
      setLots((current) => current.map((entry) => (
        entry.id === lot.id
          ? { ...entry, ...response.lot }
          : entry
      )));
      setFeedback(`Wire received and lot ${lot.lotNumber} released.`);
      await refreshAuctionShell();
    } catch (settlementError) {
      console.error('Failed to settle auction invoice:', settlementError);
      setError(settlementError instanceof Error ? settlementError.message : 'Unable to settle auction invoice.');
    } finally {
      setSettlingInvoiceId('');
    }
  }

  return (
    <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
      <div className="border border-line rounded-sm bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h4 className="text-sm font-black uppercase tracking-widest">Add Auction Lots</h4>
          <p className="mt-1 text-xs text-muted">
            Search approved, paid listings and assign them into this auction catalog.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted/80" />
            <input
              className="input-industrial w-full py-2.5 pl-14 pr-4 text-xs"
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

        <div className="border-b border-line bg-bg/40 px-5 py-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { label: 'Sold Lots', value: soldLots.length, tone: 'text-accent' },
                  { label: 'Unsold Lots', value: unsoldLots.length, tone: 'text-ink' },
                  { label: 'Open Settlements', value: openSettlementCount, tone: openSettlementCount > 0 ? 'text-amber-600' : 'text-ink' },
                  { label: 'Last End Time', value: latestEndTime || 'Pending', tone: 'text-ink' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-sm border border-line bg-surface px-4 py-3">
                    <p className="label-micro">{metric.label}</p>
                    <p className={`mt-2 text-sm font-black uppercase tracking-wide ${metric.tone}`}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {endedLots.length > 0 ? (
                <div className="rounded-sm border border-line bg-surface">
                  <div className="flex flex-col gap-3 border-b border-line px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-widest text-ink">Auction Results & Settlement</h5>
                      <p className="mt-1 text-[11px] text-muted">
                        Search ended lots and instantly see the winner, invoice, settlement, and auction close details.
                      </p>
                    </div>
                    <div className="relative w-full md:w-[320px]">
                      <Search size={12} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted/80" />
                      <input
                        className="input-industrial w-full py-2.5 pl-14 pr-4 text-[11px]"
                        placeholder="Search winner, email, business, UID, lot, or invoice"
                        value={resultsQuery}
                        onChange={(event) => setResultsQuery(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="max-h-[280px] overflow-y-auto">
                    {visibleEndedLots.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[11px] font-bold text-muted">
                        No ended lots matched that search.
                      </div>
                    ) : (
                      <div className="divide-y divide-line/80">
                        {visibleEndedLots.map((lot) => {
                          const settlement = lotSettlements[lot.id];
                          const buyer = settlement?.buyer || null;
                          const invoice = settlement?.invoice || null;
                          return (
                            <div key={`result-${lot.id}`} className="grid gap-3 px-4 py-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,0.8fr)]">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-sm border border-line px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted">
                                    Lot {lot.lotNumber}
                                  </span>
                                  <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                                    lot.status === 'sold'
                                      ? 'bg-accent/10 text-accent'
                                      : lot.status === 'unsold'
                                        ? 'bg-amber-500/10 text-amber-700'
                                        : 'bg-ink/10 text-ink'
                                  }`}>
                                    {lot.status}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs font-black uppercase tracking-wide text-ink">
                                  {lot.year} {lot.manufacturer} {lot.model}
                                </p>
                                <p className="mt-1 text-[11px] font-bold text-muted">
                                  Ended {formatDateTime(lot.endTime) || 'Pending'} · Hammer {formatCurrency(lot.winningBid || lot.currentBid)}
                                </p>
                                {invoice ? (
                                  <p className="mt-1 text-[10px] font-bold text-muted">
                                    Invoice {invoice.id} · Due {formatCurrency(invoice.totalDue)} · {invoice.status}
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Winning Bidder</p>
                                {buyer ? (
                                  <div className="mt-2 space-y-1.5 text-[11px] font-bold text-muted">
                                    <p className="text-xs font-black uppercase tracking-wide text-ink">
                                      {buyer.fullName || buyer.displayName || 'Bidder'}
                                    </p>
                                    {buyer.businessName ? <p>{buyer.businessName}</p> : null}
                                    {buyer.email ? <p className="break-all">{buyer.email}</p> : null}
                                    {buyer.uid ? <p className="break-all">UID {buyer.uid}</p> : null}
                                    {(buyer.firstName || buyer.lastName) ? (
                                      <p>First: {buyer.firstName || 'N/A'} · Last: {buyer.lastName || 'N/A'}</p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-[11px] font-bold text-muted">
                                    {lot.status === 'sold' ? 'Loading winner details…' : 'No winning bidder'}
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Settlement</p>
                                {invoice ? (
                                  <div className="mt-2 space-y-1.5 text-[11px] font-bold text-muted">
                                    <p className="text-xs font-black uppercase tracking-wide text-ink">
                                      {invoice.status === 'paid' ? 'Released / Paid' : 'Awaiting Treasury'}
                                    </p>
                                    <p>Buyer premium {formatCurrency(invoice.buyerPremium)}</p>
                                    {invoice.documentationFee > 0 ? <p>Document fee {formatCurrency(invoice.documentationFee)}</p> : null}
                                    <p>Due {formatDateTime(invoice.dueDate) || 'Pending'}</p>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-[11px] font-bold text-muted">
                                    {lot.status === 'sold' ? 'Preparing settlement…' : 'No settlement needed'}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-sm border border-line bg-surface px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent">Auction Connectivity</p>
              <ul className="mt-3 space-y-2 text-[11px] font-bold text-muted">
                <li>Starts, ends, and GMV are shown on the auction card above.</li>
                <li>Every sold lot surfaces bidder identity, invoice, and settlement status here.</li>
                <li>Winner details sync from the bidder profile, user account, and live auction invoice record.</li>
              </ul>
            </div>
          </div>
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
                  <th className="px-4 py-3 label-micro">Auction Window</th>
                  <th className="px-4 py-3 label-micro">Starting Bid</th>
                  <th className="px-4 py-3 label-micro">Reserve</th>
                  <th className="px-4 py-3 label-micro">Status</th>
                  <th className="px-4 py-3 label-micro">Winning Bidder</th>
                  <th className="px-4 py-3 label-micro">Flags</th>
                  <th className="px-4 py-3 label-micro">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLots.map((lot) => {
                  const draft = lotDrafts[lot.id] || toLotDraft(lot);
                  const settlement = lotSettlements[lot.id];
                  const settlementInvoice = settlement?.invoice;
                  const winningBuyer = settlement?.buyer || null;
                  const settlementTimestamp = formatDateTime(
                    lot.releasedAt
                    || lot.releaseAuthorizedAt
                    || settlementInvoice?.releaseAuthorizedAt
                    || settlementInvoice?.paidAt
                    || settlementInvoice?.wireReceivedAt,
                  );
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
                        <div className="min-w-[190px] space-y-1.5 text-[11px] text-muted">
                          <div className="flex items-center gap-2 font-bold text-ink">
                            <CalendarDays size={12} className="text-accent shrink-0" />
                            <span>{formatDateTime(lot.endTime) || 'End time pending'}</span>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            {lot.status === 'sold'
                              ? 'Auction ended with winner'
                              : lot.status === 'unsold'
                                ? 'Auction ended without reserve'
                                : lot.status === 'closed'
                                  ? 'Awaiting final settlement'
                                  : `Auction ${lot.status}`}
                          </p>
                        </div>
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
                        <div className="space-y-2 min-w-[130px]">
                          <span className="inline-flex rounded-sm border border-line px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted">
                            {lot.status}
                          </span>
                          <div className="text-[10px] font-bold text-muted">
                            {lot.bidCount} bid{lot.bidCount === 1 ? '' : 's'}
                            {Number.isFinite(Number(lot.winningBid || lot.currentBid))
                              ? ` · Hammer ${formatCurrency(lot.winningBid || lot.currentBid)}`
                              : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {lot.status === 'sold' && winningBuyer ? (
                          <div className="min-w-[280px] rounded-sm border border-line bg-bg/70 px-3 py-3 text-left">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Winning Bidder</p>
                                <h5 className="mt-1 text-xs font-black uppercase tracking-wide text-ink">
                                  {winningBuyer.fullName || winningBuyer.displayName || 'Bidder'}
                                </h5>
                              </div>
                              {(winningBuyer.idVerificationStatus === 'verified' || winningBuyer.verificationTier === 'approved') ? (
                                <span className="inline-flex items-center gap-1 rounded-sm bg-accent/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-accent">
                                  <ShieldCheck size={11} />
                                  Verified
                                </span>
                              ) : null}
                            </div>
                            {winningBuyer.businessName ? (
                              <p className="mt-1 text-[11px] font-bold text-muted">{winningBuyer.businessName}</p>
                            ) : null}
                            <div className="mt-3 space-y-1.5 text-[10px] font-bold text-muted">
                              {winningBuyer.email ? (
                                <div className="flex items-center gap-2 break-all">
                                  <Mail size={11} className="text-accent shrink-0" />
                                  <span>{winningBuyer.email}</span>
                                </div>
                              ) : null}
                              {winningBuyer.uid ? (
                                <div className="flex items-center gap-2 break-all">
                                  <UserRound size={11} className="text-accent shrink-0" />
                                  <span>UID {winningBuyer.uid}</span>
                                </div>
                              ) : null}
                              {(winningBuyer.firstName || winningBuyer.lastName) ? (
                                <p>
                                  First: {winningBuyer.firstName || 'N/A'} · Last: {winningBuyer.lastName || 'N/A'}
                                </p>
                              ) : null}
                              {settlementInvoice ? (
                                <p>
                                  Invoice {settlementInvoice.id} · Due {formatCurrency(settlementInvoice.totalDue)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : lot.status === 'sold' ? (
                          <div className="min-w-[220px] rounded-sm border border-line bg-bg/70 px-3 py-3 text-[10px] font-bold text-muted">
                            Loading winner details...
                          </div>
                        ) : (
                          <div className="min-w-[180px] text-[10px] font-bold uppercase tracking-widest text-muted">
                            No winning bidder yet
                          </div>
                        )}
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
                        <div className="flex min-w-[180px] flex-col gap-2">
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
                          {lot.status === 'sold' ? (
                            settlementInvoice ? (
                              settlementInvoice.status === 'paid' ? (
                                <div className="rounded-sm border border-accent/20 bg-accent/5 px-3 py-2 text-left">
                                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                                    <CheckCircle2 size={12} />
                                    Released
                                  </div>
                                  <p className="mt-1 text-[10px] font-bold text-muted">
                                    {settlementTimestamp ? `Released ${settlementTimestamp}` : 'Wire received and release approved.'}
                                  </p>
                                </div>
                              ) : (
                                <div className="rounded-sm border border-line bg-bg/70 px-3 py-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-ink">
                                    Invoice Pending
                                  </p>
                                  <p className="mt-1 text-[10px] font-bold text-muted">
                                    Total due {formatCurrency(settlementInvoice.totalDue)}
                                  </p>
                                  <button
                                    type="button"
                                    className="btn-industrial btn-accent mt-2 w-full text-[9px]"
                                    disabled={settlingInvoiceId === settlementInvoice.id}
                                    onClick={() => handleSettleWireInvoice(lot, settlementInvoice)}
                                  >
                                    {settlingInvoiceId === settlementInvoice.id
                                      ? 'Settling...'
                                      : 'Mark Wire Received / Release Lot'}
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="rounded-sm border border-line bg-bg/70 px-3 py-2 text-[10px] font-bold text-muted">
                                Loading settlement...
                              </div>
                            )
                          ) : null}
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
