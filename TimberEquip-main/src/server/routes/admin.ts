import express from 'express';
import admin from 'firebase-admin';
import type Stripe from 'stripe';
import { validateBody, createManagedAccountSchema, dealerFeedIngestSchema } from '../../utils/apiValidation.js';

// ── Standardized API Response Helpers (mirrored from server.ts) ─────────────
function apiSuccess<T>(res: express.Response, data: T, meta?: Record<string, unknown>) {
  return res.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function apiError(res: express.Response, status: number, code: string, message: string) {
  return res.status(status).json({ success: false, error: { code, message } });
}

type DealerFeedItem = {
  externalId?: string;
  title?: string;
  category?: string;
  subcategory?: string;
  make?: string;
  manufacturer?: string;
  model?: string;
  year?: number | string;
  price?: number | string;
  currency?: string;
  hours?: number | string;
  condition?: string;
  description?: string;
  location?: string;
  images?: string[];
  imageUrls?: string[];
  imageTitles?: string[];
  videoUrls?: string[];
  stockNumber?: string;
  serialNumber?: string;
  dealerSourceUrl?: string;
  sourceUrl?: string;
  specs?: Record<string, unknown>;
};

export interface AdminRouteDeps {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  stripe: Stripe | null;
  sendServerEmail: (opts: { to: string; cc?: string | string[]; subject: string; html: string }) => Promise<void>;
  emailTemplates: Record<string, any> | null;
  isPrivilegedAdminEmail: (email: unknown) => boolean;
  canAdministrateAccountRole: (role: unknown) => boolean;
  normalizeRole: (value: unknown) => string;
  canCreateManagedRole: (parentRole: string, childRole: string) => boolean;
  getManagedAccountSeatContext: (ownerUid: string) => Promise<{ ownerUid: string; seatLimit: number; seatCount: number; activePlanIds: string[] }>;
  buildAdminOverviewBootstrapPayload: () => Promise<Record<string, unknown>>;
  serializeInquiryDoc: (doc: FirebaseFirestore.QueryDocumentSnapshot) => Record<string, unknown>;
  serializeCallDoc: (doc: FirebaseFirestore.QueryDocumentSnapshot) => Record<string, unknown>;
  normalizeDealerFeedListing: (...args: any[]) => Record<string, unknown>;
  normalizeNonEmptyString: (value: unknown, fallback?: string) => string;
  DEALER_MANAGED_ACCOUNT_LIMIT: number;
  APP_BASE_URL: string;
  EMAIL_FROM_ADDRESS: string;
}

export function registerAdminRoutes(app: express.Express, deps: AdminRouteDeps) {
  const {
    db,
    auth,
    isPrivilegedAdminEmail,
    canAdministrateAccountRole,
    normalizeRole,
    canCreateManagedRole,
    getManagedAccountSeatContext,
    buildAdminOverviewBootstrapPayload,
    normalizeDealerFeedListing,
    normalizeNonEmptyString,
    DEALER_MANAGED_ACCOUNT_LIMIT,
  } = deps;

  app.post('/api/admin/users/create-managed-account', validateBody(createManagedAccountSchema), async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const actorUid = decodedToken.uid;
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(actorUid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      const actorCanAdminister = isPrivilegedAdminEmail(actorEmail) || ['super_admin', 'admin', 'developer'].includes(actorRole);
      const actorIsDealer = ['dealer', 'dealer_manager', 'pro_dealer'].includes(actorRole);

      if (!actorCanAdminister && !actorIsDealer) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const displayName = String(req.body?.displayName || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const role = normalizeRole(req.body?.role);
      const company = String(req.body?.company || '').trim();
      const phoneNumber = String(req.body?.phoneNumber || '').trim();
      const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
      const parentRole = actorCanAdminister && actorRole === 'member' ? 'super_admin' : actorRole;

      if (!displayName || !email) {
        return res.status(400).json({ error: 'Display name and email are required.' });
      }

      if (!canCreateManagedRole(parentRole, role)) {
        return res.status(403).json({ error: 'You do not have permission to create this account role.' });
      }

      if (actorIsDealer) {
        const seatContext = await getManagedAccountSeatContext(ownerUid);
        if (seatContext.seatLimit < 1) {
          return res.status(403).json({
            error: 'An active Dealer or Pro Dealer subscription is required before adding managed accounts.',
          });
        }
        if (seatContext.seatCount >= seatContext.seatLimit) {
          return res.status(409).json({
            error: `Your current subscription includes up to ${seatContext.seatLimit} managed accounts. Remove one before adding another.`,
          });
        }
      }

      const existingUserByEmail = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingUserByEmail.empty) {
        return res.status(409).json({ error: 'An account with that email already exists.' });
      }

      const newUserRef = db.collection('users').doc();
      await newUserRef.set({
        uid: newUserRef.id,
        email,
        displayName,
        role,
        phoneNumber,
        company: company || String(actorDoc.data()?.company || '').trim(),
        parentAccountUid: ownerUid,
        accountStatus: 'pending',
        favorites: [],
        emailVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdByUid: actorUid,
        managedByRole: parentRole,
      });

      return res.status(201).json({
        id: newUserRef.id,
        seatLimit: actorIsDealer ? DEALER_MANAGED_ACCOUNT_LIMIT : null,
      });
    } catch (error: any) {
      console.error('Managed account creation failed:', error);
      return res.status(500).json({ error: 'Unable to create managed account.' });
    }
  });

  app.post('/api/admin/users/:userId/verify', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(decodedToken.uid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      if (!isPrivilegedAdminEmail(actorEmail) && !['super_admin', 'admin'].includes(actorRole)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const targetUid = String(req.params.userId || '').trim();
      if (!targetUid) return res.status(400).json({ error: 'Missing userId.' });

      await db.collection('users').doc(targetUid).update({ manuallyVerified: true });

      const listingsSnap = await db.collection('listings').where('sellerUid', '==', targetUid).get();
      const batch = db.batch();
      listingsSnap.docs.forEach((doc) => batch.update(doc.ref, { sellerVerified: true }));
      if (!listingsSnap.empty) await batch.commit();

      return apiSuccess(res, { listingsUpdated: listingsSnap.size });
    } catch (error: any) {
      console.error('Verify user failed:', error);
      return apiError(res, 500, 'VERIFY_FAILED', 'Unable to verify user.');
    }
  });

  app.post('/api/admin/users/:userId/unverify', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return apiError(res, 401, 'UNAUTHORIZED', 'Unauthorized');

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(decodedToken.uid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      if (!isPrivilegedAdminEmail(actorEmail) && !['super_admin', 'admin'].includes(actorRole)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const targetUid = String(req.params.userId || '').trim();
      if (!targetUid) return res.status(400).json({ error: 'Missing userId.' });

      await db.collection('users').doc(targetUid).update({ manuallyVerified: false });

      const targetDoc = await db.collection('users').doc(targetUid).get();
      const targetRole = normalizeRole(targetDoc.data()?.role);
      const autoVerifiedRoles = ['super_admin', 'admin', 'developer', 'dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff'];
      if (!autoVerifiedRoles.includes(targetRole)) {
        const listingsSnap = await db.collection('listings').where('sellerUid', '==', targetUid).get();
        const batch = db.batch();
        listingsSnap.docs.forEach((doc) => batch.update(doc.ref, { sellerVerified: false }));
        if (!listingsSnap.empty) await batch.commit();
      }

      return apiSuccess(res, { unverified: true });
    } catch (error: any) {
      console.error('Unverify user failed:', error);
      return apiError(res, 500, 'UNVERIFY_FAILED', 'Unable to unverify user.');
    }
  });

  app.post('/api/admin/dealer-feeds/ingest', validateBody(dealerFeedIngestSchema), async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const actorUid = decodedToken.uid;
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(actorUid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      const actorCanAdminister = isPrivilegedAdminEmail(actorEmail) || ['super_admin', 'admin', 'developer'].includes(actorRole);
      const actorIsDealer = ['dealer', 'dealer_manager', 'pro_dealer'].includes(actorRole);

      if (!actorCanAdminister && !actorIsDealer) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const sourceName = normalizeNonEmptyString(req.body?.sourceName, 'dealer_feed');
      const explicitDealerId = normalizeNonEmptyString(req.body?.dealerId);
      const sellerUid = explicitDealerId || String(actorDoc.data()?.parentAccountUid || actorUid).trim();
      const dryRun = Boolean(req.body?.dryRun);
      const items = Array.isArray(req.body?.items) ? (req.body.items as DealerFeedItem[]) : [];

      if (!sellerUid) {
        return res.status(400).json({ error: 'dealerId could not be resolved.' });
      }
      if (items.length === 0) {
        return res.status(400).json({ error: 'items[] is required.' });
      }
      if (items.length > 1000) {
        return res.status(400).json({ error: 'Maximum 1000 items per ingest request.' });
      }

      if (actorIsDealer && !actorCanAdminister) {
        const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
        if (explicitDealerId && explicitDealerId !== ownerUid && explicitDealerId !== actorUid) {
          return res.status(403).json({ error: 'Dealers can only ingest to their own account scope.' });
        }
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;
      const errors: Array<{ index: number; reason: string }> = [];

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        try {
          // First pass: resolve externalId to look up existing listing
          const tempExternalId = normalizeNonEmptyString(item.externalId);
          if (!tempExternalId) {
            skipped += 1;
            continue;
          }

          const existing = await db
            .collection('listings')
            .where('sellerUid', '==', sellerUid)
            .where('externalSource.externalId', '==', tempExternalId)
            .limit(1)
            .get();

          const existingData = existing.empty ? undefined : existing.docs[0].data();
          const normalized = normalizeDealerFeedListing(item, sellerUid, sourceName, existingData);

          if (dryRun) {
            if (existing.empty) created += 1;
            else updated += 1;
            continue;
          }

          if (existing.empty) {
            await db.collection('listings').add({
              ...normalized,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            created += 1;
          } else {
            await existing.docs[0].ref.set(normalized, { merge: true });
            updated += 1;
          }
        } catch (err: any) {
          errors.push({ index, reason: err?.message || 'Unknown ingest error' });
        }
      }

      const logPayload = {
        actorUid,
        actorRole,
        sellerUid,
        sourceName,
        dryRun,
        totalReceived: items.length,
        created,
        updated,
        skipped,
        errorCount: errors.length,
        errors: errors.slice(0, 100),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!dryRun) {
        await db.collection('dealerFeedIngestLogs').add(logPayload);
      }

      return res.json({
        ok: true,
        ...logPayload,
      });
    } catch (error: any) {
      console.error('Dealer feed ingest failed:', error);
      return res.status(500).json({ error: 'Dealer feed ingest failed.' });
    }
  });

  // Admin Operations Bootstrap
  app.get('/api/admin/bootstrap', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const claimRole = String(decodedToken.role || '').trim().toLowerCase();
      const isAdminByClaim = canAdministrateAccountRole(claimRole);
      if (!isPrivilegedAdminEmail(actorEmail) && !isAdminByClaim) {
        const user = await db.collection('users').doc(decodedToken.uid).get();
        if (!canAdministrateAccountRole(user.data()?.role)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      const authUsers: admin.auth.UserRecord[] = [];
      let nextPageToken: string | undefined;
      do {
        const listResult = await auth.listUsers(1000, nextPageToken);
        authUsers.push(...listResult.users);
        nextPageToken = listResult.pageToken;
      } while (nextPageToken);

      const profileRefs = authUsers.map((authUserRecord) => db.collection('users').doc(authUserRecord.uid));
      const profileSnaps = profileRefs.length > 0 ? await db.getAll(...profileRefs) : [];
      const profileMap = new Map(profileSnaps.map((snap) => [snap.id, snap]));

      const users = authUsers.map((authUserRecord) => {
        const snap = profileMap.get(authUserRecord.uid);
        const data = snap?.exists ? (snap.data() || {}) : {};
        const displayName = String(data.displayName || data.name || authUserRecord.displayName || authUserRecord.email || 'Unknown User').trim();
        const email = String(data.email || authUserRecord.email || '').trim().toLowerCase();
        const createdAt = String(data.createdAt || authUserRecord.metadata.creationTime || '');
        const updatedAt = String(data.updatedAt || '');
        const lastLogin = String(authUserRecord.metadata.lastSignInTime || data.lastLogin || updatedAt || createdAt || '');
        const authDisabled = Boolean(authUserRecord.disabled);
        const accountStatus = authDisabled ? 'suspended' : String(data.accountStatus || 'active');

        return {
          id: authUserRecord.uid,
          uid: authUserRecord.uid,
          name: displayName,
          displayName,
          email,
          phone: String(data.phoneNumber || '').trim(),
          phoneNumber: String(data.phoneNumber || '').trim(),
          company: String(data.company || '').trim(),
          role: String(data.role || authUserRecord.customClaims?.role || 'member'),
          status: authDisabled ? 'Suspended' : (accountStatus === 'pending' ? 'Pending' : 'Active'),
          accountStatus,
          authDisabled,
          emailVerified: Boolean(authUserRecord.emailVerified),
          lastLogin,
          lastActive: lastLogin,
          memberSince: createdAt,
          createdAt,
          updatedAt,
          totalListings: Number(data.totalListings || 0),
          totalLeads: Number(data.totalLeads || 0),
          parentAccountUid: String(data.parentAccountUid || '').trim() || undefined,
          manuallyVerified: Boolean(data.manuallyVerified),
        };
      }).sort((left, right) => {
        const leftTime = Date.parse(left.lastLogin || left.memberSince || '') || 0;
        const rightTime = Date.parse(right.lastLogin || right.memberSince || '') || 0;
        return rightTime - leftTime;
      });

      const userLimit = Math.min(Math.max(Number(req.query?.limit) || 200, 1), 1000);
      const userOffset = Math.max(Number(req.query?.offset) || 0, 0);
      const totalUsers = users.length;
      const paginatedUsers = users.slice(userOffset, userOffset + userLimit);

      const inquiryLimit = Math.min(Math.max(Number(req.query?.inquiryLimit) || 500, 1), 2000);
      const callLimit = Math.min(Math.max(Number(req.query?.callLimit) || 500, 1), 2000);

      const [inquiriesSnapshot, callsSnapshot] = await Promise.all([
        db.collection('inquiries').orderBy('createdAt', 'desc').limit(inquiryLimit).get(),
        db.collection('calls').orderBy('createdAt', 'desc').limit(callLimit).get(),
      ]);
      const includeOverview = ['1', 'true', 'yes'].includes(String(req.query?.includeOverview || '').trim().toLowerCase());
      const overview = includeOverview ? await buildAdminOverviewBootstrapPayload() : null;

      res.json({
        users: paginatedUsers,
        pagination: { total: totalUsers, offset: userOffset, limit: userLimit, hasMore: userOffset + userLimit < totalUsers },
        inquiries: inquiriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        calls: callsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        overview,
        partial: false,
        degradedSections: [],
        errors: {},
        firestoreQuotaLimited: false,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  // Admin Billing Endpoints
  app.get('/api/admin/billing/invoices', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const user = await db.collection('users').doc(decodedToken.uid).get();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !canAdministrateAccountRole(user.data()?.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('invoices').orderBy('createdAt', 'desc').get();
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  app.get('/api/admin/billing/subscriptions', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const user = await db.collection('users').doc(decodedToken.uid).get();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !canAdministrateAccountRole(user.data()?.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('subscriptions').get();
      const subscriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  app.get('/api/admin/billing/audit-logs', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const user = await db.collection('users').doc(decodedToken.uid).get();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !canAdministrateAccountRole(user.data()?.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('billingAuditLogs').orderBy('timestamp', 'desc').limit(50).get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  // ── Content Studio (Blog Posts) ──────────────────────────────────────────────
  const CONTENT_ROLES = ['super_admin', 'admin', 'developer', 'content_manager', 'editor'];

  app.get('/api/admin/content/blog-posts', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const role = String(userDoc.data()?.role || '').trim().toLowerCase();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !CONTENT_ROLES.includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('blogPosts').orderBy('updatedAt', 'desc').get();
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(posts);
    } catch (error: any) {
      console.error('Failed to fetch blog posts:', error);
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  app.get('/api/admin/content/bootstrap', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const role = String(userDoc.data()?.role || '').trim().toLowerCase();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !CONTENT_ROLES.includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const errors: Record<string, string> = {};
      let posts: any[] = [];
      let media: any[] = [];
      let contentBlocks: any[] = [];

      try {
        const postsSnap = await db.collection('blogPosts').orderBy('updatedAt', 'desc').get();
        posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e: any) { console.error('Content bootstrap: posts fetch failed:', e); errors.posts = 'Failed to load posts.'; }

      try {
        const mediaSnap = await db.collection('media').orderBy('uploadedAt', 'desc').get();
        media = mediaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e: any) { console.error('Content bootstrap: media fetch failed:', e); errors.media = 'Failed to load media.'; }

      try {
        const blocksSnap = await db.collection('contentBlocks').get();
        contentBlocks = blocksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e: any) { console.error('Content bootstrap: blocks fetch failed:', e); errors.contentBlocks = 'Failed to load content blocks.'; }

      res.json({
        posts,
        media,
        contentBlocks,
        partial: Object.keys(errors).length > 0,
        degradedSections: Object.keys(errors),
        errors,
        firestoreQuotaLimited: false,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to fetch content bootstrap:', error);
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });
}
