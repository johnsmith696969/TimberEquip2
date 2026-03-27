const admin = require('firebase-admin');
const { buildListingGovernanceShadow, timestampToDate } = require('./listing-governance-rules.js');

const LIFECYCLE_ACTIONS = Object.freeze([
  'submit',
  'approve',
  'reject',
  'payment_confirmed',
  'publish',
  'expire',
  'relist',
  'mark_sold',
  'archive',
]);

function normalizeText(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeLower(value, fallback = '') {
  return normalizeText(value, fallback).toLowerCase();
}

function toDate(value) {
  return timestampToDate(value);
}

function toTimestamp(value) {
  const parsed = toDate(value);
  return parsed ? admin.firestore.Timestamp.fromDate(parsed) : null;
}

function getListingInput(listingId, listing) {
  if (!listing) return null;
  return { id: listingId, ...listing };
}

function canPublishWithCurrentState(shadow, effectiveExpiresAt, now) {
  if (!shadow) return false;
  if (shadow.reviewState !== 'approved') return false;
  if (!['paid', 'waived'].includes(shadow.paymentState)) return false;
  if (effectiveExpiresAt && effectiveExpiresAt.getTime() <= now.getTime()) return false;
  return true;
}

function createLifecycleError(message, details = {}) {
  const error = new Error(message);
  error.code = 'invalid-lifecycle-transition';
  error.details = details;
  return error;
}

function buildLifecyclePatch({
  listingId,
  listing,
  action,
  actorUid = '',
  actorRole = '',
  reason = '',
  metadata = {},
  now = new Date(),
}) {
  const normalizedAction = normalizeLower(action);
  if (!LIFECYCLE_ACTIONS.includes(normalizedAction)) {
    throw createLifecycleError(`Unsupported lifecycle action "${action}".`);
  }

  const listingInput = getListingInput(listingId, listing);
  if (!listingInput) {
    throw createLifecycleError('Listing is required for lifecycle transition.');
  }

  const shadow = buildListingGovernanceShadow(listingInput, { now });
  const nowTimestamp = admin.firestore.Timestamp.fromDate(now);
  const existingExpiresAt = toDate(listing?.expiresAt);
  const requestedExpiresAt = toDate(metadata.currentPeriodEnd || metadata.expiresAt || metadata.nextExpiresAt);
  const effectiveExpiresAt = requestedExpiresAt || existingExpiresAt;
  const normalizedReason = normalizeText(reason);

  const patch = {
    lastLifecycleAction: normalizedAction,
    lastLifecycleActorUid: normalizeText(actorUid, 'system'),
    lastLifecycleActorRole: normalizeText(actorRole, 'system'),
    lastLifecycleReason: normalizedReason || null,
    lastLifecycleAt: nowTimestamp,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  switch (normalizedAction) {
    case 'submit': {
      if (!['draft', 'rejected'].includes(shadow.lifecycleState)) {
        throw createLifecycleError('Only draft or rejected listings can be submitted.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      patch.status = 'pending';
      patch.approvalStatus = 'pending';
      patch.rejectionReason = null;
      patch.rejectedAt = null;
      patch.rejectedBy = null;
      patch.submittedAt = nowTimestamp;
      break;
    }
    case 'approve': {
      if (!['submitted', 'approved_unpaid', 'rejected'].includes(shadow.lifecycleState)) {
        throw createLifecycleError('Only submitted, rejected, or approved-unpaid listings can be approved.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      patch.approvalStatus = 'approved';
      patch.approvedBy = normalizeText(actorUid, 'system');
      patch.approvedAt = nowTimestamp;
      patch.rejectionReason = null;
      patch.rejectedAt = null;
      patch.rejectedBy = null;
      if (canPublishWithCurrentState(
        { ...shadow, reviewState: 'approved' },
        effectiveExpiresAt,
        now,
      )) {
        patch.status = 'active';
        patch.publishedAt = listing?.publishedAt || nowTimestamp;
      } else if (shadow.lifecycleState !== 'archived' && shadow.lifecycleState !== 'sold') {
        patch.status = 'pending';
      }
      break;
    }
    case 'reject': {
      if (['archived', 'sold'].includes(shadow.lifecycleState)) {
        throw createLifecycleError('Archived or sold listings cannot be rejected.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      patch.status = 'pending';
      patch.approvalStatus = 'rejected';
      patch.rejectionReason = normalizedReason || normalizeText(listing?.rejectionReason, 'Rejected by reviewer.');
      patch.rejectedAt = nowTimestamp;
      patch.rejectedBy = normalizeText(actorUid, 'system');
      patch.publishedAt = null;
      break;
    }
    case 'payment_confirmed': {
      if (shadow.lifecycleState === 'archived') {
        throw createLifecycleError('Archived listings cannot be payment-confirmed.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      patch.paymentStatus = 'paid';
      patch.paidAt = nowTimestamp;
      patch.paymentConfirmedAt = nowTimestamp;
      if (metadata.planId !== undefined) patch.subscriptionPlanId = metadata.planId || null;
      if (metadata.amountUsd !== undefined) patch.subscriptionAmount = Number(metadata.amountUsd || 0) || null;
      if (effectiveExpiresAt) patch.expiresAt = admin.firestore.Timestamp.fromDate(effectiveExpiresAt);
      if (canPublishWithCurrentState(
        { ...shadow, paymentState: 'paid' },
        effectiveExpiresAt,
        now,
      ) && !['sold', 'archived'].includes(shadow.lifecycleState)) {
        patch.status = 'active';
        patch.publishedAt = listing?.publishedAt || nowTimestamp;
      }
      break;
    }
    case 'publish': {
      if (!canPublishWithCurrentState(shadow, effectiveExpiresAt, now)) {
        throw createLifecycleError('Listing must be approved, paid, and not expired before publishing.', {
          currentLifecycleState: shadow.lifecycleState,
          reviewState: shadow.reviewState,
          paymentState: shadow.paymentState,
        });
      }
      patch.status = 'active';
      patch.publishedAt = listing?.publishedAt || nowTimestamp;
      break;
    }
    case 'expire': {
      if (['sold', 'archived'].includes(shadow.lifecycleState)) {
        throw createLifecycleError('Sold or archived listings cannot be expired.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      patch.status = 'expired';
      patch.expiredAt = nowTimestamp;
      break;
    }
    case 'relist': {
      if (!['expired', 'sold', 'archived'].includes(shadow.lifecycleState)) {
        throw createLifecycleError('Only expired, sold, or archived listings can be relisted.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      if (!canPublishWithCurrentState(
        {
          ...shadow,
          lifecycleState: 'approved_unpaid',
          inventoryState: 'draft',
          visibilityState: 'private',
        },
        effectiveExpiresAt,
        now,
      )) {
        throw createLifecycleError('Relisting requires an approved listing with active billing and a future expiration window.', {
          reviewState: shadow.reviewState,
          paymentState: shadow.paymentState,
          expiresAt: effectiveExpiresAt ? effectiveExpiresAt.toISOString() : null,
        });
      }
      patch.status = 'active';
      patch.archivedAt = null;
      patch.soldAt = null;
      patch.expiredAt = null;
      patch.relistedAt = nowTimestamp;
      patch.publishedAt = listing?.publishedAt || nowTimestamp;
      if (effectiveExpiresAt) {
        patch.expiresAt = admin.firestore.Timestamp.fromDate(effectiveExpiresAt);
      }
      break;
    }
    case 'mark_sold': {
      if (['sold', 'archived'].includes(shadow.lifecycleState)) {
        throw createLifecycleError('This listing cannot be marked sold from its current state.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      patch.status = 'sold';
      patch.soldAt = listing?.soldAt || nowTimestamp;
      break;
    }
    case 'archive': {
      if (shadow.lifecycleState === 'archived') {
        throw createLifecycleError('Listing is already archived.', {
          currentLifecycleState: shadow.lifecycleState,
        });
      }
      patch.status = 'archived';
      patch.archivedAt = listing?.archivedAt || nowTimestamp;
      break;
    }
    default:
      throw createLifecycleError(`Unsupported lifecycle action "${action}".`);
  }

  return {
    patch,
    currentShadow: shadow,
    currentLifecycleState: shadow.lifecycleState,
  };
}

module.exports = {
  LIFECYCLE_ACTIONS,
  buildLifecyclePatch,
  createLifecycleError,
};
