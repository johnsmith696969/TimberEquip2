import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Loader2, User, Building2, AlertCircle, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useLocale } from './LocaleContext';
import { billingService, type ListingPlanId } from '../services/billingService';

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
    name: 'Owner Operator Ad Program',
    price: 39,
    period: 'month',
    icon: User,
    accountType: 'Single Listing',
    summary: 'Best for owner operators posting one machine at a time.',
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
    price: 499,
    period: 'month',
    icon: Building2,
    accountType: 'Dealer Inventory',
    summary: 'For dealer teams running a full monthly inventory with included ad spend.',
    listingCap: 50,
    managedAccountCap: 3,
    features: [
      'Includes $250 in Meta ad spend',
      'Up to 50 active machine listings',
      'Includes 3 managed team accounts',
      'Dealer-level visibility and lead flow',
      'Works for ongoing monthly inventory',
    ],
    highlight: true,
  },
  {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    price: 999,
    period: 'month',
    icon: Crown,
    accountType: 'High Volume Fleet',
    summary: 'For larger dealer groups posting high volume inventory with expanded ad spend.',
    listingCap: 150,
    managedAccountCap: 3,
    features: [
      'Includes $500 in Meta ad spend',
      'Up to 150 active machine listings',
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
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('dealer');
  const [subscriptionQuantity, setSubscriptionQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = PLANS.find((p) => p.id === selectedPlan)!;
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
    if (!isAccountCheckout && !listingId) {
      setError('Listing is missing. Please save the listing again and retry checkout.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { url } = isAccountCheckout
        ? await billingService.createAccountCheckoutSession(selectedPlan, returnPath, isOwnerOperatorAccountCheckout ? clampedQuantity : 1)
        : await billingService.createListingCheckoutSession(selectedPlan, listingId as string);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Stripe checkout right now.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-surface border border-line rounded-sm shadow-2xl my-8"
          >
            {/* Header */}
            <div className="bg-ink text-white p-6 flex items-start justify-between">
              <div>
                <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] block mb-1">{t('checkout.subscription', 'Seller Plan')}</span>
                <h2 className="text-2xl font-black tracking-tighter uppercase">
                  {t('checkout.choosePlan', 'Choose Your Plan')}
                </h2>
              </div>
              <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors p-1 -mt-1 -mr-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-muted font-medium mb-6">
                  {isAccountCheckout
                    ? t('checkout.selectSellerPlan', 'Pick the seller plan for this account, then continue to secure Stripe checkout.')
                    : t('checkout.selectPlan', 'Pick the ad package, then continue to secure Stripe checkout.')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((p) => {
                    const Icon = p.icon;
                    const isSelected = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlan(p.id)}
                        className={`relative text-left border rounded-sm p-5 transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/5'
                            : 'border-line bg-bg hover:border-accent/50'
                        }`}
                      >
                        {p.highlight && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                            Best Value
                          </span>
                        )}
                        <div className={`mb-3 ${isSelected ? 'text-accent' : 'text-muted'}`}>
                          <Icon size={20} />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{p.name}</div>
                        <div className="text-2xl font-black tracking-tighter mb-0.5">
                          ${p.price}
                          <span className="text-sm font-medium text-muted">/{p.period}</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">
                          {p.accountType} • {p.listingCap} {p.listingCap === 1 ? 'Machine' : 'Machines'}
                        </div>
                        {p.managedAccountCap ? (
                          <div className="text-[10px] font-black uppercase tracking-widest text-data mb-2">
                            {p.managedAccountCap} Team Accounts Included
                          </div>
                        ) : null}
                        <p className="text-xs text-muted mb-3 leading-relaxed">{p.summary}</p>
                        <ul className="space-y-1.5">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-muted">
                              <CheckCircle2 size={12} className="text-data shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {isOwnerOperatorAccountCheckout && (
                  <div className="border border-line rounded-sm p-4 bg-bg space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink">Owner Operator Quantity</p>
                        <p className="text-xs text-muted">Set active listing capacity from 1 to 10.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSubscriptionQuantity((prev) => Math.max(1, prev - 1))}
                          className="btn-industrial py-1.5 px-3 text-xs"
                          disabled={loading || clampedQuantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={clampedQuantity}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next)) {
                              setSubscriptionQuantity(1);
                              return;
                            }
                            setSubscriptionQuantity(Math.max(1, Math.min(10, Math.floor(next))));
                          }}
                          className="input-industrial w-20 text-center"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setSubscriptionQuantity((prev) => Math.min(10, prev + 1))}
                          className="btn-industrial py-1.5 px-3 text-xs"
                          disabled={loading || clampedQuantity >= 10}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">
                      Total: ${monthlyTotal}/month for {clampedQuantity} {clampedQuantity === 1 ? 'active listing' : 'active listings'}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-accent text-xs font-medium">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <p className="text-[10px] text-muted font-medium">
                  {isAccountCheckout
                    ? 'You will finish payment on Stripe and return with this seller account activated.'
                    : 'You will finish payment on Stripe and return here when checkout is complete.'}
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-industrial py-3 px-6"
                    disabled={loading}
                  >
                    {t('checkout.back', 'Back')}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartCheckout}
                    disabled={loading}
                    className="flex-1 btn-industrial btn-accent py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {loading
                      ? 'Redirecting to Stripe...'
                      : `${isAccountCheckout ? t('checkout.activateWith', 'Activate with') : t('checkout.continueWith', 'Continue with')} ${plan.name} — $${monthlyTotal}/mo`}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
