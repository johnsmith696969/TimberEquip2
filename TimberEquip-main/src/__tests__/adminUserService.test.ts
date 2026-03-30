import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account } from '../types';

const { authMock, fetchMock } = vi.hoisted(() => ({
  authMock: {
    currentUser: null as any,
  },
  fetchMock: vi.fn(),
}));

vi.mock('../firebase', () => ({
  auth: authMock,
}));

import { adminUserService } from '../services/adminUserService';

const ADMIN_USER_CACHE_KEY = 'te-admin-users-cache-v1';
const ADMIN_BOOTSTRAP_CACHE_KEY = 'te-admin-operations-cache-v1';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as any;
}

function setAuthenticatedAdmin(uid = 'admin-1') {
  authMock.currentUser = {
    uid,
    email: 'admin@example.com',
    getIdToken: vi.fn().mockResolvedValue('token-123'),
  };
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: overrides.id || 'user-1',
    name: overrides.name || 'Dealer Account',
    displayName: overrides.displayName || 'Dealer Account',
    email: overrides.email || 'dealer@example.com',
    phone: overrides.phone || '612-555-0101',
    phoneNumber: overrides.phoneNumber || '612-555-0101',
    company: overrides.company || 'Dealer Co.',
    role: overrides.role || 'dealer',
    status: overrides.status || 'Active',
    accountStatus: overrides.accountStatus || 'active',
    lastLogin: overrides.lastLogin || '2026-03-30T00:00:00.000Z',
    memberSince: overrides.memberSince || '2026-03-01T00:00:00.000Z',
    createdAt: overrides.createdAt || '2026-03-30T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-03-30T00:00:00.000Z',
    totalListings: overrides.totalListings ?? 0,
    totalLeads: overrides.totalLeads ?? 0,
  } as Account;
}

describe('adminUserService bootstrap cache coverage', () => {
  beforeEach(() => {
    setAuthenticatedAdmin();
    fetchMock.mockReset();
    window.localStorage.clear();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('normalizes admin bootstrap payloads and caches users plus the full bootstrap envelope', async () => {
    const users = [makeAccount({ id: 'user-1' })];
    fetchMock.mockResolvedValueOnce(jsonResponse({
      users,
      partial: false,
      firestoreQuotaLimited: false,
      fetchedAt: '2026-03-30T01:00:00.000Z',
    }));

    const result = await adminUserService.getAdminOperationsBootstrap();

    expect(result.users).toEqual(users);
    expect(result.inquiries).toEqual([]);
    expect(result.calls).toEqual([]);
    expect(result.degradedSections).toEqual([]);
    expect(result.errors).toEqual({});
    expect(result.fetchedAt).toBe('2026-03-30T01:00:00.000Z');

    const cachedUsers = JSON.parse(window.localStorage.getItem(ADMIN_USER_CACHE_KEY) || '{}');
    const cachedBootstrap = JSON.parse(window.localStorage.getItem(ADMIN_BOOTSTRAP_CACHE_KEY) || '{}');
    expect(cachedUsers.data).toEqual(users);
    expect(cachedBootstrap.data.users).toEqual(users);
  });

  it('returns the cached bootstrap payload when the live request fails', async () => {
    const cachedBootstrap = {
      users: [makeAccount({ id: 'cached-user' })],
      inquiries: [],
      calls: [],
      partial: true,
      degradedSections: ['calls'],
      errors: { calls: 'Temporarily unavailable' },
      firestoreQuotaLimited: true,
      fetchedAt: '2026-03-30T02:00:00.000Z',
    };
    window.localStorage.setItem(ADMIN_BOOTSTRAP_CACHE_KEY, JSON.stringify({
      savedAt: '2026-03-30T02:05:00.000Z',
      data: cachedBootstrap,
    }));
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const result = await adminUserService.getAdminOperationsBootstrap();

    expect(result).toEqual(cachedBootstrap);
  });

  it('falls back to cached users when the full admin bootstrap cache is unavailable', async () => {
    const cachedUsers = [makeAccount({ id: 'cached-user' })];
    window.localStorage.setItem(ADMIN_USER_CACHE_KEY, JSON.stringify({
      savedAt: '2026-03-30T03:05:00.000Z',
      data: cachedUsers,
    }));
    fetchMock.mockRejectedValueOnce(new Error('daily read quota is exhausted'));

    const result = await adminUserService.getAdminOperationsBootstrap();

    expect(result.users).toEqual(cachedUsers);
    expect(result.partial).toBe(true);
    expect(result.degradedSections).toEqual(['live_request']);
    expect(result.firestoreQuotaLimited).toBe(true);
    expect(result.errors.users).toBe('Using cached admin user data.');
  });

  it('returns an empty list for getUsers when the live request fails without cache and quota is exhausted', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Quota exceeded: free daily read units per project'));

    const result = await adminUserService.getUsers();

    expect(result).toEqual([]);
  });
});
