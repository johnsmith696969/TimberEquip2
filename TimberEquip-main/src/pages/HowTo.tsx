import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Bell, Bookmark, UserPlus, Settings, ShieldCheck,
  BarChart3, Truck, ArrowRight, HelpCircle, Gavel,
  FileText, Mail, Phone, CreditCard, Building2, Upload,
} from 'lucide-react';
import { Seo } from '../components/Seo';

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  steps: string[];
  cta?: { label: string; path: string };
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'register',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Getting started on Forestry Equipment Sales takes less than a minute. Your free account gives you access to bookmarks, saved searches, equipment alerts, and inquiry tracking.',
    steps: [
      'Click "Register" in the top navigation or visit the registration page.',
      'Enter your name, email address, and create a password.',
      'Accept the Terms of Service and Privacy Policy.',
      'Verify your email address using the link sent to your inbox.',
      'Log in and start browsing, bookmarking, and inquiring on equipment.',
    ],
    cta: { label: 'Create Account', path: '/register' },
  },
  {
    id: 'search',
    icon: Search,
    title: 'Search & Browse Equipment',
    description: 'Find the right machine using our advanced search filters. Browse by category, manufacturer, model, year, hours, price, condition, and location.',
    steps: [
      'Visit the Inventory page from the main navigation.',
      'Use the search bar to find equipment by keyword, stock number, or serial number.',
      'Click "Category" to open the category browser \u2014 select a parent category or specific subcategory.',
      'Narrow results using the sidebar filters: price range, year range, hours, condition, and location.',
      'Sort results by Best Match, Newest, Price, Year, Hours, Distance, or Most Viewed.',
      'Use the date filter to find recently listed equipment.',
      'Toggle "Auction Items" to see only equipment available in upcoming auctions.',
    ],
    cta: { label: 'Browse Inventory', path: '/search' },
  },
  {
    id: 'alerts',
    icon: Bell,
    title: 'Configure Equipment Alerts',
    description: 'Never miss a new listing. Save your search criteria and get email alerts when matching equipment is listed, prices drop, or inventory changes.',
    steps: [
      'Run a search with the filters that match what you are looking for.',
      'Click "Save Search & Alerts" at the top of the results page.',
      'Name your saved search (e.g., "Tigercat Bunchers Under $200K").',
      'Choose your alert preferences: new listing alerts, price drop alerts, sold status alerts, and restock alerts.',
      'Enter the email address where you want to receive alerts.',
      'Click Save \u2014 you will start receiving email notifications when matching equipment appears.',
      'Manage or delete saved searches from your profile page.',
    ],
    cta: { label: 'Start a Search', path: '/search' },
  },
  {
    id: 'compare',
    icon: BarChart3,
    title: 'Compare Equipment',
    description: 'Side-by-side comparison makes it easy to evaluate multiple machines at once. Compare specs, pricing, hours, condition, and seller information.',
    steps: [
      'Browse search results and click the "Compare" checkbox on the listing cards you want to evaluate.',
      'Select 2 to 4 machines to compare.',
      'Click the "Compare" button that appears at the bottom of the screen.',
      'Review the side-by-side comparison table showing year, hours, price, condition, location, and key specifications.',
      'Click "View Details" to open the full listing for any machine in the comparison.',
      'Click "Inquire" to send a message directly to the seller from the comparison view.',
    ],
    cta: { label: 'Browse & Compare', path: '/search' },
  },
  {
    id: 'bookmarks',
    icon: Bookmark,
    title: 'Bookmark & Track Equipment',
    description: 'Save equipment you are interested in so you can come back to it later. Your bookmarks are synced across devices and visible in your account.',
    steps: [
      'Click the bookmark icon (heart) on any listing card or listing detail page.',
      'If you are not signed in, you will be prompted to log in first.',
      'View all your bookmarked equipment from the Bookmarks page (bookmark icon in the header).',
      'Remove bookmarks by clicking the icon again on any saved listing.',
      'Your bookmarks are used to personalize your search experience over time.',
    ],
    cta: { label: 'View Bookmarks', path: '/bookmarks' },
  },
  {
    id: 'inquire',
    icon: Mail,
    title: 'Inquire on Equipment',
    description: 'Send a message directly to the seller about any piece of equipment. Your inquiry is tracked in the seller\'s dashboard and you receive a confirmation email.',
    steps: [
      'Open any listing detail page.',
      'Click "Inquire" or "Contact Seller" to open the inquiry form.',
      'Fill in your name, email, phone number, and message.',
      'Submit the inquiry \u2014 the seller receives an email notification immediately.',
      'You receive a confirmation email with the inquiry details.',
      'The seller can respond directly to your email or call you.',
      'Inquiries are tracked in the admin dashboard for dealers and sellers.',
    ],
  },
  {
    id: 'sell',
    icon: Upload,
    title: 'Sell Equipment',
    description: 'List your equipment for sale on the largest forestry equipment marketplace. Choose the subscription plan that fits your operation.',
    steps: [
      'Click "Sell Equipment" in the navigation.',
      'Choose your seller type: Owner-Operator (single machine) or Dealer (inventory).',
      'Complete the enrollment form and accept the seller terms.',
      'Complete payment through Stripe checkout.',
      'Create your first listing: title, description, category, specs, photos, and price.',
      'Submit for review \u2014 the admin team will approve or provide feedback.',
      'Once approved, your listing goes live on the marketplace.',
      'Track views, leads, calls, and inquiries from your seller dashboard.',
    ],
    cta: { label: 'Start Selling', path: '/sell' },
  },
  {
    id: 'subscriptions',
    icon: CreditCard,
    title: 'Subscription Plans',
    description: 'Choose the plan that matches your selling needs. All plans include marketplace listing, lead tracking, call attribution, and seller dashboard access.',
    steps: [
      'Owner-Operator: list individual machines with a per-listing subscription.',
      'Dealer: list up to 50 machines with a monthly subscription. Includes DealerOS, feed import, and storefront.',
      'Pro Dealer: unlimited listings, priority placement, advanced analytics, managed accounts, and API access.',
      'Manage your subscription, view invoices, and update payment methods from the Billing portal.',
      'Upgrade or downgrade at any time \u2014 changes are prorated.',
      'Cancel anytime \u2014 your listings remain active through the end of your billing period.',
    ],
    cta: { label: 'View Plans', path: '/ad-programs' },
  },
  {
    id: 'dealer-feeds',
    icon: Building2,
    title: 'Dealer Inventory Feeds',
    description: 'Import your inventory from JSON, XML, CSV, or connect via API. Sync automatically on a schedule you choose. Available for Dealer and Pro Dealer accounts.',
    steps: [
      'Log in to your dealer account and navigate to DealerOS.',
      'Choose your feed format: JSON, XML, CSV, or direct API.',
      'Configure the feed source URL or upload a file.',
      'Run a dry-run preview to validate the data before going live.',
      'Review the preview: items to create, update, skip, and any errors.',
      'Run the live import to publish inventory to the marketplace.',
      'Set up automatic sync: hourly, daily, or weekly.',
      'Monitor feed logs and history from the DealerOS dashboard.',
    ],
    cta: { label: 'Learn About Feeds', path: '/dealer-hosting' },
  },
  {
    id: 'auctions',
    icon: Gavel,
    title: 'Auctions',
    description: 'Browse and bid on equipment in timed online auctions. Registration, identity verification, and payment preauthorization are required before bidding.',
    steps: [
      'Browse active and upcoming auctions from the Auctions page.',
      'Click on an auction to view lots, terms, and schedule.',
      'Register as a bidder: complete the address form, accept auction terms, and verify your identity.',
      'Add a payment method for bid preauthorization.',
      'Once approved, place bids on individual lots.',
      'Receive outbid notifications by email if another bidder exceeds your bid.',
      'If you win, an invoice is generated with the winning bid, buyer premium, and applicable taxes.',
      'Complete payment and arrange pickup or shipping.',
    ],
    cta: { label: 'View Auctions', path: '/auctions' },
  },
  {
    id: 'account',
    icon: Settings,
    title: 'Manage Your Account',
    description: 'Update your profile, notification preferences, security settings, and subscription from your account dashboard.',
    steps: [
      'Click your name or profile icon in the header to access your account.',
      'Update your display name, email, phone number, and company.',
      'Enable or disable email notifications for marketplace alerts and performance summaries.',
      'Set up two-factor authentication (SMS MFA) for additional security.',
      'Reset your password from the login page if needed.',
      'Delete your account from the profile settings \u2014 your data is retained for 90 days per our retention policy.',
    ],
    cta: { label: 'Go to Profile', path: '/profile' },
  },
  {
    id: 'financing',
    icon: Truck,
    title: 'Equipment Financing',
    description: 'Explore financing options for your equipment purchase. Use the payment calculator and submit a financing inquiry directly from any listing.',
    steps: [
      'Visit the Financing page for an overview of financing options.',
      'Use the Equipment Finance Calculator to estimate monthly payments.',
      'From any listing detail page, click "Financing" to submit a financing inquiry.',
      'Fill in the application details and submit \u2014 a financing specialist will follow up.',
      'Financing inquiries are tracked and confirmed by email.',
    ],
    cta: { label: 'Financing Info', path: '/financing' },
  },
  {
    id: 'support',
    icon: HelpCircle,
    title: 'Getting Help',
    description: 'Need assistance? Our support team is available by phone, email, and through the Help Center.',
    steps: [
      'Visit the Help Center for articles on common topics.',
      'Browse the FAQ for quick answers.',
      'Contact support by email at support@forestryequipmentsales.com.',
      'Call us at (218) 720-0933 during business hours.',
      'Use the Contact page to submit a support request.',
    ],
    cta: { label: 'Help Center', path: '/help-center' },
  },
];

export function HowTo() {
  return (
    <>
      <Seo
        title="How to Use Forestry Equipment Sales | Getting Started Guide"
        description="Learn how to search, compare, bookmark, and buy forestry equipment. Set up equipment alerts, manage your account, sell equipment, and configure dealer inventory feeds."
        canonicalPath="/how-to"
      />

      <div className="bg-bg min-h-screen">
        {/* Hero */}
        <section className="bg-surface border-b border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-3xl">
              <span className="label-micro text-accent mb-4 block">Getting Started</span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none text-ink mb-8">
                HOW TO USE<br />
                <span className="text-muted">FORESTRY EQUIPMENT SALES</span>
              </h1>
              <p className="text-base sm:text-lg text-muted max-w-2xl mb-10 leading-relaxed">
                Everything you need to know about searching, buying, selling, and managing equipment
                on the Forestry Equipment Sales marketplace.
              </p>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {GUIDE_SECTIONS.map(({ id, icon: Icon, title }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2 px-3 py-2 border border-line rounded-sm text-[10px] font-bold uppercase tracking-widest text-muted hover:text-accent hover:border-accent transition-colors"
              >
                <Icon size={14} className="text-accent flex-shrink-0" />
                <span className="truncate">{title}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Guide Sections */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          {GUIDE_SECTIONS.map(({ id, icon: Icon, title, description, steps, cta }, index) => (
            <div key={id} id={id} className={`py-12 ${index > 0 ? 'border-t border-line' : ''}`}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex-shrink-0 bg-accent/10 border border-accent/20 flex items-center justify-center rounded-sm">
                  <Icon size={24} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-ink">{title}</h2>
                  <p className="text-sm text-muted leading-relaxed mt-2 max-w-2xl">{description}</p>
                </div>
              </div>

              <ol className="space-y-3 ml-16">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-ink/5 border border-line rounded-sm flex items-center justify-center text-[10px] font-black text-muted">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              {cta && (
                <div className="ml-16 mt-6">
                  <Link to={cta.path} className="btn-industrial btn-accent inline-flex items-center gap-2 text-xs">
                    {cta.label} <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="bg-surface border-t border-line">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
            <span className="label-micro text-accent mb-3 block">Need More Help?</span>
            <h2 className="text-3xl font-black tracking-tighter text-ink mb-4">STILL HAVE QUESTIONS?</h2>
            <p className="text-sm text-muted mb-8 max-w-lg mx-auto">
              Our support team is here to help. Contact us by phone, email, or visit the Help Center.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/help-center" className="btn-industrial btn-accent inline-flex items-center gap-2">
                Help Center <ArrowRight size={14} />
              </Link>
              <Link to="/contact" className="btn-industrial inline-flex items-center gap-2">
                Contact Support
              </Link>
              <a href="tel:+12187200933" className="btn-industrial inline-flex items-center gap-2">
                <Phone size={14} /> (218) 720-0933
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
