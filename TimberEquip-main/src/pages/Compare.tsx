import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Check, X, Info,
  TrendingUp, TrendingDown,
  CalendarDays, Hourglass, ShieldCheck, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { Listing } from '../types';
import { useLocale } from '../components/LocaleContext';
import { buildListingPath } from '../utils/listingPath';
import { Seo } from '../components/Seo';
import { InquiryModal } from '../components/InquiryModal';

export function Compare() {
  const { formatNumber, formatPrice } = useLocale();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryListing, setInquiryListing] = useState<Listing | null>(null);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',') || [];
    const fetchListings = async () => {
      setLoading(true);
      try {
        const data = await Promise.all(ids.map(id => equipmentService.getListing(id)));
        setListings(data.filter(Boolean) as Listing[]);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [searchParams]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (listings.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">No Equipment Selected</h2>
      <Link to="/search" className="btn-industrial btn-accent">Return to Inventory</Link>
    </div>
  );

  const specKeys = Array.from(new Set(listings.flatMap(l => Object.keys(l.specs))));

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Seo
        title="Compare Equipment | Forestry Equipment Sales"
        description="Compare forestry equipment listings side by side. Review specs, pricing, hours, and condition to find the right machine."
        canonicalPath="/compare"
      />
      {/* Header */}
      <div className="bg-surface border-b border-line py-8 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex justify-between items-end">
          <div>
            <Link to="/search" className="flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-ink mb-6">
              <ArrowLeft size={14} className="mr-2" />
              Back to Inventory
            </Link>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Equipment <span className="text-muted">Comparison</span></h1>
          </div>
          <div className="text-right">
            <span className="label-micro text-accent mb-1 block">Comparison Tool</span>
            <span className="text-sm font-black uppercase tracking-widest">{formatNumber(listings.length)} {listings.length === 1 ? 'Machine' : 'Machines'} Loaded</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 overflow-x-auto">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-64 p-6 bg-surface border border-line text-left">
                  <span className="label-micro">Comparison Matrix</span>
                </th>
                {listings.map(listing => (
                  <th key={listing.id} className="p-6 bg-bg border border-line min-w-[300px]">
                    <div className="flex flex-col items-start text-left">
                      <div className="aspect-[16/9] w-full bg-surface mb-6 overflow-hidden rounded-sm">
                        <img src={listing.images[0]} alt={`${listing.year || ''} ${listing.manufacturer || ''} ${listing.model || ''} - ${listing.category || 'Equipment'}`.replace(/\s+/g, ' ').trim()} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <span className="label-micro mb-1">{listing.manufacturer}</span>
                      <h3 className="text-sm font-black uppercase tracking-tight mb-4 line-clamp-1">{listing.title}</h3>
                      <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tighter">{formatPrice(listing.price, listing.currency || 'USD', 0)}</span>
                        <span className="label-micro text-muted">Current Price</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {/* Market Intelligence Row */}
              <tr className="bg-surface/30">
                <td className="p-6 border border-line">
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={14} className="text-accent" />
                    <span className="text-xs font-black uppercase tracking-widest">Market Status</span>
                  </div>
                </td>
                {listings.map(listing => {
                  const hasAmv = typeof listing.marketValueEstimate === 'number' && listing.marketValueEstimate > 0;
                  const amvDiff = hasAmv ? listing.price - (listing.marketValueEstimate as number) : 0;
                  const isBelowAmv = hasAmv ? amvDiff < 0 : false;
                  const amvPercent = hasAmv ? Math.abs((amvDiff / (listing.marketValueEstimate as number)) * 100).toFixed(1) : null;
                  return (
                    <td key={listing.id} className="p-6 border border-line">
                      <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${
                        !hasAmv ? 'text-muted' : isBelowAmv ? 'text-data' : 'text-accent'
                      }`}>
                        {!hasAmv ? <Info size={14} /> : isBelowAmv ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        <span>{!hasAmv ? 'AMV N/A' : isBelowAmv ? `${amvPercent}% BELOW AMV` : `${amvPercent}% ABOVE AMV`}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Core Specs */}
              {[
                { label: 'Year', key: 'year', icon: CalendarDays },
                { label: 'Hours', key: 'hours', icon: Hourglass },
                { label: 'Condition', key: 'condition', icon: ShieldCheck },
                { label: 'Location', key: 'location', icon: MapPin }
              ].map(row => {
                const Icon = row.icon;
                return (
                  <tr key={row.key}>
                    <td className="p-6 border border-line bg-surface/10">
                      <span className="label-micro inline-flex items-center gap-2">
                        <Icon size={13} className="text-accent" />
                        {row.label}
                      </span>
                    </td>
                    {listings.map(listing => (
                      <td key={listing.id} className="p-6 border border-line">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {row.key === 'hours' ? `${formatNumber(listing.hours)} HRS` : (listing as any)[row.key]}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Technical Specs */}
              {specKeys.map(key => (
                <tr key={key as string}>
                  <td className="p-6 border border-line bg-surface/10">
                    <span className="label-micro">{(key as string).replace(/([A-Z])/g, ' $1')}</span>
                  </td>
                  {listings.map(listing => (
                    <td key={listing.id} className="p-6 border border-line">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted">
                        {Array.isArray(listing.specs[key as string]) ? (listing.specs[key as string] as any).join(', ') : listing.specs[key as string] || '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}

              {/* Actions Row */}
              <tr>
                <td className="p-6 border border-line bg-surface/10">
                  <span className="label-micro">Actions</span>
                </td>
                {listings.map(listing => (
                  <td key={listing.id} className="p-6 border border-line">
                    <div className="flex flex-col space-y-2">
                      <Link to={buildListingPath(listing)} className="btn-industrial py-2.5 text-center bg-ink text-bg">
                        View Details
                      </Link>
                      <button
                        className="btn-industrial btn-accent py-2.5"
                        onClick={() => setInquiryListing(listing)}
                      >
                        Inquire
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {inquiryListing && (
        <InquiryModal
          isOpen
          onClose={() => setInquiryListing(null)}
          listing={inquiryListing}
        />
      )}
    </div>
  );
}
