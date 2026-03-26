import { auth, db } from '../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export type DealerFeedSourceType = 'auto' | 'json' | 'xml';

export interface DealerFeedItem {
  externalId: string;
  title: string;
  price?: number;
  currency?: string;
  year?: number;
  manufacturer?: string;
  model?: string;
  category?: string;
  condition?: string;
  location?: string;
  imageUrls?: string[];
  description?: string;
  hours?: number;
  [key: string]: unknown;
}

export interface DealerFeedIngestResult {
  processed: number;
  upserted: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
  created?: number;
  updated?: number;
  dealerId?: string;
  sellerUid?: string;
  sourceName?: string;
  preview?: Array<{ externalId: string; title: string; action: 'insert' | 'update' | 'skip' }>;
}

export interface DealerFeedResolveResult {
  sourceName: string;
  detectedType: 'json' | 'xml';
  itemCount: number;
  items: DealerFeedItem[];
  preview: Array<{
    externalId: string;
    title: string;
    manufacturer?: string;
    model?: string;
    price?: number | null;
    category?: string;
  }>;
}

export interface DealerFeedLog {
  id: string;
  sourceName: string;
  dealerId: string;
  sellerUid?: string;
  processedAt?: { toDate?: () => Date } | string | number;
  createdAt?: { toDate?: () => Date } | string | number;
  processed: number;
  upserted: number;
  created?: number;
  updated?: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
}

export interface DealerFeedProfile {
  id: string;
  sellerUid: string;
  sourceName: string;
  sourceType: DealerFeedSourceType;
  rawInput?: string;
  feedUrl?: string;
  nightlySyncEnabled: boolean;
  lastSyncAt?: { toDate?: () => Date } | string | number;
  lastSyncStatus?: string;
  lastSyncMessage?: string;
  createdAt?: { toDate?: () => Date } | string | number;
  updatedAt?: { toDate?: () => Date } | string | number;
}

export const dealerFeedService = {
  async getSavedProfiles(sellerUid: string): Promise<DealerFeedProfile[]> {
    const normalizedSellerUid = String(sellerUid || '').trim();
    if (!normalizedSellerUid) return [];

    const snap = await getDocs(query(collection(db, 'dealerFeedProfiles'), where('sellerUid', '==', normalizedSellerUid)));

    return snap.docs
      .map((entry) => {
        const data = entry.data() as Record<string, unknown>;
        return {
          id: entry.id,
          sellerUid: String(data.sellerUid || normalizedSellerUid),
          sourceName: String(data.sourceName || 'Dealer Feed Profile'),
          sourceType: (String(data.sourceType || 'json') as DealerFeedSourceType),
          rawInput: String(data.rawInput || ''),
          feedUrl: String(data.feedUrl || ''),
          nightlySyncEnabled: Boolean(data.nightlySyncEnabled),
          lastSyncAt: data.lastSyncAt as DealerFeedProfile['lastSyncAt'],
          lastSyncStatus: String(data.lastSyncStatus || ''),
          lastSyncMessage: String(data.lastSyncMessage || ''),
          createdAt: data.createdAt as DealerFeedProfile['createdAt'],
          updatedAt: data.updatedAt as DealerFeedProfile['updatedAt'],
        };
      })
      .sort((a, b) => {
        const left = typeof a.updatedAt === 'object' && a.updatedAt && 'toDate' in a.updatedAt && typeof a.updatedAt.toDate === 'function'
          ? a.updatedAt.toDate().getTime()
          : new Date((a.updatedAt || a.createdAt || 0) as string | number).getTime();
        const right = typeof b.updatedAt === 'object' && b.updatedAt && 'toDate' in b.updatedAt && typeof b.updatedAt.toDate === 'function'
          ? b.updatedAt.toDate().getTime()
          : new Date((b.updatedAt || b.createdAt || 0) as string | number).getTime();
        return (right || 0) - (left || 0);
      });
  },

  async saveProfile(profile: {
    id?: string;
    sellerUid: string;
    sourceName: string;
    sourceType: DealerFeedSourceType;
    rawInput?: string;
    feedUrl?: string;
    nightlySyncEnabled?: boolean;
  }): Promise<DealerFeedProfile> {
    const normalizedSellerUid = String(profile.sellerUid || '').trim();
    if (!normalizedSellerUid) {
      throw new Error('A dealer account is required to save a feed profile.');
    }

    const payload = {
      sellerUid: normalizedSellerUid,
      sourceName: String(profile.sourceName || '').trim() || 'Dealer Feed Profile',
      sourceType: profile.sourceType,
      rawInput: String(profile.rawInput || ''),
      feedUrl: String(profile.feedUrl || ''),
      nightlySyncEnabled: typeof profile.nightlySyncEnabled === 'boolean' ? profile.nightlySyncEnabled : true,
      updatedAt: serverTimestamp(),
    };

    if (profile.id) {
      const docRef = doc(db, 'dealerFeedProfiles', profile.id);
      await updateDoc(docRef, payload);
      return {
        id: profile.id,
        ...payload,
      };
    }

    const docRef = await addDoc(collection(db, 'dealerFeedProfiles'), {
      ...payload,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...payload,
    };
  },

  async updateProfile(profileId: string, changes: {
    sourceName?: string;
    sourceType?: DealerFeedSourceType;
    rawInput?: string;
    feedUrl?: string;
    nightlySyncEnabled?: boolean;
    lastSyncStatus?: string;
    lastSyncMessage?: string;
  }): Promise<void> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) {
      throw new Error('A valid feed profile is required.');
    }

    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (typeof changes.sourceName === 'string') payload.sourceName = changes.sourceName.trim() || 'Dealer Feed Profile';
    if (typeof changes.sourceType === 'string') payload.sourceType = changes.sourceType;
    if (typeof changes.rawInput === 'string') payload.rawInput = changes.rawInput;
    if (typeof changes.feedUrl === 'string') payload.feedUrl = changes.feedUrl;
    if (typeof changes.nightlySyncEnabled === 'boolean') payload.nightlySyncEnabled = changes.nightlySyncEnabled;
    if (typeof changes.lastSyncStatus === 'string') payload.lastSyncStatus = changes.lastSyncStatus;
    if (typeof changes.lastSyncMessage === 'string') payload.lastSyncMessage = changes.lastSyncMessage;

    await updateDoc(doc(db, 'dealerFeedProfiles', normalizedProfileId), payload);
  },

  async deleteProfile(profileId: string): Promise<void> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) return;
    await deleteDoc(doc(db, 'dealerFeedProfiles', normalizedProfileId));
  },

  async resolveSource(params: {
    sourceName: string;
    sourceType?: DealerFeedSourceType;
    rawInput?: string;
    feedUrl?: string;
  }): Promise<DealerFeedResolveResult> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    const token = await user.getIdToken();
    const response = await fetch('/api/admin/dealer-feeds/resolve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error || 'Feed resolution failed');
    }

    return payload as DealerFeedResolveResult;
  },

  async ingest(params: {
    sourceName: string;
    dealerId: string;
    dryRun: boolean;
    items: DealerFeedItem[];
  }): Promise<DealerFeedIngestResult> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    const token = await user.getIdToken();
    const response = await fetch('/api/admin/dealer-feeds/ingest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error || 'Ingest request failed');
    }

    return payload as DealerFeedIngestResult;
  },

  async getRecentLogs(limitCount = 20, dealerId?: string): Promise<DealerFeedLog[]> {
    const constraints = [orderBy('createdAt', 'desc'), limit(limitCount)];
    if (dealerId) {
      constraints.unshift(where('sellerUid', '==', dealerId));
    }

    const snap = await getDocs(query(collection(db, 'dealerFeedIngestLogs'), ...constraints));
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const created = Number(data.created || 0);
      const updated = Number(data.updated || 0);
      const processed = Number(data.processed || data.totalReceived || created + updated + Number(data.skipped || 0));
      const upserted = Number(data.upserted || created + updated);
      const errors = Array.isArray(data.errors) ? data.errors.map((entry) => String(entry || '')) : [];

      return {
        id: d.id,
        sourceName: String(data.sourceName || 'dealer_feed'),
        dealerId: String(data.dealerId || data.sellerUid || ''),
        sellerUid: String(data.sellerUid || data.dealerId || ''),
        processedAt: (data.processedAt as DealerFeedLog['processedAt']) || (data.createdAt as DealerFeedLog['createdAt']),
        createdAt: data.createdAt as DealerFeedLog['createdAt'],
        processed,
        upserted,
        created,
        updated,
        skipped: Number(data.skipped || 0),
        errors,
        dryRun: Boolean(data.dryRun),
      } as DealerFeedLog;
    });
  },
};
