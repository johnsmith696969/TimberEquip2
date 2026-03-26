import { auth } from '../firebase';
import { Account, UserRole } from '../types';

interface AdminUserUpdateInput {
  displayName: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  role: UserRole;
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

  async updateUser(uid: string, input: AdminUserUpdateInput): Promise<Account> {
    const payload = await getAuthorizedJson<{ user: Account }>(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });

    return payload.user;
  },

  async sendPasswordReset(uid: string): Promise<void> {
    await getAuthorizedJson(`/api/admin/users/${encodeURIComponent(uid)}/reset-password`, {
      method: 'POST',
    });
  },

  async lockUser(uid: string): Promise<Account> {
    const payload = await getAuthorizedJson<{ user: Account }>(`/api/admin/users/${encodeURIComponent(uid)}/lock`, {
      method: 'POST',
    });

    return payload.user;
  },

  async unlockUser(uid: string): Promise<Account> {
    const payload = await getAuthorizedJson<{ user: Account }>(`/api/admin/users/${encodeURIComponent(uid)}/unlock`, {
      method: 'POST',
    });

    return payload.user;
  },

  async deleteUser(uid: string): Promise<void> {
    await getAuthorizedJson(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    });
  },
};
