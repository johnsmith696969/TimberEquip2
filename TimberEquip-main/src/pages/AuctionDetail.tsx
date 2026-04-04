import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Gavel,
  Calendar,
  Clock,
  Search,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { auctionService } from '../services/auctionService';
import { Auction, AuctionLot, AuctionStatus, AuctionLotStatus } from '../types';
import { Seo } from '../components/Seo';
import { Breadcrumbs, BreadcrumbItem } from '../components/Breadcrumbs';
import { useTheme } from '../components/ThemeContext';

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function getAuctionStatusLabel(status: AuctionStatus): string {
  switch (status) {
    case 'active': return 'Live Now';
    case 'preview': return 'Preview Open';
    case 'closed': return 'Closed';
    case 'settling': return 'Settling';
    case 'settled': return 'Settled';
    case 'cancelled': return 'Cancelled';
    case 'draft': return 'Draft';
    default: return status;
  }
}

function getAuctionStatusBadge(status: AuctionStatus): string {
  switch (status) {
    case 'active': return 'bg-green-600 text-white';
    case 'preview': return 'bg-accent text-white';
    case 'closed':
    case 'settling':
    case 'settled': return 'bg-surface border border-line text-muted';
    case 'cancelled': return 'bg-red-600/10 text-red-600 border border-red-600/20';
    default: return 'bg-surface border border-line text-muted';
  }
}

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

// ── Skeleton components ───────────────────────────────────────────────────────

function LotCardSkeleton() {
  return (
    <div className="bg-surface border border-line overflow-hidden">
      <div className="h-44 animate-pulse bg-bg" />
      <div className="p-5 space-y-3">
        <div className="animate-pulse bg-bg h-3 w-16 rounded-sm" />
        <div className="animate-pulse bg-bg h-5 w-3/4 rounded-sm" />
        <div className="animate-pulse bg-bg h-3 w-1/2 rounded-sm" />
        <div className="animate-pulse bg-bg h-8 w-full rounded-sm mt-2" />
      </div>
    </div>
  );
}

function LotCard({ lot, auctionSlug }: { lot: AuctionLot; auctionSlug: string }) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    (lot.status === 'active' || lot.status === 'extended') ? auctionService.formatTimeRemaining(lot.endTime) : ''
  );

  useEffect(() => {
    if (lot.status !== 'active' && lot.status !== 'extended') return;
    const interval = setInterval(() => {
      setTimeRemaining(auctionService.formatTimeRemaining(lot.endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [lot.endTime, lot.status]);

  const thumbnailSrc = lot.thumbnailUrl || '/page-photos/john-deere-harvester.webp';

  return (
    <div className="bg-surface border border-line overflow-hidden flex flex-col group hover:border-accent transition-colors duration-200">
      <div className="relative h-44 overflow-hidden bg-bg">
        <img
          src={thumbnailSrc}
          alt={`Lot ${lot.lotNumber} – ${lot.title}`}
          width={400}
          height={176}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${getLotStatusBadge(lot.status)}`}>
          {getLotStatusLabel(lot.status)}
        </div>
        {lot.promoted && (
          <div className="absolute top-2 right-2 bg-accent text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
            Featured
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-ink/80 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
          Lot #{lot.lotNumber}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-sm font-black tracking-tighter uppercase mb-1 line-clamp-2 group-hover:text-accent transition-colors">
          {lot.year} {lot.manufacturer} {lot.model}
        </h3>
        {lot.pickupLocation && (
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 truncate">
            {lot.pickupLocation}
          </p>
        )}

        <div className="flex items-end justify-between mt-auto">
          <div>
            <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">
              {lot.currentBid > 0 ? 'Current Bid' : 'Starting Bid'}
            </span>
            <span className="text-xl font-black tracking-tight text-ink">
              {formatCurrency(lot.currentBid > 0 ? lot.currentBid : lot.startingBid)}
            </span>
            {lot.bidCount > 0 && (
              <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">
                {lot.bidCount} {lot.bidCount === 1 ? 'bid' : 'bids'}
              </span>
            )}
          </div>
          {timeRemaining && (
            <div className="text-right">
              <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">Ends In</span>
              <span className="text-sm font-black tracking-tight text-green-600">{timeRemaining}</span>
            </div>
          )}
        </div>

        <Link
          to={`/auctions/${auctionSlug}/lots/${lot.lotNumber}`}
          className="btn-industrial btn-accent mt-4 py-3 text-center text-[10px]"
        >
          {lot.status === 'active' || lot.status === 'extended' ? 'Bid Now' : 'View Lot'}
          <ArrowRight size={12} className="ml-1.5" />
        </Link>
      </div>
    </div>
  );
}

function PromotedLotCard({ lot, auctionSlug }: { lot: AuctionLot; auctionSlug: string }) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    (lot.status === 'active' || lot.status === 'extended') ? auctionService.formatTimeRemaining(lot.endTime) : ''
  );

  useEffect(() => {
    if (lot.status !== 'active' && lot.status !== 'extended') return;
    const interval = setInterval(() => {
      setTimeRemaining(auctionService.formatTimeRemaining(lot.endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [lot.endTime, lot.status]);

  const thumbnailSrc = lot.thumbnailUrl || '/page-photos/john-deere-harvester.webp';

  return (
    <div className="bg-surface border border-line overflow-hidden flex flex-col md:flex-row group hover:border-accent transition-colors duration-200">
      <div className="relative md:w-72 h-52 md:h-auto overflow-hidden flex-shrink-0 bg-bg">
        <img
          src={thumbnailSrc}
          alt={`Lot ${lot.lotNumber} – ${lot.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 bg-accent text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
          Featured Lot
        </div>
        <div className="absolute bottom-3 left-3 bg-ink/80 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
          Lot #{lot.lotNumber}
        </div>
      </div>
      <div className="p-8 flex-1 flex flex-col justify-between">
        <div>
          <div className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest mb-3 ${getLotStatusBadge(lot.status)}`}>
            {getLotStatusLabel(lot.status)}
          </div>
          <h3 className="text-2xl font-black tracking-tighter uppercase mb-2 group-hover:text-accent transition-colors">
            {lot.year} {lot.manufacturer} {lot.model}
          </h3>
          {lot.pickupLocation && (
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">
              {lot.pickupLocation}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-8 pt-6 border-t border-line">
          <div>
            <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">
              {lot.currentBid > 0 ? 'Current Bid' : 'Starting Bid'}
            </span>
            <span className="text-3xl font-black tracking-tight">
              {formatCurrency(lot.currentBid > 0 ? lot.currentBid : lot.startingBid)}
            </span>
            {lot.bidCount > 0 && (
              <span className="block text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                {lot.bidCount} {lot.bidCount === 1 ? 'bid' : 'bids'}
              </span>
            )}
          </div>
          {timeRemaining && (
            <div>
              <span className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Ends In</span>
              <span className="text-2xl font-black tracking-tight text-green-600">{timeRemaining}</span>
            </div>
          )}
          <Link
            to={`/auctions/${auctionSlug}/lots/${lot.lotNumber}`}
            className="btn-industrial btn-accent py-4 px-10 ml-auto whitespace-nowrap"
          >
            {lot.status === 'active' || lot.status === 'extended' ? 'Bid Now' : 'View Lot'}
            <ArrowRight size={14} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AuctionDetail() {
  const { auctionSlug } = useParams<{ auctionSlug: string }>();
  const { theme } = useTheme();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [loadingAuction, setLoadingAuction] = useState(true);
  const [loadingLots, setLoadingLots] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [infoSection, setInfoSection] = useState<string | null>(null);

  // Load auction by slug
  useEffect(() => {
    if (!auctionSlug) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await auctionService.getAuctionBySlug(auctionSlug);
        if (cancelled) return;
        if (!data) { setNotFound(true); return; }
        setAuction(data);
      } finally {
        if (!cancelled) setLoadingAuction(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [auctionSlug]);

  // Real-time lots subscription once we have the auction id
  useEffect(() => {
    if (!auction?.id) return;
    setLoadingLots(true);
    const unsubscribe = auctionService.onLotsChange(auction.id, (updatedLots) => {
      setLots(updatedLots);
      setLoadingLots(false);
    });
    return () => unsubscribe();
  }, [auction?.id]);

  const promotedLots = useMemo(() => lots.filter((l) => l.promoted), [lots]);
  const allOtherLots = useMemo(() => lots.filter((l) => !l.promoted), [lots]);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    lots.forEach((l) => { if (l.manufacturer) seen.add(l.manufacturer); });
    return Array.from(seen).sort();
  }, [lots]);

  const filteredLots = useMemo(() => {
    return allOtherLots.filter((lot) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        lot.title.toLowerCase().includes(q) ||
        lot.manufacturer.toLowerCase().includes(q) ||
        lot.model.toLowerCase().includes(q) ||
        lot.lotNumber.toLowerCase().includes(q) ||
        String(lot.year).includes(q);
      const matchesCategory = !categoryFilter || lot.manufacturer === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allOtherLots, searchQuery, categoryFilter]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Auctions', path: '/auctions' },
    { label: auction?.title || 'Auction', path: `/auctions/${auctionSlug}` },
  ];

  const jsonLd = auction
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: auction.title,
        description: auction.description,
        startDate: auction.startTime,
        endDate: auction.endTime,
        url: `https://timberequip.com/auctions/${auction.slug}`,
        image: auction.coverImageUrl || auction.image,
        organizer: {
          '@type': 'Organization',
          name: 'Forestry Equipment Sales',
          url: 'https://timberequip.com',
        },
      }
    : undefined;

  if (!loadingAuction && notFound) {
    return (
      <div className="bg-bg min-h-screen flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="p-4 bg-surface border border-line rounded-sm mb-6">
          <AlertCircle size={28} className="text-muted" />
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase mb-3">Auction Not Found</h1>
        <p className="text-sm font-medium text-muted max-w-md mb-8">
          This auction could not be found. It may have been removed or the link is incorrect.
        </p>
        <Link to="/auctions" className="btn-industrial btn-accent py-4 px-10">
          View All Auctions
        </Link>
      </div>
    );
  }

  const isLive = auction?.status === 'active';

  return (
    <div className="bg-bg min-h-screen">
      {auction && (
        <Seo
          title={`${auction.title} | Auction Catalog | Forestry Equipment Sales`}
          description={auction.description || `Browse lots and bid on ${auction.title}. Forestry equipment auction.`}
          canonicalPath={`/auctions/${auction.slug}`}
          imagePath={auction.coverImageUrl || auction.image}
          jsonLd={jsonLd}
        />
      )}

      <Breadcrumbs items={breadcrumbs} />

      {/* Auction Header */}
      <div className="border-b border-line bg-surface">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12">
          {loadingAuction ? (
            <div className="space-y-4">
              <div className="animate-pulse bg-bg h-4 w-24 rounded-sm" />
              <div className="animate-pulse bg-bg h-10 w-2/3 rounded-sm" />
              <div className="animate-pulse bg-bg h-4 w-48 rounded-sm" />
            </div>
          ) : auction ? (
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest ${getAuctionStatusBadge(auction.status)}`}>
                    {getAuctionStatusLabel(auction.status)}
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-1.5" />}
                  </span>
                  {auction.featured && (
                    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-accent text-white">
                      Featured
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4 leading-none">
                  {auction.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={10} />
                    {formatDate(auction.startTime)} – {formatDate(auction.endTime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gavel size={10} />
                    {auction.lotCount} Lots
                  </span>
                  {auction.totalBids > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={10} />
                      {auction.totalBids} Total Bids
                    </span>
                  )}
                  {auction.defaultBuyerPremiumPercent > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Tag size={10} />
                      {auction.defaultBuyerPremiumPercent}% Buyer's Premium
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                {(auction.status === 'active' || auction.status === 'preview') && (
                  <Link
                    to={`/login?redirect=/auctions/${auction.slug}/register`}
                    className="btn-industrial btn-accent py-4 px-10 whitespace-nowrap"
                  >
                    Register to Bid
                  </Link>
                )}
                <Link to="/auctions" className="btn-industrial btn-outline py-4 px-8 whitespace-nowrap">
                  All Auctions
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 space-y-16">

        {/* Featured / Promoted Lots */}
        {!loadingLots && promotedLots.length > 0 && auction && (
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-line pb-4">
              <h2 className="text-xl font-black tracking-tighter uppercase">Featured Lots</h2>
              <span className="label-micro text-accent">{promotedLots.length} Highlighted</span>
            </div>
            <div className="space-y-6">
              {promotedLots.map((lot) => (
                <PromotedLotCard key={lot.id} lot={lot} auctionSlug={auction.slug} />
              ))}
            </div>
          </section>
        )}

        {/* All Lots with filters */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-line pb-4">
            <h2 className="text-xl font-black tracking-tighter uppercase">
              Auction Catalog
              {!loadingLots && (
                <span className="text-muted font-medium text-base ml-2 normal-case tracking-normal">
                  ({filteredLots.length} lots)
                </span>
              )}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search lots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 bg-surface border border-line py-2 pl-11 pr-4 text-sm font-medium placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
              {/* Category filter */}
              {categoryOptions.length > 0 && (
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-surface border border-line text-sm font-medium focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="">All Makes</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {loadingLots || loadingAuction ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <LotCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-surface border border-line rounded-sm mb-4">
                <Gavel size={24} className="text-muted" />
              </div>
              <p className="text-sm font-bold text-muted uppercase tracking-widest mb-2">No Lots Found</p>
              {(searchQuery || categoryFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setCategoryFilter(''); }}
                  className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline mt-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLots.map((lot) => (
                auction && <LotCard key={lot.id} lot={lot} auctionSlug={auction.slug} />
              ))}
            </div>
          )}
        </section>

        {/* Auction Info Sections */}
        {auction && (
          <section className="border-t border-line pt-12">
            <h2 className="text-xl font-black tracking-tighter uppercase mb-6">Auction Information</h2>
            <div className="space-y-1">
              {[
                {
                  key: 'terms',
                  label: 'Terms & Conditions',
                  content: (
                    <div className="text-sm font-medium text-muted leading-relaxed space-y-2">
                      <p>All sales are final. Winning bidders are responsible for payment within {auction.defaultPaymentDeadlineDays} days of auction close.</p>
                      <p>Equipment must be removed within {auction.defaultRemovalDeadlineDays} days of payment confirmation. Storage fees may apply after this period.</p>
                      {auction.termsAndConditionsUrl && (
                        <a
                          href={auction.termsAndConditionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent font-bold hover:underline"
                        >
                          Full Terms & Conditions <ArrowRight size={12} />
                        </a>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'payment',
                  label: 'Payment Information',
                  content: (
                    <div className="text-sm font-medium text-muted leading-relaxed space-y-2">
                      <p>Payment is due within {auction.defaultPaymentDeadlineDays} days of auction close. Accepted payment methods include wire transfer and ACH.</p>
                      <p>A buyer's premium of {auction.defaultBuyerPremiumPercent}% is added to the winning bid amount. This is in addition to the hammer price.</p>
                    </div>
                  ),
                },
                {
                  key: 'buyerpremium',
                  label: "Buyer's Premium",
                  content: (
                    <div className="text-sm font-medium text-muted leading-relaxed space-y-2">
                      <p>A buyer's premium of <strong className="text-ink">{auction.defaultBuyerPremiumPercent}%</strong> is added to each winning bid. The premium is calculated on a tiered basis for large purchases.</p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Under $10,000: 10%</li>
                        <li>$10,000 – $75,000: 7%</li>
                        <li>$75,000 – $250,000: 5%</li>
                        <li>$250,000+: 3%</li>
                      </ul>
                    </div>
                  ),
                },
                {
                  key: 'removal',
                  label: 'Removal & Logistics',
                  content: (
                    <div className="text-sm font-medium text-muted leading-relaxed space-y-2">
                      <p>Winning bidders must arrange removal of equipment within {auction.defaultRemovalDeadlineDays} days of payment. Equipment must be picked up from the listed lot pickup location.</p>
                      <p>Buyers are responsible for all loading, transportation, and related costs. Contact support for logistics assistance.</p>
                      <Link to="/logistics" className="inline-flex items-center gap-1 text-accent font-bold hover:underline">
                        Logistics Services <ArrowRight size={12} />
                      </Link>
                    </div>
                  ),
                },
              ].map(({ key, label, content }) => (
                <div key={key} className="border border-line">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-surface transition-colors"
                    onClick={() => setInfoSection((prev) => (prev === key ? null : key))}
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                    <ChevronDown
                      size={14}
                      className={`text-muted transition-transform duration-200 ${infoSection === key ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {infoSection === key && (
                    <div className="px-5 pb-6 pt-2 border-t border-line">
                      {content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Register CTA */}
        {auction && (auction.status === 'active' || auction.status === 'preview') && (
          <section className="bg-surface border border-line p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <span className="label-micro text-accent mb-3 block">Ready to Bid?</span>
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Register for This Auction</h2>
              <p className="text-sm font-medium text-muted max-w-lg">
                Create an account and complete bidder verification to place bids on any lot in this auction.
              </p>
            </div>
            <Link
              to={`/login?redirect=/auctions/${auction.slug}/register`}
              className="btn-industrial btn-accent py-5 px-12 whitespace-nowrap flex-shrink-0"
            >
              Register to Bid
              <ArrowRight size={14} className="ml-2" />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
