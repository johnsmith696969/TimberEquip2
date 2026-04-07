/**
 * Subscription lifecycle triggers: creation notifications, expiry reminders,
 * expired notices, and date-based listing expiration.
 * Extracted from index.js for modularity.
 */
'use strict';

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * @param {{
 *   FIRESTORE_DB_ID: string,
 *   SENDGRID_API_KEY: import('firebase-functions/params').SecretParam,
 *   EMAIL_FROM: import('firebase-functions/params').SecretParam,
 *   sendEmail: Function,
 *   templates: Record<string, Function>,
 *   getDb: () => FirebaseFirestore.Firestore,
 *   getPlanDisplayName: (planId: string) => string,
 *   applyListingLifecycleAction: Function,
 *   APP_URL: string,
 * }} deps
 */
module.exports = function createSubscriptionLifecycleTriggers(deps) {
  const {
    FIRESTORE_DB_ID, SENDGRID_API_KEY, EMAIL_FROM,
    sendEmail, templates, getDb, getPlanDisplayName,
    applyListingLifecycleAction, APP_URL,
  } = deps;

  const onSubscriptionCreated = onDocumentCreated(
    {
      document: 'subscriptions/{subscriptionId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM],
    },
    async (event) => {
      const subscription = event.data?.data();
      if (!subscription?.userUid) return;

      const userSnap = await getDb().collection('users').doc(subscription.userUid).get();
      if (!userSnap.exists) return;

      const user = userSnap.data();
      if (!user.email) return;

      const payload = templates.subscriptionCreated({
        displayName: user.displayName || 'there',
        planName: getPlanDisplayName(subscription.planId),
      });

      await sendEmail({ to: user.email, ...payload });
    }
  );

  const subscriptionExpiryReminder = onSchedule(
    {
      schedule: 'every 24 hours',
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM],
    },
    async (_context) => {
      const in7Days = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );
      const in8Days = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
      );

      const snap = await admin
        .firestore()
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where('currentPeriodEnd', '>=', in7Days)
        .where('currentPeriodEnd', '<', in8Days)
        .get();

      if (snap.empty) {
        logger.info('subscriptionExpiryReminder: no subscriptions expiring in 7 days');
        return;
      }

      const renewUrl = `${APP_URL}/profile#subscription`;
      const errors = [];

      await Promise.all(
        snap.docs.map(async (subDoc) => {
          const sub = subDoc.data();
          const userSnap = await getDb().collection('users').doc(sub.userUid).get();
          if (!userSnap.exists) return;

          const user = userSnap.data();
          if (!user.email) return;

          const expiryDate = sub.currentPeriodEnd
            .toDate()
            .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

          try {
            const { subject, html } = templates.subscriptionExpiring({
              displayName: user.displayName || 'Seller',
              planName: getPlanDisplayName(sub.planId),
              expiryDate,
              renewUrl,
            });
            await sendEmail({ to: user.email, subject, html });
          } catch (err) {
            errors.push(err.message);
            logger.error(`Failed to send expiry reminder to ${user.email}`, err);
          }
        })
      );

      logger.info(`subscriptionExpiryReminder: processed ${snap.size} subs. Errors: ${errors.length}`);
    }
  );

  const subscriptionExpiredNotice = onSchedule(
    {
      schedule: 'every 24 hours',
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM],
    },
    async (_context) => {
      const now = admin.firestore.Timestamp.now();
      const yesterday = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const snap = await admin
        .firestore()
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where('currentPeriodEnd', '>=', yesterday)
        .where('currentPeriodEnd', '<', now)
        .get();

      if (snap.empty) return;

      const renewUrl = `${APP_URL}/profile#subscription`;

      await Promise.all(
        snap.docs.map(async (subDoc) => {
          const sub = subDoc.data();
          await subDoc.ref.update({ status: 'past_due' });

          const userSnap = await getDb().collection('users').doc(sub.userUid).get();
          if (!userSnap.exists) return;

          const user = userSnap.data();
          if (!user.email) return;

          try {
            const { subject, html } = templates.subscriptionExpired({
              displayName: user.displayName || 'Seller',
              planName: getPlanDisplayName(sub.planId),
              renewUrl,
            });
            await sendEmail({ to: user.email, subject, html });
          } catch (err) {
            logger.error(`Failed to send expired notice to ${user.email}`, err);
          }
        })
      );

      logger.info(`subscriptionExpiredNotice: processed ${snap.size} expired subs`);
    }
  );

  const expireListingsByDate = onSchedule(
    {
      schedule: 'every 24 hours',
      region: 'us-central1',
    },
    async () => {
      const now = admin.firestore.Timestamp.now();

      const snap = await getDb()
        .collection('listings')
        .where('approvalStatus', '==', 'approved')
        .where('paymentStatus', '==', 'paid')
        .where('status', '==', 'active')
        .where('expiresAt', '<=', now)
        .get();

      if (snap.empty) {
        logger.info('expireListingsByDate: no listings to expire');
        return;
      }

      for (const docSnap of snap.docs) {
        await applyListingLifecycleAction({
          listingRef: docSnap.ref,
          listingId: docSnap.id,
          listing: docSnap.data() || {},
          action: 'expire',
          actorUid: 'system',
          actorRole: 'system',
          reason: 'Automatic expiration window reached',
        });
      }
      logger.info(`expireListingsByDate: expired ${snap.size} listings`);
    }
  );

  return {
    onSubscriptionCreated,
    subscriptionExpiryReminder,
    subscriptionExpiredNotice,
    expireListingsByDate,
  };
};
