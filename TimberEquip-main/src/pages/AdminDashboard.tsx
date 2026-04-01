import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { updateEmail, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { 
  LayoutDashboard, Package, MessageSquare, 
  Users, Settings, TrendingUp, Plus,
  Search, Filter, MoreVertical, Edit, Trash2, Download, Copy, Eye,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight,
  User, Shield, Bell, CreditCard, LogOut,
  Phone, Activity, ShieldAlert, MapPin, ExternalLink, Building2,
  FileText, Image, Layers, Database, Upload, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { equipmentService, type AdminListingsCursor, type ListingReviewSummary } from '../services/equipmentService';
import { userService } from '../services/userService';
import { adminUserService, type AdminOperationsBootstrapResponse } from '../services/adminUserService';
import { cmsService, type AdminContentBootstrapResponse } from '../services/cmsService';
import { Listing, Inquiry, Account, CallLog, UserRole, BlogPost, MediaItem, ContentBlock } from '../types';
import { billingService, Invoice, Subscription, BillingAuditLog, AccountAuditLog, SellerProgramAgreementAcceptance, type AdminBillingBootstrapResponse, type AdminDealerPerformanceReportResponse } from '../services/billingService';
import { dealerFeedService, DealerFeedIngestResult, DealerFeedLog, DealerFeedProfile } from '../services/dealerFeedService';
import { ListingModal } from '../components/admin/ListingModal';
import { BulkImportToolkit } from '../components/BulkImportToolkit';
import { InquiryList } from '../components/admin/InquiryList';
import { VirtualizedListingsTable } from '../components/admin/VirtualizedListingsTable';
import { CmsEditor } from '../components/admin/CmsEditor';
import { MediaLibrary } from '../components/admin/MediaLibrary';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { TaxonomyManager } from '../components/admin/TaxonomyManager';
import { Seo } from '../components/Seo';
import { useAuth } from '../components/AuthContext';
import { useLocale } from '../components/LocaleContext';
import { auth } from '../firebase';
import { getAssignableUserRoleOptions, getUserRoleDisplayLabel, normalizeEditableUserRole } from '../utils/userRoles';
import {
  buildDealerFeedApiCurlSnippet,
  buildDealerFeedSampleUrl,
  DEALER_FEED_SETUP_META,
  type DealerFeedSetupMode,
  getDealerFeedSamplePayload,
  inferDealerFeedSetupModeFromFileName,
} from '../utils/dealerFeedSetup';
import type { ListingLifecycleAction, ListingLifecycleAuditView } from '../types';

type DashboardTab = 'overview' | 'listings' | 'inquiries' | 'calls' | 'accounts' | 'settings' | 'tracking' | 'users' | 'billing' | 'content' | 'dealer_feeds';
type ListingReviewFilter = 'all' | 'pending_approval' | 'paid_not_live' | 'rejected' | 'expired' | 'sold' | 'archived' | 'anomalies';

const LISTINGS_PAGE_SIZE = 50;
const DASHBOARD_TAB_IDS = new Set<DashboardTab>([
  'overview',
  'listings',
  'inquiries',
  'calls',
  'accounts',
  'settings',
  'tracking',
  'users',
  'billing',
  'content',
  'dealer_feeds',
]);

const CONTENT_ONLY_DASHBOARD_ROLES = new Set(['content_manager', 'editor']);
const FULL_ADMIN_DASHBOARD_ROLES = new Set(['super_admin', 'admin', 'developer']);

function resolveDashboardTab(tab: string | null | undefined): DashboardTab {
  if (tab && DASHBOARD_TAB_IDS.has(tab as DashboardTab)) {
    return tab as DashboardTab;
  }

  return 'overview';
}

export function AdminDashboard() {
  const { user: authUser, logout: authLogout, patchCurrentUserProfile } = useAuth();
  const { formatPrice } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const profileName = authUser?.displayName || 'Admin';
  const roleLabel = getUserRoleDisplayLabel(authUser?.role);
  const normalizedAdminRole = userService.normalizeRole(authUser?.role);
  const isContentOnlyDashboardRole = CONTENT_ONLY_DASHBOARD_ROLES.has(normalizedAdminRole);
  const hasFullAdminDashboardScope = FULL_ADMIN_DASHBOARD_ROLES.has(normalizedAdminRole);
  const assignableRoleOptions = getAssignableUserRoleOptions(authUser?.role);
  const canAssignSuperAdmin = assignableRoleOptions.some((option) => option.value === 'super_admin');
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [adminCallSearchQuery, setAdminCallSearchQuery] = useState('');
  const [adminCallDisplayCount, setAdminCallDisplayCount] = useState(20);
  const [overview, setOverview] = useState<AdminOperationsBootstrapResponse['overview']>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [billingLogs, setBillingLogs] = useState<BillingAuditLog[]>([]);
  const [billingAuditQuery, setBillingAuditQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [billingLoadError, setBillingLoadError] = useState('');
  const [exportingBillingCsv, setExportingBillingCsv] = useState(false);
  const [exportingDealerPerformanceCsv, setExportingDealerPerformanceCsv] = useState(false);
  const [accountAuditLogs, setAccountAuditLogs] = useState<AccountAuditLog[]>([]);
  const [accountAuditDisplayCount, setAccountAuditDisplayCount] = useState(10);
  const [accountAuditSearchQuery, setAccountAuditSearchQuery] = useState('');
  const [blogPostDisplayCount, setBlogPostDisplayCount] = useState(10);
  const [blogPostSearchQuery, setBlogPostSearchQuery] = useState('');
  const [sellerAgreementAcceptances, setSellerAgreementAcceptances] = useState<SellerProgramAgreementAcceptance[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [contentLoadError, setContentLoadError] = useState('');
  const [demoInventoryRecommended, setDemoInventoryRecommended] = useState(false);
  const resolvedRequestedTab = useMemo<DashboardTab>(() => resolveDashboardTab(requestedTab), [requestedTab]);
  const activeTab = useMemo<DashboardTab>(() => {
    if (!isContentOnlyDashboardRole) {
      return resolvedRequestedTab;
    }

    return resolvedRequestedTab === 'settings' || resolvedRequestedTab === 'content'
      ? resolvedRequestedTab
      : 'content';
  }, [isContentOnlyDashboardRole, resolvedRequestedTab]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDemoListings, setShowDemoListings] = useState(false);
  const [listingPage, setListingPage] = useState(1);
  const [listingHasMore, setListingHasMore] = useState(false);
  const [nextListingCursor, setNextListingCursor] = useState<AdminListingsCursor>(null);
  const [listingCursorHistory, setListingCursorHistory] = useState<AdminListingsCursor[]>([null]);
  const [listingsLoadError, setListingsLoadError] = useState('');
  const [selectedListingAuditId, setSelectedListingAuditId] = useState('');
  const [selectedListingForAudit, setSelectedListingForAudit] = useState<Listing | null>(null);
  const [listingAuditData, setListingAuditData] = useState<ListingLifecycleAuditView | null>(null);
  const [listingAuditLoading, setListingAuditLoading] = useState(false);
  const [listingAuditError, setListingAuditError] = useState('');
  const [pendingListingLifecycleKey, setPendingListingLifecycleKey] = useState('');
  const [listingReviewFilter, setListingReviewFilter] = useState<ListingReviewFilter>('all');
  const [listingReviewSummaries, setListingReviewSummaries] = useState<Record<string, ListingReviewSummary>>({});
  const [listingReviewSummariesLoading, setListingReviewSummariesLoading] = useState(false);
  const [listingReviewSummariesError, setListingReviewSummariesError] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [managedSeatError, setManagedSeatError] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [usersLoadError, setUsersLoadError] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [adminOperationsLoaded, setAdminOperationsLoaded] = useState(false);
  const [userFeedback, setUserFeedback] = useState<{ tone: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [savingUserEdit, setSavingUserEdit] = useState(false);
  const [pendingUserActionKey, setPendingUserActionKey] = useState('');
  const [userEditForm, setUserEditForm] = useState<{
    displayName: string;
    email: string;
    phoneNumber: string;
    company: string;
    role: UserRole;
  }>({
    displayName: '',
    email: '',
    phoneNumber: '',
    company: '',
    role: 'member'
  });
  const [newManagedAccount, setNewManagedAccount] = useState<{
    displayName: string;
    email: string;
    role: UserRole;
    company: string;
    phoneNumber: string;
  }>({
    displayName: '',
    email: '',
    role: 'dealer',
    company: '',
    phoneNumber: ''
  });
  const [adminSettingsForm, setAdminSettingsForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    company: '',
    emailNotificationsEnabled: true,
  });
  const [savingAdminSettings, setSavingAdminSettings] = useState(false);
  const [savingAdminPreferenceKey, setSavingAdminPreferenceKey] = useState('');
  const [adminSettingsError, setAdminSettingsError] = useState('');
  const listingsInitializedRef = useRef(false);
  const operationalLoadKeyRef = useRef('');
  const userDirectoryLoadKeyRef = useRef('');
  const listingReviewSummariesLoadKeyRef = useRef('');
  const shouldLoadListingsData = activeTab === 'overview' || activeTab === 'listings';
  const shouldLoadAdminOperations = ['overview', 'accounts', 'users', 'inquiries', 'calls'].includes(activeTab);
  const showTabContentLoader = shouldLoadListingsData && loading && !listingsInitializedRef.current && listings.length === 0;

  const selectAdminTab = useCallback((nextTab: DashboardTab) => {
    if (nextTab === activeTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextTab);
    }
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
  }, [activeTab, searchParams, setSearchParams]);

  // ── Dealer Feed state ──────────────────────────────────────────────
  const [dfSubTab,     setDfSubTab]     = useState<'ingest' | 'logs'>('ingest');
  const [dfMode,       setDfMode]       = useState<DealerFeedSetupMode>('json');
  const [dfSource,     setDfSource]     = useState('');
  const [dfDealerId,   setDfDealerId]   = useState('');
  const [dfPayload,    setDfPayload]    = useState('');
  const [dfFeedUrl,    setDfFeedUrl]    = useState('');
  const [dfFileName,   setDfFileName]   = useState('');
  const [dfDryRun,     setDfDryRun]     = useState(true);
  const [dfLoading,    setDfLoading]    = useState(false);
  const [dfResult,     setDfResult]     = useState<DealerFeedIngestResult | null>(null);
  const [dfPreviewItems, setDfPreviewItems] = useState<Parameters<typeof dealerFeedService.ingest>[0]['items']>([]);
  const [dfPreviewCount, setDfPreviewCount] = useState(0);
  const [dfPreviewType, setDfPreviewType] = useState<'json' | 'xml' | 'csv' | ''>('');
  const [dfError,      setDfError]      = useState('');
  const [dfLogs,       setDfLogs]       = useState<DealerFeedLog[]>([]);
  const [dfLogsLoading, setDfLogsLoading] = useState(false);
  const [dfCurrentProfileId, setDfCurrentProfileId] = useState('');
  const [dfActiveProfile, setDfActiveProfile] = useState<DealerFeedProfile | null>(null);
  const [dfProfileSaving, setDfProfileSaving] = useState(false);
  const [dfCredentialNotice, setDfCredentialNotice] = useState('');
  const [dfCredentialError, setDfCredentialError] = useState('');
  const [dfRevealingCredentials, setDfRevealingCredentials] = useState(false);
  const dfFileInputRef = useRef<HTMLInputElement | null>(null);
  const setupModes = Object.keys(DEALER_FEED_SETUP_META) as DealerFeedSetupMode[];

  // ── CMS state ────────────────────────────────────────────────────
  const [blogPosts,      setBlogPosts]      = useState<BlogPost[]>([]);
  const [mediaItems,     setMediaItems]     = useState<MediaItem[]>([]);
  const [contentBlocks,  setContentBlocks]  = useState<ContentBlock[]>([]);
  const [editingPost,    setEditingPost]    = useState<BlogPost | null>(null);
  const [showCmsEditor,  setShowCmsEditor]  = useState(false);
  const [contentSubTab,  setContentSubTab]  = useState<'posts' | 'media' | 'blocks' | 'categories'>('posts');
  const [newBlock, setNewBlock] = useState<{ type: ContentBlock['type']; content: string; title: string; label: string }>({
    type: 'text', content: '', title: '', label: ''
  });
  const [savingBlock, setSavingBlock] = useState(false);

  const toMillis = (value: unknown): number => {
    if (!value) return 0;
    if (typeof value === 'string') return new Date(value).getTime() || 0;
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    const ts = value as { seconds?: number; toDate?: () => Date };
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    return 0;
  };

  const formatTimestamp = (value: unknown) => {
    const ms = toMillis(value);
    if (!ms) return 'Unknown';
    return new Date(ms).toLocaleString();
  };

  const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  useEffect(() => {
    if (!userFeedback) return undefined;
    const timeoutId = window.setTimeout(() => setUserFeedback(null), 9000);
    return () => window.clearTimeout(timeoutId);
  }, [userFeedback]);

  useEffect(() => {
    setAdminSettingsForm({
      displayName: authUser?.displayName || '',
      email: authUser?.email || '',
      phoneNumber: authUser?.phoneNumber || '',
      company: authUser?.company || '',
      emailNotificationsEnabled: authUser?.emailNotificationsEnabled !== false,
    });
    setAdminSettingsError('');
  }, [authUser?.company, authUser?.displayName, authUser?.email, authUser?.emailNotificationsEnabled, authUser?.phoneNumber]);

  const downloadCsv = (filenamePrefix: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getAdminRoleDisplayLabel = (role: UserRole) => {
    return getUserRoleDisplayLabel(role);
  };

  const isPublishedPost = (post: BlogPost) => {
    const status = String(post.status || '').trim().toLowerCase();
    const reviewStatus = String(post.reviewStatus || '').trim().toLowerCase();
    return status === 'published' || reviewStatus === 'published';
  };

  // ── Real-time inquiry subscription ─────────────────────────────
  const exportInquiriesCSV = () => {
    const headers = ['ID', 'Buyer Name', 'Email', 'Phone', 'Status', 'Assigned To', 'Listing', 'Type', 'Spam Score', 'Message', 'Created At'];
    const rows = inquiries.map((inq) => [
      inq.id,
      inq.buyerName,
      inq.buyerEmail,
      inq.buyerPhone,
      inq.status,
      inq.assignedToName || '',
      inq.listingId || '',
      inq.type,
      String(inq.spamScore ?? 0),
      inq.message,
      inq.createdAt,
    ]);
    downloadCsv('leads', headers, rows);
  };

  const exportCallsCSV = () => {
    const headers = [
      'Call ID',
      'Timestamp',
      'Status',
      'Source',
      'Is Authenticated',
      'Caller UID',
      'Caller Name',
      'Caller Email',
      'Caller Phone',
      'Listing ID',
      'Listing Title',
      'Seller UID',
      'Seller Name',
      'Seller Phone',
      'Duration Seconds'
    ];

    const rows = calls.map((call) => [
      call.id,
      formatTimestamp(call.createdAt),
      call.status,
      call.source || '',
      call.isAuthenticated ? 'yes' : 'no',
      call.callerUid || '',
      call.callerName,
      call.callerEmail || '',
      call.callerPhone || '',
      call.listingId,
      call.listingTitle || '',
      call.sellerUid || call.sellerId || '',
      call.sellerName || '',
      call.sellerPhone || '',
      String(call.duration),
    ]);

    downloadCsv('calls', headers, rows);
  };

  const fetchUsers = async (force = false) => {
    const shouldRequestOverview = activeTab === 'overview';
    if (!authUser?.uid || usersLoading || (adminOperationsLoaded && !force && (!shouldRequestOverview || overview))) {
      return;
    }

    const requestKey = `${authUser.uid}:admin_operations:${shouldRequestOverview ? 'overview' : 'standard'}`;
    if (userDirectoryLoadKeyRef.current === requestKey) {
      return;
    }

    userDirectoryLoadKeyRef.current = requestKey;
    setUsersLoading(true);
    setUsersLoadError('');
    try {
      const payload = await adminUserService.getAdminOperationsBootstrap({ includeOverview: shouldRequestOverview });
      setAccounts(payload.users);
      if (Array.isArray(payload.inquiries)) {
        setInquiries(payload.inquiries);
      }
      if (Array.isArray(payload.calls)) {
        setCalls(payload.calls);
      }
      if (payload.overview) {
        setOverview(payload.overview);
      }
      setAdminOperationsLoaded(true);
      const errorMessages = [
        payload.errors?.users,
        payload.errors?.inquiries,
        payload.errors?.calls,
      ].filter(Boolean);
      setUsersLoadError(errorMessages.join(' '));
    } catch (err) {
      console.error('Error fetching users:', err);
      setAdminOperationsLoaded(false);
      setUsersLoadError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      if (userDirectoryLoadKeyRef.current === requestKey) {
        userDirectoryLoadKeyRef.current = '';
      }
      setUsersLoading(false);
    }
  };

  const fetchBillingData = async (force = false) => {
    if (!authUser?.uid || billingLoading || (billingLoaded && !force)) {
      return;
    }

    setBillingLoading(true);
    setBillingLoadError('');
    try {
      const payload: AdminBillingBootstrapResponse = await billingService.getAdminBillingBootstrap();
      setInvoices(payload.invoices);
      setSubscriptions(payload.subscriptions);
      setBillingLogs(payload.auditLogs);
      setAccountAuditLogs(payload.accountAuditLogs);
      setSellerAgreementAcceptances(payload.sellerAgreementAcceptances);
      setBillingLoaded(true);

      const errorMessages = [
        payload.errors?.invoices,
        payload.errors?.subscriptions,
        payload.errors?.auditLogs,
        payload.errors?.accountAuditLogs,
        payload.errors?.sellerAgreementAcceptances,
      ].filter(Boolean);
      setBillingLoadError(errorMessages.join(' '));
    } catch (billingError) {
      console.warn('Billing data not available:', billingError);
      setBillingLoadError(billingError instanceof Error ? billingError.message : 'Billing data is not available right now.');
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchContentData = async (force = false) => {
    if (!authUser?.uid || contentLoading || (contentLoaded && !force)) {
      return;
    }

    setContentLoading(true);
    setContentLoadError('');
    try {
      const payload: AdminContentBootstrapResponse = await cmsService.getAdminContentBootstrap();
      setBlogPosts(payload.posts);
      setMediaItems(payload.media);
      setContentBlocks(payload.contentBlocks);
      setContentLoaded(true);

      const errorMessages = [
        payload.errors?.posts,
        payload.errors?.media,
        payload.errors?.contentBlocks,
      ].filter(Boolean);
      setContentLoadError(errorMessages.join(' '));
    } catch (cmsErr) {
      console.warn('CMS data not available:', cmsErr);
      setContentLoadError(cmsErr instanceof Error ? cmsErr.message : 'Content data is not available right now.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleAdminSettingsInputChange = (key: keyof typeof adminSettingsForm, value: string | boolean) => {
    setAdminSettingsError('');
    setAdminSettingsForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleToggleAdminEmailNotifications = async () => {
    if (!authUser?.uid || savingAdminPreferenceKey === 'emailNotificationsEnabled') {
      return;
    }

    const previousValue = adminSettingsForm.emailNotificationsEnabled;
    const nextValue = !previousValue;

    handleAdminSettingsInputChange('emailNotificationsEnabled', nextValue);
    setSavingAdminPreferenceKey('emailNotificationsEnabled');
    setUserFeedback(null);

    try {
      await userService.updateProfile(authUser.uid, {
        emailNotificationsEnabled: nextValue,
      });
      patchCurrentUserProfile({
        emailNotificationsEnabled: nextValue,
      });
      setUserFeedback({
        tone: 'success',
        message: `Email notifications ${nextValue ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      handleAdminSettingsInputChange('emailNotificationsEnabled', previousValue);
      setAdminSettingsError(error instanceof Error ? error.message : 'Unable to update email notification preferences right now.');
    } finally {
      setSavingAdminPreferenceKey('');
    }
  };

  const handleSaveAdminSettings = async () => {
    if (!authUser?.uid) {
      setAdminSettingsError('A signed-in account is required before settings can be saved.');
      return;
    }

    const nextDisplayName = adminSettingsForm.displayName.trim();
    const nextEmail = adminSettingsForm.email.trim().toLowerCase();
    const nextPhoneNumber = adminSettingsForm.phoneNumber.trim();
    const nextCompany = adminSettingsForm.company.trim();

    if (!nextDisplayName) {
      setAdminSettingsError('Display name is required.');
      return;
    }

    if (!nextEmail) {
      setAdminSettingsError('Email address is required.');
      return;
    }

    setSavingAdminSettings(true);
    setAdminSettingsError('');

    try {
      const currentAuthUser = auth.currentUser;
      let successMessage = 'Account settings saved successfully.';
      let emailForProfile = nextEmail;

      if (currentAuthUser && (currentAuthUser.email || '').toLowerCase() !== nextEmail) {
        try {
          await updateEmail(currentAuthUser, nextEmail);
        } catch (emailError) {
          console.warn('Auth email update requires reauthentication:', emailError);
          successMessage = 'Profile settings saved, but email changes need a recent sign-in before they can update your login email.';
          emailForProfile = (currentAuthUser.email || authUser.email || nextEmail).toLowerCase();
        }
      }

      await userService.updateProfile(authUser.uid, {
        displayName: nextDisplayName,
        email: emailForProfile,
        phoneNumber: nextPhoneNumber,
        company: nextCompany,
        emailNotificationsEnabled: adminSettingsForm.emailNotificationsEnabled,
      });

      if (currentAuthUser) {
        if ((currentAuthUser.displayName || '') !== nextDisplayName) {
          await updateFirebaseProfile(currentAuthUser, { displayName: nextDisplayName });
        }
      }

      patchCurrentUserProfile({
        displayName: nextDisplayName,
        email: emailForProfile,
        phoneNumber: nextPhoneNumber,
        company: nextCompany,
        emailNotificationsEnabled: adminSettingsForm.emailNotificationsEnabled,
      });

      setUserFeedback({
        tone: successMessage.includes('recent sign-in') ? 'warning' : 'success',
        message: successMessage,
      });
    } catch (error) {
      console.error('Error saving admin settings:', error);
      setAdminSettingsError(error instanceof Error ? error.message : 'Unable to save account settings right now.');
    } finally {
      setSavingAdminSettings(false);
    }
  };

  const loadListingsPage = async (
    cursor: AdminListingsCursor,
    pageNumber: number,
    includeDemoListings = showDemoListings
  ) => {
    setListingsLoading(true);
    setListingsLoadError('');
    try {
      const page = await equipmentService.getAdminListingsPage({
        pageSize: LISTINGS_PAGE_SIZE,
        cursor,
        includeDemoListings,
      });

      // Validate and normalize listings data
      const validatedListings = Array.isArray(page.listings) 
        ? page.listings.map(l => ({
            ...l,
            images: Array.isArray(l.images) ? l.images : [],
            title: l.title || '(Untitled)',
            category: l.category || 'Uncategorized',
            manufacturer: l.manufacturer || l.make || '',
            price: typeof l.price === 'number' ? l.price : 0,
            hours: typeof l.hours === 'number' ? l.hours : 0,
            leads: typeof l.leads === 'number' ? l.leads : 0,
          }))
        : [];

      setListings(validatedListings);
      setNextListingCursor(page.nextCursor);
      setListingHasMore(page.hasMore);
      setListingPage(pageNumber);
      setDemoInventoryRecommended(false);
      setListingCursorHistory((previous) => {
        const nextHistory = previous.slice(0, Math.max(pageNumber - 1, 0));
        nextHistory[pageNumber - 1] = cursor;
        return nextHistory.length > 0 ? nextHistory : [null];
      });
      listingsInitializedRef.current = true;
    } catch (error) {
      console.error('Error loading listings page:', error);
      setListingsLoadError(
        error instanceof Error ? error.message : 'Failed to load machine inventory. Please try again.'
      );
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  };

  const mergeListingPatch = (listingId: string, updates: Partial<Listing>) => {
    const applyPatch = (listing: Listing): Listing =>
      listing.id === listingId ? { ...listing, ...updates } : listing;

    setListings((previous) => previous.map(applyPatch));
    setEditingListing((previous) => (previous?.id === listingId ? { ...previous, ...updates } : previous));
    setSelectedListingForAudit((previous) => (previous?.id === listingId ? { ...previous, ...updates } : previous));
    setListingAuditData((previous) => (
      previous && previous.listingId === listingId
        ? {
            ...previous,
            listing: {
              ...(previous.listing || { id: listingId }),
              ...updates,
            },
          }
        : previous
    ));
  };

  const loadListingLifecycleAudit = async (listing: Listing, options?: { silent?: boolean }) => {
    setSelectedListingAuditId(listing.id);
    setSelectedListingForAudit(listing);
    setListingAuditError('');
    if (!options?.silent) {
      setListingAuditLoading(true);
    }

    try {
      const audit = await equipmentService.getListingLifecycleAudit(listing.id);
      setListingAuditData(audit);
      if (audit.listing) {
        mergeListingPatch(listing.id, audit.listing);
      }
    } catch (error) {
      console.error('Error loading listing lifecycle audit:', error);
      setListingAuditError(error instanceof Error ? error.message : 'Unable to load lifecycle audit right now.');
      if (!options?.silent) {
        setListingAuditData(null);
      }
    } finally {
      if (!options?.silent) {
        setListingAuditLoading(false);
      }
    }
  };

  const fetchData = async () => {
    if (!authUser?.uid) {
      listingsInitializedRef.current = false;
      operationalLoadKeyRef.current = '';
      setAdminOperationsLoaded(false);
      setLoading(false);
      return;
    }

    if (shouldLoadAdminOperations) {
      // Fetch users independently so a failure doesn't block the rest of the dashboard
      void fetchUsers();
    }

    if (!shouldLoadListingsData) {
      setLoading(false);
      return;
    }

    const operationalLoadKey = `${authUser.uid}:${showDemoListings ? 'demo' : 'live'}`;

    if (listingsInitializedRef.current && operationalLoadKeyRef.current === operationalLoadKey) {
      setLoading(false);
      return;
    }

    operationalLoadKeyRef.current = operationalLoadKey;
    setLoading(true);

    try {
      const listingsPage = await equipmentService.getAdminListingsPage({
        pageSize: LISTINGS_PAGE_SIZE,
        includeDemoListings: showDemoListings,
      });

      setListings(listingsPage.listings);
      setNextListingCursor(listingsPage.nextCursor);
      setListingHasMore(listingsPage.hasMore);
      setListingPage(1);
      setListingCursorHistory([null]);
      setDemoInventoryRecommended(false);
      listingsInitializedRef.current = true;
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (operationalLoadKeyRef.current === operationalLoadKey) {
        operationalLoadKeyRef.current = '';
      }
    } finally {
      if (operationalLoadKeyRef.current === operationalLoadKey) {
        operationalLoadKeyRef.current = '';
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [activeTab, authUser?.uid]);

  useEffect(() => {
    userDirectoryLoadKeyRef.current = '';
    setAdminOperationsLoaded(false);
  }, [authUser?.uid]);

  useEffect(() => {
    if (activeTab === 'billing' || activeTab === 'tracking') {
      void fetchBillingData();
    }

    if (activeTab === 'content') {
      void fetchContentData();
    }
  }, [activeTab, authUser?.uid]);

  useEffect(() => {
    if (!authUser?.uid || !listingsInitializedRef.current) {
      return;
    }

    setSearchQuery('');
    void loadListingsPage(null, 1, showDemoListings);
  }, [showDemoListings]);

  useEffect(() => {
    if (!authUser?.uid || !['overview', 'listings'].includes(activeTab)) {
      setListingReviewSummaries({});
      setListingReviewSummariesError('');
      setListingReviewSummariesLoading(false);
      listingReviewSummariesLoadKeyRef.current = '';
      return;
    }

    const listingIds = listings
      .map((listing) => String(listing.id || '').trim())
      .filter(Boolean)
      .slice(0, LISTINGS_PAGE_SIZE);

    if (listingIds.length === 0) {
      setListingReviewSummaries({});
      setListingReviewSummariesError('');
      setListingReviewSummariesLoading(false);
      listingReviewSummariesLoadKeyRef.current = '';
      return;
    }

    const requestKey = `${authUser.uid}:${listingIds.join(',')}`;
    if (listingReviewSummariesLoadKeyRef.current === requestKey) {
      return;
    }

    listingReviewSummariesLoadKeyRef.current = requestKey;
    setListingReviewSummariesLoading(true);
    setListingReviewSummariesError('');

    void equipmentService.getAdminListingReviewSummaries(listingIds)
      .then((summaries) => {
        if (listingReviewSummariesLoadKeyRef.current !== requestKey) {
          return;
        }

        const nextSummaries = summaries.reduce<Record<string, ListingReviewSummary>>((accumulator, summary) => {
          if (summary?.listingId) {
            accumulator[summary.listingId] = summary;
          }
          return accumulator;
        }, {});
        setListingReviewSummaries(nextSummaries);
      })
      .catch((error) => {
        console.error('Error loading listing review summaries:', error);
        if (listingReviewSummariesLoadKeyRef.current !== requestKey) {
          return;
        }
        setListingReviewSummaries({});
        setListingReviewSummariesError(error instanceof Error ? error.message : 'Unable to load listing review summaries right now.');
      })
      .finally(() => {
        if (listingReviewSummariesLoadKeyRef.current === requestKey) {
          listingReviewSummariesLoadKeyRef.current = '';
        }
        setListingReviewSummariesLoading(false);
      });
  }, [activeTab, authUser?.uid, listings]);

  const openNativeMap = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    // Detect OS and use appropriate scheme
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `maps://maps.apple.com/?q=${encodedLocation}`
      : `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(url, '_blank');
  };

  const handleSaveListing = async (formData: any) => {
    try {
      if (editingListing) {
        await equipmentService.updateListing(editingListing.id, formData);
      } else {
        await equipmentService.addListing({
          ...formData,
          sellerUid: authUser?.uid || 'anonymous'
        });
      }
      setIsModalOpen(false);
      setEditingListing(null);
      setUserFeedback({
        tone: 'success',
        message: editingListing ? 'Listing details updated successfully.' : 'New machine listing created successfully.',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving listing:', error);
      setUserFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save this listing right now.',
      });
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        await equipmentService.deleteListing(id);
        if (selectedListingAuditId === id) {
          setSelectedListingAuditId('');
          setSelectedListingForAudit(null);
          setListingAuditData(null);
          setListingAuditError('');
        }
        setUserFeedback({
          tone: 'success',
          message: 'Listing deleted successfully.',
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting listing:', error);
        setUserFeedback({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Unable to delete this listing right now.',
        });
      }
    }
  };

  const handleAdminListingLifecycleAction = async (
    listing: Listing,
    action: ListingLifecycleAction
  ) => {
    const pendingKey = `${listing.id}:${action}`;
    setPendingListingLifecycleKey(pendingKey);

    let reason = '';
    if (action === 'reject') {
      const promptValue = window.prompt('Enter a rejection reason for this listing:', listing.rejectionReason || '');
      if (promptValue === null) {
        setPendingListingLifecycleKey('');
        return;
      }
      reason = promptValue.trim();
      if (!reason) {
        setUserFeedback({
          tone: 'warning',
          message: 'A rejection reason is required before rejecting a listing.',
        });
        setPendingListingLifecycleKey('');
        return;
      }
    }

    try {
      const nextListing = await equipmentService.transitionListingLifecycle(listing.id, action, {
        reason,
        metadata: {
          triggeredFrom: 'admin_dashboard',
          actorSurface: 'admin_listings',
        },
      });

      mergeListingPatch(listing.id, nextListing);
      const auditListing = {
        ...listing,
        ...nextListing,
      } as Listing;
      await loadListingLifecycleAudit(auditListing, { silent: true });
      setUserFeedback({
        tone: 'success',
        message: `Listing ${action.replace(/_/g, ' ')} completed successfully.`,
      });
    } catch (error) {
      console.error(`Error running lifecycle action ${action} for listing ${listing.id}:`, error);
      setUserFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to complete that lifecycle action.',
      });
    } finally {
      setPendingListingLifecycleKey('');
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: Inquiry['status']) => {
    try {
      await equipmentService.updateInquiryStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Error updating inquiry status:', error);
    }
  };

  const handleAssignInquiry = async (id: string, assignedToUid: string, assignedToName?: string) => {
    try {
      await equipmentService.assignInquiry(id, assignedToUid, assignedToName);
      fetchData();
    } catch (error) {
      console.error('Error assigning inquiry:', error);
    }
  };

  const handleAddInquiryNote = async (id: string, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const optimisticNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmedText,
      authorUid: authUser?.uid,
      authorName: authUser?.displayName || 'Admin',
      createdAt: new Date().toISOString(),
    };

    setInquiries((prev) => prev.map((entry) => (
      entry.id === id
        ? { ...entry, internalNotes: [...(entry.internalNotes || []), optimisticNote] }
        : entry
    )));

    try {
      await equipmentService.addInquiryInternalNote(id, {
        text: trimmedText,
        authorUid: authUser?.uid,
        authorName: authUser?.displayName || 'Admin'
      });
      void fetchData();
    } catch (error) {
      setInquiries((prev) => prev.map((entry) => (
        entry.id === id
          ? { ...entry, internalNotes: (entry.internalNotes || []).filter((note) => note.id !== optimisticNote.id) }
          : entry
      )));
      console.error('Error adding inquiry note:', error);
    }
  };

  const handleCreateManagedAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManagedAccount.displayName || !newManagedAccount.email) return;

    try {
      setCreatingAccount(true);
      setManagedSeatError('');
      await userService.createManagedSubAccount({
        displayName: newManagedAccount.displayName,
        email: newManagedAccount.email,
        role: newManagedAccount.role,
        company: newManagedAccount.company,
        phoneNumber: newManagedAccount.phoneNumber
      });

      setNewManagedAccount({
        displayName: '',
        email: '',
        role: 'dealer',
        company: '',
        phoneNumber: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating managed account:', error);
      const message = error instanceof Error ? error.message : 'Unable to create managed account';
      setManagedSeatError(message);
      alert(message);
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleChangeUserRole = async (uid: string, role: UserRole) => {
    const pendingKey = `${uid}:role`;
    const account = accounts.find((entry) => entry.id === uid);
    const previousRole = account?.role;

    try {
      setUserFeedback(null);
      if (!account) return;

      const normalizedRole = normalizeEditableUserRole(role);
      if (normalizeEditableUserRole(previousRole) === normalizedRole) {
        return;
      }

      setPendingUserActionKey(pendingKey);
      setAccounts(prev => prev.map((entry) => (
        entry.id === uid
          ? { ...entry, role: normalizedRole }
          : entry
      )));

      const result = await adminUserService.updateUser(uid, {
        displayName: account.displayName || account.name,
        email: account.email,
        phoneNumber: account.phoneNumber || account.phone,
        company: account.company,
        role: normalizedRole,
      });

      if (result.user) {
        setAccounts(prev => prev.map(a => a.id === uid ? result.user! : a));
      }
      try {
        await fetchUsers(true);
      } catch (refreshError) {
        console.warn('Unable to refresh users after role change:', refreshError);
      }
      if (editingAccount?.id === uid) {
        setUserEditForm((prev) => ({ ...prev, role: normalizedRole }));
      }
      setUserFeedback({
        tone: result.warning ? 'warning' : 'success',
        message: result.warning || result.message || `${account.displayName || account.name}'s role was updated.`,
      });
    } catch (err) {
      console.error('Error changing user role:', err);
      setAccounts(prev => prev.map((entry) => (
        entry.id === uid
          ? { ...entry, role: previousRole || entry.role }
          : entry
      )));
      setUserFeedback({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to update the user role.',
      });
    } finally {
      setPendingUserActionKey('');
    }
  };

  const handleSuspendUser = async (uid: string) => {
    if (!window.confirm('Lock this account and prevent sign-in?')) return;
    try {
      setUserFeedback(null);
      const result = await adminUserService.lockUser(uid);
      if (result.user) {
        setAccounts(prev => prev.map(a => a.id === uid ? result.user! : a));
      }
      setUserFeedback({
        tone: result.warning ? 'warning' : 'success',
        message: result.warning || result.message || 'Account locked successfully.',
      });
    } catch (err) {
      console.error('Error suspending user:', err);
      setUserFeedback({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to lock this account.',
      });
    }
  };

  const openUserEditor = (account: Account) => {
    setEditingAccount(account);
    setUserEditForm({
      displayName: account.displayName || account.name,
      email: account.email,
      phoneNumber: account.phoneNumber || account.phone || '',
      company: account.company || '',
      role: normalizeEditableUserRole(account.role),
    });
  };

  const closeUserEditor = () => {
    setEditingAccount(null);
    setSavingUserEdit(false);
    setUserEditForm({
      displayName: '',
      email: '',
      phoneNumber: '',
      company: '',
      role: 'member',
    });
  };

  const handleSaveUserEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setUserFeedback(null);
      setSavingUserEdit(true);
      const result = await adminUserService.updateUser(editingAccount.id, userEditForm);
      if (result.user) {
        setAccounts(prev => prev.map(account => account.id === editingAccount.id ? result.user! : account));
      }
      closeUserEditor();
      try {
        await fetchUsers(true);
      } catch (refreshError) {
        console.warn('Unable to refresh users after saving user edits:', refreshError);
      }
      setUserFeedback({
        tone: result.warning ? 'warning' : 'success',
        message: result.warning || result.message || 'User details updated successfully.',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setUserFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to update this user.',
      });
      setSavingUserEdit(false);
    }
  };

  const runUserAction = async (uid: string, action: string, task: () => Promise<void>) => {
    try {
      setUserFeedback(null);
      setPendingUserActionKey(`${uid}:${action}`);
      await task();
    } catch (error) {
      console.error(`Error running ${action} for user ${uid}:`, error);
      setUserFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to complete that action.',
      });
    } finally {
      setPendingUserActionKey('');
    }
  };

  const handleSendPasswordReset = async (account: Account) => {
    await runUserAction(account.id, 'reset', async () => {
      await adminUserService.sendPasswordReset(account.id);
      setUserFeedback({
        tone: 'success',
        message: `Password reset email sent to ${account.email}.`,
      });
    });
  };

  const handleLockUser = async (account: Account) => {
    if (!window.confirm(`Lock ${account.name}'s account?`)) return;

    await runUserAction(account.id, 'lock', async () => {
      const result = await adminUserService.lockUser(account.id);
      if (result.user) {
        setAccounts(prev => prev.map(entry => entry.id === account.id ? result.user! : entry));
      }
      setUserFeedback({
        tone: result.warning ? 'warning' : 'success',
        message: result.warning || result.message || `${account.name}'s account was locked.`,
      });
    });
  };

  const handleUnlockUser = async (account: Account) => {
    await runUserAction(account.id, 'unlock', async () => {
      const result = await adminUserService.unlockUser(account.id);
      if (result.user) {
        setAccounts(prev => prev.map(entry => entry.id === account.id ? result.user! : entry));
      }
      setUserFeedback({
        tone: result.warning ? 'warning' : 'success',
        message: result.warning || result.message || `${account.name}'s account was unlocked.`,
      });
    });
  };

  const handleApproveUser = async (account: Account) => {
    await runUserAction(account.id, 'unlock', async () => {
      const result = await adminUserService.unlockUser(account.id);
      if (result.user) {
        setAccounts(prev => prev.map(entry => entry.id === account.id ? { ...result.user!, status: 'Active' } : entry));
      }
      setUserFeedback({
        tone: 'success',
        message: result.warning || `${account.name}'s account was approved.`,
      });
    });
  };

  const handleDeleteUser = async (account: Account) => {
    if (!window.confirm(`Delete ${account.name} permanently? This removes both the profile and auth account.`)) return;

    await runUserAction(account.id, 'delete', async () => {
      await adminUserService.deleteUser(account.id);
      setAccounts(prev => prev.filter(entry => entry.id !== account.id));
      setUserFeedback({
        tone: 'success',
        message: `${account.name}'s account was deleted.`,
      });
    });
  };

  const isUserActionPending = (uid: string, action: string) => pendingUserActionKey === `${uid}:${action}`;

  const getListingReviewSummary = useCallback(
    (listingId: string) => listingReviewSummaries[listingId] || null,
    [listingReviewSummaries]
  );

  const matchesListingReviewFilter = useCallback((listing: Listing, filter: ListingReviewFilter) => {
    if (filter === 'all') return true;

    const status = String(listing.status || '').trim().toLowerCase();
    const approvalStatus = String(listing.approvalStatus || 'pending').trim().toLowerCase();
    const paymentStatus = String(listing.paymentStatus || 'pending').trim().toLowerCase();
    const reviewSummary = getListingReviewSummary(listing.id);
    const hasAnomalies = Boolean(reviewSummary && (reviewSummary.anomalyCount > 0 || reviewSummary.anomalyCodes.length > 0));

    switch (filter) {
      case 'pending_approval':
        return approvalStatus === 'pending';
      case 'paid_not_live':
        return approvalStatus === 'approved' && paymentStatus === 'paid' && !['active', 'archived', 'sold'].includes(status);
      case 'rejected':
        return approvalStatus === 'rejected' || status === 'rejected';
      case 'expired':
        return status === 'expired';
      case 'sold':
        return status === 'sold';
      case 'archived':
        return status === 'archived';
      case 'anomalies':
        return hasAnomalies;
      default:
        return true;
    }
  }, [getListingReviewSummary]);

  const listingReviewCounts = useMemo(() => {
    return listings.reduce<Record<ListingReviewFilter, number>>((totals, listing) => {
      totals.all += 1;
      if (matchesListingReviewFilter(listing, 'pending_approval')) totals.pending_approval += 1;
      if (matchesListingReviewFilter(listing, 'paid_not_live')) totals.paid_not_live += 1;
      if (matchesListingReviewFilter(listing, 'rejected')) totals.rejected += 1;
      if (matchesListingReviewFilter(listing, 'expired')) totals.expired += 1;
      if (matchesListingReviewFilter(listing, 'sold')) totals.sold += 1;
      if (matchesListingReviewFilter(listing, 'archived')) totals.archived += 1;
      if (matchesListingReviewFilter(listing, 'anomalies')) totals.anomalies += 1;
      return totals;
    }, {
      all: 0,
      pending_approval: 0,
      paid_not_live: 0,
      rejected: 0,
      expired: 0,
      sold: 0,
      archived: 0,
      anomalies: 0,
    });
  }, [listings, matchesListingReviewFilter]);

  // Memoize filtered listings to avoid recalculating on every render
  const filteredListings = useMemo(() => listings.filter((listing) => {
    const searchHaystack = [
      listing.title,
      listing.manufacturer || listing.make || '',
      listing.model,
      listing.id,
      listing.stockNumber || '',
      listing.serialNumber || '',
      listing.sellerName || '',
      listing.sellerUid || listing.sellerId || '',
      listing.location || '',
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchHaystack.includes(searchQuery.toLowerCase());
    return matchesSearch && matchesListingReviewFilter(listing, listingReviewFilter);
  }), [listings, searchQuery, matchesListingReviewFilter, listingReviewFilter]);
  const recentOverviewListings = overview?.recentListings?.length ? overview.recentListings : listings.slice(0, 5);
  const recentOverviewCalls = overview?.recentCalls?.length ? overview.recentCalls : calls.slice(0, 5);
  const pendingReviewCount = listingReviewCounts.pending_approval;
  const rejectedListingCount = listingReviewCounts.rejected;
  const liveListingCount = listings.filter((listing) => (
    String(listing.status || '').trim().toLowerCase() === 'active' &&
    String(listing.approvalStatus || '').trim().toLowerCase() === 'approved' &&
    String(listing.paymentStatus || '').trim().toLowerCase() === 'paid'
  )).length;
  const paidNotLiveCount = listingReviewCounts.paid_not_live;
  const anomalyListingCount = listingReviewCounts.anomalies;
  const stats = [
    { label: 'Visible Equipment', value: overview?.metrics?.visibleEquipment ?? liveListingCount, icon: Package, color: 'text-accent', note: 'Approved paid inventory now live.' },
    { label: 'Total Leads', value: overview?.metrics?.totalLeads ?? inquiries.length, icon: MessageSquare, color: 'text-secondary', note: 'Qualified and pending inbound leads.' },
    { label: 'Call Volume', value: overview?.metrics?.callVolume ?? calls.length, icon: Phone, color: 'text-data', note: 'Tracked marketplace call records.' },
    { label: 'Active Users', value: overview?.metrics?.activeUsers ?? accounts.filter((account) => account.status === 'Active').length, icon: Users, color: 'text-ink', note: 'Accounts currently marked active.' }
  ];

  const selectedListingAudit = selectedListingAuditId
    ? filteredListings.find((entry) => entry.id === selectedListingAuditId) ||
      listings.find((entry) => entry.id === selectedListingAuditId) ||
      selectedListingForAudit
    : null;

  const formatLifecycleLabel = (value: string) =>
    String(value || '')
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Unknown';

  const getListingBadgeClasses = (value: string, type: 'status' | 'approval' | 'payment' | 'visibility') => {
    const normalized = String(value || '').trim().toLowerCase();

    if (type === 'payment') {
      if (normalized === 'paid') return 'bg-data/10 border border-data/30 text-data';
      if (normalized === 'failed') return 'bg-red-50 border border-red-200 text-red-700';
      return 'bg-amber-50 border border-amber-200 text-amber-800';
    }

    if (type === 'approval') {
      if (normalized === 'approved') return 'bg-data/10 border border-data/30 text-data';
      if (normalized === 'rejected') return 'bg-red-50 border border-red-200 text-red-700';
      return 'bg-amber-50 border border-amber-200 text-amber-800';
    }

    if (type === 'visibility') {
      if (normalized === 'public' || normalized === 'live') return 'bg-data/10 border border-data/30 text-data';
      if (normalized === 'private' || normalized === 'archived') return 'bg-surface border border-line text-muted';
      return 'bg-amber-50 border border-amber-200 text-amber-800';
    }

    if (normalized === 'active') return 'bg-data/10 border border-data/30 text-data';
    if (normalized === 'sold') return 'bg-secondary/10 border border-secondary/30 text-secondary';
    if (normalized === 'archived' || normalized === 'expired') return 'bg-surface border border-line text-muted';
    return 'bg-amber-50 border border-amber-200 text-amber-800';
  };

  const getAdminLifecycleActions = (listing: Listing): Array<{ action: ListingLifecycleAction; label: string; tone: 'primary' | 'secondary' | 'danger' }> => {
    const status = String(listing.status || 'pending').trim().toLowerCase();
    const approvalStatus = String(listing.approvalStatus || 'pending').trim().toLowerCase();
    const paymentStatus = String(listing.paymentStatus || 'pending').trim().toLowerCase();
    const actions: Array<{ action: ListingLifecycleAction; label: string; tone: 'primary' | 'secondary' | 'danger' }> = [];

    if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
      actions.push({ action: 'approve', label: 'Approve', tone: 'primary' });
    }
    if (approvalStatus !== 'rejected' && status !== 'archived' && status !== 'sold') {
      actions.push({ action: 'reject', label: 'Reject', tone: 'danger' });
    }
    if (approvalStatus === 'approved' && paymentStatus !== 'paid' && status !== 'archived') {
      actions.push({ action: 'payment_confirmed', label: 'Confirm Payment', tone: 'secondary' });
    }
    if (approvalStatus === 'approved' && paymentStatus === 'paid' && status !== 'active' && status !== 'archived') {
      actions.push({ action: 'publish', label: 'Publish', tone: 'primary' });
    }
    if (status === 'rejected' || approvalStatus === 'rejected') {
      actions.push({ action: 'submit', label: 'Resubmit', tone: 'secondary' });
    }
    if (status === 'active') {
      actions.push({ action: 'expire', label: 'Expire', tone: 'secondary' });
    }
    if (['expired', 'sold', 'archived'].includes(status)) {
      actions.push({ action: 'relist', label: 'Relist', tone: 'primary' });
    }
    if (!['sold', 'archived'].includes(status)) {
      actions.push({ action: 'mark_sold', label: 'Mark Sold', tone: 'secondary' });
    }
    if (status !== 'archived') {
      actions.push({ action: 'archive', label: 'Archive', tone: 'secondary' });
    }

    return actions;
  };

  const isListingLifecyclePending = (listingId: string, action: ListingLifecycleAction) =>
    pendingListingLifecycleKey === `${listingId}:${action}`;

  const filteredAccounts = accounts.filter(account => {
    const haystack = [
      account.name,
      account.displayName,
      account.email,
      account.company,
      account.role,
      account.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(userSearchQuery.trim().toLowerCase());
  });

  const dealerFeedTargetAccounts = useMemo(
    () =>
      accounts
        .filter((account) => ['dealer', 'pro_dealer'].includes(account.role))
        .sort((left, right) => {
          const leftLabel = `${left.displayName || left.name || ''} ${left.company || ''}`.trim().toLowerCase();
          const rightLabel = `${right.displayName || right.name || ''} ${right.company || ''}`.trim().toLowerCase();
          return leftLabel.localeCompare(rightLabel);
        }),
    [accounts]
  );

  const exportUsersCSV = () => {
    const headers = [
      'User ID',
      'Display Name',
      'Email',
      'Phone',
      'Company',
      'Role',
      'Status',
      'Email Verified',
      'Total Listings',
      'Total Leads',
      'Last Login',
      'Joined',
      'Parent Account UID'
    ];

    const rows = filteredAccounts.map((account) => [
      account.id,
      account.displayName || account.name,
      account.email,
      account.phoneNumber || account.phone || '',
      account.company || '',
      getAdminRoleDisplayLabel(account.role),
      account.status,
      account.emailVerified ? 'yes' : 'no',
      String(account.totalListings),
      String(account.totalLeads),
      account.lastLogin ? new Date(account.lastLogin).toLocaleString() : '',
      account.memberSince ? new Date(account.memberSince).toLocaleDateString() : '',
      account.parentAccountUid || '',
    ]);

    downloadCsv('users', headers, rows);
  };

  const exportContentCSV = () => {
    const headers = [
      'Content Type',
      'ID',
      'Title',
      'Label Or Filename',
      'Status',
      'Category Or Mime Type',
      'Owner',
      'Tags',
      'Primary Date',
      'Reference',
      'Summary'
    ];

    const postRows = blogPosts.map((post) => [
      'blog_post',
      post.id,
      post.title || '',
      post.seoSlug || '',
      post.reviewStatus || post.status || '',
      post.category || '',
      post.authorName || '',
      (post.tags || []).join('|'),
      post.updatedAt ? new Date(post.updatedAt).toLocaleString() : '',
      post.image || '',
      post.excerpt || '',
    ]);

    const mediaRows = mediaItems.map((item) => [
      'media',
      item.id,
      item.altText || '',
      item.filename || '',
      '',
      item.mimeType || '',
      item.uploadedByName || item.uploadedBy || '',
      (item.tags || []).join('|'),
      item.createdAt ? formatTimestamp(item.createdAt) : '',
      item.url || '',
      '',
    ]);

    const blockRows = contentBlocks.map((block) => [
      'content_block',
      block.id,
      block.title || '',
      block.label || '',
      '',
      block.type || '',
      '',
      '',
      '',
      '',
      block.content || '',
    ]);

    downloadCsv('content', headers, [...postRows, ...mediaRows, ...blockRows]);
  };

  const exportPerformanceCSV = () => {
    const totalListings = listings.length;
    const activeListings = listings.filter((listing) => listing.status === 'active' || !listing.status).length;
    const totalInquiries = inquiries.length;
    const wonInquiries = inquiries.filter((inquiry) => inquiry.status === 'Won').length;
    const conversionRate = totalInquiries === 0 ? 0 : Math.round((wonInquiries / totalInquiries) * 100);
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((account) => account.status === 'Active').length;
    const totalInventoryValue = listings.reduce((sum, listing) => sum + (listing.price || 0), 0);
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    const totalRevenue = invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
    const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active').length;

    const headers = ['Section', 'Metric', 'Value', 'Notes'];
    const rows = [
      ['inventory', 'total_listings', String(totalListings), 'All listings currently loaded in admin'],
      ['inventory', 'active_listings', String(activeListings), 'Listings with active or unset status'],
      ['inventory', 'total_inventory_value_usd', String(totalInventoryValue), 'Sum of current listing prices'],
      ['inventory', 'total_views', String(totalViews), 'Aggregate listing views'],
      ['leads', 'total_leads', String(totalInquiries), 'Inquiry records loaded in admin'],
      ['leads', 'won_leads', String(wonInquiries), 'Inquiries marked Won'],
      ['leads', 'conversion_rate_percent', String(conversionRate), 'Won leads divided by total leads'],
      ['users', 'total_accounts', String(totalAccounts), 'All accounts loaded in admin'],
      ['users', 'active_accounts', String(activeAccounts), 'Accounts marked Active'],
      ['billing', 'paid_revenue_usd', String(totalRevenue), 'Sum of paid invoices'],
      ['billing', 'active_subscriptions', String(activeSubscriptions), 'Subscriptions with active status'],
    ];

    downloadCsv('performance', headers, rows);
  };

  const exportBillingCSV = () => {
    setExportingBillingCsv(true);
    try {
      const headers = [
        'section',
        'primary_id',
        'secondary_id',
        'status',
        'amount',
        'currency',
        'user_uid',
        'plan_id',
        'details',
        'timestamp',
      ];

      const invoiceRows = invoices.map((invoice) => [
        'invoice',
        invoice.id,
        invoice.stripeInvoiceId || '',
        invoice.status,
        String(invoice.amount ?? ''),
        invoice.currency || '',
        invoice.userUid || '',
        '',
        Array.isArray(invoice.items) ? invoice.items.join(' | ') : '',
        formatTimestamp(invoice.paidAt || invoice.createdAt),
      ]);

      const subscriptionRows = subscriptions.map((subscription) => [
        'subscription',
        subscription.id,
        subscription.stripeSubscriptionId || '',
        subscription.status,
        '',
        '',
        subscription.userUid || '',
        subscription.planId || '',
        subscription.cancelAtPeriodEnd ? 'cancel_at_period_end' : '',
        formatTimestamp(subscription.currentPeriodEnd),
      ]);

      const billingAuditRows = billingLogs.map((log) => [
        'billing_audit',
        log.id,
        log.invoiceId || '',
        log.action || '',
        '',
        '',
        log.userUid || '',
        '',
        log.details || '',
        formatTimestamp(log.timestamp),
      ]);

      const accountAuditRows = accountAuditLogs.map((log) => [
        'account_audit',
        log.id,
        log.actorUid || '',
        log.eventType || '',
        '',
        '',
        log.targetUid || '',
        '',
        [log.source, log.reason].filter(Boolean).join(' | '),
        formatTimestamp(log.createdAt),
      ]);

      const acceptanceRows = sellerAgreementAcceptances.map((acceptance) => [
        'seller_acceptance',
        acceptance.id,
        acceptance.checkoutSessionId || acceptance.stripeSubscriptionId || '',
        acceptance.status || acceptance.checkoutState || '',
        '',
        '',
        acceptance.userUid || '',
        acceptance.planId || '',
        acceptance.statementLabel || '',
        formatTimestamp(acceptance.updatedAt || acceptance.createdAt),
      ]);

      downloadCsv('billing-report', headers, [
        ...invoiceRows,
        ...subscriptionRows,
        ...billingAuditRows,
        ...accountAuditRows,
        ...acceptanceRows,
      ]);
      setUserFeedback({
        tone: 'success',
        message: 'Billing report exported.',
      });
    } finally {
      setExportingBillingCsv(false);
    }
  };

  const exportDealerPerformance30DayCSV = async () => {
    setExportingDealerPerformanceCsv(true);
    try {
      const report: AdminDealerPerformanceReportResponse = await billingService.getAdminDealerPerformanceReport(30);
      const headers = [
        'section',
        'period_label',
        'period_start',
        'period_end',
        'seller_uid',
        'seller_name',
        'seller_email',
        'role',
        'listing_id',
        'listing_title',
        'listings',
        'lead_forms',
        'calls',
        'connected_calls',
        'qualified_calls',
        'missed_calls',
        'views',
        'inquiry_count',
        'call_count',
        'view_count',
      ];

      const summaryRows = report.sellerSummaries.map((summary) => [
        'seller_summary',
        report.periodLabel,
        report.periodStartIso,
        report.periodEndIso,
        summary.sellerUid,
        summary.name || '',
        summary.email || '',
        summary.role || '',
        '',
        '',
        String(summary.listings || 0),
        String(summary.leadForms || 0),
        String(summary.calls || 0),
        String(summary.connectedCalls || 0),
        String(summary.qualifiedCalls || 0),
        String(summary.missedCalls || 0),
        String(summary.totalViews || 0),
        '',
        '',
        '',
      ]);

      const machineRows = report.sellerSummaries.flatMap((summary) =>
        (summary.topMachines || []).map((machine) => [
          'top_machine',
          report.periodLabel,
          report.periodStartIso,
          report.periodEndIso,
          summary.sellerUid,
          summary.name || '',
          summary.email || '',
          summary.role || '',
          machine.listingId || '',
          machine.title || '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          String(machine.inquiryCount || 0),
          String(machine.callCount || 0),
          String(machine.viewCount || 0),
        ])
      );

      const totalsRow = [[
        'totals',
        report.periodLabel,
        report.periodStartIso,
        report.periodEndIso,
        '',
        'Marketplace Totals',
        '',
        '',
        '',
        '',
        String(report.totals.listings || 0),
        String(report.totals.leadForms || 0),
        String(report.totals.calls || 0),
        String(report.totals.connectedCalls || 0),
        String(report.totals.qualifiedCalls || 0),
        String(report.totals.missedCalls || 0),
        String(report.totals.totalViews || 0),
        '',
        '',
        '',
      ]];

      downloadCsv('dealer-performance-30-day', headers, [...summaryRows, ...machineRows, ...totalsRow]);
      setUserFeedback({
        tone: 'success',
        message: '30-day dealer performance report exported.',
      });
    } catch (error) {
      console.error('Error exporting 30-day dealer performance report:', error);
      setUserFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to export the 30-day dealer performance report.',
      });
    } finally {
      setExportingDealerPerformanceCsv(false);
    }
  };

  const exportListingsCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Manufacturer', 'Model', 'Year', 'Price', 'Hours', 'Location', 'Status', 'Approval', 'Payment', 'Seller UID', 'Stock #', 'Views', 'Leads', 'Created At'];
    const rows = filteredListings.map((l) => [
      l.id,
      l.title,
      l.category || '',
      l.manufacturer || l.make || '',
      l.model || '',
      String(l.year || ''),
      String(l.price || 0),
      String(l.hours || ''),
      l.location || '',
      l.status || '',
      l.approvalStatus || '',
      l.paymentStatus || '',
      l.sellerUid || l.sellerId || '',
      l.stockNumber || '',
      String(l.views || 0),
      String(l.leads || 0),
      l.createdAt || '',
    ]);
    downloadCsv('inventory', headers, rows);
  };

  const renderOverview = () => (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface border border-line p-8 rounded-sm shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 bg-bg border border-line rounded-sm ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <span className="label-micro block mb-1">{stat.label}</span>
            <span className="text-3xl font-black tracking-tighter text-ink">{stat.value}</span>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Inventory</h3>
            <button onClick={() => selectAdminTab('listings')} className="text-[10px] font-bold text-muted uppercase hover:text-ink">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOverviewListings.map(listing => (
                  <tr key={listing.id} className="hover:bg-surface/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-surface rounded-sm overflow-hidden border border-line">
                          <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-tight text-ink">{listing.title}</span>
                          <span className="text-[9px] font-bold text-muted uppercase">{listing.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black tracking-tighter text-ink">{formatPrice(listing.price, listing.currency || 'USD', 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openNativeMap(listing.location)} className="p-2 text-accent hover:text-accent/80">
                        <MapPin size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Calls</h3>
            <button onClick={() => selectAdminTab('calls')} className="text-[10px] font-bold text-muted uppercase hover:text-ink">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                  <th className="px-6 py-4">Caller</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOverviewCalls.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-[10px] font-black uppercase tracking-widest text-muted">
                      No calls available yet.
                    </td>
                  </tr>
                )}
                {recentOverviewCalls.map(call => (
                  <tr key={call.id} className="hover:bg-surface/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-ink">{call.callerName}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">{call.callerPhone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-ink">{call.duration}s</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${call.status === 'Completed' ? 'text-data' : 'text-accent'}`}>
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccounts = () => (
    <div className="space-y-6">
      <div className="bg-surface border border-line rounded-sm p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Managed Account Seats</div>
          <div className="text-sm font-black uppercase tracking-tight text-ink">Dealer and Pro Dealer packages include up to 3 managed team accounts.</div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Existing managed accounts: {accounts.filter((account) => !!account.parentAccountUid).length}
        </div>
      </div>

      <form onSubmit={handleCreateManagedAccount} className="bg-bg border border-line rounded-sm p-6 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input value={newManagedAccount.displayName} onChange={(e) => setNewManagedAccount({ ...newManagedAccount, displayName: e.target.value })} placeholder="NAME" className="input-industrial md:col-span-2" required />
        <input value={newManagedAccount.email} onChange={(e) => setNewManagedAccount({ ...newManagedAccount, email: e.target.value })} placeholder="EMAIL" className="input-industrial md:col-span-2" type="email" required />
        <select value={newManagedAccount.role} onChange={(e) => setNewManagedAccount({ ...newManagedAccount, role: e.target.value as UserRole })} className="select-industrial md:col-span-1">
          {assignableRoleOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button type="submit" disabled={creatingAccount} className="btn-industrial btn-accent md:col-span-1 py-2">
          {creatingAccount ? 'Creating...' : 'Add Role'}
        </button>
      </form>
      {managedSeatError ? (
        <div className="flex items-center gap-2 border border-accent/30 bg-accent/5 rounded-sm px-4 py-3 text-xs font-medium text-accent">
          <AlertCircle size={14} className="shrink-0" />
          <span>{managedSeatError}</span>
        </div>
      ) : null}

      {/* Role Permissions Matrix */}
      <details className="bg-bg border border-line rounded-sm overflow-hidden">
        <summary className="px-6 py-4 bg-surface text-xs font-black uppercase tracking-[0.2em] text-ink cursor-pointer hover:bg-surface/70 list-none flex items-center justify-between">
          <span>Role Capabilities Matrix</span>
          <Shield size={14} className="text-muted" />
        </summary>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-[9px] font-black uppercase tracking-widest">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-muted">Role</th>
                <th className="px-3 py-2 text-muted text-center">Inventory</th>
                <th className="px-3 py-2 text-muted text-center">Content</th>
                <th className="px-3 py-2 text-muted text-center">Users</th>
                <th className="px-3 py-2 text-muted text-center">Billing</th>
                <th className="px-3 py-2 text-muted text-center">Settings</th>
                <th className="px-3 py-2 text-muted text-center">Dev / Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {[
                { role: 'Super Admin',      inv: true,  cont: true,  users: true,  bill: true,  set: true,  dev: true  },
                { role: 'Admin',            inv: true,  cont: true,  users: true,  bill: true,  set: true,  dev: false },
                { role: 'Content Manager',  inv: false, cont: true,  users: false, bill: false, set: false, dev: false },
                { role: 'Editor',           inv: false, cont: true,  users: false, bill: false, set: false, dev: false },
                { role: 'Pro Dealer',       inv: true,  cont: false, users: true,  bill: false, set: false, dev: false },
                { role: 'Dealer',           inv: true,  cont: false, users: false, bill: false, set: false, dev: false },
                { role: 'Owner-Operator',   inv: true,  cont: false, users: false, bill: false, set: false, dev: false },
                { role: 'Member',           inv: false, cont: false, users: false, bill: false, set: false, dev: false },
              ].map(row => (
                <tr key={row.role} className="hover:bg-surface/20">
                  <td className="px-3 py-2 text-ink">{row.role}</td>
                  {[row.inv, row.cont, row.users, row.bill, row.set, row.dev].map((v, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      <span className={v ? 'text-data' : 'text-line'}>
                        {v ? '✓' : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[8px] font-bold text-muted uppercase mt-3">* Editor: draft/publish only. Content Manager: full CMS including media & blocks.</p>
        </div>
      </details>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Account Management</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 w-full sm:w-64">
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search accounts..."
              className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
            />
            <Search size={14} className="text-muted shrink-0" />
          </div>
        </div>
      </div>

      <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAccounts.map(account => (
                <tr key={account.id} className="hover:bg-surface/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-ink">{account.name}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{account.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-ink uppercase">{account.company}</td>
                  <td className="px-6 py-4">
                    {(() => {
                      const normalizedAccountRole = normalizeEditableUserRole(account.role);
                      const accountRoleOptions = canAssignSuperAdmin || normalizedAccountRole !== 'super_admin'
                        ? assignableRoleOptions
                        : [{ value: 'super_admin' as UserRole, label: 'Super Admin' }, ...assignableRoleOptions];
                      const isRoleEditable = accountRoleOptions.some((option) => option.value === normalizedAccountRole);

                      return (
                    <select
                      value={normalizedAccountRole}
                      onChange={e => handleChangeUserRole(account.id, e.target.value as UserRole)}
                      className="select-industrial text-[9px] py-1"
                      disabled={!isRoleEditable || isUserActionPending(account.id, 'role')}
                      aria-busy={isUserActionPending(account.id, 'role')}
                    >
                      {accountRoleOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                      account.status === 'Active' ? 'bg-data/10 text-data' : 'bg-accent/10 text-accent'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted uppercase">Listings: {account.totalListings}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">Leads: {account.totalLeads}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-2 text-muted hover:text-ink" title="Edit" onClick={() => openUserEditor(account)}><Edit size={14} /></button>
                      <button
                        onClick={() => handleSuspendUser(account.id)}
                        className="p-2 text-muted hover:text-accent"
                        title="Suspend user"
                      >
                        <ShieldAlert size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                    No accounts matched that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCalls = () => {
    const cq = adminCallSearchQuery.toLowerCase();
    const filteredCalls = cq
      ? calls.filter((call) =>
          (call.callerName || '').toLowerCase().includes(cq) ||
          (call.callerEmail || '').toLowerCase().includes(cq) ||
          (call.callerPhone || '').toLowerCase().includes(cq) ||
          (call.listingTitle || '').toLowerCase().includes(cq) ||
          (call.sellerName || '').toLowerCase().includes(cq) ||
          (call.status || '').toLowerCase().includes(cq)
        )
      : calls;
    const visibleCalls = filteredCalls.slice(0, adminCallDisplayCount);
    const hasMoreCalls = filteredCalls.length > adminCallDisplayCount;

    return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Call Monitoring</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search calls..."
              value={adminCallSearchQuery}
              onChange={(e) => { setAdminCallSearchQuery(e.target.value); setAdminCallDisplayCount(20); }}
              className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-2 placeholder:text-muted focus:outline-none focus:border-accent w-48"
            />
            <Search size={14} className="text-muted shrink-0" />
          </div>
          <span className="text-[10px] font-black text-data uppercase">Total: {filteredCalls.length}</span>
          <button
            type="button"
            onClick={exportCallsCSV}
            className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
          >
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>
      <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-bg">
              <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                <th className="px-6 py-4">Caller</th>
                <th className="px-6 py-4">Ad</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Audio</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Authenticated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibleCalls.map(call => (
                <tr key={call.id} className="hover:bg-surface/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-ink">{call.callerName}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.callerEmail || 'NO EMAIL'}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.callerPhone}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">UID: {call.callerUid || 'GUEST'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-ink">#{call.listingId}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.listingTitle || 'Unknown Listing'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-ink">{call.sellerName || 'Unknown Seller'}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{call.sellerPhone || 'NO PHONE'}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">UID: {call.sellerUid || call.sellerId || 'UNKNOWN'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-ink">{call.duration}s</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${call.status === 'Completed' ? 'text-data' : call.status === 'Initiated' ? 'text-ink' : 'text-accent'}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 normal-case">
                    {call.recordingUrl ? (
                      <div className="flex flex-col gap-2">
                        <audio controls preload="none" className="max-w-[220px]">
                          <source src={`/api/admin/calls/${encodeURIComponent(call.id)}/recording`} type="audio/mpeg" />
                        </audio>
                        <a
                          href={`/api/admin/calls/${encodeURIComponent(call.id)}/recording`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-accent hover:text-ink transition-colors"
                        >
                          Open audio
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted">No audio</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-muted uppercase">
                    {formatTimestamp(call.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">
                    {call.isAuthenticated ? 'YES' : 'NO'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMoreCalls && (
          <div className="p-4 border-t border-line flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Showing {visibleCalls.length} of {filteredCalls.length} calls
            </span>
            <button
              type="button"
              onClick={() => setAdminCallDisplayCount((prev) => prev + 20)}
              className="btn-industrial py-1.5 px-4 text-[10px]"
            >
              View More
            </button>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderListings = () => (
    <div className="space-y-6">
      {listingsLoadError && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-sm p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-700">{listingsLoadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadListingsPage(null, 1, showDemoListings)}
            className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
          >
            <RefreshCw size={12} className="mr-1.5" /> Retry
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <div className="flex items-center gap-2 w-full sm:w-96">
          <input
            type="text"
            placeholder="Search by name, id, or seller..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
          />
          <Search size={14} className="text-muted shrink-0" />
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={exportListingsCSV} className="btn-industrial py-2 px-4 flex items-center">
            <Download size={14} className="mr-2" />
            Export CSV
          </button>
          <button className="btn-industrial py-2 px-4 flex items-center">
            <Filter size={14} className="mr-2" />
            Filter
          </button>
          <button
            onClick={() => { setEditingListing(null); setIsModalOpen(true); }}
            className="btn-industrial btn-accent py-2 px-6 flex items-center"
          >
            <Plus size={14} className="mr-2" />
            Add Machine
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-sm border border-line bg-bg px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {filteredListings.length} loaded listings on page {listingPage}
        </span>
        <span>
          {listingsLoading ? 'Loading next inventory slice...' : listingHasMore ? 'More listings available' : 'End of loaded inventory'}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800">Pending Review</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-amber-900">{pendingReviewCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-amber-800">Needs admin or super admin decision</p>
        </div>
        <div className="rounded-sm border border-data/30 bg-data/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-data">Live Listings</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-ink">{liveListingCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-data">Approved, paid, and publicly visible</p>
        </div>
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-700">Rejected Listings</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-red-900">{rejectedListingCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-700">Require correction before resubmission</p>
        </div>
      </div>

      <BulkImportToolkit
        ownerUid={authUser?.uid}
        workspaceLabel={authUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
        listingAllowanceText="Unlimited unpaid listings"
      />

      <div className="rounded-sm border border-line bg-surface px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Operator Review Filters</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Loaded page filters for pending approval, paid not live, rejected, expired, sold, archived, and anomalies.
            </p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {listingReviewSummariesLoading ? 'Refreshing review summaries...' : 'Review summaries synced from governance artifacts'}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Loaded', count: listingReviewCounts.all },
            { key: 'pending_approval', label: 'Pending Approval', count: pendingReviewCount },
            { key: 'paid_not_live', label: 'Paid Not Live', count: paidNotLiveCount },
            { key: 'rejected', label: 'Rejected', count: rejectedListingCount },
            { key: 'expired', label: 'Expired', count: listingReviewCounts.expired },
            { key: 'sold', label: 'Sold', count: listingReviewCounts.sold },
            { key: 'archived', label: 'Archived', count: listingReviewCounts.archived },
            { key: 'anomalies', label: 'Anomalies', count: anomalyListingCount },
          ].map((option) => {
            const isActive = listingReviewFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setListingReviewFilter(option.key as ListingReviewFilter)}
                className={`rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                  isActive
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-bg text-ink hover:border-accent'
                }`}
              >
                {option.label} ({option.count})
              </button>
            );
          })}
        </div>
        {listingReviewSummariesError ? (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-yellow-200 bg-yellow-50 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-yellow-800">
            <AlertCircle size={14} className="shrink-0" />
            <span>{listingReviewSummariesError}</span>
          </div>
        ) : null}
      </div>

      <VirtualizedListingsTable
        listings={filteredListings}
        onEdit={(listing) => { setEditingListing(listing); setIsModalOpen(true); }}
        onDelete={handleDeleteListing}
        onInspect={(listing) => { void loadListingLifecycleAudit(listing); }}
        openNativeMap={openNativeMap}
      />

      {selectedListingAudit && (
        <div className="rounded-sm border border-line bg-surface shadow-sm">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Lifecycle Control Panel</span>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-ink">
                  {selectedListingAudit.title || '(Untitled Listing)'}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {selectedListingAudit.manufacturer || selectedListingAudit.make || 'Unknown Manufacturer'} · {selectedListingAudit.model || 'Unknown Model'} · ID {selectedListingAudit.id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(selectedListingAudit.status || 'pending'), 'status')}`}>
                  Status: {formatLifecycleLabel(String(selectedListingAudit.status || 'pending'))}
                </span>
                <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(selectedListingAudit.approvalStatus || 'pending'), 'approval')}`}>
                  Review: {formatLifecycleLabel(String(selectedListingAudit.approvalStatus || 'pending'))}
                </span>
                <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(selectedListingAudit.paymentStatus || 'pending'), 'payment')}`}>
                  Payment: {formatLifecycleLabel(String(selectedListingAudit.paymentStatus || 'pending'))}
                </span>
                {listingAuditData?.report?.shadowState?.visibilityState && (
                  <span className={`rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${getListingBadgeClasses(String(listingAuditData.report.shadowState.visibilityState), 'visibility')}`}>
                    Visibility: {formatLifecycleLabel(String(listingAuditData.report.shadowState.visibilityState))}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadListingLifecycleAudit(selectedListingAudit)}
                disabled={listingAuditLoading}
                className="btn-industrial py-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={12} className={`mr-1.5 ${listingAuditLoading ? 'animate-spin' : ''}`} />
                Refresh Audit
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedListingAuditId('');
                  setSelectedListingForAudit(null);
                  setListingAuditData(null);
                  setListingAuditError('');
                }}
                className="btn-industrial py-2 px-4"
              >
                Close Panel
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {getAdminLifecycleActions(selectedListingAudit).map((option) => (
                <button
                  key={`${selectedListingAudit.id}:${option.action}`}
                  type="button"
                  onClick={() => void handleAdminListingLifecycleAction(selectedListingAudit, option.action)}
                  disabled={isListingLifecyclePending(selectedListingAudit.id, option.action)}
                  className={`rounded-sm px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    option.tone === 'danger'
                      ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : option.tone === 'primary'
                        ? 'border border-accent bg-accent text-white hover:bg-accent/90'
                        : 'border border-line bg-bg text-ink hover:border-accent'
                  }`}
                >
                  {isListingLifecyclePending(selectedListingAudit.id, option.action) ? 'Working...' : option.label}
                </button>
              ))}
            </div>

            {listingAuditError && (
              <div className="flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Audit Unavailable</p>
                  <p className="text-xs font-semibold leading-5">{listingAuditError}</p>
                </div>
              </div>
            )}

            {listingAuditLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-sm border border-line bg-bg p-4">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-accent" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Governance Snapshot</h4>
                    </div>
                    {listingAuditData?.report ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Lifecycle</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(listingAuditData.report.shadowState?.lifecycleState || 'unknown'))}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Review</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(listingAuditData.report.shadowState?.reviewState || 'unknown'))}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Payment</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(listingAuditData.report.shadowState?.paymentState || 'unknown'))}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Inventory</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(listingAuditData.report.shadowState?.inventoryState || 'unknown'))}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Visibility</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(listingAuditData.report.shadowState?.visibilityState || 'unknown'))}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Public</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{listingAuditData.report.shadowState?.isPublic ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="rounded-sm border border-line bg-surface px-4 py-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted">Summary</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{listingAuditData.report.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(listingAuditData.report.anomalyCodes || []).length > 0 ? (
                            listingAuditData.report.anomalyCodes.map((code) => (
                              <span key={code} className="rounded-sm border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-700">
                                {formatLifecycleLabel(code)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-sm border border-data/30 bg-data/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-data">
                              No anomalies detected
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-semibold text-muted">No governance snapshot is available for this listing yet.</p>
                    )}
                  </div>

                  <div className="rounded-sm border border-line bg-bg p-4">
                    <div className="flex items-center gap-2">
                      <Image size={14} className="text-accent" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Media Audit</h4>
                    </div>
                    {listingAuditData?.mediaAudit ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Audit Status</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{formatLifecycleLabel(String(listingAuditData.mediaAudit.status || 'unknown'))}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Images</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{listingAuditData.mediaAudit.imageCount ?? 0}</p>
                          </div>
                          <div className="rounded-sm border border-line bg-surface px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Primary Image</p>
                            <p className="mt-1 text-xs font-black uppercase text-ink">{listingAuditData.mediaAudit.primaryImagePresent ? 'Present' : 'Missing'}</p>
                          </div>
                        </div>
                        <div className="rounded-sm border border-line bg-surface px-4 py-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted">Summary</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{listingAuditData.mediaAudit.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(listingAuditData.mediaAudit.validationErrors || []).length > 0 ? (
                            listingAuditData.mediaAudit.validationErrors.map((errorCode) => (
                              <span key={errorCode} className="rounded-sm border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-800">
                                {formatLifecycleLabel(errorCode)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-sm border border-data/30 bg-data/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-data">
                              Media passed current checks
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-semibold text-muted">No media audit has been written for this listing yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-sm border border-line bg-bg p-4">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-accent" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Transition Log</h4>
                  </div>
                  <div className="mt-4 space-y-3">
                    {listingAuditData?.transitions?.length ? (
                      listingAuditData.transitions.map((transition) => (
                        <div key={transition.id} className="rounded-sm border border-line bg-surface px-4 py-3">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
                                {formatLifecycleLabel(transition.transitionType)}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                                Actor {transition.actorUid || 'system'} · {transition.artifactSource || 'unknown source'}
                              </p>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                              {transition.createdAt ? formatTimestamp(transition.createdAt) : 'Unknown time'}
                            </p>
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <div className="rounded-sm border border-line bg-bg px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted">From</p>
                              <p className="mt-1 text-xs font-semibold text-ink">
                                {formatLifecycleLabel(String(transition.fromState?.lifecycleState || 'unknown'))} / {formatLifecycleLabel(String(transition.fromState?.visibilityState || 'unknown'))}
                              </p>
                            </div>
                            <div className="rounded-sm border border-line bg-bg px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted">To</p>
                              <p className="mt-1 text-xs font-semibold text-ink">
                                {formatLifecycleLabel(String(transition.toState?.lifecycleState || 'unknown'))} / {formatLifecycleLabel(String(transition.toState?.visibilityState || 'unknown'))}
                              </p>
                            </div>
                          </div>
                          {(transition.anomalyCodes || []).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {transition.anomalyCodes.map((code) => (
                                <span key={code} className="rounded-sm border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-700">
                                  {formatLifecycleLabel(code)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-semibold text-muted">No lifecycle transitions have been recorded yet for this listing.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {listingPage > 1 || listingHasMore ? (
        <div className="flex items-center justify-between rounded-sm border border-line bg-surface px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
          <button
            type="button"
            onClick={() => void loadListingsPage(listingCursorHistory[listingPage - 2] ?? null, listingPage - 1, showDemoListings)}
            disabled={listingPage === 1 || listingsLoading}
            className="btn-industrial py-2 px-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span>{filteredListings.length.toLocaleString()} currently loaded</span>
          <button
            type="button"
            onClick={() => void loadListingsPage(nextListingCursor, listingPage + 1, showDemoListings)}
            disabled={!listingHasMore || listingsLoading || !nextListingCursor}
            className="btn-industrial py-2 px-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderInquiries = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Active Leads & Inquiries</h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-accent uppercase">{inquiries.filter(i => i.status === 'New').length} New</span>
          <span className="text-[10px] font-black text-data uppercase">{inquiries.filter(i => i.status === 'Won').length} Won</span>
          <span className="text-[10px] font-black text-muted uppercase">{inquiries.filter(i => !i.assignedToUid).length} Unassigned</span>
          <button
            type="button"
            onClick={exportInquiriesCSV}
            className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
          >
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>
      <InquiryList
        inquiries={inquiries}
        accounts={accounts}
        listings={listings}
        onUpdateStatus={handleUpdateInquiryStatus}
        onAssignInquiry={handleAssignInquiry}
        onAddNote={handleAddInquiryNote}
      />
    </div>
  );

  const renderTracking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Performance Tracking</h3>
        <button
          type="button"
          onClick={exportPerformanceCSV}
          className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      <AnalyticsDashboard
        listings={listings}
        inquiries={inquiries}
        accounts={accounts}
        invoices={invoices}
        subscriptions={subscriptions}
      />
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8">
      {/* Error banner */}
      {usersLoadError && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-sm p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-700">{usersLoadError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchUsers()}
            className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
          >
            <RefreshCw size={12} className="mr-1.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {usersLoading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <RefreshCw size={16} className="text-muted animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-muted">Loading users…</span>
        </div>
      )}

      {!usersLoading && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: accounts.length },
          { label: 'Active', value: accounts.filter(account => account.status === 'Active').length },
          { label: 'Suspended', value: accounts.filter(account => account.status === 'Suspended').length },
          { label: 'Pending', value: accounts.filter(account => account.status === 'Pending').length },
        ].map((metric) => (
          <div key={metric.label} className="bg-surface border border-line rounded-sm p-5">
            <span className="label-micro block mb-1">{metric.label}</span>
            <span className="text-2xl font-black tracking-tighter text-ink">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
          />
          <Search size={14} className="text-muted shrink-0" />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportUsersCSV}
            className="btn-industrial py-2 px-4 text-[10px] flex items-center"
          >
            <Download size={12} className="mr-1.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => fetchUsers()}
            className="btn-industrial btn-outline py-2 px-4 text-[10px] flex items-center"
          >
            <RefreshCw size={12} className="mr-1.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => selectAdminTab('accounts')}
            className="btn-industrial btn-accent py-2 px-6 text-[10px]"
          >
            Invite User
          </button>
        </div>
      </div>

      <div className="bg-bg border border-line rounded-sm overflow-hidden shadow-sm">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface border-b border-line">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">User</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Company</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Role</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Last Active</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAccounts.map((user) => (
                <tr key={user.id} className="hover:bg-surface/50 transition-colors align-top">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center text-ink font-black text-[11px]">
                        {(user.displayName || user.name || 'U').charAt(0)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black uppercase text-ink">{user.displayName || user.name}</span>
                        <span className="text-[9px] font-bold text-muted uppercase break-all">{user.email}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">{user.phoneNumber || user.phone || 'No phone on file'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest">{user.company || 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex w-fit text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${user.role === 'super_admin' || user.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-line text-muted'}`}>
                        {getAdminRoleDisplayLabel(user.role)}
                      </span>
                      <span className={`inline-flex w-fit text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${user.emailVerified ? 'bg-data/10 text-data' : 'bg-yellow-500/10 text-yellow-600'}`}>
                        {user.emailVerified ? 'Email Verified' : 'Email Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${user.status === 'Active' ? 'bg-data animate-pulse' : user.status === 'Pending' ? 'bg-yellow-500' : 'bg-accent'}`}></span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{user.status}</span>
                      </div>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                        Listings {user.totalListings} • Leads {user.totalLeads}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest">
                    <div className="flex flex-col gap-2">
                      <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'No activity'}</span>
                      <span>Joined {user.memberSince ? new Date(user.memberSince).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="grid grid-cols-2 gap-2 min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => openUserEditor(user)}
                        className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1"
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPasswordReset(user)}
                        disabled={isUserActionPending(user.id, 'reset')}
                        className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isUserActionPending(user.id, 'reset') ? 'animate-spin' : ''} /> Reset
                      </button>
                      {user.status === 'Pending' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveUser(user)}
                          disabled={isUserActionPending(user.id, 'unlock')}
                          className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 bg-data/10 text-data disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                      ) : user.status === 'Suspended' ? (
                        <button
                          type="button"
                          onClick={() => handleUnlockUser(user)}
                          disabled={isUserActionPending(user.id, 'unlock')}
                          className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Shield size={13} /> Unlock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLockUser(user)}
                          disabled={isUserActionPending(user.id, 'lock')}
                          className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <ShieldAlert size={13} /> Lock
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        disabled={isUserActionPending(user.id, 'delete')}
                        className="btn-industrial py-2 px-3 text-[9px] flex items-center justify-center gap-1 text-accent disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                    No users matched that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );

  const renderBilling = () => {
    if (
      billingLoading &&
      invoices.length === 0 &&
      subscriptions.length === 0 &&
      billingLogs.length === 0 &&
      accountAuditLogs.length === 0 &&
      sellerAgreementAcceptances.length === 0
    ) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (
      billingLoadError &&
      invoices.length === 0 &&
      subscriptions.length === 0 &&
      billingLogs.length === 0 &&
      accountAuditLogs.length === 0 &&
      sellerAgreementAcceptances.length === 0
    ) {
      return (
        <div className="flex items-center justify-between gap-4 rounded-sm border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-700">{billingLoadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchBillingData(true)}
            className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
          >
            <RefreshCw size={12} className="mr-1.5" /> Retry
          </button>
        </div>
      );
    }

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingCount = invoices.filter(i => i.status === 'pending').length;
    const failedCount = invoices.filter(i => i.status === 'failed').length;
    const activeSubs = subscriptions.filter(s => s.status === 'active').length;
    const accountAuditQ = accountAuditSearchQuery.toLowerCase();
    const filteredAccountAuditLogs = accountAuditQ
      ? accountAuditLogs.filter((log) =>
          (log.eventType || '').toLowerCase().includes(accountAuditQ) ||
          (log.reason || '').toLowerCase().includes(accountAuditQ) ||
          (log.actorUid || '').toLowerCase().includes(accountAuditQ) ||
          (log.targetUid || '').toLowerCase().includes(accountAuditQ) ||
          (log.source || '').toLowerCase().includes(accountAuditQ)
        )
      : accountAuditLogs;
    const visibleAccountAuditLogs = filteredAccountAuditLogs.slice(0, accountAuditDisplayCount);
    const hasMoreAccountAudit = filteredAccountAuditLogs.length > accountAuditDisplayCount;
    const recentSellerAgreementAcceptances = sellerAgreementAcceptances.slice(0, 10);
    const filteredBillingLogs = billingAuditQuery
      ? billingLogs.filter((log) => {
          const q = billingAuditQuery.toLowerCase();
          return (log.action || '').toLowerCase().includes(q) || (log.details || '').toLowerCase().includes(q);
        })
      : billingLogs;

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Billing & Revenue Dashboard</h2>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={exportBillingCSV}
              disabled={exportingBillingCsv}
              className="btn-industrial bg-surface py-2 px-4 text-[10px] flex items-center disabled:opacity-60"
            >
              <Download size={14} className="mr-2" /> {exportingBillingCsv ? 'Exporting...' : 'Export Billing CSV'}
            </button>
            {hasFullAdminDashboardScope ? (
              <button
                type="button"
                onClick={() => void exportDealerPerformance30DayCSV()}
                disabled={exportingDealerPerformanceCsv}
                className="btn-industrial py-2 px-4 text-[10px] flex items-center disabled:opacity-60"
              >
                <Download size={14} className="mr-2" /> {exportingDealerPerformanceCsv ? 'Building 30-Day Report...' : 'Export 30-Day Lead Report'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+12%', icon: TrendingUp },
            { label: 'Pending Invoices', value: pendingCount.toString(), change: '-5%', icon: Clock },
            { label: 'Failed Payments', value: failedCount.toString(), change: '0%', icon: AlertCircle },
            { label: 'Active Subscriptions', value: activeSubs.toString(), change: '+8%', icon: Users }
          ].map((stat, i) => (
            <div key={i} className="bg-surface border border-line p-6 flex justify-between items-center">
              <div>
                <span className="label-micro text-muted mb-1">{stat.label}</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black tracking-tighter">{stat.value}</span>
                  <span className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-data' : 'text-accent'}`}>{stat.change}</span>
                </div>
              </div>
              <stat.icon className="text-accent/40" size={24} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface border border-line overflow-hidden">
            <div className="p-6 border-b border-line flex justify-between items-center bg-bg/50">
              <h3 className="text-xs font-black uppercase tracking-widest">Recent Invoices</h3>
              <span className="text-[10px] font-black text-muted uppercase">{invoices.length} total</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="bg-bg/30 border-b border-line">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Invoice ID</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Amount</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invoices.slice(0, 10).map((inv, i) => (
                    <tr key={i} className="hover:bg-bg/20 transition-colors">
                      <td className="p-4 text-xs font-black tracking-tight">{inv.stripeInvoiceId || inv.id}</td>
                      <td className="p-4 text-xs font-black">${inv.amount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                          inv.status === 'paid' ? 'bg-data/10 text-data' :
                          inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          inv.status === 'failed' ? 'bg-accent/10 text-accent' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted">
                        {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-surface border border-line overflow-hidden">
            <div className="p-6 border-b border-line flex justify-between items-center bg-bg/50">
              <h3 className="text-xs font-black uppercase tracking-widest">Active Subscriptions</h3>
              <span className="text-[10px] font-black text-muted uppercase">{subscriptions.length} total</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="bg-bg/30 border-b border-line">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">User UID</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Plan</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted">Period End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {subscriptions.map((sub, i) => (
                    <tr key={i} className="hover:bg-bg/20 transition-colors">
                      <td className="p-4 text-xs font-bold truncate max-w-[100px]">{sub.userUid}</td>
                      <td className="p-4 text-xs font-black uppercase">{sub.planId}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                          sub.status === 'active' ? 'bg-data/10 text-data' : 'bg-accent/10 text-accent'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted">
                        {sub.currentPeriodEnd?.toDate ? sub.currentPeriodEnd.toDate().toLocaleDateString() : new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1917] text-white p-8 rounded-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Shield className="text-accent" size={24} />
              <h3 className="text-lg font-black uppercase tracking-tighter">Billing Audit Trail</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search audit logs..."
                  value={billingAuditQuery}
                  onChange={(e) => setBillingAuditQuery(e.target.value)}
                  className="bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm placeholder:text-white/30 focus:outline-none focus:border-accent w-52"
                />
                <Search size={14} className="text-white/40 shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => {
                  const rows = filteredBillingLogs.map((log) => {
                    const ts = log.timestamp?.toDate ? log.timestamp.toDate().toISOString() : new Date(log.timestamp).toISOString();
                    return [ts, log.action, log.details].join(',');
                  });
                  const csv = ['Timestamp,Action,Details', ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `billing-audit-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1"
              >
                <Download size={10} /> Export
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-0">
            {billingLoadError ? (
              <div className="flex items-center gap-3 rounded-sm border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-bold text-yellow-800">
                <AlertCircle size={14} className="shrink-0" />
                <span>{billingLoadError}</span>
              </div>
            ) : null}

            {filteredBillingLogs.length === 0 && !billingLoadError ? (
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest py-4 text-center">
                {billingAuditQuery ? 'No audit logs match your search' : 'No audit logs recorded'}
              </p>
            ) : filteredBillingLogs.map((log, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">{log.action}</span>
                  <span className="text-[11px] text-white/60 mt-1">{log.details}</span>
                </div>
                <span className="text-[9px] font-bold text-white/30 flex-shrink-0 ml-4">
                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-surface border border-line rounded-sm overflow-hidden">
            <div className="p-6 border-b border-line bg-bg/50 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-ink">Account Governance Audit</h3>
                <p className="mt-2 text-[11px] text-muted">
                  Role changes, entitlement syncs, subscription-linked changes, and operator-side account actions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search audit..."
                    value={accountAuditSearchQuery}
                    onChange={(e) => { setAccountAuditSearchQuery(e.target.value); setAccountAuditDisplayCount(10); }}
                    className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 placeholder:text-muted focus:outline-none focus:border-accent w-44"
                  />
                  <Search size={14} className="text-muted shrink-0" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  {filteredAccountAuditLogs.length} of {accountAuditLogs.length}
                </div>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-line">
              {visibleAccountAuditLogs.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                    {accountAuditSearchQuery ? 'No audit events match your search' : 'No account audit events loaded'}
                  </p>
                </div>
              ) : visibleAccountAuditLogs.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm border border-accent/30 bg-accent/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                          {formatLifecycleLabel(log.eventType)}
                        </span>
                        {log.source ? (
                          <span className="rounded-sm border border-line bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                            {formatLifecycleLabel(log.source)}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] font-bold text-ink">
                        {log.reason || 'No operator reason captured for this account event.'}
                      </div>
                      <div className="flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted">
                        <span>Actor: {log.actorUid || 'System'}</span>
                        <span>Target: {log.targetUid || 'Unknown'}</span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <div className="rounded-sm border border-line bg-bg px-3 py-2 text-[10px] text-muted">
                          {Object.entries(log.metadata)
                            .slice(0, 3)
                            .map(([key, value]) => `${formatLifecycleLabel(key)}: ${String(value)}`)
                            .join(' • ')}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                      {formatTimestamp(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMoreAccountAudit && (
              <div className="p-4 border-t border-line flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Showing {visibleAccountAuditLogs.length} of {filteredAccountAuditLogs.length}
                </span>
                <button
                  type="button"
                  onClick={() => setAccountAuditDisplayCount((prev) => prev + 10)}
                  className="btn-industrial py-1.5 px-4 text-[10px]"
                >
                  View More
                </button>
              </div>
            )}
          </div>

          {/* Seller Legal Acceptances are stored in Firebase but hidden from the admin dashboard UI */}
          {authUser?.role !== 'super_admin' && authUser?.role !== 'admin' && (<div className="bg-surface border border-line rounded-sm overflow-hidden">
            <div className="p-6 border-b border-line bg-bg/50 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-ink">Seller Legal Acceptances</h3>
                <p className="mt-2 text-[11px] text-muted">
                  Agreement acknowledgements captured during seller-program enrollment and Stripe checkout initiation.
                </p>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                {recentSellerAgreementAcceptances.length} loaded
              </div>
            </div>
            <div className="divide-y divide-line">
              {recentSellerAgreementAcceptances.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">No seller agreement acceptances loaded</p>
                </div>
              ) : recentSellerAgreementAcceptances.map((acceptance) => {
                const acceptedCount = [
                  acceptance.acceptedTerms,
                  acceptance.acceptedPrivacy,
                  acceptance.acceptedRecurringBilling,
                  acceptance.acceptedVisibilityPolicy,
                  acceptance.acceptedAuthority,
                ].filter(Boolean).length;

                return (
                  <div key={acceptance.id} className="px-6 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-sm border border-data/30 bg-data/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-data">
                            {formatLifecycleLabel(acceptance.planId)}
                          </span>
                          {acceptance.status ? (
                            <span className="rounded-sm border border-line bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                              {formatLifecycleLabel(acceptance.status)}
                            </span>
                          ) : null}
                          {acceptance.checkoutState ? (
                            <span className="rounded-sm border border-line bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                              Checkout: {formatLifecycleLabel(acceptance.checkoutState)}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] font-bold text-ink">
                          {acceptance.statementLabel || 'Seller program statement'}
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted">
                          <span>User: {acceptance.userUid || 'Unknown'}</span>
                          <span>Version: {acceptance.agreementVersion || 'Current'}</span>
                          <span>Acknowledgements: {acceptedCount}/5</span>
                        </div>
                        {acceptance.checkoutSessionId || acceptance.stripeSubscriptionId ? (
                          <div className="rounded-sm border border-line bg-bg px-3 py-2 text-[10px] text-muted">
                            {[
                              acceptance.checkoutSessionId ? `Checkout: ${acceptance.checkoutSessionId}` : '',
                              acceptance.stripeSubscriptionId ? `Subscription: ${acceptance.stripeSubscriptionId}` : '',
                            ].filter(Boolean).join(' • ')}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-right text-[9px] font-black uppercase tracking-[0.18em] text-muted">
                        <div>{formatTimestamp(acceptance.updatedAt || acceptance.createdAt)}</div>
                        {acceptance.source ? <div className="mt-2">{formatLifecycleLabel(acceptance.source)}</div> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>)}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (contentLoading && blogPosts.length === 0 && mediaItems.length === 0 && contentBlocks.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (contentLoadError && blogPosts.length === 0 && mediaItems.length === 0 && contentBlocks.length === 0) {
      return (
        <div className="flex items-center justify-between gap-4 rounded-sm border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-700">{contentLoadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchContentData(true)}
            className="btn-industrial py-1.5 px-4 text-[10px] shrink-0"
          >
            <RefreshCw size={12} className="mr-1.5" /> Retry
          </button>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      {contentLoadError ? (
        <div className="flex items-center gap-3 rounded-sm border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-bold text-yellow-800">
          <AlertCircle size={14} className="shrink-0" />
          <span>{contentLoadError}</span>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportContentCSV}
          className="flex items-center gap-1.5 btn-industrial px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      {/* Sub-tab navigation */}
      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <div className="flex space-x-1 bg-surface border border-line p-2 rounded-sm w-max min-w-full">
          {(['posts', 'media', 'blocks', 'categories'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setContentSubTab(tab)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors whitespace-nowrap ${
                contentSubTab === tab ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {tab === 'posts' ? 'Blog Posts' : tab === 'media' ? 'Media Library' : tab === 'categories' ? 'Categories' : 'Content Blocks'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Blog Posts ─────────────────────────────────────────────── */}
      {contentSubTab === 'posts' && (() => {
        const bq = blogPostSearchQuery.toLowerCase();
        const filteredPosts = bq
          ? blogPosts.filter((post) =>
              (post.title || '').toLowerCase().includes(bq) ||
              (post.category || '').toLowerCase().includes(bq) ||
              (post.authorName || '').toLowerCase().includes(bq) ||
              (post.excerpt || '').toLowerCase().includes(bq)
            )
          : blogPosts;
        const visiblePosts = filteredPosts.slice(0, blogPostDisplayCount);
        const hasMorePosts = filteredPosts.length > blogPostDisplayCount;

        return (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4 bg-surface p-6 border border-line rounded-sm">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-muted uppercase">{blogPosts.length} Posts</span>
              <span className="text-[10px] font-black text-data uppercase">
                {blogPosts.filter((post) => isPublishedPost(post)).length} Published
              </span>
              <span className="text-[10px] font-black text-yellow-500 uppercase">
                {blogPosts.filter(p => p.reviewStatus === 'in_review').length} In Review
              </span>
              <span className="text-[10px] font-black text-blue-500 uppercase">
                {blogPosts.filter(p => p.reviewStatus === 'scheduled').length} Scheduled
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={blogPostSearchQuery}
                  onChange={(e) => { setBlogPostSearchQuery(e.target.value); setBlogPostDisplayCount(10); }}
                  className="bg-bg border border-line text-[10px] font-bold uppercase tracking-widest px-3 py-2 placeholder:text-muted focus:outline-none focus:border-accent w-48"
                />
                <Search size={14} className="text-muted shrink-0" />
              </div>
              <button
                onClick={() => { setEditingPost(null); setShowCmsEditor(true); }}
                className="btn-industrial btn-accent py-2 px-6 flex items-center"
              >
                <Plus size={14} className="mr-2" /> New Post
              </button>
            </div>
          </div>

          <div className="bg-bg border border-line rounded-sm overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[860px] text-left">
              <thead className="sticky top-0 z-10 bg-bg">
                <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visiblePosts.map(post => (
                  <tr key={post.id} className="hover:bg-surface/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-ink">
                          {post.title || '(Untitled)'}
                        </span>
                        {post.excerpt && (
                          <span className="text-[9px] font-bold text-muted truncate max-w-[240px]">{post.excerpt}</span>
                        )}
                        {post.revisions && post.revisions.length > 0 && (
                          <span className="text-[8px] font-bold text-muted/60 uppercase">
                            {post.revisions.length} revision{post.revisions.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-muted uppercase">{post.category}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-muted uppercase">{post.authorName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                        post.reviewStatus === 'published' ? 'bg-data/10 text-data' :
                        post.reviewStatus === 'in_review'  ? 'bg-yellow-500/10 text-yellow-500' :
                        post.reviewStatus === 'scheduled'  ? 'bg-blue-500/10 text-blue-500' :
                        'bg-muted/10 text-muted'
                      }`}>
                        {post.reviewStatus ?? post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-muted">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditingPost(post); setShowCmsEditor(true); }}
                          className="p-2 text-muted hover:text-ink"
                          title="Edit post"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this post permanently?')) {
                              await cmsService.deletePost(post.id);
                              setBlogPosts(await cmsService.getBlogPosts());
                            }
                          }}
                          className="p-2 text-muted hover:text-accent"
                          title="Delete post"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                      {blogPostSearchQuery ? 'No posts match your search' : 'No posts yet — click New Post to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            {hasMorePosts && (
              <div className="p-4 border-t border-line flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Showing {visiblePosts.length} of {filteredPosts.length} posts
                </span>
                <button
                  type="button"
                  onClick={() => setBlogPostDisplayCount((prev) => prev + 10)}
                  className="btn-industrial py-1.5 px-4 text-[10px]"
                >
                  View More
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* ── Media Library ───────────────────────────────────────────── */}
      {contentSubTab === 'media' && (
        <MediaLibrary
          items={mediaItems}
          onRefresh={async () => setMediaItems(await cmsService.getMedia())}
        />
      )}

      {/* ── Categories (Taxonomy) ────────────────���────────────────── */}
      {contentSubTab === 'categories' && (
        <div className="space-y-4">
          {(normalizedAdminRole === 'super_admin' || normalizedAdminRole === 'admin') ? (
            <TaxonomyManager />
          ) : (
            <div className="bg-surface border border-line rounded-sm p-8 text-center">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest">Only Admins and Super Admins can manage categories.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Content Blocks ──────────────────────────────────────────── */}
      {contentSubTab === 'blocks' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-sm p-4">
            <p className="text-[10px] font-bold text-muted uppercase mb-1">
              Reusable content blocks — snippets you can reference in any post (call-to-actions, disclaimers, etc.)
            </p>
          </div>

          {/* Add block form */}
          <div className="bg-bg border border-line rounded-sm p-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-ink">New Content Block</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newBlock.label}
                onChange={e => setNewBlock(b => ({ ...b, label: e.target.value }))}
                placeholder="LABEL (e.g. CTA Footer)"
                className="input-industrial"
              />
              <input
                type="text"
                value={newBlock.title}
                onChange={e => setNewBlock(b => ({ ...b, title: e.target.value }))}
                placeholder="TITLE (optional)"
                className="input-industrial"
              />
              <select
                value={newBlock.type}
                onChange={e => setNewBlock(b => ({ ...b, type: e.target.value as ContentBlock['type'] }))}
                className="select-industrial"
              >
                <option value="text">Text</option>
                <option value="quote">Quote</option>
                <option value="callout">Callout</option>
                <option value="image">Image</option>
                <option value="html">HTML</option>
              </select>
            </div>
            <textarea
              value={newBlock.content}
              onChange={e => setNewBlock(b => ({ ...b, content: e.target.value }))}
              placeholder="Block content…"
              rows={4}
              className="input-industrial w-full resize-none"
            />
            <button
              disabled={savingBlock || !newBlock.content.trim()}
              onClick={async () => {
                setSavingBlock(true);
                try {
                  await cmsService.createContentBlock({
                    type:    newBlock.type,
                    content: newBlock.content,
                    title:   newBlock.title,
                    label:   newBlock.label,
                    order:   contentBlocks.length
                  });
                  setNewBlock({ type: 'text', content: '', title: '', label: '' });
                  setContentBlocks(await cmsService.getContentBlocks());
                } catch (err) {
                  console.error('Error creating block:', err);
                } finally {
                  setSavingBlock(false);
                }
              }}
              className="btn-industrial btn-accent py-2 px-6 text-[10px]"
            >
              {savingBlock ? 'Saving…' : 'Save Block'}
            </button>
          </div>

          {/* Block list */}
          <div className="space-y-3">
            {contentBlocks.map(block => (
              <div key={block.id} className="bg-bg border border-line rounded-sm p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {block.label && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-ink">{block.label}</span>
                    )}
                    <span className="px-1.5 py-0.5 bg-surface border border-line text-[8px] font-black uppercase text-muted rounded-sm">
                      {block.type}
                    </span>
                  </div>
                  {block.title && (
                    <p className="text-[10px] font-bold text-ink mb-1">{block.title}</p>
                  )}
                  <p className="text-[9px] font-medium text-muted line-clamp-2 font-mono">{block.content}</p>
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm('Delete this block?')) {
                      await cmsService.deleteContentBlock(block.id);
                      setContentBlocks(await cmsService.getContentBlocks());
                    }
                  }}
                  className="p-2 text-muted hover:text-accent flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {contentBlocks.length === 0 && (
              <div className="bg-bg border border-dashed border-line rounded-sm p-8 text-center">
                <Layers size={32} className="text-muted/30 mx-auto mb-3" />
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">No content blocks yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-3xl space-y-8">
      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Profile Settings</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center space-x-6 pb-6 border-b border-line">
            <div className="w-20 h-20 rounded-full bg-ink/10 flex items-center justify-center text-ink border-2 border-line overflow-hidden">
              {authUser?.photoURL ? (
                <img src={authUser.photoURL} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <User size={32} />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-lg font-black uppercase tracking-tighter text-ink">{profileName}</h4>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{roleLabel}</p>
            </div>
          </div>

          {adminSettingsError ? (
            <div className="rounded-sm border border-accent/30 bg-accent/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-accent">
              {adminSettingsError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="label-micro">Display Name</label>
              <input
                type="text"
                value={adminSettingsForm.displayName}
                onChange={(e) => handleAdminSettingsInputChange('displayName', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Email Address</label>
              <input
                type="email"
                value={adminSettingsForm.email}
                onChange={(e) => handleAdminSettingsInputChange('email', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Phone Number</label>
              <input
                type="tel"
                value={adminSettingsForm.phoneNumber}
                onChange={(e) => handleAdminSettingsInputChange('phoneNumber', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Company Name</label>
              <input
                type="text"
                value={adminSettingsForm.company}
                onChange={(e) => handleAdminSettingsInputChange('company', e.target.value)}
                className="input-industrial w-full"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveAdminSettings()}
            disabled={savingAdminSettings}
            className="btn-industrial btn-accent py-3 px-8 disabled:opacity-60"
          >
            {savingAdminSettings ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Security & Preferences</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <Bell size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Email Notifications</h4>
                <p className="text-[10px] font-bold text-muted uppercase">Receive optional marketplace alerts and monthly performance summaries</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleToggleAdminEmailNotifications()}
              disabled={savingAdminPreferenceKey === 'emailNotificationsEnabled'}
              className={`w-10 h-5 rounded-full relative transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${adminSettingsForm.emailNotificationsEnabled ? 'bg-accent' : 'bg-line'}`}
              aria-pressed={adminSettingsForm.emailNotificationsEnabled}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${adminSettingsForm.emailNotificationsEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-line">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <Shield size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Two-Factor Authentication</h4>
                <p className="text-[10px] font-bold text-muted uppercase">
                  {authUser?.mfaEnabled ? 'SMS multi-factor authentication is active.' : 'Add an extra layer of security to your account.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.assign('/profile?tab=Account%20Settings')}
              className="btn-industrial py-2 px-4 text-[10px]"
            >
              Manage
            </button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <CreditCard size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Payment Methods</h4>
                <p className="text-[10px] font-bold text-muted uppercase">Open billing tools and subscription activity</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectAdminTab('billing')}
              className="btn-industrial py-2 px-4 text-[10px]"
            >
              Open Billing
            </button>
          </div>
        </div>
      </section>

    </div>
  );

  const renderDealerFeeds = () => {
    const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.forestryequipmentsales.com';
    const currentDfCurlSnippet = dfActiveProfile?.ingestUrl
      ? buildDealerFeedApiCurlSnippet({
          ingestUrl: dfActiveProfile.ingestUrl,
          apiKey: dfActiveProfile.apiKey || '',
          sourceType: dfActiveProfile.sourceType === 'csv' ? 'csv' : 'json',
        })
      : '';
    const resetDfPreview = () => {
      setDfPreviewItems([]);
      setDfPreviewCount(0);
      setDfPreviewType('');
      setDfResult(null);
      setDfError('');
    };

    const handleDealerFeedFileSelected = async (file?: File | null) => {
      if (!file) return;

      try {
        const inferredMode = inferDealerFeedSetupModeFromFileName(file.name, dfMode === 'url' ? 'json' : dfMode);
        const text = await file.text();
        setDfMode(inferredMode);
        setDfPayload(text);
        setDfFileName(file.name);
        setDfError('');
        setDfCredentialError('');
        setDfCredentialNotice('');
        resetDfPreview();
        if (!dfSource.trim()) {
          setDfSource(file.name.replace(/\.[^.]+$/u, '') || 'Dealer Feed');
        }
      } catch (error) {
        setDfError(error instanceof Error ? error.message : 'Unable to read the selected feed file.');
      }
    };

    const handleUseSampleFeed = (mode: DealerFeedSetupMode) => {
      setDfMode(mode);
      setDfFileName('');
      setDfError('');
      setDfCredentialError('');
      setDfCredentialNotice('');
      setDfResult(null);
      if (!dfSource.trim()) {
        setDfSource(mode === 'url' ? 'Sample Feed URL' : `Sample ${DEALER_FEED_SETUP_META[mode].label}`);
      }
      if (mode === 'url') {
        setDfFeedUrl(buildDealerFeedSampleUrl(appOrigin, 'json'));
        setDfPayload('');
      } else {
        setDfPayload(getDealerFeedSamplePayload(mode));
        setDfFeedUrl('');
      }
      resetDfPreview();
    };

    const handleSaveFeedProfile = async () => {
      if (!dfSource.trim()) {
        setDfError('Source name is required.');
        return;
      }
      if (!dfDealerId.trim()) {
        setDfError('Dealer UID / ID is required.');
        return;
      }
      if (dfMode === 'url' && !dfFeedUrl.trim()) {
        setDfError('Feed URL is required.');
        return;
      }
      if (dfMode !== 'url' && !dfPayload.trim()) {
        setDfError('Feed payload is required.');
        return;
      }

      setDfProfileSaving(true);
      setDfError('');
      setDfCredentialError('');
      setDfCredentialNotice('');
      try {
        const savedProfile = await dealerFeedService.saveProfile({
          id: dfCurrentProfileId || undefined,
          sellerUid: dfDealerId.trim(),
          sourceName: dfSource.trim(),
          sourceType: DEALER_FEED_SETUP_META[dfMode].sourceType,
          rawInput: dfMode === 'url' ? '' : dfPayload,
          feedUrl: dfMode === 'url' ? dfFeedUrl.trim() : '',
          nightlySyncEnabled: true,
        });
        setDfCurrentProfileId(savedProfile.id);
        setDfActiveProfile(savedProfile);
        setDfCredentialNotice('Feed profile saved. Reveal credentials to copy the direct ingest URL, API key, and webhook secret.');
      } catch (error) {
        setDfCredentialError(error instanceof Error ? error.message : 'Unable to save this dealer feed profile.');
      } finally {
        setDfProfileSaving(false);
      }
    };

    const handleRevealFeedCredentials = async () => {
      if (!dfCurrentProfileId) {
        setDfCredentialError('Save a feed profile first to generate direct API credentials.');
        setDfCredentialNotice('');
        return;
      }

      setDfRevealingCredentials(true);
      setDfCredentialError('');
      setDfCredentialNotice('');
      try {
        const detailedProfile = await dealerFeedService.getProfile(dfCurrentProfileId, { includeSecrets: true });
        setDfActiveProfile(detailedProfile);
        setDfCredentialNotice('Direct API credentials loaded for copy/paste setup.');
      } catch (error) {
        setDfCredentialError(error instanceof Error ? error.message : 'Unable to load API credentials for this dealer feed.');
      } finally {
        setDfRevealingCredentials(false);
      }
    };

    const handleCopyDealerFeedCredential = async (value: string, label: string) => {
      if (!value) {
        setDfCredentialError(`${label} is not available yet.`);
        setDfCredentialNotice('');
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        setDfCredentialNotice(`${label} copied.`);
        setDfCredentialError('');
      } catch (error) {
        setDfCredentialError(error instanceof Error ? error.message : `Unable to copy ${label.toLowerCase()}.`);
        setDfCredentialNotice('');
      }
    };

    const handleResolveFeed = async (): Promise<Parameters<typeof dealerFeedService.ingest>[0]['items']> => {
      if (!dfSource.trim()) {
        setDfError('Source name is required.');
        return [];
      }
      if (!dfDealerId.trim()) {
        setDfError('Dealer UID / ID is required.');
        return [];
      }
      if (dfMode === 'url' && !dfFeedUrl.trim()) {
        setDfError('Feed URL is required.');
        return [];
      }
      if (dfMode !== 'url' && !dfPayload.trim()) {
        setDfError('Feed payload is required.');
        return [];
      }

      setDfLoading(true);
      setDfError('');
      setDfResult(null);
      try {
        const resolved = await dealerFeedService.resolveSource({
          sourceName: dfSource.trim(),
          sourceType: DEALER_FEED_SETUP_META[dfMode].sourceType,
          rawInput: dfMode === 'url' ? undefined : dfPayload,
          feedUrl: dfMode === 'url' ? dfFeedUrl.trim() : undefined,
        });

        setDfPreviewItems(resolved.items);
        setDfPreviewCount(resolved.itemCount);
        setDfPreviewType(resolved.detectedType);
        return resolved.items;
      } catch (error) {
        setDfPreviewItems([]);
        setDfPreviewCount(0);
        setDfPreviewType('');
        setDfError(error instanceof Error ? error.message : 'Unable to parse this feed source.');
        return [];
      } finally {
        setDfLoading(false);
      }
    };

    const handleIngest = async () => {
      setDfError('');
      setDfResult(null);

      const items = dfPreviewItems.length > 0 ? dfPreviewItems : await handleResolveFeed();
      if (items.length === 0) return;

      setDfLoading(true);
      try {
        const result = await dealerFeedService.ingest({
          sourceName: dfSource.trim(),
          dealerId: dfDealerId.trim(),
          dryRun: dfDryRun,
          items,
        });
        setDfResult(result);
      } catch (error) {
        setDfError(error instanceof Error ? error.message : 'Feed import failed.');
      } finally {
        setDfLoading(false);
      }
    };

    const handleLoadLogs = async () => {
      setDfLogsLoading(true);
      setDfError('');
      try {
        setDfLogs(await dealerFeedService.getRecentLogs(20, dfDealerId.trim() || undefined));
      } catch (error) {
        setDfError(error instanceof Error ? error.message : 'Unable to load dealer feed logs.');
      } finally {
        setDfLogsLoading(false);
      }
    };

    const formatLogTime = (timestamp: DealerFeedLog['processedAt']) => {
      const ts = timestamp;
      if (!ts) return '—';
      if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString();
      }
      return new Date(timestamp as string | number).toLocaleString();
    };
    const latestDealerFeedLog = dfLogs[0] || null;
    const dealerFeedFailureLog = dfLogs.find((log) => Array.isArray(log.errors) && log.errors.length > 0) || null;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-line bg-surface p-6">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-ink">Dealer Feed Intake</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Configure JSON array, CSV upload, XML paste, or live API URL imports for any dealer account. Resolve first,
              confirm the preview, then run a dry import or live ingest.
            </p>
          </div>
          <div className="rounded-sm border border-line bg-bg px-4 py-3 text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Setup Flow</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-ink">
              1. Select format 2. Resolve 3. Preview 4. Import
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-sm border border-line bg-surface p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Last Run</div>
            <div className="mt-3 text-sm font-black text-ink">{latestDealerFeedLog ? formatLogTime(latestDealerFeedLog.processedAt) : 'No runs loaded'}</div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
              {latestDealerFeedLog ? `${latestDealerFeedLog.processed} processed / ${latestDealerFeedLog.upserted} upserted` : 'Load logs for operator visibility'}
            </div>
          </div>
          <div className="rounded-sm border border-line bg-surface p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Current Feed Status</div>
            <div className="mt-3 text-sm font-black text-ink">
              {dfActiveProfile?.lastSyncStatus ? formatLifecycleLabel(dfActiveProfile.lastSyncStatus) : 'No profile selected'}
            </div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
              {dfActiveProfile?.sourceType ? `${formatLifecycleLabel(dfActiveProfile.sourceType)} / ${formatLifecycleLabel(dfActiveProfile.syncMode || 'pull')}` : 'Save or load a dealer feed profile'}
            </div>
          </div>
          <div className="rounded-sm border border-line bg-surface p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Failure Reason</div>
            <div className="mt-3 text-sm font-black text-ink">
              {dealerFeedFailureLog?.errors?.[0] || dfActiveProfile?.lastSyncMessage || 'No recent failures recorded'}
            </div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
              {dealerFeedFailureLog ? `From ${dealerFeedFailureLog.sourceName}` : 'Operator-safe failure summary'}
            </div>
          </div>
          <div className="rounded-sm border border-line bg-surface p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Profile + Sync</div>
            <div className="mt-3 text-sm font-black text-ink">{dfCurrentProfileId || 'No saved profile selected'}</div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
              {dfActiveProfile?.nightlySyncEnabled ? 'Nightly sync enabled' : 'Nightly sync disabled'}
            </div>
          </div>
        </div>

        <div className="flex space-x-1 rounded-sm border border-line bg-surface p-2 w-fit">
          {(['ingest', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setDfSubTab(tab);
                if (tab === 'logs' && dfLogs.length === 0) {
                  void handleLoadLogs();
                }
              }}
              className={`rounded-sm px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                dfSubTab === tab ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {tab === 'ingest' ? 'Resolve + Import' : 'Import Logs'}
            </button>
          ))}
        </div>

        {/* ── Ingest Feed ─────────────────────────────────────────── */}
        {dfSubTab === 'ingest' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <div className="bg-surface border border-line p-6 rounded-sm space-y-5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
                  <Upload size={14} /> Feed Configuration
                </h3>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Source Name</label>
                  <input
                    type="text"
                    value={dfSource}
                    onChange={(event) => {
                      setDfSource(event.target.value);
                      resetDfPreview();
                    }}
                    placeholder="e.g. JohnDeereDealerFeed"
                    className="input-industrial w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Dealer UID / ID</label>
                  <input
                    type="text"
                    value={dfDealerId}
                    onChange={(event) => {
                      setDfDealerId(event.target.value);
                      setDfCurrentProfileId('');
                      setDfActiveProfile(null);
                      setDfCredentialError('');
                      setDfCredentialNotice('');
                      resetDfPreview();
                    }}
                    placeholder="Firebase UID or dealer identifier"
                    className="input-industrial w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Dealer Account Picker</label>
                  <select
                    value={dfDealerId}
                    onChange={(event) => {
                      setDfDealerId(event.target.value);
                      setDfCurrentProfileId('');
                      setDfActiveProfile(null);
                      setDfCredentialError('');
                      setDfCredentialNotice('');
                      resetDfPreview();
                    }}
                    className="input-industrial w-full text-xs"
                  >
                    <option value="">Select dealer or pro dealer account</option>
                    {dealerFeedTargetAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {`${account.displayName || account.name || account.email} ${account.company ? `- ${account.company}` : ''} (${account.role === 'pro_dealer' ? 'Pro Dealer' : 'Dealer'})`}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[11px] text-muted">
                    Super admins can pick the dealer account here instead of manually looking up a UID.
                  </p>
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {setupModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setDfMode(mode);
                        setDfFileName('');
                        resetDfPreview();
                      }}
                      className={`rounded-sm border px-4 py-3 text-left transition-colors ${
                        dfMode === mode ? 'border-ink bg-bg text-ink' : 'border-line bg-surface text-muted hover:text-ink'
                      }`}
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

                <div className="rounded-sm border border-line bg-bg p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">API Push Setup</div>
                      <div className="mt-1 text-xs text-muted">
                        Save a dealer feed profile once, then reveal the direct ingest URL, API key, webhook secret, and starter cURL command for server-to-server setup.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveFeedProfile()}
                        disabled={dfProfileSaving}
                        className="btn-industrial flex items-center gap-2 px-3 py-2 text-[10px] disabled:opacity-50"
                      >
                        {dfProfileSaving ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                        {dfCurrentProfileId ? 'Update Feed Profile' : 'Save Feed Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRevealFeedCredentials()}
                        disabled={dfRevealingCredentials || !dfCurrentProfileId}
                        className="btn-industrial flex items-center gap-2 px-3 py-2 text-[10px] disabled:opacity-50"
                      >
                        {dfRevealingCredentials ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
                        {dfActiveProfile?.apiKey ? 'Refresh Credentials' : 'Reveal Credentials'}
                      </button>
                    </div>
                  </div>

                  {dfCredentialError ? (
                    <div className="mt-4 flex items-start gap-2 rounded-sm border border-accent/30 bg-accent/10 p-3">
                      <AlertCircle size={14} className="text-accent mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-accent">{dfCredentialError}</p>
                    </div>
                  ) : null}

                  {dfCredentialNotice ? (
                    <div className="mt-4 rounded-sm border border-line bg-surface px-3 py-3 text-[10px] font-bold text-ink">
                      {dfCredentialNotice}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDfDryRun(v => !v)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${dfDryRun ? 'bg-accent' : 'bg-line'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${dfDryRun ? 'right-1' : 'left-1'}`} />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Dry Run {dfDryRun ? '(preview only — no writes)' : '(disabled — will write to Firestore)'}
                  </span>
                </div>

                {dfMode === 'url' ? (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Feed URL</label>
                    <input
                      value={dfFeedUrl}
                      onChange={(event) => {
                        setDfFeedUrl(event.target.value);
                        resetDfPreview();
                      }}
                      placeholder={DEALER_FEED_SETUP_META.url.placeholder}
                      className="input-industrial w-full text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-muted">
                        Feed Payload
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={dfFileInputRef}
                          type="file"
                          accept={DEALER_FEED_SETUP_META[dfMode].accept}
                          className="hidden"
                          onChange={(event) => {
                            void handleDealerFeedFileSelected(event.target.files?.[0] || null);
                            event.currentTarget.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => dfFileInputRef.current?.click()}
                          className="btn-industrial px-3 py-2 text-[10px]"
                        >
                          {DEALER_FEED_SETUP_META[dfMode].uploadLabel}
                        </button>
                        {dfFileName ? (
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">{dfFileName}</span>
                        ) : null}
                      </div>
                    </div>
                    <textarea
                      rows={12}
                      value={dfPayload}
                      onChange={(event) => {
                        setDfPayload(event.target.value);
                        if (dfFileName) setDfFileName('');
                        resetDfPreview();
                      }}
                      spellCheck={false}
                      className="input-industrial w-full resize-y font-mono text-[11px]"
                      placeholder={DEALER_FEED_SETUP_META[dfMode].placeholder}
                    />
                  </div>
                )}

                {dfError && (
                  <div className="flex items-start gap-2 bg-accent/10 border border-accent/30 rounded-sm p-3">
                    <AlertCircle size={14} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-accent">{dfError}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleResolveFeed()}
                    disabled={dfLoading}
                    className="btn-industrial flex items-center gap-2 px-5 py-3 disabled:opacity-50"
                  >
                    {dfLoading ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                    Resolve Feed
                  </button>
                  <button
                  onClick={handleIngest}
                  disabled={dfLoading}
                  className="btn-industrial btn-accent py-3 px-8 flex items-center gap-2 w-full justify-center disabled:opacity-50"
                >
                  {dfLoading
                    ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing…</>
                    : <><Upload size={14} /> {dfDryRun ? 'Run Dry Import' : 'Import Inventory'}</>
                  }
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDfFileName('');
                      resetDfPreview();
                    }}
                    className="btn-industrial px-5 py-3 text-[10px]"
                  >
                    Reset Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Result panel */}
            <div>
              <div className="mb-4 rounded-sm border border-line bg-surface p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Direct API Credentials</h3>
                    <p className="mt-1 text-xs text-muted">
                      Use these values for dealer and vendor automations that push inventory directly into Forestry Equipment Sales.
                    </p>
                  </div>
                  {dfCurrentProfileId ? (
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                      Feed ID: {dfCurrentProfileId}
                    </div>
                  ) : null}
                </div>

                {!dfCurrentProfileId ? (
                  <div className="mt-4 rounded-sm border border-dashed border-line px-4 py-4 text-xs text-muted">
                    Save a feed profile first. That enables direct API setup for the selected dealer account.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {[
                      { label: 'Direct Ingest URL', value: dfActiveProfile?.ingestUrl || '', copyLabel: 'Direct ingest URL' },
                      { label: 'Direct Webhook URL', value: dfActiveProfile?.webhookUrl || '', copyLabel: 'Direct webhook URL' },
                      { label: 'API Key', value: dfActiveProfile?.apiKey || dfActiveProfile?.apiKeyMasked || '', copyLabel: 'API key' },
                      { label: 'Webhook Secret', value: dfActiveProfile?.webhookSecret || dfActiveProfile?.webhookSecretMasked || '', copyLabel: 'Webhook secret' },
                    ].map((entry) => (
                      <div key={entry.label} className="rounded-sm border border-line bg-bg p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">{entry.label}</div>
                          <button
                            type="button"
                            onClick={() => void handleCopyDealerFeedCredential(entry.value, entry.copyLabel)}
                            className="btn-industrial flex items-center gap-1 px-2 py-1 text-[10px]"
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                        <div className="mt-2 break-all font-mono text-[11px] text-ink">{entry.value || 'Not available yet'}</div>
                      </div>
                    ))}

                    <div className="rounded-sm border border-line bg-bg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Server-to-Server cURL</div>
                        <button
                          type="button"
                          onClick={() => void handleCopyDealerFeedCredential(currentDfCurlSnippet, 'Sample cURL command')}
                          className="btn-industrial flex items-center gap-1 px-2 py-1 text-[10px]"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-sm border border-line bg-surface p-3 font-mono text-[11px] text-ink">
                        {currentDfCurlSnippet || 'Reveal credentials to generate the starter cURL example.'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {dfPreviewCount > 0 ? (
                <div className="mb-4 rounded-sm border border-line bg-surface p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Resolved Feed Preview</h3>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      {dfPreviewCount} items detected
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-sm border border-line bg-bg p-4">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted">Detected Format</div>
                      <div className="mt-2 text-xl font-black uppercase tracking-tight text-ink">{dfPreviewType || dfMode}</div>
                    </div>
                    <div className="rounded-sm border border-line bg-bg p-4">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted">Preview Items</div>
                      <div className="mt-2 text-xl font-black tracking-tight text-ink">{dfPreviewCount}</div>
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-sm border border-line">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="border-b border-line bg-bg text-[9px] font-black uppercase text-muted">
                          <th className="px-4 py-3">External ID</th>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Make / Model</th>
                          <th className="px-4 py-3">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {dfPreviewItems.slice(0, 10).map((item, index) => (
                          <tr key={`${String(item.externalId || item.title || index)}-${index}`}>
                            <td className="px-4 py-3 font-mono text-muted">{String(item.externalId || '-')}</td>
                            <td className="px-4 py-3 font-bold text-ink">{String(item.title || 'Untitled listing')}</td>
                            <td className="px-4 py-3 text-muted">
                              {[item.manufacturer || item.make, item.model].filter(Boolean).join(' ') || '-'}
                            </td>
                            <td className="px-4 py-3 text-muted">{String(item.category || '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {dfPreviewCount > 10 ? (
                    <div className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                      Showing first 10 preview records of {dfPreviewCount}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {dfResult ? (
                <div className="space-y-4">
                  <div className="bg-surface border border-line p-6 rounded-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 size={16} className="text-data" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">
                        {dfResult.dryRun ? 'Dry Run Complete' : 'Ingest Complete'}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: 'Processed', value: dfResult.processed, color: 'text-ink' },
                        { label: 'Upserted', value: dfResult.upserted, color: 'text-data' },
                        { label: 'Skipped', value: dfResult.skipped, color: 'text-muted' },
                      ].map(s => (
                        <div key={s.label} className="bg-bg border border-line p-4 rounded-sm text-center">
                          <div className={`text-2xl font-black tracking-tighter ${s.color}`}>{s.value}</div>
                          <div className="text-[9px] font-bold text-muted uppercase mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {dfResult.errors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Errors ({dfResult.errors.length})</h4>
                        <ul className="space-y-1 max-h-32 overflow-y-auto">
                          {dfResult.errors.map((err, i) => (
                            <li key={i} className="text-[10px] font-mono text-accent bg-accent/5 px-2 py-1 rounded-sm">{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dfResult.preview && dfResult.preview.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Preview</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px]">
                            <thead>
                              <tr className="border-b border-line text-[9px] font-black uppercase text-muted">
                                <th className="pb-2 pr-4">External ID</th>
                                <th className="pb-2 pr-4">Title</th>
                                <th className="pb-2">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {dfResult.preview.map((p, i) => (
                                <tr key={i} className="py-1">
                                  <td className="py-1.5 pr-4 font-mono text-muted">{p.externalId}</td>
                                  <td className="py-1.5 pr-4 font-bold text-ink truncate max-w-[140px]">{p.title}</td>
                                  <td className="py-1.5">
                                    <span className={`px-2 py-0.5 rounded-sm font-black text-[9px] uppercase ${
                                      p.action === 'insert' ? 'bg-data/10 text-data' :
                                      p.action === 'update' ? 'bg-yellow-500/10 text-yellow-500' :
                                      'bg-line text-muted'
                                    }`}>{p.action}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-surface border border-dashed border-line rounded-sm p-12 flex flex-col items-center justify-center text-center">
                  <Database size={40} className="text-muted opacity-20 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Results will appear here after running an ingest</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Ingest Logs ─────────────────────────────────────────── */}
        {dfSubTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-surface p-6 border border-line rounded-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Ingest Runs</h3>
              <button
                onClick={handleLoadLogs}
                disabled={dfLogsLoading}
                className="btn-industrial py-2 px-4 flex items-center gap-2 text-[10px] disabled:opacity-50"
              >
                <RefreshCw size={13} className={dfLogsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {dfLogsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : dfLogs.length === 0 ? (
              <div className="bg-surface border border-dashed border-line rounded-sm p-12 flex flex-col items-center justify-center text-center">
                <Clock size={36} className="text-muted opacity-20 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">No ingest logs found</p>
              </div>
            ) : (
              <div className="bg-bg border border-line rounded-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                        <th className="px-6 py-4">Source</th>
                        <th className="px-6 py-4">Dealer ID</th>
                        <th className="px-6 py-4">Processed</th>
                        <th className="px-6 py-4">Upserted</th>
                        <th className="px-6 py-4">Skipped</th>
                        <th className="px-6 py-4">Errors</th>
                        <th className="px-6 py-4">Mode</th>
                        <th className="px-6 py-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {dfLogs.map(log => (
                        <tr key={log.id} className="hover:bg-surface/20 transition-colors">
                          <td className="px-6 py-4 text-xs font-black text-ink uppercase">{log.sourceName}</td>
                          <td className="px-6 py-4 text-[10px] font-mono text-muted truncate max-w-[100px]">{log.dealerId}</td>
                          <td className="px-6 py-4 text-xs font-black text-ink">{log.processed}</td>
                          <td className="px-6 py-4 text-xs font-black text-data">{log.upserted}</td>
                          <td className="px-6 py-4 text-xs font-black text-muted">{log.skipped}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black ${log.errors?.length ? 'text-accent' : 'text-data'}`}>
                              {log.errors?.length ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-sm ${log.dryRun ? 'bg-yellow-500/10 text-yellow-500' : 'bg-data/10 text-data'}`}>
                              {log.dryRun ? 'Dry Run' : 'Live'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-muted">{formatLogTime(log.processedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const dashboardHeading = activeTab === 'overview'  ? 'System Overview'
    : activeTab === 'listings'  ? 'Machine Inventory'
    : activeTab === 'inquiries' ? 'Lead Monitoring'
    : activeTab === 'calls'     ? 'Call Logs'
    : activeTab === 'tracking'  ? 'Performance Tracking'
    : activeTab === 'accounts'  ? 'Account Directory'
    : activeTab === 'billing'   ? 'Billing Account'
    : activeTab === 'content'   ? 'Content Studio'
    : activeTab === 'dealer_feeds' ? 'Dealer Feed Manager'
    : activeTab === 'users'     ? 'Operator Directory'
    : 'Profile Settings';
  const dashboardSeoTitle = `${dashboardHeading} | Forestry Equipment Sales`;
  const dashboardSeoDescription = activeTab === 'overview'
    ? 'Review live Forestry Equipment Sales marketplace operations, inventory, leads, and account activity.'
    : `Manage ${dashboardHeading.toLowerCase()} in the Forestry Equipment Sales admin workspace.`;
  const dashboardCanonicalPath = activeTab === 'overview' ? '/admin' : `/admin?tab=${activeTab}`;

  const dashboardTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'Machines', icon: Package },
    { id: 'inquiries', label: 'Leads', icon: MessageSquare },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'tracking', label: 'Performance', icon: Activity },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'dealer_feeds', label: 'Dealer Feeds', icon: Database },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const visibleTabs = dashboardTabs.filter((item) => {
    if (isContentOnlyDashboardRole) {
      return item.id === 'content' || item.id === 'settings';
    }

    if ('adminOnly' in item && item.adminOnly) {
      return normalizedAdminRole === 'super_admin' || normalizedAdminRole === 'admin';
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-bg flex overflow-x-hidden">
      <Seo
        title={dashboardSeoTitle}
        description={dashboardSeoDescription}
        canonicalPath={dashboardCanonicalPath}
        robots="noindex, nofollow"
      />
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-line hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-line">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 border border-accent/20 flex items-center justify-center rounded-sm">
              <User className="text-accent" size={18} />
            </div>
            <span className="text-lg font-black tracking-tighter text-ink uppercase">Account</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {visibleTabs.map(item => (
            <button 
              key={item.id}
              onClick={() => selectAdminTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === item.id ? 'bg-ink text-bg' : 'text-muted hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-line">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-ink">
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-ink">{profileName}</span>
              <span className="text-[8px] font-bold text-muted uppercase">{roleLabel}</span>
            </div>
          </div>
          <button onClick={authLogout} className="flex items-center text-[10px] font-black text-accent uppercase hover:underline">
            <LogOut size={12} className="mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 md:p-10 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <section className="lg:hidden mb-6 bg-surface border border-line rounded-sm p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-muted uppercase truncate">{profileName}</div>
                <div className="text-[10px] font-black uppercase text-ink truncate">{roleLabel}</div>
              </div>
              <button
                onClick={authLogout}
                className="btn-industrial py-2 px-3 text-[10px] flex items-center"
              >
                <LogOut size={12} className="mr-1.5" />
                Sign Out
              </button>
            </div>
          </section>

          <section className="lg:hidden mb-6">
            <div className="grid grid-cols-2 gap-2">
              {visibleTabs.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectAdminTab(item.id)}
                  className={`w-full min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-sm border text-[10px] font-black uppercase tracking-widest transition-colors overflow-hidden ${
                    activeTab === item.id
                      ? 'bg-ink text-bg border-ink'
                      : 'bg-surface text-muted border-line hover:text-ink hover:border-ink/20'
                  }`}
                >
                  <item.icon size={13} className="shrink-0" />
                  <span className="truncate text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <span className="label-micro text-accent mb-2 block">Account Dashboard</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-ink">{dashboardHeading}</h2>
            </div>
          </header>

          {userFeedback && (
            <>
              <div className={`mb-6 rounded-sm border px-4 py-3 shadow-sm ${
                userFeedback.tone === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : userFeedback.tone === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-data/30 bg-data/10 text-data'
              }`}>
                <div className="flex items-start gap-3">
                  {userFeedback.tone === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {userFeedback.tone === 'error' ? 'Update Failed' : userFeedback.tone === 'warning' ? 'Saved With Notice' : 'Saved'}
                    </p>
                    <p className="text-xs font-semibold leading-5">{userFeedback.message}</p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none fixed right-4 top-20 z-[2200] w-full max-w-sm">
                <div
                  className={`pointer-events-auto rounded-sm border px-4 py-3 shadow-[0_18px_55px_rgba(15,23,42,0.22)] backdrop-blur ${
                    userFeedback.tone === 'error'
                      ? 'border-red-200 bg-red-50/95 text-red-700'
                      : userFeedback.tone === 'warning'
                        ? 'border-amber-200 bg-amber-50/95 text-amber-800'
                        : 'border-data/30 bg-white/95 text-data'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-3">
                    {userFeedback.tone === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em]">
                        {userFeedback.tone === 'error' ? 'Update Failed' : userFeedback.tone === 'warning' ? 'Saved With Notice' : 'Saved'}
                      </p>
                      <p className="text-xs font-semibold leading-5">{userFeedback.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUserFeedback(null)}
                      className="rounded-sm border border-current/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] hover:bg-black/5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {showTabContentLoader ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div>
              {activeTab === 'overview'  && renderOverview()}
              {activeTab === 'listings'  && renderListings()}
              {activeTab === 'inquiries' && renderInquiries()}
              {activeTab === 'calls'     && renderCalls()}
              {activeTab === 'tracking'  && renderTracking()}
              {activeTab === 'accounts'  && renderAccounts()}
              {activeTab === 'billing'   && renderBilling()}
              {activeTab === 'content'   && renderContent()}
              {activeTab === 'dealer_feeds' && renderDealerFeeds()}
              {activeTab === 'users'     && renderUsers()}
              {activeTab === 'settings'  && renderSettings()}
            </div>
          )}
        </div>
      </main>

      <ListingModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingListing(null); }}
        onSave={handleSaveListing}
        listing={editingListing}
      />

      {showCmsEditor && (
        <CmsEditor
          post={editingPost}
          onClose={() => { setShowCmsEditor(false); setEditingPost(null); }}
          onSaved={async () => {
            setBlogPosts(await cmsService.getBlogPosts());
          }}
        />
      )}

      <AnimatePresence>
        {editingAccount && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-ink/60 p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-2xl bg-bg border border-line rounded-sm shadow-xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-line bg-surface flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ink">Edit User</h3>
                  <p className="text-[10px] font-bold text-muted uppercase mt-1">Update profile details, role, and contact info.</p>
                </div>
                <button type="button" onClick={closeUserEditor} className="p-2 text-muted hover:text-ink">
                  <AlertCircle size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveUserEdits} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="label-micro">Display Name</label>
                    <input
                      type="text"
                      value={userEditForm.displayName}
                      onChange={(e) => setUserEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
                      className="input-industrial w-full"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label-micro">Email</label>
                    <input
                      type="email"
                      value={userEditForm.email}
                      onChange={(e) => setUserEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="input-industrial w-full"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label-micro">Phone</label>
                    <input
                      type="text"
                      value={userEditForm.phoneNumber}
                      onChange={(e) => setUserEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      className="input-industrial w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label-micro">Company</label>
                    <input
                      type="text"
                      value={userEditForm.company}
                      onChange={(e) => setUserEditForm((prev) => ({ ...prev, company: e.target.value }))}
                      className="input-industrial w-full"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="label-micro">Role</label>
                    <select
                      value={userEditForm.role}
                      onChange={(e) => setUserEditForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                      className="select-industrial w-full"
                    >
                      {(canAssignSuperAdmin || userEditForm.role !== 'super_admin'
                        ? assignableRoleOptions
                        : [{ value: 'super_admin' as UserRole, label: 'Super Admin' }, ...assignableRoleOptions]
                      ).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeUserEditor} className="btn-industrial py-3 px-6 text-[10px]">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingUserEdit} className="btn-industrial btn-accent py-3 px-6 text-[10px] disabled:opacity-50">
                    {savingUserEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
