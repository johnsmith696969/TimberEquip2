import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

export interface ManagedRolesRouteDeps {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  normalizeRole: (value: unknown) => string;
  isPrivilegedAdminEmail: (email: unknown) => boolean;
  sendServerEmail: (opts: { to: string; subject: string; html: string }) => Promise<void>;
  emailTemplates: Record<string, any> | null;
  APP_BASE_URL: string;
}

const DEALER_ROLES = new Set(['dealer', 'pro_dealer', 'dealer_manager']);
const ADMIN_ROLES = new Set(['super_admin', 'admin', 'developer']);
const ASSIGNABLE_DEALER_ROLES = new Set(['dealer_manager', 'dealer_staff', 'member']);

export function registerManagedRolesRoutes(app: express.Express, deps: ManagedRolesRouteDeps) {
  const { db, auth, normalizeRole, isPrivilegedAdminEmail, sendServerEmail, emailTemplates, APP_BASE_URL } = deps;

  /** Verify caller and return their UID, role, and owner UID. */
  async function authenticateCaller(req: express.Request): Promise<{
    actorUid: string;
    actorRole: string;
    actorEmail: string;
    ownerUid: string;
    isAdmin: boolean;
  } | null> {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return null;

    const decoded = await auth.verifyIdToken(idToken, true);
    const actorUid = decoded.uid;
    const actorEmail = String(decoded.email || '').trim().toLowerCase();
    const actorDoc = await db.collection('users').doc(actorUid).get();
    const actorRole = normalizeRole(actorDoc.data()?.role);
    const isAdmin = ADMIN_ROLES.has(actorRole) || isPrivilegedAdminEmail(actorEmail);
    const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();

    return { actorUid, actorRole, actorEmail, ownerUid, isAdmin };
  }

  /** Verify caller is owner/admin and target is a managed account under that owner. */
  async function authorizeManagement(req: express.Request, res: express.Response, targetUid: string) {
    const caller = await authenticateCaller(req);
    if (!caller) { res.status(401).json({ error: 'Unauthorized' }); return null; }

    const targetDoc = await db.collection('users').doc(targetUid).get();
    if (!targetDoc.exists) { res.status(404).json({ error: 'User not found.' }); return null; }

    const targetData = targetDoc.data()!;
    const targetOwner = String(targetData.parentAccountUid || '').trim();

    // Admin can manage anyone; dealer can only manage their own sub-accounts
    if (!caller.isAdmin && caller.ownerUid !== targetOwner && caller.actorUid !== targetOwner) {
      res.status(403).json({ error: 'You can only manage your own team members.' });
      return null;
    }

    // Sub-accounts cannot manage sibling accounts (only owner or admin)
    if (!caller.isAdmin && caller.actorUid !== caller.ownerUid && caller.actorUid !== targetOwner) {
      res.status(403).json({ error: 'Only the account owner can manage team members.' });
      return null;
    }

    return { caller, targetData, targetDoc };
  }

  // ── List managed accounts for a dealer ────────────────────────────────────

  app.get('/api/managed-roles', async (req, res) => {
    try {
      const caller = await authenticateCaller(req);
      if (!caller) return res.status(401).json({ error: 'Unauthorized' });

      const queryOwnerUid = String(req.query.ownerUid || caller.ownerUid).trim();

      // Only admin can view other dealers' managed accounts
      if (queryOwnerUid !== caller.ownerUid && queryOwnerUid !== caller.actorUid && !caller.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('users')
        .where('parentAccountUid', '==', queryOwnerUid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const users = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          displayName: String(d.displayName || ''),
          email: String(d.email || ''),
          role: normalizeRole(d.role),
          accountStatus: String(d.accountStatus || 'pending'),
          emailVerified: Boolean(d.emailVerified),
          createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
        };
      });

      return res.json({ users });
    } catch (error: any) {
      logger.error({ err: error }, 'List managed roles error');
      return res.status(500).json({ error: 'Failed to load team members.' });
    }
  });

  // ── Update managed account role ───────────────────────────────────────────

  app.patch('/api/managed-roles/:uid/role', async (req, res) => {
    try {
      const targetUid = String(req.params.uid).trim();
      const newRole = normalizeRole(req.body?.role);

      if (!ASSIGNABLE_DEALER_ROLES.has(newRole)) {
        return res.status(400).json({ error: `Invalid role. Allowed: ${[...ASSIGNABLE_DEALER_ROLES].join(', ')}` });
      }

      const ctx = await authorizeManagement(req, res, targetUid);
      if (!ctx) return;

      await db.collection('users').doc(targetUid).update({
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({ success: true, role: newRole });
    } catch (error: any) {
      logger.error({ err: error }, 'Update role error');
      return res.status(500).json({ error: 'Failed to update role.' });
    }
  });

  // ── Lock managed account ──────────────────────────────────────────────────

  app.post('/api/managed-roles/:uid/lock', async (req, res) => {
    try {
      const targetUid = String(req.params.uid).trim();
      const ctx = await authorizeManagement(req, res, targetUid);
      if (!ctx) return;

      await db.collection('users').doc(targetUid).update({
        accountStatus: 'locked',
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        lockedByUid: ctx.caller.actorUid,
      });

      // Send account locked email
      if (emailTemplates?.accountLocked && ctx.targetData.email) {
        try {
          await sendServerEmail({
            to: ctx.targetData.email,
            subject: 'Your account has been locked',
            html: emailTemplates.accountLocked({
              userName: ctx.targetData.displayName || 'User',
            }),
          });
        } catch (err) { logger.warn({ err }, 'Non-critical: failed to send account-locked email'); }
      }

      return res.json({ success: true, status: 'locked' });
    } catch (error: any) {
      logger.error({ err: error }, 'Lock account error');
      return res.status(500).json({ error: 'Failed to lock account.' });
    }
  });

  // ── Unlock managed account ────────────────────────────────────────────────

  app.post('/api/managed-roles/:uid/unlock', async (req, res) => {
    try {
      const targetUid = String(req.params.uid).trim();
      const ctx = await authorizeManagement(req, res, targetUid);
      if (!ctx) return;

      await db.collection('users').doc(targetUid).update({
        accountStatus: 'active',
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send account unlocked email
      if (emailTemplates?.accountUnlocked && ctx.targetData.email) {
        try {
          await sendServerEmail({
            to: ctx.targetData.email,
            subject: 'Your account has been unlocked',
            html: emailTemplates.accountUnlocked({
              userName: ctx.targetData.displayName || 'User',
            }),
          });
        } catch (err) { logger.warn({ err }, 'Non-critical: failed to send account-unlocked email'); }
      }

      return res.json({ success: true, status: 'active' });
    } catch (error: any) {
      logger.error({ err: error }, 'Unlock account error');
      return res.status(500).json({ error: 'Failed to unlock account.' });
    }
  });

  // ── Remove managed account ────────────────────────────────────────────────

  app.delete('/api/managed-roles/:uid', async (req, res) => {
    try {
      const targetUid = String(req.params.uid).trim();
      const ctx = await authorizeManagement(req, res, targetUid);
      if (!ctx) return;

      // Soft-delete: mark as removed, don't hard-delete the Firestore doc
      await db.collection('users').doc(targetUid).update({
        accountStatus: 'removed',
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
        removedByUid: ctx.caller.actorUid,
        parentAccountUid: admin.firestore.FieldValue.delete(),
      });

      return res.json({ success: true });
    } catch (error: any) {
      logger.error({ err: error }, 'Remove managed account error');
      return res.status(500).json({ error: 'Failed to remove team member.' });
    }
  });

  // ── Reset password for managed account ────────────────────────────────────

  app.post('/api/managed-roles/:uid/reset-password', async (req, res) => {
    try {
      const targetUid = String(req.params.uid).trim();
      const ctx = await authorizeManagement(req, res, targetUid);
      if (!ctx) return;

      const email = String(ctx.targetData.email || '').trim();
      if (!email) {
        return res.status(400).json({ error: 'No email on file for this account.' });
      }

      // Send password reset email
      if (emailTemplates?.passwordReset) {
        const resetUrl = `${APP_BASE_URL}/reset-password?email=${encodeURIComponent(email)}`;
        try {
          await sendServerEmail({
            to: email,
            subject: 'Password Reset Request',
            html: emailTemplates.passwordReset({
              userName: ctx.targetData.displayName || 'User',
              resetUrl,
            }),
          });
        } catch (err) { logger.warn({ err }, 'Non-critical: failed to send password-reset email'); }
      }

      return res.json({ success: true });
    } catch (error: any) {
      logger.error({ err: error }, 'Reset password error');
      return res.status(500).json({ error: 'Failed to send password reset.' });
    }
  });
}
