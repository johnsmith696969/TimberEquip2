import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { registerManagedRolesRoutes, type ManagedRolesRouteDeps } from '../server/routes/managed-roles.js';

// ── Firestore mock helpers ────────────────────────────────────────────────────

interface MockDocSnapshot {
  exists: boolean;
  id: string;
  data: () => Record<string, unknown> | undefined;
}

function makeDocSnapshot(
  id: string,
  data: Record<string, unknown> | undefined,
  exists = true,
): MockDocSnapshot {
  return { exists, id, data: () => data };
}

function makeQuerySnapshot(docs: MockDocSnapshot[]) {
  return { docs, empty: docs.length === 0 };
}

// ── Factory helpers ───────────────────────────────────────────────────────────

function makeUserDoc(overrides: Record<string, unknown> = {}) {
  return {
    role: 'dealer',
    email: 'dealer@test.com',
    displayName: 'Dealer Owner',
    accountStatus: 'active',
    parentAccountUid: '',
    emailVerified: true,
    createdAt: { toDate: () => new Date('2026-01-15T00:00:00Z') },
    ...overrides,
  };
}

function makeStaffDoc(ownerUid: string, overrides: Record<string, unknown> = {}) {
  return {
    role: 'dealer_staff',
    email: 'staff@test.com',
    displayName: 'Staff Member',
    accountStatus: 'active',
    parentAccountUid: ownerUid,
    emailVerified: true,
    createdAt: { toDate: () => new Date('2026-02-01T00:00:00Z') },
    ...overrides,
  };
}

// ── Mock Express request/response ─────────────────────────────────────────────

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response & { _status: number; _json: unknown } {
  const res: any = {
    _status: 200,
    _json: undefined,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._json = body;
      return res;
    },
  };
  return res;
}

// ── Route handler capture ─────────────────────────────────────────────────────

type RouteHandler = (req: Request, res: Response) => Promise<unknown>;

interface CapturedRoutes {
  'GET /api/managed-roles': RouteHandler;
  'PATCH /api/managed-roles/:uid/role': RouteHandler;
  'POST /api/managed-roles/:uid/lock': RouteHandler;
  'POST /api/managed-roles/:uid/unlock': RouteHandler;
  'DELETE /api/managed-roles/:uid': RouteHandler;
  'POST /api/managed-roles/:uid/reset-password': RouteHandler;
}

function captureRoutes(deps: ManagedRolesRouteDeps): CapturedRoutes {
  const routes: Record<string, RouteHandler> = {};

  const fakeApp: any = {
    get(path: string, handler: RouteHandler) {
      routes[`GET ${path}`] = handler;
    },
    post(path: string, handler: RouteHandler) {
      routes[`POST ${path}`] = handler;
    },
    patch(path: string, handler: RouteHandler) {
      routes[`PATCH ${path}`] = handler;
    },
    delete(path: string, handler: RouteHandler) {
      routes[`DELETE ${path}`] = handler;
    },
  };

  registerManagedRolesRoutes(fakeApp, deps);
  return routes as unknown as CapturedRoutes;
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('managed-roles routes', () => {
  const OWNER_UID = 'dealer-owner-1';
  const STAFF_UID = 'staff-member-1';
  const SIBLING_UID = 'sibling-member-1';
  const ADMIN_UID = 'admin-user-1';

  let deps: ManagedRolesRouteDeps;
  let routes: CapturedRoutes;
  let docGetMock: ReturnType<typeof vi.fn>;
  let docUpdateMock: ReturnType<typeof vi.fn>;
  let queryGetMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    docGetMock = vi.fn();
    docUpdateMock = vi.fn().mockResolvedValue(undefined);
    queryGetMock = vi.fn();

    const docFn = vi.fn((id: string) => ({
      get: () => docGetMock(id),
      update: (data: unknown) => docUpdateMock(id, data),
    }));

    const collectionFn = vi.fn(() => ({
      doc: docFn,
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: queryGetMock,
          }),
        }),
      }),
    }));

    deps = {
      db: { collection: collectionFn } as any,
      auth: {
        verifyIdToken: vi.fn(),
      } as any,
      normalizeRole: vi.fn((v: unknown) => String(v || 'member')),
      isPrivilegedAdminEmail: vi.fn().mockReturnValue(false),
      sendServerEmail: vi.fn().mockResolvedValue(undefined),
      emailTemplates: {
        accountLocked: vi.fn().mockReturnValue('<p>Account locked</p>'),
        accountUnlocked: vi.fn().mockReturnValue('<p>Account unlocked</p>'),
        passwordReset: vi.fn().mockReturnValue('<p>Reset password</p>'),
      },
      APP_BASE_URL: 'https://www.timberequip.com',
    };

    routes = captureRoutes(deps);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Set up auth mock to return the given decoded token and user doc for the caller. */
  function authenticateAs(
    uid: string,
    userDoc: Record<string, unknown>,
    email = 'dealer@test.com',
  ) {
    (deps.auth.verifyIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      uid,
      email,
    });

    docGetMock.mockImplementation((id: string) => {
      if (id === uid) return Promise.resolve(makeDocSnapshot(id, userDoc));
      // default: not found
      return Promise.resolve(makeDocSnapshot(id, undefined, false));
    });
  }

  /** Set up auth + target user doc lookups for management operations. */
  function authenticateOwnerWithTarget(
    targetUid: string,
    targetDoc: Record<string, unknown>,
  ) {
    const ownerDoc = makeUserDoc({ parentAccountUid: '' });

    (deps.auth.verifyIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      uid: OWNER_UID,
      email: 'dealer@test.com',
    });

    docGetMock.mockImplementation((id: string) => {
      if (id === OWNER_UID) return Promise.resolve(makeDocSnapshot(id, ownerDoc));
      if (id === targetUid) return Promise.resolve(makeDocSnapshot(id, targetDoc));
      return Promise.resolve(makeDocSnapshot(id, undefined, false));
    });
  }

  // ── GET /api/managed-roles ──────────────────────────────────────────────────

  describe('GET /api/managed-roles', () => {
    it('returns team members for the authenticated dealer', async () => {
      authenticateAs(OWNER_UID, makeUserDoc());

      const staffData = makeStaffDoc(OWNER_UID);
      queryGetMock.mockResolvedValue(
        makeQuerySnapshot([makeDocSnapshot(STAFF_UID, staffData)]),
      );

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = mockRes();

      await routes['GET /api/managed-roles'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({
        users: [
          {
            uid: STAFF_UID,
            displayName: 'Staff Member',
            email: 'staff@test.com',
            role: 'dealer_staff',
            accountStatus: 'active',
            emailVerified: true,
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      });
    });

    it('returns 401 when no auth token is provided', async () => {
      const req = mockReq({ headers: {} });
      const res = mockRes();

      await routes['GET /api/managed-roles'](req, res);

      expect(res._status).toBe(401);
      expect(res._json).toEqual({ error: 'Unauthorized' });
    });

    it('returns 403 when a non-admin tries to view another owner\'s team', async () => {
      authenticateAs(OWNER_UID, makeUserDoc());

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        query: { ownerUid: 'some-other-dealer' },
      });
      const res = mockRes();

      await routes['GET /api/managed-roles'](req, res);

      expect(res._status).toBe(403);
      expect(res._json).toEqual({ error: 'Forbidden' });
    });

    it('allows admin to view another dealer\'s team members', async () => {
      authenticateAs(ADMIN_UID, makeUserDoc({ role: 'super_admin' }), 'admin@timberequip.com');
      (deps.normalizeRole as ReturnType<typeof vi.fn>).mockImplementation(
        (v: unknown) => String(v || 'member'),
      );

      queryGetMock.mockResolvedValue(makeQuerySnapshot([]));

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        query: { ownerUid: 'some-other-dealer' },
      });
      const res = mockRes();

      await routes['GET /api/managed-roles'](req, res);

      // The admin role check uses ADMIN_ROLES set. normalizeRole returns 'super_admin'.
      // isPrivilegedAdminEmail returns false by default, but 'super_admin' is in ADMIN_ROLES.
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ users: [] });
    });

    it('returns 500 when Firestore query fails', async () => {
      authenticateAs(OWNER_UID, makeUserDoc());
      queryGetMock.mockRejectedValue(new Error('Firestore unavailable'));

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = mockRes();

      await routes['GET /api/managed-roles'](req, res);

      expect(res._status).toBe(500);
      expect(res._json).toEqual({ error: 'Failed to load team members.' });
    });
  });

  // ── PATCH /api/managed-roles/:uid/role ──────────────────────────────────────

  describe('PATCH /api/managed-roles/:uid/role', () => {
    it('successfully changes role from dealer_staff to dealer_manager', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID, { role: 'dealer_staff' });
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      (deps.normalizeRole as ReturnType<typeof vi.fn>).mockImplementation(
        (v: unknown) => String(v || 'member'),
      );

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
        body: { role: 'dealer_manager' },
      });
      const res = mockRes();

      await routes['PATCH /api/managed-roles/:uid/role'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true, role: 'dealer_manager' });
      expect(docUpdateMock).toHaveBeenCalledWith(STAFF_UID, expect.objectContaining({
        role: 'dealer_manager',
      }));
    });

    it('returns 400 for an invalid (non-assignable) role', async () => {
      // normalizeRole will pass through whatever is given
      (deps.normalizeRole as ReturnType<typeof vi.fn>).mockImplementation(
        (v: unknown) => String(v || 'member'),
      );

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
        body: { role: 'super_admin' },
      });
      const res = mockRes();

      await routes['PATCH /api/managed-roles/:uid/role'](req, res);

      expect(res._status).toBe(400);
      expect((res._json as any).error).toContain('Invalid role');
      expect((res._json as any).error).toContain('dealer_manager');
    });

    it('returns 401 when no auth token is provided', async () => {
      (deps.normalizeRole as ReturnType<typeof vi.fn>).mockReturnValue('dealer_manager');

      const req = mockReq({
        headers: {},
        params: { uid: STAFF_UID },
        body: { role: 'dealer_manager' },
      });
      const res = mockRes();

      await routes['PATCH /api/managed-roles/:uid/role'](req, res);

      expect(res._status).toBe(401);
      expect(res._json).toEqual({ error: 'Unauthorized' });
    });

    it('returns 404 when target user does not exist', async () => {
      (deps.normalizeRole as ReturnType<typeof vi.fn>).mockReturnValue('dealer_manager');

      (deps.auth.verifyIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        uid: OWNER_UID,
        email: 'dealer@test.com',
      });

      docGetMock.mockImplementation((id: string) => {
        if (id === OWNER_UID) {
          return Promise.resolve(makeDocSnapshot(id, makeUserDoc()));
        }
        // Target not found
        return Promise.resolve(makeDocSnapshot(id, undefined, false));
      });

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: 'nonexistent-uid' },
        body: { role: 'dealer_manager' },
      });
      const res = mockRes();

      await routes['PATCH /api/managed-roles/:uid/role'](req, res);

      expect(res._status).toBe(404);
      expect(res._json).toEqual({ error: 'User not found.' });
    });
  });

  // ── POST /api/managed-roles/:uid/lock ───────────────────────────────────────

  describe('POST /api/managed-roles/:uid/lock', () => {
    it('sets accountStatus to locked and sends email', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID);
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/lock'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true, status: 'locked' });

      expect(docUpdateMock).toHaveBeenCalledWith(STAFF_UID, expect.objectContaining({
        accountStatus: 'locked',
        lockedByUid: OWNER_UID,
      }));

      expect(deps.sendServerEmail).toHaveBeenCalledWith({
        to: 'staff@test.com',
        subject: 'Your account has been locked',
        html: '<p>Account locked</p>',
      });

      expect(deps.emailTemplates!.accountLocked).toHaveBeenCalledWith({
        userName: 'Staff Member',
      });
    });

    it('still succeeds when email sending fails (non-critical)', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID);
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      (deps.sendServerEmail as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('SMTP down'),
      );

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/lock'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true, status: 'locked' });
    });
  });

  // ── POST /api/managed-roles/:uid/unlock ─────────────────────────────────────

  describe('POST /api/managed-roles/:uid/unlock', () => {
    it('sets accountStatus to active and sends email', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID, { accountStatus: 'locked' });
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/unlock'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true, status: 'active' });

      expect(docUpdateMock).toHaveBeenCalledWith(STAFF_UID, expect.objectContaining({
        accountStatus: 'active',
      }));

      expect(deps.sendServerEmail).toHaveBeenCalledWith({
        to: 'staff@test.com',
        subject: 'Your account has been unlocked',
        html: '<p>Account unlocked</p>',
      });

      expect(deps.emailTemplates!.accountUnlocked).toHaveBeenCalledWith({
        userName: 'Staff Member',
      });
    });
  });

  // ── DELETE /api/managed-roles/:uid ──────────────────────────────────────────

  describe('DELETE /api/managed-roles/:uid', () => {
    it('soft-deletes by setting accountStatus to removed', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID);
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['DELETE /api/managed-roles/:uid'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true });

      expect(docUpdateMock).toHaveBeenCalledWith(STAFF_UID, expect.objectContaining({
        accountStatus: 'removed',
        removedByUid: OWNER_UID,
      }));
    });
  });

  // ── POST /api/managed-roles/:uid/reset-password ─────────────────────────────

  describe('POST /api/managed-roles/:uid/reset-password', () => {
    it('sends password reset email to the target user', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID);
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/reset-password'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true });

      expect(deps.sendServerEmail).toHaveBeenCalledWith({
        to: 'staff@test.com',
        subject: 'Password Reset Request',
        html: '<p>Reset password</p>',
      });

      expect(deps.emailTemplates!.passwordReset).toHaveBeenCalledWith({
        userName: 'Staff Member',
        resetUrl: 'https://www.timberequip.com/reset-password?email=staff%40test.com',
      });
    });

    it('returns 400 when target user has no email', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID, { email: '' });
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/reset-password'](req, res);

      expect(res._status).toBe(400);
      expect(res._json).toEqual({ error: 'No email on file for this account.' });
      expect(deps.sendServerEmail).not.toHaveBeenCalled();
    });
  });

  // ── Authorization: sub-accounts cannot manage siblings ──────────────────────

  describe('authorization — sub-accounts cannot manage siblings', () => {
    it('returns 403 when a sub-account tries to manage a sibling', async () => {
      // Sibling is authenticated (they are a sub-account of OWNER_UID)
      const siblingDoc = makeStaffDoc(OWNER_UID, { role: 'dealer_manager' });
      const targetDoc = makeStaffDoc(OWNER_UID);

      (deps.auth.verifyIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        uid: SIBLING_UID,
        email: 'sibling@test.com',
      });

      docGetMock.mockImplementation((id: string) => {
        if (id === SIBLING_UID) return Promise.resolve(makeDocSnapshot(id, siblingDoc));
        if (id === STAFF_UID) return Promise.resolve(makeDocSnapshot(id, targetDoc));
        return Promise.resolve(makeDocSnapshot(id, undefined, false));
      });

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/lock'](req, res);

      expect(res._status).toBe(403);
      expect(res._json).toEqual({ error: 'Only the account owner can manage team members.' });
    });

    it('returns 403 when non-owner dealer tries to manage an unrelated user', async () => {
      // A dealer who is not the owner of the target user
      const unrelatedDealerDoc = makeUserDoc({
        role: 'dealer',
        parentAccountUid: '',
      });
      const targetDoc = makeStaffDoc('some-other-owner');

      (deps.auth.verifyIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        uid: 'unrelated-dealer',
        email: 'other@test.com',
      });

      docGetMock.mockImplementation((id: string) => {
        if (id === 'unrelated-dealer') return Promise.resolve(makeDocSnapshot(id, unrelatedDealerDoc));
        if (id === STAFF_UID) return Promise.resolve(makeDocSnapshot(id, targetDoc));
        return Promise.resolve(makeDocSnapshot(id, undefined, false));
      });

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['DELETE /api/managed-roles/:uid'](req, res);

      expect(res._status).toBe(403);
      expect(res._json).toEqual({ error: 'You can only manage your own team members.' });
    });

    it('allows admin to manage any user regardless of ownership', async () => {
      const adminDoc = makeUserDoc({ role: 'super_admin', parentAccountUid: '' });
      const targetDoc = makeStaffDoc('some-other-owner');

      (deps.auth.verifyIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        uid: ADMIN_UID,
        email: 'admin@timberequip.com',
      });

      (deps.normalizeRole as ReturnType<typeof vi.fn>).mockImplementation(
        (v: unknown) => String(v || 'member'),
      );

      docGetMock.mockImplementation((id: string) => {
        if (id === ADMIN_UID) return Promise.resolve(makeDocSnapshot(id, adminDoc));
        if (id === STAFF_UID) return Promise.resolve(makeDocSnapshot(id, targetDoc));
        return Promise.resolve(makeDocSnapshot(id, undefined, false));
      });

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/unlock'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true, status: 'active' });
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('skips email when emailTemplates is null', async () => {
      deps.emailTemplates = null;
      routes = captureRoutes(deps);

      const targetDoc = makeStaffDoc(OWNER_UID);
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/lock'](req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true, status: 'locked' });
      expect(deps.sendServerEmail).not.toHaveBeenCalled();
    });

    it('uses "User" as fallback name when displayName is empty', async () => {
      const targetDoc = makeStaffDoc(OWNER_UID, { displayName: '' });
      authenticateOwnerWithTarget(STAFF_UID, targetDoc);

      // Re-create templates to track calls in this test
      deps.emailTemplates = {
        accountLocked: vi.fn().mockReturnValue('<p>Locked</p>'),
        accountUnlocked: vi.fn().mockReturnValue('<p>Unlocked</p>'),
        passwordReset: vi.fn().mockReturnValue('<p>Reset</p>'),
      };
      routes = captureRoutes(deps);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { uid: STAFF_UID },
      });
      const res = mockRes();

      await routes['POST /api/managed-roles/:uid/lock'](req, res);

      expect(deps.emailTemplates.accountLocked).toHaveBeenCalledWith({
        userName: 'User',
      });
    });
  });
});
