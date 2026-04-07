import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  Gavel,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Minus,
  Plus,
  Loader2,
  ShieldCheck,
  MapPin,
  Hash,
  Calendar,
  Users,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { auctionService } from '../services/auctionService';
import { Auction, AuctionLot, AuctionBid, AuctionLotStatus } from '../types';
import { Seo } from '../components/Seo';
import { Breadcrumbs, BreadcrumbItem } from '../components/Breadcrumbs';
import { useAuth } from '../components/AuthContext';
import { useLocale } from '../components/LocaleContext';
import { buildSiteUrl } from '../utils/siteUrl';
import { useAuctionSocket } from '../hooks/useAuctionSocket';

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Server-corrected time remaining (accounts for clock drift via serverTimeOffset). */
function formatTimeRemainingWithOffset(endTime: string, offset: number): string {
  const remaining = new Date(endTime).getTime() - (Date.now() + offset);
  if (remaining <= 0) return 'Ended';
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ── Status helpers (matching AuctionDetail) ──────────────────────────────────

function getLotStatusLabel(status: AuctionLotStatus): string {
  switch (status) {
    case 'active': return 'Bidding Open';
    case 'extended': return 'Extended';
    case 'preview': return 'Preview';
    case 'upcoming': return 'Upcoming';
    case 'closed': return 'Closed';
    case 'sold': return 'Sold';
    case 'unsold': return 'Unsold';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function getLotStatusBadge(status: AuctionLotStatus): string {
  switch (status) {
    case 'active': return 'bg-green-600 text-white';
    case 'extended': return 'bg-yellow-600 text-white';
    case 'preview':
    case 'upcoming': return 'bg-accent text-white';
    case 'sold': return 'bg-surface border border-line text-muted';
    case 'unsold': return 'bg-surface border border-line text-muted';
    case 'cancelled': return 'bg-red-600/10 text-red-600 border border-red-600/20';
    default: return 'bg-surface border border-line text-muted';
  }
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function LotDetailSkeleton() {
  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <div className="animate-pulse bg-bg h-4 w-64 rounded-sm mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-6">
            <div className="animate-pulse bg-surface border border-line h-[400px] rounded-sm" />
            <div className="animate-pulse bg-bg h-8 w-3/4 rounded-sm" />
            <div className="animate-pulse bg-bg h-4 w-1/2 rounded-sm" />
            <div className="animate-pulse bg-bg h-24 w-full rounded-sm" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-pulse bg-surface border border-line h-[500px] rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function LotDetail() {
  const { auctionSlug, lotNumber } = useParams<{
    auctionSlug: string;
    lotNumber: string;
  }>();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { formatCurrency: localeCurrency } = useLocale();

  // ── State ──────────────────────────────────────────────────────────────────
  const [auction, setAuction] = useState<Auction | null>(null);
  const [lot, setLot] = useState<AuctionLot | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [bidderProfile, setBidderProfile] = useState<{ verified: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Bid input
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isProxy, setIsProxy] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);

  // Bid history toggle
  const [showBidHistory, setShowBidHistory] = useState(false);

  // Track if we initialized the bid amount from lot data
  const bidInitRef = useRef(false);

  // ── WebSocket real-time updates ──────────────────────────────────────────
  const { isConnected, watcherCount, serverTimeOffset } = useAuctionSocket({
    auctionId: auction?.id || '',
    lotId: lot?.id,
    onBidPlaced: (payload) => {
      setLot((prev) => {
        if (!prev || prev.bidCount >= payload.bidCount) return prev;
        return {
          ...prev,
          currentBid: payload.currentBid,
          bidCount: payload.bidCount,
          currentBidderAnonymousId: payload.bidderAnonymousId,
          lastBidTime: payload.timestamp,
        };
      });
    },
    onLotExtended: (payload) => {
      setLot((prev) =>
        prev
          ? {
              ...prev,
              endTime: payload.newEndTime,
              extensionCount: payload.extensionCount,
              status: 'extended' as AuctionLotStatus,
            }
          : prev,
      );
    },
    onLotClosed: (payload) => {
      setLot((prev) =>
        prev
          ? {
              ...prev,
              status: payload.finalStatus as AuctionLotStatus,
              winningBid: payload.winningBid,
              currentBidderAnonymousId: payload.winningBidderAnonymousId,
            }
          : prev,
      );
    },
  });

  // ── Derived values ─────────────────────────────────────────────────────────
  const currentBidAmount = lot
    ? lot.currentBid > 0
      ? lot.currentBid
      : lot.startingBid
    : 0;
  const bidIncrement = auctionService.getBidIncrement(currentBidAmount);
  const minimumBid = currentBidAmount + bidIncrement;

  const isActive = lot?.status === 'active' || lot?.status === 'extended';
  const isPreview = lot?.status === 'preview' || lot?.status === 'upcoming';
  const isClosed =
    lot?.status === 'closed' ||
    lot?.status === 'sold' ||
    lot?.status === 'unsold' ||
    lot?.status === 'cancelled';

  const currentUserId = user?.uid || null;
  const isHighBidder = currentUserId != null && lot?.currentBidderId === currentUserId;

  // ── Load auction by slug ───────────────────────────────────────────────────
  useEffect(() => {
    if (!auctionSlug) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await auctionService.getAuctionBySlug(auctionSlug);
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setAuction(data);
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [auctionSlug]);

  // ── Load lot by number once auction is available ───────────────────────────
  useEffect(() => {
    if (!auction?.id || !lotNumber) return;
    let cancelled = false;
    const load = async () => {
      try {
        const lotData = await auctionService.getLotByNumber(auction.id, lotNumber);
        if (cancelled) return;
        if (!lotData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setLot(lotData);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [auction?.id, lotNumber]);

  // ── Real-time lot subscription ─────────────────────────────────────────────
  useEffect(() => {
    if (!auction?.id || !lot?.id) return;
    const unsubscribe = auctionService.onLotChange(auction.id, lot.id, (updated) => {
      if (updated) setLot(updated);
    });
    return () => unsubscribe();
  }, [auction?.id, lot?.id]);

  // ── Real-time bids subscription ────────────────────────────────────────────
  useEffect(() => {
    if (!auction?.id || !lot?.id) return;
    const unsubscribe = auctionService.onBidsChange(auction.id, lot.id, (updatedBids) => {
      setBids(updatedBids);
    });
    return () => unsubscribe();
  }, [auction?.id, lot?.id]);

  // ── Time remaining countdown (server-corrected) ────────────────────────────
  useEffect(() => {
    if (!lot?.endTime || !isActive) {
      setTimeRemaining('');
      return;
    }
    const tick = () => setTimeRemaining(formatTimeRemainingWithOffset(lot.endTime, serverTimeOffset));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lot?.endTime, isActive, lot?.status, serverTimeOffset]);

  // ── Initialize bid amount when lot data arrives ────────────────────────────
  useEffect(() => {
    if (!lot || bidInitRef.current) return;
    const min = (lot.currentBid > 0 ? lot.currentBid : lot.startingBid) +
      auctionService.getBidIncrement(lot.currentBid > 0 ? lot.currentBid : lot.startingBid);
    setBidAmount(min);
    bidInitRef.current = true;
  }, [lot]);

  // ── Update bid amount when lot.currentBid changes ──────────────────────────
  useEffect(() => {
    if (!lot) return;
    const min = (lot.currentBid > 0 ? lot.currentBid : lot.startingBid) +
      auctionService.getBidIncrement(lot.currentBid > 0 ? lot.currentBid : lot.startingBid);
    setBidAmount((prev) => (prev < min ? min : prev));
  }, [lot?.currentBid]);

  // ── Check bidder profile ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) {
      setBidderProfile(null);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const profile = await auctionService.getBidderProfile(currentUserId);
        if (cancelled) return;
        if (profile && profile.verificationTier !== 'basic') {
          setBidderProfile({ verified: true });
        } else if (profile) {
          setBidderProfile({ verified: false });
        } else {
          setBidderProfile(null);
        }
      } catch {
        if (!cancelled) setBidderProfile(null);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // ── Place bid ──────────────────────────────────────────────────────────────
  const handlePlaceBid = useCallback(async () => {
    if (!auction || !lot || bidding) return;
    if (bidAmount < minimumBid) {
      setBidError(`Minimum bid is ${formatCurrency(minimumBid)}`);
      return;
    }

    setBidding(true);
    setBidError('');
    setBidSuccess(false);

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setBidError('Authentication required. Please sign in again.');
        setBidding(false);
        return;
      }

      const res = await fetch('/api/auctions/place-bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auctionId: auction.id,
          lotId: lot.id,
          amount: bidAmount,
          maxBid: isProxy ? bidAmount : null,
          type: isProxy ? 'proxy' : 'manual',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Bid failed' }));
        setBidError(data.error || data.message || 'Failed to place bid');
        setBidding(false);
        return;
      }

      setBidSuccess(true);
      setTimeout(() => setBidSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setBidError(message);
    } finally {
      setBidding(false);
    }
  }, [auction, lot, bidAmount, minimumBid, isProxy, bidding]);

  // ── Increment / decrement bid amount ───────────────────────────────────────
  const incrementBid = useCallback(() => {
    setBidAmount((prev) => prev + bidIncrement);
  }, [bidIncrement]);

  const decrementBid = useCallback(() => {
    setBidAmount((prev) => Math.max(minimumBid, prev - bidIncrement));
  }, [bidIncrement, minimumBid]);

  // ── Breadcrumbs ────────────────────────────────────────────────────────────
  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { label: 'Auctions', path: '/auctions' },
      {
        label: auction?.title || 'Auction',
        path: `/auctions/${auctionSlug}`,
      },
      {
        label: `Lot #${lotNumber}`,
        path: `/auctions/${auctionSlug}/lots/${lotNumber}`,
      },
    ],
    [auction?.title, auctionSlug, lotNumber],
  );

  // ── SEO JSON-LD ────────────────────────────────────────────────────────────
  const jsonLd = useMemo(() => {
    if (!auction || !lot) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `Lot #${lot.lotNumber} – ${lot.title}`,
      description: `${lot.year} ${lot.manufacturer} ${lot.model}. Auction lot in ${auction.title}.`,
      url: buildSiteUrl(`/auctions/${auction.slug}/lots/${lot.lotNumber}`),
      image: lot.thumbnailUrl || undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: lot.currentBid > 0 ? lot.currentBid : lot.startingBid,
        availability:
          lot.status === 'active' || lot.status === 'extended'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
      },
    };
  }, [auction, lot]);

  const thumbnailSrc = lot?.thumbnailUrl || '/page-photos/john-deere-harvester.webp';

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return <LotDetailSkeleton />;

  // ── Not found state ────────────────────────────────────────────────────────
  if (notFound || !auction || !lot) {
    return (
      <div className="bg-bg min-h-screen flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="p-4 bg-surface border border-line rounded-sm mb-6">
          <AlertCircle size={28} className="text-muted" />
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase mb-3">
          Lot Not Found
        </h1>
        <p className="text-sm font-medium text-muted max-w-md mb-8">
          This auction lot could not be found. It may have been removed or the link is incorrect.
        </p>
        <Link
          to={`/auctions/${auctionSlug}`}
          className="btn-industrial btn-accent py-4 px-10"
        >
          Back to Auction
        </Link>
      </div>
    );
  }

  // ── Render bid input section ───────────────────────────────────────────────
  function renderBidInput() {
    if (!isActive) return null;

    // Not authenticated
    if (!isAuthenticated) {
      return (
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
          className="btn-industrial btn-accent w-full py-4 text-center"
        >
          Sign In to Bid
        </Link>
      );
    }

    // Authenticated but no bidder profile
    if (bidderProfile === null) {
      return (
        <Link
          to={`/auctions/${auctionSlug}/register`}
          className="btn-industrial btn-accent w-full py-4 text-center"
        >
          Register to Bid
        </Link>
      );
    }

    // Not yet verified
    if (!bidderProfile.verified) {
      return (
        <div className="text-center space-y-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Bidder verification pending
          </p>
          <Link
            to={`/auctions/${auctionSlug}/register`}
            className="btn-industrial btn-accent w-full py-4 text-center"
          >
            Complete Verification
          </Link>
        </div>
      );
    }

    // Verified bidder - show bid form
    return (
      <div className="space-y-4">
        {/* Bid amount input with increment buttons */}
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
            Your Bid
          </span>
          <div className="flex items-stretch gap-0">
            <button
              type="button"
              onClick={decrementBid}
              disabled={bidding || bidAmount <= minimumBid}
              className="px-3 bg-surface border border-line border-r-0 text-muted hover:text-ink hover:bg-bg transition-colors disabled:opacity-40"
              aria-label="Decrease bid"
            >
              <Minus size={14} />
            </button>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                $
              </span>
              <input
                type="number"
                min={minimumBid}
                step={bidIncrement}
                value={bidAmount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) setBidAmount(val);
                }}
                disabled={bidding}
                className="w-full pl-7 pr-4 py-3 bg-surface border border-line text-lg font-black tracking-tight text-center focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              onClick={incrementBid}
              disabled={bidding}
              className="px-3 bg-surface border border-line border-l-0 text-muted hover:text-ink hover:bg-bg transition-colors disabled:opacity-40"
              aria-label="Increase bid"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Proxy bid toggle */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isProxy}
            onChange={(e) => setIsProxy(e.target.checked)}
            disabled={bidding}
            className="mt-0.5 accent-accent"
          />
          <div>
            <span className="text-[11px] font-bold text-ink">
              Set as max bid (proxy)
            </span>
            {isProxy && (
              <p className="text-[10px] text-muted mt-1 leading-relaxed">
                The system will bid on your behalf up to this amount,
                using the minimum increment necessary to stay ahead.
              </p>
            )}
          </div>
        </label>

        {/* Place bid button */}
        <button
          type="button"
          onClick={handlePlaceBid}
          disabled={bidding || bidAmount < minimumBid}
          className={`btn-industrial btn-accent w-full py-4 text-center relative transition-all ${
            bidSuccess ? 'bg-green-600 border-green-600' : ''
          }`}
        >
          {bidding ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Placing Bid...
            </span>
          ) : bidSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle size={14} />
              Bid Placed
            </span>
          ) : (
            <>Place Bid &mdash; {formatCurrency(bidAmount)}</>
          )}
        </button>

        {/* Error message */}
        {bidError && (
          <div className="flex items-start gap-2 text-red-600 text-[11px] font-bold">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{bidError}</span>
          </div>
        )}

        {/* Buyer premium note */}
        <p className="text-[9px] font-bold text-muted uppercase tracking-widest text-center">
          {lot.buyerPremiumPercent}% buyer's premium applies
        </p>
      </div>
    );
  }

  // ── Render bid history ─────────────────────────────────────────────────────
  function renderBidHistory() {
    return (
      <div className="border-t border-line pt-4">
        <button
          type="button"
          className="w-full flex items-center justify-between text-left"
          onClick={() => setShowBidHistory((prev) => !prev)}
        >
          <span className="text-[11px] font-black uppercase tracking-widest">
            Bid History ({bids.length})
          </span>
          {showBidHistory ? (
            <ChevronUp size={14} className="text-muted" />
          ) : (
            <ChevronDown size={14} className="text-muted" />
          )}
        </button>
        {showBidHistory && (
          <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
            {bids.length === 0 ? (
              <p className="text-[10px] text-muted py-2">No bids yet</p>
            ) : (
              bids.map((bid) => {
                const isMine = currentUserId && bid.bidderId === currentUserId;
                return (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between py-1.5 px-2 text-[10px] rounded-sm ${
                      isMine ? 'bg-accent/5 border border-accent/20' : ''
                    }`}
                  >
                    <span className={`font-bold ${isMine ? 'text-accent' : 'text-muted'}`}>
                      {bid.bidderAnonymousId}
                      {isMine && ' (You)'}
                    </span>
                    <span className="font-black text-ink">
                      {formatCurrency(bid.amount)}
                    </span>
                    <span className="text-muted">{relativeTime(bid.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Render closed state ────────────────────────────────────────────────────
  function renderClosedState() {
    if (!isClosed) return null;

    if (lot.status === 'sold' && lot.winningBid != null) {
      return (
        <div className="bg-surface border border-line p-6 text-center space-y-3">
          <Gavel size={24} className="mx-auto text-muted" />
          <p className="text-[11px] font-black uppercase tracking-widest text-muted">
            Sold
          </p>
          <p className="text-3xl font-black tracking-tight">
            {formatCurrency(lot.winningBid)}
          </p>
          {lot.currentBidderAnonymousId && (
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
              Won by {lot.currentBidderAnonymousId}
            </p>
          )}
        </div>
      );
    }

    if (lot.status === 'unsold') {
      return (
        <div className="bg-surface border border-line p-6 text-center space-y-3">
          <AlertCircle size={24} className="mx-auto text-muted" />
          <p className="text-[11px] font-black uppercase tracking-widest text-muted">
            {lot.reservePrice != null && !lot.reserveMet
              ? 'Reserve Not Met'
              : 'No Bids Received'}
          </p>
          {lot.currentBid > 0 && (
            <p className="text-xl font-black tracking-tight text-muted">
              High bid: {formatCurrency(lot.currentBid)}
            </p>
          )}
        </div>
      );
    }

    // Generic closed / cancelled
    return (
      <div className="bg-surface border border-line p-6 text-center space-y-3">
        <AlertCircle size={24} className="mx-auto text-muted" />
        <p className="text-[11px] font-black uppercase tracking-widest text-muted">
          {getLotStatusLabel(lot.status)}
        </p>
      </div>
    );
  }

  // ── Render preview state ───────────────────────────────────────────────────
  function renderPreviewState() {
    if (!isPreview) return null;
    return (
      <div className="text-center space-y-4">
        <div className="bg-surface border border-line p-6 space-y-3">
          <Calendar size={20} className="mx-auto text-accent" />
          <p className="text-[11px] font-black uppercase tracking-widest text-muted">
            Bidding Opens
          </p>
          <p className="text-sm font-black tracking-tight">
            {lot.startTime ? formatDate(lot.startTime) : 'Soon'}
          </p>
        </div>
        {isAuthenticated ? (
          <Link
            to={`/auctions/${auctionSlug}/register`}
            className="btn-industrial btn-accent w-full py-4 text-center"
          >
            Register to Bid
          </Link>
        ) : (
          <Link
            to={`/login?redirect=/auctions/${auctionSlug}/register`}
            className="btn-industrial btn-accent w-full py-4 text-center"
          >
            Register to Bid
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen">
      <Seo
        title={`Lot #${lot.lotNumber} – ${lot.year} ${lot.manufacturer} ${lot.model} | ${auction.title} | Forestry Equipment Sales`}
        description={`Bid on Lot #${lot.lotNumber}: ${lot.year} ${lot.manufacturer} ${lot.model}. ${lot.pickupLocation ? `Pickup: ${lot.pickupLocation}.` : ''} Auction by Forestry Equipment Sales.`}
        canonicalPath={`/auctions/${auction.slug}/lots/${lot.lotNumber}`}
        imagePath={lot.thumbnailUrl || undefined}
        jsonLd={jsonLd}
      />

      <Breadcrumbs items={breadcrumbs} />

      {/* Back link */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-2 pb-4">
        <Link
          to={`/auctions/${auctionSlug}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft size={12} />
          Back to Auction Catalog
        </Link>
      </div>

      {/* Extended banner */}
      {lot.status === 'extended' && (
        <div className="bg-yellow-600 text-white py-2 px-4 text-center">
          <span className="text-[11px] font-black uppercase tracking-widest">
            <Clock size={12} className="inline mr-1.5 -mt-0.5" />
            Time Extended &mdash; A bid was placed near closing
          </span>
        </div>
      )}

      {/* Main layout */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── Left Column: Equipment Details ────────────────────────────── */}
          <div className="lg:col-span-3 space-y-8">
            {/* Image */}
            <div className="bg-surface border border-line overflow-hidden">
              <div className="relative">
                <img
                  src={thumbnailSrc}
                  alt={`Lot ${lot.lotNumber} – ${lot.title}`}
                  className="w-full h-auto max-h-[500px] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-ink/80 text-white px-2.5 py-1 text-[9px] font-black uppercase tracking-widest">
                  Lot #{lot.lotNumber}
                </div>
                <div className={`absolute top-3 right-3 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${getLotStatusBadge(lot.status)}`}>
                  {getLotStatusLabel(lot.status)}
                </div>
              </div>
            </div>

            {/* Title & details */}
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none mb-4">
                {lot.year} {lot.manufacturer} {lot.model}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                {lot.manufacturer && (
                  <span className="flex items-center gap-1.5">
                    <Hash size={10} />
                    {lot.manufacturer}
                  </span>
                )}
                {lot.model && (
                  <span className="flex items-center gap-1.5">
                    <Gavel size={10} />
                    {lot.model}
                  </span>
                )}
                {lot.year > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={10} />
                    {lot.year}
                  </span>
                )}
                {lot.pickupLocation && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={10} />
                    {lot.pickupLocation}
                  </span>
                )}
              </div>
            </div>

            {/* Equipment description */}
            <div className="bg-surface border border-line p-6 space-y-4">
              <h2 className="text-[11px] font-black uppercase tracking-widest border-b border-line pb-3">
                Equipment Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">
                    Manufacturer
                  </span>
                  <span className="font-bold text-ink">{lot.manufacturer}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">
                    Model
                  </span>
                  <span className="font-bold text-ink">{lot.model}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">
                    Year
                  </span>
                  <span className="font-bold text-ink">{lot.year || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">
                    Condition
                  </span>
                  <span className="font-bold text-ink">As-is, Where-is</span>
                </div>
              </div>
              {lot.pickupLocation && (
                <div className="pt-4 border-t border-line">
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">
                    Pickup Location
                  </span>
                  <span className="text-sm font-bold text-ink">{lot.pickupLocation}</span>
                </div>
              )}
            </div>

            {/* Lot info footer */}
            <div className="bg-surface border border-line p-6">
              <h2 className="text-[11px] font-black uppercase tracking-widest border-b border-line pb-3 mb-4">
                Lot Terms
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest">
                    Payment Deadline
                  </span>
                  <span className="font-bold text-ink">
                    {lot.paymentDeadlineDays} business days
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest">
                    Equipment Removal
                  </span>
                  <span className="font-bold text-ink">
                    Within {lot.removalDeadlineDays} days after payment
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest">
                    Pickup Location
                  </span>
                  <span className="font-bold text-ink">
                    {lot.pickupLocation || 'Contact seller'}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest">
                    Buyer's Premium
                  </span>
                  <span className="font-bold text-ink">
                    {lot.buyerPremiumPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Bid Panel (sticky on desktop) ───────────────── */}
          <aside className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Main bid card */}
              <div className="bg-surface border border-line p-6 space-y-5">

                {/* Lot number + status badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    Lot #{lot.lotNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${getLotStatusBadge(lot.status)}`}
                  >
                    {getLotStatusLabel(lot.status)}
                    {lot.status === 'active' && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-1.5" />
                    )}
                  </span>
                </div>

                {/* Current bid display */}
                <div className="border-b border-line pb-5">
                  <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">
                    {lot.currentBid > 0 ? 'Current Bid' : 'Starting Bid'}
                  </span>
                  <span className="text-4xl font-black tracking-tight text-ink block">
                    {formatCurrency(lot.currentBid > 0 ? lot.currentBid : lot.startingBid)}
                  </span>
                  <div className="flex items-center gap-4 mt-2">
                    {lot.bidCount > 0 && (
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        {lot.bidCount} {lot.bidCount === 1 ? 'bid' : 'bids'}
                      </span>
                    )}
                    {isConnected && watcherCount > 1 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-widest">
                        <Users size={10} />
                        {watcherCount} watching
                      </span>
                    )}
                    {isHighBidder && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                        <ShieldCheck size={10} />
                        You're the high bidder
                      </span>
                    )}
                  </div>
                </div>

                {/* Time remaining */}
                {isActive && timeRemaining && (
                  <div>
                    <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">
                      Time Remaining
                    </span>
                    <span
                      className={`text-xl font-black tracking-tight ${
                        timeRemaining.includes('s') && !timeRemaining.includes('d') && !timeRemaining.includes('h')
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                      {timeRemaining}
                    </span>
                  </div>
                )}

                {/* Reserve status */}
                {lot.reservePrice != null && (
                  <div
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
                      lot.reserveMet ? 'text-green-600' : 'text-muted'
                    }`}
                  >
                    {lot.reserveMet ? (
                      <>
                        <CheckCircle size={12} />
                        Reserve Met
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} />
                        Reserve Not Yet Met
                      </>
                    )}
                  </div>
                )}

                {/* Minimum next bid */}
                {isActive && (
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    Minimum bid: {formatCurrency(minimumBid)}
                  </div>
                )}

                {/* State-dependent content */}
                {isActive && renderBidInput()}
                {isPreview && renderPreviewState()}
                {isClosed && renderClosedState()}

                {/* Bid history */}
                {renderBidHistory()}

              </div>

              {/* Lot info card (mobile also visible) */}
              <div className="bg-surface border border-line p-5 space-y-2 text-[10px] text-muted lg:block">
                <p>
                  <span className="font-bold text-ink">Payment:</span> Due within{' '}
                  {lot.paymentDeadlineDays} business days
                </p>
                <p>
                  <span className="font-bold text-ink">Removal:</span> Within{' '}
                  {lot.removalDeadlineDays} days after payment
                </p>
                <p>
                  <span className="font-bold text-ink">Pickup:</span>{' '}
                  {lot.pickupLocation || 'Contact seller'}
                </p>
                <p>
                  <span className="font-bold text-ink">Buyer's Premium:</span>{' '}
                  {lot.buyerPremiumPercent}%
                </p>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
