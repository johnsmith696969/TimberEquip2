import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Globe,
  ShieldCheck,
  Star,
  Clock,
  Package,
  TrendingUp,
  Activity,
  MessageSquare,
  CheckCircle2,
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
import { Seller, Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { Seo } from '../components/Seo';
import { buildDealerPath, getListingCategoryLabel, isDealerRole, normalizeSeoSlug, titleCaseSlug } from '../utils/seoRoutes';

const STOREFRONT_EDIT_ROLES = new Set(['individual_seller', 'dealer', 'dealer_manager', 'admin', 'super_admin']);
const STOREFRONT_ADMIN_ROLES = new Set(['admin', 'super_admin', 'developer']);

function roleLabel(role?: string): string {
  switch (role) {
    case 'individual_seller':
      return 'Owner Operator';
    case 'dealer':
      return 'Dealer';
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

export function SellerProfile() {
  const { id, categorySlug } = useParams<{ id: string; categorySlug?: string }>();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');

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
    if (!seller) return 'Dealer Storefront | TimberEquip.com';
    const headline = seller.storefrontName || seller.name;
    if (isDealerRoute && categorySlug) {
      return `${headline} ${titleCaseSlug(categorySlug)} Inventory | TimberEquip.com`;
    }
    if (isDealerRoute && isInventoryRoute) {
      return `${headline} Inventory | TimberEquip.com`;
    }
    return seller.seoTitle || `${headline} | ${roleLabel(seller.role)} | TimberEquip.com`;
  }, [seller, isDealerRoute, categorySlug, isInventoryRoute]);

  const seoDescription = useMemo(() => {
    if (!seller) return 'Browse seller storefront inventory on TimberEquip.com.';
    const headline = seller.storefrontName || seller.name;
    if (isDealerRoute && categorySlug) {
      return `Browse ${titleCaseSlug(categorySlug).toLowerCase()} inventory from ${headline} on TimberEquip.`;
    }
    if (isDealerRoute && isInventoryRoute) {
      return `Browse live inventory from ${headline} on TimberEquip.`;
    }
    return (
      seller.seoDescription ||
      seller.storefrontDescription ||
      `${headline} storefront on TimberEquip.com. Browse inventory, contact details, and active listings.`
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

  const coverImage = seller.coverPhotoUrl || 'https://picsum.photos/seed/timberequip-storefront/1920/720';
  const logoImage = seller.logo || 'https://picsum.photos/seed/timberequip-logo/260/260';
  const headline = seller.storefrontName || seller.name;
  const tagline = seller.storefrontTagline || 'Managed storefront built for serious machine visibility, direct buyer contact, and clean inventory presentation.';
  const description = seller.storefrontDescription || 'This storefront is managed on TimberEquip.com with branded inventory, verified seller controls, and direct lead routing.';
  const preferredDealerPath = buildDealerPath(seller);
  const canonicalPath = (() => {
    if (isDealerRoute) {
      if (categorySlug) return `${preferredDealerPath}/${categorySlug}`;
      if (isInventoryRoute) return `${preferredDealerPath}/inventory`;
      return preferredDealerPath;
    }

    if (isDealerRole(seller.role)) {
      return preferredDealerPath;
    }

    return `/seller/${seller.storefrontSlug || seller.id}`;
  })();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: headline,
    url: `https://timberequip.com${canonicalPath}`,
    logo: logoImage,
    description,
    email: seller.email || undefined,
    telephone: seller.phone || undefined,
    address: seller.location || undefined,
  };

  const StorefrontRoleIcon = storefrontIcon;

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />

      <section className="text-white px-4 md:px-8 relative overflow-hidden border-b border-line">
        <div className="absolute inset-0">
          <img src={coverImage} alt={`${headline} cover`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/45" />
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
                        timberequip.com/seller/{editData.storefrontSlug || 'your-storefront-slug'}
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
                  Storefront branding is available for Owner Operator, Dealer, Pro Dealer, Admin, and Super Admin roles.
                </div>
              )}
              <button className="btn-industrial btn-accent py-4 px-12">
                <MessageSquare size={16} className="mr-3" />
                Contact Storefront
              </button>
              <div className="flex space-x-2">
                <button className="btn-industrial flex-1 py-3 bg-white/10 border-white/20 hover:bg-white hover:text-ink">
                  <Phone size={14} className="mr-2" />
                  Call
                </button>
                <button className="btn-industrial flex-1 py-3 bg-white/10 border-white/20 hover:bg-white hover:text-ink">
                  <Globe size={14} className="mr-2" />
                  Site
                </button>
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

        <div className="industrial-grid">
          {filteredListings.map((listing) => (
            <div key={listing.id}>
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-surface px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 bg-line border border-line">
            <div className="bg-bg p-12 flex flex-col">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-sm w-fit mb-8">
                <TrendingUp size={24} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4">Storefront Performance</h4>
              <p className="text-xs text-muted leading-relaxed mb-8">
                Storefront pages are structured for launch-ready machine search visibility and high-intent buyer discovery.
              </p>
              <div className="mt-auto flex items-end space-x-2">
                <span className="text-3xl font-black tracking-tighter">Managed</span>
                <span className="text-[10px] font-bold text-muted uppercase mb-1.5">Tier</span>
              </div>
            </div>

            <div className="bg-bg p-12 flex flex-col">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-sm w-fit mb-8">
                <Activity size={24} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4">Lead Routing</h4>
              <p className="text-xs text-muted leading-relaxed mb-8">
                Traffic campaigns and listing SEO can direct buyers to your branded storefront where inventory and contact workflows are unified.
              </p>
              <div className="mt-auto flex items-end space-x-2">
                <span className="text-3xl font-black tracking-tighter">Unified</span>
                <span className="text-[10px] font-bold text-muted uppercase mb-1.5">Attribution</span>
              </div>
            </div>

            <div className="bg-bg p-12 flex flex-col">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-sm w-fit mb-8">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4">Brand Control</h4>
              <p className="text-xs text-muted leading-relaxed mb-8">
                Configure storefront logo, cover image, profile messaging, and SEO metadata from one managed profile.
              </p>
              <div className="mt-auto flex items-center space-x-2 text-data">
                <CheckCircle2 size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Storefront Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
