const AUCTION_TERMS_FALLBACK_PATH = '/terms#auction-marketplace-bidding-terms';
const BIDDER_PREAPPROVAL_PATH = '/bidder-registration';

function sanitizeRelativePath(value: string | null | undefined): string {
  const trimmed = String(value || '').trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '';
  }
  return trimmed;
}

export function buildAuctionRegistrationPath(auctionSlug: string | null | undefined, returnTo?: string | null): string {
  const normalizedSlug = String(auctionSlug || '').trim();
  const params = new URLSearchParams();
  const normalizedReturnTo = sanitizeRelativePath(returnTo);
  if (normalizedReturnTo) {
    params.set('returnTo', normalizedReturnTo);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  if (!normalizedSlug) {
    return `${BIDDER_PREAPPROVAL_PATH}${suffix}`;
  }

  return `/auctions/${encodeURIComponent(normalizedSlug)}/register${suffix}`;
}

export function buildAuctionRegistrationLoginPath(auctionSlug: string | null | undefined, returnTo?: string | null): string {
  const registrationPath = buildAuctionRegistrationPath(auctionSlug, returnTo);
  return `/login?redirect=${encodeURIComponent(registrationPath)}`;
}

export function resolveAuctionTermsHref(termsAndConditionsUrl: string | null | undefined): string {
  const trimmed = String(termsAndConditionsUrl || '').trim();
  if (!trimmed) {
    return AUCTION_TERMS_FALLBACK_PATH;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return sanitizeRelativePath(trimmed) || AUCTION_TERMS_FALLBACK_PATH;
}

export function isExternalAuctionHref(href: string): boolean {
  return /^https?:\/\//i.test(String(href || '').trim());
}
