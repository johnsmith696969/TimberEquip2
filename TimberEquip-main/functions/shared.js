/**
 * Shared infrastructure used across all Cloud Function modules.
 * Provides database access, string normalization, storage helpers, and
 * common constants that multiple modules depend on.
 */
'use strict';

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');

// ── String helpers ───────────────────────────────────────────────────────────

function normalizeNonEmptyString(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeFiniteNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeMarketplaceText(value) {
  return String(value || '').trim().toLowerCase();
}

// ── Database access ──────────────────────────────────────────────────────────

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';

function resolveProjectId() {
  return normalizeNonEmptyString(
    process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.PROJECT_ID,
    'mobile-app-equipment-sales',
  );
}

function resolveFirestoreDatabaseId() {
  const configuredDatabaseId = normalizeNonEmptyString(
    process.env.FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID,
    '',
  );
  if (configuredDatabaseId) return configuredDatabaseId;
  return resolveProjectId() === 'timberequip-staging' ? '(default)' : DEFAULT_FIRESTORE_DB_ID;
}

function getDb() {
  return getFirestore(resolveFirestoreDatabaseId());
}

function getAuctionDb() {
  return getFirestore('(default)');
}

// ── Storage helpers ──────────────────────────────────────────────────────────

function resolveStorageBucketName() {
  const explicitBucket = normalizeNonEmptyString(
    process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET,
  );
  if (explicitBucket) return explicitBucket;

  const rawFirebaseConfig = normalizeNonEmptyString(process.env.FIREBASE_CONFIG);
  if (rawFirebaseConfig) {
    try {
      const parsed = JSON.parse(rawFirebaseConfig);
      const configuredBucket = normalizeNonEmptyString(parsed?.storageBucket);
      if (configuredBucket) return configuredBucket;
    } catch (error) {
      logger.warn(`Unable to parse FIREBASE_CONFIG for storage bucket resolution: ${error.message}`);
    }
  }

  const projectId = normalizeNonEmptyString(
    process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.PROJECT_ID,
  );
  if (projectId) return `${projectId}.firebasestorage.app`;

  return 'mobile-app-equipment-sales.firebasestorage.app';
}

function buildFirebaseDownloadUrl(bucket, path, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  normalizeNonEmptyString,
  normalizeFiniteNumber,
  normalizeMarketplaceText,
  resolveProjectId,
  resolveFirestoreDatabaseId,
  getDb,
  getAuctionDb,
  resolveStorageBucketName,
  buildFirebaseDownloadUrl,
};
