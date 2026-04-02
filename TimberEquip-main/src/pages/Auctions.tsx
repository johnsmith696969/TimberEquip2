import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, Gavel, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { equipmentService } from '../services/equipmentService';
import { Auction } from '../types';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';

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
  const { theme } = useTheme();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';

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
        imagePath="/page-photos/john-deere-harvester.webp"
      />

      {/* Hero */}
      <ImageHero imageSrc="/page-photos/john-deere-harvester.webp" imageAlt="John Deere harvester in the forest">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Gavel size={20} className="text-accent" />
            <span className="label-micro text-accent">Auction Center</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            {hasLiveAuctions ? 'Live ' : 'Equipment '}
            <br />
            <span className={heroSecondaryClass}>Auctions</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            {hasLiveAuctions
              ? 'Verified auction schedules for buyers and sellers who need a structured liquidation or bidding event.'
              : 'Timed and live auctions are not yet open for direct bidding on Forestry Equipment Sales. Use this desk for launch updates and support.'}
          </p>
        </div>
      </ImageHero>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {hasLiveAuctions && featuredAuction ? (
              <div className="space-y-16">
                {/* Featured Auction */}
                <motion.div
                  key={featuredAuction.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface border border-line overflow-hidden"
                >
                  <div className="relative h-[300px]">
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
                  <div className="p-8 md:p-12">
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
                      <Link to="/search" className="btn-industrial bg-surface border border-line flex-1 py-4 text-center">
                        Browse Inventory
                      </Link>
                    </div>
                  </div>
                </motion.div>

                {/* Auction Schedule */}
                {sortedAuctions.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-12 border-b border-line pb-4">
                      <h3 className="text-xl font-black tracking-tighter uppercase">Auction Schedule</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Live event data only
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {sortedAuctions.map((auction) => (
                        <motion.div
                          key={auction.id}
                          whileHover={{ y: -5 }}
                          className="bg-surface border border-line overflow-hidden flex flex-col group"
                        >
                          <div className="relative h-48">
                            <img
                              src={auction.image}
                              alt={auction.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 right-3 bg-bg/90 backdrop-blur-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-line">
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
                )}
              </div>
            ) : (
              <div className="bg-surface border border-line p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-bg border border-line rounded-sm">
                    <Gavel size={18} className="text-accent" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">Launch Status</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">
                  Auctions Are Not Yet Open For Direct Bidding
                </h2>
                <p className="text-sm font-medium text-muted leading-relaxed mb-8 max-w-3xl">
                  Forestry Equipment Sales is still building the operator workflow for live auction registration, bidder verification,
                  catalog publishing, and settlement.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/contact" className="btn-industrial btn-accent py-5 px-12 text-center">
                    Contact Support
                  </Link>
                  <Link to="/search" className="btn-industrial py-5 px-12 bg-surface border border-line text-center">
                    Browse Live Inventory
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-surface border border-line p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-accent">Auction Information</h4>
              <div className="space-y-8">
                {[
                  { title: 'Verified Events', desc: 'Every listed auction is reviewed and verified by the operations team.', icon: ShieldCheck },
                  { title: 'Live Scheduling', desc: 'Auction dates, locations, and lot counts are pulled from live data.', icon: Calendar },
                  { title: 'Support Registration', desc: 'Bidder registration is handled through the support team until self-service launches.', icon: Activity },
                  { title: 'Secure Settlement', desc: 'All transactions are handled through verified settlement workflows.', icon: Clock },
                ].map((item, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="p-2 bg-bg border border-line rounded-sm h-fit">
                      <item.icon className="text-accent" size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight mb-1">{item.title}</span>
                      <p className="text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {hasLiveAuctions && (
              <div className="bg-surface border border-line p-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-accent">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-line pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Events</span>
                    <span className="text-lg font-black tracking-tight">{sortedAuctions.length}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-line pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Lots</span>
                    <span className="text-lg font-black tracking-tight">
                      {sortedAuctions.reduce((sum, a) => sum + (a.itemCount || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
