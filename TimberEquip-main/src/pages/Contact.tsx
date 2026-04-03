import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, MapPin, Clock,
  CheckCircle2, MessageSquare, Send,
  Headphones, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertMessage } from '../components/AlertMessage';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';

export function Contact() {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';
  const supportPanelClass = theme === 'dark' ? 'bg-[#1C1917] text-white border border-white/10' : 'bg-surface text-ink border border-line';
  const supportBodyClass = theme === 'dark' ? 'text-white/60' : 'text-muted';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'General Support',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setContactError('');
    getRecaptchaToken('CONTACT').then(async (rcToken) => {
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'CONTACT');
        if (!pass) {
          setContactError('Security check failed. Please try again.');
          setLoading(false);
          return;
        }
      }
      try {
        await addDoc(collection(db, 'contactRequests'), {
          name: contactForm.name.trim(),
          email: contactForm.email.trim().toLowerCase(),
          category: contactForm.category,
          message: contactForm.message.trim(),
          source: 'contact-page',
          createdAt: serverTimestamp(),
          status: 'New',
        });

        setContactForm({
          name: '',
          email: '',
          category: 'General Support',
          message: '',
        });
        setLoading(false);
        setStep(2);
      } catch (error) {
        console.error('Failed to submit contact request:', error);
        setContactError('Unable to send your message right now. Please try again.');
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Contact Forestry Equipment Sales | Sales, Support, and Dealer Help"
        description="Contact Forestry Equipment Sales for buying help, seller support, dealer storefront questions, financing requests, and logistics coordination."
        canonicalPath="/contact"
        imagePath="/page-photos/grapple-hero-image.webp"
        preloadImage="/page-photos/contact-us.webp"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'ContactPage',
              name: 'Contact Forestry Equipment Sales',
              url: 'https://timberequip.com/contact',
            },
            {
              '@type': 'Organization',
              name: 'Forestry Equipment Sales',
              url: 'https://timberequip.com',
              email: 'info@forestryequipmentsales.com',
              contactPoint: [
                { '@type': 'ContactPoint', contactType: 'customer service', email: 'support@forestryequipmentsales.com', availableLanguage: 'English' },
                { '@type': 'ContactPoint', contactType: 'sales', email: 'info@forestryequipmentsales.com', availableLanguage: 'English' },
              ],
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://timberequip.com/' },
                { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://timberequip.com/contact' },
              ],
            },
          ],
        }}
      />
      <ImageHero imageSrc="/page-photos/contact-us.webp" imageAlt="Contact Forestry Equipment Sales">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare size={20} className="text-accent" />
            <span className="label-micro text-accent">Contact Center</span>
          </div>
          <h1 className={`mb-8 text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl ${heroHeadingClass}`}>
            Contact <br />
            <span className={heroSecondaryClass}>Us</span>
          </h1>
          <p className={`max-w-2xl font-medium leading-relaxed ${heroBodyClass}`}>
            Have a question about a listing, your account, or dealer services? Reach out and we will get back to you.
          </p>
        </div>
      </ImageHero>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Form Section */}
          <div className="lg:col-span-8">
            <div className="bg-bg border border-line shadow-2xl overflow-hidden">
              <div className="p-12">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={prefersReducedMotion ? { duration: 0 } : undefined}
                      className="space-y-10"
                    >
                      <div className="flex flex-col">
                        <span className="label-micro text-accent mb-2 block">Submission Process</span>
                        <h3 className="text-3xl font-black uppercase tracking-tighter">Submit Inquiry</h3>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="flex flex-col space-y-3">
                            <label htmlFor="contact-name" className="label-micro">Your Name</label>
                            <input
                              id="contact-name"
                              required
                              type="text"
                              value={contactForm.name}
                              onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="E.G. JOHN DOE"
                              className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider focus:ring-accent focus:border-accent"
                            />
                          </div>
                          <div className="flex flex-col space-y-3">
                            <label htmlFor="contact-email" className="label-micro">Email Address</label>
                            <input
                              id="contact-email"
                              required
                              type="email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                              placeholder="YOUR@EMAIL.COM"
                              className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider focus:ring-accent focus:border-accent"
                            />
                          </div>
                          <div className="flex flex-col space-y-3 md:col-span-2">
                            <label htmlFor="contact-category" className="label-micro">Inquiry Category</label>
                            <select
                              id="contact-category"
                              value={contactForm.category}
                              onChange={(e) => setContactForm((prev) => ({ ...prev, category: e.target.value }))}
                              className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider focus:ring-accent focus:border-accent"
                            >
                              <option>General Support</option>
                              <option>Market Intelligence</option>
                              <option>Technical Verification</option>
                              <option>Financing Department</option>
                              <option>Equipment Listing</option>
                            </select>
                          </div>
                          <div className="flex flex-col space-y-3 md:col-span-2">
                            <label htmlFor="contact-message" className="label-micro">Message Content</label>
                            <textarea
                              id="contact-message"
                              required
                              rows={6}
                              value={contactForm.message}
                              onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                              placeholder="Provide detailed information regarding your inquiry..."
                              className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                            ></textarea>
                          </div>
                        </div>

                        {contactError && (
                          <AlertMessage severity="error" className="mb-4">{contactError}</AlertMessage>
                        )}
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                          Protected by reCAPTCHA Enterprise before submission.
                        </p>
                        <button
                          type="submit"
                          disabled={loading}
                          aria-disabled={loading}
                          className="btn-industrial btn-accent py-5 px-12 w-full md:w-fit flex items-center justify-center"
                        >
                          {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              Send Inquiry
                              <Send className="ml-3" size={18} />
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={prefersReducedMotion ? { duration: 0 } : undefined}
                      className="py-20 flex flex-col items-center text-center"
                    >
                      <div className="w-24 h-24 bg-data/10 text-data flex items-center justify-center rounded-full mb-10">
                        <CheckCircle2 size={48} />
                      </div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Message Sent</h3>
                      <p className="text-muted font-medium max-w-md mb-12 leading-relaxed">
                        Your inquiry has been successfully sent to the Forestry Equipment Sales team. 
                        A representative will review your message and respond within 24 hours.
                      </p>
                      <button onClick={() => setStep(1)} className="btn-industrial btn-accent py-5 px-12">
                        Submit New Inquiry
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-surface border border-line p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-accent">Contact Information</h4>
              <div className="space-y-10">
                {[
                  { title: 'Support', desc: '+1 (218) 720-0933', icon: Headphones, link: 'tel:+12187200933', valueClassName: 'text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest' },
                  { title: 'Email Support', desc: 'support@forestryequipmentsales.com', icon: Mail, link: 'mailto:support@forestryequipmentsales.com', valueClassName: 'block break-all text-sm font-black text-muted leading-relaxed normal-case tracking-tight' },
                  { title: 'HQ', desc: '4788 RICE LAKE RD, DULUTH, MN 55803', icon: MapPin, link: '#', valueClassName: 'text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest' },
                  { title: 'Hours of Operation', desc: 'PHONE M-F 8AM-5PM CST | EMAIL 8AM-10PM CST', icon: Clock, link: '#', valueClassName: 'text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest' }
                ].map((item, i) => (
                  <a 
                    key={i} 
                    href={item.link}
                    className="flex min-w-0 space-x-4 group"
                  >
                    <div className="p-3 bg-bg border border-line rounded-sm h-fit group-hover:border-accent transition-colors">
                      <item.icon className="text-accent" size={20} />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs font-black uppercase tracking-tight mb-1 group-hover:text-accent transition-colors">{item.title}</span>
                      <p className={item.valueClassName}>{item.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className={`${supportPanelClass} rounded-sm p-8`}>
              <div className="flex items-center space-x-3 mb-6">
                <HelpCircle className="text-accent" size={24} />
                <h4 className="text-sm font-black uppercase tracking-tighter">Frequently Asked Questions</h4>
              </div>
              <p className={`mb-8 text-[11px] font-medium leading-relaxed ${supportBodyClass}`}>
                Find answers to common questions about buying, selling, subscriptions, financing, and more.
              </p>
              <Link to="/faq" className="btn-industrial btn-accent w-full py-4 text-center block">View FAQ</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
