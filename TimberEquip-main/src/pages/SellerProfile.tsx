import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { db } from '../firebase';

const ENTERPRISE_STOREFRONT_ROLES = new Set(['dealer', 'dealer_manager', 'admin', 'super_admin']);

function roleLabel(role?: string): string {
  switch (role) {
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
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [editData, setEditData] = useState({
    storefrontName: '',
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

  const isOwner = currentUser?.uid === id;
  const ownerCanManageStorefront = Boolean(currentUser?.role && ENTERPRISE_STOREFRONT_ROLES.has(currentUser.role));

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [sellerData, listingsData] = await Promise.all([
          equipmentService.getSeller(id),
          equipmentService.getListings({ sellerUid: id }),
        ]);

        if (sellerData) {
          setSeller({
            ...sellerData,
            totalListings: listingsData.length,
          });

          const keywords = Array.isArray(sellerData.seoKeywords) ? sellerData.seoKeywords.join(', ') : '';
          setEditData({
            storefrontName: sellerData.storefrontName || sellerData.name || '',
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const seoTitle = useMemo(() => {
    if (!seller) return 'Dealer Storefront | TimberEquip.com';
    return seller.seoTitle || `${seller.storefrontName || seller.name} | ${roleLabel(seller.role)} | TimberEquip.com`;
  }, [seller]);

  const seoDescription = useMemo(() => {
    if (!seller) return 'Browse seller storefront inventory on TimberEquip.com.';
    return (
      seller.seoDescription ||
      seller.storefrontDescription ||
      `${seller.storefrontName || seller.name} storefront on TimberEquip.com. Browse inventory, contact details, and active listings.`
    );
  }, [seller]);

  const storefrontIcon = roleIcon(seller?.role);

  const handleSaveProfile = async () => {
    if (!id || !isOwner || !ownerCanManageStorefront || !currentUser?.role) return;

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
      await userService.updateProfile(id, {
        displayName: storefrontName,
        about: editData.storefrontDescription.trim(),
        location: editData.location.trim(),
        photoURL: editData.logo.trim(),
        phoneNumber: editData.phone.trim(),
      });

      const storefrontRef = doc(db, 'storefronts', id);
      const storefrontSnap = await getDoc(storefrontRef);
      const createdAt = storefrontSnap.exists()
        ? storefrontSnap.data()?.createdAt || serverTimestamp()
        : serverTimestamp();

      await setDoc(
        storefrontRef,
        {
          uid: id,
          role: currentUser.role,
          storefrontEnabled: true,
          storefrontName,
          storefrontTagline: editData.storefrontTagline.trim(),
          storefrontDescription: editData.storefrontDescription.trim(),
          displayName: storefrontName,
          location: editData.location.trim(),
          phone: editData.phone.trim(),
          email: editData.email.trim(),
          website: editData.website.trim(),
          logo: editData.logo.trim(),
          coverPhotoUrl: editData.coverPhotoUrl.trim(),
          seoTitle: editData.seoTitle.trim(),
          seoDescription: editData.seoDescription.trim(),
          seoKeywords,
          createdAt,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSeller((prev) =>
        prev
          ? {
              ...prev,
              name: storefrontName,
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

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating storefront profile:', error);
      setSaveError('Unable to save storefront profile right now.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
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
  const tagline = seller.storefrontTagline || 'Enterprise storefront built for machine-level attribution, lead capture, and catalog-grade inventory branding.';
  const description = seller.storefrontDescription || 'This storefront is managed on TimberEquip.com with inventory analytics, verified seller controls, and lead routing.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: headline,
    url: `https://timberequip.com/seller/${seller.id}`,
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
        canonicalPath={`/seller/${seller.id}`}
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
                  <span>Enterprise Storefront</span>
                </div>
                {seller.verified && (
                  <div className="flex items-center space-x-2 text-data text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    <span>Verified Storefront</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
                {headline}
              </h1>

              {!isEditing && (
                <>
                  <p className="text-accent/90 text-xs font-black uppercase tracking-[0.2em] mb-4">{tagline}</p>
                  <p className="text-white/70 text-sm max-w-3xl mb-8 leading-relaxed">{description}</p>
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
                    {listings.length} Units
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
              {isOwner && ownerCanManageStorefront && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-industrial bg-white text-ink py-4 px-12 hover:bg-accent hover:text-white"
                >
                  <Edit3 size={16} className="mr-3" />
                  Edit Storefront
                </button>
              )}
              {isOwner && !ownerCanManageStorefront && (
                <div className="border border-white/20 bg-white/5 p-4 rounded-sm text-[10px] font-black uppercase tracking-widest text-white/70">
                  Storefront branding is available for Dealer, Pro Dealer, Admin, and Super Admin roles.
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
              Current <span className="text-muted">Equipment</span>
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">{listings.length} Results</span>
          </div>
        </div>

        <div className="industrial-grid">
          {listings.map((listing) => (
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
                Enterprise storefront pages are indexed for machine-intent search and structured for high-intent buyer discovery.
              </p>
              <div className="mt-auto flex items-end space-x-2">
                <span className="text-3xl font-black tracking-tighter">Enterprise</span>
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
