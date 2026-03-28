import { auth } from '../firebase';

export type DealerFeedSourceType = 'auto' | 'json' | 'xml' | 'csv';
export type DealerFeedSyncMode = 'pull' | 'push' | 'manual';
export type DealerFeedSyncFrequency = 'hourly' | 'daily' | 'weekly' | 'manual';

type TimestampLike = { toDate?: () => Date } | { seconds?: number; nanoseconds?: number } | string | number | null | undefined;

export interface DealerFeedFieldMapping {
  externalField: string;
  timberequipField: string;
}

export interface DealerFeedItem {
  externalId: string;
  title: string;
  price?: number;
  currency?: string;
  year?: number;
  manufacturer?: string;
  make?: string;
  model?: string;
  category?: string;
  subcategory?: string;
  condition?: string;
  location?: string;
  imageUrls?: string[];
  images?: string[];
  description?: string;
  hours?: number;
  stockNumber?: string;
  serialNumber?: string;
  dealerSourceUrl?: string;
  specs?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DealerFeedIngestResult {
  processed: number;
  upserted: number;
  skipped: number;
  archived?: number;
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
  detectedType: 'json' | 'xml' | 'csv';
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
  processedAt?: TimestampLike;
  createdAt?: TimestampLike;
  processed: number;
  upserted: number;
  created?: number;
  updated?: number;
  skipped: number;
  archived?: number;
  errors: string[];
  dryRun: boolean;
}

export interface DealerFeedAuditLog {
  id: string;
  dealerFeedId: string;
  sellerUid?: string;
  action: string;
  details: string;
  errorMessage?: string;
  itemsProcessed?: number;
  itemsSucceeded?: number;
  itemsFailed?: number;
  timestamp?: TimestampLike;
  metadata?: Record<string, unknown>;
}

export interface DealerFeedProfile {
  id: string;
  sellerUid: string;
  dealerName?: string;
  dealerEmail?: string;
  sourceName: string;
  sourceType: DealerFeedSourceType;
  rawInput?: string;
  feedUrl?: string;
  apiEndpoint?: string;
  status?: 'active' | 'paused' | 'disabled';
  syncMode?: DealerFeedSyncMode;
  syncFrequency?: DealerFeedSyncFrequency;
  nightlySyncEnabled: boolean;
  autoPublish?: boolean;
  fieldMapping?: DealerFeedFieldMapping[];
  totalListingsSynced?: number;
  totalListingsActive?: number;
  totalListingsDeleted?: number;
  totalListingsCreated?: number;
  totalListingsUpdated?: number;
  apiKeyMasked?: string;
  apiKey?: string;
  webhookSecretMasked?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  ingestUrl?: string;
  lastSyncAt?: TimestampLike;
  nextSyncAt?: TimestampLike;
  lastSyncStatus?: string;
  lastSyncMessage?: string;
  lastResolvedType?: DealerFeedSourceType;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

function normalizeDealerFeedProfile(profile: Partial<DealerFeedProfile> & { id: string }): DealerFeedProfile {
  return {
    id: String(profile.id || '').trim(),
    sellerUid: String(profile.sellerUid || '').trim(),
    dealerName: String(profile.dealerName || '').trim(),
    dealerEmail: String(profile.dealerEmail || '').trim(),
    sourceName: String(profile.sourceName || 'Dealer Feed').trim(),
    sourceType: (String(profile.sourceType || 'auto').trim() as DealerFeedSourceType),
    rawInput: String(profile.rawInput || ''),
    feedUrl: String(profile.feedUrl || ''),
    apiEndpoint: String(profile.apiEndpoint || ''),
    status: (String(profile.status || 'active').trim() as DealerFeedProfile['status']),
    syncMode: (String(profile.syncMode || 'pull').trim() as DealerFeedSyncMode),
    syncFrequency: (String(profile.syncFrequency || 'manual').trim() as DealerFeedSyncFrequency),
    nightlySyncEnabled: Boolean(profile.nightlySyncEnabled),
    autoPublish: profile.autoPublish !== false,
    fieldMapping: Array.isArray(profile.fieldMapping) ? profile.fieldMapping : [],
    totalListingsSynced: Number(profile.totalListingsSynced || 0),
    totalListingsActive: Number(profile.totalListingsActive || 0),
    totalListingsDeleted: Number(profile.totalListingsDeleted || 0),
    totalListingsCreated: Number(profile.totalListingsCreated || 0),
    totalListingsUpdated: Number(profile.totalListingsUpdated || 0),
    apiKeyMasked: String(profile.apiKeyMasked || ''),
    apiKey: String(profile.apiKey || ''),
    webhookSecretMasked: String(profile.webhookSecretMasked || ''),
    webhookSecret: String(profile.webhookSecret || ''),
    webhookUrl: String(profile.webhookUrl || ''),
    ingestUrl: String(profile.ingestUrl || ''),
    lastSyncAt: profile.lastSyncAt,
    nextSyncAt: profile.nextSyncAt,
    lastSyncStatus: String(profile.lastSyncStatus || ''),
    lastSyncMessage: String(profile.lastSyncMessage || ''),
    lastResolvedType: (String(profile.lastResolvedType || 'auto').trim() as DealerFeedSourceType),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

async function requestDealerFeedApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Unauthorized');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    body:
      init.body === undefined
        ? undefined
        : typeof init.body === 'string'
          ? init.body
          : JSON.stringify(init.body),
  });

  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Dealer feed request failed');
  }

  return payload as T;
}

export const dealerFeedService = {
  async getSavedProfiles(sellerUid: string): Promise<DealerFeedProfile[]> {
    const normalizedSellerUid = String(sellerUid || '').trim();
    if (!normalizedSellerUid) return [];

    const payload = await requestDealerFeedApi<{ feeds?: DealerFeedProfile[] }>(
      `/api/admin/dealer-feeds?sellerUid=${encodeURIComponent(normalizedSellerUid)}`
    );

    return Array.isArray(payload.feeds)
      ? payload.feeds.map((feed) => normalizeDealerFeedProfile(feed))
      : [];
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
      sourceName: String(profile.sourceName || '').trim() || 'Dealer Feed',
      sourceType: profile.sourceType,
      rawInput: String(profile.rawInput || ''),
      feedUrl: String(profile.feedUrl || ''),
      nightlySyncEnabled: typeof profile.nightlySyncEnabled === 'boolean' ? profile.nightlySyncEnabled : true,
    };

    if (profile.id) {
      const response = await requestDealerFeedApi<{ feed: DealerFeedProfile }>(
        `/api/admin/dealer-feeds/${encodeURIComponent(profile.id)}`,
        {
          method: 'PATCH',
          body: payload as unknown as BodyInit,
        }
      );
      return normalizeDealerFeedProfile(response.feed);
    }

    const response = await requestDealerFeedApi<{ feed: DealerFeedProfile }>(
      '/api/admin/dealer-feeds/register',
      {
        method: 'POST',
        body: payload as unknown as BodyInit,
      }
    );
    return normalizeDealerFeedProfile(response.feed);
  },

  async updateProfile(profileId: string, changes: {
    sourceName?: string;
    sourceType?: DealerFeedSourceType;
    rawInput?: string;
    feedUrl?: string;
    nightlySyncEnabled?: boolean;
    lastSyncStatus?: string;
    lastSyncMessage?: string;
    rotateCredentials?: boolean;
  }): Promise<void> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) {
      throw new Error('A valid feed profile is required.');
    }

    await requestDealerFeedApi<{ feed: DealerFeedProfile }>(
      `/api/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}`,
      {
        method: 'PATCH',
        body: changes as unknown as BodyInit,
      }
    );
  },

  async getProfile(profileId: string, options: { includeSecrets?: boolean } = {}): Promise<DealerFeedProfile> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) {
      throw new Error('A valid feed profile is required.');
    }

    const searchParams = new URLSearchParams();
    if (options.includeSecrets) {
      searchParams.set('includeSecrets', '1');
    }

    const response = await requestDealerFeedApi<{ feed: DealerFeedProfile }>(
      `/api/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    );

    return normalizeDealerFeedProfile(response.feed);
  },

  async deleteProfile(profileId: string): Promise<void> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) return;

    await requestDealerFeedApi<{ ok: boolean }>(
      `/api/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  async syncProfile(profileId: string, options: { dryRun?: boolean; fullSync?: boolean } = {}): Promise<DealerFeedIngestResult> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) {
      throw new Error('A valid feed profile is required.');
    }

    const response = await requestDealerFeedApi<{ result: DealerFeedIngestResult }>(
      `/api/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}/sync`,
      {
        method: 'POST',
        body: options as unknown as BodyInit,
      }
    );
    return response.result;
  },

  async getAuditLog(profileId: string, limitCount = 20): Promise<DealerFeedAuditLog[]> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) return [];

    const response = await requestDealerFeedApi<{ audit?: DealerFeedAuditLog[] }>(
      `/api/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}/audit?limit=${encodeURIComponent(String(limitCount))}`
    );

    return Array.isArray(response.audit) ? response.audit : [];
  },

  async resolveSource(params: {
    feedId?: string;
    sourceName: string;
    sourceType?: DealerFeedSourceType;
    rawInput?: string;
    feedUrl?: string;
    fieldMapping?: DealerFeedFieldMapping[];
  }): Promise<DealerFeedResolveResult> {
    return requestDealerFeedApi<DealerFeedResolveResult>(
      '/api/admin/dealer-feeds/resolve',
      {
        method: 'POST',
        body: params as unknown as BodyInit,
      }
    );
  },

  async ingest(params: {
    feedId?: string;
    sourceName: string;
    dealerId: string;
    dryRun: boolean;
    fullSync?: boolean;
    items: DealerFeedItem[];
  }): Promise<DealerFeedIngestResult> {
    return requestDealerFeedApi<DealerFeedIngestResult>(
      '/api/admin/dealer-feeds/ingest',
      {
        method: 'POST',
        body: params as unknown as BodyInit,
      }
    );
  },

  async getRecentLogs(limitCount = 20, dealerId?: string): Promise<DealerFeedLog[]> {
    const searchParams = new URLSearchParams();
    searchParams.set('limit', String(limitCount));
    if (dealerId) {
      searchParams.set('sellerUid', dealerId);
    }

    const response = await requestDealerFeedApi<{ logs?: DealerFeedLog[] }>(
      `/api/admin/dealer-feeds/logs?${searchParams.toString()}`
    );

    return Array.isArray(response.logs)
      ? response.logs.map((log) => ({
        id: String(log.id || ''),
        sourceName: String(log.sourceName || 'dealer_feed'),
        dealerId: String(log.dealerId || log.sellerUid || ''),
        sellerUid: String(log.sellerUid || log.dealerId || ''),
        processedAt: log.processedAt || log.createdAt,
        createdAt: log.createdAt,
        processed: Number(log.processed || 0),
        upserted: Number(log.upserted || 0),
        created: Number(log.created || 0),
        updated: Number(log.updated || 0),
        skipped: Number(log.skipped || 0),
        archived: Number(log.archived || 0),
        errors: Array.isArray(log.errors) ? log.errors.map((entry) => String(entry || '')) : [],
        dryRun: Boolean(log.dryRun),
      }))
      : [];
  },
};
