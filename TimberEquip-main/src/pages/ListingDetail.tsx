import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import {
  MapPin, Activity, X, Truck, ChevronLeft,
  ArrowLeft, Share2, Bookmark, ChevronRight, Clock,
  ShieldCheck, TrendingUp, Info, CheckCircle2,
  Phone, Calculator, AlertCircle, Landmark, RefreshCw, Gavel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { equipmentService } from '../services/equipmentService';
import { toMillis } from '../utils/adminFormatters';
import { auctionService } from '../services/auctionService';
import {
  AMV_MIN_COMPARABLES,
  getAmvMatchRulesSummary,
} from '../utils/amvMatching';
import { Listing, Seller } from '../types';
import { useAuth } from '../components/AuthContext';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { PaymentCalculatorModal } from '../components/PaymentCalculatorModal';
import { useLocale } from '../components/LocaleContext';
import { useTheme } from '../components/ThemeContext';
import { auth } from '../firebase';
import { API_BASE } from '../constants/api';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { Seo } from '../components/Seo';
import { GooglePlacesInput } from '../components/GooglePlacesInput';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import WatermarkOverlay from '../components/WatermarkOverlay';
import { buildListingPath, decodeListingPublicKey, extractListingPublicKeyFromSlug, isPublicQaOrTestRecord, NOINDEX_ROBOTS } from '../utils/listingPath';
import { normalizeListingId, normalizeListingIdList } from '../utils/listingIdentity';
import { buildSiteUrl } from '../utils/siteUrl';
import { clearPendingFavoriteIntent, setPendingFavoriteIntent } from '../utils/pendingFavorite';
import {
  buildCategoryPath,
  buildDealerPath,
  buildManufacturerCategoryPath,
  buildManufacturerModelCategoryPath,
  buildManufacturerModelPath,
  buildManufacturerPath,
  buildStateCategoryPath,
  getCityFromLocation,
  getListingCategoryLabel,
  getListingLocationLabel,
  getListingManufacturer,
  getListingStateName,
  isDealerRole,
} from '../utils/seoRoutes';

const LISTING_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%2311161d'/%3E%3Crect x='100' y='100' width='1400' height='700' rx='24' fill='%231b222c' stroke='%23343c46' stroke-width='8'/%3E%3Cpath d='M390 610l170-180 140 120 170-210 340 270H390z' fill='%23a0a8b3' opacity='.7'/%3E%3Ccircle cx='585' cy='315' r='58' fill='%23e6b800' opacity='.9'/%3E%3Ctext x='800' y='760' fill='%23f5f7fa' font-family='Arial, Helvetica, sans-serif' font-size='56' font-weight='700' text-anchor='middle'%3ETwitterEquip Listing%3C/text%3E%3C/svg%3E";
const SELLER_CONTACT_CONSENT_VERSION = 'seller-contact-v1';
const FINANCING_CONTACT_CONSENT_VERSION = 'financing-contact-v1';

function getVideoEmbedDescriptor(rawUrl: string): { kind: 'embed' | 'video' | 'link'; src: string } {
  const normalizedUrl = String(rawUrl || '').trim();
  if (!normalizedUrl) {
    return { kind: 'link', src: '' };
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;
    const pathnameLower = pathname.toLowerCase();

    const directVideoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.ogg', '.ogv'];
    if (directVideoExtensions.some((extension) => pathnameLower.endsWith(extension))) {
      return { kind: 'video', src: normalizedUrl };
    }

    if (hostname.includes('youtu.be')) {
      const videoId = pathname.replace(/^\/+/, '').split('/')[0];
      if (videoId) {
        return { kind: 'embed', src: `https://www.youtube.com/embed/${videoId}?rel=0` };
      }
    }

    if (hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v') || pathname.split('/').filter(Boolean).pop();
      if (videoId) {
        return { kind: 'embed', src: `https://www.youtube.com/embed/${videoId}?rel=0` };
      }
    }

    if (hostname.includes('vimeo.com')) {
      const videoId = pathname.split('/').filter(Boolean).find((segment) => /^\d+$/.test(segment));
      if (videoId) {
        return { kind: 'embed', src: `https://player.vimeo.com/video/${videoId}` };
      }
    }

    return { kind: 'link', src: normalizedUrl };
  } catch {
    return { kind: 'link', src: normalizedUrl };
  }
}

export function ListingDetail() {
  const { id, publicKey, slug } = useParams<{ id?: string; publicKey?: string; slug?: string }>();
  const location = useLocation();
  const { user, toggleFavorite, isAuthenticated } = useAuth();
  const { t, formatNumber, formatPrice } = useLocale();
  const { theme } = useTheme();
  const { alert: showAlert, dialogProps } = useConfirmDialog();
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
  const [shareCopied, setShareCopied] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [financingSent, setFinancingSent] = useState(false);
  const [shippingSent, setShippingSent] = useState(false);
  const [inquiryConsentAccepted, setInquiryConsentAccepted] = useState(false);
  const [financingConsentAccepted, setFinancingConsentAccepted] = useState(false);
  const [marketMatchRecommendations, setMarketMatchRecommendations] = useState<Listing[]>([]);
  const [similarEquipment, setSimilarEquipment] = useState<Listing[]>([]);
  const [amvExplanation, setAmvExplanation] = useState<string | null>(null);
  const [loadingMarketMatches, setLoadingMarketMatches] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMapFrameLoading, setIsMapFrameLoading] = useState(false);
  const fullscreenSwipeRef = React.useRef<{ startX: number; startY: number; time: number } | null>(null);
  const [auctionLot, setAuctionLot] = useState<import('../types').AuctionLot | null>(null);
  const [auctionBids, setAuctionBids] = useState<import('../types').AuctionBid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  
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
    return targetListing ? buildSiteUrl(buildListingPath(targetListing)) : '';
  };

  const auctionLotPath = listing?.auctionSlug && auctionLot
    ? `/auctions/${listing.auctionSlug}/lots/${auctionLot.lotNumber}`
    : '';
  const auctionRegistrationPath = listing?.auctionSlug
    ? `/auctions/${listing.auctionSlug}/register?returnTo=${encodeURIComponent(auctionLotPath || `/auctions/${listing.auctionSlug}`)}`
    : '';

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
    reference: targetListing?.id?.trim() || getListingUrl(targetListing),
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

  const favoriteIds = normalizeListingIdList(user?.favorites);
  const slugPublicKey = extractListingPublicKeyFromSlug(slug || '');
  const slugDerivedListingId = slug?.includes('--')
    ? slugPublicKey
    : decodeListingPublicKey(publicKey || slugPublicKey || '');
  const resolvedListingId = normalizeListingId(listing?.id || slugDerivedListingId || id || '');
  const isFavorite = resolvedListingId ? favoriteIds.includes(resolvedListingId) : false;

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      const requestedListingId = String(slugDerivedListingId || id || '').trim();
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
        setAmvExplanation(null);
        setLoading(false);
        setLoadingMarketMatches(true);

        const sellerPromise = equipmentService
          .getSeller(listingData.sellerUid || listingData.sellerId || '')
          .catch((error) => {
            console.error('Error fetching listing seller:', error);
            return undefined;
          });

        const [sellerData, marketComparableInsights] = await Promise.all([
          sellerPromise,
          equipmentService
            .getMarketComparableInsights({
              listingId: listingData.id,
              category: listingData.category,
              manufacturer: listingData.make || listingData.manufacturer || listingData.brand,
              model: listingData.model,
              price: listingData.price,
              year: listingData.year,
              hours: listingData.hours,
            })
            .catch((error) => {
              console.error('Error fetching market comparable insights:', error);
              return {
                marketValueEstimate: null,
                recommendations: [],
              };
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
        setListing((current) =>
          current && current.id === listingData.id
            ? {
                ...current,
                marketValueEstimate: marketComparableInsights.marketValueEstimate,
              }
            : current
        );
        setAmvExplanation(
          marketComparableInsights.marketValueEstimate !== null
            ? `AMV is calculated using comparable equipment listings that match ${getAmvMatchRulesSummary().toLowerCase()}`
            : null
        );
        setMarketMatchRecommendations(marketComparableInsights.recommendations);
      } catch (error) {
        console.error('Error fetching listing detail:', error);
        if (isActive) {
          setLoadError(error instanceof Error ? error.message : 'This equipment record is temporarily unavailable right now.');
          setLoading(false);
        }
      } finally {
        if (isActive) {
          setLoadingMarketMatches(false);
        }
      }
    };
    fetchData();
    return () => {
      isActive = false;
    };
  }, [id, publicKey, slugPublicKey]);

  // Compute Similar Equipment fallback when no market match recommendations exist
  useEffect(() => {
    const cachedListings = equipmentService.getCachedPublicListings();

    if ((loadingMarketMatches && cachedListings.length === 0) || marketMatchRecommendations.length > 0 || !listing) {
      setSimilarEquipment([]);
      return;
    }
    const price = parseFloat(String(listing.price)) || 0;
    const subcategory = listing.subcategory || listing.category || '';
    if (!subcategory || price <= 0) {
      setSimilarEquipment([]);
      return;
    }
    const getPriceThreshold = (p: number) => {
      if (p > 600000) return 0.05;
      if (p > 300000) return 0.15;
      if (p > 100000) return 0.20;
      return 0.25;
    };
    const threshold = getPriceThreshold(price);
    const matches = cachedListings
      .filter((l) => {
        if (l.id === listing.id) return false;
        const lSub = l.subcategory || l.category || '';
        if (lSub.toLowerCase() !== subcategory.toLowerCase()) return false;
        const lPrice = parseFloat(String(l.price)) || 0;
        if (lPrice <= 0) return false;
        return Math.abs(lPrice - price) / price <= threshold;
      })
      .sort((a, b) => Math.abs((parseFloat(String(a.price)) || 0) - price) - Math.abs((parseFloat(String(b.price)) || 0) - price))
      .slice(0, 3);
    setSimilarEquipment(matches);
  }, [listing, loadingMarketMatches, marketMatchRecommendations]);

  useEffect(() => {
    if (!listing) return;

    setShippingForm((prev) => ({
      ...createInitialShippingForm(listing),
      ...prev,
      email: prev.email || user?.email || '',
      pickupLocation: prev.pickupLocation || listing.location || '',
      reference: prev.reference || listing.id || getListingUrl(listing),
    }));
  }, [listing, user?.email]);

  useEffect(() => {
    if (!listing?.id || typeof window === 'undefined') return;

    const viewKey = `te-listing-view:${listing.id}:${new Date().toISOString().slice(0, 10)}`;
    if (window.sessionStorage.getItem(viewKey) === '1') {
      return;
    }

    void equipmentService.recordListingView(listing.id).then((recorded) => {
      if (recorded) {
        window.sessionStorage.setItem(viewKey, '1');
      }
    });
  }, [listing?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!listing?.auctionId) return;
    const unsub = auctionService.onLotsChange(listing.auctionId, (lots) => {
      const lot = lots.find(l => l.listingId === listing.id);
      if (lot) setAuctionLot(lot);
    });
    return unsub;
  }, [listing?.auctionId, listing?.id]);

  useEffect(() => {
    if (!listing?.auctionId || !auctionLot?.id) return;
    const unsub = auctionService.onBidsChange(listing.auctionId, auctionLot.id, setAuctionBids);
    return unsub;
  }, [listing?.auctionId, auctionLot?.id]);

  const machineLatitude = toFiniteNumber(listing?.latitude);
  const machineLongitude = toFiniteNumber(listing?.longitude);
  const machineMapQuery = [
    listing?.location || '',
    seller?.storefrontName || seller?.name || '',
    seller?.location || '',
  ]
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
  const showMarketMatchRecommendations = marketMatchRecommendations.length > 0;
  const marketMatchExplainer = 'We recommend machines that match the same manufacturer and model, with +/- 10% of price and hour range.';

  useEffect(() => {
    setIsMapFrameLoading(hasMachineMap);
  }, [hasMachineMap, machineMapQuery, machineLatitude, machineLongitude]);

  const runRecaptchaCheck = async (action: string) => {
    const token = await getRecaptchaToken(action);
    if (!token) return true;
    const pass = await assessRecaptcha(token, action);
    if (!pass) {
      await showAlert({ title: 'Security Error', message: 'Security check failed. Please try again.', variant: 'warning' });
      return false;
    }
    return true;
  };

  const dismissInquiryModal = () => {
    setShowInquiryModal(false);
    setInquiryForm(createInitialInquiryForm());
    setInquiryConsentAccepted(false);
  };

  const dismissFinancingModal = () => {
    setShowFinancingModal(false);
    setFinancingForm(createInitialFinancingForm());
    setFinancingConsentAccepted(false);
  };

  const dismissShippingModal = () => {
    setShowShippingModal(false);
    setShippingForm(createInitialShippingForm(listing));
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      if (resolvedListingId) {
        setPendingFavoriteIntent(resolvedListingId, `${location.pathname}${location.search}${location.hash}`);
      }
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
    if (!inquiryConsentAccepted) return;
    
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
        type: 'Inquiry',
        contactConsentAccepted: true,
        contactConsentVersion: SELLER_CONTACT_CONSENT_VERSION,
        contactConsentScope: 'listing_seller_specific',
        contactConsentAt: new Date().toISOString(),
      });
      setInquirySent(true);
      setTimeout(() => {
        setShowInquiryModal(false);
        setInquirySent(false);
        setInquiryForm(createInitialInquiryForm());
        setInquiryConsentAccepted(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
    }
  };

  const handleFinancingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    if (!financingConsentAccepted) return;

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
        type: 'Financing',
        contactConsentAccepted: true,
        contactConsentVersion: FINANCING_CONTACT_CONSENT_VERSION,
        contactConsentScope: 'financing_request_specific',
        contactConsentAt: new Date().toISOString(),
      });

      await equipmentService.submitFinancingRequest({
        listingId: listing.id,
        sellerUid,
        applicantName: financingForm.name,
        applicantEmail: financingForm.email,
        applicantPhone: financingForm.phone,
        company: financingForm.company,
        requestedAmount: financingForm.requestedAmount ? Number(financingForm.requestedAmount) : undefined,
        message: financingForm.message,
        contactConsentAccepted: true,
        contactConsentVersion: FINANCING_CONTACT_CONSENT_VERSION,
        contactConsentScope: 'financing_request_specific',
        contactConsentAt: new Date().toISOString(),
      });

      setFinancingSent(true);
      setTimeout(() => {
        setShowFinancingModal(false);
        setFinancingSent(false);
        setFinancingForm(createInitialFinancingForm());
        setFinancingConsentAccepted(false);
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
      const reference = shippingForm.reference.trim() || listing.id || listingUrl;
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
    // Prefer Twilio virtual number for call tracking; fall back to real phone
    const twilioPhone = String(seller?.twilioPhoneNumber || '').trim();
    const dialablePhone = twilioPhone
      ? twilioPhone.replace(/[^\d+]/g, '')
      : rawSellerPhone.replace(/[^\d+]/g, '');

    if (!dialablePhone) {
      await showAlert({ title: 'Phone Unavailable', message: 'Seller phone number is not available on this listing yet.', variant: 'warning' });
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
        source: twilioPhone ? 'listing_detail_twilio' : 'listing_detail',
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

    const consentAt = new Date().toISOString();

    await equipmentService.createInquiry({
      listingId: listing.id,
      sellerUid,
      sellerId: sellerUid,
      buyerName: payload.buyerName,
      buyerEmail: payload.buyerEmail,
      buyerPhone: payload.buyerPhone,
      message: combinedMessage,
      type: 'Financing',
      contactConsentAccepted: true,
      contactConsentVersion: 'financing-calculator-v1',
      contactConsentScope: 'financing_request_specific',
      contactConsentAt: consentAt,
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
      contactConsentAccepted: true,
      contactConsentVersion: 'financing-calculator-v1',
      contactConsentScope: 'financing_request_specific',
      contactConsentAt: consentAt,
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-bg" aria-live="polite" aria-busy={true}>
      <div className="bg-surface border-b border-line py-4 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="animate-pulse bg-line/60 rounded-sm h-4 w-40" />
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <div className="animate-pulse bg-surface rounded-sm h-4 w-24" />
              <div className="animate-pulse bg-surface rounded-sm h-10 w-3/4" />
              <div className="animate-pulse bg-surface rounded-sm h-4 w-48" />
            </div>
            <div className="animate-pulse bg-surface rounded-sm aspect-[16/9] w-full" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-surface rounded-sm h-16 w-20" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="animate-pulse bg-surface rounded-sm h-6 w-24" />
            <div className="animate-pulse bg-surface rounded-sm h-10 w-40" />
            <div className="animate-pulse bg-surface rounded-sm h-14 w-full" />
            <div className="animate-pulse bg-surface rounded-sm h-14 w-full" />
            <div className="space-y-3 pt-4">
              <div className="animate-pulse bg-surface rounded-sm h-4 w-full" />
              <div className="animate-pulse bg-surface rounded-sm h-4 w-full" />
              <div className="animate-pulse bg-surface rounded-sm h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{t('listingDetail.notFound', 'Equipment Not Found')}</h2>
      {loadError ? (
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-muted mb-4 max-w-xl">{loadError}</p>
          <button
            onClick={() => {
              setLoadError('');
              setLoading(true);
              const requestedListingId = String(slugDerivedListingId || id || '').trim();
              if (requestedListingId) {
                equipmentService.getListing(requestedListingId).then((data) => {
                  if (data) {
                    setListing({ ...data, marketValueEstimate: data.marketValueEstimate ?? null });
                  } else {
                    setLoadError('This equipment record is temporarily unavailable. Please return to inventory and try again shortly.');
                  }
                }).catch((err) => {
                  console.error('Error retrying listing fetch:', err);
                  setLoadError(err instanceof Error ? err.message : 'This equipment record is temporarily unavailable right now.');
                }).finally(() => setLoading(false));
              } else {
                setLoading(false);
              }
            }}
            className="btn-industrial btn-accent px-6 py-3 mb-4"
          >
            Try Again
          </button>
        </div>
      ) : null}
      <Link to="/search" className="btn-industrial btn-accent">{t('listingDetail.returnToInventory', 'Return to Inventory')}</Link>
    </div>
  );

  const safeCategory = formatSpecValue(listing.category) || 'Equipment';
  const safeYear = toFiniteNumber(listing.year) ?? new Date().getFullYear();
  const safeMake = formatSpecValue(listing.make || listing.manufacturer) || 'Unknown Make';
  const safeModel = formatSpecValue(listing.model) || 'Unknown Model';
  const safeLocation = getListingLocationLabel(listing) || formatSpecValue(listing.location) || 'Location Pending';
  const safeLocationParts = safeLocation
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const safeCondition = formatSpecValue(listing.condition) || 'Unspecified';
  const safeDescription = formatSpecValue(listing.description) || 'No description provided.';
  const safeHours = toFiniteNumber(listing.hours) ?? 0;
  const safePrice = toFiniteNumber(listing.price) ?? 0;
  const safeMarketValueEstimate = toFiniteNumber(listing.marketValueEstimate);
  const safeSellerName = formatSpecValue(seller?.name) || formatSpecValue(listing.sellerName) || 'Unknown Seller';
  const safeSellerLocation = formatSpecValue(seller?.location) || formatSpecValue(listing.location) || 'Location Not Available';
  const safeSellerType = formatSpecValue(seller?.type) || 'Seller';
  const safeSellerLogo = typeof seller?.logo === 'string' ? seller.logo : '';
  const safeSellerId = formatSpecValue(seller?.id) || '';
  const safeSellerTotalListings = toFiniteNumber(seller?.totalListings) ?? 0;
  const sellerIsVerified = Boolean(
    listing.sellerVerified
    || seller?.manuallyVerified
    || isDealerRole(seller?.role || '')
  );

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
  const galleryImageTitles = galleryImages.map((_, index) => {
    const rawTitle = Array.isArray(listing.imageTitles) ? listing.imageTitles[index] : '';
    return String(rawTitle || '').trim();
  });
  const activeImageTitle = galleryImageTitles[activeImage] || '';
  const hasGallery = detailImages.length > 0;
  const listingVideos = Array.isArray(listing.videoUrls)
    ? listing.videoUrls.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];
  const listingSpecs = listing.specs && typeof listing.specs === 'object' ? listing.specs : {};
  const listingPath = buildListingPath(listing);
  const safeListingId = String(listing.id || 'pending').trim() || 'pending';
  const sellerMemberSinceYear = seller?.memberSince ? new Date(seller.memberSince).getFullYear() : null;
  const hasSellerMemberSinceYear = Number.isFinite(sellerMemberSinceYear);
  const routeCategory = getListingCategoryLabel(listing) || safeCategory;
  const routeManufacturer = getListingManufacturer(listing) || safeMake;
  const routeModel = formatSpecValue(listing.model).trim();
  const routeCity = getCityFromLocation(listing.location) || safeLocationParts[0] || '';
  const routeState = getListingStateName(listing) || safeLocationParts[safeLocationParts.length - 2] || safeLocation;
  const safeCityState = [routeCity, routeState].filter(Boolean).join(', ') || safeLocation;
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
    'Request pricing, financing, and logistics support from Forestry Equipment Sales.',
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
  const pricingCard = (
    <div className={`p-8 rounded-sm shadow-2xl ${theme === 'dark' ? 'bg-[#1C1917] text-white' : 'bg-surface text-ink border border-line'}`}>
      <div className="flex flex-col mb-8">
        <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-2">Listed Price</span>
        <div className="flex items-baseline space-x-3">
          <span className="text-4xl font-black tracking-tighter">{formatPrice(safePrice, listing.currency || 'USD', 0)}</span>
          <span className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-muted'}`}>{t('listingDetail.exclVat', 'Excl. VAT')}</span>
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
          className={`btn-industrial w-full py-5 text-base ${theme === 'dark' ? 'bg-white/10 border-white/20 hover:bg-white hover:text-[#1C1917]' : 'bg-ink text-bg border-line hover:opacity-90'}`}
        >
          <Phone size={18} className="mr-3" />
          {t('listingDetail.callSeller', 'Call Seller')}
        </button>
      </div>

      <div className={`flex items-center justify-center space-x-6 pt-6 border-t ${theme === 'dark' ? 'border-white/10' : 'border-line'}`}>
        <button
          onClick={() => setShowPaymentCalcModal(true)}
          className={`flex items-center text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-muted hover:text-ink'}`}
        >
          <Calculator size={14} className="mr-2" />
          {t('listingDetail.calcPayment', 'Calc Payment')}
        </button>
        <button
          onClick={() => setShowFinancingModal(true)}
          className={`flex items-center text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-muted hover:text-ink'}`}
        >
          <Landmark size={14} className="mr-2" />
          {t('listingDetail.financing', 'Financing')}
        </button>
        <button
          onClick={() => setShowShippingModal(true)}
          className={`flex items-center text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-muted hover:text-ink'}`}
        >
          <Truck size={14} className="mr-2" />
          {t('listingDetail.logistics', 'Logistics')}
        </button>
      </div>
    </div>
  );
  const normalizedCurrentPath = location.pathname.replace(/\/+$/, '') || '/';
  const normalizedCanonicalPath = listingPath.replace(/\/+$/, '') || '/';
  const routeLinks = [
    routeCategory ? { label: routeCategory, path: buildCategoryPath(routeCategory) } : null,
    routeManufacturer ? { label: routeManufacturer, path: buildManufacturerCategoryPath(routeManufacturer, routeCategory || '') } : null,
    routeManufacturer && routeModel ? { label: routeModel, path: buildManufacturerModelPath(routeManufacturer, routeModel) } : null,
    routeCity ? { label: routeCity, path: `/search?location=${encodeURIComponent(routeCity)}` } : null,
    routeState ? { label: routeState, path: buildStateCategoryPath(routeState, routeCategory || '') } : null,
    dealerPath ? { label: seller?.storefrontName || safeSellerName, path: dealerPath } : null,
  ].filter((entry): entry is { label: string; path: string } => Boolean(entry) && Boolean(entry.path));
  const uniqueRouteLinks = Array.from(new Map(routeLinks.map((entry) => [entry.path, entry])).values()).slice(0, 6);
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: buildSiteUrl('/'),
    },
    routeCategory
      ? {
          '@type': 'ListItem',
          position: 2,
          name: `${routeCategory} For Sale`,
          item: buildSiteUrl(buildCategoryPath(routeCategory)),
        }
      : null,
    routeManufacturer
      ? {
          '@type': 'ListItem',
          position: routeCategory ? 3 : 2,
          name: routeManufacturer,
          item: buildSiteUrl(buildManufacturerPath(routeManufacturer)),
        }
      : null,
    routeManufacturer && routeModel
      ? {
          '@type': 'ListItem',
          position: routeCategory ? 4 : 3,
          name: `${routeManufacturer} ${routeModel}`,
          item: buildSiteUrl(buildManufacturerModelPath(routeManufacturer, routeModel)),
        }
      : null,
    {
      '@type': 'ListItem',
      position: routeManufacturer && routeModel ? (routeCategory ? 5 : 4) : routeManufacturer ? (routeCategory ? 4 : 3) : routeCategory ? 3 : 2,
      name: detailSeoHeadline,
      item: buildSiteUrl(listingPath),
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
        sku: listing.id,
        mpn: listing.serialNumber || undefined,
        image: galleryImages.slice(0, 10),
        url: buildSiteUrl(listingPath),
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
          url: buildSiteUrl(listingPath),
          priceCurrency: listing.currency || 'USD',
          availability: String(listing.status || 'active').toLowerCase() === 'sold'
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
          ...(safePrice > 0 ? { price: safePrice } : {}),
          areaServed: routeState || undefined,
          seller: {
            '@type': 'Organization',
            name: seller?.storefrontName || safeSellerName,
            url: dealerPath ? buildSiteUrl(dealerPath) : undefined,
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
    <div className="min-h-screen bg-bg pb-24" aria-live="polite" aria-busy={false}>
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
              onClick={async () => {
                const shareData = {
                  title: `${safeYear} ${safeMake} ${safeModel} for Sale`,
                  text: `Check out this ${safeYear} ${safeMake} ${safeModel} on Forestry Equipment Sales`,
                  url: window.location.href,
                };
                if (navigator.share) {
                  try { await navigator.share(shareData); } catch (err) { /* user cancelled or share unavailable */ }
                } else {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }).catch(() => {});
                }
              }}
              className="p-2 text-muted hover:text-ink relative"
              aria-label="Share listing"
            >
              {shareCopied ? <CheckCircle2 size={18} className="text-accent" /> : <Share2 size={18} />}
            </button>
            <button
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
                  {t('listingDetail.stockId', 'Listing ID')}: {safeListingId}
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

            {listing.auctionId && auctionLot && (
              <div className="flex items-center gap-4 py-3 px-4 bg-surface border border-line rounded-sm mb-4">
                <Gavel size={16} className="text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link to={auctionLotPath || `/auctions/${listing.auctionSlug || ''}`} className="font-black text-xs uppercase tracking-widest hover:text-accent">
                    Auction Lot #{auctionLot.lotNumber}
                  </Link>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="label-micro block">Closes</span>
                  <span className="text-xs font-black">{auctionLot.endTime ? new Date(auctionLot.endTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBD'}</span>
                </div>
              </div>
            )}

            {/* Gallery */}
            <div className="flex flex-col space-y-4">
              <div className="aspect-[4/3] bg-black/90 border border-line overflow-hidden relative group flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    src={galleryImages[activeImage]}
                    alt={activeImageTitle || listing.title}
                    width={1280}
                    height={960}
                    className="max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in"
                    onClick={hasGallery ? openFullscreenImage : undefined}
                    referrerPolicy="no-referrer"
                    fetchPriority={activeImage === 0 ? 'high' : undefined}
                  />
                </AnimatePresence>
                <WatermarkOverlay index={activeImage} />

                {/* Navigation Arrows */}
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={showPrevImage}
                    aria-label="Previous image"
                    className="p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={showNextImage}
                    aria-label="Next image"
                    className="p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">
                  {activeImage + 1} / {galleryImages.length}
                </div>

                {hasGallery && (
                  <button
                    onClick={openFullscreenImage}
                    className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black transition-colors"
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
                    aria-label={galleryImageTitles[i] || `View photo ${i + 1} of ${galleryImages.length}`}
                    className={`aspect-square border-2 transition-all overflow-hidden ${activeImage === i ? 'border-accent' : 'border-line hover:border-muted'}`}
                  >
                    <img
                      src={img}
                      alt={galleryImageTitles[i] || `${listing.title} photo ${i + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
              {activeImageTitle && (
                <p className="text-xs font-bold uppercase tracking-widest text-muted">
                  {activeImageTitle}
                </p>
              )}
            </div>

            <div className="lg:hidden">
              {listing.auctionId && auctionLot && (auctionLot.status === 'active' || auctionLot.status === 'extended' || auctionLot.status === 'preview' || auctionLot.status === 'upcoming') ? (
                <div className="border border-line rounded-sm p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="label-micro">Auction Lot #{auctionLot.lotNumber}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                      auctionLot.status === 'active' || auctionLot.status === 'extended' ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'
                    }`}>{auctionLot.status === 'extended' ? 'Extended' : auctionLot.status}</span>
                  </div>

                  <div>
                    <span className="label-micro">{auctionLot.currentBid > 0 ? 'Current Bid' : 'Starting Bid'}</span>
                    <div className="text-2xl font-black">${(auctionLot.currentBid || auctionLot.startingBid).toLocaleString()}</div>
                    {auctionLot.bidCount > 0 && <span className="text-[10px] text-muted">{auctionLot.bidCount} bid{auctionLot.bidCount !== 1 ? 's' : ''}</span>}
                  </div>

                  {auctionLot.endTime && (
                    <div>
                      <span className="label-micro">Time Remaining</span>
                      <div className="text-sm font-black">{auctionService.formatTimeRemaining(auctionLot.endTime)}</div>
                    </div>
                  )}

                  {auctionLot.hasReserve && (
                    <div className={`text-[10px] font-bold ${auctionLot.reserveMet ? 'text-accent' : 'text-muted'}`}>
                      {auctionLot.reserveMet ? '✓ Reserve met' : 'Reserve not met'}
                    </div>
                  )}

                  {(auctionLot.status === 'active' || auctionLot.status === 'extended') && (
                    <>
                      <div>
                        <label htmlFor="bid-amount-gallery" className="label-micro mb-1 block">Your Max Bid</label>
                        <div className="flex gap-2">
                          <input
                            id="bid-amount-gallery"
                            type="number"
                            className="input-industrial flex-1"
                            placeholder={`Min $${((auctionLot.currentBid || auctionLot.startingBid) + auctionService.getBidIncrement(auctionLot.currentBid || auctionLot.startingBid)).toLocaleString()}`}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                          />
                          <button
                            className="btn-industrial btn-accent"
                            disabled={bidding}
                            onClick={() => {
                              if (auctionLotPath) {
                                window.location.href = auctionLotPath;
                              }
                            }}
                          >
                            {bidding ? 'Opening…' : 'Open Lot'}
                          </button>
                        </div>
                        <p className="text-[9px] text-muted mt-1">{auctionLot.buyerPremiumPercent}% buyer premium applies</p>
                      </div>
                    </>
                  )}

                  {(auctionLot.status === 'upcoming' || auctionLot.status === 'preview') && (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted">Bidding opens {auctionLot.startTime ? new Date(auctionLot.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'soon'}</p>
                      <Link to={`/login?redirect=${encodeURIComponent(auctionRegistrationPath)}`} className="btn-industrial btn-accent w-full mt-2">
                        Register to Bid
                      </Link>
                    </div>
                  )}

                  <button
                    className="text-[10px] text-muted hover:text-ink transition-colors w-full text-left"
                    onClick={() => setShowBidHistory(!showBidHistory)}
                  >
                    {showBidHistory ? '▾' : '▸'} Bid History ({auctionBids.length})
                  </button>
                  {showBidHistory && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {auctionBids.length === 0 ? (
                        <p className="text-[10px] text-muted">No bids yet</p>
                      ) : (
                        auctionBids.map((bid) => (
                          <div key={bid.id} className="flex justify-between text-[10px]">
                            <span className="text-muted">{bid.bidderAnonymousId}</span>
                            <span className="font-bold">${bid.amount.toLocaleString()}</span>
                            <span className="text-muted">{new Date(bid.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="border-t border-line pt-3 space-y-1 text-[10px] text-muted">
                    <p>Payment due within {auctionLot.paymentDeadlineDays || 3} days</p>
                    <p>Removal by {auctionLot.removalDeadlineDays || 14} days after payment</p>
                    <p>Pickup: {auctionLot.pickupLocation || listing.location}</p>
                    <p>Condition: As is, where is</p>
                  </div>
                </div>
              ) : (
                pricingCard
              )}
            </div>

            {listingVideos.length > 0 && (
              <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Walkaround Videos</h3>
                  <span className="label-micro">{listingVideos.length} video{listingVideos.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {listingVideos.map((videoUrl, index) => {
                    const descriptor = getVideoEmbedDescriptor(videoUrl);
                    const label = `${listing.title} walkaround video ${index + 1}`;

                    return (
                      <div key={`${videoUrl}-${index}`} className="overflow-hidden border border-line bg-surface">
                        <div className="aspect-video bg-bg">
                          {descriptor.kind === 'embed' ? (
                            <iframe
                              src={descriptor.src}
                              title={label}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="strict-origin-when-cross-origin"
                            />
                          ) : descriptor.kind === 'video' ? (
                            <video
                              controls
                              preload="metadata"
                              className="h-full w-full bg-black"
                            >
                              <source src={descriptor.src} />
                              Your browser does not support embedded video playback.
                            </video>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                              <Landmark size={24} className="text-accent" />
                              <p className="text-sm font-bold uppercase tracking-widest text-ink">External Walkaround Video</p>
                              <a
                                href={descriptor.src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-industrial btn-accent px-4 py-3 text-[10px]"
                              >
                                Open Video
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-line px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
                          Walkaround Video {index + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Core Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-line border border-line">
              {[
                { label: t('listingDetail.year', 'Year'), value: safeYear, icon: Clock },
                { label: t('listingDetail.hours', 'Hours'), value: formatNumber(safeHours), icon: Activity },
                { label: t('listingDetail.condition', 'Condition'), value: safeCondition, icon: ShieldCheck },
                { label: t('listingDetail.location', 'Location'), value: safeLocation, icon: MapPin },
                { label: t('listingDetail.make', 'Make'), value: safeMake, icon: Info },
                { label: t('listingDetail.model', 'Model'), value: safeModel, icon: Info },
                ...(listing.updatedAt && toMillis(listing.updatedAt) ? [{ label: t('listingDetail.lastUpdated', 'Last Updated'), value: new Date(toMillis(listing.updatedAt)).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), icon: RefreshCw }] : [])
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                {Object.entries(listingSpecs).length > 0 ? Object.entries(listingSpecs).map(([key, value], i) => (
                  <div key={i} className="data-row">
                    <span className="label-micro">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="value-mono uppercase">
                      {formatSpecValue(value)}
                    </span>
                  </div>
                )) : (
                  <div className="md:col-span-2 border border-dashed border-line bg-surface p-6 text-sm font-medium leading-relaxed text-muted">
                    Seller-provided technical specifications will appear here when they are included with the listing.
                  </div>
                )}
              </div>
            </div>

            {/* Map Preview */}
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

            {/* Market Match Recommendations */}
            {showMarketMatchRecommendations ? (
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Market Match Recommendations</h3>
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-muted">
                    {marketMatchExplainer}
                  </p>
                </div>
                <span className="label-micro">{formatNumber(marketMatchRecommendations.length)} live matches</span>
              </div>

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
                          width={400}
                          height={300}
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
            </div>
            ) : null}

            {/* Similar Equipment (fallback when no market matches) */}
            {!showMarketMatchRecommendations && similarEquipment.length > 0 && (
              <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Similar Equipment</h3>
                  <span className="label-micro">{similarEquipment.length} listings</span>
                </div>
                <div className="relative group/scroll">
                  <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {similarEquipment.map((sim, simIdx) => {
                      const simImage =
                        sim.imageVariants?.[0]?.thumbnailUrl ||
                        sim.images?.find(Boolean) ||
                        LISTING_IMAGE_PLACEHOLDER;
                      const simPath = buildListingPath(sim);
                      return (
                        <Link
                          key={sim.id}
                          to={simPath}
                          className="group min-w-[280px] max-w-[320px] flex-shrink-0 snap-start overflow-hidden border border-line bg-surface transition-transform duration-200 hover:-translate-y-1"
                        >
                          <div className="aspect-[4/3] overflow-hidden bg-bg relative">
                            <img
                              src={simImage}
                              alt={sim.title || `${sim.year} ${sim.make || sim.manufacturer || ''} ${sim.model}`}
                              width={400}
                              height={300}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                            />
                            <WatermarkOverlay index={simIdx} />
                          </div>
                          <div className="space-y-3 p-5">
                            <span className="label-micro">{sim.make || sim.manufacturer || sim.brand || sim.subcategory || ''}</span>
                            <h4 className="text-base font-black uppercase tracking-tight transition-colors group-hover:text-accent">
                              {sim.year || ''} {sim.make || sim.manufacturer || ''} {sim.model || ''}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-black tracking-tight">{formatPrice(sim.price || 0, sim.currency || 'USD', 0)}</span>
                              <span className="text-[10px] font-bold text-muted uppercase">{formatNumber(sim.hours || 0)} hrs</span>
                            </div>
                            <p className="text-[10px] font-medium text-muted">{sim.location || ''}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {similarEquipment.length > 1 && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-1">
                      <div className="w-8 h-8 bg-black/70 text-white flex items-center justify-center rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity pointer-events-auto cursor-pointer" onClick={(e) => { e.preventDefault(); const container = (e.currentTarget.closest('.group\\/scroll') as HTMLElement)?.querySelector('.overflow-x-auto'); if (container) container.scrollBy({ left: -300, behavior: 'smooth' }); }}>
                        <ChevronLeft size={16} />
                      </div>
                      <div className="w-8 h-8 bg-black/70 text-white flex items-center justify-center rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity pointer-events-auto cursor-pointer" onClick={(e) => { e.preventDefault(); const container = (e.currentTarget.closest('.group\\/scroll') as HTMLElement)?.querySelector('.overflow-x-auto'); if (container) container.scrollBy({ left: 300, behavior: 'smooth' }); }}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <div className="hidden lg:block">
                {listing.auctionId && auctionLot && (auctionLot.status === 'active' || auctionLot.status === 'extended' || auctionLot.status === 'preview' || auctionLot.status === 'upcoming') ? (
                  <div className="border border-line rounded-sm p-4 space-y-4 sticky top-20">
                    <div className="flex items-center justify-between">
                      <span className="label-micro">Auction Lot #{auctionLot.lotNumber}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                        auctionLot.status === 'active' || auctionLot.status === 'extended' ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'
                      }`}>{auctionLot.status === 'extended' ? 'Extended' : auctionLot.status}</span>
                    </div>

                    <div>
                      <span className="label-micro">{auctionLot.currentBid > 0 ? 'Current Bid' : 'Starting Bid'}</span>
                      <div className="text-2xl font-black">${(auctionLot.currentBid || auctionLot.startingBid).toLocaleString()}</div>
                      {auctionLot.bidCount > 0 && <span className="text-[10px] text-muted">{auctionLot.bidCount} bid{auctionLot.bidCount !== 1 ? 's' : ''}</span>}
                    </div>

                    {auctionLot.endTime && (
                      <div>
                        <span className="label-micro">Time Remaining</span>
                        <div className="text-sm font-black">{auctionService.formatTimeRemaining(auctionLot.endTime)}</div>
                      </div>
                    )}

                    {auctionLot.hasReserve && (
                      <div className={`text-[10px] font-bold ${auctionLot.reserveMet ? 'text-accent' : 'text-muted'}`}>
                        {auctionLot.reserveMet ? '✓ Reserve met' : 'Reserve not met'}
                      </div>
                    )}

                    {(auctionLot.status === 'active' || auctionLot.status === 'extended') && (
                      <>
                        <div>
                          <label htmlFor="bid-amount-sidebar" className="label-micro mb-1 block">Your Max Bid</label>
                          <div className="flex gap-2">
                            <input
                              id="bid-amount-sidebar"
                              type="number"
                              className="input-industrial flex-1"
                              placeholder={`Min $${((auctionLot.currentBid || auctionLot.startingBid) + auctionService.getBidIncrement(auctionLot.currentBid || auctionLot.startingBid)).toLocaleString()}`}
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                            />
                            <button
                              className="btn-industrial btn-accent"
                              disabled={bidding}
                              onClick={() => {
                                if (auctionLotPath) {
                                  window.location.href = auctionLotPath;
                                }
                              }}
                            >
                              {bidding ? 'Opening…' : 'Open Lot'}
                            </button>
                          </div>
                          <p className="text-[9px] text-muted mt-1">{auctionLot.buyerPremiumPercent}% buyer premium applies</p>
                        </div>
                      </>
                    )}

                    {(auctionLot.status === 'upcoming' || auctionLot.status === 'preview') && (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted">Bidding opens {auctionLot.startTime ? new Date(auctionLot.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'soon'}</p>
                        <Link to={`/login?redirect=${encodeURIComponent(auctionRegistrationPath)}`} className="btn-industrial btn-accent w-full mt-2">
                          Register to Bid
                        </Link>
                      </div>
                    )}

                    <button
                      className="text-[10px] text-muted hover:text-ink transition-colors w-full text-left"
                      onClick={() => setShowBidHistory(!showBidHistory)}
                    >
                      {showBidHistory ? '▾' : '▸'} Bid History ({auctionBids.length})
                    </button>
                    {showBidHistory && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {auctionBids.length === 0 ? (
                          <p className="text-[10px] text-muted">No bids yet</p>
                        ) : (
                          auctionBids.map((bid) => (
                            <div key={bid.id} className="flex justify-between text-[10px]">
                              <span className="text-muted">{bid.bidderAnonymousId}</span>
                              <span className="font-bold">${bid.amount.toLocaleString()}</span>
                              <span className="text-muted">{new Date(bid.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <div className="border-t border-line pt-3 space-y-1 text-[10px] text-muted">
                      <p>Payment due within {auctionLot.paymentDeadlineDays || 3} days</p>
                      <p>Removal by {auctionLot.removalDeadlineDays || 14} days after payment</p>
                      <p>Pickup: {auctionLot.pickupLocation || listing.location}</p>
                      <p>Condition: As is, where is</p>
                    </div>
                  </div>
                ) : (
                  pricingCard
                )}
              </div>

              {/* Seller Card */}
              {(seller || listing.sellerName || listing.sellerUid || listing.sellerId) && (
              <div className="bg-surface border border-line p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex flex-col">
                    <span className="label-micro mb-2">
                      {sellerIsVerified ? t('listingDetail.verifiedSeller', 'Verified Seller') : t('listingDetail.sellerVerificationPending', 'Seller (Verification Pending)')}
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
                      <img src={safeSellerLogo} alt={`${listing?.sellerName || 'Seller'} logo`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
                  <div className={`flex items-center space-x-3 text-xs font-bold ${sellerIsVerified ? 'text-data' : 'text-muted'}`}>
                    <ShieldCheck size={16} />
                    <span className="uppercase tracking-widest">
                      {sellerIsVerified ? t('listingDetail.verifiedSeller', 'Verified Seller') : t('listingDetail.verificationPending', 'Verification Pending')}
                    </span>
                  </div>
                  {['super_admin', 'admin'].includes(user?.role || '') && seller?.id && (
                    <button
                      onClick={async () => {
                        const newVal = !seller.manuallyVerified;
                        const action = newVal ? 'verify' : 'unverify';
                        try {
                          const idToken = await auth.currentUser?.getIdToken();
                          if (!idToken) return;
                          const resp = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(seller.id)}/${action}`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                            body: '{}',
                          });
                          if (!resp.ok) {
                            const err = await resp.json().catch(() => ({}));
                            throw new Error(err?.error || `Failed to ${action} seller`);
                          }
                          setSeller((prev) => prev ? { ...prev, manuallyVerified: newVal } : prev);
                        } catch (err) {
                          console.error('Failed to update verification:', err);
                        }
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline text-left"
                    >
                      {seller.manuallyVerified ? 'Remove Manual Verification' : 'Manually Verify Seller'}
                    </button>
                  )}
                  <div className="flex items-center space-x-3 text-xs font-bold text-muted">
                    <Clock size={16} />
                    <span className="uppercase tracking-widest">
                      {safeSellerType}
                      {hasSellerMemberSinceYear ? ` • Member Since ${sellerMemberSinceYear}` : ''}
                    </span>
                  </div>
                </div>

                <Link to={dealerPath || `/dealers/${safeSellerId}`} className="btn-industrial w-full mt-8 py-3">
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
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
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
                initialScale={1}
                minScale={1}
                maxScale={5}
                wheel={{ step: 0.2 }}
                pinch={{ step: 4 }}
                doubleClick={{ disabled: true }}
                centerOnInit
              >
                {(ref) => { const { zoomIn, zoomOut, resetTransform, state } = ref as unknown as ReactZoomPanPinchRef; return (
                  <>
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      <button onClick={() => zoomOut()} className="px-3 py-2 bg-black/65 text-white text-xs font-black rounded-sm hover:bg-black transition-colors">-</button>
                      <button onClick={() => zoomIn()} className="px-3 py-2 bg-black/65 text-white text-xs font-black rounded-sm hover:bg-black transition-colors">+</button>
                      <button onClick={() => resetTransform()} className="px-3 py-2 bg-black/65 text-white text-xs font-black rounded-sm hover:bg-black transition-colors">Reset</button>
                    </div>

                    <TransformComponent
                      wrapperClass="w-full h-full !overflow-visible"
                      contentClass="w-full h-full flex items-center justify-center !overflow-visible px-4 py-10"
                      wrapperProps={{
                        onTouchStart: (e: React.TouchEvent) => {
                          if (e.touches.length === 1) {
                            fullscreenSwipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, time: Date.now() };
                          }
                        },
                        onTouchEnd: (e: React.TouchEvent) => {
                          if (!fullscreenSwipeRef.current || state.scale > 1.05) { fullscreenSwipeRef.current = null; return; }
                          const touch = e.changedTouches[0];
                          const dx = touch.clientX - fullscreenSwipeRef.current.startX;
                          const dy = touch.clientY - fullscreenSwipeRef.current.startY;
                          const elapsed = Date.now() - fullscreenSwipeRef.current.time;
                          fullscreenSwipeRef.current = null;
                          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && elapsed < 500) {
                            resetTransform();
                            if (dx < 0) showNextImage();
                            else showPrevImage();
                          }
                        },
                      }}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={activeImage}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          onAnimationStart={() => resetTransform()}
                          className="relative inline-block"
                        >
                          <img
                            src={galleryImages[activeImage]}
                            alt={activeImageTitle || listing.title}
                            className="max-w-[94vw] max-h-[84vh] w-auto h-auto object-contain select-none"
                            referrerPolicy="no-referrer"
                          />
                          <WatermarkOverlay index={activeImage} />
                        </motion.div>
                      </AnimatePresence>
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
                ); }}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="inquiry-modal-title"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden"
            >
              <div className={`p-8 flex justify-between items-center ${theme === 'dark' ? 'bg-[#1C1917] text-white' : 'bg-surface text-ink border-b border-line'}`}>
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inquiry Form</span>
                  <h3 id="inquiry-modal-title" className="text-2xl font-black tracking-tighter uppercase">Contact Seller</h3>
                </div>
                <button onClick={dismissInquiryModal} aria-label="Close inquiry form" className={`p-2 transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-ink/5'}`}>
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
                        <label htmlFor="inquiry-name" className="label-micro">Full Name</label>
                        <input
                          id="inquiry-name"
                          required
                          type="text"
                          className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                          value={inquiryForm.name}
                          onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label htmlFor="inquiry-email" className="label-micro">Email Address</label>
                        <input
                          id="inquiry-email"
                          required
                          type="email"
                          className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                          value={inquiryForm.email}
                          onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="inquiry-phone" className="label-micro">Phone Number</label>
                      <input
                        id="inquiry-phone"
                        required
                        type="tel"
                        className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="inquiry-message" className="label-micro">Message / Requirements</label>
                      <textarea
                        id="inquiry-message"
                        required
                        rows={4}
                        className="bg-surface border border-line p-4 text-sm font-bold focus:ring-accent focus:border-accent"
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                        placeholder="I'm interested in this asset. Please provide more details regarding..."
                      ></textarea>
                    </div>
                    <label className="flex items-start gap-3 border border-line bg-surface/30 p-4 text-[10px] font-medium uppercase tracking-widest text-muted">
                      <input
                        required
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent"
                        checked={inquiryConsentAccepted}
                        onChange={(e) => setInquiryConsentAccepted(e.target.checked)}
                      />
                      <span>
                        I consent to Forestry Equipment Sales and the seller for this specific listing contacting me by phone, SMS, or email about this machine and this request. This consent is specific to this seller and this listing, is not a condition of purchase, and I may withdraw it at any time.
                      </span>
                    </label>
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="amv-modal-title"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden"
            >
              <div className={`p-8 flex justify-between items-center ${theme === 'dark' ? 'bg-[#1C1917] text-white' : 'bg-surface text-ink border-b border-line'}`}>
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Market Logic</span>
                  <h3 id="amv-modal-title" className="text-2xl font-black tracking-tighter uppercase">AMV Calculation</h3>
                </div>
                <button onClick={() => setShowAMVModal(false)} aria-label="Close AMV modal" className={`p-2 transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-ink/5'}`}>
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
                    {amvExplanation || `AMV is calculated using comparable equipment listings that match ${getAmvMatchRulesSummary().toLowerCase()}.`}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="financing-modal-title"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden"
            >
              <div className={`p-8 flex justify-between items-center ${theme === 'dark' ? 'bg-[#1C1917] text-white' : 'bg-surface text-ink border-b border-line'}`}>
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Credit Center</span>
                  <h3 id="financing-modal-title" className="text-2xl font-black tracking-tighter uppercase">Financing Estimator</h3>
                </div>
                <button onClick={dismissFinancingModal} aria-label="Close financing form" className={`p-2 transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-ink/5'}`}>
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

                    <label className="flex items-start gap-3 border border-line bg-surface/30 p-4 text-[10px] font-medium uppercase tracking-widest text-muted">
                      <input
                        required
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent"
                        checked={financingConsentAccepted}
                        onChange={(e) => setFinancingConsentAccepted(e.target.checked)}
                      />
                      <span>
                        I authorize Forestry Equipment Sales Financing and the specific lending or financing partners evaluating this request to contact me by phone, SMS, or email about this application, perform a credit inquiry, and verify the information provided. This consent is specific to this financing request, is not a condition of purchase, and may be withdrawn at any time.
                      </span>
                    </label>

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
              role="dialog"
              aria-modal="true"
              aria-labelledby="shipping-modal-title"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg border border-line relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden"
            >
              <div className={`p-8 flex justify-between items-center ${theme === 'dark' ? 'bg-[#1C1917] text-white' : 'bg-surface text-ink border-b border-line'}`}>
                <div className="flex flex-col">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Logistics</span>
                  <h3 id="shipping-modal-title" className="text-2xl font-black tracking-tighter uppercase">Trucking Request</h3>
                </div>
                <button onClick={dismissShippingModal} aria-label="Close shipping form" className={`p-2 transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-ink/5'}`}>
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
                          <span className="label-micro block mb-2">Listing ID</span>
                          <p className="text-[10px] font-black uppercase tracking-widest text-accent break-all">
                            {shippingForm.reference || listing.id}
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

                    <GooglePlacesInput
                      required
                      value={shippingForm.pickupLocation}
                      onChange={(value) => setShippingForm({ ...shippingForm, pickupLocation: value })}
                      onSelect={(place) =>
                        setShippingForm((prev) => ({
                          ...prev,
                          pickupLocation: place.formattedAddress || prev.pickupLocation,
                        }))
                      }
                      placeholder="Pickup address, city, state, or ZIP"
                      className="space-y-0"
                    />

                    <GooglePlacesInput
                      required
                      value={shippingForm.destination}
                      onChange={(value) => setShippingForm({ ...shippingForm, destination: value })}
                      onSelect={(place) =>
                        setShippingForm((prev) => ({
                          ...prev,
                          destination: place.formattedAddress || prev.destination,
                        }))
                      }
                      placeholder="Delivery address, city, state, or ZIP"
                      className="space-y-0"
                    />

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
        onDismiss={() => clearPendingFavoriteIntent()}
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

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
