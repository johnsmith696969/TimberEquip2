import React, { useState, useEffect, useCallback } from 'react';
import { X, Calculator, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';

interface FinancingRequestPayload {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  company?: string;
  message?: string;
  requestedAmount: number;
  termMonths: number;
  interestRatePct: number;
  downPaymentPct: number;
  monthlyPaymentEstimate: number;
}

interface PaymentCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentName: string;
  price: number;
  currency?: string;
  onSubmitFinancingRequest?: (payload: FinancingRequestPayload) => Promise<void>;
}

const TERM_OPTIONS = [24, 36, 48, 60, 72, 84];

/** Standard amortisation: PMT = P × r(1+r)^n / ((1+r)^n − 1) */
function calcMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct === 0) return principal / months;
  const r = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

export function PaymentCalculatorModal({
  isOpen,
  onClose,
  equipmentName,
  price,
  currency = 'USD',
  onSubmitFinancingRequest,
}: PaymentCalculatorModalProps) {
  const [termMonths, setTermMonths] = useState(60);
  const [ratePct, setRatePct] = useState(8.5);
  const [downPct, setDownPct] = useState(10);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset defaults whenever the modal re-opens
  useEffect(() => {
    if (isOpen) {
      setTermMonths(60);
      setRatePct(8.5);
      setDownPct(10);
      setBuyerName('');
      setBuyerEmail('');
      setBuyerPhone('');
      setCompany('');
      setMessage('');
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [isOpen]);

  const downAmount  = (price * downPct) / 100;
  const principal   = price - downAmount;
  const monthly     = calcMonthlyPayment(principal, ratePct, termMonths);
  const totalCost   = monthly * termMonths + downAmount;
  const totalInterest = totalCost - price;
  const hasUnsavedChanges =
    !submitted &&
    (termMonths !== 60 ||
      ratePct !== 8.5 ||
      downPct !== 10 ||
      buyerName.trim().length > 0 ||
      buyerEmail.trim().length > 0 ||
      buyerPhone.trim().length > 0 ||
      company.trim().length > 0 ||
      message.trim().length > 0);

  const fmt = useCallback(
    (n: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n),
    [currency]
  );

  const handleSubmitFinancingRequest = async () => {
    if (!onSubmitFinancingRequest || submitting) return;
    if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) {
      window.alert('Please enter your name, email, and phone to submit a financing request.');
      return;
    }

    try {
      setSubmitting(true);
      const rcToken = await getRecaptchaToken('PAYMENT_CALCULATOR_FINANCING');
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'PAYMENT_CALCULATOR_FINANCING');
        if (!pass) {
          window.alert('Security check failed. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      await onSubmitFinancingRequest({
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerPhone: buyerPhone.trim(),
        company: company.trim() || undefined,
        message: message.trim() || undefined,
        requestedAmount: Math.round(principal),
        termMonths,
        interestRatePct: ratePct,
        downPaymentPct: downPct,
        monthlyPaymentEstimate: Math.round(monthly),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit financing request:', error);
      window.alert('Unable to submit financing request right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    if (hasUnsavedChanges && !window.confirm('Are you sure you want to discard changes?')) return;
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-bg border border-line relative z-10 mt-4 mb-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden shadow-2xl sm:my-8"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-ink text-white p-6 flex justify-between items-center">
              <div>
                <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] block mb-1">
                  Payment Calculator
                </span>
                <h3 className="text-xl font-black tracking-tighter uppercase leading-snug line-clamp-1">
                  {equipmentName}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 bg-white/10 hover:bg-white/20 transition-colors rounded-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Price Summary */}
              <div className="flex items-baseline justify-between border-b border-line pb-4">
                <span className="label-micro">Equipment Price</span>
                <span className="text-2xl font-black tracking-tighter">{fmt(price)}</span>
              </div>

              {/* Down Payment */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="label-micro">Down Payment</label>
                  <span className="text-sm font-black tracking-tighter">
                    {downPct}% — {fmt(downAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={downPct}
                  onChange={(e) => setDownPct(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-muted uppercase tracking-widest">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Term */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="label-micro">Loan Term</label>
                  <span className="text-sm font-black tracking-tighter">{termMonths} months</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {TERM_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTermMonths(t)}
                      className={`py-2 text-[10px] font-black uppercase tracking-wider border transition-colors ${
                        termMonths === t
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface border-line text-ink hover:border-accent/50'
                      }`}
                    >
                      {t}mo
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="label-micro">Annual Interest Rate</label>
                  <span className="text-sm font-black tracking-tighter">{ratePct.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={19}
                  step={0.25}
                  value={ratePct}
                  onChange={(e) => setRatePct(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-muted uppercase tracking-widest">
                  <span>3.00%</span>
                  <span>19.00%</span>
                </div>
              </div>

              {/* Results */}
              <div className="bg-ink text-white p-6 rounded-sm space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">
                      Est. Monthly Payment
                    </span>
                    <span className="text-4xl font-black tracking-tighter text-accent">
                      {fmt(monthly)}
                    </span>
                    <span className="text-white/40 text-xs font-bold ml-2">/mo</span>
                  </div>
                  <Calculator size={32} className="text-white/20" />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">Principal</span>
                    <span className="text-sm font-black tracking-tighter">{fmt(principal)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">Total Interest</span>
                    <span className="text-sm font-black tracking-tighter text-accent/80">{fmt(totalInterest)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">Total Cost</span>
                    <span className="text-sm font-black tracking-tighter">{fmt(totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-4 space-y-3">
                <span className="label-micro">Request Financing</span>
                {submitted ? (
                  <div className="bg-data/10 border border-data/20 text-data text-[10px] font-bold uppercase tracking-widest px-3 py-3">
                    Financing request sent. Admin will match you with a lender.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="input-industrial w-full"
                        placeholder="FULL NAME"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                      />
                      <input
                        type="email"
                        className="input-industrial w-full"
                        placeholder="EMAIL"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="tel"
                        className="input-industrial w-full"
                        placeholder="PHONE"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                      />
                      <input
                        type="text"
                        className="input-industrial w-full"
                        placeholder="COMPANY (OPTIONAL)"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                    <textarea
                      rows={3}
                      className="input-industrial w-full"
                      placeholder="NOTES FOR FINANCING TEAM (OPTIONAL)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                      Protected by reCAPTCHA Enterprise before submission.
                    </p>
                    <button
                      type="button"
                      onClick={handleSubmitFinancingRequest}
                      disabled={submitting || !onSubmitFinancingRequest}
                      className="btn-industrial btn-accent w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Send Financing Request'}
                    </button>
                  </>
                )}
              </div>

              <p className="text-[9px] font-medium text-muted leading-relaxed">
                Estimates are for informational purposes only and do not constitute a loan offer. Actual rates and terms vary by lender, credit profile, and equipment type.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
