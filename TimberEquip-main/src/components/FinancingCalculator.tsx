import React, { useState } from 'react';
import { Calculator, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLocale } from './LocaleContext';

export const FinancingCalculator: React.FC<{ initialPrice?: number }> = ({ initialPrice = 100000 }) => {
  const { formatPrice } = useLocale();
  const [price, setPrice] = useState(initialPrice);
  const [downPayment, setDownPayment] = useState(initialPrice * 0.2);
  const [interestRate, setInterestRate] = useState(5.5);
  const [term, setTerm] = useState(60);

  const principal = price - downPayment;
  const r = interestRate / 100 / 12;
  const n = term;
  const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return (
    <div className="bg-white border border-stone-200 tight-radius shadow-xl overflow-hidden">
      <div className="bg-primary p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calculator size={28} className="text-secondary" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Financing Calculator</h2>
        </div>
        <p className="text-stone-400 text-sm font-medium">Estimate your monthly payments for logging equipment.</p>
      </div>
      
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-3 tracking-wider">Equipment Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 tight-radius py-3 pl-10 pr-4 outline-none focus:border-primary transition-all font-bold text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-3 tracking-wider">Down Payment ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="number" 
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 tight-radius py-3 pl-10 pr-4 outline-none focus:border-primary transition-all font-bold text-stone-900"
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                <span>{Math.round((downPayment / price) * 100)}% of total</span>
                <button onClick={() => setDownPayment(price * 0.2)} className="text-secondary hover:text-primary transition-colors">Reset to 20%</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-3 tracking-wider">Interest Rate (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 tight-radius py-3 px-4 outline-none focus:border-primary transition-all font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-3 tracking-wider">Loan Term (Months)</label>
              <select 
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 tight-radius py-3 px-4 outline-none focus:border-primary transition-all font-bold text-stone-900"
              >
                {[24, 36, 48, 60, 72, 84].map(m => (
                  <option key={m} value={m}>{m} Months</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 tight-radius p-8 flex flex-col items-center justify-center text-center space-y-2">
          <div className="text-stone-500 text-xs font-bold uppercase tracking-widest">Estimated Monthly Payment</div>
          <div className="text-5xl font-black text-primary">{formatPrice(Math.round(monthlyPayment), 'USD', 0)}</div>
          <p className="text-stone-400 text-[10px] font-medium max-w-xs pt-4">
            *This is an estimate only. Actual rates and terms will depend on credit approval and lender requirements.
          </p>
        </div>

        <div className="pt-4">
          <button className="w-full bg-accent text-white py-5 font-black uppercase tracking-widest tight-radius hover:bg-accent/90 transition-all shadow-lg flex items-center justify-center gap-3">
            Get Pre-Approved Now <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
