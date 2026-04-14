const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_FIREBASE_PROJECT_ID = 'mobile-app-equipment-sales';
const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_STORAGE_BUCKET = 'mobile-app-equipment-sales.firebasestorage.app';
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_IMAGE_LIMIT = 6;
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
const FIREBASE_CLI_CLIENT_ID = process.env.FIREBASE_CLIENT_ID || '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLI_CLIENT_SECRET = process.env.FIREBASE_CLIENT_SECRET || 'j9iVZfS8kkCEFUPaAeJV0sAi';
const FIREBASE_TOOLS_CONFIG_PATH = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }

    const [flag, inlineValue] = token.split('=', 2);
    const key = flag.slice(2);

    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function toPositiveInteger(value, fallback) {
  const numeric = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizeNonEmptyString(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeImageUrls(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeNonEmptyString(String(entry || '')))
    .filter((entry) => /^https?:\/\//i.test(entry));
}

function isManagedListingImageUrl(listingId, imageUrl) {
  const normalizedListingId = normalizeNonEmptyString(listingId);
  const normalizedUrl = normalizeNonEmptyString(imageUrl);
  if (!normalizedListingId || !normalizedUrl) {
    return false;
  }

  const encodedPathFragment = encodeURIComponent(`listings/${normalizedListingId}/images/`);
  return normalizedUrl.includes(encodedPathFragment) || normalizedUrl.includes(`/listings/${normalizedListingId}/images/`);
}

function buildDealerFeedSourceImagePath(listingId, imageUrl, index) {
  const normalizedListingId = normalizeNonEmptyString(listingId);
  const imageHash = crypto
    .createHash('sha1')
    .update(`${index}:${normalizeNonEmptyString(imageUrl)}`)
    .digest('hex')
    .slice(0, 16);
  const ordinal = String(index + 1).padStart(2, '0');
  return `listings/${normalizedListingId}/images/source/${ordinal}_${imageHash}.orig`;
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([key, nestedValue]) => [key, decodeFirestoreValue(nestedValue)]));
  }
  if ('arrayValue' in value) {
    return Array.isArray(value.arrayValue?.values) ? value.arrayValue.values.map((entry) => decodeFirestoreValue(entry)) : [];
  }

  return null;
}

function decodeFirestoreDocument(document) {
  const fields = document?.fields || {};
  const decoded = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]));
  decoded.id = String(document?.name || '').split('/').pop() || '';
  return decoded;
}

function readFirebaseToolsConfig() {
  if (!fs.existsSync(FIREBASE_TOOLS_CONFIG_PATH)) {
    throw new Error(`Firebase CLI config not found at ${FIREBASE_TOOLS_CONFIG_PATH}`);
  }

  return JSON.parse(fs.readFileSync(FIREBASE_TOOLS_CONFIG_PATH, 'utf8'));
}

async function refreshFirebaseAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: FIREBASE_CLI_CLIENT_ID,
      client_secret: FIREBASE_CLI_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Unable to refresh Firebase CLI access token: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function resolveFirebaseAccessToken() {
  const firebaseToolsConfig = readFirebaseToolsConfig();
  const tokens = firebaseToolsConfig?.tokens || {};
  const expiresAt = Number(tokens.expires_at || 0);
  const refreshToken = normalizeNonEmptyString(tokens.refresh_token);
  const currentAccessToken = normalizeNonEmptyString(tokens.access_token);

  if (currentAccessToken && expiresAt > Date.now() + 60_000) {
    return currentAccessToken;
  }

  if (!refreshToken) {
    throw new Error('Firebase CLI refresh token is missing.');
  }

  const refreshed = await refreshFirebaseAccessToken(refreshToken);
  return refreshed.access_token;
}

async function googleApiRequest(url, { accessToken, method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body,
  });

  if (response.ok) {
    return response;
  }

  const errorBody = await response.text().catch(() => '');
  throw new Error(`${method} ${url} failed: ${response.status} ${errorBody}`);
}

async function listListingDocuments({ accessToken, projectId, firestoreDbId, pageSize, pageToken }) {
  const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/listings`);
  url.searchParams.set('pageSize', String(pageSize));
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }

  for (const fieldPath of ['title', 'images', 'imageVariants', 'status', 'approvalStatus', 'paymentStatus']) {
    url.searchParams.append('mask.fieldPaths', fieldPath);
  }

  const response = await googleApiRequest(url, { accessToken });
  const payload = await response.json();
  return {
    documents: Array.isArray(payload.documents) ? payload.documents.map((doc) => decodeFirestoreDocument(doc)) : [],
    nextPageToken: normalizeNonEmptyString(payload.nextPageToken),
  };
}

function isPublicListing(listing) {
  return normalizeNonEmptyString(listing.status).toLowerCase() === 'active'
    && normalizeNonEmptyString(listing.approvalStatus).toLowerCase() === 'approved'
    && normalizeNonEmptyString(listing.paymentStatus).toLowerCase() === 'paid';
}

function collectCandidateImageUrls(listing, imageLimit) {
  return normalizeImageUrls(listing.images)
    .filter((imageUrl) => !isManagedListingImageUrl(listing.id, imageUrl))
    .slice(0, imageLimit);
}

function hasImageVariants(listing) {
  return Array.isArray(listing.imageVariants) && listing.imageVariants.length > 0;
}

async function storageObjectExists({ accessToken, bucket, objectName }) {
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Unable to check storage object ${objectName}: ${response.status} ${body}`);
  }

  return true;
}

async function uploadStorageObject({
  accessToken,
  bucket,
  objectName,
  imageBuffer,
  contentType,
  metadata,
}) {
  const boundary = `----TimberEquipMultipart${Date.now().toString(36)}${Math.random().toString(16).slice(2)}`;
  const metadataPart = Buffer.from(
    `${[
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify({
        name: objectName,
        metadata,
      }),
      `--${boundary}`,
      `Content-Type: ${contentType}`,
      '',
    ].join('\r\n')}\r\n`,
    'utf8',
  );
  const closingPart = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const body = Buffer.concat([metadataPart, imageBuffer, closingPart]);
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=multipart`;

  await googleApiRequest(uploadUrl, {
    accessToken,
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
}

async function queueListingSourceImages({
  accessToken,
  bucket,
  listing,
  imageLimit,
  maxBytes,
  writeMode,
}) {
  const imageUrls = collectCandidateImageUrls(listing, imageLimit);
  const result = {
    candidateImages: imageUrls.length,
    queued: 0,
    skipped: 0,
    errors: [],
  };

  for (let index = 0; index < imageUrls.length; index += 1) {
    const imageUrl = imageUrls[index];
    const objectName = buildDealerFeedSourceImagePath(listing.id, imageUrl, index);

    try {
      const exists = await storageObjectExists({ accessToken, bucket, objectName });
      if (exists) {
        result.skipped += 1;
        continue;
      }

      if (!writeMode) {
        result.queued += 1;
        continue;
      }

      const remoteResponse = await fetch(imageUrl, {
        headers: {
          Accept: 'image/avif,image/webp,image/*;q=0.9,*/*;q=0.5',
          'User-Agent': 'TimberEquipAvifBackfill/1.0',
        },
      });

      if (!remoteResponse.ok) {
        throw new Error(`remote image request failed with ${remoteResponse.status}`);
      }

      const contentType = normalizeNonEmptyString(String(remoteResponse.headers.get('content-type') || '').split(';')[0]).toLowerCase();
      if (!contentType.startsWith('image/')) {
        throw new Error(`remote asset is not an image (${contentType || 'unknown content type'})`);
      }

      const declaredBytes = Number(remoteResponse.headers.get('content-length') || 0);
      if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
        throw new Error(`remote image exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit`);
      }

      const imageBuffer = Buffer.from(await remoteResponse.arrayBuffer());
      if (!imageBuffer.byteLength) {
        throw new Error('remote image payload was empty');
      }
      if (imageBuffer.byteLength > maxBytes) {
        throw new Error(`remote image exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit`);
      }

      await uploadStorageObject({
        accessToken,
        bucket,
        objectName,
        imageBuffer,
        contentType,
        metadata: {
          uploadedBy: 'listing-avif-backfill',
          uploadedAt: new Date().toISOString(),
          listingId: listing.id,
          remoteImageUrl: imageUrl,
          sourceSystem: 'listing-avif-backfill',
          imageIndex: String(index),
        },
      });

      result.queued += 1;
    } catch (error) {
      result.errors.push({
        imageUrl,
        message: error instanceof Error ? error.message : String(error || 'unknown error'),
      });
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === true) {
    console.log('Usage: node scripts/backfill-listing-avif-source-images.cjs [--write] [--limit <n>] [--page-size <n>] [--image-limit <n>] [--all] [--ids <id1,id2>]');
    process.exit(0);
  }

  const writeMode = args.write === true;
  const pageSize = toPositiveInteger(args['page-size'], DEFAULT_PAGE_SIZE);
  const imageLimit = toPositiveInteger(args['image-limit'], DEFAULT_IMAGE_LIMIT);
  const limit = args.limit ? toPositiveInteger(args.limit, 0) : 0;
  const maxBytes = toPositiveInteger(args['max-bytes'], DEFAULT_MAX_BYTES);
  const projectId = normalizeNonEmptyString(process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || DEFAULT_FIREBASE_PROJECT_ID);
  const firestoreDbId = normalizeNonEmptyString(process.env.FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DB_ID);
  const bucket = normalizeNonEmptyString(process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET);
  const includeAllListings = args.all === true;
  const requestedIds = new Set(
    normalizeNonEmptyString(String(args.ids || ''))
      .split(',')
      .map((entry) => normalizeNonEmptyString(entry))
      .filter(Boolean),
  );

  const accessToken = await resolveFirebaseAccessToken();
  const summary = {
    mode: writeMode ? 'write' : 'dry-run',
    projectId,
    firestoreDbId,
    bucket,
    pageSize,
    imageLimit,
    scanned: 0,
    candidates: 0,
    queued: 0,
    skippedExisting: 0,
    errors: 0,
    processedListings: [],
  };

  let pageToken = '';

  while (true) {
    const page = await listListingDocuments({ accessToken, projectId, firestoreDbId, pageSize, pageToken });
    if (!page.documents.length) {
      break;
    }

    for (const listing of page.documents) {
      summary.scanned += 1;

      if (requestedIds.size > 0 && !requestedIds.has(listing.id)) {
        continue;
      }

      if (!includeAllListings && !isPublicListing(listing)) {
        continue;
      }

      if (hasImageVariants(listing)) {
        continue;
      }

      const candidateImageUrls = collectCandidateImageUrls(listing, imageLimit);
      if (candidateImageUrls.length === 0) {
        continue;
      }

      summary.candidates += 1;
      const result = await queueListingSourceImages({
        accessToken,
        bucket,
        listing,
        imageLimit,
        maxBytes,
        writeMode,
      });

      summary.queued += result.queued;
      summary.skippedExisting += result.skipped;
      summary.errors += result.errors.length;
      summary.processedListings.push({
        id: listing.id,
        title: normalizeNonEmptyString(listing.title, 'Untitled Listing'),
        candidateImages: result.candidateImages,
        queued: result.queued,
        skipped: result.skipped,
        errors: result.errors,
      });

      console.log(`${writeMode ? 'Queued' : 'Would queue'} ${result.queued} image(s) for ${listing.id} (${normalizeNonEmptyString(listing.title, 'Untitled Listing')})`);

      if (limit && summary.candidates >= limit) {
        pageToken = '';
        break;
      }
    }

    if (!page.nextPageToken || (limit && summary.candidates >= limit)) {
      break;
    }

    pageToken = page.nextPageToken;
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
