import React from 'react';
import { Link } from 'react-router-dom';
import {
  Hourglass, MapPin, TrendingUp, TrendingDown,
  Bookmark, Phone,
  Square, CheckSquare, Gavel, Eye, MessageSquare
} from 'lucide-react';
import { Listing } from '../types';
import { useLocale } from './LocaleContext';
import { useAuth } from './AuthContext';
import { buildListingPath } from '../utils/listingPath';
import { normalizeListingId } from '../utils/listingIdentity';
import { getListingLocationLabel } from '../utils/seoRoutes';
import { equipmentService } from '../services/equipmentService';

const ADMIN_ROLES = ['super_admin', 'admin', 'developer'];

interface ListingCardProps {
  listing: Listing;
  viewMode?: 'grid' | 'list';
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onInquire?: (listing: Listing) => void;
  onFinancing?: (listing: Listing) => void;
  isComparing?: boolean;
  onToggleCompare?: (id: string) => void;
}

function calcMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRatePct === 0) return principal / months;
  const monthlyRate = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function formatListingDate(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toDialablePhone(value?: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/[^\d]/g, '')}`;
  }
  return trimmed.replace(/[^\d]/g, '');
}

function formatPhoneLabel(value?: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/[^\d]/g, '');
  const normalized = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (normalized.length === 10) {
    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  return trimmed;
}

export const ListingCard = React.memo(function ListingCard({
  listing,
  viewMode = 'grid',
  isFavorite,
  onToggleFavorite,
  onInquire,
  onFinancing,
  isComparing,
  onToggleCompare
}: ListingCardProps) {
  const { t, formatNumber, formatPrice } = useLocale();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.role && ADMIN_ROLES.includes(user.role));
  const safeImages = Array.isArray(listing.images) ? listing.images.filter(Boolean) : [];
  const safeImageVariants = Array.isArray(listing.imageVariants) ? listing.imageVariants : [];
  const safePrice = typeof listing.price === 'number' && Number.isFinite(listing.price) ? listing.price : 0;
  const safeHours = typeof listing.hours === 'number' && Number.isFinite(listing.hours) ? listing.hours : 0;
  const safeMarketValueEstimate = typeof listing.marketValueEstimate === 'number' && Number.isFinite(listing.marketValueEstimate)
    ? listing.marketValueEstimate
    : null;
  const hasAmv = typeof safeMarketValueEstimate === 'number' && safeMarketValueEstimate > 0;
  const amvDiff = hasAmv ? safePrice - safeMarketValueEstimate : 0;
  const isBelowAmv = hasAmv ? amvDiff < 0 : false;
  const amvPercent = hasAmv ? Math.abs((amvDiff / safeMarketValueEstimate) * 100).toFixed(1) : null;
  const heroImage = safeImageVariants[0]?.thumbnailUrl || safeImages[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' fill='%23e5e5e5'%3E%3Crect width='640' height='480'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='20'%3ENo Image%3C/text%3E%3C/svg%3E";
  const heroDetailImage = safeImageVariants[0]?.detailUrl || '';
  const heroSrcSet = heroDetailImage
    ? `${heroImage} 480w, ${heroDetailImage} 1600w`
    : undefined;
  const estimatedMonthlyPayment = Math.round(calcMonthlyPayment(safePrice, 6, 60));
  const displayMake = listing.make || listing.manufacturer || 'Unknown Make';
  const displayModel = listing.model || 'Unknown Model';
  const displayTitle = listing.title || `${listing.year || 'Unknown Year'} ${displayMake} ${displayModel}`;
  const displayLocation = getListingLocationLabel(listing) || 'Location pending';
  const displayCondition = listing.condition || 'Unspecified';
  const displaySellerName = String(listing.sellerName || '').trim() || undefined;
  const sellerProfilePath = (listing.sellerUid || listing.sellerId)
    ? `/sellers/${listing.sellerUid || listing.sellerId}`
    : '';
  const displaySellerPhoneLabel = formatPhoneLabel(listing.sellerPhone);
  const displaySellerPhoneHref = toDialablePhone(listing.sellerPhone);
  const displayUpdatedAt = formatListingDate(listing.updatedAt || listing.publishedAt || listing.createdAt);
  const listingPath = buildListingPath(listing);
  const normalizedListingId = normalizeListingId(listing.id);
  const isListView = viewMode === 'list';

  const handlePhoneClick = () => {
    const sellerUid = listing.sellerUid || listing.sellerId || '';
    equipmentService.createCallLog({
      listingId: listing.id,
      listingTitle: listing.title,
      sellerId: sellerUid,
      sellerUid,
      sellerName: listing.sellerName || 'Unknown Seller',
      sellerPhone: String(listing.sellerPhone || ''),
      callerUid: user?.uid || null,
      callerName: (user?.displayName || user?.email || 'Guest User').trim(),
      callerEmail: user?.email || '',
      callerPhone: String(user?.phoneNumber || ''),
      duration: 0,
      status: 'Initiated',
      source: 'listing_card',
      isAuthenticated: Boolean(user?.uid),
    }).catch(() => { /* fire-and-forget */ });
  };

  if (isListView) {
    return (
      <div className={`bg-bg border rounded-sm group relative overflow-hidden shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-200 ease-out ${listing.featured ? 'border-accent' : 'border-line'}`}>
        <div className="flex h-full flex-row">
          <div className="relative w-32 shrink-0 overflow-hidden bg-surface sm:w-40 md:w-52">
            <img
              src={heroImage}
              srcSet={heroSrcSet}
              sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 208px"
              alt={`${listing.year || ''} ${listing.make || listing.manufacturer || ''} ${listing.model || ''} - ${listing.category || 'Equipment'}`.replace(/\s+/g, ' ').trim()}
              className="h-full min-h-[168px] w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />

            <div className="absolute top-2 left-2 flex max-w-[calc(100%-1rem)] flex-col space-y-1">
              {listing.auctionId && listing.auctionStatus && !['closed', 'sold', 'unsold'].includes(listing.auctionStatus) && (
                <span className="bg-ink text-bg text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg flex items-center gap-1">
                  <Gavel size={9} />
                  {listing.auctionStatus === 'active' || listing.auctionStatus === 'extended'
                    ? 'Bidding Live'
                    : `Auction ${listing.auctionEndTime ? new Date(listing.auctionEndTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
                  }
                </span>
              )}
              {listing.featured && (
                <span className="bg-accent text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
                  {t('listingCard.featuredEquipment', 'Featured Equipment')}
                </span>
              )}
              <span className="bg-ink/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
                {displayCondition}
              </span>
            </div>

            <div className="absolute top-2 right-2 flex flex-col space-y-1.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite?.(normalizedListingId);
                }}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2 rounded-sm backdrop-blur-md transition-colors ${
                  isFavorite ? 'bg-accent text-white opacity-100' : 'bg-white/20 text-white hover:bg-white/40'
                }`}
              >
                <Bookmark size={14} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleCompare?.(normalizedListingId);
                }}
                aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                className={`p-2 rounded-sm backdrop-blur-md transition-colors ${
                  isComparing ? 'bg-secondary text-white opacity-100' : 'bg-white/20 text-white hover:bg-white/40'
                }`}
              >
                {isComparing ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            </div>
          </div>

          <div className="min-w-0 flex flex-1 flex-col p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label-micro">{displayMake}</span>
                </div>

                <Link to={listingPath} className="block">
                  <h3 className="mt-1 line-clamp-2 text-sm font-black uppercase tracking-tight transition-colors group-hover:text-accent md:text-lg">
                    {listing.year || 'Unknown Year'} {displayMake} {displayModel}
                  </h3>
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span className="flex items-center">
                    <Hourglass size={11} className="mr-1" />
                    {formatNumber(safeHours)} {t('listingCard.hoursShort', 'HRS')}
                  </span>
                  <span className="flex min-w-0 items-center">
                    <MapPin size={11} className="mr-1 shrink-0" />
                    <span className="truncate">{displayLocation}</span>
                  </span>
                </div>

                {estimatedMonthlyPayment > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onFinancing?.(listing); }}
                    className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted underline decoration-line underline-offset-2 cursor-pointer hover:text-accent transition-colors"
                  >
                    {t('listingCard.estimated', 'Est.')} {formatPrice(estimatedMonthlyPayment, listing.currency || 'USD', 0)}/mo {t('listingCard.atRateForTerm', 'at 6% for 60 mos')}
                  </button>
                )}

                {hasAmv && (
                  <div className={`mt-3 inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                    isBelowAmv
                      ? 'bg-data/10 border-data/30 text-data'
                      : 'bg-accent/10 border-accent/30 text-accent'
                  }`}>
                    {isBelowAmv ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {isBelowAmv ? `${amvPercent}% Below AMV` : `${amvPercent}% Above AMV`}
                  </div>
                )}
              </div>

              <div className="shrink-0 border border-line bg-surface/60 px-4 py-3 md:min-w-[190px]">
                {listing.auctionId && listing.auctionStatus === 'active' && listing.currentBid ? (
                  <div>
                    <span className="label-micro">Current Bid</span>
                    <div className="mt-2 text-xl font-black tracking-tighter">
                      {formatPrice(listing.currentBid, listing.currency || 'USD', 0)}
                    </div>
                    {listing.bidCount ? (
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-muted">
                        {listing.bidCount} bids
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <span className="label-micro">{t('listingCard.currentPrice', 'Current Price')}</span>
                    <div className="mt-2 text-2xl font-black tracking-tighter">
                      {formatPrice(safePrice, listing.currency || 'USD', 0)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-line/70 pt-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {displaySellerPhoneHref && displaySellerPhoneLabel ? (
                      <a
                        href={`tel:${displaySellerPhoneHref}`}
                        className="inline-flex min-h-[36px] items-center gap-2 border border-accent/30 bg-accent/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-white"
                        onClick={(e) => { e.stopPropagation(); handlePhoneClick(); }}
                      >
                        <Phone size={12} />
                        <span>{displaySellerPhoneLabel}</span>
                      </a>
                    ) : null}
                    {displayUpdatedAt ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                        Updated: {displayUpdatedAt}
                      </span>
                    ) : null}
                  </div>
                </div>
                {displaySellerName ? (
                  sellerProfilePath ? (
                    <Link to={sellerProfilePath} className="truncate text-[10px] font-black uppercase tracking-widest text-ink hover:text-accent transition-colors lg:max-w-[220px] lg:shrink-0 lg:text-right" onClick={(e) => e.stopPropagation()}>
                      {displaySellerName}
                    </Link>
                  ) : (
                    <p className="truncate text-[10px] font-black uppercase tracking-widest text-ink lg:max-w-[220px] lg:shrink-0 lg:text-right">
                      {displaySellerName}
                    </p>
                  )
                ) : null}
              </div>
              {isAdmin && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-secondary">
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {formatNumber(listing.views || 0)} views
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={11} />
                    {formatNumber(listing.leads || 0)} leads
                  </span>
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="grid grid-cols-2 gap-2 sm:min-w-[230px]">
                <Link
                  to={listingPath}
                  aria-label={`View details for ${displayTitle}`}
                  className="btn-industrial py-2.5 text-center bg-surface hover:bg-ink hover:text-bg"
                >
                  {t('listingCard.details', 'Details')}
                </Link>
                {listing.auctionId && (listing.auctionStatus === 'active' || listing.auctionStatus === 'extended') ? (
                  <Link to={`/auctions/${listing.auctionSlug}/lots/${listing.lotNumber}`} className="btn-industrial btn-accent text-center py-2.5">
                    Place Bid
                  </Link>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onInquire?.(listing);
                    }}
                    aria-label={`Inquire about ${displayTitle}`}
                    className="btn-industrial btn-accent py-2.5"
                  >
                    {t('listingCard.inquire', 'Inquire')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg border rounded-sm group relative flex flex-col h-full shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-200 ease-out ${listing.featured ? 'border-accent' : 'border-line'}`}>
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <img
          src={heroImage}
          srcSet={heroSrcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={`${listing.year || ''} ${listing.make || listing.manufacturer || ''} ${listing.model || ''} - ${listing.category || 'Equipment'}`.replace(/\s+/g, ' ').trim()}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {listing.auctionId && listing.auctionStatus && !['closed', 'sold', 'unsold'].includes(listing.auctionStatus) && (
            <span className="bg-ink text-bg text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg flex items-center gap-1">
              <Gavel size={10} />
              {listing.auctionStatus === 'active' || listing.auctionStatus === 'extended'
                ? 'Bidding Live'
                : `Auction ${listing.auctionEndTime ? new Date(listing.auctionEndTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
              }
            </span>
          )}
          {listing.featured && (
            <span className="bg-accent text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
              {t('listingCard.featuredEquipment', 'Featured Equipment')}
            </span>
          )}
          <span className="bg-ink/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">
            {displayCondition}
          </span>
        </div>

        {/* Favorite & Compare Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(normalizedListingId);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-2 rounded-sm backdrop-blur-md transition-colors ${
              isFavorite ? 'bg-accent text-white opacity-100' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            <Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleCompare?.(normalizedListingId);
            }}
            aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
            className={`p-2 rounded-sm backdrop-blur-md transition-colors ${
              isComparing ? 'bg-secondary text-white opacity-100' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            {isComparing ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        </div>

        {/* Market Indicator */}
        {hasAmv && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className={`flex items-center justify-between px-3 py-1.5 rounded-sm backdrop-blur-md border ${
              isBelowAmv
                ? 'bg-data/20 border-data/50 text-data'
                : 'bg-accent/20 border-accent/50 text-accent'
            }`}>
              <div className="flex items-center space-x-2">
                {isBelowAmv ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {isBelowAmv ? `${amvPercent}% BELOW AMV` : `${amvPercent}% ABOVE AMV`}
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className="label-micro">{displayMake}</span>
          <div className="flex items-center text-muted">
            <Hourglass size={12} className="mr-1" />
            <span className="text-[10px] font-bold uppercase">{formatNumber(safeHours)} {t('listingCard.hoursShort', 'HRS')}</span>
          </div>
        </div>

        <Link to={listingPath} className="block">
          <h3 className="text-sm font-black uppercase tracking-tight mb-4 group-hover:text-accent transition-colors line-clamp-1">
            {listing.year || 'Unknown Year'} {displayMake} {displayModel}
          </h3>
        </Link>
        {estimatedMonthlyPayment > 0 && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onFinancing?.(listing); }}
            className="-mt-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-muted underline decoration-line underline-offset-2 cursor-pointer hover:text-accent transition-colors"
          >
            {t('listingCard.estimated', 'Est.')} {formatPrice(estimatedMonthlyPayment, listing.currency || 'USD', 0)}/mo {t('listingCard.atRateForTerm', 'at 6% for 60 mos')}
          </button>
        )}

        <div className="mt-auto">
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col">
              {listing.auctionId && listing.auctionStatus === 'active' && listing.currentBid ? (
                <div>
                  <span className="label-micro">Current Bid</span>
                  <div className="text-base font-black">{formatPrice(listing.currentBid, listing.currency || 'USD', 0)}</div>
                  {listing.bidCount ? <span className="text-[9px] text-muted">{listing.bidCount} bids</span> : null}
                </div>
              ) : (
                <>
                  <span className="label-micro">{t('listingCard.currentPrice', 'Current Price')}</span>
                  <span className="text-xl font-black tracking-tighter">
                    {formatPrice(safePrice, listing.currency || 'USD', 0)}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col items-end">
              <span className="label-micro">{t('listingCard.location', 'Location')}</span>
              <div className="flex items-center text-[10px] font-bold text-muted">
                <MapPin size={10} className="mr-1" />
                {displayLocation}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={listingPath}
              aria-label={`View details for ${displayTitle}`}
              className="btn-industrial py-2.5 text-center bg-surface hover:bg-ink hover:text-bg"
            >
              {t('listingCard.details', 'Details')}
            </Link>
            {listing.auctionId && (listing.auctionStatus === 'active' || listing.auctionStatus === 'extended') ? (
              <Link to={`/auctions/${listing.auctionSlug}/lots/${listing.lotNumber}`} className="btn-industrial btn-accent flex-1 text-center py-2.5">
                Place Bid
              </Link>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onInquire?.(listing);
                }}
                aria-label={`Inquire about ${displayTitle}`}
                className="btn-industrial btn-accent py-2.5"
              >
                {t('listingCard.inquire', 'Inquire')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 border-t border-line bg-surface/50">
        <div className="flex flex-col gap-2">
          {displaySellerPhoneHref && displaySellerPhoneLabel ? (
            <a
              href={`tel:${displaySellerPhoneHref}`}
              className="inline-flex min-h-[34px] items-center gap-1.5 border border-accent/30 bg-accent/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-white self-start"
              onClick={(e) => { e.stopPropagation(); handlePhoneClick(); }}
            >
              <Phone size={10} />
              <span>{displaySellerPhoneLabel}</span>
            </a>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            {displayUpdatedAt ? (
              <span className="text-[9px] font-bold tracking-widest text-muted/70">
                Updated: {displayUpdatedAt}
              </span>
            ) : <span />}
            {displaySellerName ? (
              sellerProfilePath ? (
                <Link to={sellerProfilePath} className="truncate text-[9px] font-black uppercase tracking-widest text-ink hover:text-accent transition-colors text-right max-w-[60%]" onClick={(e) => e.stopPropagation()}>
                  {displaySellerName}
                </Link>
              ) : (
                <p className="truncate text-[9px] font-black uppercase tracking-widest text-ink text-right max-w-[60%]">
                  {displaySellerName}
                </p>
              )
            ) : null}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3 mt-1.5 text-[9px] font-bold uppercase tracking-widest text-secondary">
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {formatNumber(listing.views || 0)} views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={10} />
              {formatNumber(listing.leads || 0)} leads
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
