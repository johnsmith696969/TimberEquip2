import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Code, RefreshCw, Phone, Mail, BarChart3, Shield, Palette, ArrowRight, Check } from 'lucide-react';
import { Seo } from '../components/Seo';

const SETUP_FEE = '$500';

export function DealerHosting() {
  return (
    <>
      <Seo
        title="Hosted Dealer Websites | Forestry Equipment Sales"
        description="Host your equipment inventory on your own website with customizable widgets powered by Forestry Equipment Sales. Real-time sync, lead tracking, and call attribution included."
        canonicalPath="/dealer-hosting"
      />

      <div className="bg-bg min-h-screen">
        {/* Hero */}
        <section className="bg-surface border-b border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-3xl">
              <span className="label-micro text-accent mb-4 block">Dealer Solutions</span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none text-ink mb-8">
                YOUR EQUIPMENT.<br />
                <span className="text-muted">YOUR WEBSITE.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted max-w-2xl mb-10 leading-relaxed">
                Embed a fully customizable inventory widget on your dealer website. Listings stay in sync
                with Forestry Equipment Sales, and every inquiry and call is tracked in your dashboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/contact" className="btn-industrial btn-accent inline-flex items-center gap-2">
                  Get Started <ArrowRight size={16} />
                </Link>
                <Link to="/dealer-onboarding" className="btn-industrial inline-flex items-center gap-2">
                  Become a Dealer
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="label-micro text-accent mb-3 block text-center">Getting Started</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-ink text-center mb-4">HOW IT WORKS</h2>
          <p className="text-sm text-muted text-center mb-12 max-w-xl mx-auto">Three steps to live inventory on your website.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Import Your Inventory', desc: 'Upload via JSON, XML, CSV, or connect your API feed. Your equipment catalog syncs automatically on the schedule you choose.' },
              { title: 'Customize Your Widget', desc: 'Use the visual builder in DealerOS to match your brand — colors, fonts, layout, card style, button placement, and more.' },
              { title: 'Embed & Go Live', desc: 'Copy a single script tag or iframe snippet onto your website. Inventory updates automatically as your feed changes.' },
            ].map((item) => (
              <div key={item.title} className="bg-surface border border-line rounded-sm p-6">
                <h3 className="font-black text-sm uppercase tracking-widest text-ink mb-3">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-surface border-t border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <span className="label-micro text-accent mb-3 block text-center">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-ink text-center mb-12">BUILT FOR DEALERS</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: RefreshCw, title: 'Real-Time Sync', desc: 'Inventory updates flow from your feed to the widget automatically. Hourly, daily, or on-demand.' },
                { icon: Palette, title: 'Visual Customization', desc: 'Match your brand. Control layout, colors, fonts, card style, image sizing, and button placement.' },
                { icon: Mail, title: 'Lead Tracking', desc: 'Every inquiry from your hosted widget routes into your DealerOS lead pipeline with full attribution.' },
                { icon: Phone, title: 'Call Attribution', desc: 'Tracked phone numbers ensure every call from your widget is logged and visible in your dashboard.' },
                { icon: Code, title: 'Easy Integration', desc: 'One script tag or iframe. Works with any website builder \u2014 WordPress, Squarespace, Wix, or custom HTML.' },
                { icon: BarChart3, title: 'Performance Reports', desc: 'Monthly dealer reports with views, leads, calls, and inventory metrics delivered to your inbox.' },
                { icon: Globe, title: 'SEO Benefits', desc: 'Your listings are indexed on Forestry Equipment Sales and linked from your website for maximum visibility.' },
                { icon: Shield, title: 'Enterprise Platform', desc: 'Built on Firebase, Cloud SQL, and Google Cloud. Secure, fast, and scalable for any dealer size.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
                    <Icon size={20} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-ink mb-1">{title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feed Import */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="label-micro text-accent mb-3 block">Feed Integration</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-ink mb-4">INVENTORY IMPORT OPTIONS</h2>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Connect your existing inventory management system or upload directly. We support multiple formats
                and can pull from your API on a schedule.
              </p>
              <ul className="space-y-3">
                {[
                  'JSON feed \u2014 structured API endpoint or file upload',
                  'XML feed \u2014 industry-standard equipment XML',
                  'CSV upload \u2014 spreadsheet-based bulk import',
                  'Direct API \u2014 push inventory via REST endpoint with auth key',
                  'Scheduled sync \u2014 hourly, daily, or weekly automatic pull',
                  'Dry-run preview \u2014 validate before going live',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-ink">
                    <Check size={14} className="text-accent flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface border border-line rounded-sm p-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-ink mb-4">Implementation Options</h3>
              <div className="space-y-4">
                <div className="border-b border-line pb-4">
                  <div className="font-bold text-sm text-ink mb-1">Self-Service</div>
                  <p className="text-xs text-muted">Use DealerOS to configure your feed, customize your widget, and copy the embed code. Full documentation and support included.</p>
                </div>
                <div className="border-b border-line pb-4">
                  <div className="font-bold text-sm text-ink mb-1">Managed Setup</div>
                  <p className="text-xs text-muted">Our team handles feed configuration, widget customization, and website integration. One-time setup fee of {SETUP_FEE}.</p>
                </div>
                <div>
                  <div className="font-bold text-sm text-ink mb-1">Enterprise / Custom</div>
                  <p className="text-xs text-muted">Need a fully custom integration, white-label solution, or API-first approach? Contact us to discuss your requirements.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface border-t border-line">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
            <span className="label-micro text-accent mb-3 block">Next Steps</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-ink mb-4">READY TO GET STARTED?</h2>
            <p className="text-sm text-muted mb-8 max-w-lg mx-auto">
              Join the Forestry Equipment Sales dealer network. List your inventory, host it on your website,
              and let our platform handle the leads, calls, and reporting.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/contact" className="btn-industrial btn-accent inline-flex items-center gap-2">
                Contact Sales <ArrowRight size={16} />
              </Link>
              <a href="tel:+12187200933" className="btn-industrial inline-flex items-center gap-2">
                <Phone size={16} /> (218) 720-0933
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="label-micro text-accent mb-3 block text-center">Support</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-ink text-center mb-10">FREQUENTLY ASKED QUESTIONS</h2>
          <div className="space-y-6">
            {[
              { q: 'What website builders work with the widget?', a: 'Any platform that supports custom HTML or script embeds \u2014 WordPress, Squarespace, Wix, Webflow, Shopify, or any custom-built site.' },
              { q: 'How often does inventory sync?', a: 'You choose: hourly, daily, weekly, or manual. Most dealers use daily sync. Changes appear on your hosted widget within minutes of sync.' },
              { q: 'Are leads tracked separately from marketplace leads?', a: 'Yes. Every inquiry and call from your hosted widget is attributed and visible in your DealerOS dashboard alongside your marketplace leads.' },
              { q: 'Can I customize the look of the widget?', a: 'Fully. The visual builder in DealerOS lets you control colors, fonts, layout, card style, image sizing, buttons, and more to match your brand.' },
              { q: 'What does the managed setup include?', a: `For ${SETUP_FEE}, our team configures your feed connection, customizes your widget to match your website, and installs the embed code on your site.` },
              { q: 'Is there a monthly cost?', a: 'The hosted widget is included with Dealer and Pro Dealer subscriptions. No additional monthly fee for widget hosting.' },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-line pb-5">
                <h3 className="font-bold text-sm text-ink mb-2">{q}</h3>
                <p className="text-xs text-muted leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
