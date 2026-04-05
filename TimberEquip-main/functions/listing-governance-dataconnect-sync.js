/**
 * Phase 1 dual-write: Firestore listings → PostgreSQL via Firebase Data Connect.
 *
 * Firestore remains the source of truth during Phase 1. This module mirrors
 * every listing write into the `timberequip-marketplace` Data Connect service
 * so PostgreSQL reflects the current authoritative state.
 *
 * Hook point: called in parallel with `syncListingGovernanceArtifactsForWrite`
 * from the listings onDocumentWritten trigger in functions/index.js.
 *
 * Design notes:
 * - The Firestore governance shadow (buildListingGovernanceShadow) already
 *   computes the 5 lifecycle state fields and the flat Listing projection,
 *   so this module just translates that to the Data Connect admin SDK calls.
 * - Failures here MUST NOT block Firestore writes — log and move on.
 * - Matching is by `legacyFirestoreId` (the Firestore document ID), indexed
 *   in the schema.
 */

// NOTE: The firebase-admin/data-connect submodule and the generated admin SDK
// package are only installed inside functions/, not at the repo root. Loading
// them lazily lets unit tests (which run from the repo root) import this
// module and test the pure mapping helpers without pulling in the runtime.
let _dataConnectRuntime = null;
function loadDataConnectRuntime() {
  if (_dataConnectRuntime) return _dataConnectRuntime;
  // eslint-disable-next-line global-require
  const { getDataConnect } = require('firebase-admin/data-connect');
  // eslint-disable-next-line global-require
  const sdk = require('@dataconnect/admin-generated-timberequip-listing-governance');
  _dataConnectRuntime = {
    getDataConnect,
    connectorConfig: sdk.connectorConfig,
    findListingByFirestoreId: sdk.findListingByFirestoreId,
    insertListingShadow: sdk.insertListingShadow,
    updateListingShadow: sdk.updateListingShadow,
    deleteListingShadow: sdk.deleteListingShadow,
    recordListingStateTransition: sdk.recordListingStateTransition,
  };
  return _dataConnectRuntime;
}

const { buildListingGovernanceShadow } = require('./listing-governance-rules.js');

// Match the governance-rules timestampToDate logic without re-importing it
// to keep this module self-contained.
function toIsoString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch (_error) {
      return null;
    }
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function nullIfEmpty(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

// Resolve the singleton Data Connect admin client lazily so importing this
// module from test/backfill contexts doesn't eagerly open a connection.
let dataConnectSingleton = null;
function getDataConnectClient() {
  if (!dataConnectSingleton) {
    const { getDataConnect, connectorConfig } = loadDataConnectRuntime();
    dataConnectSingleton = getDataConnect(connectorConfig);
  }
  return dataConnectSingleton;
}

/**
 * Build the flat field-set we send to Data Connect from a Firestore listing.
 * Delegates state derivation to `buildListingGovernanceShadow` so Phase 1 is
 * always consistent with the Firestore-side governance artifacts.
 */
function buildDataConnectListingVariables(listingId, listing) {
  const shadow = buildListingGovernanceShadow({ id: listingId, ...listing });
  return {
    shadow,
    variables: {
      legacyFirestoreId: listingId,
      sellerPartyId: shadow.sellerPartyId || 'unknown',
      title: shadow.title || '(untitled)',
      categoryKey: shadow.categoryKey || 'unknown',
      subcategoryKey: nullIfEmpty(shadow.subcategoryKey),
      manufacturerKey: nullIfEmpty(shadow.manufacturerKey),
      modelKey: nullIfEmpty(shadow.modelKey),
      locationText: nullIfEmpty(shadow.locationText),
      priceAmount: Number.isFinite(shadow.priceAmount) ? shadow.priceAmount : null,
      currencyCode: shadow.currencyCode || 'USD',
      lifecycleState: shadow.lifecycleState,
      reviewState: shadow.reviewState,
      paymentState: shadow.paymentState,
      inventoryState: shadow.inventoryState,
      visibilityState: shadow.visibilityState,
      primaryImageUrl: nullIfEmpty(shadow.primaryImageUrl),
      publishedAt: toIsoString(shadow.publishedAt),
      expiresAt: toIsoString(shadow.expiresAt),
      soldAt: toIsoString(shadow.soldAt),
      sourceSystem: shadow.sourceSystem || 'firestore',
      externalSourceName: nullIfEmpty(shadow.externalSourceName),
      externalSourceId: nullIfEmpty(shadow.externalSourceId),
    },
  };
}

function diffState(beforeShadow, afterShadow) {
  if (!beforeShadow && !afterShadow) return null;
  const fields = [
    'lifecycleState',
    'reviewState',
    'paymentState',
    'inventoryState',
    'visibilityState',
  ];
  const changed = fields.some((f) => (beforeShadow?.[f] || null) !== (afterShadow?.[f] || null));
  if (!changed) return null;
  return {
    previousState: beforeShadow?.lifecycleState || null,
    nextState: afterShadow?.lifecycleState || null,
    previousReviewState: beforeShadow?.reviewState || null,
    nextReviewState: afterShadow?.reviewState || null,
    previousPaymentState: beforeShadow?.paymentState || null,
    nextPaymentState: afterShadow?.paymentState || null,
    previousInventoryState: beforeShadow?.inventoryState || null,
    nextInventoryState: afterShadow?.inventoryState || null,
    previousVisibilityState: beforeShadow?.visibilityState || null,
    nextVisibilityState: afterShadow?.visibilityState || null,
  };
}

function inferTransitionAction(beforeShadow, afterShadow) {
  if (!afterShadow) return 'listing_deleted';
  if (!beforeShadow) return 'shadow_initialized';
  if (
    beforeShadow.paymentState !== afterShadow.paymentState &&
    afterShadow.paymentState === 'paid'
  ) {
    return 'confirm_payment';
  }
  const key = `${beforeShadow.lifecycleState}->${afterShadow.lifecycleState}`;
  const map = {
    'draft->submitted': 'submit_listing',
    'rejected->submitted': 'submit_listing',
    'submitted->approved_unpaid': 'approve_listing',
    'submitted->rejected': 'reject_listing',
    'approved_unpaid->rejected': 'reject_listing',
    'approved_unpaid->live': 'publish_listing',
    'live->expired': 'expire_listing',
    'expired->live': 'relist_listing',
    'sold->live': 'relist_listing',
    'live->sold': 'mark_listing_sold',
    'draft->archived': 'archive_listing',
    'submitted->archived': 'archive_listing',
    'approved_unpaid->archived': 'archive_listing',
    'live->archived': 'archive_listing',
    'expired->archived': 'archive_listing',
    'sold->archived': 'archive_listing',
    'rejected->archived': 'archive_listing',
  };
  return map[key] || 'shadow_sync';
}

function pickActorId(before, after) {
  const value =
    after?.updatedByUid ||
    after?.updatedBy ||
    after?.approvedBy ||
    after?.sellerUid ||
    after?.sellerId ||
    before?.updatedByUid ||
    before?.updatedBy ||
    before?.approvedBy ||
    before?.sellerUid ||
    before?.sellerId ||
    null;
  return nullIfEmpty(value);
}

/**
 * Mirror a Firestore listing write into Data Connect / PostgreSQL.
 *
 * @param {Object} params
 * @param {string} params.listingId — the Firestore document id.
 * @param {Object|null} params.before — Firestore data before the write.
 * @param {Object|null} params.after — Firestore data after the write.
 * @param {string} [params.requestId] — optional correlation id.
 * @returns {Promise<{ status: 'inserted'|'updated'|'deleted'|'skipped', uuid: string|null }>}
 */
async function syncListingToDataConnect({ listingId, before, after, requestId = null }) {
  if (!listingId) {
    return { status: 'skipped', uuid: null, reason: 'missing_listing_id' };
  }

  const {
    findListingByFirestoreId,
    insertListingShadow,
    updateListingShadow,
    deleteListingShadow,
    recordListingStateTransition,
  } = loadDataConnectRuntime();

  const client = getDataConnectClient();
  const findResult = await findListingByFirestoreId(client, { legacyFirestoreId: listingId });
  const existing = findResult?.data?.listings?.[0] || null;

  // Deletion path
  if (!after) {
    if (!existing) {
      return { status: 'skipped', uuid: null, reason: 'not_in_postgres' };
    }
    await deleteListingShadow(client, { id: existing.id });
    return { status: 'deleted', uuid: existing.id };
  }

  const { shadow: afterShadow, variables } = buildDataConnectListingVariables(listingId, after);
  const beforeShadow = before ? buildListingGovernanceShadow({ id: listingId, ...before }) : null;
  const actorId = pickActorId(before, after);

  // Insert path
  if (!existing) {
    await insertListingShadow(client, variables);
    const inserted = await findListingByFirestoreId(client, { legacyFirestoreId: listingId });
    const newId = inserted?.data?.listings?.[0]?.id || null;
    const transitionDiff = diffState(null, afterShadow);
    if (newId && transitionDiff) {
      try {
        await recordListingStateTransition(client, {
          listingId: newId,
          transitionAction: inferTransitionAction(null, afterShadow),
          ...transitionDiff,
          actorType: 'system',
          actorId,
          requestId,
          reasonCode: null,
          reasonNote: null,
        });
      } catch (error) {
        // Transition log is secondary — log and continue.
        // eslint-disable-next-line no-console
        console.warn('Failed to record listing transition on insert', {
          listingId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return { status: 'inserted', uuid: newId };
  }

  // Update path
  const { id: uuid } = existing;
  const { legacyFirestoreId: _legacy, sourceSystem: _src, ...updateVars } = variables;
  await updateListingShadow(client, { id: uuid, ...updateVars });

  const transitionDiff = diffState(beforeShadow, afterShadow);
  if (transitionDiff) {
    try {
      await recordListingStateTransition(client, {
        listingId: uuid,
        transitionAction: inferTransitionAction(beforeShadow, afterShadow),
        ...transitionDiff,
        actorType: 'system',
        actorId,
        requestId,
        reasonCode: null,
        reasonNote: null,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to record listing transition on update', {
        listingId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { status: 'updated', uuid };
}

module.exports = {
  buildDataConnectListingVariables,
  diffState,
  inferTransitionAction,
  syncListingToDataConnect,
};
