import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { AccountBootstrapResponse, UserProfile, ManagedSubAccountInput, UserRole, SavedSearch, AlertPreferences } from '../types';
import { getListingIdRemovalCandidates, normalizeListingId, normalizeListingIdList } from '../utils/listingIdentity';
import { sanitizeServiceAreaScopes } from '../constants/storefrontRegions';
import { normalizeScopedUserRole, supportsStorefrontRole } from '../utils/roleScopes';

function slugifyStorefrontValue(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}


const USER_PROFILE_CACHE_PREFIX = 'fes:user-profile-cache:';
const SAVED_SEARCH_CACHE_PREFIX = 'fes:saved-search-cache:';

function getCachedProfileStorageKey(uid: string): string {
  return `${USER_PROFILE_CACHE_PREFIX}${uid}`;
}

function readCachedProfile(uid: string): Partial<UserProfile> | null {
  if (typeof window === 'undefined' || !uid) return null;

  try {
    const raw = window.localStorage.getItem(getCachedProfileStorageKey(uid));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function getSavedSearchCacheKey(uid: string): string {
  return `${SAVED_SEARCH_CACHE_PREFIX}${uid}`;
}

function readCachedSavedSearches(uid: string): SavedSearch[] | null {
  if (typeof window === 'undefined' || !uid) return null;

  try {
    const raw = window.localStorage.getItem(getSavedSearchCacheKey(uid));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedSearch[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedSavedSearches(uid: string, searches: SavedSearch[]): void {
  if (typeof window === 'undefined' || !uid) return;

  try {
    window.localStorage.setItem(getSavedSearchCacheKey(uid), JSON.stringify(searches));
  } catch (error) {
    console.warn('Unable to write saved-search cache:', error);
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore ${operationType} error on ${path || 'unknown'}`);
  throw new Error(`Firestore ${operationType} failed`);
}

function isQuotaExceededFirestoreError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /quota limit exceeded|free daily read units per project|quota exceeded/i.test(message);
}

function sanitizeOptionalString(value: unknown, maxLength?: number): string | undefined {
  if (value === undefined) return undefined;
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  return typeof maxLength === 'number' ? normalized.slice(0, maxLength) : normalized;
}

function sanitizeOptionalUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function sanitizeOptionalStringArray(value: unknown, maxItems = 50, maxLength = 120): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((item) => (item.length > maxLength ? item.slice(0, maxLength) : item));

  return Array.from(new Set(normalized)).slice(0, maxItems);
}

function sanitizeOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizeSeoKeywords(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((keyword) => String(keyword || '').trim())
    .filter(Boolean)
    .slice(0, 30);
}

function sanitizeAccountAccessSource(value: unknown): UserProfile['accountAccessSource'] | undefined {
  if (value === undefined) return undefined;
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'free_member' || normalized === 'pending_checkout' || normalized === 'subscription' || normalized === 'admin_override' || normalized === 'managed_account') {
    return normalized as UserProfile['accountAccessSource'];
  }
  return undefined;
}

function sanitizeUserProfilePayload(payload: Partial<UserProfile>): Partial<UserProfile> {
  const sanitized: Partial<UserProfile> = { ...payload };
  delete sanitized.entitlement;

  if ('displayName' in payload) sanitized.displayName = sanitizeOptionalString(payload.displayName, 100) || '';
  if ('email' in payload) sanitized.email = sanitizeOptionalString(payload.email, 320)?.toLowerCase() || '';
  if ('phoneNumber' in payload) sanitized.phoneNumber = sanitizeOptionalString(payload.phoneNumber, 60) || '';
  if ('company' in payload) sanitized.company = sanitizeOptionalString(payload.company, 200) || '';
  if ('website' in payload) sanitized.website = sanitizeOptionalString(payload.website, 200) || '';
  if ('about' in payload) sanitized.about = sanitizeOptionalString(payload.about, 5000) || '';
  if ('bio' in payload) sanitized.bio = sanitizeOptionalString(payload.bio, 1000) || '';
  if ('location' in payload) sanitized.location = sanitizeOptionalString(payload.location, 200) || '';
  if ('storefrontLogoUrl' in payload) sanitized.storefrontLogoUrl = sanitizeOptionalUrl(payload.storefrontLogoUrl) ?? null;
  if ('businessName' in payload) sanitized.businessName = sanitizeOptionalString(payload.businessName, 200) || '';
  if ('street1' in payload) sanitized.street1 = sanitizeOptionalString(payload.street1, 180) || '';
  if ('street2' in payload) sanitized.street2 = sanitizeOptionalString(payload.street2, 180) || '';
  if ('city' in payload) sanitized.city = sanitizeOptionalString(payload.city, 120) || '';
  if ('state' in payload) sanitized.state = sanitizeOptionalString(payload.state, 120) || '';
  if ('county' in payload) sanitized.county = sanitizeOptionalString(payload.county, 120) || '';
  if ('postalCode' in payload) sanitized.postalCode = sanitizeOptionalString(payload.postalCode, 40) || '';
  if ('country' in payload) sanitized.country = sanitizeOptionalString(payload.country, 80) || '';
  if ('latitude' in payload) sanitized.latitude = sanitizeOptionalNumber(payload.latitude) ?? null;
  if ('longitude' in payload) sanitized.longitude = sanitizeOptionalNumber(payload.longitude) ?? null;
  if ('photoURL' in payload) sanitized.photoURL = sanitizeOptionalUrl(payload.photoURL) ?? null;
  if ('coverPhotoUrl' in payload) sanitized.coverPhotoUrl = sanitizeOptionalUrl(payload.coverPhotoUrl) ?? null;
  if ('storefrontName' in payload) sanitized.storefrontName = sanitizeOptionalString(payload.storefrontName, 180) || '';
  if ('storefrontSlug' in payload) sanitized.storefrontSlug = sanitizeOptionalString(payload.storefrontSlug, 200) || '';
  if ('storefrontTagline' in payload) sanitized.storefrontTagline = sanitizeOptionalString(payload.storefrontTagline, 240) || '';
  if ('storefrontDescription' in payload) sanitized.storefrontDescription = sanitizeOptionalString(payload.storefrontDescription, 5000) || '';
  if ('serviceAreaScopes' in payload) sanitized.serviceAreaScopes = sanitizeServiceAreaScopes(payload.serviceAreaScopes, 8);
  if ('serviceAreaStates' in payload) sanitized.serviceAreaStates = sanitizeOptionalStringArray(payload.serviceAreaStates, 80, 120) || [];
  if ('serviceAreaCounties' in payload) sanitized.serviceAreaCounties = sanitizeOptionalStringArray(payload.serviceAreaCounties, 120, 120) || [];
  if ('servicesOfferedCategories' in payload) sanitized.servicesOfferedCategories = sanitizeOptionalStringArray(payload.servicesOfferedCategories, 40, 120) || [];
  if ('servicesOfferedSubcategories' in payload) sanitized.servicesOfferedSubcategories = sanitizeOptionalStringArray(payload.servicesOfferedSubcategories, 120, 120) || [];
  if ('seoTitle' in payload) sanitized.seoTitle = sanitizeOptionalString(payload.seoTitle, 200) || '';
  if ('seoDescription' in payload) sanitized.seoDescription = sanitizeOptionalString(payload.seoDescription, 600) || '';
  if ('seoKeywords' in payload) sanitized.seoKeywords = sanitizeSeoKeywords(payload.seoKeywords) || [];
  if ('accountAccessSource' in payload) sanitized.accountAccessSource = sanitizeAccountAccessSource(payload.accountAccessSource) ?? null;
  if ('currentSubscriptionId' in payload) sanitized.currentSubscriptionId = sanitizeOptionalString(payload.currentSubscriptionId, 200) || null;
  if ('currentPeriodEnd' in payload) sanitized.currentPeriodEnd = payload.currentPeriodEnd ? String(payload.currentPeriodEnd) : null;
  if ('emailNotificationsEnabled' in payload) sanitized.emailNotificationsEnabled = Boolean(payload.emailNotificationsEnabled);
  if ('mfaEnabled' in payload) sanitized.mfaEnabled = Boolean(payload.mfaEnabled);
  if ('mfaMethod' in payload) {
    const normalizedMethod = String(payload.mfaMethod || '').trim().toLowerCase();
    sanitized.mfaMethod = normalizedMethod === 'sms' ? 'sms' : null;
  }
  if ('mfaPhoneNumber' in payload) sanitized.mfaPhoneNumber = sanitizeOptionalString(payload.mfaPhoneNumber, 80) || null;
  if ('mfaDisplayName' in payload) sanitized.mfaDisplayName = sanitizeOptionalString(payload.mfaDisplayName, 120) || null;
  if ('mfaEnrolledAt' in payload) sanitized.mfaEnrolledAt = payload.mfaEnrolledAt ? String(payload.mfaEnrolledAt) : null;
  if ('favorites' in payload) sanitized.favorites = normalizeListingIdList(payload.favorites);

  return sanitized;
}

function normalizeUserProfileRecord(profile: UserProfile): UserProfile {
  return {
    ...profile,
    favorites: normalizeListingIdList(profile.favorites),
  };
}

async function getAuthorizedJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawBody = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const fallbackMessage = rawBody.trim() || `Account request failed (${response.status}).`;
    throw new Error(String(payload?.error || fallbackMessage));
  }

  return payload as T;
}

type CurrentProfileResponse = AccountBootstrapResponse;

function deriveSeatContextFromProfile(profile: Partial<UserProfile> | null | undefined): {
  seatLimit: number;
  seatCount: number;
  activePlanIds: string[];
} {
  const activePlanId = String(profile?.activeSubscriptionPlanId || '').trim().toLowerCase();
  const managedAccountCap = typeof profile?.managedAccountCap === 'number' ? profile.managedAccountCap : 0;
  const planIds =
    activePlanId === 'dealer' || activePlanId === 'fleet_dealer'
      ? [activePlanId]
      : [];

  return {
    seatLimit: managedAccountCap > 0 ? managedAccountCap : planIds.length > 0 ? 3 : 0,
    seatCount: 0,
    activePlanIds: planIds,
  };
}

export const userService = {
  normalizeRole(role: string | undefined): UserRole {
    const normalized = normalizeScopedUserRole(role);
    if (normalized === 'admin') return 'admin';
    if (normalized === 'super_admin') return 'super_admin';
    if (normalized === 'developer') return 'developer';
    if (normalized === 'content_manager') return 'content_manager';
    if (normalized === 'editor') return 'editor';
    if (normalized === 'dealer') return 'dealer';
    if (normalized === 'pro_dealer') return 'pro_dealer';
    if (normalized === 'individual_seller') return 'individual_seller';
    if (normalized === 'member') return 'member';
    return 'member';
  },

  canCreateManagedRole(parentRole: UserRole, childRole: UserRole): boolean {
    const adminManagedRoles: UserRole[] = ['admin', 'developer', 'content_manager', 'editor', 'dealer', 'pro_dealer', 'individual_seller', 'member'];
    const dealerManagedRoles: UserRole[] = ['member'];

    if (parentRole === 'super_admin') return true;
    if (parentRole === 'admin') return adminManagedRoles.includes(childRole);
    if (parentRole === 'dealer' || parentRole === 'pro_dealer') return dealerManagedRoles.includes(childRole);
    return false;
  },

  supportsEnterpriseStorefront(role?: string): boolean {
    return supportsStorefrontRole(this.normalizeRole(role));
  },

  supportsManagedStorefrontSync(role?: string): boolean {
    const normalized = this.normalizeRole(role);
    return ['individual_seller', 'dealer', 'pro_dealer'].includes(normalized);
  },

  buildStorefrontSlug(value: string): string {
    return slugifyStorefrontValue(value) || 'timber-equip-storefront';
  },

  getCachedAccountBootstrap() {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return null;

    const cachedProfile = readCachedProfile(currentUid);
    if (!cachedProfile) return null;

    return {
      profile: cachedProfile as UserProfile,
      source: 'profile_cache',
      profileDocExists: true,
      firestoreQuotaLimited: false,
      seatContext: deriveSeatContextFromProfile(cachedProfile),
      seatContextSource: 'profile_fallback' as const,
      fetchedAt: new Date().toISOString(),
    };
  },

  async ensureUserProfileDocument(uid: string, seed: Partial<UserProfile> = {}): Promise<void> {
    const normalizedUid = String(uid || '').trim();
    if (!normalizedUid) {
      throw new Error('A valid user is required.');
    }

    const userRef = doc(db, 'users', normalizedUid);
    const existingSnapshot = await getDoc(userRef);
    if (existingSnapshot.exists()) {
      return;
    }

    const currentUser = auth.currentUser;
    const sanitizedSeed = sanitizeUserProfilePayload(seed);
    await setDoc(
      userRef,
      {
        uid: normalizedUid,
        favorites: [],
        email: currentUser?.email || '',
        displayName: currentUser?.displayName || 'Forestry Equipment Sales User',
        photoURL: currentUser?.photoURL || null,
        emailVerified: currentUser?.emailVerified || false,
        accountStatus: 'active',
        role: 'member',
        createdAt: serverTimestamp(),
        ...sanitizedSeed,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async generateUniqueStorefrontSlug(value: string, excludeUid?: string): Promise<string> {
    const baseSlug = this.buildStorefrontSlug(value);

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const snapshot = await getDocs(query(collection(db, 'storefronts'), where('storefrontSlug', '==', candidate), limit(2)));
      const collision = snapshot.docs.find((docSnap) => docSnap.id !== excludeUid);
      if (!collision) {
        return candidate;
      }
    }

    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
  },

  async saveStorefrontProfile(
    uid: string,
    input: {
      role?: UserRole;
      storefrontName: string;
      preferredSlug?: string;
      storefrontTagline?: string;
      storefrontDescription?: string;
      businessName?: string;
      street1?: string;
      street2?: string;
      city?: string;
      state?: string;
      county?: string;
      postalCode?: string;
      country?: string;
      latitude?: number | null;
      longitude?: number | null;
      serviceAreaScopes?: string[];
      serviceAreaStates?: string[];
      serviceAreaCounties?: string[];
      servicesOfferedCategories?: string[];
      servicesOfferedSubcategories?: string[];
      location?: string;
      phone?: string;
      email?: string;
      website?: string;
      logo?: string;
      coverPhotoUrl?: string;
      seoTitle?: string;
      seoDescription?: string;
      seoKeywords?: string[];
    }
  ): Promise<{ storefrontSlug: string; canonicalPath: string }> {
    const normalizedUid = String(uid || '').trim();
    if (!normalizedUid) {
      throw new Error('A valid user is required before saving storefront settings.');
    }

    const role = this.normalizeRole(input.role);
    if (!this.supportsEnterpriseStorefront(role)) {
      throw new Error('This account role does not support a public storefront.');
    }

    const storefrontName = String(input.storefrontName || '').trim();
    if (!storefrontName) {
      throw new Error('Storefront name is required.');
    }

    const storefrontRef = doc(db, 'storefronts', normalizedUid);
    const storefrontSnapshot = await getDoc(storefrontRef);
    const existingStorefront = storefrontSnapshot.exists() ? storefrontSnapshot.data() || {} : {};
    const preferredSlug = String(input.preferredSlug || '').trim();
    const seoKeywords = Array.isArray(input.seoKeywords)
      ? input.seoKeywords.map((keyword) => String(keyword || '').trim()).filter(Boolean).slice(0, 30)
      : [];
    const businessName = String(input.businessName || '').trim();
    const street1 = String(input.street1 || '').trim();
    const street2 = String(input.street2 || '').trim();
    const city = String(input.city || '').trim();
    const state = String(input.state || '').trim();

    const isDealerRole = role === 'dealer' || role === 'pro_dealer';
    const baseName = preferredSlug || String(existingStorefront.storefrontSlug || '').trim() || storefrontName;
    const requestedSlug = isDealerRole && city && state && !baseName.toLowerCase().includes(city.toLowerCase())
      ? `${baseName}-${city}-${state}`
      : baseName;
    const storefrontSlug = await this.generateUniqueStorefrontSlug(requestedSlug, normalizedUid);
    const canonicalPath = `/dealers/${storefrontSlug}`;
    const county = String(input.county || '').trim();
    const postalCode = String(input.postalCode || '').trim();
    const country = String(input.country || '').trim();
    const serviceAreaScopes = sanitizeServiceAreaScopes(input.serviceAreaScopes, 8);
    const serviceAreaStates = Array.from(new Set((input.serviceAreaStates || []).map((value) => String(value || '').trim()).filter(Boolean))).slice(0, 80);
    const serviceAreaCounties = Array.from(new Set((input.serviceAreaCounties || []).map((value) => String(value || '').trim()).filter(Boolean))).slice(0, 120);
    const servicesOfferedCategories = Array.from(new Set((input.servicesOfferedCategories || []).map((value) => String(value || '').trim()).filter(Boolean))).slice(0, 40);
    const servicesOfferedSubcategories = Array.from(new Set((input.servicesOfferedSubcategories || []).map((value) => String(value || '').trim()).filter(Boolean))).slice(0, 120);
    const normalizedLocation = String(input.location || '').trim() || [city, state, country].filter(Boolean).join(', ');

    if (auth.currentUser && auth.currentUser.uid === normalizedUid) {
      const payload = sanitizeUserProfilePayload({
        role,
        storefrontEnabled: true,
        storefrontSlug,
        storefrontName,
        storefrontTagline: String(input.storefrontTagline || '').trim(),
        storefrontDescription: String(input.storefrontDescription || '').trim(),
        businessName,
        street1,
        street2,
        city,
        state,
        county,
        postalCode,
        country,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        serviceAreaScopes,
        serviceAreaStates,
        serviceAreaCounties,
        servicesOfferedCategories,
        servicesOfferedSubcategories,
        location: normalizedLocation,
        phoneNumber: String(input.phone || '').trim(),
        email: String(input.email || '').trim(),
        website: String(input.website || '').trim(),
        storefrontLogoUrl: String(input.logo || '').trim(),
        coverPhotoUrl: String(input.coverPhotoUrl || '').trim(),
        seoTitle: String(input.seoTitle || '').trim(),
        seoDescription: String(input.seoDescription || '').trim(),
        seoKeywords,
      });

      await getAuthorizedJson<CurrentProfileResponse>('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      return { storefrontSlug, canonicalPath };
    }

    await this.ensureUserProfileDocument(normalizedUid, {
      role,
      storefrontEnabled: true,
    });

    await setDoc(doc(db, 'users', normalizedUid), {
      website: String(input.website || '').trim(),
      location: normalizedLocation,
      businessName,
      street1,
      street2,
      city,
      state,
      county,
      postalCode,
      country,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      phoneNumber: String(input.phone || '').trim(),
      coverPhotoUrl: String(input.coverPhotoUrl || '').trim(),
      storefrontLogoUrl: String(input.logo || '').trim(),
      storefrontEnabled: true,
      storefrontSlug,
      storefrontName,
      storefrontTagline: String(input.storefrontTagline || '').trim(),
      storefrontDescription: String(input.storefrontDescription || '').trim(),
      serviceAreaScopes,
      serviceAreaStates,
      serviceAreaCounties,
      servicesOfferedCategories,
      servicesOfferedSubcategories,
      seoTitle: String(input.seoTitle || '').trim(),
      seoDescription: String(input.seoDescription || '').trim(),
      seoKeywords,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(
      storefrontRef,
      {
        uid: normalizedUid,
        role,
        storefrontEnabled: true,
        storefrontSlug,
        canonicalPath,
        displayName: storefrontName,
        storefrontName,
        storefrontTagline: String(input.storefrontTagline || '').trim(),
        storefrontDescription: String(input.storefrontDescription || '').trim(),
        businessName,
        street1,
        street2,
        city,
        state,
        county,
        postalCode,
        country,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        location: normalizedLocation,
        phone: String(input.phone || '').trim(),
        email: String(input.email || '').trim(),
        website: String(input.website || '').trim(),
        logo: String(input.logo || '').trim(),
        coverPhotoUrl: String(input.coverPhotoUrl || '').trim(),
        serviceAreaScopes,
        serviceAreaStates,
        serviceAreaCounties,
        servicesOfferedCategories,
        servicesOfferedSubcategories,
        seoTitle: String(input.seoTitle || '').trim(),
        seoDescription: String(input.seoDescription || '').trim(),
        seoKeywords,
        createdAt: storefrontSnapshot.exists() ? existingStorefront.createdAt || serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { storefrontSlug, canonicalPath };
  },

  async syncStorefrontDocument(uid: string, profile: Partial<UserProfile> & { role?: UserRole }): Promise<void> {
    const normalizedUid = String(uid || '').trim();
    if (!normalizedUid) return;

    const role = this.normalizeRole(profile.role);
    if (!this.supportsEnterpriseStorefront(role)) return;

    const displayName = String(profile.displayName || profile.company || 'Forestry Equipment Sales Storefront').trim();
    const storefrontRef = doc(db, 'storefronts', normalizedUid);
    const requestedStorefrontSlug = String((profile as any).storefrontSlug || '').trim();
    const storefrontSlug = requestedStorefrontSlug
      || await this.generateUniqueStorefrontSlug(String((profile as any).storefrontName || displayName), normalizedUid);

    await setDoc(
      storefrontRef,
      {
        uid: normalizedUid,
        role,
        storefrontEnabled: true,
        storefrontSlug,
        canonicalPath: `/dealers/${storefrontSlug}`,
        displayName,
        storefrontName: String((profile as any).storefrontName || displayName).trim(),
        storefrontTagline: String((profile as any).storefrontTagline || '').trim(),
        storefrontDescription: String((profile as any).storefrontDescription || profile.about || '').trim(),
        location: String(profile.location || '').trim(),
        businessName: String((profile as any).businessName || profile.company || '').trim(),
        street1: String((profile as any).street1 || '').trim(),
        street2: String((profile as any).street2 || '').trim(),
        city: String((profile as any).city || '').trim(),
        state: String((profile as any).state || '').trim(),
        county: String((profile as any).county || '').trim(),
        postalCode: String((profile as any).postalCode || '').trim(),
        country: String((profile as any).country || '').trim(),
        latitude: sanitizeOptionalNumber((profile as any).latitude) ?? null,
        longitude: sanitizeOptionalNumber((profile as any).longitude) ?? null,
        phone: String(profile.phoneNumber || '').trim(),
        email: String(profile.email || '').trim(),
        website: String((profile as any).website || '').trim(),
        logo: String((profile as any).storefrontLogoUrl || profile.photoURL || '').trim(),
        coverPhotoUrl: String((profile as any).coverPhotoUrl || '').trim(),
        serviceAreaScopes: sanitizeServiceAreaScopes((profile as any).serviceAreaScopes, 8),
        serviceAreaStates: sanitizeOptionalStringArray((profile as any).serviceAreaStates, 80, 120) || [],
        serviceAreaCounties: sanitizeOptionalStringArray((profile as any).serviceAreaCounties, 120, 120) || [],
        servicesOfferedCategories: sanitizeOptionalStringArray((profile as any).servicesOfferedCategories, 40, 120) || [],
        servicesOfferedSubcategories: sanitizeOptionalStringArray((profile as any).servicesOfferedSubcategories, 120, 120) || [],
        seoTitle: String((profile as any).seoTitle || '').trim(),
        seoDescription: String((profile as any).seoDescription || '').trim(),
        seoKeywords: Array.isArray((profile as any).seoKeywords)
          ? (profile as any).seoKeywords.filter((keyword: unknown) => typeof keyword === 'string').slice(0, 30)
          : [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async getManagedAccountSeatContext(ownerUid: string): Promise<{ seatLimit: number; seatCount: number; activePlanIds: string[] }> {
    const normalizedOwnerUid = String(ownerUid || '').trim();
    if (!normalizedOwnerUid) {
      return { seatLimit: 0, seatCount: 0, activePlanIds: [] };
    }

    const currentUser = auth.currentUser;
    const cachedBootstrap = this.getCachedAccountBootstrap();
    const cachedSeatContext = cachedBootstrap?.seatContext;

    if (
      currentUser &&
      cachedSeatContext &&
      String(cachedSeatContext.ownerUid || currentUser.uid).trim() === normalizedOwnerUid
    ) {
      return {
        seatLimit: Number(cachedSeatContext.seatLimit) || 0,
        seatCount: Number(cachedSeatContext.seatCount) || 0,
        activePlanIds: Array.isArray(cachedSeatContext.activePlanIds)
          ? cachedSeatContext.activePlanIds.map((planId) => String(planId || '').trim()).filter(Boolean)
          : [],
      };
    }

    if (auth.currentUser) {
      try {
        const token = await currentUser.getIdToken();
        const params = new URLSearchParams({ ownerUid: normalizedOwnerUid });
        const response = await fetch(`/api/account/seat-context?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const payload = await response.json().catch(() => ({}));
          return {
            seatLimit: Number(payload.seatLimit) || 0,
            seatCount: Number(payload.seatCount) || 0,
            activePlanIds: Array.isArray(payload.activePlanIds)
              ? payload.activePlanIds.map((planId: unknown) => String(planId || '').trim()).filter(Boolean)
              : [],
          };
        }
      } catch (error) {
        console.warn('Account seat-context API unavailable, using reduced entitlement fallback:', error);
      }
    }

    if (currentUser && currentUser.uid === normalizedOwnerUid) {
      try {
        const profileResponse = await this.getCurrentProfile();
        if (profileResponse.profile) {
          return deriveSeatContextFromProfile(profileResponse.profile);
        }
      } catch (error) {
        console.warn('Unable to derive seat context from authenticated profile fallback:', error);
      }
    }

    const cachedCurrentUserRole = currentUser ? this.normalizeRole(String((await currentUser.getIdTokenResult().catch(() => ({ claims: {} as Record<string, unknown> }))).claims.role || '')) : '';
    if (currentUser && (currentUser.uid === normalizedOwnerUid || ['super_admin', 'admin', 'developer'].includes(cachedCurrentUserRole))) {
      return { seatLimit: 0, seatCount: 0, activePlanIds: [] };
    }

    const [subscriptionsSnapshot, managedAccountsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'subscriptions'), where('userUid', '==', normalizedOwnerUid), where('status', '==', 'active'))),
      getDocs(query(collection(db, 'users'), where('parentAccountUid', '==', normalizedOwnerUid))),
    ]);

    const activePlanIds = Array.from(
      new Set(
        subscriptionsSnapshot.docs
          .map((snapshot) => String(snapshot.data()?.planId || '').trim())
          .filter((planId) => planId === 'dealer' || planId === 'fleet_dealer')
      )
    );

    const seatCount = managedAccountsSnapshot.docs.filter((snapshot) => {
      const status = String(snapshot.data()?.accountStatus || 'active').trim().toLowerCase();
      return status !== 'suspended';
    }).length;

    return {
      seatLimit: activePlanIds.length > 0 ? 3 : 0,
      seatCount,
      activePlanIds,
    };
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      if (auth.currentUser?.uid === uid) {
        const payload = await this.getCurrentProfile();
        return payload.profile || null;
      }

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return normalizeUserProfileRecord(docSnap.data() as UserProfile);
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async getAccountBootstrap(): Promise<AccountBootstrapResponse> {
    const path = 'account/bootstrap';
    try {
      return await getAuthorizedJson<AccountBootstrapResponse>('/api/account/bootstrap', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return {
        profile: null,
        source: 'error',
        profileDocExists: false,
        firestoreQuotaLimited: isQuotaExceededFirestoreError(error),
        seatContext: null,
        seatContextSource: 'unavailable',
      };
    }
  },

  async getCurrentProfile(): Promise<CurrentProfileResponse> {
    return this.getAccountBootstrap();
  },

  async createProfile(profile: UserProfile): Promise<void> {
    const path = `users/${profile.uid}`;
    try {
      const sanitizedProfile = sanitizeUserProfilePayload(profile);
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.uid === profile.uid) {
        await getAuthorizedJson<CurrentProfileResponse>('/api/account/profile/bootstrap', {
          method: 'POST',
          body: JSON.stringify(sanitizedProfile),
        });
        return;
      }

      await this.ensureUserProfileDocument(profile.uid, {
        ...sanitizedProfile,
        createdAt: serverTimestamp()
      });

      await this.syncStorefrontDocument(profile.uid, sanitizedProfile as UserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async toggleFavorite(uid: string, listingId: string, isFavorite: boolean): Promise<void> {
    const path = `users/${uid}`;
    try {
      const normalizedListingId = normalizeListingId(listingId);
      if (!normalizedListingId) return;

      await this.ensureUserProfileDocument(uid);
      const removalCandidates = getListingIdRemovalCandidates(normalizedListingId);
      await setDoc(doc(db, 'users', uid), {
        favorites: isFavorite ? arrayRemove(...removalCandidates) : arrayUnion(normalizedListingId)
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const path = `users/${uid}`;
    try {
      const sanitizedUpdates = sanitizeUserProfilePayload(updates);
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.uid === uid) {
        await getAuthorizedJson<CurrentProfileResponse>('/api/account/profile', {
          method: 'PATCH',
          body: JSON.stringify(sanitizedUpdates),
        });
        return;
      }

      await setDoc(doc(db, 'users', uid), {
        uid,
        ...sanitizedUpdates,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const storefrontExplicitKeys: Array<keyof UserProfile> = [
        'storefrontSlug',
        'storefrontName',
        'storefrontTagline',
        'storefrontDescription',
        'seoTitle',
        'seoDescription',
        'seoKeywords',
      ];

      const storefrontMirrorKeys: Array<keyof UserProfile> = [
        'displayName',
        'email',
        'phoneNumber',
        'company',
        'website',
        'about',
        'bio',
        'location',
        'storefrontLogoUrl',
        'businessName',
        'street1',
        'street2',
        'city',
        'state',
        'county',
        'postalCode',
        'country',
        'latitude',
        'longitude',
        'serviceAreaScopes',
        'serviceAreaStates',
        'serviceAreaCounties',
        'servicesOfferedCategories',
        'servicesOfferedSubcategories',
        'photoURL',
        'coverPhotoUrl',
        'role',
      ];

      const hasExplicitStorefrontUpdate = storefrontExplicitKeys.some((key) => key in sanitizedUpdates);
      const hasMirroredStorefrontUpdate = storefrontMirrorKeys.some((key) => key in sanitizedUpdates);
      const shouldSyncStorefront = hasExplicitStorefrontUpdate || hasMirroredStorefrontUpdate;
      if (shouldSyncStorefront) {
        let roleForSync = sanitizedUpdates.role ? this.normalizeRole(sanitizedUpdates.role) : undefined;

        if (!roleForSync && auth.currentUser) {
          try {
            const tokenResult = await auth.currentUser.getIdTokenResult();
            roleForSync = this.normalizeRole(String(tokenResult.claims.role || ''));
          } catch (tokenError) {
            console.warn('Unable to resolve role claims for storefront sync:', tokenError);
          }
        }

        const canAutoSyncStorefront = roleForSync && (
          hasExplicitStorefrontUpdate
            ? this.supportsEnterpriseStorefront(roleForSync)
            : this.supportsManagedStorefrontSync(roleForSync)
        );

        if (roleForSync && canAutoSyncStorefront) {
          try {
            await this.syncStorefrontDocument(uid, {
              ...sanitizedUpdates,
              role: roleForSync,
            });
          } catch (syncError) {
            console.warn('Profile updated, but storefront sync was skipped:', syncError);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async createManagedSubAccountDirect(input: ManagedSubAccountInput): Promise<string> {
    const path = 'users';
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required to create managed sub-accounts.');
    }

    const creatorProfileResponse = await this.getCurrentProfile();
    const creatorProfile = creatorProfileResponse.profile || null;
    if (!creatorProfile) {
      throw new Error('Creator profile not found.');
    }

    const creatorRole = this.normalizeRole(creatorProfile.role);
    const targetRole = this.normalizeRole(input.role);
    const ownerUid = creatorRole === 'pro_dealer' ? (creatorProfile.parentAccountUid || currentUser.uid) : currentUser.uid;

    if (!this.canCreateManagedRole(creatorRole, targetRole)) {
      throw new Error('You do not have permission to create this account role.');
    }

    if (creatorRole === 'dealer' || creatorRole === 'pro_dealer') {
      const seatContext = await this.getManagedAccountSeatContext(ownerUid);
      if (seatContext.seatLimit < 1) {
        throw new Error('An active Dealer or Pro Dealer subscription is required before adding managed accounts.');
      }
      if (seatContext.seatCount >= seatContext.seatLimit) {
        throw new Error(`Your current subscription includes up to ${seatContext.seatLimit} managed accounts. Remove one before adding another.`);
      }
    }

    const newUserRef = doc(collection(db, path));
    const subAccount: UserProfile = {
      uid: newUserRef.id,
      email: input.email,
      displayName: input.displayName,
      role: targetRole,
      accountAccessSource: 'managed_account',
      phoneNumber: input.phoneNumber || '',
      company: input.company || creatorProfile.company || '',
      parentAccountUid: ownerUid,
      accountStatus: 'pending',
      favorites: [],
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(newUserRef, {
        ...subAccount,
        createdAt: serverTimestamp(),
        createdByUid: currentUser.uid,
        managedByRole: creatorRole
      });
      return newUserRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${newUserRef.id}`);
      return '';
    }
  },

  async createManagedSubAccount(input: ManagedSubAccountInput): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required to create managed sub-accounts.');
    }

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/admin/users/create-managed-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: input.displayName,
          email: input.email,
          role: input.role,
          company: input.company,
          phoneNumber: input.phoneNumber,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to create managed account.');
      }

      return String(payload.id || '');
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Unable to reach the managed account invitation service.');
      }
      throw error;
    }
  },

  async createSavedSearch(input: {
    name: string;
    filters: Record<string, string>;
    alertEmail: string;
    alertPreferences: AlertPreferences;
  }): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required to save a search.');

    const path = 'savedSearches';
    try {
      const payload = await getAuthorizedJson<{ savedSearch?: SavedSearch | null }>('/api/account/saved-searches', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (payload.savedSearch) {
        const cached = readCachedSavedSearches(currentUser.uid) || [];
        const nextSavedSearches = [payload.savedSearch, ...cached.filter((entry) => entry.id !== payload.savedSearch?.id)];
        writeCachedSavedSearches(currentUser.uid, nextSavedSearches);
      }
      return payload.savedSearch?.id || '';
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async getSavedSearches(uid?: string): Promise<SavedSearch[]> {
    const currentUser = auth.currentUser;
    const userUid = uid || currentUser?.uid;
    if (!userUid) return [];

    const path = 'savedSearches';
    try {
      if (currentUser && currentUser.uid === userUid) {
        const payload = await getAuthorizedJson<{ savedSearches?: SavedSearch[] }>('/api/account/saved-searches', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        const savedSearches = Array.isArray(payload.savedSearches) ? payload.savedSearches : [];
        writeCachedSavedSearches(userUid, savedSearches);
        return savedSearches;
      }

      const q = query(collection(db, path), where('userUid', '==', userUid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((savedSearchDoc) => ({
        id: savedSearchDoc.id,
        ...(savedSearchDoc.data() as Omit<SavedSearch, 'id'>)
      }));
    } catch (error) {
      if (currentUser && currentUser.uid === userUid) {
        const cached = readCachedSavedSearches(userUid);
        if (Array.isArray(cached)) {
          console.warn(
            isQuotaExceededFirestoreError(error)
              ? 'Saved searches are temporarily unavailable because the Firestore daily read quota is exhausted.'
              : 'Using cached saved searches because the live request is unavailable.',
            error
          );
          return cached;
        }
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<void> {
    const path = `savedSearches/${id}`;
    try {
      if (auth.currentUser) {
        const payload = await getAuthorizedJson<{ savedSearch?: SavedSearch | null }>(`/api/account/saved-searches/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        if (payload.savedSearch && auth.currentUser?.uid) {
          const cached = readCachedSavedSearches(auth.currentUser.uid) || [];
          const nextSavedSearches = cached.map((entry) => (entry.id === id ? payload.savedSearch! : entry));
          writeCachedSavedSearches(auth.currentUser.uid, nextSavedSearches);
        }
        return;
      }

      await updateDoc(doc(db, 'savedSearches', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteSavedSearch(id: string): Promise<void> {
    const path = `savedSearches/${id}`;
    try {
      if (auth.currentUser) {
        await getAuthorizedJson<{ deleted?: boolean }>(`/api/account/saved-searches/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (auth.currentUser?.uid) {
          const cached = readCachedSavedSearches(auth.currentUser.uid) || [];
          writeCachedSavedSearches(auth.currentUser.uid, cached.filter((entry) => entry.id !== id));
        }
        return;
      }

      await deleteDoc(doc(db, 'savedSearches', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToProfile(
    uid: string,
    callback: (profile: UserProfile | null, meta?: { exists?: boolean; error?: Error }) => void
  ) {
    if (auth.currentUser?.uid === uid && typeof window !== 'undefined') {
      let cancelled = false;

      const emitProfile = async () => {
        try {
          const payload = await this.getCurrentProfile();
          if (cancelled) return;
          callback(payload.profile || null, {
            exists: Boolean(payload.profileDocExists ?? payload.profile),
          });
        } catch (error) {
          if (cancelled) return;
          callback(null, {
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      };

      void emitProfile();
      const intervalId = window.setInterval(() => {
        void emitProfile();
      }, 60000);

      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };
    }

    const path = `users/${uid}`;
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(normalizeUserProfileRecord(docSnap.data() as UserProfile), { exists: true });
      } else {
        callback(null, { exists: false });
      }
    }, (error) => {
      if (isQuotaExceededFirestoreError(error)) {
        console.warn('User profile snapshot is temporarily unavailable because Firestore read quota is exhausted.', { path });
      } else {
        console.error('User profile snapshot error:', error, { path });
      }
      callback(null, { error: error instanceof Error ? error : new Error(String(error)) });
    });
  },

  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. ");
      }
    }
  }
};
