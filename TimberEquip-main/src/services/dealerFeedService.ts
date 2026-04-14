import { API_BASE } from '../constants/api';
import { auth } from '../firebase';

const DEALER_FEED_CACHE_PREFIX = 'te-dealer-feed-cache-v1';

type DealerFeedCacheEnvelope<T> = {
  savedAt: string;
  data: T;
};

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
  imageTitles?: string[];
  videoUrls?: string[];
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

function isQuotaExceededDealerFeedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /quota limit exceeded|free daily read units per project|quota exceeded|daily read quota is exhausted/i.test(message);
}

function getDealerFeedCacheKey(scope: string): string {
  const uid = auth.currentUser?.uid || 'anonymous';
  return `${DEALER_FEED_CACHE_PREFIX}:${uid}:${scope}`;
}

function readDealerFeedCache<T>(scope: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getDealerFeedCacheKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DealerFeedCacheEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'data' in (parsed as DealerFeedCacheEnvelope<T>)) {
      return ((parsed as DealerFeedCacheEnvelope<T>).data ?? null) as T | null;
    }
    return parsed as T;
  } catch (error) {
    console.warn(`Unable to read dealer feed cache for ${scope}:`, error);
    return null;
  }
}

function writeDealerFeedCache<T>(scope: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: DealerFeedCacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(getDealerFeedCacheKey(scope), JSON.stringify(payload));
  } catch (error) {
    console.warn(`Unable to write dealer feed cache for ${scope}:`, error);
  }
}

function clearDealerFeedCacheScope(scope: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(getDealerFeedCacheKey(scope));
  } catch (error) {
    console.warn(`Unable to clear dealer feed cache for ${scope}:`, error);
  }
}

function clearDealerFeedCachePrefix(scopePrefix: string): void {
  if (typeof window === 'undefined') return;

  try {
    const keyPrefix = getDealerFeedCacheKey(scopePrefix);
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(keyPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn(`Unable to clear dealer feed cache prefix for ${scopePrefix}:`, error);
  }
}

function clearDealerFeedCaches(profileId?: string, sellerUid?: string): void {
  clearDealerFeedCachePrefix('profiles:');
  clearDealerFeedCachePrefix('recent-logs:');

  if (profileId) {
    clearDealerFeedCachePrefix(`profile:${profileId}`);
    clearDealerFeedCachePrefix(`audit:${profileId}:`);
  }

  if (sellerUid) {
    clearDealerFeedCacheScope(`profiles:${sellerUid}`);
  }
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
    const cacheScope = `profiles:${normalizedSellerUid}`;

    try {
      const payload = await requestDealerFeedApi<{ feeds?: DealerFeedProfile[] }>(
        `${API_BASE}/admin/dealer-feeds?sellerUid=${encodeURIComponent(normalizedSellerUid)}`
      );

      const feeds = Array.isArray(payload.feeds)
        ? payload.feeds.map((feed) => normalizeDealerFeedProfile(feed))
        : [];
      writeDealerFeedCache(cacheScope, feeds);
      return feeds;
    } catch (error) {
      const cached = readDealerFeedCache<DealerFeedProfile[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn(
          isQuotaExceededDealerFeedError(error)
            ? 'Dealer feed profiles are temporarily unavailable because the Firestore daily read quota is exhausted.'
            : 'Using cached dealer feed profiles because the live request is unavailable.',
          error
        );
        return cached;
      }
      throw error;
    }
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
        `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(profile.id)}`,
        {
          method: 'PATCH',
          body: payload as unknown as BodyInit,
        }
      );
      const normalized = normalizeDealerFeedProfile(response.feed);
      clearDealerFeedCaches(normalized.id, normalized.sellerUid || normalizedSellerUid);
      writeDealerFeedCache(`profile:${normalized.id}:public`, normalized);
      return normalized;
    }

    const response = await requestDealerFeedApi<{ feed: DealerFeedProfile }>(
      `${API_BASE}/admin/dealer-feeds/register`,
      {
        method: 'POST',
        body: payload as unknown as BodyInit,
      }
    );
    const normalized = normalizeDealerFeedProfile(response.feed);
    clearDealerFeedCaches(normalized.id, normalized.sellerUid || normalizedSellerUid);
    writeDealerFeedCache(`profile:${normalized.id}:public`, normalized);
    return normalized;
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

    const response = await requestDealerFeedApi<{ feed: DealerFeedProfile }>(
      `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}`,
      {
        method: 'PATCH',
        body: changes as unknown as BodyInit,
      }
    );
    const normalized = normalizeDealerFeedProfile(response.feed);
    clearDealerFeedCaches(normalizedProfileId, normalized.sellerUid);
    writeDealerFeedCache(`profile:${normalizedProfileId}:public`, normalized);
  },

  async getProfile(profileId: string, options: { includeSecrets?: boolean } = {}): Promise<DealerFeedProfile> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) {
      throw new Error('A valid feed profile is required.');
    }
    const cacheScope = `profile:${normalizedProfileId}:${options.includeSecrets ? 'secrets' : 'public'}`;

    const searchParams = new URLSearchParams();
    if (options.includeSecrets) {
      searchParams.set('includeSecrets', '1');
    }

    try {
      const response = await requestDealerFeedApi<{ feed: DealerFeedProfile }>(
        `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );

      const normalized = normalizeDealerFeedProfile(response.feed);
      writeDealerFeedCache(cacheScope, normalized);
      return normalized;
    } catch (error) {
      const cached = readDealerFeedCache<DealerFeedProfile>(cacheScope);
      if (cached) {
        console.warn(
          isQuotaExceededDealerFeedError(error)
            ? 'Dealer feed profile details are temporarily unavailable because the Firestore daily read quota is exhausted.'
            : 'Using cached dealer feed profile because the live request is unavailable.',
          error
        );
        return cached;
      }
      throw error;
    }
  },

  async deleteProfile(profileId: string): Promise<void> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) return;

    await requestDealerFeedApi<{ ok: boolean }>(
      `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}`,
      {
        method: 'DELETE',
      }
    );
    clearDealerFeedCaches(normalizedProfileId);
  },

  async syncProfile(profileId: string, options: { dryRun?: boolean; fullSync?: boolean } = {}): Promise<DealerFeedIngestResult> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) {
      throw new Error('A valid feed profile is required.');
    }

    const response = await requestDealerFeedApi<{ result: DealerFeedIngestResult }>(
      `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}/sync`,
      {
        method: 'POST',
        body: options as unknown as BodyInit,
      }
    );
    clearDealerFeedCaches(normalizedProfileId);
    return response.result;
  },

  async getAuditLog(profileId: string, limitCount = 20): Promise<DealerFeedAuditLog[]> {
    const normalizedProfileId = String(profileId || '').trim();
    if (!normalizedProfileId) return [];
    const cacheScope = `audit:${normalizedProfileId}:${limitCount}`;

    try {
      const response = await requestDealerFeedApi<{ audit?: DealerFeedAuditLog[] }>(
        `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(normalizedProfileId)}/audit?limit=${encodeURIComponent(String(limitCount))}`
      );

      const audit = Array.isArray(response.audit) ? response.audit : [];
      writeDealerFeedCache(cacheScope, audit);
      return audit;
    } catch (error) {
      const cached = readDealerFeedCache<DealerFeedAuditLog[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn(
          isQuotaExceededDealerFeedError(error)
            ? 'Dealer feed audit logs are temporarily unavailable because the Firestore daily read quota is exhausted.'
            : 'Using cached dealer feed audit logs because the live request is unavailable.',
          error
        );
        return cached;
      }
      throw error;
    }
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
      `${API_BASE}/admin/dealer-feeds/resolve`,
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
      `${API_BASE}/admin/dealer-feeds/ingest`,
      {
        method: 'POST',
        body: params as unknown as BodyInit,
      }
    );
  },

  async getRecentLogs(limitCount = 20, dealerId?: string): Promise<DealerFeedLog[]> {
    const normalizedDealerId = String(dealerId || '').trim();
    const cacheScope = `recent-logs:${normalizedDealerId || 'all'}:${limitCount}`;
    const searchParams = new URLSearchParams();
    searchParams.set('limit', String(limitCount));
    if (normalizedDealerId) {
      searchParams.set('sellerUid', normalizedDealerId);
    }

    try {
      const response = await requestDealerFeedApi<{ logs?: DealerFeedLog[] }>(
        `${API_BASE}/admin/dealer-feeds/logs?${searchParams.toString()}`
      );

      const logs = Array.isArray(response.logs)
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
      writeDealerFeedCache(cacheScope, logs);
      return logs;
    } catch (error) {
      const cached = readDealerFeedCache<DealerFeedLog[]>(cacheScope);
      if (Array.isArray(cached)) {
        console.warn(
          isQuotaExceededDealerFeedError(error)
            ? 'Dealer feed logs are temporarily unavailable because the Firestore daily read quota is exhausted.'
            : 'Using cached dealer feed logs because the live request is unavailable.',
          error
        );
        return cached;
      }
      throw error;
    }
  },

  /* ── Widget Config ──────────────────────────────────────── */
  async getWidgetConfig(dealerId: string): Promise<Record<string, unknown>> {
    const normalizedDealerId = String(dealerId || '').trim();
    if (!normalizedDealerId) return {};
    return requestDealerFeedApi<{ config: Record<string, unknown> }>(
      `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(normalizedDealerId)}/widget-config`
    ).then((res) => res.config || {});
  },

  async saveWidgetConfig(
    dealerId: string,
    config: {
      cardStyle?: string;
      accentColor?: string;
      fontFamily?: string;
      darkMode?: boolean;
      showInquiry?: boolean;
      showCall?: boolean;
      showDetails?: boolean;
      pageSize?: number;
      customCss?: string;
    }
  ): Promise<Record<string, unknown>> {
    const normalizedDealerId = String(dealerId || '').trim();
    if (!normalizedDealerId) throw new Error('Dealer ID is required.');
    return requestDealerFeedApi<{ config: Record<string, unknown> }>(
      `${API_BASE}/admin/dealer-feeds/${encodeURIComponent(normalizedDealerId)}/widget-config`,
      { method: 'PATCH', body: config as unknown as BodyInit }
    ).then((res) => res.config || {});
  },

  /* ── Webhook Subscriptions ──────────────────────────────── */
  async getWebhooks(sellerUid: string): Promise<Array<{
    id: string;
    callbackUrl: string;
    events: string[];
    active: boolean;
    secretMasked: string;
    failureCount: number;
    lastDeliveryAt?: unknown;
    createdAt?: unknown;
  }>> {
    const normalizedUid = String(sellerUid || '').trim();
    if (!normalizedUid) return [];
    return requestDealerFeedApi<{ webhooks: Array<Record<string, unknown>> }>(
      `${API_BASE}/admin/dealer-feeds/webhooks?sellerUid=${encodeURIComponent(normalizedUid)}`
    ).then((res) =>
      (res.webhooks || []).map((w) => ({
        id: String(w.id || ''),
        callbackUrl: String(w.callbackUrl || ''),
        events: Array.isArray(w.events) ? w.events.map((e: unknown) => String(e)) : [],
        active: Boolean(w.active),
        secretMasked: String(w.secretMasked || ''),
        failureCount: Number(w.failureCount || 0),
        lastDeliveryAt: w.lastDeliveryAt,
        createdAt: w.createdAt,
      }))
    );
  },

  async createWebhook(params: {
    sellerUid: string;
    callbackUrl: string;
    events?: string[];
  }): Promise<{ id: string; secret: string; callbackUrl: string; events: string[]; active: boolean }> {
    return requestDealerFeedApi<{ id: string; secret: string; callbackUrl: string; events: string[]; active: boolean }>(
      `${API_BASE}/admin/dealer-feeds/webhooks`,
      { method: 'POST', body: params as unknown as BodyInit }
    );
  },

  async deleteWebhook(webhookId: string): Promise<void> {
    await requestDealerFeedApi<{ ok: boolean }>(
      `${API_BASE}/admin/dealer-feeds/webhooks/${encodeURIComponent(webhookId)}`,
      { method: 'DELETE' }
    );
  },

  async testWebhook(webhookId: string): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
    return requestDealerFeedApi<{ ok: boolean; statusCode?: number; error?: string }>(
      `${API_BASE}/admin/dealer-feeds/webhooks/${encodeURIComponent(webhookId)}/test`,
      { method: 'POST' }
    );
  },

  async revealWebhookSecret(webhookId: string): Promise<string> {
    return requestDealerFeedApi<{ secret: string }>(
      `${API_BASE}/admin/dealer-feeds/webhooks/${encodeURIComponent(webhookId)}/secret`
    ).then((res) => res.secret || '');
  },

  async getWebhookDeliveryLogs(sellerUid: string, limit = 20): Promise<Array<{
    id: string;
    webhookId: string;
    event: string;
    listingId: string;
    statusCode: number | null;
    success: boolean;
    deliveredAt?: unknown;
    errorMessage?: string;
  }>> {
    const normalizedUid = String(sellerUid || '').trim();
    if (!normalizedUid) return [];
    return requestDealerFeedApi<{ logs: Array<Record<string, unknown>> }>(
      `${API_BASE}/admin/dealer-feeds/webhook-logs?sellerUid=${encodeURIComponent(normalizedUid)}&limit=${limit}`
    ).then((res) =>
      (res.logs || []).map((l) => ({
        id: String(l.id || ''),
        webhookId: String(l.webhookId || ''),
        event: String(l.event || ''),
        listingId: String(l.listingId || ''),
        statusCode: l.statusCode != null ? Number(l.statusCode) : null,
        success: Boolean(l.success),
        deliveredAt: l.deliveredAt,
        errorMessage: l.errorMessage ? String(l.errorMessage) : undefined,
      }))
    );
  },
};
