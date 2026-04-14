import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody, recaptchaAssessSchema } from '../../utils/apiValidation.js';

export interface PublicRouteDeps {
  db: FirebaseFirestore.Firestore;
  getMarketplaceStats: () => Promise<Record<string, unknown>>;
  getPublicNewsFeedPayload: () => Promise<Record<string, unknown>[]>;
  getPublicNewsPostPayload: (id: string) => Promise<Record<string, unknown> | null>;
  serializeSellerPayloadFromStorefront: (id: string, data: Record<string, unknown>) => Record<string, unknown>;
  serializeSellerPayloadFromUser: (id: string, data: Record<string, unknown>) => Record<string, unknown>;
  hasActiveDealerDirectorySubscription: (data: Record<string, unknown>) => boolean;
  normalizeNonEmptyString: (value: unknown, fallback?: string) => string;
}

export function registerPublicRoutes(app: express.Express, deps: PublicRouteDeps) {
  const {
    db,
    getMarketplaceStats,
    getPublicNewsFeedPayload,
    getPublicNewsPostPayload,
    serializeSellerPayloadFromStorefront,
    serializeSellerPayloadFromUser,
    hasActiveDealerDirectorySubscription,
    normalizeNonEmptyString,
  } = deps;

  app.get('/api/marketplace-stats', async (req, res) => {
    try {
      const payload = await getMarketplaceStats();
      res.set('Cache-Control', 'public, max-age=600');
      res.json(payload);
    } catch (error: any) {
      console.error('Failed to compute marketplace stats:', error);
      res.status(500).json({ error: 'Failed to load marketplace stats.' });
    }
  });

  app.get('/api/public/sellers/:identity', async (req, res) => {
    const requestedIdentity = normalizeNonEmptyString(req.params.identity);
    if (!requestedIdentity) {
      return res.status(400).json({ error: 'Seller identifier is required.' });
    }

    try {
      let storefrontSnapshot = await db.collection('storefronts').doc(requestedIdentity).get();
      if (!storefrontSnapshot.exists) {
        const storefrontSlugSnapshot = await db
          .collection('storefronts')
          .where('storefrontSlug', '==', requestedIdentity)
          .limit(1)
          .get();
        if (!storefrontSlugSnapshot.empty) {
          storefrontSnapshot = storefrontSlugSnapshot.docs[0];
        }
      }

      if (storefrontSnapshot.exists) {
        res.set('Cache-Control', 'public, max-age=300');
        return res.json({ seller: serializeSellerPayloadFromStorefront(storefrontSnapshot.id, storefrontSnapshot.data() || {}) });
      }

      let userSnapshot = await db.collection('users').doc(requestedIdentity).get();
      if (!userSnapshot.exists) {
        const userSlugSnapshot = await db
          .collection('users')
          .where('storefrontSlug', '==', requestedIdentity)
          .limit(1)
          .get();
        if (!userSlugSnapshot.empty) {
          userSnapshot = userSlugSnapshot.docs[0];
        }
      }

      if (userSnapshot.exists) {
        res.set('Cache-Control', 'public, max-age=300');
        return res.json({ seller: serializeSellerPayloadFromUser(userSnapshot.id, userSnapshot.data() || {}) });
      }

      return res.json({ seller: null });
    } catch (error: any) {
      console.error('Failed to resolve public seller:', error);
      return res.status(500).json({ error: 'Failed to load seller.' });
    }
  });

  app.get('/api/public/dealers', async (_req, res) => {
    try {
      const usersSnapshot = await db.collection('users').where('storefrontEnabled', '==', true).get();
      type PublicDealerDirectoryEntry = ReturnType<typeof serializeSellerPayloadFromUser> & { verified: boolean };
      const dealers = usersSnapshot.docs
        .map((snapshot) => {
          const data = snapshot.data() || {};
          if (!hasActiveDealerDirectorySubscription(data)) {
            return null;
          }

          return {
            ...serializeSellerPayloadFromUser(snapshot.id, data),
            verified: Boolean(data.storefrontEnabled),
          };
        })
        .filter((dealer): dealer is PublicDealerDirectoryEntry => Boolean(dealer))
        .sort((left, right) => {
          const leftName = normalizeNonEmptyString(left.storefrontName || left.name).toLowerCase();
          const rightName = normalizeNonEmptyString(right.storefrontName || right.name).toLowerCase();
          return leftName.localeCompare(rightName) || String(left.id || '').localeCompare(String(right.id || ''));
        });

      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ dealers });
    } catch (error: any) {
      console.error('Failed to load public dealer directory:', error);
      return res.status(500).json({ error: 'Failed to load dealers.' });
    }
  });

  app.get('/api/public/news', async (_req, res) => {
    try {
      const posts = await getPublicNewsFeedPayload();
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({
        posts,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to load public news feed:', error);
      return res.status(500).json({ error: 'Failed to load equipment news.' });
    }
  });

  app.get('/api/public/news/:id', async (req, res) => {
    try {
      const post = await getPublicNewsPostPayload(req.params.id);
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ post });
    } catch (error: any) {
      console.error('Failed to load public news article:', error);
      return res.status(500).json({ error: 'Failed to load the equipment news article.' });
    }
  });

  const recaptchaLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many reCAPTCHA requests. Please try again in a minute.' },
  });

  app.post('/api/recaptcha-assess', recaptchaLimiter, express.json(), validateBody(recaptchaAssessSchema), async (req, res) => {
    const { token, action } = req.body || {};
    if (!token || !action) return res.status(400).json({ error: 'token and action required' });

    const apiKey = process.env.RECAPTCHA_API_KEY;
    if (!apiKey) {
      // Dev mode without key: pass everything through
      return res.json({ pass: true, score: null });
    }

    try {
      const response = await fetch(
        `https://recaptchaenterprise.googleapis.com/v1/projects/mobile-app-equipment-sales/assessments?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: { token, siteKey: process.env.RECAPTCHA_SITE_KEY || '6LdxzpIsAAAAADS0ws0EJT-ulSMBH5yO9uAWOqX0', expectedAction: action } }),
        }
      );
      if (!response.ok) {
        console.error('reCAPTCHA API error:', response.status);
        return res.json({ pass: false, score: null });
      }
      const data: any = await response.json();
      const valid = data?.tokenProperties?.valid === true;
      const score: number | null = data?.riskAnalysis?.score ?? null;
      const pass = valid && (score === null || score >= 0.5);
      return res.json({ pass, score });
    } catch (err) {
      console.error('reCAPTCHA assessment error:', err);
      return res.json({ pass: false, score: null });
    }
  });
}
