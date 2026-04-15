import express from 'express';
import admin from 'firebase-admin';
import Stripe from 'stripe';
import {
  validateBody,
  checkoutSessionSchema,
  portalSessionSchema,
  cancelSubscriptionSchema,
  accountCheckoutSessionSchema,
} from '../../utils/apiValidation.js';
import logger from '../logger.js';

// ── Types ──────────────────────────────────────────────────────────────────────

type ListingCheckoutPlanId = 'individual_seller' | 'dealer' | 'fleet_dealer';
type ListingCheckoutPlan = {
  id: ListingCheckoutPlanId;
  name: string;
  amountUsd: number;
  listingCap: number;
  productId: string;
  priceId?: string;
};

// ── Dependency injection interface ─────────────────────────────────────────────

export interface BillingRouteDeps {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  stripe: Stripe | null;
  stripeWebhookSecret: string;
  apiSuccess: <T>(res: express.Response, data: T, meta?: Record<string, unknown>) => express.Response;
  apiError: (res: express.Response, status: number, code: string, message: string) => express.Response;
  getRequestBaseUrl: (req: express.Request) => string;
  resolveStripePriceIdForPlan: (plan: ListingCheckoutPlan) => Promise<string>;
  getOrCreateStripeCustomer: (userUid: string, email?: string, name?: string) => Promise<string>;
  findExistingStripeCustomerId: (userUid: string, email?: string) => Promise<string>;
  finalizeListingPaymentFromCheckoutSession: (
    session: Stripe.Checkout.Session,
    source: 'webhook' | 'confirm',
  ) => Promise<{ paid: boolean; listingId: string | null; planId: string | null }>;
  getListingCheckoutPlan: (rawPlanId: unknown) => ListingCheckoutPlan | null;
  buildTrialEndForPlan: (planId: ListingCheckoutPlanId) => number | null;
  getManagedAccountSeatContext: (ownerUid: string) => Promise<{
    ownerUid: string;
    seatLimit: number;
    seatCount: number;
    activePlanIds: string[];
  }>;
  isLocalBillingStubEnabled: () => boolean;
  buildLocalBillingStubSessionId: (scope: 'listing' | 'account', planId: string, listingId: string | null, uid: string) => string;
  parseLocalBillingStubSessionId: (sessionId: string) => {
    scope: 'listing' | 'account';
    planId: string | null;
    listingId: string | null;
    uid: string | null;
  } | null;
  buildLocalBillingStubSummary: (decodedToken: admin.auth.DecodedIdToken) => Record<string, unknown>;
  UNLIMITED_LISTING_CAP: number;
}

// ── Route registration ─────────────────────────────────────────────────────────

export function registerBillingRoutes(app: express.Express, deps: BillingRouteDeps) {
  const {
    db,
    auth,
    stripe,
    stripeWebhookSecret,
    apiSuccess,
    apiError,
    getRequestBaseUrl,
    resolveStripePriceIdForPlan,
    getOrCreateStripeCustomer,
    findExistingStripeCustomerId,
    finalizeListingPaymentFromCheckoutSession,
    getListingCheckoutPlan,
    buildTrialEndForPlan,
    getManagedAccountSeatContext,
    isLocalBillingStubEnabled,
    buildLocalBillingStubSessionId,
    parseLocalBillingStubSessionId,
    buildLocalBillingStubSummary,
    UNLIMITED_LISTING_CAP,
  } = deps;

  // ── POST /api/billing/webhook ────────────────────────────────────────────────
  app.post(['/api/billing/webhook', '/api/webhooks/stripe'], express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = stripeWebhookSecret;

    let event;

    try {
      if (!sig || !webhookSecret) throw new Error('Missing signature or secret');
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      logger.error({ err }, 'Stripe webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    // Idempotency check: atomic check-and-set via transaction to prevent race conditions
    const eventRef = db.collection('webhook_events').doc(event.id);
    let isDuplicate = false;
    try {
      await db.runTransaction(async (tx) => {
        const eventDoc = await tx.get(eventRef);
        if (eventDoc.exists) {
          isDuplicate = true;
          return;
        }
        tx.set(eventRef, {
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          type: event.type,
        });
      });
    } catch (txErr) {
      logger.error({ err: txErr }, 'Webhook dedup transaction failed');
      return res.status(500).json({ error: 'Internal error' });
    }
    if (isDuplicate) {
      logger.info({ eventId: event.id }, 'Webhook event already processed');
      return res.json({ received: true, duplicate: true });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'invoice.paid': {
          const invoice = event.data.object as any;
          const userUid = invoice.metadata?.userUid || invoice.subscription_details?.metadata?.userUid || invoice.subscription?.metadata?.userUid;

          if (userUid) {
            await db.collection('invoices').doc(invoice.id).set({
              userUid,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'paid',
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              items: invoice.lines.data.map(line => line.description),
            }, { merge: true });

            await db.collection('billingAuditLogs').add({
              action: 'INVOICE_PAID',
              userUid,
              invoiceId: invoice.id,
              details: `Invoice ${invoice.id} paid successfully via webhook.`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // Handle auction invoice payment
          const auctionInvoiceId = invoice.metadata?.auctionInvoiceId;
          if (auctionInvoiceId) {
            const auctionInvoiceRef = db.collection('auctionInvoices').doc(auctionInvoiceId);
            const auctionInvoiceSnap = await auctionInvoiceRef.get();

            if (auctionInvoiceSnap.exists) {
              // Extract payment method details from the charge
              const paymentIntentId = typeof invoice.payment_intent === 'string'
                ? invoice.payment_intent
                : invoice.payment_intent?.id || null;

              let paymentMethodDescription = 'stripe_invoice';
              if (paymentIntentId && stripe) {
                try {
                  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
                  const pmId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id;
                  if (pmId) {
                    const pm = await stripe.paymentMethods.retrieve(pmId);
                    paymentMethodDescription = pm.type === 'card'
                      ? `card ending ${pm.card?.last4 || '****'}`
                      : pm.type || 'stripe_invoice';
                  }
                } catch (err) {
                  logger.warn({ err }, 'Non-critical: failed to retrieve payment method details, using generic description');
                }
              }

              await auctionInvoiceRef.update({
                status: 'paid',
                paidAt: new Date().toISOString(),
                paymentMethod: paymentMethodDescription,
                stripePaymentIntentId: paymentIntentId,
                updatedAt: new Date().toISOString(),
              });

              logger.info({ auctionInvoiceId, stripeInvoiceId: invoice.id }, 'Auction invoice marked as paid via webhook');
            } else {
              logger.warn({ auctionInvoiceId }, 'Auction invoice not found in Firestore during invoice.paid webhook');
            }
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const userUid = invoice.metadata?.userUid || invoice.subscription_details?.metadata?.userUid || invoice.subscription?.metadata?.userUid;
          if (userUid) {
            await db.collection('invoices').doc(invoice.id).set({
              userUid,
              stripeInvoiceId: invoice.id,
              status: 'failed',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            await db.collection('billingAuditLogs').add({
              action: 'PAYMENT_FAILED',
              userUid,
              invoiceId: invoice.id,
              details: `Payment failed for invoice ${invoice.id}.`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // Handle auction invoice payment failure
          const failedAuctionInvoiceId = invoice.metadata?.auctionInvoiceId;
          if (failedAuctionInvoiceId) {
            const auctionInvoiceRef = db.collection('auctionInvoices').doc(failedAuctionInvoiceId);
            const auctionInvoiceSnap = await auctionInvoiceRef.get();

            if (auctionInvoiceSnap.exists) {
              await auctionInvoiceRef.update({
                status: 'payment_failed',
                updatedAt: new Date().toISOString(),
              });

              logger.info({ auctionInvoiceId: failedAuctionInvoiceId, stripeInvoiceId: invoice.id }, 'Auction invoice marked as payment_failed via webhook');
            } else {
              logger.warn({ auctionInvoiceId: failedAuctionInvoiceId }, 'Auction invoice not found in Firestore during invoice.payment_failed webhook');
            }
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userUid = subscription.metadata.userUid;
          if (userUid) {
            await db.collection('subscriptions').doc(subscription.id).set({
              userUid,
              stripeSubscriptionId: subscription.id,
              planId: (subscription.items.data[0].plan as any).id,
              status: subscription.status,
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
              ...((subscription as any).created ? { createdAt: admin.firestore.Timestamp.fromMillis((subscription as any).created * 1000) } : {}),
              ...((subscription as any).start_date ? { startDate: admin.firestore.Timestamp.fromMillis((subscription as any).start_date * 1000) } : {}),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            // If subscription becomes past_due or unpaid, suppress listing visibility
            const inactiveStatuses = ['past_due', 'unpaid', 'incomplete_expired'];
            if (inactiveStatuses.includes(subscription.status)) {
              const listingsSnap = await db.collection('listings')
                .where('sellerUid', '==', userUid)
                .get();
              const batch = db.batch();
              listingsSnap.docs.forEach((doc) => {
                const data = doc.data();
                if (!['sold', 'archived'].includes(String(data.status || '').toLowerCase())) {
                  batch.update(doc.ref, {
                    paymentStatus: 'pending',
                    status: 'pending',
                    lastLifecycleAction: 'billing_visibility_suppressed',
                    lastLifecycleActorUid: 'system',
                    lastLifecycleActorRole: 'system',
                    lastLifecycleReason: `Subscription ${subscription.status} — listings hidden until payment resolved.`,
                    lastLifecycleAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  });
                }
              });
              if (listingsSnap.docs.length > 0) await batch.commit();

              await db.collection('billingAuditLogs').add({
                action: 'SUBSCRIPTION_BILLING_LAPSE',
                userUid,
                subscriptionId: subscription.id,
                details: `Subscription ${subscription.id} status changed to ${subscription.status}. Listings hidden.`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userUid = subscription.metadata.userUid;
          if (userUid) {
            await db.collection('subscriptions').doc(subscription.id).update({
              status: 'canceled',
              cancelAtPeriodEnd: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Hide all listings for this user and downgrade access
            const listingsSnap = await db.collection('listings')
              .where('sellerUid', '==', userUid)
              .get();
            const batch = db.batch();
            listingsSnap.docs.forEach((doc) => {
              const data = doc.data();
              if (!['sold', 'archived'].includes(String(data.status || '').toLowerCase())) {
                batch.update(doc.ref, {
                  paymentStatus: 'pending',
                  status: 'pending',
                  lastLifecycleAction: 'billing_visibility_suppressed',
                  lastLifecycleActorUid: 'system',
                  lastLifecycleActorRole: 'system',
                  lastLifecycleReason: 'Subscription deleted — listings hidden.',
                  lastLifecycleAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              }
            });
            if (listingsSnap.docs.length > 0) await batch.commit();

            // Downgrade user role to member
            const userDoc = await db.collection('users').doc(userUid).get();
            if (userDoc.exists) {
              await db.collection('users').doc(userUid).update({
                role: 'member',
                accountAccessSource: 'free_member',
                activeSubscriptionPlanId: null,
                subscriptionStatus: 'canceled',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }

            await db.collection('billingAuditLogs').add({
              action: 'SUBSCRIPTION_DELETED',
              userUid,
              subscriptionId: subscription.id,
              details: `Subscription ${subscription.id} deleted. Listings hidden and access downgraded.`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          break;
        }
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object as Stripe.Checkout.Session;
          await finalizeListingPaymentFromCheckoutSession(session, 'webhook');
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as any;
          const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice?.id;
          if (invoiceId && stripe) {
            try {
              const invoice = await stripe.invoices.retrieve(invoiceId);
              const invoiceSub = (invoice as any).subscription;
              const subId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub?.id;
              if (subId) {
                // Cancel the subscription immediately since a refund was issued
                const canceledSub = await stripe.subscriptions.cancel(subId);
                const refundUserUid = canceledSub.metadata?.userUid;

                // Update subscription record
                await db.collection('subscriptions').doc(subId).set({
                  status: 'canceled',
                  cancelAtPeriodEnd: true,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

                if (refundUserUid) {
                  // Hide all listings
                  const listingsSnap = await db.collection('listings')
                    .where('sellerUid', '==', refundUserUid)
                    .get();
                  const batch = db.batch();
                  listingsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    if (!['sold', 'archived'].includes(String(data.status || '').toLowerCase())) {
                      batch.update(doc.ref, {
                        paymentStatus: 'pending',
                        status: 'pending',
                        lastLifecycleAction: 'billing_visibility_suppressed',
                        lastLifecycleActorUid: 'system',
                        lastLifecycleActorRole: 'system',
                        lastLifecycleReason: 'Charge refunded — subscription canceled and listings hidden.',
                        lastLifecycleAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                      });
                    }
                  });
                  if (listingsSnap.docs.length > 0) await batch.commit();

                  // Downgrade user role
                  const userDoc = await db.collection('users').doc(refundUserUid).get();
                  if (userDoc.exists) {
                    await db.collection('users').doc(refundUserUid).update({
                      role: 'member',
                      accountAccessSource: 'free_member',
                      activeSubscriptionPlanId: null,
                      subscriptionStatus: 'canceled',
                      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                  }

                  await db.collection('billingAuditLogs').add({
                    action: 'CHARGE_REFUNDED_SUBSCRIPTION_CANCELED',
                    userUid: refundUserUid,
                    subscriptionId: subId,
                    chargeId: charge.id,
                    details: `Charge ${charge.id} refunded. Subscription ${subId} canceled. Listings hidden and access downgraded.`,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                  });
                }

                logger.info({ subscriptionId: subId }, 'Charge refund processed: subscription canceled, listings hidden');
              }
            } catch (refundErr: any) {
              logger.error({ err: refundErr }, 'Failed to process charge refund enforcement');
            }
          }
          break;
        }
        case 'identity.verification_session.verified': {
          const verificationSession = event.data.object as any;
          const verifiedUid = verificationSession.metadata?.firebase_uid;
          if (verifiedUid) {
            const bidderProfileRef = db.collection('users').doc(verifiedUid).collection('bidderProfile').doc('profile');
            await bidderProfileRef.set({
              idVerificationStatus: 'verified',
              verificationTier: 'approved',
              idVerifiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
          break;
        }
        case 'identity.verification_session.requires_input': {
          const verificationSession = event.data.object as any;
          const failedUid = verificationSession.metadata?.firebase_uid;
          if (failedUid) {
            const bidderProfileRef = db.collection('users').doc(failedUid).collection('bidderProfile').doc('profile');
            await bidderProfileRef.set({
              idVerificationStatus: 'failed',
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
          break;
        }
        case 'payment_intent.amount_capturable_updated': {
          const paymentIntent = event.data.object as any;
          const preAuthUid = paymentIntent.metadata?.firebase_uid;
          if (preAuthUid) {
            const bidderProfileRef = db.collection('users').doc(preAuthUid).collection('bidderProfile').doc('profile');
            await bidderProfileRef.set({
              preAuthStatus: 'held',
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
          break;
        }
        default:
          logger.info({ eventType: event.type }, 'Unhandled Stripe webhook event type');
      }
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Error updating database from webhook');
      return res.status(500).json({ error: 'Webhook processing failed.' });
    }

    res.json({ received: true });
  });

  // ── POST /api/billing/create-checkout-session ────────────────────────────────
  app.post('/api/billing/create-checkout-session', validateBody(checkoutSessionSchema), async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken, true);
        const plan = getListingCheckoutPlan(req.body?.planId);
        const listingId = String(req.body?.listingId || '').trim();

        if (!plan) {
          return res.status(400).json({ error: 'Invalid listing plan.' });
        }
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        const sessionId = buildLocalBillingStubSessionId('listing', plan.id, listingId, decodedToken.uid);
        const baseUrl = getRequestBaseUrl(req);
        return res.json({
          sessionId,
          url: `${baseUrl}/sell?checkout=success&session_id=${encodeURIComponent(sessionId)}&listingId=${encodeURIComponent(listingId)}&localBillingStub=1`,
          localBillingStub: true,
        });
      } catch (err) {
        logger.warn({ err }, 'Auth token verification failed');
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const uid = decodedToken.uid;
      const plan = getListingCheckoutPlan(req.body?.planId);
      const listingId = String(req.body?.listingId || '').trim();

      if (!plan) {
        return res.status(400).json({ error: 'Invalid listing plan.' });
      }
      if (!listingId) {
        return res.status(400).json({ error: 'Listing id is required.' });
      }

      const listingRef = db.collection('listings').doc(listingId);
      const listingSnap = await listingRef.get();
      if (!listingSnap.exists) {
        return res.status(404).json({ error: 'Listing not found.' });
      }

      const listing = listingSnap.data() || {};
      const listingOwnerUid = String(listing.sellerUid || listing.sellerId || '');
      if (!listingOwnerUid || listingOwnerUid !== uid) {
        return res.status(403).json({ error: 'You can only pay for your own listing.' });
      }

      if (String(listing.paymentStatus || '') === 'paid') {
        return res.status(409).json({ error: 'Listing is already paid.' });
      }

      const paidListingsSnap = await db
        .collection('listings')
        .where('sellerUid', '==', uid)
        .where('paymentStatus', '==', 'paid')
        .get();

      const activePaidListingsCount = paidListingsSnap.docs.filter((doc) => {
        if (doc.id === listingId) return false;
        const data = doc.data() as Record<string, unknown>;
        return String(data.status || 'active').toLowerCase() !== 'sold';
      }).length;

      if (!Number.isFinite(plan.listingCap) || plan.listingCap < 1) {
        return res.status(400).json({ error: 'This plan does not support listing checkout.' });
      }

      if (activePaidListingsCount >= plan.listingCap && plan.listingCap < UNLIMITED_LISTING_CAP) {
        return res.status(409).json({
          error: `Your ${plan.name} includes up to ${plan.listingCap} active ${plan.listingCap === 1 ? 'listing' : 'listings'}. Upgrade or mark one as sold before posting another.`,
        });
      }

      const baseUrl = getRequestBaseUrl(req);
      const priceId = await resolveStripePriceIdForPlan(plan);
      const customerId = await getOrCreateStripeCustomer(uid, decodedToken.email, decodedToken.name);
      const trialEnd = buildTrialEndForPlan(plan.id);

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        success_url: `${baseUrl}/sell?checkout=success&session_id={CHECKOUT_SESSION_ID}&listingId=${encodeURIComponent(listingId)}`,
        cancel_url: `${baseUrl}/sell?checkout=canceled&listingId=${encodeURIComponent(listingId)}`,
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: listingId,
        allow_promotion_codes: true,
        metadata: {
          userUid: uid,
          listingId,
          planId: plan.id,
          listingCap: String(plan.listingCap),
        },
        subscription_data: {
          ...(trialEnd ? { trial_end: trialEnd } : {}),
          metadata: {
            userUid: uid,
            listingId,
            planId: plan.id,
            listingCap: String(plan.listingCap),
          },
        },
      });

      if (!session.url) {
        return res.status(500).json({ error: 'Stripe checkout URL was not returned.' });
      }

      return res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to create Stripe checkout session');
      return res.status(500).json({ error: 'Failed to create checkout session.' });
    }
  });

  // ── GET /api/billing/checkout-session/:sessionId ─────────────────────────────
  app.get('/api/billing/checkout-session/:sessionId', async (req, res) => {
    const stubSession = parseLocalBillingStubSessionId(String(req.params.sessionId || ''));
    if (!stripe && isLocalBillingStubEnabled() && stubSession) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken, true);
        if (stubSession.uid && stubSession.uid !== decodedToken.uid) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        return res.json({
          sessionId: req.params.sessionId,
          status: 'complete',
          paid: true,
          listingId: stubSession.listingId,
          planId: stubSession.planId,
          scope: stubSession.scope,
          localBillingStub: true,
        });
      } catch (err) {
        logger.warn({ err }, 'Auth token verification failed');
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const uid = decodedToken.uid;
      const sessionId = String(req.params.sessionId || '').trim();
      if (!sessionId) {
        return res.status(400).json({ error: 'Session id is required.' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      if (String(session.metadata?.userUid || '') !== uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const finalized = await finalizeListingPaymentFromCheckoutSession(session, 'confirm');

      return res.json({
        sessionId: session.id,
        status: session.status,
        paid: finalized.paid,
        listingId: finalized.listingId,
        planId: finalized.planId,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to confirm Stripe checkout session');
      return res.status(500).json({ error: 'Failed to confirm checkout session.' });
    }
  });

  // ── POST /api/billing/create-portal-session ──────────────────────────────────
  app.post('/api/billing/create-portal-session', validateBody(portalSessionSchema), async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        await auth.verifyIdToken(idToken, true);
        const returnPathRaw = String(req.body?.returnPath || '/profile?tab=Account%20Settings').trim();
        const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/profile?tab=Account%20Settings';
        const baseUrl = getRequestBaseUrl(req);
        const separator = returnPath.includes('?') ? '&' : '?';
        return res.json({
          url: `${baseUrl}${returnPath}${separator}billingPortal=local-stub`,
          localBillingStub: true,
        });
      } catch (err) {
        logger.warn({ err }, 'Auth token verification failed');
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const uid = String(decodedToken.uid || '').trim();
      const email = String(decodedToken.email || '').trim().toLowerCase();
      const returnPathRaw = String(req.body?.returnPath || '/profile?tab=Account%20Settings').trim();
      const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/profile?tab=Account%20Settings';
      const baseUrl = getRequestBaseUrl(req);
      const separator = returnPath.includes('?') ? '&' : '?';

      const customerId = await findExistingStripeCustomerId(uid, email);
      if (!customerId) {
        return res.status(409).json({
          error: 'No active billing profile was found for this account yet. Choose an ad program before opening billing management.',
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}${returnPath}${separator}billingPortal=return`,
      });

      if (!session.url) {
        return res.status(500).json({ error: 'Stripe billing portal URL was not returned.' });
      }

      return res.json({
        url: session.url,
        stripeCustomerId: customerId,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to create billing portal session');
      return res.status(500).json({ error: 'Failed to create billing portal session.' });
    }
  });

  // ── POST /api/billing/cancel-subscription ────────────────────────────────────
  app.post('/api/billing/cancel-subscription', validateBody(cancelSubscriptionSchema), async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        await auth.verifyIdToken(idToken, true);
        return res.json({
          success: true,
          message: 'Local billing stub: subscription cancellation simulated.',
          localBillingStub: true,
        });
      } catch (err) {
        logger.warn({ err }, 'Auth token verification failed');
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const uid = String(decodedToken.uid || '').trim();

      const userDoc = await db.collection('users').doc(uid).get();
      const subscriptionId = userDoc.data()?.currentSubscriptionId;
      if (!subscriptionId) {
        return res.status(404).json({ error: 'No active subscription found for this account.' });
      }

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return apiSuccess(res, { message: 'Subscription will be canceled at the end of the current billing period.' });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to cancel subscription');
      return apiError(res, 500, 'CANCEL_FAILED', 'Failed to cancel subscription.');
    }
  });

  // ── POST /api/billing/create-account-checkout-session ────────────────────────
  app.post('/api/billing/create-account-checkout-session', validateBody(accountCheckoutSessionSchema), async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken, true);
        const plan = getListingCheckoutPlan(req.body?.planId);
        if (!plan) {
          return res.status(400).json({ error: 'Invalid seller plan.' });
        }

        const returnPathRaw = String(req.body?.returnPath || '/sell').trim();
        const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/sell';
        const baseUrl = getRequestBaseUrl(req);
        const separator = returnPath.includes('?') ? '&' : '?';
        const sessionId = buildLocalBillingStubSessionId('account', plan.id, null, decodedToken.uid);

        return res.json({
          sessionId,
          url: `${baseUrl}${returnPath}${separator}accountCheckout=success&session_id=${encodeURIComponent(sessionId)}&localBillingStub=1`,
          localBillingStub: true,
        });
      } catch (err) {
        logger.warn({ err }, 'Auth token verification failed');
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(503).json({
      error: 'Account checkout should be served by the shared billing proxy in local development. If Stripe is unavailable locally, enable LOCAL_BILLING_STUB=true.',
    });
  });

  // ── GET /api/admin/billing/bootstrap ──────────────────────────────────────────
  app.get('/api/admin/billing/bootstrap', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const uid = decodedToken.uid;

      // Verify admin role
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();
      const role = userData?.role || 'member';
      if (!['super_admin', 'admin', 'developer'].includes(role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const invoices: unknown[] = [];
      const subscriptions: unknown[] = [];
      const auditLogs: unknown[] = [];
      const accountAuditLogs: unknown[] = [];
      const sellerAgreementAcceptances: unknown[] = [];
      const errors: Record<string, string> = {};

      // Fetch invoices
      try {
        const snap = await db.collection('invoices').orderBy('createdAt', 'desc').limit(200).get();
        snap.docs.forEach(d => invoices.push({ id: d.id, ...d.data() }));
      } catch (err) {
        errors.invoices = 'Failed to fetch invoices';
        logger.warn({ err }, 'Admin billing bootstrap: invoices fetch failed');
      }

      // Fetch subscriptions
      try {
        const snap = await db.collection('subscriptions').orderBy('createdAt', 'desc').limit(200).get();
        snap.docs.forEach(d => subscriptions.push({ id: d.id, ...d.data() }));
      } catch (err) {
        errors.subscriptions = 'Failed to fetch subscriptions';
        logger.warn({ err }, 'Admin billing bootstrap: subscriptions fetch failed');
      }

      // Fetch audit logs
      try {
        const snap = await db.collection('billingAuditLogs').orderBy('timestamp', 'desc').limit(200).get();
        snap.docs.forEach(d => auditLogs.push({ id: d.id, ...d.data() }));
      } catch (err) {
        errors.auditLogs = 'Failed to fetch audit logs';
        logger.warn({ err }, 'Admin billing bootstrap: audit logs fetch failed');
      }

      // Fetch account audit logs
      try {
        const snap = await db.collection('accountAuditLogs').orderBy('timestamp', 'desc').limit(200).get();
        snap.docs.forEach(d => accountAuditLogs.push({ id: d.id, ...d.data() }));
      } catch (err) {
        errors.accountAuditLogs = 'Failed to fetch account audit logs';
        logger.warn({ err }, 'Admin billing bootstrap: account audit logs fetch failed');
      }

      // Fetch seller agreement acceptances
      try {
        const snap = await db.collection('sellerAgreementAcceptances').orderBy('acceptedAt', 'desc').limit(200).get();
        snap.docs.forEach(d => sellerAgreementAcceptances.push({ id: d.id, ...d.data() }));
      } catch (err) {
        errors.sellerAgreementAcceptances = 'Failed to fetch seller agreement acceptances';
        logger.warn({ err }, 'Admin billing bootstrap: seller acceptances fetch failed');
      }

      return res.json({
        invoices,
        subscriptions,
        auditLogs,
        accountAuditLogs,
        sellerAgreementAcceptances,
        partial: Object.keys(errors).length > 0,
        degradedSections: Object.keys(errors),
        errors,
        firestoreQuotaLimited: false,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'Admin billing bootstrap failed');
      return res.status(500).json({ error: 'Failed to load billing data' });
    }
  });

  // ── POST /api/billing/refresh-account-access ─────────────────────────────────
  app.post('/api/billing/refresh-account-access', async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken, true);
        return res.json(buildLocalBillingStubSummary(decodedToken));
      } catch (err) {
        logger.warn({ err }, 'Auth token verification failed');
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(503).json({
      error: 'Account access refresh should be served by the shared billing proxy in local development. If Stripe is unavailable locally, enable LOCAL_BILLING_STUB=true.',
    });
  });
}
