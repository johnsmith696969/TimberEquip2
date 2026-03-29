import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { Listing } from '../types';
import { equipmentService } from '../services/equipmentService';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';

const SELLER_CONTACT_CONSENT_VERSION = 'seller-contact-v1';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

export function InquiryModal({ isOpen, onClose, listing }: InquiryModalProps) {
  const initialMessage = `I'm interested in the ${listing.title}. Please provide more details regarding its condition and availability.`;
  const [inquirySent, setInquirySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: initialMessage
  });
  const [inquiryError, setInquiryError] = useState('');
  const [contactConsentAccepted, setContactConsentAccepted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setInquirySent(false);
    setInquiryError('');
    setSubmitting(false);
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      message: initialMessage
    });
    setContactConsentAccepted(false);
  }, [initialMessage, isOpen, listing.id]);

  const hasUnsavedChanges =
    !inquirySent &&
    (inquiryForm.name.trim().length > 0 ||
      inquiryForm.email.trim().length > 0 ||
      inquiryForm.phone.trim().length > 0 ||
      inquiryForm.message.trim() !== initialMessage.trim());

  const handleClose = () => {
    if (submitting) return;
    if (hasUnsavedChanges && !window.confirm('Are you sure you want to discard changes?')) return;
    onClose();
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      setInquiryError('');
      const sellerUid = listing.sellerUid || listing.sellerId || '';
      if (!sellerUid) {
        setInquiryError('This listing is missing seller contact info. Please try another listing or contact support.');
        return;
      }

      if (!contactConsentAccepted) {
        setInquiryError('Review and accept the seller-specific contact consent notice before sending your inquiry.');
        return;
      }

      const rcToken = await getRecaptchaToken('INQUIRY');
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'INQUIRY');
        if (!pass) {
          setInquiryError('Security check failed. Please try again.');
          return;
        }
      }

      const inquiryId = await equipmentService.createInquiry({
        listingId: listing.id,
        sellerUid,
        sellerId: sellerUid,
        buyerName: inquiryForm.name.trim(),
        buyerEmail: inquiryForm.email.trim().toLowerCase(),
        buyerPhone: inquiryForm.phone.trim(),
        message: inquiryForm.message.trim(),
        type: 'Inquiry',
        contactConsentAccepted: true,
        contactConsentVersion: SELLER_CONTACT_CONSENT_VERSION,
        contactConsentScope: 'listing_seller_specific',
        contactConsentAt: new Date().toISOString(),
      });

      if (!inquiryId) {
        setInquiryError('Unable to send inquiry right now. Please try again in a moment.');
        return;
      }

      setInquirySent(true);
      setTimeout(() => {
        onClose();
        setInquirySent(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setInquiryError('Unable to send inquiry right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          ></motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden"
          >
            <div className="bg-ink text-white p-8 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inquiry Form</span>
                <h3 className="text-2xl font-black tracking-tighter uppercase">Contact Seller</h3>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/10 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-8">
              {inquirySent ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-data/10 text-data flex items-center justify-center rounded-full mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-2">Inquiry Transmitted</h4>
                  <p className="text-muted text-sm font-medium">The seller has been notified and will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <label className="label-micro">Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label className="label-micro">Email Address</label>
                      <input 
                        required
                        type="email" 
                        className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="label-micro">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="label-micro">Message / Requirements</label>
                    <textarea 
                      required
                      rows={4}
                      className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                    ></textarea>
                  </div>
                  <label className="flex items-start gap-3 border border-line bg-surface/30 p-4 text-[10px] font-medium uppercase tracking-widest text-muted">
                    <input
                      required
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent"
                      checked={contactConsentAccepted}
                      onChange={(e) => setContactConsentAccepted(e.target.checked)}
                    />
                    <span>
                      I consent to Forestry Equipment Sales and the seller for this specific listing contacting me by phone, SMS, or email about this machine and this request. This consent is specific to this seller and this listing, is not a condition of purchase, and I may withdraw it at any time.
                    </span>
                  </label>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                    Protected by reCAPTCHA Enterprise before submission.
                  </p>
                  {inquiryError && (
                    <p className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/30 p-3 rounded-sm">{inquiryError}</p>
                  )}
                  <button type="submit" disabled={submitting} className="btn-industrial btn-accent w-full py-5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? 'Sending Inquiry...' : 'Transmit Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
