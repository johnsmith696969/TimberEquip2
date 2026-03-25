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

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Admin user request failed.');
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