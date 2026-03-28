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
import {
  UserProfile,
  ManagedSubAccountInput,
  UserRole,
  SavedSearch,
  AlertPreferences,
  AccountBootstrapResponse,
} from '../types';

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

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
  if ('photoURL' in payload) sanitized.photoURL = sanitizeOptionalUrl(payload.photoURL) ?? null;
  if ('coverPhotoUrl' in payload) sanitized.coverPhotoUrl = sanitizeOptionalUrl(payload.coverPhotoUrl) ?? null;
  if ('storefrontName' in payload) sanitized.storefrontName = sanitizeOptionalString(payload.storefrontName, 180) || '';
  if ('storefrontSlug' in payload) sanitized.storefrontSlug = sanitizeOptionalString(payload.storefrontSlug, 200) || '';
  if ('storefrontTagline' in payload) sanitized.storefrontTagline = sanitizeOptionalString(payload.storefrontTagline, 240) || '';
  if ('storefrontDescription' in payload) sanitized.storefrontDescription = sanitizeOptionalString(payload.storefrontDescription, 5000) || '';
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

  return sanitized;
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

const ACCOUNT_BOOTSTRAP_CACHE_PREFIX = 'fes:account-bootstrap-cache:';

function getAccountBootstrapCacheKey(uid: string): string {
  return `${ACCOUNT_BOOTSTRAP_CACHE_PREFIX}${uid}`;
}

function readCachedAccountBootstrap(uid: string | null | undefined): CurrentProfileResponse | null {
  if (typeof window === 'undefined' || !uid) return null;

  try {
    const raw = window.localStorage.getItem(getAccountBootstrapCacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CurrentProfileResponse;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Unable to read cached account bootstrap:', error);
    return null;
  }
}

function writeCachedAccountBootstrap(payload: CurrentProfileResponse | null | undefined): void {
  if (typeof window === 'undefined') return;
  const uid = payload?.profile?.uid || auth.currentUser?.uid;
  if (!uid || !payload) return;

  try {
    window.localStorage.setItem(getAccountBootstrapCacheKey(uid), JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to write cached account bootstrap:', error);
  }
}

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
    const normalized = (role || '').toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'super_admin') return 'super_admin';
    if (normalized === 'developer') return 'developer';
    if (normalized === 'content_manager') return 'content_manager';
    if (normalized === 'editor') return 'editor';
    if (normalized === 'dealer_staff') return 'dealer';
    if (normalized === 'dealer') return 'dealer';
    if (normalized === 'dealer_manager' || normalized === 'pro_dealer') return 'pro_dealer';
    if (normalized === 'individual_seller') return 'individual_seller';
    if (normalized === 'member') return 'member';
    return 'buyer';
  },

  canCreateManagedRole(parentRole: UserRole, childRole: UserRole): boolean {
    const adminManagedRoles: UserRole[] = ['admin', 'developer', 'content_manager', 'editor', 'dealer', 'pro_dealer', 'individual_seller', 'member', 'buyer'];
    const dealerManagedRoles: UserRole[] = ['member', 'buyer'];

    if (parentRole === 'super_admin') return true;
    if (parentRole === 'admin') return adminManagedRoles.includes(childRole);
    if (parentRole === 'dealer' || parentRole === 'pro_dealer') return dealerManagedRoles.includes(childRole);
    return false;
  },

  supportsEnterpriseStorefront(role?: string): boolean {
    const normalized = this.normalizeRole(role);
    return ['individual_seller', 'dealer', 'pro_dealer', 'admin', 'super_admin'].includes(normalized);
  },

  supportsManagedStorefrontSync(role?: string): boolean {
    const normalized = this.normalizeRole(role);
    return ['individual_seller', 'dealer', 'pro_dealer'].includes(normalized);
  },

  buildStorefrontSlug(value: string): string {
    return slugifyStorefrontValue(value) || 'timber-equip-storefront';
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
        role: 'buyer',
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
    const requestedSlug = preferredSlug || String(existingStorefront.storefrontSlug || '').trim() || storefrontName;
    const storefrontSlug = await this.generateUniqueStorefrontSlug(requestedSlug, normalizedUid);
    const canonicalPath = `/seller/${storefrontSlug}`;
    const seoKeywords = Array.isArray(input.seoKeywords)
      ? input.seoKeywords.map((keyword) => String(keyword || '').trim()).filter(Boolean).slice(0, 30)
      : [];

    await this.ensureUserProfileDocument(normalizedUid, {
      role,
      storefrontEnabled: true,
    });

    await setDoc(doc(db, 'users', normalizedUid), {
      website: String(input.website || '').trim(),
      location: String(input.location || '').trim(),
      phoneNumber: String(input.phone || '').trim(),
      coverPhotoUrl: String(input.coverPhotoUrl || '').trim(),
      storefrontEnabled: true,
      storefrontSlug,
      storefrontName,
      storefrontTagline: String(input.storefrontTagline || '').trim(),
      storefrontDescription: String(input.storefrontDescription || '').trim(),
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
        location: String(input.location || '').trim(),
        phone: String(input.phone || '').trim(),
        email: String(input.email || '').trim(),
        website: String(input.website || '').trim(),
        logo: String(input.logo || '').trim(),
        coverPhotoUrl: String(input.coverPhotoUrl || '').trim(),
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
        canonicalPath: `/seller/${storefrontSlug}`,
        displayName,
        storefrontName: String((profile as any).storefrontName || displayName).trim(),
        storefrontTagline: String((profile as any).storefrontTagline || '').trim(),
        storefrontDescription: String((profile as any).storefrontDescription || profile.about || '').trim(),
        location: String(profile.location || '').trim(),
        phone: String(profile.phoneNumber || '').trim(),
        email: String(profile.email || '').trim(),
        website: String((profile as any).website || '').trim(),
        logo: String((profile as any).storefrontLogoUrl || profile.photoURL || '').trim(),
        coverPhotoUrl: String((profile as any).coverPhotoUrl || '').trim(),
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
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async getCurrentProfile(): Promise<CurrentProfileResponse> {
    const path = 'account/bootstrap';
    const cachedBootstrap = readCachedAccountBootstrap(auth.currentUser?.uid);
    try {
      const payload = await getAuthorizedJson<CurrentProfileResponse>('/api/account/bootstrap', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      writeCachedAccountBootstrap(payload);
      return payload;
    } catch (error) {
      console.error('Account bootstrap request failed:', {
        path,
        error: error instanceof Error ? error.message : String(error),
        uid: auth.currentUser?.uid || null,
      });
      if (cachedBootstrap) {
        return {
          ...cachedBootstrap,
          source: 'cache',
          firestoreQuotaLimited: cachedBootstrap.firestoreQuotaLimited || isQuotaExceededFirestoreError(error),
          summaries: {
            adminUsers: cachedBootstrap.summaries?.adminUsers
              ? { ...cachedBootstrap.summaries.adminUsers, source: 'cache' }
              : null,
            billing: cachedBootstrap.summaries?.billing
              ? { ...cachedBootstrap.summaries.billing, source: 'cache' }
              : null,
            content: cachedBootstrap.summaries?.content
              ? { ...cachedBootstrap.summaries.content, source: 'cache' }
              : null,
          },
        };
      }
      return {
        profile: null,
        source: 'error',
        profileDocExists: false,
        firestoreQuotaLimited: isQuotaExceededFirestoreError(error),
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  getCachedAccountBootstrap(): CurrentProfileResponse | null {
    return readCachedAccountBootstrap(auth.currentUser?.uid);
  },

  async createProfile(profile: UserProfile): Promise<void> {
    const path = `users/${profile.uid}`;
    try {
      const sanitizedProfile = sanitizeUserProfilePayload(profile);
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.uid === profile.uid) {
        const payload = await getAuthorizedJson<CurrentProfileResponse>('/api/account/profile/bootstrap', {
          method: 'POST',
          body: JSON.stringify(sanitizedProfile),
        });
        writeCachedAccountBootstrap(payload);
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
      await this.ensureUserProfileDocument(uid);
      await setDoc(doc(db, 'users', uid), {
        favorites: isFavorite ? arrayRemove(listingId) : arrayUnion(listingId)
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
        const payload = await getAuthorizedJson<CurrentProfileResponse>('/api/account/profile', {
          method: 'PATCH',
          body: JSON.stringify(sanitizedUpdates),
        });
        writeCachedAccountBootstrap(payload);
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
        throw new Error('An active Dealer or Fleet Dealer subscription is required before adding managed accounts.');
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
        return Array.isArray(payload.savedSearches) ? payload.savedSearches : [];
      }

      const q = query(collection(db, path), where('userUid', '==', userUid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((savedSearchDoc) => ({
        id: savedSearchDoc.id,
        ...(savedSearchDoc.data() as Omit<SavedSearch, 'id'>)
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<void> {
    const path = `savedSearches/${id}`;
    try {
      if (auth.currentUser) {
        await getAuthorizedJson<{ savedSearch?: SavedSearch | null }>(`/api/account/saved-searches/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
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
        callback(docSnap.data() as UserProfile, { exists: true });
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
