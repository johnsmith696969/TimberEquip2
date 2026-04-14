export const AUCTION_PAYMENT_DEADLINE_DAYS = 7;
export const AUCTION_REMOVAL_DEADLINE_DAYS = 14;
export const AUCTION_CARD_PROCESSING_FEE_RATE = 0.03;
export const AUCTION_CARD_PAYMENT_LIMIT = 50000;
export const AUCTION_TITLED_DOCUMENT_FEE = 110;
export const AUCTION_TERMS_VERSION = 'auction-terms-v2026-04-04';

export type AuctionPaymentFunding = 'credit' | 'debit' | 'prepaid' | 'unknown' | null;

function toAmount(value: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

export function calculateAuctionBuyerPremium(hammerPrice: number): number {
  const amount = toAmount(hammerPrice);

  if (amount <= 25000) {
    return Math.max(amount * 0.10, 100);
  }

  if (amount <= 75000) {
    return Math.max(amount * 0.05, 2500);
  }

  return 3500;
}

export function calculateAuctionDocumentFee(isTitledItem: boolean): number {
  return isTitledItem ? AUCTION_TITLED_DOCUMENT_FEE : 0;
}

export function calculateAuctionCardProcessingFee(subtotal: number, paymentMethod: 'wire' | 'card' | null): number {
  if (paymentMethod !== 'card') return 0;
  return toAmount(subtotal) * AUCTION_CARD_PROCESSING_FEE_RATE;
}

export function isAuctionCardPaymentEligible(totalDue: number): boolean {
  return toAmount(totalDue) <= AUCTION_CARD_PAYMENT_LIMIT;
}

export function isDebitCardFunding(funding: AuctionPaymentFunding): boolean {
  return funding === 'debit';
}

export function buildAuctionInvoiceTotals({
  winningBid,
  isTitledItem = false,
  paymentMethod = null,
}: {
  winningBid: number;
  isTitledItem?: boolean;
  paymentMethod?: 'wire' | 'card' | null;
}) {
  const hammerPrice = toAmount(winningBid);
  const buyerPremium = calculateAuctionBuyerPremium(hammerPrice);
  const documentationFee = calculateAuctionDocumentFee(Boolean(isTitledItem));
  const subtotalBeforeCardFee = hammerPrice + buyerPremium + documentationFee;
  const cardProcessingFee = calculateAuctionCardProcessingFee(subtotalBeforeCardFee, paymentMethod);
  const totalDue = subtotalBeforeCardFee + cardProcessingFee;

  return {
    hammerPrice,
    buyerPremium,
    documentationFee,
    cardProcessingFee,
    subtotalBeforeCardFee,
    totalDue,
    cardEligible: isAuctionCardPaymentEligible(totalDue),
  };
}

export function buildAuctionLegalSummaryLines() {
  return [
    `All bids are binding contracts.`,
    `Payment is due within ${AUCTION_PAYMENT_DEADLINE_DAYS} calendar days of auction close.`,
    `Accepted payment methods are credit card, debit card, and wire transfer.`,
    `Credit and debit card payments are limited to $${AUCTION_CARD_PAYMENT_LIMIT.toLocaleString()} and include a 3% processing fee.`,
    `A $${AUCTION_TITLED_DOCUMENT_FEE} document fee applies to titled items.`,
    `Buyer premium schedule: 10% under $25,000 (minimum $100), 5% from $25,001 to $75,000 (minimum $2,500), and $3,500 flat above $75,000.`,
    `Equipment is sold as-is, where-is, with no warranty unless explicitly stated in writing.`,
    `Removal timelines, storage charges, tax, title transfer, and default remedies are controlled by the auction terms and invoice.`,
  ];
}
