import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { getGoogleAccessToken } from './google-auth-token.mjs';

const require = createRequire(import.meta.url);
const twilio = require('../functions/node_modules/twilio');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const PROJECT_ID = 'timberequip-staging';
const BASE_URL = 'https://timberequip-staging.web.app';
const SELLER_EMAIL = 'staging.matrix.member.20260329@example.com';
const OUTPUT_PATH = path.join(REPO_ROOT, 'output', 'qa', `staging-twilio-voicemail-smoke-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`);

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([key, nested]) => [key, decodeFirestoreValue(nested)]));
  }
  if ('arrayValue' in value) {
    return Array.isArray(value.arrayValue?.values) ? value.arrayValue.values.map(decodeFirestoreValue) : [];
  }
  return null;
}

function decodeFirestoreDocument(document) {
  const name = String(document?.name || '');
  const id = name.split('/').pop() || '';
  const fields = document?.fields || {};
  return {
    id,
    name,
    data: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)])),
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}: ${text}`);
  }
  return data;
}

async function requestText(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}: ${text}`);
  }
  return text;
}

async function accessSecret(secretName, headers) {
  const url = `https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/${secretName}/versions/latest:access`;
  const data = await requestJson(url, { headers });
  const encoded = String(data?.payload?.data || '');
  return Buffer.from(encoded, 'base64').toString('utf8');
}

async function runFirestoreQuery(structuredQuery, headers) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ structuredQuery }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) {
    throw new Error(`Firestore query failed with ${response.status}: ${text}`);
  }

  return Array.isArray(data)
    ? data.filter((entry) => entry.document).map((entry) => decodeFirestoreDocument(entry.document))
    : [];
}

async function getFirestoreDocument(documentPath, headers) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${documentPath}`;
  const response = await fetch(url, { headers });
  if (response.status === 404) {
    return null;
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Firestore document request failed with ${response.status}: ${text}`);
  }

  return text ? decodeFirestoreDocument(JSON.parse(text)) : null;
}

async function signedTwilioPost(url, params, authToken) {
  const signature = twilio.getExpectedTwilioSignature(authToken, url, params);
  const body = new URLSearchParams(params);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Twilio-Signature': signature,
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Twilio webhook POST to ${url} failed with ${response.status}: ${text}`);
  }

  return text;
}

async function main() {
  const { accessToken, source } = await getGoogleAccessToken();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const twilioAuthToken = await accessSecret('TWILIO_AUTH_TOKEN', headers);
  const sellerDocs = await runFirestoreQuery({
    from: [{ collectionId: 'users' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'email' },
        op: 'EQUAL',
        value: { stringValue: SELLER_EMAIL },
      },
    },
    limit: 1,
  }, headers);

  if (sellerDocs.length === 0) {
    throw new Error(`No staging seller was found for ${SELLER_EMAIL}.`);
  }

  const seller = sellerDocs[0];
  const sellerUid = seller.id;
  const sellerData = seller.data || {};
  const calledNumber = String(sellerData.twilioPhoneNumber || '').trim();
  if (!calledNumber) {
    throw new Error(`Seller ${SELLER_EMAIL} does not have a Twilio tracking number provisioned.`);
  }

  const numberDoc = await getFirestoreDocument(`twilioNumbers/${encodeURIComponent(calledNumber)}`, headers);
  if (!numberDoc) {
    throw new Error(`Twilio number document for ${calledNumber} was not found in staging.`);
  }

  const callerNumber = '+15555550173';
  const callSid = `CA${crypto.randomBytes(16).toString('hex')}`;
  const recordingSid = `RE${crypto.randomBytes(16).toString('hex')}`;
  const inboundUrl = `${BASE_URL}/api/twilio/voice/inbound`;
  const statusUrl = `${BASE_URL}/api/twilio/voice/status`;
  const voicemailUrl = `${BASE_URL}/api/twilio/voice/voicemail`;
  const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/ACsmoketest/Recordings/${recordingSid}`;

  const inboundResponse = await signedTwilioPost(inboundUrl, {
    CallSid: callSid,
    AccountSid: 'ACsmoketest',
    From: callerNumber,
    To: calledNumber,
    Caller: callerNumber,
    CallStatus: 'ringing',
    Direction: 'inbound',
  }, twilioAuthToken);

  if (!inboundResponse.includes('<Dial') || !inboundResponse.includes('record="record-from-answer-dual"')) {
    throw new Error(`Inbound TwiML did not include the expected Dial response: ${inboundResponse}`);
  }

  const statusResponse = await signedTwilioPost(statusUrl, {
    CallSid: callSid,
    AccountSid: 'ACsmoketest',
    DialCallStatus: 'no-answer',
    CallStatus: 'completed',
  }, twilioAuthToken);

  if (!statusResponse.includes('<Record') || !statusResponse.includes('/api/twilio/voice/voicemail')) {
    throw new Error(`Status callback did not return voicemail Record TwiML: ${statusResponse}`);
  }

  const voicemailResponse = await signedTwilioPost(voicemailUrl, {
    CallSid: callSid,
    AccountSid: 'ACsmoketest',
    RecordingUrl: recordingUrl,
    RecordingStatus: 'completed',
    RecordingDuration: '42',
  }, twilioAuthToken);

  if (!/message has been recorded/i.test(voicemailResponse)) {
    throw new Error(`Voicemail callback did not confirm recording capture: ${voicemailResponse}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 2500));

  const callDocs = await runFirestoreQuery({
    from: [{ collectionId: 'calls' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'twilioCallSid' },
        op: 'EQUAL',
        value: { stringValue: callSid },
      },
    },
    limit: 1,
  }, headers);

  if (callDocs.length === 0) {
    throw new Error(`No call log was created for staging call SID ${callSid}.`);
  }

  const call = callDocs[0];
  const callData = call.data || {};
  const result = {
    validatedAt: new Date().toISOString(),
    googleAccessTokenSource: source,
    seller: {
      uid: sellerUid,
      email: SELLER_EMAIL,
      trackingNumber: calledNumber,
      forwardingNumber: numberDoc.data?.sellerRealPhone || null,
    },
    twilio: {
      callSid,
      callerNumber,
      inboundResponseContainsDial: true,
      statusResponseContainsVoicemailRecord: true,
      voicemailResponseConfirmed: true,
      recordingUrl,
    },
    persistedCall: {
      id: call.id,
      sellerUid: callData.sellerUid || null,
      status: callData.status || null,
      duration: callData.duration || null,
      recordingUrl: callData.recordingUrl || null,
      twilioCallStatus: callData.twilioCallStatus || null,
      voicemailCapturedAt: callData.voicemailCapturedAt || null,
      voicemailEmailSentAt: callData.voicemailEmailSentAt || null,
    },
  };

  if (String(callData.status || '') !== 'Voicemail') {
    throw new Error(`Expected call status to be Voicemail, received ${String(callData.status || '(blank)')}.`);
  }

  if (Number(callData.duration || 0) !== 42) {
    throw new Error(`Expected voicemail duration 42, received ${String(callData.duration || '(blank)')}.`);
  }

  if (String(callData.recordingUrl || '') !== `${recordingUrl}.mp3`) {
    throw new Error(`Expected normalized recording URL ${recordingUrl}.mp3, received ${String(callData.recordingUrl || '(blank)')}.`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));
  console.log(`Saved staging voicemail smoke artifact to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
