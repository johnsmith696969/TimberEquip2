const UNLIMITED_LISTING_CAP = 99999;

function isUnlimitedListingCap(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= UNLIMITED_LISTING_CAP;
}

function getListingCapDisplayLabel(value, singularLabel = 'listing', pluralLabel = 'listings') {
  const numericValue = Number(value);

  if (isUnlimitedListingCap(numericValue)) {
    return `Unlimited ${pluralLabel}`;
  }

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return `0 ${pluralLabel}`;
  }

  return `${numericValue} ${numericValue === 1 ? singularLabel : pluralLabel}`;
}

function getActiveListingCapMessage(planName, value) {
  if (isUnlimitedListingCap(value)) {
    return `${planName} supports unlimited active listings.`;
  }

  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
  const noun = safeValue === 1 ? 'listing' : 'listings';
  return `${planName} includes up to ${safeValue} active ${noun}. Upgrade or mark one as sold before posting another.`;
}

module.exports = {
  UNLIMITED_LISTING_CAP,
  isUnlimitedListingCap,
  getListingCapDisplayLabel,
  getActiveListingCapMessage,
};
