import { auth } from '../firebase';
import { Account, CallLog, Inquiry, UserRole } from '../types';

const ADMIN_USER_CACHE_KEY = 'te-admin-users-cache-v1';
const ADMIN_BOOTSTRAP_CACHE_KEY = 'te-admin-operations-cache-v1';

type AdminUserCacheEnvelope<T> = {
  savedAt: string;
  data: T;
};

function isQuotaExceededAdminUserError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /quota limit exceeded|free daily read units per project|quota exceeded|daily read quota is exhausted/i.test(message);
}

function readAdminUserCache<T>(): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ADMIN_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUserCacheEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'data' in (parsed as AdminUserCacheEnvelope<T>)) {
      return ((parsed as AdminUserCacheEnvelope<T>).data ?? null) as T | null;
    }
    return parsed as T;
  } catch (error) {
    console.warn('Unable to read cached admin users:', error);
    return null;
  }
}

function writeAdminUserCache<T>(data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: AdminUserCacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(ADMIN_USER_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to write cached admin users:', error);
  }
}

interface AdminUserUpdateInput {
  displayName: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  role: UserRole;
}

export interface AdminOperationsBootstrapResponse {
  users: Account[];
  inquiries: Inquiry[];
  calls: CallLog[];
  partial: boolean;
  degradedSections: string[];
  errors: Partial<Record<'users' | 'inquiries' | 'calls', string>>;
  firestoreQuotaLimited: boolean;
  fetchedAt: string;
}

function readAdminBootstrapCache<T>(): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ADMIN_BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUserCacheEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'data' in (parsed as AdminUserCacheEnvelope<T>)) {
      return ((parsed as AdminUserCacheEnvelope<T>).data ?? null) as T | null;
    }
    return parsed as T;
  } catch (error) {
    console.warn('Unable to read cached admin operations bootstrap:', error);
    return null;
  }
}

function writeAdminBootstrapCache<T>(data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: AdminUserCacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(ADMIN_BOOTSTRAP_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to write cached admin operations bootstrap:', error);
  }
}

export interface AdminUserMutationResult {
  user?: Account;
  message?: string;
  warning?: string;
}

function getApiRequestUrls(input: RequestInfo | URL): string[] {
  const rawInput = typeof input === 'string' ? input : input instanceof URL ? input.toString() : String(input);
  if (typeof window === 'undefined' || !rawInput.startsWith('/api/')) {
    return [rawInput];
  }

  const urls = [rawInput];
  const hostname = window.location.hostname.trim().toLowerCase();
  if (hostname === 'www.timberequip.com') {
    urls.push(`https://timberequip.com${rawInput}`);
  }

  return Array.from(new Set(urls));
}

async function fetchApiWithFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urls = getApiRequestUrls(input);
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    try {
      const response = await fetch(url, init);
      if (response.ok || index === urls.length - 1 || response.status !== 404) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (index === urls.length - 1) {
        throw error;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error('Admin API request failed');
}

async function getAuthorizedJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetchApiWithFallback(input, {
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
    const fallbackMessage = rawBody.trim() || `Admin user request failed (${response.status}).`;
    throw new Error(String(payload?.error || fallbackMessage));
  }

  return payload as T;
}

export const adminUserService = {
  async getAdminOperationsBootstrap(): Promise<AdminOperationsBootstrapResponse> {
    try {
      const payload = await getAuthorizedJson<AdminOperationsBootstrapResponse>('/api/admin/bootstrap', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const normalized: AdminOperationsBootstrapResponse = {
        users: Array.isArray(payload?.users) ? payload.users : [],
        inquiries: Array.isArray(payload?.inquiries) ? payload.inquiries : [],
        calls: Array.isArray(payload?.calls) ? payload.calls : [],
        partial: Boolean(payload?.partial),
        degradedSections: Array.isArray(payload?.degradedSections) ? payload.degradedSections : [],
        errors: typeof payload?.errors === 'object' && payload?.errors ? payload.errors : {},
        firestoreQuotaLimited: Boolean(payload?.firestoreQuotaLimited),
        fetchedAt: String(payload?.fetchedAt || new Date().toISOString()),
      };

      writeAdminUserCache(normalized.users);
      writeAdminBootstrapCache(normalized);
      return normalized;
    } catch (error) {
      const cachedBootstrap = readAdminBootstrapCache<AdminOperationsBootstrapResponse>();
      if (cachedBootstrap && typeof cachedBootstrap === 'object') {
        console.warn('Using cached admin operations bootstrap because the live request failed:', error);
        return cachedBootstrap;
      }
      const cachedUsers = readAdminUserCache<Account[]>();
      if (Array.isArray(cachedUsers) && cachedUsers.length > 0) {
        return {
          users: cachedUsers,
          inquiries: [],
          calls: [],
          partial: true,
          degradedSections: ['live_request'],
          errors: {
            users: 'Using cached admin user data.',
          },
          firestoreQuotaLimited: isQuotaExceededAdminUserError(error),
          fetchedAt: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  async getUsers(): Promise<Account[]> {
    try {
      const { users } = await this.getAdminOperationsBootstrap();
      if (Array.isArray(users)) {
        writeAdminUserCache(users);
      }
      return users;
    } catch (error) {
      const cachedUsers = readAdminUserCache<Account[]>();
      if (Array.isArray(cachedUsers) && cachedUsers.length > 0) {
        console.warn('Using cached admin users because the live admin user directory request failed:', error);
        return cachedUsers;
      }
      if (isQuotaExceededAdminUserError(error)) {
        console.warn('Admin user directory is temporarily unavailable because the Firestore daily read quota is exhausted:', error);
        return [];
      }
      throw error;
    }
  },

  async updateUser(uid: string, input: AdminUserUpdateInput): Promise<AdminUserMutationResult> {
    const payload = await getAuthorizedJson<AdminUserMutationResult>(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });

    return payload;
  },

  async sendPasswordReset(uid: string): Promise<void> {
    await getAuthorizedJson(`/api/admin/users/${encodeURIComponent(uid)}/reset-password`, {
      method: 'POST',
    });
  },

  async lockUser(uid: string): Promise<AdminUserMutationResult> {
    return getAuthorizedJson<AdminUserMutationResult>(`/api/admin/users/${encodeURIComponent(uid)}/lock`, {
      method: 'POST',
    });
  },

  async unlockUser(uid: string): Promise<AdminUserMutationResult> {
    return getAuthorizedJson<AdminUserMutationResult>(`/api/admin/users/${encodeURIComponent(uid)}/unlock`, {
      method: 'POST',
    });
  },

  async deleteUser(uid: string): Promise<void> {
    await getAuthorizedJson(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    });
  },
};
