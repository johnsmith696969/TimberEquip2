import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, HelpCircle, Mail, Phone } from 'lucide-react';
import { Seo } from '../components/Seo';

const faqItems = [
  {
    question: 'How do I list my equipment for sale?',
    answer:
      'Create an account, choose List Equipment, and add clear photos, a detailed description, and your contact information. From there you can manage the listing from your account.',
  },
  {
    question: 'How long will my listing stay online?',
    answer:
      'Listings are active for 30 days. You can renew, edit, or remove them any time from your account dashboard.',
  },
  {
    question: 'Can dealers bulk upload inventory?',
    answer:
      'Yes. Dealer and Pro Dealer accounts include inventory tools built for larger seller catalogs. Contact us if you want help getting your storefront set up.',
  },
  {
    question: 'Do you offer financing?',
    answer:
      'Yes. We work with financing partners who understand forestry and heavy equipment. Start on the Financing page to submit an application.',
  },
  {
    question: 'Can I get transport quotes?',
    answer:
      'Yes. Use the logistics request form to tell us what needs to move, and our team can help coordinate transport options.',
  },
  {
    question: 'What should I do after my item sells?',
    answer:
      'Log in and update the listing status or remove the machine so buyers see accurate inventory. If you need help, our team can assist with that as well.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'Use the Contact page, call (218) 720-0933, or email info@forestryequipmentsales.com and we will get back to you.',
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="FAQ | Forestry Equipment Sales"
        description="Find answers to common questions about listing equipment, financing, logistics, dealer accounts, and marketplace support."
        canonicalPath="/faq"
      />

      <section className="relative overflow-hidden border-b border-line bg-surface px-4 py-24 md:px-8 md:py-28">
        <div className="absolute right-0 top-0 h-full w-1/3 translate-x-1/2 skew-x-12 bg-accent/10" />
        <div className="relative z-10 mx-auto max-w-[1600px]">
          <div className="mb-6 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink">
              <HelpCircle className="text-accent" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Frequently Asked Questions</span>
          </div>
          <h1 className="mb-8 text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl">
            Answers For
            <br />
            <span className="text-muted">Buyers And Sellers</span>
          </h1>
          <p className="max-w-3xl text-base font-medium leading-relaxed text-muted md:text-lg">
            Quick answers to common questions about listing equipment, financing, logistics, dealer programs,
            and support at Forestry Equipment Sales.
          </p>
        </div>
      </section>

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
                <a href="mailto:info@forestryequipmentsales.com" className="flex items-start space-x-3 border border-line bg-bg p-4 transition-colors hover:border-accent">
                  <Mail className="mt-0.5 text-accent" size={18} />
                  <div>
                    <span className="label-micro block">Email Support</span>
                    <span className="text-sm font-black tracking-tight">info@forestryequipmentsales.com</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="border border-line bg-ink p-8 text-white md:p-10">
              <span className="label-micro mb-4 block text-accent">Popular Pages</span>
              <div className="space-y-4">
                <Link to="/financing" className="flex items-center justify-between border-b border-white/10 pb-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:text-accent">
                  Financing
                  <ArrowRight size={16} />
                </Link>
                <Link to="/logistics" className="flex items-center justify-between border-b border-white/10 pb-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:text-accent">
                  Logistics
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="flex items-center justify-between text-sm font-black uppercase tracking-widest text-white transition-colors hover:text-accent">
                  Contact Us
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = index === openIndex;
              return (
                <div key={item.question} className="border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
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
      </section>
    </div>
  );
}
