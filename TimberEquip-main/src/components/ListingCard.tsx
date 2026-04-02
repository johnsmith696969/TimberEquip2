import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, MapPin, TrendingUp, TrendingDown, 
  Star, Bookmark, ShieldCheck,
  Square, CheckSquare
} from 'lucide-react';
import { Listing } from '../types';
import { useLocale } from './LocaleContext';
import { buildListingPath } from '../utils/listingPath';
import { normalizeListingId } from '../utils/listingIdentity';

interface ListingCardProps {
  listing: Listing;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onInquire?: (listing: Listing) => void;
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

export function ListingCard({ 
  listing, 
  isFavorite, 
  onToggleFavorite, 
  onInquire,
  isComparing,
  onToggleCompare
}: ListingCardProps) {
  const { t, formatNumber, formatPrice } = useLocale();
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
  const displayLocation = listing.location || 'Location pending';
  const displayCondition = listing.condition || 'Unspecified';
  const listingPath = buildListingPath(listing);
  const normalizedListingId = normalizeListingId(listing.id);

  return (
    <div className={`bg-bg border group relative flex flex-col h-full hover:-translate-y-1 transition-transform duration-200 ease-out ${listing.featured ? 'border-accent' : 'border-line'}`}>
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <img
          src={heroImage}
          srcSet={heroSrcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={listing.title || 'Equipment listing image'}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {listing.featured && (
            <span className="bg-accent text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
              {t('listingCard.featuredEquipment', 'Featured Equipment')}
            </span>
          )}
          {listing.sellerVerified && (
            <span className="bg-data/90 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
              {t('listingCard.verifiedSeller', 'Verified Seller')}
            </span>
          )}
          <span className="bg-ink/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">
            {displayCondition}
          </span>
        </div>

        {/* Favorite & Compare Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
            <Clock size={12} className="mr-1" />
            <span className="text-[10px] font-bold uppercase">{formatNumber(safeHours)} {t('listingCard.hoursShort', 'HRS')}</span>
          </div>
        </div>

        <Link to={listingPath} className="block">
          <h3 className="text-sm font-black uppercase tracking-tight mb-4 group-hover:text-accent transition-colors line-clamp-1">
            {listing.year || 'Unknown Year'} {displayMake} {displayModel}
          </h3>
        </Link>
        {estimatedMonthlyPayment > 0 && (
          <div className="-mt-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-muted underline decoration-line underline-offset-2">
            {t('listingCard.estimated', 'Est.')} {formatPrice(estimatedMonthlyPayment, listing.currency || 'USD', 0)}/mo {t('listingCard.atRateForTerm', 'at 6% for 60 mos')}
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col">
              <span className="label-micro">{t('listingCard.currentPrice', 'Current Price')}</span>
              <span className="text-xl font-black tracking-tighter">
                {formatPrice(safePrice, listing.currency || 'USD', 0)}
              </span>
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
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 border-t border-line bg-surface/50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={12} className={listing.sellerVerified ? 'text-data' : 'text-muted'} />
          <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
            {listing.sellerVerified ? t('listingCard.verifiedSeller', 'Verified Seller') : t('listingCard.verificationPending', 'Verification Pending')}
          </span>
        </div>
      </div>
    </div>
  );
}
