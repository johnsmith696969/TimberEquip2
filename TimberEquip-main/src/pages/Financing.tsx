import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, ShieldCheck, Clock, 
  ArrowRight, CheckCircle2, AlertCircle,
  TrendingUp, Activity, LayoutDashboard,
  ChevronRight, DollarSign, FileText,
  Building, Briefcase, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { useAuth } from '../components/AuthContext';
import { ImageHero } from '../components/ImageHero';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';

export function Financing() {
  const FINANCING_CONTACT_CONSENT_VERSION = 'financing-contact-v1';
  const { user } = useAuth();
  const { theme } = useTheme();
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contactConsentAccepted, setContactConsentAccepted] = useState(false);
  const [formData, setFormData] = useState({
    businessStructure: '',
    legalEntityName: '',
    yearsInOperation: '',
    assetValue: '',
    requestedAmount: '',
    termLength: '60 Months',
    downPayment: '',
    contactName: '',
    contactEmail: user?.email || '',
    contactPhone: ''
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      contactName: prev.contactName || user?.displayName || '',
      contactEmail: prev.contactEmail || user?.email || '',
      contactPhone: prev.contactPhone || user?.phoneNumber || '',
    }));
  }, [user?.displayName, user?.email, user?.phoneNumber]);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError('');

    try {
      if (!contactConsentAccepted) {
        setSubmitError('Review and accept the financing contact consent notice before submitting your application.');
        setLoading(false);
        return;
      }

      const rcToken = await getRecaptchaToken('FINANCING_CENTER');
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'FINANCING_CENTER');
        if (!pass) {
          setSubmitError('Security check failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      await equipmentService.submitFinancingRequest({
        applicantName: formData.contactName || user?.displayName || 'Unknown Applicant',
        applicantEmail: formData.contactEmail || user?.email || '',
        applicantPhone: formData.contactPhone,
        company: formData.legalEntityName,
        requestedAmount: formData.requestedAmount ? Number(formData.requestedAmount) : undefined,
        message: `Structure: ${formData.businessStructure}; Years in operation: ${formData.yearsInOperation}; Equipment value: ${formData.assetValue}; Term: ${formData.termLength}; Down payment: ${formData.downPayment}`,
        contactConsentAccepted: true,
        contactConsentVersion: FINANCING_CONTACT_CONSENT_VERSION,
        contactConsentScope: 'financing_request_specific',
        contactConsentAt: new Date().toISOString(),
      });

      setLoading(false);
      setStep(4); // Success step
    } catch (error) {
      console.error('Failed to submit financing request:', error);
      setSubmitError('Unable to submit your financing application right now. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Equipment Financing | Apply for Credit | TimberEquip"
        description="Apply for flexible forestry equipment financing with fast approvals, competitive rates, and terms up to 84 months through TimberEquip."
        canonicalPath="/financing"
        imagePath="/page-photos/ponsse-buffalo-loading.webp"
        preloadImage="/page-photos/ponsse-buffalo-loading.webp"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Service',
              name: 'Forestry Equipment Financing',
              description: 'Apply for flexible forestry equipment financing with fast approvals, competitive rates, and terms up to 84 months.',
              url: 'https://timberequip.com/financing',
              provider: {
                '@type': 'Organization',
                name: 'TimberEquip',
                url: 'https://timberequip.com',
                telephone: '(612) 600-8268',
                email: 'support@timberequip.com',
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://timberequip.com' },
                { '@type': 'ListItem', position: 2, name: 'Financing', item: 'https://timberequip.com/financing' },
              ],
            },
          ],
        }}
      />
      {/* Header */}
      <ImageHero imageSrc="/page-photos/ponsse-buffalo-loading.webp" imageAlt="Ponsse Buffalo loading timber">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Building size={20} className="text-accent" />
            <span className="label-micro text-accent">Financing Center</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none ${heroHeadingClass}`}>
            Institutional <br />
            <span className={heroSecondaryClass}>Financing</span>
          </h1>
          <p className={`font-medium max-w-2xl leading-relaxed ${heroBodyClass}`}>
            Apply for equipment financing. Submit your details and get a credit decision, typically within one business day.
          </p>
        </div>
      </ImageHero>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Form Section */}
          <div className="lg:col-span-8">
            <div className="bg-bg border border-line shadow-2xl overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1.5 bg-line flex">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={`flex-1 transition-all duration-500 ${step >= i ? 'bg-accent' : 'bg-transparent'}`}
                  ></div>
                ))}
              </div>

              <div className="p-12">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="flex flex-col">
                        <span className="label-micro text-accent mb-2 block">Step 01</span>
                        <h3 className="text-3xl font-black uppercase tracking-tighter">Entity Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-business-structure" className="label-micro">Business Structure</label>
                          <select id="financing-business-structure" value={formData.businessStructure} onChange={(e) => setFormData({ ...formData, businessStructure: e.target.value })} className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent">
                            <option value="">-Select-</option>
                            <option value="Corporation">Corporation</option>
                            <option value="LLC">LLC</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Sole Proprietorship">Sole Proprietorship</option>
                          </select>
                        </div>
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-entity-name" className="label-micro">Legal Entity Name</label>
                          <input id="financing-entity-name" type="text" value={formData.legalEntityName} onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })} placeholder="Legal Entity Name" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-years-operation" className="label-micro">Years in Operation</label>
                          <input id="financing-years-operation" type="number" value={formData.yearsInOperation} onChange={(e) => setFormData({ ...formData, yearsInOperation: e.target.value })} placeholder="0" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                      </div>

                      <button type="button" onClick={handleNext} className="btn-industrial btn-accent py-5 px-12 w-full md:w-fit">
                        Continue to Equipment Details
                        <ArrowRight className="ml-3" size={18} />
                      </button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="flex flex-col">
                        <span className="label-micro text-accent mb-2 block">Step 02</span>
                        <h3 className="text-3xl font-black uppercase tracking-tighter">Equipment & Credit Requirements</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-asset-value" className="label-micro">Estimated Equipment Value (USD)</label>
                          <input id="financing-asset-value" type="number" value={formData.assetValue} onChange={(e) => setFormData({ ...formData, assetValue: e.target.value })} placeholder="0.00" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-requested-amount" className="label-micro">Requested Loan Amount (USD)</label>
                          <input id="financing-requested-amount" type="number" value={formData.requestedAmount} onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })} placeholder="0.00" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-term-length" className="label-micro">Preferred Term Length</label>
                          <select id="financing-term-length" value={formData.termLength} onChange={(e) => setFormData({ ...formData, termLength: e.target.value })} className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent">
                            <option>24 Months</option>
                            <option>36 Months</option>
                            <option>48 Months</option>
                            <option>60 Months</option>
                            <option>72 Months</option>
                            <option>84 Months</option>
                          </select>
                        </div>
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-down-payment" className="label-micro">Down Payment Available (USD)</label>
                          <input id="financing-down-payment" type="number" value={formData.downPayment} onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })} placeholder="0.00" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button type="button" onClick={handlePrev} className="btn-industrial py-5 px-12 bg-surface">Back</button>
                        <button type="button" onClick={handleNext} className="btn-industrial btn-accent py-5 px-12 flex-1">
                          Continue to Verification
                          <ArrowRight className="ml-3" size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="flex flex-col">
                        <span className="label-micro text-accent mb-2 block">Step 03</span>
                        <h3 className="text-3xl font-black uppercase tracking-tighter">Identity Verification</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-contact-name" className="label-micro">Primary Contact Name</label>
                          <input id="financing-contact-name" type="text" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} placeholder="E.G. JOHN DOE" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                        <div className="flex flex-col space-y-3">
                          <label htmlFor="financing-contact-email" className="label-micro">Primary Contact Email</label>
                          <input id="financing-contact-email" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="YOUR@EMAIL.COM" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                        <div className="flex flex-col space-y-3 md:col-span-2">
                          <label htmlFor="financing-contact-phone" className="label-micro">Primary Contact Phone</label>
                          <input id="financing-contact-phone" type="tel" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="+1 (800) 000-0000" className="bg-surface border border-line pl-4 pr-10 py-4 text-sm font-bold uppercase tracking-wider text-ink focus:ring-accent focus:border-accent" />
                        </div>
                      </div>

                      <div className="bg-surface/30 border border-line p-6 flex items-start space-x-4">
                        <input
                          type="checkbox"
                          className="w-5 h-5 border-line rounded-sm accent-accent mt-1"
                          id="consent"
                          checked={contactConsentAccepted}
                          onChange={(e) => setContactConsentAccepted(e.target.checked)}
                        />
                        <label htmlFor="consent" className="text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest cursor-pointer">
                          I authorize TimberEquip Financing and the specific lending or financing partners evaluating this request to contact me by phone, SMS, or email about this application, perform a credit inquiry, and verify the information provided. This consent is specific to this financing request, is not a condition of purchase, and may be withdrawn at any time.
                        </label>
                      </div>

                      {submitError && (
                        <div className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/30 p-3 rounded-sm">
                          {submitError}
                        </div>
                      )}

                      <p className="text-[10px] font-medium text-muted uppercase tracking-widest">
                        Protected by reCAPTCHA Enterprise before submission.
                      </p>

                      <div className="flex space-x-4">
                        <button type="button" onClick={handlePrev} className="btn-industrial py-5 px-12 bg-surface">Back</button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading}
                          className="btn-industrial btn-accent py-5 px-12 flex-1 flex items-center justify-center"
                        >
                          {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              Submit Application
                              <ArrowRight className="ml-3" size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-20 flex flex-col items-center text-center"
                    >
                      <div className="w-24 h-24 bg-data/10 text-data flex items-center justify-center rounded-full mb-10">
                        <CheckCircle2 size={48} />
                      </div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Application Submitted</h3>
                      <p className="text-muted font-medium max-w-md mb-12 leading-relaxed">
                        Your credit application has been successfully submitted to the TimberEquip Financing center. 
                        A credit officer will review your entity profile and contact you within 24 hours.
                      </p>
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link to="/profile?tab=Financing" className="btn-industrial btn-accent py-5 px-12">
                          View Application Status
                        </Link>
                        <Link to="/" className="btn-industrial py-5 px-12 bg-surface">
                          Return Home
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-surface border border-line p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-accent">Financing Policy</h4>
              <div className="space-y-8">
                {[
                  { title: 'Fast Approvals', desc: 'Initial credit decisions typically rendered within 24 hours.', icon: Clock },
                  { title: 'Flexible Terms', desc: 'Customized repayment schedules up to 84 months.', icon: Activity },
                  { title: 'Competitive Rates', desc: 'Starting from 6.25% APR for qualified entities.', icon: TrendingUp },
                  { title: 'Secure Handling', desc: 'All data submitted in this form is encrypted via HTTPS/TLS in transit and at rest by Google Cloud.', icon: ShieldCheck }
                ].map((item, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="p-2 bg-bg border border-line rounded-sm h-fit">
                      <item.icon className="text-accent" size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight mb-1">{item.title}</span>
                      <p className="text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
