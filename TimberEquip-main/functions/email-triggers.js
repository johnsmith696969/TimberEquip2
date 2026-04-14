/**
 * Email notification triggers for document creation events.
 * Extracted from index.js for modularity.
 */
'use strict';

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

/**
 * @param {{
 *   FIRESTORE_DB_ID: string,
 *   SENDGRID_API_KEY: import('firebase-functions/params').SecretParam,
 *   EMAIL_FROM: import('firebase-functions/params').SecretParam,
 *   ADMIN_EMAILS: import('firebase-functions/params').SecretParam,
 *   sendEmail: Function,
 *   templates: Record<string, Function>,
 *   getAdminRecipients: () => string[],
 *   getDb: () => FirebaseFirestore.Firestore,
 *   buildCanonicalListingUrl: (id: string, listing: object) => string,
 *   sendVerificationEmailMessage: Function,
 *   APP_URL: string,
 * }} deps
 */
module.exports = function createEmailTriggers(deps) {
  const {
    FIRESTORE_DB_ID, SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS,
    sendEmail, templates, getAdminRecipients, getDb,
    buildCanonicalListingUrl, sendVerificationEmailMessage, APP_URL,
  } = deps;

  const onInquiryCreated = onDocumentCreated(
    {
      document: 'inquiries/{inquiryId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
    },
    async (event) => {
      const inquiry = event.data?.data();
      if (!inquiry) return;

      const { sellerUid, sellerId, listingId, message, buyerName, buyerEmail, buyerPhone } = inquiry;
      const sellerDocId = sellerUid || sellerId || '';

      const [listingSnap, sellerSnap] = await Promise.all([
        getDb().collection('listings').doc(listingId).get(),
        sellerDocId ? getDb().collection('users').doc(sellerDocId).get() : Promise.resolve(null),
      ]);

      if (!listingSnap.exists || !sellerSnap?.exists) {
        logger.warn(`onInquiryCreated: listing or seller not found for inquiry ${event.params.inquiryId}; proceeding with fallback email payload.`);
      }

      const listing = listingSnap.exists ? listingSnap.data() : {};
      const seller = sellerSnap?.exists ? sellerSnap.data() : {};
      const listingTitle = listing.title || 'Equipment Listing';
      const sellerName = seller.displayName || 'Seller';
      const sellerEmail = seller.email;
      const listingUrl = buildCanonicalListingUrl(listingId, listing);

      const errors = [];

      if (sellerEmail) {
        try {
          const { subject, html } = templates.leadNotification({
            sellerName,
            buyerName: buyerName || 'A buyer',
            buyerEmail: buyerEmail || '',
            buyerPhone: buyerPhone || '',
            listingTitle,
            listingUrl,
            message: message || '',
          });
          await sendEmail({ to: sellerEmail, subject, html });
        } catch (err) {
          errors.push(`seller email failed: ${err.message}`);
          logger.error('Failed to send lead notification to seller', err);
        }
      }

      if (buyerEmail) {
        try {
          const { subject, html } = templates.inquiryConfirmation({
            buyerName: buyerName || 'Buyer',
            listingTitle,
            listingUrl,
            sellerName,
            inquiryType: inquiry.type || 'Inquiry',
          });
          await sendEmail({ to: buyerEmail, subject, html });
        } catch (err) {
          errors.push(`buyer confirmation failed: ${err.message}`);
          logger.error('Failed to send inquiry confirmation to buyer', err);
        }
      }

      try {
        const adminPayload = templates.adminInquiryAlert({
          inquiryType: inquiry.type || 'Inquiry',
          buyerName: buyerName || '',
          buyerEmail: buyerEmail || '',
          buyerPhone: buyerPhone || '',
          listingTitle,
          listingUrl,
          message: message || '',
          sellerUid: sellerDocId || '',
        });
        await sendEmail({ to: getAdminRecipients(), ...adminPayload });
      } catch (err) {
        errors.push(`admin inquiry copy failed: ${err.message}`);
        logger.error('Failed to send inquiry admin copy', err);
      }

      if (errors.length) {
        logger.warn(`onInquiryCreated partial failure: ${errors.join(', ')}`);
      }
    }
  );

  const onUserProfileCreated = onDocumentCreated(
    {
      document: 'users/{uid}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM],
    },
    async (event) => {
      const profile = event.data?.data();
      if (!profile?.email) return;
      if (String(profile.onboardingSource || '').trim() === 'managed_invite') return;

      try {
        await sendVerificationEmailMessage({
          email: profile.email,
          displayName: profile.displayName || 'there',
        });
      } catch (err) {
        logger.error('Failed to send welcome email', err);
      }
    }
  );

  const onMediaKitRequestCreated = onDocumentCreated(
    {
      document: 'mediaKitRequests/{requestId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
    },
    async (event) => {
      const request = event.data?.data();
      if (!request) return;

      const adminPayload = templates.mediaKitRequest({
        requesterName: request.firstName || '',
        companyName: request.companyName || '',
        email: request.email || '',
        phone: request.phone || '',
        notes: request.notes || '',
      });

      await sendEmail({ to: getAdminRecipients(), ...adminPayload });

      if (request.email) {
        try {
          const confirmationPayload = templates.mediaKitRequestConfirmation({
            requesterName: request.firstName || 'there',
            requestType: request.requestType || 'media-kit',
            companyName: request.companyName || '',
            supportUrl: `${APP_URL}/ad-programs`,
          });
          await sendEmail({ to: request.email, ...confirmationPayload });
        } catch (error) {
          logger.error('Failed to send media kit confirmation email', error);
        }
      }
    }
  );

  const onFinancingRequestCreated = onDocumentCreated(
    {
      document: 'financingRequests/{requestId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
    },
    async (event) => {
      const request = event.data?.data();
      if (!request) return;

      const payload = templates.financingRequestAdmin({
        applicantName: request.applicantName || '',
        applicantEmail: request.applicantEmail || '',
        applicantPhone: request.applicantPhone || '',
        company: request.company || '',
        requestedAmount: request.requestedAmount || null,
        listingId: request.listingId || '',
        message: request.message || '',
      });

      await sendEmail({ to: getAdminRecipients(), ...payload });

      if (request.applicantEmail) {
        try {
          const confirmationPayload = templates.financingRequestConfirmation({
            applicantName: request.applicantName || 'there',
            requestedAmount: typeof request.requestedAmount === 'number' ? request.requestedAmount : null,
            company: request.company || '',
            dashboardUrl: `${APP_URL}/profile?tab=${encodeURIComponent('Financing')}`,
          });
          await sendEmail({ to: request.applicantEmail, ...confirmationPayload });
        } catch (error) {
          logger.error('Failed to send financing confirmation email', error);
        }
      }
    }
  );

  const onContactRequestCreated = onDocumentCreated(
    {
      document: 'contactRequests/{requestId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
      secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
    },
    async (event) => {
      const request = event.data?.data();
      if (!request) return;

      const payload = templates.contactRequestAdmin({
        name: request.name || '',
        email: request.email || '',
        category: request.category || '',
        message: request.message || '',
        source: request.source || 'contact-page',
      });

      await sendEmail({ to: getAdminRecipients(), ...payload });

      if (request.email) {
        try {
          const confirmationPayload = templates.contactRequestConfirmation({
            name: request.name || 'there',
            category: request.category || 'General Support',
            supportUrl: `${APP_URL}/contact`,
          });
          await sendEmail({ to: request.email, ...confirmationPayload });
        } catch (error) {
          logger.error('Failed to send contact confirmation email', error);
        }
      }
    }
  );

  return {
    onInquiryCreated,
    onUserProfileCreated,
    onMediaKitRequestCreated,
    onFinancingRequestCreated,
    onContactRequestCreated,
  };
};
