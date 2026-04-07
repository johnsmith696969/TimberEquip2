const AUCTION_PAYMENT_DEADLINE_DAYS = 7;
const AUCTION_REMOVAL_DEADLINE_DAYS = 14;
const AUCTION_CARD_PROCESSING_FEE_RATE = 0.03;
const AUCTION_CARD_PAYMENT_LIMIT = 50000;
const AUCTION_TITLED_DOCUMENT_FEE = 110;
const AUCTION_TERMS_VERSION = 'auction-terms-v2026-04-04';

function toAmount(value) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function calculateAuctionBuyerPremiumTiered(hammerPrice) {
  const amount = toAmount(hammerPrice);

  if (amount <= 25000) {
    return Math.max(amount * 0.10, 100);
  }

  if (amount <= 75000) {
    return Math.max(amount * 0.05, 2500);
  }

  return 3500;
}

function calculateAuctionBuyerPremium(hammerPrice, buyerPremiumPercent) {
  const amount = toAmount(hammerPrice);
  if (typeof buyerPremiumPercent === 'number' && Number.isFinite(buyerPremiumPercent) && buyerPremiumPercent >= 0) {
    return Math.round(amount * (buyerPremiumPercent / 100) * 100) / 100;
  }
  return calculateAuctionBuyerPremiumTiered(amount);
}

function calculateAuctionDocumentFee(isTitledItem) {
  return isTitledItem ? AUCTION_TITLED_DOCUMENT_FEE : 0;
}

function calculateAuctionCardProcessingFee(subtotal, paymentMethod) {
  if (paymentMethod !== 'card') return 0;
  return toAmount(subtotal) * AUCTION_CARD_PROCESSING_FEE_RATE;
}

function isAuctionCardPaymentEligible(totalDue) {
  return toAmount(totalDue) <= AUCTION_CARD_PAYMENT_LIMIT;
}

function buildAuctionInvoiceTotals({
  winningBid,
  isTitledItem = false,
  paymentMethod = null,
  buyerPremiumPercent = null,
}) {
  const hammerPrice = toAmount(winningBid);
  const buyerPremium = calculateAuctionBuyerPremium(hammerPrice, buyerPremiumPercent);
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

function buildAuctionLegalSummaryLines() {
  return [
    'All bids are binding contracts.',
    `Payment is due within ${AUCTION_PAYMENT_DEADLINE_DAYS} calendar days of auction close.`,
    'Accepted payment methods are credit card, debit card, and wire transfer.',
    `Credit and debit card payments are limited to $${AUCTION_CARD_PAYMENT_LIMIT.toLocaleString()} and include a 3% processing fee.`,
    `A $${AUCTION_TITLED_DOCUMENT_FEE} document fee applies to titled items.`,
    "Buyer premium schedule: 10% under $25,000 (minimum $100), 5% from $25,001 to $75,000 (minimum $2,500), and $3,500 flat above $75,000.",
    'Equipment is sold as-is, where-is, with no warranty unless explicitly stated in writing.',
    'Removal timelines, storage charges, tax, title transfer, and default remedies are controlled by the auction terms and invoice.',
  ];
}

module.exports = {
  AUCTION_PAYMENT_DEADLINE_DAYS,
  AUCTION_REMOVAL_DEADLINE_DAYS,
  AUCTION_CARD_PROCESSING_FEE_RATE,
  AUCTION_CARD_PAYMENT_LIMIT,
  AUCTION_TITLED_DOCUMENT_FEE,
  AUCTION_TERMS_VERSION,
  calculateAuctionBuyerPremium,
  calculateAuctionDocumentFee,
  calculateAuctionCardProcessingFee,
  isAuctionCardPaymentEligible,
  buildAuctionInvoiceTotals,
  buildAuctionLegalSummaryLines,
};
