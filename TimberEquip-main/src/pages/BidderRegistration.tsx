import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { Seo } from '../components/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { auctionService } from '../services/auctionService';
import type { Auction, BidderProfile } from '../types';

export function BidderRegistration() {
  const { auctionSlug } = useParams<{ auctionSlug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<BidderProfile | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate(`/login?redirect=${encodeURIComponent(`/auctions/${auctionSlug}/register`)}`);
    }
  }, [isAuthenticated, loading, navigate, auctionSlug]);

  // Load auction and existing bidder profile
  useEffect(() => {
    async function load() {
      try {
        if (auctionSlug) {
          const a = await auctionService.getAuctionBySlug(auctionSlug);
          setAuction(a);
        }
        if (user?.uid) {
          const profile = await auctionService.getBidderProfile(user.uid);
          if (profile) {
            setExistingProfile(profile);
            // Pre-fill form from existing profile
            setFullName(profile.fullName || '');
            setPhone(profile.phone || '');
            setCompanyName(profile.companyName || '');
            setStreet(profile.address?.street || '');
            setCity(profile.address?.city || '');
            setState(profile.address?.state || '');
            setZip(profile.address?.zip || '');
            if (profile.verificationTier === 'verified' || profile.verificationTier === 'approved') {
              setComplete(true);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load auction/profile:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auctionSlug, user?.uid]);

  async function handleSubmit() {
    if (!user?.uid || !termsAccepted) return;
    setSaving(true);
    try {
      await auctionService.saveBidderProfile(user.uid, {
        verificationTier: 'verified',
        fullName,
        phone,
        phoneVerified: false,
        companyName: companyName || null,
        address: { street, city, state, zip, country: 'US' },
        stripeCustomerId: '',
        preAuthPaymentIntentId: null,
        preAuthAmount: 250,
        preAuthStatus: 'pending',
        idVerificationStatus: 'not_started',
        idVerifiedAt: null,
        totalAuctionsParticipated: existingProfile?.totalAuctionsParticipated || 0,
        totalItemsWon: existingProfile?.totalItemsWon || 0,
        totalSpent: existingProfile?.totalSpent || 0,
        nonPaymentCount: existingProfile?.nonPaymentCount || 0,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: '1.0',
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setComplete(true);
    } catch (e) {
      console.error('Failed to save bidder profile:', e);
      alert('Failed to complete registration. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/2" />
          <div className="h-4 bg-surface rounded w-3/4" />
          <div className="h-64 bg-surface rounded" />
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Auctions', path: '/auctions' },
    ...(auction ? [{ label: auction.title, path: `/auctions/${auctionSlug}` }] : []),
    { label: 'Register to Bid' },
  ];

  if (complete) {
    return (
      <>
        <Seo title="Registered to Bid — TimberEquip" />
        <Breadcrumbs items={breadcrumbs} />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <CheckCircle size={48} className="mx-auto text-accent mb-4" />
          <h1 className="text-xl font-black uppercase tracking-tight mb-2">You're Registered to Bid</h1>
          <p className="text-sm text-muted mb-6">
            Your bidder registration is complete. You can now place bids on auction items.
          </p>
          {auction && (
            <Link to={`/auctions/${auctionSlug}`} className="btn-industrial btn-accent">
              View Auction Catalog
            </Link>
          )}
          <Link to="/auctions" className="btn-industrial btn-outline ml-2">
            All Auctions
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title={`Register to Bid${auction ? ` — ${auction.title}` : ''} — TimberEquip`} />
      <Breadcrumbs items={breadcrumbs} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-black uppercase tracking-tight mb-1">Register to Bid</h1>
        {auction && (
          <p className="text-sm text-muted mb-6">{auction.title} — {auction.startTime ? new Date(auction.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
        )}

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { num: 1, label: 'Personal Info', icon: ShieldCheck },
            { num: 2, label: 'Payment', icon: CreditCard },
            { num: 3, label: 'Terms', icon: FileText },
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
                step >= num ? 'bg-accent text-white' : 'bg-surface border border-line text-muted'
              }`}>
                {num}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= num ? 'text-ink' : 'text-muted'}`}>{label}</span>
              {num < 3 && <div className={`flex-1 h-px ${step > num ? 'bg-accent' : 'bg-line'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="border border-line rounded-sm p-6 space-y-4">
            <h2 className="font-black text-sm uppercase tracking-widest">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-micro block mb-1" htmlFor="bidder-name">Full Legal Name *</label>
                <input id="bidder-name" className="input-industrial w-full" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" required />
              </div>
              <div>
                <label className="label-micro block mb-1" htmlFor="bidder-phone">Phone Number *</label>
                <input id="bidder-phone" className="input-industrial w-full" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" required />
              </div>
              <div className="md:col-span-2">
                <label className="label-micro block mb-1" htmlFor="bidder-company">Company Name (optional)</label>
                <input id="bidder-company" className="input-industrial w-full" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" />
              </div>
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest pt-2">Mailing Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label-micro block mb-1" htmlFor="bidder-street">Street Address *</label>
                <input id="bidder-street" className="input-industrial w-full" value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main St" required />
              </div>
              <div>
                <label className="label-micro block mb-1" htmlFor="bidder-city">City *</label>
                <input id="bidder-city" className="input-industrial w-full" value={city} onChange={e => setCity(e.target.value)} placeholder="Minneapolis" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-micro block mb-1" htmlFor="bidder-state">State *</label>
                  <input id="bidder-state" className="input-industrial w-full" value={state} onChange={e => setState(e.target.value)} placeholder="MN" required />
                </div>
                <div>
                  <label className="label-micro block mb-1" htmlFor="bidder-zip">ZIP *</label>
                  <input id="bidder-zip" className="input-industrial w-full" value={zip} onChange={e => setZip(e.target.value)} placeholder="55401" required />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                className="btn-industrial btn-accent"
                disabled={!fullName || !phone || !street || !city || !state || !zip}
                onClick={() => setStep(2)}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment / Pre-Auth */}
        {step === 2 && (
          <div className="border border-line rounded-sm p-6 space-y-4">
            <h2 className="font-black text-sm uppercase tracking-widest">Payment Verification</h2>
            <div className="bg-surface border border-line rounded-sm p-4">
              <div className="flex items-start gap-3">
                <CreditCard size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">$250 Pre-Authorization Hold</p>
                  <p className="text-xs text-muted mt-1">
                    A temporary $250 hold will be placed on your credit card. This is <strong>not a charge</strong> —
                    it verifies your identity and commitment. The hold is automatically released 48 hours
                    after the auction closes if you do not win any items.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-line rounded-sm p-4">
              <p className="text-xs text-muted text-center py-4">
                Stripe payment integration will be configured here. For now, continue to accept terms.
              </p>
            </div>
            <div className="flex justify-between pt-2">
              <button className="btn-industrial btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn-industrial btn-accent" onClick={() => setStep(3)}>
                Continue to Terms
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Terms & Conditions */}
        {step === 3 && (
          <div className="border border-line rounded-sm p-6 space-y-4">
            <h2 className="font-black text-sm uppercase tracking-widest">Terms & Conditions</h2>
            <div className="bg-surface border border-line rounded-sm p-4 space-y-3 text-xs text-muted">
              <p>By registering as a bidder, you agree to the following:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>All bids are binding contracts.</strong> Placing a bid constitutes a legal obligation to purchase the item if you are the winning bidder.</li>
                <li><strong>Buyer premium applies.</strong> A buyer's premium ({auction?.defaultBuyerPremiumPercent || 10}%) will be added to the winning bid amount.</li>
                <li><strong>Payment is due within 3 business days</strong> of auction close. Accepted methods: wire transfer, ACH, or credit card (2.9% surcharge).</li>
                <li><strong>Equipment is sold "as is, where is."</strong> No warranties are expressed or implied. Inspection before bidding is recommended.</li>
                <li><strong>Sales tax applies</strong> unless a valid exemption certificate is provided.</li>
                <li><strong>Equipment removal</strong> must occur within 14 days of payment confirmation.</li>
                <li><strong>Non-payment consequences:</strong> forfeiture of pre-authorization hold, account suspension, and potential legal action.</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 accent-accent"
              />
              <span className="text-xs">
                I have read and agree to the <strong>Auction Terms & Conditions</strong> and <strong>Privacy Policy</strong>.
                I understand that all bids are binding and that a {auction?.defaultBuyerPremiumPercent || 10}% buyer premium applies.
              </span>
            </label>
            <div className="flex justify-between pt-2">
              <button className="btn-industrial btn-outline" onClick={() => setStep(2)}>Back</button>
              <button
                className="btn-industrial btn-accent"
                disabled={!termsAccepted || saving}
                onClick={handleSubmit}
              >
                {saving ? 'Completing Registration…' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
