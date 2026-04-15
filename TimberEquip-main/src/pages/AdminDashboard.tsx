import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { updateEmail, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import {
  LayoutDashboard, Package, MessageSquare,
  Users, Settings, Edit,
  CheckCircle2, AlertCircle,
  User, CreditCard, LogOut,
  Phone, Activity,
  FileText, Image, Database, FolderTree,
  Gavel, X, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { equipmentService, type AdminListingsCursor, type ListingReviewSummary } from '../services/equipmentService';
import { userService } from '../services/userService';
import { adminUserService, type AdminDiagnosticsResponse, type AdminOperationsBootstrapResponse, type PgAnalyticsResponse } from '../services/adminUserService';
import { Listing, Inquiry, Account, CallLog, UserRole } from '../types';
import { billingService, Invoice, Subscription, isSubscriptionTrulyActive, type AdminBillingBootstrapResponse } from '../services/billingService';
import { ListingModal } from '../components/admin/ListingModal';
import { TaxonomyManager } from '../components/admin/TaxonomyManager';
import { DealerFeedsTab } from '../components/admin/DealerFeedsTab';
import { BillingTab } from '../components/admin/BillingTab';
import { AuctionsTab } from '../components/admin/AuctionsTab';
import { ContentTab } from '../components/admin/ContentTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { CallsTab } from '../components/admin/CallsTab';
import { InquiriesTab } from '../components/admin/InquiriesTab';
import { TrackingTab } from '../components/admin/TrackingTab';
import { AccountsTab } from '../components/admin/AccountsTab';
import { UsersTab } from '../components/admin/UsersTab';
import { OverviewTab } from '../components/admin/OverviewTab';
import { ListingsTab } from '../components/admin/ListingsTab';
import { Seo } from '../components/Seo';
import { useAuth } from '../components/AuthContext';
import { useLocale } from '../components/LocaleContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { auth } from '../firebase';
import { API_BASE } from '../constants/api';
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
  const [showArchivedInquiries, setShowArchivedInquiries] = useState(false);
  const [showArchivedCalls, setShowArchivedCalls] = useState(false);
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
  const [sendingTestReport, setSendingTestReport] = useState<string | null>(null);
  const [testReportResult, setTestReportResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
  const [adminDiagnostics, setAdminDiagnostics] = useState<AdminDiagnosticsResponse | null>(null);
  const [adminDiagnosticsLoading, setAdminDiagnosticsLoading] = useState(false);
  const [adminDiagnosticsError, setAdminDiagnosticsError] = useState('');
  const [adminRepairingAccess, setAdminRepairingAccess] = useState(false);
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

  const loadAdminDiagnostics = useCallback(async () => {
    if (!authUser?.uid || !hasFullAdminDashboardScope || adminDiagnosticsLoading) return;
    setAdminDiagnosticsLoading(true);
    setAdminDiagnosticsError('');
    try {
      const diagnostics = await adminUserService.getAdminDiagnostics();
      setAdminDiagnostics(diagnostics);
    } catch (err) {
      setAdminDiagnosticsError(err instanceof Error ? err.message : 'Failed to load admin diagnostics.');
    } finally {
      setAdminDiagnosticsLoading(false);
    }
  }, [adminDiagnosticsLoading, authUser?.uid, hasFullAdminDashboardScope]);

  const handleRepairAdminAccess = useCallback(async () => {
    if (!authUser?.uid || !hasFullAdminDashboardScope || adminRepairingAccess) return;

    const confirmed = await confirm({
      title: 'Repair Admin Access',
      message: 'This will align your Firebase Auth custom claims and Firestore profile role/status, then force-refresh your ID token. Continue?',
      confirmLabel: 'Repair Access',
      variant: 'warning',
    });
    if (!confirmed) return;

    setAdminRepairingAccess(true);
    setAdminDiagnosticsError('');
    try {
      const diagnostics = await adminUserService.repairCurrentAdminAccess();
      await auth.currentUser?.getIdToken(true);
      setAdminDiagnostics(diagnostics);
      setUserFeedback({
        tone: diagnostics.repairRecommended ? 'warning' : 'success',
        message: diagnostics.repairRecommended
          ? 'Admin repair completed, but diagnostics still found mismatches. Refresh diagnostics or sign out and back in once.'
          : 'Admin access repaired and your ID token was refreshed.',
      });
      void loadAdminDiagnostics();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to repair admin access.';
      setAdminDiagnosticsError(message);
      setUserFeedback({ tone: 'error', message });
    } finally {
      setAdminRepairingAccess(false);
    }
  }, [adminRepairingAccess, authUser?.uid, confirm, hasFullAdminDashboardScope, loadAdminDiagnostics]);

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

  const handleSendTestReport = async (reportType: 'platform') => {
    setSendingTestReport(reportType);
    setTestReportResult(null);
    try {
      const result = await adminUserService.sendTestPlatformReport({
        recipients: [authUser?.email].filter(Boolean) as string[],
        days: 30,
      });
      setTestReportResult({ type: 'success', message: `Report sent to ${result.recipients?.join(', ') || authUser?.email || 'admin'}` });
    } catch (error) {
      setTestReportResult({ type: 'error', message: error instanceof Error ? error.message : 'Failed to send test report' });
    } finally {
      setSendingTestReport(null);
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

    if (activeTab === 'settings' && hasFullAdminDashboardScope && !adminDiagnostics && !adminDiagnosticsLoading) {
      void loadAdminDiagnostics();
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

  const handleArchiveInquiry = async (id: string) => {
    try {
      await equipmentService.archiveInquiry(id);
      setInquiries((prev) => prev.map((entry) =>
        entry.id === id ? { ...entry, archivedAt: new Date().toISOString(), archivedByUid: authUser?.uid } : entry
      ));
    } catch (error) {
      console.error('Error archiving inquiry:', error);
    }
  };

  const handleUnarchiveInquiry = async (id: string) => {
    try {
      await equipmentService.unarchiveInquiry(id);
      setInquiries((prev) => prev.map((entry) =>
        entry.id === id ? { ...entry, archivedAt: undefined, archivedByUid: undefined } : entry
      ));
    } catch (error) {
      console.error('Error unarchiving inquiry:', error);
    }
  };

  const handleArchiveCall = async (id: string) => {
    try {
      await equipmentService.archiveCall(id);
      setCalls((prev) => prev.map((entry) =>
        entry.id === id ? { ...entry, archivedAt: new Date().toISOString(), archivedByUid: authUser?.uid } : entry
      ));
    } catch (error) {
      console.error('Error archiving call:', error);
    }
  };

  const handleUnarchiveCall = async (id: string) => {
    try {
      await equipmentService.unarchiveCall(id);
      setCalls((prev) => prev.map((entry) =>
        entry.id === id ? { ...entry, archivedAt: undefined, archivedByUid: undefined } : entry
      ));
    } catch (error) {
      console.error('Error unarchiving call:', error);
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
      const resp = await fetch(`${API_BASE}/admin/invite-user`, {
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

  const exportGovernanceAuditCSV = () => {
    if (!selectedListingAudit || !listingAuditData) return;
    const listing = selectedListingAudit;
    const report = listingAuditData.report;
    const media = listingAuditData.mediaAudit;
    const headers = ['Listing ID', 'Title', 'Manufacturer', 'Model', 'Status', 'Approval Status', 'Payment Status', 'Lifecycle State', 'Review State', 'Payment State', 'Inventory State', 'Visibility State', 'Is Public', 'Summary', 'Anomaly Codes', 'Media Status', 'Image Count', 'Primary Image', 'Media Summary', 'Media Errors'];
    const rows = [[
      listing.id,
      listing.title || '',
      listing.manufacturer || listing.make || '',
      listing.model || '',
      String(listing.status || ''),
      String(listing.approvalStatus || ''),
      String(listing.paymentStatus || ''),
      String(report?.shadowState?.lifecycleState || ''),
      String(report?.shadowState?.reviewState || ''),
      String(report?.shadowState?.paymentState || ''),
      String(report?.shadowState?.inventoryState || ''),
      String(report?.shadowState?.visibilityState || ''),
      report?.shadowState?.isPublic ? 'Yes' : 'No',
      report?.summary || '',
      (report?.anomalyCodes || []).join('; '),
      String(media?.status || ''),
      String(media?.imageCount ?? ''),
      media?.primaryImagePresent ? 'Yes' : 'No',
      media?.summary || '',
      (media?.validationErrors || []).join('; '),
    ]];
    downloadCsv(`governance-audit-${listing.id}`, headers, rows);
  };

  const exportTransitionsCSV = () => {
    if (!listingAuditData?.transitions?.length) return;
    const headers = ['Transition Type', 'Actor UID', 'Source', 'Created At', 'From Lifecycle', 'From Visibility', 'To Lifecycle', 'To Visibility', 'Anomaly Codes'];
    const rows = listingAuditData.transitions.map((t) => [
      t.transitionType || '',
      t.actorUid || 'system',
      t.artifactSource || '',
      t.createdAt ? formatTimestamp(t.createdAt) : '',
      String(t.fromState?.lifecycleState || ''),
      String(t.fromState?.visibilityState || ''),
      String(t.toState?.lifecycleState || ''),
      String(t.toState?.visibilityState || ''),
      (t.anomalyCodes || []).join('; '),
    ]);
    downloadCsv(`transitions-${listingAuditData.listingId}`, headers, rows);
  };

  const exportOverviewCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = stats.map((s) => [s.label || '', String(s.value ?? '')]);
    downloadCsv('overview-snapshot', headers, rows);
  };


  const archivedCallCount = calls.filter((c) => c.archivedAt).length;
  const filteredInquiries = showArchivedInquiries ? inquiries : inquiries.filter((i) => !i.archivedAt);
  const archivedInquiryCount = inquiries.filter((i) => i.archivedAt).length;

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
              {activeTab === 'overview' && (
                <OverviewTab
                  stats={stats}
                  recentListings={recentOverviewListings}
                  recentCalls={recentOverviewCalls}
                  formatPrice={formatPrice}
                  openNativeMap={openNativeMap}
                  hasFullAdminDashboardScope={hasFullAdminDashboardScope}
                  pgAnalytics={pgAnalytics}
                  pgAnalyticsLoading={pgAnalyticsLoading}
                  pgAnalyticsError={pgAnalyticsError}
                  onFetchPgAnalytics={() => void fetchPgAnalytics()}
                  selectAdminTab={selectAdminTab}
                  onExportCSV={exportOverviewCSV}
                />
              )}
              {activeTab === 'listings' && (
                <ListingsTab
                  authUser={authUser}
                  listings={listings}
                  filteredListings={filteredListings}
                  listingsLoading={listingsLoading}
                  listingsLoadError={listingsLoadError}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  showDemoListings={showDemoListings}
                  listingPage={listingPage}
                  listingsPerPage={listingsPerPage}
                  onListingsPerPageChange={(size) => { setListingsPerPage(size); setListingCursorHistory([null]); void loadListingsPage(null, 1, showDemoListings, size); }}
                  listingHasMore={listingHasMore}
                  nextListingCursor={nextListingCursor}
                  listingCursorHistory={listingCursorHistory}
                  onLoadListingsPage={loadListingsPage}
                  listingReviewFilter={listingReviewFilter}
                  onListingReviewFilterChange={setListingReviewFilter}
                  listingReviewCounts={listingReviewCounts}
                  listingReviewSummariesLoading={listingReviewSummariesLoading}
                  listingReviewSummariesError={listingReviewSummariesError}
                  pendingReviewCount={pendingReviewCount}
                  liveListingCount={liveListingCount}
                  rejectedListingCount={rejectedListingCount}
                  paidNotLiveCount={paidNotLiveCount}
                  anomalyListingCount={anomalyListingCount}
                  bulkApprovingListings={bulkApprovingListings}
                  onEditListing={(listing) => { setEditingListing(listing); setIsModalOpen(true); }}
                  onAddListing={() => { setEditingListing(null); setIsModalOpen(true); }}
                  onDeleteListing={handleDeleteListing}
                  onBulkDeleteListings={handleBulkDeleteListings}
                  onBulkApproveListings={handleBulkApproveListings}
                  selectedListingAudit={selectedListingAudit}
                  selectedListingAuditId={selectedListingAuditId}
                  listingAuditData={listingAuditData}
                  listingAuditLoading={listingAuditLoading}
                  listingAuditError={listingAuditError}
                  listingAuditPanelRef={listingAuditPanelRef}
                  onInspectListing={(listing) => { void loadListingLifecycleAudit(listing); }}
                  onCloseAuditPanel={() => { setSelectedListingAuditId(''); setSelectedListingForAudit(null); setListingAuditData(null); setListingAuditError(''); }}
                  onAdminLifecycleAction={handleAdminListingLifecycleAction}
                  isListingLifecyclePending={isListingLifecyclePending}
                  getAdminLifecycleActions={getAdminLifecycleActions}
                  formatLifecycleLabel={formatLifecycleLabel}
                  getListingBadgeClasses={getListingBadgeClasses}
                  openNativeMap={openNativeMap}
                  onExportListingsCSV={exportListingsCSV}
                  onExportGovernanceAuditCSV={exportGovernanceAuditCSV}
                  onExportTransitionsCSV={exportTransitionsCSV}
                />
              )}
              {activeTab === 'inquiries' && (
                <InquiriesTab
                  inquiries={inquiries}
                  filteredInquiries={filteredInquiries}
                  archivedCount={archivedInquiryCount}
                  showArchived={showArchivedInquiries}
                  onToggleArchived={() => setShowArchivedInquiries(!showArchivedInquiries)}
                  accounts={accounts}
                  listings={listings}
                  onAddNote={handleAddInquiryNote}
                  onArchive={handleArchiveInquiry}
                  onUnarchive={handleUnarchiveInquiry}
                  onExportCSV={exportInquiriesCSV}
                />
              )}
              {activeTab === 'calls' && (
                <CallsTab
                  calls={calls}
                  searchQuery={adminCallSearchQuery}
                  onSearchQueryChange={setAdminCallSearchQuery}
                  displayCount={adminCallDisplayCount}
                  onDisplayCountChange={setAdminCallDisplayCount}
                  showArchived={showArchivedCalls}
                  onToggleArchived={() => setShowArchivedCalls(!showArchivedCalls)}
                  archivedCount={archivedCallCount}
                  onArchive={handleArchiveCall}
                  onUnarchive={handleUnarchiveCall}
                  onExportCSV={exportCallsCSV}
                  formatTimestamp={formatTimestamp}
                />
              )}
              {activeTab === 'tracking' && (
                <TrackingTab
                  trackingListingsLoading={trackingListingsLoading}
                  usersLoading={usersLoading}
                  billingLoading={billingLoading}
                  trackingListingsError={trackingListingsError}
                  trackingListingsTruncated={trackingListingsTruncated}
                  trackingListingsLoaded={trackingListingsLoaded}
                  trackingListings={trackingListings}
                  listings={listings}
                  inquiries={inquiries}
                  accounts={accounts}
                  invoices={invoices}
                  subscriptions={subscriptions}
                  overview={overview}
                  onExportCSV={exportPerformanceCSV}
                />
              )}
              {activeTab === 'accounts' && (
                <AccountsTab
                  accounts={accounts}
                  filteredAccounts={filteredAccounts}
                  userSearchQuery={userSearchQuery}
                  onUserSearchQueryChange={setUserSearchQuery}
                  userDisplayCount={userDisplayCount}
                  onUserDisplayCountChange={setUserDisplayCount}
                  newManagedAccount={newManagedAccount}
                  onNewManagedAccountChange={setNewManagedAccount}
                  creatingAccount={creatingAccount}
                  managedSeatError={managedSeatError}
                  assignableRoleOptions={assignableRoleOptions}
                  canAssignSuperAdmin={canAssignSuperAdmin}
                  onCreateManagedAccount={handleCreateManagedAccount}
                  onChangeUserRole={handleChangeUserRole}
                  onSuspendUser={handleSuspendUser}
                  onOpenUserEditor={openUserEditor}
                  isUserActionPending={isUserActionPending}
                />
              )}
              {activeTab === 'billing'   && <BillingTab hasFullAdminDashboardScope={hasFullAdminDashboardScope} adminRole={authUser?.role} onFeedback={setUserFeedback} />}
              {activeTab === 'content'   && <ContentTab normalizedAdminRole={normalizedAdminRole} confirm={confirm} />}
              {activeTab === 'dealer_feeds' && <DealerFeedsTab accounts={accounts} />}
              {activeTab === 'auctions' && <AuctionsTab onFeedback={setUserFeedback} confirm={confirm} formatPrice={formatPrice} />}
              {activeTab === 'taxonomy' && (
                <div className="space-y-4">
                  <TaxonomyManager />
                </div>
              )}
              {activeTab === 'users' && (
                <UsersTab
                  accounts={accounts}
                  filteredAccounts={filteredAccounts}
                  usersLoadError={usersLoadError}
                  usersLoading={usersLoading}
                  userSearchQuery={userSearchQuery}
                  onUserSearchQueryChange={setUserSearchQuery}
                  isFullAdmin={isFullAdmin}
                  newManagedAccount={newManagedAccount}
                  onNewManagedAccountChange={setNewManagedAccount}
                  creatingAccount={creatingAccount}
                  managedSeatError={managedSeatError}
                  assignableRoleOptions={assignableRoleOptions}
                  onExportCSV={exportUsersCSV}
                  onRefresh={() => fetchUsers()}
                  showInviteModal={showInviteModal}
                  onShowInviteModal={setShowInviteModal}
                  inviteForm={inviteForm}
                  onInviteFormChange={setInviteForm}
                  inviteSending={inviteSending}
                  onInviteUser={handleInviteUser}
                  onCreateManagedAccount={handleCreateManagedAccount}
                  onSendPasswordReset={handleSendPasswordReset}
                  onLockUser={handleLockUser}
                  onUnlockUser={handleUnlockUser}
                  onApproveUser={handleApproveUser}
                  onDeleteUser={handleDeleteUser}
                  onOpenUserEditor={openUserEditor}
                  getAdminRoleDisplayLabel={getAdminRoleDisplayLabel}
                  isUserActionPending={isUserActionPending}
                  onSetAccounts={setAccounts}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab
                  authUser={authUser}
                  profileName={profileName}
                  roleLabel={roleLabel}
                  adminSettingsForm={adminSettingsForm}
                  adminSettingsError={adminSettingsError}
                  savingAdminSettings={savingAdminSettings}
                  savingAdminPreferenceKey={savingAdminPreferenceKey}
                  sendingAdminPasswordReset={sendingAdminPasswordReset}
                  sendingTestReport={sendingTestReport}
                  testReportResult={testReportResult}
                  adminDiagnostics={adminDiagnostics}
                  adminDiagnosticsLoading={adminDiagnosticsLoading}
                  adminDiagnosticsError={adminDiagnosticsError}
                  adminRepairingAccess={adminRepairingAccess}
                  patchCurrentUserProfile={patchCurrentUserProfile}
                  confirm={confirm}
                  selectAdminTab={selectAdminTab}
                  onSettingsInputChange={handleAdminSettingsInputChange}
                  onSaveSettings={handleSaveAdminSettings}
                  onToggleEmailNotifications={handleToggleAdminEmailNotifications}
                  onSendPasswordReset={handleSendAdminPasswordReset}
                  onSendTestReport={handleSendTestReport}
                  onLoadAdminDiagnostics={loadAdminDiagnostics}
                  onRepairAdminAccess={handleRepairAdminAccess}
                />
              )}
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
