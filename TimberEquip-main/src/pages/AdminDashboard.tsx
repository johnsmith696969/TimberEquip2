import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, MessageSquare, 
  Users, Settings, TrendingUp, Plus,
  Search, Filter, MoreVertical, Edit, Trash2, Download,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight,
  User, Shield, Bell, CreditCard, LogOut,
  Phone, Activity, ShieldAlert, MapPin, ExternalLink, Building2,
  FileText, Image, Layers, Database, Upload, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import { adminUserService } from '../services/adminUserService';
import { cmsService } from '../services/cmsService';
import { Listing, Inquiry, Account, CallLog, UserRole, BlogPost, MediaItem, ContentBlock } from '../types';
import { billingService, Invoice, Subscription, BillingAuditLog } from '../services/billingService';
import { dealerFeedService, DealerFeedIngestResult, DealerFeedLog } from '../services/dealerFeedService';
import { ListingModal } from '../components/admin/ListingModal';
import { InquiryList } from '../components/admin/InquiryList';
import { CmsEditor } from '../components/admin/CmsEditor';
import { MediaLibrary } from '../components/admin/MediaLibrary';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { useAuth } from '../components/AuthContext';
import { useLocale } from '../components/LocaleContext';

type DashboardTab = 'overview' | 'listings' | 'inquiries' | 'calls' | 'accounts' | 'settings' | 'tracking' | 'users' | 'billing' | 'content' | 'dealer_feeds';

export function AdminDashboard() {
  const { user: authUser, logout: authLogout } = useAuth();
  const { formatPrice } = useLocale();
  const profileName = authUser?.displayName || 'Caleb Happy';
  const roleLabel =
    authUser?.role === 'super_admin'
      ? 'Super Admin'
      : authUser?.role === 'admin'
        ? 'Admin'
        : authUser?.role === 'developer'
          ? 'Developer'
          : authUser?.role === 'content_manager'
            ? 'Content Manager'
            : authUser?.role === 'dealer_manager'
              ? 'Dealer Manager'
              : authUser?.role === 'dealer_staff'
                ? 'Dealer Staff'
                : authUser?.role === 'dealer'
                  ? 'Dealer'
                  : authUser?.role === 'individual_seller'
                    ? 'Owner Operator'
                    : authUser?.role === 'member'
                      ? 'Member'
                      : 'Buyer';
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [billingLogs, setBillingLogs] = useState<BillingAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [managedSeatError, setManagedSeatError] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [usersLoadError, setUsersLoadError] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
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
    role: 'buyer'
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
    role: 'dealer_staff',
    company: '',
    phoneNumber: ''
  });

  // ── Dealer Feed state ──────────────────────────────────────────────
  const [dfSubTab,     setDfSubTab]     = useState<'ingest' | 'logs'>('ingest');
  const [dfSource,     setDfSource]     = useState('');
  const [dfDealerId,   setDfDealerId]   = useState('');
  const [dfItemsJson,  setDfItemsJson]  = useState('[]');
  const [dfDryRun,     setDfDryRun]     = useState(true);
  const [dfLoading,    setDfLoading]    = useState(false);
  const [dfResult,     setDfResult]     = useState<DealerFeedIngestResult | null>(null);
  const [dfError,      setDfError]      = useState('');
  const [dfLogs,       setDfLogs]       = useState<DealerFeedLog[]>([]);
  const [dfLogsLoading, setDfLogsLoading] = useState(false);

  // ── CMS state ────────────────────────────────────────────────────
  const [blogPosts,      setBlogPosts]      = useState<BlogPost[]>([]);
  const [mediaItems,     setMediaItems]     = useState<MediaItem[]>([]);
  const [contentBlocks,  setContentBlocks]  = useState<ContentBlock[]>([]);
  const [editingPost,    setEditingPost]    = useState<BlogPost | null>(null);
  const [showCmsEditor,  setShowCmsEditor]  = useState(false);
  const [contentSubTab,  setContentSubTab]  = useState<'posts' | 'media' | 'blocks'>('posts');
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
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'developer':
        return 'Developer';
      case 'content_manager':
        return 'Content Manager';
      case 'editor':
        return 'Editor';
      case 'dealer':
        return 'Dealer';
      case 'dealer_manager':
        return 'Dealer Manager';
      case 'dealer_staff':
        return 'Dealer Staff';
      case 'individual_seller':
        return 'Owner Operator';
      case 'member':
      case 'buyer':
        return 'Buyer';
      default:
        return 'Buyer';
    }
  };

  const isPublishedPost = (post: BlogPost) => {
    const status = String(post.status || '').trim().toLowerCase();
    const reviewStatus = String(post.reviewStatus || '').trim().toLowerCase();
    return status === 'published' || reviewStatus === 'published';
  };

  // ── Real-time inquiry subscription ─────────────────────────────
  useEffect(() => {
    const unsubscribe = equipmentService.subscribeToInquiries((live) => {
      setInquiries(live);
    });
    return () => unsubscribe();
  }, []);

  const exportInquiriesCSV = () => {
    const headers = ['ID', 'Buyer Name', 'Email', 'Phone', 'Status', 'Assigned To', 'Listing', 'Type', 'Spam Score', 'Response Time (min)', 'Message', 'Created At'];
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
      String(inq.responseTimeMinutes ?? ''),
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

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersLoadError('');
    try {
      const accountsData = await adminUserService.getUsers();
      setAccounts(accountsData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsersLoadError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchData = async () => {
    if (!authUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch users independently so a failure doesn't block the rest of the dashboard
    void fetchUsers();
    try {
      const [listingsData, inquiriesData, callsData] = await Promise.all([
        equipmentService.getListings({ includeUnapproved: true, inStockOnly: false, sortBy: 'newest' }),
        equipmentService.getInquiries(),
        equipmentService.getCalls(),
      ]);

      const skidderCount = listingsData.filter((listing) => listing.category === 'Skidders').length;
      const firewoodProcessorCount = listingsData.filter((listing) => listing.category === 'Firewood Processors').length;

      if (skidderCount < 10 || firewoodProcessorCount < 10) {
        await equipmentService.seedDemoInventory();
        const refreshedListings = await equipmentService.getListings({ includeUnapproved: true, inStockOnly: false, sortBy: 'newest' });
        setListings(refreshedListings);
      } else {
        setListings(listingsData);
      }

      setInquiries(inquiriesData);
      setCalls(callsData);

      // Fetch billing data separately to avoid blocking if backend isn't ready
      try {
        const [invoicesData, subscriptionsData, logsData] = await Promise.all([
          billingService.getAdminInvoices(),
          billingService.getAdminSubscriptions(),
          billingService.getAdminAuditLogs()
        ]);
        setInvoices(invoicesData);
        setSubscriptions(subscriptionsData);
        setBillingLogs(logsData);
      } catch (billingError) {
        console.warn('Billing data not available:', billingError);
      }

      // Fetch CMS data
      try {
        const [postsData, mediaData, blocksData] = await Promise.all([
          cmsService.getBlogPosts(),
          cmsService.getMedia(),
          cmsService.getContentBlocks()
        ]);
        setBlogPosts(postsData);
        setMediaItems(mediaData);
        setContentBlocks(blocksData);
      } catch (cmsErr) {
        console.warn('CMS data not available:', cmsErr);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [authUser?.uid]);

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
      fetchData();
    } catch (error) {
      console.error('Error saving listing:', error);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        await equipmentService.deleteListing(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting listing:', error);
      }
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
    try {
      await equipmentService.addInquiryInternalNote(id, {
        text,
        authorUid: authUser?.uid,
        authorName: authUser?.displayName || 'Admin'
      });
      fetchData();
    } catch (error) {
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
        role: 'dealer_staff',
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
    try {
      const account = accounts.find((entry) => entry.id === uid);
      if (!account) return;

      const updatedAccount = await adminUserService.updateUser(uid, {
        displayName: account.displayName || account.name,
        email: account.email,
        phoneNumber: account.phoneNumber || account.phone,
        company: account.company,
        role,
      });

      setAccounts(prev => prev.map(a => a.id === uid ? updatedAccount : a));
    } catch (err) {
      console.error('Error changing user role:', err);
      alert(err instanceof Error ? err.message : 'Unable to update the user role.');
    }
  };

  const handleSuspendUser = async (uid: string) => {
    if (!window.confirm('Lock this account and prevent sign-in?')) return;
    try {
      const updatedAccount = await adminUserService.lockUser(uid);
      setAccounts(prev => prev.map(a => a.id === uid ? updatedAccount : a));
    } catch (err) {
      console.error('Error suspending user:', err);
      alert(err instanceof Error ? err.message : 'Unable to lock this account.');
    }
  };

  const openUserEditor = (account: Account) => {
    setEditingAccount(account);
    setUserEditForm({
      displayName: account.displayName || account.name,
      email: account.email,
      phoneNumber: account.phoneNumber || account.phone || '',
      company: account.company || '',
      role: account.role,
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
      role: 'buyer',
    });
  };

  const handleSaveUserEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setSavingUserEdit(true);
      const updatedAccount = await adminUserService.updateUser(editingAccount.id, userEditForm);
      setAccounts(prev => prev.map(account => account.id === editingAccount.id ? updatedAccount : account));
      closeUserEditor();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error instanceof Error ? error.message : 'Unable to update this user.');
      setSavingUserEdit(false);
    }
  };

  const runUserAction = async (uid: string, action: string, task: () => Promise<void>) => {
    try {
      setPendingUserActionKey(`${uid}:${action}`);
      await task();
    } catch (error) {
      console.error(`Error running ${action} for user ${uid}:`, error);
      alert(error instanceof Error ? error.message : 'Unable to complete that action.');
    } finally {
      setPendingUserActionKey('');
    }
  };

  const handleSendPasswordReset = async (account: Account) => {
    await runUserAction(account.id, 'reset', async () => {
      await adminUserService.sendPasswordReset(account.id);
      alert(`Password reset email sent to ${account.email}.`);
    });
  };

  const handleLockUser = async (account: Account) => {
    if (!window.confirm(`Lock ${account.name}'s account?`)) return;

    await runUserAction(account.id, 'lock', async () => {
      const updatedAccount = await adminUserService.lockUser(account.id);
      setAccounts(prev => prev.map(entry => entry.id === account.id ? updatedAccount : entry));
    });
  };

  const handleUnlockUser = async (account: Account) => {
    await runUserAction(account.id, 'unlock', async () => {
      const updatedAccount = await adminUserService.unlockUser(account.id);
      setAccounts(prev => prev.map(entry => entry.id === account.id ? updatedAccount : entry));
    });
  };

  const handleDeleteUser = async (account: Account) => {
    if (!window.confirm(`Delete ${account.name} permanently? This removes both the profile and auth account.`)) return;

    await runUserAction(account.id, 'delete', async () => {
      await adminUserService.deleteUser(account.id);
      setAccounts(prev => prev.filter(entry => entry.id !== account.id));
    });
  };

  const isUserActionPending = (uid: string, action: string) => pendingUserActionKey === `${uid}:${action}`;

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.manufacturer || l.make || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const stats = [
    { label: 'Active Equipment', value: listings.length, change: '+12%', icon: Package, color: 'text-accent' },
    { label: 'Total Leads', value: inquiries.length, change: '+24%', icon: MessageSquare, color: 'text-secondary' },
    { label: 'Call Volume', value: calls.length, change: '+8%', icon: Phone, color: 'text-data' },
    { label: 'Active Users', value: accounts.length, change: '+15%', icon: Users, color: 'text-ink' }
  ];

  const renderOverview = () => (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface border border-line p-8 rounded-sm shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 bg-bg border border-line rounded-sm ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-data uppercase tracking-widest">{stat.change}</span>
            </div>
            <span className="label-micro block mb-1">{stat.label}</span>
            <span className="text-3xl font-black tracking-tighter text-ink">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Tracking Metrics */}
      <div className="bg-bg border border-line rounded-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Global Performance Tracking</h3>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-data rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-data uppercase tracking-widest">Live Data Feed</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col">
            <span className="label-micro mb-2">Conversion Rate</span>
            <span className="text-2xl font-black tracking-tighter">4.2%</span>
            <div className="w-full bg-line h-1 mt-4">
              <div className="bg-accent h-full w-[42%]"></div>
            </div>
            <span className="text-[9px] font-bold text-muted uppercase mt-2">Leads to Sales Ratio</span>
          </div>
          <div className="flex flex-col">
            <span className="label-micro mb-2">Avg. Response Time</span>
            <span className="text-2xl font-black tracking-tighter">18.5m</span>
            <div className="w-full bg-line h-1 mt-4">
              <div className="bg-secondary h-full w-[65%]"></div>
            </div>
            <span className="text-[9px] font-bold text-muted uppercase mt-2">Inquiry to Contact</span>
          </div>
          <div className="flex flex-col">
            <span className="label-micro mb-2">Market Sentiment</span>
            <span className="text-2xl font-black tracking-tighter">Bullish</span>
            <div className="w-full bg-line h-1 mt-4">
              <div className="bg-data h-full w-[85%]"></div>
            </div>
            <span className="text-[9px] font-bold text-muted uppercase mt-2">Inventory Turnover Rate</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Inventory</h3>
            <button onClick={() => setActiveTab('listings')} className="text-[10px] font-bold text-muted uppercase hover:text-ink">View All</button>
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
                {listings.slice(0, 5).map(listing => (
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
            <button onClick={() => setActiveTab('calls')} className="text-[10px] font-bold text-muted uppercase hover:text-ink">View All</button>
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
                {calls.slice(0, 5).map(call => (
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
          <option value="admin">Admin</option>
          <option value="developer">Developer</option>
          <option value="content_manager">Content Manager</option>
          <option value="editor">Editor</option>
          <option value="dealer_manager">Dealer Manager</option>
          <option value="dealer_staff">Dealer Staff</option>
          <option value="member">Buyer (Free Member)</option>
          <option value="buyer">Buyer</option>
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
                { role: 'Full Access (super_admin)', inv: true,  cont: true,  users: true,  bill: true,  set: true,  dev: true  },
                { role: 'Admin',                    inv: true,  cont: true,  users: true,  bill: true,  set: true,  dev: false },
                { role: 'Developer',                inv: true,  cont: false, users: false, bill: false, set: true,  dev: true  },
                { role: 'Content Manager',          inv: false, cont: true,  users: false, bill: false, set: false, dev: false },
                { role: 'Editor',                   inv: false, cont: true,  users: false, bill: false, set: false, dev: false },
                { role: 'Dealer Manager',           inv: true,  cont: false, users: true,  bill: false, set: false, dev: false },
                { role: 'Dealer Staff',             inv: true,  cont: false, users: false, bill: false, set: false, dev: false },
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
          <div className="flex items-center bg-bg border border-line px-4 py-2 rounded-sm w-full sm:w-64">
            <Search size={14} className="text-muted mr-3" />
            <input type="text" placeholder="Search accounts..." className="bg-transparent border-none text-[10px] font-bold focus:ring-0 w-full text-ink uppercase" />
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
              {accounts.map(account => (
                <tr key={account.id} className="hover:bg-surface/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-ink">{account.name}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">{account.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-ink uppercase">{account.company}</td>
                  <td className="px-6 py-4">
                    <select
                      value={account.role}
                      onChange={e => handleChangeUserRole(account.id, e.target.value as UserRole)}
                      className="select-industrial text-[9px] py-1"
                    >
                      <option value="super_admin">Full Access</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                      <option value="content_manager">Content Manager</option>
                      <option value="editor">Editor</option>
                      <option value="dealer_manager">Dealer Manager</option>
                      <option value="dealer_staff">Dealer Staff</option>
                      <option value="individual_seller">Owner Operator</option>
                      <option value="member">Buyer (Free Member)</option>
                      <option value="buyer">Buyer</option>
                    </select>
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
                      <button className="p-2 text-muted hover:text-ink" title="Edit"><Edit size={14} /></button>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCalls = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-line rounded-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Call Monitoring</h3>
        <div className="flex items-center space-x-4">
          <span className="text-[10px] font-black text-data uppercase">Total: {calls.length}</span>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                <th className="px-6 py-4">Caller</th>
                <th className="px-6 py-4">Ad</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Authenticated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {calls.map(call => (
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
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 border border-line rounded-sm">
        <div className="flex items-center bg-bg border border-line px-4 py-2 rounded-sm w-full sm:w-96">
          <Search size={16} className="text-muted mr-3" />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs font-bold focus:ring-0 w-full text-ink uppercase" 
          />
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={async () => {
              try {
                await equipmentService.seedDemoInventory();
                await fetchData();
                alert('Demo inventory seeded: 3 listings in every taxonomy subcategory.');
              } catch (error) {
                console.error('Failed to seed demo inventory:', error);
                alert(error instanceof Error ? error.message : 'Unable to seed demo inventory.');
              }
            }}
            className="btn-industrial py-2 px-4"
          >
            Seed Demo Inventory
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

      <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                <th className="px-6 py-4">Equipment</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Leads</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredListings.map(listing => (
                <tr key={listing.id} className="hover:bg-surface/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-surface rounded-sm overflow-hidden border border-line">
                        <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-ink">{listing.title}</span>
                        <span className="text-[9px] font-bold text-muted uppercase">{listing.manufacturer} • {listing.year}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-muted uppercase">{listing.category}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black tracking-tighter text-ink">{formatPrice(listing.price, listing.currency || 'USD', 0)}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-ink">{listing.hours.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => openNativeMap(listing.location)} className="flex items-center text-[10px] font-bold text-accent uppercase hover:underline">
                      <MapPin size={10} className="mr-1" /> {listing.location}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-ink">{listing.leads}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => { setEditingListing(listing); setIsModalOpen(true); }}
                        className="p-2 text-muted hover:text-ink"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteListing(listing.id)}
                        className="p-2 text-muted hover:text-accent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
            onClick={fetchUsers}
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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input 
            type="text" 
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Search all users..." 
            className="input-industrial w-full pl-10"
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
            onClick={fetchUsers}
            className="btn-industrial btn-outline py-2 px-4 text-[10px] flex items-center"
          >
            <RefreshCw size={12} className="mr-1.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className="btn-industrial btn-accent py-2 px-6 text-[10px]"
          >
            Invite User
          </button>
        </div>
      </div>

      <div className="bg-bg border border-line rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
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
                      {user.status === 'Suspended' ? (
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
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingCount = invoices.filter(i => i.status === 'pending').length;
    const failedCount = invoices.filter(i => i.status === 'failed').length;
    const activeSubs = subscriptions.filter(s => s.status === 'active').length;

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Billing & Revenue Dashboard</h2>
          <div className="flex space-x-4">
            <button className="btn-industrial bg-surface py-2 px-4 text-[10px] flex items-center">
              <Download size={14} className="mr-2" /> Export Report
            </button>
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
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-bg rounded-sm"><Filter size={16} /></button>
                <button className="p-2 hover:bg-bg rounded-sm"><Search size={16} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
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
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
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

        <div className="bg-ink text-white p-8 rounded-sm">
          <div className="flex items-center space-x-4 mb-6">
            <Shield className="text-accent" size={24} />
            <h3 className="text-lg font-black uppercase tracking-tighter">Billing Audit Trail</h3>
          </div>
          <div className="space-y-4">
            {billingLogs.map((log, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">{log.action}</span>
                  <span className="text-[11px] text-white/60 mt-1">{log.details}</span>
                </div>
                <span className="text-[9px] font-bold text-white/30">
                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <div className="space-y-6">
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
          {(['posts', 'media', 'blocks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setContentSubTab(tab)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors whitespace-nowrap ${
                contentSubTab === tab ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {tab === 'posts' ? 'Blog Posts' : tab === 'media' ? 'Media Library' : 'Content Blocks'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Blog Posts ─────────────────────────────────────────────── */}
      {contentSubTab === 'posts' && (
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
            <button
              onClick={() => { setEditingPost(null); setShowCmsEditor(true); }}
              className="btn-industrial btn-accent py-2 px-6 flex items-center"
            >
              <Plus size={14} className="mr-2" /> New Post
            </button>
          </div>

          <div className="bg-bg border border-line rounded-sm overflow-hidden">
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[860px] text-left">
              <thead>
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
                {blogPosts.map(post => (
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
                {blogPosts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                      No posts yet — click New Post to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Media Library ───────────────────────────────────────────── */}
      {contentSubTab === 'media' && (
        <MediaLibrary
          items={mediaItems}
          onRefresh={async () => setMediaItems(await cmsService.getMedia())}
        />
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

  const renderSettings = () => (    <div className="max-w-3xl space-y-8">
      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Profile Settings</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center space-x-6 pb-6 border-b border-line">
            <div className="w-20 h-20 rounded-full bg-ink/10 flex items-center justify-center text-ink border-2 border-line relative group">
              <User size={32} />
              <button className="absolute inset-0 bg-ink/60 text-white text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                Change
              </button>
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-lg font-black uppercase tracking-tighter text-ink">{profileName}</h4>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{roleLabel} • Member since 2024</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="label-micro">Display Name</label>
              <input type="text" defaultValue={profileName} className="input-industrial w-full" />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Email Address</label>
              <input type="email" defaultValue={authUser?.email || "calebhappy@gmail.com"} className="input-industrial w-full" />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Phone Number</label>
              <input type="tel" defaultValue="541-555-0199" className="input-industrial w-full" />
            </div>
            <div className="space-y-1">
              <label className="label-micro">Company Name</label>
              <input type="text" defaultValue="Happy Logging Co." className="input-industrial w-full" />
            </div>
          </div>
          <button className="btn-industrial btn-accent py-3 px-8">Save Changes</button>
        </div>
      </section>

      <section className="bg-surface border border-line rounded-sm overflow-hidden">
        <div className="p-6 border-b border-line bg-bg">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Security & Preferences</h3>
        </div>
        <div className="p-8 space-y-6">
          {[
            { label: 'Email Notifications', desc: 'Receive alerts for new inquiries and market news', icon: Bell, active: true },
            { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account', icon: Shield, active: false },
            { label: 'Payment Methods', desc: 'Manage your billing information for ad programs', icon: CreditCard, active: false }
          ].map((pref, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-line last:border-0">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-bg border border-line rounded-sm text-muted">
                  <pref.icon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-ink">{pref.label}</h4>
                  <p className="text-[10px] font-bold text-muted uppercase">{pref.desc}</p>
                </div>
              </div>
              <button className={`w-10 h-5 rounded-full relative transition-colors ${pref.active ? 'bg-accent' : 'bg-line'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${pref.active ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderDealerFeeds = () => {
    const handleIngest = async () => {
      setDfError('');
      setDfResult(null);

      let items: unknown[];
      try {
        items = JSON.parse(dfItemsJson);
        if (!Array.isArray(items)) throw new Error('Items must be a JSON array');
      } catch (e) {
        setDfError(e instanceof Error ? e.message : 'Invalid JSON');
        return;
      }
      if (!dfSource.trim()) { setDfError('Source name is required'); return; }
      if (!dfDealerId.trim()) { setDfError('Dealer ID is required'); return; }

      setDfLoading(true);
      try {
        const result = await dealerFeedService.ingest({
          sourceName: dfSource.trim(),
          dealerId: dfDealerId.trim(),
          dryRun: dfDryRun,
          items: items as Parameters<typeof dealerFeedService.ingest>[0]['items'],
        });
        setDfResult(result);
      } catch (e) {
        setDfError(e instanceof Error ? e.message : 'Ingest failed');
      } finally {
        setDfLoading(false);
      }
    };

    const handleLoadLogs = async () => {
      setDfLogsLoading(true);
      try {
        setDfLogs(await dealerFeedService.getRecentLogs(20));
      } catch (e) {
        console.error('Failed to load dealer feed logs:', e);
      } finally {
        setDfLogsLoading(false);
      }
    };

    const formatLogTime = (ts: DealerFeedLog['processedAt']) => {
      if (!ts) return '—';
      if (typeof ts === 'object' && 'toDate' in ts && typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleString();
      }
      return new Date(ts as string | number).toLocaleString();
    };

    return (
      <div className="space-y-6">
        {/* Sub-tab nav */}
        <div className="flex space-x-1 bg-surface border border-line p-2 rounded-sm w-fit">
          {(['ingest', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setDfSubTab(tab);
                if (tab === 'logs' && dfLogs.length === 0) handleLoadLogs();
              }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors ${
                dfSubTab === tab ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {tab === 'ingest' ? 'Ingest Feed' : 'Ingest Logs'}
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
                    onChange={e => setDfSource(e.target.value)}
                    placeholder="e.g. JohnDeereDealerFeed"
                    className="input-industrial w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Dealer UID / ID</label>
                  <input
                    type="text"
                    value={dfDealerId}
                    onChange={e => setDfDealerId(e.target.value)}
                    placeholder="Firebase UID or dealer identifier"
                    className="input-industrial w-full text-xs"
                  />
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

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">
                    Items JSON Array
                  </label>
                  <textarea
                    rows={12}
                    value={dfItemsJson}
                    onChange={e => setDfItemsJson(e.target.value)}
                    spellCheck={false}
                    className="input-industrial w-full text-[11px] font-mono resize-y"
                    placeholder={`[\n  {\n    "externalId": "JD-1234",\n    "title": "2022 John Deere 748L Skidder",\n    "price": 185000,\n    "year": 2022,\n    "manufacturer": "John Deere",\n    "category": "Skidder"\n  }\n]`}
                  />
                </div>

                {dfError && (
                  <div className="flex items-start gap-2 bg-accent/10 border border-accent/30 rounded-sm p-3">
                    <AlertCircle size={14} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-accent">{dfError}</p>
                  </div>
                )}

                <button
                  onClick={handleIngest}
                  disabled={dfLoading}
                  className="btn-industrial btn-accent py-3 px-8 flex items-center gap-2 w-full justify-center disabled:opacity-50"
                >
                  {dfLoading
                    ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing…</>
                    : <><Database size={14} /> {dfDryRun ? 'Run Dry Run Preview' : 'Run Ingest'}</>
                  }
                </button>
              </div>
            </div>

            {/* Result panel */}
            <div>
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

  const dashboardTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'Machines', icon: Package },
    { id: 'inquiries', label: 'Leads', icon: MessageSquare },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'tracking', label: 'Performance', icon: Activity },
    { id: 'accounts', label: 'Accounts', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'dealer_feeds', label: 'Dealer Feeds', icon: Database },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const visibleTabs = dashboardTabs.filter(
    item => !('adminOnly' in item && item.adminOnly) ||
      authUser?.role === 'super_admin' || authUser?.role === 'admin'
  );

  return (
    <div className="min-h-screen bg-bg flex overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-line hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-line">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-ink flex items-center justify-center rounded-sm">
              <LayoutDashboard className="text-accent" size={18} />
            </div>
            <span className="text-lg font-black tracking-tighter text-ink uppercase">Account</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {visibleTabs.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
                  onClick={() => setActiveTab(item.id)}
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
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-ink">
                {activeTab === 'overview'  ? 'System Overview' :
                 activeTab === 'listings'  ? 'Machine Inventory' :
                 activeTab === 'inquiries' ? 'Lead Monitoring' :
                 activeTab === 'calls'     ? 'Call Logs' :
                 activeTab === 'tracking'  ? 'Performance Tracking' :
                 activeTab === 'accounts'  ? 'Account Directory' : 
                 activeTab === 'billing'   ? 'Billing Account' :
                 activeTab === 'content'   ? 'Content Studio' :
                 activeTab === 'dealer_feeds' ? 'Dealer Feed Manager' :
                 activeTab === 'users'     ? 'Operator Directory' : 'Profile Settings'}
              </h2>
            </div>
            {activeTab === 'listings' && (
              <button 
                onClick={() => { setEditingListing(null); setIsModalOpen(true); }}
                className="btn-industrial btn-accent py-4 px-8"
              >
                <Plus size={16} className="mr-2" />
                New Listing
              </button>
            )}
          </header>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
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
            className="fixed inset-0 z-50 bg-ink/60 p-4 flex items-center justify-center"
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
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                      <option value="content_manager">Content Manager</option>
                      <option value="editor">Editor</option>
                      <option value="dealer">Dealer</option>
                      <option value="dealer_manager">Dealer Manager</option>
                      <option value="dealer_staff">Dealer Staff</option>
                      <option value="individual_seller">Owner Operator</option>
                      <option value="member">Buyer (Free Member)</option>
                      <option value="buyer">Buyer</option>
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
