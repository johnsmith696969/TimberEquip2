import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, Settings, Bookmark, 
  Search, Clock, CheckCircle2, 
  ArrowRight, LayoutDashboard,
  LogOut, Bell, Package,
  CreditCard, Edit, Trash2, Plus,
  ExternalLink, MapPin, Phone,
  Mail, Building2, Wrench, MessageSquare,
  Shield, Download, ClipboardList, AlertTriangle,
  Activity, Users, FileText, Database, Star, Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { billingService, SELLER_PLAN_DEFINITIONS } from '../services/billingService';
import { useAuth } from '../components/AuthContext';
import { ListingModal } from '../components/admin/ListingModal';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import { storageService } from '../services/storageService';
import { useLocale } from '../components/LocaleContext';
import { CallLog, Currency, FinancingRequest, Inquiry, InspectionRequest, Language, Listing, SavedSearch, Seller, UserProfile } from '../types';
import { auth } from '../firebase';
import { getDownloadURL } from 'firebase/storage';
import { updateEmail, updateProfile as updateAuthProfile, type RecaptchaVerifier } from 'firebase/auth';
import { getUserRoleDisplayLabel } from '../utils/userRoles';
import { canAccessDealerOs, canUserPostListings, getFeaturedListingCap, getManagedListingCap, hasAdminPublishingAccess } from '../utils/sellerAccess';
import { resolveAccountEntitlement } from '../utils/accountEntitlement';
import { getSellerProgramStatementLabel } from '../utils/sellerProgramAgreement';
import { getSellerPlanMarketingLabel } from '../utils/sellerPlans';
import { Seo } from '../components/Seo';
import { buildInspectionSheetFileName, buildInspectionSheetText } from '../utils/inspectionSheets';
import {
  completeSmsMfaEnrollment,
  createVisibleRecaptchaVerifier,
  ensureAuthRecaptchaConfig,
  listSmsMfaFactors,
  resetRecaptchaVerifier,
  startSmsMfaEnrollment,
  type SmsMfaFactorSummary,
  unenrollSmsMfaFactor,
} from '../services/mfaService';

const INSPECTION_MANAGER_ROLES = new Set(['dealer', 'pro_dealer', 'admin', 'super_admin', 'developer']);
const ADMIN_PROFILE_ROLES = new Set(['super_admin', 'admin', 'developer']);
const CONTENT_STUDIO_PROFILE_ROLES = new Set(['super_admin', 'admin', 'developer', 'content_manager', 'editor']);
const LANGUAGE_OPTIONS: Language[] = ['EN', 'FR', 'DE', 'FI', 'PL', 'IT', 'CS', 'ES', 'RO', 'LV', 'PT', 'SK', 'ET', 'NO', 'DA', 'HU', 'LT', 'SV'];
const CURRENCY_OPTIONS: Currency[] = ['USD', 'CAD', 'EUR', 'GBP', 'NOK', 'SEK', 'CHF', 'PLN', 'CZK', 'RON', 'DKK', 'HUF'];
const REQUIRE_EMAIL_VERIFICATION = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim() === 'mobile-app-equipment-sales';

function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function withAsyncTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export function Profile() {
  const { formatPrice, language, currency, setLanguage, setCurrency } = useLocale();
  const { user, logout, toggleFavorite, patchCurrentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasUser = Boolean(user);
  const entitlement = useMemo(() => resolveAccountEntitlement(user), [user]);
  const normalizedRole = hasUser ? userService.normalizeRole(user?.role) : '';
  const hasSellerWorkspaceAccess = hasUser && canUserPostListings(user);
  const hasDealerWorkspaceAccess = hasUser && canAccessDealerOs(user);
  const hasStorefrontAccess = Boolean(
    hasSellerWorkspaceAccess &&
    normalizedRole &&
    userService.supportsEnterpriseStorefront(normalizedRole)
  );
  const hasAdminProfileScope = Boolean(normalizedRole && ADMIN_PROFILE_ROLES.has(normalizedRole));
  const hasContentStudioProfileScope = Boolean(normalizedRole && CONTENT_STUDIO_PROFILE_ROLES.has(normalizedRole));
  const canManageInspectionRequests = Boolean(
    normalizedRole &&
    INSPECTION_MANAGER_ROLES.has(normalizedRole) &&
    (hasAdminProfileScope || hasDealerWorkspaceAccess)
  );
  const canViewSavedEquipment = hasUser && ['buyer', 'member', 'individual_seller'].includes(normalizedRole);
  const canViewSearchAlerts = hasUser && ['buyer', 'member', 'individual_seller'].includes(normalizedRole);
  const canViewMyListings = hasSellerWorkspaceAccess;
  const canViewSellerInquiries = hasSellerWorkspaceAccess;
  const canViewSellerCalls = canViewMyListings;
  const canViewBuyerFinancing = hasUser && ['buyer', 'member', 'individual_seller'].includes(normalizedRole);
  const canViewInspectionRequests = hasUser;
  const storefrontTabLabel = user?.role === 'individual_seller' ? 'Public Profile' : 'Storefront';
  const roleDisplayLabel = getUserRoleDisplayLabel(user?.role);
  const hasPaidSellerSubscription = entitlement.sellerAccessMode === 'subscription';
  const subscriptionPlanLabel = hasPaidSellerSubscription
    ? getSellerPlanMarketingLabel(user?.activeSubscriptionPlanId)
    : normalizedRole === 'member'
      ? 'Free Member'
      : normalizedRole === 'buyer'
        ? 'Buyer'
        : 'No active seller plan';
  const subscriptionStatusLabel = String(
    entitlement.subscriptionState !== 'none'
      ? entitlement.subscriptionState
      : user?.subscriptionStatus ||
    (hasPaidSellerSubscription ? 'active' : normalizedRole === 'member' ? 'free' : 'none')
  ).trim().toLowerCase();
  const billingLabel = entitlement.billingLabel || (
    hasPaidSellerSubscription && user?.activeSubscriptionPlanId
      ? getSellerProgramStatementLabel(user.activeSubscriptionPlanId)
      : 'n/a'
  );
  const canManageBillingPortal = Boolean(
    user && (
      entitlement.subscriptionState !== 'none' ||
      user.currentSubscriptionId ||
      user.activeSubscriptionPlanId ||
      user.stripeCustomerId
    )
  );
  const listingVisibilityLabel = entitlement.publicListingVisibility === 'publicly_eligible'
    ? 'publicly eligible'
    : entitlement.publicListingVisibility === 'admin_override'
      ? 'admin override'
      : entitlement.publicListingVisibility === 'hidden_due_to_billing'
        ? 'hidden until billing is restored'
        : 'not applicable';
  const profileTabs = useMemo(() => {
    const tabs = ['Overview'];
    if (canViewSavedEquipment) tabs.push('Saved Equipment');
    if (canViewSearchAlerts) tabs.push('Search Alerts');
    if (canViewMyListings) tabs.push('My Listings');
    if (canViewSellerInquiries) tabs.push('Inquiries');
    if (canViewSellerCalls) tabs.push('Calls');
    if (canViewBuyerFinancing) tabs.push('Financing');
    if (hasStorefrontAccess) tabs.push(storefrontTabLabel);
    if (canViewInspectionRequests) tabs.push('Inspections');
    tabs.push('Privacy & Data', 'Account Settings');
    return tabs;
  }, [
    canViewBuyerFinancing,
    canViewInspectionRequests,
    canViewMyListings,
    canViewSavedEquipment,
    canViewSearchAlerts,
    canViewSellerCalls,
    canViewSellerInquiries,
    hasStorefrontAccess,
    storefrontTabLabel,
  ]);
  const profileTabItems = useMemo(() => {
    const items = [{ label: 'Overview', icon: LayoutDashboard }];
    if (canViewSavedEquipment) items.push({ label: 'Saved Equipment', icon: Bookmark });
    if (canViewSearchAlerts) items.push({ label: 'Search Alerts', icon: Bell });
    if (canViewMyListings) items.push({ label: 'My Listings', icon: Package });
    if (canViewSellerInquiries) items.push({ label: 'Inquiries', icon: MessageSquare });
    if (canViewSellerCalls) items.push({ label: 'Calls', icon: Phone });
    if (canViewBuyerFinancing) items.push({ label: 'Financing', icon: CreditCard });
    if (hasStorefrontAccess) {
      items.push({ label: storefrontTabLabel, icon: Building2 });
    }
    if (canViewInspectionRequests) {
      items.push({ label: 'Inspections', icon: ClipboardList });
    }
    items.push(
      { label: 'Privacy & Data', icon: Shield },
      { label: 'Account Settings', icon: Settings }
    );
    return items;
  }, [
    canViewBuyerFinancing,
    canViewInspectionRequests,
    canViewMyListings,
    canViewSavedEquipment,
    canViewSearchAlerts,
    canViewSellerCalls,
    canViewSellerInquiries,
    hasStorefrontAccess,
    storefrontTabLabel,
  ]);
  const adminProfileLinks = useMemo(() => {
    if (!hasContentStudioProfileScope) {
      return [];
    }

    if (!hasAdminProfileScope) {
      return [
        { label: 'Content Studio', icon: FileText, href: '/admin?tab=content' },
        { label: 'Editor Settings', icon: Settings, href: '/admin?tab=settings' },
      ];
    }

    const items = [
      { label: 'Admin Overview', icon: LayoutDashboard, href: '/admin' },
      { label: 'Performance', icon: Activity, href: '/admin?tab=tracking' },
      { label: 'Accounts', icon: Building2, href: '/admin?tab=accounts' },
      { label: 'Billing', icon: CreditCard, href: '/admin?tab=billing' },
      { label: 'Content Studio', icon: FileText, href: '/admin?tab=content' },
      { label: 'Dealer Feeds', icon: Database, href: '/admin?tab=dealer_feeds' },
      { label: 'Admin Settings', icon: Settings, href: '/admin?tab=settings' },
    ];

    if (normalizedRole === 'super_admin' || normalizedRole === 'admin') {
      items.splice(3, 0, { label: 'Users', icon: Users, href: '/admin?tab=users' });
    }

    return items;
  }, [hasAdminProfileScope, hasContentStudioProfileScope, normalizedRole]);
  const resolveRequestedProfileTab = useCallback((requestedTab: string | null) => {
    const normalizedRequestedTab = requestedTab?.trim().toLowerCase() || '';
    const tabAlias =
      normalizedRequestedTab === 'settings'
        ? 'account settings'
        : normalizedRequestedTab === 'privacy'
          ? 'privacy & data'
          : normalizedRequestedTab;

    if (!tabAlias) {
      return null;
    }

    return profileTabs.find((tab) => tab.toLowerCase() === tabAlias) || null;
  }, [profileTabs]);
  const resolvedRequestedProfileTab = useMemo(
    () => resolveRequestedProfileTab(searchParams.get('tab')) || 'Overview',
    [resolveRequestedProfileTab, searchParams]
  );
  const activeTab = resolvedRequestedProfileTab;
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRefreshingAccountAccess, setIsRefreshingAccountAccess] = useState(false);
  const [isSavingNotificationPreference, setIsSavingNotificationPreference] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [listingActionId, setListingActionId] = useState('');
  const [listingActionError, setListingActionError] = useState('');
  const [listingActionNotice, setListingActionNotice] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [profileDataLoading, setProfileDataLoading] = useState(false);
  const [profileDataError, setProfileDataError] = useState('');
  const [loadedProfileSections, setLoadedProfileSections] = useState<Record<string, boolean>>({});
  const [storefrontPreview, setStorefrontPreview] = useState<Seller | null>(null);
  const [isSavingStorefront, setIsSavingStorefront] = useState(false);
  const [storefrontError, setStorefrontError] = useState('');
  const [storefrontNotice, setStorefrontNotice] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const mfaRecaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const profileSectionRequestIdRef = useRef(0);
  const [settingsForm, setSettingsForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    company: '',
    website: '',
    bio: '',
    about: '',
    preferredLanguage: 'EN' as Language,
    preferredCurrency: 'USD' as Currency,
    location: '',
    photoURL: '',
    coverPhotoUrl: '',
  });
  const [storefrontForm, setStorefrontForm] = useState({
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
  const [smsMfaFactors, setSmsMfaFactors] = useState<SmsMfaFactorSummary[]>([]);
  const [mfaPhoneNumber, setMfaPhoneNumber] = useState('');
  const [mfaDisplayName, setMfaDisplayName] = useState('');
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [mfaVerificationId, setMfaVerificationId] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaNotice, setMfaNotice] = useState('');
  const [isSendingMfaCode, setIsSendingMfaCode] = useState(false);
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);
  const [removingMfaFactorUid, setRemovingMfaFactorUid] = useState<string | null>(null);

  const profilePhotoPreview = settingsForm.photoURL || user?.photoURL || '';
  const coverPhotoPreview = settingsForm.coverPhotoUrl || user?.coverPhotoUrl || '';
  const emailNotificationsEnabled = user?.emailNotificationsEnabled !== false;
  const favoritesKey = useMemo(
    () => (Array.isArray(user?.favorites) ? user.favorites.join('|') : ''),
    [user?.favorites]
  );

  const replaceProfileSearchParams = useCallback((mutate: (params: URLSearchParams) => void) => {
    const nextParams = new URLSearchParams(searchParams);
    mutate(nextParams);
    const nextSearch = nextParams.toString();
    navigate(nextSearch ? `/profile?${nextSearch}` : '/profile', {
      replace: true,
      preventScrollReset: true,
    });
  }, [navigate, searchParams]);

  useEffect(() => {
    const accountCheckout = searchParams.get('accountCheckout');
    const sessionId = searchParams.get('session_id');
    if (!accountCheckout) return;

    if (accountCheckout === 'canceled') {
      setCheckoutNotice('Subscription checkout was canceled. Choose a seller subscription when you are ready.');
      replaceProfileSearchParams((nextParams) => {
        nextParams.delete('accountCheckout');
        nextParams.delete('session_id');
      });
      return;
    }

    if (accountCheckout === 'success' && sessionId) {
      let active = true;
      const confirm = async () => {
        try {
          setIsConfirmingCheckout(true);
          const result = await billingService.confirmCheckoutSession(sessionId);
          if (!active) return;

          if (result.paid && result.scope === 'account') {
            await auth.currentUser?.getIdToken(true);
            const matchedPlan = SELLER_PLAN_DEFINITIONS.find((plan) => plan.id === result.planId);
            const listingCap = matchedPlan?.listingCap || user?.listingCap || 0;
            setCheckoutNotice(
              listingCap > 0
                ? `Subscription activated. Your account can post up to ${listingCap} active ${listingCap === 1 ? 'machine' : 'machines'}.`
                : 'Subscription activated. Your account can now post listings.'
            );
          } else {
            setCheckoutNotice('Checkout returned successfully, but account activation is still processing. Refresh in a moment.');
          }
        } catch (error) {
          if (!active) return;
          setCheckoutNotice(error instanceof Error ? error.message : 'Unable to confirm subscription checkout.');
        } finally {
          if (!active) return;
          setIsConfirmingCheckout(false);
          replaceProfileSearchParams((nextParams) => {
            nextParams.delete('accountCheckout');
            nextParams.delete('session_id');
          });
        }
      };

      void confirm();
      return () => {
        active = false;
      };
    }
  }, [replaceProfileSearchParams, searchParams, user?.listingCap]);

  useEffect(() => {
    const billingPortalReturn = searchParams.get('billingPortal');
    if (billingPortalReturn !== 'return') {
      return;
    }

    let active = true;

    const finalizePortalReturn = async () => {
      try {
        setIsRefreshingAccountAccess(true);
        setSettingsError('');
        const refreshedAccess = await billingService.refreshAccountAccess();
        if (!active) return;

        patchCurrentUserProfile({
          role: refreshedAccess.role ? userService.normalizeRole(refreshedAccess.role) : user?.role,
          activeSubscriptionPlanId: refreshedAccess.planId || null,
          subscriptionStatus: refreshedAccess.subscriptionStatus || null,
          listingCap: typeof refreshedAccess.listingCap === 'number' ? refreshedAccess.listingCap : user?.listingCap,
          managedAccountCap: typeof refreshedAccess.managedAccountCap === 'number' ? refreshedAccess.managedAccountCap : user?.managedAccountCap,
          currentSubscriptionId: refreshedAccess.currentSubscriptionId || null,
          currentPeriodEnd: refreshedAccess.currentPeriodEnd || null,
          subscriptionStartDate: refreshedAccess.subscriptionStartDate || user?.subscriptionStartDate || null,
          accountAccessSource: refreshedAccess.accountAccessSource || null,
          accountStatus: refreshedAccess.accountStatus || user?.accountStatus || 'active',
          entitlement: refreshedAccess.entitlement ?? user?.entitlement,
        });
        setSettingsNotice('Billing details refreshed after returning from the secure billing portal.');
      } catch (error) {
        if (!active) return;
        setSettingsError(error instanceof Error ? error.message : 'Unable to refresh billing details after returning from the billing portal.');
      } finally {
        if (!active) return;
        setIsRefreshingAccountAccess(false);
        replaceProfileSearchParams((nextParams) => {
          nextParams.delete('billingPortal');
        });
      }
    };

    void finalizePortalReturn();

    return () => {
      active = false;
    };
  }, [patchCurrentUserProfile, replaceProfileSearchParams, searchParams, user?.accountStatus, user?.entitlement, user?.listingCap, user?.managedAccountCap, user?.role]);

  useEffect(() => {
    if (!user) return;
    setSettingsForm({
      displayName: user.displayName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      company: user.company || '',
      website: user.website || '',
      bio: user.bio || '',
      about: user.about || '',
      preferredLanguage: user.preferredLanguage || language,
      preferredCurrency: user.preferredCurrency || currency,
      location: user.location || '',
      photoURL: user.photoURL || '',
      coverPhotoUrl: (user as UserProfile & { coverPhotoUrl?: string }).coverPhotoUrl || '',
    });
  }, [currency, language, user]);

  useEffect(() => {
    if (!user) return;

    const keywords = Array.isArray(storefrontPreview?.seoKeywords)
      ? storefrontPreview.seoKeywords.join(', ')
      : Array.isArray(user.seoKeywords)
        ? user.seoKeywords.join(', ')
        : '';

    setStorefrontForm({
      storefrontName: storefrontPreview?.storefrontName || user.storefrontName || user.company || user.displayName || '',
      storefrontSlug: storefrontPreview?.storefrontSlug || user.storefrontSlug || '',
      storefrontTagline: storefrontPreview?.storefrontTagline || user.storefrontTagline || '',
      storefrontDescription: storefrontPreview?.storefrontDescription || user.storefrontDescription || user.about || '',
      location: storefrontPreview?.location || user.location || '',
      phone: storefrontPreview?.phone || user.phoneNumber || '',
      email: storefrontPreview?.email || user.email || '',
      website: storefrontPreview?.website || user.website || '',
      logo: storefrontPreview?.logo || user.photoURL || '',
      coverPhotoUrl: storefrontPreview?.coverPhotoUrl || user.coverPhotoUrl || '',
      seoTitle: storefrontPreview?.seoTitle || user.seoTitle || '',
      seoDescription: storefrontPreview?.seoDescription || user.seoDescription || '',
      seoKeywordsCsv: keywords,
    });
  }, [storefrontPreview, user]);

  useEffect(() => {
    if (!user || auth.currentUser?.uid !== user.uid) {
      setSmsMfaFactors([]);
      setMfaPhoneNumber('');
      setMfaDisplayName('');
      setMfaVerificationCode('');
      setMfaVerificationId('');
      return;
    }

    setSmsMfaFactors(listSmsMfaFactors(auth.currentUser));
    setMfaPhoneNumber(user.phoneNumber || '');
    setMfaDisplayName(user.displayName || '');
  }, [user?.uid]);

  useEffect(() => () => {
    resetRecaptchaVerifier(mfaRecaptchaRef.current);
    mfaRecaptchaRef.current = null;
  }, []);

  const handleSettingsInputChange = (key: keyof typeof settingsForm, value: string) => {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));
  };

  const syncMfaProfileState = async (factors: SmsMfaFactorSummary[]) => {
    if (!user?.uid) return;

    const primaryFactor = factors[0] || null;
    await withAsyncTimeout(
      userService.updateProfile(user.uid, {
        mfaEnabled: factors.length > 0,
        mfaMethod: factors.length > 0 ? 'sms' : null,
        mfaPhoneNumber: primaryFactor?.phoneNumber || null,
        mfaDisplayName: primaryFactor?.displayName || null,
        mfaEnrolledAt: primaryFactor?.enrollmentTime || null,
      }),
      15000,
      'SMS multi-factor updated in authentication, but the profile document is taking too long to save. Refresh in a moment and try again.'
    );
  };

  const resetProfileMfaRecaptcha = () => {
    resetRecaptchaVerifier(mfaRecaptchaRef.current);
    mfaRecaptchaRef.current = null;
  };

  const getProfileMfaRecaptcha = async () => {
    resetProfileMfaRecaptcha();
    await ensureAuthRecaptchaConfig();
    const verifier = createVisibleRecaptchaVerifier('profile-mfa-recaptcha');
    mfaRecaptchaRef.current = verifier;
    await verifier.render();
    return verifier;
  };

  const getMfaErrorMessage = (error: unknown, fallback: string) => {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code || '') : '';
    if (code === 'auth/requires-recent-login') {
      return 'Sign out and sign back in before changing SMS multi-factor authentication.';
    }
    if (code === 'auth/invalid-phone-number') {
      return 'Enter a valid mobile number in international format, like +15551234567.';
    }
    if (code === 'auth/invalid-verification-code') {
      return 'That verification code is not valid. Request a new code and try again.';
    }
    if (code === 'auth/code-expired') {
      return 'That verification code expired. Request a new code and try again.';
    }
    if (code === 'auth/quota-exceeded') {
      return 'SMS verification quota has been reached for now. Try again later or use a Firebase test number.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many verification attempts were made. Wait a moment and try again.';
    }
    return error instanceof Error ? error.message : fallback;
  };

  const handleSendMfaCode = async () => {
    const authUser = auth.currentUser;
    if (!user?.uid || !authUser || authUser.uid !== user.uid) {
      setMfaError('Sign in again before enabling SMS multi-factor authentication.');
      return;
    }

    if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
      setMfaError('Verify your email before enabling SMS multi-factor authentication.');
      return;
    }

    const normalizedPhoneNumber = mfaPhoneNumber.trim();
    if (!normalizedPhoneNumber) {
      setMfaError('Enter the mobile number that should receive SMS verification codes.');
      return;
    }

    setIsSendingMfaCode(true);
    setMfaError('');
    setMfaNotice('');

    try {
      const verifier = await getProfileMfaRecaptcha();
      setMfaNotice('Complete the reCAPTCHA challenge below. Forestry Equipment Sales will send the SMS code as soon as the security check is passed.');
      const verificationId = await startSmsMfaEnrollment(authUser, normalizedPhoneNumber, verifier);
      setMfaVerificationId(verificationId);
      setMfaVerificationCode('');
      setMfaNotice(`Verification code sent to ${normalizedPhoneNumber}. Enter the code below to finish enrollment.`);
    } catch (error) {
      resetProfileMfaRecaptcha();
      setMfaError(getMfaErrorMessage(error, 'Unable to start SMS multi-factor enrollment right now.'));
    } finally {
      setIsSendingMfaCode(false);
    }
  };

  const handleCompleteMfaEnrollment = async () => {
    const authUser = auth.currentUser;
    if (!user?.uid || !authUser || authUser.uid !== user.uid) {
      setMfaError('Sign in again before finishing SMS multi-factor enrollment.');
      return;
    }

    if (!mfaVerificationId) {
      setMfaError('Request a verification code before entering the SMS code.');
      return;
    }

    const normalizedCode = mfaVerificationCode.trim();
    if (!normalizedCode) {
      setMfaError('Enter the SMS verification code to finish enrollment.');
      return;
    }

    setIsEnrollingMfa(true);
    setMfaError('');
    setMfaNotice('');

    try {
      const factors = await completeSmsMfaEnrollment(authUser, mfaVerificationId, normalizedCode, mfaDisplayName.trim() || undefined);
      setSmsMfaFactors(factors);
      await syncMfaProfileState(factors);
      setMfaVerificationId('');
      setMfaVerificationCode('');
      resetProfileMfaRecaptcha();
      setMfaNotice('SMS multi-factor authentication is now enabled on this account.');
    } catch (error) {
      setMfaError(getMfaErrorMessage(error, 'Unable to complete SMS multi-factor enrollment right now.'));
    } finally {
      setIsEnrollingMfa(false);
    }
  };

  const handleRemoveMfaFactor = async (factorUid: string) => {
    const authUser = auth.currentUser;
    if (!user?.uid || !authUser || authUser.uid !== user.uid) {
      setMfaError('Sign in again before removing SMS multi-factor authentication.');
      return;
    }

    setRemovingMfaFactorUid(factorUid);
    setMfaError('');
    setMfaNotice('');

    try {
      const factors = await unenrollSmsMfaFactor(authUser, factorUid);
      setSmsMfaFactors(factors);
      await syncMfaProfileState(factors);
      setMfaVerificationId('');
      setMfaVerificationCode('');
      resetProfileMfaRecaptcha();
      setMfaNotice(factors.length > 0
        ? 'The selected SMS verification number was removed.'
        : 'SMS multi-factor authentication has been removed from this account.');
    } catch (error) {
      setMfaError(getMfaErrorMessage(error, 'Unable to remove SMS multi-factor authentication right now.'));
    } finally {
      setRemovingMfaFactorUid(null);
    }
  };

  const openAssetPicker = (assetType: 'avatar' | 'cover') => {
    if (assetType === 'avatar') {
      avatarInputRef.current?.click();
      return;
    }

    coverInputRef.current?.click();
  };

  const handleProfileAssetUpload = async (file: File, assetType: 'avatar' | 'cover') => {
    if (!user?.uid) return;

    if (assetType === 'avatar') setIsUploadingAvatar(true);
    if (assetType === 'cover') setIsUploadingCover(true);
    setSettingsError('');
    setSettingsNotice('');

    try {
      const subPath = assetType === 'avatar' ? 'avatar' : 'photos';
      const uploadTask = storageService.uploadFile(file, `users/${user.uid}/${subPath}`);
      const snapshot = await uploadTask;
      const downloadUrl = await getDownloadURL(snapshot.ref);

      if (assetType === 'avatar') {
        handleSettingsInputChange('photoURL', downloadUrl);
        handleStorefrontInputChange('logo', downloadUrl);
      } else {
        handleSettingsInputChange('coverPhotoUrl', downloadUrl);
        handleStorefrontInputChange('coverPhotoUrl', downloadUrl);
      }

      const immediateUpdates = assetType === 'avatar'
        ? {
            photoURL: downloadUrl,
            role: user.role,
            storefrontSlug: user.storefrontSlug,
            storefrontName: user.storefrontName || user.company || user.displayName,
          }
        : {
            coverPhotoUrl: downloadUrl,
            role: user.role,
            storefrontSlug: user.storefrontSlug,
            storefrontName: user.storefrontName || user.company || user.displayName,
          };

      if (assetType === 'avatar' && auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { photoURL: downloadUrl });
      }

      await withAsyncTimeout(
        userService.updateProfile(user.uid, immediateUpdates),
        15000,
        `${assetType === 'avatar' ? 'Profile photo' : 'Cover photo'} upload finished, but profile storage is taking too long to respond. Please try again once Firestore quota resets.`
      );

      patchCurrentUserProfile(immediateUpdates);

      setStorefrontPreview((prev) => prev ? ({
        ...prev,
        logo: assetType === 'avatar' ? downloadUrl : prev.logo,
        coverPhotoUrl: assetType === 'cover' ? downloadUrl : prev.coverPhotoUrl,
      }) : prev);

      setSettingsNotice(`${assetType === 'avatar' ? 'Profile photo' : 'Cover photo'} uploaded and saved.`);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Unable to upload image right now.');
    } finally {
      if (assetType === 'avatar') setIsUploadingAvatar(false);
      if (assetType === 'cover') setIsUploadingCover(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.uid) return;
    const nextDisplayName = settingsForm.displayName.trim();
    const nextEmail = settingsForm.email.trim().toLowerCase();
    const nextPhotoUrl = settingsForm.photoURL.trim();
    const nextCoverPhotoUrl = settingsForm.coverPhotoUrl.trim();
    const nextWebsite = settingsForm.website.trim();
    const nextBio = settingsForm.bio.trim();
    const nextAbout = settingsForm.about.trim();

    if (!nextDisplayName) {
      setSettingsError('Full name is required.');
      return;
    }

    if (!nextEmail) {
      setSettingsError('Email address is required.');
      return;
    }

    if (nextWebsite && !isValidHttpUrl(nextWebsite)) {
      setSettingsError('Website must start with http:// or https://');
      return;
    }

    setIsSavingSettings(true);
    setSettingsError('');
    setSettingsNotice('');

    try {
      const baseProfileUpdates: Partial<UserProfile> = {
        displayName: nextDisplayName,
        phoneNumber: settingsForm.phoneNumber.trim(),
        company: settingsForm.company.trim(),
        website: nextWebsite,
        bio: nextBio,
        about: nextAbout,
        preferredLanguage: settingsForm.preferredLanguage,
        preferredCurrency: settingsForm.preferredCurrency,
        location: settingsForm.location.trim(),
        photoURL: nextPhotoUrl || null,
        coverPhotoUrl: nextCoverPhotoUrl || null,
        role: user.role,
        storefrontSlug: user.storefrontSlug,
        storefrontName: user.storefrontName || user.company || nextDisplayName,
      };

      if (auth.currentUser) {
        const authNeedsUpdate =
          auth.currentUser.displayName !== nextDisplayName ||
          auth.currentUser.photoURL !== (nextPhotoUrl || null);

        if (authNeedsUpdate) {
          await updateAuthProfile(auth.currentUser, {
            displayName: nextDisplayName,
            photoURL: nextPhotoUrl || null,
          });
        }
      }

      await withAsyncTimeout(
        userService.updateProfile(user.uid, baseProfileUpdates),
        15000,
        'Profile storage is taking too long to respond. Please try again once Firestore quota resets.'
      );
      setLanguage(settingsForm.preferredLanguage);
      setCurrency(settingsForm.preferredCurrency);

      if (auth.currentUser) {
        if (auth.currentUser.email !== nextEmail) {
          try {
            await updateEmail(auth.currentUser, nextEmail);
            await withAsyncTimeout(
              userService.updateProfile(user.uid, {
                email: nextEmail,
                role: user.role,
                storefrontSlug: user.storefrontSlug,
                storefrontName: user.storefrontName || user.company || nextDisplayName,
              }),
              15000,
              'Profile email updated in sign-in, but Firestore profile storage is still catching up.'
            );
          } catch (emailError) {
            const code = (emailError as { code?: string })?.code || '';
            if (code === 'auth/requires-recent-login') {
              setSettingsNotice('Profile saved. To update login email, sign out and sign back in, then save again.');
              setIsSavingSettings(false);
              return;
            }
            throw emailError;
          }
        } else if (user.email !== nextEmail) {
          await withAsyncTimeout(
            userService.updateProfile(user.uid, {
              email: nextEmail,
              role: user.role,
              storefrontSlug: user.storefrontSlug,
              storefrontName: user.storefrontName || user.company || nextDisplayName,
            }),
            15000,
            'Profile email update is taking too long to reach Firestore.'
          );
        }
      } else if (user.email !== nextEmail) {
        await withAsyncTimeout(
          userService.updateProfile(user.uid, {
            email: nextEmail,
            role: user.role,
            storefrontSlug: user.storefrontSlug,
            storefrontName: user.storefrontName || user.company || nextDisplayName,
          }),
          15000,
          'Profile email update is taking too long to reach Firestore.'
        );
      }

      patchCurrentUserProfile({
        ...baseProfileUpdates,
        email: auth.currentUser?.email?.trim().toLowerCase() === nextEmail ? nextEmail : (user.email || nextEmail),
      });
      setSettingsNotice('Profile updated successfully.');
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Unable to update profile right now.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile: user,
      savedAssets: savedAssets,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forestry-equipment-sales-data-export-${user?.uid}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    try {
      await billingService.deleteUserAccount();
      // The server will delete the user and the client will be signed out automatically
      // or we can force a reload/redirect
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  const handleRefreshAccountAccess = async () => {
    if (!user) return;

    setIsRefreshingAccountAccess(true);
    setSettingsError('');
    setSettingsNotice('');

    try {
      const refreshedAccess = await billingService.refreshAccountAccess();
      patchCurrentUserProfile({
        role: refreshedAccess.role ? userService.normalizeRole(refreshedAccess.role) : user.role,
        activeSubscriptionPlanId: refreshedAccess.planId || null,
        subscriptionStatus: refreshedAccess.subscriptionStatus || null,
        listingCap: typeof refreshedAccess.listingCap === 'number' ? refreshedAccess.listingCap : user.listingCap,
        managedAccountCap: typeof refreshedAccess.managedAccountCap === 'number' ? refreshedAccess.managedAccountCap : user.managedAccountCap,
        currentSubscriptionId: refreshedAccess.currentSubscriptionId || null,
        currentPeriodEnd: refreshedAccess.currentPeriodEnd || null,
        subscriptionStartDate: refreshedAccess.subscriptionStartDate || user.subscriptionStartDate || null,
        accountAccessSource: refreshedAccess.accountAccessSource || null,
        accountStatus: refreshedAccess.accountStatus || user.accountStatus || 'active',
        entitlement: refreshedAccess.entitlement ?? user.entitlement,
      });
      setSettingsNotice('Account access refreshed successfully.');
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Unable to refresh account access right now.');
    } finally {
      setIsRefreshingAccountAccess(false);
    }
  };

  const handleToggleEmailNotifications = async () => {
    if (!user?.uid) return;

    const nextEnabled = !emailNotificationsEnabled;
    setIsSavingNotificationPreference(true);
    setSettingsError('');
    setSettingsNotice('');

    try {
      await withAsyncTimeout(
        userService.updateProfile(user.uid, {
          emailNotificationsEnabled: nextEnabled,
        }),
        15000,
        'Notification preferences are taking too long to save. Please try again once Firestore quota resets.'
      );
      patchCurrentUserProfile({ emailNotificationsEnabled: nextEnabled });
      setSettingsNotice(nextEnabled ? 'Email notifications enabled.' : 'Email notifications paused.');
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Unable to update notification preferences right now.');
    } finally {
      setIsSavingNotificationPreference(false);
    }
  };

  const handleManageBillingPortal = async () => {
    setSettingsError('');
    setSettingsNotice('');

    try {
      const { url } = await billingService.createBillingPortalSession('/profile?tab=Account%20Settings');
      window.location.assign(url);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Unable to open secure billing management right now.');
    }
  };
  
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [savedAssets, setSavedAssets] = useState<Listing[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [financingRequests, setFinancingRequests] = useState<FinancingRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [inspectionRequests, setInspectionRequests] = useState<InspectionRequest[]>([]);
  const [inspectionQuoteDrafts, setInspectionQuoteDrafts] = useState<Record<string, string>>({});
  const [inspectionActionId, setInspectionActionId] = useState<string | null>(null);
  const [inspectionDocumentActionId, setInspectionDocumentActionId] = useState<string | null>(null);
  const [inspectionError, setInspectionError] = useState('');
  const [inspectionNotice, setInspectionNotice] = useState('');
  const [inspectionRequestsLoading, setInspectionRequestsLoading] = useState(false);
  const inspectionReportInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const listingTitleLookup = useMemo(
    () => new Map(myListings.map((listing) => [listing.id, listing.title])),
    [myListings]
  );

  const selectProfileTab = useCallback((nextTab: string) => {
    if (nextTab === activeTab) {
      return;
    }

    replaceProfileSearchParams((nextParams) => {
      if (nextTab === 'Overview') {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', nextTab);
      }
    });
  }, [activeTab, replaceProfileSearchParams]);

  useEffect(() => {
    if (user) {
      return;
    }

    setMyListings([]);
    setFinancingRequests([]);
    setSavedSearches([]);
    setSavedAssets([]);
    setInquiries([]);
    setCalls([]);
    setInspectionRequests([]);
    setInspectionQuoteDrafts({});
    setStorefrontPreview(null);
    setLoadedProfileSections({});
    setProfileDataError('');
    setProfileDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    setMyListings([]);
    setFinancingRequests([]);
    setSavedSearches([]);
    setSavedAssets([]);
    setInquiries([]);
    setCalls([]);
    setInspectionRequests([]);
    setInspectionQuoteDrafts({});
    setStorefrontPreview(null);
    setLoadedProfileSections({});
    setProfileDataError('');
  }, [normalizedRole, user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    setSavedAssets([]);
    setLoadedProfileSections((previous) => {
      if (!previous.savedAssets) {
        return previous;
      }

      const next = { ...previous };
      delete next.savedAssets;
      return next;
    });
  }, [favoritesKey, user?.uid]);

  const getProfileSectionsForTab = useCallback((tab: string) => {
    const sections = new Set<string>();

    if (tab === 'Overview') {
      if (canViewSavedEquipment) sections.add('savedAssets');
      if (canViewSearchAlerts) sections.add('savedSearches');
      if (canViewMyListings) sections.add('myListings');
      if (canViewSellerInquiries) sections.add('inquiries');
      if (canViewSellerCalls) sections.add('calls');
      if (canViewBuyerFinancing) sections.add('financingRequests');
      return Array.from(sections);
    }

    if (tab === 'Saved Equipment' && canViewSavedEquipment) sections.add('savedAssets');
    if (tab === 'Search Alerts' && canViewSearchAlerts) sections.add('savedSearches');
    if (tab === 'My Listings' && canViewMyListings) sections.add('myListings');
    if (tab === 'Inquiries' && canViewSellerInquiries) sections.add('inquiries');
    if (tab === 'Calls' && canViewSellerCalls) sections.add('calls');
    if (tab === 'Financing' && canViewBuyerFinancing) sections.add('financingRequests');
    if (tab === storefrontTabLabel && hasStorefrontAccess) sections.add('storefrontPreview');

    return Array.from(sections);
  }, [
    canViewBuyerFinancing,
    canViewMyListings,
    canViewSavedEquipment,
    canViewSearchAlerts,
    canViewSellerCalls,
    canViewSellerInquiries,
    hasStorefrontAccess,
    storefrontTabLabel,
  ]);

  const loadProfileSection = useCallback(async (section: string) => {
    if (!user?.uid) {
      return;
    }

    switch (section) {
      case 'myListings': {
        const nextListings = await equipmentService.getMyListings();
        setMyListings(nextListings);
        break;
      }
      case 'financingRequests': {
        const nextFinancingRequests = await equipmentService.getFinancingRequests({ userUid: user.uid, role: user.role });
        setFinancingRequests(nextFinancingRequests);
        break;
      }
      case 'savedSearches': {
        const nextSavedSearches = await userService.getSavedSearches(user.uid);
        setSavedSearches(nextSavedSearches);
        break;
      }
      case 'savedAssets': {
        const nextSavedAssets = user.favorites && user.favorites.length > 0
          ? await equipmentService.getListingsByIds(user.favorites)
          : [];
        setSavedAssets(nextSavedAssets);
        break;
      }
      case 'calls': {
        const nextCalls = await equipmentService.getMyCalls();
        setCalls(nextCalls);
        break;
      }
      case 'inquiries': {
        const nextInquiries = await equipmentService.getMyInquiries();
        setInquiries(nextInquiries);
        break;
      }
      case 'storefrontPreview': {
        const nextStorefront = await equipmentService.getMyStorefront();
        setStorefrontPreview(nextStorefront || null);
        break;
      }
      default:
        break;
    }
  }, [user]);

  const currentProfileSections = useMemo(
    () => getProfileSectionsForTab(activeTab),
    [activeTab, getProfileSectionsForTab]
  );

  const isCurrentProfileTabReady = currentProfileSections.every((section) => loadedProfileSections[section]);
  const shouldShowProfileLoadingShell =
    profileDataLoading &&
    activeTab === 'Overview' &&
    currentProfileSections.length > 0 &&
    !isCurrentProfileTabReady &&
    Object.keys(loadedProfileSections).length === 0;

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const sectionsToLoad = currentProfileSections.filter((section) => !loadedProfileSections[section]);
    if (sectionsToLoad.length === 0) {
      setProfileDataLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = profileSectionRequestIdRef.current + 1;
    profileSectionRequestIdRef.current = requestId;

    setProfileDataLoading(true);
    setProfileDataError('');

    const loadSections = async () => {
      try {
        const results = await Promise.allSettled(sectionsToLoad.map((section) => loadProfileSection(section)));
        if (cancelled || profileSectionRequestIdRef.current !== requestId) {
          return;
        }

        setLoadedProfileSections((previous) => {
          const next = { ...previous };
          sectionsToLoad.forEach((section) => {
            next[section] = true;
          });
          return next;
        });

        if (results.some((result) => result.status === 'rejected')) {
          setProfileDataError('Some account data could not be loaded. Refresh to retry.');
        }
      } catch (error) {
        if (cancelled || profileSectionRequestIdRef.current !== requestId) {
          return;
        }
        setProfileDataError(error instanceof Error ? error.message : 'Unable to load profile data right now.');
      } finally {
        if (!cancelled && profileSectionRequestIdRef.current === requestId) {
          setProfileDataLoading(false);
        }
      }
    };

    void loadSections();

    return () => {
      cancelled = true;
    };
  }, [currentProfileSections, loadProfileSection, loadedProfileSections, user?.uid]);

  useEffect(() => {
    const fetchInspectionRequests = async () => {
      if (!user?.uid || !canViewInspectionRequests || activeTab !== 'Inspections') {
        return;
      }

      setInspectionRequestsLoading(true);
      setInspectionError('');

      try {
        const nextInspectionRequests = await equipmentService.getInspectionRequests({ userUid: user.uid, role: user.role });
        setInspectionRequests(nextInspectionRequests);
        setInspectionQuoteDrafts(
          nextInspectionRequests.reduce<Record<string, string>>((drafts, request) => {
            drafts[request.id] = typeof request.quotedPrice === 'number' ? String(request.quotedPrice) : '';
            return drafts;
          }, {})
        );
      } catch (error) {
        setInspectionError(error instanceof Error ? error.message : 'Unable to load inspection requests right now.');
      } finally {
        setInspectionRequestsLoading(false);
      }
    };

    void fetchInspectionRequests();
  }, [activeTab, canViewInspectionRequests, user?.uid, user?.role]);

  const activeManagedListingsCount = useMemo(
    () => myListings.filter((listing) => !['sold', 'archived', 'expired'].includes(String(listing.status || 'active').toLowerCase())).length,
    [myListings]
  );
  const finiteListingCap = getManagedListingCap(user);
  const remainingManagedListings = finiteListingCap === null ? null : Math.max(finiteListingCap - activeManagedListingsCount, 0);
  const featuredListingCount = useMemo(
    () => myListings.filter((listing) => !['sold', 'archived', 'expired'].includes(String(listing.status || 'active').toLowerCase()) && !!listing.featured).length,
    [myListings]
  );
  const featuredListingCap = useMemo(
    () => (hasAdminPublishingAccess(user) ? Number.POSITIVE_INFINITY : getFeaturedListingCap(user)),
    [user]
  );
  const remainingFeaturedSlots = Number.isFinite(featuredListingCap)
    ? Math.max(featuredListingCap - featuredListingCount, 0)
    : null;

  const formatDateLabel = (value?: string) => {
    if (!value) return 'Date unavailable';
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return 'Date unavailable';
    return new Date(parsed).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const exportMyListingsCSV = () => {
    const headers = ['Title', 'Category', 'Manufacturer', 'Model', 'Year', 'Price', 'Hours', 'Location', 'Status', 'Approval', 'Stock #', 'Views', 'Leads', 'Created At'];
    const rows = myListings.map((l) => [
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
      l.stockNumber || '',
      String(l.views || 0),
      String(l.leads || 0),
      l.createdAt || '',
    ]);
    downloadCsv('my-inventory', headers, rows);
  };

  const exportMyInquiriesCSV = () => {
    const headers = ['Buyer Name', 'Email', 'Phone', 'Type', 'Status', 'Listing', 'Message', 'Created At'];
    const rows = inquiries.map((inq) => [
      inq.buyerName,
      inq.buyerEmail,
      inq.buyerPhone,
      inq.type,
      inq.status,
      inq.listingId || '',
      inq.message,
      inq.createdAt,
    ]);
    downloadCsv('my-inquiries', headers, rows);
  };

  const exportMyCallsCSV = () => {
    const headers = ['Caller Name', 'Caller Phone', 'Caller Email', 'Listing ID', 'Listing Title', 'Status', 'Duration (s)', 'Source', 'Recording URL', 'Date'];
    const rows = calls.map((call) => [
      call.callerName,
      call.callerPhone || '',
      call.callerEmail || '',
      call.listingId,
      call.listingTitle || '',
      call.status,
      String(call.duration),
      call.source || '',
      call.recordingUrl || '',
      call.createdAt,
    ]);
    downloadCsv('my-calls', headers, rows);
  };

  const downloadSampleMachineCSV = () => {
    const headers = ['Title', 'Category', 'Manufacturer', 'Model', 'Year', 'Price', 'Hours', 'Location', 'Condition', 'Stock Number', 'Description'];
    const sampleRows = [
      ['2019 John Deere 748L-II Grapple Skidder', 'Skidders', 'John Deere', '748L-II', '2019', '185000', '6200', 'Duluth, MN', 'Used - Good', 'JD748-001', 'Well-maintained grapple skidder with new tires and recent service.'],
      ['2021 Tigercat 635H Feller Buncher', 'Feller Bunchers', 'Tigercat', '635H', '2021', '425000', '3800', 'Portland, OR', 'Used - Excellent', 'TC635-002', 'Low hour Tigercat 635H with 5702 head. Owner-operator machine.'],
      ['2020 CAT 535D Skidder', 'Skidders', 'Caterpillar', '535D', '2020', '210000', '5100', 'Bangor, ME', 'Used - Good', 'CAT535-003', 'CAT 535D dual-arch grapple skidder. Undercarriage at 60%.'],
    ];
    downloadCsv('sample-machine-import-template', headers, sampleRows);
  };

  const getInspectionStatusClasses = (status: InspectionRequest['status']) => {
    switch (status) {
      case 'Accepted':
      case 'Completed':
        return 'bg-data/10 text-data';
      case 'Declined':
        return 'bg-accent/10 text-accent';
      case 'Quoted':
        return 'bg-amber-500/10 text-amber-700';
      default:
        return 'bg-ink text-white';
    }
  };

  const handleInspectionQuoteDraftChange = (requestId: string, value: string) => {
    setInspectionQuoteDrafts((prev) => ({ ...prev, [requestId]: value }));
  };

  const handleInspectionRequestUpdate = async (
    request: InspectionRequest,
    status: InspectionRequest['status'],
    includeQuote: boolean
  ) => {
    if (!user?.uid) return;

    setInspectionActionId(request.id);
    setInspectionError('');
    setInspectionNotice('');

    let quotedPrice: number | null | undefined;
    if (includeQuote) {
      const rawQuote = (inspectionQuoteDrafts[request.id] ?? '').trim();
      if (!rawQuote) {
        quotedPrice = null;
      } else {
        const parsedQuote = Number(rawQuote);
        if (!Number.isFinite(parsedQuote) || parsedQuote < 0) {
          setInspectionError('Inspection quote must be a valid non-negative amount.');
          setInspectionActionId(null);
          return;
        }
        quotedPrice = parsedQuote;
      }
    }

    try {
      await equipmentService.updateInspectionRequest(request.id, {
        status,
        quotedPrice,
        assignedToUid: user.uid,
        assignedToName: user.displayName || user.company || user.email || 'Inspection Manager',
      });

      const updatedAt = new Date().toISOString();
      setInspectionRequests((prev) =>
        prev.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status,
                quotedPrice: quotedPrice === undefined ? item.quotedPrice : quotedPrice,
                assignedToUid: user.uid,
                assignedToName: user.displayName || user.company || user.email || 'Inspection Manager',
                updatedAt,
                reviewedAt: updatedAt,
                respondedAt: ['Quoted', 'Accepted', 'Declined', 'Completed'].includes(status) ? updatedAt : item.respondedAt,
              }
            : item
        )
      );
      setInspectionNotice(`Inspection request ${status.toLowerCase()} successfully.`);
    } catch (error) {
      setInspectionError(error instanceof Error ? error.message : 'Unable to update inspection request right now.');
    } finally {
      setInspectionActionId(null);
    }
  };

  const patchInspectionRequestLocal = useCallback((requestId: string, patch: Partial<InspectionRequest>) => {
    setInspectionRequests((prev) => prev.map((item) => (item.id === requestId ? { ...item, ...patch } : item)));
  }, []);

  const handleGenerateInspectionTemplate = async (request: InspectionRequest) => {
    if (!user?.uid) return;

    setInspectionDocumentActionId(request.id);
    setInspectionError('');
    setInspectionNotice('');

    try {
      const linkedListing = request.listingId ? await equipmentService.getListing(request.listingId) : undefined;
      const content = buildInspectionSheetText(request, linkedListing);
      const fileName = buildInspectionSheetFileName(request, linkedListing);
      const file = new File([content], fileName, { type: 'text/plain' });
      const uploaded = await storageService.uploadInspectionDocument(file, request.id, {
        listingId: request.listingId,
        requesterUid: request.requesterUid || '',
        assignedToUid: request.assignedToUid || user.uid,
        kind: 'template',
      });
      const generatedAt = new Date().toISOString();
      const generatedByName = user.displayName || user.company || user.email || 'Inspection Manager';

      await equipmentService.updateInspectionRequest(request.id, {
        inspectionTemplateUrl: uploaded.downloadUrl,
        inspectionTemplateFileName: uploaded.fileName,
        inspectionTemplateGeneratedAt: generatedAt,
        inspectionTemplateGeneratedByUid: user.uid,
        inspectionTemplateGeneratedByName: generatedByName,
      });

      patchInspectionRequestLocal(request.id, {
        inspectionTemplateUrl: uploaded.downloadUrl,
        inspectionTemplateFileName: uploaded.fileName,
        inspectionTemplateGeneratedAt: generatedAt,
        inspectionTemplateGeneratedByUid: user.uid,
        inspectionTemplateGeneratedByName: generatedByName,
        updatedAt: generatedAt,
      });
      setInspectionNotice('Inspection sheet generated and attached to the request.');
    } catch (error) {
      setInspectionError(error instanceof Error ? error.message : 'Unable to generate the inspection sheet right now.');
    } finally {
      setInspectionDocumentActionId(null);
    }
  };

  const handleUploadInspectionReport = async (request: InspectionRequest, file?: File | null) => {
    if (!user?.uid || !file) return;

    setInspectionDocumentActionId(request.id);
    setInspectionError('');
    setInspectionNotice('');

    try {
      const uploaded = await storageService.uploadInspectionDocument(file, request.id, {
        listingId: request.listingId,
        requesterUid: request.requesterUid || '',
        assignedToUid: request.assignedToUid || user.uid,
        kind: 'report',
      });
      const uploadedAt = new Date().toISOString();
      const uploadedByName = user.displayName || user.company || user.email || 'Inspection Manager';

      await equipmentService.updateInspectionRequest(request.id, {
        status: 'Completed',
        inspectionReportUrl: uploaded.downloadUrl,
        inspectionReportFileName: uploaded.fileName,
        inspectionReportContentType: uploaded.contentType,
        inspectionReportUploadedAt: uploadedAt,
        inspectionReportUploadedByUid: user.uid,
        inspectionReportUploadedByName: uploadedByName,
      });

      patchInspectionRequestLocal(request.id, {
        status: 'Completed',
        inspectionReportUrl: uploaded.downloadUrl,
        inspectionReportFileName: uploaded.fileName,
        inspectionReportContentType: uploaded.contentType,
        inspectionReportUploadedAt: uploadedAt,
        inspectionReportUploadedByUid: user.uid,
        inspectionReportUploadedByName: uploadedByName,
        updatedAt: uploadedAt,
        reviewedAt: uploadedAt,
        respondedAt: uploadedAt,
      });
      setInspectionNotice('Completed inspection report uploaded successfully.');
    } catch (error) {
      setInspectionError(error instanceof Error ? error.message : 'Unable to upload the completed inspection report right now.');
    } finally {
      setInspectionDocumentActionId(null);
    }
  };

  const handleToggleFeaturedListing = async (listing: Listing) => {
    const nextFeatured = !listing.featured;
    const actionKey = getLifecycleActionKey(listing.id, nextFeatured ? 'feature' : 'unfeature');
    setListingActionId(actionKey);
    setListingActionError('');
    setListingActionNotice('');

    try {
      await equipmentService.updateListing(listing.id, {
        featured: nextFeatured,
        sellerUid: listing.sellerUid || user?.uid,
        sellerId: listing.sellerId || user?.uid,
      });
      setMyListings((prev) => prev.map((entry) => (
        entry.id === listing.id
          ? { ...entry, featured: nextFeatured, updatedAt: new Date().toISOString() }
          : entry
      )));
      setListingActionNotice(nextFeatured ? 'Listing added to featured inventory.' : 'Listing removed from featured inventory.');
    } catch (error) {
      setListingActionError(error instanceof Error ? error.message : 'Unable to update the featured listing state right now.');
    } finally {
      setListingActionId('');
    }
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setIsListingModalOpen(true);
  };

  const getLifecycleActionKey = (listingId: string, action: string) => `${listingId}:${action}`;

  const getListingLifecycleActions = (listing: Listing) => {
    const status = String(listing.status || 'pending').trim().toLowerCase();
    const actions: Array<{ action: 'submit' | 'relist' | 'mark_sold' | 'archive'; label: string; tone: 'default' | 'accent' }> = [];

    if (status === 'active') {
      actions.push({ action: 'mark_sold', label: 'Mark Sold', tone: 'accent' });
      actions.push({ action: 'archive', label: 'Archive', tone: 'default' });
      return actions;
    }

    if (status === 'sold' || status === 'expired' || status === 'archived') {
      actions.push({ action: 'relist', label: 'Relist', tone: 'accent' });
    }

    if (String(listing.approvalStatus || '').trim().toLowerCase() === 'rejected') {
      actions.push({ action: 'submit', label: 'Resubmit', tone: 'accent' });
    }

    if (status !== 'archived') {
      actions.push({ action: 'archive', label: 'Archive', tone: 'default' });
    }

    return actions;
  };

  const handleListingLifecycleAction = async (
    listing: Listing,
    action: 'submit' | 'relist' | 'mark_sold' | 'archive'
  ) => {
    const actionKey = getLifecycleActionKey(listing.id, action);
    setListingActionError('');
    setListingActionNotice('');
    setListingActionId(actionKey);

    try {
      const updatedListing = await equipmentService.transitionListingLifecycle(listing.id, action);
      setMyListings((prev) => prev.map((entry) => (
        entry.id === listing.id
          ? { ...entry, ...updatedListing }
          : entry
      )));
      setListingActionNotice(`Listing ${action.replace(/_/g, ' ')} completed.`);
    } catch (error) {
      setListingActionError(error instanceof Error ? error.message : 'Unable to update the listing lifecycle right now.');
    } finally {
      setListingActionId('');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await equipmentService.deleteListing(id);
      setMyListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert('Unable to delete listing right now. Please try again.');
    }
  };

  const handleSaveListing = async (listingData: any) => {
    if (!user) {
      throw new Error('You must be signed in to manage listings.');
    }

    try {
      if (selectedListing) {
        await equipmentService.updateListing(selectedListing.id, listingData);
      } else {
        await equipmentService.addListing({
          ...listingData,
          sellerUid: user.uid,
          sellerId: user.uid,
        });
      }

      const refreshedListings = await equipmentService.getMyListings();
      setMyListings(refreshedListings);
      setIsListingModalOpen(false);
      setSelectedListing(null);
    } catch (error) {
      console.error('Failed to save listing:', error);
      throw error;
    }
  };

  const handleToggleSavedSearchStatus = async (savedSearch: SavedSearch) => {
    try {
      const nextStatus = savedSearch.status === 'active' ? 'paused' : 'active';
      await userService.updateSavedSearch(savedSearch.id, { status: nextStatus });
      setSavedSearches((prev) => prev.map((item) => (item.id === savedSearch.id ? { ...item, status: nextStatus } : item)));
    } catch (error) {
      console.error('Failed to update saved search status', error);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      await userService.deleteSavedSearch(id);
      setSavedSearches((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete saved search', error);
    }
  };

  const handleStorefrontInputChange = (key: keyof typeof storefrontForm, value: string) => {
    setStorefrontForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveStorefront = async () => {
    if (!user?.uid || !user.role) return;

    const storefrontName = storefrontForm.storefrontName.trim();
    if (!storefrontName) {
      setStorefrontError(`${storefrontTabLabel} name is required.`);
      return;
    }

    setIsSavingStorefront(true);
    setStorefrontError('');
    setStorefrontNotice('');

    try {
      const seoKeywords = storefrontForm.seoKeywordsCsv
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .slice(0, 30);

      const result = await withAsyncTimeout(
        userService.saveStorefrontProfile(user.uid, {
          role: user.role,
          storefrontName,
          preferredSlug: storefrontForm.storefrontSlug.trim(),
          storefrontTagline: storefrontForm.storefrontTagline.trim(),
          storefrontDescription: storefrontForm.storefrontDescription.trim(),
          location: storefrontForm.location.trim(),
          phone: storefrontForm.phone.trim(),
          email: storefrontForm.email.trim().toLowerCase(),
          website: storefrontForm.website.trim(),
          logo: storefrontForm.logo.trim() || settingsForm.photoURL.trim(),
          coverPhotoUrl: storefrontForm.coverPhotoUrl.trim() || settingsForm.coverPhotoUrl.trim(),
          seoTitle: storefrontForm.seoTitle.trim(),
          seoDescription: storefrontForm.seoDescription.trim(),
          seoKeywords,
        }),
        15000,
        `${storefrontTabLabel} storage is taking too long to respond. Please try again once Firestore quota resets.`
      );

      const refreshedStorefront = await equipmentService.getMyStorefront();
      setStorefrontPreview(refreshedStorefront || null);
      setStorefrontForm((prev) => ({ ...prev, storefrontSlug: result.storefrontSlug }));
      setStorefrontNotice(`${storefrontTabLabel} saved. Canonical path: ${result.canonicalPath}`);
    } catch (error) {
      setStorefrontError(error instanceof Error ? error.message : `Unable to save ${storefrontTabLabel.toLowerCase()} right now.`);
    } finally {
      setIsSavingStorefront(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          canViewSavedEquipment ? { label: 'Saved Equipment', value: savedAssets.length.toString(), icon: Bookmark } : null,
          canViewSearchAlerts ? { label: 'Active Alerts', value: savedSearches.filter(a => a.status === 'active').length.toString(), icon: Bell } : null,
          canViewMyListings ? { label: hasAdminProfileScope ? 'Visible Listings' : 'My Listings', value: myListings.length.toString(), icon: Package } : null,
          canViewSellerInquiries ? { label: 'Open Inquiries', value: inquiries.filter((inquiry) => ['New', 'Contacted', 'Qualified'].includes(inquiry.status)).length.toString(), icon: MessageSquare } : null,
          canViewSellerCalls ? { label: 'Logged Calls', value: calls.length.toString(), icon: Phone } : null,
          canViewBuyerFinancing ? { label: 'Financing Requests', value: financingRequests.length.toString(), icon: CreditCard } : null,
        ].filter(Boolean).map((stat, i) => {
          const safeStat = stat as { label: string; value: string; icon: React.ComponentType<{ className?: string; size?: number }> };
          const Icon = safeStat.icon;
          return (
            <div key={i} className="bg-surface border border-line p-8 flex justify-between items-center shadow-sm">
              <div className="flex flex-col">
                <span className="label-micro text-muted mb-1">{safeStat.label}</span>
                <span className="text-3xl font-black tracking-tighter uppercase">{safeStat.value}</span>
              </div>
              <Icon className="text-accent" size={32} />
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-bg border border-line shadow-sm">
        <div className="p-6 border-b border-line flex justify-between items-center bg-surface/30">
          <h3 className="text-xs font-black uppercase tracking-widest">Recent Activity</h3>
          <button className="text-[10px] font-bold text-accent uppercase hover:underline">View All</button>
        </div>
        <div className="divide-y divide-line">
          {[
            { action: 'Equipment Saved', target: '2022 Tigercat 855E', time: '2 hours ago' },
            { action: 'Inquiry Sent', target: '2019 John Deere 959M', time: '1 day ago' },
            { action: 'Alert Triggered', target: 'New Skidder Inventory', time: '3 days ago' },
            { action: 'Profile Login', target: 'Mobile Device', time: '5 days ago' }
          ].map((activity, i) => (
            <div key={i} className="p-6 flex justify-between items-center hover:bg-surface/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider">{activity.action}</span>
                  <span className="text-[10px] font-medium text-muted uppercase tracking-widest">{activity.target}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMyListings = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h3 className="text-sm font-black uppercase tracking-widest">My Inventory</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {myListings.length > 0 && (
            <button onClick={exportMyListingsCSV} className="btn-industrial py-2 px-4 flex items-center text-[10px]">
              <Download size={14} className="mr-2" />
              Export CSV
            </button>
          )}
          <button onClick={downloadSampleMachineCSV} className="btn-industrial py-2 px-4 flex items-center text-[10px]">
            <FileText size={14} className="mr-2" />
            Sample CSV
          </button>
          <button
            onClick={() => { setSelectedListing(null); setIsListingModalOpen(true); }}
            className="btn-industrial btn-accent py-2 px-4 flex items-center text-[10px]"
          >
            <Plus size={14} className="mr-2" />
            Add Machine
          </button>
        </div>
      </div>
      {listingActionError && (
        <div className="rounded-sm border border-accent/30 bg-accent/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-accent">
          {listingActionError}
        </div>
      )}
      {listingActionNotice && (
        <div className="rounded-sm border border-data/30 bg-data/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-data">
          {listingActionNotice}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-sm border border-line bg-surface p-4">
          <p className="label-micro text-muted mb-2">Active Listings</p>
          <p className="text-2xl font-black uppercase tracking-tighter">{activeManagedListingsCount}</p>
        </div>
        <div className="rounded-sm border border-line bg-surface p-4">
          <p className="label-micro text-muted mb-2">Listings Remaining</p>
          <p className="text-2xl font-black uppercase tracking-tighter">
            {remainingManagedListings === null ? 'Unlimited' : remainingManagedListings}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted">
            {finiteListingCap === null ? 'Admin / super admin unlimited posting access' : `${finiteListingCap} listing allowance`}
          </p>
        </div>
        <div className="rounded-sm border border-line bg-surface p-4">
          <p className="label-micro text-muted mb-2">Featured Slots</p>
          <p className="text-2xl font-black uppercase tracking-tighter">
            {Number.isFinite(featuredListingCap) ? `${featuredListingCount}/${featuredListingCap}` : `${featuredListingCount}/Unlimited`}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted">
            {remainingFeaturedSlots === null ? 'Unlimited featured control' : `${remainingFeaturedSlots} slots remaining`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {myListings.map((listing) => (
           <div key={listing.id} className="bg-surface border border-line p-4 flex flex-col sm:flex-row gap-4 shadow-sm hover:border-accent/50 transition-colors">
             <div className="w-full sm:w-40 md:w-48 aspect-video bg-bg border border-line overflow-hidden rounded-sm flex-shrink-0">
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            </div>
             <div className="flex-1 min-w-0 space-y-2">
               <div className="flex justify-between items-start gap-2">
                 <div className="min-w-0">
                   <span className="label-micro text-accent">{listing.category}</span>
                   <h4 className="text-base md:text-lg font-black uppercase tracking-tighter leading-tight">{listing.title}</h4>
                   <div className="mt-2 flex flex-wrap items-center gap-2">
                     <span className="rounded-sm bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted">
                       Listing ID: {listing.id}
                     </span>
                     <span className="rounded-sm bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted">
                       {String(listing.status || 'pending')}
                     </span>
                     <span className="rounded-sm bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted">
                       {String(listing.approvalStatus || 'pending')}
                     </span>
                     <span className="rounded-sm bg-bg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted">
                       {String(listing.paymentStatus || 'pending')}
                     </span>
                   </div>
                 </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                   <span className="text-base md:text-xl font-black tracking-tighter">{formatPrice(listing.price, listing.currency || 'USD', 0)}</span>
                   <div className="flex gap-1 sm:hidden">
                     <button onClick={() => handleEditListing(listing)} className="p-2 bg-bg border border-line text-muted hover:text-accent hover:border-accent transition-all rounded-sm">
                       <Edit size={14} />
                     </button>
                     <button onClick={() => handleDeleteListing(listing.id)} className="p-2 bg-bg border border-line text-muted hover:text-accent hover:border-accent transition-all rounded-sm">
                       <Trash2 size={14} />
                     </button>
                   </div>
                 </div>
               </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted uppercase tracking-widest">
                <span className="flex items-center"><Clock size={12} className="mr-1" /> {listing.hours} HRS</span>
                <span className="flex items-center"><MapPin size={12} className="mr-1" /> {listing.location}</span>
                {listing.featured ? <span className="flex items-center text-accent"><Star size={12} className="mr-1" /> FEATURED</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {(Number.isFinite(featuredListingCap) ? featuredListingCap > 0 : true) ? (
                  <button
                    type="button"
                    disabled={listingActionId === getLifecycleActionKey(listing.id, listing.featured ? 'unfeature' : 'feature')}
                    onClick={() => void handleToggleFeaturedListing(listing)}
                    className={`rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60 ${
                      listing.featured
                        ? 'border-accent/40 bg-accent/10 text-accent hover:border-accent'
                        : 'border-line bg-bg text-muted hover:border-accent hover:text-accent'
                    }`}
                  >
                    {listingActionId === getLifecycleActionKey(listing.id, listing.featured ? 'unfeature' : 'feature')
                      ? 'Working...'
                      : listing.featured ? 'Unfeature' : 'Feature'}
                  </button>
                ) : null}
                {getListingLifecycleActions(listing).map(({ action, label, tone }) => {
                  const actionKey = getLifecycleActionKey(listing.id, action);
                  const isPending = listingActionId === actionKey;
                  return (
                    <button
                      key={action}
                      type="button"
                      disabled={isPending}
                      onClick={() => void handleListingLifecycleAction(listing, action)}
                      className={`rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60 ${
                        tone === 'accent'
                          ? 'border-accent/40 bg-accent/10 text-accent hover:border-accent'
                          : 'border-line bg-bg text-muted hover:border-accent hover:text-accent'
                      }`}
                    >
                      {isPending ? 'Working...' : label}
                    </button>
                  );
                })}
              </div>
            </div>
             <div className="hidden sm:flex sm:flex-col gap-2 flex-shrink-0">
              <button 
                onClick={() => handleEditListing(listing)}
                className="p-2 bg-bg border border-line text-muted hover:text-accent hover:border-accent transition-all rounded-sm"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => handleDeleteListing(listing.id)}
                className="p-2 bg-bg border border-line text-muted hover:text-accent hover:border-accent transition-all rounded-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-8">
      <h3 className="text-sm font-black uppercase tracking-widest">Search Alerts & Notifications</h3>
      <div className="grid grid-cols-1 gap-4">
        {savedSearches.map((alert) => (
           <div key={alert.id} className="bg-surface border border-line p-4 md:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest">{alert.name}</h4>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                {Object.entries(alert.filters)
                  .slice(0, 4)
                  .map(([key, value]) => `${key}:${value}`)
                  .join(' | ')}
              </p>
            </div>
             <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${alert.status === 'active' ? 'bg-data/10 text-data' : 'bg-line text-muted'}`}>
                {alert.status}
              </span>
              <button className="p-2 text-muted hover:text-ink transition-colors" onClick={() => handleToggleSavedSearchStatus(alert)}>
                <Settings size={16} />
              </button>
              <button className="p-2 text-muted hover:text-accent transition-colors" onClick={() => handleDeleteSavedSearch(alert.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {savedSearches.length === 0 && (
          <div className="bg-surface border border-line p-6 text-[10px] font-bold text-muted uppercase tracking-widest">
            No saved searches yet. Create one from the Search page to enable alerts.
          </div>
        )}
      </div>
    </div>
  );

  const renderFinancing = () => (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-black uppercase tracking-widest">Financing Applications</h3>
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
          Review financing forms you submitted through Forestry Equipment Sales and track their current status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Applications Sent', value: financingRequests.length.toString(), icon: CreditCard },
          { label: 'Open Requests', value: financingRequests.filter((request) => ['New', 'Contacted', 'Qualified'].includes(request.status)).length.toString(), icon: Clock },
          { label: 'Approved / Won', value: financingRequests.filter((request) => request.status === 'Won').length.toString(), icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-line p-8 flex justify-between items-center shadow-sm">
            <div className="flex flex-col">
              <span className="label-micro text-muted mb-1">{stat.label}</span>
              <span className="text-3xl font-black tracking-tighter uppercase">{stat.value}</span>
            </div>
            <stat.icon className="text-accent" size={32} />
          </div>
        ))}
      </div>

      {financingRequests.length === 0 ? (
        <div className="bg-surface border border-line p-8 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest">No financing applications yet.</p>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Submit a financing form from the financing center or a listing payment calculator and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {financingRequests.map((request) => (
            <div key={request.id} className="bg-surface border border-line p-6 space-y-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest">{request.company || request.applicantName || 'Financing Application'}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted uppercase tracking-widest">
                    <span>{request.applicantName || 'Unknown Applicant'}</span>
                    <span>{request.applicantEmail || 'No email provided'}</span>
                    <span>{request.applicantPhone || 'No phone provided'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${request.status === 'Won' ? 'bg-data/10 text-data' : request.status === 'Lost' || request.status === 'Closed' ? 'bg-accent/10 text-accent' : 'bg-ink text-white'}`}>
                    {request.status}
                  </span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    {formatDateLabel(request.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="bg-bg border border-line p-4 space-y-2">
                  <p className="text-muted">Requested Amount</p>
                  <p className="text-xs text-ink">{typeof request.requestedAmount === 'number' ? formatPrice(request.requestedAmount, 'USD', 0) : 'Not provided'}</p>
                </div>
                <div className="bg-bg border border-line p-4 space-y-2">
                  <p className="text-muted">Linked Listing</p>
                  <p className="text-xs text-ink break-all">{request.listingId || 'General financing request'}</p>
                </div>
              </div>

              <div className="bg-bg border border-line p-4 space-y-2">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Submitted Details</p>
                <p className="text-[11px] leading-relaxed text-ink break-words">
                  {request.message || 'No additional notes were included with this application.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const getInquiryStatusClasses = (status: Inquiry['status']) => {
    switch (status) {
      case 'Won':
        return 'bg-data/10 text-data';
      case 'Lost':
      case 'Closed':
        return 'bg-accent/10 text-accent';
      case 'Qualified':
      case 'Contacted':
        return 'bg-amber-500/10 text-amber-700';
      default:
        return 'bg-ink text-white';
    }
  };

  const renderInquiries = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-black uppercase tracking-widest">Inquiry Logs</h3>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Review buyer inquiries submitted on your listings and keep lead follow-up visible.
          </p>
        </div>
        {inquiries.length > 0 && (
          <button onClick={exportMyInquiriesCSV} className="btn-industrial py-2 px-4 flex items-center text-[10px] flex-shrink-0">
            <Download size={14} className="mr-2" />
            Export CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Inquiries', value: inquiries.length.toString(), icon: MessageSquare },
          { label: 'New Leads', value: inquiries.filter((inquiry) => inquiry.status === 'New').length.toString(), icon: Clock },
          { label: 'Won Deals', value: inquiries.filter((inquiry) => inquiry.status === 'Won').length.toString(), icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-line p-8 flex justify-between items-center shadow-sm">
            <div className="flex flex-col">
              <span className="label-micro text-muted mb-1">{stat.label}</span>
              <span className="text-3xl font-black tracking-tighter uppercase">{stat.value}</span>
            </div>
            <stat.icon className="text-accent" size={32} />
          </div>
        ))}
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-surface border border-line p-8 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest">No inquiries yet.</p>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Buyer inquiry submissions from your live listings will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-surface border border-line p-6 space-y-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest">{inquiry.buyerName || 'Unknown buyer'}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted uppercase tracking-widest">
                    <span>{inquiry.type || 'Inquiry'}</span>
                    <span>{formatDateLabel(inquiry.createdAt)}</span>
                    <span>{listingTitleLookup.get(inquiry.listingId || '') || inquiry.listingId || 'General listing inquiry'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${getInquiryStatusClasses(inquiry.status)}`}>
                    {inquiry.status}
                  </span>
                  {inquiry.assignedToName ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Assigned: {inquiry.assignedToName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="bg-bg border border-line p-4 space-y-2">
                  <p className="text-muted">Contact</p>
                  <p className="text-xs text-ink break-words">{inquiry.buyerEmail || 'No email provided'}</p>
                  <p className="text-muted normal-case">{inquiry.buyerPhone || 'No phone provided'}</p>
                </div>
                <div className="bg-bg border border-line p-4 space-y-2">
                  <p className="text-muted">Listing</p>
                  <p className="text-xs text-ink break-words">{listingTitleLookup.get(inquiry.listingId || '') || inquiry.listingId || 'General inquiry'}</p>
                  <p className="text-muted">Seller UID: {inquiry.sellerUid || inquiry.sellerId || 'Unknown'}</p>
                </div>
                <div className="bg-bg border border-line p-4 space-y-2">
                  <p className="text-muted">Lead Quality</p>
                  <p className="text-xs text-ink">Spam Score: {inquiry.spamScore ?? 0}</p>
                  <p className="text-muted break-words">{inquiry.spamFlags?.length ? inquiry.spamFlags.join(', ') : 'No flags'}</p>
                </div>
              </div>

              <div className="bg-bg border border-line p-4 space-y-2">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Buyer Message</p>
                <p className="text-[11px] leading-relaxed text-ink break-words">
                  {inquiry.message || 'No additional message was provided.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCalls = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-black uppercase tracking-widest">Call Logs</h3>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Review callers, phone numbers, and the exact ad they clicked.
          </p>
        </div>
        {calls.length > 0 && (
          <button onClick={exportMyCallsCSV} className="btn-industrial py-2 px-4 flex items-center text-[10px] flex-shrink-0">
            <Download size={14} className="mr-2" />
            Export CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Calls', value: calls.length.toString(), icon: Phone },
          { label: 'Signed-In Callers', value: calls.filter((call) => call.isAuthenticated).length.toString(), icon: User },
          { label: 'Guest Callers', value: calls.filter((call) => !call.isAuthenticated).length.toString(), icon: Building2 },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-line p-8 flex justify-between items-center shadow-sm">
            <div className="flex flex-col">
              <span className="label-micro text-muted mb-1">{stat.label}</span>
              <span className="text-3xl font-black tracking-tighter uppercase">{stat.value}</span>
            </div>
            <stat.icon className="text-accent" size={32} />
          </div>
        ))}
      </div>

      {calls.length === 0 ? (
        <div className="bg-surface border border-line p-8 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest">No calls yet.</p>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Calls will appear here when buyers press the call button on your listings.
          </p>
        </div>
      ) : (
        <div className="bg-bg border border-line rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-[10px] font-bold uppercase tracking-widest text-left">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-6 py-4">Caller</th>
                  <th className="px-6 py-4">Caller Phone</th>
                  <th className="px-6 py-4">Ad</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Audio</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id} className="border-t border-line hover:bg-surface/60 transition-colors">
                    <td className="px-6 py-4 text-ink">
                      <div className="flex flex-col gap-1 normal-case">
                        <span className="text-xs font-black tracking-tight uppercase">{call.callerName || 'Unknown Caller'}</span>
                        <span className="text-[10px] font-bold text-muted">{call.callerEmail || (call.isAuthenticated ? 'Signed-in user' : 'Guest caller')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-ink normal-case">{call.callerPhone || 'Not provided'}</td>
                    <td className="px-6 py-4 text-ink">
                      <div className="flex flex-col gap-1 normal-case">
                        <span className="text-xs font-black tracking-tight uppercase">{call.listingTitle || 'Untitled Listing'}</span>
                        <span className="text-[10px] font-bold text-muted">ID: {call.listingId || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-sm bg-data/10 text-data text-[9px] font-black uppercase tracking-widest">
                        {call.status || 'Initiated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 normal-case">
                      {call.recordingUrl ? (
                        <div className="flex flex-col gap-2">
                          <audio controls preload="none" className="max-w-[220px]">
                            <source src={`/api/account/calls/${encodeURIComponent(call.id)}/recording`} type="audio/mpeg" />
                          </audio>
                          <a
                            href={`/api/account/calls/${encodeURIComponent(call.id)}/recording`}
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
                    <td className="px-6 py-4 text-muted">{call.source || 'unknown'}</td>
                    <td className="px-6 py-4 text-muted normal-case">{formatDateLabel(call.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderInspections = () => {
    const openInspectionCount = inspectionRequests.filter((request) => ['New', 'Quoted', 'Accepted'].includes(request.status)).length;
    const completedInspectionCount = inspectionRequests.filter((request) => request.status === 'Completed').length;

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-black uppercase tracking-widest">Inspection Requests</h3>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {canManageInspectionRequests
              ? 'Review routed inspection requests, set pricing, and respond as the assigned dealer or admin.'
              : 'Track the inspection requests you submitted through Forestry Equipment Sales.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Requests', value: inspectionRequests.length.toString(), icon: ClipboardList },
            { label: 'Open Requests', value: openInspectionCount.toString(), icon: Clock },
            { label: 'Completed', value: completedInspectionCount.toString(), icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface border border-line p-8 flex justify-between items-center shadow-sm">
              <div className="flex flex-col">
                <span className="label-micro text-muted mb-1">{stat.label}</span>
                <span className="text-3xl font-black tracking-tighter uppercase">{stat.value}</span>
              </div>
              <stat.icon className="text-accent" size={32} />
            </div>
          ))}
        </div>

        {inspectionError && <p className="text-[10px] font-black uppercase tracking-widest text-accent">{inspectionError}</p>}
        {inspectionNotice && <p className="text-[10px] font-black uppercase tracking-widest text-data">{inspectionNotice}</p>}

        {inspectionRequestsLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-surface border border-line" />
            <div className="h-40 bg-surface border border-line" />
            <div className="h-40 bg-surface border border-line" />
          </div>
        ) : inspectionRequests.length === 0 ? (
          <div className="bg-surface border border-line p-8 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest">No inspection requests yet.</p>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
              {canManageInspectionRequests
                ? 'New inspection intake from the public inspections page will appear here automatically.'
                : 'Submit a request from the inspections page and it will appear here for status tracking.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inspectionRequests.map((request) => {
              const quoteDraft = inspectionQuoteDrafts[request.id] ?? '';
              const isUpdatingRequest = inspectionActionId === request.id;
              const isDocumentActionPending = inspectionDocumentActionId === request.id;

              return (
                <div key={request.id} className="bg-surface border border-line p-6 space-y-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2 min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest">{request.listingTitle || request.equipment || 'Inspection Request'}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted uppercase tracking-widest">
                        <span>{request.reference || request.listingId || request.id}</span>
                        <span>{formatDateLabel(request.createdAt)}</span>
                        {request.assignedToName ? <span>Assigned: {request.assignedToName}</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${getInspectionStatusClasses(request.status)}`}>
                        {request.status}
                      </span>
                      {typeof request.quotedPrice === 'number' ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                          Quote: {formatPrice(request.quotedPrice, 'USD', 0)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div className="bg-bg border border-line p-4 space-y-2">
                      <p className="text-muted">Requester</p>
                      <p className="text-xs text-ink break-words">{request.requesterName || 'Unknown requester'}</p>
                      <p className="text-muted normal-case break-words">{request.requesterEmail || 'No email provided'}</p>
                      <p className="text-muted normal-case">{request.requesterPhone || 'No phone provided'}</p>
                    </div>
                    <div className="bg-bg border border-line p-4 space-y-2">
                      <p className="text-muted">Inspection Location</p>
                      <p className="text-xs text-ink break-words">{request.inspectionLocation || 'Not provided'}</p>
                      <p className="text-muted">Timeline: {request.timeline || 'Flexible'}</p>
                    </div>
                    <div className="bg-bg border border-line p-4 space-y-2">
                      <p className="text-muted">Matched Dealer</p>
                      <p className="text-xs text-ink break-words">{request.matchedDealerName || request.assignedToName || 'Unassigned'}</p>
                      <p className="text-muted break-words">{request.matchedDealerLocation || 'No location captured'}</p>
                      <p className="text-muted">Distance: {typeof request.matchedDealerDistanceMiles === 'number' ? `${request.matchedDealerDistanceMiles.toFixed(1)} mi` : 'Unknown'}</p>
                    </div>
                    <div className="bg-bg border border-line p-4 space-y-2">
                      <p className="text-muted">Machine</p>
                      <p className="text-xs text-ink break-words">{request.equipment || request.listingTitle || 'Not provided'}</p>
                      {request.listingUrl ? (
                        <a href={request.listingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent hover:underline">
                          View Linked Listing
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-muted">No linked listing URL</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-bg border border-line p-4 space-y-2">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Inspection Notes</p>
                    <p className="text-[11px] leading-relaxed text-ink break-words">
                      {request.notes || 'No additional inspection notes were included.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 text-[10px] font-bold uppercase tracking-widest">
                    <div className="bg-bg border border-line p-4 space-y-3">
                      <p className="text-muted">Inspection Sheet</p>
                      {request.inspectionTemplateUrl ? (
                        <>
                          <a
                            href={request.inspectionTemplateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-accent hover:underline"
                          >
                            <Download size={12} />
                            {request.inspectionTemplateFileName || 'Download inspection sheet'}
                          </a>
                          <p className="text-muted normal-case">
                            Sent {request.inspectionTemplateGeneratedAt ? formatDateLabel(request.inspectionTemplateGeneratedAt) : 'recently'} by {request.inspectionTemplateGeneratedByName || 'inspection desk'}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted normal-case">No inspection sheet has been sent yet.</p>
                      )}
                    </div>
                    <div className="bg-bg border border-line p-4 space-y-3">
                      <p className="text-muted">Completed Inspection Report</p>
                      {request.inspectionReportUrl ? (
                        <>
                          <a
                            href={request.inspectionReportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-accent hover:underline"
                          >
                            <Download size={12} />
                            {request.inspectionReportFileName || 'Download completed inspection report'}
                          </a>
                          <p className="text-muted normal-case">
                            Uploaded {request.inspectionReportUploadedAt ? formatDateLabel(request.inspectionReportUploadedAt) : 'recently'} by {request.inspectionReportUploadedByName || 'inspection desk'}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted normal-case">No completed report has been uploaded yet.</p>
                      )}
                    </div>
                  </div>

                  {canManageInspectionRequests ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,220px)_1fr] gap-4 items-end">
                      <div className="space-y-2">
                        <label className="label-micro">Inspection Quote</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="input-industrial w-full"
                          value={quoteDraft}
                          onChange={(event) => handleInspectionQuoteDraftChange(request.id, event.target.value)}
                          placeholder="Enter USD amount"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void handleInspectionRequestUpdate(request, 'Quoted', true)}
                          disabled={isUpdatingRequest}
                          className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
                        >
                          Save Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleInspectionRequestUpdate(request, 'Accepted', true)}
                          disabled={isUpdatingRequest}
                          className="btn-industrial btn-accent py-2 px-4 text-[10px] disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleGenerateInspectionTemplate(request)}
                          disabled={isDocumentActionPending}
                          className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
                        >
                          {isDocumentActionPending ? 'Working...' : 'Send Inspection Sheet'}
                        </button>
                        <button
                          type="button"
                          onClick={() => inspectionReportInputRefs.current[request.id]?.click()}
                          disabled={isDocumentActionPending}
                          className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
                        >
                          <Upload size={12} className="mr-1 inline" />
                          Upload Completed Report
                        </button>
                        <input
                          ref={(node) => {
                            inspectionReportInputRefs.current[request.id] = node;
                          }}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(event) => {
                            const nextFile = event.target.files?.[0] || null;
                            void handleUploadInspectionReport(request, nextFile);
                            event.currentTarget.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void handleInspectionRequestUpdate(request, 'Declined', false)}
                          disabled={isUpdatingRequest}
                          className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleInspectionRequestUpdate(request, 'Completed', false)}
                          disabled={isUpdatingRequest}
                          className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStorefront = () => {
    const publicPath = `/seller/${storefrontPreview?.storefrontSlug || storefrontForm.storefrontSlug || user?.uid || ''}`;

    return (
      <div className="space-y-12">
        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">{storefrontTabLabel} Settings</h3>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2 max-w-3xl">
                {user?.role === 'individual_seller'
                  ? 'This controls your public owner-operator profile, canonical seller URL, search metadata, and storefront presentation.'
                  : 'This controls your storefront branding, canonical seller URL, and the metadata used by your public seller page.'}
              </p>
            </div>
            <Link to={publicPath} className="btn-industrial btn-accent py-2 px-4 text-[10px]">
              View Public Page
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-line p-6">
              <span className="label-micro block mb-2">Canonical URL</span>
              <p className="text-xs font-black uppercase tracking-widest break-all">{publicPath}</p>
            </div>
            <div className="bg-surface border border-line p-6">
              <span className="label-micro block mb-2">Logo Source</span>
              <p className="text-xs font-black uppercase tracking-widest break-all">{storefrontForm.logo || 'Uses account profile image'}</p>
            </div>
            <div className="bg-surface border border-line p-6">
              <span className="label-micro block mb-2">Cover Source</span>
              <p className="text-xs font-black uppercase tracking-widest break-all">{storefrontForm.coverPhotoUrl || 'Uses account cover image'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="label-micro">{storefrontTabLabel} Name</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.storefrontName} onChange={(e) => handleStorefrontInputChange('storefrontName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="label-micro">Canonical Slug</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.storefrontSlug} onChange={(e) => handleStorefrontInputChange('storefrontSlug', e.target.value)} placeholder="auto-generated-from-name" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="label-micro">Tagline</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.storefrontTagline} onChange={(e) => handleStorefrontInputChange('storefrontTagline', e.target.value)} placeholder="Short positioning line for the public page" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="label-micro">Description</label>
              <textarea rows={5} className="input-industrial w-full" value={storefrontForm.storefrontDescription} onChange={(e) => handleStorefrontInputChange('storefrontDescription', e.target.value)} placeholder="Tell buyers what you sell, where you operate, and why they should work with you." />
            </div>
            <div className="space-y-2">
              <label className="label-micro">Location</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.location} onChange={(e) => handleStorefrontInputChange('location', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="label-micro">Website</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.website} onChange={(e) => handleStorefrontInputChange('website', e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <label className="label-micro">Public Email</label>
              <input type="email" className="input-industrial w-full" value={storefrontForm.email} onChange={(e) => handleStorefrontInputChange('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="label-micro">Public Phone</label>
              <input type="tel" className="input-industrial w-full" value={storefrontForm.phone} onChange={(e) => handleStorefrontInputChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="label-micro">Logo URL Override</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.logo} onChange={(e) => handleStorefrontInputChange('logo', e.target.value)} placeholder="Leave blank to reuse account profile image" />
            </div>
            <div className="space-y-2">
              <label className="label-micro">Cover URL Override</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.coverPhotoUrl} onChange={(e) => handleStorefrontInputChange('coverPhotoUrl', e.target.value)} placeholder="Leave blank to reuse account cover image" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="label-micro">SEO Title</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.seoTitle} onChange={(e) => handleStorefrontInputChange('seoTitle', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="label-micro">SEO Description</label>
              <textarea rows={4} className="input-industrial w-full" value={storefrontForm.seoDescription} onChange={(e) => handleStorefrontInputChange('seoDescription', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="label-micro">SEO Keywords</label>
              <input type="text" className="input-industrial w-full" value={storefrontForm.seoKeywordsCsv} onChange={(e) => handleStorefrontInputChange('seoKeywordsCsv', e.target.value)} placeholder="logging equipment, skidders, owner-operator" />
            </div>
          </div>

          {storefrontError && <p className="text-[10px] font-black uppercase tracking-widest text-accent">{storefrontError}</p>}
          {storefrontNotice && <p className="text-[10px] font-black uppercase tracking-widest text-data">{storefrontNotice}</p>}

          <button onClick={() => void handleSaveStorefront()} disabled={isSavingStorefront} className="btn-industrial btn-accent py-3 px-8 disabled:opacity-60">
            {isSavingStorefront ? 'Saving...' : `Save ${storefrontTabLabel}`}
          </button>
        </section>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-12">
      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest border-b border-line pb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="label-micro">Profile Picture</label>
            <button
              type="button"
              onClick={() => openAssetPicker('avatar')}
              disabled={isUploadingAvatar}
              className="w-24 h-24 bg-surface border border-line rounded-sm overflow-hidden flex items-center justify-center transition hover:border-accent disabled:opacity-60"
            >
              {settingsForm.photoURL ? (
                <img src={settingsForm.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={30} className="text-muted" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleProfileAssetUpload(file, 'avatar');
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => openAssetPicker('avatar')}
              disabled={isUploadingAvatar}
              className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
            >
              {isUploadingAvatar ? 'Uploading...' : settingsForm.photoURL ? 'Change Profile Picture' : 'Upload Profile Picture'}
            </button>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Click the image or button to upload and update your public profile photo.</p>
            {isUploadingAvatar && <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Uploading profile photo...</p>}
          </div>

          <div className="space-y-3">
            <label className="label-micro">Cover Photo</label>
            <button
              type="button"
              onClick={() => openAssetPicker('cover')}
              disabled={isUploadingCover}
              className="w-full h-24 bg-surface border border-line rounded-sm overflow-hidden flex items-center justify-center transition hover:border-accent disabled:opacity-60"
            >
              {settingsForm.coverPhotoUrl ? (
                <img src={settingsForm.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">No Cover Photo</span>
              )}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleProfileAssetUpload(file, 'cover');
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => openAssetPicker('cover')}
              disabled={isUploadingCover}
              className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
            >
              {isUploadingCover ? 'Uploading...' : settingsForm.coverPhotoUrl ? 'Change Cover Photo' : 'Upload Cover Photo'}
            </button>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Click the banner or button to upload and update your account and seller header image.</p>
            {isUploadingCover && <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Uploading cover photo...</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="label-micro">Full Name</label>
            <input
              type="text"
              className="input-industrial w-full"
              value={settingsForm.displayName}
              onChange={(e) => handleSettingsInputChange('displayName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="label-micro">Email Address</label>
            <input
              type="email"
              className="input-industrial w-full"
              value={settingsForm.email}
              onChange={(e) => handleSettingsInputChange('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="label-micro">Phone Number</label>
            <input
              type="tel"
              className="input-industrial w-full"
              placeholder="+1 (555) 000-0000"
              value={settingsForm.phoneNumber}
              onChange={(e) => handleSettingsInputChange('phoneNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="label-micro">Company Name</label>
            <input
              type="text"
              className="input-industrial w-full"
              value={settingsForm.company}
              onChange={(e) => handleSettingsInputChange('company', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="label-micro">Website</label>
            <input
              type="url"
              className="input-industrial w-full"
              placeholder="https://example.com"
              value={settingsForm.website}
              onChange={(e) => handleSettingsInputChange('website', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="label-micro">Preferred Language</label>
            <select
              className="input-industrial w-full"
              value={settingsForm.preferredLanguage}
              onChange={(e) => handleSettingsInputChange('preferredLanguage', e.target.value as Language)}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-micro">Preferred Currency</label>
            <select
              className="input-industrial w-full"
              value={settingsForm.preferredCurrency}
              onChange={(e) => handleSettingsInputChange('preferredCurrency', e.target.value as Currency)}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="label-micro">Address</label>
            <input
              type="text"
              className="input-industrial w-full"
              placeholder="Street, City, State/Province, Country"
              value={settingsForm.location}
              onChange={(e) => handleSettingsInputChange('location', e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="label-micro">Short Bio</label>
            <textarea
              className="input-industrial w-full min-h-[100px]"
              placeholder="Short introduction shown across your account presence"
              value={settingsForm.bio}
              onChange={(e) => handleSettingsInputChange('bio', e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="label-micro">About</label>
            <textarea
              className="input-industrial w-full min-h-[140px]"
              placeholder="Company background, specialties, service area, or buyer preferences"
              value={settingsForm.about}
              onChange={(e) => handleSettingsInputChange('about', e.target.value)}
            />
          </div>
        </div>
        {settingsError && <p className="text-[10px] font-black uppercase tracking-widest text-accent">{settingsError}</p>}
        {settingsNotice && <p className="text-[10px] font-black uppercase tracking-widest text-data">{settingsNotice}</p>}
        <button
          onClick={() => void handleSaveSettings()}
          disabled={isSavingSettings || isUploadingAvatar || isUploadingCover}
          className="btn-industrial btn-accent py-3 px-8 disabled:opacity-60"
        >
          {isSavingSettings ? 'Saving...' : 'Save Changes'}
        </button>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest border-b border-line pb-4">Account Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Role', value: roleDisplayLabel },
            { label: 'Account Status', value: user?.accountStatus || 'active' },
            { label: 'Subscription Plan', value: subscriptionPlanLabel },
            { label: 'Subscription Status', value: subscriptionStatusLabel },
            { label: user?.subscriptionStatus === 'canceled' ? 'Expires On' : 'Renewal Date',
              value: user?.currentPeriodEnd
                ? new Date(typeof user.currentPeriodEnd === 'string' ? user.currentPeriodEnd : Number(user.currentPeriodEnd)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : hasPaidSellerSubscription ? 'pending' : 'n/a' },
            { label: 'Subscribed Since',
              value: user?.subscriptionStartDate
                ? new Date(user.subscriptionStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : hasPaidSellerSubscription ? 'pending' : 'n/a' },
            { label: 'Billing Label', value: billingLabel },
            { label: 'Listing Visibility', value: listingVisibilityLabel },
            { label: 'SMS MFA', value: smsMfaFactors.length > 0 ? 'enabled' : 'not enrolled' },
            { label: 'Listing Capacity', value: hasAdminPublishingAccess(user) ? 'unlimited' : String(getManagedListingCap(user) ?? 0) },
            { label: 'Managed Seats', value: typeof user?.managedAccountCap === 'number' ? String(user.managedAccountCap) : '0' },
            { label: 'Email Verified', value: user?.emailVerified ? 'verified' : 'unverified' },
            { label: 'Storefront Access', value: hasStorefrontAccess ? 'enabled' : 'not available' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'n/a' },
          ].map((item) => (
            <div key={item.label} className="rounded-sm border border-line bg-surface p-4">
              <p className="label-micro text-muted mb-2">{item.label}</p>
              <p className="text-xs font-black uppercase tracking-widest break-words">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest border-b border-line pb-4">Security</h3>
        <div className="rounded-sm border border-line bg-surface p-6 space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest">SMS Multi-Factor Authentication</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Add a verified mobile number so Forestry Equipment Sales requires an SMS code after your password or Google sign-in.
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                Firebase Identity Platform must have SMS multi-factor authentication enabled and your domain authorized for this to work.
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${smsMfaFactors.length > 0 ? 'bg-data/10 text-data' : 'bg-line text-muted'}`}>
              {smsMfaFactors.length > 0 ? 'Enabled' : 'Not Enrolled'}
            </span>
          </div>

          {smsMfaFactors.length > 0 ? (
            <div className="space-y-3">
              {smsMfaFactors.map((factor) => (
                <div key={factor.uid} className="flex flex-col gap-3 rounded-sm border border-line bg-bg p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Enrolled mobile</p>
                    <p className="mt-1 text-sm font-black uppercase tracking-wide break-words">{factor.phoneNumber || 'SMS number on file'}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                      {factor.displayName || 'Primary device'}
                      {factor.enrollmentTime ? ` • enrolled ${new Date(factor.enrollmentTime).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemoveMfaFactor(factor.uid)}
                    disabled={removingMfaFactorUid === factor.uid}
                    className="btn-industrial py-2 px-4 text-[10px] disabled:opacity-60"
                  >
                    {removingMfaFactorUid === factor.uid ? 'Removing...' : 'Remove SMS MFA'}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {smsMfaFactors.length === 0 || mfaVerificationId ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-micro">Mobile Number For SMS Codes</label>
                  <input
                    type="tel"
                    className="input-industrial w-full"
                    placeholder="+15551234567"
                    value={mfaPhoneNumber}
                    onChange={(e) => setMfaPhoneNumber(e.target.value)}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Use full international format. Example: +15551234567
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Device Label</label>
                  <input
                    type="text"
                    className="input-industrial w-full"
                    placeholder="Primary mobile"
                    value={mfaDisplayName}
                    onChange={(e) => setMfaDisplayName(e.target.value)}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Optional label shown when this SMS factor is enrolled.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSendMfaCode()}
                  disabled={isSendingMfaCode || isEnrollingMfa}
                  className="btn-industrial btn-accent py-3 px-6 disabled:opacity-60"
                >
                  {isSendingMfaCode ? 'Waiting For Security Check...' : mfaVerificationId ? 'Resend Code' : 'Send Verification Code'}
                </button>
                {mfaVerificationId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMfaVerificationId('');
                      setMfaVerificationCode('');
                      setMfaError('');
                      setMfaNotice('SMS enrollment was canceled before completion.');
                      resetProfileMfaRecaptcha();
                    }}
                    className="btn-industrial py-3 px-6"
                  >
                    Cancel Enrollment
                  </button>
                ) : null}
              </div>

              <div id="profile-mfa-recaptcha" className="min-h-[78px]" />

              {mfaVerificationId ? (
                <div className="rounded-sm border border-line bg-bg p-4 space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">Confirm SMS Code</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Enter the verification code sent to {mfaPhoneNumber.trim() || 'your mobile number'} to finish enrollment.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input-industrial w-full"
                      placeholder="123456"
                      value={mfaVerificationCode}
                      onChange={(e) => setMfaVerificationCode(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => void handleCompleteMfaEnrollment()}
                      disabled={isEnrollingMfa}
                      className="btn-industrial btn-accent py-3 px-6 disabled:opacity-60"
                    >
                      {isEnrollingMfa ? 'Verifying...' : 'Enable SMS MFA'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {mfaError ? <p className="text-[10px] font-black uppercase tracking-widest text-accent">{mfaError}</p> : null}
          {mfaNotice ? <p className="text-[10px] font-black uppercase tracking-widest text-data">{mfaNotice}</p> : null}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest border-b border-line pb-4">Account Access</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-surface border border-line rounded-sm">
            <div className="flex items-center space-x-4">
              <Wrench size={20} className="text-accent" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Account Verification</p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Refresh seller access, billing visibility, and verification state</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleRefreshAccountAccess()}
              disabled={isRefreshingAccountAccess}
              className="text-[10px] font-black text-accent uppercase hover:underline disabled:opacity-60"
            >
              {isRefreshingAccountAccess ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="flex justify-between items-center p-4 bg-surface border border-line rounded-sm">
            <div className="flex items-center space-x-4">
              <Bell size={20} className="text-accent" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Account Notifications</p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {emailNotificationsEnabled
                    ? 'Optional saved-search alerts and monthly marketplace emails are enabled'
                    : 'Optional saved-search alerts and monthly marketplace emails are paused'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleToggleEmailNotifications()}
              disabled={isSavingNotificationPreference}
              className="text-[10px] font-black text-accent uppercase hover:underline disabled:opacity-60"
            >
              {isSavingNotificationPreference ? 'Saving...' : emailNotificationsEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          <div className="flex justify-between items-center p-4 bg-surface border border-line rounded-sm">
            <div className="flex items-center space-x-4">
              <CreditCard size={20} className="text-accent" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Billing & Subscription</p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {canManageBillingPortal
                    ? 'Open secure Stripe billing tools to manage payment methods, invoices, and subscription settings'
                    : 'Choose an ad program first to activate secure billing and subscription management'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {canManageBillingPortal ? (
                <button
                  type="button"
                  onClick={() => void handleManageBillingPortal()}
                  className="text-[10px] font-black text-accent uppercase hover:underline"
                >
                  Manage Billing
                </button>
              ) : (
                <Link
                  to="/ad-programs"
                  className="text-[10px] font-black text-accent uppercase hover:underline"
                >
                  View Ad Programs
                </Link>
              )}
              {hasPaidSellerSubscription && subscriptionStatusLabel !== 'canceled' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) return;
                    try {
                      await billingService.cancelSubscription();
                      setSettingsNotice('Your subscription has been scheduled for cancellation at the end of the current billing period.');
                    } catch (err) {
                      setSettingsError(err instanceof Error ? err.message : 'Failed to cancel subscription.');
                    }
                  }}
                  className="text-[10px] font-black text-muted uppercase hover:text-accent hover:underline"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <Seo title="My Profile | Forestry Equipment Sales" description="Manage your Forestry Equipment Sales account, listings, and subscription." robots="noindex, nofollow" />
      {/* Header */}
      <div className="bg-surface border-b border-line py-8 md:py-16 px-4 md:px-8 relative overflow-hidden">
        {coverPhotoPreview && (
          <>
            <img
              src={coverPhotoPreview}
              alt="Profile cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-ink/60"></div>
          </>
        )}

        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div className="flex items-center space-x-4 md:space-x-8 min-w-0">
            <div className="w-24 h-24 bg-ink flex items-center justify-center rounded-sm border border-line overflow-hidden">
              {profilePhotoPreview ? (
                <img src={profilePhotoPreview} alt={user?.displayName || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <User className="text-accent" size={48} />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`label-micro mb-2 uppercase tracking-widest ${coverPhotoPreview ? 'text-accent' : 'text-accent'}`}>{roleDisplayLabel} Profile</span>
              <h1 className={`text-2xl md:text-4xl font-black uppercase tracking-tighter truncate ${coverPhotoPreview ? 'text-white' : ''}`}>
                {user?.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest truncate max-w-[200px] sm:max-w-none ${coverPhotoPreview ? 'text-white/80' : 'text-muted'}`}>{user?.email}</span>
                <span className={`w-1 h-1 rounded-full ${coverPhotoPreview ? 'bg-white/40' : 'bg-line'}`}></span>
                <span className="text-[10px] font-bold text-data uppercase tracking-widest flex items-center">
                  <CheckCircle2 size={12} className="mr-1.5" />
                  {user?.emailVerified ? 'Account Confirmed' : 'Account Pending'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button 
              onClick={() => selectProfileTab('Account Settings')}
              className="btn-industrial bg-surface py-2 px-4 text-[10px]"
            >
              Edit Profile
            </button>
            <button 
              onClick={logout}
              className="btn-industrial btn-accent py-2 px-4 flex items-center text-[10px]"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-16">
        {(isConfirmingCheckout || checkoutNotice) && (
          <div className={`mb-6 border rounded-sm p-4 ${isConfirmingCheckout ? 'bg-surface border-line text-muted' : 'bg-data/10 border-data/30 text-data'}`}>
            <p className="text-[11px] font-black uppercase tracking-widest">
              {isConfirmingCheckout ? 'Confirming subscription checkout...' : checkoutNotice}
            </p>
          </div>
        )}

        {profileDataError && (
          <div className="mb-6 border rounded-sm p-4 bg-accent/10 border-accent/30 text-accent">
            <p className="text-[11px] font-black uppercase tracking-widest">{profileDataError}</p>
          </div>
        )}

        {/* Mobile tab grid */}
        {adminProfileLinks.length > 0 && (
          <div className="lg:hidden mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-muted">Administration</p>
            <div className="grid grid-cols-2 gap-2">
              {adminProfileLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="w-full min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-sm border text-[10px] font-black uppercase tracking-widest transition-colors overflow-hidden bg-surface border-line text-muted hover:border-accent/50 hover:text-ink"
                >
                  <item.icon size={14} className="shrink-0" />
                  <span className="truncate text-center">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="lg:hidden mb-8">
          <div className="grid grid-cols-2 gap-2">
            {profileTabItems.map((item) => (
            <button
              key={item.label}
              onClick={() => selectProfileTab(item.label)}
              className={`w-full min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-sm border text-[10px] font-black uppercase tracking-widest transition-colors overflow-hidden ${
                activeTab === item.label
                  ? 'bg-ink text-white border-ink'
                  : 'bg-surface border-line text-muted hover:border-accent/50 hover:text-ink'
              }`}
            >
              <item.icon size={14} className="shrink-0" />
              <span className="truncate text-center">{item.label}</span>
            </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-3 space-y-2">
            {adminProfileLinks.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.22em] text-muted">Administration</p>
                <div className="space-y-2">
                  {adminProfileLinks.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="w-full flex items-center space-x-4 p-4 text-xs font-black uppercase tracking-widest transition-colors rounded-sm text-muted hover:bg-surface hover:text-ink"
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {profileTabItems.map((item) => (
              <button 
                key={item.label}
                onClick={() => selectProfileTab(item.label)}
                className={`w-full flex items-center space-x-4 p-4 text-xs font-black uppercase tracking-widest transition-colors rounded-sm ${activeTab === item.label ? 'bg-ink text-white shadow-lg' : 'hover:bg-surface text-muted'}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div>
              {shouldShowProfileLoadingShell ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-surface border border-line" />
                  <div className="h-40 bg-surface border border-line" />
                  <div className="h-40 bg-surface border border-line" />
                </div>
              ) : (
                <>
              {activeTab === 'Overview' && renderOverview()}
              {activeTab === 'My Listings' && renderMyListings()}
              {activeTab === 'Search Alerts' && renderAlerts()}
              {activeTab === 'Inquiries' && renderInquiries()}
              {activeTab === 'Calls' && renderCalls()}
              {activeTab === 'Financing' && renderFinancing()}
              {activeTab === 'Inspections' && canViewInspectionRequests && renderInspections()}
              {activeTab === storefrontTabLabel && hasStorefrontAccess && renderStorefront()}
              {activeTab === 'Account Settings' && renderSettings()}
              {activeTab === 'Privacy & Data' && (
                <div className="space-y-12">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest">Account Data Management</h3>
                    <p className="text-xs text-muted uppercase tracking-widest leading-relaxed max-w-2xl">
                      Manage your account data, exports, and removal requests in one place.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-surface border border-line p-8 flex flex-col space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-data/10 rounded-full flex items-center justify-center">
                          <Download className="text-data" size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest">Export Account Data</h4>
                          <p className="text-[10px] text-muted uppercase tracking-widest mt-1">Download a full record of your account activity.</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Your export includes profile info, saved inventory, inquiries,
                        and account activity logs in JSON format.
                      </p>
                      <button 
                        onClick={handleExportData}
                        className="btn-industrial bg-bg py-4 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-ink hover:text-white transition-all"
                      >
                        Export My Data
                      </button>
                    </div>

                    <div className="bg-surface border border-line p-8 flex flex-col space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                          <Trash2 className="text-accent" size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest">Delete Account</h4>
                          <p className="text-[10px] text-muted uppercase tracking-widest mt-1">Remove your account and data from the system.</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        This action is permanent. All listings, inquiries, and profile data will be 
                        permanently removed from our systems.
                      </p>
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="btn-industrial btn-accent py-4 px-8 text-[10px] font-black uppercase tracking-widest"
                      >
                        Request Account Deletion
                      </button>
                    </div>
                  </div>

                  <div className="bg-ink text-white p-12 rounded-sm space-y-8">
                    <div className="flex items-center space-x-4">
                      <ClipboardList className="text-accent" size={32} />
                      <h3 className="text-xl font-black uppercase tracking-tighter">Account Status</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div className="flex flex-col space-y-2">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Profile Setup</span>
                        <span className="text-xs font-black uppercase tracking-widest text-data">Complete</span>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Billing Setup</span>
                        <span className="text-xs font-black uppercase tracking-widest text-data">Active</span>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Last Account Update</span>
                        <span className="text-xs font-black uppercase tracking-widest text-white">March 15, 2026</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
              {activeTab === 'Saved Equipment' && (
                <div className="space-y-8">
                  <h3 className="text-sm font-black uppercase tracking-widest">Saved Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedAssets.map(listing => (
                      <div key={listing.id} className="bg-surface border border-line overflow-hidden rounded-sm shadow-sm group">
                        <div className="aspect-video relative">
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => toggleFavorite(listing.id)}
                            className="absolute top-4 right-4 p-2 bg-ink/80 text-accent rounded-sm hover:bg-ink transition-colors"
                          >
                            <Bookmark size={16} fill="currentColor" />
                          </button>
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <span className="label-micro text-accent">{listing.category}</span>
                            <h4 className="text-lg font-black uppercase tracking-tighter">{listing.title}</h4>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-black tracking-tighter">{formatPrice(listing.price, listing.currency || 'USD', 0)}</span>
                            <button className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center hover:underline">
                              View Details <ArrowRight size={12} className="ml-1" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ListingModal 
        isOpen={isListingModalOpen}
        onClose={() => setIsListingModalOpen(false)}
        onSave={handleSaveListing}
        listing={selectedListing}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-ink/90 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-line p-12 max-w-md w-full rounded-sm space-y-8"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-accent" size={40} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Confirm Deletion</h3>
              <p className="text-xs text-muted leading-relaxed uppercase tracking-widest">
                Are you absolutely sure you want to delete your account? This action will permanently delete all your data from our system.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleDeleteAccount}
                className="btn-industrial btn-accent py-4 text-[10px] font-black uppercase tracking-widest"
              >
                Yes, Delete My Data
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-industrial bg-bg py-4 text-[10px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

