export const UNLIMITED_LISTING_CAP = 99999;

export function isUnlimitedListingCap(value: unknown): boolean {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= UNLIMITED_LISTING_CAP;
}

export function getListingCapDisplayLabel(
  value: unknown,
  singularLabel = 'listing',
  pluralLabel = 'listings',
): string {
  const numericValue = Number(value);

  if (isUnlimitedListingCap(numericValue)) {
    return `Unlimited ${pluralLabel}`;
  }

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return `0 ${pluralLabel}`;
  }

  return `${numericValue} ${numericValue === 1 ? singularLabel : pluralLabel}`;
}

export function getActiveListingCapMessage(planName: string, value: unknown): string {
  if (isUnlimitedListingCap(value)) {
    return `${planName} supports unlimited active listings.`;
  }

  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
  const noun = safeValue === 1 ? 'listing' : 'listings';
  return `${planName} includes up to ${safeValue} active ${noun}. Upgrade or mark one as sold before posting another.`;
}
