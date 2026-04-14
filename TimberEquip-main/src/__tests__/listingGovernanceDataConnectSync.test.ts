import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  buildDataConnectListingVariables,
  diffState,
  inferTransitionAction,
} = require('../../functions/listing-governance-dataconnect-sync.js');

describe('buildDataConnectListingVariables', () => {
  it('maps a live approved listing to Data Connect variables with ISO timestamps', () => {
    const publishedAt = new Date('2026-01-15T10:00:00Z');
    const expiresAt = new Date('2026-07-15T10:00:00Z');
    const listing = {
      sellerUid: 'seller-123',
      title: '2020 John Deere 748L Skidder',
      category: 'Logging',
      subcategory: 'Skidders',
      make: 'John Deere',
      model: '748L',
      location: 'Bangor, Maine',
      price: 185000,
      currency: 'USD',
      status: 'active',
      approvalStatus: 'approved',
      paymentStatus: 'paid',
      publishedAt,
      expiresAt,
      images: ['https://cdn.example.com/img-1.jpg', 'https://cdn.example.com/img-2.jpg'],
    };

    const { shadow, variables } = buildDataConnectListingVariables('listing-abc', listing);

    expect(variables.legacyFirestoreId).toBe('listing-abc');
    expect(variables.sellerPartyId).toBe('seller-123');
    expect(variables.title).toBe('2020 John Deere 748L Skidder');
    expect(variables.categoryKey).toBe('Logging');
    expect(variables.subcategoryKey).toBe('Skidders');
    expect(variables.manufacturerKey).toBe('John Deere');
    expect(variables.modelKey).toBe('748L');
    expect(variables.locationText).toBe('Bangor, Maine');
    expect(variables.priceAmount).toBe(185000);
    expect(variables.currencyCode).toBe('USD');
    expect(variables.lifecycleState).toBe('live');
    expect(variables.reviewState).toBe('approved');
    expect(variables.paymentState).toBe('paid');
    expect(variables.inventoryState).toBe('active');
    expect(variables.visibilityState).toBe('public_live');
    expect(variables.primaryImageUrl).toBe('https://cdn.example.com/img-1.jpg');
    expect(variables.publishedAt).toBe(publishedAt.toISOString());
    expect(variables.expiresAt).toBe(expiresAt.toISOString());
    expect(variables.soldAt).toBeNull();
    expect(variables.sourceSystem).toBe('firestore');
    expect(variables.externalSourceName).toBeNull();
    expect(variables.externalSourceId).toBeNull();

    // Shadow is returned for callers that want to diff state transitions.
    expect(shadow.lifecycleState).toBe('live');
    expect(shadow.isPublic).toBe(true);
  });

  it('coerces missing required fields to safe defaults', () => {
    const { variables } = buildDataConnectListingVariables('listing-blank', {});
    expect(variables.legacyFirestoreId).toBe('listing-blank');
    expect(variables.sellerPartyId).toBe('unknown');
    expect(variables.title).toBe('(untitled)');
    expect(variables.categoryKey).toBe('unknown');
    expect(variables.subcategoryKey).toBeNull();
    expect(variables.manufacturerKey).toBeNull();
    expect(variables.modelKey).toBeNull();
    expect(variables.locationText).toBeNull();
    expect(variables.priceAmount).toBeNull();
    expect(variables.currencyCode).toBe('USD');
    // An empty listing defaults to reviewState=pending, paymentState=pending,
    // and status=pending. deriveLifecycleState treats that as "submitted" (a
    // just-created listing awaiting review). See listing-governance-rules.js.
    expect(variables.lifecycleState).toBe('submitted');
    expect(variables.reviewState).toBe('pending');
    expect(variables.paymentState).toBe('pending');
    expect(variables.inventoryState).toBe('draft');
    expect(variables.visibilityState).toBe('private');
    expect(variables.primaryImageUrl).toBeNull();
    expect(variables.publishedAt).toBeNull();
    expect(variables.expiresAt).toBeNull();
    expect(variables.soldAt).toBeNull();
  });

  it('handles Firestore Timestamp-like objects via toDate()', () => {
    const publishedDate = new Date('2026-02-01T12:00:00Z');
    const fakeTimestamp = { toDate: () => publishedDate };
    const { variables } = buildDataConnectListingVariables('listing-ts', {
      sellerUid: 'seller-1',
      title: 'Test',
      category: 'Logging',
      approvalStatus: 'approved',
      paymentStatus: 'paid',
      status: 'active',
      publishedAt: fakeTimestamp,
    });
    expect(variables.publishedAt).toBe(publishedDate.toISOString());
  });

  it('maps rejected listings to the rejected lifecycle state', () => {
    const { variables } = buildDataConnectListingVariables('listing-rej', {
      sellerUid: 'seller-9',
      title: 'Rejected Listing',
      category: 'Logging',
      approvalStatus: 'rejected',
      paymentStatus: 'pending',
      status: 'pending',
    });
    expect(variables.lifecycleState).toBe('rejected');
    expect(variables.visibilityState).toBe('private');
  });

  it('maps sold listings with public_sold visibility when approved + paid', () => {
    const soldAt = new Date('2026-03-10T08:00:00Z');
    const { variables } = buildDataConnectListingVariables('listing-sold', {
      sellerUid: 'seller-2',
      title: 'Sold Skidder',
      category: 'Logging',
      approvalStatus: 'approved',
      paymentStatus: 'paid',
      status: 'sold',
      soldAt,
    });
    expect(variables.lifecycleState).toBe('sold');
    expect(variables.visibilityState).toBe('public_sold');
    expect(variables.soldAt).toBe(soldAt.toISOString());
  });

  it('captures external source attribution when present', () => {
    const { variables } = buildDataConnectListingVariables('listing-feed', {
      sellerUid: 'seller-3',
      title: 'Imported Listing',
      category: 'Logging',
      externalSource: { sourceName: 'dealer-feed', externalId: 'SKU-42' },
    });
    expect(variables.externalSourceName).toBe('dealer-feed');
    expect(variables.externalSourceId).toBe('SKU-42');
  });
});

describe('diffState', () => {
  it('returns null when both shadows are null/undefined', () => {
    expect(diffState(null, null)).toBeNull();
    expect(diffState(undefined, undefined)).toBeNull();
  });

  it('returns null when no lifecycle/review/payment/inventory/visibility fields changed', () => {
    const shadow = {
      lifecycleState: 'live',
      reviewState: 'approved',
      paymentState: 'paid',
      inventoryState: 'active',
      visibilityState: 'public_live',
    };
    expect(diffState(shadow, { ...shadow })).toBeNull();
  });

  it('returns a diff when lifecycleState changes', () => {
    const before = {
      lifecycleState: 'submitted',
      reviewState: 'pending',
      paymentState: 'pending',
      inventoryState: 'draft',
      visibilityState: 'private',
    };
    const after = {
      lifecycleState: 'approved_unpaid',
      reviewState: 'approved',
      paymentState: 'pending',
      inventoryState: 'draft',
      visibilityState: 'private',
    };
    const diff = diffState(before, after);
    expect(diff).not.toBeNull();
    expect(diff?.previousState).toBe('submitted');
    expect(diff?.nextState).toBe('approved_unpaid');
    expect(diff?.previousReviewState).toBe('pending');
    expect(diff?.nextReviewState).toBe('approved');
    expect(diff?.previousPaymentState).toBe('pending');
    expect(diff?.nextPaymentState).toBe('pending');
  });

  it('returns a diff when only paymentState changes', () => {
    const before = {
      lifecycleState: 'approved_unpaid',
      reviewState: 'approved',
      paymentState: 'pending',
      inventoryState: 'draft',
      visibilityState: 'private',
    };
    const after = { ...before, paymentState: 'paid' };
    const diff = diffState(before, after);
    expect(diff).not.toBeNull();
    expect(diff?.previousPaymentState).toBe('pending');
    expect(diff?.nextPaymentState).toBe('paid');
  });

  it('treats a null before shadow as an insert diff', () => {
    const after = {
      lifecycleState: 'draft',
      reviewState: 'pending',
      paymentState: 'pending',
      inventoryState: 'draft',
      visibilityState: 'private',
    };
    const diff = diffState(null, after);
    expect(diff).not.toBeNull();
    expect(diff?.previousState).toBeNull();
    expect(diff?.nextState).toBe('draft');
  });
});

describe('inferTransitionAction', () => {
  it('returns listing_deleted when afterShadow is missing', () => {
    expect(inferTransitionAction({ lifecycleState: 'live' }, null)).toBe('listing_deleted');
  });

  it('returns shadow_initialized for first-time inserts', () => {
    expect(inferTransitionAction(null, { lifecycleState: 'draft' })).toBe('shadow_initialized');
  });

  it('returns confirm_payment when paymentState transitions to paid', () => {
    const before = { lifecycleState: 'approved_unpaid', paymentState: 'pending' };
    const after = { lifecycleState: 'approved_unpaid', paymentState: 'paid' };
    expect(inferTransitionAction(before, after)).toBe('confirm_payment');
  });

  it('maps draft->submitted to submit_listing', () => {
    expect(
      inferTransitionAction(
        { lifecycleState: 'draft', paymentState: 'pending' },
        { lifecycleState: 'submitted', paymentState: 'pending' },
      ),
    ).toBe('submit_listing');
  });

  it('maps submitted->approved_unpaid to approve_listing', () => {
    expect(
      inferTransitionAction(
        { lifecycleState: 'submitted', paymentState: 'pending' },
        { lifecycleState: 'approved_unpaid', paymentState: 'pending' },
      ),
    ).toBe('approve_listing');
  });

  it('maps approved_unpaid->live to publish_listing', () => {
    expect(
      inferTransitionAction(
        { lifecycleState: 'approved_unpaid', paymentState: 'paid' },
        { lifecycleState: 'live', paymentState: 'paid' },
      ),
    ).toBe('publish_listing');
  });

  it('maps live->expired to expire_listing', () => {
    expect(
      inferTransitionAction(
        { lifecycleState: 'live', paymentState: 'paid' },
        { lifecycleState: 'expired', paymentState: 'paid' },
      ),
    ).toBe('expire_listing');
  });

  it('maps live->sold to mark_listing_sold', () => {
    expect(
      inferTransitionAction(
        { lifecycleState: 'live', paymentState: 'paid' },
        { lifecycleState: 'sold', paymentState: 'paid' },
      ),
    ).toBe('mark_listing_sold');
  });

  it('maps any lifecycle -> archived to archive_listing', () => {
    const sources = ['draft', 'submitted', 'approved_unpaid', 'live', 'expired', 'sold', 'rejected'];
    for (const from of sources) {
      expect(
        inferTransitionAction(
          { lifecycleState: from, paymentState: 'pending' },
          { lifecycleState: 'archived', paymentState: 'pending' },
        ),
      ).toBe('archive_listing');
    }
  });

  it('falls back to shadow_sync for unmapped lifecycle transitions', () => {
    expect(
      inferTransitionAction(
        { lifecycleState: 'live', paymentState: 'paid' },
        { lifecycleState: 'live', paymentState: 'paid', reviewState: 'approved' },
      ),
    ).toBe('shadow_sync');
  });
});
