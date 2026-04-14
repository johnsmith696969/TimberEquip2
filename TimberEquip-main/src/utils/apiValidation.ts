import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// ── Shared field schemas ────────────────────────────────────────────────

const nonEmptyString = z.string().trim().min(1);
const email = z.string().trim().email().toLowerCase();
const positiveNumber = z.number().finite().positive();
const optionalString = z.string().trim().optional().default('');

// ── Billing endpoint schemas ────────────────────────────────────────────

export const checkoutSessionSchema = z.object({
  planId: nonEmptyString,
  listingId: nonEmptyString,
});

export const accountCheckoutSessionSchema = z.object({
  planId: nonEmptyString,
  successUrl: z.string().trim().optional(),
  cancelUrl: z.string().trim().optional(),
});

export const portalSessionSchema = z.object({
  returnPath: z.string().trim().startsWith('/').optional().default('/profile?tab=Account%20Settings'),
});

export const cancelSubscriptionSchema = z.object({
  subscriptionId: nonEmptyString,
});

export const taxExemptionSchema = z.object({
  certificateNumber: nonEmptyString.max(200),
  issuingState: nonEmptyString.max(100),
  expirationDate: z.string().trim().optional(),
  certificateType: z.string().trim().optional(),
});

// ── Auction endpoint schemas ────────────────────────────────────────────

export const placeBidSchema = z.object({
  auctionId: nonEmptyString,
  lotId: nonEmptyString,
  amount: positiveNumber,
  maxBid: z.number().finite().positive().optional().nullable(),
}).refine(
  (data) => !data.maxBid || data.maxBid >= data.amount,
  { message: 'maxBid must be >= amount', path: ['maxBid'] },
);

export const retractBidSchema = z.object({
  auctionId: nonEmptyString,
  lotId: nonEmptyString,
  bidId: nonEmptyString,
});

export const closeLotSchema = z.object({
  auctionId: nonEmptyString,
  lotId: nonEmptyString,
});

export const activateAuctionSchema = z.object({
  auctionId: nonEmptyString,
});

export const preauthHoldSchema = z.object({
  auctionId: nonEmptyString,
});

export const confirmPreauthSchema = z.object({
  auctionId: nonEmptyString,
  setupIntentId: nonEmptyString,
});

export const sellerPayoutSchema = z.object({
  invoiceId: nonEmptyString,
});

// ── Admin endpoint schemas ────────────────────────────────────────────

export const createManagedAccountSchema = z.object({
  displayName: nonEmptyString.max(200),
  email,
  role: optionalString,
  company: optionalString,
  phoneNumber: optionalString,
});

// ── Dealer feed ingest schema ───────────────────────────────────────────

export const dealerFeedIngestSchema = z.object({
  dealerId: nonEmptyString,
  sourceName: nonEmptyString.max(200),
  items: z.array(z.record(z.unknown())).min(1).max(5000),
  dryRun: z.boolean().optional().default(false),
  sourceType: z.enum(['json', 'csv', 'xml', 'api']).optional().default('json'),
});

// ── Upload validation ───────────────────────────────────────────────────

export const recaptchaAssessSchema = z.object({
  token: nonEmptyString,
  action: nonEmptyString.max(100),
});

// ── Express middleware factory ───────────────────────────────────────────

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const message = firstError
        ? `${firstError.path.join('.')}: ${firstError.message}`
        : 'Invalid request body';
      return res.status(400).json({ error: message });
    }
    req.body = result.data;
    next();
  };
}
