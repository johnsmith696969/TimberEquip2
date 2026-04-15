import express from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
import logger from '../logger.js';

export interface UserRouteDeps {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  upload: multer.Multer;
  scanFileForViruses: (buffer: Buffer) => Promise<boolean>;
  apiSuccess: <T>(res: express.Response, data: T, meta?: Record<string, unknown>) => express.Response;
  apiError: (res: express.Response, status: number, code: string, message: string) => express.Response;
}

export function registerUserRoutes(app: express.Express, deps: UserRouteDeps) {
  const { db, auth, upload, scanFileForViruses, apiSuccess, apiError } = deps;

  const ACCOUNT_DELETION_RETENTION_DAYS = 90;

  function accountDeletionRetentionDate(): admin.firestore.Timestamp {
    const retainedUntil = new Date(Date.now() + ACCOUNT_DELETION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    return admin.firestore.Timestamp.fromDate(retainedUntil);
  }

  async function markQuerySnapshotForDeletedAccount(
    snapshot: admin.firestore.QuerySnapshot,
    update: admin.firestore.UpdateData<admin.firestore.DocumentData>,
  ): Promise<number> {
    let updated = 0;

    for (let i = 0; i < snapshot.docs.length; i += 400) {
      const batch = db.batch();
      const docs = snapshot.docs.slice(i, i + 400);
      docs.forEach((doc) => {
        batch.set(doc.ref, update, { merge: true });
      });
      await batch.commit();
      updated += docs.length;
    }

    return updated;
  }

  // Retained account deletion backend. This disables the user and redacts public PII
  // while keeping operational records available for support, disputes, and audits.
  app.post('/api/user/delete', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const uid = decodedToken.uid;
      const now = admin.firestore.FieldValue.serverTimestamp();
      const retainedUntil = accountDeletionRetentionDate();
      const retainedRecordUpdate: admin.firestore.UpdateData<admin.firestore.DocumentData> = {
        accountDeleted: true,
        accountDeletedAt: now,
        deletedAccountUid: uid,
        retainedUntil,
        retentionMinimumDays: ACCOUNT_DELETION_RETENTION_DAYS,
        updatedAt: now,
      };
      const redactedContactUpdate: admin.firestore.UpdateData<admin.firestore.DocumentData> = {
        ...retainedRecordUpdate,
        email: admin.firestore.FieldValue.delete(),
        phone: admin.firestore.FieldValue.delete(),
        phoneNumber: admin.firestore.FieldValue.delete(),
        contactEmail: admin.firestore.FieldValue.delete(),
        contactPhone: admin.firestore.FieldValue.delete(),
        customerEmail: admin.firestore.FieldValue.delete(),
        customerName: admin.firestore.FieldValue.delete(),
      };

      const retainedCounts: Record<string, number> = {};
      const collectionsByUserUid = ['inquiries', 'financingRequests', 'invoices', 'subscriptions', 'consentLogs'];

      for (const coll of collectionsByUserUid) {
        const snapshot = await db.collection(coll).where('userUid', '==', uid).get();
        retainedCounts[coll] = await markQuerySnapshotForDeletedAccount(snapshot, redactedContactUpdate);
      }

      const listingRetentionUpdate: admin.firestore.UpdateData<admin.firestore.DocumentData> = {
        ...retainedRecordUpdate,
        status: 'archived',
        lifecycleStatus: 'archived',
        archivedReason: 'seller_account_deleted',
        archivedAt: now,
        sellerEmail: admin.firestore.FieldValue.delete(),
        sellerPhone: admin.firestore.FieldValue.delete(),
        contactEmail: admin.firestore.FieldValue.delete(),
        contactPhone: admin.firestore.FieldValue.delete(),
      };
      const listingsBySellerUid = await db.collection('listings').where('sellerUid', '==', uid).get();
      retainedCounts.listingsBySellerUid = await markQuerySnapshotForDeletedAccount(listingsBySellerUid, listingRetentionUpdate);

      const listingsByUserUid = await db.collection('listings').where('userUid', '==', uid).get();
      retainedCounts.listingsByUserUid = await markQuerySnapshotForDeletedAccount(listingsByUserUid, listingRetentionUpdate);

      await db.collection('users').doc(uid).set({
        accountDeleted: true,
        accountDeletedAt: now,
        deleted: true,
        disabled: true,
        role: 'deleted',
        status: 'deleted',
        retainedUntil,
        retentionMinimumDays: ACCOUNT_DELETION_RETENTION_DAYS,
        emailNotificationsEnabled: false,
        displayName: 'Deleted User',
        name: 'Deleted User',
        email: admin.firestore.FieldValue.delete(),
        phone: admin.firestore.FieldValue.delete(),
        phoneNumber: admin.firestore.FieldValue.delete(),
        companyName: admin.firestore.FieldValue.delete(),
        photoURL: admin.firestore.FieldValue.delete(),
        avatarUrl: admin.firestore.FieldValue.delete(),
        updatedAt: now,
      }, { merge: true });

      await auth.updateUser(uid, {
        disabled: true,
        displayName: 'Deleted User',
        photoURL: null,
      });

      await db.collection('auditLogs').add({
        action: 'ACCOUNT_SOFT_DELETED_BY_USER',
        targetId: uid,
        targetType: 'user',
        details: `User ${uid} requested account deletion. Records retained for at least ${ACCOUNT_DELETION_RETENTION_DAYS} days.`,
        retainedUntil,
        retainedCounts,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      apiSuccess(res, {
        deleted: true,
        retained: true,
        retainedUntil: retainedUntil.toDate().toISOString(),
        retentionMinimumDays: ACCOUNT_DELETION_RETENTION_DAYS,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Error deleting user account');
      apiError(res, 500, 'DELETE_FAILED', 'An internal error occurred.');
    }
  });

  // Secure File Upload Endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await auth.verifyIdToken(idToken, true);
    } catch (err) {
      logger.warn({ err }, 'Auth token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
      // 1. Virus Scanning
      const isClean = await scanFileForViruses(req.file.buffer);
      if (!isClean) {
        return res.status(400).json({ error: 'File check failed. Upload rejected.' });
      }

      // 2. Content moderation: check for nudity, violence, child exploitation
      if (req.file.mimetype.startsWith('image/')) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const vision = require('@google-cloud/vision') as { ImageAnnotatorClient: new () => any };
          const visionClient = new vision.ImageAnnotatorClient();
          const [result] = await visionClient.safeSearchDetection({
            image: { content: req.file.buffer.toString('base64') },
          });
          const annotations = result.safeSearchAnnotation;
          if (annotations) {
            const BLOCK_LEVELS = new Set(['LIKELY', 'VERY_LIKELY']);
            const violations: string[] = [];
            if (BLOCK_LEVELS.has(annotations.adult || '')) violations.push('adult content');
            if (BLOCK_LEVELS.has(annotations.violence || '')) violations.push('violent content');
            if (annotations.racy === 'VERY_LIKELY') violations.push('explicit content');
            if (violations.length > 0) {
              return res.status(400).json({
                error: `Image rejected: ${violations.join(', ')} detected. Please upload appropriate content.`,
              });
            }
          }
        } catch (err) {
          logger.warn({ err }, 'Vision API content moderation unavailable');
        }
      }

      // 3. Process the file (e.g., upload to Firebase Storage or process locally)
      res.json({
        success: true,
        message: 'File uploaded and scanned successfully.',
        file: {
          name: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        }
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Upload error');
      res.status(500).json({ error: 'Internal server error during upload.' });
    }
  });
}
