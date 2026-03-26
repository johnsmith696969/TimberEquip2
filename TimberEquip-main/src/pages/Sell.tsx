import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ListingModal } from '../components/admin/ListingModal';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { SubscriptionPaymentModal } from '../components/SubscriptionPaymentModal';
import { useAuth } from '../components/AuthContext';
import { equipmentService } from '../services/equipmentService';
import { billingService } from '../services/billingService';
import type { ListingPlanId } from '../services/billingService';
import { useLocale } from '../components/LocaleContext';
import { auth } from '../firebase';
import { canUserPostListings } from '../utils/sellerAccess';

const VERIFIED_ROLES = new Set(['admin', 'super_admin', 'dealer', 'pro_dealer']);
const ADMIN_PUBLISHER_ROLES = new Set(['admin', 'super_admin', 'developer']);
const MANAGED_SELLER_ROLES = new Set(['dealer', 'pro_dealer']);
const SUPPORTED_PLANS = new Set<ListingPlanId>(['individual_seller', 'dealer', 'fleet_dealer']);

export function Sell() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [checkoutStatusMessage, setCheckoutStatusMessage] = useState('');
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const selectedPlanFromQueryRaw = String(searchParams.get('plan') || '').trim() as ListingPlanId;
  const selectedPlanFromQuery = SUPPORTED_PLANS.has(selectedPlanFromQueryRaw)
    ? selectedPlanFromQueryRaw
    : undefined;

  const sellerIsVerified = !!(user?.role && VERIFIED_ROLES.has(user.role));
  const adminCanPublishWithoutPayment = !!(user?.role && ADMIN_PUBLISHER_ROLES.has(user.role));
  const hasActiveSellerPlan = !!(user?.activeSubscriptionPlanId && user?.accountStatus === 'active');
  const hasManagedSellerAccess = !!(user?.role && MANAGED_SELLER_ROLES.has(user.role) && user.accountStatus === 'active');
  const canPostListings = canUserPostListings(user);
  const activePlanId = user?.activeSubscriptionPlanId || selectedPlanFromQuery || undefined;
  const activeListingCap = typeof user?.listingCap === 'number' && user.listingCap > 0 ? user.listingCap : null;

  useEffect(() => {
    const accountCheckout = searchParams.get('accountCheckout');
    const checkout = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    const listingId = searchParams.get('listingId');

    if (!checkout && !accountCheckout) return;

    setShowModal(false);
    setShowSubscriptionModal(false);

    if (accountCheckout === 'canceled') {
      setPaymentCompleted(false);
      setCheckoutStatusMessage('Seller plan checkout was canceled. Choose a plan to activate posting when you are ready.');
      setSearchParams({}, { replace: true });
      return;
    }

    if (accountCheckout === 'success' && sessionId) {
      let mounted = true;
      const confirmAccountCheckout = async () => {
        try {
          setIsConfirmingCheckout(true);
          const result = await billingService.confirmCheckoutSession(sessionId);
          if (!mounted) return;

          if (result.paid) {
            setPaymentCompleted(true);
            setCheckoutStatusMessage('Seller account activated. You can now create listings within your plan limits.');
            setShowModal(true);
          } else {
            setPaymentCompleted(false);
            setCheckoutStatusMessage('Checkout finished, but your seller account is still processing. Please refresh in a moment.');
          }
        } catch (err) {
          if (!mounted) return;
          const message = err instanceof Error ? err.message : 'Unable to confirm your seller account checkout session.';
          setPaymentCompleted(false);
          setError(message);
        } finally {
          if (mounted) {
            setIsConfirmingCheckout(false);
            setSearchParams({}, { replace: true });
          }
        }
      };

      void confirmAccountCheckout();
      return () => {
        mounted = false;
      };
    }

    if (checkout === 'canceled') {
      if (listingId) setSubmittedId(listingId);
      setCheckoutStatusMessage('Checkout was canceled. Your listing is saved, and you can finish payment when you are ready.');
      setPaymentCompleted(false);
      setSearchParams({}, { replace: true });
      return;
    }

    if (checkout === 'success' && sessionId) {
      let mounted = true;
      const confirm = async () => {
        try {
          setIsConfirmingCheckout(true);
          const result = await billingService.confirmCheckoutSession(sessionId);
          if (!mounted) return;

          const resolvedListingId = (result.listingId as string | null | undefined) || listingId || null;
          if (resolvedListingId) {
            setSubmittedId(resolvedListingId);
          }

          if (result.paid) {
            setPaymentCompleted(true);
            setCheckoutStatusMessage('Payment received. Your listing is now in the review queue.');
          } else {
            setPaymentCompleted(false);
            setCheckoutStatusMessage('Checkout finished, but payment is still processing. Please refresh in a moment.');
          }
        } catch (err) {
          if (!mounted) return;
          const message = err instanceof Error ? err.message : 'Unable to confirm your Stripe checkout session.';
          setPaymentCompleted(false);
          setError(message);
        } finally {
          if (mounted) {
            setIsConfirmingCheckout(false);
            setSearchParams({}, { replace: true });
          }
        }
      };

      void confirm();
      return () => {
        mounted = false;
      };
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowModal(false);
      return;
    }

    if (canPostListings && !submittedId && !isConfirmingCheckout) {
      setShowModal(true);
      return;
    }

    if (!canPostListings) {
      setShowModal(false);
    }
  }, [isAuthenticated, canPostListings, submittedId, isConfirmingCheckout]);

  useEffect(() => {
    if (!isAuthenticated || canPostListings || adminCanPublishWithoutPayment) {
      return;
    }

    if (isConfirmingCheckout || submittedId || paymentCompleted) {
      return;
    }

    const nextParams = new URLSearchParams();
    if (selectedPlanFromQuery) {
      nextParams.set('plan', selectedPlanFromQuery);
    }
    nextParams.set('intent', 'list-equipment');

    navigate(`/ad-programs?${nextParams.toString()}`, { replace: true });
  }, [
    adminCanPublishWithoutPayment,
    canPostListings,
    isAuthenticated,
    isConfirmingCheckout,
    navigate,
    paymentCompleted,
    selectedPlanFromQuery,
    submittedId,
  ]);

  const doSave = async (formData: any, uid: string) => {
    try {
      setIsSubmitting(true);
      setError('');
      if (!adminCanPublishWithoutPayment && !canPostListings) {
        throw new Error('Choose a seller plan before creating a listing.');
      }
      if (!adminCanPublishWithoutPayment && activeListingCap && user?.uid) {
        const activeListingUsage = await equipmentService.getSellerListingUsage(user.uid);
        if (activeListingUsage >= activeListingCap) {
          throw new Error(`Your account includes up to ${activeListingCap} active ${activeListingCap === 1 ? 'listing' : 'listings'}. Upgrade or mark one as sold before posting another.`);
        }
      }
      const listingId = await equipmentService.addListing({
        ...formData,
        sellerUid: uid,
        status: 'pending',
        views: 0,
        leads: 0,
        marketValueEstimate: null,
        paymentStatus: adminCanPublishWithoutPayment || canPostListings ? 'paid' : 'pending',
        subscriptionPlanId: activePlanId,
      });
      setSubmittedId(listingId || null);
      setPaymentCompleted(true);
      setShowModal(false);
      setShowSubscriptionModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit listing right now.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (formData: any) => {
    if (!isAuthenticated || !user) {
      // Store form data and prompt for login
      setPendingFormData(formData);
      setShowLoginModal(true);
      return;
    }
    await doSave(formData, user.uid);
  };

  const handleLoginSuccess = async () => {
    const currentUser = auth.currentUser;
    if (pendingFormData && currentUser) {
      try {
        await doSave(pendingFormData, currentUser.uid);
      } catch {
        // Keep the form state so the user can retry after fixing any issue.
        return;
      }
      setPendingFormData(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-4 md:px-8 py-12">
      <Seo
        title="Sell Equipment | List Your Machine Fast"
        description="List your equipment with category specs, photos, optional video, and a quick condition checklist."
        canonicalPath="/sell"
      />

      <div className="max-w-5xl mx-auto">
        <div className="bg-surface border border-line p-6 md:p-8 rounded-sm mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-4">{t('sell.title', 'List Your Equipment')}</h1>
          <p className="text-muted font-medium mb-6">
            {t('sell.description', 'Post your machine with full basic information, pricing and location, at least 5 photos, and any optional specs or condition notes you want to include.')}
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {sellerIsVerified ? (
              <div className="inline-flex items-center gap-2 bg-data/10 text-data border border-data/30 px-3 py-2 rounded-sm">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Seller Account Ready</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/30 px-3 py-2 rounded-sm">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Seller Setup In Progress</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2 bg-ink/5 text-ink border border-line px-3 py-2 rounded-sm">
              <CheckCircle2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Jobsite-Ready Listing Specs</span>
            </div>
          </div>

          {!isAuthenticated && (
            <button onClick={() => setShowLoginModal(true)} className="btn-industrial btn-accent py-3 px-6">
              Sign In to Submit Listing
            </button>
          )}

          {isAuthenticated && !canPostListings && !adminCanPublishWithoutPayment && (
            <div className="mt-4 bg-accent/10 border border-accent/30 rounded-sm p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-accent mb-2">Seller Activation Required</p>
              <p className="text-sm text-ink/80 mb-4">
                Redirecting you to seller plan signup. Free member accounts can sign in and save inventory, but posting requires an active seller plan.
              </p>
              <button onClick={() => navigate(`/ad-programs?intent=list-equipment${selectedPlanFromQuery ? `&plan=${encodeURIComponent(selectedPlanFromQuery)}` : ''}`)} className="btn-industrial btn-accent py-3 px-6">
                {selectedPlanFromQuery ? 'Activate Selected Plan' : 'Choose Seller Plan'}
              </button>
            </div>
          )}

          {selectedPlanFromQuery && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-accent break-all">
              Selected plan: {selectedPlanFromQuery.replace('_', ' ')}
            </p>
          )}

          {error && (
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-accent break-all">{error}</p>
          )}

          {checkoutStatusMessage && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-data break-all">{checkoutStatusMessage}</p>
          )}

          {isConfirmingCheckout && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-muted break-all">Confirming Stripe checkout...</p>
          )}
        </div>

        {submittedId && paymentCompleted && !showSubscriptionModal && (
          <div className="bg-data/10 border border-data/30 p-6 rounded-sm mb-8">
            <p className="text-[11px] font-black uppercase tracking-widest text-data mb-2">Listing Submitted</p>
            <p className="text-sm text-ink/80 mb-4">
              {adminCanPublishWithoutPayment ? 'Your listing has been saved and published.' : 'Your listing is in review and will go live after approval.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowModal(true)} className="btn-industrial py-2 px-4">Post Another</button>
              <button onClick={() => navigate('/profile')} className="btn-industrial btn-accent py-2 px-4">Go to Profile</button>
            </div>
          </div>
        )}

        {submittedId && !paymentCompleted && !showSubscriptionModal && (
          <div className="bg-accent/10 border border-accent/30 p-6 rounded-sm mb-8">
            <p className="text-[11px] font-black uppercase tracking-widest text-accent mb-2">Payment Needed</p>
            <p className="text-sm text-ink/80 mb-4">
              Finish payment to activate this listing and send it to the review queue.
            </p>
            <button onClick={() => setShowSubscriptionModal(true)} className="btn-industrial btn-accent py-2 px-4">
              Continue to Payment
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ListingModal
          isOpen={true}
          onClose={() => {
            if (isSubmitting) return;
            setShowModal(false);
            navigate('/');
          }}
          onSave={handleSave}
          listing={null}
        />
      )}

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => { setShowLoginModal(false); setPendingFormData(null); }}
        onSuccess={handleLoginSuccess}
        message="Sign in or create an account to submit your listing."
      />

      <SubscriptionPaymentModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        checkoutMode="account"
        initialPlan={selectedPlanFromQuery}
        returnPath={`/sell?plan=${encodeURIComponent(selectedPlanFromQuery || 'dealer')}`}
      />
    </div>
  );
}

