import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Seo } from '../components/Seo';
import { billingService, SELLER_PLAN_DEFINITIONS } from '../services/billingService';
import { auth } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { getSellerProgramStatementLabel } from '../utils/sellerProgramAgreement';

export function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'processing' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your seller subscription...');
  const [resolvedPlanId, setResolvedPlanId] = useState<string | null>(null);

  const sessionId = String(searchParams.get('session_id') || '').trim();
  const intent = String(searchParams.get('intent') || '').trim().toLowerCase();
  const source = String(searchParams.get('source') || '').trim().toLowerCase();

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Missing Stripe session id. Please start the subscription checkout again.');
      return;
    }

    let active = true;
    const confirm = async () => {
      try {
        const result = await billingService.confirmCheckoutSession(sessionId);
        if (!active) return;

        setResolvedPlanId(result.planId || null);

        if (result.paid) {
          await auth.currentUser?.getIdToken(true);
          setStatus('success');
          setMessage('Your seller subscription is active and ready to use.');
          return;
        }

        setStatus('processing');
        setMessage('Your checkout returned successfully, but Stripe is still finalizing the subscription. Refresh again in a moment.');
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unable to confirm your seller subscription checkout.');
      }
    };

    void confirm();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const planDefinition = useMemo(
    () => SELLER_PLAN_DEFINITIONS.find((plan) => plan.id === resolvedPlanId),
    [resolvedPlanId]
  );
  const statementLabel = getSellerProgramStatementLabel(resolvedPlanId);
  const highlightListEquipment = intent === 'list-equipment';
  const heading = status === 'success'
    ? 'Seller Subscription Active'
    : status === 'processing'
      ? 'Subscription Processing'
      : status === 'error'
        ? 'Subscription Check Needed'
        : 'Finalizing Subscription';

  return (
    <div className="min-h-screen bg-bg px-4 py-16 md:px-8">
      <Seo
        title="Subscription Success | Forestry Equipment Sales"
        description="Confirm your Forestry Equipment Sales seller subscription and continue into your account."
        canonicalPath="/subscription-success"
      />

      <div className="mx-auto max-w-4xl">
        <div className="border border-line bg-surface p-8 md:p-12 rounded-sm">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="label-micro text-accent mb-3 block">Seller Billing</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-3">{heading}</h1>
              <p className="text-muted max-w-2xl leading-relaxed">{message}</p>
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${status === 'success' ? 'border-data/30 bg-data/10 text-data' : status === 'error' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-bg text-muted'}`}>
              {status === 'success' ? <CheckCircle2 size={28} /> : status === 'error' ? <AlertCircle size={28} /> : <Loader2 size={28} className="animate-spin" />}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="border border-line bg-bg p-4 rounded-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Plan</p>
              <p className="text-sm font-black uppercase tracking-tight text-ink">
                {planDefinition?.name || resolvedPlanId?.replace(/_/g, ' ') || 'Processing'}
              </p>
            </div>
            <div className="border border-line bg-bg p-4 rounded-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Billing Label</p>
              <p className="text-sm font-black uppercase tracking-tight text-ink">{statementLabel}</p>
            </div>
            <div className="border border-line bg-bg p-4 rounded-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Account</p>
              <p className="text-sm font-black uppercase tracking-tight text-ink">{user?.email || 'Sign in to continue to your account'}</p>
            </div>
          </div>

          <div className="border border-line bg-bg p-5 rounded-sm mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">What Happens Next</p>
            <ul className="space-y-2 text-sm text-muted leading-relaxed">
              <li>Your subscription remains tied to this signed-in account.</li>
              <li>If the subscription lapses or misses payment, listings remain stored but are hidden from the public marketplace until billing is restored.</li>
              <li>Dealer and Pro Dealer billing records are labeled under Forestry Equipment Sales DealerOS.</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <Link to="/sell" className={`btn-industrial py-3 px-5 ${highlightListEquipment ? 'btn-accent' : ''}`}>
                  List Equipment
                  <ArrowRight size={16} className="ml-2" />
                </Link>
                <Link to="/profile" className={`btn-industrial py-3 px-5 ${!highlightListEquipment ? 'btn-accent' : ''}`}>
                  My Account
                  <LayoutDashboard size={16} className="ml-2" />
                </Link>
              </>
            ) : (
              <Link to={`/login?redirect=${encodeURIComponent('/profile')}`} className="btn-industrial btn-accent py-3 px-5">
                Sign In To Continue
                <ArrowRight size={16} className="ml-2" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => navigate(source === 'ad-programs' ? '/ad-programs' : '/profile')}
              className="btn-industrial py-3 px-5"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
