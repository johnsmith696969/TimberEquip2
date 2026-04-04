import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gavel,
  Calendar,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  UserCheck,
  DollarSign,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { auctionService } from '../services/auctionService';
import { Auction, AuctionStatus } from '../types';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useTheme } from '../components/ThemeContext';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Date TBD';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusLabel(status: AuctionStatus): string {
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

function getStatusBadgeClass(status: AuctionStatus): string {
  switch (status) {
    case 'active': return 'bg-green-600 text-white';
    case 'preview': return 'bg-accent text-white';
    case 'closed':
    case 'settling':
    case 'settled': return 'bg-surface border border-line text-muted';
    case 'cancelled': return 'bg-red-600/10 text-red-600';
    default: return 'bg-surface border border-line text-muted';
  }
}

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Browse',
    desc: 'Explore upcoming and active auction catalogs. View lots, photos, and starting bids.',
  },
  {
    step: '02',
    icon: UserCheck,
    title: 'Register',
    desc: 'Create an account and complete bidder verification to participate in auctions.',
  },
  {
    step: '03',
    icon: Gavel,
    title: 'Bid',
    desc: 'Place bids on individual lots. Proxy bidding available so you never miss a closing.',
  },
  {
    step: '04',
    icon: DollarSign,
    title: 'Win & Pay',
    desc: 'Winning bidders receive an invoice. Payment is due within the deadline set per auction.',
  },
];

function AuctionCardSkeleton() {
  return (
    <div className="bg-surface border border-line overflow-hidden">
      <div className="h-48 animate-pulse bg-bg" />
      <div className="p-6 space-y-3">
        <div className="animate-pulse bg-bg h-3 w-24 rounded-sm" />
        <div className="animate-pulse bg-bg h-5 w-3/4 rounded-sm" />
        <div className="animate-pulse bg-bg h-3 w-1/2 rounded-sm" />
        <div className="animate-pulse bg-bg h-10 w-full rounded-sm mt-4" />
      </div>
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const coverSrc = auction.coverImageUrl || auction.image || '/page-photos/john-deere-harvester.webp';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-surface border border-line overflow-hidden flex flex-col group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverSrc}
          alt={auction.title}
          width={400}
          height={192}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute top-3 left-3 px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getStatusBadgeClass(auction.status)}`}>
          {getStatusLabel(auction.status)}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">
          <Calendar size={10} className="mr-1.5" />
          {formatDateShort(auction.startTime)} – {formatDateShort(auction.endTime)}
        </div>
        <h3 className="text-lg font-black tracking-tighter uppercase mb-1 group-hover:text-accent transition-colors line-clamp-2">
          {auction.title}
        </h3>
        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          <span className="flex items-center gap-1">
            <Gavel size={9} />
            {auction.lotCount} Lots
          </span>
          {auction.totalBids > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={9} />
              {auction.totalBids} Bids
            </span>
          )}
        </div>
        <div className="mt-auto pt-6 border-t border-line flex items-center justify-between">
          <Link
            to={`/auctions/${auction.slug}`}
            className="btn-industrial btn-accent py-3 px-6 text-[10px]"
          >
            View Catalog
          </Link>
          {auction.status === 'active' && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-600">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Auctions() {
  const { theme } = useTheme();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastExpanded, setPastExpanded] = useState(false);

  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await auctionService.getAuctions();
        if (!cancelled) setAuctions(data);
      } catch (err) {
        // Silently allow empty state on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const { featuredAuction, activeAuctions, upcomingAuctions, pastAuctions } = useMemo(() => {
    const active = auctions.filter((a) => a.status === 'active');
    const upcoming = auctions.filter((a) => a.status === 'preview' || a.status === 'draft');
    const past = auctions.filter((a) => a.status === 'closed' || a.status === 'settling' || a.status === 'settled' || a.status === 'cancelled');

    const featured =
      auctions.find((a) => a.featured && (a.status === 'active' || a.status === 'preview')) ||
      active[0] ||
      upcoming[0] ||
      null;

    return {
      featuredAuction: featured,
      activeAuctions: active,
      upcomingAuctions: upcoming,
      pastAuctions: past,
    };
  }, [auctions]);

  const hasAuctions = auctions.length > 0;

  return (
    <div className="bg-bg min-h-screen">
      <Seo
        title="Equipment Auctions | Forestry Equipment Sales"
        description="Browse active and upcoming forestry equipment auctions. Bid on logging machines, land clearing equipment, trucks, and trailers."
        canonicalPath="/auctions"
        imagePath="/page-photos/john-deere-harvester.webp"
        preloadImage="/page-photos/john-deere-harvester.webp"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Forestry Equipment Auctions',
          description: 'Browse active and upcoming forestry equipment auctions.',
          url: 'https://timberequip.com/auctions',
        }}
      />

      <Breadcrumbs />

      <ImageHero imageSrc="/page-photos/john-deere-harvester.webp" imageAlt="John Deere harvester in the forest">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Gavel size={20} className="text-accent" />
            <span className="label-micro text-accent">Auction Center</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            Equipment <br />
            <span className={heroSecondaryClass}>Auctions</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            Verified auction events for forestry and logging equipment. Browse catalogs, register to bid, and win quality machines.
          </p>
        </div>
      </ImageHero>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-16 space-y-20">

        {/* Loading skeletons */}
        {loading && (
          <div>
            <div className="animate-pulse bg-surface h-6 w-40 rounded-sm mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <AuctionCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasAuctions && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-surface border border-line rounded-sm mb-6">
              <Gavel size={28} className="text-accent" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-3">No Auctions Scheduled</h2>
            <p className="text-sm font-medium text-muted max-w-md mb-8">
              There are no active or upcoming auctions at this time. Check back soon or contact support for information on upcoming events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="btn-industrial btn-accent py-4 px-10">
                Contact Support
              </Link>
              <Link to="/search" className="btn-industrial btn-outline py-4 px-10">
                Browse Inventory
              </Link>
            </div>
          </div>
        )}

        {!loading && hasAuctions && (
          <>
            {/* Featured Auction */}
            {featuredAuction && (
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-line pb-4">
                  <h2 className="text-xl font-black tracking-tighter uppercase">Featured Auction</h2>
                  <span className="label-micro text-accent">Highlighted Event</span>
                </div>
                <div className="bg-surface border border-line overflow-hidden">
                  <div className="relative h-[320px] md:h-[400px] overflow-hidden">
                    <img
                      src={featuredAuction.coverImageUrl || featuredAuction.image || '/page-photos/john-deere-harvester.webp'}
                      alt={featuredAuction.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                    <div className={`absolute top-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest ${getStatusBadgeClass(featuredAuction.status)}`}>
                      {getStatusLabel(featuredAuction.status)}
                    </div>
                    {featuredAuction.featured && (
                      <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                        Featured
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white mb-2">
                        {featuredAuction.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-6 text-white/70 text-[10px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={10} />
                          {formatDate(featuredAuction.startTime)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Gavel size={10} />
                          {featuredAuction.lotCount} Lots
                        </span>
                        {featuredAuction.totalBids > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={10} />
                            {featuredAuction.totalBids} Total Bids
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                    <p className="text-sm font-medium text-muted max-w-xl line-clamp-2">
                      {featuredAuction.description}
                    </p>
                    <div className="flex gap-3 flex-shrink-0">
                      <Link
                        to={`/auctions/${featuredAuction.slug}`}
                        className="btn-industrial btn-accent py-4 px-10 whitespace-nowrap"
                      >
                        View Catalog
                        <ArrowRight size={14} className="ml-2" />
                      </Link>
                      <Link
                        to={`/login?redirect=/auctions/${featuredAuction.slug}/register`}
                        className="btn-industrial btn-outline py-4 px-6 whitespace-nowrap"
                      >
                        Register to Bid
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Active Auctions */}
            {activeAuctions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h2 className="text-xl font-black tracking-tighter uppercase">Active Auctions</h2>
                  </div>
                  <span className="label-micro text-muted">{activeAuctions.length} Live</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {activeAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Auctions */}
            {upcomingAuctions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-line pb-4">
                  <h2 className="text-xl font-black tracking-tighter uppercase">Upcoming Auctions</h2>
                  <span className="label-micro text-muted">{upcomingAuctions.length} Scheduled</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {upcomingAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Auctions */}
            {pastAuctions.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setPastExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between border-b border-line pb-4 mb-8 group"
                >
                  <h2 className="text-xl font-black tracking-tighter uppercase group-hover:text-accent transition-colors">
                    Past Auctions
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="label-micro text-muted">{pastAuctions.length} Closed</span>
                    {pastExpanded ? (
                      <ChevronUp size={16} className="text-muted" />
                    ) : (
                      <ChevronDown size={16} className="text-muted" />
                    )}
                  </div>
                </button>
                {pastExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pastAuctions.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* How It Works */}
        <section className="border-t border-line pt-16">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="label-micro text-accent mb-3 block">Process</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">
                How It Works
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.step} className="bg-surface border border-line p-8 flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-4">{step.step}</span>
                <div className="p-3 bg-bg border border-line w-fit mb-6">
                  <step.icon size={20} className="text-accent" />
                </div>
                <h3 className="text-lg font-black tracking-tighter uppercase mb-3">{step.title}</h3>
                <p className="text-[11px] font-medium text-muted leading-relaxed uppercase tracking-wider">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface border border-line p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={16} className="text-accent" />
              <span className="label-micro text-accent">Bidder Registration</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-3 leading-none">
              Register to Bid on <br className="hidden md:block" />Upcoming Auctions
            </h2>
            <p className="text-sm font-medium text-muted max-w-lg">
              Create an account and complete verification to participate in live and timed auctions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <Link
              to="/login?redirect=/auctions"
              className="btn-industrial btn-accent py-5 px-12 whitespace-nowrap"
            >
              Register Now
            </Link>
            <Link to="/contact" className="btn-industrial btn-outline py-5 px-12 whitespace-nowrap">
              Contact Support
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
