import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, FileText, CheckCircle, AlertTriangle, RefreshCw, Fingerprint } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { Seo } from '../components/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { auctionService } from '../services/auctionService';
import { auth } from '../firebase';
import type { Auction, BidderProfile } from '../types';

// ---------------------------------------------------------------------------
// Stripe.js types & loader
//
// The Stripe client SDK (@stripe/stripe-js) is loaded at runtime via a
// dynamic import. If the package is not installed the component will show
// an error banner instead of crashing the build. To enable full Stripe
// functionality run:  npm install @stripe/stripe-js
//
// We intentionally use `any` for the Stripe object types so that
// TypeScript does not require the package to be installed at compile time.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
type StripeInstance = any;
type StripeElements = any;
type StripeCardElement = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Build a module specifier that Rollup / Vite cannot statically resolve.
// This prevents the bundler from failing when @stripe/stripe-js is not
// installed.  At runtime the dynamic import either succeeds (package is
// installed) or rejects (caught below, shows user-friendly error).
const STRIPE_MODULE = ['@stripe', 'stripe-js'].join('/');

let stripePromise: Promise<StripeInstance | null> | null = null;

async function getStripe(): Promise<StripeInstance | null> {
  if (stripePromise) return stripePromise;

  stripePromise = (async () => {
    try {
      const mod = await (new Function('m', 'return import(m)') as (m: string) => Promise<{ loadStripe: (key: string) => Promise<StripeInstance> }>)(STRIPE_MODULE);
      const loadStripe = mod.loadStripe;
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
      if (!publishableKey) {
        console.error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
        return null;
      }
      return loadStripe(publishableKey);
    } catch (error) {
      console.error('Failed to load @stripe/stripe-js — is the package installed?', error);
      return null;
    }
  })();

  return stripePromise;
}

// ---------------------------------------------------------------------------
// Helper — get a fresh Firebase ID token for API calls
// ---------------------------------------------------------------------------
async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  return currentUser.getIdToken();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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

  // Form state — Step 1
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Stripe / Step 2 state
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [preAuthClientSecret, setPreAuthClientSecret] = useState<string | null>(null);
  const [preAuthLoading, setPreAuthLoading] = useState(false);
  const [preAuthError, setPreAuthError] = useState<string | null>(null);
  const [preAuthSuccess, setPreAuthSuccess] = useState(false);
  const [preAuthPaymentIntentId, setPreAuthPaymentIntentId] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string>('');

  // Identity verification state
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState<'not_started' | 'pending' | 'verified' | 'failed'>('not_started');

  // Stripe refs
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);
  const cardMountRef = useRef<HTMLDivElement | null>(null);
  const cardMountedRef = useRef(false);

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
            setFullName(profile.fullName || '');
            setPhone(profile.phone || '');
            setCompanyName(profile.companyName || '');
            setStreet(profile.address?.street || '');
            setCity(profile.address?.city || '');
            setState(profile.address?.state || '');
            setZip(profile.address?.zip || '');
            if (profile.preAuthStatus === 'held' || profile.preAuthStatus === 'captured') {
              setPreAuthSuccess(true);
              setPreAuthPaymentIntentId(profile.preAuthPaymentIntentId || null);
              setStripeCustomerId(profile.stripeCustomerId || '');
            }
            if (profile.idVerificationStatus === 'verified' || profile.idVerificationStatus === 'pending') {
              setIdentityStatus(profile.idVerificationStatus);
            }
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

  // ---------------------------------------------------------------------------
  // Initialize Stripe Elements when Step 2 becomes active
  // ---------------------------------------------------------------------------
  const initStripe = useCallback(async () => {
    if (stripeRef.current) {
      setStripeReady(true);
      return;
    }

    try {
      const stripe = await getStripe();
      if (!stripe) {
        setStripeLoadError(
          'Stripe could not be loaded. Please check that VITE_STRIPE_PUBLISHABLE_KEY is configured and @stripe/stripe-js is installed.'
        );
        return;
      }
      stripeRef.current = stripe;
      setStripeReady(true);
      setStripeLoadError(null);
    } catch (err) {
      setStripeLoadError('Failed to initialize Stripe. Please refresh and try again.');
      console.error('Stripe init error:', err);
    }
  }, []);

  // Mount the Stripe Card Element into the DOM ref
  useEffect(() => {
    if (step !== 2 || !stripeReady || !stripeRef.current || !cardMountRef.current) return;
    if (cardMountedRef.current) return; // already mounted

    const elements = stripeRef.current.elements();
    const card = elements.create('card', {
      style: {
        base: {
          fontSize: '14px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#1a1a1a',
          '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#dc2626' },
      },
    });

    card.mount(cardMountRef.current);
    card.on('change', (event) => {
      setCardComplete(event.complete);
      if (event.error) {
        setPreAuthError(event.error.message);
      } else {
        setPreAuthError(null);
      }
    });

    elementsRef.current = elements;
    cardElementRef.current = card;
    cardMountedRef.current = true;

    return () => {
      card.unmount();
      cardMountedRef.current = false;
      cardElementRef.current = null;
      elementsRef.current = null;
    };
  }, [step, stripeReady]);

  // Load Stripe when step 2 activates
  useEffect(() => {
    if (step === 2) {
      void initStripe();
    }
  }, [step, initStripe]);

  // ---------------------------------------------------------------------------
  // Fetch pre-auth client secret when Step 2 loads
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (step !== 2 || preAuthClientSecret || preAuthSuccess) return;

    let cancelled = false;

    async function fetchClientSecret() {
      setPreAuthLoading(true);
      setPreAuthError(null);
      try {
        const token = await getAuthToken();
        const res = await fetch('/api/auctions/create-preauth-hold', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Server error' }));
          throw new Error(body.error || `Server responded with ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setPreAuthClientSecret(data.clientSecret);
          if (data.stripeCustomerId) {
            setStripeCustomerId(data.stripeCustomerId);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to create pre-authorization';
          setPreAuthError(message);
        }
      } finally {
        if (!cancelled) setPreAuthLoading(false);
      }
    }

    void fetchClientSecret();
    return () => { cancelled = true; };
  }, [step, preAuthClientSecret, preAuthSuccess]);

  // ---------------------------------------------------------------------------
  // Authorize the $250 hold
  // ---------------------------------------------------------------------------
  async function handleAuthorize() {
    if (!stripeRef.current || !cardElementRef.current || !preAuthClientSecret) return;

    setPreAuthLoading(true);
    setPreAuthError(null);

    try {
      const result = await stripeRef.current.confirmCardPayment(preAuthClientSecret, {
        payment_method: { card: cardElementRef.current },
      });

      if (result.error) {
        setPreAuthError(result.error.message || 'Card authorization failed. Please try again.');
        setPreAuthLoading(false);
        return;
      }

      const paymentIntentId = result.paymentIntent?.id;
      if (!paymentIntentId) {
        setPreAuthError('Authorization succeeded but no payment reference was returned.');
        setPreAuthLoading(false);
        return;
      }

      // Confirm on the server
      const token = await getAuthToken();
      const confirmRes = await fetch('/api/auctions/confirm-preauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!confirmRes.ok) {
        const body = await confirmRes.json().catch(() => ({ error: 'Confirmation failed' }));
        throw new Error(body.error || 'Server failed to confirm the pre-authorization');
      }

      const confirmData = await confirmRes.json();
      setPreAuthPaymentIntentId(paymentIntentId);
      if (confirmData.stripeCustomerId) {
        setStripeCustomerId(confirmData.stripeCustomerId);
      }
      setPreAuthSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authorization failed';
      setPreAuthError(message);
    } finally {
      setPreAuthLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Retry pre-auth (reset client secret to trigger a fresh fetch)
  // ---------------------------------------------------------------------------
  function handleRetryPreAuth() {
    setPreAuthClientSecret(null);
    setPreAuthError(null);
    setPreAuthSuccess(false);
    setPreAuthPaymentIntentId(null);
  }

  // ---------------------------------------------------------------------------
  // Identity Verification
  // ---------------------------------------------------------------------------
  async function handleIdentityVerification() {
    if (!stripeRef.current) {
      setIdentityError('Stripe has not been loaded. Please refresh and try again.');
      return;
    }

    setIdentityLoading(true);
    setIdentityError(null);

    try {
      const token = await getAuthToken();
      const res = await fetch('/api/auctions/create-identity-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(body.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const verifyResult = await stripeRef.current.verifyIdentity(data.clientSecret);

      if (verifyResult.error) {
        setIdentityError(verifyResult.error.message || 'Identity verification failed.');
      } else {
        setIdentityStatus('pending');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Identity verification failed';
      setIdentityError(message);
    } finally {
      setIdentityLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Final submission — Step 3
  // ---------------------------------------------------------------------------
  async function handleSubmit() {
    if (!user?.uid || !termsAccepted) return;
    setSaving(true);

    // Determine verification tier based on what actually completed:
    //   - 'basic'    = no pre-auth completed (should not normally reach here)
    //   - 'verified' = card pre-auth succeeded
    //   - 'approved' = card pre-auth + identity verification both succeeded
    let verificationTier: BidderProfile['verificationTier'] = 'basic';
    if (preAuthSuccess && identityStatus === 'verified') {
      verificationTier = 'approved';
    } else if (preAuthSuccess) {
      verificationTier = 'verified';
    }

    try {
      await auctionService.saveBidderProfile(user.uid, {
        verificationTier,
        fullName,
        phone,
        phoneVerified: false,
        companyName: companyName || null,
        address: { street, city, state, zip, country: 'US' },
        stripeCustomerId: stripeCustomerId || '',
        preAuthPaymentIntentId: preAuthPaymentIntentId || null,
        preAuthAmount: 250,
        preAuthStatus: preAuthSuccess ? 'held' : 'pending',
        idVerificationStatus: identityStatus,
        idVerifiedAt: identityStatus === 'verified' ? new Date().toISOString() : null,
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

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
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
    { label: 'Register to Bid', path: '' },
  ];

  // ---------------------------------------------------------------------------
  // Complete state
  // ---------------------------------------------------------------------------
  if (complete) {
    return (
      <>
        <Seo title="Registered to Bid — TimberEquip" description="You are registered to bid on this auction." />
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <Seo title={`Register to Bid${auction ? ` — ${auction.title}` : ''} — TimberEquip`} description="Register as a bidder to participate in this forestry equipment auction." />
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

        {/* Step 2: Payment / Pre-Auth + Identity Verification */}
        {step === 2 && (
          <div className="border border-line rounded-sm p-6 space-y-5">
            <h2 className="font-black text-sm uppercase tracking-widest">Payment Verification</h2>

            {/* Explanation banner */}
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

            {/* Stripe load error */}
            {stripeLoadError && (
              <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">Stripe Unavailable</p>
                  <p className="text-xs text-red-700 mt-1">{stripeLoadError}</p>
                </div>
              </div>
            )}

            {/* Pre-auth already completed */}
            {preAuthSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-sm p-4 flex items-start gap-3">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-green-800">Card Authorized Successfully</p>
                  <p className="text-xs text-green-700 mt-1">
                    A $250 hold has been placed on your card. This will be released automatically if you do not win any items.
                  </p>
                </div>
              </div>
            )}

            {/* Card input form — hidden once pre-auth is complete */}
            {!preAuthSuccess && !stripeLoadError && (
              <div className="space-y-4">
                {/* Stripe Card Element mount point */}
                <div>
                  <label className="label-micro block mb-2">Card Details</label>
                  <div
                    ref={cardMountRef}
                    className="border border-line rounded-sm px-3 py-3 bg-white min-h-[42px]"
                  />
                  {!stripeReady && (
                    <p className="text-xs text-muted mt-2 animate-pulse">Loading payment form...</p>
                  )}
                </div>

                {/* Pre-auth error */}
                {preAuthError && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-3 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-700">{preAuthError}</p>
                      <button
                        onClick={handleRetryPreAuth}
                        className="text-xs font-bold text-red-800 underline mt-1 inline-flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Authorize button */}
                <button
                  className="btn-industrial btn-accent w-full"
                  disabled={!cardComplete || !preAuthClientSecret || preAuthLoading}
                  onClick={handleAuthorize}
                >
                  {preAuthLoading ? 'Authorizing...' : 'Authorize $250 Hold'}
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-line pt-4">
              <div className="flex items-start gap-3">
                <Fingerprint size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Identity Verification</p>
                  <p className="text-xs text-muted mt-1">
                    This step is optional but <strong>required for bids over $25,000</strong>.
                    We use Stripe Identity for secure, instant document verification.
                  </p>

                  {identityStatus === 'pending' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mt-3 flex items-start gap-2">
                      <CheckCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">Verification submitted — review in progress.</p>
                    </div>
                  )}

                  {identityStatus === 'verified' && (
                    <div className="bg-green-50 border border-green-200 rounded-sm p-3 mt-3 flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-800">Identity verified.</p>
                    </div>
                  )}

                  {identityStatus === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-sm p-3 mt-3 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">Verification failed. You can try again.</p>
                    </div>
                  )}

                  {identityError && (
                    <p className="text-xs text-red-600 mt-2">{identityError}</p>
                  )}

                  {(identityStatus === 'not_started' || identityStatus === 'failed') && (
                    <button
                      className="btn-industrial btn-outline mt-3 text-xs"
                      disabled={identityLoading || !stripeReady}
                      onClick={handleIdentityVerification}
                    >
                      {identityLoading ? 'Opening Verification...' : 'Verify Identity'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <button className="btn-industrial btn-outline" onClick={() => setStep(1)}>Back</button>
              <button
                className="btn-industrial btn-accent"
                disabled={!preAuthSuccess}
                onClick={() => setStep(3)}
              >
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
                {saving ? 'Completing Registration...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
