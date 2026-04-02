import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, HelpCircle, Mail, Phone } from 'lucide-react';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';

interface FaqCategory {
  title: string;
  items: { question: string; answer: string }[];
}

const faqCategories: FaqCategory[] = [
  {
    title: 'Buying Equipment',
    items: [
      {
        question: 'How do I search for equipment?',
        answer: 'Use the Browse Inventory page to filter by category, manufacturer, model, year, hours, price, and location. You can save searches and set up alerts to be notified when matching equipment is listed.',
      },
      {
        question: 'How do I contact a seller?',
        answer: 'Click "Send Inquiry" on any listing to message the seller directly. You can also call the number shown on the listing or request financing and logistics quotes from the listing page.',
      },
      {
        question: 'What is Approximate Market Value (AMV)?',
        answer: 'AMV is a real-time estimate of equipment value based on comparable listings with similar year, hours, and price. It helps buyers and sellers understand fair market pricing. AMV requires at least two comparable listings to calculate.',
      },
      {
        question: 'Can I compare equipment side by side?',
        answer: 'Yes. Add listings to your compare list from search results, then view them side by side on the Compare page to evaluate specs, pricing, and condition.',
      },
    ],
  },
  {
    title: 'Selling Equipment',
    items: [
      {
        question: 'How do I list my equipment for sale?',
        answer: 'Create an account, choose List Equipment, and add clear photos, a detailed description, and your contact information. From there you can manage the listing from your account.',
      },
      {
        question: 'How long will my listing stay online?',
        answer: 'Listings are active for 30 days. You can renew, edit, or remove them any time from your account dashboard.',
      },
      {
        question: 'What should I do after my item sells?',
        answer: 'Log in and update the listing status or remove the machine so buyers see accurate inventory. If you need help, our team can assist with that as well.',
      },
      {
        question: 'How do photos and watermarks work?',
        answer: 'Upload high-quality photos of your equipment. Images are automatically processed into optimized formats. A subtle watermark is applied to protect your images from unauthorized use.',
      },
    ],
  },
  {
    title: 'Subscriptions & Featured Listings',
    items: [
      {
        question: 'What seller plans are available?',
        answer: 'We offer Owner-Operator, Dealer, and Pro Dealer plans. Each tier includes different listing caps, featured listing slots, and storefront features. Visit the Ad Programs page for full details.',
      },
      {
        question: 'What are featured listings?',
        answer: 'Featured listings appear at the top of search results and on the home page. Owner-Operator accounts get 1 featured slot, Dealers get 3, and Pro Dealers get 6. You can toggle featured status from your account dashboard.',
      },
      {
        question: 'How do I cancel or change my subscription?',
        answer: 'Manage your subscription from your account profile. You can upgrade, downgrade, or cancel at any time. Contact support if you need assistance.',
      },
    ],
  },
  {
    title: 'Financing',
    items: [
      {
        question: 'Do you offer financing?',
        answer: 'Yes. We work with financing partners who understand forestry and heavy equipment. Start on the Financing page or click the Financing button on any listing to submit an application.',
      },
      {
        question: 'What are typical financing terms?',
        answer: 'Terms vary by lender, equipment value, and buyer qualifications. Common terms range from 36 to 84 months. Use the payment calculator on any listing to estimate monthly payments.',
      },
    ],
  },
  {
    title: 'Logistics & Transport',
    items: [
      {
        question: 'Can I get transport quotes?',
        answer: 'Yes. Use the logistics request form on any listing to tell us what needs to move and where. Our team can help coordinate transport options and provide quotes.',
      },
      {
        question: 'Do you handle international shipping?',
        answer: 'We can help coordinate transport logistics for domestic and international shipments. Contact our logistics team for specific requirements and pricing.',
      },
    ],
  },
  {
    title: 'Dealer Program',
    items: [
      {
        question: 'Can dealers bulk upload inventory?',
        answer: 'Yes. Dealer and Pro Dealer accounts include inventory tools built for larger seller catalogs. Contact us if you want help getting your storefront set up.',
      },
      {
        question: 'What is a dealer storefront?',
        answer: 'Dealer and Pro Dealer accounts get a dedicated storefront page showcasing all their listings, company information, and branding. Storefronts are discoverable in the dealer network.',
      },
      {
        question: 'How do I become a verified dealer?',
        answer: 'Dealer verification is based on your account role and subscription. Dealers and Pro Dealers are automatically verified. Individual sellers can be manually verified by our admin team.',
      },
    ],
  },
  {
    title: 'Account & Support',
    items: [
      {
        question: 'How do I create an account?',
        answer: 'Click Sign Up and register with your email or Google account. You can then choose a seller plan if you want to list equipment, or browse as a member.',
      },
      {
        question: 'How do I contact support?',
        answer: 'Use the Contact page, call (218) 720-0933 Monday through Friday 8am-5pm CST, or email support@forestryequipmentsales.com. Email support is available 8am-10pm CST.',
      },
      {
        question: 'Is my information secure?',
        answer: 'Yes. We use Firebase Authentication with TLS encryption, reCAPTCHA Enterprise for bot protection, and industry-standard security practices to protect your account and data.',
      },
    ],
  },
];

const faqItems = faqCategories.flatMap((cat) => cat.items);

export function Faq() {
  const { theme } = useTheme();
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';
  const linkPanelClass = theme === 'dark' ? 'border border-white/10 bg-[#1C1917] text-white' : 'border border-line bg-surface text-ink';
  const linkPanelRuleClass = theme === 'dark' ? 'border-white/10 text-white' : 'border-line text-ink';
  const [openIndex, setOpenIndex] = useState<string>('');

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Logging Equipment Marketplace FAQ | Buyers, Sellers, and Dealers"
        description="Find answers about buying, selling, financing, shipping, dealer storefronts, approvals, and equipment listings on Forestry Equipment Sales."
        canonicalPath="/faq"
        imagePath="/page-photos/winter-log-road.webp"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'FAQPage',
              mainEntity: faqItems.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://timberequip.com/' },
                { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://timberequip.com/faq' },
              ],
            },
          ],
        }}
      />

      <ImageHero imageSrc="/page-photos/faq.webp" imageAlt="Frequently asked questions about forestry equipment">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <HelpCircle className="text-accent" size={20} />
            <span className="label-micro text-accent">Frequently Asked Questions</span>
          </div>
          <h1 className={`mb-8 text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl ${heroHeadingClass}`}>
            Answers For
            <br />
            <span className={heroSecondaryClass}>Buyers And Sellers</span>
          </h1>
          <p className={`max-w-3xl text-base font-medium leading-relaxed md:text-lg ${heroBodyClass}`}>
            Quick answers to common questions about listing equipment, financing, logistics, dealer programs,
            and support at Forestry Equipment Sales.
          </p>
        </div>
      </ImageHero>

      <section className="bg-bg px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-8">
            <div className="border border-line bg-surface p-8 md:p-10">
              <span className="label-micro mb-4 block text-accent">Need Help Fast?</span>
              <h2 className="mb-4 text-3xl font-black uppercase tracking-tighter">
                Reach The
                <span className="text-muted"> Support Team</span>
              </h2>
              <p className="mb-8 text-sm font-medium leading-relaxed text-muted">
                If your question is about a listing, financing request, dealer setup, or transport coordination,
                we can point you in the right direction quickly.
              </p>
              <div className="space-y-4">
                <a href="tel:+12187200933" className="flex items-start space-x-3 border border-line bg-bg p-4 transition-colors hover:border-accent">
                  <Phone className="mt-0.5 text-accent" size={18} />
                  <div>
                    <span className="label-micro block">Customer Support</span>
                    <span className="text-sm font-black tracking-tight">(218) 720-0933</span>
                  </div>
                </a>
                <a href="mailto:support@forestryequipmentsales.com" className="flex min-w-0 items-start space-x-3 border border-line bg-bg p-4 transition-colors hover:border-accent">
                  <Mail className="mt-0.5 text-accent" size={18} />
                  <div className="min-w-0">
                    <span className="label-micro block">Email Support</span>
                    <span className="block break-all text-sm font-black tracking-tight">support@forestryequipmentsales.com</span>
                  </div>
                </a>
              </div>
            </div>

            <div className={`${linkPanelClass} p-8 md:p-10`}>
              <span className="label-micro mb-4 block text-accent">Popular Pages</span>
              <div className="space-y-4">
                <Link to="/financing" className={`flex items-center justify-between border-b pb-4 text-sm font-black uppercase tracking-widest transition-colors hover:text-accent ${linkPanelRuleClass}`}>
                  Financing
                  <ArrowRight size={16} />
                </Link>
                <Link to="/logistics" className={`flex items-center justify-between border-b pb-4 text-sm font-black uppercase tracking-widest transition-colors hover:text-accent ${linkPanelRuleClass}`}>
                  Logistics
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className={`flex items-center justify-between text-sm font-black uppercase tracking-widest transition-colors hover:text-accent ${theme === 'dark' ? 'text-white' : 'text-ink'}`}>
                  Contact Us
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-4">{category.title}</h3>
                <div className="space-y-3">
                  {category.items.map((item) => {
                    const isOpen = item.question === openIndex;
                    return (
                      <div key={item.question} className="border border-line bg-surface">
                        <button
                          type="button"
                          onClick={() => setOpenIndex(isOpen ? '' : item.question)}
                          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left md:px-8"
                        >
                          <span className="text-base font-black uppercase tracking-tight md:text-lg">{item.question}</span>
                          <ChevronDown
                            size={18}
                            className={`shrink-0 text-accent transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isOpen ? (
                          <div className="border-t border-line px-6 py-5 md:px-8">
                            <p className="text-sm font-medium leading-relaxed text-muted md:text-base">{item.answer}</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
