import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import Stripe from 'stripe';
import type { Server as SocketIOServer } from 'socket.io';
import type { AuctionTimerManager } from '../auctionTimerManager.js';
import { emitBidPlaced, emitLotExtended, emitLotClosed } from '../auctionSocketServer.js';
import { validateBody, placeBidSchema, retractBidSchema, closeLotSchema, activateAuctionSchema, preauthHoldSchema, confirmPreauthSchema, sellerPayoutSchema } from '../../utils/apiValidation.js';
import { captureServerException } from '../../../sentry.server.js';
import logger from '../logger.js';

export interface AuctionRouteDeps {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  stripe: Stripe | null;
  sendServerEmail: (opts: { to: string; cc?: string | string[]; subject: string; html: string }) => Promise<void>;
  emailTemplates: Record<string, any> | null;
  getOrCreateStripeCustomer: (userUid: string, email?: string, name?: string) => Promise<string>;
  isPrivilegedAdminEmail: (email: unknown) => boolean;
  canAdministrateAccountRole: (role: unknown) => boolean;
  parseDate: (value: unknown) => Date | null;
  normalizeNonEmptyString: (value: unknown, fallback?: string) => string;
  apiSuccess: <T>(res: express.Response, data: T, meta?: Record<string, unknown>) => express.Response;
  apiError: (res: express.Response, status: number, code: string, message: string) => express.Response;
  APP_BASE_URL: string;
}

export function registerAuctionRoutes(
  app: express.Express,
  deps: AuctionRouteDeps,
): { closeLotByTimer: (database: admin.firestore.Firestore, auctionId: string, lotId: string, io: SocketIOServer) => Promise<void> } {
  const {
    db,
    auth,
    stripe,
    sendServerEmail,
    emailTemplates,
    getOrCreateStripeCustomer,
    isPrivilegedAdminEmail,
    canAdministrateAccountRole,
    parseDate,
    normalizeNonEmptyString,
    apiSuccess,
    apiError,
    APP_BASE_URL,
  } = deps;

  // Preserve the original APP_URL reference used in outbid email (line 3849 of server.ts)
  const APP_URL = APP_BASE_URL;

  // ─── Auction Bid Endpoints ───────────────────────────────────────────────────

  /**
   * Tiered bid increment schedule — mirrors src/services/auctionService.ts
   */
  // ── Auction Invoice & Utility Helpers ─────────────────────────────────────

  function calculateBuyerPremium(amount: number, _defaultPercent?: number): number {
    // Tiered: 10% on first $10K, 7% on $10K-$75K, 5% on $75K-$250K, 3% on $250K+
    let premium = 0;
    if (amount <= 10000) return Math.round(amount * 0.10 * 100) / 100;
    premium += 10000 * 0.10; // $1,000
    if (amount <= 75000) return Math.round((premium + (amount - 10000) * 0.07) * 100) / 100;
    premium += 65000 * 0.07; // $4,550
    if (amount <= 250000) return Math.round((premium + (amount - 75000) * 0.05) * 100) / 100;
    premium += 175000 * 0.05; // $8,750
    return Math.round((premium + (amount - 250000) * 0.03) * 100) / 100;
  }

  function addBusinessDays(date: Date, days: number): string {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) added++;
    }
    return result.toISOString();
  }

  // State sales tax rates for MN, WI, MI
  const STATE_TAX_RATES: Record<string, number> = {
    MN: 0.06875,
    MINNESOTA: 0.06875,
    WI: 0.05,
    WISCONSIN: 0.05,
    MI: 0.06,
    MICHIGAN: 0.06,
  };

  function extractStateFromLocation(location: string): string {
    // Parse "City, ST, Country" or "City, State" format
    const parts = location.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // State is typically the second-to-last part (before country) or the last part
      const candidate = parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1];
      return candidate.toUpperCase();
    }
    return '';
  }

  function formatUsdAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  /**
   * Send invoice notification emails to the winning bidder and the seller.
   * Called after generateAuctionInvoice produces the invoice document.
   */
  async function sendLotSoldEmailNotifications(
    lot: Record<string, unknown>,
    auction: Record<string, unknown>,
    invoiceDoc: { winningBid: number; buyerPremium: number; salesTax: number; totalDue: number; taxExempt: boolean; dueDate: string; sellerCommission: number; sellerPayout: number },
  ): Promise<void> {
    if (!emailTemplates) return;

    const buyerId = String(lot.winningBidderId || '');
    const sellerId = String(lot.sellerId || '');
    const lotTitle = String(lot.title || lot.name || 'Auction Lot');
    const auctionTitle = String(auction.title || 'Auction');
    const auctionSlug = String(auction.slug || '');
    const lotId = String(lot.id || '');

    const paymentDeadlineFormatted = new Date(invoiceDoc.dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const invoiceUrl = `${APP_BASE_URL}/auctions/${encodeURIComponent(auctionSlug)}`;
    const lotUrl = `${APP_BASE_URL}/auctions/${encodeURIComponent(auctionSlug)}?lot=${encodeURIComponent(lotId)}`;

    // ── Buyer notification ──────────────────────────────────────────────
    if (buyerId) {
      try {
        const buyerSnap = await db.collection('users').doc(buyerId).get();
        const buyerData = buyerSnap.exists ? buyerSnap.data() : null;
        const buyerEmail = String(buyerData?.email || '').trim().toLowerCase();
        const buyerName = String(buyerData?.displayName || buyerData?.name || '').trim() || 'there';

        if (buyerEmail && emailTemplates.auctionInvoiceGenerated) {
          const { subject, html } = emailTemplates.auctionInvoiceGenerated({
            displayName: buyerName,
            auctionTitle,
            lotTitle,
            winningBid: formatUsdAmount(invoiceDoc.winningBid),
            buyerPremium: formatUsdAmount(invoiceDoc.buyerPremium),
            salesTax: formatUsdAmount(invoiceDoc.salesTax),
            totalDue: formatUsdAmount(invoiceDoc.totalDue),
            taxExempt: invoiceDoc.taxExempt,
            paymentDeadline: paymentDeadlineFormatted,
            invoiceUrl,
          });
          await sendServerEmail({ to: buyerEmail, subject, html });
        }
      } catch (buyerEmailError) {
        logger.error({ err: buyerEmailError }, 'Failed to send buyer invoice email');
      }
    }

    // ── Seller notification ─────────────────────────────────────────────
    if (sellerId) {
      try {
        const sellerSnap = await db.collection('users').doc(sellerId).get();
        const sellerData = sellerSnap.exists ? sellerSnap.data() : null;
        const sellerEmail = String(sellerData?.email || '').trim().toLowerCase();
        const sellerName = String(sellerData?.displayName || sellerData?.name || sellerData?.businessName || '').trim() || 'there';

        if (sellerEmail && emailTemplates.auctionLotSoldSeller) {
          const { subject, html } = emailTemplates.auctionLotSoldSeller({
            sellerName,
            auctionTitle,
            lotTitle,
            winningBid: formatUsdAmount(invoiceDoc.winningBid),
            estimatedPayout: formatUsdAmount(invoiceDoc.sellerPayout),
            commissionRate: '10%',
            paymentDeadline: paymentDeadlineFormatted,
            lotUrl,
          });
          await sendServerEmail({ to: sellerEmail, subject, html });
        }
      } catch (sellerEmailError) {
        logger.error({ err: sellerEmailError }, 'Failed to send seller lot-sold email');
      }
    }
  }

  async function generateAuctionInvoice(
    auctionId: string,
    lot: Record<string, unknown>,
    auction: Record<string, unknown>,
  ): Promise<{ ref: FirebaseFirestore.DocumentReference; invoiceData: { winningBid: number; buyerPremium: number; salesTax: number; totalDue: number; taxExempt: boolean; dueDate: string; sellerCommission: number; sellerPayout: number } }> {
    const winningBid = Number(lot.winningBid) || 0;
    const buyerPremiumPercent = typeof lot.buyerPremiumPercent === 'number'
      ? lot.buyerPremiumPercent
      : (typeof auction.defaultBuyerPremiumPercent === 'number' ? auction.defaultBuyerPremiumPercent : 10);
    const buyerPremium = calculateBuyerPremium(winningBid, buyerPremiumPercent);
    const documentationFee = 75;

    // Determine sales tax rate based on lot pickup location state
    const pickupLocation = String(lot.pickupLocation || '');
    const stateKey = extractStateFromLocation(pickupLocation);
    let salesTaxRate = STATE_TAX_RATES[stateKey] ?? 0.06875; // Default to MN rate
    const salesTaxState = stateKey === 'WISCONSIN' || stateKey === 'WI' ? 'WI'
      : stateKey === 'MICHIGAN' || stateKey === 'MI' ? 'MI' : 'MN';

    // Check buyer's tax exemption certificate
    let isTaxExempt = false;
    let taxExemptCertificateId = '';
    const buyerId = String(lot.winningBidderId || '');
    if (buyerId) {
      try {
        const bidderProfileSnap = await db.collection('users').doc(buyerId)
          .collection('bidderProfile').doc('profile').get();
        if (bidderProfileSnap.exists) {
          const bidderProfile = bidderProfileSnap.data()!;
          const profileTaxExempt = Boolean(bidderProfile.taxExempt);
          const profileCertUrl = String(bidderProfile.taxExemptCertificateUrl || '').trim();
          const profileExemptState = String(bidderProfile.taxExemptState || '').trim().toUpperCase();

          if (profileTaxExempt && profileCertUrl && profileExemptState === salesTaxState) {
            // MN: logging equipment qualifies under ST3 Certificate of Exemption
            // WI: farm machinery and logging equipment exempt under Wisconsin Exemption Certificate
            // MI: industrial processing exemption with valid Form 3372
            isTaxExempt = true;
            salesTaxRate = 0;
            taxExemptCertificateId = profileCertUrl;
            logger.info({ buyerId, salesTaxState }, 'Tax exemption applied for auction invoice');
          }
        }
      } catch (taxExemptError) {
        logger.error({ err: taxExemptError }, 'Error checking tax exemption, continuing with standard rate');
      }
    }

    const taxableAmount = winningBid + buyerPremium;
    const salesTax = Math.round(taxableAmount * salesTaxRate * 100) / 100;
    const totalDue = winningBid + buyerPremium + documentationFee + salesTax;
    const sellerCommissionRate = 0.10;
    const sellerCommission = Math.round(winningBid * sellerCommissionRate * 100) / 100;
    const sellerPayout = Math.round((winningBid - sellerCommission) * 100) / 100;

    const paymentDeadlineDays = typeof lot.paymentDeadlineDays === 'number'
      ? lot.paymentDeadlineDays
      : (typeof auction.defaultPaymentDeadlineDays === 'number' ? auction.defaultPaymentDeadlineDays : 3);

    const lotTitle = String(lot.title || lot.name || 'Auction Lot');
    const dueDate = addBusinessDays(new Date(), paymentDeadlineDays);

    // Create Firestore invoice document
    const invoiceRef = await db.collection('auctionInvoices').add({
      auctionId,
      lotId: String(lot.id || ''),
      buyerId,
      sellerId: String(lot.sellerId || ''),
      winningBid,
      buyerPremium,
      documentationFee,
      salesTax,
      salesTaxRate,
      salesTaxState,
      taxExempt: isTaxExempt,
      ...(isTaxExempt && taxExemptCertificateId ? { taxExemptCertificateId } : {}),
      totalDue: Math.round(totalDue * 100) / 100,
      status: 'pending',
      paymentMethod: null,
      paidAt: null,
      dueDate,
      sellerCommission,
      sellerPayout,
      sellerPaidAt: null,
      stripeInvoiceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create and send Stripe invoice to winning bidder
    if (stripe && buyerId) {
      try {
        // Look up the winning bidder's email from their user document
        const buyerSnap = await db.collection('users').doc(buyerId).get();
        const buyerData = buyerSnap.exists ? buyerSnap.data() : null;
        const buyerEmail = String(buyerData?.email || '').trim();
        const buyerName = String(buyerData?.displayName || buyerData?.name || '').trim();

        if (buyerEmail) {
          // Create or retrieve a Stripe customer for the buyer (reuse existing pattern)
          const stripeCustomerId = await getOrCreateStripeCustomer(buyerId, buyerEmail, buyerName || undefined);

          // Calculate due date as Unix timestamp for Stripe
          const dueDateUnix = Math.floor(new Date(dueDate).getTime() / 1000);

          // Create the Stripe invoice
          const stripeInvoice = await stripe.invoices.create({
            customer: stripeCustomerId,
            collection_method: 'send_invoice',
            due_date: dueDateUnix,
            auto_advance: true,
            metadata: {
              auctionInvoiceId: invoiceRef.id,
              auctionId,
              lotId: String(lot.id || ''),
              buyerId,
              platform: 'timberequip',
            },
          });

          // Line 1: Winning Bid amount
          await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            invoice: stripeInvoice.id,
            amount: Math.round(winningBid * 100), // Stripe uses cents
            currency: 'usd',
            description: `Winning Bid - ${lotTitle}`,
          });

          // Line 2: Buyer Premium
          await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            invoice: stripeInvoice.id,
            amount: Math.round(buyerPremium * 100),
            currency: 'usd',
            description: 'Buyer Premium',
          });

          // Line 3: Documentation Fee
          await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            invoice: stripeInvoice.id,
            amount: Math.round(documentationFee * 100),
            currency: 'usd',
            description: 'Documentation Fee',
          });

          // Line 4: Sales Tax (if not exempt)
          if (salesTax > 0) {
            const taxRateDisplay = Math.round(salesTaxRate * 10000) / 100; // e.g., 6.875 -> 6.88%
            await stripe.invoiceItems.create({
              customer: stripeCustomerId,
              invoice: stripeInvoice.id,
              amount: Math.round(salesTax * 100),
              currency: 'usd',
              description: `Sales Tax (${salesTaxState} ${taxRateDisplay}%)`,
            });
          }

          // Finalize and send the invoice (auto-sends email to buyer)
          await stripe.invoices.finalizeInvoice(stripeInvoice.id);
          await stripe.invoices.sendInvoice(stripeInvoice.id);

          // Store the Stripe invoice ID on the Firestore document
          await invoiceRef.update({
            stripeInvoiceId: stripeInvoice.id,
            updatedAt: new Date().toISOString(),
          });

          logger.info({ stripeInvoiceId: stripeInvoice.id, auctionInvoiceId: invoiceRef.id }, 'Stripe invoice created and sent for auction invoice');
        } else {
          logger.warn({ buyerId }, 'No email found for buyer, skipping Stripe invoice creation');
        }
      } catch (stripeErr: any) {
        // Log the error but do not fail the entire invoice creation —
        // the Firestore invoice is still valid, Stripe can be retried.
        logger.error({ err: stripeErr, auctionInvoiceId: invoiceRef.id }, 'Failed to create Stripe invoice for auction invoice');
        captureServerException(stripeErr, {
          tags: { endpoint: 'generateAuctionInvoice', phase: 'stripe_invoice_creation' },
        });
      }
    }

    return {
      ref: invoiceRef,
      invoiceData: {
        winningBid,
        buyerPremium,
        salesTax,
        totalDue: Math.round(totalDue * 100) / 100,
        taxExempt: isTaxExempt,
        dueDate,
        sellerCommission,
        sellerPayout,
      },
    };
  }

  function getBidIncrement(currentBid: number): number {
    if (currentBid < 250) return 10;
    if (currentBid < 500) return 25;
    if (currentBid < 1000) return 50;
    if (currentBid < 5000) return 100;
    if (currentBid < 10000) return 250;
    if (currentBid < 25000) return 500;
    if (currentBid < 50000) return 1000;
    if (currentBid < 100000) return 2500;
    if (currentBid < 250000) return 5000;
    return 10000;
  }

  /**
   * Generate a deterministic anonymous bidder ID for a given user + auction pair.
   */
  function generateAnonymousBidderId(uid: string, auctionId: string): string {
    return 'Bidder-' + crypto.createHash('sha256').update(`${uid}:${auctionId}`).digest('hex').substring(0, 6).toUpperCase();
  }

  // Rate limiter: 10 bids per minute per user (keyed by Firebase UID extracted from auth header)
  const bidPlacementLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req: express.Request) => {
      // Use the Authorization bearer token as the key so it's per-user, not per-IP
      const token = req.headers.authorization?.split('Bearer ')[1] || '';
      return token ? crypto.createHash('sha256').update(token).digest('hex') : req.ip || 'unknown';
    },
    message: { error: 'Too many bid requests. Please wait a moment before bidding again.' },
  });
  app.use('/api/auctions/place-bid', bidPlacementLimiter);

  // ── POST /api/auctions/place-bid ──────────────────────────────────────────
  app.post('/api/auctions/place-bid', validateBody(placeBidSchema), async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Not authenticated.' });

    let uid: string;
    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      uid = decodedToken.uid;
    } catch (err) {
      logger.warn({ err }, 'Auth token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const { auctionId, lotId, amount, maxBid } = req.body || {};

    if (!auctionId || typeof auctionId !== 'string') {
      return res.status(400).json({ error: 'auctionId is required.' });
    }
    if (!lotId || typeof lotId !== 'string') {
      return res.status(400).json({ error: 'lotId is required.' });
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number.' });
    }
    if (maxBid !== undefined && maxBid !== null && (typeof maxBid !== 'number' || !Number.isFinite(maxBid) || maxBid < amount)) {
      return res.status(400).json({ error: 'maxBid must be a number >= amount, or omitted.' });
    }

    try {
      const result = await db.runTransaction(async (tx) => {
        // 1. Read all required documents inside the transaction
        const auctionRef = db.collection('auctions').doc(auctionId);
        const lotRef = db.collection('auctions').doc(auctionId).collection('lots').doc(lotId);
        const bidderProfileRef = db.collection('users').doc(uid).collection('bidderProfile').doc('profile');

        const [auctionSnap, lotSnap, bidderProfileSnap] = await Promise.all([
          tx.get(auctionRef),
          tx.get(lotRef),
          tx.get(bidderProfileRef),
        ]);

        if (!auctionSnap.exists) {
          return { status: 404, body: { error: 'Auction not found.' } };
        }
        if (!lotSnap.exists) {
          return { status: 404, body: { error: 'Lot not found.' } };
        }

        const auctionData = auctionSnap.data()!;
        const lotData = lotSnap.data()!;
        const bidderProfileData = bidderProfileSnap.exists ? bidderProfileSnap.data()! : null;

        // 2. Validate auction status
        if (auctionData.status !== 'active') {
          return { status: 409, body: { error: 'Auction is not active.' } };
        }

        // 3. Validate lot status
        const lotStatus = String(lotData.status || '');
        if (lotStatus !== 'active' && lotStatus !== 'extended') {
          return { status: 409, body: { error: 'Lot is not open for bidding.' } };
        }

        // 4. Validate server time < lot endTime
        const now = Date.now();
        const lotEndTime = parseDate(lotData.endTime);
        if (!lotEndTime || now >= lotEndTime.getTime()) {
          return { status: 409, body: { error: 'Lot bidding period has ended.' } };
        }

        // 5. Validate bidder profile exists and verification tier
        if (!bidderProfileData) {
          return { status: 403, body: { error: 'Bidder profile not found. Please complete bidder registration.' } };
        }
        const tier = String(bidderProfileData.verificationTier || '');
        if (tier !== 'verified' && tier !== 'approved') {
          return { status: 403, body: { error: 'Bidder must be verified or approved to place bids.' } };
        }

        // 6. Validate pre-auth status
        if (bidderProfileData.preAuthStatus !== 'held') {
          return { status: 403, body: { error: 'A payment pre-authorization hold is required before bidding.' } };
        }

        // 7. Validate bid amount meets minimum
        const currentBid = typeof lotData.currentBid === 'number' ? lotData.currentBid : 0;
        const startingBid = typeof lotData.startingBid === 'number' ? lotData.startingBid : 0;
        const minimumBid = currentBid === 0 ? startingBid : currentBid + getBidIncrement(currentBid);

        if (amount < minimumBid) {
          return { status: 400, body: { error: `Bid must be at least $${minimumBid.toLocaleString()}.` } };
        }

        // 8. Prevent self-outbidding
        if (lotData.currentBidderId === uid) {
          return { status: 409, body: { error: 'You are already the highest bidder.' } };
        }

        // 9. Check non-payment count
        const nonPaymentCount = typeof bidderProfileData.nonPaymentCount === 'number' ? bidderProfileData.nonPaymentCount : 0;
        if (nonPaymentCount >= 2) {
          return { status: 403, body: { error: 'Bidding suspended due to non-payment history.' } };
        }

        // 10. Generate anonymous bidder ID
        const bidderAnonymousId = generateAnonymousBidderId(uid, auctionId);

        // 11. Determine soft-close extension
        const softCloseThresholdMs = ((typeof lotData.softCloseThresholdMin === 'number' ? lotData.softCloseThresholdMin : 3) * 60000);
        const softCloseExtensionMs = ((typeof lotData.softCloseExtensionMin === 'number' ? lotData.softCloseExtensionMin : 2) * 60000);
        const timeRemaining = lotEndTime.getTime() - now;
        const triggeredExtension = timeRemaining < softCloseThresholdMs;

        // 12. Create the bid document
        const bidRef = lotRef.collection('bids').doc();
        const bidTimestamp = new Date().toISOString();
        const bidType = (maxBid !== undefined && maxBid !== null) ? 'proxy' : 'manual';

        const bidDoc = {
          id: bidRef.id,
          lotId,
          auctionId,
          bidderId: uid,
          bidderAnonymousId,
          amount,
          maxBid: (maxBid !== undefined && maxBid !== null) ? maxBid : null,
          type: bidType,
          status: 'active',
          timestamp: bidTimestamp,
          triggeredExtension,
        };

        tx.set(bidRef, bidDoc);

        // 13. Update lot
        const reservePrice = typeof lotData.reservePrice === 'number' ? lotData.reservePrice : null;
        const reserveMet = reservePrice !== null ? amount >= reservePrice : (lotData.reserveMet || false);

        let newEndTime = lotEndTime;
        let newLotStatus = lotStatus;
        let newExtensionCount = typeof lotData.extensionCount === 'number' ? lotData.extensionCount : 0;

        if (triggeredExtension) {
          newEndTime = new Date(lotEndTime.getTime() + softCloseExtensionMs);
          newLotStatus = 'extended';
          newExtensionCount += 1;
        }

        const lotUpdate: Record<string, unknown> = {
          currentBid: amount,
          currentBidderId: uid,
          currentBidderAnonymousId: bidderAnonymousId,
          bidCount: admin.firestore.FieldValue.increment(1),
          lastBidTime: bidTimestamp,
          reserveMet,
        };

        if (triggeredExtension) {
          lotUpdate.endTime = newEndTime.toISOString();
          lotUpdate.status = newLotStatus;
          lotUpdate.extensionCount = newExtensionCount;
        }

        tx.update(lotRef, lotUpdate);

        // 14. Increment auction totalBids
        tx.update(auctionRef, {
          totalBids: admin.firestore.FieldValue.increment(1),
        });

        // 15. Proxy bid handling — check if previous high bidder had a proxy/maxBid
        const previousBidderId = lotData.currentBidderId ? String(lotData.currentBidderId) : null;

        if (previousBidderId && previousBidderId !== uid) {
          // Look up the previous winning bid to check for a maxBid
          // We need to query outside the transaction for the previous bid, but we already have lotData
          // The previous winning bid's maxBid would have been the highest proxy. We check by reading bids.
          // However, inside a Firestore transaction we can only do gets, not queries. We'll use a
          // simplified approach: store the previous bid info we need on the lot itself for proxy resolution.
          // Instead, we look for the scenario: the previous bidder may have a proxy bid that auto-counters.

          // To handle proxy bids properly, we query the bids collection for the previous high bidder's
          // most recent active bid on this lot. Since we cannot do collection queries inside a transaction,
          // we handle proxy bids by reading a known bid reference. The lot stores currentBidderId,
          // so we check if the previous winning bid had a maxBid set by reading the lot's last bid info.
          // A pragmatic approach: store previousMaxBid on the lot, or resolve after transaction.
          // For correctness within a single transaction, we handle the common proxy scenario:

          // Since Firestore transactions support get() on document references,
          // we can check the previous high bidder's most recent bid if we track it.
          // For now, we handle this in a post-transaction step (see below).
        }

        return {
          status: 200,
          body: {
            success: true,
            bidId: bidRef.id,
            amount,
            triggeredExtension,
            newEndTime: newEndTime.toISOString(),
          },
          _socketPayload: {
            bidId: bidRef.id,
            bidderAnonymousId,
            bidCount: (typeof lotData.bidCount === 'number' ? lotData.bidCount : 0) + 1,
            currentBid: amount,
            timestamp: bidTimestamp,
            triggeredExtension,
            newEndTime: newEndTime.toISOString(),
            extensionCount: newExtensionCount,
            previousBidderId: previousBidderId || null,
          },
          // Pass context for post-transaction proxy bid resolution
          proxyContext: previousBidderId ? {
            previousBidderId,
            newBidAmount: amount,
            newBidderMaxBid: (maxBid !== undefined && maxBid !== null) ? maxBid : null,
            lotId,
            auctionId,
          } : null,
        };
      });

      // Post-transaction proxy bid resolution
      // This runs outside the main transaction for the previous high bidder's proxy counter-bid
      if (result.status === 200 && (result as any).proxyContext) {
        const ctx = (result as any).proxyContext as {
          previousBidderId: string;
          newBidAmount: number;
          newBidderMaxBid: number | null;
          lotId: string;
          auctionId: string;
        };

        try {
          // Find the previous high bidder's most recent active bid with a maxBid
          const prevBidsSnap = await db.collection('auctions').doc(ctx.auctionId)
            .collection('lots').doc(ctx.lotId)
            .collection('bids')
            .where('bidderId', '==', ctx.previousBidderId)
            .where('status', '==', 'active')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          if (!prevBidsSnap.empty) {
            const prevBidData = prevBidsSnap.docs[0].data();
            const prevMaxBid = typeof prevBidData.maxBid === 'number' ? prevBidData.maxBid : null;

            if (prevMaxBid !== null && prevMaxBid > ctx.newBidAmount) {
              // Previous bidder's proxy can counter
              const counterAmount = ctx.newBidAmount + getBidIncrement(ctx.newBidAmount);

              if (ctx.newBidderMaxBid !== null && ctx.newBidderMaxBid > prevMaxBid) {
                // New bidder's max beats previous max — new bidder wins at prevMaxBid + increment
                const resolvedAmount = prevMaxBid + getBidIncrement(prevMaxBid);
                const finalAmount = Math.min(resolvedAmount, ctx.newBidderMaxBid);

                await db.runTransaction(async (tx2) => {
                  const lotRef2 = db.collection('auctions').doc(ctx.auctionId).collection('lots').doc(ctx.lotId);
                  const lotSnap2 = await tx2.get(lotRef2);
                  if (!lotSnap2.exists) return;

                  // Create auto-counter bid for the new bidder at the resolved amount
                  const autoBidRef = lotRef2.collection('bids').doc();
                  tx2.set(autoBidRef, {
                    id: autoBidRef.id,
                    lotId: ctx.lotId,
                    auctionId: ctx.auctionId,
                    bidderId: uid,
                    bidderAnonymousId: generateAnonymousBidderId(uid, ctx.auctionId),
                    amount: finalAmount,
                    maxBid: ctx.newBidderMaxBid,
                    type: 'proxy',
                    status: 'active',
                    timestamp: new Date().toISOString(),
                    triggeredExtension: false,
                  });

                  // Mark the previous bidder's bid as outbid
                  tx2.update(prevBidsSnap.docs[0].ref, { status: 'outbid' });

                  tx2.update(lotRef2, {
                    currentBid: finalAmount,
                    currentBidderId: uid,
                    currentBidderAnonymousId: generateAnonymousBidderId(uid, ctx.auctionId),
                    bidCount: admin.firestore.FieldValue.increment(1),
                    lastBidTime: new Date().toISOString(),
                  });

                  tx2.update(db.collection('auctions').doc(ctx.auctionId), {
                    totalBids: admin.firestore.FieldValue.increment(1),
                  });
                });
              } else {
                // Previous bidder's proxy wins — auto-counter at newBidAmount + increment
                const finalCounter = Math.min(counterAmount, prevMaxBid);

                await db.runTransaction(async (tx2) => {
                  const lotRef2 = db.collection('auctions').doc(ctx.auctionId).collection('lots').doc(ctx.lotId);
                  const lotSnap2 = await tx2.get(lotRef2);
                  if (!lotSnap2.exists) return;

                  const prevAnonymousId = generateAnonymousBidderId(ctx.previousBidderId, ctx.auctionId);

                  // Create auto-counter bid for the previous high bidder
                  const autoBidRef = lotRef2.collection('bids').doc();
                  tx2.set(autoBidRef, {
                    id: autoBidRef.id,
                    lotId: ctx.lotId,
                    auctionId: ctx.auctionId,
                    bidderId: ctx.previousBidderId,
                    bidderAnonymousId: prevAnonymousId,
                    amount: finalCounter,
                    maxBid: prevMaxBid,
                    type: 'proxy',
                    status: 'active',
                    timestamp: new Date().toISOString(),
                    triggeredExtension: false,
                  });

                  tx2.update(lotRef2, {
                    currentBid: finalCounter,
                    currentBidderId: ctx.previousBidderId,
                    currentBidderAnonymousId: prevAnonymousId,
                    bidCount: admin.firestore.FieldValue.increment(1),
                    lastBidTime: new Date().toISOString(),
                  });

                  tx2.update(db.collection('auctions').doc(ctx.auctionId), {
                    totalBids: admin.firestore.FieldValue.increment(1),
                  });
                });

                // Update the response to reflect that the proxy counter-bid won
                (result as any).body.proxyOutbid = true;
              }
            }
          }
        } catch (proxyError) {
          // Log but don't fail the original bid — proxy resolution is best-effort
          logger.error({ err: proxyError }, 'Proxy bid resolution error');
          captureServerException(proxyError, { tags: { endpoint: 'place-bid-proxy' } });
        }
      }

      // Send outbid notification email to previous high bidder (fire-and-forget)
      if (result.status === 200 && (result as any)._socketPayload) {
        const sp = (result as any)._socketPayload;
        const prevBidderId = sp.previousBidderId;
        if (prevBidderId && prevBidderId !== uid) {
          (async () => {
            try {
              const prevUserSnap = await db.collection('users').doc(prevBidderId).get();
              if (prevUserSnap.exists) {
                const prevUser = prevUserSnap.data();
                if (prevUser?.email) {
                  const auctionSnap2 = await db.collection('auctions').doc(auctionId).get();
                  const auctionData = auctionSnap2.exists ? auctionSnap2.data() : {};
                  const lotSnap2 = await db.collection('auctions').doc(auctionId).collection('lots').doc(lotId).get();
                  const lotData2 = lotSnap2.exists ? lotSnap2.data() : {};
                  const lotTitle = lotData2?.title || `Lot ${lotData2?.lotNumber || ''}`;
                  const auctionSlug = auctionData?.slug || auctionId;
                  const lotUrl = `${APP_URL}/auctions/${auctionSlug}/lots/${lotData2?.lotNumber || lotId}`;
                  await sendServerEmail({
                    to: prevUser.email,
                    subject: `You've been outbid on ${lotTitle}`,
                    html: `<p>Hi ${prevUser.displayName || 'there'},</p><p>You have been outbid on <strong>${lotTitle}</strong> in <strong>${auctionData?.title || 'an auction'}</strong>. The current high bid is now <strong>$${amount.toLocaleString()}</strong>.</p><p><a href="${lotUrl}">Place a higher bid now</a></p><p>— Forestry Equipment Sales</p>`,
                  });
                }
              }
            } catch (outbidErr) {
              logger.error({ err: outbidErr }, 'Failed to send outbid email');
            }
          })();
        }
      }

      // Emit bid event via Socket.IO for instant updates
      if (result.status === 200 && (result as any)._socketPayload) {
        const io = (app as any).__socketIO as SocketIOServer | undefined;
        if (io) {
          const sp = (result as any)._socketPayload;
          emitBidPlaced(io, {
            lotId,
            auctionId,
            bidId: sp.bidId,
            amount,
            bidderAnonymousId: sp.bidderAnonymousId,
            bidCount: sp.bidCount,
            currentBid: sp.currentBid,
            timestamp: sp.timestamp,
            triggeredExtension: sp.triggeredExtension,
            newEndTime: sp.newEndTime,
          });

          if (sp.triggeredExtension) {
            emitLotExtended(io, {
              lotId,
              auctionId,
              newEndTime: sp.newEndTime,
              extensionCount: sp.extensionCount,
              status: 'extended',
            });

            // Reschedule timer for the extended endTime
            const tm = (app as any).__timerManager as AuctionTimerManager | undefined;
            if (tm) {
              tm.rescheduleLotClosure(auctionId, lotId, sp.newEndTime, async (aid, lid) => {
                await closeLotByTimer(db, aid, lid, io);
              });
            }
          }
        }
      }

      return res.status(result.status).json(result.body);
    } catch (error: any) {
      logger.error({ err: error }, 'Place bid transaction error');
      captureServerException(error, { tags: { endpoint: 'place-bid' } });
      return res.status(500).json({ error: 'An internal error occurred while placing the bid.' });
    }
  });

  // Rate limiter: 5 retractions per minute per user
  const bidRetractionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req: express.Request) => {
      const token = req.headers.authorization?.split('Bearer ')[1] || '';
      return token ? crypto.createHash('sha256').update(token).digest('hex') : req.ip || 'unknown';
    },
    message: { error: 'Too many retraction requests. Please wait a moment.' },
  });
  app.use('/api/auctions/retract-bid', bidRetractionLimiter);

  // ── POST /api/auctions/retract-bid ────────────────────────────────────────
  app.post('/api/auctions/retract-bid', validateBody(retractBidSchema), async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Not authenticated.' });

    let uid: string;
    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      uid = decodedToken.uid;
    } catch (err) {
      logger.warn({ err }, 'Auth token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const { auctionId, lotId, bidId } = req.body || {};

    if (!auctionId || typeof auctionId !== 'string') {
      return res.status(400).json({ error: 'auctionId is required.' });
    }
    if (!lotId || typeof lotId !== 'string') {
      return res.status(400).json({ error: 'lotId is required.' });
    }
    if (!bidId || typeof bidId !== 'string') {
      return res.status(400).json({ error: 'bidId is required.' });
    }

    try {
      const result = await db.runTransaction(async (tx) => {
        const lotRef = db.collection('auctions').doc(auctionId).collection('lots').doc(lotId);
        const bidRef = lotRef.collection('bids').doc(bidId);

        const [lotSnap, bidSnap] = await Promise.all([
          tx.get(lotRef),
          tx.get(bidRef),
        ]);

        if (!lotSnap.exists) {
          return { status: 404, body: { error: 'Lot not found.' } };
        }
        if (!bidSnap.exists) {
          return { status: 404, body: { error: 'Bid not found.' } };
        }

        const lotData = lotSnap.data()!;
        const bidData = bidSnap.data()!;

        // 1. Verify bid belongs to requesting user
        if (bidData.bidderId !== uid) {
          return { status: 403, body: { error: 'You can only retract your own bids.' } };
        }

        // 2. Verify lot is still active/extended
        const lotStatus = String(lotData.status || '');
        if (lotStatus !== 'active' && lotStatus !== 'extended') {
          return { status: 409, body: { error: 'Lot is no longer open for bidding.' } };
        }

        // 3. Set bid status to 'retracted'
        tx.update(bidRef, { status: 'retracted' });

        return {
          status: 200,
          body: { success: true },
          needsFallbackUpdate: true,
          auctionId,
          lotId,
          lotRef,
        };
      });

      // 4 & 5. After the retraction transaction, find next-highest bid and update the lot
      if (result.status === 200 && (result as any).needsFallbackUpdate) {
        try {
          const bidsSnap = await db.collection('auctions').doc(auctionId)
            .collection('lots').doc(lotId)
            .collection('bids')
            .where('status', 'in', ['active', 'winning'])
            .orderBy('amount', 'desc')
            .limit(1)
            .get();

          const lotRef = db.collection('auctions').doc(auctionId).collection('lots').doc(lotId);

          if (!bidsSnap.empty) {
            const nextBid = bidsSnap.docs[0].data();
            await lotRef.update({
              currentBid: nextBid.amount,
              currentBidderId: nextBid.bidderId,
              currentBidderAnonymousId: nextBid.bidderAnonymousId || '',
              lastBidTime: nextBid.timestamp || null,
            });
          } else {
            // No other bids — reset lot to starting state
            const lotSnap = await lotRef.get();
            const startingBid = lotSnap.exists ? (typeof lotSnap.data()?.startingBid === 'number' ? lotSnap.data()!.startingBid : 0) : 0;

            await lotRef.update({
              currentBid: startingBid,
              currentBidderId: null,
              currentBidderAnonymousId: '',
              lastBidTime: null,
            });
          }
        } catch (fallbackError) {
          logger.error({ err: fallbackError }, 'Retract bid fallback lot update error');
          captureServerException(fallbackError, { tags: { endpoint: 'retract-bid-fallback' } });
        }
      }

      return res.status(result.status).json(result.body);
    } catch (error: any) {
      logger.error({ err: error }, 'Retract bid transaction error');
      captureServerException(error, { tags: { endpoint: 'retract-bid' } });
      return res.status(500).json({ error: 'An internal error occurred while retracting the bid.' });
    }
  });

  // ── GET /api/auctions/:auctionId/lots/:lotId/bids ─────────────────────────
  app.get('/api/auctions/:auctionId/lots/:lotId/bids', async (req, res) => {
    const { auctionId, lotId } = req.params;

    if (!auctionId || !lotId) {
      return res.status(400).json({ error: 'auctionId and lotId are required.' });
    }

    try {
      const bidsSnap = await db.collection('auctions').doc(auctionId)
        .collection('lots').doc(lotId)
        .collection('bids')
        .orderBy('timestamp', 'desc')
        .get();

      // Return public-safe bid data — never expose real bidderId
      const bids = bidsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id || docSnap.id,
          lotId: data.lotId,
          auctionId: data.auctionId,
          bidderAnonymousId: data.bidderAnonymousId || '',
          amount: data.amount,
          type: data.type,
          status: data.status,
          timestamp: data.timestamp,
          triggeredExtension: data.triggeredExtension || false,
        };
      });

      return res.json({ bids });
    } catch (error: any) {
      logger.error({ err: error }, 'Error fetching auction bids');
      captureServerException(error, { tags: { endpoint: 'get-bids' } });
      return res.status(500).json({ error: 'An internal error occurred while loading bids.' });
    }
  });

  // ── POST /api/auctions/close-lot ─────────────────────────────────────────
  app.post('/api/auctions/close-lot', validateBody(closeLotSchema), async (req, res) => {
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

      const { auctionId, lotId } = req.body || {};
      if (!auctionId || typeof auctionId !== 'string') {
        return res.status(400).json({ error: 'auctionId is required.' });
      }
      if (!lotId || typeof lotId !== 'string') {
        return res.status(400).json({ error: 'lotId is required.' });
      }

      const result = await db.runTransaction(async (tx) => {
        const auctionRef = db.collection('auctions').doc(auctionId);
        const lotRef = auctionRef.collection('lots').doc(lotId);

        const [auctionSnap, lotSnap] = await Promise.all([
          tx.get(auctionRef),
          tx.get(lotRef),
        ]);

        if (!auctionSnap.exists) {
          return { status: 404, body: { error: 'Auction not found.' } };
        }
        if (!lotSnap.exists) {
          return { status: 404, body: { error: 'Lot not found.' } };
        }

        const auctionData = auctionSnap.data()!;
        const lotData = lotSnap.data()!;

        // Idempotent: if already closed/sold/unsold, return success
        const currentStatus = String(lotData.status || '');
        if (['closed', 'sold', 'unsold'].includes(currentStatus)) {
          return {
            status: 200,
            body: { success: true, status: currentStatus, winningBid: lotData.winningBid || null },
          };
        }

        const currentBid = typeof lotData.currentBid === 'number' ? lotData.currentBid : 0;
        const reservePrice = typeof lotData.reservePrice === 'number' ? lotData.reservePrice : null;

        // Determine final status
        let finalStatus: 'sold' | 'unsold';
        if (reservePrice !== null && currentBid < reservePrice) {
          finalStatus = 'unsold';
        } else if (currentBid > 0) {
          finalStatus = 'sold';
        } else {
          finalStatus = 'unsold';
        }

        const lotUpdate: Record<string, unknown> = {
          status: finalStatus,
          finalStatus,
          closedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (finalStatus === 'sold') {
          lotUpdate.winningBidderId = lotData.currentBidderId || null;
          lotUpdate.winningBid = currentBid;
        }

        // Find second-highest bid for non-payment fallback (outside transaction reads not possible,
        // but we can query bids collection before transaction commit for the second-highest).
        // Since Firestore transactions only support get() not queries, we'll mark this and resolve after.
        tx.update(lotRef, lotUpdate);

        return {
          status: 200,
          body: { success: true, status: finalStatus, winningBid: finalStatus === 'sold' ? currentBid : null },
          needsPostProcessing: true,
          finalStatus,
          auctionData,
          lotData: { ...lotData, ...lotUpdate, id: lotId },
          auctionId,
          lotId,
        };
      });

      // Post-transaction: find second-highest bid and generate invoice if sold
      if (result.status === 200 && (result as any).needsPostProcessing) {
        const ctx = result as any;
        try {
          // Find second-highest non-retracted bid
          const bidsSnap = await db.collection('auctions').doc(ctx.auctionId)
            .collection('lots').doc(ctx.lotId)
            .collection('bids')
            .where('status', 'in', ['active', 'winning'])
            .orderBy('amount', 'desc')
            .limit(2)
            .get();

          let secondHighestBid: number | null = null;
          let secondHighestBidderId: string | null = null;

          if (bidsSnap.docs.length >= 2) {
            const secondBidData = bidsSnap.docs[1].data();
            secondHighestBid = typeof secondBidData.amount === 'number' ? secondBidData.amount : null;
            secondHighestBidderId = typeof secondBidData.bidderId === 'string' ? secondBidData.bidderId : null;
          }

          // Update lot with second-highest bid info
          const lotRef = db.collection('auctions').doc(ctx.auctionId).collection('lots').doc(ctx.lotId);
          await lotRef.update({
            secondHighestBid: secondHighestBid,
            secondHighestBidderId: secondHighestBidderId,
          });

          // Generate invoice if sold
          if (ctx.finalStatus === 'sold') {
            const { invoiceData } = await generateAuctionInvoice(ctx.auctionId, ctx.lotData, ctx.auctionData);

            // Send email notifications to buyer and seller (fire and forget)
            sendLotSoldEmailNotifications(ctx.lotData, ctx.auctionData, invoiceData).catch((emailError) => {
              logger.error({ err: emailError }, 'Close lot email notification error');
              captureServerException(emailError, { tags: { endpoint: 'close-lot-email' } });
            });
          }
        } catch (postError) {
          logger.error({ err: postError }, 'Close lot post-transaction processing error');
          captureServerException(postError, { tags: { endpoint: 'close-lot-post' } });
        }
      }

      // Emit lot_closed via Socket.IO and cancel timer
      if (result.status === 200 && (result as any).needsPostProcessing) {
        const ctx = result as any;
        const io = (app as any).__socketIO as SocketIOServer | undefined;
        const tm = (app as any).__timerManager as AuctionTimerManager | undefined;
        if (io) {
          emitLotClosed(io, {
            lotId: ctx.lotId,
            auctionId: ctx.auctionId,
            finalStatus: ctx.finalStatus,
            winningBid: ctx.finalStatus === 'sold' ? (ctx.lotData.winningBid || null) : null,
            winningBidderAnonymousId: ctx.finalStatus === 'sold' ? (ctx.lotData.currentBidderAnonymousId || null) : null,
          });
        }
        if (tm) {
          tm.cancelLotTimer(ctx.auctionId, ctx.lotId);
        }
      }

      return res.status(result.status).json(result.body);
    } catch (error: any) {
      logger.error({ err: error }, 'Close lot error');
      captureServerException(error, { tags: { endpoint: 'close-lot' } });
      return res.status(500).json({ error: 'An internal error occurred while closing the lot.' });
    }
  });

  // ── POST /api/auctions/close-expired-lots ──────────────────────────────────
  app.post('/api/auctions/close-expired-lots', async (req, res) => {
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

      const nowIso = new Date().toISOString();
      const auctionsSnap = await db.collection('auctions')
        .where('status', '==', 'active')
        .get();

      let closedCount = 0;
      const results: Array<{ auctionId: string; lotId: string; status: string; winningBid: number | null }> = [];

      for (const auctionDoc of auctionsSnap.docs) {
        const auctionId = auctionDoc.id;
        const auctionData = auctionDoc.data();

        // Query lots that are active or extended and whose endTime has passed
        const lotsSnap = await db.collection('auctions').doc(auctionId)
          .collection('lots')
          .where('status', 'in', ['active', 'extended'])
          .get();

        for (const lotDoc of lotsSnap.docs) {
          const lotData = lotDoc.data();
          const lotEndTime = parseDate(lotData.endTime);
          if (!lotEndTime || lotEndTime.getTime() > Date.now()) {
            continue; // Not expired yet
          }

          const lotId = lotDoc.id;
          const currentBid = typeof lotData.currentBid === 'number' ? lotData.currentBid : 0;
          const reservePrice = typeof lotData.reservePrice === 'number' ? lotData.reservePrice : null;

          let finalStatus: 'sold' | 'unsold';
          if (reservePrice !== null && currentBid < reservePrice) {
            finalStatus = 'unsold';
          } else if (currentBid > 0) {
            finalStatus = 'sold';
          } else {
            finalStatus = 'unsold';
          }

          const lotUpdate: Record<string, unknown> = {
            status: finalStatus,
            finalStatus,
            closedAt: nowIso,
            updatedAt: nowIso,
          };

          if (finalStatus === 'sold') {
            lotUpdate.winningBidderId = lotData.currentBidderId || null;
            lotUpdate.winningBid = currentBid;
          }

          const lotRef = db.collection('auctions').doc(auctionId).collection('lots').doc(lotId);
          await lotRef.update(lotUpdate);

          // Find second-highest bid
          try {
            const bidsSnap = await lotRef.collection('bids')
              .where('status', 'in', ['active', 'winning'])
              .orderBy('amount', 'desc')
              .limit(2)
              .get();

            let secondHighestBid: number | null = null;
            let secondHighestBidderId: string | null = null;

            if (bidsSnap.docs.length >= 2) {
              const secondBidData = bidsSnap.docs[1].data();
              secondHighestBid = typeof secondBidData.amount === 'number' ? secondBidData.amount : null;
              secondHighestBidderId = typeof secondBidData.bidderId === 'string' ? secondBidData.bidderId : null;
            }

            await lotRef.update({
              secondHighestBid,
              secondHighestBidderId,
            });

            // Generate invoice if sold
            if (finalStatus === 'sold') {
              const lotWithId = { ...lotData, ...lotUpdate, id: lotId };
              const { invoiceData } = await generateAuctionInvoice(auctionId, lotWithId, auctionData);

              // Send email notifications to buyer and seller (fire and forget)
              sendLotSoldEmailNotifications(lotWithId, auctionData, invoiceData).catch((emailError) => {
                logger.error({ err: emailError, lotId }, 'Close expired lots email notification error');
                captureServerException(emailError, { tags: { endpoint: 'close-expired-lots-email' } });
              });
            }
          } catch (bidError) {
            logger.error({ err: bidError, lotId }, 'Close expired lots error processing bids');
            captureServerException(bidError, { tags: { endpoint: 'close-expired-lots-bids' } });
          }

          // Emit lot_closed via Socket.IO
          const io = (app as any).__socketIO as SocketIOServer | undefined;
          const tm = (app as any).__timerManager as AuctionTimerManager | undefined;
          if (io) {
            emitLotClosed(io, {
              lotId,
              auctionId,
              finalStatus,
              winningBid: finalStatus === 'sold' ? currentBid : null,
              winningBidderAnonymousId: finalStatus === 'sold' ? (lotData.currentBidderAnonymousId || null) : null,
            });
          }
          if (tm) {
            tm.cancelLotTimer(auctionId, lotId);
          }

          closedCount++;
          results.push({ auctionId, lotId, status: finalStatus, winningBid: finalStatus === 'sold' ? currentBid : null });
        }
      }

      return res.json({ closed: closedCount, results });
    } catch (error: any) {
      logger.error({ err: error }, 'Close expired lots error');
      captureServerException(error, { tags: { endpoint: 'close-expired-lots' } });
      return res.status(500).json({ error: 'An internal error occurred while closing expired lots.' });
    }
  });

  // ── POST /api/auctions/activate ────────────────────────────────────────────
  app.post('/api/auctions/activate', validateBody(activateAuctionSchema), async (req, res) => {
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

      const { auctionId } = req.body || {};
      if (!auctionId || typeof auctionId !== 'string') {
        return res.status(400).json({ error: 'auctionId is required.' });
      }

      const auctionRef = db.collection('auctions').doc(auctionId);
      const auctionSnap = await auctionRef.get();

      if (!auctionSnap.exists) {
        return res.status(404).json({ error: 'Auction not found.' });
      }

      const auctionData = auctionSnap.data()!;
      if (auctionData.status !== 'preview') {
        return res.status(409).json({ error: `Auction status is '${auctionData.status}', must be 'preview' to activate.` });
      }

      const auctionEndTime = parseDate(auctionData.endTime);
      const auctionStartTime = parseDate(auctionData.startTime);
      if (!auctionEndTime) {
        return res.status(400).json({ error: 'Auction endTime is not set.' });
      }

      const staggerIntervalMin = typeof auctionData.staggerIntervalMin === 'number' ? auctionData.staggerIntervalMin : 1;

      // Read all lots
      const lotsSnap = await auctionRef.collection('lots').get();
      const batch = db.batch();
      let lotCount = 0;

      for (const lotDoc of lotsSnap.docs) {
        const lotData = lotDoc.data();
        const closeOrder = typeof lotData.closeOrder === 'number' ? lotData.closeOrder : lotCount;
        const lotEndTime = new Date(auctionEndTime.getTime() + (closeOrder * staggerIntervalMin * 60000));

        batch.update(lotDoc.ref, {
          endTime: lotEndTime.toISOString(),
          startTime: auctionStartTime ? auctionStartTime.toISOString() : new Date().toISOString(),
          status: 'active',
          updatedAt: new Date().toISOString(),
        });

        // Update corresponding listing document if listingId exists
        const listingId = normalizeNonEmptyString(lotData.listingId);
        if (listingId) {
          const listingRef = db.collection('listings').doc(listingId);
          batch.update(listingRef, {
            auctionStatus: 'active',
            updatedAt: new Date().toISOString(),
          });
        }

        lotCount++;
      }

      // Update auction status to active
      batch.update(auctionRef, {
        status: 'active',
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();

      // Schedule lot closure timers via Socket.IO timer manager
      const io = (app as any).__socketIO as SocketIOServer | undefined;
      const tm = (app as any).__timerManager as AuctionTimerManager | undefined;
      if (tm && io) {
        for (const lotDoc of lotsSnap.docs) {
          const lotData = lotDoc.data();
          const closeOrder = typeof lotData.closeOrder === 'number' ? lotData.closeOrder : 0;
          const lotEndTime = new Date(auctionEndTime.getTime() + (closeOrder * staggerIntervalMin * 60000));
          tm.scheduleLotClosure(auctionId, lotDoc.id, lotEndTime.toISOString(), async (aid, lid) => {
            await closeLotByTimer(db, aid, lid, io);
          });
        }
        logger.info({ auctionId, lotCount: lotsSnap.size }, 'Scheduled lot closure timers for auction activation');
      }

      return apiSuccess(res, { lotCount });
    } catch (error: any) {
      logger.error({ err: error }, 'Auction activate error');
      captureServerException(error, { tags: { endpoint: 'auction-activate' } });
      return apiError(res, 500, 'ACTIVATE_FAILED', 'An internal error occurred while activating the auction.');
    }
  });

  // ── POST /api/auctions/create-preauth-hold ─────────────────────────────────
  app.post('/api/auctions/create-preauth-hold', validateBody(preauthHoldSchema), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Not authenticated.' });

    let uid: string;
    let decodedEmail: string;
    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      uid = decodedToken.uid;
      decodedEmail = String(decodedToken.email || '').trim();
    } catch (err) {
      logger.warn({ err }, 'Auth token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    try {
      const bidderProfileRef = db.collection('users').doc(uid).collection('bidderProfile').doc('profile');
      const bidderProfileSnap = await bidderProfileRef.get();
      const bidderProfile = bidderProfileSnap.exists ? bidderProfileSnap.data()! : {};

      // Get or create Stripe customer
      let stripeCustomerId = typeof bidderProfile.stripeCustomerId === 'string' ? bidderProfile.stripeCustomerId : '';

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: decodedEmail || undefined,
          metadata: {
            firebase_uid: uid,
            platform: 'timberequip',
          },
        });
        stripeCustomerId = customer.id;
        await bidderProfileRef.set({ stripeCustomerId }, { merge: true });
      }

      // Create PaymentIntent with manual capture (pre-auth hold)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 25000, // $250.00
        currency: 'usd',
        customer: stripeCustomerId,
        capture_method: 'manual',
        metadata: {
          firebase_uid: uid,
          purpose: 'auction_bidder_preauth',
          platform: 'timberequip',
        },
      });

      // Save pre-auth info on bidder profile
      await bidderProfileRef.set({
        preAuthPaymentIntentId: paymentIntent.id,
        preAuthStatus: 'pending',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      logger.error({ err: error }, 'Create pre-auth hold error');
      captureServerException(error, { tags: { endpoint: 'create-preauth-hold' } });
      return res.status(500).json({ error: 'An internal error occurred while creating the pre-authorization hold.' });
    }
  });

  // ── POST /api/auctions/confirm-preauth ─────────────────────────────────────
  app.post('/api/auctions/confirm-preauth', validateBody(confirmPreauthSchema), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Not authenticated.' });

    let uid: string;
    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      uid = decodedToken.uid;
    } catch (err) {
      logger.warn({ err }, 'Auth token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return res.status(400).json({ error: 'paymentIntentId is required.' });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Verify the hold is active (requires_capture means the card has been authorized)
      if (paymentIntent.status !== 'requires_capture') {
        return res.status(409).json({ error: `PaymentIntent status is '${paymentIntent.status}', expected 'requires_capture'.` });
      }

      // Verify ownership
      if (paymentIntent.metadata?.firebase_uid !== uid) {
        return res.status(403).json({ error: 'This pre-authorization does not belong to the requesting user.' });
      }

      // Update bidder profile
      const bidderProfileRef = db.collection('users').doc(uid).collection('bidderProfile').doc('profile');
      await bidderProfileRef.set({
        preAuthStatus: 'held',
        preAuthPaymentIntentId: paymentIntentId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return apiSuccess(res, { status: 'held' });
    } catch (error: any) {
      logger.error({ err: error }, 'Confirm pre-auth error');
      captureServerException(error, { tags: { endpoint: 'confirm-preauth' } });
      return apiError(res, 500, 'CONFIRM_PREAUTH_FAILED', 'An internal error occurred while confirming pre-authorization.');
    }
  });

  // ── POST /api/auctions/create-identity-session ─────────────────────────────
  app.post('/api/auctions/create-identity-session', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Not authenticated.' });

    let uid: string;
    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      uid = decodedToken.uid;
    } catch (err) {
      logger.warn({ err }, 'Auth token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    try {
      const bidderProfileRef = db.collection('users').doc(uid).collection('bidderProfile').doc('profile');
      const bidderProfileSnap = await bidderProfileRef.get();
      const bidderProfile = bidderProfileSnap.exists ? bidderProfileSnap.data()! : {};

      // If there's an existing pending session, try to reuse it
      const existingSessionId = typeof bidderProfile.stripeVerificationSessionId === 'string'
        ? bidderProfile.stripeVerificationSessionId
        : '';

      if (existingSessionId) {
        try {
          const existingSession = await stripe.identity.verificationSessions.retrieve(existingSessionId);
          if (existingSession.status === 'requires_input' && existingSession.client_secret) {
            return res.json({ clientSecret: existingSession.client_secret });
          }
        } catch (err) {
          logger.warn({ err }, 'Non-critical: existing Stripe verification session no longer valid, creating new one');
        }
      }

      // Create new Stripe Identity verification session
      const session = await stripe.identity.verificationSessions.create({
        type: 'document',
        options: {
          document: {
            require_matching_selfie: true,
            allowed_types: ['driving_license', 'passport', 'id_card'],
          },
        },
        metadata: {
          firebase_uid: uid,
          platform: 'timberequip',
          purpose: 'auction_bidder_verification',
        },
      });

      // Save verification session ID on bidder profile
      await bidderProfileRef.set({
        stripeVerificationSessionId: session.id,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return res.json({ clientSecret: session.client_secret });
    } catch (error: any) {
      logger.error({ err: error }, 'Create identity session error');
      captureServerException(error, { tags: { endpoint: 'create-identity-session' } });
      return res.status(500).json({ error: 'An internal error occurred while creating the identity verification session.' });
    }
  });

  // ── POST /api/auctions/process-seller-payout (admin only) ────────────────
  app.post('/api/auctions/process-seller-payout', validateBody(sellerPayoutSchema), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Not authenticated.' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const claimRole = String(decodedToken.role || '').trim().toLowerCase();
      const isAdminByClaim = canAdministrateAccountRole(claimRole);
      if (!isPrivilegedAdminEmail(actorEmail) && !isAdminByClaim) {
        const user = await db.collection('users').doc(decodedToken.uid).get();
        if (!canAdministrateAccountRole(user.data()?.role)) {
          return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Auth token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const { invoiceId } = req.body || {};
    if (!invoiceId || typeof invoiceId !== 'string') {
      return res.status(400).json({ error: 'invoiceId is required.' });
    }

    try {
      // Look up the auction invoice
      const invoiceRef = db.collection('auctionInvoices').doc(invoiceId);
      const invoiceSnap = await invoiceRef.get();

      if (!invoiceSnap.exists) {
        return res.status(404).json({ error: 'Auction invoice not found.' });
      }

      const invoiceData = invoiceSnap.data()!;

      // Verify the invoice is paid
      if (invoiceData.status !== 'paid') {
        return res.status(409).json({ error: `Invoice status is '${invoiceData.status}', must be 'paid' to process seller payout.` });
      }

      // Check if seller has already been paid
      if (invoiceData.sellerPaidAt) {
        return res.status(409).json({ error: 'Seller payout has already been processed for this invoice.' });
      }

      const sellerId = String(invoiceData.sellerId || '');
      if (!sellerId) {
        return res.status(400).json({ error: 'No sellerId found on the invoice.' });
      }

      const sellerPayoutAmount = Number(invoiceData.sellerPayout) || 0;
      if (sellerPayoutAmount <= 0) {
        return res.status(400).json({ error: 'Seller payout amount is zero or invalid.' });
      }

      // Look up the seller's Stripe Connect account from their user profile
      const sellerSnap = await db.collection('users').doc(sellerId).get();
      if (!sellerSnap.exists) {
        return res.status(404).json({ error: 'Seller user profile not found.' });
      }

      const sellerData = sellerSnap.data()!;
      const sellerStripeAccountId = String(sellerData.stripeConnectAccountId || '').trim();

      if (!sellerStripeAccountId) {
        return res.status(400).json({ error: 'Seller does not have a Stripe Connect account on file. Please ask the seller to set up their payout details.' });
      }

      // Create a Stripe Transfer to the seller's connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(sellerPayoutAmount * 100), // Stripe uses cents
        currency: 'usd',
        destination: sellerStripeAccountId,
        metadata: {
          auctionInvoiceId: invoiceId,
          auctionId: String(invoiceData.auctionId || ''),
          lotId: String(invoiceData.lotId || ''),
          sellerId,
          platform: 'timberequip',
        },
        description: `Seller payout for auction invoice ${invoiceId}`,
      });

      // Update the invoice with payout details
      await invoiceRef.update({
        sellerPaidAt: new Date().toISOString(),
        sellerPayoutTransferId: transfer.id,
        updatedAt: new Date().toISOString(),
      });

      logger.info({ transferId: transfer.id, sellerId, amount: sellerPayoutAmount }, 'Seller payout transfer created');

      return res.json({
        success: true,
        transferId: transfer.id,
        amount: sellerPayoutAmount,
        sellerId,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Process seller payout error');
      captureServerException(error, { tags: { endpoint: 'process-seller-payout' } });
      return res.status(500).json({ error: 'An internal error occurred while processing the seller payout.' });
    }
  });

  // ── closeLotByTimer: called by AuctionTimerManager when a lot's endTime arrives ──
  async function closeLotByTimer(
    database: admin.firestore.Firestore,
    auctionId: string,
    lotId: string,
    io: SocketIOServer,
  ): Promise<void> {
    try {
      const lotRef = database.collection('auctions').doc(auctionId).collection('lots').doc(lotId);
      const lotSnap = await lotRef.get();
      if (!lotSnap.exists) return;

      const lotData = lotSnap.data()!;
      const currentStatus = String(lotData.status || '');

      // Already closed — idempotent
      if (['closed', 'sold', 'unsold'].includes(currentStatus)) return;

      // Only close if endTime has actually passed
      const endTime = lotData.endTime ? new Date(lotData.endTime).getTime() : 0;
      if (endTime > Date.now()) return; // Not yet expired (timer rescheduled by soft-close)

      const currentBid = typeof lotData.currentBid === 'number' ? lotData.currentBid : 0;
      const reservePrice = typeof lotData.reservePrice === 'number' ? lotData.reservePrice : null;

      let finalStatus: 'sold' | 'unsold';
      if (reservePrice !== null && currentBid < reservePrice) {
        finalStatus = 'unsold';
      } else if (currentBid > 0) {
        finalStatus = 'sold';
      } else {
        finalStatus = 'unsold';
      }

      const lotUpdate: Record<string, unknown> = {
        status: finalStatus,
        finalStatus,
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (finalStatus === 'sold') {
        lotUpdate.winningBidderId = lotData.currentBidderId || null;
        lotUpdate.winningBid = currentBid;
      }

      await lotRef.update(lotUpdate);

      // Emit via Socket.IO
      emitLotClosed(io, {
        lotId,
        auctionId,
        finalStatus,
        winningBid: finalStatus === 'sold' ? currentBid : null,
        winningBidderAnonymousId: finalStatus === 'sold' ? (lotData.currentBidderAnonymousId || null) : null,
      });

      // Post-close: generate invoice if sold (fire and forget)
      if (finalStatus === 'sold') {
        const auctionSnap = await database.collection('auctions').doc(auctionId).get();
        if (auctionSnap.exists) {
          try {
            const mergedLotData = { ...lotData, ...lotUpdate, id: lotId };
            const { invoiceData } = await generateAuctionInvoice(auctionId, mergedLotData, auctionSnap.data()!);
            sendLotSoldEmailNotifications(mergedLotData, auctionSnap.data()!, invoiceData).catch((emailErr) => {
              logger.error({ err: emailErr, auctionId, lotId }, 'Timer close lot email error');
            });
          } catch (invoiceErr) {
            logger.error({ err: invoiceErr, auctionId, lotId }, 'Timer close lot invoice generation error');
            captureServerException(invoiceErr, { tags: { handler: 'timer-close-invoice' } });
          }
        }
      }

      logger.info({ auctionId, lotId, finalStatus }, 'Timer closed lot');
    } catch (err) {
      logger.error({ err, auctionId, lotId }, 'Timer close lot error');
      captureServerException(err, { tags: { handler: 'timer-close-lot' } });
    }
  }

  return { closeLotByTimer };
}
