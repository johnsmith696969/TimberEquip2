import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  MapPin, Activity, X, Truck, ChevronLeft,
  ArrowLeft, Share2, Bookmark, ChevronRight, Clock,
  ShieldCheck, TrendingUp, Info, CheckCircle2,
  Phone, Calculator, AlertCircle, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { equipmentService } from '../services/equipmentService';
import { geminiService } from '../services/geminiService';
import {
  AMV_MATCH_HOURS_PERCENT,
  AMV_MATCH_PRICE_PERCENT,
  AMV_MATCH_YEAR_RANGE,
  AMV_MIN_COMPARABLES,
  getAmvMatchRulesSummary,
} from '../utils/amvMatching';
import { Listing, Seller } from '../types';
import { useAuth } from '../components/AuthContext';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { PaymentCalculatorModal } from '../components/PaymentCalculatorModal';
import { useLocale } from '../components/LocaleContext';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { Seo } from '../components/Seo';
import WatermarkOverlay from '../components/WatermarkOverlay';
import { buildListingPath, decodeListingPublicKey, isPublicQaOrTestRecord, NOINDEX_ROBOTS } from '../utils/listingPath';
import {
  buildCategoryPath,
  buildDealerPath,
  buildManufacturerCategoryPath,
  buildManufacturerModelCategoryPath,
  buildManufacturerModelPath,
  buildManufacturerPath,
  buildStateCategoryPath,
  getListingCategoryLabel,
  getListingManufacturer,
  getStateFromLocation,
  isDealerRole,
} from '../utils/seoRoutes';

const LISTING_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%2311161d'/%3E%3Crect x='100' y='100' width='1400' height='700' rx='24' fill='%231b222c' stroke='%23343c46' stroke-width='8'/%3E%3Cpath d='M390 610l170-180 140 120 170-210 340 270H390z' fill='%23a0a8b3' opacity='.7'/%3E%3Ccircle cx='585' cy='315' r='58' fill='%23e6b800' opacity='.9'/%3E%3Ctext x='800' y='760' fill='%23f5f7fa' font-family='Arial, Helvetica, sans-serif' font-size='56' font-weight='700' text-anchor='middle'%3ETwitterEquip Listing%3C/text%3E%3C/svg%3E";

export function ListingDetail() {
  const { id, publicKey } = useParams<{ id?: string; publicKey?: string; slug?: string }>();
  const location = useLocation();
  const { user, toggleFavorite, isAuthenticated } = useAuth();
  const { t, formatNumber, formatPrice } = useLocale();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerListingCount, setSellerListingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showAMVModal, setShowAMVModal] = useState(false);
  const [showPaymentCalcModal, setShowPaymentCalcModal] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [financingSent, setFinancingSent] = useState(false);
  const [shippingSent, setShippingSent] = useState(false);
  const [marketMatchRecommendations, setMarketMatchRecommendations] = useState<Listing[]>([]);
  const [amvExplanation, setAmvExplanation] = useState<string | null>(null);
  const [aiSpecs, setAiSpecs] = useState<any>(null);
  const [loadingAiData, setLoadingAiData] = useState(false);
  const [loadingMarketMatches, setLoadingMarketMatches] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMapFrameLoading, setIsMapFrameLoading] = useState(false);
  
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [financingForm, setFinancingForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    requestedAmount: '',
    message: ''
  });

  const [shippingForm, setShippingForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    pickupLocation: '',
    destination: '',
    timeline: '',
    trailerType: '',
    loadReady: 'Yes',
    reference: '',
    notes: ''
  });

  const getListingUrl = (targetListing?: Listing | null) => {
    if (typeof window !== 'undefined') return window.location.href;
    return targetListing ? `https://timberequip.com${buildListingPath(targetListing)}` : '';
  };

  const formatSpecValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (entry === null || entry === undefined) return '';
          if (typeof entry === 'object') return JSON.stringify(entry);
          return String(entry);
        })
        .filter(Boolean)
        .join(', ');
    }

    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }

    return String(value);
  };

  const createInitialInquiryForm = () => ({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const createInitialFinancingForm = () => ({
    name: '',
    email: '',
    phone: '',
    company: '',
    requestedAmount: '',
    message: ''
  });

  const createInitialShippingForm = (targetListing?: Listing | null) => ({
    name: '',
    company: '',
    email: user?.email || '',
    phone: '',
    pickupLocation: targetListing?.location || '',
    destination: '',
    timeline: '',
    trailerType: '',
    loadReady: 'Yes',
    reference: targetListing?.stockNumber?.trim() || getListingUrl(targetListing),
    notes: ''
  });

  const buildMapsHref = (query: string, latitude?: number, longitude?: number) => {
    const coordinates =
      latitude !== undefined && longitude !== undefined
        ? `${latitude},${longitude}`
        : '';
    const encoded = encodeURIComponent(query);
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        return coordinates ? `https://maps.apple.com/?ll=${coordinates}&q=${encoded}` : `https://maps.apple.com/?q=${encoded}`;
      }
      if (/android/.test(userAgent)) {
        return `geo:0,0?q=${encodeURIComponent(coordinates || query)}`;
      }
    }
    return coordinates
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`
      : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  };

  const buildMapEmbedUrl = (query: string, latitude?: number, longitude?: number) => {
    if (latitude !== undefined && longitude !== undefined) {
      const latPadding = 0.08;
      const lngPadding = 0.12;
      const left = longitude - lngPadding;
      const right = longitude + lngPadding;
      const top = latitude + latPadding;
      const bottom = latitude - latPadding;
      const bbox = `${left},${bottom},${right},${top}`;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
    }
    if (query) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=10&ie=UTF8&iwloc=&output=embed`;
    }
    return '';
  };

  const buildGoogleMapsLink = (query: string, latitude?: number, longitude?: number) => {
    if (latitude !== undefined && longitude !== undefined) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };

  const favoriteIds = Array.isArray(user?.favorites) ? user.favorites : [];
  const resolvedListingId = String(listing?.id || decodeListingPublicKey(publicKey || '') || id || '').trim();
  const isFavorite = resolvedListingId ? favoriteIds.includes(resolvedListingId) : false;

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      const requestedListingId = String(decodeListingPublicKey(publicKey || '') || id || '').trim();
      if (!requestedListingId) {
        if (isActive) {
          setLoading(false);
        }
        return;
      }
      if (isActive) {
        setLoading(true);
        setLoadError('');
        setMarketMatchRecommendations([]);
        setLoadingMarketMatches(false);
        setLoadingAiData(false);
      }
      try {
        const listingData = await equipmentService.getListing(requestedListingId);
        if (!listingData) {
          if (isActive) {
            setLoadError('This equipment record is temporarily unavailable. Please return to inventory and try again shortly.');
          }
          return;
        }

        if (!isActive) {
          return;
        }

        setListing({
          ...listingData,
          marketValueEstimate: listingData.marketValueEstimate ?? null,
        });
        setSeller(null);
        setAiSpecs(null);
        setAmvExplanation(null);
        setLoading(false);
        setLoadingAiData(true);
        setLoadingMarketMatches(true);

        const sellerPromise = equipmentService
          .getSeller(listingData.sellerUid || listingData.sellerId || '')
          .catch((error) => {
            console.error('Error fetching listing seller:', error);
            return undefined;
          });

        const computedAmv = await equipmentService
          .getMarketValue({
            listingId: listingData.id,
            category: listingData.category,
            manufacturer: listingData.make || listingData.manufacturer || listingData.brand,
            model: listingData.model,
            price: listingData.price,
            year: listingData.year,
            hours: listingData.hours,
          })
          .catch((error) => {
            console.error('Error fetching market value estimate:', error);
            return null;
          });

        if (isActive) {
          setListing((current) =>
            current && current.id === listingData.id
              ? {
                  ...current,
                  marketValueEstimate: computedAmv,
                }
              : current
          );
        }

        const explanationPromise =
          computedAmv !== null
            ? geminiService
                .explainAMV(listingData.title, listingData.price, computedAmv, listingData.specs)
                .catch((error) => {
                  console.error('Error explaining AMV:', error);
                  return null;
                })
            : Promise.resolve<string | null>(null);

        const [sellerData, specs, explanation, recommendations] = await Promise.all([
          sellerPromise,
          geminiService.getMachineSpecs(listingData.title, listingData.category).catch((error) => {
            console.error('Error fetching machine specs:', error);
            return null;
          }),
          explanationPromise,
          equipmentService
            .getMarketMatchRecommendations({
              listingId: listingData.id,
              category: listingData.category,
              manufacturer: listingData.make || listingData.manufacturer || listingData.brand,
              model: listingData.model,
              price: listingData.price,
              year: listingData.year,
              hours: listingData.hours,
            })
            .catch((error) => {
              console.error('Error fetching market match recommendations:', error);
              return [];
            }),
        ]);

        if (!isActive) {
          return;
        }

        if (sellerData) {
          setSeller(sellerData);
          equipmentService.getSellerListingUsage(sellerData.id || sellerData.uid || '').then((count) => {
            if (isActive) setSellerListingCount(count);
          }).catch(() => { /* non-critical */ });
        }
        setAiSpecs(specs);
        setAmvExplanation(explanation || null);
        setMarketMatchRecommendations(recommendations);
      } catch (error) {
        console.error('Error fetching listing detail:', error);
        if (isActive) {
          setLoadError(error instanceof Error ? error.message : 'This equipment record is temporarily unavailable right now.');
          setLoading(false);
        }
      } finally {
        if (isActive) {
          setLoadingAiData(false);
          setLoadingMarketMatches(false);
        }
      }
    };
    fetchData();
    return () => {
      isActive = false;
    };
  }, [id, publicKey]);

  useEffect(() => {
    if (!listing) return;

    setShippingForm((prev) => ({
      ...createInitialShippingForm(listing),
      ...prev,
      email: prev.email || user?.email || '',
      pickupLocation: prev.pickupLocation || listing.location || '',
      reference: prev.reference || listing.stockNumber?.trim() || getListingUrl(listing),
    }));
  }, [listing, user?.email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const hasDirtyInquiryForm = Boolean(
    inquiryForm.name.trim() || inquiryForm.email.trim() || inquiryForm.phone.trim() || inquiryForm.message.trim()
  );

  const hasDirtyFinancingForm = Boolean(
    financingForm.name.trim() ||
      financingForm.email.trim() ||
      financingForm.phone.trim() ||
      financingForm.company.trim() ||
      financingForm.requestedAmount.trim() ||
      financingForm.message.trim()
  );

  const shippingDefaults = createInitialShippingForm(listing);
  const hasDirtyShippingForm = Boolean(
    shippingForm.name.trim() ||
      shippingForm.company.trim() ||
      shippingForm.phone.trim() ||
      shippingForm.destination.trim() ||
      shippingForm.timeline.trim() ||
      shippingForm.trailerType.trim() ||
      shippingForm.notes.trim() ||
      shippingForm.loadReady !== shippingDefaults.loadReady ||
      shippingForm.email.trim() !== shippingDefaults.email.trim() ||
      shippingForm.pickupLocation.trim() !== shippingDefaults.pickupLocation.trim()
  );

  const confirmDiscardChanges = () => window.confirm('Are you sure you want to discard changes?');
  const machineLatitude = toFiniteNumber(listing?.latitude);
  const machineLongitude = toFiniteNumber(listing?.longitude);
  const machineMapQuery = [listing?.location || '', seller?.storefrontName || seller?.name || '', seller?.location || '']
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');
  const hasMachineCoordinates = machineLatitude !== undefined && machineLongitude !== undefined;
  const hasMachineMapLink = Boolean(machineMapQuery || hasMachineCoordinates);
  const hasMachineMap = hasMachineCoordinates || Boolean(machineMapQuery);
  const machineMapsHref = hasMachineMapLink
    ? buildMapsHref(machineMapQuery || listing?.location || '', machineLatitude, machineLongitude)
    : '';
  const googleMapsHref = hasMachineMapLink
    ? buildGoogleMapsLink(machineMapQuery || listing?.location || '', machineLatitude, machineLongitude)
    : '';

  useEffect(() => {
    setIsMapFrameLoading(hasMachineMap);
  }, [hasMachineMap, machineMapQuery, machineLatitude, machineLongitude]);

  const runRecaptchaCheck = async (action: string) => {
    const token = await getRecaptchaToken(action);
    if (!token) return true;
    const pass = await assessRecaptcha(token, action);
    if (!pass) {
      window.alert('Security check failed. Please try again.');
      return false;
    }
    return true;
  };

  const dismissInquiryModal = () => {
    if (hasDirtyInquiryForm && !inquirySent && !confirmDiscardChanges()) return;
    setShowInquiryModal(false);
    setInquiryForm(createInitialInquiryForm());
  };

  const dismissFinancingModal = () => {
    if (hasDirtyFinancingForm && !financingSent && !confirmDiscardChanges()) return;
    setShowFinancingModal(false);
    setFinancingForm(createInitialFinancingForm());
  };

  const dismissShippingModal = () => {
    if (hasDirtyShippingForm && !shippingSent && !confirmDiscardChanges()) return;
    setShowShippingModal(false);
    setShippingForm(createInitialShippingForm(listing));
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (resolvedListingId) {
      await toggleFavorite(resolvedListingId);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    
    try {
      if (!(await runRecaptchaCheck('DETAIL_INQUIRY'))) return;
      const sellerUid = listing.sellerUid || listing.sellerId || seller?.id || '';
      await equipmentService.createInquiry({
        listingId: listing.id,
        sellerUid,
        sellerId: sellerUid,
        buyerName: inquiryForm.name,
        buyerEmail: inquiryForm.email,
        buyerPhone: inquiryForm.phone,
        message: inquiryForm.message,
        type: 'Inquiry'
      });
      setInquirySent(true);
      setTimeout(() => {
        setShowInquiryModal(false);
        setInquirySent(false);
        setInquiryForm(createInitialInquiryForm());
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
    }
  };

  const handleFinancingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    try {
      if (!(await runRecaptchaCheck('DETAIL_FINANCING'))) return;
      const sellerUid = listing.sellerUid || listing.sellerId || seller?.id || '';
      await equipmentService.createInquiry({
        listingId: listing.id,
        sellerUid,
        sellerId: sellerUid,
        buyerName: financingForm.name,
        buyerEmail: financingForm.email,
        buyerPhone: financingForm.phone,
        message: financingForm.message || `Financing request for ${listing.title}. Requested amount: ${financingForm.requestedAmount || 'Not provided'}`,
        type: 'Financing'
      });

      await equipmentService.submitFinancingRequest({
        listingId: listing.id,
        sellerUid,
        applicantName: financingForm.name,
        applicantEmail: financingForm.email,
        applicantPhone: financingForm.phone,
        company: financingForm.company,
        requestedAmount: financingForm.requestedAmount ? Number(financingForm.requestedAmount) : undefined,
        message: financingForm.message
      });

      setFinancingSent(true);
      setTimeout(() => {
        setShowFinancingModal(false);
        setFinancingSent(false);
        setFinancingForm(createInitialFinancingForm());
      }, 2000);
    } catch (error) {
      console.error('Error submitting financing request:', error);
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    try {
      if (!(await runRecaptchaCheck('DETAIL_LOGISTICS'))) return;
      const sellerUid = listing.sellerUid || listing.sellerId || seller?.id || '';
      const listingUrl = getListingUrl(listing);
      const reference = shippingForm.reference.trim() || listing.stockNumber?.trim() || listingUrl;
      const logisticsSummary = [
        'Logistics Trucking Request',
        `Equipment: ${listing.title}`,
        `Reference: ${reference}`,
        `Listing URL: ${listingUrl}`,
        `Pickup Location: ${shippingForm.pickupLocation || listing.location || 'Not provided'}`,
        `Destination: ${shippingForm.destination}`,
        shippingForm.timeline ? `Preferred Timing: ${shippingForm.timeline}` : '',
        shippingForm.trailerType ? `Trailer / Service Type: ${shippingForm.trailerType}` : '',
        `Load Ready: ${shippingForm.loadReady}`,
        shippingForm.company ? `Company: ${shippingForm.company}` : '',
        shippingForm.notes ? `Notes: ${shippingForm.notes}` : '',
      ].filter(Boolean).join('\n');

      await equipmentService.createInquiry({
        listingId: listing.id,
        sellerUid,
        sellerId: sellerUid,
        buyerName: shippingForm.name,
        buyerEmail: shippingForm.email,
        buyerPhone: shippingForm.phone,
        message: logisticsSummary,
        type: 'Shipping'
      });

      setShippingSent(true);
      setTimeout(() => {
        setShowShippingModal(false);
        setShippingSent(false);
        setShippingForm(createInitialShippingForm(listing));
      }, 2000);
    } catch (error) {
      console.error('Error submitting shipping request:', error);
    }
  };

  const handleCallSeller = async () => {
    if (!listing) return;

    const rawSellerPhone = String(seller?.phone || '').trim();
    const dialablePhone = rawSellerPhone.replace(/[^\d+]/g, '');

    if (!dialablePhone) {
      window.alert('Seller phone number is not available on this listing yet.');
      return;
    }

    const callerName = (user?.displayName || user?.email || 'Guest User').trim();
    const callerPhone = String(user?.phoneNumber || '').trim();

    try {
      await equipmentService.createCallLog({
        listingId: listing.id,
        listingTitle: listing.title,
        sellerId: listing.sellerUid || listing.sellerId || seller?.id || '',
        sellerUid: listing.sellerUid || listing.sellerId || seller?.id || '',
        sellerName: seller?.name || 'Unknown Seller',
        sellerPhone: rawSellerPhone,
        callerUid: user?.uid || null,
        callerName,
        callerEmail: user?.email || '',
        callerPhone,
        duration: 0,
        status: 'Initiated',
        source: 'listing_detail',
        isAuthenticated,
      });
    } catch (error) {
      console.error('Failed to log call event:', error);
    }

    window.location.href = `tel:${dialablePhone}`;
  };

  useEffect(() => {
    const detailImages =
      listing?.imageVariants?.length
        ? listing.imageVariants.map((variant) => variant.detailUrl)
        : Array.isArray(listing?.images)
          ? listing.images.filter(Boolean)
          : [];
    const galleryLength = detailImages.length ? detailImages.length : 1;
    if (activeImage < galleryLength) return;
    setActiveImage(0);
  }, [activeImage, listing]);

  const submitFinanceRequestFromCalculator = async (payload: {
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
  }) => {
    if (!listing) return;
    if (!(await runRecaptchaCheck('PAYMENT_CALCULATOR_FINANCING'))) return;
    const sellerUid = listing.sellerUid || listing.sellerId || seller?.id || '';
    const summary = `Payment calculator financing request for ${listing.title || `${safeYear} ${safeMake} ${safeModel}`.trim()}.`;
    const terms = `Requested amount: ${formatPrice(payload.requestedAmount, listing.currency || 'USD', 0)}, term: ${payload.termMonths} months, interest: ${payload.interestRatePct.toFixed(2)}%, down payment: ${payload.downPaymentPct}%, est monthly: ${formatPrice(payload.monthlyPaymentEstimate, listing.currency || 'USD', 0)}.`;
    const combinedMessage = [summary, terms, payload.message || ''].filter(Boolean).join(' ');

    await equipmentService.createInquiry({
      listingId: listing.id,
      sellerUid,
      sellerId: sellerUid,
      buyerName: payload.buyerName,
      buyerEmail: payload.buyerEmail,
      buyerPhone: payload.buyerPhone,
      message: combinedMessage,
      type: 'Financing',
    });

    await equipmentService.submitFinancingRequest({
      listingId: listing.id,
      sellerUid,
      applicantName: payload.buyerName,
      applicantEmail: payload.buyerEmail,
      applicantPhone: payload.buyerPhone,
      company: payload.company,
      requestedAmount: payload.requestedAmount,
      message: combinedMessage,
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{t('listingDetail.notFound', 'Equipment Not Found')}</h2>
      {loadError ? <p className="text-muted mb-6 max-w-xl text-center">{loadError}</p> : null}
      <Link to="/search" className="btn-industrial btn-accent">{t('listingDetail.returnToInventory', 'Return to Inventory')}</Link>
    </div>
  );

  const safeCategory = formatSpecValue(listing.category) || 'Equipment';
  const safeYear = toFiniteNumber(listing.year) ?? new Date().getFullYear();
  const safeMake = formatSpecValue(listing.make || listing.manufacturer) || 'Unknown Make';
  const safeModel = formatSpecValue(listing.model) || 'Unknown Model';
  const safeLocation = formatSpecValue(listing.location) || 'Location Pending';
  const safeLocationParts = safeLocation
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const safeCityState = [
    safeLocationParts[0] || '',
    safeLocationParts.length > 1 ? safeLocationParts[1] : ''
  ]
    .filter(Boolean)
    .join(', ') || safeLocation;
  const safeCondition = formatSpecValue(listing.condition) || 'Unspecified';
  const safeDescription = formatSpecValue(listing.description) || 'No description provided.';
  const safeHours = toFiniteNumber(listing.hours) ?? 0;
  const safePrice = toFiniteNumber(listing.price) ?? 0;
  const safeMarketValueEstimate = toFiniteNumber(listing.marketValueEstimate);
  const safeSellerName = formatSpecValue(seller?.name) || 'Unknown Seller';
  const safeSellerLocation = formatSpecValue(seller?.location) || 'Location Not Available';
  const safeSellerType = formatSpecValue(seller?.type) || 'Seller';
  const safeSellerLogo = typeof seller?.logo === 'string' ? seller.logo : '';
  const safeSellerId = formatSpecValue(seller?.id) || '';
  const safeSellerTotalListings = toFiniteNumber(seller?.totalListings) ?? 0;

  const hasAmv = typeof safeMarketValueEstimate === 'number' && safeMarketValueEstimate > 0;
  const amvDiff = hasAmv ? safePrice - safeMarketValueEstimate : 0;
  const isBelowAmv = hasAmv ? amvDiff < 0 : false;
  const detailImages =
    listing.imageVariants?.length
      ? listing.imageVariants.map((variant) => variant.detailUrl)
      : Array.isArray(listing.images)
        ? listing.images.filter(Boolean)
        : [];
  const galleryImages = detailImages.length ? detailImages : [LISTING_IMAGE_PLACEHOLDER];
  const hasGallery = detailImages.length > 0;
  const listingSpecs = listing.specs && typeof listing.specs === 'object' ? listing.specs : {};
  const listingPath = buildListingPath(listing);
  const safeStockId = String(listing.id || 'pending').slice(0, 8).toUpperCase();
  const sellerMemberSinceYear = seller?.memberSince ? new Date(seller.memberSince).getFullYear() : null;
  const hasSellerMemberSinceYear = Number.isFinite(sellerMemberSinceYear);
  const routeCategory = getListingCategoryLabel(listing) || safeCategory;
  const routeManufacturer = getListingManufacturer(listing) || safeMake;
  const routeModel = formatSpecValue(listing.model).trim();
  const routeState = getStateFromLocation(listing.location) || safeLocationParts[safeLocationParts.length - 2] || safeLocation;
  const dealerPath = seller?.id && (seller.storefrontSlug || isDealerRole(seller.role))
    ? buildDealerPath({ id: seller.id, storefrontSlug: seller.storefrontSlug || seller.id })
    : '';
  const detailSeoHeadline = `${safeYear || ''} ${safeMake || ''} ${safeModel || ''}`.replace(/\s+/g, ' ').trim() || listing.title || 'Equipment Detail';
  const detailSeoTitle = safeCityState
    ? `${detailSeoHeadline} for Sale in ${safeCityState} | Forestry Equipment Sales`
    : `${detailSeoHeadline} for Sale | Forestry Equipment Sales`;
  const detailSeoDescription = [
    `Used ${detailSeoHeadline} ${routeCategory ? `${routeCategory.toLowerCase()} ` : ''}for sale${safeCityState ? ` in ${safeCityState}` : ''}`.replace(/\s+/g, ' ').trim(),
    safeHours > 0 ? `with ${formatNumber(safeHours)} hours.` : 'View photos, specs, and pricing details.',
    'Request pricing, financing, inspection, and logistics support from Forestry Equipment Sales.',
  ].join(' ');
  const isLiveApprovedListing =
    String(listing.approvalStatus || '').toLowerCase() === 'approved' &&
    String(listing.paymentStatus || '').toLowerCase() === 'paid' &&
    !['sold', 'expired', 'archived', 'pending'].includes(String(listing.status || 'active').toLowerCase());
  const isQaOrTestListing = isPublicQaOrTestRecord(
    listing.id,
    listing.title,
    listing.stockNumber,
    routeManufacturer,
    routeModel,
    seller?.storefrontName,
    seller?.storefrontSlug,
    seller?.name,
  );
  const detailRobots = !isLiveApprovedListing || isQaOrTestListing ? NOINDEX_ROBOTS : undefined;
  const normalizedCurrentPath = location.pathname.replace(/\/+$/, '') || '/';
  const normalizedCanonicalPath = listingPath.replace(/\/+$/, '') || '/';
  const routeLinks = [
    routeCategory ? { label: routeCategory, path: buildCategoryPath(routeCategory) } : null,
    routeManufacturer ? { label: routeManufacturer, path: buildManufacturerCategoryPath(routeManufacturer, routeCategory || '') } : null,
    routeManufacturer && routeModel ? { label: routeModel, path: buildManufacturerModelPath(routeManufacturer, routeModel) } : null,
    routeState ? { label: `${routeState}`, path: buildStateCategoryPath(routeState, routeCategory || '') } : null,
    dealerPath ? { label: seller?.storefrontName || safeSellerName, path: dealerPath } : null,
  ].filter((entry): entry is { label: string; path: string } => Boolean(entry) && entry.path);
  const uniqueRouteLinks = Array.from(new Map(routeLinks.map((entry) => [entry.path, entry])).values()).slice(0, 5);
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://timberequip.com/',
    },
    routeCategory
      ? {
          '@type': 'ListItem',
          position: 2,
          name: `${routeCategory} For Sale`,
          item: `https://timberequip.com${buildCategoryPath(routeCategory)}`,
        }
      : null,
    routeManufacturer
      ? {
          '@type': 'ListItem',
          position: routeCategory ? 3 : 2,
          name: routeManufacturer,
          item: `https://timberequip.com${buildManufacturerPath(routeManufacturer)}`,
        }
      : null,
    routeManufacturer && routeModel
      ? {
          '@type': 'ListItem',
          position: routeCategory ? 4 : 3,
          name: `${routeManufacturer} ${routeModel}`,
          item: `https://timberequip.com${buildManufacturerModelPath(routeManufacturer, routeModel)}`,
        }
      : null,
    {
      '@type': 'ListItem',
      position: routeManufacturer && routeModel ? (routeCategory ? 5 : 4) : routeManufacturer ? (routeCategory ? 4 : 3) : routeCategory ? 3 : 2,
      name: detailSeoHeadline,
      item: `https://timberequip.com${listingPath}`,
    },
  ].filter(Boolean);
  const detailJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
      {
        '@type': 'Product',
        name: detailSeoHeadline,
        description: safeDescription,
        category: routeCategory,
        model: routeModel || undefined,
        sku: listing.stockNumber || listing.id,
        mpn: listing.serialNumber || undefined,
        image: galleryImages.slice(0, 10),
        url: `https://timberequip.com${listingPath}`,
        brand: {
          '@type': 'Brand',
          name: routeManufacturer,
        },
        itemCondition:
          safeCondition.toLowerCase() === 'new'
            ? 'https://schema.org/NewCondition'
            : safeCondition.toLowerCase() === 'rebuilt'
              ? 'https://schema.org/RefurbishedCondition'
              : 'https://schema.org/UsedCondition',
        additionalProperty: Object.entries(listingSpecs)
          .map(([name, value]) => ({ name, value: formatSpecValue(value) }))
          .filter((entry) => entry.value)
          .slice(0, 15)
          .map((entry) => ({
            '@type': 'PropertyValue',
            name: entry.name,
            value: entry.value,
          })),
        offers: {
          '@type': 'Offer',
          url: `https://timberequip.com${listingPath}`,
          priceCurrency: listing.currency || 'USD',
          availability: String(listing.status || 'active').toLowerCase() === 'sold'
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
          ...(safePrice > 0 ? { price: safePrice } : {}),
          areaServed: routeState || undefined,
          seller: {
            '@type': 'Organization',
            name: seller?.storefrontName || safeSellerName,
            url: dealerPath ? `https://timberequip.com${dealerPath}` : undefined,
          },
        },
      },
    ],
  };

  const showPrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setActiveImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const openFullscreenImage = () => setShowFullscreenImage(true);
  const closeFullscreenImage = () => setShowFullscreenImage(false);

  if (normalizedCurrentPath !== normalizedCanonicalPath) {
    return <Navigate replace to={`${listingPath}${location.search || ''}${location.hash || ''}`} />;
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Seo
        title={detailSeoTitle}
        description={detailSeoDescription}
        canonicalPath={listingPath}
        robots={detailRobots}
        jsonLd={detailJsonLd}
        ogType="product"
        imagePath={galleryImages[0]}
      />
      {/* Breadcrumbs & Actions */}
      <div className="bg-surface border-b border-line py-4 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Link to="/search" className="flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-ink">
            <ArrowLeft size={14} className="mr-2" />
            {t('listingDetail.backToInventory', 'Back to Inventory')}
          </Link>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: `${safeYear} ${safeMake} ${safeModel}`, url }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(url).then(() => {
                    window.alert('Link copied to clipboard');
                  }).catch(() => {});
                }
              }}
              className="p-2 text-muted hover:text-ink"
            ><Share2 size={18} /></button>
            <button 
              onClick={handleToggleFavorite}
              className={`p-2 transition-colors ${isFavorite ? 'text-accent' : 'text-muted hover:text-ink'}`}
            >
              <Bookmark size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 flex flex-col space-y-12">
            {/* Equipment Title */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-sm">
                  {safeCategory}
                </span>
                <span className="text-xs font-bold text-muted uppercase tracking-widest">
                  {t('listingDetail.stockId', 'Stock ID')}: {safeStockId}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                {safeYear} {safeMake} {safeModel}
              </h1>
              <div className="flex items-center space-x-4 text-muted">
                  <div className="flex items-center space-x-1.5">
                    <MapPin size={14} className="text-accent" />
                    {isMobileViewport ? (
                      machineMapsHref ? (
                        <a href={machineMapsHref} className="text-xs font-bold uppercase tracking-widest hover:text-accent" aria-label={`Open ${safeCityState} in maps`}>
                          {safeCityState}
                        </a>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest">{safeCityState}</span>
                      )
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-widest">{safeCityState}</span>
                    )}
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock size={14} className="text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest">{formatNumber(safeHours)} {t('listingDetail.hours', 'Hours')}</span>
                </div>
              </div>
              {uniqueRouteLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {uniqueRouteLinks.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      className="border border-line bg-surface px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      {route.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery */}
            <div className="flex flex-col space-y-4">
              <div className="aspect-[16/9] bg-surface border border-line overflow-hidden relative group">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    src={galleryImages[activeImage]} 
                    alt={listing.title}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={hasGallery ? openFullscreenImage : undefined}
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                <WatermarkOverlay index={activeImage} />

                {/* Navigation Arrows */}
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={showPrevImage}
                    className="p-2 bg-ink/50 text-white rounded-full hover:bg-ink transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={showNextImage}
                    className="p-2 bg-ink/50 text-white rounded-full hover:bg-ink transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                <div className="absolute bottom-4 right-4 bg-ink/80 backdrop-blur-md text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">
                  {activeImage + 1} / {galleryImages.length}
                </div>

                {hasGallery && (
                  <button
                    onClick={openFullscreenImage}
                    className="absolute bottom-4 left-4 bg-ink/80 backdrop-blur-md text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-ink transition-colors"
                  >
                    {t('listingDetail.fullscreen', 'Fullscreen')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {galleryImages.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square border-2 transition-all overflow-hidden ${activeImage === i ? 'border-accent' : 'border-line hover:border-muted'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            </div>

            {/* Core Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-line border border-line">
              {[
                { label: t('listingDetail.year', 'Year'), value: safeYear, icon: Clock },
                { label: t('listingDetail.hours', 'Hours'), value: formatNumber(safeHours), icon: Activity },
                { label: t('listingDetail.condition', 'Condition'), value: safeCondition, icon: ShieldCheck },
                { label: t('listingDetail.location', 'Location'), value: safeLocation, icon: MapPin },
                { label: t('listingDetail.make', 'Make'), value: safeMake, icon: Info },
                { label: t('listingDetail.model', 'Model'), value: safeModel, icon: Info }
              ].map((spec, i) => (
                <div key={i} className="bg-bg p-6 flex flex-col">
                  <div className="flex items-center space-x-2 mb-2">
                    <spec.icon className="text-accent" size={14} />
                    <span className="label-micro">{spec.label}</span>
                  </div>
                  <span className="text-xl font-black tracking-tighter uppercase">{spec.value}</span>
                </div>
              ))}
            </div>

            {/* Market Intelligence */}
            {hasAmv && (
              <div className="bg-surface border border-line p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent/10 text-accent rounded-sm">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">Market Intelligence</h3>
                  </div>
                  <button 
                    onClick={() => setShowAMVModal(true)}
                    className="text-[10px] font-bold text-muted uppercase hover:underline flex items-center"
                  >
                    {t('listingDetail.howWeCalculateAmv', 'How we calculate AMV')} <Info size={12} className="ml-1.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col space-y-6">
                    <div className="flex justify-between items-end">
                      <span className="label-micro">{t('listingDetail.listingPrice', 'Listing Price')}</span>
                      <span className="text-2xl font-black tracking-tighter">{formatPrice(safePrice, listing.currency || 'USD', 0)}</span>
                    </div>
                    <div className="flex justify-between items-end text-muted">
                      <span className="label-micro">{t('listingDetail.averageMarketValue', 'Average Market Value')}</span>
                      <span className="text-xl font-black tracking-tighter">
                        {formatPrice(safeMarketValueEstimate as number, listing.currency || 'USD', 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-line rounded-full overflow-hidden relative">
                      <div
                        className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${isBelowAmv ? 'bg-data' : 'bg-accent'}`}
                        style={{ width: `${(safePrice / ((safeMarketValueEstimate as number) * 1.5)) * 100}%` }}
                      ></div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-ink z-10"
                        style={{ left: `${((safeMarketValueEstimate as number) / ((safeMarketValueEstimate as number) * 1.5)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className={isBelowAmv ? 'text-data' : 'text-muted'}>{t('listingDetail.competitive', 'Competitive')}</span>
                      <span className={!isBelowAmv ? 'text-accent' : 'text-muted'}>{t('listingDetail.premium', 'Premium')}</span>
                    </div>
                  </div>

                  <div className="bg-bg border border-line p-6 flex flex-col justify-center">
                    <div className={`flex items-center space-x-3 mb-4 ${isBelowAmv ? 'text-data' : 'text-accent'}`}>
                      <CheckCircle2 size={24} />
                      <span className="text-sm font-black uppercase tracking-tighter">
                        {isBelowAmv ? t('listingDetail.highlyCompetitiveEquipment', 'Highly Competitive Equipment') : t('listingDetail.premiumMarketEquipment', 'Premium Market Equipment')}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {`This equipment is currently priced ${Math.abs(((safePrice - (safeMarketValueEstimate as number)) / (safeMarketValueEstimate as number)) * 100).toFixed(1)}% ${isBelowAmv ? 'below' : 'above'} the AMV index for this configuration.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Market Match Recommendations */}
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Market Match Recommendations</h3>
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-muted">
                    Live listings matching {getAmvMatchRulesSummary().toLowerCase()}
                  </p>
                </div>
                {!loadingMarketMatches && marketMatchRecommendations.length > 0 ? (
                  <span className="label-micro">{formatNumber(marketMatchRecommendations.length)} live matches</span>
                ) : null}
              </div>

              {loadingMarketMatches ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="overflow-hidden border border-line bg-surface">
                      <div className="aspect-[4/3] animate-pulse bg-line" />
                      <div className="space-y-3 p-5">
                        <div className="h-3 w-24 animate-pulse bg-line" />
                        <div className="h-6 w-3/4 animate-pulse bg-line" />
                        <div className="h-4 w-1/2 animate-pulse bg-line" />
                        <div className="h-10 w-full animate-pulse bg-line" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : marketMatchRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {marketMatchRecommendations.map((match, matchIdx) => {
                    const matchImage =
                      match.imageVariants?.[0]?.thumbnailUrl ||
                      match.images?.find(Boolean) ||
                      LISTING_IMAGE_PLACEHOLDER;
                    const matchPath = buildListingPath(match);
                    const yearDelta = Math.abs((match.year || 0) - safeYear);
                    const hoursDeltaPercent = safeHours > 0
                      ? Math.abs((((match.hours || 0) - safeHours) / safeHours) * 100)
                      : 0;
                    const priceDeltaPercent = safePrice > 0
                      ? Math.abs((((match.price || 0) - safePrice) / safePrice) * 100)
                      : 0;

                    return (
                      <Link
                        key={match.id}
                        to={matchPath}
                        className="group overflow-hidden border border-line bg-surface transition-transform duration-200 hover:-translate-y-1"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-bg relative">
                          <img
                            src={matchImage}
                            alt={match.title || `${match.year} ${match.make || match.manufacturer || ''} ${match.model}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                          />
                          <WatermarkOverlay index={matchIdx} />
                        </div>
                        <div className="space-y-4 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="label-micro">{match.make || match.manufacturer || match.brand || 'Market Match'}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                              {priceDeltaPercent.toFixed(1)}% price
                            </span>
                          </div>
                          <div>
                            <h4 className="text-base font-black uppercase tracking-tight transition-colors group-hover:text-accent">
                              {match.year || 'Unknown Year'} {match.make || match.manufacturer || match.brand || 'Unknown Make'} {match.model || 'Unknown Model'}
                            </h4>
                            <p className="mt-2 text-sm font-medium text-muted">{match.location || 'Location pending'}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-3 border border-line bg-bg p-3 text-center">
                            <div>
                              <p className="label-micro">Price</p>
                              <p className="mt-2 text-sm font-black tracking-tight">{formatPrice(match.price || 0, match.currency || 'USD', 0)}</p>
                            </div>
                            <div>
                              <p className="label-micro">Year Delta</p>
                              <p className="mt-2 text-sm font-black tracking-tight">{yearDelta} yr</p>
                            </div>
                            <div>
                              <p className="label-micro">Hours Delta</p>
                              <p className="mt-2 text-sm font-black tracking-tight">{hoursDeltaPercent.toFixed(1)}%</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                            <span>{formatNumber(match.hours || 0)} hrs</span>
                            <span className="flex items-center gap-1 text-accent">
                              View listing <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-line bg-surface p-6 text-sm font-medium leading-relaxed text-muted">
                  No live listings currently meet the market-match thresholds for this machine. We only recommend listings that match
                  {' '}same manufacturer and model, stay within {AMV_MATCH_YEAR_RANGE} years, and stay within {AMV_MATCH_PRICE_PERCENT}% of price and {AMV_MATCH_HOURS_PERCENT}% of hours.
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter border-b border-line pb-4">{t('listingDetail.equipmentOverview', 'Equipment Overview')}</h3>
              <p className="text-muted font-medium leading-loose whitespace-pre-line">
                {safeDescription}
              </p>
            </div>

            {/* Technical Specifications */}
            <div className="flex flex-col space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter border-b border-line pb-4">{t('listingDetail.technicalSpecifications', 'Technical Specifications')}</h3>
              
              {loadingAiData ? (
                <div className="flex items-center space-x-4 py-8">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">{t('listingDetail.retrievingTechnicalData', 'Retrieving Technical Data...')}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  {/* AI Specs */}
                  {aiSpecs && Object.entries(aiSpecs).map(([key, value], i) => {
                    if (!value || key === 'additionalSpecs') return null;
                    return (
                      <div key={`ai-${i}`} className="data-row">
                        <span className="label-micro">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="value-mono uppercase">{String(value)}</span>
                      </div>
                    );
                  })}
                  
                  {/* Original Specs */}
                  {Object.entries(listingSpecs).map(([key, value], i) => (
                    <div key={i} className="data-row">
                      <span className="label-micro">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="value-mono uppercase">
                        {formatSpecValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              {/* Pricing Card */}
              <div className="bg-[#1C1917] text-white p-8 rounded-sm shadow-2xl">
                <div className="flex flex-col mb-8">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-2">Listed Price</span>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-black tracking-tighter">{formatPrice(safePrice, listing.currency || 'USD', 0)}</span>
                    <span className="text-white/40 text-xs font-bold uppercase">{t('listingDetail.exclVat', 'Excl. VAT')}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 mb-8">
                  <button
                    onClick={() => setShowInquiryModal(true)}
                    className="btn-industrial btn-accent w-full py-5 text-base"
                  >
                    {t('listingDetail.sendInquiry', 'Send Inquiry')}
                  </button>
                  <button
                    onClick={handleCallSeller}
                    className="btn-industrial w-full py-5 text-base bg-white/10 border-white/20 hover:bg-white hover:text-[#1C1917]"
                  >
                    <Phone size={18} className="mr-3" />
                    {t('listingDetail.callSeller', 'Call Seller')}
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowPaymentCalcModal(true)}
                    className="flex items-center text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    <Calculator size={14} className="mr-2" />
                    {t('listingDetail.calcPayment', 'Calc Payment')}
                  </button>
                  <button
                    onClick={() => setShowFinancingModal(true)}
                    className="flex items-center text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    <Landmark size={14} className="mr-2" />
                    {t('listingDetail.financing', 'Financing')}
                  </button>
                  <button
                    onClick={() => setShowShippingModal(true)}
                    className="flex items-center text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    <Truck size={14} className="mr-2" />
                    {t('listingDetail.logistics', 'Logistics')}
                  </button>
                </div>
              </div>

              {/* Seller Card */}
              {seller && (
              <div className="bg-surface border border-line p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex flex-col">
                    <span className="label-micro mb-2">
                      {listing.sellerVerified ? t('listingDetail.verifiedSeller', 'Verified Seller') : t('listingDetail.sellerVerificationPending', 'Seller (Verification Pending)')}
                    </span>
                    <h4 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{safeSellerName}</h4>
                    <a 
                      href={`https://maps.apple.com/?q=${encodeURIComponent(safeSellerLocation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-[10px] font-bold text-muted uppercase hover:text-accent transition-colors"
                    >
                      <MapPin size={10} className="mr-1" />
                      {safeSellerLocation}
                    </a>
                  </div>
                  <div className="w-16 h-16 bg-bg border border-line p-2 flex items-center justify-center">
                    {safeSellerLogo ? (
                      <img src={safeSellerLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted text-center">Seller</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="bg-bg border border-line p-4 flex flex-col items-center text-center">
                    <span className="text-lg font-black tracking-tighter">{sellerListingCount ?? safeSellerTotalListings}</span>
                    <span className="label-micro">{(sellerListingCount ?? safeSellerTotalListings) === 1 ? 'Machine' : 'Machines'}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className={`flex items-center space-x-3 text-xs font-bold ${listing.sellerVerified ? 'text-data' : 'text-muted'}`}>
                    <ShieldCheck size={16} />
                    <span className="uppercase tracking-widest">
                      {listing.sellerVerified ? t('listingDetail.verifiedSeller', 'Verified Seller') : t('listingDetail.verificationPending', 'Verification Pending')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-bold text-muted">
                    <Clock size={16} />
                    <span className="uppercase tracking-widest">
                      {safeSellerType}
                      {hasSellerMemberSinceYear ? ` • Member Since ${sellerMemberSinceYear}` : ''}
                    </span>
                  </div>
                </div>

                <Link to={dealerPath || `/seller/${safeSellerId}`} className="btn-industrial w-full mt-8 py-3">
                  {t('listingDetail.viewFullProfile', 'View Full Profile')}
                </Link>
              </div>
              )}

              {/* Security Notice */}
              <div className="bg-bg border border-line p-6 flex items-start space-x-4">
                <AlertCircle className="text-accent flex-shrink-0" size={20} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1">{t('listingDetail.transactionPolicy', 'Transaction Policy')}</span>
                  <p className="text-[10px] font-medium text-muted leading-relaxed">
                    {t('listingDetail.transactionPolicyCopy', 'Always use the Forestry Equipment Sales platform for inquiries. Never send funds directly to sellers without a verified escrow system.')}
                  </p>
                </div>
              </div>

              <div className="bg-surface border border-line overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-6 py-4 gap-4">
                  <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent block mb-1">Map Preview</span>
                      <h4 className="text-sm font-black uppercase tracking-tight">Machine Location</h4>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted">{seller?.storefrontName || seller?.name || 'Seller'} • {safeCityState}</p>
                    </div>
                    {googleMapsHref ? (
                      <a href={googleMapsHref} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">
                        Open Full Map
                      </a>
                    ) : null}
                  </div>
                  {hasMachineMap ? (
                  <div className="relative h-64 bg-bg">
                    {isMapFrameLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-bg text-[10px] font-bold uppercase tracking-widest text-muted z-10">
                        Loading map...
                      </div>
                    ) : null}
                    <iframe
                      title={`Map for ${machineMapQuery || safeCityState}`}
                      src={buildMapEmbedUrl(machineMapQuery || listing?.location || '', machineLatitude, machineLongitude)}
                      className="h-64 w-full border-0"
                      loading="lazy"
                      onLoad={() => setIsMapFrameLoading(false)}
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center bg-bg px-6 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">Map preview unavailable for this location.</p>
                      {googleMapsHref ? (
                        <a href={googleMapsHref} target="_blank" rel="noopener noreferrer" className="btn-industrial px-4 py-2 text-[10px]">
                          Open in Google Maps
                        </a>
                      ) : null}
                    </div>
                  )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {showFullscreenImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={closeFullscreenImage}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
            />

            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="relative z-10 w-full h-full max-w-[95vw] max-h-[95vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeFullscreenImage}
                className="absolute top-3 right-3 z-20 p-2 rounded-sm bg-black/65 text-white hover:bg-black transition-colors"
                aria-label="Close fullscreen image"
              >
                <X size={22} />
              </button>

              <TransformWrapper
                key={activeImage}
                initialScale={1}
                minScale={1}
                maxScale={5}
                wheel={{ step: 0.2 }}
                pinch={{ step: 4 }}
                doubleClick={{ disabled: true }}
                centerOnInit
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      <button onClick={() => zoomOut()} className="px-3 py-2 bg-black/65 text-white text-xs font-black rounded-sm hover:bg-black transition-colors">-</button>
                      <button onClick={() => zoomIn()} className="px-3 py-2 bg-black/65 text-white text-xs font-black rounded-sm hover:bg-black transition-colors">+</button>
                      <button onClick={() => resetTransform()} className="px-3 py-2 bg-black/65 text-white text-xs font-black rounded-sm hover:bg-black transition-colors">Reset</button>
                    </div>

                    <TransformComponent wrapperClass="w-full h-full !overflow-visible" contentClass="w-full h-full flex items-center justify-center !overflow-visible px-4 py-10">
                      <div className="relative inline-block">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={galleryImages[activeImage]}
                            src={galleryImages[activeImage]}
                            alt={listing.title}
                            className="max-w-[94vw] max-h-[84vh] w-auto h-auto object-contain select-none"
                            referrerPolicy="no-referrer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                          />
                        </AnimatePresence>
                        <WatermarkOverlay index={activeImage} />
                      </div>
                    </TransformComponent>

                    <button
                      onClick={showPrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-sm bg-black/65 text-white hover:bg-black transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-sm bg-black/65 text-white hover:bg-black transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </TransformWrapper>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {showInquiryModal && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissInquiryModal}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden"
            >
              <div className="bg-ink text-white p-8 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inquiry Form</span>
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Contact Seller</h3>
                </div>
                <button onClick={dismissInquiryModal} className="p-2 hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto p-8">
                {inquirySent ? (
                  <div className="py-20 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-data/10 text-data flex items-center justify-center rounded-full mb-6">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-2">Inquiry Sent</h4>
                    <p className="text-muted text-sm font-medium">The seller has been notified and will contact you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col space-y-2">
                        <label className="label-micro">Full Name</label>
                        <input 
                          required
                          type="text" 
                          className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                          value={inquiryForm.name}
                          onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="label-micro">Email Address</label>
                        <input 
                          required
                          type="email" 
                          className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                          value={inquiryForm.email}
                          onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label className="label-micro">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label className="label-micro">Message / Requirements</label>
                      <textarea 
                        required
                        rows={4}
                        className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                        placeholder="I'm interested in this asset. Please provide more details regarding..."
                      ></textarea>
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                      Protected by reCAPTCHA Enterprise before submission.
                    </p>
                    <button type="submit" className="btn-industrial btn-accent w-full py-5 text-base">
                      Send Inquiry
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AMV Modal */}
      <AnimatePresence>
        {showAMVModal && hasAmv && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAMVModal(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden"
            >
              <div className="bg-ink text-white p-8 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Market Logic</span>
                  <h3 className="text-2xl font-black tracking-tighter uppercase">AMV Calculation</h3>
                </div>
                <button onClick={() => setShowAMVModal(false)} className="p-2 hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto p-8 space-y-6">
                <div className="bg-surface p-6 border border-line">
                  <div className="flex items-center space-x-3 mb-4 text-accent">
                    <Calculator size={24} />
                    <span className="text-sm font-black uppercase tracking-tighter">Equipment Market Value Index</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed font-medium">
                    {amvExplanation || "Retrieving market intelligence..."}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Match Rules', desc: getAmvMatchRulesSummary() },
                    { label: 'Comparable Count', desc: `At least ${AMV_MIN_COMPARABLES} comparable listings are required for an AMV value.` },
                    { label: 'Output', desc: 'AMV is the arithmetic average of matched listing prices.' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5"></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        <p className="text-[10px] font-medium text-muted uppercase">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowAMVModal(false)}
                  className="btn-industrial btn-accent w-full py-4 mt-4"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Financing Modal */}
      <AnimatePresence>
        {showFinancingModal && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissFinancingModal}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden"
            >
              <div className="bg-ink text-white p-8 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Credit Center</span>
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Financing Estimator</h3>
                </div>
                <button onClick={dismissFinancingModal} className="p-2 hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto p-8 space-y-8">
                {financingSent ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-data/10 text-data flex items-center justify-center rounded-full mb-6">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-2">Financing Request Sent</h4>
                    <p className="text-muted text-sm font-medium">The seller and admin financing team have been notified.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFinancingSubmit} className="space-y-6">
                    <div className="bg-surface p-6 border border-line">
                      <span className="label-micro block mb-2">Estimated Monthly Payment</span>
                      <span className="text-4xl font-black tracking-tighter text-accent">
                        {formatPrice(Math.round(listing.price / 60 * 1.08), listing.currency || 'USD', 0)}
                      </span>
                      <p className="text-[10px] font-bold text-muted uppercase mt-4">Based on 60 months @ 6.25% APR with 10% down.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required type="text" placeholder="FULL NAME" className="input-industrial" value={financingForm.name} onChange={(e) => setFinancingForm({ ...financingForm, name: e.target.value })} />
                      <input required type="email" placeholder="EMAIL" className="input-industrial" value={financingForm.email} onChange={(e) => setFinancingForm({ ...financingForm, email: e.target.value })} />
                      <input required type="tel" placeholder="PHONE" className="input-industrial" value={financingForm.phone} onChange={(e) => setFinancingForm({ ...financingForm, phone: e.target.value })} />
                      <input type="text" placeholder="COMPANY" className="input-industrial" value={financingForm.company} onChange={(e) => setFinancingForm({ ...financingForm, company: e.target.value })} />
                      <input type="number" placeholder="REQUESTED AMOUNT" className="input-industrial md:col-span-2" value={financingForm.requestedAmount} onChange={(e) => setFinancingForm({ ...financingForm, requestedAmount: e.target.value })} />
                    </div>

                    <textarea rows={3} className="input-industrial w-full" placeholder="FINANCING NOTES..." value={financingForm.message} onChange={(e) => setFinancingForm({ ...financingForm, message: e.target.value })}></textarea>

                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                      Protected by reCAPTCHA Enterprise before submission.
                    </p>

                    <div className="pt-2 border-t border-line">
                      <button type="submit" className="btn-industrial btn-accent w-full py-5 text-base">Apply for Financing</button>
                      <p className="text-[9px] font-medium text-muted text-center mt-4 uppercase tracking-widest">Submitted to seller and admin financing desk.</p>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shipping Modal */}
      <AnimatePresence>
        {showShippingModal && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissShippingModal}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden"
            >
              <div className="bg-ink text-white p-8 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Logistics</span>
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Trucking Request</h3>
                </div>
                <button onClick={dismissShippingModal} className="p-2 hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto p-8">
                {shippingSent ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-data/10 text-data flex items-center justify-center rounded-full mb-6">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-2">Logistics Request Sent</h4>
                    <p className="text-muted text-sm font-medium">The seller and admin logistics queue have been notified.</p>
                  </div>
                ) : (
                  <form onSubmit={handleShippingSubmit} className="space-y-6">
                    <div className="bg-surface border border-line p-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="label-micro block mb-2">Machine Reference</span>
                          <p className="text-sm font-black tracking-tight uppercase">{listing.title}</p>
                        </div>
                        <div className="text-right">
                          <span className="label-micro block mb-2">Stock / Listing</span>
                          <p className="text-[10px] font-black uppercase tracking-widest text-accent break-all">
                            {shippingForm.reference || listing.stockNumber || listing.id}
                          </p>
                        </div>
                      </div>
                      {/* explainer removed – reference auto-populates silently */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required type="text" placeholder="FULL NAME" className="input-industrial" value={shippingForm.name} onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })} />
                      <input type="text" placeholder="COMPANY / DEALERSHIP" className="input-industrial" value={shippingForm.company} onChange={(e) => setShippingForm({ ...shippingForm, company: e.target.value })} />
                      <input required type="email" placeholder="EMAIL" className="input-industrial" value={shippingForm.email} onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })} />
                      <input required type="tel" placeholder="PHONE" className="input-industrial" value={shippingForm.phone} onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })} />
                    </div>

                    <input required type="text" placeholder="PICKUP CITY / STATE" className="input-industrial w-full" value={shippingForm.pickupLocation} onChange={(e) => setShippingForm({ ...shippingForm, pickupLocation: e.target.value })} />

                    <input required type="text" placeholder="DELIVERY CITY / STATE / COUNTRY" className="input-industrial w-full" value={shippingForm.destination} onChange={(e) => setShippingForm({ ...shippingForm, destination: e.target.value })} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select className="input-industrial" value={shippingForm.timeline} onChange={(e) => setShippingForm({ ...shippingForm, timeline: e.target.value })}>
                        <option value="">Timing</option>
                        <option value="ASAP">ASAP</option>
                        <option value="This Week">This Week</option>
                        <option value="Within 2 Weeks">Within 2 Weeks</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                      <select className="input-industrial" value={shippingForm.trailerType} onChange={(e) => setShippingForm({ ...shippingForm, trailerType: e.target.value })}>
                        <option value="">Trailer Type</option>
                        <option value="Step Deck">Step Deck</option>
                        <option value="Lowboy / RGN">Lowboy / RGN</option>
                        <option value="Flatbed">Flatbed</option>
                        <option value="Open to Recommendation">Open to Rec.</option>
                      </select>
                      <select className="input-industrial" value={shippingForm.loadReady} onChange={(e) => setShippingForm({ ...shippingForm, loadReady: e.target.value })}>
                        <option value="Yes">Load Ready</option>
                        <option value="No">Not Load Ready</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <textarea rows={4} className="input-industrial w-full" placeholder="DIMENSIONS, LOADING DETAILS, BORDER NOTES, OR SPECIAL HANDLING..." value={shippingForm.notes} onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}></textarea>

                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                      Protected by reCAPTCHA Enterprise before submission.
                    </p>

                    <div className="pt-2 border-t border-line">
                      <button type="submit" className="btn-industrial btn-accent w-full py-4">Submit Logistics Request</button>
                      <p className="text-[9px] font-medium text-muted text-center mt-4 uppercase tracking-widest">Sent to seller and the Forestry Equipment Sales logistics desk for quote review.</p>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => { if (resolvedListingId) toggleFavorite(resolvedListingId); }}
        message="Sign in to bookmark this equipment and save it for later."
      />

      <PaymentCalculatorModal
        isOpen={showPaymentCalcModal}
        onClose={() => setShowPaymentCalcModal(false)}
        equipmentName={listing ? `${safeYear} ${safeMake} ${safeModel}`.trim() : ''}
        price={safePrice}
        currency={listing?.currency || 'USD'}
        onSubmitFinancingRequest={submitFinanceRequestFromCalculator}
      />

    </div>
  );
}
