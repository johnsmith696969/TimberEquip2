const admin = require('firebase-admin');
const { randomUUID } = require('node:crypto');
const {
  buildListingGovernanceShadow,
  detectGovernanceAnomalies,
  timestampToDate: governanceTimestampToDate,
} = require('./listing-governance-rules.js');

function normalizeNonEmptyString(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function withListingGovernanceIdentity(listingId, data) {
  if (!data) return null;
  return { id: listingId, ...data };
}

function governanceDateToIso(value) {
  const parsed = governanceTimestampToDate(value);
  return parsed ? parsed.toISOString() : null;
}

function toFirestoreTimestampOrServerNow(value) {
  const parsed = governanceTimestampToDate(value);
  return parsed || new Date();
}

function buildGovernanceStateSnapshot(shadow, rawData = {}) {
  if (!shadow) return {};

  return {
    lifecycleState: shadow.lifecycleState,
    reviewState: shadow.reviewState,
    paymentState: shadow.paymentState,
    inventoryState: shadow.inventoryState,
    visibilityState: shadow.visibilityState,
    isPublic: shadow.isPublic,
    publishedAt: governanceDateToIso(shadow.publishedAt),
    expiresAt: governanceDateToIso(shadow.expiresAt),
    soldAt: governanceDateToIso(shadow.soldAt),
    rawStatus: normalizeNonEmptyString(rawData.status, 'pending').toLowerCase(),
    rawApprovalStatus: normalizeNonEmptyString(rawData.approvalStatus, 'pending').toLowerCase(),
    rawPaymentStatus: normalizeNonEmptyString(rawData.paymentStatus, 'pending').toLowerCase(),
  };
}

function hasGovernanceStateTransition(beforeShadow, afterShadow) {
  if (!beforeShadow && afterShadow) return true;
  if (beforeShadow && !afterShadow) return true;
  if (!beforeShadow || !afterShadow) return false;

  return [
    'lifecycleState',
    'reviewState',
    'paymentState',
    'inventoryState',
    'visibilityState',
  ].some((field) => beforeShadow[field] !== afterShadow[field]);
}

function inferGovernanceTransitionType(beforeShadow, afterShadow) {
  if (!afterShadow) return 'listing_deleted';
  if (!beforeShadow) return 'governance_shadow_initialized';

  if (beforeShadow.paymentState !== afterShadow.paymentState && afterShadow.paymentState === 'paid') {
    return 'confirm_payment';
  }

  const transitionKey = `${beforeShadow.lifecycleState}->${afterShadow.lifecycleState}`;
  const directTransitions = {
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

  return directTransitions[transitionKey] || 'governance_shadow_sync';
}

function pickGovernanceActorUid(before, after) {
  return normalizeNonEmptyString(
    after?.updatedByUid ||
      after?.updatedBy ||
      after?.approvedBy ||
      after?.sellerUid ||
      after?.sellerId ||
      before?.updatedByUid ||
      before?.updatedBy ||
      before?.approvedBy ||
      before?.sellerUid ||
      before?.sellerId,
    'system',
  );
}

function buildGovernanceReportSummary(listingId, shadow, anomalies) {
  const anomalySummary = anomalies.length ? anomalies.join(', ') : 'none';
  return `Listing ${listingId}: lifecycle=${shadow.lifecycleState}, review=${shadow.reviewState}, payment=${shadow.paymentState}, inventory=${shadow.inventoryState}, visibility=${shadow.visibilityState}, anomalies=${anomalySummary}.`;
}

function buildMediaAuditSummary(listingId, listing, anomalies) {
  const images = Array.isArray(listing?.images) ? listing.images.filter((value) => normalizeNonEmptyString(value)) : [];
  const primaryImagePresent = Boolean(images[0]);
  const mediaIssues = anomalies.filter((code) => code === 'missing_primary_image');
  const issueSummary = mediaIssues.length ? mediaIssues.join(', ') : 'none';
  return `Listing ${listingId}: imageCount=${images.length}, primaryImage=${primaryImagePresent ? 'present' : 'missing'}, mediaIssues=${issueSummary}.`;
}

function evaluateListingGovernanceArtifacts({ listingId, listing, options = {} }) {
  const listingInput = withListingGovernanceIdentity(listingId, listing);
  if (!listingInput) {
    return {
      listingInput: null,
      shadow: null,
      anomalies: [],
      imageCount: 0,
      primaryImagePresent: false,
    };
  }

  const shadow = buildListingGovernanceShadow(listingInput, options);
  const anomalies = detectGovernanceAnomalies(listingInput, options);
  const imageCount = Array.isArray(listing?.images)
    ? listing.images.filter((value) => normalizeNonEmptyString(value)).length
    : 0;
  const primaryImagePresent = Boolean(normalizeNonEmptyString(shadow.primaryImageUrl));

  return {
    listingInput,
    shadow,
    anomalies,
    imageCount,
    primaryImagePresent,
  };
}

async function syncListingGovernanceArtifactsForWrite({
  db,
  listingId,
  before,
  after,
  source = 'listing_write_trigger',
  emitInitializationTransition = true,
}) {
  const auditRef = db.collection('listingAuditReports').doc(listingId);
  const mediaAuditRef = db.collection('listingMediaAudit').doc(listingId);

  const beforeInput = withListingGovernanceIdentity(listingId, before);
  const afterEvaluation = evaluateListingGovernanceArtifacts({ listingId, listing: after });

  if (!afterEvaluation.listingInput) {
    const cleanupBatch = db.batch();
    cleanupBatch.delete(auditRef);
    cleanupBatch.delete(mediaAuditRef);
    await cleanupBatch.commit();
    return {
      deleted: true,
      wroteTransition: false,
      anomalies: [],
      shadow: null,
      imageCount: 0,
      primaryImagePresent: false,
    };
  }

  const beforeShadow = beforeInput ? buildListingGovernanceShadow(beforeInput) : null;
  const {
    anomalies,
    shadow: afterShadow,
    imageCount,
    primaryImagePresent,
  } = afterEvaluation;
  const actorUid = pickGovernanceActorUid(before, after);
  const createdAtValue = toFirestoreTimestampOrServerNow(after?.createdAt);
  const shouldWriteTransition =
    hasGovernanceStateTransition(beforeShadow, afterShadow) &&
    (emitInitializationTransition || Boolean(beforeShadow));

  const batch = db.batch();

  batch.set(
    auditRef,
    {
      listingId,
      reportType: 'governance_shadow',
      status: anomalies.length ? 'failed' : 'completed',
      summary: buildGovernanceReportSummary(listingId, afterShadow, anomalies),
      createdAt: createdAtValue,
      updatedAt: new Date(),
      createdByUid: 'system',
      artifactSource: source,
      actorUid,
      anomalyCodes: anomalies,
      anomalyCount: anomalies.length,
      shadowState: buildGovernanceStateSnapshot(afterShadow, after),
      rawState: {
        status: normalizeNonEmptyString(after?.status, 'pending').toLowerCase(),
        approvalStatus: normalizeNonEmptyString(after?.approvalStatus, 'pending').toLowerCase(),
        paymentStatus: normalizeNonEmptyString(after?.paymentStatus, 'pending').toLowerCase(),
        publishedAt: governanceDateToIso(after?.publishedAt),
        expiresAt: governanceDateToIso(after?.expiresAt),
        soldAt: governanceDateToIso(after?.soldAt),
      },
      governanceSnapshot: {
        ...afterShadow,
        publishedAt: governanceDateToIso(afterShadow.publishedAt),
        expiresAt: governanceDateToIso(afterShadow.expiresAt),
        soldAt: governanceDateToIso(afterShadow.soldAt),
      },
    },
    { merge: true },
  );

  batch.set(
    mediaAuditRef,
    {
      listingId,
      status: primaryImagePresent ? 'completed' : 'failed',
      summary: buildMediaAuditSummary(listingId, after, anomalies),
      createdAt: createdAtValue,
      updatedAt: new Date(),
      createdByUid: 'system',
      artifactSource: source,
      imageCount,
      primaryImagePresent,
      validationErrors: primaryImagePresent ? [] : ['missing_primary_image'],
    },
    { merge: true },
  );

  if (shouldWriteTransition) {
    const transitionRef = db.collection('listingStateTransitions').doc(randomUUID());
    batch.set(transitionRef, {
      listingId,
      transitionType: inferGovernanceTransitionType(beforeShadow, afterShadow),
      fromState: buildGovernanceStateSnapshot(beforeShadow, before || {}),
      toState: buildGovernanceStateSnapshot(afterShadow, after || {}),
      actorUid,
      createdAt: new Date(),
      artifactSource: source,
      anomalyCodes: anomalies,
    });
  }

  await batch.commit();

  return {
    deleted: false,
    wroteTransition: shouldWriteTransition,
    anomalies,
    shadow: afterShadow,
    imageCount,
    primaryImagePresent,
  };
}

module.exports = {
  buildGovernanceStateSnapshot,
  evaluateListingGovernanceArtifacts,
  syncListingGovernanceArtifactsForWrite,
};
