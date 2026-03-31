import React, { useState, useEffect } from 'react';
import {
  Calculator as CalcIcon, DollarSign,
  Percent, Calendar, ArrowRight,
  ShieldCheck, Clock, Activity,
  TrendingUp, Info, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '../components/LocaleContext';
import { Seo } from '../components/Seo';

export function Calculator() {
  const { formatPrice } = useLocale();
  const [amount, setAmount] = useState(250000);
  const [downPayment, setDownPayment] = useState(50000);
  const [term, setTerm] = useState(60);
  const [rate, setRate] = useState(6.25);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    const principal = amount - downPayment;
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = term;
    
    if (monthlyRate === 0) {
      setMonthlyPayment(principal / numberOfPayments);
    } else {
      const x = Math.pow(1 + monthlyRate, numberOfPayments);
      const monthly = (principal * x * monthlyRate) / (x - 1);
      setMonthlyPayment(monthly);
    }
  }, [amount, downPayment, term, rate]);

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Equipment Financing Calculator | Forestry Equipment Sales"
        description="Estimate monthly payments on forestry and logging equipment. Adjust price, down payment, term, and interest rate to plan your next purchase."
        canonicalPath="/calculator"
      />
      {/* Header */}
      <div className="bg-surface border-b border-line py-24 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-sm">
              <CalcIcon className="text-white" size={20} />
            </div>
            <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">Financing Calculator</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
            Financing <br />
            <span className="text-accent">Calculator</span>
          </h1>
          <p className="text-muted font-medium max-w-2xl leading-relaxed">
            Estimate your monthly capital requirements using our institutional-grade financing tool. 
            All rates are subject to final credit approval and market conditions.
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Calculator Inputs */}
          <div className="lg:col-span-7 space-y-12">
            <div className="bg-bg border border-line p-12 shadow-2xl">
              <div className="space-y-10">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="label-micro">Equipment Purchase Price (USD)</label>
                    <span className="text-xl font-black tracking-tighter">{formatPrice(amount, 'USD', 0)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="50000" 
                    max="2000000" 
                    step="10000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="label-micro">Down Payment (USD)</label>
                    <span className="text-xl font-black tracking-tighter">{formatPrice(downPayment, 'USD', 0)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={amount * 0.5} 
                    step="5000"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col space-y-4">
                    <label className="label-micro">Financing Term (Months)</label>
                    <select 
                      value={term}
                      onChange={(e) => setTerm(Number(e.target.value))}
                      className="bg-surface border border-line p-4 text-sm font-bold uppercase tracking-wider focus:ring-accent focus:border-accent"
                    >
                      {[24, 36, 48, 60, 72, 84].map(t => (
                        <option key={t} value={t}>{t} Months</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="label-micro">Interest Rate (APR %)</label>
                      <span className="text-xs font-black text-data uppercase tracking-widest">Prime: 6.25%</span>
                    </div>
                    <div className="flex items-center bg-surface border border-line p-1 rounded-sm focus-within:border-accent transition-colors">
                      <div className="p-4 text-muted">
                        <Percent size={18} />
                      </div>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="flex-1 bg-transparent border-none py-4 text-lg font-black tracking-tighter focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-line p-8 flex items-start space-x-6">
              <div className="p-3 bg-bg border border-line rounded-sm">
                <Info className="text-accent" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-tight mb-2">Disclaimer</span>
                <p className="text-[11px] font-medium text-muted leading-relaxed uppercase tracking-widest">
                  The calculated monthly payment is an estimate for informational purposes only. 
                  Actual terms will depend on credit score, entity history, and asset technical verification.
                </p>
              </div>
            </div>
          </div>

          {/* Results Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-8">
              <div className="bg-ink text-white p-12 rounded-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <span className="label-micro text-accent mb-4 block">Estimated Monthly Payment</span>
                  <div className="flex items-end space-x-2 mb-12">
                    <span className="text-6xl font-black tracking-tighter text-white">{formatPrice(Math.round(monthlyPayment), 'USD', 0)}</span>
                    <span className="text-sm font-bold text-white/40 uppercase mb-3">/ Month</span>
                  </div>

                  <div className="space-y-6 border-t border-white/10 pt-8 mb-12">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Principal</span>
                      <span className="text-sm font-black tracking-tight">{formatPrice(amount - downPayment, 'USD', 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Interest</span>
                      <span className="text-sm font-black tracking-tight">{formatPrice(Math.round((monthlyPayment * term) - (amount - downPayment)), 'USD', 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Cost</span>
                      <span className="text-sm font-black tracking-tight text-accent">{formatPrice(Math.round(monthlyPayment * term), 'USD', 0)}</span>
                    </div>
                  </div>

                  <button className="btn-industrial btn-accent w-full py-5 text-lg">
                    Apply for Financing
                    <ArrowRight className="ml-3" size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-surface border border-line p-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-accent">Financing Benefits</h4>
                <div className="space-y-6">
                  {[
                    { title: 'Tax Advantages', desc: 'Potential Section 179 deductions for equipment.', icon: ShieldCheck },
                    { title: 'Capital Preservation', desc: 'Maintain cash flow for operational expenses.', icon: Activity },
                    { title: 'Equipment Modernization', desc: 'Upgrade to late-model units with lower hours.', icon: TrendingUp }
                  ].map((item, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="p-2 bg-bg border border-line rounded-sm h-fit">
                        <item.icon className="text-accent" size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-tight mb-1">{item.title}</span>
                        <p className="text-[9px] font-medium text-muted leading-relaxed uppercase tracking-widest">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
