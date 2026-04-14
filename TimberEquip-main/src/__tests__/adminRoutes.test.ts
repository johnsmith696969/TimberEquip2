import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock logger and validateBody before importing the module under test ──────
vi.mock('../../utils/apiValidation', () => ({
  validateBody: () => (req: any, _res: any, next: any) => next(),
  createManagedAccountSchema: {},
  dealerFeedIngestSchema: {},
}));

vi.mock('../logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { registerAdminRoutes, type AdminRouteDeps } from '../server/routes/admin';

// ── Helpers ──────────────────────────────────────────────────────────────────

type RouteHandler = (req: any, res: any) => Promise<any>;

/** Captures route handlers registered on a fake Express app. */
function captureRoutes() {
  const handlers = new Map<string, RouteHandler>();

  const fakeApp = {
    post: vi.fn((path: string, ...args: any[]) => {
      handlers.set(`POST ${path}`, args[args.length - 1]);
    }),
    get: vi.fn((path: string, ...args: any[]) => {
      handlers.set(`GET ${path}`, args[args.length - 1]);
    }),
  };

  return { fakeApp: fakeApp as any, handlers };
}

function mockRes() {
  const res: any = {
    statusCode: 200,
    _json: null as any,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      res._json = body;
      return res;
    },
  };
  return res;
}

function mockReq(overrides: Record<string, any> = {}) {
  return {
    headers: { authorization: 'Bearer valid-token' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  };
}

// ── Firestore mock helpers ───────────────────────────────────────────────────

function makeDocSnap(data: Record<string, any> | undefined, id = 'doc-id') {
  return {
    id,
    exists: data !== undefined,
    data: () => data,
    ref: { id, update: vi.fn(), set: vi.fn() },
  };
}

function makeQuerySnap(docs: ReturnType<typeof makeDocSnap>[] = []) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((d) => ({
      ...d,
      ref: { ...d.ref, update: vi.fn() },
    })),
  };
}

// ── Shared mocks ─────────────────────────────────────────────────────────────

function buildMockDeps(overrides: Partial<AdminRouteDeps> = {}): AdminRouteDeps {
  const newDocRef = { id: 'new-user-id', set: vi.fn().mockResolvedValue(undefined) };
  const batchMock = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };

  const mockCollection = vi.fn().mockImplementation((name: string) => ({
    doc: vi.fn().mockImplementation((uid?: string) => {
      if (!uid) return newDocRef;
      return {
        get: vi.fn().mockResolvedValue(makeDocSnap({ role: 'admin', email: 'admin@test.com' }, uid)),
        update: vi.fn().mockResolvedValue(undefined),
      };
    }),
    where: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(makeQuerySnap()),
        }),
      }),
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(makeQuerySnap()),
      }),
      get: vi.fn().mockResolvedValue(makeQuerySnap()),
    }),
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(makeQuerySnap()),
      }),
      get: vi.fn().mockResolvedValue(makeQuerySnap()),
    }),
  }));

  const db: any = {
    collection: mockCollection,
    batch: vi.fn().mockReturnValue(batchMock),
    getAll: vi.fn().mockResolvedValue([]),
  };

  const auth: any = {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'actor-uid', email: 'admin@test.com', role: '' }),
    listUsers: vi.fn().mockResolvedValue({ users: [], pageToken: undefined }),
  };

  return {
    db,
    auth,
    stripe: null,
    sendServerEmail: vi.fn().mockResolvedValue(undefined),
    emailTemplates: null,
    isPrivilegedAdminEmail: vi.fn().mockReturnValue(false),
    canAdministrateAccountRole: vi.fn().mockReturnValue(false),
    normalizeRole: vi.fn().mockImplementation((v: unknown) => String(v || 'member').trim().toLowerCase()),
    canCreateManagedRole: vi.fn().mockReturnValue(true),
    getManagedAccountSeatContext: vi.fn().mockResolvedValue({ ownerUid: 'actor-uid', seatLimit: 3, seatCount: 0, activePlanIds: ['dealer'] }),
    buildAdminOverviewBootstrapPayload: vi.fn().mockResolvedValue({ totalListings: 10 }),
    serializeInquiryDoc: vi.fn().mockImplementation((doc: any) => ({ id: doc.id, ...doc.data() })),
    serializeCallDoc: vi.fn().mockImplementation((doc: any) => ({ id: doc.id, ...doc.data() })),
    normalizeDealerFeedListing: vi.fn().mockReturnValue({}),
    normalizeNonEmptyString: vi.fn().mockImplementation((v: unknown, fb?: string) => String(v || fb || '')),
    DEALER_MANAGED_ACCOUNT_LIMIT: 3,
    APP_BASE_URL: 'https://test.example.com',
    EMAIL_FROM_ADDRESS: 'noreply@test.com',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Admin Routes — POST /api/admin/users/create-managed-account', () => {
  let handlers: Map<string, RouteHandler>;
  let deps: AdminRouteDeps;

  function getHandler() {
    return handlers.get('POST /api/admin/users/create-managed-account')!;
  }

  beforeEach(() => {
    const captured = captureRoutes();
    handlers = captured.handlers;
    deps = buildMockDeps();
    registerAdminRoutes(captured.fakeApp, deps);
  });

  it('returns 401 when no authorization header is present', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    await getHandler()(req, res);
    expect(res.statusCode).toBe(401);
    expect(res._json).toEqual({ error: 'Unauthorized' });
  });

  it('creates a managed account for an admin actor (happy path)', async () => {
    // Actor is admin
    const actorDoc = makeDocSnap({ role: 'admin', email: 'admin@test.com', company: 'Admin Co' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid?: string) => {
            if (!uid) {
              // newUserRef — no uid means creating new doc
              return { id: 'new-user-id', set: vi.fn().mockResolvedValue(undefined) };
            }
            if (uid === 'actor-uid') {
              return { get: vi.fn().mockResolvedValue(actorDoc) };
            }
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(makeQuerySnap([])), // no existing user
            }),
          }),
        };
      }
      return { doc: vi.fn() };
    });

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({
      body: { displayName: 'New User', email: 'new@example.com', role: 'member' },
    });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._json.id).toBe('new-user-id');
    expect(res._json.seatLimit).toBeNull(); // non-dealer admin doesn't get seat limit
  });

  it('creates a managed account for a dealer actor with seat limit returned', async () => {
    const actorDoc = makeDocSnap({ role: 'dealer', email: 'dealer@test.com', company: 'Dealer Co' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid?: string) => {
            if (!uid) return { id: 'new-managed-id', set: vi.fn().mockResolvedValue(undefined) };
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(makeQuerySnap([])),
            }),
          }),
        };
      }
      return { doc: vi.fn() };
    });

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);
    (deps.getManagedAccountSeatContext as any).mockResolvedValue({
      ownerUid: 'actor-uid', seatLimit: 3, seatCount: 1, activePlanIds: ['dealer'],
    });

    const req = mockReq({
      body: { displayName: 'Staff Member', email: 'staff@dealer.com', role: 'member' },
    });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._json.id).toBe('new-managed-id');
    expect(res._json.seatLimit).toBe(3);
  });

  it('returns 403 when a member role actor tries to create an account', async () => {
    const actorDoc = makeDocSnap({ role: 'member', email: 'user@test.com' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation(() => ({
      doc: vi.fn().mockImplementation((uid?: string) => {
        if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
        return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
      }),
    }));

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({
      body: { displayName: 'Hacker', email: 'hacker@evil.com', role: 'admin' },
    });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._json).toEqual({ error: 'Forbidden' });
  });

  it('returns 409 when email already exists', async () => {
    const actorDoc = makeDocSnap({ role: 'admin', email: 'admin@test.com' }, 'actor-uid');
    const existingUser = makeDocSnap({ email: 'existing@test.com' }, 'existing-uid');

    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid?: string) => {
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(makeQuerySnap([existingUser])),
            }),
          }),
        };
      }
      return { doc: vi.fn() };
    });

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({
      body: { displayName: 'Duplicate', email: 'existing@test.com', role: 'member' },
    });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(409);
    expect(res._json.error).toBe('An account with that email already exists.');
  });

  it('returns 409 when dealer seat limit is exceeded', async () => {
    const actorDoc = makeDocSnap({ role: 'dealer', email: 'dealer@test.com' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid?: string) => {
            if (!uid) return { id: 'new-id', set: vi.fn().mockResolvedValue(undefined) };
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(makeQuerySnap([])),
            }),
          }),
        };
      }
      return { doc: vi.fn() };
    });

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);
    (deps.getManagedAccountSeatContext as any).mockResolvedValue({
      ownerUid: 'actor-uid', seatLimit: 3, seatCount: 3, activePlanIds: ['dealer'],
    });

    const req = mockReq({
      body: { displayName: 'Over Limit', email: 'overlimit@test.com', role: 'member' },
    });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(409);
    expect(res._json.error).toContain('up to 3 managed accounts');
  });

  it('returns 400 when displayName is missing', async () => {
    const actorDoc = makeDocSnap({ role: 'admin', email: 'admin@test.com' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation(() => ({
      doc: vi.fn().mockImplementation((uid?: string) => {
        if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
        return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
      }),
    }));

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({
      body: { displayName: '', email: 'test@example.com', role: 'member' },
    });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toBe('Display name and email are required.');
  });

  it('returns 403 when dealer tries to create an admin role', async () => {
    const actorDoc = makeDocSnap({ role: 'dealer', email: 'dealer@test.com' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid?: string) => {
            if (!uid) return { id: 'new-id', set: vi.fn().mockResolvedValue(undefined) };
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(makeQuerySnap([])),
            }),
          }),
        };
      }
      return { doc: vi.fn() };
    });

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);
    (deps.canCreateManagedRole as any).mockReturnValue(false);

    const req = mockReq({
      body: { displayName: 'Sneaky', email: 'sneaky@test.com', role: 'admin' },
    });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._json.error).toBe('You do not have permission to create this account role.');
  });
});

describe('Admin Routes — POST /api/admin/users/:userId/verify', () => {
  let handlers: Map<string, RouteHandler>;
  let deps: AdminRouteDeps;

  function getHandler() {
    return handlers.get('POST /api/admin/users/:userId/verify')!;
  }

  beforeEach(() => {
    const captured = captureRoutes();
    handlers = captured.handlers;
    deps = buildMockDeps();
    registerAdminRoutes(captured.fakeApp, deps);
  });

  it('returns 401 when no authorization header is present', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    await getHandler()(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('marks user as manuallyVerified and updates their listings', async () => {
    const actorDoc = makeDocSnap({ role: 'admin', email: 'admin@test.com' }, 'actor-uid');
    const listingDoc1 = makeDocSnap({ sellerUid: 'target-uid', title: 'Skidder' }, 'listing-1');
    const listingDoc2 = makeDocSnap({ sellerUid: 'target-uid', title: 'Feller Buncher' }, 'listing-2');
    const listingsSnap = makeQuerySnap([listingDoc1, listingDoc2]);

    const targetUserUpdate = vi.fn().mockResolvedValue(undefined);
    const batchMock = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };

    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid: string) => {
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            if (uid === 'target-uid') return { update: targetUserUpdate };
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
        };
      }
      if (name === 'listings') {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(listingsSnap),
          }),
        };
      }
      return { doc: vi.fn() };
    });
    (deps.db as any).batch.mockReturnValue(batchMock);

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({ params: { userId: 'target-uid' } });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.success).toBe(true);
    expect(res._json.data.listingsUpdated).toBe(2);
    expect(targetUserUpdate).toHaveBeenCalledWith({ manuallyVerified: true });
    expect(batchMock.update).toHaveBeenCalledTimes(2);
    expect(batchMock.commit).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when a non-admin tries to verify', async () => {
    const actorDoc = makeDocSnap({ role: 'dealer', email: 'dealer@test.com' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation(() => ({
      doc: vi.fn().mockImplementation((uid: string) => {
        if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
        return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
      }),
    }));

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({ params: { userId: 'target-uid' } });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._json).toEqual({ error: 'Forbidden' });
  });
});

describe('Admin Routes — POST /api/admin/users/:userId/unverify', () => {
  let handlers: Map<string, RouteHandler>;
  let deps: AdminRouteDeps;

  function getHandler() {
    return handlers.get('POST /api/admin/users/:userId/unverify')!;
  }

  beforeEach(() => {
    const captured = captureRoutes();
    handlers = captured.handlers;
    deps = buildMockDeps();
    registerAdminRoutes(captured.fakeApp, deps);
  });

  it('removes manuallyVerified and updates listings for non-auto-verified roles', async () => {
    const actorDoc = makeDocSnap({ role: 'admin', email: 'admin@test.com' }, 'actor-uid');
    const targetDoc = makeDocSnap({ role: 'member', email: 'user@test.com' }, 'target-uid');
    const listingDoc = makeDocSnap({ sellerUid: 'target-uid' }, 'listing-1');
    const listingsSnap = makeQuerySnap([listingDoc]);

    const targetUserUpdate = vi.fn().mockResolvedValue(undefined);
    const batchMock = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };

    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid: string) => {
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            if (uid === 'target-uid') return { get: vi.fn().mockResolvedValue(targetDoc), update: targetUserUpdate };
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
        };
      }
      if (name === 'listings') {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(listingsSnap),
          }),
        };
      }
      return { doc: vi.fn() };
    });
    (deps.db as any).batch.mockReturnValue(batchMock);

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({ params: { userId: 'target-uid' } });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.success).toBe(true);
    expect(res._json.data.unverified).toBe(true);
    expect(targetUserUpdate).toHaveBeenCalledWith({ manuallyVerified: false });
    expect(batchMock.update).toHaveBeenCalledTimes(1);
    expect(batchMock.commit).toHaveBeenCalledTimes(1);
  });

  it('skips listing updates for auto-verified roles (e.g. dealer)', async () => {
    const actorDoc = makeDocSnap({ role: 'admin', email: 'admin@test.com' }, 'actor-uid');
    const targetDoc = makeDocSnap({ role: 'dealer', email: 'dealer@test.com' }, 'target-uid');

    const targetUserUpdate = vi.fn().mockResolvedValue(undefined);

    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid: string) => {
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            if (uid === 'target-uid') return { get: vi.fn().mockResolvedValue(targetDoc), update: targetUserUpdate };
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
        };
      }
      if (name === 'listings') {
        // Should not be reached for auto-verified roles
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(makeQuerySnap([])),
          }),
        };
      }
      return { doc: vi.fn() };
    });

    (deps.normalizeRole as any).mockImplementation((v: unknown) => String(v || 'member'));
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const req = mockReq({ params: { userId: 'target-uid' } });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.success).toBe(true);
    expect(targetUserUpdate).toHaveBeenCalledWith({ manuallyVerified: false });
    // No batch should be committed for auto-verified roles since listings stay verified
  });
});

describe('Admin Routes — GET /api/admin/bootstrap', () => {
  let handlers: Map<string, RouteHandler>;
  let deps: AdminRouteDeps;

  function getHandler() {
    return handlers.get('GET /api/admin/bootstrap')!;
  }

  beforeEach(() => {
    const captured = captureRoutes();
    handlers = captured.handlers;
    deps = buildMockDeps();
    registerAdminRoutes(captured.fakeApp, deps);
  });

  it('returns 401 when no authorization header is present', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    await getHandler()(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns users, inquiries, and calls data for an admin', async () => {
    const actorDoc = makeDocSnap({ role: 'admin', email: 'admin@test.com' }, 'actor-uid');
    const inquiryDoc = makeDocSnap({ message: 'Interested in skidder' }, 'inq-1');
    const callDoc = makeDocSnap({ callerName: 'John' }, 'call-1');

    (deps.auth as any).verifyIdToken.mockResolvedValue({ uid: 'actor-uid', email: 'admin@test.com', role: 'admin' });
    (deps.canAdministrateAccountRole as any).mockImplementation((r: unknown) => ['super_admin', 'admin', 'developer'].includes(String(r)));

    (deps.auth as any).listUsers.mockResolvedValueOnce({
      users: [{
        uid: 'user-1',
        email: 'user1@test.com',
        displayName: 'User One',
        disabled: false,
        emailVerified: true,
        customClaims: { role: 'member' },
        metadata: { creationTime: '2026-01-01T00:00:00Z', lastSignInTime: '2026-04-01T00:00:00Z' },
      }],
      pageToken: undefined,
    });

    const userProfileSnap = makeDocSnap({
      displayName: 'User One',
      email: 'user1@test.com',
      role: 'member',
      phoneNumber: '555-1234',
      company: 'Test Co',
      accountStatus: 'active',
    }, 'user-1');

    (deps.db as any).collection.mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockImplementation((uid: string) => {
            if (uid === 'actor-uid') return { get: vi.fn().mockResolvedValue(actorDoc) };
            if (uid === 'user-1') return userProfileSnap;
            return { get: vi.fn().mockResolvedValue(makeDocSnap(undefined)) };
          }),
        };
      }
      if (name === 'inquiries') {
        return {
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(makeQuerySnap([inquiryDoc])),
            }),
          }),
        };
      }
      if (name === 'calls') {
        return {
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(makeQuerySnap([callDoc])),
            }),
          }),
        };
      }
      return {
        doc: vi.fn(),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(makeQuerySnap()) }),
        }),
      };
    });

    (deps.db as any).getAll.mockResolvedValue([userProfileSnap]);

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.users).toBeDefined();
    expect(res._json.users.length).toBe(1);
    expect(res._json.inquiries).toBeDefined();
    expect(res._json.calls).toBeDefined();
    expect(res._json.partial).toBe(false);
    expect(res._json.fetchedAt).toBeDefined();
  });

  it('returns 403 when a non-admin tries to access bootstrap', async () => {
    (deps.auth as any).verifyIdToken.mockResolvedValue({ uid: 'actor-uid', email: 'user@test.com', role: 'member' });
    (deps.canAdministrateAccountRole as any).mockReturnValue(false);
    (deps.isPrivilegedAdminEmail as any).mockReturnValue(false);

    const nonAdminDoc = makeDocSnap({ role: 'member', email: 'user@test.com' }, 'actor-uid');
    (deps.db as any).collection.mockImplementation(() => ({
      doc: vi.fn().mockImplementation((uid: string) => ({
        get: vi.fn().mockResolvedValue(nonAdminDoc),
      })),
    }));

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getHandler()(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._json).toEqual({ error: 'Forbidden' });
  });
});
