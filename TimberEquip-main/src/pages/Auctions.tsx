import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight, Gavel, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { Auction } from '../types';

// Sample auction data for display/testing
const SAMPLE_AUCTIONS: Auction[] = [
  {
    id: 'auction-001',
    title: 'Spring Equipment Clearance',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Portland, Oregon',
    type: 'Live',
    status: 'Upcoming',
    itemCount: 48,
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=500&fit=crop',
    featured: true,
  },
  {
    id: 'auction-002',
    title: 'Forestry Equipment Online Event',
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Remote/Online',
    type: 'Online',
    status: 'Upcoming',
    itemCount: 156,
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=500&fit=crop',
  },
  {
    id: 'auction-003',
    title: 'Timed Liquidation Auction',
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Duluth, Minnesota',
    type: 'Timed',
    status: 'Upcoming',
    itemCount: 72,
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=500&fit=crop',
  },
  {
    id: 'auction-004',
    title: 'Heavy Equipment Auction',
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Eugene, Oregon',
    type: 'Live',
    status: 'Upcoming',
    itemCount: 94,
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=500&fit=crop',
  },
  {
    id: 'auction-005',
    title: 'Seasonal Buyer Event',
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Bend, Oregon',
    type: 'Online',
    status: 'Upcoming',
    itemCount: 63,
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=500&fit=crop',
  },
  {
    id: 'auction-006',
    title: 'Q2 Forestry Tech Showcase',
    date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Salem, Oregon',
    type: 'Live',
    status: 'Upcoming',
    itemCount: 41,
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=500&fit=crop',
  },
];

export function Auctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredAuctions, setRegisteredAuctions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 14, minutes: 32, seconds: 45 });

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

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRegister = (id: string) => {
    if (!registeredAuctions.includes(id)) {
      setRegisteredAuctions([...registeredAuctions, id]);
    }
  };

  // Use sample data if no auctions exist
  const displayAuctions = auctions.length > 0 ? auctions : SAMPLE_AUCTIONS;

  if (loading && auctions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <img 
          src="https://picsum.photos/seed/auction_hero/1920/1080?grayscale" 
          alt="Auction Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
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
              Live Auctions
            </h1>
            <p className="text-muted font-bold tracking-widest uppercase text-sm max-w-2xl mx-auto">
              The most efficient way to liquidate or acquire high-value logging assets globally.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Auction */}
      <section className="px-4 md:px-8 -mt-20 relative z-20 mb-24">
        <div className="max-w-6xl mx-auto">
          {displayAuctions.filter((a: Auction) => a.featured).map((auction: Auction) => (
            <motion.div 
              key={auction.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-line rounded-sm overflow-hidden flex flex-col lg:flex-row shadow-2xl"
            >
              <div className="lg:w-1/2 relative h-[300px] lg:h-auto">
                <img 
                  src={auction.image} 
                  alt={auction.title} 
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
                    <span className="text-2xl font-black leading-none">15</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest">APR</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{auction.title}</h2>
                    <div className="flex items-center text-muted text-xs font-bold uppercase tracking-widest mt-1">
                      <MapPin size={12} className="mr-1" /> {auction.location}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-bg border border-line rounded-sm">
                      <Users size={16} className="text-accent" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted font-bold uppercase tracking-widest">Registered</span>
                      <span className="text-sm font-black tracking-tight">1,245 Bidders</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-bg border border-line rounded-sm">
                      <Clock size={16} className="text-accent" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted font-bold uppercase tracking-widest">Lots</span>
                      <span className="text-sm font-black tracking-tight">{auction.itemCount} Equipment</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8 p-6 bg-bg border border-line rounded-sm">
                  <span className="block text-[10px] text-muted font-black uppercase tracking-[0.2em] mb-4">Auction Starts In</span>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                      <div key={unit} className="text-center">
                        <div className="text-2xl font-black text-ink leading-none mb-1">{value.toString().padStart(2, '0')}</div>
                        <div className="text-[8px] font-bold text-muted uppercase tracking-widest">{unit}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => handleRegister(auction.id)}
                    className={`btn-industrial flex-1 py-4 ${registeredAuctions.includes(auction.id) ? 'bg-emerald-500 text-white border-emerald-500' : 'btn-accent'}`}
                  >
                    {registeredAuctions.includes(auction.id) ? 'Registered ✓' : 'Register to Bid'}
                  </button>
                  <button className="btn-industrial btn-outline flex-1 py-4">View Catalog</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* All Auctions Grid */}
      <section className="px-4 md:px-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12 border-b border-line pb-4">
            <h3 className="text-xl font-black tracking-tighter uppercase">Upcoming Events</h3>
            <div className="flex space-x-4">
              <button className="text-[10px] font-black uppercase tracking-widest text-accent border-b-2 border-accent pb-1">All Events</button>
              <button className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-ink transition-colors pb-1">Live</button>
              <button className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-ink transition-colors pb-1">Online</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayAuctions.map((auction: Auction) => (
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
                    {auction.type}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">
                    <Calendar size={10} className="mr-1.5" />
                    {new Date(auction.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h4 className="text-lg font-black tracking-tighter uppercase mb-2 group-hover:text-accent transition-colors">{auction.title}</h4>
                  <div className="flex items-center text-muted text-[10px] font-bold uppercase tracking-widest mb-6">
                    <MapPin size={10} className="mr-1" /> {auction.location}
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-line">
                    <div className="flex items-center space-x-2">
                      <Timer size={14} className="text-muted" />
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        {registeredAuctions.includes(auction.id) ? 'REGISTRATION ACTIVE' : 'Starts in 12d'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleRegister(auction.id)}
                      className="text-[10px] font-black uppercase tracking-widest flex items-center hover:text-accent transition-colors"
                    >
                      {registeredAuctions.includes(auction.id) ? 'Registered' : 'Register'} <ArrowRight size={12} className="ml-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / Alerts */}
      <section className="bg-ink py-24 px-4 md:px-8 text-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-6">Never Miss a Lot</h2>
          <p className="text-muted font-bold tracking-widest uppercase text-xs mb-12">
            Sign up for auction alerts and get notified when new equipment matches your criteria.
          </p>
          <form className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <input 
              type="email" 
              placeholder="ENTER EMAIL ADDRESS..." 
              className="flex-1 bg-surface/10 border border-white/20 px-6 py-4 text-xs font-bold tracking-widest uppercase focus:outline-none focus:border-accent text-white"
            />
            <button className="btn-industrial btn-accent py-4 px-12 text-xs">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}
