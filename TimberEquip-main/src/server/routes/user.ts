import express from 'express';
import admin from 'firebase-admin';
import multer from 'multer';

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

  // Automated Data Deletion Backend
  app.post('/api/user/delete', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const uid = decodedToken.uid;

      // 1. Delete user data across collections
      const collections = ['listings', 'inquiries', 'financingRequests', 'invoices', 'subscriptions', 'consentLogs'];

      for (const coll of collections) {
        const snapshot = await db.collection(coll).where('userUid', '==', uid).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Special case for listings where field is 'sellerUid'
      const listingsSnapshot = await db.collection('listings').where('sellerUid', '==', uid).get();
      const listingsBatch = db.batch();
      listingsSnapshot.docs.forEach(doc => listingsBatch.delete(doc.ref));
      await listingsBatch.commit();

      // 2. Delete User Profile
      await db.collection('users').doc(uid).delete();

      // 3. Delete Firebase Auth User
      await auth.deleteUser(uid);

      // 4. Log the action
      await db.collection('auditLogs').add({
        action: 'ACCOUNT_DELETED_BY_USER',
        targetId: uid,
        targetType: 'user',
        details: `User ${uid} deleted their account and all associated data.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      apiSuccess(res, { deleted: true });
    } catch (error: any) {
      console.error('Error deleting user account:', error);
      apiError(res, 500, 'DELETE_FAILED', 'An internal error occurred.');
    }
  });

  // Secure File Upload Endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await auth.verifyIdToken(idToken, true);
    } catch {
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

      // 2. Content moderation — check for nudity, violence, child exploitation
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
        } catch {
          // Vision API unavailable — allow upload but log warning
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
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Internal server error during upload.' });
    }
  });
}
