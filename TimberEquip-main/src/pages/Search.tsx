import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Grid,
  List,
  Search as SearchIcon,
  X,
  ArrowUpDown,
  Save,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import { taxonomyService, EquipmentTaxonomy } from '../services/taxonomyService';
import { Listing, AlertPreferences } from '../types';
import { ListingCard } from '../components/ListingCard';
import { InquiryModal } from '../components/InquiryModal';
import { Seo } from '../components/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useAuth } from '../components/AuthContext';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useLocale } from '../components/LocaleContext';
import { auth } from '../firebase';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { buildListingPath } from '../utils/listingPath';

type SortBy = 'newest' | 'price_asc' | 'price_desc' | 'relevance' | 'popular';

interface SearchFilters {
  q: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  model: string;
  state: string;
  country: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  minHours: string;
  maxHours: string;
  condition: string;
  location: string;
  locationRadius: string;
  attachment: string;
  feature: string;
  stockNumber: string;
  serialNumber: string;
  sortBy: SortBy;
}

type FilterSectionKey = 'equipment' | 'pricing' | 'specs' | 'location';

const DEFAULT_FILTERS: SearchFilters = {
  q: '',
  category: '',
  subcategory: '',
  manufacturer: '',
  model: '',
  state: '',
  country: '',
  minPrice: '',
  maxPrice: '',
  minYear: '',
  maxYear: '',
  minHours: '',
  maxHours: '',
  condition: '',
  location: '',
  locationRadius: '',
  attachment: '',
  feature: '',
  stockNumber: '',
  serialNumber: '',
  sortBy: 'newest'
};

const LOCATION_RADIUS_OPTIONS = ['25', '50', '100', '250', '500', '1000'];

const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  newListingAlerts: true,
  priceDropAlerts: true,
  soldStatusAlerts: true,
  restockSimilarAlerts: true,
};

const parseNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const parseLocationCoordinates = (value: string): { lat: number; lng: number } | null => {
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length !== 2) return null;

  const lat = Number(parts[0]);
  const lng = Number(parts[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceMiles = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return earthRadiusMiles * c;
};

const getListingCoords = (listing: Listing): { lat?: number; lng?: number } => {
  const lat =
    typeof listing.latitude === 'number'
      ? listing.latitude
      : typeof listing.specs?.latitude === 'number'
        ? listing.specs.latitude
        : typeof listing.specs?.lat === 'number'
          ? listing.specs.lat
          : undefined;

  const lng =
    typeof listing.longitude === 'number'
      ? listing.longitude
      : typeof listing.specs?.longitude === 'number'
        ? listing.specs.longitude
        : typeof listing.specs?.lng === 'number'
          ? listing.specs.lng
          : typeof listing.specs?.lon === 'number'
            ? listing.specs.lon
            : undefined;

  return { lat, lng };
};

const getRelevanceScore = (listing: Listing, query: string): number => {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const title = normalize(listing.title);
  const make = normalize(listing.make || listing.manufacturer || listing.brand);
  const model = normalize(listing.model);
  const description = normalize(listing.description);
  const stock = normalize(listing.stockNumber);
  const serial = normalize(listing.serialNumber);

  let score = 0;
  if (title.includes(q)) score += 20;
  if (make.includes(q)) score += 25;
  if (model.includes(q)) score += 25;
  if (description.includes(q)) score += 5;
  if (stock.includes(q)) score += 35;
  if (serial.includes(q)) score += 35;
  if (`${make} ${model}`.includes(q)) score += 10;
  if (title.startsWith(q) || model.startsWith(q)) score += 10;

  return score;
};

const uniqueSorted = (values: Array<string | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => !!value && value.trim().length > 0))).sort((a, b) =>
    a.localeCompare(b)
  );

const getInitialFilters = (params: URLSearchParams): SearchFilters => ({
  ...DEFAULT_FILTERS,
  q: params.get('q') || '',
  category: params.get('category') || '',
  subcategory: params.get('subcategory') || '',
  manufacturer: params.get('manufacturer') || '',
  model: params.get('model') || '',
  state: params.get('state') || '',
  country: params.get('country') || '',
  minPrice: params.get('minPrice') || '',
  maxPrice: params.get('maxPrice') || '',
  minYear: params.get('minYear') || '',
  maxYear: params.get('maxYear') || '',
  minHours: params.get('minHours') || '',
  maxHours: params.get('maxHours') || '',
  condition: params.get('condition') || '',
  location: params.get('location') || '',
  locationRadius: params.get('locationRadius') || DEFAULT_FILTERS.locationRadius,
  attachment: params.get('attachment') || '',
  feature: params.get('feature') || '',
  stockNumber: params.get('stockNumber') || '',
  serialNumber: params.get('serialNumber') || '',
  sortBy: (params.get('sortBy') as SortBy) || DEFAULT_FILTERS.sortBy
});

const serializeFiltersToParams = (filters: SearchFilters): URLSearchParams => {
  const params = new URLSearchParams();

  (Object.entries(filters) as Array<[keyof SearchFilters, string]>).forEach(([key, value]) => {
    if (!value) return;
    if (value === DEFAULT_FILTERS[key]) return;
    params.set(key, value);
  });

  return params;
};

const applyDependentFilterResets = (
  previous: SearchFilters,
  key: keyof SearchFilters,
  value: string
): SearchFilters => {
  const next = { ...previous, [key]: value };
  if (key === 'category') {
    next.subcategory = '';
    next.manufacturer = '';
  }
  if (key === 'subcategory') {
    next.manufacturer = '';
  }
  return next;
};

const countActiveFilters = (filters: SearchFilters): number =>
  Object.entries(filters).filter(([key, value]) => key !== 'sortBy' && Boolean(value)).length;

const areFiltersEqual = (a: SearchFilters, b: SearchFilters): boolean =>
  (Object.keys(DEFAULT_FILTERS) as Array<keyof SearchFilters>).every((key) => a[key] === b[key]);

const getFilterSectionSummary = (filters: SearchFilters, key: FilterSectionKey): string => {
  if (key === 'equipment') {
    return [filters.category, filters.subcategory, filters.manufacturer, filters.model, filters.state, filters.country].filter(Boolean).join(' / ') || 'Category, make, model';
  }
  if (key === 'pricing') {
    return [
      filters.minPrice || filters.maxPrice ? `${filters.minPrice || '0'}-${filters.maxPrice || 'any'} price` : '',
      filters.minYear || filters.maxYear ? `${filters.minYear || 'any'}-${filters.maxYear || 'any'} year` : '',
      filters.minHours || filters.maxHours ? `${filters.minHours || '0'}-${filters.maxHours || 'any'} hrs` : ''
    ].filter(Boolean).join(' | ') || 'Price, year, hours';
  }
  if (key === 'specs') {
    return [filters.condition, filters.attachment, filters.feature, filters.stockNumber || filters.serialNumber ? 'IDs set' : '']
      .filter(Boolean)
      .join(' | ') || 'Condition, features, IDs';
  }
  return [filters.location, filters.locationRadius ? `${filters.locationRadius} mi` : ''].filter(Boolean).join(' | ') || 'Location and radius';
};

const PAGE_SIZE = 18;
const getInitialCachedListings = () => equipmentService.getCachedPublicListings();

export function Search() {
  const { user, toggleFavorite, isAuthenticated } = useAuth();
  const { t, formatNumber } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allListings, setAllListings] = useState<Listing[]>(() => getInitialCachedListings());
  const [taxonomy, setTaxonomy] = useState<EquipmentTaxonomy>({});
  const [loading, setLoading] = useState(() => getInitialCachedListings().length === 0);
  const [inventoryNotice, setInventoryNotice] = useState('');
  const [inventoryError, setInventoryError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [pendingSaveSearch, setPendingSaveSearch] = useState(false);

  const handleToggleFavorite = (id: string) => {
    if (!isAuthenticated) {
      setPendingFavoriteId(id);
      setShowLoginModal(true);
      return;
    }
    toggleFavorite(id);
  };
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(() => getInitialFilters(searchParams));
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(() => getInitialFilters(searchParams));
  const [openSections, setOpenSections] = useState<Record<FilterSectionKey, boolean>>({
    equipment: true,
    pricing: false,
    specs: false,
    location: false,
  });
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [savedSearchName, setSavedSearchName] = useState('');
  const [savingSearch, setSavingSearch] = useState(false);
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [selectedListingForInquiry, setSelectedListingForInquiry] = useState<Listing | null>(null);
  const favoriteIds = Array.isArray(user?.favorites) ? user.favorites : [];

  useEffect(() => {
    const fetchData = async () => {
      const cachedListings = equipmentService.getCachedPublicListings();
      if (cachedListings.length > 0) {
        setAllListings(cachedListings);
        setLoading(false);
      } else {
        setLoading(true);
      }

      setInventoryNotice('');
      setInventoryError('');

      try {
        const [listingsResult, taxonomyResult] = await Promise.allSettled([
          equipmentService.getListings({ inStockOnly: false, sortBy: 'newest' }),
          taxonomyService.getTaxonomy()
        ]);

        if (listingsResult.status === 'fulfilled') {
          setAllListings(listingsResult.value);
        } else if (cachedListings.length > 0) {
          console.warn('Falling back to cached listings in search view:', listingsResult.reason);
          setInventoryNotice('Showing the latest available inventory snapshot while live inventory recovers.');
        } else {
          const message =
            listingsResult.reason instanceof Error
              ? listingsResult.reason.message
              : 'Live inventory is temporarily unavailable.';
          setInventoryError(message);
        }

        if (taxonomyResult.status === 'fulfilled') {
          setTaxonomy(taxonomyResult.value);
        } else {
          console.warn('Error fetching taxonomy for search view:', taxonomyResult.reason);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        if (cachedListings.length > 0) {
          setInventoryNotice('Showing the latest available inventory snapshot while live inventory recovers.');
        } else {
          setInventoryError(error instanceof Error ? error.message : 'Live inventory is temporarily unavailable.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setAlertEmail(user.email);
    }
  }, [user?.email]);

  const closeAlertModal = () => {
    const defaultEmail = user?.email || '';
    const hasUnsavedChanges =
      savedSearchName.trim().length > 0 ||
      alertEmail.trim() !== defaultEmail.trim() ||
      JSON.stringify(alertPreferences) !== JSON.stringify(DEFAULT_ALERT_PREFERENCES);

    if (hasUnsavedChanges && !window.confirm('Are you sure you want to discard changes?')) return;

    setShowAlertModal(false);
    setSavedSearchName('');
    setAlertEmail(defaultEmail);
    setAlertPreferences(DEFAULT_ALERT_PREFERENCES);
  };

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  useEffect(() => {
    const parsed = getInitialFilters(searchParams);
    if (!areFiltersEqual(parsed, filters)) {
      setFilters(parsed);
      setDraftFilters(parsed);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = serializeFiltersToParams(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const taxonomyCategories = useMemo(() => Object.keys(taxonomy).sort((a, b) => a.localeCompare(b)), [taxonomy]);

  const taxonomySubcategories = useMemo(() => {
    if (!filters.category || !taxonomy[filters.category]) return [];
    return Object.keys(taxonomy[filters.category]).sort((a, b) => a.localeCompare(b));
  }, [filters.category, taxonomy]);

  const taxonomyManufacturers = useMemo(() => {
    if (!filters.category || !filters.subcategory) return [];
    return [...(taxonomy[filters.category]?.[filters.subcategory] || [])].sort((a, b) => a.localeCompare(b));
  }, [filters.category, filters.subcategory, taxonomy]);

  const listingCategories = useMemo(() => uniqueSorted(allListings.map((listing) => listing.category)), [allListings]);
  const listingSubcategories = useMemo(
    () => uniqueSorted(allListings.map((listing) => listing.subcategory || listing.category)),
    [allListings]
  );

  const manufacturerOptions = useMemo(() => {
    const listingManufacturers = uniqueSorted(
      allListings.map((listing) => listing.make || listing.manufacturer || listing.brand)
    );
    return uniqueSorted([...taxonomyManufacturers, ...listingManufacturers]);
  }, [allListings, taxonomyManufacturers]);

  const modelOptions = useMemo(() => {
    const narrowed = allListings.filter((listing) => {
      if (!filters.manufacturer) return true;
      return normalize(listing.make || listing.manufacturer || listing.brand).includes(normalize(filters.manufacturer));
    });
    return uniqueSorted(narrowed.map((listing) => listing.model));
  }, [allListings, filters.manufacturer]);

  const attachmentOptions = useMemo(
    () => uniqueSorted(allListings.flatMap((listing) => (Array.isArray(listing.specs?.attachments) ? listing.specs.attachments : []))),
    [allListings]
  );

  const locationParts = useMemo(() => {
    return allListings.map((listing) => {
      const raw = listing.location || '';
      const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
      const country = parts.length > 0 ? parts[parts.length - 1] : '';
      const state = parts.length > 1 ? parts[parts.length - 2] : '';
      return { state, country };
    });
  }, [allListings]);

  const stateOptions = useMemo(() => uniqueSorted(locationParts.map((part) => part.state)), [locationParts]);
  const countryOptions = useMemo(() => uniqueSorted(locationParts.map((part) => part.country)), [locationParts]);

  const featureOptions = useMemo(
    () =>
      uniqueSorted(
        allListings.flatMap((listing) => {
          const topLevel = Array.isArray(listing.features) ? listing.features : [];
          const specLevel = Array.isArray(listing.specs?.features) ? listing.specs.features : [];
          return [...topLevel, ...specLevel];
        })
      ),
    [allListings]
  );

  const filteredListings = useMemo(() => {
    const minPrice = parseNumber(filters.minPrice);
    const maxPrice = parseNumber(filters.maxPrice);
    const minYear = parseNumber(filters.minYear);
    const maxYear = parseNumber(filters.maxYear);
    const minHours = parseNumber(filters.minHours);
    const maxHours = parseNumber(filters.maxHours);
    const radius = parseNumber(filters.locationRadius);
    const center = parseLocationCoordinates(filters.location);

    let results = allListings.filter((listing) => {
      if ((listing.status || 'active') === 'sold') return false;

      if (filters.q) {
        const q = normalize(filters.q);
        const matchesKeyword =
          normalize(listing.title).includes(q) ||
          normalize(listing.make || listing.manufacturer || listing.brand).includes(q) ||
          normalize(listing.model).includes(q) ||
          normalize(listing.description).includes(q) ||
          normalize(listing.stockNumber).includes(q) ||
          normalize(listing.serialNumber).includes(q);
        if (!matchesKeyword) return false;
      }

      if (filters.category) {
        const normalizedCategory = normalize(filters.category);
        const categoryMatch =
          normalize(listing.category) === normalizedCategory ||
          normalize(listing.subcategory) === normalizedCategory;
        if (!categoryMatch) return false;
      }

      if (filters.subcategory) {
        const normalizedSubcategory = normalize(filters.subcategory);
        const subcategoryMatch =
          normalize(listing.subcategory) === normalizedSubcategory || normalize(listing.category) === normalizedSubcategory;
        if (!subcategoryMatch) return false;
      }

      if (filters.manufacturer) {
        const make = normalize(listing.make || listing.manufacturer || listing.brand);
        if (!make.includes(normalize(filters.manufacturer))) return false;
      }

      if (filters.model && !normalize(listing.model).includes(normalize(filters.model))) return false;

      if (filters.state) {
        const locationParts = (listing.location || '').split(',').map((part) => part.trim()).filter(Boolean);
        const listingState = locationParts.length > 1 ? locationParts[locationParts.length - 2] : '';
        if (!normalize(listingState).includes(normalize(filters.state))) return false;
      }

      if (filters.country) {
        const locationParts = (listing.location || '').split(',').map((part) => part.trim()).filter(Boolean);
        const listingCountry = locationParts.length > 0 ? locationParts[locationParts.length - 1] : '';
        if (!normalize(listingCountry).includes(normalize(filters.country))) return false;
      }

      if (minPrice !== undefined && listing.price < minPrice) return false;
      if (maxPrice !== undefined && listing.price > maxPrice) return false;
      if (minYear !== undefined && listing.year < minYear) return false;
      if (maxYear !== undefined && listing.year > maxYear) return false;
      if (minHours !== undefined && listing.hours < minHours) return false;
      if (maxHours !== undefined && listing.hours > maxHours) return false;

      if (filters.condition && normalize(listing.condition) !== normalize(filters.condition)) return false;

      if (filters.location) {
        const locationTextMatch = normalize(listing.location).includes(normalize(filters.location));

        if (radius !== undefined && radius > 0 && center) {
          const coords = getListingCoords(listing);
          if (coords.lat !== undefined && coords.lng !== undefined) {
            const withinRadius = distanceMiles(center.lat, center.lng, coords.lat, coords.lng) <= radius;
            if (!withinRadius) return false;
          } else if (!locationTextMatch) {
            return false;
          }
        } else if (!locationTextMatch) {
          return false;
        }
      }

      if (filters.attachment) {
        const attachments = Array.isArray(listing.specs?.attachments) ? listing.specs.attachments : [];
        const hasAttachment = attachments.some((attachment) => normalize(attachment).includes(normalize(filters.attachment)));
        if (!hasAttachment) return false;
      }

      if (filters.feature) {
        const topLevel = Array.isArray(listing.features) ? listing.features : [];
        const specLevel = Array.isArray(listing.specs?.features) ? listing.specs.features : [];
        const hasFeature = [...topLevel, ...specLevel].some((feature) => normalize(feature).includes(normalize(filters.feature)));
        if (!hasFeature) return false;
      }

      if (filters.stockNumber && !normalize(listing.stockNumber).includes(normalize(filters.stockNumber))) return false;
      if (filters.serialNumber && !normalize(listing.serialNumber).includes(normalize(filters.serialNumber))) return false;

      return true;
    });

    if (filters.sortBy === 'price_asc') {
      results = [...results].sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      results = [...results].sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'popular') {
      results = [...results].sort((a, b) => b.views + b.leads * 3 - (a.views + a.leads * 3));
    } else if (filters.sortBy === 'relevance') {
      results = [...results].sort((a, b) => getRelevanceScore(b, filters.q) - getRelevanceScore(a, filters.q));
    } else {
      results = [...results].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime() || 0;
        const bTime = new Date(b.createdAt).getTime() || 0;
        return bTime - aTime;
      });
    }

    return results;
  }, [allListings, filters]);

  // Reset pagination whenever the result set changes (new filters applied)
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [filteredListings]);

  const displayedListings = filteredListings.slice(0, displayCount);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => applyDependentFilterResets(prev, key, value));
  };

  const handleDraftFilterChange = (key: keyof SearchFilters, value: string) => {
    setDraftFilters((prev) => applyDependentFilterResets(prev, key, value));
  };

  const applyDraftFilters = () => {
    setFilters(draftFilters);
    setShowFilters(false);
  };

  const clearDraftFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
  };

  const toggleSection = (section: FilterSectionKey) => {
    setOpenSections((prev) => {
      const willOpen = !prev[section];
      return {
        equipment: false,
        pricing: false,
        specs: false,
        location: false,
        [section]: willOpen,
      };
    });
  };

  const saveSearchWithAlerts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setPendingSaveSearch(true);
        setShowLoginModal(true);
        return;
      }

      const rcToken = await getRecaptchaToken('SAVE_SEARCH_ALERT');
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'SAVE_SEARCH_ALERT');
        if (!pass) {
          alert('Security check failed. Please try again.');
          return;
        }
      }

      const normalizedFilters = (Object.entries(filters) as Array<[keyof SearchFilters, string]>).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {});

      const fallbackName = [filters.category, filters.manufacturer, filters.model, filters.q]
        .filter(Boolean)
        .join(' | ') || 'My Equipment Search';

      setSavingSearch(true);
      await userService.createSavedSearch({
        name: savedSearchName.trim() || fallbackName,
        filters: normalizedFilters,
        alertEmail: alertEmail.trim() || user?.email || currentUser.email || '',
        alertPreferences
      });
      setShowAlertModal(false);
      setSavedSearchName('');
      setAlertEmail(user?.email || currentUser.email || '');
      setAlertPreferences(DEFAULT_ALERT_PREFERENCES);
      setPendingSaveSearch(false);
      alert('Saved search and alerts are active.');
    } catch (error) {
      console.error('Error saving search:', error);
      alert(error instanceof Error ? error.message : 'Unable to save search right now.');
    } finally {
      setSavingSearch(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareList((prev) => (prev.includes(id) ? prev.filter((listingId) => listingId !== id) : [...prev, id]));
  };

  const seoTitle = filters.q
    ? `Forestry Equipment Sales | ${filters.q} Listings (${filteredListings.length})`
    : 'Forestry Equipment Sales | New & Used Logging Equipment For Sale';

  const seoDescription =
    'Search in-stock new and used logging equipment with advanced filters for category, manufacturer, model, price, year, hours, condition, location, attachments, and features.';

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'In-Stock Logging Equipment Listings',
    itemListElement: filteredListings.slice(0, 24).map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://timberequip.com${buildListingPath(listing)}`,
      item: {
        '@type': 'Product',
        name: `${listing.year} ${listing.make || listing.manufacturer || ''} ${listing.model}`.trim(),
        sku: listing.stockNumber || listing.id,
        brand: {
          '@type': 'Brand',
          name: listing.make || listing.manufacturer || listing.brand || 'Forestry Equipment Sales'
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: listing.currency || 'USD',
          price: listing.price,
          availability: 'https://schema.org/InStock'
        }
      }
    }))
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Seo title={seoTitle} description={seoDescription} canonicalPath="/search" jsonLd={itemListJsonLd} />
      <Breadcrumbs />

      <div className="bg-surface border-b border-line py-8 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="w-full flex items-center justify-end space-x-3">
              <button onClick={() => setShowAlertModal(true)} className="btn-industrial bg-bg py-1.5 px-4 text-[10px]">
                <Save size={12} className="mr-2" />
                Save Search
              </button>
              <div className="flex items-center bg-bg border border-line rounded-sm p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-sm ${viewMode === 'list' ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 gap-8 transition-all ${compareList.length > 0 ? 'pb-48' : 'pb-12'}`}
      >
        <aside className={`w-full lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Equipment Filters</h3>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                  {countActiveFilters(draftFilters)} selected
                </span>
              </div>

              <div className="space-y-4">
                <div className="border border-line bg-bg rounded-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('equipment')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Equipment</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                        {getFilterSectionSummary(draftFilters, 'equipment')}
                      </div>
                    </div>
                    {openSections.equipment ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openSections.equipment && (
                    <div className="border-t border-line p-4 space-y-4 bg-surface/40">
                      <div className="flex flex-col space-y-2">
                        <span className="label-micro">Category</span>
                        <select
                          value={draftFilters.category}
                          onChange={(e) => handleDraftFilterChange('category', e.target.value)}
                          className="select-industrial w-full"
                        >
                          <option value="">All Categories</option>
                          {uniqueSorted([...taxonomyCategories, ...listingCategories]).map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <span className="label-micro">Subcategory</span>
                        <select
                          value={draftFilters.subcategory}
                          onChange={(e) => handleDraftFilterChange('subcategory', e.target.value)}
                          className="select-industrial w-full"
                        >
                          <option value="">All Subcategories</option>
                          {uniqueSorted([...taxonomySubcategories, ...listingSubcategories]).map((subcategory) => (
                            <option key={subcategory} value={subcategory}>
                              {subcategory}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <span className="label-micro">Manufacturer / Brand</span>
                        <select
                          value={draftFilters.manufacturer}
                          onChange={(e) => handleDraftFilterChange('manufacturer', e.target.value)}
                          className="select-industrial w-full"
                        >
                          <option value="">All Manufacturers</option>
                          {manufacturerOptions.map((manufacturer) => (
                            <option key={manufacturer} value={manufacturer}>
                              {manufacturer}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <span className="label-micro">Model</span>
                        <input
                          type="text"
                          list="model-suggestions"
                          placeholder="e.g. 855E"
                          className="input-industrial w-full"
                          value={draftFilters.model}
                          onChange={(e) => handleDraftFilterChange('model', e.target.value)}
                        />
                        <datalist id="model-suggestions">
                          {modelOptions.slice(0, 150).map((model) => (
                            <option key={model} value={model} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-line bg-bg rounded-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('pricing')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Pricing & Usage</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                        {getFilterSectionSummary(draftFilters, 'pricing')}
                      </div>
                    </div>
                    {openSections.pricing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openSections.pricing && (
                    <div className="border-t border-line p-4 space-y-4 bg-surface/40">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Min Price</span>
                          <input
                            type="number"
                            placeholder="0"
                            className="input-industrial w-full"
                            value={draftFilters.minPrice}
                            onChange={(e) => handleDraftFilterChange('minPrice', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Max Price</span>
                          <input
                            type="number"
                            placeholder="No Max"
                            className="input-industrial w-full"
                            value={draftFilters.maxPrice}
                            onChange={(e) => handleDraftFilterChange('maxPrice', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Min Year</span>
                          <input
                            type="number"
                            placeholder="1990"
                            className="input-industrial w-full"
                            value={draftFilters.minYear}
                            onChange={(e) => handleDraftFilterChange('minYear', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Max Year</span>
                          <input
                            type="number"
                            placeholder={String(new Date().getFullYear())}
                            className="input-industrial w-full"
                            value={draftFilters.maxYear}
                            onChange={(e) => handleDraftFilterChange('maxYear', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Min Hours</span>
                          <input
                            type="number"
                            placeholder="0"
                            className="input-industrial w-full"
                            value={draftFilters.minHours}
                            onChange={(e) => handleDraftFilterChange('minHours', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Max Hours</span>
                          <input
                            type="number"
                            placeholder="20000"
                            className="input-industrial w-full"
                            value={draftFilters.maxHours}
                            onChange={(e) => handleDraftFilterChange('maxHours', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-line bg-bg rounded-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('specs')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Condition & Specs</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                        {getFilterSectionSummary(draftFilters, 'specs')}
                      </div>
                    </div>
                    {openSections.specs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openSections.specs && (
                    <div className="border-t border-line p-4 space-y-4 bg-surface/40">
                      <div className="flex flex-col space-y-2">
                        <span className="label-micro">Condition</span>
                        <select
                          value={draftFilters.condition}
                          onChange={(e) => handleDraftFilterChange('condition', e.target.value)}
                          className="select-industrial w-full"
                        >
                          <option value="">All Conditions</option>
                          <option value="New">New</option>
                          <option value="Used">Used</option>
                          <option value="Rebuilt">Rebuilt</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Attachment</span>
                          <input
                            type="text"
                            list="attachment-suggestions"
                            placeholder="e.g. Grapple"
                            className="input-industrial w-full"
                            value={draftFilters.attachment}
                            onChange={(e) => handleDraftFilterChange('attachment', e.target.value)}
                          />
                          <datalist id="attachment-suggestions">
                            {attachmentOptions.slice(0, 150).map((attachment) => (
                              <option key={attachment} value={attachment} />
                            ))}
                          </datalist>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Feature</span>
                          <input
                            type="text"
                            list="feature-suggestions"
                            placeholder="e.g. Winch"
                            className="input-industrial w-full"
                            value={draftFilters.feature}
                            onChange={(e) => handleDraftFilterChange('feature', e.target.value)}
                          />
                          <datalist id="feature-suggestions">
                            {featureOptions.slice(0, 150).map((feature) => (
                              <option key={feature} value={feature} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Stock #</span>
                          <input
                            type="text"
                            placeholder="Stock number"
                            className="input-industrial w-full"
                            value={draftFilters.stockNumber}
                            onChange={(e) => handleDraftFilterChange('stockNumber', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Serial #</span>
                          <input
                            type="text"
                            placeholder="Serial number"
                            className="input-industrial w-full"
                            value={draftFilters.serialNumber}
                            onChange={(e) => handleDraftFilterChange('serialNumber', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-line bg-bg rounded-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('location')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Location</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                        {getFilterSectionSummary(draftFilters, 'location')}
                      </div>
                    </div>
                    {openSections.location ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openSections.location && (
                    <div className="border-t border-line p-4 space-y-4 bg-surface/40">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 flex flex-col space-y-2">
                          <span className="label-micro">Location / Center</span>
                          <input
                            type="text"
                            placeholder="City/State or lat,lng"
                            className="input-industrial w-full"
                            value={draftFilters.location}
                            onChange={(e) => handleDraftFilterChange('location', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Radius (mi)</span>
                          <select
                            value={draftFilters.locationRadius}
                            onChange={(e) => handleDraftFilterChange('locationRadius', e.target.value)}
                            className="select-industrial w-full"
                          >
                            <option value="">Any radius</option>
                            {LOCATION_RADIUS_OPTIONS.map((radius) => (
                              <option key={radius} value={radius}>
                                {radius}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">State / Province</span>
                          <select
                            value={draftFilters.state}
                            onChange={(e) => handleDraftFilterChange('state', e.target.value)}
                            className="select-industrial w-full"
                          >
                            <option value="">All States</option>
                            {stateOptions.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="label-micro">Country</span>
                          <select
                            value={draftFilters.country}
                            onChange={(e) => handleDraftFilterChange('country', e.target.value)}
                            className="select-industrial w-full"
                          >
                            <option value="">All Countries</option>
                            {countryOptions.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={clearDraftFilters} className="btn-industrial bg-bg py-3 text-[10px]">
                    {t('search.clear', 'Clear')}
                  </button>
                  <button onClick={applyDraftFilters} className="btn-industrial btn-accent py-3 text-[10px]">
                    {t('search.applyFilters', 'Apply Filters')}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] p-6 rounded-sm shadow-xl border border-accent/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bell size={48} className="text-accent" />
              </div>
              <div className="relative z-10 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Enable Alerts</h4>
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-relaxed">
                  {t('search.alertsDescription', 'Get notified the moment in-stock assets matching your filters hit the platform.')}
                </p>
                <button onClick={() => setShowAlertModal(true)} className="btn-industrial btn-accent w-full py-2 text-[10px]">
                  {t('search.configureAlerts', 'Configure Alerts')}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <AnimatePresence>
          {showAlertModal && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeAlertModal}
                className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-sm border border-line bg-bg p-8 shadow-2xl"
              >
                <button onClick={closeAlertModal} className="absolute top-4 right-4 text-muted hover:text-ink">
                  <X size={20} />
                </button>

                <div className="overflow-y-auto">
                  <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-accent/10 flex items-center justify-center rounded-full mb-6">
                    <Bell size={32} className="text-accent" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Market Alerts</h3>
                  <p className="text-muted text-xs font-bold uppercase tracking-widest mb-8">
                    {t('search.marketAlertsDescription', 'Get notified when new in-stock equipment matches your filters.')}
                  </p>

                  <div className="w-full space-y-4 mb-8">
                    <div className="bg-surface p-4 rounded-sm border border-line text-left">
                      <span className="label-micro block mb-2">Current Filters</span>
                      <div className="flex flex-wrap gap-2">
                        {filters.q && <span className="px-2 py-1 bg-ink text-bg text-[9px] font-bold uppercase">{filters.q}</span>}
                        {filters.category && (
                          <span className="px-2 py-1 bg-ink text-bg text-[9px] font-bold uppercase">{filters.category}</span>
                        )}
                        {filters.manufacturer && (
                          <span className="px-2 py-1 bg-ink text-bg text-[9px] font-bold uppercase">{filters.manufacturer}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 text-left">
                      <span className="label-micro">Saved Search Name</span>
                      <input
                        type="text"
                        value={savedSearchName}
                        onChange={(e) => setSavedSearchName(e.target.value)}
                        placeholder="MY SKIDDER SEARCH"
                        className="input-industrial w-full py-3"
                      />
                    </div>

                    <div className="flex flex-col space-y-2 text-left">
                      <span className="label-micro">Email Address</span>
                      <input
                        type="email"
                        value={alertEmail}
                        onChange={(e) => setAlertEmail(e.target.value)}
                        placeholder="ENTER YOUR EMAIL..."
                        className="input-industrial w-full py-3"
                      />
                    </div>

                    <div className="bg-surface p-4 rounded-sm border border-line text-left space-y-3">
                      <span className="label-micro block">Alert Types</span>
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        {t('search.newListingAlerts', 'New Listing Alerts')}
                        <input
                          type="checkbox"
                          checked={alertPreferences.newListingAlerts}
                          onChange={(e) => setAlertPreferences((prev) => ({ ...prev, newListingAlerts: e.target.checked }))}
                        />
                      </label>
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        {t('search.priceDropAlerts', 'Price Drop Alerts')}
                        <input
                          type="checkbox"
                          checked={alertPreferences.priceDropAlerts}
                          onChange={(e) => setAlertPreferences((prev) => ({ ...prev, priceDropAlerts: e.target.checked }))}
                        />
                      </label>
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        {t('search.soldStatusAlerts', 'Sold Status Alerts')}
                        <input
                          type="checkbox"
                          checked={alertPreferences.soldStatusAlerts}
                          onChange={(e) => setAlertPreferences((prev) => ({ ...prev, soldStatusAlerts: e.target.checked }))}
                        />
                      </label>
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        {t('search.restockSimilarAlerts', 'Restock / Similar Equipment')}
                        <input
                          type="checkbox"
                          checked={alertPreferences.restockSimilarAlerts}
                          onChange={(e) => setAlertPreferences((prev) => ({ ...prev, restockSimilarAlerts: e.target.checked }))}
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={saveSearchWithAlerts}
                    disabled={savingSearch}
                    className="btn-industrial btn-accent w-full py-4"
                  >
                    {savingSearch ? t('search.saving', 'Saving...') : t('search.activateAlerts', 'Activate Alerts')}
                  </button>
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-muted">
                    Protected by reCAPTCHA Enterprise before submission.
                  </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-10 border-b border-line pb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-black uppercase tracking-tighter">
                {formatNumber(filteredListings.length)}{filters.category ? ` ${filters.category}` : ` ${t('search.machines', 'Machines')}`} {t('search.available', 'Available')}
              </span>
              <div className="h-4 w-px bg-line"></div>
              <div className="flex items-center text-muted text-[10px] font-bold uppercase tracking-widest">
                <ArrowUpDown size={12} className="mr-2" />
                {t('search.sortBy', 'Sort By')}:
                <select
                  value={filters.sortBy}
                  onChange={(e) => {
                    const nextSort = e.target.value as SortBy;
                    handleFilterChange('sortBy', nextSort);
                    handleDraftFilterChange('sortBy', nextSort);
                  }}
                  className="bg-transparent border-none focus:ring-0 cursor-pointer text-ink ml-1 pl-2"
                >
                  <option value="newest">{t('search.sortNewest', 'Newest')}</option>
                  <option value="price_asc">{t('search.sortPriceLowHigh', 'Price: Low to High')}</option>
                  <option value="price_desc">{t('search.sortPriceHighLow', 'Price: High to Low')}</option>
                  <option value="relevance">{t('search.sortRelevance', 'Relevance')}</option>
                  <option value="popular">{t('search.sortPopular', 'Popular')}</option>
                </select>
              </div>
            </div>
          </div>

          {inventoryError ? (
            <div className="mb-6 rounded-sm border border-accent/30 bg-accent/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-accent">
              {inventoryError}
            </div>
          ) : null}

          {inventoryNotice ? (
            <div className="mb-6 rounded-sm border border-data/20 bg-data/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-data">
              {inventoryNotice}
            </div>
          ) : null}

          {loading ? (
            <div className="industrial-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-surface animate-pulse"></div>
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <>
              <div className="mb-6 text-[11px] font-bold uppercase tracking-widest text-muted">
                {t('search.showing', 'Showing')} <span className="text-ink">{formatNumber(displayedListings.length)}</span> {t('search.of', 'of')}{' '}
                <span className="text-ink">{formatNumber(filteredListings.length)}</span> {t('search.listings', 'Listings')}
              </div>
              <div className={viewMode === 'grid' ? 'industrial-grid' : 'flex flex-col space-y-1'}>
                {displayedListings.map((listing) => (
                  <div key={listing.id}>
                    <ListingCard
                      listing={listing}
                      isFavorite={favoriteIds.includes(listing.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onInquire={(selected) => setSelectedListingForInquiry(selected)}
                      isComparing={compareList.includes(listing.id)}
                      onToggleCompare={toggleCompare}
                    />
                  </div>
                ))}
              </div>
              {displayCount < filteredListings.length && (
                <div className="mt-12 flex flex-col items-center space-y-3">
                  <button
                    onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
                    className="btn-industrial btn-accent py-4 px-12"
                  >
                    {t('search.loadMore', 'Load More')}
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    {formatNumber(Math.min(displayCount + PAGE_SIZE, filteredListings.length))} {t('search.of', 'of')}{' '}
                    {formatNumber(filteredListings.length)} {t('search.afterLoad', 'after load')}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="py-32 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-surface flex items-center justify-center rounded-full mb-8">
                <SearchIcon size={40} className="text-muted" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">
                {inventoryError ? 'Inventory Temporarily Unavailable' : t('search.noEquipmentFound', 'No Equipment Found')}
              </h3>
              <p className="text-muted max-w-md mb-12">
                {inventoryError
                  ? 'Live inventory is temporarily unavailable because the catalog is recovering from a data service issue. Please retry shortly or clear your filters to try again.'
                  : t('search.noResultsMessage', 'We could not find in-stock assets matching your current filter criteria. Try widening year, price, or radius, or clear your filters.')}
              </p>
              <button onClick={inventoryError ? () => window.location.reload() : resetFilters} className="btn-industrial btn-accent">
                {inventoryError ? 'Retry Inventory Search' : t('search.clearAllFilters', 'Clear All Filters')}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedListingForInquiry && (
          <InquiryModal
            isOpen={!!selectedListingForInquiry}
            onClose={() => setSelectedListingForInquiry(null)}
            listing={selectedListingForInquiry}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-ink text-white z-50 py-6 px-4 md:px-8 border-t border-accent/30 shadow-2xl"
          >
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-8">
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-widest mb-1">{t('search.comparisonTool', 'Comparison Tool')}</span>
                  <span className="text-lg font-black tracking-tighter">{formatNumber(compareList.length)} {t('search.equipmentSelected', 'Equipment Selected')}</span>
                </div>
                <div className="flex -space-x-4 overflow-hidden">
                  {compareList.map((id) => {
                    const listing = filteredListings.find((item) => item.id === id) || allListings.find((item) => item.id === id);
                    return listing ? (
                      <div key={id} className="relative w-12 h-12 rounded-sm border-2 border-ink overflow-hidden group">
                        <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => toggleCompare(id)}
                          className="absolute inset-0 bg-accent/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCompareList([])}
                  className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                >
                  {t('search.clearSelection', 'Clear Selection')}
                </button>
                <Link to={`/compare?ids=${compareList.join(',')}`} className="btn-industrial btn-accent py-4 px-12">
                  {t('search.compareEquipment', 'Compare Equipment')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => { setShowLoginModal(false); setPendingFavoriteId(null); setPendingSaveSearch(false); }}
        onSuccess={() => {
          if (pendingFavoriteId) {
            toggleFavorite(pendingFavoriteId);
            setPendingFavoriteId(null);
          }
          if (pendingSaveSearch) {
            setPendingSaveSearch(false);
            void saveSearchWithAlerts();
          }
        }}
        message={t('search.loginPrompt', 'Sign in to bookmark equipment and track your saved listings.')}
      />
    </div>
  );
}
