import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, CreditCard, ExternalLink, FileText, Loader2, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Seo } from '../components/Seo';
import { Breadcrumbs, type BreadcrumbItem } from '../components/Breadcrumbs';
import { auctionService, type AuctionBidderStatusResponse } from '../services/auctionService';
import { AUCTION_TERMS_VERSION, buildAuctionLegalSummaryLines } from '../utils/auctionFees';
import type { Auction } from '../types';

export function BidderRegistration() {
  const { auctionSlug } = useParams<{ auctionSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [status, setStatus] = useState<AuctionBidderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Tax exemption state
  const [taxExempt, setTaxExempt] = useState(false);
  const [taxExemptState, setTaxExemptState] = useState('');
  const [taxCertFile, setTaxCertFile] = useState<File | null>(null);
  const [taxCertUploading, setTaxCertUploading] = useState(false);
  const [taxCertUrl, setTaxCertUrl] = useState('');
  const taxCertInputRef = useRef<HTMLInputElement>(null);

  const TAX_EXEMPT_STATES: Record<string, { label: string; certName: string }> = {
    MN: { label: 'Minnesota', certName: 'Minnesota ST3 Certificate of Exemption' },
    WI: { label: 'Wisconsin', certName: 'Wisconsin Exemption Certificate' },
    MI: { label: 'Michigan', certName: 'Michigan Form 3372' },
  };

  const returnTo = searchParams.get('returnTo') || (auctionSlug ? `/auctions/${auctionSlug}` : '/auctions');
  const legalLines = useMemo(() => buildAuctionLegalSummaryLines(), []);
  const bidderInputClass = 'input-industrial w-full min-h-12 px-4 py-3 text-base font-semibold normal-case tracking-normal';
  const bidderInputStyle = { fontSize: '16px' } as const;

  useEffect(() => {
    if (!loading || isAuthenticated) return;
    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      if (!auctionSlug || !isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [auctionRecord, bidderStatus] = await Promise.all([
          auctionService.getAuctionBySlug(auctionSlug),
          auctionService.getBidderStatus(auctionSlug),
        ]);

        if (cancelled) return;

        setAuction(auctionRecord);
        setStatus(bidderStatus);
        const profile = bidderStatus.profile;
        setFullName(profile?.fullName || user?.displayName || '');
        setPhone(profile?.phone || user?.phoneNumber || '');
        setCompanyName(profile?.companyName || '');
        setStreet(profile?.address?.street || '');
        setCity(profile?.address?.city || '');
        setState(profile?.address?.state || '');
        setZip(profile?.address?.zip || '');
        setTermsAccepted(Boolean(profile?.termsAcceptedAt));
        setTaxExempt(Boolean(profile?.taxExempt));
        setTaxExemptState(profile?.taxExemptState || '');
        setTaxCertUrl(profile?.taxExemptCertificateUrl || '');
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load bidder registration:', loadError);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load bidder registration.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [auctionSlug, isAuthenticated, user?.displayName, user?.phoneNumber]);

  useEffect(() => {
    const setupSessionId = searchParams.get('setup_session_id');
    if (!auctionSlug || !setupSessionId || !isAuthenticated) return;

    let cancelled = false;
    async function syncSetupSession() {
      setPaymentLoading(true);
      setError('');
      setNotice('Refreshing saved payment method...');
      try {
        const bidderStatus = await auctionService.syncBidderPaymentSetupSession(setupSessionId, auctionSlug);
        if (!cancelled) {
          setStatus(bidderStatus);
          setNotice(bidderStatus.bidderApproved
            ? 'Payment method confirmed and bidder approval completed.'
            : 'Payment method saved. Finish any remaining verification steps to bid.');
        }
      } catch (syncError) {
        if (!cancelled) {
          console.error('Failed to sync bidder setup session:', syncError);
          setError(syncError instanceof Error ? syncError.message : 'Unable to refresh payment setup.');
        }
      } finally {
        if (!cancelled) {
          setPaymentLoading(false);
        }
      }
    }

    void syncSetupSession();
    return () => {
      cancelled = true;
    };
  }, [auctionSlug, isAuthenticated, searchParams]);

  useEffect(() => {
    if (searchParams.get('identity_return') === '1') {
      setNotice('Identity verification returned. Refresh bidder status below if approval does not appear right away.');
    } else if (searchParams.get('setup_cancelled') === '1') {
      setNotice('Payment method setup was cancelled. You can restart it below when ready.');
    }
  }, [searchParams]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Auctions', path: '/auctions' },
    ...(auction ? [{ label: auction.title, path: `/auctions/${auction.slug}` }] : []),
    { label: 'Register to Bid', path: '' },
  ];

  async function refreshBidderStatus() {
    if (!auctionSlug) return;
    setLoading(true);
    setError('');
    try {
      const bidderStatus = await auctionService.getBidderStatus(auctionSlug);
      setStatus(bidderStatus);
    } catch (refreshError) {
      console.error('Failed to refresh bidder status:', refreshError);
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh bidder status.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTaxCertUpload(file: File): Promise<string> {
    if (!user?.uid) {
      throw new Error('You must be signed in to upload a certificate.');
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Certificate must be a PDF, JPEG, PNG, or WebP file.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Certificate file must be smaller than 10 MB.');
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const storagePath = `tax-certificates/${user.uid}/${Date.now()}_${taxExemptState}_certificate.${ext}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: user.uid,
        uploadedAt: new Date().toISOString(),
        exemptionState: taxExemptState,
      },
    });
    return getDownloadURL(storageRef);
  }

  async function handleSaveRegistration() {
    if (!auctionSlug) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      // Upload tax certificate if a new file was selected
      let certificateUrl = taxCertUrl;
      if (taxExempt && taxExemptState && taxCertFile) {
        setTaxCertUploading(true);
        try {
          certificateUrl = await handleTaxCertUpload(taxCertFile);
          setTaxCertUrl(certificateUrl);
          setTaxCertFile(null);
        } finally {
          setTaxCertUploading(false);
        }
      }

      const bidderStatus = await auctionService.saveBidderProfileForAuction(auctionSlug, {
        fullName,
        phone,
        companyName,
        address: {
          street,
          city,
          state,
          zip,
          country: 'US',
        },
        taxExempt: taxExempt && Boolean(taxExemptState),
        taxExemptState: taxExempt ? taxExemptState : '',
        taxExemptCertificateUrl: taxExempt ? certificateUrl : '',
        ...(taxExempt && certificateUrl ? { taxExemptCertificateUploadedAt: new Date().toISOString() } : {}),
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: AUCTION_TERMS_VERSION,
      });
      setStatus(bidderStatus);
      setTermsAccepted(true);
      setNotice('Registration details saved. Continue with identity verification and payment setup.');
    } catch (saveError) {
      console.error('Failed to save bidder registration:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save bidder registration.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStartIdentityVerification() {
    if (!auctionSlug) return;
    setIdentityLoading(true);
    setError('');
    try {
      const response = await auctionService.createBidderIdentitySession(auctionSlug);
      window.location.assign(response.url);
    } catch (identityError) {
      console.error('Failed to create identity verification session:', identityError);
      setError(identityError instanceof Error ? identityError.message : 'Unable to start identity verification.');
      setIdentityLoading(false);
    }
  }

  async function handleStartPaymentSetup() {
    if (!auctionSlug) return;
    setPaymentLoading(true);
    setError('');
    try {
      const response = await auctionService.createBidderPaymentSetupSession(auctionSlug);
      window.location.assign(response.url);
    } catch (paymentError) {
      console.error('Failed to create bidder payment setup session:', paymentError);
      setError(paymentError instanceof Error ? paymentError.message : 'Unable to start payment setup.');
      setPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 rounded-sm bg-surface" />
          <div className="h-10 w-2/3 rounded-sm bg-surface" />
          <div className="h-[320px] rounded-sm bg-surface" />
        </div>
      </div>
    );
  }

  const statusCards = [
    {
      label: 'Registration',
      complete: Boolean(status?.legalAccepted),
      detail: status?.legalAccepted ? 'Saved and accepted' : 'Complete your bidder profile',
      icon: FileText,
    },
    {
      label: 'Identity',
      complete: Boolean(status?.identityVerified),
      detail: status?.identityVerified ? 'Stripe Identity verified' : status?.profile?.idVerificationStatus || 'Needs verification',
      icon: ShieldCheck,
    },
    {
      label: 'Payment',
      complete: Boolean(status?.paymentMethodReady),
      detail: status?.paymentMethodReady ? 'Payment method on file' : 'Add card or debit card',
      icon: CreditCard,
    },
  ];

  return (
    <>
      <Seo
        title={`${auction ? `${auction.title} | ` : ''}Register to Bid | Forestry Equipment Sales`}
        description="Complete bidder registration, identity verification, and payment setup for the auction."
      />
      <Breadcrumbs items={breadcrumbs} />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="label-micro text-accent">Auction Registration</span>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">
              Register to Bid
            </h1>
            {auction && (
              <p className="mt-3 text-sm text-muted">
                {auction.title} · bidding window opens {new Date(auction.startTime).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-industrial btn-outline" onClick={refreshBidderStatus}>
              <RefreshCw size={14} className="mr-2" />
              Refresh Status
            </button>
            <Link to={returnTo} className="btn-industrial btn-accent">
              Return to Auction
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              {statusCards.map(({ label, complete, detail, icon: Icon }) => (
                <div key={label} className="rounded-sm border border-line bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <Icon size={18} className={complete ? 'text-accent' : 'text-muted'} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${complete ? 'text-accent' : 'text-muted'}`}>
                      {complete ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <h2 className="mt-4 text-sm font-black uppercase tracking-widest">{label}</h2>
                  <p className="mt-2 text-sm text-muted">{detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-sm border border-line bg-surface p-6">
              <h2 className="text-sm font-black uppercase tracking-widest">Bidder Profile</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label-micro mb-1 block">Full Legal Name</label>
                  <input className={bidderInputClass} style={bidderInputStyle} value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
                <div>
                  <label className="label-micro mb-1 block">Phone Number</label>
                  <input className={bidderInputClass} style={bidderInputStyle} value={phone} onChange={(event) => setPhone(event.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="label-micro mb-1 block">Company Name</label>
                  <input className={bidderInputClass} style={bidderInputStyle} value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="label-micro mb-1 block">Street Address</label>
                  <input className={bidderInputClass} style={bidderInputStyle} value={street} onChange={(event) => setStreet(event.target.value)} />
                </div>
                <div>
                  <label className="label-micro mb-1 block">City</label>
                  <input className={bidderInputClass} style={bidderInputStyle} value={city} onChange={(event) => setCity(event.target.value)} />
                </div>
                <div>
                  <label className="label-micro mb-1 block">State / Province</label>
                  <input className={bidderInputClass} style={bidderInputStyle} value={state} onChange={(event) => setState(event.target.value)} />
                </div>
                <div>
                  <label className="label-micro mb-1 block">Postal Code</label>
                  <input className={bidderInputClass} style={bidderInputStyle} value={zip} onChange={(event) => setZip(event.target.value)} />
                </div>
              </div>

              {/* Tax Exemption Section */}
              <div className="mt-6 rounded-sm border border-line bg-ink/[0.02] p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={taxExempt}
                    onChange={(event) => {
                      setTaxExempt(event.target.checked);
                      if (!event.target.checked) {
                        setTaxExemptState('');
                        setTaxCertFile(null);
                      }
                    }}
                  />
                  <span className="font-semibold">
                    I am purchasing for tax-exempt use (logging, farming, silviculture)
                  </span>
                </label>

                {taxExempt && (
                  <div className="mt-4 space-y-4 pl-7">
                    <div>
                      <label className="label-micro mb-1 block">Exemption State</label>
                      <select
                        className={bidderInputClass}
                        style={bidderInputStyle}
                        value={taxExemptState}
                        onChange={(event) => {
                          setTaxExemptState(event.target.value);
                          setTaxCertFile(null);
                        }}
                      >
                        <option value="">Select state...</option>
                        {Object.entries(TAX_EXEMPT_STATES).map(([abbr, { label }]) => (
                          <option key={abbr} value={abbr}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {taxExemptState && TAX_EXEMPT_STATES[taxExemptState] && (
                      <div>
                        <p className="text-sm font-semibold">
                          {TAX_EXEMPT_STATES[taxExemptState].certName}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Upload a copy of your exemption certificate (PDF, JPEG, PNG, or WebP, max 10 MB).
                        </p>

                        {taxCertUrl && !taxCertFile && (
                          <div className="mt-2 flex items-center gap-2 rounded-sm border border-accent/20 bg-accent/5 px-3 py-2 text-xs">
                            <CheckCircle size={14} className="text-accent flex-shrink-0" />
                            <span className="truncate">Certificate on file</span>
                            <a
                              href={taxCertUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-accent underline"
                            >
                              View
                            </a>
                          </div>
                        )}

                        <input
                          ref={taxCertInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setTaxCertFile(file);
                          }}
                        />
                        <button
                          type="button"
                          className="btn-industrial btn-outline mt-2 text-xs"
                          onClick={() => taxCertInputRef.current?.click()}
                          disabled={taxCertUploading}
                        >
                          {taxCertUploading ? (
                            <>
                              <Loader2 size={13} className="mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={13} className="mr-2" />
                              {taxCertUrl ? 'Replace Certificate' : 'Upload Certificate'}
                            </>
                          )}
                        </button>
                        {taxCertFile && (
                          <p className="mt-1 text-xs text-muted">
                            Selected: {taxCertFile.name} — will be uploaded when you save.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="mt-5 flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  I accept the auction terms, acknowledge that all bids are binding, and understand that payment is due within 7 days.
                </span>
              </label>

              <button
                type="button"
                className="btn-industrial btn-accent mt-5"
                disabled={saving || !termsAccepted || !fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !state.trim() || !zip.trim()}
                onClick={handleSaveRegistration}
              >
                {saving ? 'Saving Registration...' : 'Save Registration Details'}
              </button>
            </div>

            <div className="rounded-sm border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest">Identity Verification</h2>
                  <p className="mt-2 text-sm text-muted">
                    We use Stripe Identity for government-ID checks before bidders can participate in the auction.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-industrial btn-accent"
                  disabled={identityLoading || !status?.legalAccepted}
                  onClick={handleStartIdentityVerification}
                >
                  {identityLoading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Opening Stripe...
                    </>
                  ) : (
                    <>
                      Verify Identity
                      <ExternalLink size={13} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-sm border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest">Payment Method Setup</h2>
                  <p className="mt-2 text-sm text-muted">
                    Add a valid card or debit card so your bidder profile can be approved. Cards are limited to $50,000 total due and receive a 3% processing fee if used for settlement.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-industrial btn-accent"
                  disabled={paymentLoading || !status?.legalAccepted}
                  onClick={handleStartPaymentSetup}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Opening Stripe...
                    </>
                  ) : (
                    <>
                      Add Payment Method
                      <ExternalLink size={13} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {status?.registrationComplete ? (
              <div className="rounded-sm border border-accent/20 bg-accent/5 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 text-accent" size={22} />
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest">Approved to Bid</h2>
                    <p className="mt-2 text-sm text-muted">
                      Your bidder account is fully approved. You can now place bids on active lots in this auction.
                    </p>
                    <Link to={returnTo} className="btn-industrial btn-accent mt-4 inline-flex">
                      Start Bidding
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-line bg-surface p-6">
                <h2 className="text-sm font-black uppercase tracking-widest">Approval Checklist</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted">
                  <li>1. Save your bidder registration details.</li>
                  <li>2. Complete Stripe Identity verification with a matching selfie.</li>
                  <li>3. Add a valid card or debit card through Stripe.</li>
                  <li>4. Refresh bidder status until approval is complete.</li>
                </ul>
              </div>
            )}

            <div className="rounded-sm border border-line bg-surface p-6">
              <h2 className="text-sm font-black uppercase tracking-widest">Auction Legal Summary</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {legalLines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {(error || notice) && (
              <div className={`rounded-sm border p-4 text-sm ${error ? 'border-red-500/30 bg-red-500/5 text-red-700' : 'border-accent/20 bg-accent/5 text-ink'}`}>
                {error || notice}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
