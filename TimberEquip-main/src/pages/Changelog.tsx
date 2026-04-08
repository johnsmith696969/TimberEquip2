import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ShieldCheck, BarChart3, Zap, Megaphone, Gavel } from 'lucide-react';
import { Seo } from '../components/Seo';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  icon: React.ReactNode;
  changes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.8.0',
    date: 'April 7, 2026',
    title: 'Security Hardening & SEO',
    icon: <ShieldCheck className="text-accent" size={24} />,
    changes: [
      'Hardened Content Security Policy for production environments',
      'Restricted CORS allowlist to production-only domains',
      'reCAPTCHA Enterprise now fails closed with automatic retry',
      'Added npm audit security scanning in CI pipeline',
      'Added security.txt disclosure policy',
      'Manufacturer buying guides on landing pages',
      'Subcategory explainer content with buying tips',
    ],
  },
  {
    version: '2.7.0',
    date: 'April 5, 2026',
    title: 'Brand Update & Auctions',
    icon: <Gavel className="text-accent" size={24} />,
    changes: [
      'Full brand refresh — updated logos, color palette, and typography',
      'Live auction system with real-time bidding and outbid notifications',
      'Auction invoicing with automated buyer emails',
      'Bidder registration and approval workflow',
      'Tax exemption certificate uploads for auction buyers',
    ],
  },
  {
    version: '2.6.0',
    date: 'March 29, 2026',
    title: 'Dealer OS & Saved Equipment',
    icon: <BarChart3 className="text-accent" size={24} />,
    changes: [
      'Dealer OS dashboard for managing inventory, leads, and analytics',
      'Saved equipment and search alert notifications',
      'Equipment comparison tool (side-by-side specs)',
      'Bulk import toolkit for dealer inventory (CSV + JSON)',
      'Automated dealer feed ingestion',
    ],
  },
  {
    version: '2.5.0',
    date: 'March 15, 2026',
    title: 'Billing & Subscriptions',
    icon: <Zap className="text-accent" size={24} />,
    changes: [
      'Stripe-powered subscription tiers for dealers',
      'Automated invoicing and payment receipts',
      'Usage-based billing for premium listings',
      'Seller payout tracking and management',
      'Subscription success and management pages',
    ],
  },
  {
    version: '2.4.0',
    date: 'March 1, 2026',
    title: 'SEO Landing Pages',
    icon: <Rocket className="text-accent" size={24} />,
    changes: [
      'Dynamic SEO landing pages for manufacturers, categories, models, and states',
      'Structured data (JSON-LD) for Product, CollectionPage, BreadcrumbList, FAQPage',
      'Canonical URLs and Open Graph meta for all pages',
      'Sitemap generation with image tags',
      'Blog and news content management system',
    ],
  },
  {
    version: '2.3.0',
    date: 'February 15, 2026',
    title: 'Ad Programs & Marketing',
    icon: <Megaphone className="text-accent" size={24} />,
    changes: [
      'Meta Lead Machine integration for dealer advertising',
      'Ad program breakdown and ROI tracking',
      'Financing calculator for equipment loans',
      'Logistics and transport estimation tools',
    ],
  },
];

export function Changelog() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
      <Seo
        title="Changelog | Forestry Equipment Sales"
        description="See what's new at Forestry Equipment Sales. Product updates, new features, security improvements, and platform enhancements."
        canonicalPath="/changelog"
        ogType="website"
        imagePath="/Forestry_Equipment_Sales_Logo.png?v=20260405c"
      />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-12"
        >
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Product Updates</span>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              Changelog
            </h1>
            <p className="text-muted font-medium uppercase tracking-widest text-xs">
              New features, improvements, and fixes
            </p>
          </div>

          <div className="flex flex-col space-y-8">
            {CHANGELOG.map((entry, index) => (
              <motion.div
                key={entry.version}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-surface border border-line p-8 flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {entry.icon}
                    <h2 className="text-xl font-black uppercase tracking-tighter">{entry.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted font-mono">
                    <span className="bg-accent/10 text-accent px-2 py-1 font-bold">{entry.version}</span>
                    <span>{entry.date}</span>
                  </div>
                </div>
                <ul className="space-y-2 pl-1">
                  {entry.changes.map((change) => (
                    <li key={change} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {change}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
