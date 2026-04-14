/**
 * SEO read model sync triggers.
 * Extracted from index.js for modularity.
 */
'use strict';

const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const {
  rebuildPublicSeoReadModel,
  syncPublicSeoForListingChange,
  syncPublicSeoForSellerChange,
} = require('./public-seo-read-model.js');
const { syncListingGovernanceArtifactsForWrite } = require('./listing-governance-artifacts.js');
const { syncListingToDataConnect } = require('./listing-governance-dataconnect-sync.js');
const { getDb } = require('./shared.js');

/**
 * @param {{ FIRESTORE_DB_ID: string, invalidateMarketplaceCaches: () => void }} deps
 */
module.exports = function createSeoSyncTriggers({ FIRESTORE_DB_ID, invalidateMarketplaceCaches }) {
  const syncPublicSeoReadModelOnListingWrite = onDocumentWritten(
    {
      document: 'listings/{listingId}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
    },
    async (event) => {
      const listingId = event.params.listingId;
      const before = event.data?.before?.data() || null;
      const after = event.data?.after?.data() || null;
      invalidateMarketplaceCaches();

      const [seoResult, governanceResult, dataConnectResult] = await Promise.allSettled([
        syncPublicSeoForListingChange({ listingId, before, after }),
        syncListingGovernanceArtifactsForWrite({ db: getDb(), listingId, before, after }),
        syncListingToDataConnect({ listingId, before, after }),
      ]);

      if (seoResult.status === 'rejected') {
        logger.error('Failed to sync public SEO read model for listing write', {
          listingId,
          error: seoResult.reason instanceof Error ? seoResult.reason.message : seoResult.reason,
        });
      }

      if (governanceResult.status === 'rejected') {
        logger.error('Failed to sync listing governance artifacts for listing write', {
          listingId,
          error: governanceResult.reason instanceof Error ? governanceResult.reason.message : governanceResult.reason,
        });
      }

      if (dataConnectResult.status === 'rejected') {
        logger.warn('Failed to dual-write listing to Data Connect (Phase 1)', {
          listingId,
          error: dataConnectResult.reason instanceof Error ? dataConnectResult.reason.message : dataConnectResult.reason,
        });
      }
    }
  );

  const syncPublicSeoReadModelOnUserWrite = onDocumentWritten(
    {
      document: 'users/{uid}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
    },
    async (event) => {
      try {
        await syncPublicSeoForSellerChange(event.params.uid);
      } catch (error) {
        logger.error('Failed to sync public SEO read model for user write', {
          uid: event.params.uid,
          error: error instanceof Error ? error.message : error,
        });
      }
    }
  );

  const syncPublicSeoReadModelOnStorefrontWrite = onDocumentWritten(
    {
      document: 'storefronts/{uid}',
      database: FIRESTORE_DB_ID,
      region: 'us-central1',
    },
    async (event) => {
      try {
        await syncPublicSeoForSellerChange(event.params.uid);
      } catch (error) {
        logger.error('Failed to sync public SEO read model for storefront write', {
          uid: event.params.uid,
          error: error instanceof Error ? error.message : error,
        });
      }
    }
  );

  const rebuildPublicSeoReadModelScheduled = onSchedule(
    {
      schedule: 'every 6 hours',
      region: 'us-central1',
      timeoutSeconds: 300,
      memory: '1GiB',
    },
    async () => {
      try {
        await rebuildPublicSeoReadModel();
      } catch (error) {
        logger.error('Failed to rebuild public SEO read model on schedule', error);
      }
    }
  );

  return {
    syncPublicSeoReadModelOnListingWrite,
    syncPublicSeoReadModelOnUserWrite,
    syncPublicSeoReadModelOnStorefrontWrite,
    rebuildPublicSeoReadModelScheduled,
  };
};
