import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target,
  CheckCircle2,
  ArrowRight,
  Building2,
  User,
  Crown,
  X
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocale } from '../components/LocaleContext';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { billingService, type ListingPlanId } from '../services/billingService';
import { MetaAdProgramBreakdown } from '../components/MetaAdProgramBreakdown';
import { useAuth } from '../components/AuthContext';

type AdProgram = {
  title: string;
  desc: string;
  icon: typeof Target;
  benefits: string[];
  price: string;
  audience: string;
};

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { formatNumber, formatPrice } = useLocale();
  const [selectedProgram, setSelectedProgram] = useState<AdProgram | null>(null);
  const [showMediaKitModal, setShowMediaKitModal] = useState(false);
  const [sendingMediaKit, setSendingMediaKit] = useState(false);
  const [mediaKitSent, setMediaKitSent] = useState(false);
  const [requestType, setRequestType] = useState<'media-kit' | 'support'>('media-kit');
  const [stats, setStats] = useState({
    monthlyActiveBuyers: 0,
    avgEquipmentValue: 0,
    globalReachCountries: 0,
    conversionRate: 0,
    asOf: '',
  });
  const [mediaKitForm, setMediaKitForm] = useState({
    firstName: '',
    companyName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [pendingPlanCheckout, setPendingPlanCheckout] = useState<ListingPlanId | null>(null);
  const flowIntent = String(searchParams.get('intent') || '').trim().toLowerCase();

  const openLeadForm = (type: 'media-kit' | 'support') => {
    setRequestType(type);
    setMediaKitSent(false);
    setShowMediaKitModal(true);
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/marketplace-stats', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Failed to load stats: ${res.status}`);
        const payload = await res.json();
        setStats({
          monthlyActiveBuyers: Number(payload?.monthlyActiveBuyers || 0),
          avgEquipmentValue: Number(payload?.avgEquipmentValue || 0),
          globalReachCountries: Number(payload?.globalReachCountries || 0),
          conversionRate: Number(payload?.conversionRate || 0),
          asOf: String(payload?.asOf || ''),
        });
      } catch (error) {
        console.error('Failed to load marketplace stats for ad programs:', error);
      }
    };

    loadStats();
  }, []);

  const programs: AdProgram[] = [
    {
      title: "Featured Inventory",
      desc: "Boost a listing above the standard feed with premium merchandising across search and category pages.",
      icon: Target,
      benefits: ["Higher Visibility", "Premium Badge", "Top-Of-Page Placement"],
      price: "$20/MO",
      audience: "Available as an add-on for every seller subscription"
    }
  ];

  const sellerTiers: SellerTier[] = [
    {
      title: 'Owner Operator Ad Program',
      price: '$39/MO',
      planId: 'individual_seller',
      roleLabel: 'owner operator',
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
      summary: 'For active dealerships managing inventory, leads, and branded Meta growth campaigns.',
      features: [
        'Includes $250 in Meta ad spend',
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
        'Includes $500 in Meta ad spend',
        'Up to 150 active machine listings',
        'Expanded dealer merchandising',
        'Top placement opportunities',
        'Priority admin support',
        'Optional Featured Inventory add-on for extra placement',
      ],
    },
  ];

  const startPlanCheckout = async (planId: ListingPlanId) => {
    const nextParams = new URLSearchParams();
    if (flowIntent === 'list-equipment') {
      nextParams.set('intent', 'list-equipment');
    }
    nextParams.set('plan', planId);

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `/ad-programs?${nextParams.toString()}&startCheckout=1`,
        },
      });
      return;
    }

    const returnPath = flowIntent === 'list-equipment'
      ? `/sell?plan=${encodeURIComponent(planId)}`
      : '/profile?source=ad-programs';

    setPendingPlanCheckout(planId);
    try {
      const { url } = await billingService.createAccountCheckoutSession(
        planId,
        returnPath
      );
      window.location.assign(url);
    } catch (error) {
      console.error('Failed to start account checkout from ad programs:', error);
      alert(error instanceof Error ? error.message : 'Unable to start Stripe checkout right now.');
      setPendingPlanCheckout(null);
    }
  };

  useEffect(() => {
    const plan = String(searchParams.get('plan') || '').trim() as ListingPlanId;
    const startCheckout = searchParams.get('startCheckout') === '1';
    if (!startCheckout || !isAuthenticated) return;
    if (plan !== 'individual_seller' && plan !== 'dealer' && plan !== 'fleet_dealer') return;
    if (pendingPlanCheckout) return;

    void startPlanCheckout(plan);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('startCheckout');
    setSearchParams(nextParams, { replace: true });
  }, [flowIntent, isAuthenticated, navigate, pendingPlanCheckout, searchParams, setSearchParams]);

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
      {/* Hero Section */}
      <section className="relative py-24 px-4 md:px-8 border-b border-line overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="industrial-grid w-full h-full" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="label-micro text-accent mb-4 block">Seller Growth</span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8">
              SELLER TOOLS <br />
              <span className="text-accent">AND VISIBILITY</span>
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-10 max-w-2xl">
              Pair your Forestry Equipment Sales seller plan with Featured Inventory to move key equipment higher in the marketplace.
              Built for owner operators, dealers, and high-volume dealer groups.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => openLeadForm('media-kit')} className="btn-industrial btn-accent">
                Download Media Kit (Coming Soon) <ArrowRight size={16} className="ml-2" />
              </button>
              <button onClick={() => openLeadForm('support')} className="btn-industrial">
                Connect with Support Team
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 md:px-8 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Monthly Active Buyers', value: stats.monthlyActiveBuyers > 0 ? formatNumber(stats.monthlyActiveBuyers) : 'N/A' },
            { label: 'Avg. Equipment Value', value: stats.avgEquipmentValue > 0 ? formatPrice(stats.avgEquipmentValue, 'USD', 0) : 'N/A' },
            { label: 'Global Reach', value: stats.globalReachCountries > 0 ? `${formatNumber(stats.globalReachCountries)} Countries` : 'N/A' },
            { label: 'Conversion Rate', value: stats.conversionRate > 0 ? `${stats.conversionRate.toFixed(1)}%` : 'N/A' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="label-micro mb-1">{stat.label}</span>
              <span className="text-2xl font-black tracking-tight value-mono">{stat.value}</span>
            </div>
          ))}
        </div>
        {stats.asOf && (
          <div className="max-w-7xl mx-auto mt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Data as of {new Date(stats.asOf).toLocaleDateString()}
            </span>
          </div>
        )}
      </section>

      {/* Programs Grid */}
      <section className="py-24 px-4 md:px-8 border-b border-line">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-4">Strategic Ad Programs</h2>
            <p className="text-muted max-w-xl">A focused visibility upgrade for sellers who want more exposure on priority inventory.</p>
          </div>

          <div className="mb-10">
            <MetaAdProgramBreakdown />
          </div>

          <div className="grid grid-cols-1 gap-1">
            {programs.map((program, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-line p-8 md:p-10 hover:border-accent transition-colors group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-10 items-start">
                  <div>
                    <div className="w-12 h-12 bg-bg border border-line flex items-center justify-center mb-8 group-hover:bg-accent group-hover:text-white transition-colors">
                      <program.icon size={24} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase mb-4">{program.title}</h3>
                    <p className="text-sm text-muted leading-relaxed mb-6 max-w-2xl">
                      {program.desc}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent">{program.audience}</p>
                  </div>

                  <div className="bg-bg border border-line p-6 rounded-sm">
                    <span className="label-micro text-accent mb-3 block">Included Boosts</span>
                    <ul className="space-y-3 mb-6">
                      {program.benefits.map((benefit, j) => (
                        <li key={j} className="flex items-center text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 size={14} className="text-data mr-3" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-lg font-black text-ink uppercase">{program.price}</span>
                      <button 
                        onClick={() => setSelectedProgram(program)}
                        className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center hover:text-accent transition-colors"
                      >
                        Set Up Program <ArrowRight size={12} className="ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 md:px-8 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="label-micro text-accent mb-4 block">Seller Types</span>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-4">Subscription Tiers</h2>
            <p className="text-muted max-w-2xl">Choose your subscription, complete checkout in Stripe, then return to your account dashboard with your posting limits enabled.</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent mt-4">
              Flow: select plan -&gt; login if needed -&gt; Stripe checkout -&gt; account dashboard with posting limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sellerTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`border p-8 rounded-sm transition-colors ${tier.highlight ? 'bg-bg border-accent shadow-[0_18px_60px_rgba(249,115,22,0.12)]' : 'bg-bg border-line'}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-sm border ${tier.highlight ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-surface text-muted'}`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">{tier.roleLabel}</span>
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
                      onClick={() => startPlanCheckout(tier.planId)}
                      disabled={pendingPlanCheckout === tier.planId}
                      className={`btn-industrial w-full py-3 text-center disabled:opacity-60 disabled:cursor-not-allowed ${tier.highlight ? 'btn-accent' : ''}`}
                    >
                      {pendingPlanCheckout === tier.planId ? 'Redirecting to Stripe...' : `Choose ${tier.title}`}
                    </button>
                  </div>
                </motion.div>
              );
            })}
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
                Choose the right subscription tier, then spotlight your most important inventory with Featured Inventory.
              </p>
            </div>
            <div className="flex flex-col space-y-4 w-full md:w-auto">
              <button onClick={() => openLeadForm('support')} className="btn-industrial btn-accent w-full">
                Connect with Support Team
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
                      <input type="text" required value={mediaKitForm.firstName} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, firstName: e.target.value }))} className="input-industrial w-full py-3" placeholder="CALEB" />
                    </div>
                    <div>
                      <label className="label-micro block mb-2">Company Name</label>
                      <input type="text" value={mediaKitForm.companyName} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, companyName: e.target.value }))} className="input-industrial w-full py-3" placeholder="FORESTRY EQUIPMENT SALES" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label-micro block mb-2">Email</label>
                      <input type="email" required value={mediaKitForm.email} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, email: e.target.value }))} className="input-industrial w-full py-3" placeholder="YOU@EMAIL.COM" />
                    </div>
                    <div>
                      <label className="label-micro block mb-2">Phone</label>
                      <input type="tel" value={mediaKitForm.phone} onChange={(e) => setMediaKitForm((prev) => ({ ...prev, phone: e.target.value }))} className="input-industrial w-full py-3" placeholder="(555) 555-5555" />
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

        {selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg border border-line w-full max-w-lg p-8 rounded-sm shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="label-micro text-accent mb-1 block">Program Setup</span>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-ink">{selectedProgram.title}</h3>
                </div>
                <button onClick={() => setSelectedProgram(null)} className="p-2 text-muted hover:text-ink">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div className="bg-surface p-4 border border-line rounded-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted leading-relaxed">{selectedProgram.desc}</p>
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Target Category</label>
                  <select className="input-industrial w-full">
                    <option>All Inventory</option>
                    <option>Feller Bunchers</option>
                    <option>Skidders</option>
                    <option>Harvesters</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Monthly Budget Cap</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">$</span>
                    <input type="number" defaultValue="500" className="input-industrial w-full pl-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Campaign Duration</label>
                  <select className="input-industrial w-full">
                    <option>30 Days</option>
                    <option>90 Days</option>
                    <option>Ongoing</option>
                  </select>
                </div>
              </div>

              <div className="bg-surface p-4 border border-line mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-muted">Placement Level</span>
                  <span className="text-xs font-black text-ink uppercase">Featured Inventory - $20/MO</span>
                </div>
                <div className="w-full h-1 bg-line rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-accent" />
                </div>
              </div>

              <button 
                onClick={() => {
                  openLeadForm('support');
                  setSelectedProgram(null);
                }}
                className="btn-industrial btn-accent w-full py-4"
              >
                Confirm Program Setup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
