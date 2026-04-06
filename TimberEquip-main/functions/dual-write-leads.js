/**
 * Phase 4 dual-write triggers: Firestore → PostgreSQL (Leads & Inquiries)
 *
 * These Cloud Function triggers listen for writes to lead-related
 * Firestore collections and mirror each change to PostgreSQL via
 * Firebase Data Connect.
 *
 * Collections:
 *   inquiries/{id}           → inquiries table
 *   financingRequests/{id}   → financing_requests table
 *   calls/{id}               → call_logs table
 *   contactRequests/{id}     → contact_requests table
 *
 * The Data Connect admin SDK is auto-generated after running:
 *   firebase dataconnect:sdk:generate
 *
 * Until the SDK is generated, the actual mutation calls are wrapped in a
 * guard that logs a warning and returns early.
 */

const { logger } = require('firebase-functions/v2');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { captureFunctionsException } = require('./sentry.js');

const FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';

// ─── Data Connect Admin SDK imports ─────────────────────────────────────
const {
  upsertInquiry,
  upsertFinancingRequest,
  insertCallLog,
  insertContactRequest,
} = require('./generated/dataconnect/leads');

const mutations = {
  upsertInquiry,
  upsertFinancingRequest,
  insertCallLog,
  insertContactRequest,
};

async function guardedMutation(name, variables) {
  const fn = mutations[name];
  if (!fn) {
    logger.error(`[dual-write-leads] Unknown mutation: ${name}`);
    return;
  }
  try {
    await fn(variables);
  } catch (err) {
    logger.error(`[dual-write-leads] ${name} failed`, { error: err.message, variables: Object.keys(variables) });
    captureFunctionsException(err, { mutation: name, module: 'dual-write-leads', variableKeys: Object.keys(variables) });
  }
}

// ─── Utility ───────────────────────────────────────────────────────────

function tsToIso(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toISOString();
  return null;
}

function safeStr(val) {
  return typeof val === 'string' ? val.trim() || null : null;
}

function safeNum(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  return null;
}

// ─── Inquiry sync ─────────────────────────────────────────────────────

exports.syncInquiryToPostgres = onDocumentWritten(
  { document: 'inquiries/{inquiryId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { inquiryId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-leads] Inquiry ${inquiryId} deleted`);
      return;
    }

    const payload = {
      id: inquiryId,
      listingId: safeStr(after.listingId),
      sellerUid: safeStr(after.sellerUid),
      buyerUid: safeStr(after.buyerUid),
      buyerName: after.buyerName || after.name || '',
      buyerEmail: after.buyerEmail || after.email || '',
      buyerPhone: safeStr(after.buyerPhone) || safeStr(after.phone),
      message: safeStr(after.message),
      type: after.type || 'Inquiry',
      status: after.status || 'New',
      assignedToUid: safeStr(after.assignedToUid),
      assignedToName: safeStr(after.assignedToName),
      internalNotes: Array.isArray(after.internalNotes) ? after.internalNotes : [],
      firstResponseAt: tsToIso(after.firstResponseAt),
      responseTimeMinutes: safeNum(after.responseTimeMinutes),
      spamScore: safeNum(after.spamScore),
      spamFlags: Array.isArray(after.spamFlags) ? after.spamFlags : [],
      contactConsentAccepted: Boolean(after.contactConsentAccepted),
      contactConsentVersion: safeStr(after.contactConsentVersion),
      contactConsentScope: safeStr(after.contactConsentScope),
      contactConsentAt: tsToIso(after.contactConsentAt),
    };

    logger.info(`[dual-write-leads] Syncing inquiry ${inquiryId} to PostgreSQL`);
    return guardedMutation('upsertInquiry', payload);
  }
);

// ─── Financing Request sync ───────────────────────────────────────────

exports.syncFinancingRequestToPostgres = onDocumentWritten(
  { document: 'financingRequests/{requestId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { requestId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-leads] Financing request ${requestId} deleted`);
      return;
    }

    const payload = {
      id: requestId,
      listingId: safeStr(after.listingId),
      sellerUid: safeStr(after.sellerUid),
      buyerUid: safeStr(after.buyerUid),
      applicantName: after.applicantName || after.name || '',
      applicantEmail: after.applicantEmail || after.email || '',
      applicantPhone: safeStr(after.applicantPhone) || safeStr(after.phone),
      company: safeStr(after.company),
      requestedAmount: safeNum(after.requestedAmount),
      message: safeStr(after.message),
      status: after.status || 'New',
      contactConsentAccepted: Boolean(after.contactConsentAccepted),
      contactConsentVersion: safeStr(after.contactConsentVersion),
      contactConsentScope: safeStr(after.contactConsentScope),
      contactConsentAt: tsToIso(after.contactConsentAt),
    };

    logger.info(`[dual-write-leads] Syncing financing request ${requestId} to PostgreSQL`);
    return guardedMutation('upsertFinancingRequest', payload);
  }
);

// ─── Call Log sync ────────────────────────────────────────────────────

exports.syncCallLogToPostgres = onDocumentWritten(
  { document: 'calls/{callId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { callId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-leads] Call log ${callId} deleted`);
      return;
    }

    const payload = {
      id: callId,
      listingId: safeStr(after.listingId),
      listingTitle: safeStr(after.listingTitle),
      sellerUid: safeStr(after.sellerUid),
      sellerName: safeStr(after.sellerName),
      sellerPhone: safeStr(after.sellerPhone),
      callerUid: safeStr(after.callerUid),
      callerName: safeStr(after.callerName),
      callerEmail: safeStr(after.callerEmail),
      callerPhone: safeStr(after.callerPhone),
      duration: safeNum(after.duration) ?? 0,
      status: after.status || 'completed',
      source: safeStr(after.source),
      isAuthenticated: Boolean(after.isAuthenticated),
      recordingUrl: safeStr(after.recordingUrl),
      twilioCallSid: safeStr(after.twilioCallSid),
      completedAt: tsToIso(after.completedAt),
    };

    logger.info(`[dual-write-leads] Syncing call log ${callId} to PostgreSQL`);
    return guardedMutation('insertCallLog', payload);
  }
);

// ─── Contact Request sync ─────────────────────────────────────────────

exports.syncContactRequestToPostgres = onDocumentWritten(
  { document: 'contactRequests/{requestId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { requestId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-leads] Contact request ${requestId} deleted`);
      return;
    }

    const payload = {
      id: requestId,
      name: safeStr(after.name),
      email: after.email || '',
      category: safeStr(after.category),
      message: safeStr(after.message),
      source: safeStr(after.source),
      status: after.status || 'New',
    };

    logger.info(`[dual-write-leads] Syncing contact request ${requestId} to PostgreSQL`);
    return guardedMutation('insertContactRequest', payload);
  }
);
