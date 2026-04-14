import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Image,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { userService } from '../services/userService';
import { equipmentService } from '../services/equipmentService';
import { taxonomyService, type FullEquipmentTaxonomy } from '../services/taxonomyService';
import { getTaxonomyCategoryOptions } from '../utils/equipmentTaxonomy';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import {
  SERVICE_AREA_SCOPE_OPTIONS,
  STOREFRONT_COUNTRY_OPTIONS,
  matchesRegionQuery,
} from '../constants/storefrontRegions';
import { Seo } from '../components/Seo';
import { NOINDEX_ROBOTS } from '../utils/listingPath';
import { canAccessDealerOs } from '../utils/sellerAccess';

const TOTAL_STEPS = 5;
const STEP_ICONS = [Building2, MapPin, Image, Package, CheckCircle2] as const;
const STEP_LABELS = ['Storefront', 'Location', 'Branding', 'First Listing', 'All Set'] as const;

interface StorefrontForm {
  storefrontName: string;
  storefrontTagline: string;
  serviceAreaScopes: string[];
  street1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  coverPhotoUrl: string;
  about: string;
}

interface ListingForm {
  title: string;
  category: string;
  manufacturer: string;
  model: string;
  year: string;
  price: string;
  location: string;
}

function buildInitialStorefrontForm(user: ReturnType<typeof useAuth>['user']): StorefrontForm {
  return {
    storefrontName: user?.storefrontName || user?.company || user?.displayName || '',
    storefrontTagline: user?.storefrontTagline || '',
    serviceAreaScopes: Array.isArray(user?.serviceAreaScopes) ? user.serviceAreaScopes : [],
    street1: user?.street1 || '',
    city: user?.city || '',
    state: user?.state || '',
    postalCode: user?.postalCode || '',
    country: user?.country || 'United States',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    website: user?.website || '',
    logoUrl: user?.storefrontLogoUrl || '',
    coverPhotoUrl: user?.coverPhotoUrl || '',
    about: user?.storefrontDescription || user?.about || '',
  };
}

const INITIAL_LISTING: ListingForm = {
  title: '',
  category: '',
  manufacturer: '',
  model: '',
  year: '',
  price: '',
  location: '',
};

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const StepIcon = STEP_ICONS[i];
          const isActive = i + 1 === step;
          const isDone = i + 1 < step;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? 'border-accent bg-accent text-white'
                    : isActive
                      ? 'border-accent bg-surface text-accent'
                      : 'border-line bg-surface text-muted'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              </div>
              <span className={`hidden text-[10px] font-black uppercase tracking-widest sm:block ${isActive ? 'text-ink' : 'text-muted'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-center text-[11px] font-black uppercase tracking-widest text-muted">
        Step {step} of {TOTAL_STEPS}
      </p>
    </div>
  );
}

export default function DealerOnboarding() {
  const { user, patchCurrentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [storefrontSaved, setStorefrontSaved] = useState(false);
  const [listingSaved, setListingSaved] = useState(false);
  const [listingSkipped, setListingSkipped] = useState(false);

  const [form, setForm] = useState<StorefrontForm>(() => buildInitialStorefrontForm(user));
  const [listing, setListing] = useState<ListingForm>(INITIAL_LISTING);
  const [taxonomy, setTaxonomy] = useState<FullEquipmentTaxonomy>({});

  useEffect(() => {
    taxonomyService.getFullTaxonomy().then(setTaxonomy).catch(() => {});
  }, []);

  const categoryOptions = useMemo(() => getTaxonomyCategoryOptions(taxonomy), [taxonomy]);

  const serviceAreaOptions = useMemo(
    () => SERVICE_AREA_SCOPE_OPTIONS.map((v) => ({ value: v, count: 0 })),
    [],
  );

  const updateForm = useCallback(
    <K extends keyof StorefrontForm>(key: K, value: StorefrontForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setError('');
    },
    [],
  );

  const updateListing = useCallback(
    <K extends keyof ListingForm>(key: K, value: ListingForm[K]) => {
      setListing((prev) => ({ ...prev, [key]: value }));
      setError('');
    },
    [],
  );

  // Redirect if the user is not a dealer or already completed onboarding
  useEffect(() => {
    if (!user) return;
    if (!canAccessDealerOs(user)) {
      navigate('/profile', { replace: true });
    }
  }, [user, navigate]);

  const saveStorefront = useCallback(async () => {
    if (!user?.uid) return;
    const storefrontName = form.storefrontName.trim();
    if (!storefrontName) {
      setError('Storefront name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await userService.saveStorefrontProfile(user.uid, {
        role: user.role,
        storefrontName,
        storefrontTagline: form.storefrontTagline.trim(),
        storefrontDescription: form.about.trim(),
        street1: form.street1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        serviceAreaScopes: form.serviceAreaScopes,
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        logo: form.logoUrl.trim(),
        coverPhotoUrl: form.coverPhotoUrl.trim(),
        location: [form.city.trim(), form.state.trim()].filter(Boolean).join(', '),
      });

      patchCurrentUserProfile({
        storefrontName,
        storefrontTagline: form.storefrontTagline.trim(),
        storefrontDescription: form.about.trim(),
        storefrontLogoUrl: form.logoUrl.trim(),
        coverPhotoUrl: form.coverPhotoUrl.trim(),
        storefrontSlug: result.storefrontSlug,
        street1: form.street1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        serviceAreaScopes: form.serviceAreaScopes,
        phoneNumber: form.phone.trim(),
        website: form.website.trim(),
      });

      setStorefrontSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save storefront profile.');
    } finally {
      setSaving(false);
    }
  }, [user, form, patchCurrentUserProfile]);

  const saveDraftListing = useCallback(async () => {
    if (!user?.uid) return;
    const title = listing.title.trim();
    if (!title) {
      setError('Listing title is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await equipmentService.addListing({
        sellerUid: user.uid,
        sellerId: user.uid,
        title,
        category: listing.category,
        manufacturer: listing.manufacturer.trim(),
        make: listing.manufacturer.trim(),
        model: listing.model.trim(),
        year: Number(listing.year) || new Date().getFullYear(),
        price: Number(listing.price) || 0,
        currency: 'USD',
        hours: 0,
        condition: 'Used',
        description: '',
        images: [],
        location: listing.location.trim() || [form.city.trim(), form.state.trim()].filter(Boolean).join(', '),
        status: 'pending',
        featured: false,
        views: 0,
        leads: 0,
        marketValueEstimate: null,
        specs: {},
      });

      setListingSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save draft listing.');
    } finally {
      setSaving(false);
    }
  }, [user, listing, form]);

  const handleNext = useCallback(async () => {
    setError('');

    // Save storefront data when leaving step 3 (last storefront-related step)
    if (step === 3 && !storefrontSaved) {
      await saveStorefront();
    }

    if (error) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, [step, storefrontSaved, saveStorefront, error]);

  const handleBack = useCallback(() => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleSkipListing = useCallback(() => {
    setListingSkipped(true);
    setStep(5);
  }, []);

  const handleSaveDraftAndContinue = useCallback(async () => {
    await saveDraftListing();
    if (!error) {
      setStep(5);
    }
  }, [saveDraftListing, error]);

  const completionChecklist = useMemo(() => [
    { label: 'Storefront name', done: Boolean(form.storefrontName.trim()) },
    { label: 'Contact & location', done: Boolean(form.city.trim() && form.state.trim()) },
    { label: 'Branding', done: Boolean(form.logoUrl.trim() || form.about.trim()) },
    { label: 'First listing', done: listingSaved },
  ], [form, listingSaved]);

  // ─── Input helper ──────────────────────────────────────────
  const inputCls = 'input-industrial w-full';
  const labelCls = 'label-micro';

  return (
    <>
      <Seo
        title="Dealer Onboarding — Forestry Equipment Sales"
        description="Set up your dealer storefront on Forestry Equipment Sales."
        robots={NOINDEX_ROBOTS}
      />
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-8">
        <h1 className="mb-2 text-center font-black uppercase tracking-tight text-ink text-2xl md:text-3xl">
          Set Up Your Storefront
        </h1>
        <p className="mb-8 text-center text-sm text-muted">
          Complete these steps to get your dealer storefront live on Forestry Equipment Sales.
        </p>

        <ProgressBar step={step} />

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* ───────────── Step 1: Welcome & Storefront Basics ───────────── */}
        {step === 1 && (
          <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-black uppercase tracking-tight text-ink text-lg">Welcome &amp; Storefront Basics</h2>
            <p className="text-sm text-muted">Tell buyers who you are. Your storefront name and tagline show on your public dealer page.</p>
            <div className="space-y-1">
              <label className={labelCls}>Storefront Name <span className="text-accent">*</span></label>
              <input
                type="text"
                className={inputCls}
                value={form.storefrontName}
                onChange={(e) => updateForm('storefrontName', e.target.value)}
                placeholder="e.g. Pacific Northwest Timber Equipment"
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Tagline</label>
              <input
                type="text"
                className={inputCls}
                value={form.storefrontTagline}
                onChange={(e) => updateForm('storefrontTagline', e.target.value)}
                placeholder="e.g. Quality logging equipment since 1998"
                maxLength={160}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Service Area</label>
              <MultiSelectDropdown
                label="Service Area"
                placeholder="Select regions you serve"
                options={serviceAreaOptions}
                selected={form.serviceAreaScopes}
                onChange={(selected) => updateForm('serviceAreaScopes', selected)}
                searchable
                matchFn={matchesRegionQuery}
              />
            </div>
          </div>
        )}

        {/* ───────────── Step 2: Contact & Location ───────────── */}
        {step === 2 && (
          <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-black uppercase tracking-tight text-ink text-lg">Contact &amp; Location</h2>
            <p className="text-sm text-muted">Where can buyers find and reach you?</p>
            <div className="space-y-1">
              <label className={labelCls}>Street Address</label>
              <input type="text" className={inputCls} value={form.street1} onChange={(e) => updateForm('street1', e.target.value)} placeholder="123 Logging Rd" maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>City</label>
                <input type="text" className={inputCls} value={form.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="Portland" maxLength={100} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>State / Province</label>
                <input type="text" className={inputCls} value={form.state} onChange={(e) => updateForm('state', e.target.value)} placeholder="OR" maxLength={60} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Zip / Postal Code</label>
                <input type="text" className={inputCls} value={form.postalCode} onChange={(e) => updateForm('postalCode', e.target.value)} placeholder="97201" maxLength={20} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Country</label>
                <select className={inputCls} value={form.country} onChange={(e) => updateForm('country', e.target.value)}>
                  {STOREFRONT_COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Phone</label>
                <input type="tel" className={inputCls} value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="(503) 555-0100" maxLength={30} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="sales@example.com" maxLength={200} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Website</label>
              <input type="url" className={inputCls} value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://www.example.com" maxLength={300} />
            </div>
          </div>
        )}

        {/* ───────────── Step 3: Branding ───────────── */}
        {step === 3 && (
          <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-black uppercase tracking-tight text-ink text-lg">Branding</h2>
            <p className="text-sm text-muted">Make your storefront stand out. Upload integration coming soon — paste a URL for now.</p>
            <div className="space-y-1">
              <label className={labelCls}>Logo URL</label>
              <input type="url" className={inputCls} value={form.logoUrl} onChange={(e) => updateForm('logoUrl', e.target.value)} placeholder="https://..." maxLength={500} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Cover Photo URL</label>
              <input type="url" className={inputCls} value={form.coverPhotoUrl} onChange={(e) => updateForm('coverPhotoUrl', e.target.value)} placeholder="https://..." maxLength={500} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>About / Description</label>
              <textarea
                className={`${inputCls} min-h-[100px]`}
                value={form.about}
                onChange={(e) => updateForm('about', e.target.value)}
                placeholder="Tell buyers about your dealership, specialties, and history..."
                maxLength={2000}
                rows={4}
              />
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <label className={labelCls}>Storefront Preview</label>
              <div className="overflow-hidden rounded-lg border border-line bg-bg">
                {form.coverPhotoUrl.trim() ? (
                  <div className="h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${form.coverPhotoUrl.trim()})` }} />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-line/30 text-muted">
                    <Image className="mr-2 h-5 w-5" />
                    <span className="text-xs uppercase tracking-widest">Cover Photo</span>
                  </div>
                )}
                <div className="-mt-6 flex items-end gap-3 px-4 pb-4">
                  {form.logoUrl.trim() ? (
                    <img
                      src={form.logoUrl.trim()}
                      alt="Logo"
                      className="h-14 w-14 rounded-lg border-2 border-surface bg-surface object-cover shadow"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-surface bg-surface text-muted shadow">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-6">
                    <p className="truncate font-black uppercase tracking-tight text-ink">
                      {form.storefrontName.trim() || 'Your Storefront'}
                    </p>
                    {form.storefrontTagline.trim() && (
                      <p className="truncate text-xs text-muted">{form.storefrontTagline.trim()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── Step 4: First Listing (simplified) ───────────── */}
        {step === 4 && (
          <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-black uppercase tracking-tight text-ink text-lg">Your First Listing</h2>
            <p className="text-sm text-muted">
              Add basic info now — save as a draft and complete photos & details later. Or skip this step entirely.
            </p>
            <div className="space-y-1">
              <label className={labelCls}>Title <span className="text-accent">*</span></label>
              <input type="text" className={inputCls} value={listing.title} onChange={(e) => updateListing('title', e.target.value)} placeholder='e.g. 2019 Tigercat 635E Skidder' maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={listing.category} onChange={(e) => updateListing('category', e.target.value)}>
                  <option value="">Select category</option>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Manufacturer</label>
                <input type="text" className={inputCls} value={listing.manufacturer} onChange={(e) => updateListing('manufacturer', e.target.value)} placeholder="e.g. Tigercat" maxLength={120} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Model</label>
                <input type="text" className={inputCls} value={listing.model} onChange={(e) => updateListing('model', e.target.value)} placeholder="e.g. 635E" maxLength={120} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Year</label>
                <input type="text" className={inputCls} value={listing.year} onChange={(e) => updateListing('year', e.target.value)} placeholder={String(new Date().getFullYear())} maxLength={4} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Price (USD)</label>
                <input type="text" className={inputCls} value={listing.price} onChange={(e) => updateListing('price', e.target.value)} placeholder="0" maxLength={12} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Location</label>
              <input type="text" className={inputCls} value={listing.location} onChange={(e) => updateListing('location', e.target.value)} placeholder={[form.city, form.state].filter(Boolean).join(', ') || 'e.g. Portland, OR'} maxLength={200} />
            </div>
            <p className="text-xs text-muted">Photos can be added later from DealerOS. The 5-image minimum is waived for drafts.</p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkipListing}
                className="text-sm font-semibold text-muted underline underline-offset-2 hover:text-ink"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleSaveDraftAndContinue}
                disabled={saving || !listing.title.trim()}
                className="btn-industrial inline-flex items-center gap-2"
              >
                {saving ? 'Saving...' : 'Save as Draft & Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ───────────── Step 5: You're All Set ───────────── */}
        {step === 5 && (
          <div className="space-y-6 rounded-lg border border-line bg-surface p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <h2 className="font-black uppercase tracking-tight text-ink text-xl">You're All Set!</h2>
            <p className="text-sm text-muted">Your storefront is ready. Here's what was completed:</p>

            <ul className="mx-auto max-w-xs space-y-2 text-left text-sm">
              {completionChecklist.map(({ label, done }) => (
                <li key={label} className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${done ? 'text-accent' : 'text-muted/40'}`} />
                  <span className={done ? 'text-ink' : 'text-muted'}>{label}</span>
                  {!done && <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted">Needs attention</span>}
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
              <Link to="/dealer-os" className="rounded border border-line px-3 py-2 font-semibold text-ink hover:bg-bg">
                DealerOS Dashboard
              </Link>
              <Link to="/sell" className="rounded border border-line px-3 py-2 font-semibold text-ink hover:bg-bg">
                Add Listing
              </Link>
              <Link to="/profile?tab=storefront" className="rounded border border-line px-3 py-2 font-semibold text-ink hover:bg-bg">
                Edit Storefront
              </Link>
              <Link to="/profile?tab=team" className="rounded border border-line px-3 py-2 font-semibold text-ink hover:bg-bg">
                Invite Team
              </Link>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dealer-os')}
              className="btn-industrial mt-2 inline-flex items-center gap-2 px-8"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ───────────── Navigation Buttons ───────────── */}
        {step < 4 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className={`inline-flex items-center gap-1 text-sm font-semibold ${step === 1 ? 'invisible' : 'text-muted hover:text-ink'}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="btn-industrial inline-flex items-center gap-2"
            >
              {saving ? 'Saving...' : step === 3 ? 'Save & Continue' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="mt-6 flex items-center justify-start">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}
      </div>
    </>
  );
}
