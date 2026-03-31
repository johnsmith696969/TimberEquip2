import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { equipmentService } from '../services/equipmentService';
import { Auction } from '../types';
import { Seo } from '../components/Seo';

function formatAuctionDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date to be announced';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAuctionDateParts(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return { day: 'TBD', month: 'DATE' };
  }

  return {
    day: parsed.toLocaleDateString('en-US', { day: '2-digit' }),
    month: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

export function Auctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const data = await equipmentService.getAuctions();
        setAuctions(data);
      } catch (error) {
        console.error('Error fetching auctions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  const sortedAuctions = useMemo(
    () =>
      [...auctions].sort((a, b) => {
        const aTime = new Date(a.date).getTime() || 0;
        const bTime = new Date(b.date).getTime() || 0;
        return aTime - bTime;
      }),
    [auctions]
  );

  const featuredAuction = sortedAuctions.find((auction) => auction.featured) || sortedAuctions[0] || null;
  const hasLiveAuctions = sortedAuctions.length > 0;

  if (loading && !hasLiveAuctions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen">
      <Seo
        title="Live Auctions | Forestry Equipment Auctions | Forestry Equipment Sales"
        description="Browse upcoming and live forestry equipment auctions. Bid on logging machines, land clearing equipment, trucks, and trailers."
        canonicalPath="/auctions"
      />
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <img
          src="/page-photos/john-deere-harvester.jpg"
          alt="John Deere harvester in the forest"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/0 via-bg/50 to-bg"></div>
        
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-accent flex items-center justify-center rounded-sm mb-6">
              <Gavel size={32} className="text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4">
              {hasLiveAuctions ? 'Live Auctions' : 'Auction Desk'}
            </h1>
            <p className="text-muted font-bold tracking-widest uppercase text-sm max-w-2xl mx-auto">
              {hasLiveAuctions
                ? 'Verified auction schedules for buyers and sellers who need a structured liquidation or bidding event.'
                : 'Timed and live auctions are not yet open for direct bidding on Forestry Equipment Sales. Use this desk for launch updates and support.'}
            </p>
          </motion.div>
        </div>
      </section>

      {hasLiveAuctions && featuredAuction ? (
        <>
          <section className="px-4 md:px-8 -mt-20 relative z-20 mb-24">
            <div className="max-w-6xl mx-auto">
              <motion.div
                key={featuredAuction.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface border border-line rounded-sm overflow-hidden flex flex-col lg:flex-row shadow-2xl"
              >
                <div className="lg:w-1/2 relative h-[300px] lg:h-auto">
                  <img
                    src={featuredAuction.image}
                    alt={featuredAuction.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-accent text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Featured Event
                  </div>
                </div>
                <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex flex-col items-center bg-ink text-bg px-4 py-2 rounded-sm">
                      <span className="text-2xl font-black leading-none">{getAuctionDateParts(featuredAuction.date).day}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest">{getAuctionDateParts(featuredAuction.date).month}</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase">{featuredAuction.title}</h2>
                      <div className="flex items-center text-muted text-xs font-bold uppercase tracking-widest mt-1">
                        <MapPin size={12} className="mr-1" /> {featuredAuction.location || 'Location to be announced'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-bg border border-line rounded-sm">
                        <Clock size={16} className="text-accent" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-muted font-bold uppercase tracking-widest">Schedule</span>
                        <span className="text-sm font-black tracking-tight">{formatAuctionDate(featuredAuction.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-bg border border-line rounded-sm">
                        <Gavel size={16} className="text-accent" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-muted font-bold uppercase tracking-widest">Lots</span>
                        <span className="text-sm font-black tracking-tight">{featuredAuction.itemCount || 0} Equipment</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 p-6 bg-bg border border-line rounded-sm">
                    <span className="block text-[10px] text-muted font-black uppercase tracking-[0.2em] mb-2">Registration Status</span>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                      Auction registration is handled by the Forestry Equipment Sales support team until the bidder workflow is live.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/contact" className="btn-industrial btn-accent flex-1 py-4 text-center">
                      Contact Support
                    </Link>
                    <Link to="/search" className="btn-industrial btn-outline flex-1 py-4 text-center">
                      Browse Inventory
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="px-4 md:px-8 pb-24">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-12 border-b border-line pb-4">
                <h3 className="text-xl font-black tracking-tighter uppercase">Auction Schedule</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                  Live event data only
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedAuctions.map((auction) => (
                  <motion.div
                    key={auction.id}
                    whileHover={{ y: -5 }}
                    className="bg-surface border border-line rounded-sm overflow-hidden flex flex-col group"
                  >
                    <div className="relative h-48">
                      <img
                        src={auction.image}
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 bg-bg/90 backdrop-blur-sm px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border border-line">
                        {auction.type || 'Auction'}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">
                        <Calendar size={10} className="mr-1.5" />
                        {formatAuctionDate(auction.date)}
                      </div>
                      <h4 className="text-lg font-black tracking-tighter uppercase mb-2 group-hover:text-accent transition-colors">{auction.title}</h4>
                      <div className="flex items-center text-muted text-[10px] font-bold uppercase tracking-widest mb-2">
                        <MapPin size={10} className="mr-1" /> {auction.location || 'Location to be announced'}
                      </div>
                      <div className="flex items-center text-muted text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Clock size={10} className="mr-1" /> {auction.status || 'Schedule pending'}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-line">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                          {auction.itemCount || 0} listed lots
                        </span>
                        <Link to="/contact" className="text-[10px] font-black uppercase tracking-widest flex items-center hover:text-accent transition-colors">
                          Request Details <ArrowRight size={12} className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="px-4 md:px-8 -mt-20 relative z-20 pb-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-line rounded-sm p-8 md:p-12 shadow-2xl"
            >
              <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-2 bg-bg border border-line px-3 py-2 text-[10px] font-black uppercase tracking-widest text-accent">
                    <Gavel size={12} />
                    Launch Status
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
                    Auctions Are Not Yet Open For Direct Bidding
                  </h2>
                  <p className="text-[12px] font-bold uppercase tracking-widest text-muted leading-relaxed max-w-3xl">
                    Forestry Equipment Sales is still building the operator workflow for live auction registration, bidder verification,
                    catalog publishing, and settlement. This page now reflects the real launch state instead of showing demo events.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/contact" className="btn-industrial btn-accent py-4 px-8 text-center">
                      Contact Support
                    </Link>
                    <Link to="/search" className="btn-industrial btn-outline py-4 px-8 text-center">
                      Browse Live Inventory
                    </Link>
                  </div>
                </div>

                <div className="bg-bg border border-line rounded-sm p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest">What To Expect</h3>
                  <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-muted">
                    <li>Verified auction calendars when live events are enabled</li>
                    <li>Support-managed bidder onboarding until self-service is complete</li>
                    <li>Catalog publishing only when real auction inventory is available</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
