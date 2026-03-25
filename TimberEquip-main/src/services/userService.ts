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
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { UserProfile, ManagedSubAccountInput, UserRole, SavedSearch, AlertPreferences } from '../types';

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

export const userService = {
  normalizeRole(role: string | undefined): UserRole {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'super_admin') return 'super_admin';
    if (normalized === 'developer') return 'developer';
    if (normalized === 'content_manager') return 'content_manager';
    if (normalized === 'editor') return 'editor';
    if (normalized === 'dealer') return 'dealer';
    if (normalized === 'dealer_manager') return 'dealer_manager';
    if (normalized === 'dealer_staff') return 'dealer_staff';
    if (normalized === 'individual_seller') return 'individual_seller';
    if (normalized === 'member') return 'member';
    return 'buyer';
  },

  canCreateManagedRole(parentRole: UserRole, childRole: UserRole): boolean {
    const adminManagedRoles: UserRole[] = ['admin', 'developer', 'content_manager', 'editor', 'dealer', 'dealer_manager', 'member', 'buyer'];
    const dealerManagedRoles: UserRole[] = ['dealer_manager', 'dealer_staff', 'member', 'buyer'];

    if (parentRole === 'super_admin') return true;
    if (parentRole === 'admin') return adminManagedRoles.includes(childRole);
    if (parentRole === 'dealer' || parentRole === 'dealer_manager') return dealerManagedRoles.includes(childRole);
    return false;
  },

  supportsEnterpriseStorefront(role?: string): boolean {
    const normalized = this.normalizeRole(role);
    return ['individual_seller', 'dealer', 'dealer_manager', 'admin', 'super_admin'].includes(normalized);
  },

  buildStorefrontSlug(value: string): string {
    return slugifyStorefrontValue(value) || 'timber-equip-storefront';
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

    await updateDoc(doc(db, 'users', normalizedUid), {
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
    });

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

    const displayName = String(profile.displayName || profile.company || 'TimberEquip Storefront').trim();
    const storefrontRef = doc(db, 'storefronts', normalizedUid);
    const storefrontSnapshot = await getDoc(storefrontRef);
    const existingStorefront = storefrontSnapshot.exists() ? storefrontSnapshot.data() || {} : {};
    const storefrontSlug = String((profile as any).storefrontSlug || existingStorefront.storefrontSlug || '').trim()
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
        createdAt: storefrontSnapshot.exists() ? existingStorefront.createdAt || serverTimestamp() : serverTimestamp(),
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

  async createProfile(profile: UserProfile): Promise<void> {
    const path = `users/${profile.uid}`;
    try {
      const docRef = doc(db, 'users', profile.uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: serverTimestamp()
      });

      await this.syncStorefrontDocument(profile.uid, profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async toggleFavorite(uid: string, listingId: string, isFavorite: boolean): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        favorites: isFavorite ? arrayRemove(listingId) : arrayUnion(listingId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      const currentProfile = await this.getProfile(uid);
      if (currentProfile) {
        await this.syncStorefrontDocument(uid, {
          ...currentProfile,
          ...updates,
          role: updates.role || currentProfile.role,
        });
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

    const creatorProfile = await this.getProfile(currentUser.uid);
    if (!creatorProfile) {
      throw new Error('Creator profile not found.');
    }

    const creatorRole = this.normalizeRole(creatorProfile.role);
    const targetRole = this.normalizeRole(input.role);
    const ownerUid = creatorRole === 'dealer_manager' ? (creatorProfile.parentAccountUid || currentUser.uid) : currentUser.uid;

    if (!this.canCreateManagedRole(creatorRole, targetRole)) {
      throw new Error('You do not have permission to create this account role.');
    }

    if (creatorRole === 'dealer' || creatorRole === 'dealer_manager') {
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
      const docRef = await addDoc(collection(db, path), {
        userUid: currentUser.uid,
        name: input.name,
        filters: input.filters,
        alertEmail: input.alertEmail,
        alertPreferences: input.alertPreferences,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
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
      await deleteDoc(doc(db, 'savedSearches', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const path = `users/${uid}`;
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('User profile snapshot error:', error, { path });
      callback(null);
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
