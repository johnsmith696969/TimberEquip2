import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Copy,
  Database,
  Eye,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { ListingModal } from '../components/admin/ListingModal';
import { BulkImportToolkit } from '../components/BulkImportToolkit';
import {
  dealerFeedService,
  type DealerFeedIngestResult,
  type DealerFeedItem,
  type DealerFeedLog,
  type DealerFeedProfile,
} from '../services/dealerFeedService';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import { type Inquiry, type Listing, type Seller } from '../types';
import { buildListingPath } from '../utils/listingPath';
import { getListingCapDisplayLabel } from '../utils/listingCaps';
import { canAccessDealerOs, getDealerInventoryOwnerUid, getFeaturedListingCap, getManagedListingCap } from '../utils/sellerAccess';
import { Seo } from '../components/Seo';
import { NOINDEX_ROBOTS } from '../utils/listingPath';
import { useLocale } from '../components/LocaleContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  buildDealerFeedApiCurlSnippet,
  buildDealerFeedSampleUrl,
  DEALER_FEED_SETUP_META,
  type DealerFeedSetupMode,
  getDealerFeedSetupLabel,
  getDealerFeedSetupModeFromProfile,
  getDealerFeedSamplePayload,
  inferDealerFeedSetupModeFromFileName,
} from '../utils/dealerFeedSetup';

type InventoryFilter = 'all' | 'live' | 'featured' | 'imported' | 'sold';
type LeadFilter = 'all' | 'new' | 'working' | 'closed';

function formatLogTime(value: DealerFeedLog['processedAt'] | DealerFeedLog['createdAt']) {
  if (!value) return '—';
  if (typeof value === 'object' && value && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }
  const resolved = new Date(value as string | number);
  return Number.isNaN(resolved.getTime()) ? '—' : resolved.toLocaleString();
}

function isImportedListing(listing: Listing): boolean {
  return !!listing.externalSource?.sourceName;
}

export function DealerOS() {
  const { user } = useAuth();
  const { formatPrice } = useLocale();
  const { confirm: showConfirm, dialogProps } = useConfirmDialog();
  const ownerUid = getDealerInventoryOwnerUid(user);
  const featuredCap = getFeaturedListingCap(user);
  const dealerAccess = canAccessDealerOs(user);

  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [logs, setLogs] = useState<DealerFeedLog[]>([]);
  const [profiles, setProfiles] = useState<DealerFeedProfile[]>([]);
  const [storefrontProfile, setStorefrontProfile] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [savingListing, setSavingListing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [seatSummary, setSeatSummary] = useState<{ seatLimit: number; seatCount: number }>({ seatLimit: 0, seatCount: 0 });

  const [feedMode, setFeedMode] = useState<DealerFeedSetupMode>('json');
  const [feedSourceName, setFeedSourceName] = useState('DealerOS Import');
  const [feedRawInput, setFeedRawInput] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedFileName, setFeedFileName] = useState('');
  const [feedDryRun, setFeedDryRun] = useState(true);
  const [feedPreviewItems, setFeedPreviewItems] = useState<DealerFeedItem[]>([]);
  const [feedPreviewType, setFeedPreviewType] = useState<'json' | 'xml' | 'csv' | ''>('');
  const [feedPreviewCount, setFeedPreviewCount] = useState(0);
  const [feedResult, setFeedResult] = useState<DealerFeedIngestResult | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [currentProfileId, setCurrentProfileId] = useState('');
  const [feedNightlySyncEnabled, setFeedNightlySyncEnabled] = useState(true);
  const [activeFeedProfile, setActiveFeedProfile] = useState<DealerFeedProfile | null>(null);
  const [syndicationNotice, setSyndicationNotice] = useState('');
  const [syndicationError, setSyndicationError] = useState('');
  const [feedCredentialNotice, setFeedCredentialNotice] = useState('');
  const [feedCredentialError, setFeedCredentialError] = useState('');
  const [revealingFeedCredentials, setRevealingFeedCredentials] = useState(false);
  const feedFileInputRef = useRef<HTMLInputElement | null>(null);

  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [selectedInquiryId, setSelectedInquiryId] = useState('');
  const [leadActionLoading, setLeadActionLoading] = useState(false);
  const [leadActionError, setLeadActionError] = useState('');
  const [leadActionSuccess, setLeadActionSuccess] = useState('');

  /* Widget Builder state */
  const [widgetCardStyle, setWidgetCardStyle] = useState<'fes-native' | 'grid' | 'list' | 'compact'>('fes-native');
  const [widgetAccentColor, setWidgetAccentColor] = useState('#16A34A');
  const [widgetFontFamily, setWidgetFontFamily] = useState('');
  const [widgetDarkMode, setWidgetDarkMode] = useState(false);
  const [widgetShowInquiry, setWidgetShowInquiry] = useState(true);
  const [widgetShowCall, setWidgetShowCall] = useState(true);
  const [widgetShowDetails, setWidgetShowDetails] = useState(true);
  const [widgetPageSize, setWidgetPageSize] = useState(12);
  const [widgetSaving, setWidgetSaving] = useState(false);
  const [widgetNotice, setWidgetNotice] = useState('');
  const [widgetError, setWidgetError] = useState('');
  const [widgetConfigLoaded, setWidgetConfigLoaded] = useState(false);

  /* Webhook state */
  const [webhooks, setWebhooks] = useState<Array<{ id: string; callbackUrl: string; events: string[]; active: boolean; secretMasked: string; failureCount: number }>>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['listing.created', 'listing.updated', 'listing.sold', 'listing.deleted']);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookNotice, setWebhookNotice] = useState('');
  const [webhookError, setWebhookError] = useState('');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [leadNoteDraft, setLeadNoteDraft] = useState('');
  const loadDealerOsData = async () => {
    if (!ownerUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError('');
    try {
      const [inventory, leads, feedLogs, managedSeats, savedProfiles, sellerProfile] = await Promise.all([
        equipmentService.getSellerListings(ownerUid, { includeSold: true }),
        equipmentService.getInquiries(ownerUid),
        dealerFeedService.getRecentLogs(12, ownerUid),
        userService.getManagedAccountSeatContext(ownerUid),
        dealerFeedService.getSavedProfiles(ownerUid),
        equipmentService.getSeller(ownerUid),
      ]);

      setListings(inventory);
      setInquiries(leads);
      setLogs(feedLogs);
      setSeatSummary({ seatLimit: managedSeats.seatLimit, seatCount: managedSeats.seatCount });
      setProfiles(savedProfiles);
      setStorefrontProfile(sellerProfile || null);

      /* Load widget config + webhooks in background */
      dealerFeedService.getWidgetConfig(ownerUid).then((cfg) => {
        if (cfg.cardStyle) setWidgetCardStyle(cfg.cardStyle as typeof widgetCardStyle);
        if (cfg.accentColor) setWidgetAccentColor(String(cfg.accentColor));
        if (cfg.fontFamily) setWidgetFontFamily(String(cfg.fontFamily));
        if (typeof cfg.darkMode === 'boolean') setWidgetDarkMode(cfg.darkMode);
        if (typeof cfg.showInquiry === 'boolean') setWidgetShowInquiry(cfg.showInquiry);
        if (typeof cfg.showCall === 'boolean') setWidgetShowCall(cfg.showCall);
        if (typeof cfg.showDetails === 'boolean') setWidgetShowDetails(cfg.showDetails);
        if (cfg.pageSize) setWidgetPageSize(Number(cfg.pageSize));
        setWidgetConfigLoaded(true);
      }).catch(() => setWidgetConfigLoaded(true));

      dealerFeedService.getWebhooks(ownerUid).then((wh) => setWebhooks(wh)).catch(() => {});
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'DealerOS could not load yet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDealerOsData();
  }, [ownerUid, user?.uid, user?.role]);

  useEffect(() => {
    if (inquiries.length === 0) {
      if (selectedInquiryId) setSelectedInquiryId('');
      return;
    }

    if (!selectedInquiryId || !inquiries.some((inquiry) => inquiry.id === selectedInquiryId)) {
      setSelectedInquiryId(inquiries[0].id);
    }
  }, [inquiries, selectedInquiryId]);

  useEffect(() => {
    if (!currentProfileId) {
      setActiveFeedProfile(null);
      return;
    }

    const matchedProfile = profiles.find((profile) => profile.id === currentProfileId) || null;
    setActiveFeedProfile((current) => {
      if (!matchedProfile) {
        return current?.id === currentProfileId ? current : null;
      }
      if (current?.id === matchedProfile.id) {
        return {
          ...matchedProfile,
          apiKey: current.apiKey || '',
          webhookSecret: current.webhookSecret || '',
        };
      }
      return matchedProfile;
    });
  }, [currentProfileId, profiles]);

  const activeListings = useMemo(
    () => listings.filter((listing) => String(listing.status || 'active').toLowerCase() === 'active'),
    [listings]
  );
  const finiteListingCap = getManagedListingCap(user);
  const remainingListingSlots = finiteListingCap === null ? null : Math.max(finiteListingCap - activeListings.length, 0);
  const listingAllowanceText = finiteListingCap !== null
    ? `${getListingCapDisplayLabel(finiteListingCap, 'managed listing', 'managed listings')} - ${remainingListingSlots} remaining`
    : 'Unlimited managed listings';
  const featuredListings = useMemo(
    () => activeListings.filter((listing) => !!listing.featured),
    [activeListings]
  );
  const importedListings = useMemo(
    () => listings.filter((listing) => isImportedListing(listing)),
    [listings]
  );
  const newLeadCount = useMemo(
    () => inquiries.filter((inquiry) => inquiry.status === 'New').length,
    [inquiries]
  );
  const listingLookup = useMemo(
    () => new Map(listings.map((listing) => [listing.id, listing])),
    [listings]
  );
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      if (leadFilter === 'new') return inquiry.status === 'New';
      if (leadFilter === 'working') return ['Contacted', 'Qualified', 'Won'].includes(inquiry.status);
      if (leadFilter === 'closed') return ['Lost', 'Closed'].includes(inquiry.status);
      return true;
    });
  }, [inquiries, leadFilter]);
  const selectedInquiry = useMemo(
    () => inquiries.find((inquiry) => inquiry.id === selectedInquiryId) || null,
    [inquiries, selectedInquiryId]
  );
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://timberequip.com';
  const publicDealerId = storefrontProfile?.storefrontSlug || ownerUid;
  const publicDealerPageUrl = publicDealerId ? `${appOrigin}/dealers/${encodeURIComponent(publicDealerId)}` : '';
  const publicDealerFeedUrl = publicDealerId ? `${appOrigin}/api/public/dealers/${encodeURIComponent(publicDealerId)}/feed.json` : '';
  const publicDealerEmbedUrl = publicDealerId ? `${appOrigin}/api/public/dealers/${encodeURIComponent(publicDealerId)}/embed?limit=12` : '';
  const publicDealerEmbedScriptUrl = `${appOrigin}/api/public/dealer-embed.js`;
  const embedScriptSnippet = publicDealerId
    ? `<div id="forestryequipmentsales-dealer-inventory"></div>\n<script src="${publicDealerEmbedScriptUrl}" data-dealer="${publicDealerId}" data-target="forestryequipmentsales-dealer-inventory" data-limit="12" data-featured-only="false" data-height="980"></script>`
    : '';
  const iframeSnippet = publicDealerId
    ? `<iframe src="${publicDealerEmbedUrl}" loading="lazy" style="width:100%;min-height:980px;border:0;" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    : '';
  const currentFeedCurlSnippet = activeFeedProfile?.ingestUrl
    ? buildDealerFeedApiCurlSnippet({
        ingestUrl: activeFeedProfile.ingestUrl,
        apiKey: activeFeedProfile.apiKey || '',
        sourceType: activeFeedProfile.sourceType === 'csv' ? 'csv' : 'json',
      })
    : '';

  const formatDateLabel = (value?: string | null) => {
    if (!value) return 'Date unavailable';
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return 'Date unavailable';
    return new Date(parsed).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return listings.filter((listing) => {
      if (inventoryFilter === 'live' && String(listing.status || 'active').toLowerCase() !== 'active') return false;
      if (inventoryFilter === 'featured' && !listing.featured) return false;
      if (inventoryFilter === 'imported' && !isImportedListing(listing)) return false;
      if (inventoryFilter === 'sold' && String(listing.status || 'active').toLowerCase() !== 'sold') return false;

      if (!normalizedQuery) return true;
      const haystack = [
        listing.title,
        listing.make,
        listing.manufacturer,
        listing.model,
        listing.stockNumber,
        listing.location,
        listing.externalSource?.sourceName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [inventoryFilter, listings, searchQuery]);

  const handleSaveListing = async (formData: Partial<Listing>) => {
    setSavingListing(true);
    setActionError('');
    try {
      if (editingListing) {
        await equipmentService.updateListing(editingListing.id, {
          ...formData,
          sellerUid: ownerUid,
          sellerId: ownerUid,
        });
      } else {
        await equipmentService.addListing({
          ...(formData as Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'approvalStatus' | 'approvedBy'>),
          sellerUid: ownerUid,
          sellerId: ownerUid,
        });
      }

      setIsModalOpen(false);
      setEditingListing(null);
      await loadDealerOsData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save this listing.');
      throw error;
    } finally {
      setSavingListing(false);
    }
  };

  const handleDeleteListing = async (listing: Listing) => {
    const ok = await showConfirm({ title: 'Confirm Delete', message: `Delete ${listing.title}? This cannot be undone.`, variant: 'danger', confirmLabel: 'Delete', cancelLabel: 'Cancel' });
    if (!ok) {
      return;
    }

    setActionError('');
    try {
      await equipmentService.deleteListing(listing.id);
      await loadDealerOsData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete this listing.');
    }
  };

  const handleToggleFeatured = async (listing: Listing) => {
    setActionError('');
    if (!listing.featured && featuredCap > 0 && featuredListings.length >= featuredCap) {
      setActionError(`This account can feature up to ${featuredCap} active ${featuredCap === 1 ? 'listing' : 'listings'}.`);
      return;
    }

    try {
      await equipmentService.updateListing(listing.id, { featured: !listing.featured, sellerUid: ownerUid, sellerId: ownerUid });
      await loadDealerOsData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update featured selection.');
    }
  };

  const clearFeedPreviewState = () => {
    setFeedPreviewItems([]);
    setFeedPreviewCount(0);
    setFeedPreviewType('');
  };

  const resetFeedPreview = () => {
    clearFeedPreviewState();
    setFeedResult(null);
    setFeedError('');
  };

  const handleFeedFileSelected = async (file?: File | null) => {
    if (!file) return;

    try {
      const inferredMode = inferDealerFeedSetupModeFromFileName(file.name, feedMode === 'url' ? 'json' : feedMode);
      const text = await file.text();
      setFeedMode(inferredMode);
      setFeedRawInput(text);
      setFeedFileName(file.name);
      setFeedError('');
      setProfileError('');
      resetFeedPreview();
      if (!feedSourceName.trim() || feedSourceName === 'DealerOS Import') {
        setFeedSourceName(file.name.replace(/\.[^.]+$/u, '') || 'DealerOS Import');
      }
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Unable to read the selected feed file.');
    }
  };

  const handleLoadFeedProfile = (profile: DealerFeedProfile) => {
    setCurrentProfileId(profile.id);
    setActiveFeedProfile(profile);
    setFeedSourceName(profile.sourceName);
    setFeedMode(getDealerFeedSetupModeFromProfile(profile));
    setFeedRawInput(profile.rawInput || '');
    setFeedUrl(profile.feedUrl || '');
    setFeedFileName('');
    setFeedNightlySyncEnabled(profile.nightlySyncEnabled);
    setProfileError('');
    setFeedCredentialError('');
    setFeedCredentialNotice('');
    resetFeedPreview();
  };

  const handleSaveFeedProfile = async () => {
    if (!ownerUid) return;
    if (!feedSourceName.trim()) {
      setProfileError('Source name is required before saving a feed profile.');
      return;
    }
    if (feedMode === 'url' && !feedUrl.trim()) {
      setProfileError('Add a feed URL before saving this profile.');
      return;
    }
    if (feedMode !== 'url' && !feedRawInput.trim()) {
      setProfileError('Add a payload before saving this profile.');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    try {
      const savedProfile = await dealerFeedService.saveProfile({
        id: currentProfileId || undefined,
        sellerUid: ownerUid,
        sourceName: feedSourceName.trim(),
        sourceType: DEALER_FEED_SETUP_META[feedMode].sourceType,
        rawInput: feedMode === 'url' ? '' : feedRawInput,
        feedUrl: feedMode === 'url' ? feedUrl.trim() : '',
        nightlySyncEnabled: feedNightlySyncEnabled,
      });

      const refreshedProfiles = await dealerFeedService.getSavedProfiles(ownerUid);
      setProfiles(refreshedProfiles);
      setCurrentProfileId(savedProfile.id);
      setActiveFeedProfile(savedProfile);
      setSyndicationNotice('');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save this feed profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteFeedProfile = async (profile: DealerFeedProfile) => {
    if (!ownerUid) return;
    const ok = await showConfirm({ title: 'Confirm Delete', message: `Delete the feed profile "${profile.sourceName}"?`, variant: 'danger', confirmLabel: 'Delete', cancelLabel: 'Cancel' });
    if (!ok) {
      return;
    }

    setProfileError('');
    try {
      await dealerFeedService.deleteProfile(profile.id);
      const refreshedProfiles = await dealerFeedService.getSavedProfiles(ownerUid);
      setProfiles(refreshedProfiles);
      if (currentProfileId === profile.id) {
        setCurrentProfileId('');
        setActiveFeedProfile(null);
        setFeedFileName('');
        setFeedNightlySyncEnabled(true);
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to delete this feed profile.');
    }
  };

  const handleToggleProfileNightlySync = async (profile: DealerFeedProfile) => {
    if (!ownerUid) return;

    setProfileSaving(true);
    setProfileError('');
    try {
      await dealerFeedService.updateProfile(profile.id, {
        nightlySyncEnabled: !profile.nightlySyncEnabled,
      });
      const refreshedProfiles = await dealerFeedService.getSavedProfiles(ownerUid);
      setProfiles(refreshedProfiles);
      if (currentProfileId === profile.id) {
        setFeedNightlySyncEnabled(!profile.nightlySyncEnabled);
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to update nightly sync settings.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleResolveFeed = async (): Promise<DealerFeedItem[]> => {
    if (!feedSourceName.trim()) {
      setFeedError('Source name is required.');
      return [];
    }
    if (feedMode === 'url' && !feedUrl.trim()) {
      setFeedError('Feed URL is required.');
      return [];
    }
    if (feedMode !== 'url' && !feedRawInput.trim()) {
      setFeedError('Feed payload is required.');
      return [];
    }

    setFeedLoading(true);
    setFeedError('');
    setFeedResult(null);
    try {
      const resolved = await dealerFeedService.resolveSource({
        sourceName: feedSourceName.trim(),
        sourceType: DEALER_FEED_SETUP_META[feedMode].sourceType,
        rawInput: feedMode === 'url' ? undefined : feedRawInput,
        feedUrl: feedMode === 'url' ? feedUrl.trim() : undefined,
      });

      setFeedPreviewItems(resolved.items);
      setFeedPreviewCount(resolved.itemCount);
      setFeedPreviewType(resolved.detectedType);
      return resolved.items;
    } catch (error) {
      clearFeedPreviewState();
      setFeedError(error instanceof Error ? error.message : 'Unable to parse this feed source.');
      return [];
    } finally {
      setFeedLoading(false);
    }
  };

  const handleRunImport = async () => {
    const items = feedPreviewItems.length > 0 ? feedPreviewItems : await handleResolveFeed();
    if (items.length === 0) return;

    setFeedLoading(true);
    setFeedError('');
    try {
      const result = await dealerFeedService.ingest({
        sourceName: feedSourceName.trim(),
        dealerId: ownerUid,
        dryRun: feedDryRun,
        items,
      });
      setFeedResult(result);
      await loadDealerOsData();
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Feed import failed.');
    } finally {
      setFeedLoading(false);
    }
  };

  const handleUseSampleFeed = (mode: DealerFeedSetupMode) => {
    setFeedMode(mode);
    setFeedFileName('');
    setFeedError('');
    setProfileError('');
    setFeedResult(null);
    if (!feedSourceName.trim() || feedSourceName === 'DealerOS Import') {
      setFeedSourceName(mode === 'url' ? 'Sample Feed URL' : `Sample ${DEALER_FEED_SETUP_META[mode].label}`);
    }
    if (mode === 'url') {
      setFeedUrl(buildDealerFeedSampleUrl(appOrigin, 'json'));
      setFeedRawInput('');
    } else {
      setFeedRawInput(getDealerFeedSamplePayload(mode));
      setFeedUrl('');
    }
    clearFeedPreviewState();
  };

  const handleRevealFeedCredentials = async () => {
    if (!currentProfileId) {
      setFeedCredentialError('Save a feed profile first to generate API credentials.');
      return;
    }

    setRevealingFeedCredentials(true);
    setFeedCredentialError('');
    setFeedCredentialNotice('');
    try {
      const detailedProfile = await dealerFeedService.getProfile(currentProfileId, { includeSecrets: true });
      setActiveFeedProfile(detailedProfile);
      setFeedCredentialNotice('Feed credentials loaded for setup and copy/paste.');
    } catch (error) {
      setFeedCredentialError(error instanceof Error ? error.message : 'Unable to load the API credentials for this feed.');
    } finally {
      setRevealingFeedCredentials(false);
    }
  };

  const handleCopyFeedCredential = async (value: string, label: string) => {
    if (!value) {
      setFeedCredentialError(`${label} is not available yet.`);
      setFeedCredentialNotice('');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setFeedCredentialNotice(`${label} copied.`);
      setFeedCredentialError('');
    } catch (error) {
      setFeedCredentialError(error instanceof Error ? error.message : `Unable to copy ${label.toLowerCase()}.`);
      setFeedCredentialNotice('');
    }
  };

  const handleInquiryStatusChange = async (status: Inquiry['status']) => {
    if (!selectedInquiry) return;

    setLeadActionLoading(true);
    setLeadActionError('');
    setLeadActionSuccess('');
    try {
      await equipmentService.updateInquiryStatus(selectedInquiry.id, status);
      await loadDealerOsData();
      setLeadActionSuccess(`Lead marked ${status}.`);
    } catch (error) {
      setLeadActionError(error instanceof Error ? error.message : 'Unable to update lead status.');
    } finally {
      setLeadActionLoading(false);
    }
  };

  const handleAssignLeadToCurrentUser = async () => {
    if (!selectedInquiry || !user?.uid) return;

    setLeadActionLoading(true);
    setLeadActionError('');
    setLeadActionSuccess('');
    try {
      await equipmentService.assignInquiry(
        selectedInquiry.id,
        user.uid,
        user.displayName || user.storefrontName || user.company || 'Dealer Team'
      );
      await loadDealerOsData();
      setLeadActionSuccess('Lead assigned to your account.');
    } catch (error) {
      setLeadActionError(error instanceof Error ? error.message : 'Unable to assign this lead.');
    } finally {
      setLeadActionLoading(false);
    }
  };

  const handleAddLeadNote = async () => {
    if (!selectedInquiry) return;
    const text = leadNoteDraft.trim();
    if (!text) {
      setLeadActionError('Enter a note before saving it to the lead.');
      return;
    }

    setLeadActionLoading(true);
    setLeadActionError('');
    setLeadActionSuccess('');
    try {
      const optimisticNote = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        authorUid: user?.uid,
        authorName: user?.displayName || user?.storefrontName || user?.company || 'Dealer Team',
        createdAt: new Date().toISOString(),
      };
      await equipmentService.addInquiryInternalNote(selectedInquiry.id, {
        text,
        authorUid: user?.uid,
        authorName: user?.displayName || user?.storefrontName || user?.company || 'Dealer Team',
      });
      setInquiries((prev) => prev.map((entry) => (
        entry.id === selectedInquiry.id
          ? { ...entry, internalNotes: [...(entry.internalNotes || []), optimisticNote] }
          : entry
      )));
      setLeadNoteDraft('');
      void loadDealerOsData();
      setLeadActionSuccess('Internal note added to the lead.');
    } catch (error) {
      setLeadActionError(error instanceof Error ? error.message : 'Unable to save the internal note.');
    } finally {
      setLeadActionLoading(false);
    }
  };

  const handleCopySyndicationValue = async (value: string, label: string) => {
    if (!value) {
      setSyndicationError(`${label} is not available until the storefront is saved.`);
      setSyndicationNotice('');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setSyndicationNotice(`${label} copied.`);
      setSyndicationError('');
    } catch (error) {
      setSyndicationError(error instanceof Error ? error.message : `Unable to copy ${label.toLowerCase()}.`);
      setSyndicationNotice('');
    }
  };

  if (!dealerAccess) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 md:px-8">
      <Seo
        title="DealerOS | Forestry Equipment Sales"
        description="Manage your dealer inventory, leads, feed imports, and storefront settings."
        robots={NOINDEX_ROBOTS}
      />
      <section className="rounded-sm border border-line bg-surface p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                DealerOS
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                {user?.role === 'pro_dealer' ? 'Pro Dealer Workspace' : 'Dealer Workspace'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-ink md:text-4xl">Manage Inventory, Imports, and Featured Placement</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                DealerOS keeps live inventory, feed imports, and featured listing placement in one operator workspace. Featured listings stay at the front of public browse surfaces.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingListing(null);
                  setIsModalOpen(true);
                }}
                className="btn-industrial btn-accent flex items-center gap-2 px-5 py-3"
              >
                <Plus size={14} /> Add Machine
              </button>
              <button
                type="button"
                onClick={() => void loadDealerOsData()}
                className="btn-industrial flex items-center gap-2 px-5 py-3"
              >
                <RefreshCw size={14} /> Refresh Workspace
              </button>
              <Link to="/profile" className="btn-industrial flex items-center gap-2 px-5 py-3">
                <Settings size={14} /> Storefront Settings
              </Link>
              <Link to="/sell" className="btn-industrial flex items-center gap-2 px-5 py-3">
                <ArrowUpRight size={14} /> Listing Form
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { label: 'Active Inventory', value: activeListings.length, icon: Package },
              { label: 'Listings Remaining', value: remainingListingSlots === null ? 'Unlimited' : remainingListingSlots, icon: Layers },
              { label: 'Featured Slots', value: `${featuredListings.length}/${featuredCap || 0}`, icon: Star },
              { label: 'New Leads', value: newLeadCount, icon: Building2 },
              { label: 'Imported Units', value: importedListings.length, icon: Database },
            ].map((card) => (
              <div key={card.label} className="rounded-sm border border-line bg-bg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{card.label}</span>
                  <card.icon size={15} className="text-accent" />
                </div>
                <div className="mt-3 text-3xl font-black tracking-tight text-ink">{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4 text-accent">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="text-sm font-bold">{pageError}</span>
        </div>
      ) : null}

      {actionError ? (
        <div className="flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4 text-accent">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="text-sm font-bold">{actionError}</span>
        </div>
      ) : null}

      <BulkImportToolkit
        ownerUid={ownerUid}
        workspaceLabel={user?.role === 'pro_dealer' ? 'Pro Dealer' : 'Dealer'}
        listingAllowanceText={listingAllowanceText}
      />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-sm border border-line bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-ink">Featured Listing Control</h2>
              <p className="mt-1 text-sm text-muted">Dealers can feature 3 active units. Pro Dealers can feature 6. Featured inventory gets priority placement in browse surfaces.</p>
            </div>
            <div className="rounded-sm border border-line bg-bg px-4 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Slots Remaining</div>
              <div className="text-2xl font-black tracking-tight text-ink">{Math.max((featuredCap || 0) - featuredListings.length, 0)}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {featuredListings.length === 0 ? (
              <div className="rounded-sm border border-dashed border-line bg-bg px-4 py-5 text-sm text-muted">
                No featured listings are selected yet.
              </div>
            ) : (
              featuredListings.map((listing) => (
                <div key={listing.id} className="flex flex-col gap-3 rounded-sm border border-line bg-bg p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                        <Star size={10} /> Featured
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{listing.category}</span>
                    </div>
                    <div className="mt-2 text-sm font-black uppercase tracking-tight text-ink">{listing.title}</div>
                    <div className="mt-1 text-sm text-muted">{listing.location || 'No location'} · {formatPrice(listing.price, listing.currency)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggleFeatured(listing)}
                    className="btn-industrial px-4 py-2 text-[10px]"
                  >
                    Remove From Featured
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-sm border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-tight text-ink">Account Capacity</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Listing Capacity</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-ink">{finiteListingCap === null ? 'Unlimited' : `${activeListings.length}/${finiteListingCap}`}</div>
              <div className="mt-1 text-xs text-muted">{remainingListingSlots === null ? 'Unlimited dealer inventory capacity' : `${remainingListingSlots} listing slots remaining.`}</div>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Managed Seats</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-ink">{seatSummary.seatCount}/{seatSummary.seatLimit || 0}</div>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Public Storefront</div>
              <div className="mt-2 text-sm font-bold text-ink">{user?.storefrontName || user?.company || user?.displayName || 'Dealer storefront'}</div>
              <div className="mt-1 text-xs text-muted">Use Profile to update branding, team details, SEO copy, and public storefront metadata.</div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                {publicDealerId ? `Dealer slug: ${publicDealerId}` : 'Save your storefront to publish a dealer slug.'}
              </div>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4 text-xs leading-relaxed text-muted">
              Best next steps: wire your primary dealer feed, feature your top revenue units, and keep location + stock numbers consistent for cleaner import updates.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-sm border border-line bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-ink">Feed Import Console</h2>
              <p className="mt-1 text-sm text-muted">Resolve JSON arrays, CSV uploads, XML feeds, or live API URLs before running a dry run or write import.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetFeedPreview();
              }}
              className="btn-industrial px-4 py-2 text-[10px]"
            >
              Reset
            </button>
          </div>

          <div className="mt-5 grid gap-5">
            <div>
              <label className="label-micro block">Source Name</label>
              <div className="mt-1 flex flex-col gap-3 md:flex-row">
                <input
                  value={feedSourceName}
                  onChange={(event) => {
                    setFeedSourceName(event.target.value);
                    resetFeedPreview();
                  }}
                  className="input-industrial w-full"
                  placeholder="e.g. Deere API, Ritchie XML, Inventory Sync"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveFeedProfile()}
                  disabled={profileSaving}
                  className="btn-industrial shrink-0 px-4 py-3 text-[10px] disabled:opacity-50"
                >
                  {profileSaving ? 'Saving…' : currentProfileId ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>
            </div>

            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Nightly Sync Window</div>
                  <div className="mt-1 text-sm font-bold text-ink">2:00 AM Central Time</div>
                  <div className="mt-1 text-xs text-muted">Enabled profiles are resolved and imported automatically every night from the saved source.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedNightlySyncEnabled((current) => !current)}
                  className={`relative h-6 w-12 rounded-full transition-colors ${feedNightlySyncEnabled ? 'bg-accent' : 'bg-line'}`}
                  aria-label="Toggle nightly sync"
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${feedNightlySyncEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                {feedNightlySyncEnabled ? 'Nightly sync enabled for this saved profile' : 'Nightly sync disabled for this saved profile'}
              </div>
            </div>

            {profileError ? (
              <div className="flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4 text-accent">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm font-bold">{profileError}</span>
              </div>
            ) : null}

            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Saved Feed Profiles</div>
                  <div className="mt-1 text-xs text-muted">Store repeatable source settings for quick reloads and dry-run checks.</div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{profiles.length} saved</div>
              </div>

              <div className="mt-4 grid gap-3">
                {profiles.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-line px-4 py-4 text-xs text-muted">
                    Save your current JSON, CSV, XML, or API setup to reuse it for scheduled imports and vendor feed checks.
                  </div>
                ) : (
                  profiles.map((profile) => (
                    <div key={profile.id} className="flex flex-col gap-3 rounded-sm border border-line bg-surface p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-ink">{profile.sourceName}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted">
                          {getDealerFeedSetupLabel(getDealerFeedSetupModeFromProfile(profile))}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                          <span className={`rounded-full px-2 py-1 ${profile.nightlySyncEnabled ? 'bg-accent/10 text-accent' : 'bg-line/60 text-ink'}`}>
                            {profile.nightlySyncEnabled ? 'Nightly Sync On' : 'Nightly Sync Off'}
                          </span>
                          {profile.lastSyncStatus ? <span>{profile.lastSyncStatus}</span> : null}
                          {profile.lastSyncAt ? <span>{formatLogTime(profile.lastSyncAt)}</span> : null}
                        </div>
                        {profile.lastSyncMessage ? (
                          <div className="mt-2 text-xs text-muted">{profile.lastSyncMessage}</div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleProfileNightlySync(profile)}
                          disabled={profileSaving}
                          className="btn-industrial px-3 py-2 text-[10px] disabled:opacity-50"
                        >
                          {profile.nightlySyncEnabled ? 'Disable Nightly Sync' : 'Enable Nightly Sync'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadFeedProfile(profile)}
                          className="btn-industrial px-3 py-2 text-[10px]"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteFeedProfile(profile)}
                          className="btn-industrial px-3 py-2 text-[10px] text-accent"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {(Object.keys(DEALER_FEED_SETUP_META) as DealerFeedSetupMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setFeedMode(mode);
                    setFeedFileName('');
                    resetFeedPreview();
                  }}
                  className={`rounded-sm border px-4 py-3 text-left transition-colors ${feedMode === mode ? 'border-ink bg-bg text-ink' : 'border-line bg-surface text-muted hover:text-ink'}`}
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.2em]">{DEALER_FEED_SETUP_META[mode].label}</div>
                  <div className="mt-2 text-xs leading-relaxed">{DEALER_FEED_SETUP_META[mode].helper}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleUseSampleFeed('json')}
                className="btn-industrial px-3 py-2 text-[10px]"
              >
                Load Sample JSON
              </button>
              <button
                type="button"
                onClick={() => handleUseSampleFeed('csv')}
                className="btn-industrial px-3 py-2 text-[10px]"
              >
                Load Sample CSV
              </button>
              <button
                type="button"
                onClick={() => handleUseSampleFeed('url')}
                className="btn-industrial px-3 py-2 text-[10px]"
              >
                Use Sample Feed URL
              </button>
            </div>

            {feedMode === 'url' ? (
              <div>
                <label className="label-micro block">Feed URL</label>
                <input
                  value={feedUrl}
                  onChange={(event) => {
                    setFeedUrl(event.target.value);
                    resetFeedPreview();
                  }}
                  className="input-industrial mt-1 w-full"
                  placeholder={DEALER_FEED_SETUP_META.url.placeholder}
                />
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="label-micro block">Feed Payload</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={feedFileInputRef}
                      type="file"
                      accept={DEALER_FEED_SETUP_META[feedMode].accept}
                      className="hidden"
                      onChange={(event) => {
                        void handleFeedFileSelected(event.target.files?.[0] || null);
                        event.currentTarget.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => feedFileInputRef.current?.click()}
                      className="btn-industrial px-3 py-2 text-[10px]"
                    >
                      {DEALER_FEED_SETUP_META[feedMode].uploadLabel}
                    </button>
                    {feedFileName ? (
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">{feedFileName}</span>
                    ) : null}
                  </div>
                </div>
                <textarea
                  rows={12}
                  value={feedRawInput}
                  onChange={(event) => {
                    setFeedRawInput(event.target.value);
                    if (feedFileName) setFeedFileName('');
                    resetFeedPreview();
                  }}
                  className="input-industrial mt-1 w-full resize-y font-mono text-[11px]"
                  placeholder={DEALER_FEED_SETUP_META[feedMode].placeholder}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setFeedDryRun((current) => !current)}
                className={`relative h-6 w-12 rounded-full transition-colors ${feedDryRun ? 'bg-accent' : 'bg-line'}`}
                aria-label="Toggle dry run"
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${feedDryRun ? 'right-1' : 'left-1'}`} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                {feedDryRun ? 'Dry Run Enabled' : 'Live Import Enabled'}
              </span>
              {!feedDryRun && (
                <span className="text-[10px] font-bold text-accent">Changes will write to live inventory</span>
              )}
            </div>

            {feedError ? (
              <div className="flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4 text-accent">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm font-bold">{feedError}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleResolveFeed()}
                disabled={feedLoading}
                className="btn-industrial flex items-center gap-2 px-5 py-3 disabled:opacity-50"
              >
                <Database size={14} /> Resolve Feed
              </button>
              <button
                type="button"
                onClick={() => void handleRunImport()}
                disabled={feedLoading}
                className="btn-industrial btn-accent flex items-center gap-2 px-5 py-3 disabled:opacity-50"
              >
                {feedLoading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                {feedDryRun ? 'Run Dry Import' : 'Import Inventory'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-tight text-ink">Feed Preview</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Detected Type</div>
              <div className="mt-2 text-xl font-black tracking-tight text-ink">{feedPreviewType || '—'}</div>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Resolved Items</div>
              <div className="mt-2 text-xl font-black tracking-tight text-ink">{feedPreviewCount}</div>
            </div>
            <div className="rounded-sm border border-line bg-bg p-4 text-xs text-muted">
              {feedPreviewItems.length === 0
                ? 'Resolve a feed source to preview the normalized items that will be imported.'
                : 'Preview confirms the importer found inventory records and normalized the expected listing fields.'}
            </div>

            {feedResult ? (
              <div className="rounded-sm border border-line bg-bg p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Last Import Result</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs font-black uppercase tracking-widest">
                  <div className="rounded-sm border border-line px-3 py-3 text-ink">
                    <div className="text-xl tracking-tight">{feedResult.processed}</div>
                    <div className="mt-1 text-[9px] text-muted">Processed</div>
                  </div>
                  <div className="rounded-sm border border-line px-3 py-3 text-accent">
                    <div className="text-xl tracking-tight">{feedResult.upserted}</div>
                    <div className="mt-1 text-[9px] text-muted">Upserted</div>
                  </div>
                  <div className="rounded-sm border border-line px-3 py-3 text-muted">
                    <div className="text-xl tracking-tight">{feedResult.skipped}</div>
                    <div className="mt-1 text-[9px] text-muted">Skipped</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-sm border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Direct API + Webhook Setup</div>
                  <div className="mt-1 text-xs text-muted">
                    Save a feed profile once, then copy these direct server-to-server endpoints into your DMS, ERP, scheduler, or vendor push integration.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevealFeedCredentials()}
                  disabled={revealingFeedCredentials || !currentProfileId}
                  className="btn-industrial flex items-center gap-2 px-3 py-2 text-[10px] disabled:opacity-50"
                >
                  {revealingFeedCredentials ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
                  {activeFeedProfile?.apiKey ? 'Refresh Secrets' : 'Reveal Secrets'}
                </button>
              </div>

              {feedCredentialError ? (
                <div className="mt-4 flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-3 text-accent">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="text-xs font-bold">{feedCredentialError}</span>
                </div>
              ) : null}

              {feedCredentialNotice ? (
                <div className="mt-4 rounded-sm border border-accent/20 bg-accent/10 px-3 py-3 text-xs font-bold text-accent">
                  {feedCredentialNotice}
                </div>
              ) : null}

              {!currentProfileId ? (
                <div className="mt-4 rounded-sm border border-dashed border-line px-4 py-4 text-xs text-muted">
                  Save the current feed profile first. That creates a reusable direct ingest URL, API key, webhook endpoint, and starter cURL command for direct integrations.
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-xs text-muted">
                  {[
                    { label: 'Direct Ingest URL', value: activeFeedProfile?.ingestUrl || '', copyLabel: 'Direct ingest URL' },
                    { label: 'Direct Webhook URL', value: activeFeedProfile?.webhookUrl || '', copyLabel: 'Direct webhook URL' },
                    { label: 'API Key', value: activeFeedProfile?.apiKey || activeFeedProfile?.apiKeyMasked || '', copyLabel: 'API key' },
                    { label: 'Webhook Secret', value: activeFeedProfile?.webhookSecret || activeFeedProfile?.webhookSecretMasked || '', copyLabel: 'Webhook secret' },
                  ].map((entry) => (
                    <div key={entry.label} className="rounded-sm border border-line bg-surface p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">{entry.label}</div>
                        <button
                          type="button"
                          onClick={() => void handleCopyFeedCredential(entry.value, entry.copyLabel)}
                          className="btn-industrial flex items-center gap-1 px-2 py-1 text-[10px]"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <div className="mt-2 break-all font-mono text-[11px] text-ink">{entry.value || 'Not available yet'}</div>
                    </div>
                  ))}

                  <div className="rounded-sm border border-line bg-surface p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Server-to-Server cURL</div>
                      <button
                        type="button"
                        onClick={() => void handleCopyFeedCredential(currentFeedCurlSnippet, 'Sample cURL command')}
                        className="btn-industrial flex items-center gap-1 px-2 py-1 text-[10px]"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-sm border border-line bg-bg p-3 font-mono text-[11px] text-ink">
                      {currentFeedCurlSnippet}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-ink">Dealer Site Syndication</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">Publish the same approved inventory on the dealer storefront, expose a machine-readable JSON feed, and give the dealer a copy-paste embed for their own website.</p>
          </div>
          {publicDealerPageUrl ? (
            <a href={publicDealerPageUrl} target="_blank" rel="noreferrer" className="btn-industrial flex items-center gap-2 px-5 py-3">
              <ArrowUpRight size={14} /> Open Dealer Page
            </a>
          ) : null}
        </div>

        {syndicationError ? (
          <div className="mt-5 flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4 text-accent">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="text-sm font-bold">{syndicationError}</span>
          </div>
        ) : null}

        {syndicationNotice ? (
          <div className="mt-5 rounded-sm border border-line bg-bg p-4 text-sm font-bold text-ink">{syndicationNotice}</div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'JSON Feed', desc: 'Share raw inventory data with partners and downstream systems.' },
            { step: '2', title: 'Embed Widget', desc: 'Add an interactive inventory browser to any dealer website.' },
            { step: '3', title: 'Iframe Fallback', desc: 'Use when the dealer site only supports iframe markup.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 rounded-sm border border-line bg-bg p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-black text-accent">{s.step}</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">{s.title}</div>
                <div className="mt-1 text-xs text-muted">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-sm border border-line bg-bg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Public JSON Feed</div>
                <div className="mt-1 text-xs text-muted">Use this for downstream syncs, partner integrations, or dealer-owned websites that want raw inventory data.</div>
              </div>
              <button
                type="button"
                onClick={() => void handleCopySyndicationValue(publicDealerFeedUrl, 'JSON feed URL')}
                className="btn-industrial px-3 py-2 text-[10px]"
              >
                Copy URL
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={publicDealerFeedUrl}
              className="input-industrial mt-4 w-full resize-none font-mono text-[11px]"
            />
          </div>

          <div className="rounded-sm border border-line bg-bg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Hosted Inventory Embed</div>
                <div className="mt-1 text-xs text-muted">This is the Forestry Equipment Sales-hosted inventory view for the dealer. Use it directly in an iframe when a script install is not needed.</div>
              </div>
              <button
                type="button"
                onClick={() => void handleCopySyndicationValue(publicDealerEmbedUrl, 'embed URL')}
                className="btn-industrial px-3 py-2 text-[10px]"
              >
                Copy URL
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={publicDealerEmbedUrl}
              className="input-industrial mt-4 w-full resize-none font-mono text-[11px]"
            />
          </div>

          <div className="rounded-sm border border-line bg-bg p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Copy-Paste Script Embed</div>
                <div className="mt-1 text-xs text-muted">Preferred option for dealers who want Forestry Equipment Sales inventory embedded on their own website with one snippet.</div>
              </div>
              <button
                type="button"
                onClick={() => void handleCopySyndicationValue(embedScriptSnippet, 'script embed snippet')}
                className="btn-industrial px-3 py-2 text-[10px]"
              >
                Copy Script
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={embedScriptSnippet}
              className="input-industrial mt-4 w-full resize-none font-mono text-[11px]"
            />
          </div>

          <div className="rounded-sm border border-line bg-bg p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Iframe Embed Fallback</div>
                <div className="mt-1 text-xs text-muted">Use this when the dealer site can only accept iframe markup.</div>
              </div>
              <button
                type="button"
                onClick={() => void handleCopySyndicationValue(iframeSnippet, 'iframe embed snippet')}
                className="btn-industrial px-3 py-2 text-[10px]"
              >
                Copy Iframe
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={iframeSnippet}
              className="input-industrial mt-4 w-full resize-none font-mono text-[11px]"
            />
          </div>
        </div>
      </section>

      {/* ── Widget Builder ──────────────────────────────────── */}
      <section className="rounded-sm border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-ink">Widget Builder</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">
              Customize and embed an interactive inventory widget on any website. Supports four card styles including FES Native, with optional inquiry forms, call buttons, and detail lightbox.
            </p>
          </div>
        </div>

        {widgetNotice ? <div className="mt-4 rounded-sm border border-data/30 bg-data/10 p-3 text-sm font-bold text-data">{widgetNotice}</div> : null}
        {widgetError ? <div className="mt-4 rounded-sm border border-accent/30 bg-accent/10 p-3 text-sm font-bold text-accent">{widgetError}</div> : null}

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {/* Customizer */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block mb-1">Card Style</label>
              <div className="flex flex-wrap gap-2">
                {(['fes-native', 'grid', 'list', 'compact'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setWidgetCardStyle(style)}
                    className={`rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${widgetCardStyle === style ? 'border-ink bg-bg text-ink' : 'border-line text-muted hover:border-ink/30'}`}
                  >
                    {style === 'fes-native' ? 'FES Native' : style}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={widgetAccentColor}
                    onChange={(e) => setWidgetAccentColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer border border-line rounded-sm bg-bg"
                  />
                  <input
                    type="text"
                    value={widgetAccentColor}
                    onChange={(e) => setWidgetAccentColor(e.target.value)}
                    className="input-industrial w-full text-[11px] font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block mb-1">Font Family</label>
                <select
                  value={widgetFontFamily}
                  onChange={(e) => setWidgetFontFamily(e.target.value)}
                  className="input-industrial w-full text-[11px]"
                >
                  <option value="">System Default</option>
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block mb-1">Page Size</label>
                <input
                  type="range"
                  min={3}
                  max={24}
                  step={3}
                  value={widgetPageSize}
                  onChange={(e) => setWidgetPageSize(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="text-[10px] font-bold text-muted text-center">{widgetPageSize} per page</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={widgetDarkMode} onChange={(e) => setWidgetDarkMode(e.target.checked)} className="accent-accent mt-0.5" />
                  <span className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Dark Mode</span>
                    <span className="text-[10px] font-normal normal-case tracking-normal text-muted/70">Match your dark-themed website</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={widgetShowInquiry} onChange={(e) => setWidgetShowInquiry(e.target.checked)} className="accent-accent mt-0.5" />
                  <span className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Show Inquiry</span>
                    <span className="text-[10px] font-normal normal-case tracking-normal text-muted/70">Inquiry form button on each card</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={widgetShowCall} onChange={(e) => setWidgetShowCall(e.target.checked)} className="accent-accent mt-0.5" />
                  <span className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Show Call</span>
                    <span className="text-[10px] font-normal normal-case tracking-normal text-muted/70">Click-to-call button on each card</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={widgetShowDetails} onChange={(e) => setWidgetShowDetails(e.target.checked)} className="accent-accent mt-0.5" />
                  <span className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Show Details</span>
                    <span className="text-[10px] font-normal normal-case tracking-normal text-muted/70">Lightbox detail view on card click</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={widgetSaving || !publicDealerId}
                onClick={async () => {
                  if (!ownerUid) return;
                  setWidgetSaving(true);
                  setWidgetError('');
                  setWidgetNotice('');
                  try {
                    await dealerFeedService.saveWidgetConfig(ownerUid, {
                      cardStyle: widgetCardStyle,
                      accentColor: widgetAccentColor,
                      fontFamily: widgetFontFamily,
                      darkMode: widgetDarkMode,
                      showInquiry: widgetShowInquiry,
                      showCall: widgetShowCall,
                      showDetails: widgetShowDetails,
                      pageSize: widgetPageSize,
                    });
                    setWidgetNotice('Widget configuration saved.');
                  } catch (err) {
                    setWidgetError(err instanceof Error ? err.message : 'Failed to save widget configuration.');
                  } finally {
                    setWidgetSaving(false);
                  }
                }}
                className="btn-industrial btn-accent px-5 py-2.5 text-[10px]"
              >
                {widgetSaving ? 'Saving...' : 'Save Config'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const snippet = publicDealerId
                    ? `<fes-dealer-inventory data-dealer="${publicDealerId}"${widgetCardStyle !== 'fes-native' ? ` data-card-style="${widgetCardStyle}"` : ''}${widgetAccentColor !== '#16A34A' ? ` data-accent-color="${widgetAccentColor}"` : ''}${widgetFontFamily ? ` data-font-family="${widgetFontFamily}"` : ''}${widgetDarkMode ? ' data-dark-mode="true"' : ''}${!widgetShowInquiry ? ' data-show-inquiry="false"' : ''}${!widgetShowCall ? ' data-show-call="false"' : ''}${!widgetShowDetails ? ' data-show-details="false"' : ''}${widgetPageSize !== 12 ? ` data-page-size="${widgetPageSize}"` : ''}></fes-dealer-inventory>\n<script src="${appOrigin}/api/public/dealer-widget.js"></script>`
                    : '';
                  if (!snippet) {
                    setWidgetError('Storefront must be saved before generating widget snippet.');
                    return;
                  }
                  void navigator.clipboard.writeText(snippet).then(
                    () => { setWidgetNotice('Widget snippet copied to clipboard.'); setWidgetError(''); },
                    () => { setWidgetError('Failed to copy snippet.'); }
                  );
                }}
                className="btn-industrial px-5 py-2.5 text-[10px]"
              >
                <Copy size={12} className="mr-1 inline" /> Copy Widget Snippet
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block mb-2">Live Preview</label>
            <div className="rounded-sm border border-line overflow-hidden" style={{ minHeight: 360 }}>
              {publicDealerId ? (
                <iframe
                  key={`${widgetCardStyle}-${widgetAccentColor}-${widgetDarkMode}-${widgetPageSize}-${widgetShowInquiry}-${widgetShowCall}-${widgetShowDetails}`}
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;}</style></head><body><fes-dealer-inventory data-dealer="${publicDealerId}" data-card-style="${widgetCardStyle}" data-accent-color="${widgetAccentColor}"${widgetFontFamily ? ` data-font-family="${widgetFontFamily}"` : ''} data-dark-mode="${widgetDarkMode}" data-show-inquiry="${widgetShowInquiry}" data-show-call="${widgetShowCall}" data-show-details="${widgetShowDetails}" data-page-size="${widgetPageSize}"></fes-dealer-inventory><script src="${appOrigin}/api/public/dealer-widget.js"><\/script></body></html>`}
                  className="w-full border-0"
                  style={{ minHeight: 360 }}
                  title="Widget Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <p className="text-sm font-bold text-muted">Save your storefront to preview the widget.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Widget embed snippet display */}
        {publicDealerId ? (
          <div className="mt-5 rounded-sm border border-line bg-bg p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">Widget Embed Code</div>
            <textarea
              readOnly
              rows={3}
              value={`<fes-dealer-inventory data-dealer="${publicDealerId}"${widgetCardStyle !== 'fes-native' ? ` data-card-style="${widgetCardStyle}"` : ''}${widgetAccentColor !== '#16A34A' ? ` data-accent-color="${widgetAccentColor}"` : ''}${widgetDarkMode ? ' data-dark-mode="true"' : ''}></fes-dealer-inventory>\n<script src="${appOrigin}/api/public/dealer-widget.js"></script>`}
              className="input-industrial w-full resize-none font-mono text-[11px]"
            />
          </div>
        ) : null}
      </section>

      {/* ── Webhook Management ──────────────────────────────── */}
      <section className="rounded-sm border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-ink">Webhook Notifications</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">
              Receive real-time HMAC-signed HTTP POST notifications whenever listings are created, updated, sold, or deleted. Integrate with CRM, ERP, or custom systems.
            </p>
          </div>
        </div>

        {webhookNotice ? <div className="mt-4 rounded-sm border border-data/30 bg-data/10 p-3 text-sm font-bold text-data">{webhookNotice}</div> : null}
        {webhookError ? <div className="mt-4 rounded-sm border border-accent/30 bg-accent/10 p-3 text-sm font-bold text-accent">{webhookError}</div> : null}

        {/* Add webhook form */}
        <div className="mt-5 rounded-sm border border-line bg-bg p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3">Add Webhook Subscription</div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted block mb-1">Callback URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks/fes"
                className="input-industrial w-full text-[11px]"
              />
            </div>
            <button
              type="button"
              disabled={webhookSaving || !webhookUrl.trim()}
              onClick={async () => {
                if (!ownerUid || !webhookUrl.trim()) return;
                setWebhookSaving(true);
                setWebhookError('');
                setWebhookNotice('');
                try {
                  const result = await dealerFeedService.createWebhook({
                    sellerUid: ownerUid,
                    callbackUrl: webhookUrl.trim(),
                    events: webhookEvents,
                  });
                  setWebhookNotice('Webhook created successfully. The signing secret is shown below — copy it now, it will not be displayed again.');
                  if (result.id && result.secret) {
                    setRevealedSecrets((prev) => ({ ...prev, [result.id]: result.secret }));
                  }
                  setWebhookUrl('');
                  const fresh = await dealerFeedService.getWebhooks(ownerUid);
                  setWebhooks(fresh);
                } catch (err) {
                  setWebhookError(err instanceof Error ? err.message : 'Failed to create webhook.');
                } finally {
                  setWebhookSaving(false);
                }
              }}
              className="btn-industrial btn-accent px-5 py-2.5 text-[10px] shrink-0"
            >
              {webhookSaving ? 'Creating...' : 'Add Webhook'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['listing.created', 'listing.updated', 'listing.sold', 'listing.deleted'].map((evt) => (
              <label key={evt} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEvents.includes(evt)}
                  onChange={(e) => {
                    setWebhookEvents((prev) =>
                      e.target.checked ? [...prev, evt] : prev.filter((x) => x !== evt)
                    );
                  }}
                  className="accent-accent"
                />
                <span className="text-[10px] font-bold text-muted">{evt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Existing webhooks */}
        {webhooks.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-sm border border-line">
            <div className="divide-y divide-line bg-bg">
              {webhooks.map((wh) => (
                <div key={wh.id} className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-2 w-2 rounded-full ${wh.active ? 'bg-data' : 'bg-muted'}`} />
                      <span className="text-sm font-bold text-ink truncate">{wh.callbackUrl}</span>
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-muted">
                      Events: {wh.events.join(', ')} &middot; Secret: {revealedSecrets[wh.id] || wh.secretMasked}
                      {wh.failureCount > 0 ? ` · ${wh.failureCount} failures` : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const secret = await dealerFeedService.revealWebhookSecret(wh.id);
                          setRevealedSecrets((prev) => ({ ...prev, [wh.id]: secret }));
                        } catch { /* ignore */ }
                      }}
                      className="btn-industrial px-2 py-1 text-[10px]"
                    >
                      <Eye size={12} className="mr-1 inline" /> Reveal Secret
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setWebhookNotice('');
                        setWebhookError('');
                        try {
                          const result = await dealerFeedService.testWebhook(wh.id);
                          setWebhookNotice(result.ok ? `Test delivery succeeded (HTTP ${result.statusCode}).` : `Test delivery failed: ${result.error}`);
                        } catch (err) {
                          setWebhookError(err instanceof Error ? err.message : 'Test delivery failed.');
                        }
                      }}
                      className="btn-industrial px-2 py-1 text-[10px]"
                    >
                      <RefreshCw size={12} className="mr-1 inline" /> Test
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setWebhookError('');
                        setWebhookNotice('');
                        try {
                          await dealerFeedService.deleteWebhook(wh.id);
                          setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
                          setWebhookNotice('Webhook deleted.');
                        } catch (err) {
                          setWebhookError(err instanceof Error ? err.message : 'Failed to delete webhook.');
                        }
                      }}
                      className="btn-industrial px-2 py-1 text-[10px] text-accent"
                    >
                      <Trash2 size={12} className="mr-1 inline" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-sm border border-dashed border-line bg-bg p-8 text-center">
            <p className="text-sm font-bold text-muted">No webhook subscriptions configured yet.</p>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-sm border border-line bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-ink">Lead Inbox</h2>
              <p className="mt-1 text-sm text-muted">Track new inbound leads, assign follow-up, and leave internal notes without leaving DealerOS.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'new', 'working', 'closed'] as LeadFilter[]).map((filter) => {
                const count =
                  filter === 'all' ? inquiries.length
                  : filter === 'new' ? inquiries.filter((i) => i.status === 'New').length
                  : filter === 'working' ? inquiries.filter((i) => ['Contacted', 'Qualified', 'Won'].includes(i.status)).length
                  : inquiries.filter((i) => ['Lost', 'Closed'].includes(i.status)).length;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setLeadFilter(filter)}
                    className={`rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${leadFilter === filter ? 'border-ink bg-bg text-ink' : 'border-line text-muted'}`}
                  >
                    {filter}<span className="ml-1.5 text-[9px]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-sm border border-line">
            <div className="max-h-[500px] overflow-y-auto divide-y divide-line bg-surface">
              {filteredInquiries.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm font-bold text-muted">No leads match the current filter.</div>
              ) : (
                filteredInquiries.map((inquiry) => {
                  const listing = inquiry.listingId ? listingLookup.get(inquiry.listingId) : undefined;
                  const active = inquiry.id === selectedInquiryId;
                  return (
                    <button
                      key={inquiry.id}
                      type="button"
                      onClick={() => setSelectedInquiryId(inquiry.id)}
                      className={`flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors ${active ? 'bg-bg' : 'hover:bg-bg/60'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-black uppercase tracking-tight text-ink">{inquiry.buyerName}</div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${inquiry.status === 'New' ? 'bg-accent/10 text-accent' : 'bg-line/60 text-ink'}`}>
                          {inquiry.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-muted">{listing?.title || 'General dealer inquiry'}</div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                        <span>{inquiry.buyerEmail}</span>
                        <span>{new Date(inquiry.createdAt).toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-line bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase tracking-tight text-ink">Lead Detail</h2>
            {selectedInquiry ? (
              <select
                value={selectedInquiry.status}
                onChange={(event) => void handleInquiryStatusChange(event.target.value as Inquiry['status'])}
                disabled={leadActionLoading}
                className="input-industrial w-full max-w-[220px]"
              >
                {(['New', 'Contacted', 'Qualified', 'Won', 'Lost', 'Closed'] as Inquiry['status'][]).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            ) : null}
          </div>

          {leadActionError ? (
            <div className="mt-4 flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4 text-accent">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm font-bold">{leadActionError}</span>
            </div>
          ) : null}

          {leadActionSuccess ? (
            <div className="mt-4 rounded-sm border border-line bg-bg p-4 text-sm font-bold text-ink">{leadActionSuccess}</div>
          ) : null}

          {!selectedInquiry ? (
            <div className="mt-5 rounded-sm border border-dashed border-line bg-bg px-4 py-10 text-center text-sm font-bold text-muted">
              Select a lead to review the contact details, message history, and next actions.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-sm border border-line bg-bg p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Buyer</div>
                  <div className="mt-2 text-base font-black uppercase tracking-tight text-ink">{selectedInquiry.buyerName}</div>
                  <div className="mt-2 text-sm text-muted">{selectedInquiry.buyerEmail}</div>
                  <div className="mt-1 text-sm text-muted">{selectedInquiry.buyerPhone || 'No phone provided'}</div>
                </div>
                <div className="rounded-sm border border-line bg-bg p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Assignment</div>
                  <div className="mt-2 text-sm font-bold text-ink">{selectedInquiry.assignedToName || 'Unassigned'}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAssignLeadToCurrentUser()}
                      disabled={leadActionLoading || !user?.uid}
                      className="btn-industrial px-4 py-2 text-[10px] disabled:opacity-50"
                    >
                      Assign To Me
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-line bg-bg p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Inquiry Context</div>
                <div className="mt-2 text-sm font-bold text-ink">
                  {selectedInquiry.listingId ? listingLookup.get(selectedInquiry.listingId)?.title || 'Listing lead' : 'General dealer inquiry'}
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                  {selectedInquiry.type} · received {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{selectedInquiry.message}</p>
              </div>

              <div className="rounded-sm border border-line bg-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Internal Notes</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                    {(selectedInquiry.internalNotes || []).length} note{(selectedInquiry.internalNotes || []).length === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {(selectedInquiry.internalNotes || []).length === 0 ? (
                    <div className="rounded-sm border border-dashed border-line px-4 py-4 text-xs text-muted">
                      No internal notes yet. Save follow-up commitments and call outcomes here.
                    </div>
                  ) : (
                    (selectedInquiry.internalNotes || []).map((note) => (
                      <div key={note.id} className="rounded-sm border border-line bg-surface p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                          <span>{note.authorName || 'Dealer Team'}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="mt-2 text-sm leading-relaxed text-ink">{note.text}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 grid gap-3">
                  <textarea
                    rows={4}
                    value={leadNoteDraft}
                    onChange={(event) => setLeadNoteDraft(event.target.value)}
                    className="input-industrial w-full resize-y"
                    placeholder="Add a follow-up note, next-call plan, or quoted terms..."
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => void handleAddLeadNote()}
                      disabled={leadActionLoading}
                      className="btn-industrial btn-accent px-4 py-3 text-[10px] disabled:opacity-50"
                    >
                      Save Internal Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-sm border border-line bg-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-ink">Inventory Control</h2>
            <p className="mt-1 text-sm text-muted">Manage live inventory, mark featured units, and keep imported listings in sync.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'live', 'featured', 'imported', 'sold'] as InventoryFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setInventoryFilter(filter)}
                className={`rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${inventoryFilter === filter ? 'border-ink bg-bg text-ink' : 'border-line text-muted'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="input-industrial w-full lg:max-w-md"
            placeholder="Search title, make, model, location, stock, source..."
          />
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Showing {filteredListings.length} of {listings.length} listings
          </div>
        </div>

        <div className="mt-5 max-h-[600px] overflow-y-auto overflow-x-auto rounded-sm border border-line">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-bg text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">Machine</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Feed</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-muted">Loading DealerOS inventory…</td>
                </tr>
              ) : filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-muted">No listings match the current filter.</td>
                </tr>
              ) : (
                filteredListings.map((listing) => (
                  <tr key={listing.id} className="align-top hover:bg-bg/60">
                    <td className="px-4 py-4">
                      <div className="text-sm font-black uppercase tracking-tight text-ink">{listing.title}</div>
                      <div className="mt-1 text-xs text-muted">{listing.make || listing.manufacturer || 'Unknown make'} · {listing.model}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{listing.stockNumber || listing.id}</div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-ink">{listing.status || 'active'}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => void handleToggleFeatured(listing)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${listing.featured ? 'bg-accent/10 text-accent' : 'bg-line/50 text-muted'}`}
                      >
                        <Star size={11} /> {listing.featured ? 'Featured' : 'Standard'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-ink">{formatPrice(listing.price, listing.currency)}</td>
                    <td className="px-4 py-4 text-xs text-muted">{listing.location || '—'}</td>
                    <td className="px-4 py-4 text-xs text-muted">{listing.externalSource?.sourceName || 'Manual'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingListing(listing);
                            setIsModalOpen(true);
                          }}
                          className="btn-industrial px-3 py-2 text-[10px]"
                        >
                          Edit
                        </button>
                        <Link
                          to={buildListingPath(listing)}
                          className="btn-industrial px-3 py-2 text-[10px]"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDeleteListing(listing)}
                          className="btn-industrial px-3 py-2 text-[10px] text-accent"
                        >
                          <Trash2 size={12} className="mr-1 inline-block" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-sm border border-line bg-surface p-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-ink">Recent Import Activity</h2>
          <div className="mt-5 max-h-[400px] overflow-y-auto overflow-x-auto rounded-sm border border-line">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-bg text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Processed</th>
                  <th className="px-4 py-3">Upserted</th>
                  <th className="px-4 py-3">Skipped</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-muted">No import runs have been recorded yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-4 text-xs font-black uppercase tracking-tight text-ink">{log.sourceName}</td>
                      <td className="px-4 py-4 text-xs font-bold text-ink">{log.processed}</td>
                      <td className="px-4 py-4 text-xs font-bold text-accent">{log.upserted}</td>
                      <td className="px-4 py-4 text-xs font-bold text-muted">{log.skipped}</td>
                      <td className="px-4 py-4 text-xs font-bold text-ink">{log.dryRun ? 'Dry Run' : 'Live'}</td>
                      <td className="px-4 py-4 text-xs text-muted">{formatLogTime(log.processedAt || log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-sm border border-line bg-surface p-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-ink">Operator Notes</h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
            <p>Featured listings now surface ahead of standard inventory in browse-first experiences, so reserve those slots for units with the strongest close rate or highest gross margin.</p>
            <p>Use dry runs for every new vendor feed. That catches field mismatches before a live import starts creating or updating records.</p>
            <p>Keep stock numbers, serials, and locations consistent across feeds. Cleaner source data gives you cleaner upserts and fewer duplicate units.</p>
          </div>
        </div>
      </section>

      <ListingModal
        isOpen={isModalOpen}
        onClose={() => {
          if (savingListing) return;
          setIsModalOpen(false);
          setEditingListing(null);
        }}
        listing={editingListing}
        onSave={handleSaveListing}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

export default DealerOS;
