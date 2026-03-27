import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Facebook,
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { getListEquipmentPath } from '../utils/sellerAccess';

const BRAND_ASSET_VERSION = '20260327a';
const LIGHT_HEADER_LOGO = `/Forestry_Equipment_Sales_Logo.svg?v=${BRAND_ASSET_VERSION}`;
const DARK_HEADER_LOGO = `/Forestry_Equipment_Sales_Logo_Dusk.svg?v=${BRAND_ASSET_VERSION}`;

export function MetaLeadMachineSection() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const brandLogo = theme === 'dark' ? DARK_HEADER_LOGO : LIGHT_HEADER_LOGO;
  const brandLogoAlt = 'Forestry Equipment Sales';
  const headingClass = theme === 'light' ? 'text-ink' : 'text-white';
  const listEquipmentPath = getListEquipmentPath(user, isAuthenticated);

  return (
    <section className="border-y border-line bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2">
              <Facebook size={16} className="text-accent" />
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
                Forestry Equipment Sales is built to do more than host listings. Dealers can manage
                equipment in one place, connect Meta business assets, push inventory into
                a catalog-ready structure, and drive buyers back to their dealer page on
                Forestry Equipment Sales, where leads are tracked within their profile. We can also
                feed dealer websites directly with their active Forestry Equipment Sales listings.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/ad-programs" className="btn-industrial btn-accent">
                Explore Ad Programs
              </Link>
              <Link to={listEquipmentPath} className="btn-industrial">
                List Equipment
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-sm border border-line bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <img
              src={brandLogo}
              alt={brandLogoAlt}
              className="h-12 w-auto object-contain"
            />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-accent">
              Dealer Website Syndication Ready
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
              We can push each dealer's active Forestry Equipment Sales listings into their own website
              feed so inventory stays synced without duplicate work.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
