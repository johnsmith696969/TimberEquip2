import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2,
  ArrowRight,
  Building2,
  User,
  Crown,
  X,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Globe2
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { billingService, type ListingPlanId } from '../services/billingService';
import { useAuth } from '../components/AuthContext';
import { hasActiveSellerSubscription } from '../utils/sellerAccess';
import {
  createDefaultSellerProgramEnrollmentForm,
  getSellerProgramScopeLabel,
  getSellerProgramStatementLabel,
  SELLER_PROGRAM_AGREEMENT_VERSION,
  SELLER_PROGRAM_PRIVACY_PATH,
  SELLER_PROGRAM_TERMS_PATH,
  type SellerProgramEnrollmentFormData,
} from '../utils/sellerProgramAgreement';
import {
  getSellerPlanChangeDirection,
  getSellerPlanMarketingLabel,
  getSellerPlanPurchaseLabel,
} from '../utils/sellerPlans';

const ENROLLMENT_STORAGE_KEY = 'timber_seller_program_enrollment_v1';

function isListingPlanId(value: string): value is ListingPlanId {
  return value === 'individual_seller' || value === 'dealer' || value === 'fleet_dealer';
}

function clampOwnerOperatorQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(10, Math.floor(value)));
}

function parseStoredEnrollment(): Partial<SellerProgramEnrollmentFormData> | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(ENROLLMENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? parsed as Partial<SellerProgramEnrollmentFormData>
      : null;
  } catch {
    return null;
  }
}

type SellerTier = {
  title: string;
  price: string;
  planId: ListingPlanId;
  roleLabel: string;
  icon: typeof User;
  summary: string;
  features: string[];
  highlight?: boolean;
};

export function AdPrograms() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const sellerTypesRef = useRef<HTMLElement | null>(null);
  const enrollmentRef = useRef<HTMLElement | null>(null);
  const [showMediaKitModal, setShowMediaKitModal] = useState(false);
  const [sendingMediaKit, setSendingMediaKit] = useState(false);
  const [mediaKitSent, setMediaKitSent] = useState(false);
  const [requestType, setRequestType] = useState<'media-kit' | 'support'>('media-kit');
  const [mediaKitForm, setMediaKitForm] = useState({
    firstName: '',
    companyName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const planParam = String(searchParams.get('plan') || '').trim();
  const selectedPlanFromQuery = isListingPlanId(planParam) ? planParam : null;
  const [pendingPlanCheckout, setPendingPlanCheckout] = useState<ListingPlanId | null>(null);
  const [selectedSellerPlan, setSelectedSellerPlan] = useState<ListingPlanId | ''>(selectedPlanFromQuery || '');
  const [ownerOperatorQuantity, setOwnerOperatorQuantity] = useState(1);
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [enrollmentForm, setEnrollmentForm] = useState<SellerProgramEnrollmentFormData>(() => {
    const stored = parseStoredEnrollment();
    return {
      ...createDefaultSellerProgramEnrollmentForm({ planId: selectedPlanFromQuery || '' }),
      ...stored,
      planId: selectedPlanFromQuery || (stored?.planId || ''),
    };
  });
  const flowIntent = String(searchParams.get('intent') || '').trim().toLowerCase();
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';

  const openLeadForm = (type: 'media-kit' | 'support') => {
    setRequestType(type);
    setMediaKitSent(false);
    setShowMediaKitModal(true);
  };

  const focusEnrollmentSection = () => {
    window.requestAnimationFrame(() => {
      enrollmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const focusSellerTypesSection = () => {
    window.requestAnimationFrame(() => {
      sellerTypesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const sellerTiers: SellerTier[] = [
    {
      title: 'Owner-Operator Ad Program',
      price: '$39/MO',
      planId: 'individual_seller',
      roleLabel: 'owner-operator',
      icon: User,
      summary: 'For independent owners and small operators selling equipment directly.',
      features: [
        'Professional seller profile',
        'Direct inquiry capture',
        'Listing review and approval workflow',
        'Optional Featured Inventory add-on',
      ],
    },
    {
      title: 'Dealer',
      price: '$499/MO',
      planId: 'dealer',
      roleLabel: 'dealer',
      icon: Building2,
      summary: 'For active dealerships managing inventory, leads, and branded growth campaigns.',
      features: [
        'Dealer storefront and branding',
        'Up to 50 active machine listings',
        'Priority inventory management tools',
        'Lead notifications and response workflow',
        'Optional Featured Inventory add-on for extra placement',
      ],
      highlight: true,
    },
    {
      title: 'Pro Dealer',
      price: '$999/MO',
      planId: 'fleet_dealer',
      roleLabel: 'pro dealer',
      icon: Crown,
      summary: 'For high-volume dealer groups that need expanded scale, visibility, and ad coverage.',
      features: [
        'Up to 150 active machine listings',
        'Expanded dealer merchandising',
        'Top placement opportunities',
        'Priority admin support',
        'Optional Featured Inventory add-on for extra placement',
      ],
    },
  ];

  const selectedTier = useMemo(
    () => sellerTiers.find((tier) => tier.planId === selectedSellerPlan) || null,
    [selectedSellerPlan, sellerTiers]
  );
  const statementLabel = getSellerProgramStatementLabel(selectedSellerPlan);
  const scopeLabel = getSellerProgramScopeLabel(selectedSellerPlan);
  const hasCurrentSellerSubscription = hasActiveSellerSubscription(user);
  const currentSellerPlanId = hasCurrentSellerSubscription ? user?.activeSubscriptionPlanId || null : null;
  const currentSellerPlanLabel = getSellerPlanMarketingLabel(currentSellerPlanId);
  const currentSellerPlanPurchaseLabel = getSellerPlanPurchaseLabel(currentSellerPlanId);
  const currentSellerBillingLabel = currentSellerPlanId ? getSellerProgramStatementLabel(currentSellerPlanId) : 'Member';
  const selectedPlanChangeDirection = getSellerPlanChangeDirection(currentSellerPlanId, selectedSellerPlan || null);
  const isCurrentSelectedPlan = Boolean(currentSellerPlanId && selectedSellerPlan === currentSellerPlanId);
  const canExpandOwnerOperatorPlan = selectedSellerPlan === 'individual_seller' && currentSellerPlanId === 'individual_seller';
  const requiresSupportPlanChange = Boolean(
    hasCurrentSellerSubscription &&
    currentSellerPlanId &&
    selectedSellerPlan &&
    selectedSellerPlan !== currentSellerPlanId
  );
  const companyRequired = selectedSellerPlan === 'dealer' || selectedSellerPlan === 'fleet_dealer';
  const ownerOperatorMonthlyTotal = clampOwnerOperatorQuantity(ownerOperatorQuantity) * 39;
  const canSubmitEnrollment = Boolean(
    selectedSellerPlan &&
    enrollmentForm.legalFullName.trim() &&
    enrollmentForm.legalTitle.trim() &&
    enrollmentForm.billingEmail.trim() &&
    enrollmentForm.phoneNumber.trim() &&
    enrollmentForm.country.trim() &&
    (!companyRequired || enrollmentForm.companyName.trim()) &&
    enrollmentForm.acceptedTerms &&
    enrollmentForm.acceptedPrivacy &&
    enrollmentForm.acceptedRecurringBilling &&
    enrollmentForm.acceptedVisibilityPolicy &&
    enrollmentForm.acceptedAuthority
  );
  const enrollmentStateTitle = !selectedSellerPlan
    ? 'Select a Seller Plan'
    : !hasCurrentSellerSubscription
      ? 'New Seller Subscription'
      : canExpandOwnerOperatorPlan
        ? 'Owner-Operator Expansion'
        : isCurrentSelectedPlan
          ? 'Current Active Seller Plan'
          : selectedPlanChangeDirection === 'upgrade'
            ? 'Plan Change Requires Support'
            : 'Tier Change Requires Support';
  const enrollmentStateMessage = !selectedSellerPlan
    ? 'Choose the plan you want this account to use, then complete the enrollment form below.'
    : !hasCurrentSellerSubscription
      ? 'This account does not have an active seller subscription yet. Completing checkout will activate the selected plan for this logged-in account.'
      : canExpandOwnerOperatorPlan
        ? 'This account already has an active Owner-Operator subscription. You can add more listing slots here up to the supported cap.'
        : isCurrentSelectedPlan
          ? `This account is already on ${currentSellerPlanPurchaseLabel}. Use support if you need billing help or a managed account change.`
          : selectedPlanChangeDirection === 'upgrade'
            ? `This account is currently on ${currentSellerPlanLabel}. Moving to ${getSellerPlanMarketingLabel(selectedSellerPlan)} should be handled as a managed support change so billing and listing visibility stay consistent.`
            : `This account is currently on ${currentSellerPlanLabel}. Changing down to ${getSellerPlanMarketingLabel(selectedSellerPlan)} should be handled by support so billing history and public listing visibility stay clean.`;
  const primaryEnrollmentCtaLabel = pendingPlanCheckout
    ? 'Redirecting to Stripe...'
    : !isAuthenticated
      ? 'Sign In and Continue'
      : canExpandOwnerOperatorPlan
        ? 'Add Owner-Operator Slots in Stripe'
        : isCurrentSelectedPlan
          ? 'Current Active Plan'
          : requiresSupportPlanChange
            ? 'Contact Support to Change Plan'
            : 'Continue to Stripe Checkout';
  const disablePrimaryEnrollmentCta = !selectedSellerPlan || pendingPlanCheckout !== null || (isCurrentSelectedPlan && !canExpandOwnerOperatorPlan);

  useEffect(() => {
    if (!selectedPlanFromQuery) return;
    setSelectedSellerPlan(selectedPlanFromQuery);
    setEnrollmentForm((prev) => ({ ...prev, planId: selectedPlanFromQuery }));
  }, [selectedPlanFromQuery]);

  useEffect(() => {
    if (selectedPlanFromQuery || selectedSellerPlan || !currentSellerPlanId) return;
    if (!isListingPlanId(currentSellerPlanId)) return;

    setSelectedSellerPlan(currentSellerPlanId);
    setEnrollmentForm((prev) => ({ ...prev, planId: currentSellerPlanId }));
  }, [currentSellerPlanId, selectedPlanFromQuery, selectedSellerPlan]);

  useEffect(() => {
    if (!selectedSellerPlan) return;
    setEnrollmentForm((prev) => ({ ...prev, planId: selectedSellerPlan }));
  }, [selectedSellerPlan]);

  /* Autofill removed — seller enrollment fields must be completed manually. */

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(enrollmentForm));
  }, [enrollmentForm]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    let shouldReplace = false;

    if (searchParams.get('startCheckout') === '1' || searchParams.get('resumeEnrollment') === '1') {
      setCheckoutNotice('Review your business details and legal acknowledgements, then continue to Stripe checkout.');
      focusEnrollmentSection();
      nextParams.delete('startCheckout');
      nextParams.delete('resumeEnrollment');
      shouldReplace = true;
    }

    if (shouldReplace) {
      setSearchParams(nextParams, { replace: true, preventScrollReset: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSelectSellerPlan = (planId: ListingPlanId) => {
    const nextParams = new URLSearchParams(searchParams);
    const currentPlanInUrl = nextParams.get('plan');

    setSelectedSellerPlan(planId);
    setCheckoutError('');
    setCheckoutNotice('');
    setEnrollmentForm((prev) => ({ ...prev, planId }));

    if (currentPlanInUrl !== planId) {
      nextParams.set('plan', planId);
      setSearchParams(nextParams, { replace: true, preventScrollReset: true });
    }

    focusEnrollmentSection();
  };

  const handleEnrollmentFieldChange = (
    key: keyof SellerProgramEnrollmentFormData,
    value: string | boolean
  ) => {
    setEnrollmentForm((prev) => ({ ...prev, [key]: value }));
  };

  const startPlanCheckout = async () => {
    if (!selectedSellerPlan) {
      setCheckoutError('Choose a seller plan before continuing.');
      focusEnrollmentSection();
      return;
    }

    if (!canSubmitEnrollment) {
      setCheckoutError('Complete the enrollment form and legal acknowledgements before continuing.');
      focusEnrollmentSection();
      return;
    }

    if (!isAuthenticated) {
      const nextParams = new URLSearchParams();
      nextParams.set('plan', selectedSellerPlan);
      nextParams.set('resumeEnrollment', '1');
      if (flowIntent === 'list-equipment') {
        nextParams.set('intent', 'list-equipment');
      }
      navigate('/login', {
        state: {
          from: `/ad-programs?${nextParams.toString()}`,
        },
      });
      return;
    }

    setPendingPlanCheckout(selectedSellerPlan);
    setCheckoutError('');
    setCheckoutNotice('');

    if (isCurrentSelectedPlan && !canExpandOwnerOperatorPlan) {
      setCheckoutNotice(`This account is already on ${currentSellerPlanPurchaseLabel}. If you need help with billing or a plan change, contact support.`);
      setPendingPlanCheckout(null);
      focusEnrollmentSection();
      return;
    }

    if (requiresSupportPlanChange) {
      setCheckoutNotice(`This account is currently on ${currentSellerPlanLabel}. Dealer-tier changes are handled by support so billing, invoicing, and listing visibility stay consistent.`);
      setPendingPlanCheckout(null);
      focusEnrollmentSection();
      return;
    }

    try {
      const returnParams = new URLSearchParams({
        source: 'ad-programs',
        plan: selectedSellerPlan,
      });
      if (flowIntent === 'list-equipment') {
        returnParams.set('intent', 'list-equipment');
      }

      const quantity = selectedSellerPlan === 'individual_seller'
        ? clampOwnerOperatorQuantity(ownerOperatorQuantity)
        : 1;

      const { url } = await billingService.createAccountCheckoutSession(
        selectedSellerPlan,
        `/subscription-success?${returnParams.toString()}`,
        quantity,
        {
          legalFullName: enrollmentForm.legalFullName.trim(),
          legalTitle: enrollmentForm.legalTitle.trim(),
          companyName: enrollmentForm.companyName.trim(),
          billingEmail: enrollmentForm.billingEmail.trim(),
          phoneNumber: enrollmentForm.phoneNumber.trim(),
          website: enrollmentForm.website.trim(),
          country: enrollmentForm.country.trim(),
          taxIdOrVat: enrollmentForm.taxIdOrVat.trim(),
          notes: enrollmentForm.notes.trim(),
          acceptedTerms: enrollmentForm.acceptedTerms,
          acceptedPrivacy: enrollmentForm.acceptedPrivacy,
          acceptedRecurringBilling: enrollmentForm.acceptedRecurringBilling,
          acceptedVisibilityPolicy: enrollmentForm.acceptedVisibilityPolicy,
          acceptedAuthority: enrollmentForm.acceptedAuthority,
          legalTermsVersion: SELLER_PROGRAM_AGREEMENT_VERSION,
          source: 'ad-programs',
        }
      );
      window.location.assign(url);
    } catch (error) {
      console.error('Failed to start account checkout from ad programs:', error);
      setCheckoutError(error instanceof Error ? error.message : 'Unable to start Stripe checkout right now.');
      setPendingPlanCheckout(null);
    }
  };

  const submitMediaKitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMediaKit(true);
    try {
      const rcToken = await getRecaptchaToken('MEDIA_KIT_REQUEST');
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'MEDIA_KIT_REQUEST');
        if (!pass) {
          alert('Security check failed. Please try again.');
          setSendingMediaKit(false);
          return;
        }
      }

      await addDoc(collection(db, 'mediaKitRequests'), {
        ...mediaKitForm,
        requestType,
        createdAt: serverTimestamp(),
        source: requestType === 'support' ? 'ad-programs-support' : 'ad-programs-media-kit',
      });
      setMediaKitSent(true);
      setMediaKitForm({ firstName: '', companyName: '', email: '', phone: '', notes: '' });
    } catch (error) {
      console.error('Failed to submit media kit request:', error);
      alert('Unable to send the media kit request right now.');
    } finally {
      setSendingMediaKit(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Seller Ad Programs | List Equipment | Forestry Equipment Sales"
        description="Choose an Owner-Operator, Dealer, or Pro Dealer subscription to list forestry equipment on the Forestry Equipment Sales marketplace."
        canonicalPath="/ad-programs"
      />
      {/* Hero Section */}
      <ImageHero
        imageSrc="/page-photos/winter-log-road.jpg"
        imageAlt="Winter logging road through snow-covered forest"
        contentClassName="max-w-7xl"
      >
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="label-micro text-accent mb-4 block">Seller Growth</span>
            <h1 className={`text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8 ${heroHeadingClass}`}>
              SELLER TOOLS <br />
              <span className={heroSecondaryClass}>AND VISIBILITY</span>
            </h1>
            <p className={`text-lg leading-relaxed mb-10 max-w-2xl ${heroBodyClass}`}>
              Choose your Forestry Equipment Sales seller plan, complete the on-site enrollment form,
              agree to the seller legal terms, and continue into branded Stripe checkout.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={focusSellerTypesSection} className="btn-industrial btn-accent">
                Start Seller Enrollment <ArrowRight size={16} className="ml-2" />
              </button>
              <button onClick={() => openLeadForm('support')} className="btn-industrial">
                Connect with Support Team
              </button>
            </div>
          </motion.div>
        </div>
      </ImageHero>

      <section ref={sellerTypesRef} className="py-24 px-4 md:px-8 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="label-micro text-accent mb-4 block">Seller Types</span>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-4">Ad Program Selections</h2>
            <p className="text-muted max-w-2xl">Choose your subscription, complete the enrollment form below, agree to the legal terms on-site, and then continue into Stripe checkout.</p>
            {hasCurrentSellerSubscription && currentSellerPlanId && (
              <div className="mt-6 border border-line bg-bg rounded-sm p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Current Seller Subscription</p>
                <p className="text-sm text-muted mt-2">
                  This account is currently on <span className="font-black text-foreground">{currentSellerPlanLabel}</span> with
                  {' '}<span className="font-black text-foreground">{currentSellerBillingLabel}</span> billing.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sellerTiers.map((tier, index) => {
              const Icon = tier.icon;
              const isSelected = selectedSellerPlan === tier.planId;
              const isCurrentPlan = hasCurrentSellerSubscription && currentSellerPlanId === tier.planId;
              const cardClassName = isCurrentPlan
                ? 'bg-bg border-accent shadow-[0_18px_60px_rgba(34,197,94,0.12)]'
                : tier.highlight
                  ? 'bg-bg border-accent shadow-[0_18px_60px_rgba(249,115,22,0.12)]'
                  : 'bg-bg border-line';
              const ctaLabel = isCurrentPlan
                ? isSelected
                  ? 'Current Active Plan'
                  : 'View Current Plan'
                : isSelected
                  ? 'Selected for Enrollment'
                  : `Select ${tier.title}`;

              return (
                <motion.div
                  key={tier.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`border p-8 rounded-sm transition-colors ${cardClassName} ${isSelected ? 'ring-1 ring-accent/60' : ''}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-sm border ${
                      isCurrentPlan
                        ? 'border-data/30 bg-data/10 text-data'
                        : tier.highlight
                          ? 'border-accent/30 bg-accent/10 text-accent'
                          : 'border-line bg-surface text-muted'
                    }`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isCurrentPlan && (
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-data">Current Plan</span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">{tier.roleLabel}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase mb-2">{tier.title}</h3>
                  <div className="text-3xl font-black tracking-tighter mb-4">{tier.price}</div>
                  <p className="text-sm text-muted leading-relaxed mb-6">{tier.summary}</p>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs font-bold uppercase tracking-wide">
                        <CheckCircle2 size={14} className="text-data shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <button
                      onClick={() => handleSelectSellerPlan(tier.planId)}
                      className={`btn-industrial w-full py-3 text-center ${isSelected || tier.highlight ? 'btn-accent' : ''}`}
                    >
                      {ctaLabel}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section ref={enrollmentRef} className="py-24 px-4 md:px-8 border-b border-line">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10">
          <div className="bg-surface border border-line p-8 md:p-10 rounded-sm">
            <div className="mb-8">
              <span className="label-micro text-accent mb-3 block">Enrollment Form</span>
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-3">Seller Program Signup</h2>
              <p className="text-sm text-muted leading-relaxed max-w-2xl">
                Capture billing and legal details on-site before redirecting to Stripe. This creates an auditable acceptance record in your database and keeps the subscription tied to the right account.
              </p>
            </div>

            {selectedSellerPlan && (
              <div className="border border-line bg-bg rounded-sm p-5 space-y-2 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">{enrollmentStateTitle}</p>
                <p className="text-sm text-muted leading-relaxed">{enrollmentStateMessage}</p>
                {hasCurrentSellerSubscription && currentSellerPlanId && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Current account plan: {currentSellerPlanLabel} | Billing label: {currentSellerBillingLabel}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label-micro block mb-2">Selected Plan</label>
                <div className="input-industrial w-full py-3 px-4 min-h-[52px] flex items-center">
                  {selectedTier?.title || 'Choose a seller plan above'}
                </div>
              </div>
              <div>
                <label className="label-micro block mb-2">Statement Label</label>
                <div className="input-industrial w-full py-3 px-4 min-h-[52px] flex items-center">
                  {statementLabel}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label-micro block mb-2">Legal Contact Name</label>
                <input
                  type="text"
                  value={enrollmentForm.legalFullName}
                  onChange={(e) => handleEnrollmentFieldChange('legalFullName', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder="AUTHORIZED SIGNER"
                />
              </div>
              <div>
                <label className="label-micro block mb-2">Legal Contact Title</label>
                <input
                  type="text"
                  value={enrollmentForm.legalTitle}
                  onChange={(e) => handleEnrollmentFieldChange('legalTitle', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder="OWNER, GM, OR AUTHORIZED REPRESENTATIVE"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label-micro block mb-2">
                  Business or Dealer Name {companyRequired ? '(Required)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={enrollmentForm.companyName}
                  onChange={(e) => handleEnrollmentFieldChange('companyName', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder={companyRequired ? 'DEALERSHIP ENTITY NAME' : 'COMPANY OR DBA'}
                />
              </div>
              <div>
                <label className="label-micro block mb-2">Billing Email</label>
                <input
                  type="email"
                  value={enrollmentForm.billingEmail}
                  onChange={(e) => handleEnrollmentFieldChange('billingEmail', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder="BILLING@YOURCOMPANY.COM"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label-micro block mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={enrollmentForm.phoneNumber}
                  onChange={(e) => handleEnrollmentFieldChange('phoneNumber', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder="+1 (555) 555-5555"
                />
              </div>
              <div>
                <label className="label-micro block mb-2">Website</label>
                <input
                  type="url"
                  value={enrollmentForm.website}
                  onChange={(e) => handleEnrollmentFieldChange('website', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label-micro block mb-2">Billing Country</label>
                <input
                  type="text"
                  value={enrollmentForm.country}
                  onChange={(e) => handleEnrollmentFieldChange('country', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder="UNITED STATES"
                />
              </div>
              <div>
                <label className="label-micro block mb-2">Tax ID / VAT ID (Optional)</label>
                <input
                  type="text"
                  value={enrollmentForm.taxIdOrVat}
                  onChange={(e) => handleEnrollmentFieldChange('taxIdOrVat', e.target.value)}
                  className="input-industrial w-full py-3"
                  placeholder="EIN OR VAT ID"
                />
              </div>
            </div>

            {selectedSellerPlan === 'individual_seller' && (
              <div className="border border-line rounded-sm p-4 bg-bg space-y-3 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink">Owner-Operator Quantity</p>
                    <p className="text-xs text-muted">Set the number of active listing slots from 1 to 10.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOwnerOperatorQuantity((prev) => clampOwnerOperatorQuantity(prev - 1))}
                      className="btn-industrial py-1.5 px-3 text-xs"
                      disabled={pendingPlanCheckout === 'individual_seller' || ownerOperatorQuantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={clampOwnerOperatorQuantity(ownerOperatorQuantity)}
                      onChange={(e) => setOwnerOperatorQuantity(clampOwnerOperatorQuantity(Number(e.target.value)))}
                      className="input-industrial w-20 text-center"
                      disabled={pendingPlanCheckout === 'individual_seller'}
                    />
                    <button
                      type="button"
                      onClick={() => setOwnerOperatorQuantity((prev) => clampOwnerOperatorQuantity(prev + 1))}
                      className="btn-industrial py-1.5 px-3 text-xs"
                      disabled={pendingPlanCheckout === 'individual_seller' || ownerOperatorQuantity >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">
                  Total: ${ownerOperatorMonthlyTotal}/month for {clampOwnerOperatorQuantity(ownerOperatorQuantity)} active {clampOwnerOperatorQuantity(ownerOperatorQuantity) === 1 ? 'listing slot' : 'listing slots'}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="label-micro block mb-2">Enrollment Notes (Optional)</label>
              <textarea
                value={enrollmentForm.notes}
                onChange={(e) => handleEnrollmentFieldChange('notes', e.target.value)}
                className="input-industrial w-full min-h-28 resize-y py-3"
                placeholder="Anything we should know about your storefront, billing workflow, or launch timing?"
              />
            </div>

            <div className="border border-line bg-bg rounded-sm p-5 space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-accent shrink-0" size={18} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent">Required Legal Acknowledgements</p>
                  <p className="text-xs text-muted">These approvals are recorded in your database and copied into the Stripe subscription metadata.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={enrollmentForm.acceptedTerms}
                  onChange={(e) => handleEnrollmentFieldChange('acceptedTerms', e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I agree to the <Link to={SELLER_PROGRAM_TERMS_PATH} className="text-accent font-black uppercase tracking-wide">Terms of Service</Link>, including marketplace conduct, listing accuracy, recurring subscription billing, and platform enforcement rights.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={enrollmentForm.acceptedPrivacy}
                  onChange={(e) => handleEnrollmentFieldChange('acceptedPrivacy', e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I agree to the <Link to={SELLER_PROGRAM_PRIVACY_PATH} className="text-accent font-black uppercase tracking-wide">Privacy Policy</Link> and consent to storage of billing, profile, and operational data needed to run this seller account globally.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={enrollmentForm.acceptedRecurringBilling}
                  onChange={(e) => handleEnrollmentFieldChange('acceptedRecurringBilling', e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I understand this is a recurring monthly subscription. If billing lapses, listings remain stored but are hidden from the public site until billing is restored.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={enrollmentForm.acceptedVisibilityPolicy}
                  onChange={(e) => handleEnrollmentFieldChange('acceptedVisibilityPolicy', e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I understand that listing visibility depends on an active, paid seller subscription, compliance review, and platform governance checks.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={enrollmentForm.acceptedAuthority}
                  onChange={(e) => handleEnrollmentFieldChange('acceptedAuthority', e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I confirm that I am authorized to bind this account or business entity to the selected seller subscription and related legal terms.
                </span>
              </label>
            </div>

            {checkoutNotice && (
              <p className="text-[10px] font-black uppercase tracking-widest text-data mb-4">{checkoutNotice}</p>
            )}

            {checkoutError && (
              <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">{checkoutError}</p>
            )}

            <button
              type="button"
              onClick={() => {
                if (requiresSupportPlanChange) {
                  openLeadForm('support');
                  return;
                }
                void startPlanCheckout();
              }}
              disabled={disablePrimaryEnrollmentCta}
              className="btn-industrial btn-accent w-full py-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {primaryEnrollmentCtaLabel}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-bg border border-line p-8 rounded-sm">
              <span className="label-micro text-accent mb-3 block">Enrollment Summary</span>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
                {selectedTier?.title || 'Choose a Plan'}
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-6">
                {selectedTier?.summary || 'Select an Owner-Operator, Dealer, or Pro Dealer plan to continue.'}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
                  <BadgeCheck size={14} className="text-data" />
                  <span>Billing label: {statementLabel}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
                  <FileText size={14} className="text-data" />
                  <span>Agreement version: {SELLER_PROGRAM_AGREEMENT_VERSION}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
                  <Globe2 size={14} className="text-data" />
                  <span>Operational scope: {scopeLabel}</span>
                </div>
              </div>

              <div className="border border-line bg-surface p-4 rounded-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Enterprise Billing Logic</p>
                <ul className="space-y-2 text-sm text-muted leading-relaxed">
                  <li>The subscription is tied to this logged-in account, not just the visible role string.</li>
                  <li>Dealer and Pro Dealer subscriptions map to FES-DealerOS billing labels and invoice records.</li>
                  <li>If billing lapses, listings stay stored in the database but public visibility is suspended until billing is restored.</li>
                </ul>
              </div>

              {hasCurrentSellerSubscription && currentSellerPlanId && (
                <div className="border border-line bg-surface p-4 rounded-sm mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Current Account Plan</p>
                  <ul className="space-y-2 text-sm text-muted leading-relaxed">
                    <li>Current plan: {currentSellerPlanPurchaseLabel}</li>
                    <li>Billing label: {currentSellerBillingLabel}</li>
                    <li>Seller status: {String(user?.subscriptionStatus || 'active').trim() || 'active'}</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-bg border border-line p-8 rounded-sm">
              <span className="label-micro text-accent mb-3 block">Need Help?</span>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Support Before Checkout</h3>
              <p className="text-sm text-muted leading-relaxed mb-6">
                If you need help choosing the right plan, setting up DealerOS, or aligning the right ad coverage, contact support before starting the subscription.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={() => openLeadForm('support')} className="btn-industrial btn-accent">
                  Connect with Support Team
                </button>
                <button onClick={() => openLeadForm('media-kit')} className="btn-industrial">
                  Download Media Kit (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto bg-ink text-bg p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-6">
                READY TO UPGRADE YOUR <br />
                SELLER PRESENCE?
              </h2>
              <p className="text-muted leading-relaxed">
                Choose the right subscription tier, then manage featured placement directly from your profile once the seller account is active.
              </p>
            </div>
            <div className="flex flex-col space-y-4 w-full md:w-auto">
              <button onClick={focusEnrollmentSection} className="btn-industrial btn-accent w-full">
                Complete Enrollment
              </button>
              <button onClick={() => openLeadForm('media-kit')} className="btn-industrial border-white/20 hover:bg-white hover:text-ink w-full">
                Download Media Kit (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Modal */}
      <AnimatePresence>
        {showMediaKitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg border border-line w-full max-w-xl p-8 rounded-sm shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="label-micro text-accent mb-1 block">
                    {requestType === 'support' ? 'Support Request' : 'Media Kit Request'}
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-ink">
                    {requestType === 'support' ? 'Contact Support Team' : 'Request Media Kit'}
                  </h3>
                </div>
                <button onClick={() => setShowMediaKitModal(false)} className="p-2 text-muted hover:text-ink">
                  <X size={24} />
                </button>
              </div>

              {mediaKitSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-data/10 text-data border border-data/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight mb-2">Request Sent</h4>
                  <p className="text-sm text-muted mb-6">
                    {requestType === 'support'
                      ? 'Your support request has been emailed to our team.'
                      : 'Your media kit request has been emailed to our team. We will send the brochure as soon as it is available.'}
                  </p>
                  <button onClick={() => setShowMediaKitModal(false)} className="btn-industrial btn-accent px-8 py-3">Close</button>
                </div>
              ) : (
                <form onSubmit={submitMediaKitRequest} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label-micro block mb-2">First Name</label>
                      <input type="text" required value={mediaKitForm.firstName} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, firstName: e.target.value }))} className="input-industrial w-full py-3" placeholder="Name" />
                    </div>
                    <div>
                      <label className="label-micro block mb-2">Company Name</label>
                      <input type="text" value={mediaKitForm.companyName} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, companyName: e.target.value }))} className="input-industrial w-full py-3" placeholder="Company" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label-micro block mb-2">Email</label>
                      <input type="email" required value={mediaKitForm.email} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, email: e.target.value }))} className="input-industrial w-full py-3" placeholder="Email" />
                    </div>
                    <div>
                      <label className="label-micro block mb-2">Phone</label>
                      <input type="tel" value={mediaKitForm.phone} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, phone: e.target.value }))} className="input-industrial w-full py-3" placeholder="Phone" />
                    </div>
                  </div>
                  <div>
                    <label className="label-micro block mb-2">Notes</label>
                    <textarea value={mediaKitForm.notes} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, notes: e.target.value }))} className="input-industrial w-full min-h-32 resize-y py-3" placeholder={requestType === 'support' ? 'Tell our support team what you need help with.' : 'Tell us what inventory, audience, or region you want to target.'} />
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                    Protected by reCAPTCHA Enterprise before submission.
                  </p>
                  <button disabled={sendingMediaKit} type="submit" className="btn-industrial btn-accent w-full py-4">
                    {sendingMediaKit ? 'Sending Request...' : requestType === 'support' ? 'Send Support Request' : 'Request Media Kit'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
