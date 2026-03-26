import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, ShieldCheck, Clock, 
  ArrowRight, CheckCircle2, AlertCircle,
  TrendingUp, Activity, LayoutDashboard,
  ChevronRight, Users, Building,
  Zap, Award
} from 'lucide-react';
import { motion } from 'framer-motion';

export function About() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Editorial Header */}
      <section className="bg-ink text-white py-32 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-sm">
              <Globe className="text-white" size={20} />
            </div>
            <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">Institutional Profile</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-12 leading-none">
            The <span className="text-accent">Forestry Equipment Sales</span> <br />
            Standard
          </h1>
          <p className="text-white/60 text-xl font-medium max-w-3xl leading-relaxed">
            We are the global marketplace for heavy forestry assets. 
            Our system combines institutional-grade market intelligence with secure, efficient liquidation systems.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-32 px-4 md:px-8 bg-bg">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="flex flex-col">
            <span className="label-micro text-accent mb-6 block">Our Mission</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-10 leading-tight">
              Modernizing The <br />
              <span className="text-muted">Forestry Marketplace</span>
            </h2>
            <div className="space-y-8 text-muted font-medium leading-relaxed">
              <p>
                For decades, the forestry equipment market has operated on fragmented data and inefficient transaction procedures. 
                Forestry Equipment Sales was established to provide a unified, transparent platform for global asset exchange.
              </p>
              <p>
                We leverage real-time AMV indexing and verified dealer networks to ensure that every transaction 
                meets the highest standards of technical verification and financial security.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-16">
              {[
                { label: 'Global Reach', value: '142+', sub: 'Countries' },
                { label: 'Equipment Volume', value: '$8.4B', sub: 'Market Cap' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col border-l-2 border-accent pl-6">
                  <span className="text-3xl font-black tracking-tighter uppercase">{stat.value}</span>
                  <span className="label-micro text-muted">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-[4/5] bg-surface border border-line overflow-hidden relative group">
            <img 
              src="https://picsum.photos/seed/forestry-team/1200/1500" 
              alt="Forestry Operations" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/10 transition-colors"></div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-32 px-4 md:px-8 bg-surface">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col items-center text-center mb-24">
            <span className="label-micro text-accent mb-4">Core Policies</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Our Core <span className="text-muted">Values</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Transparency', desc: 'Real-time AMV indexing and full asset history for every listing.', icon: Zap },
              { title: 'Security', desc: 'Institutional-grade encryption and secure escrow systems.', icon: ShieldCheck },
              { title: 'Efficiency', desc: 'Streamlined liquidation and financing systems for rapid deployment.', icon: Activity }
            ].map((value, i) => (
              <div key={i} className="bg-bg border border-line p-12 flex flex-col items-center text-center hover:border-accent transition-colors">
                <div className="w-20 h-20 bg-surface flex items-center justify-center rounded-sm mb-8 border border-line">
                  <value.icon className="text-accent" size={32} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{value.title}</h3>
                <p className="text-xs text-muted font-medium leading-relaxed uppercase tracking-widest">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 px-4 md:px-8 bg-bg">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col mb-24">
            <span className="label-micro text-accent mb-4">Leadership Team</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">The <span className="text-muted">Operators</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Erik Sorenson', role: 'Chief Executive Operator', img: 'https://picsum.photos/seed/erik/400/500' },
              { name: 'Sarah Miller', role: 'Head of Market Intelligence', img: 'https://picsum.photos/seed/sarah/400/500' },
              { name: 'Marcus Chen', role: 'Chief Technical Officer', img: 'https://picsum.photos/seed/marcus/400/500' },
              { name: 'Elena Rodriguez', role: 'Director of Global Sales', img: 'https://picsum.photos/seed/elena/400/500' }
            ].map((member, i) => (
              <div key={i} className="group flex flex-col">
                <div className="aspect-[3/4] bg-surface border border-line overflow-hidden mb-6 relative">
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter mb-1">{member.name}</h4>
                <span className="label-micro text-muted">{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-accent px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-12 leading-none">
            Join The <br />
            <span className="text-ink">Global Standard</span>
          </h2>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/register" className="btn-industrial bg-ink text-white py-5 px-12 text-lg">
              Create Account
            </Link>
            <Link to="/contact" className="btn-industrial bg-white text-ink py-5 px-12 text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
