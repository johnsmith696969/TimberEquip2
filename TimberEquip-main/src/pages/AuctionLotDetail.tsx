import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, ExternalLink, FileText, Gavel, Landmark, Loader2, ShieldCheck } from 'lucide-react';
import { Breadcrumbs, type BreadcrumbItem } from '../components/Breadcrumbs';
import { Seo } from '../components/Seo';
import { useAuth } from '../components/AuthContext';
import { auctionService, type AuctionBidderStatusResponse } from '../services/auctionService';
import { buildAuctionInvoiceTotals, buildAuctionLegalSummaryLines } from '../utils/auctionFees';
import {
  buildAuctionRegistrationLoginPath,
  buildAuctionRegistrationPath,
  isExternalAuctionHref,
  resolveAuctionTermsHref,
} from '../utils/auctionLinks';
import { isOperatorOnlyRole } from '../utils/roleScopes';
import type { Auction, AuctionBid, AuctionInvoice, AuctionLot } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AuctionLotDetail() {
  const { auctionSlug, lotNumber } = useParams<{ auctionSlug: string; lotNumber: string }>();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [lot, setLot] = useState<AuctionLot | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [bidderStatus, setBidderStatus] = useState<AuctionBidderStatusResponse | null>(null);
  const [invoice, setInvoice] = useState<AuctionInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<'wire' | 'card' | ''>('');
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isOperator = isOperatorOnlyRole(user?.role);
  const legalLines = useMemo(() => buildAuctionLegalSummaryLines(), []);

  useEffect(() => {
    let active = true;
    let unsubscribeAuction = () => {};
    let unsubscribeLot = () => {};
    let unsubscribeBids = () => {};

    async function loadLotRoute() {
      if (!auctionSlug || !lotNumber) return;
      setLoading(true);
      setError('');
      try {
        const response = await auctionService.getAuctionWithLot(auctionSlug, lotNumber);
        if (!active) return;
        setAuction(response.auction);
        setLot(response.lot);

        if (response.auction?.id) {
          unsubscribeAuction = auctionService.onAuctionChange(response.auction.id, setAuction);
        }

        if (response.auction?.id && response.lot?.id) {
          unsubscribeLot = auctionService.onLotChange(response.auction.id, response.lot.id, setLot);
          unsubscribeBids = auctionService.onBidsChange(response.auction.id, response.lot.id, setBids);
        }
      } catch (loadError) {
        if (!active) return;
        console.error('Failed to load auction lot route:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load auction lot.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLotRoute();

    return () => {
      active = false;
      unsubscribeAuction();
      unsubscribeLot();
      unsubscribeBids();
    };
  }, [auctionSlug, lotNumber]);

  useEffect(() => {
    if (!auctionSlug || !isAuthenticated) {
      setBidderStatus(null);
      return;
    }

    let cancelled = false;
    async function loadBidderStatus() {
      setStatusLoading(true);
      try {
        const status = await auctionService.getBidderStatus(auctionSlug);
        if (!cancelled) {
          setBidderStatus(status);
        }
      } catch (statusError) {
        if (!cancelled) {
          console.error('Failed to load auction bidder status:', statusError);
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    }

    void loadBidderStatus();
    return () => {
      cancelled = true;
    };
  }, [auctionSlug, isAuthenticated]);

  useEffect(() => {
    const paymentState = searchParams.get('payment');
    if (paymentState === 'success') {
      setNotice('Payment received. Your invoice is being marked paid now.');
    } else if (paymentState === 'cancelled') {
      setNotice('Card checkout was cancelled. You can still complete payment by wire or try card again.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!auctionSlug || !lotNumber || !isAuthenticated || !lot) {
      setInvoice(null);
      return;
    }

    const winningBuyer = lot.winningBidderId === user?.uid;
    if (!winningBuyer && !isOperator) {
      setInvoice(null);
      return;
    }

    let cancelled = false;
    async function loadInvoice() {
      setInvoiceLoading(true);
      try {
        const response = await auctionService.getLotInvoice(auctionSlug, lotNumber);
        if (!cancelled) {
          setInvoice(response.invoice);
        }
      } catch (invoiceError) {
        if (!cancelled) {
          setInvoice(null);
          console.debug('Auction invoice not ready yet:', invoiceError);
        }
      } finally {
        if (!cancelled) {
          setInvoiceLoading(false);
        }
      }
    }

    void loadInvoice();
    return () => {
      cancelled = true;
    };
  }, [auctionSlug, lotNumber, isAuthenticated, isOperator, lot, user?.uid]);

  const currentBid = lot ? Number(lot.currentBid || 0) : 0;
  const openingBid = lot ? Number(lot.startingBid || 0) : 0;
  const displayedBid = currentBid > 0 ? currentBid : openingBid;
  const minimumNextBid = lot
    ? currentBid > 0
      ? currentBid + auctionService.getBidIncrement(currentBid)
      : openingBid
    : 0;
  const previewBid = Math.max(Number(bidAmount || 0) || minimumNextBid, minimumNextBid || 0);
  const feePreview = buildAuctionInvoiceTotals({
    winningBid: previewBid,
    isTitledItem: Boolean(lot?.isTitledItem),
    paymentMethod: 'card',
  });
  const returnTo = auctionSlug && lotNumber ? `/auctions/${auctionSlug}/lots/${lotNumber}` : '/auctions';
  const registrationPath = buildAuctionRegistrationPath(auctionSlug, returnTo);
  const loginPath = buildAuctionRegistrationLoginPath(auctionSlug, returnTo);
  const auctionTermsHref = resolveAuctionTermsHref(auction?.termsAndConditionsUrl);
  const auctionTermsIsExternal = isExternalAuctionHref(auctionTermsHref);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Auctions', path: '/auctions' },
    ...(auction ? [{ label: auction.title, path: `/auctions/${auction.slug}` }] : []),
    ...(lot ? [{ label: `Lot ${lot.lotNumber}`, path: '' }] : []),
  ];

  async function handleRefreshBidderStatus() {
    if (!auctionSlug || !isAuthenticated) return;
    setStatusLoading(true);
    setError('');
    try {
      const status = await auctionService.getBidderStatus(auctionSlug);
      setBidderStatus(status);
    } catch (refreshError) {
      console.error('Failed to refresh bidder status:', refreshError);
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh bidder verification.');
    } finally {
      setStatusLoading(false);
    }
  }

  async function handlePlaceBid() {
    if (!auctionSlug || !lotNumber || !lot) return;
    setPlacingBid(true);
    setError('');
    setNotice('');
    try {
      const response = await auctionService.placeBid(auctionSlug, lotNumber, {
        amount: Number(bidAmount || minimumNextBid),
      });
      setLot(response.lot);
      setBidAmount('');
      setNotice(`Bid placed successfully at ${formatCurrency(response.bid.amount)}.`);
    } catch (bidError) {
      console.error('Failed to place auction bid:', bidError);
      setError(bidError instanceof Error ? bidError.message : 'Unable to place bid.');
    } finally {
      setPlacingBid(false);
    }
  }

  async function handleInvoicePayment(paymentMethod: 'wire' | 'card') {
    if (!invoice) return;
    setPaymentLoading(paymentMethod);
    setError('');
    setNotice('');
    try {
      const response = await auctionService.createAuctionInvoicePaymentSession(invoice.id, paymentMethod);
      setInvoice(response.invoice);
      if (response.url) {
        window.location.assign(response.url);
        return;
      }
      if (paymentMethod === 'wire') {
        setNotice('Wire transfer selected. Complete payment within 7 days and keep your invoice reference for treasury support.');
      }
    } catch (paymentError) {
      console.error('Failed to prepare auction payment:', paymentError);
      setError(paymentError instanceof Error ? paymentError.message : 'Unable to prepare payment.');
    } finally {
      setPaymentLoading('');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 rounded-sm bg-surface" />
          <div className="h-10 w-2/3 rounded-sm bg-surface" />
          <div className="h-[420px] rounded-sm bg-surface" />
        </div>
      </div>
    );
  }

  if (!auction || !lot) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-black uppercase tracking-tight">Auction Lot Unavailable</h1>
        <p className="mt-3 text-sm text-muted">
          This lot could not be found or it is no longer available.
        </p>
        <Link to="/auctions" className="btn-industrial btn-accent mt-6 inline-flex">
          Browse Auctions
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen">
      <Seo
        title={`Lot ${lot.lotNumber} | ${lot.year} ${lot.manufacturer} ${lot.model} | ${auction.title}`}
        description={`${lot.year} ${lot.manufacturer} ${lot.model} in ${auction.title}. Current bid ${formatCurrency(displayedBid)}.`}
        canonicalPath={`/auctions/${auction.slug}/lots/${lot.lotNumber}`}
        imagePath={lot.thumbnailUrl}
      />
      <Breadcrumbs items={breadcrumbs} />

      <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link to={`/auctions/${auction.slug}`} className="btn-industrial btn-outline text-[10px]">
            <ArrowLeft size={12} className="mr-1.5" />
            Back to Auction
          </Link>
          <span className="rounded-sm border border-line px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted">
            {auction.status}
          </span>
          <span className="rounded-sm border border-accent/20 bg-accent/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent">
            Lot {lot.lotNumber}
          </span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="space-y-8">
            <div className="overflow-hidden rounded-sm border border-line bg-surface">
              <div className="aspect-[16/9] bg-bg">
                <img
                  src={lot.thumbnailUrl || '/page-photos/john-deere-harvester.webp'}
                  alt={`${lot.year} ${lot.manufacturer} ${lot.model}`}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-center gap-3">
                  {lot.promoted && (
                    <span className="rounded-sm bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      Featured Lot
                    </span>
                  )}
                  <span className="rounded-sm border border-line px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted">
                    {lot.status}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                    {lot.year} {lot.manufacturer} {lot.model}
                  </h1>
                  <p className="mt-3 text-sm text-muted">
                    {lot.title || `${lot.year} ${lot.manufacturer} ${lot.model}`} · Pickup {lot.pickupLocation || 'location pending'}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-sm border border-line bg-bg p-4">
                    <span className="label-micro">Current Bid</span>
                    <div className="mt-2 text-3xl font-black tracking-tight">{formatCurrency(displayedBid)}</div>
                    <p className="mt-2 text-[11px] text-muted">{lot.bidCount} total bids</p>
                  </div>
                  <div className="rounded-sm border border-line bg-bg p-4">
                    <span className="label-micro">Bidding Closes</span>
                    <div className="mt-2 text-lg font-black tracking-tight">{formatDateTime(lot.endTime)}</div>
                    <p className="mt-2 text-[11px] text-muted">Soft close enabled near the end of the sale.</p>
                  </div>
                  <div className="rounded-sm border border-line bg-bg p-4">
                    <span className="label-micro">Buyer Fees</span>
                    <div className="mt-2 text-lg font-black tracking-tight">{formatCurrency(feePreview.buyerPremium)}</div>
                    <p className="mt-2 text-[11px] text-muted">Calculated from the current bid tier.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-line bg-surface p-6">
              <h2 className="text-lg font-black uppercase tracking-widest">Bid History</h2>
              <div className="mt-4 max-h-[320px] overflow-y-auto">
                {bids.length === 0 ? (
                  <p className="text-sm text-muted">No bids have been placed on this lot yet.</p>
                ) : (
                  <div className="space-y-2">
                    {bids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between rounded-sm border border-line bg-bg px-4 py-3 text-sm">
                        <span className="font-bold text-ink">{bid.bidderAnonymousId}</span>
                        <span className="font-black">{formatCurrency(bid.amount)}</span>
                        <span className="text-xs text-muted">{formatDateTime(bid.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-sm border border-line bg-surface p-6">
              <h2 className="text-lg font-black uppercase tracking-widest">Auction Terms</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {legalLines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-sm border border-line bg-surface p-6">
              <span className="label-micro">Next Bid Requirement</span>
              <div className="mt-2 text-2xl font-black tracking-tight">{formatCurrency(minimumNextBid)}</div>
              <p className="mt-2 text-xs text-muted">
                Bidding opens to approved bidders only. Buyer premiums, titled-item fees, taxes, and card fees apply on the invoice.
              </p>
            </div>

            <div className="rounded-sm border border-line bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest">Bidder Status</h2>
                {isAuthenticated && (
                  <button
                    type="button"
                    className="text-xs font-black uppercase tracking-widest text-accent hover:underline"
                    onClick={handleRefreshBidderStatus}
                    disabled={statusLoading}
                  >
                    {statusLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                )}
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Sign in and complete bidder verification to participate in this auction.</p>
                  <Link to={loginPath} className="btn-industrial btn-accent w-full justify-center">
                    Sign In to Register
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid gap-3">
                    <div className="rounded-sm border border-line bg-bg px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-widest">Registration</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${bidderStatus?.legalAccepted ? 'text-accent' : 'text-muted'}`}>
                          {bidderStatus?.legalAccepted ? 'Saved' : 'Needed'}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-sm border border-line bg-bg px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-widest">Identity Verification</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${bidderStatus?.identityVerified ? 'text-accent' : 'text-muted'}`}>
                          {bidderStatus?.identityVerified ? 'Verified' : bidderStatus?.profile?.idVerificationStatus || 'Not Started'}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-sm border border-line bg-bg px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-widest">Payment Method</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${bidderStatus?.paymentMethodReady ? 'text-accent' : 'text-muted'}`}>
                          {bidderStatus?.paymentMethodReady ? 'Ready' : 'Needed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!bidderStatus?.bidderApproved && (
                    <Link to={registrationPath} className="btn-industrial btn-accent w-full justify-center">
                      Complete Bidder Registration
                      <ArrowRight size={14} className="ml-2" />
                    </Link>
                  )}
                </>
              )}
            </div>

            {(lot.status === 'active' || lot.status === 'extended') && (
              <div className="rounded-sm border border-line bg-surface p-6 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest">Place Bid</h2>
                {bidderStatus?.bidderApproved ? (
                  <>
                    <div>
                      <label className="label-micro mb-1 block">Your Maximum Bid</label>
                      <input
                        type="number"
                        min={minimumNextBid}
                        className="input-industrial w-full"
                        value={bidAmount}
                        onChange={(event) => setBidAmount(event.target.value)}
                        placeholder={`Minimum ${formatCurrency(minimumNextBid)}`}
                      />
                    </div>
                    <div className="rounded-sm border border-line bg-bg p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Hammer Price</span>
                        <span className="font-black">{formatCurrency(previewBid)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Buyer Premium</span>
                        <span className="font-black">{formatCurrency(feePreview.buyerPremium)}</span>
                      </div>
                      {lot.isTitledItem && (
                        <div className="mt-2 flex items-center justify-between">
                          <span>Document Fee</span>
                          <span className="font-black">{formatCurrency(feePreview.documentationFee)}</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span>Card Total if Paid Online</span>
                        <span className="font-black">{formatCurrency(feePreview.totalDue)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-industrial btn-accent w-full justify-center"
                      disabled={placingBid}
                      onClick={handlePlaceBid}
                    >
                      {placingBid ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Placing Bid...
                        </>
                      ) : (
                        <>
                          <Gavel size={14} className="mr-2" />
                          Place Bid
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      Complete identity verification and payment setup before bidding on this lot.
                    </p>
                    <Link to={registrationPath} className="btn-industrial btn-accent w-full justify-center">
                      Register to Bid
                    </Link>
                  </div>
                )}
              </div>
            )}

            {invoice && (
              <div className="rounded-sm border border-line bg-surface p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest">Winning Invoice</h2>
                    <p className="mt-1 text-xs text-muted">Payment is due within 7 days of auction close.</p>
                  </div>
                  <span className={`rounded-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    invoice.status === 'paid' ? 'bg-accent/10 text-accent' : 'bg-amber-500/10 text-amber-700'
                  }`}>
                    {invoice.status}
                  </span>
                </div>

                <div className="rounded-sm border border-line bg-bg p-4 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Hammer Price</span>
                    <span className="font-black">{formatCurrency(invoice.winningBid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Buyer Premium</span>
                    <span className="font-black">{formatCurrency(invoice.buyerPremium)}</span>
                  </div>
                  {invoice.documentationFee > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Document Fee</span>
                      <span className="font-black">{formatCurrency(invoice.documentationFee)}</span>
                    </div>
                  )}
                  {(invoice.cardProcessingFee || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Card Processing Fee</span>
                      <span className="font-black">{formatCurrency(invoice.cardProcessingFee || 0)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-line pt-2 text-base">
                    <span className="font-black">Total Due</span>
                    <span className="font-black">{formatCurrency(invoice.totalDue)}</span>
                  </div>
                </div>

                <div className="rounded-sm border border-line bg-bg p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-ink">
                    <FileText size={14} />
                    <span className="font-black">Invoice Terms</span>
                  </div>
                  <p className="text-muted">Due by {formatDateTime(invoice.dueDate)}</p>
                  <p className="text-muted">Card and debit payments are capped at $50,000 total due and include a 3% processing fee.</p>
                  <p className="text-muted">Wire transfer remains available for every winning invoice.</p>
                </div>

                {invoice.status !== 'paid' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      className="btn-industrial btn-outline justify-center"
                      disabled={paymentLoading === 'wire'}
                      onClick={() => handleInvoicePayment('wire')}
                    >
                      {paymentLoading === 'wire' ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Preparing Wire...
                        </>
                      ) : (
                        <>
                          <Landmark size={14} className="mr-2" />
                          Pay by Wire
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-industrial btn-accent justify-center"
                      disabled={paymentLoading === 'card' || invoice.totalDue > 50000}
                      onClick={() => handleInvoicePayment('card')}
                    >
                      {paymentLoading === 'card' ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Preparing Card...
                        </>
                      ) : (
                        <>
                          <CreditCard size={14} className="mr-2" />
                          Pay by Card
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {(error || notice) && (
              <div className={`rounded-sm border p-4 text-sm ${error ? 'border-red-500/30 bg-red-500/5 text-red-700' : 'border-accent/20 bg-accent/5 text-ink'}`}>
                {error || notice}
              </div>
            )}

            {(statusLoading || invoiceLoading) && (
              <div className="rounded-sm border border-line bg-surface p-4 text-sm text-muted">
                <Loader2 size={14} className="mr-2 inline animate-spin" />
                Syncing bidder and invoice status...
              </div>
            )}

            <div className="rounded-sm border border-line bg-surface p-6">
              <h2 className="text-sm font-black uppercase tracking-widest">Helpful Links</h2>
              <div className="mt-4 space-y-3">
                <Link to={`/auctions/${auction.slug}`} className="flex items-center justify-between text-sm font-bold text-ink hover:text-accent">
                  Back to auction catalog
                  <ArrowRight size={13} />
                </Link>
                <Link to={registrationPath} className="flex items-center justify-between text-sm font-bold text-ink hover:text-accent">
                  Bidder verification and payment setup
                  <ShieldCheck size={13} />
                </Link>
                {auctionTermsIsExternal ? (
                  <a href={auctionTermsHref} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm font-bold text-ink hover:text-accent">
                    Full auction terms
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <Link to={auctionTermsHref} className="flex items-center justify-between text-sm font-bold text-ink hover:text-accent">
                    Full auction terms
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
