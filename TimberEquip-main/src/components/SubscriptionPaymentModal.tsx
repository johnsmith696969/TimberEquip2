import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Loader2, User, Building2, AlertCircle, Crown } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLocale } from './LocaleContext';
import { billingService, type ListingPlanId } from '../services/billingService';
import { getListingCapDisplayLabel, UNLIMITED_LISTING_CAP } from '../utils/listingCaps';

export type PlanId = ListingPlanId;

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  icon: React.ElementType;
  accountType: string;
  summary: string;
  listingCap: number;
  managedAccountCap?: number;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'individual_seller',
    name: 'Owner-Operator Ad Program',
    price: 39,
    period: 'month',
    icon: User,
    accountType: 'Single Listing',
    summary: 'Best for owner-operators posting one machine at a time.',
    listingCap: 1,
    features: [
      'Publish 1 active machine listing',
      'Leads and inquiry capture included',
      'Listing review before it goes live',
    ],
  },
  {
    id: 'dealer',
    name: 'Dealer Ad Package',
    price: 250,
    period: 'month',
    icon: Building2,
    accountType: 'Dealer Inventory',
    summary: 'For dealer teams running a branded storefront with 50 active listings and a 6-month free launch.',
    listingCap: 50,
    managedAccountCap: 3,
    features: [
      'Up to 50 active machine listings',
      '6 months free before monthly billing starts',
      'Includes 3 managed team accounts',
      'Dealer-level visibility and lead flow',
      'Works for ongoing monthly inventory',
    ],
    highlight: true,
  },
  {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    price: 500,
    period: 'month',
    icon: Crown,
    accountType: 'High Volume Fleet',
    summary: 'For larger dealer groups that need unlimited active inventory and a 3-month free launch.',
    listingCap: UNLIMITED_LISTING_CAP,
    managedAccountCap: 3,
    features: [
      'Unlimited active machine listings',
      '3 months free before monthly billing starts',
      'Includes 3 managed team accounts',
      'Built for larger multi-location teams',
      'Scale your ad coverage every month',
    ],
  },
];

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId?: string | null;
  initialPlan?: PlanId;
  checkoutMode?: 'listing' | 'account';
  returnPath?: string;
}

export function SubscriptionPaymentModal({
  isOpen,
  onClose,
  listingId,
  initialPlan,
  checkoutMode = 'listing',
  returnPath = '/sell',
}: SubscriptionPaymentModalProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('dealer');
  const [subscriptionQuantity, setSubscriptionQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = PLANS.find((candidate) => candidate.id === selectedPlan)!;
  const isAccountCheckout = checkoutMode === 'account';
  const isOwnerOperatorAccountCheckout = isAccountCheckout && selectedPlan === 'individual_seller';
  const clampedQuantity = Math.max(1, Math.min(10, Math.floor(subscriptionQuantity || 1)));
  const monthlyTotal = plan.price * (isOwnerOperatorAccountCheckout ? clampedQuantity : 1);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setLoading(false);
    if (initialPlan && PLANS.some((candidate) => candidate.id === initialPlan)) {
      setSelectedPlan(initialPlan);
    }
    setSubscriptionQuantity(1);
  }, [initialPlan, isOpen]);

  const handleStartCheckout = async () => {
    if (!user) {
      setError('Sign in is required before checkout.');
      return;
    }

    if (isAccountCheckout) {
      const intentParams = new URLSearchParams({
        plan: selectedPlan,
        intent: returnPath.includes('/sell') ? 'list-equipment' : 'account-settings',
      });
      onClose();
      navigate(`/ad-programs?${intentParams.toString()}`);
      return;
    }

    if (!listingId) {
      setError('Listing is missing. Please save the listing again and retry checkout.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { url } = await billingService.createListingCheckoutSession(selectedPlan, listingId);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Stripe checkout right now.');
      setLoading(false);
    }
  };

  const trapRef = useFocusTrap(isOpen);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-dialog-title"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            onClick={(event) => event.stopPropagation()}
            className="relative z-10 my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-line bg-surface shadow-2xl"
          >
            <div className="flex items-start justify-between bg-ink p-6 text-white">
              <div>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                  {t('checkout.subscription', 'Seller Plan')}
                </span>
                <h2 id="subscription-dialog-title" className="text-2xl font-black uppercase tracking-tighter">
                  {t('checkout.choosePlan', 'Choose Your Plan')}
                </h2>
              </div>
              <button onClick={handleClose} className="p-1 text-white/50 transition-colors hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="mb-6 text-sm font-medium text-muted">
                  {isAccountCheckout
                    ? t('checkout.selectSellerPlan', 'Pick the seller plan for this account, then continue to the ad-program enrollment form with legal and billing confirmation.')
                    : t('checkout.selectPlan', 'Pick the ad package, then continue to secure Stripe checkout.')}
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {PLANS.map((candidate) => {
                    const Icon = candidate.icon;
                    const isSelected = selectedPlan === candidate.id;

                    return (
                      <button
                        key={candidate.id}
                        onClick={() => setSelectedPlan(candidate.id)}
                        className={`relative rounded-sm border p-5 text-left transition-all ${
                          isSelected ? 'border-accent bg-accent/5' : 'border-line bg-bg hover:border-accent/50'
                        }`}
                      >
                        {candidate.highlight ? (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-sm bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                            Best Value
                          </span>
                        ) : null}
                        <div className={`mb-3 ${isSelected ? 'text-accent' : 'text-muted'}`}>
                          <Icon size={20} />
                        </div>
                        <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted">{candidate.name}</div>
                        <div className="mb-0.5 text-2xl font-black tracking-tighter">
                          ${candidate.price}
                          <span className="text-sm font-medium text-muted">/{candidate.period}</span>
                        </div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-accent">
                          {candidate.accountType} | {getListingCapDisplayLabel(candidate.listingCap, 'Machine', 'Machines')}
                        </div>
                        {candidate.managedAccountCap ? (
                          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-data">
                            {candidate.managedAccountCap} Team Accounts Included
                          </div>
                        ) : null}
                        <p className="mb-3 text-xs leading-relaxed text-muted">{candidate.summary}</p>
                        <ul className="space-y-1.5">
                          {candidate.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-1.5 text-xs text-muted">
                              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-data" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {isOwnerOperatorAccountCheckout ? (
                  <div className="space-y-3 rounded-sm border border-line bg-bg p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink">Owner-Operator Quantity</p>
                        <p className="text-xs text-muted">Set active listing capacity from 1 to 10.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSubscriptionQuantity((previous) => Math.max(1, previous - 1))}
                          className="btn-industrial px-3 py-1.5 text-xs"
                          disabled={loading || clampedQuantity <= 1}
                          aria-disabled={loading || clampedQuantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={clampedQuantity}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            if (!Number.isFinite(nextValue)) {
                              setSubscriptionQuantity(1);
                              return;
                            }
                            setSubscriptionQuantity(Math.max(1, Math.min(10, Math.floor(nextValue))));
                          }}
                          className="input-industrial w-20 text-center"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setSubscriptionQuantity((previous) => Math.min(10, previous + 1))}
                          className="btn-industrial px-3 py-1.5 text-xs"
                          disabled={loading || clampedQuantity >= 10}
                          aria-disabled={loading || clampedQuantity >= 10}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">
                      Total: ${monthlyTotal}/month for {clampedQuantity} {clampedQuantity === 1 ? 'active listing' : 'active listings'}
                    </p>
                  </div>
                ) : null}

                {error ? (
                  <div role="alert" className="flex items-center gap-2 text-xs font-medium text-accent">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <p className="text-[10px] font-medium text-muted">
                  {isAccountCheckout
                    ? 'You will confirm legal terms on the ad-program enrollment form, finish payment on Stripe, and return with this seller account activated.'
                    : 'You will finish payment on Stripe and return here when checkout is complete.'}
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-industrial px-6 py-3"
                    disabled={loading}
                    aria-disabled={loading}
                  >
                    {t('checkout.back', 'Back')}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartCheckout}
                    disabled={loading}
                    aria-disabled={loading}
                    aria-busy={loading}
                    className="btn-industrial btn-accent flex flex-1 items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>
                      {isAccountCheckout
                        ? `${t('checkout.activateWith', 'Activate with')} ${plan.name}`
                        : `${t('checkout.continueWith', 'Continue with')} ${plan.name}`}
                      {!isAccountCheckout || !isOwnerOperatorAccountCheckout ? ` - $${monthlyTotal}/mo` : ''}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
