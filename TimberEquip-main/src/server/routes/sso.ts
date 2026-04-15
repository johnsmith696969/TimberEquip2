import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

export interface SsoRouteDeps {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  normalizeRole: (value: unknown) => string;
  isPrivilegedAdminEmail: (email: unknown) => boolean;
}

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'developer']);

export function registerSsoRoutes(app: express.Express, deps: SsoRouteDeps) {
  const { db, auth, normalizeRole, isPrivilegedAdminEmail } = deps;

  /** Verify caller is an admin and return decoded token info. */
  async function authenticateAdmin(req: express.Request, res: express.Response): Promise<{
    uid: string;
    email: string;
    role: string;
  } | null> {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    try {
      const decoded = await auth.verifyIdToken(idToken, true);
      const actorUid = decoded.uid;
      const actorEmail = String(decoded.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(actorUid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);

      if (!ADMIN_ROLES.has(actorRole) && !isPrivilegedAdminEmail(actorEmail)) {
        res.status(403).json({ error: 'Forbidden' });
        return null;
      }

      return { uid: actorUid, email: actorEmail, role: actorRole };
    } catch (error: unknown) {
      logger.error({ err: error }, 'SSO admin auth failed');
      res.status(401).json({ error: 'Invalid or expired token.' });
      return null;
    }
  }

  // ── List SSO providers ────────────────────────────────────────────────────

  app.get('/api/sso/providers', async (req, res) => {
    try {
      const caller = await authenticateAdmin(req, res);
      if (!caller) return;

      const snapshot = await db.collection('ssoProviders').orderBy('createdAt', 'desc').get();

      const providers = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          dealerId: String(d.dealerId || ''),
          dealerName: String(d.dealerName || ''),
          providerType: String(d.providerType || ''),
          entityId: String(d.entityId || ''),
          enabled: Boolean(d.enabled),
          createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
        };
      });

      return res.json({ providers });
    } catch (error: unknown) {
      logger.error({ err: error }, 'List SSO providers failed');
      return res.status(500).json({ error: 'Failed to list SSO providers.' });
    }
  });

  // ── Create SSO provider ───────────────────────────────────────────────────

  app.post('/api/sso/providers', async (req, res) => {
    try {
      const caller = await authenticateAdmin(req, res);
      if (!caller) return;

      const dealerId = String(req.body?.dealerId || '').trim();
      const dealerName = String(req.body?.dealerName || '').trim();
      const providerType = String(req.body?.providerType || '').trim().toLowerCase();
      const entityId = String(req.body?.entityId || '').trim();
      const enabled = Boolean(req.body?.enabled);

      if (!dealerId || !dealerName) {
        return res.status(400).json({ error: 'dealerId and dealerName are required.' });
      }

      if (providerType !== 'saml' && providerType !== 'oidc') {
        return res.status(400).json({ error: 'providerType must be "saml" or "oidc".' });
      }

      if (!entityId) {
        return res.status(400).json({ error: 'entityId is required.' });
      }

      const providerData: Record<string, unknown> = {
        dealerId,
        dealerName,
        providerType,
        entityId,
        enabled,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdByUid: caller.uid,
      };

      if (providerType === 'saml') {
        const ssoUrl = String(req.body?.ssoUrl || '').trim();
        const certificate = String(req.body?.certificate || '').trim();

        if (!ssoUrl) {
          return res.status(400).json({ error: 'ssoUrl is required for SAML providers.' });
        }

        providerData.ssoUrl = ssoUrl;
        if (certificate) {
          providerData.certificate = certificate;
        }
      } else {
        const clientId = String(req.body?.clientId || '').trim();
        const issuerUrl = String(req.body?.issuerUrl || '').trim();

        if (!clientId || !issuerUrl) {
          return res.status(400).json({ error: 'clientId and issuerUrl are required for OIDC providers.' });
        }

        providerData.clientId = clientId;
        providerData.issuerUrl = issuerUrl;
      }

      // Store optional emailDomains array for domain lookup
      const emailDomains = req.body?.emailDomains;
      if (Array.isArray(emailDomains)) {
        providerData.emailDomains = emailDomains
          .map((d: unknown) => String(d || '').trim().toLowerCase())
          .filter((d: string) => d.length > 0);
      }

      const docRef = await db.collection('ssoProviders').add(providerData);

      return res.status(201).json({ id: docRef.id });
    } catch (error: unknown) {
      logger.error({ err: error }, 'Create SSO provider failed');
      return res.status(500).json({ error: 'Failed to create SSO provider.' });
    }
  });

  // ── Update SSO provider ───────────────────────────────────────────────────

  app.patch('/api/sso/providers/:id', async (req, res) => {
    try {
      const caller = await authenticateAdmin(req, res);
      if (!caller) return;

      const providerId = String(req.params.id).trim();
      if (!providerId) {
        return res.status(400).json({ error: 'Provider ID is required.' });
      }

      const docRef = db.collection('ssoProviders').doc(providerId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: 'SSO provider not found.' });
      }

      const allowedFields = [
        'dealerId', 'dealerName', 'providerType', 'entityId',
        'ssoUrl', 'certificate', 'clientId', 'issuerUrl',
        'enabled', 'emailDomains',
      ];

      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (req.body?.[field] !== undefined) {
          if (field === 'emailDomains' && Array.isArray(req.body[field])) {
            updates[field] = (req.body[field] as unknown[])
              .map((d: unknown) => String(d || '').trim().toLowerCase())
              .filter((d: string) => d.length > 0);
          } else {
            updates[field] = req.body[field];
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update.' });
      }

      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.updatedByUid = caller.uid;

      await docRef.update(updates);

      return res.json({ success: true, id: providerId });
    } catch (error: unknown) {
      logger.error({ err: error }, 'Update SSO provider failed');
      return res.status(500).json({ error: 'Failed to update SSO provider.' });
    }
  });

  // ── Delete SSO provider ───────────────────────────────────────────────────

  app.delete('/api/sso/providers/:id', async (req, res) => {
    try {
      const caller = await authenticateAdmin(req, res);
      if (!caller) return;

      const providerId = String(req.params.id).trim();
      if (!providerId) {
        return res.status(400).json({ error: 'Provider ID is required.' });
      }

      const docRef = db.collection('ssoProviders').doc(providerId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: 'SSO provider not found.' });
      }

      await docRef.delete();

      return res.json({ success: true });
    } catch (error: unknown) {
      logger.error({ err: error }, 'Delete SSO provider failed');
      return res.status(500).json({ error: 'Failed to delete SSO provider.' });
    }
  });

  // ── Domain lookup (public, no auth) ───────────────────────────────────────

  app.get('/api/sso/domain-lookup', async (req, res) => {
    try {
      const email = String(req.query?.email || '').trim().toLowerCase();

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email query parameter is required.' });
      }

      const domain = email.split('@')[1];

      const snapshot = await db.collection('ssoProviders')
        .where('emailDomains', 'array-contains', domain)
        .where('enabled', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.json({ ssoAvailable: false });
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return res.json({
        ssoAvailable: true,
        providerId: doc.id,
        providerType: String(data.providerType || '') as 'saml' | 'oidc',
      });
    } catch (error: unknown) {
      logger.error({ err: error }, 'SSO domain lookup failed');
      return res.status(500).json({ error: 'Failed to look up SSO provider.' });
    }
  });
}
