import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { updateEmail, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { 
  LayoutDashboard, Package, MessageSquare,
  Users, Settings, TrendingUp, Plus,
  Filter, MoreVertical, Edit, Trash2, Download, Copy, Eye,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight,
  User, Shield, Bell, CreditCard, LogOut,
  Phone, Activity, ShieldAlert, MapPin, ExternalLink, Building2,
  FileText, Image, Layers, Database, RefreshCw, FolderTree,
  Loader2, Gavel, Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { equipmentService, type AdminListingsCursor, type ListingReviewSummary } from '../services/equipmentService';
import { userService } from '../services/userService';
import { adminUserService, type AdminOperationsBootstrapResponse, type PgAnalyticsResponse } from '../services/adminUserService';
import { Listing, Inquiry, Account, CallLog, UserRole } from '../types';
import { billingService, Invoice, Subscription, isSubscriptionTrulyActive, type AdminBillingBootstrapResponse } from '../services/billingService';
import { ListingModal } from '../components/admin/ListingModal';
import { BulkImportToolkit } from '../components/BulkImportToolkit';
import { InquiryList } from '../components/admin/InquiryList';
import { VirtualizedListingsTable } from '../components/admin/VirtualizedListingsTable';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { TaxonomyManager } from '../components/admin/TaxonomyManager';
import { DealerFeedsTab } from '../components/admin/DealerFeedsTab';
import { BillingTab } from '../components/admin/BillingTab';
import { AuctionsTab } from '../components/admin/AuctionsTab';
import { ContentTab } from '../components/admin/ContentTab';
import { AccountMfaSettingsCard } from '../components/AccountMfaSettingsCard';
import { Seo } from '../components/Seo';
import { useAuth } from '../components/AuthContext';
import { useLocale } from '../components/LocaleContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { auth } from '../firebase';
import { getAssignableUserRoleOptions, getUserRoleDisplayLabel, normalizeEditableUserRole } from '../utils/userRoles';
import type { ListingLifecycleAction, ListingLifecycleAuditView } from '../types';

type DashboardTab = 'overview' | 'listings' | 'inquiries' | 'calls' | 'accounts' | 'settings' | 'tracking' | 'users' | 'billing' | 'content' | 'dealer_feeds' | 'taxonomy' | 'auctions';
type ListingReviewFilter = 'all' | 'pending_approval' | 'paid_not_live' | 'rejected' | 'expired' | 'sold' | 'archived' | 'anomalies';

const LISTINGS_PAGE_SIZE_DEFAULT = 50;
const LISTINGS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
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
  'taxonomy',
  'auctions',
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
  const { user: authUser, logout: authLogout, patchCurrentUserProfile, sendPasswordReset } = useAuth();
  const { formatPrice } = useLocale();
  const { confirm, alert, dialogProps } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const profileName = authUser?.displayName || 'Admin';
  const roleLabel = getUserRoleDisplayLabel(authUser?.role);
  const normalizedAdminRole = userService.normalizeRole(authUser?.role);
  const isContentOnlyDashboardRole = CONTENT_ONLY_DASHBOARD_ROLES.has(normalizedAdminRole);
  const hasFullAdminDashboardScope = FULL_ADMIN_DASHBOARD_ROLES.has(normalizedAdminRole);
  const isFullAdmin = normalizedAdminRole === 'super_admin' || normalizedAdminRole === 'admin';
  const assignableRoleOptions = getAssignableUserRoleOptions(authUser?.role);
  const canAssignSuperAdmin = assignableRoleOptions.some((option) => option.value === 'super_admin');
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [adminCallSearchQuery, setAdminCallSearchQuery] = useState('');
  const [adminCallDisplayCount, setAdminCallDisplayCount] = useState(20);
  const [overview, setOverview] = useState<AdminOperationsBootstrapResponse['overview']>(null);
  const [trackingListings, setTrackingListings] = useState<Listing[]>([]);
  const [trackingListingsLoading, setTrackingListingsLoading] = useState(false);
  const [trackingListingsLoaded, setTrackingListingsLoaded] = useState(false);
  const [trackingListingsError, setTrackingListingsError] = useState('');
  const [trackingListingsTruncated, setTrackingListingsTruncated] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [billingLoadError, setBillingLoadError] = useState('');

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
  const [listingsPerPage, setListingsPerPage] = useState(LISTINGS_PAGE_SIZE_DEFAULT);
  const [listingHasMore, setListingHasMore] = useState(false);
  const [nextListingCursor, setNextListingCursor] = useState<AdminListingsCursor>(null);
  const [listingCursorHistory, setListingCursorHistory] = useState<AdminListingsCursor[]>([null]);
  const [listingsLoadError, setListingsLoadError] = useState('');
  const [selectedListingAuditId, setSelectedListingAuditId] = useState('');
  const [selectedListingForAudit, setSelectedListingForAudit] = useState<Listing | null>(null);
  const [listingAuditData, setListingAuditData] = useState<ListingLifecycleAuditView | null>(null);
  const [listingAuditLoading, setListingAuditLoading] = useState(false);
  const [listingAuditError, setListingAuditError] = useState('');
  const [pgAnalytics, setPgAnalytics] = useState<PgAnalyticsResponse | null>(null);
  const [pgAnalyticsLoading, setPgAnalyticsLoading] = useState(false);
  const [pgAnalyticsError, setPgAnalyticsError] = useState('');
  const listingAuditPanelRef = useRef<HTMLDivElement | null>(null);
  const [pendingListingLifecycleKey, setPendingListingLifecycleKey] = useState('');
  const [listingReviewFilter, setListingReviewFilter] = useState<ListingReviewFilter>('all');
  const [listingReviewSummaries, setListingReviewSummaries] = useState<Record<string, ListingReviewSummary>>({});
  const [listingReviewSummariesLoading, setListingReviewSummariesLoading] = useState(false);
  const [listingReviewSummariesError, setListingReviewSummariesError] = useState('');
  const [bulkApprovingListings, setBulkApprovingListings] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [managedSeatError, setManagedSeatError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ displayName: '', email: '', role: 'member' as string });
  const [inviteSending, setInviteSending] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userDisplayCount, setUserDisplayCount] = useState(50);
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
  const [sendingAdminPasswordReset, setSendingAdminPasswordReset] = useState(false);
  const [adminSettingsError, setAdminSettingsError] = useState('');
  const listingsInitializedRef = useRef(false);
  const trackingListingsLoadKeyRef = useRef('');
  const operationalLoadKeyRef = useRef('');
  const userDirectoryLoadKeyRef = useRef('');
  const listingReviewSummariesLoadKeyRef = useRef('');
  const shouldLoadListingsData = activeTab === 'overview' || activeTab === 'listings';
  const shouldLoadAdminOperations = ['overview', 'accounts', 'users', 'inquiries', 'calls', 'tracking'].includes(activeTab);
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
    const shouldRequestOverview = activeTab === 'overview' || activeTab === 'tracking';
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

  const fetchPgAnalytics = useCallback(async () => {
    if (!authUser?.uid || pgAnalyticsLoading) return;
    setPgAnalyticsLoading(true);
    setPgAnalyticsError('');
    try {
      const data = await adminUserService.getPgAnalytics();
      setPgAnalytics(data);
    } catch (err) {
      setPgAnalyticsError(err instanceof Error ? err.message : 'Failed to load PostgreSQL analytics');
    } finally {
      setPgAnalyticsLoading(false);
    }
  }, [authUser?.uid, pgAnalyticsLoading]);

  const loadTrackingListings = async (force = false) => {
    if (!authUser?.uid) {
      setTrackingListings([]);
      setTrackingListingsLoaded(false);
      setTrackingListingsError('');
      setTrackingListingsTruncated(false);
      trackingListingsLoadKeyRef.current = '';
      return;
    }

    if (trackingListingsLoading || (trackingListingsLoaded && !force)) {
      return;
    }

    const requestKey = `${authUser.uid}:tracking_listings:${showDemoListings ? 'demo' : 'live'}`;
    if (trackingListingsLoadKeyRef.current === requestKey) {
      return;
    }

    trackingListingsLoadKeyRef.current = requestKey;
    setTrackingListingsLoading(true);
    setTrackingListingsError('');

    try {
      const result = await equipmentService.getAllAdminListings({
        includeDemoListings: showDemoListings,
        pageSize: 100,
        maxListings: 5000,
      });
      setTrackingListings(result.listings);
      setTrackingListingsTruncated(result.truncated);
      setTrackingListingsLoaded(true);
    } catch (error) {
      console.error('Error loading full tracking listings:', error);
      setTrackingListingsError(
        error instanceof Error ? error.message : 'Unable to load complete inventory analytics right now.'
      );
      setTrackingListings([]);
      setTrackingListingsTruncated(false);
      setTrackingListingsLoaded(false);
    } finally {
      if (trackingListingsLoadKeyRef.current === requestKey) {
        trackingListingsLoadKeyRef.current = '';
      }
      setTrackingListingsLoading(false);
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
      setBillingLoaded(true);

      const errorMessages = [
        payload.errors?.invoices,
        payload.errors?.subscriptions,
      ].filter(Boolean);
      setBillingLoadError(errorMessages.join(' '));
    } catch (billingError) {
      console.warn('Billing data not available:', billingError);
      setBillingLoadError(billingError instanceof Error ? billingError.message : 'Billing data is not available right now.');
    } finally {
      setBillingLoading(false);
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

  const handleSendAdminPasswordReset = async () => {
    const targetEmail = String(auth.currentUser?.email || authUser?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setAdminSettingsError('A valid account email is required before a password reset link can be sent.');
      return;
    }

    setSendingAdminPasswordReset(true);
    setAdminSettingsError('');
    setUserFeedback(null);

    try {
      await sendPasswordReset(targetEmail);
      setUserFeedback({
        tone: 'success',
        message: `Password reset instructions were sent to ${targetEmail}.`,
      });
    } catch (error) {
      setAdminSettingsError(error instanceof Error ? error.message : 'Unable to send a password reset link right now.');
    } finally {
      setSendingAdminPasswordReset(false);
    }
  };

  const loadListingsPage = async (
    cursor: AdminListingsCursor,
    pageNumber: number,
    includeDemoListings = showDemoListings,
    pageSizeOverride?: number
  ) => {
    setListingsLoading(true);
    setListingsLoadError('');
    try {
      const page = await equipmentService.getAdminListingsPage({
        pageSize: pageSizeOverride ?? listingsPerPage,
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
      // Defer scroll until after the panel renders so the ref is attached.
      window.requestAnimationFrame(() => {
        listingAuditPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
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
        pageSize: listingsPerPage,
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
    trackingListingsLoadKeyRef.current = '';
    setTrackingListings([]);
    setTrackingListingsLoaded(false);
    setTrackingListingsError('');
    setTrackingListingsTruncated(false);
  }, [authUser?.uid, showDemoListings]);

  useEffect(() => {
    if (activeTab === 'billing' || activeTab === 'tracking') {
      void fetchBillingData();
    }


    if (activeTab === 'tracking') {
      void fetchUsers();
      void loadTrackingListings();
    }

    if (activeTab === 'overview' && hasFullAdminDashboardScope && !pgAnalytics && !pgAnalyticsLoading) {
      void fetchPgAnalytics();
    }
  }, [activeTab, authUser?.uid]);

  useEffect(() => {
    if (activeTab === 'tracking') {
      void loadTrackingListings(true);
    }
  }, [activeTab, showDemoListings]);


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
      .slice(0, listingsPerPage);

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
      const sellerUid = String(formData?.sellerUid || formData?.sellerId || editingListing?.sellerUid || editingListing?.sellerId || '').trim();
      if (!editingListing && !sellerUid) {
        throw new Error('A seller account UID is required before an admin can create a new machine listing.');
      }

      if (editingListing) {
        await equipmentService.updateListing(editingListing.id, formData);
      } else {
        await equipmentService.addListing({
          ...formData,
          sellerUid,
          sellerId: sellerUid,
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
    const ok = await confirm({ title: 'Delete Listing', message: 'Are you sure you want to delete this listing? This action cannot be undone.', variant: 'danger' });
    if (!ok) return;
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
  };

  const handleBulkDeleteListings = async (ids: string[]) => {
    const ok = await confirm({
      title: 'Bulk Delete',
      message: `Are you sure you want to delete ${ids.length} listing${ids.length === 1 ? '' : 's'}? This action cannot be undone.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await Promise.all(ids.map(id => equipmentService.deleteListing(id)));
      if (ids.includes(selectedListingAuditId)) {
        setSelectedListingAuditId('');
        setSelectedListingForAudit(null);
        setListingAuditData(null);
        setListingAuditError('');
      }
      setUserFeedback({
        tone: 'success',
        message: `${ids.length} listing${ids.length === 1 ? '' : 's'} deleted successfully.`,
      });
      fetchData();
    } catch (error) {
      console.error('Error bulk deleting listings:', error);
      setUserFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to delete listings right now.',
      });
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
      const shouldRunRemainingGoLiveWorkflow =
        action === 'payment_confirmed' &&
        String(listing.approvalStatus || 'pending').trim().toLowerCase() === 'approved' &&
        String(listing.status || 'pending').trim().toLowerCase() !== 'active';

      const actionsToRun = action === 'approve'
        ? getBulkApprovalWorkflow(listing)
        : shouldRunRemainingGoLiveWorkflow
          ? getBulkApprovalWorkflow(listing).filter((workflowAction) => workflowAction !== 'approve')
          : [action];

      let latestListing = listing;

      for (const nextAction of actionsToRun) {
        const nextListing = await equipmentService.transitionListingLifecycle(listing.id, nextAction, {
          reason: nextAction === 'reject' ? reason : '',
          metadata: {
            triggeredFrom: 'admin_dashboard',
            actorSurface: 'admin_listings',
            requestedAction: action,
            automatedWorkflow: action === 'approve' && actionsToRun.length > 1,
          },
        });

        latestListing = {
          ...latestListing,
          ...nextListing,
        } as Listing;
        mergeListingPatch(listing.id, nextListing);
      }

      await loadListingLifecycleAudit(latestListing, { silent: true });
      setUserFeedback({
        tone: 'success',
        message: actionsToRun.length > 1
          ? (action === 'approve'
              ? 'Listing approved and published successfully.'
              : 'Listing published successfully.')
          : `Listing ${action.replace(/_/g, ' ')} completed successfully.`,
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

  const getBulkApprovalWorkflow = useCallback((listing: Listing): ListingLifecycleAction[] => {
    const status = String(listing.status || 'pending').trim().toLowerCase();
    const approvalStatus = String(listing.approvalStatus || 'pending').trim().toLowerCase();
    const paymentStatus = String(listing.paymentStatus || 'pending').trim().toLowerCase();

    if (['archived', 'sold'].includes(status)) {
      return [];
    }

    const actions: ListingLifecycleAction[] = [];
    if (approvalStatus !== 'approved') {
      actions.push('approve');
    }
    if (paymentStatus !== 'paid') {
      actions.push('payment_confirmed');
    }
    if (status !== 'active') {
      actions.push('publish');
    }

    return actions;
  }, []);

  const handleBulkApproveListings = async (selectedListings: Listing[]) => {
    const actionableListings = selectedListings
      .map((listing) => ({ listing, actions: getBulkApprovalWorkflow(listing) }))
      .filter((entry) => entry.actions.length > 0);

    if (actionableListings.length === 0) {
      setUserFeedback({
        tone: 'warning',
        message: 'The selected listings are already live, sold, or archived.',
      });
      return;
    }

    const ok = await confirm({
      title: 'Approve Selected Listings',
      message: `Approve and publish ${actionableListings.length} selected listing${actionableListings.length === 1 ? '' : 's'}? This will confirm payment where needed so the listings can go live.`,
      confirmLabel: 'Approve & Go Live',
      cancelLabel: 'Cancel',
      variant: 'info',
    });
    if (!ok) return;

    setBulkApprovingListings(true);

    let approvedCount = 0;
    let skippedCount = selectedListings.length - actionableListings.length;
    let failedCount = 0;

    try {
      for (const entry of actionableListings) {
        let nextListing = entry.listing;

        try {
          for (const action of entry.actions) {
            const patch = await equipmentService.transitionListingLifecycle(nextListing.id, action, {
              metadata: {
                triggeredFrom: 'admin_dashboard',
                actorSurface: 'admin_bulk_approve',
              },
            });
            nextListing = { ...nextListing, ...patch } as Listing;
            mergeListingPatch(nextListing.id, patch);
          }
          approvedCount += 1;
        } catch (error) {
          failedCount += 1;
          console.error(`Bulk approval failed for listing ${entry.listing.id}:`, error);
        }
      }

      await fetchData();

      setUserFeedback({
        tone: failedCount > 0 ? 'warning' : 'success',
        message: failedCount > 0
          ? `${approvedCount} listing${approvedCount === 1 ? '' : 's'} approved and published. ${failedCount} failed${skippedCount ? ` and ${skippedCount} did not need changes` : ''}.`
          : `${approvedCount} listing${approvedCount === 1 ? '' : 's'} approved and published successfully${skippedCount ? `. ${skippedCount} already did not require updates` : ''}.`,
      });
    } finally {
      setBulkApprovingListings(false);
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
      await alert({ title: 'Account Creation Failed', message, variant: 'info' });
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
    const ok = await confirm({ title: 'Lock Account', message: 'Lock this account and prevent sign-in?', variant: 'danger' });
    if (!ok) return;
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
    const ok = await confirm({ title: 'Lock Account', message: `Lock ${account.name}'s account?`, variant: 'danger' });
    if (!ok) return;

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
    const ok = await confirm({ title: 'Delete Account', message: `Delete ${account.name} permanently? This removes both the profile and auth account.`, variant: 'danger' });
    if (!ok) return;

    await runUserAction(account.id, 'delete', async () => {
      await adminUserService.deleteUser(account.id);
      setAccounts(prev => prev.filter(entry => entry.id !== account.id));
      setUserFeedback({
        tone: 'success',
        message: `${account.name}'s account was deleted.`,
      });
    });
  };

  const handleInviteUser = async () => {
    if (!inviteForm.displayName.trim() || !inviteForm.email.trim()) return;
    setInviteSending(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Not authenticated');
      const resp = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: inviteForm.displayName.trim(),
          email: inviteForm.email.trim().toLowerCase(),
          role: inviteForm.role || 'member',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to invite user');
      setUserFeedback({ tone: 'success', message: `Invitation sent to ${inviteForm.email}` });
      setShowInviteModal(false);
      setInviteForm({ displayName: '', email: '', role: 'member' });
      void fetchUsers();
    } catch (err) {
      setUserFeedback({ tone: 'error', message: err instanceof Error ? err.message : 'Failed to invite user' });
    } finally {
      setInviteSending(false);
    }
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
      if (normalized === 'failed') return 'bg-red-500/10 border border-red-500/20 text-red-500';
      return 'bg-amber-500/10 border border-amber-500/20 text-amber-600';
    }

    if (type === 'approval') {
      if (normalized === 'approved') return 'bg-data/10 border border-data/30 text-data';
      if (normalized === 'rejected') return 'bg-red-500/10 border border-red-500/20 text-red-500';
      return 'bg-amber-500/10 border border-amber-500/20 text-amber-600';
    }

    if (type === 'visibility') {
      if (normalized === 'public' || normalized === 'live') return 'bg-data/10 border border-data/30 text-data';
      if (normalized === 'private' || normalized === 'archived') return 'bg-surface border border-line text-muted';
      return 'bg-amber-500/10 border border-amber-500/20 text-amber-600';
    }

    if (normalized === 'active') return 'bg-data/10 border border-data/30 text-data';
    if (normalized === 'sold') return 'bg-secondary/10 border border-secondary/30 text-secondary';
    if (normalized === 'archived' || normalized === 'expired') return 'bg-surface border border-line text-muted';
    return 'bg-amber-500/10 border border-amber-500/20 text-amber-600';
  };

  const getAdminLifecycleActions = (listing: Listing): Array<{ action: ListingLifecycleAction; label: string; tone: 'primary' | 'secondary' | 'danger' }> => {
    const status = String(listing.status || 'pending').trim().toLowerCase();
    const approvalStatus = String(listing.approvalStatus || 'pending').trim().toLowerCase();
    const paymentStatus = String(listing.paymentStatus || 'pending').trim().toLowerCase();
    const approvalWorkflow = getBulkApprovalWorkflow(listing);
    const actions: Array<{ action: ListingLifecycleAction; label: string; tone: 'primary' | 'secondary' | 'danger' }> = [];

    if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
      actions.push({
        action: 'approve',
        label: approvalWorkflow.length > 1 ? 'Approve & Go Live' : 'Approve',
        tone: 'primary',
      });
    }
    if (approvalStatus !== 'rejected' && status !== 'archived' && status !== 'sold') {
      actions.push({ action: 'reject', label: 'Reject', tone: 'danger' });
    }
    if (approvalStatus === 'approved' && paymentStatus !== 'paid' && status !== 'archived') {
      actions.push({
        action: 'payment_confirmed',
        label: status !== 'active' ? 'Go Live' : 'Confirm Payment',
        tone: status !== 'active' ? 'primary' : 'secondary',
      });
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
    const activeSubscriptions = subscriptions.filter(isSubscriptionTrulyActive).length;

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
                      <button onClick={() => openNativeMap(listing.location)} aria-label="Open location in map" className="p-2 text-accent hover:text-accent/80">
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
                      No calls available yet. Calls will appear here when visitors reach out by phone.
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

      {hasFullAdminDashboardScope && (
        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface/50">
            <div className="flex items-center gap-3">
              <Database size={16} className="text-accent" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">PostgreSQL Data Connect</h3>
            </div>
            <div className="flex items-center gap-3">
              {pgAnalytics && (
                <span className={`text-[9px] font-black uppercase tracking-widest ${pgAnalytics.status === 'healthy' ? 'text-data' : 'text-accent'}`}>
                  {pgAnalytics.status}
                </span>
              )}
              <button
                onClick={() => void fetchPgAnalytics()}
                disabled={pgAnalyticsLoading}
                className="text-[10px] font-bold text-muted uppercase hover:text-ink disabled:opacity-50"
              >
                {pgAnalyticsLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              </button>
            </div>
          </div>
          <div className="p-6">
            {pgAnalyticsError && (
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">
                {pgAnalyticsError}
              </div>
            )}
            {pgAnalyticsLoading && !pgAnalytics && (
              <div className="text-center py-8">
                <Loader2 size={20} className="animate-spin mx-auto text-muted" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-3">Querying PostgreSQL...</p>
              </div>
            )}
            {pgAnalytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Connectors', value: Object.keys(pgAnalytics.connectors).length, healthy: Object.values(pgAnalytics.connectors).every(Boolean) },
                    { label: 'PG Listings', value: pgAnalytics.summary.totalListingsInPg },
                    { label: 'Anomalies', value: pgAnalytics.summary.openAnomalies },
                    { label: 'Storefronts', value: pgAnalytics.summary.activeStorefronts },
                    { label: 'New Inquiries', value: pgAnalytics.summary.newInquiries },
                    { label: 'Dealer Feeds', value: pgAnalytics.summary.activeDealerFeeds },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center">
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">{metric.label}</div>
                      <div className={`text-xl font-black tracking-tighter ${'healthy' in metric ? (metric.healthy ? 'text-data' : 'text-accent') : 'text-ink'}`}>
                        {metric.value ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.entries(pgAnalytics.connectors).map(([name, healthy]) => (
                    <div key={name} className={`px-3 py-2 text-center border rounded-sm ${healthy ? 'border-data/30 bg-data/5' : 'border-accent/30 bg-accent/5'}`}>
                      <div className={`text-[9px] font-black uppercase tracking-widest ${healthy ? 'text-data' : 'text-accent'}`}>
                        {healthy ? <CheckCircle2 size={10} className="inline mr-1" /> : <AlertCircle size={10} className="inline mr-1" />}
                        {name}
                      </div>
                    </div>
                  ))}
                </div>
                {Object.keys(pgAnalytics.summary.listingsByState).length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Listings by Lifecycle State</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(pgAnalytics.summary.listingsByState)
                        .sort(([, a], [, b]) => b - a)
                        .map(([state, count]) => (
                          <span key={state} className="px-3 py-1 bg-surface border border-line rounded-sm text-[10px] font-bold uppercase tracking-wider text-ink">
                            {state}: <span className="font-black">{count}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
                <div className="text-[9px] font-bold text-muted uppercase tracking-widest">
                  Last queried: {new Date(pgAnalytics.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
          </div>
        </div>
      </div>

      <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
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
              {filteredAccounts.slice(0, userDisplayCount).map(account => (
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
                      <button className="p-2 text-muted hover:text-ink" title="Edit" aria-label="Edit user" onClick={() => openUserEditor(account)}><Edit size={14} /></button>
                      <button
                        onClick={() => handleSuspendUser(account.id)}
                        className="p-2 text-muted hover:text-accent"
                        title="Suspend user"
                        aria-label="Suspend user"
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
        {filteredAccounts.length > userDisplayCount && (
          <div className="border-t border-line px-6 py-3 flex items-center justify-between bg-surface/30">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
              Showing {Math.min(userDisplayCount, filteredAccounts.length)} of {filteredAccounts.length} accounts
            </span>
            <button
              type="button"
              onClick={() => setUserDisplayCount((prev) => prev + 50)}
              className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
            >
              View More
            </button>
          </div>
        )}
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
        <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/20 rounded-sm p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-500">{listingsLoadError}</span>
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
            placeholder="Search the machine queue by title, ID, seller, make, or model..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-industrial w-full px-3 text-[10px] font-bold uppercase tracking-widest"
          />
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
        <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Pending Review</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-amber-600">{pendingReviewCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-amber-600">Needs admin or super admin decision</p>
        </div>
        <div className="rounded-sm border border-data/30 bg-data/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-data">Live Listings</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-ink">{liveListingCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-data">Approved, paid, and publicly visible</p>
        </div>
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Rejected Listings</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-red-500">{rejectedListingCount}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-500">Require correction before resubmission</p>
        </div>
      </div>

      <div className="rounded-sm border border-line bg-surface px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Operator Review Filters</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Search the queue above, then review pending approval, paid not live, rejected, expired, sold, archived, and anomaly states here.
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
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-yellow-500/20 bg-yellow-500/10 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-yellow-600">
            <AlertCircle size={14} className="shrink-0" />
            <span>{listingReviewSummariesError}</span>
          </div>
        ) : null}
      </div>

      <div className="rounded-sm border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Operator Review Queue</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Scroll, search, inspect, and bulk-publish loaded inventory before using imports or media mapping below.
            </p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {filteredListings.length.toLocaleString()} loaded listing{filteredListings.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 px-4 py-4">
          <VirtualizedListingsTable
            listings={filteredListings}
            onEdit={(listing) => { setEditingListing(listing); setIsModalOpen(true); }}
            onDelete={handleDeleteListing}
            onBulkDelete={handleBulkDeleteListings}
            onBulkApprove={handleBulkApproveListings}
            bulkApproveLoading={bulkApprovingListings}
            onInspect={(listing) => { void loadListingLifecycleAudit(listing); }}
            openNativeMap={openNativeMap}
          />
        </div>
      </div>

      {selectedListingAudit && (
        <div ref={listingAuditPanelRef} className="rounded-sm border border-line bg-surface shadow-sm scroll-mt-24">
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
                      ? 'border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'
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
              <div className="flex items-start gap-3 rounded-sm border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-500">
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
                              <span key={code} className="rounded-sm border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-500">
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
                              <span key={errorCode} className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-600">
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
                                <span key={code} className="rounded-sm border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-500">
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

      <BulkImportToolkit
        ownerUid={authUser?.uid}
        workspaceLabel={authUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
        listingAllowanceText="Unlimited unpaid listings"
      />

      {listingPage > 1 || listingHasMore ? (() => {
        const maxVisitedPage = listingCursorHistory.length;
        const lastKnownPage = listingHasMore ? maxVisitedPage + 1 : maxVisitedPage;

        const getPageNumbers = (): (number | 'ellipsis')[] => {
          if (lastKnownPage <= 7) {
            return Array.from({ length: lastKnownPage }, (_, i) => i + 1);
          }
          const pages: (number | 'ellipsis')[] = [];
          const near = new Set<number>();
          for (let p = 1; p <= Math.min(2, lastKnownPage); p++) near.add(p);
          for (let p = Math.max(1, lastKnownPage - 1); p <= lastKnownPage; p++) near.add(p);
          for (let p = Math.max(1, listingPage - 1); p <= Math.min(lastKnownPage, listingPage + 1); p++) near.add(p);
          const sorted = [...near].sort((a, b) => a - b);
          for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push('ellipsis');
            pages.push(sorted[i]);
          }
          return pages;
        };

        const pageNumbers = getPageNumbers();

        const navigateToPage = (page: number) => {
          if (page < 1 || page > maxVisitedPage || page === listingPage || listingsLoading) return;
          void loadListingsPage(listingCursorHistory[page - 1] ?? null, page, showDemoListings);
        };

        return (
          <div className="flex flex-col gap-3 rounded-sm border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => navigateToPage(listingPage - 1)}
                disabled={listingPage === 1 || listingsLoading}
                className="btn-industrial py-1.5 px-3 text-[10px] font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              {pageNumbers.map((entry, idx) =>
                entry === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-[10px] font-black text-muted select-none">...</span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => navigateToPage(entry)}
                    disabled={entry === listingPage || entry > maxVisitedPage || listingsLoading}
                    className={`min-w-[28px] py-1.5 px-2 text-[10px] font-black uppercase tracking-widest rounded-sm border transition-colors ${
                      entry === listingPage
                        ? 'bg-ink text-bg border-ink'
                        : entry > maxVisitedPage
                          ? 'border-line text-muted/40 cursor-not-allowed'
                          : 'border-line text-muted hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    {entry}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => void loadListingsPage(nextListingCursor, listingPage + 1, showDemoListings)}
                disabled={!listingHasMore || listingsLoading || !nextListingCursor}
                className="btn-industrial py-1.5 px-3 text-[10px] font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
              <span>
                Page {listingPage}{listingHasMore ? '+' : ` of ${maxVisitedPage}`}
                {' \u00b7 '}{filteredListings.length.toLocaleString()} loaded
              </span>
              <label className="flex items-center gap-1.5">
                <span className="whitespace-nowrap">Per page:</span>
                <select
                  value={listingsPerPage}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setListingsPerPage(next);
                    setListingCursorHistory([null]);
                    void loadListingsPage(null, 1, showDemoListings, next);
                  }}
                  className="border border-line rounded-sm bg-bg px-2 py-1 text-[10px] font-black uppercase text-ink cursor-pointer"
                >
                  {LISTINGS_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      })() : null}
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

      {trackingListingsLoading || usersLoading || billingLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-sm border border-line bg-surface px-6 py-10">
          <RefreshCw size={16} className="animate-spin text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">
            Building full marketplace analytics from live admin data…
          </span>
        </div>
      ) : null}

      {trackingListingsError ? (
        <div className="flex items-center gap-3 rounded-sm border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-yellow-600">
          <AlertCircle size={16} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Inventory Analytics Warning</p>
            <p className="text-xs font-semibold leading-5">{trackingListingsError}</p>
          </div>
        </div>
      ) : null}

      {trackingListingsTruncated ? (
        <div className="flex items-center gap-3 rounded-sm border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-700">
          <AlertCircle size={16} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Partial Inventory Analytics</p>
            <p className="text-xs font-semibold leading-5">
              The analytics view hit the safety cap while loading inventory. Counts shown here are still broader than the paged machine table, but the full marketplace inventory exceeds the current client analytics window.
            </p>
          </div>
        </div>
      ) : null}

      <AnalyticsDashboard
        listings={trackingListingsLoaded ? trackingListings : listings}
        inquiries={inquiries}
        accounts={accounts}
        invoices={invoices}
        subscriptions={subscriptions}
        overviewTotalViews={overview?.metrics?.totalViews}
        overviewActiveSubscriptions={overview?.metrics?.activeSubscriptions}
      />
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8">
      {/* Error banner */}
      {usersLoadError && (
        <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/20 rounded-sm p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-500">{usersLoadError}</span>
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
            onClick={() => setShowInviteModal(true)}
            className="btn-industrial btn-accent py-2 px-6 text-[10px]"
          >
            Invite User
          </button>
        </div>
      </div>

      {/* Managed Account Creation (for admins who lost the Accounts tab) */}
      {isFullAdmin && (
        <details className="bg-bg border border-line rounded-sm overflow-hidden">
          <summary className="px-6 py-3 bg-surface text-[10px] font-black uppercase tracking-[0.2em] text-ink cursor-pointer hover:bg-surface/70 list-none flex items-center justify-between">
            <span>Add Managed Team Account</span>
            <Users size={14} className="text-muted" />
          </summary>
          <form onSubmit={handleCreateManagedAccount} className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
            <input value={newManagedAccount.displayName} onChange={(e) => setNewManagedAccount({ ...newManagedAccount, displayName: e.target.value })} placeholder="NAME" className="input-industrial md:col-span-2" required />
            <input value={newManagedAccount.email} onChange={(e) => setNewManagedAccount({ ...newManagedAccount, email: e.target.value })} placeholder="EMAIL" className="input-industrial md:col-span-2" type="email" required />
            <select value={newManagedAccount.role} onChange={(e) => setNewManagedAccount({ ...newManagedAccount, role: e.target.value as UserRole })} className="select-industrial md:col-span-1">
              {assignableRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="submit" disabled={creatingAccount} className="btn-industrial btn-accent md:col-span-1 py-2 text-[10px]">
              {creatingAccount ? 'Creating...' : 'Add Role'}
            </button>
          </form>
          {managedSeatError && (
            <div className="mx-4 mb-4 flex items-center gap-2 border border-accent/30 bg-accent/5 rounded-sm px-4 py-3 text-xs font-medium text-accent">
              <AlertCircle size={14} className="shrink-0" />
              <span>{managedSeatError}</span>
            </div>
          )}
        </details>
      )}

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
                      <button
                        onClick={async () => {
                          const newVal = !user.manuallyVerified;
                          const action = newVal ? 'verify' : 'unverify';
                          try {
                            const idToken = await auth.currentUser?.getIdToken();
                            if (!idToken) return;
                            const resp = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/${action}`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                              body: '{}',
                            });
                            if (!resp.ok) throw new Error(`Failed to ${action}`);
                            setAccounts((prev) => prev.map((u) => u.id === user.id ? { ...u, manuallyVerified: newVal } : u));
                          } catch (err) {
                            console.error('Verification update failed:', err);
                          }
                        }}
                        className={`inline-flex w-fit text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm cursor-pointer hover:opacity-80 transition-opacity ${user.manuallyVerified ? 'bg-data/10 text-data' : 'bg-red-500/10 text-red-500'}`}
                      >
                        {user.manuallyVerified ? 'Seller Verified' : 'Verify Seller'}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${user.status === 'Active' ? 'bg-data animate-pulse' : user.status === 'Pending' ? 'bg-yellow-500' : 'bg-accent'}`}></span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{user.status}</span>
                      </div>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                        Listings {user.totalListings} • Leads {user.totalLeads}{user.storefrontViews ? ` • Views ${user.storefrontViews}` : ''}
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

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-surface border border-line rounded-sm p-8 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black uppercase tracking-widest text-ink mb-6">Invite New User</h3>
            <div className="space-y-4">
              <div>
                <label className="label-micro text-muted block mb-1">Display Name</label>
                <input
                  type="text"
                  value={inviteForm.displayName}
                  onChange={(e) => setInviteForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="John Smith"
                  className="input-industrial w-full px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="label-micro text-muted block mb-1">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="input-industrial w-full px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="label-micro text-muted block mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  className="input-industrial w-full px-3 py-2 text-xs"
                >
                  <option value="member">Member</option>
                  <option value="individual_seller">Individual Seller</option>
                  <option value="dealer">Dealer</option>
                  <option value="pro_dealer">Pro Dealer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="btn-industrial btn-outline py-2 px-4 text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleInviteUser()}
                disabled={inviteSending || !inviteForm.displayName.trim() || !inviteForm.email.trim()}
                className="btn-industrial btn-accent py-2 px-6 text-[10px] disabled:opacity-50"
              >
                {inviteSending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );


  const renderSettings = () => (
    <div className="max-w-3xl space-y-8">
      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Profile Settings</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center space-x-6 pb-6 border-b border-line">
            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 shadow-sm flex items-center justify-center text-accent overflow-hidden">
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

          <AccountMfaSettingsCard
            user={authUser}
            onProfilePatch={patchCurrentUserProfile}
            recaptchaContainerId="admin-mfa-recaptcha"
            confirmRemove={(factor) => confirm({
              title: 'Remove SMS MFA',
              message: `Remove SMS multi-factor authentication for ${factor.phoneNumber || 'this mobile number'}?`,
              confirmLabel: 'Remove',
              variant: 'danger',
            })}
          />

          <div className="flex items-center justify-between py-4 border-b border-line">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-ink">Password Reset</h4>
                <p className="text-[10px] font-bold text-muted uppercase">Send a secure password reset email to your signed-in admin address</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSendAdminPasswordReset()}
              disabled={sendingAdminPasswordReset}
              className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
            >
              {sendingAdminPasswordReset ? 'Sending...' : 'Send Reset Link'}
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


  const dashboardHeading = activeTab === 'overview'  ? 'Account Overview'
    : activeTab === 'listings'  ? 'Machine Inventory'
    : activeTab === 'inquiries' ? 'Lead Monitoring'
    : activeTab === 'calls'     ? 'Call Logs'
    : activeTab === 'tracking'  ? 'Performance Tracking'
    : activeTab === 'accounts'  ? 'Account Directory'
    : activeTab === 'billing'   ? 'Billing Account'
    : activeTab === 'content'   ? 'Content Studio'
    : activeTab === 'dealer_feeds' ? 'Dealer Feed Manager'
    : activeTab === 'auctions'  ? 'Auction Management'
    : activeTab === 'taxonomy'  ? 'Taxonomy Manager'
    : activeTab === 'users'     ? 'Operator Directory'
    : 'Profile Settings';
  const dashboardSeoTitle = `${dashboardHeading} | Forestry Equipment Sales`;
  const dashboardSeoDescription = activeTab === 'overview'
    ? 'Review live Forestry Equipment Sales marketplace operations, inventory, leads, and account activity.'
    : `Manage ${dashboardHeading.toLowerCase()} in the Forestry Equipment Sales admin workspace.`;
  const dashboardCanonicalPath = '/admin';

  const dashboardTabs = [
    { id: 'overview', label: 'Account Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'Machines', icon: Package },
    { id: 'inquiries', label: 'Leads', icon: MessageSquare },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'tracking', label: 'Performance', icon: Activity },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'dealer_feeds', label: 'Dealer Feeds', icon: Database },
    { id: 'auctions', label: 'Auctions', icon: Gavel },
    { id: 'taxonomy', label: 'Taxonomy', icon: FolderTree, adminOnly: true },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const visibleTabs = dashboardTabs.filter((item) => {
    if (isContentOnlyDashboardRole) {
      return item.id === 'content' || item.id === 'settings';
    }

    // Hide Accounts tab for admins — Users tab covers everything
    if (item.id === 'accounts' && isFullAdmin) {
      return false;
    }

    if ('adminOnly' in item && item.adminOnly) {
      return isFullAdmin;
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
            <div className="w-8 h-8 bg-accent/10 border border-accent/20 shadow-sm flex items-center justify-center rounded-sm text-accent">
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
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 shadow-sm flex items-center justify-center text-accent">
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

          <section className="lg:hidden mb-6 overflow-x-auto">
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
                  ? 'border-red-500/20 bg-red-500/10 text-red-500'
                  : userFeedback.tone === 'warning'
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-600'
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
                      ? 'border-red-500/20 bg-red-500/10 text-red-500'
                      : userFeedback.tone === 'warning'
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-600'
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
              {activeTab === 'billing'   && <BillingTab hasFullAdminDashboardScope={hasFullAdminDashboardScope} adminRole={authUser?.role} onFeedback={setUserFeedback} />}
              {activeTab === 'content'   && <ContentTab normalizedAdminRole={normalizedAdminRole} confirm={confirm} />}
              {activeTab === 'dealer_feeds' && <DealerFeedsTab accounts={accounts} />}
              {activeTab === 'auctions' && <AuctionsTab onFeedback={setUserFeedback} confirm={confirm} formatPrice={formatPrice} />}
              {activeTab === 'taxonomy' && (
                <div className="space-y-4">
                  <TaxonomyManager />
                </div>
              )}
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
        showSellerAssignment
      />


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
                <button type="button" onClick={closeUserEditor} className="p-2 text-muted hover:text-ink transition-colors" aria-label="Close user editor">
                  <X size={16} />
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
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
