import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { Listing, Seller } from '../types';
import { useAuth } from '../components/AuthContext';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { PaymentCalculatorModal } from '../components/PaymentCalculatorModal';
import { useLocale } from '../components/LocaleContext';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, toggleFavorite, isAuthenticated } = useAuth();
  const { t, formatNumber, formatPrice } = useLocale();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [amvExplanation, setAmvExplanation] = useState<string | null>(null);
  const [aiSpecs, setAiSpecs] = useState<any>(null);
  const [loadingAiData, setLoadingAiData] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocationMap, setLoadingLocationMap] = useState(false);
  
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
    return targetListing ? `https://timberequip.com/listing/${targetListing.id}` : '';
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

  const buildMapsHref = (query: string) => {
    const encoded = encodeURIComponent(query);
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        return `https://maps.apple.com/?q=${encoded}`;
      }
      if (/android/.test(userAgent)) {
        return `geo:0,0?q=${encoded}`;
      }
    }
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  };

  const buildOpenStreetMapEmbedUrl = (lat: number, lng: number) => {
    const latDelta = 0.08;
    const lngDelta = 0.16;
    const bbox = [lng - lngDelta, lat - latDelta, lng + lngDelta, lat + latDelta]
      .map((value) => value.toFixed(6))
      .join(',');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
  };

  const buildOpenStreetMapLink = (lat?: number, lng?: number) => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lng.toFixed(6)}#map=11/${lat.toFixed(6)}/${lng.toFixed(6)}`;
    }
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(listing?.location || '')}`;
  };

  const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };

  const extractListingCoordinates = (target?: Listing | null): { lat: number; lng: number } | null => {
    if (!target) return null;

    const lat = toFiniteNumber(
      target.latitude ?? target.specs?.latitude ?? target.specs?.lat
    );
    const lng = toFiniteNumber(
      target.longitude ?? target.specs?.longitude ?? target.specs?.lng ?? target.specs?.lon
    );

    if (lat === undefined || lng === undefined) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    return { lat, lng };
  };

  const isFavorite = id ? user?.favorites?.includes(id) : false;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const listingData = await equipmentService.getListing(id);
        if (listingData) {
          const computedAmv = await equipmentService.getMarketValue({
            listingId: listingData.id,
            category: listingData.category,
            manufacturer: listingData.make || listingData.manufacturer || listingData.brand,
            model: listingData.model,
            year: listingData.year,
            hours: listingData.hours
          });

          const listingWithAmv = {
            ...listingData,
            marketValueEstimate: computedAmv
          };

          setListing(listingWithAmv);
          const sellerData = await equipmentService.getSeller(listingData.sellerUid || listingData.sellerId || '');
          if (sellerData) setSeller(sellerData);

          // Fetch AI Data
          setLoadingAiData(true);
          const specsPromise = geminiService.getMachineSpecs(listingData.title, listingData.category);
          const explanationPromise =
            computedAmv !== null
              ? geminiService.explainAMV(listingData.title, listingData.price, computedAmv, listingData.specs)
              : Promise.resolve<string | null>(null);

          const [specs, explanation] = await Promise.all([specsPromise, explanationPromise]);
          setAiSpecs(specs);
          setAmvExplanation(explanation || null);
          setLoadingAiData(false);
        }
      } catch (error) {
        console.error('Error fetching listing detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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

  useEffect(() => {
    if (!listing) {
      setLocationCoords(null);
      setLoadingLocationMap(false);
      return;
    }

    const preciseCoords = extractListingCoordinates(listing);
    if (preciseCoords) {
      setLocationCoords(preciseCoords);
      setLoadingLocationMap(false);
      return;
    }

    if (!listing.location) {
      setLocationCoords(null);
      setLoadingLocationMap(false);
      return;
    }

    const controller = new AbortController();
    setLoadingLocationMap(true);

    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(listing.location)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return [];
        return response.json();
      })
      .then((results) => {
        const match = Array.isArray(results) ? results[0] : null;
        const lat = Number(match?.lat);
        const lng = Number(match?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setLocationCoords({ lat, lng });
        } else {
          setLocationCoords(null);
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          console.error('Failed to geocode listing location:', error);
          setLocationCoords(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingLocationMap(false);
        }
      });

    return () => controller.abort();
  }, [listing]);

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
      shippingForm.pickupLocation.trim() !== shippingDefaults.pickupLocation.trim() ||
      shippingForm.reference.trim() !== shippingDefaults.reference.trim()
  );

  const confirmDiscardChanges = () => window.confirm('Are you sure you want to discard changes?');
  const machineMapsHref = buildMapsHref(listing?.location || '');
  const openStreetMapHref = buildOpenStreetMapLink(locationCoords?.lat, locationCoords?.lng);

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
    if (id) {
      await toggleFavorite(id);
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

  const handleCallSeller = () => {
    // Simulated VOIP lead tracking
    console.log('VOIP LEAD LOGGED: Call initiated to', seller?.phone);
    window.location.href = `tel:${seller?.phone}`;
  };

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
    const summary = `Payment calculator financing request for ${listing.title || `${listing.year} ${listing.make || listing.manufacturer || ''} ${listing.model}`.trim()}.`;
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
      <Link to="/search" className="btn-industrial btn-accent">{t('listingDetail.returnToInventory', 'Return to Inventory')}</Link>
    </div>
  );

  const hasAmv = typeof listing.marketValueEstimate === 'number' && listing.marketValueEstimate > 0;
  const amvDiff = hasAmv ? listing.price - (listing.marketValueEstimate as number) : 0;
  const isBelowAmv = hasAmv ? amvDiff < 0 : false;
  const detailImages =
    listing.imageVariants?.length
      ? listing.imageVariants.map((variant) => variant.detailUrl)
      : listing.images;

  const showPrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? detailImages.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setActiveImage((prev) => (prev === detailImages.length - 1 ? 0 : prev + 1));
  };

  const openFullscreenImage = () => setShowFullscreenImage(true);
  const closeFullscreenImage = () => setShowFullscreenImage(false);

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Breadcrumbs & Actions */}
      <div className="bg-surface border-b border-line py-4 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Link to="/search" className="flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-ink">
            <ArrowLeft size={14} className="mr-2" />
            {t('listingDetail.backToInventory', 'Back to Inventory')}
          </Link>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-muted hover:text-ink"><Share2 size={18} /></button>
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
                  {listing.category}
                </span>
                <span className="text-xs font-bold text-muted uppercase tracking-widest">
                  {t('listingDetail.stockId', 'Stock ID')}: {listing.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                {listing.year} {listing.make || listing.manufacturer} {listing.model}
              </h1>
              <div className="flex items-center space-x-4 text-muted">
                <div className="flex items-center space-x-1.5">
                  <MapPin size={14} className="text-accent" />
                  {isMobileViewport ? (
                    <a href={machineMapsHref} className="text-xs font-bold uppercase tracking-widest hover:text-accent" aria-label={`Open ${listing.location} in maps`}>
                      {listing.location}
                    </a>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-widest">{listing.location}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock size={14} className="text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest">{formatNumber(listing.hours)} {t('listingDetail.hours', 'Hours')}</span>
                </div>
              </div>
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
                    transition={{ duration: 0.3 }}
                    src={detailImages[activeImage]} 
                    alt={listing.title}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={openFullscreenImage}
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                
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
                  {activeImage + 1} / {detailImages.length}
                </div>

                <button
                  onClick={openFullscreenImage}
                  className="absolute bottom-4 left-4 bg-ink/80 backdrop-blur-md text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-ink transition-colors"
                >
                  {t('listingDetail.fullscreen', 'Fullscreen')}
                </button>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {detailImages.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square border-2 transition-all overflow-hidden ${activeImage === i ? 'border-accent' : 'border-line hover:border-muted'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Core Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-line border border-line">
              {[
                { label: t('listingDetail.year', 'Year'), value: listing.year, icon: Clock },
                { label: t('listingDetail.hours', 'Hours'), value: formatNumber(listing.hours), icon: Activity },
                { label: t('listingDetail.condition', 'Condition'), value: listing.condition, icon: ShieldCheck },
                { label: t('listingDetail.location', 'Location'), value: listing.location, icon: MapPin },
                { label: t('listingDetail.make', 'Make'), value: listing.make || listing.manufacturer, icon: Info },
                { label: t('listingDetail.model', 'Model'), value: listing.model, icon: Info }
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
                      <span className="text-2xl font-black tracking-tighter">{formatPrice(listing.price, listing.currency || 'USD', 0)}</span>
                    </div>
                    <div className="flex justify-between items-end text-muted">
                      <span className="label-micro">{t('listingDetail.averageMarketValue', 'Average Market Value')}</span>
                      <span className="text-xl font-black tracking-tighter">
                        {formatPrice(listing.marketValueEstimate as number, listing.currency || 'USD', 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-line rounded-full overflow-hidden relative">
                      <div
                        className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${isBelowAmv ? 'bg-data' : 'bg-accent'}`}
                        style={{ width: `${(listing.price / ((listing.marketValueEstimate as number) * 1.5)) * 100}%` }}
                      ></div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-ink z-10"
                        style={{ left: `${((listing.marketValueEstimate as number) / ((listing.marketValueEstimate as number) * 1.5)) * 100}%` }}
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
                      {`This equipment is currently priced ${Math.abs(((listing.price - (listing.marketValueEstimate as number)) / (listing.marketValueEstimate as number)) * 100).toFixed(1)}% ${isBelowAmv ? 'below' : 'above'} the AMV index for this configuration.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="flex flex-col space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter border-b border-line pb-4">{t('listingDetail.equipmentOverview', 'Equipment Overview')}</h3>
              <p className="text-muted font-medium leading-loose whitespace-pre-line">
                {listing.description}
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
                  {Object.entries(listing.specs).map(([key, value], i) => (
                    <div key={i} className="data-row">
                      <span className="label-micro">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="value-mono uppercase">
                        {Array.isArray(value) ? value.join(', ') : value}
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
              <div className="bg-ink text-white p-8 rounded-sm shadow-2xl">
                <div className="flex flex-col mb-8">
                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-2">Listed Price</span>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-black tracking-tighter">{formatPrice(listing.price, listing.currency || 'USD', 0)}</span>
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
                    className="btn-industrial w-full py-5 text-base bg-white/10 border-white/20 hover:bg-white hover:text-ink"
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
                    <h4 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{seller.name}</h4>
                    <a 
                      href={`https://maps.apple.com/?q=${encodeURIComponent(seller.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-[10px] font-bold text-muted uppercase hover:text-accent transition-colors"
                    >
                      <MapPin size={10} className="mr-1" />
                      {seller.location}
                    </a>
                  </div>
                  <div className="w-16 h-16 bg-bg border border-line p-2">
                    <img src={seller.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="bg-bg border border-line p-4 flex flex-col items-center text-center">
                    <span className="text-lg font-black tracking-tighter">{seller.totalListings}</span>
                    <span className="label-micro">Equipment</span>
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
                      {seller.type} • Member Since {new Date(seller.memberSince).getFullYear()}
                    </span>
                  </div>
                </div>

                <Link to={`/seller/${seller.id}`} className="btn-industrial w-full mt-8 py-3">
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
                    {t('listingDetail.transactionPolicyCopy', 'Always use the TimberEquip platform for inquiries. Never send funds directly to sellers without a verified escrow system.')}
                  </p>
                </div>
              </div>

              <div className="bg-surface border border-line overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-6 py-4 gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent block mb-1">OpenStreetMap</span>
                    <h4 className="text-sm font-black uppercase tracking-tight">Machine Location</h4>
                  </div>
                  <a href={openStreetMapHref} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">
                    Open Full Map
                  </a>
                </div>
                {loadingLocationMap ? (
                  <div className="h-64 flex items-center justify-center bg-bg text-[10px] font-bold uppercase tracking-widest text-muted">
                    Loading map...
                  </div>
                ) : locationCoords ? (
                  <iframe
                    title={`Map for ${listing.location}`}
                    src={buildOpenStreetMapEmbedUrl(locationCoords.lat, locationCoords.lng)}
                    className="h-64 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center bg-bg px-6 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">Map preview unavailable for this location.</p>
                    <a href={openStreetMapHref} target="_blank" rel="noopener noreferrer" className="btn-industrial px-4 py-2 text-[10px]">
                      Open in OpenStreetMap
                    </a>
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
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={detailImages[activeImage]}
                          src={detailImages[activeImage]}
                          alt={listing.title}
                          className="max-w-[94vw] max-h-[84vh] w-auto h-auto object-contain select-none"
                          referrerPolicy="no-referrer"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.24 }}
                        />
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
                    { label: 'Match Rules', desc: 'Same manufacturer and model, with year +/-1 and hours +/-500.' },
                    { label: 'Comparable Count', desc: 'At least 2 comparable listings are required for an AMV value.' },
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
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                        Stock # auto-fills when available. If not, the listing URL is attached automatically.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required type="text" placeholder="FULL NAME" className="input-industrial" value={shippingForm.name} onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })} />
                      <input type="text" placeholder="COMPANY / DEALERSHIP" className="input-industrial" value={shippingForm.company} onChange={(e) => setShippingForm({ ...shippingForm, company: e.target.value })} />
                      <input required type="email" placeholder="EMAIL" className="input-industrial" value={shippingForm.email} onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })} />
                      <input required type="tel" placeholder="PHONE" className="input-industrial" value={shippingForm.phone} onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="STOCK # OR LISTING URL" className="input-industrial" value={shippingForm.reference} onChange={(e) => setShippingForm({ ...shippingForm, reference: e.target.value })} />
                      <input required type="text" placeholder="PICKUP CITY / STATE" className="input-industrial" value={shippingForm.pickupLocation} onChange={(e) => setShippingForm({ ...shippingForm, pickupLocation: e.target.value })} />
                    </div>

                    <input required type="text" placeholder="DELIVERY CITY / STATE / COUNTRY" className="input-industrial w-full" value={shippingForm.destination} onChange={(e) => setShippingForm({ ...shippingForm, destination: e.target.value })} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select className="input-industrial" value={shippingForm.timeline} onChange={(e) => setShippingForm({ ...shippingForm, timeline: e.target.value })}>
                        <option value="">PREFERRED TIMING</option>
                        <option value="ASAP">ASAP</option>
                        <option value="THIS WEEK">THIS WEEK</option>
                        <option value="WITHIN 2 WEEKS">WITHIN 2 WEEKS</option>
                        <option value="FLEXIBLE">FLEXIBLE</option>
                      </select>
                      <select className="input-industrial" value={shippingForm.trailerType} onChange={(e) => setShippingForm({ ...shippingForm, trailerType: e.target.value })}>
                        <option value="">TRAILER / SERVICE TYPE</option>
                        <option value="STEP DECK">STEP DECK</option>
                        <option value="LOWBOY / RGN">LOWBOY / RGN</option>
                        <option value="FLATBED">FLATBED</option>
                        <option value="OPEN TO RECOMMENDATION">OPEN TO RECOMMENDATION</option>
                      </select>
                      <select className="input-industrial" value={shippingForm.loadReady} onChange={(e) => setShippingForm({ ...shippingForm, loadReady: e.target.value })}>
                        <option value="Yes">LOAD READY: YES</option>
                        <option value="No">LOAD READY: NO</option>
                        <option value="Unknown">LOAD READY: UNKNOWN</option>
                      </select>
                    </div>

                    <textarea rows={4} className="input-industrial w-full" placeholder="DIMENSIONS, LOADING DETAILS, BORDER NOTES, OR SPECIAL HANDLING..." value={shippingForm.notes} onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}></textarea>

                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                      Protected by reCAPTCHA Enterprise before submission.
                    </p>

                    <div className="pt-2 border-t border-line">
                      <button type="submit" className="btn-industrial btn-accent w-full py-4">Submit Logistics Request</button>
                      <p className="text-[9px] font-medium text-muted text-center mt-4 uppercase tracking-widest">Sent to seller and TimberEquip logistics desk for quote review.</p>
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
        onSuccess={() => { if (id) toggleFavorite(id); }}
        message="Sign in to bookmark this equipment and save it for later."
      />

      <PaymentCalculatorModal
        isOpen={showPaymentCalcModal}
        onClose={() => setShowPaymentCalcModal(false)}
        equipmentName={listing ? `${listing.year} ${listing.make || listing.manufacturer || ''} ${listing.model}`.trim() : ''}
        price={listing?.price ?? 0}
        currency={listing?.currency || 'USD'}
        onSubmitFinancingRequest={submitFinanceRequestFromCalculator}
      />

    </div>
  );
}
