const LIFECYCLE_STATES = Object.freeze([
  'draft',
  'submitted',
  'approved_unpaid',
  'live',
  'expired',
  'sold',
  'rejected',
  'archived',
]);

const REVIEW_STATES = Object.freeze(['pending', 'approved', 'rejected']);
const PAYMENT_STATES = Object.freeze(['pending', 'paid', 'failed', 'waived', 'refunded']);
const INVENTORY_STATES = Object.freeze(['draft', 'active', 'expired', 'sold', 'archived']);
const VISIBILITY_STATES = Object.freeze(['private', 'public_live', 'public_sold', 'archived']);

const GOVERNANCE_ANOMALY_CODES = Object.freeze([
  'live_without_paid_payment',
  'live_without_approved_review',
  'expired_but_public',
  'sold_without_sold_at',
  'rejected_but_public',
  'approved_unpaid_with_published_at',
  'missing_primary_image',
  'missing_seller_reference',
  'missing_location',
  'invalid_expiration_window',
  'duplicate_external_source_key',
  'orphan_transition_record',
]);

function normalizeText(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeLowercase(value, fallback = '') {
  return normalizeText(value, fallback).toLowerCase();
}

function coerceAllowedValue(value, allowedValues, fallback) {
  const normalized = normalizeLowercase(value, fallback);
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function timestampToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6));
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function hasExpired(expiresAt, now = new Date()) {
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}

function hasPublicVisibilityCandidate(reviewState, paymentState) {
  return reviewState === 'approved' && ['paid', 'waived'].includes(paymentState);
}

function deriveReviewState(listing) {
  return coerceAllowedValue(listing?.approvalStatus, REVIEW_STATES, 'pending');
}

function derivePaymentState(listing) {
  return coerceAllowedValue(listing?.paymentStatus, PAYMENT_STATES, 'pending');
}

function deriveLifecycleState(listing, now = new Date()) {
  const status = normalizeLowercase(listing?.status, 'pending');
  const reviewState = deriveReviewState(listing);
  const paymentState = derivePaymentState(listing);
  const publishedAt = timestampToDate(listing?.publishedAt);
  const expiresAt = timestampToDate(listing?.expiresAt);
  const soldAt = timestampToDate(listing?.soldAt);
  const isArchived = Boolean(listing?.archivedAt || listing?.isArchived || listing?.deletedAt);

  if (isArchived) return 'archived';
  if (status === 'sold' || soldAt) return 'sold';
  if (reviewState === 'rejected') return 'rejected';
  if (hasExpired(expiresAt, now)) return 'expired';
  if (status === 'active' && reviewState === 'approved' && ['paid', 'waived'].includes(paymentState)) return 'live';
  if (reviewState === 'approved') return 'approved_unpaid';
  if (reviewState === 'pending' && (status === 'pending' || publishedAt)) return 'submitted';
  return 'draft';
}

function deriveInventoryState(listing, lifecycleState, now = new Date()) {
  const status = normalizeLowercase(listing?.status, 'pending');
  if (lifecycleState === 'archived') return 'archived';
  if (lifecycleState === 'sold' || status === 'sold') return 'sold';
  if (lifecycleState === 'expired' || hasExpired(timestampToDate(listing?.expiresAt), now)) return 'expired';
  if (lifecycleState === 'live' || status === 'active') return 'active';
  return 'draft';
}

function deriveVisibilityState(lifecycleState, reviewState, paymentState, inventoryState, listing) {
  if (lifecycleState === 'archived') return 'archived';
  if (lifecycleState === 'sold' && hasPublicVisibilityCandidate(reviewState, paymentState) && timestampToDate(listing?.soldAt)) {
    return 'public_sold';
  }
  if (lifecycleState === 'live' && inventoryState === 'active' && hasPublicVisibilityCandidate(reviewState, paymentState)) {
    return 'public_live';
  }
  return 'private';
}

function buildListingGovernanceShadow(listing, options = {}) {
  const now = timestampToDate(options.now) || new Date();
  const reviewState = deriveReviewState(listing);
  const paymentState = derivePaymentState(listing);
  const lifecycleState = deriveLifecycleState(listing, now);
  const inventoryState = deriveInventoryState(listing, lifecycleState, now);
  const visibilityState = deriveVisibilityState(lifecycleState, reviewState, paymentState, inventoryState, listing);
  const publishedAt = timestampToDate(listing?.publishedAt);
  const expiresAt = timestampToDate(listing?.expiresAt);
  const soldAt = timestampToDate(listing?.soldAt);

  return {
    legacyFirestoreId: normalizeText(listing?.id),
    sellerPartyId: normalizeText(listing?.sellerUid || listing?.sellerId),
    title: normalizeText(listing?.title),
    categoryKey: normalizeText(listing?.category),
    subcategoryKey: normalizeText(listing?.subcategory),
    manufacturerKey: normalizeText(listing?.make || listing?.manufacturer || listing?.brand),
    modelKey: normalizeText(listing?.model),
    locationText: normalizeText(listing?.location),
    priceAmount: Number.isFinite(Number(listing?.price)) ? Number(listing.price) : null,
    currencyCode: normalizeText(listing?.currency, 'USD'),
    lifecycleState,
    reviewState,
    paymentState,
    inventoryState,
    visibilityState,
    isPublic: visibilityState === 'public_live' || visibilityState === 'public_sold',
    primaryImageUrl: Array.isArray(listing?.images) ? normalizeText(listing.images[0]) : '',
    publishedAt,
    expiresAt,
    soldAt,
    sourceSystem: 'firestore',
    externalSourceName: normalizeText(listing?.externalSource?.sourceName),
    externalSourceId: normalizeText(listing?.externalSource?.externalId),
  };
}

function detectGovernanceAnomalies(listing, options = {}) {
  const shadow = buildListingGovernanceShadow(listing, options);
  const anomalies = [];
  const primaryImageUrl = normalizeText(shadow.primaryImageUrl);
  const externalSourceName = normalizeText(shadow.externalSourceName);
  const externalSourceId = normalizeText(shadow.externalSourceId);

  if (shadow.lifecycleState === 'live' && !['paid', 'waived'].includes(shadow.paymentState)) {
    anomalies.push('live_without_paid_payment');
  }
  if (shadow.lifecycleState === 'live' && shadow.reviewState !== 'approved') {
    anomalies.push('live_without_approved_review');
  }
  if (shadow.lifecycleState === 'expired' && shadow.isPublic) {
    anomalies.push('expired_but_public');
  }
  if (shadow.lifecycleState === 'sold' && !shadow.soldAt) {
    anomalies.push('sold_without_sold_at');
  }
  if (shadow.lifecycleState === 'rejected' && shadow.isPublic) {
    anomalies.push('rejected_but_public');
  }
  if (shadow.lifecycleState === 'approved_unpaid' && shadow.publishedAt) {
    anomalies.push('approved_unpaid_with_published_at');
  }
  if (!primaryImageUrl) {
    anomalies.push('missing_primary_image');
  }
  if (!shadow.sellerPartyId) {
    anomalies.push('missing_seller_reference');
  }
  if (!shadow.locationText) {
    anomalies.push('missing_location');
  }
  if (shadow.expiresAt && shadow.publishedAt && shadow.expiresAt.getTime() < shadow.publishedAt.getTime()) {
    anomalies.push('invalid_expiration_window');
  }
  if (options.hasDuplicateExternalSourceKey) {
    anomalies.push('duplicate_external_source_key');
  }
  if (options.hasOrphanTransitionRecord) {
    anomalies.push('orphan_transition_record');
  }

  return [...new Set(anomalies)];
}

module.exports = {
  GOVERNANCE_ANOMALY_CODES,
  INVENTORY_STATES,
  LIFECYCLE_STATES,
  PAYMENT_STATES,
  REVIEW_STATES,
  VISIBILITY_STATES,
  buildListingGovernanceShadow,
  detectGovernanceAnomalies,
  deriveInventoryState,
  deriveLifecycleState,
  derivePaymentState,
  deriveReviewState,
  deriveVisibilityState,
  timestampToDate,
};
