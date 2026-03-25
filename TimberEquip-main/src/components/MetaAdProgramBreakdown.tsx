import React from 'react';
import { motion } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Store,
  Target,
  Repeat2,
  BadgeDollarSign,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from './ThemeContext';

const programRows = [
  {
    icon: Store,
    title: 'Catalog Setup',
    copy: 'We structure dealer inventory so machines can be organized for Meta catalog distribution and product-set based promotion.',
  },
  {
    icon: Target,
    title: 'Buyer Targeting',
    copy: 'Campaigns can be organized around equipment categories, geography, and dealer priorities instead of random boosted posts.',
  },
  {
    icon: Repeat2,
    title: 'Retargeting',
    copy: 'Interested buyers can continue seeing active inventory after visiting TimberEquip machine pages.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Budget Control',
    copy: 'Programs can be limited by monthly budget caps, category selection, and dealer-level approval rules.',
  },
];

const bullets = [
  'Bring traffic back to TimberEquip listings',
  'Keep dealer inventory tied to one system of record',
  'Support lead tracking by machine and source',
  'Create a cleaner path toward Meta-connected ad programs',
];

export function MetaAdProgramBreakdown() {
  const { theme } = useTheme();
  const headingClass = theme === 'light' ? 'text-ink' : 'text-white';

  return (
    <section className="border border-line bg-surface">
      <div className="px-5 py-8 md:px-8 md:py-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-line bg-bg px-3 py-2">
              <Facebook size={16} className="text-accent" />
              <Instagram size={16} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                Meta Program Layer
              </span>
            </div>

            <h2 className={`text-3xl font-black uppercase tracking-tight md:text-4xl ${headingClass}`}>
              How TimberEquip powers Meta visibility
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted md:text-base">
              TimberEquip is designed to give dealers a controlled path into Meta/Facebook promotion without turning Meta into the source of truth. Machines
              stay managed inside TimberEquip, and ad traffic comes back to your listing
              pages where lead tracking belongs.
            </p>
          </div>

          <div className="rounded-sm border border-accent/20 bg-accent/5 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">
              Program Intent
            </p>
            <p className={`mt-1 text-sm font-bold uppercase tracking-wide ${headingClass}`}>
              Visibility + retargeting + attribution
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {programRows.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="rounded-sm border border-line bg-bg p-5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-sm bg-accent/10 text-accent">
                  <Icon size={20} />
                </div>
                <h3 className={`mb-2 text-sm font-black uppercase tracking-wide ${headingClass}`}>
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-muted">{item.copy}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-sm border border-line bg-bg p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
              Included Direction
            </p>
            <div className="mt-4 space-y-3">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" />
                  <p className="text-sm leading-6 text-muted">{bullet}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-line bg-bg p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
              Recommended flow
            </p>

            <div className="mt-4 space-y-3">
              {[
                'Dealer uploads machine to TimberEquip',
                'Machine is approved and published',
                'Inventory is prepared for Meta catalog structure',
                'Traffic campaigns point buys back to dealer storefronts on TimberEquip.com',
                'Lead is captured and routed to the right seller',
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center justify-between rounded-sm border border-line px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-[11px] font-black text-white">
                      {index + 1}
                    </div>
                    <span className={`text-sm font-bold uppercase tracking-wide ${headingClass}`}>
                      {step}
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
