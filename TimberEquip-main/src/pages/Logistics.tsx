import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Mail, MapPinned, Phone, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';
import { equipmentService } from '../services/equipmentService';
import { assessRecaptcha, getRecaptchaToken } from '../services/recaptchaService';

const LOGISTICS_CONTACT_CONSENT_VERSION = 'logistics-contact-v1';

type LogisticsFormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  equipmentReference: string;
  pickupLocation: string;
  destination: string;
  timeline: string;
  trailerType: string;
  loadReady: string;
  notes: string;
};

function createInitialForm(): LogisticsFormState {
  return {
    name: '',
    email: '',
    phone: '',
    company: '',
    equipmentReference: '',
    pickupLocation: '',
    destination: '',
    timeline: '',
    trailerType: 'Step deck',
    loadReady: 'Yes',
    notes: '',
  };
}

export function Logistics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<LogisticsFormState>(() => createInitialForm());
  const [contactConsentAccepted, setContactConsentAccepted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      name: current.name || user?.displayName || '',
      email: current.email || user?.email || '',
      phone: current.phone || user?.phoneNumber || '',
    }));
  }, [user?.displayName, user?.email, user?.phoneNumber]);

  const isDarkMode = theme === 'dark';
  const heroClasses = useMemo(() => ({
    shell: isDarkMode ? 'bg-surface text-ink border-b border-line' : 'bg-surface text-ink border-b border-line',
    image: isDarkMode
      ? 'object-center opacity-[0.62] brightness-[0.72] saturate-[0.88]'
      : 'object-center opacity-[0.055] brightness-125 saturate-50',
    gradient: isDarkMode
      ? 'bg-gradient-to-r from-[#050608]/90 via-[#050608]/72 to-[#050608]/42'
      : 'bg-gradient-to-r from-white via-white/[0.992] to-white/[0.95]',
    accentBand: isDarkMode ? 'bg-accent/22' : 'bg-white/92',
    titleLead: isDarkMode ? 'text-white' : 'text-ink',
    body: isDarkMode ? 'text-white/75' : 'text-ink/72',
  }), [isDarkMode]);

  const updateField = (field: keyof LogisticsFormState, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setSubmitError('Please complete the contact section before submitting your trucking request.');
        setSubmitting(false);
        return;
      }

      if (!formData.equipmentReference.trim() || !formData.pickupLocation.trim() || !formData.destination.trim()) {
        setSubmitError('Please include the equipment reference, pickup location, and delivery destination.');
        setSubmitting(false);
        return;
      }

      if (!contactConsentAccepted) {
        setSubmitError('Review and accept the logistics contact consent notice before submitting your request.');
        setSubmitting(false);
        return;
      }

      const rcToken = await getRecaptchaToken('DETAIL_LOGISTICS');
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'DETAIL_LOGISTICS');
        if (!pass) {
          setSubmitError('Security check failed. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      const logisticsSummary = [
        'Global Logistics Trucking Request',
        `Equipment Reference: ${formData.equipmentReference.trim()}`,
        `Pickup Location: ${formData.pickupLocation.trim()}`,
        `Destination: ${formData.destination.trim()}`,
        `Preferred Timeline: ${formData.timeline.trim() || 'Not provided'}`,
        `Trailer Type: ${formData.trailerType.trim() || 'Not provided'}`,
        `Load Ready: ${formData.loadReady.trim() || 'Not provided'}`,
        `Company: ${formData.company.trim() || 'Not provided'}`,
        `Notes: ${formData.notes.trim() || 'None provided'}`,
      ].join('\n');

      const inquiryId = await equipmentService.createInquiry({
        sellerUid: '',
        sellerId: '',
        buyerName: formData.name.trim(),
        buyerEmail: formData.email.trim(),
        buyerPhone: formData.phone.trim(),
        message: logisticsSummary,
        type: 'Shipping',
        contactConsentAccepted: true,
        contactConsentVersion: LOGISTICS_CONTACT_CONSENT_VERSION,
        contactConsentScope: 'logistics_request_specific',
        contactConsentAt: new Date().toISOString(),
      });

      if (!inquiryId) {
        throw new Error('Unable to create trucking request.');
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch (error) {
      console.error('Failed to submit logistics request:', error);
      setSubmitError('Unable to submit your trucking request right now. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Global Logistics | Trucking Request Form | Forestry Equipment Sales"
        description="Request trucking and heavy-haul coordination for forestry equipment with the Forestry Equipment Sales logistics team."
        canonicalPath="/logistics"
      />

      <Breadcrumbs
        items={[
          { label: 'Global Logistics', path: '/logistics' },
        ]}
      />

      <section className={`relative overflow-hidden px-4 py-24 transition-colors md:px-8 ${heroClasses.shell}`}>
        <div className="absolute inset-0 bg-bg">
          <img
            src="/page-photos/winter-log-road.jpg"
            alt="Forestry equipment transport route"
            className={`h-full w-full object-cover transition-opacity ${heroClasses.image}`}
          />
          <div className={`absolute inset-0 transition-colors ${heroClasses.gradient}`} />
          <div className={`absolute top-0 right-0 h-full w-1/3 translate-x-1/2 skew-x-12 transition-colors ${heroClasses.accentBand}`} />
        </div>

        <div className="relative z-10 mx-auto max-w-[1600px]">
          <div className="mb-6 flex items-center gap-3">
            <Truck size={20} className="text-accent" />
            <span className="label-micro text-accent">Global Logistics</span>
          </div>

          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl">
            <span className={heroClasses.titleLead}>Trucking</span> <br />
            <span className="text-accent">Request Form</span>
          </h1>

          <p className={`mt-8 max-w-2xl text-base font-medium leading-relaxed transition-colors ${heroClasses.body}`}>
            Need to move equipment? Fill out the form below with pickup and delivery details and we will follow up with a quote.
          </p>
        </div>
      </section>

      <section className="px-4 py-24 md:px-8">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="overflow-hidden border border-line bg-bg shadow-2xl">
              <div className="h-1.5 bg-accent" />

              {submitted ? (
                <div className="flex flex-col items-center px-8 py-20 text-center md:px-12">
                  <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-data/10 text-data">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-ink">Request Submitted</h2>
                  <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-muted md:text-base">
                    Your trucking request is in the queue. Forestry Equipment Sales can now review the route, equipment notes,
                    and timing details before following up with the next logistics step.
                  </p>
                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Link to="/search" className="btn-industrial btn-accent px-10 py-5">
                      Browse Inventory
                    </Link>
                    <Link to="/contact" className="btn-industrial bg-surface px-10 py-5">
                      Contact Support
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10 p-8 md:p-12">
                  <div>
                    <span className="label-micro mb-2 block text-accent">Trucking Intake</span>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-ink">Route And Load Details</h2>
                    <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted">
                      Share the core route information and any special hauling notes. This form is designed for general trucking
                      requests, not just one specific listing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-name" className="label-micro">Primary Contact Name</label>
                      <input
                        id="logistics-name"
                        type="text"
                        value={formData.name}
                        onChange={(event) => updateField('name', event.target.value)}
                        placeholder="Name"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-company" className="label-micro">Company</label>
                      <input
                        id="logistics-company"
                        type="text"
                        value={formData.company}
                        onChange={(event) => updateField('company', event.target.value)}
                        placeholder="Company"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-email" className="label-micro">Email</label>
                      <input
                        id="logistics-email"
                        type="email"
                        value={formData.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        placeholder="Email"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-phone" className="label-micro">Phone</label>
                      <input
                        id="logistics-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(event) => updateField('phone', event.target.value)}
                        placeholder="Phone"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3 md:col-span-2">
                      <label htmlFor="logistics-equipment-reference" className="label-micro">Equipment Reference</label>
                      <input
                        id="logistics-equipment-reference"
                        type="text"
                        value={formData.equipmentReference}
                        onChange={(event) => updateField('equipmentReference', event.target.value)}
                        placeholder="Listing title, stock number, dimensions, or shipment notes"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-pickup" className="label-micro">Pickup Location</label>
                      <input
                        id="logistics-pickup"
                        type="text"
                        value={formData.pickupLocation}
                        onChange={(event) => updateField('pickupLocation', event.target.value)}
                        placeholder="Duluth, Minnesota"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-destination" className="label-micro">Destination</label>
                      <input
                        id="logistics-destination"
                        type="text"
                        value={formData.destination}
                        onChange={(event) => updateField('destination', event.target.value)}
                        placeholder="Atlanta, Georgia"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-timeline" className="label-micro">Preferred Timeline</label>
                      <input
                        id="logistics-timeline"
                        type="text"
                        value={formData.timeline}
                        onChange={(event) => updateField('timeline', event.target.value)}
                        placeholder="ASAP, next week, or flexible"
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-trailer-type" className="label-micro">Trailer Type</label>
                      <select
                        id="logistics-trailer-type"
                        value={formData.trailerType}
                        onChange={(event) => updateField('trailerType', event.target.value)}
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      >
                        <option value="Step deck">Step deck</option>
                        <option value="Lowboy">Lowboy</option>
                        <option value="Flatbed">Flatbed</option>
                        <option value="RGN">RGN</option>
                        <option value="Unsure">Unsure</option>
                      </select>
                    </div>
                    <div className="flex flex-col space-y-3">
                      <label htmlFor="logistics-load-ready" className="label-micro">Load Ready</label>
                      <select
                        id="logistics-load-ready"
                        value={formData.loadReady}
                        onChange={(event) => updateField('loadReady', event.target.value)}
                        className="border border-line bg-surface p-4 text-sm font-bold uppercase tracking-wider text-ink focus:border-accent focus:ring-accent"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Needs coordination">Needs coordination</option>
                      </select>
                    </div>
                    <div className="flex flex-col space-y-3 md:col-span-2">
                      <label htmlFor="logistics-notes" className="label-micro">Notes</label>
                      <textarea
                        id="logistics-notes"
                        value={formData.notes}
                        onChange={(event) => updateField('notes', event.target.value)}
                        rows={6}
                        placeholder="Include machine dimensions, loading assistance, pickup hours, or anything the trucking team should know."
                        className="border border-line bg-surface p-4 text-sm font-bold tracking-wide text-ink focus:border-accent focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 border border-line bg-surface/30 p-6">
                    <input
                      id="logistics-consent"
                      type="checkbox"
                      checked={contactConsentAccepted}
                      onChange={(event) => setContactConsentAccepted(event.target.checked)}
                      className="mt-1 h-5 w-5 rounded-sm border-line accent-accent"
                    />
                    <label
                      htmlFor="logistics-consent"
                      className="cursor-pointer text-[10px] font-medium uppercase tracking-widest text-muted leading-relaxed"
                    >
                      I authorize Forestry Equipment Sales and the specific logistics or hauling partners reviewing this request
                      to contact me by phone, SMS, or email about this trucking inquiry. This consent applies only to this
                      logistics request, is not a condition of purchase, and may be withdrawn at any time.
                    </label>
                  </div>

                  {submitError ? (
                    <div className="border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-500">
                      {submitError}
                    </div>
                  ) : null}

                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                    Protected by reCAPTCHA Enterprise before submission.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-industrial btn-accent flex w-full items-center justify-center px-10 py-5"
                  >
                    {submitting ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        Submit Trucking Request
                        <ArrowRight className="ml-3" size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <aside className="space-y-8 lg:col-span-4">
            <div className="border border-line bg-surface p-8">
              <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-accent">Logistics Workflow</h3>
              <div className="space-y-8">
                {[
                  {
                    title: 'Route Review',
                    description: 'Pickup, destination, timing, and load notes are reviewed before the next follow-up.',
                    icon: MapPinned,
                  },
                  {
                    title: 'Carrier Fit',
                    description: 'Trailer type, loading access, and equipment details help narrow the right hauling conversation.',
                    icon: Truck,
                  },
                  {
                    title: 'Fast Follow-Up',
                    description: 'The logistics request lands in the same inquiry pipeline the team already monitors.',
                    icon: Clock3,
                  },
                  {
                    title: 'Protected Intake',
                    description: 'Contact details and trucking notes are secured behind the same platform safeguards used elsewhere.',
                    icon: ShieldCheck,
                  },
                ].map((item) => (
                  <div key={item.title} className="flex space-x-4">
                    <div className="h-fit rounded-sm border border-line bg-bg p-2">
                      <item.icon size={18} className="text-accent" />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-black uppercase tracking-tight text-ink">{item.title}</div>
                      <p className="text-[10px] font-medium uppercase tracking-widest leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-line bg-surface p-8 md:p-10">
              <span className="label-micro mb-4 block text-accent">Reach Us</span>
              <div className="space-y-4">
                <a href="tel:+12187200933" className="flex items-start space-x-3 p-4 border border-line bg-bg transition-colors hover:border-accent">
                  <Phone className="mt-0.5 text-accent" size={18} />
                  <div>
                    <span className="label-micro block text-muted">Customer Support</span>
                    <span className="text-sm font-black tracking-tight">(218) 720-0933</span>
                  </div>
                </a>
                <a href="mailto:info@forestryequipmentsales.com" className="flex min-w-0 items-start space-x-3 p-4 border border-line bg-bg transition-colors hover:border-accent">
                  <Mail className="mt-0.5 text-accent" size={18} />
                  <div className="min-w-0">
                    <span className="label-micro block text-muted">Email</span>
                    <span className="block break-all text-sm font-black tracking-tight">info@forestryequipmentsales.com</span>
                  </div>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
