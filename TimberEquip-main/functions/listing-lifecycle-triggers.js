/**
 * Listing lifecycle triggers: status changes and creation events.
 * Extracted from index.js for modularity.
 */
'use strict';

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');

/**
 * @param {{
 *   FIRESTORE_DB_ID: string,
 *   SENDGRID_API_KEY: import('firebase-functions/params').SecretParam,
 *   EMAIL_FROM: import('firebase-functions/params').SecretParam,
 *   sendEmail: Function,
 *   templates: Record<string, Function>,
 *   getDb: () => FirebaseFirestore.Firestore,
 *   buildCanonicalListingUrl: (id: string, listing: object) => string,
 *   normalize: (value: string) => string,
 *   notifyMatchingSavedSearches: Function,
 *   deliverDealerWebhooks: Function,
 *   notifySavedSearchSoldStatus: Function,
 *   notifySavedSearchPriceDrop: Function,
 *   processEndedAuctionLots: Function,
 *   APP_URL: string,
 * }} deps
 */
module.exports = function createListingLifecycleTriggers(deps) {
  const {
    FIRESTORE_DB_ID, SENDGRID_API_KEY, EMAIL_FROM,
    sendEmail, templates, getDb, buildCanonicalListingUrl, normalize,
    notifyMatchingSavedSearches, deliverDealerWebhooks,
    notifySavedSearchSoldStatus, notifySavedSearchPriceDrop,
    processEndedAuctionLots, APP_URL,
  } = deps;

  const onListingStatusChanged = onDocumentUpdated(
    {
      document: 'listings/{listingId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM],
    },
    async (event) => {
      const before = event.data?.before?.data();
      const after = event.data?.after?.data();
      if (!before || !after) return;

      const prevApproval = before.approvalStatus;
      const newApproval = after.approvalStatus;
      const previousStatus = normalize(before.status || 'active');
      const newStatus = normalize(after.status || 'active');
      const beforePrice = Number(before.price || 0);
      const afterPrice = Number(after.price || 0);

      if (newApproval === 'approved' && prevApproval !== 'approved') {
        await notifyMatchingSavedSearches(event.params.listingId, after);
      }

      if (previousStatus !== 'sold' && newStatus === 'sold') {
        await notifySavedSearchSoldStatus(event.params.listingId, after);
        void deliverDealerWebhooks(after.sellerUid || after.sellerId, 'listing.sold', event.params.listingId, after);
      }

      if (previousStatus !== 'deleted' && newStatus === 'deleted') {
        void deliverDealerWebhooks(after.sellerUid || after.sellerId, 'listing.deleted', event.params.listingId, after);
      }

      if (
        newApproval === 'approved' &&
        prevApproval === 'approved' &&
        previousStatus !== 'sold' &&
        newStatus !== 'sold' &&
        beforePrice > 0 &&
        afterPrice > 0 &&
        afterPrice < beforePrice
      ) {
        await notifySavedSearchPriceDrop(event.params.listingId, before, after);
      }

      if (newApproval === 'approved' && newStatus !== 'sold' && newStatus !== 'deleted') {
        void deliverDealerWebhooks(after.sellerUid || after.sellerId, 'listing.updated', event.params.listingId, after);
      }

      if (prevApproval === newApproval) return;
      if (newApproval !== 'approved' && newApproval !== 'rejected') return;

      const sellerUid = after.sellerUid || after.sellerId;
      if (!sellerUid) return;

      const sellerSnap = await getDb().collection('users').doc(sellerUid).get();
      if (!sellerSnap.exists) return;

      const seller = sellerSnap.data();
      const sellerEmail = seller.email;
      if (!sellerEmail) return;

      const listingTitle = after.title || 'Your Listing';
      const listingUrl = buildCanonicalListingUrl(event.params.listingId, after);

      try {
        let emailPayload;
        if (newApproval === 'approved') {
          emailPayload = templates.listingApproved({ sellerName: seller.displayName || 'Seller', listingTitle, listingUrl });
        } else {
          const editUrl = `${APP_URL}/sell?edit=${event.params.listingId}`;
          emailPayload = templates.listingRejected({
            sellerName: seller.displayName || 'Seller',
            listingTitle,
            reason: after.rejectionReason || '',
            editUrl,
          });
        }
        await sendEmail({ to: sellerEmail, ...emailPayload });
      } catch (err) {
        logger.error('Failed to send listing status email', err);
      }
    }
  );

  const onListingCreated = onDocumentCreated(
    {
      document: 'listings/{listingId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM],
    },
    async (event) => {
      const listing = event.data?.data();
      if (!listing) return;

      const sellerUid = String(listing.sellerUid || listing.sellerId || '').trim();
      let seller = null;
      if (sellerUid) {
        const sellerSnap = await getDb().collection('users').doc(sellerUid).get();
        if (sellerSnap.exists) {
          seller = sellerSnap.data();
        }
      }

      const sellerEmail = String(seller?.email || '').trim();
      const sellerName = String(seller?.displayName || 'Seller').trim();
      const listingTitle = String(listing.title || 'Your Listing').trim();
      const listingUrl = buildCanonicalListingUrl(event.params.listingId, listing);
      const dashboardUrl = `${APP_URL}/profile?tab=${encodeURIComponent('My Listings')}`;

      if (listing.approvalStatus === 'approved') {
        await notifyMatchingSavedSearches(event.params.listingId, listing);
        void deliverDealerWebhooks(sellerUid, 'listing.created', event.params.listingId, listing);

        if (sellerEmail) {
          try {
            const payload = templates.listingApproved({ sellerName, listingTitle, listingUrl });
            await sendEmail({ to: sellerEmail, ...payload });
          } catch (error) {
            logger.error('Failed to send listing approved email on create', error);
          }
        }
        return;
      }

      if (sellerEmail) {
        try {
          const payload = templates.listingSubmitted({
            sellerName,
            listingTitle,
            dashboardUrl,
            reviewEta: 'Typically within 1 business day',
          });
          await sendEmail({ to: sellerEmail, ...payload });
        } catch (error) {
          logger.error('Failed to send listing submitted email', error);
        }
      }
    }
  );

  const processAuctionClosures = onSchedule(
    {
      schedule: 'every 5 minutes',
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM],
    },
    async () => {
      const results = await processEndedAuctionLots();
      logger.info('processAuctionClosures: processed auction lot settlements', {
        settledCount: results.length,
      });
    }
  );

  return {
    onListingStatusChanged,
    onListingCreated,
    processAuctionClosures,
  };
};
