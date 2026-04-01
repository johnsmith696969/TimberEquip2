import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, Link, Navigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Globe,
  ShieldCheck,
  Star,
  Clock,
  Package,
  MessageSquare,
  Edit3,
  Save,
  X as CloseIcon,
  Building2,
  Crown,
  Shield,
} from 'lucide-react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import { useAuth } from '../components/AuthContext';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { Seller, Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { Seo } from '../components/Seo';
import { buildDealerPath, getListingCategoryLabel, isDealerRole, normalizeSeoSlug, titleCaseSlug } from '../utils/seoRoutes';
import { useTheme } from '../components/ThemeContext';
import { evaluateRouteQuality } from '../utils/seoRouteQuality';
import { buildListingPath } from '../utils/listingPath';
import { normalizeListingId, normalizeListingIdList } from '../utils/listingIdentity';
import { setPendingFavoriteIntent } from '../utils/pendingFavorite';

const STOREFRONT_EDIT_ROLES = new Set(['individual_seller', 'dealer', 'pro_dealer', 'admin', 'super_admin']);
const STOREFRONT_ADMIN_ROLES = new Set(['admin', 'super_admin', 'developer']);

function roleLabel(role?: string): string {
  switch (role) {
    case 'individual_seller':
      return 'Owner-Operator';
    case 'dealer':
    case 'dealer_staff':
      return 'Dealer';
    case 'pro_dealer':
    case 'dealer_manager':
      return 'Pro Dealer';
    case 'admin':
      return 'Admin Storefront';
    case 'super_admin':
      return 'Super Admin Storefront';
    default:
      return 'Seller Profile';
  }
}

function roleIcon(role?: string) {
  if (role === 'super_admin') return Crown;
  if (role === 'admin') return Shield;
  return Building2;
}

function toDialablePhone(value?: string): string {
  return String(value || '').replace(/[^\d+]/g, '');
}

function normalizeWebsiteHref(value?: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
}

export function SellerProfile() {
  const { id, categorySlug } = useParams<{ id: string; categorySlug?: string }>();
  const location = useLocation();
  const { user: currentUser, isAuthenticated, toggleFavorite } = useAuth();
  const { theme } = useTheme();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [editData, setEditData] = useState({
    storefrontName: '',
    storefrontSlug: '',
    storefrontTagline: '',
    storefrontDescription: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    coverPhotoUrl: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywordsCsv: '',
  });

  const normalizedCurrentRole = currentUser?.role ? userService.normalizeRole(currentUser.role) : undefined;
  const canManageOwnStorefront = Boolean(normalizedCurrentRole && STOREFRONT_EDIT_ROLES.has(normalizedCurrentRole));
  const canManageAnyStorefront = Boolean(normalizedCurrentRole && STOREFRONT_ADMIN_ROLES.has(normalizedCurrentRole));
  const resolvedSellerUid = seller?.uid || id;
  const isOwner = currentUser?.uid === resolvedSellerUid;
  const canEditStorefront = Boolean(currentUser && ((isOwner && canManageOwnStorefront) || canManageAnyStorefront));
  const isDealerRoute = location.pathname.startsWith('/dealers/');
  const isInventoryRoute = location.pathname.endsWith('/inventory');
  const favoriteIds = normalizeListingIdList(currentUser?.favorites);

  const handleToggleFavorite = (listingId: string) => {
    const nid = normalizeListingId(listingId);
    if (!nid) return;
    if (!isAuthenticated) {
      setPendingFavoriteIntent(nid, `${location.pathname}${location.search}${location.hash}`);
      setShowLoginModal(true);
      return;
    }
    void toggleFavorite(nid);
  };

  const toggleCompare = (listingId: string) => {
    setCompareList((prev) => prev.includes(listingId) ? prev.filter((x) => x !== listingId) : [...prev, listingId]);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoadError('Storefront ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        const sellerData = await equipmentService.getSeller(id);
        const listingsData = await equipmentService.getListings({ sellerUid: sellerData?.uid || id });

        if (sellerData) {
          setSeller({
            ...sellerData,
            totalListings: listingsData.length,
          });

          const keywords = Array.isArray(sellerData.seoKeywords) ? sellerData.seoKeywords.join(', ') : '';
          setEditData({
            storefrontName: sellerData.storefrontName || sellerData.name || '',
            storefrontSlug: sellerData.storefrontSlug || '',
            storefrontTagline: sellerData.storefrontTagline || '',
            storefrontDescription: sellerData.storefrontDescription || '',
            location: sellerData.location || '',
            phone: sellerData.phone || '',
            email: sellerData.email || '',
            website: sellerData.website || '',
            logo: sellerData.logo || '',
            coverPhotoUrl: sellerData.coverPhotoUrl || '',
            seoTitle: sellerData.seoTitle || '',
            seoDescription: sellerData.seoDescription || '',
            seoKeywordsCsv: keywords,
          });
        }

        setListings(listingsData);
      } catch (error) {
        console.error('Error fetching seller profile:', error);
        setLoadError('Unable to load this storefront right now. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const seoTitle = useMemo(() => {
    if (!seller) return 'Dealer Storefront | Forestry Equipment Sales';
    const headline = seller.storefrontName || seller.name;
    if (isDealerRoute && categorySlug) {
      return `${headline} ${titleCaseSlug(categorySlug)} Inventory | Forestry Equipment Sales`;
    }
    if (isDealerRoute && isInventoryRoute) {
      return `${headline} Inventory | Forestry Equipment Sales`;
    }
    return seller.seoTitle || `${headline} | ${roleLabel(seller.role)} | Forestry Equipment Sales`;
  }, [seller, isDealerRoute, categorySlug, isInventoryRoute]);

  const seoDescription = useMemo(() => {
    if (!seller) return 'Browse seller storefront inventory on Forestry Equipment Sales.';
    const headline = seller.storefrontName || seller.name;
    if (isDealerRoute && categorySlug) {
      return `Browse ${titleCaseSlug(categorySlug).toLowerCase()} inventory from ${headline} on Forestry Equipment Sales.`;
    }
    if (isDealerRoute && isInventoryRoute) {
      return `Browse live inventory from ${headline} on Forestry Equipment Sales.`;
    }
    return (
      seller.seoDescription ||
      seller.storefrontDescription ||
      `${headline} storefront on Forestry Equipment Sales. Browse inventory, contact details, and active listings.`
    );
  }, [seller, isDealerRoute, categorySlug, isInventoryRoute]);

  const storefrontIcon = roleIcon(seller?.role);
  const filteredListings = useMemo(() => {
    if (!categorySlug) return listings;
    return listings.filter((listing) => normalizeSeoSlug(getListingCategoryLabel(listing)) === categorySlug);
  }, [listings, categorySlug]);

  const handleSaveProfile = async () => {
    if (!resolvedSellerUid || !canEditStorefront || !currentUser?.role) return;

    const storefrontName = editData.storefrontName.trim();
    const seoKeywords = editData.seoKeywordsCsv
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 24);

    if (!storefrontName) {
      setSaveError('Storefront name is required.');
      return;
    }

    setSaveError('');

    try {
      const storefrontRole = seller?.role || currentUser.role;
      const { storefrontSlug } = await userService.saveStorefrontProfile(resolvedSellerUid, {
        role: storefrontRole,
        storefrontName,
        preferredSlug: editData.storefrontSlug.trim(),
        storefrontTagline: editData.storefrontTagline.trim(),
        storefrontDescription: editData.storefrontDescription.trim(),
        location: editData.location.trim(),
        phone: editData.phone.trim(),
        email: editData.email.trim(),
        website: editData.website.trim(),
        logo: editData.logo.trim(),
        coverPhotoUrl: editData.coverPhotoUrl.trim(),
        seoTitle: editData.seoTitle.trim(),
        seoDescription: editData.seoDescription.trim(),
        seoKeywords,
      });

      setSeller((prev) =>
        prev
          ? {
              ...prev,
              uid: resolvedSellerUid,
              name: storefrontName,
              storefrontSlug,
              storefrontName,
              storefrontTagline: editData.storefrontTagline.trim(),
              storefrontDescription: editData.storefrontDescription.trim(),
              location: editData.location.trim(),
              phone: editData.phone.trim(),
              email: editData.email.trim(),
              website: editData.website.trim(),
              logo: editData.logo.trim(),
              coverPhotoUrl: editData.coverPhotoUrl.trim(),
              seoTitle: editData.seoTitle.trim(),
              seoDescription: editData.seoDescription.trim(),
              seoKeywords,
              verified: true,
            }
          : prev
      );

      setEditData((prev) => ({ ...prev, storefrontSlug }));

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating storefront profile:', error);
      setSaveError('Unable to save storefront profile right now.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg px-4 py-16 md:px-8">
        <div className="mx-auto max-w-[1600px] space-y-8 animate-pulse">
          <div className="h-[320px] border border-line bg-surface" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-10 w-72 bg-surface border border-line" />
              <div className="h-5 w-full max-w-3xl bg-surface border border-line" />
              <div className="h-5 w-full max-w-2xl bg-surface border border-line" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-16 bg-surface border border-line" />
              <div className="h-16 bg-surface border border-line" />
              <div className="h-16 bg-surface border border-line" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 text-center">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Storefront Unavailable</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-muted max-w-2xl mb-8">{loadError}</p>
        <Link to="/search" className="btn-industrial btn-accent">Return to Inventory</Link>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Storefront Not Found</h2>
        <Link to="/search" className="btn-industrial btn-accent">Return to Inventory</Link>
      </div>
    );
  }

  const coverImage = seller.coverPhotoUrl || 'https://picsum.photos/seed/forestry-equipment-sales-storefront/1920/720';
  const logoImage = seller.logo || 'https://picsum.photos/seed/forestry-equipment-sales-logo/260/260';
  const headline = seller.storefrontName || seller.name;
  const tagline = seller.storefrontTagline || 'Managed storefront built for serious machine visibility, direct buyer contact, and clean inventory presentation.';
  const description = seller.storefrontDescription || 'This storefront is managed on Forestry Equipment Sales with branded inventory, verified seller controls, and direct lead routing.';
  const preferredDealerPath = buildDealerPath(seller);
  const storefrontCategoryLinks = (() => {
    const counts = new Map<string, number>();
    listings.forEach((listing) => {
      const categoryLabel = getListingCategoryLabel(listing);
      if (!categoryLabel) return;
      counts.set(categoryLabel, (counts.get(categoryLabel) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        path: `${preferredDealerPath}/${normalizeSeoSlug(label)}`,
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  })();
  const dealerRouteQuality = isDealerRoute
    ? evaluateRouteQuality(categorySlug ? 'dealerCategory' : 'dealer', filteredListings.length, {
        fallbackPath: categorySlug ? `${preferredDealerPath}/inventory` : '/dealers',
      })
    : null;

  if (dealerRouteQuality?.redirectPath) {
    return <Navigate replace to={dealerRouteQuality.redirectPath} />;
  }

  const canonicalPath = (() => {
    if (isDealerRoute) {
      if (categorySlug) return `${preferredDealerPath}/${categorySlug}`;
      if (isInventoryRoute) return `${preferredDealerPath}/inventory`;
      return preferredDealerPath;
    }

    if (isDealerRole(seller.role)) {
      return preferredDealerPath;
    }

    return `/dealers/${seller.storefrontSlug || seller.id}`;
  })();

  const isDealer = isDealerRole(seller.role);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isDealer ? 'LocalBusiness' : 'Organization',
        name: headline,
        url: `https://www.forestryequipmentsales.com${canonicalPath}`,
        logo: logoImage,
        image: coverImage,
        description,
        email: seller.email || undefined,
        telephone: seller.phone || undefined,
        ...(seller.location ? { address: { '@type': 'PostalAddress', streetAddress: seller.location } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.forestryequipmentsales.com/' },
          { '@type': 'ListItem', position: 2, name: 'Dealers', item: 'https://www.forestryequipmentsales.com/dealers' },
          { '@type': 'ListItem', position: 3, name: headline, item: `https://www.forestryequipmentsales.com${preferredDealerPath}` },
          ...(categorySlug ? [{ '@type': 'ListItem', position: 4, name: titleCaseSlug(categorySlug), item: `https://www.forestryequipmentsales.com${canonicalPath}` }] : []),
        ],
      },
      {
        '@type': 'ItemList',
        name: `${headline} inventory`,
        itemListElement: filteredListings.slice(0, 24).map((listing, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://www.forestryequipmentsales.com${buildListingPath(listing)}`,
          item: {
            '@type': 'Product',
            name: `${listing.year} ${listing.make || listing.manufacturer || listing.brand || ''} ${listing.model || ''}`.trim(),
            category: getListingCategoryLabel(listing) || 'Equipment',
          },
        })),
      },
    ],
  };

  const StorefrontRoleIcon = storefrontIcon;
  const sellerWebsiteHref = normalizeWebsiteHref(seller.website);
  const sellerPhoneHref = seller.phone ? `tel:${toDialablePhone(seller.phone)}` : '';
  const sellerEmailHref = seller.email ? `mailto:${seller.email}` : '';

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        robots={dealerRouteQuality?.robots}
        jsonLd={jsonLd}
        imagePath={logoImage}
      />

      <section className={`px-4 md:px-8 relative overflow-hidden border-b border-line ${theme === 'dark' ? 'text-white' : 'text-ink'}`}>
        <div className="absolute inset-0">
          <img src={coverImage} alt={`${headline} cover`} className={`w-full h-full object-cover ${theme === 'dark' ? 'opacity-30' : 'opacity-20 saturate-[0.85] brightness-110'}`} referrerPolicy="no-referrer" />
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-r from-black/90 via-black/70 to-black/45' : 'bg-gradient-to-r from-white/70 via-white/55 to-white/35'}`} />
        </div>

        <div className="max-w-[1600px] mx-auto relative z-10 py-20 md:py-24">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-12">
            <div className="w-32 h-32 bg-white rounded-sm p-4 flex items-center justify-center shadow-2xl border border-line">
              <img src={logoImage} alt={headline} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>

            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-3 mb-4">
                <span className="bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-sm">
                  {roleLabel(seller.role)}
                </span>
                <div className="flex items-center space-x-2 text-white/80 text-[10px] font-black uppercase tracking-widest border border-white/20 px-3 py-1 rounded-sm">
                  <StorefrontRoleIcon size={14} className="text-accent" />
                  <span>Managed Storefront</span>
                </div>
                {seller.verified && (
                  <div className="flex items-center space-x-2 text-data text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    <span>Verified Storefront</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
                {categorySlug ? `${headline} ${titleCaseSlug(categorySlug)}` : headline}
              </h1>

              {!isEditing && (
                <>
                  <p className="text-accent/90 text-xs font-black uppercase tracking-[0.2em] mb-4">{tagline}</p>
                  <p className="text-white/70 text-sm max-w-3xl mb-8 leading-relaxed">
                    {categorySlug
                      ? `${description} This view is filtered to ${titleCaseSlug(categorySlug).toLowerCase()} inventory.`
                      : isInventoryRoute
                        ? `${description} This view surfaces the full dealer inventory archive.`
                        : description}
                  </p>
                </>
              )}

              {isEditing && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-sm mb-8 max-w-4xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Storefront Name</label>
                      <input
                        type="text"
                        value={editData.storefrontName}
                        onChange={(e) => setEditData({ ...editData, storefrontName: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Canonical Slug</label>
                      <input
                        type="text"
                        value={editData.storefrontSlug}
                        onChange={(e) => setEditData({ ...editData, storefrontSlug: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/50 break-all">
                        forestryequipmentsales.com/seller/{editData.storefrontSlug || 'your-storefront-slug'}
                      </p>
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Storefront Tagline</label>
                      <input
                        type="text"
                        value={editData.storefrontTagline}
                        onChange={(e) => setEditData({ ...editData, storefrontTagline: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-micro text-white/40 block mb-2">Storefront Description</label>
                      <textarea
                        value={editData.storefrontDescription}
                        onChange={(e) => setEditData({ ...editData, storefrontDescription: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none h-28"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Location</label>
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Website</label>
                      <input
                        type="text"
                        value={editData.website}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Phone</label>
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Logo URL</label>
                      <input
                        type="text"
                        value={editData.logo}
                        onChange={(e) => setEditData({ ...editData, logo: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">Cover Photo URL</label>
                      <input
                        type="text"
                        value={editData.coverPhotoUrl}
                        onChange={(e) => setEditData({ ...editData, coverPhotoUrl: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">SEO Title</label>
                      <input
                        type="text"
                        value={editData.seoTitle}
                        onChange={(e) => setEditData({ ...editData, seoTitle: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-micro text-white/40 block mb-2">SEO Keywords (comma-separated)</label>
                      <input
                        type="text"
                        value={editData.seoKeywordsCsv}
                        onChange={(e) => setEditData({ ...editData, seoKeywordsCsv: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-micro text-white/40 block mb-2">SEO Description</label>
                      <textarea
                        value={editData.seoDescription}
                        onChange={(e) => setEditData({ ...editData, seoDescription: e.target.value })}
                        className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm focus:border-accent outline-none h-24"
                      />
                    </div>
                  </div>

                  {saveError && <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-accent">{saveError}</p>}

                  <div className="flex flex-wrap gap-3 pt-5">
                    <button onClick={handleSaveProfile} className="btn-industrial btn-accent py-2 px-6 flex items-center">
                      <Save size={14} className="mr-2" /> Save Storefront
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-industrial bg-white/10 py-2 px-6 flex items-center">
                      <CloseIcon size={14} className="mr-2" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="flex flex-col">
                  <span className="label-micro text-white/40 mb-1">Location</span>
                  <div className="flex items-center text-sm font-bold">
                    <MapPin size={14} className="mr-2 text-accent" />
                    {seller.location || 'Unknown'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="label-micro text-white/40 mb-1">Rating</span>
                  <div className="flex items-center text-sm font-bold">
                    <Star size={14} className="mr-2 text-accent" fill="currentColor" />
                    {seller.rating} / 5.0
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="label-micro text-white/40 mb-1">Active Equipment</span>
                  <div className="flex items-center text-sm font-bold">
                    <Package size={14} className="mr-2 text-accent" />
                    {filteredListings.length} Units
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="label-micro text-white/40 mb-1">Member Since</span>
                  <div className="flex items-center text-sm font-bold">
                    <Clock size={14} className="mr-2 text-accent" />
                    {new Date(seller.memberSince).getFullYear()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4 w-full md:w-auto">
              {canEditStorefront && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-industrial bg-white text-ink py-4 px-12 hover:bg-accent hover:text-white"
                >
                  <Edit3 size={16} className="mr-3" />
                  Edit Storefront
                </button>
              )}
              {isOwner && !canManageOwnStorefront && (
                <div className="border border-white/20 bg-white/5 p-4 rounded-sm text-[10px] font-black uppercase tracking-widest text-white/70">
                  Storefront branding is available for Owner-Operator, Dealer, Pro Dealer, Admin, and Super Admin roles.
                </div>
              )}
              <a href={sellerEmailHref || '/contact'} className="btn-industrial btn-accent py-4 px-12">
                <MessageSquare size={16} className="mr-3" />
                Contact Storefront
              </a>
              <div className="flex space-x-2">
                <a
                  href={sellerPhoneHref || undefined}
                  className={`btn-industrial flex-1 py-3 bg-white/10 border-white/20 hover:bg-white hover:text-ink ${sellerPhoneHref ? '' : 'pointer-events-none opacity-50'}`}
                >
                  <Phone size={14} className="mr-2" />
                  Call
                </a>
                <a
                  href={sellerWebsiteHref || undefined}
                  target={sellerWebsiteHref ? '_blank' : undefined}
                  rel={sellerWebsiteHref ? 'noopener noreferrer' : undefined}
                  className={`btn-industrial flex-1 py-3 bg-white/10 border-white/20 hover:bg-white hover:text-ink ${sellerWebsiteHref ? '' : 'pointer-events-none opacity-50'}`}
                >
                  <Globe size={14} className="mr-2" />
                  Site
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-end mb-16 border-b border-line pb-8">
          <div>
            <span className="label-micro text-accent mb-2 block">Storefront Inventory</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter">
              {categorySlug ? `${titleCaseSlug(categorySlug)} ` : 'Current '}<span className="text-muted">Equipment</span>
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">{filteredListings.length} Results</span>
          </div>
        </div>

        {storefrontCategoryLinks.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              to={`${preferredDealerPath}/inventory`}
              className={`px-4 py-2 border text-[10px] font-black uppercase tracking-widest transition-colors ${isInventoryRoute && !categorySlug ? 'border-accent text-accent' : 'border-line hover:border-accent hover:text-accent'}`}
            >
              All Inventory ({listings.length})
            </Link>
            {storefrontCategoryLinks.map((category) => (
              <Link
                key={category.label}
                to={category.path}
                className={`px-4 py-2 border text-[10px] font-black uppercase tracking-widest transition-colors ${categorySlug === normalizeSeoSlug(category.label) ? 'border-accent text-accent' : 'border-line hover:border-accent hover:text-accent'}`}
              >
                {category.label} ({category.count})
              </Link>
            ))}
          </div>
        ) : null}

        <div className="industrial-grid">
          {filteredListings.map((listing) => {
            const nid = normalizeListingId(listing.id);
            return (
              <div key={listing.id}>
                <ListingCard
                  listing={listing}
                  isFavorite={!!nid && favoriteIds.includes(nid)}
                  isComparing={!!nid && compareList.includes(nid)}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleCompare={toggleCompare}
                />
              </div>
            );
          })}
        </div>

        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-bg px-6 py-3 rounded-sm shadow-2xl flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest">{compareList.length} selected</span>
            <Link
              to={`/compare?ids=${compareList.join(',')}`}
              className="btn-industrial btn-accent px-4 py-2 text-[10px]"
            >
              Compare
            </Link>
            <button onClick={() => setCompareList([])} className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-bg">
              Clear
            </button>
          </div>
        )}
      </section>

      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
