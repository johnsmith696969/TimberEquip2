import { auth } from '../firebase';
import { Account, UserRole } from '../types';

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
    return getAuthorizedJson<Account[]>('/api/admin/users', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
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
