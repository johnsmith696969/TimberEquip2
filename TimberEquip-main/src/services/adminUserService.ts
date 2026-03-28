import { auth } from '../firebase';
import { Account, UserRole } from '../types';

const ADMIN_USER_CACHE_KEY = 'te-admin-users-cache-v1';

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

export interface AdminUserMutationResult {
  user?: Account;
  message?: string;
  warning?: string;
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
    const fallbackMessage = rawBody.trim() || `Admin user request failed (${response.status}).`;
    throw new Error(String(payload?.error || fallbackMessage));
  }

  return payload as T;
}

export const adminUserService = {
  async getUsers(): Promise<Account[]> {
    try {
      const users = await getAuthorizedJson<Account[]>('/api/admin/users', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
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
