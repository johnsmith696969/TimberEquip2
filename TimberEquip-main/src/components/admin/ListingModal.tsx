import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Upload, Video, ShieldCheck, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Listing, ListingConditionChecklist } from '../../types';
import { getSchemaForListing } from '../../constants/categorySpecs';
import { EQUIPMENT_TAXONOMY } from '../../constants/equipmentData';
import { storageService } from '../../services/storageService';
import { GooglePlacesInput } from '../GooglePlacesInput';
import type { GooglePlaceSelection } from '../../services/placesService';
import { taxonomyService, FullEquipmentTaxonomy } from '../../services/taxonomyService';
import {
  getCanonicalOptionLabel,
  getTaxonomyCategoryOptions,
  getTaxonomyManufacturerOptions,
  getTaxonomyModelOptions,
  getTaxonomySubcategoryOptions,
  resolveEquipmentTaxonomySelection,
} from '../../utils/equipmentTaxonomy';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
const MAX_VIDEO_COUNT = 6;
const MIN_IMAGE_COUNT = 5;

const createDraftListingId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const FALLBACK_FULL_TAXONOMY: FullEquipmentTaxonomy = Object.fromEntries(
  Object.entries(EQUIPMENT_TAXONOMY).map(([category, subcategoryMap]) => [
    category,
    Object.fromEntries(
      Object.entries(subcategoryMap).map(([subcategory, manufacturers]) => [
        subcategory,
        Object.fromEntries(manufacturers.map((manufacturer) => [manufacturer, [] as string[]])),
      ])
    ),
  ])
);

const DEFAULT_TOP_LEVEL_CATEGORY = Object.keys(EQUIPMENT_TAXONOMY)[0] || '';
const DEFAULT_SUBCATEGORY = Object.keys(EQUIPMENT_TAXONOMY[DEFAULT_TOP_LEVEL_CATEGORY] || {})[0] || '';

const inferCategorySelection = (
  taxonomy: FullEquipmentTaxonomy,
  listing?: Partial<Listing> | null
): { category: string; subcategory: string } => {
  const resolved = resolveEquipmentTaxonomySelection(taxonomy, {
    category: listing?.category,
    subcategory: listing?.subcategory,
    manufacturer: listing?.manufacturer || listing?.make,
    model: listing?.model,
  });

  if (resolved.category && taxonomy[resolved.category]) {
    if (resolved.subcategory && taxonomy[resolved.category][resolved.subcategory]) {
      return { category: resolved.category, subcategory: resolved.subcategory };
    }

    const firstSubcategory = Object.keys(taxonomy[resolved.category] || {})[0] || '';
    return { category: resolved.category, subcategory: firstSubcategory };
  }

  return {
    category: DEFAULT_TOP_LEVEL_CATEGORY,
    subcategory: DEFAULT_SUBCATEGORY,
  };
};

const normalizeListingImageTitles = (images: string[], imageTitles?: string[] | null) => {
  const normalizedImages = Array.isArray(images) ? images : [];
  const rawTitles = Array.isArray(imageTitles) ? imageTitles : [];

  return normalizedImages.map((_, index) => {
    const title = typeof rawTitles[index] === 'string' ? rawTitles[index].trim() : '';
    return title.slice(0, 120);
  });
};

interface ListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (listing: any) => void | Promise<void>;
  listing?: Listing | null;
  showSellerAssignment?: boolean;
}

// ── SpecField renderer ────────────────────────────────────────────────────────
interface SpecInputProps {
  fieldKey: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  unit?: string;
  options?: string[];
  placeholder?: string;
  min?: number;
  description?: string;
  value: any;
  onChange: (key: string, value: any) => void;
}

let _selectZeroFrameId: number | null = null;
const selectZeroValue = (event: React.FocusEvent<HTMLInputElement>) => {
  if (event.target.value === '0') {
    if (_selectZeroFrameId !== null) cancelAnimationFrame(_selectZeroFrameId);
    const target = event.target;
    _selectZeroFrameId = requestAnimationFrame(() => {
      _selectZeroFrameId = null;
      target.select();
    });
  }
};

const defaultConditionChecklist = (): ListingConditionChecklist => ({
  engineChecked: false,
  undercarriageChecked: false,
  hydraulicsLeakStatus: '',
  serviceRecordsAvailable: false,
  partsManualAvailable: false,
  serviceManualAvailable: false,
});

const normalizeConditionChecklist = (checklist?: ListingConditionChecklist | null): ListingConditionChecklist => ({
  ...defaultConditionChecklist(),
  ...(checklist || {}),
  undercarriageChecked: checklist?.undercarriageChecked ?? false,
  hydraulicsLeakStatus:
    checklist?.hydraulicsLeakStatus ??
    ((checklist?.hydraulicsChecked || checklist?.leaksChecked) ? 'no' : ''),
});

function SpecInput({ fieldKey, label, type, required, unit, options, placeholder, min, description, value, onChange }: SpecInputProps) {
  const labelEl = (
    <label className="label-micro flex items-center gap-1">
      {label}
      {unit && <span className="text-muted normal-case font-medium">({unit})</span>}
      {required && <span className="text-accent">*</span>}
    </label>
  );

  if (type === 'boolean') {
    return (
      <label className="flex items-center justify-between bg-surface border border-line p-3 rounded-sm cursor-pointer hover:border-accent transition-colors">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
          {description && <p className="text-[9px] text-muted mt-0.5">{description}</p>}
        </div>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
          className="w-4 h-4 accent-accent"
        />
      </label>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className="space-y-1">
        {labelEl}
        <select
          value={value ?? ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="input-industrial w-full"
          required={required}
        >
          <option value="">— Select —</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {description && <p className="text-[9px] text-muted">{description}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {labelEl}
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        placeholder={placeholder}
        min={min}
        onFocus={type === 'number' ? selectZeroValue : undefined}
        onChange={(e) =>
          onChange(fieldKey, type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)
        }
        className="input-industrial w-full"
        required={required}
      />
      {description && <p className="text-[9px] text-muted">{description}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ListingModal({ isOpen, onClose, onSave, listing, showSellerAssignment = false }: ListingModalProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [imageDragIdx, setImageDragIdx] = useState<number | null>(null);
  const [listingStorageId, setListingStorageId] = useState<string>(createDraftListingId());
  const [fullTaxonomy, setFullTaxonomy] = useState<FullEquipmentTaxonomy>(FALLBACK_FULL_TAXONOMY);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const defaultForm = () => ({
    sellerUid: '',
    sellerId: '',
    title: '',
    category: DEFAULT_TOP_LEVEL_CATEGORY,
    subcategory: DEFAULT_SUBCATEGORY,
    manufacturer: '',
    make: '',
    model: '',
    year: '' as unknown as number,
    price: 0,
    currency: 'USD',
    condition: 'Used',
    location: '',
    hours: '' as unknown as number,
    stockNumber: '',
    serialNumber: '',
    images: [] as string[],
    imageTitles: [] as string[],
    imageVariants: [] as Array<{ thumbnailUrl: string; detailUrl: string; format?: 'image/avif' | 'image/webp' | 'image/jpeg' }>,
    videoUrls: [] as string[],
    description: '',
    featured: false,
    sellerVerified: false,
    conditionChecklist: defaultConditionChecklist() as Record<string, boolean | string>,
    specs: {} as Record<string, any>,
  });

  const [formData, setFormData] = useState<ReturnType<typeof defaultForm>>(defaultForm());

  useEffect(() => {
    let mounted = true;
    taxonomyService.getFullTaxonomy().then((taxonomy) => {
      if (!mounted) return;
      setFullTaxonomy(taxonomy);
    }).catch(() => {
      if (!mounted) return;
      setFullTaxonomy(FALLBACK_FULL_TAXONOMY);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const inferred = inferCategorySelection(fullTaxonomy, listing || null);

    if (listing) {
      const normalizedImages = Array.isArray(listing.images) ? listing.images : [];
      setListingStorageId(listing.id);
      setFormData({
        ...defaultForm(),
        ...listing,
        sellerUid: String((listing as Listing & { sellerUid?: string }).sellerUid || (listing as Listing & { sellerId?: string }).sellerId || ''),
        sellerId: String((listing as Listing & { sellerId?: string }).sellerId || (listing as Listing & { sellerUid?: string }).sellerUid || ''),
        images: normalizedImages,
        imageTitles: normalizeListingImageTitles(normalizedImages, listing.imageTitles),
        category: inferred.category,
        subcategory: inferred.subcategory,
        conditionChecklist: normalizeConditionChecklist(listing.conditionChecklist),
        specs: { ...(listing.specs || {}) },
      } as any);
    } else {
      setListingStorageId(createDraftListingId());
      setFormData({
        ...defaultForm(),
        category: inferred.category,
        subcategory: inferred.subcategory,
      });
    }
    setValidationErrors([]);
    setSubmitError('');
    setUploadError('');
  }, [listing, isOpen]);

  const categoryOptions = getTaxonomyCategoryOptions(fullTaxonomy);
  const subcategoryOptions = getTaxonomySubcategoryOptions(fullTaxonomy, formData.category);
  const selectedMake = (formData.manufacturer || formData.make || '').trim();
  const manufacturerOptions = getTaxonomyManufacturerOptions(fullTaxonomy, formData.category, formData.subcategory);
  const canonicalSelectedMake = getCanonicalOptionLabel(manufacturerOptions, selectedMake);
  const modelOptions = getTaxonomyModelOptions(
    fullTaxonomy,
    formData.category,
    formData.subcategory,
    canonicalSelectedMake || selectedMake
  );

  const schema = getSchemaForListing(formData.category, formData.subcategory);

  // ── Spec helpers ─────────────────────────────────────────────────────────
  const handleSpecChange = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }));

  const toggleAttachment = (att: string) => {
    const current: string[] = formData.specs.attachments || [];
    const next = current.includes(att) ? current.filter((a) => a !== att) : [...current, att];
    handleSpecChange('attachments', next);
  };

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const selected = Array.from(files);
    const invalidTypeCount = selected.filter((f) => !allowed.includes(f.type)).length;
    const oversizedCount = selected.filter((f) => f.size > MAX_IMAGE_SIZE_BYTES).length;
    const valid = selected.filter((f) => allowed.includes(f.type) && f.size <= MAX_IMAGE_SIZE_BYTES);

    const remaining = 40 - formData.images.length;
    if (remaining <= 0) {
      setUploadError('Maximum 40 images already uploaded.');
      return;
    }

    const batch = valid.slice(0, remaining);
    if (batch.length === 0) {
      setUploadError('No valid image files selected. Use JPG/PNG/WEBP/AVIF up to 10 MB each.');
      return;
    }

    const warnings: string[] = [];
    if (invalidTypeCount > 0) warnings.push(`${invalidTypeCount} file(s) skipped due to unsupported image type.`);
    if (oversizedCount > 0) warnings.push(`${oversizedCount} file(s) skipped for exceeding 10 MB.`);
    if (valid.length > remaining) warnings.push(`${valid.length - remaining} file(s) skipped because only ${remaining} image slot(s) remain.`);
    setUploadError(warnings.join(' '));

    setUploadingImages(true);
    setImageUploadProgress(0);
    try {
      const urls: string[] = [];
      const variants: Array<{ thumbnailUrl: string; detailUrl: string; format?: 'image/avif' | 'image/webp' | 'image/jpeg' }> = [];
      for (let i = 0; i < batch.length; i++) {
        const file = batch[i];
        const result = await storageService.uploadListingImageWithPublishingVariants(file, listingStorageId);
        urls.push(result.detailUrl);
        variants.push({
          thumbnailUrl: result.thumbnailUrl,
          detailUrl: result.detailUrl,
          format: result.formatUsed,
        });
        setImageUploadProgress(Math.round(((i + 1) / batch.length) * 100));
      }
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
        imageTitles: [...(prev.imageTitles || []), ...urls.map(() => '')],
        imageVariants: [...(prev.imageVariants || []), ...variants],
      }));
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadError('Image upload failed. Check Firebase Storage rules and try again.');
    } finally {
      setUploadingImages(false);
      setImageUploadProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) =>
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
      imageTitles: (prev.imageTitles || []).filter((_, i) => i !== idx),
      imageVariants: (prev.imageVariants || []).filter((_, i) => i !== idx),
    }));

  const moveImage = (idx: number, direction: -1 | 1) =>
    setFormData((prev) => {
      const targetIndex = idx + direction;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;

      const images = [...prev.images];
      const imageTitles = normalizeListingImageTitles(prev.images, prev.imageTitles);
      const imageVariants = [...(prev.imageVariants || [])];

      [images[idx], images[targetIndex]] = [images[targetIndex], images[idx]];
      [imageTitles[idx], imageTitles[targetIndex]] = [imageTitles[targetIndex], imageTitles[idx]];
      if (imageVariants.length) {
        [imageVariants[idx], imageVariants[targetIndex]] = [imageVariants[targetIndex], imageVariants[idx]];
      }

      return {
        ...prev,
        images,
        imageTitles,
        imageVariants,
      };
    });

  const updateImageTitle = (idx: number, title: string) =>
    setFormData((prev) => {
      const nextTitles = normalizeListingImageTitles(prev.images, prev.imageTitles);
      nextTitles[idx] = title.slice(0, 120);
      return {
        ...prev,
        imageTitles: nextTitles,
      };
    });

  // ── Video upload ─────────────────────────────────────────────────────────
  const handleVideoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowed = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg'];
    const selected = Array.from(files);
    const invalidTypeCount = selected.filter((f) => !allowed.includes(f.type)).length;
    const oversizedCount = selected.filter((f) => f.size > MAX_VIDEO_SIZE_BYTES).length;
    const valid = selected.filter((f) => allowed.includes(f.type) && f.size <= MAX_VIDEO_SIZE_BYTES);

    const currentVideoCount = formData.videoUrls?.length || 0;
    const remainingVideoSlots = Math.max(0, MAX_VIDEO_COUNT - currentVideoCount);
    if (remainingVideoSlots <= 0) {
      setUploadError(`Maximum ${MAX_VIDEO_COUNT} videos already attached.`);
      return;
    }

    const batch = valid.slice(0, remainingVideoSlots);
    if (batch.length === 0) {
      setUploadError('No valid video files selected. Use MP4/MOV/AVI/WebM/MPEG up to 500 MB each.');
      return;
    }

    const warnings: string[] = [];
    if (invalidTypeCount > 0) warnings.push(`${invalidTypeCount} file(s) skipped due to unsupported video type.`);
    if (oversizedCount > 0) warnings.push(`${oversizedCount} file(s) skipped for exceeding 500 MB.`);
    if (valid.length > remainingVideoSlots) warnings.push(`${valid.length - remainingVideoSlots} file(s) skipped because only ${remainingVideoSlots} video slot(s) remain.`);
    setUploadError(warnings.join(' '));

    setUploadingVideos(true);
    setVideoUploadProgress(0);
    try {
      const urls: string[] = [];
      for (let i = 0; i < batch.length; i++) {
        const file = batch[i];
        const url = await storageService.uploadListingVideo(file, listingStorageId, (progress) =>
          setVideoUploadProgress(
            Math.round(((i + progress.bytesTransferred / progress.totalBytes) / batch.length) * 100)
          )
        );
        urls.push(url);
      }
      setFormData((prev) => ({ ...prev, videoUrls: [...(prev.videoUrls || []), ...urls] }));
    } catch (error) {
      console.error('Video upload failed:', error);
      setUploadError('Video upload failed. Check Firebase Storage rules and try again.');
    } finally {
      setUploadingVideos(false);
      setVideoUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const addVideoUrl = () => {
    const url = prompt('Paste a video URL (YouTube, Vimeo, or direct link):')?.trim();
    if (url && /^https?:\/\//i.test(url)) {
      setFormData((prev) => ({ ...prev, videoUrls: [...(prev.videoUrls || []), url] }));
    }
  };

  const removeVideo = (idx: number) =>
    setFormData((prev) => ({ ...prev, videoUrls: (prev.videoUrls || []).filter((_, i) => i !== idx) }));

  // ── Validation & submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('');

    const errors: string[] = [];
    if (!formData.category.trim()) errors.push('Category is required.');
    if (!String(formData.subcategory || '').trim()) errors.push('Subcategory is required.');
    if (!formData.title.trim()) errors.push('Listing title is required.');
    if (!String(formData.manufacturer || formData.make || '').trim()) errors.push('Manufacturer is required.');
    if (!formData.model.trim()) errors.push('Model is required.');
    if (!Number.isFinite(Number(formData.year)) || Number(formData.year) <= 0) errors.push('Year is required.');
    if (!Number.isFinite(Number(formData.hours)) || Number(formData.hours) < 0) errors.push('Operating hours are required.');
    if (!String(formData.condition || '').trim()) errors.push('Condition is required.');
    if (!Number.isFinite(Number(formData.price)) || Number(formData.price) < 0) errors.push('Price is required.');
    if (!formData.location.trim()) errors.push('Location is required.');

    const imgCount = formData.images.length;
    if (imgCount < MIN_IMAGE_COUNT) errors.push(`Minimum ${MIN_IMAGE_COUNT} images required. You have ${imgCount}.`);
    if (imgCount > 40) errors.push('Maximum 40 images allowed.');

    const hydraulicsLeakStatus = formData.conditionChecklist.hydraulicsLeakStatus;
    if (hydraulicsLeakStatus && !['yes', 'no'].includes(String(hydraulicsLeakStatus))) {
      errors.push('Hydraulics leak status must be set to Yes or No.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    try {
      setIsSaving(true);
      await Promise.resolve(onSave({ ...formData, id: listingStorageId, make: formData.manufacturer || formData.make }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish listing right now.';
      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const attachments: string[] = formData.specs.attachments || [];
  const coreChecklistKeys = ['engineChecked', 'undercarriageChecked', 'hydraulicsLeakStatus'];
  const documentationChecklistKeys = ['serviceRecordsAvailable', 'partsManualAvailable', 'serviceManualAvailable'];
  const schemaChecklistMap = schema.checklist.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.label;
    return acc;
  }, {});
  const applicableCoreChecklistKeys = coreChecklistKeys.filter((key) => schemaChecklistMap[key]);
  const booleanCoreChecklistKeys = applicableCoreChecklistKeys.filter((key) => key !== 'hydraulicsLeakStatus');
  const showHydraulicsLeakField = applicableCoreChecklistKeys.includes('hydraulicsLeakStatus');
  const coreChecklistLabels: Record<string, string> = {
    engineChecked: schemaChecklistMap.engineChecked || 'Engine Inspected & Running',
    undercarriageChecked: schemaChecklistMap.undercarriageChecked || 'Drive System Functional',
    hydraulicsLeakStatus: schemaChecklistMap.hydraulicsLeakStatus || 'Hydraulics Checked - Leaks?',
  };
  const documentationChecklistLabels: Record<string, string> = {
    serviceRecordsAvailable: 'Service Records Available',
    partsManualAvailable: 'Parts Manual Available',
    serviceManualAvailable: 'Service Manual Available',
  };
  const extraChecklist = schema.checklist.filter(
    (item) => !applicableCoreChecklistKeys.includes(item.key) && !documentationChecklistKeys.includes(item.key)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-bg border border-line w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-sm"
        >
          {/* Header */}
          <header className="p-6 border-b border-line flex justify-between items-center bg-surface flex-shrink-0">
            <div>
              <span className="label-micro text-accent mb-1 block">Inventory Management</span>
              <h3 className="text-xl font-black uppercase tracking-tighter text-ink">
                {listing ? 'Edit Machine' : 'Add New Machine'}
              </h3>
            </div>
            <div className="flex items-center gap-4">
              {formData.sellerVerified && (
                <div className="flex items-center gap-1.5 bg-data/10 text-data border border-data/30 px-3 py-1.5 rounded-sm">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Seller</span>
                </div>
              )}
              <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
                <X size={24} />
              </button>
            </div>
          </header>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10">

            {/* ── Basic Information ───────────────────────────────────────────── */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-line pb-2">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {showSellerAssignment ? (
                  <div className="space-y-1 lg:col-span-3">
                    <label className="label-micro">Seller Account UID <span className="text-accent">*</span></label>
                    <input
                      type="text"
                      value={formData.sellerUid || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        sellerUid: e.target.value,
                        sellerId: e.target.value,
                      })}
                      className="input-industrial w-full"
                      placeholder="seller-account-uid"
                    />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Admin-created listings must be assigned to the owning seller or dealer account.
                    </p>
                  </div>
                ) : null}
                <div className="space-y-1 lg:col-span-2">
                  <label className="label-micro">Listing Title <span className="text-accent">*</span></label>
                  <input type="text" required value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-industrial w-full" placeholder="e.g. 2021 Tigercat 855E Skidder" />
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Category <span className="text-accent">*</span></label>
                  <select value={formData.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      const nextSubcategory = Object.keys(fullTaxonomy[nextCategory] || {})[0] || '';
                      setFormData({
                        ...formData,
                        category: nextCategory,
                        subcategory: nextSubcategory,
                        manufacturer: '',
                        make: '',
                        model: '',
                        specs: {},
                      });
                    }}
                    className="input-industrial w-full">
                    {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Subcategory <span className="text-accent">*</span></label>
                  <select value={formData.subcategory || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      subcategory: e.target.value,
                      manufacturer: '',
                      make: '',
                      model: '',
                      specs: {},
                    })}
                    className="input-industrial w-full">
                    {subcategoryOptions.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Make <span className="text-accent">*</span></label>
                  <input type="text" required value={formData.manufacturer || formData.make}
                    onChange={(e) => {
                      const nextManufacturer = getCanonicalOptionLabel(manufacturerOptions, e.target.value) || e.target.value;
                      setFormData({ ...formData, manufacturer: nextManufacturer, make: nextManufacturer, model: '' });
                    }}
                    className="input-industrial w-full" placeholder="e.g. Tigercat"
                    list="listing-manufacturer-options" />
                  <datalist id="listing-manufacturer-options">
                    {manufacturerOptions.map((manufacturer) => (
                      <option key={manufacturer} value={manufacturer} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Model <span className="text-accent">*</span></label>
                  <input type="text" required value={formData.model}
                    onChange={(e) => {
                      const nextModel = getCanonicalOptionLabel(modelOptions, e.target.value) || e.target.value;
                      setFormData({ ...formData, model: nextModel });
                    }}
                    className="input-industrial w-full" placeholder="e.g. 855E"
                    list="listing-model-options" />
                  <datalist id="listing-model-options">
                    {modelOptions.map((model) => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Year <span className="text-accent">*</span></label>
                  <select required value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || ('' as unknown as number) })}
                    className="input-industrial w-full">
                    <option value="">Select Year</option>
                    {Array.from({ length: new Date().getFullYear() - 1960 + 1 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Operating Hours <span className="text-accent">*</span></label>
                  <input type="number" required value={formData.hours}
                    placeholder="Enter hours"
                    onFocus={selectZeroValue}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value === '' ? ('' as unknown as number) : (parseInt(e.target.value) || 0) })}
                    className="input-industrial w-full" min={0} />
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Condition <span className="text-accent">*</span></label>
                  <select value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="input-industrial w-full">
                    <option>Used</option><option>New</option><option>Rebuilt</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Stock Number</label>
                  <input type="text" value={formData.stockNumber || ''}
                    onChange={(e) => setFormData({ ...formData, stockNumber: e.target.value })}
                    className="input-industrial w-full" placeholder="Internal stock #" />
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Serial Number</label>
                  <input type="text" value={formData.serialNumber || ''}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="input-industrial w-full" placeholder="Machine serial #" />
                </div>
              </div>
            </section>

            {/* ── Pricing & Location ──────────────────────────────────────────── */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-line pb-2">
                Pricing & Location
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1">
                  <label className="label-micro">Asking Price <span className="text-accent">*</span></label>
                  <input type="number" required value={formData.price}
                    onFocus={selectZeroValue}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="input-industrial w-full" min={0} />
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Currency</label>
                  <select value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input-industrial w-full">
                    <option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-micro">Location <span className="text-accent">*</span></label>
                  <GooglePlacesInput
                    mode="city"
                    value={formData.location}
                    onChange={(value) => setFormData({ ...formData, location: value })}
                    onSelect={(place: GooglePlaceSelection) => {
                      const parts: string[] = [];
                      if (place.city) parts.push(place.city);
                      if (place.state) parts.push(place.state);
                      if (place.country && place.country !== 'US' && place.country !== 'United States') parts.push(place.country);
                      const formatted = parts.length > 0 ? parts.join(', ') : place.formattedAddress;
                      setFormData((prev) => ({ ...prev, location: formatted }));
                    }}
                    placeholder="City, State / Province"
                    leadingIconClassName="hidden"
                    inputClassName="!pl-3"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <input type="checkbox" checked={!!formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 accent-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mark as Featured Listing</span>
              </label>
            </section>

            {/* ── Category-Specific Technical Specs ──────────────────────────── */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-line pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">
                  {schema.displayName} Specifications
                </h4>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                  optional details
                </span>
              </div>

              {schema.specs.filter((f) => f.required).length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-3">Suggested Fields</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {schema.specs.filter((f) => f.required).map((field) => (
                      <div key={field.key}>
                        <SpecInput fieldKey={field.key} label={field.label}
                          type={field.type} required={false} unit={field.unit}
                          options={field.options} placeholder={field.placeholder} min={field.min}
                          description={field.description}
                          value={formData.specs[field.key] ?? ''}
                          onChange={handleSpecChange} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {schema.specs.filter((f) => !f.required).length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3">Optional Fields</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {schema.specs.filter((f) => !f.required).map((field) => (
                      <div key={field.key}>
                        <SpecInput fieldKey={field.key} label={field.label}
                          type={field.type} required={false} unit={field.unit}
                          options={field.options} placeholder={field.placeholder} min={field.min}
                          description={field.description}
                          value={formData.specs[field.key] ?? (field.type === 'boolean' ? false : '')}
                          onChange={handleSpecChange} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── Attachments ─────────────────────────────────────────────────── */}
            {schema.attachmentOptions.length > 0 && (
              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-line pb-2">
                  Attachments & Equipment Included
                </h4>
                <div className="flex flex-wrap gap-2">
                  {schema.attachmentOptions.map((att) => (
                    <button key={att} type="button" onClick={() => toggleAttachment(att)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border rounded-sm transition-all ${
                        attachments.includes(att)
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface text-muted border-line hover:border-accent hover:text-ink'
                      }`}>
                      {att}
                    </button>
                  ))}
                </div>
                {attachments.length > 0 && (
                  <p className="text-[9px] text-data font-bold uppercase tracking-widest">
                    Selected: {attachments.join(', ')}
                  </p>
                )}
              </section>
            )}

            {/* ── Condition Checklist ─────────────────────────────────────────── */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-line pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">
                  Condition Checklist
                </h4>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest">not required for publishing</span>
              </div>

              {applicableCoreChecklistKeys.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-2">Core Condition Notes</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {booleanCoreChecklistKeys.map((key) => (
                    <label key={key}
                      className={`flex items-center justify-between border p-3 rounded-sm cursor-pointer transition-colors ${
                        formData.conditionChecklist[key]
                          ? 'bg-data/5 border-data/40 text-data'
                          : 'bg-surface border-line hover:border-accent'
                      }`}>
                      <div className="flex items-center gap-2">
                        {formData.conditionChecklist[key]
                          ? <CheckCircle2 size={14} className="text-data flex-shrink-0" />
                          : <AlertCircle size={14} className="text-muted flex-shrink-0" />
                        }
                        <span className="text-[10px] font-black uppercase tracking-widest">{coreChecklistLabels[key]}</span>
                      </div>
                      <input type="checkbox"
                        checked={!!formData.conditionChecklist[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditionChecklist: { ...formData.conditionChecklist, [key]: e.target.checked }
                        })}
                        className="w-4 h-4 accent-accent flex-shrink-0" />
                    </label>
                  ))}
                  {showHydraulicsLeakField && (
                  <div className="flex items-center justify-between border p-3 rounded-sm bg-surface border-line md:col-span-2 gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      {formData.conditionChecklist.hydraulicsLeakStatus
                        ? <CheckCircle2 size={14} className="text-data flex-shrink-0" />
                        : <AlertCircle size={14} className="text-muted flex-shrink-0" />
                      }
                      <span className="text-[10px] font-black uppercase tracking-widest">{coreChecklistLabels.hydraulicsLeakStatus}</span>
                    </div>
                    <select
                      value={String(formData.conditionChecklist.hydraulicsLeakStatus || '')}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditionChecklist: { ...formData.conditionChecklist, hydraulicsLeakStatus: e.target.value as 'yes' | 'no' | '' }
                      })}
                      className="input-industrial w-28 shrink-0"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  )}
                </div>
              </div>
              )}

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Records & Manuals</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {documentationChecklistKeys.map((key) => (
                    <label key={key}
                      className={`flex items-center justify-between border p-3 rounded-sm cursor-pointer transition-colors ${
                        formData.conditionChecklist[key]
                          ? 'bg-data/5 border-data/40 text-data'
                          : 'bg-surface border-line hover:border-accent'
                      }`}>
                      <div className="flex items-center gap-2">
                        {formData.conditionChecklist[key]
                          ? <CheckCircle2 size={14} className="text-data flex-shrink-0" />
                          : <AlertCircle size={14} className="text-muted flex-shrink-0" />
                        }
                        <span className="text-[10px] font-black uppercase tracking-widest">{documentationChecklistLabels[key]}</span>
                      </div>
                      <input type="checkbox"
                        checked={!!formData.conditionChecklist[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditionChecklist: { ...formData.conditionChecklist, [key]: e.target.checked }
                        })}
                        className="w-4 h-4 accent-accent flex-shrink-0" />
                    </label>
                  ))}
                </div>
              </div>

              {extraChecklist.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">
                    {schema.displayName}-Specific (Recommended)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {extraChecklist.map((item) => (
                      <label key={item.key}
                        className={`flex items-center justify-between border p-3 rounded-sm cursor-pointer transition-colors ${
                          formData.conditionChecklist[item.key]
                            ? 'bg-data/5 border-data/40 text-data'
                            : 'bg-surface border-line hover:border-accent'
                        }`}>
                        <div className="flex items-center gap-2">
                          {formData.conditionChecklist[item.key]
                            ? <CheckCircle2 size={14} className="text-data flex-shrink-0" />
                            : <AlertCircle size={14} className="text-muted flex-shrink-0" />
                          }
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <input type="checkbox"
                          checked={!!formData.conditionChecklist[item.key]}
                          onChange={(e) => setFormData({
                            ...formData,
                            conditionChecklist: { ...formData.conditionChecklist, [item.key]: e.target.checked }
                          })}
                          className="w-4 h-4 accent-accent flex-shrink-0" />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── Images ──────────────────────────────────────────────────────── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Machine Photos</h4>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  formData.images.length < MIN_IMAGE_COUNT ? 'text-accent' : formData.images.length > 40 ? 'text-red-500' : 'text-data'
                }`}>
                  {formData.images.length} / 40
                  {formData.images.length < MIN_IMAGE_COUNT && ` · need ${MIN_IMAGE_COUNT - formData.images.length} more`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {formData.images.map((img, i) => (
                  <div key={`${img}-${i}`}
                    draggable
                    onDragStart={() => setImageDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (imageDragIdx !== null && imageDragIdx !== i) {
                        setFormData((prev) => {
                          const images = [...prev.images];
                          const imageTitles = normalizeListingImageTitles(prev.images, prev.imageTitles);
                          const imageVariants = [...(prev.imageVariants || [])];
                          const [movedImg] = images.splice(imageDragIdx, 1);
                          images.splice(i, 0, movedImg);
                          const [movedTitle] = imageTitles.splice(imageDragIdx, 1);
                          imageTitles.splice(i, 0, movedTitle);
                          if (imageVariants.length > imageDragIdx) {
                            const [movedVar] = imageVariants.splice(imageDragIdx, 1);
                            imageVariants.splice(i, 0, movedVar);
                          }
                          return { ...prev, images, imageTitles, imageVariants };
                        });
                      }
                      setImageDragIdx(null);
                    }}
                    onDragEnd={() => setImageDragIdx(null)}
                    className={`flex flex-col gap-2 bg-surface border rounded-sm overflow-hidden p-2 cursor-grab active:cursor-grabbing ${imageDragIdx === i ? 'border-accent opacity-50' : 'border-line'}`}>
                    <div className="relative aspect-video overflow-hidden rounded-sm group">
                      <img
                        src={img}
                        alt={formData.imageTitles?.[i] || `Listing photo ${i + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-accent text-white text-[8px] font-black uppercase px-1.5 py-0.5">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label={`Remove photo ${i + 1}`}
                        className="absolute top-1 right-1 p-1 bg-ink/80 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                        Photo {i + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          aria-label={`Move image ${i + 1} up`}
                          disabled={i === 0}
                          className="p-1 text-muted hover:text-ink disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          aria-label={`Move image ${i + 1} down`}
                          disabled={i === formData.images.length - 1}
                          className="p-1 text-muted hover:text-ink disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          aria-label={`Move photo ${i + 1} earlier`}
                          disabled={i === 0}
                          className="inline-flex items-center justify-center border border-line bg-bg p-1 text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          aria-label={`Move photo ${i + 1} later`}
                          disabled={i === formData.images.length - 1}
                          className="inline-flex items-center justify-center border border-line bg-bg p-1 text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={formData.imageTitles?.[i] || ''}
                      onChange={(e) => updateImageTitle(i, e.target.value)}
                      placeholder="Photo title (optional)"
                      aria-label={`Photo ${i + 1} title`}
                      className="input-industrial w-full text-[10px]"
                      maxLength={120}
                    />
                  </div>
                ))}
                {formData.images.length < 40 && (
                  <button type="button" onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="aspect-video border-2 border-dashed border-line flex flex-col items-center justify-center text-muted hover:text-ink hover:border-accent transition-all rounded-sm disabled:opacity-50">
                    {uploadingImages ? (
                      <>
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[9px] font-black uppercase">Uploading {imageUploadProgress}%</span>
                        <div className="h-1 w-3/4 bg-accent/20 rounded overflow-hidden mt-1">
                          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${imageUploadProgress}%` }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <Plus size={20} className="mb-1" />
                        <span className="text-[9px] font-black uppercase">Add Photos</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                multiple className="hidden"
                onChange={(e) => handleImageFiles(e.target.files)} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider">
                Max 10 MB per image · Max 500 MB per video
              </span>
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest">
                JPG / PNG / WEBP / AVIF up to 10 MB each. First image = cover photo. Reorder with arrows and add optional photo titles. Min {MIN_IMAGE_COUNT} · Max 40.
              </p>
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest">
                Photo uploads may take a few minutes depending on file size and internet speed.
              </p>
              {uploadError && (
                <p className="text-[9px] text-accent font-bold uppercase tracking-widest">{uploadError}</p>
              )}
            </section>

            {/* ── Videos ──────────────────────────────────────────────────────── */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-line pb-2">
                Equipment Videos (Optional)
              </h4>
              {(formData.videoUrls || []).length > 0 && (
                <div className="space-y-2">
                  {(formData.videoUrls || []).map((url, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface border border-line p-3 rounded-sm gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Video size={14} className="text-accent flex-shrink-0" />
                        <span className="text-[10px] font-bold truncate">{url}</span>
                      </div>
                      <button type="button" onClick={() => removeVideo(i)}
                        className="text-muted hover:text-accent flex-shrink-0 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted">
                {(formData.videoUrls || []).length} / {MAX_VIDEO_COUNT} videos attached
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideos}
                  className="btn-industrial py-2 px-4 text-[10px] flex items-center gap-2 disabled:opacity-50">
                  {uploadingVideos ? (
                    <>
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Uploading {videoUploadProgress}%
                    </>
                  ) : (
                    <><Upload size={14} /> Upload Video File</>
                  )}
                </button>
                <button type="button" onClick={addVideoUrl}
                  className="btn-industrial py-2 px-4 text-[10px] flex items-center gap-2">
                  <Video size={14} /> Add Video URL
                </button>
              </div>
              <input ref={videoInputRef} type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/mpeg"
                multiple className="hidden"
                onChange={(e) => handleVideoFiles(e.target.files)} />
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest">
                Upload MP4 / MOV / AVI / WebM / MPEG up to 500 MB to Firebase Storage, or paste a YouTube / Vimeo URL.
              </p>
              {uploadError && (
                <p className="text-[9px] text-accent font-bold uppercase tracking-widest">{uploadError}</p>
              )}
            </section>

            {/* ── Description ─────────────────────────────────────────────────── */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-line pb-2">
                Description
              </h4>
              <textarea rows={5} value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-industrial w-full resize-none"
                placeholder="Describe the machine's condition, recent maintenance, service history, and any notable features or defects..." />
            </section>

            {/* ── Validation errors ───────────────────────────────────────────── */}
            {validationErrors.length > 0 && (
              <div className="flex items-start gap-3 bg-accent/10 border border-accent p-4 rounded-sm">
                <AlertCircle size={16} className="text-accent flex-shrink-0 mt-0.5" />
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-[11px] font-black uppercase tracking-widest text-accent">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {submitError && (
              <div className="flex items-start gap-3 bg-accent/10 border border-accent p-4 rounded-sm">
                <AlertCircle size={16} className="text-accent flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-black uppercase tracking-widest text-accent">{submitError}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="p-6 border-t border-line bg-surface flex items-center justify-between flex-shrink-0">
            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
              <span className="text-accent">*</span> Required to publish
            </span>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-industrial py-3 px-6">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit}
                disabled={uploadingImages || uploadingVideos || isSaving}
                className="btn-industrial btn-accent py-3 px-8 disabled:opacity-50">
                {isSaving ? 'Publishing...' : listing ? 'Update Machine' : 'Publish Listing'}
              </button>
            </div>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
