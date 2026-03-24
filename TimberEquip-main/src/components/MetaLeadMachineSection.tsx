import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Target,
  BarChart3,
  ArrowRight,
  Store,
  Repeat2,
} from 'lucide-react';
import timberEquipLogo from '../../logos/TimberEquip-Logo.svg';
import { useTheme } from './ThemeContext';

const featureCards = [
  {
    icon: Store,
    title: 'Inventory to Meta Catalog',
    desc: 'Every machine can flow from TimberEquip into your connected Meta catalog for Facebook and Instagram visibility.',
  },
  {
    icon: Target,
    title: 'Targeted Buyer Reach',
    desc: 'We structure machine inventory for category-based ad delivery so dealers can reach serious equipment buyers instead of wasting spend.',
  },
  {
    icon: Repeat2,
    title: 'Retarget Interested Buyers',
    desc: 'When buyers view equipment, TimberEquip can keep your inventory in front of them across Meta properties.',
  },
  {
    icon: BarChart3,
    title: 'Lead Tracking Back to TimberEquip',
    desc: 'Traffic returns to TimberEquip.com so inquiries, machine interest, and performance stay in one system.',
  },
];

export function MetaLeadMachineSection() {
  const { theme } = useTheme();
  const brandLogo = timberEquipLogo;
  const headingClass = theme === 'light' ? 'text-ink' : 'text-white';

  return (
    <section className="border-y border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2">
              <Facebook size={16} className="text-accent" />
              <Instagram size={16} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                Meta Distribution System
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-accent">
                Dealer Visibility
              </p>
              <h2 className={`max-w-3xl text-4xl font-black uppercase tracking-tight md:text-5xl ${headingClass}`}>
                Turn every machine into a traffic and lead asset.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted md:text-base">
                TimberEquip is built to do more than host listings. Dealers can manage
                equipment in one place, connect Meta business assets, push inventory into
                a catalog-ready structure, and drive buyers back to TimberEquip.com where
                leads are actually tracked.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/ad-programs" className="btn-industrial btn-accent">
                Explore Ad Programs
              </Link>
              <Link to="/sell" className="btn-industrial">
                List Equipment
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-sm border border-line bg-surface p-4"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-accent/10 text-accent">
                      <Icon size={18} />
                    </div>
                    <h3 className={`mb-2 text-sm font-black uppercase tracking-wide ${headingClass}`}>
                      {card.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-sm border border-line bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                  Traffic Flow
                </p>
                <h3 className={`mt-2 text-2xl font-black uppercase tracking-tight ${headingClass}`}>
                  TimberEquip -&gt; Meta -&gt; TimberEquip
                </h3>
              </div>
              <img
                src={brandLogo}
                alt="TimberEquip"
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="space-y-4">
              {[
                'Dealer uploads machine to TimberEquip',
                'Inventory is structured for Meta catalog visibility',
                'Ads and retargeting push buyers toward active inventory',
                'Buyer lands back on TimberEquip listing pages',
                'Lead is captured and tied to the correct machine',
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-sm border border-line bg-bg px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent text-[11px] font-black text-white">
                    {index + 1}
                  </div>
                  <div className={`pt-1 text-sm font-bold uppercase tracking-wide ${headingClass}`}>
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-sm border border-accent/20 bg-accent/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">
                Why it matters
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Listing sites wait for buyers. This model gives dealers a way to actively
                market inventory and keep attribution inside TimberEquip.
              </p>
            </div>

            <Link
              to="/ad-programs"
              className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-accent transition-opacity hover:opacity-80"
            >
              See program details <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
