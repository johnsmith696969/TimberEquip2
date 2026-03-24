const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const { beforeUserCreated } = require('firebase-functions/v2/identity');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const sharp = require('sharp');
const nodemailer = require('nodemailer');
const Stripe = require('stripe');
const { randomUUID } = require('node:crypto');
const { templates } = require('./email-templates/index.js');
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

const RECAPTCHA_SITE_KEY = '6LdxzpIsAAAAADS0ws0EJT-ulSMBH5yO9uAWOqX0';
const RECAPTCHA_PROJECT_ID = 'mobile-app-equipment-sales';

if (!admin.apps.length) {
  admin.initializeApp();
}

const FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
function getDb() { return getFirestore(FIRESTORE_DB_ID); }

// ─────────────────────────────────────────────────────────────────────────────
// SMTP configuration via Firebase secrets.
// Set up with:
//   firebase functions:secrets:set SMTP_HOST
//   firebase functions:secrets:set SMTP_PORT
//   firebase functions:secrets:set SMTP_USER
//   firebase functions:secrets:set SMTP_PASS
//   firebase functions:secrets:set EMAIL_FROM
// ─────────────────────────────────────────────────────────────────────────────
const SMTP_HOST = defineSecret('SMTP_HOST');
const SMTP_PORT = defineSecret('SMTP_PORT');
const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');
const EMAIL_FROM = defineSecret('EMAIL_FROM');
const ADMIN_EMAILS = defineSecret('ADMIN_EMAILS');
const FRED_API_KEY = defineSecret('FRED_API_KEY');
const GOOGLE_TRANSLATE_API_KEY = defineSecret('GOOGLE_TRANSLATE_API_KEY');
const EXCHANGERATE_API_KEY = defineSecret('EXCHANGERATE_API_KEY');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port: parseInt(SMTP_PORT.value() || '587', 10),
    secure: SMTP_PORT.value() === '465',
    auth: {
      user: SMTP_USER.value(),
      pass: SMTP_PASS.value(),
    },
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();
  const from = EMAIL_FROM.value() || '"TimberEquip" <noreply@timberequip.com>';
  await transporter.sendMail({ from, to, subject, html });
  logger.info(`Email sent to ${to}: ${subject}`);
}

function parseEmailAddress(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] || value).trim().toLowerCase();
}

function getAdminRecipients() {
  const fromSecret = String(ADMIN_EMAILS.value() || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (fromSecret.length > 0) {
    return fromSecret;
  }

  const fallback = parseEmailAddress(EMAIL_FROM.value() || 'noreply@timberequip.com');
  return fallback ? [fallback] : ['noreply@timberequip.com'];
}

const APP_URL = 'https://timberequip.com';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isPrivilegedAdminEmail(email) {
  return normalize(email) === 'calebhappy@gmail.com';
}

function includesNormalized(haystack, needle) {
  return normalize(haystack).includes(normalize(needle));
}

function normalizeNonEmptyString(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeFiniteNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeImageUrls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter((entry) => /^https?:\/\//i.test(entry));
}

function normalizeDealerFeedListing(item, sellerUid, sourceName) {
  const externalId = normalizeNonEmptyString(item?.externalId);
  const make = normalizeNonEmptyString(item?.make || item?.manufacturer, 'Unknown');
  const model = normalizeNonEmptyString(item?.model, 'Unknown');
  const title = normalizeNonEmptyString(item?.title, `${make} ${model}`.trim());
  const category = normalizeNonEmptyString(item?.category, 'Uncategorized');

  const year = normalizeFiniteNumber(item?.year, new Date().getFullYear());
  const price = Math.max(0, normalizeFiniteNumber(item?.price, 0));
  const hours = Math.max(0, normalizeFiniteNumber(item?.hours, 0));
  const images = normalizeImageUrls(item?.images);

  return {
    sellerUid,
    sellerId: sellerUid,
    title,
    category,
    subcategory: normalizeNonEmptyString(item?.subcategory, category),
    make,
    manufacturer: make,
    model,
    year,
    price,
    currency: normalizeNonEmptyString(item?.currency, 'USD'),
    hours,
    condition: normalizeNonEmptyString(item?.condition, 'Used'),
    description: normalizeNonEmptyString(item?.description, `${title} imported from dealer feed.`),
    location: normalizeNonEmptyString(item?.location, 'Unknown'),
    images,
    specs: item?.specs && typeof item.specs === 'object' ? item.specs : {},
    featured: false,
    views: 0,
    leads: 0,
    status: 'pending',
    approvalStatus: 'pending',
    paymentStatus: 'pending',
    marketValueEstimate: null,
    sellerVerified: true,
    qualityValidated: true,
    externalSource: {
      sourceName,
      externalId,
      importedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function listingMatchesSavedSearch(listing, savedSearch) {
  const filters = savedSearch.filters || {};
  const listingText = [listing.title, listing.category, listing.subcategory, listing.make, listing.manufacturer, listing.model, listing.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const locationParts = String(listing.location || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const listingCountry = locationParts.length > 0 ? locationParts[locationParts.length - 1] : '';
  const listingState = locationParts.length > 1 ? locationParts[locationParts.length - 2] : '';

  if (filters.q && !listingText.includes(normalize(filters.q))) return false;
  if (filters.category && normalize(listing.category) !== normalize(filters.category)) return false;
  if (filters.subcategory && normalize(listing.subcategory) !== normalize(filters.subcategory)) return false;
  if (filters.manufacturer && ![listing.make, listing.manufacturer, listing.brand].some((value) => normalize(value) === normalize(filters.manufacturer))) return false;
  if (filters.model && !includesNormalized(listing.model, filters.model)) return false;
  if (filters.condition && normalize(listing.condition) !== normalize(filters.condition)) return false;
  if (filters.state && !includesNormalized(listingState, filters.state)) return false;
  if (filters.country && !includesNormalized(listingCountry, filters.country)) return false;

  const minPrice = Number(filters.minPrice || 0);
  const maxPrice = Number(filters.maxPrice || 0);
  const minYear = Number(filters.minYear || 0);
  const maxYear = Number(filters.maxYear || 0);
  const minHours = Number(filters.minHours || 0);
  const maxHours = Number(filters.maxHours || 0);

  if (minPrice && Number(listing.price || 0) < minPrice) return false;
  if (maxPrice && Number(listing.price || 0) > maxPrice) return false;
  if (minYear && Number(listing.year || 0) < minYear) return false;
  if (maxYear && Number(listing.year || 0) > maxYear) return false;
  if (minHours && Number(listing.hours || 0) < minHours) return false;
  if (maxHours && Number(listing.hours || 0) > maxHours) return false;

  return true;
}

async function notifyMatchingSavedSearches(listingId, listing) {
  const listingUrl = `${APP_URL}/listing/${listingId}`;
  const listingPrice = `${listing.currency || 'USD'} ${Number(listing.price || 0).toLocaleString()}`;
  const searchSnap = await getDb().collection('savedSearches').where('status', '==', 'active').get();

  if (searchSnap.empty) return;

  await Promise.all(
    searchSnap.docs.map(async (searchDoc) => {
      const savedSearch = searchDoc.data();
      if (!savedSearch.alertPreferences?.newListingAlerts) return;
      if (!listingMatchesSavedSearch(listing, savedSearch)) return;

      const recipient = savedSearch.alertEmail;
      if (!recipient) return;

      let displayName = 'there';
      if (savedSearch.userUid) {
        const userSnap = await getDb().collection('users').doc(savedSearch.userUid).get();
        if (userSnap.exists) {
          displayName = userSnap.data().displayName || displayName;
        }
      }

      const emailPayload = templates.newMatchingListing({
        displayName,
        searchName: savedSearch.name || 'Saved Search',
        listingTitle: listing.title || 'New Equipment Listing',
        listingUrl,
        listingPrice,
        location: listing.location || 'Unknown',
      });

      await sendEmail({ to: recipient, ...emailPayload });
    })
  );
}

const THUMB_MAX_BYTES = 50 * 1024;
const DETAIL_MAX_BYTES = 100 * 1024;
const THUMB_MAX_WIDTH = 480;
const DETAIL_MAX_WIDTH = 1600;

const AVIF_QUALITIES = [55, 50, 45, 40, 35, 30, 25];

function buildFirebaseDownloadUrl(bucket, path, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

async function compressToAvifTarget(inputBuffer, width, targetBytes) {
  const widthSteps = [width, Math.round(width * 0.85), Math.round(width * 0.72), Math.round(width * 0.6), Math.round(width * 0.5), Math.round(width * 0.4)]
    .filter((candidate, index, array) => candidate > 0 && array.indexOf(candidate) === index);
  let best = null;

  for (const targetWidth of widthSteps) {
    for (const quality of AVIF_QUALITIES) {
      const output = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: targetWidth,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .avif({ quality })
        .toBuffer();

      best = output;
      if (output.byteLength <= targetBytes) {
        return output;
      }
    }
  }

  throw new Error(`Unable to compress source image under ${Math.round(targetBytes / 1024)}KB AVIF target.`);
}

exports.generateListingImageVariants = onObjectFinalized(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 120,
  },
  async (event) => {
    const object = event.data;
    const bucketName = object.bucket;
    const filePath = object.name || '';
    const contentType = object.contentType || '';

    if (!bucketName || !filePath) {
      logger.warn('Missing storage event data.');
      return;
    }

    // Process only source images to avoid loops.
    // Expected path: listings/{listingId}/images/source/{filename}
    const sourceMatch = filePath.match(/^listings\/([^/]+)\/images\/source\/(.+)$/);
    if (!sourceMatch) return;

    if (!contentType.startsWith('image/')) {
      logger.info(`Skipping non-image file: ${filePath}`);
      return;
    }

    const listingId = sourceMatch[1];
    const originalName = sourceMatch[2];
    const outputBaseName = originalName.replace(/\.[^/.]+$/, '');

    const detailPath = `listings/${listingId}/images/detail/${outputBaseName}.avif`;
    const thumbPath = `listings/${listingId}/images/thumb/${outputBaseName}.avif`;

    const bucket = admin.storage().bucket(bucketName);
    const sourceFile = bucket.file(filePath);

    logger.info(`Generating variants for ${filePath}`);

    const [sourceBuffer] = await sourceFile.download();

    const [detailBuffer, thumbBuffer] = await Promise.all([
      compressToAvifTarget(sourceBuffer, DETAIL_MAX_WIDTH, DETAIL_MAX_BYTES),
      compressToAvifTarget(sourceBuffer, THUMB_MAX_WIDTH, THUMB_MAX_BYTES),
    ]);

    const detailToken = randomUUID();
    const thumbToken = randomUUID();

    await Promise.all([
      bucket.file(detailPath).save(detailBuffer, {
        metadata: {
          contentType: 'image/avif',
          metadata: {
            firebaseStorageDownloadTokens: detailToken,
            variant: 'detail',
            listingId,
            sourcePath: filePath,
          },
        },
      }),
      bucket.file(thumbPath).save(thumbBuffer, {
        metadata: {
          contentType: 'image/avif',
          metadata: {
            firebaseStorageDownloadTokens: thumbToken,
            variant: 'thumbnail',
            listingId,
            sourcePath: filePath,
          },
        },
      }),
    ]);

    const detailUrl = buildFirebaseDownloadUrl(bucketName, detailPath, detailToken);
    const thumbnailUrl = buildFirebaseDownloadUrl(bucketName, thumbPath, thumbToken);

    const listingRef = getDb().collection('listings').doc(listingId);
    await listingRef.set(
      {
        images: admin.firestore.FieldValue.arrayUnion(detailUrl),
        imageVariants: admin.firestore.FieldValue.arrayUnion({
          detailUrl,
          thumbnailUrl,
          format: 'image/avif',
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info(`Finished variants for listing ${listingId}`);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TRIGGER: New inquiry → notify seller + confirm to buyer
// Firestore path: inquiries/{inquiryId}
// ─────────────────────────────────────────────────────────────────────────────
exports.onInquiryCreated = onDocumentCreated(
  {
    document: 'inquiries/{inquiryId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const inquiry = event.data?.data();
    if (!inquiry) return;

    const { sellerUid, sellerId, listingId, message, buyerName, buyerEmail, buyerPhone } = inquiry;
    const sellerDocId = sellerUid || sellerId || '';

    // Look up listing and seller in parallel
    const [listingSnap, sellerSnap] = await Promise.all([
      getDb().collection('listings').doc(listingId).get(),
      sellerDocId ? getDb().collection('users').doc(sellerDocId).get() : Promise.resolve(null),
    ]);

    if (!listingSnap.exists || !sellerSnap?.exists) {
      logger.warn(`onInquiryCreated: listing or seller not found for inquiry ${event.params.inquiryId}; proceeding with fallback email payload.`);
    }

    const listing = listingSnap.exists ? listingSnap.data() : {};
    const seller = sellerSnap?.exists ? sellerSnap.data() : {};
    const listingTitle = listing.title || 'Equipment Listing';
    const sellerName = seller.displayName || 'Seller';
    const sellerEmail = seller.email;
    const listingUrl = `${APP_URL}/listing/${listingId}`;

    const errors = [];

    // Notify seller
    if (sellerEmail) {
      try {
        const { subject, html } = templates.leadNotification({
          sellerName,
          buyerName: buyerName || 'A buyer',
          buyerEmail: buyerEmail || '',
          buyerPhone: buyerPhone || '',
          listingTitle,
          listingUrl,
          message: message || '',
        });
        await sendEmail({ to: sellerEmail, subject, html });
      } catch (err) {
        errors.push(`seller email failed: ${err.message}`);
        logger.error('Failed to send lead notification to seller', err);
      }
    }

    // Confirm to buyer
    if (buyerEmail) {
      try {
        const { subject, html } = templates.inquiryConfirmation({
          buyerName: buyerName || 'Buyer',
          listingTitle,
          listingUrl,
          sellerName,
        });
        await sendEmail({ to: buyerEmail, subject, html });
      } catch (err) {
        errors.push(`buyer confirmation failed: ${err.message}`);
        logger.error('Failed to send inquiry confirmation to buyer', err);
      }
    }

    // Copy admin inbox on all inquiry leads (inquiry, financing, shipping, etc.)
    try {
      const adminPayload = templates.adminInquiryAlert({
        inquiryType: inquiry.type || 'Inquiry',
        buyerName: buyerName || '',
        buyerEmail: buyerEmail || '',
        buyerPhone: buyerPhone || '',
        listingTitle,
        listingUrl,
        message: message || '',
        sellerUid: sellerDocId || '',
      });
      await sendEmail({ to: getAdminRecipients(), ...adminPayload });
    } catch (err) {
      errors.push(`admin inquiry copy failed: ${err.message}`);
      logger.error('Failed to send inquiry admin copy', err);
    }

    if (errors.length) {
      logger.warn(`onInquiryCreated partial failure: ${errors.join(', ')}`);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TRIGGER: New user → send welcome + email verification
// Auth trigger via Firestore user profile creation
// Firestore path: users/{uid}
// ─────────────────────────────────────────────────────────────────────────────
exports.onUserProfileCreated = onDocumentCreated(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM],
  },
  async (event) => {
    const profile = event.data?.data();
    if (!profile?.email) return;

    // Generate an email verification link via Admin SDK
    let verificationLink = `${APP_URL}/login`;
    try {
      verificationLink = await admin.auth().generateEmailVerificationLink(profile.email, {
        url: `${APP_URL}/login`,
      });
    } catch (err) {
      logger.warn(`Could not generate verification link for ${profile.email}: ${err.message}`);
    }

    try {
      const { subject, html } = templates.welcomeVerification({
        displayName: profile.displayName || 'there',
        verificationLink,
      });
      await sendEmail({ to: profile.email, subject, html });
    } catch (err) {
      logger.error('Failed to send welcome email', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TRIGGER: Listing status change → notify seller on approval or rejection
// Firestore path: listings/{listingId}
// ─────────────────────────────────────────────────────────────────────────────
exports.onListingStatusChanged = onDocumentUpdated(
  {
    document: 'listings/{listingId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM],
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const prevApproval = before.approvalStatus;
    const newApproval = after.approvalStatus;

    if (prevApproval === newApproval) return;
    if (newApproval !== 'approved' && newApproval !== 'rejected') return;

    const sellerUid = after.sellerUid || after.sellerId;
    if (!sellerUid) return;

    const sellerSnap = await getDb().collection('users').doc(sellerUid).get();
    if (!sellerSnap.exists) return;

    const seller = sellerSnap.data();
    const sellerEmail = seller.email;
    if (!sellerEmail) return;

    const listingTitle = after.title || 'Your Listing';
    const listingUrl = `${APP_URL}/listing/${event.params.listingId}`;

    try {
      let emailPayload;
      if (newApproval === 'approved') {
        emailPayload = templates.listingApproved({ sellerName: seller.displayName || 'Seller', listingTitle, listingUrl });
        await notifyMatchingSavedSearches(event.params.listingId, after);
      } else {
        const editUrl = `${APP_URL}/sell?edit=${event.params.listingId}`;
        emailPayload = templates.listingRejected({
          sellerName: seller.displayName || 'Seller',
          listingTitle,
          reason: after.rejectionReason || '',
          editUrl,
        });
      }
      await sendEmail({ to: sellerEmail, ...emailPayload });
    } catch (err) {
      logger.error('Failed to send listing status email', err);
    }
  }
);

exports.onListingCreated = onDocumentCreated(
  {
    document: 'listings/{listingId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM],
  },
  async (event) => {
    const listing = event.data?.data();
    if (!listing) return;
    if (listing.approvalStatus !== 'approved') return;
    await notifyMatchingSavedSearches(event.params.listingId, listing);
  }
);

exports.onMediaKitRequestCreated = onDocumentCreated(
  {
    document: 'mediaKitRequests/{requestId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const request = event.data?.data();
    if (!request) return;

    const payload = templates.mediaKitRequest({
      requesterName: request.firstName || '',
      companyName: request.companyName || '',
      email: request.email || '',
      phone: request.phone || '',
      notes: request.notes || '',
    });

    await sendEmail({ to: getAdminRecipients(), ...payload });
  }
);

exports.onFinancingRequestCreated = onDocumentCreated(
  {
    document: 'financingRequests/{requestId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const request = event.data?.data();
    if (!request) return;

    const payload = templates.financingRequestAdmin({
      applicantName: request.applicantName || '',
      applicantEmail: request.applicantEmail || '',
      applicantPhone: request.applicantPhone || '',
      company: request.company || '',
      requestedAmount: request.requestedAmount || null,
      listingId: request.listingId || '',
      message: request.message || '',
    });

    await sendEmail({ to: getAdminRecipients(), ...payload });
  }
);

exports.onContactRequestCreated = onDocumentCreated(
  {
    document: 'contactRequests/{requestId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const request = event.data?.data();
    if (!request) return;

    const payload = templates.contactRequestAdmin({
      name: request.name || '',
      email: request.email || '',
      category: request.category || '',
      message: request.message || '',
      source: request.source || 'contact-page',
    });

    await sendEmail({ to: getAdminRecipients(), ...payload });
  }
);

exports.onSubscriptionCreated = onDocumentCreated(
  {
    document: 'subscriptions/{subscriptionId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM],
  },
  async (event) => {
    const subscription = event.data?.data();
    if (!subscription?.userUid) return;

    const userSnap = await getDb().collection('users').doc(subscription.userUid).get();
    if (!userSnap.exists) return;

    const user = userSnap.data();
    if (!user.email) return;

    const payload = templates.subscriptionCreated({
      displayName: user.displayName || 'there',
      planName: subscription.planId || 'subscription',
    });

    await sendEmail({ to: user.email, ...payload });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED: Daily check for subscriptions expiring in exactly 7 days
// ─────────────────────────────────────────────────────────────────────────────
exports.subscriptionExpiryReminder = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM],
  },
  async (_context) => {
    const now = admin.firestore.Timestamp.now();
    const in7Days = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    const in8Days = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
    );

    // Find subscriptions expiring in the next 7–8 day window (catches daily runs)
    const snap = await admin
      .firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '>=', in7Days)
      .where('currentPeriodEnd', '<', in8Days)
      .get();

    if (snap.empty) {
      logger.info('subscriptionExpiryReminder: no subscriptions expiring in 7 days');
      return;
    }

    const renewUrl = `${APP_URL}/profile#subscription`;
    const errors = [];

    await Promise.all(
      snap.docs.map(async (subDoc) => {
        const sub = subDoc.data();
        const userSnap = await getDb().collection('users').doc(sub.userUid).get();
        if (!userSnap.exists) return;

        const user = userSnap.data();
        if (!user.email) return;

        const expiryDate = sub.currentPeriodEnd
          .toDate()
          .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        try {
          const { subject, html } = templates.subscriptionExpiring({
            displayName: user.displayName || 'Seller',
            planName: sub.planId || 'Pro',
            expiryDate,
            renewUrl,
          });
          await sendEmail({ to: user.email, subject, html });
        } catch (err) {
          errors.push(err.message);
          logger.error(`Failed to send expiry reminder to ${user.email}`, err);
        }
      })
    );

    logger.info(`subscriptionExpiryReminder: processed ${snap.size} subs. Errors: ${errors.length}`);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED: Daily check for subscriptions that expired today
// ─────────────────────────────────────────────────────────────────────────────
exports.subscriptionExpiredNotice = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM],
  },
  async (_context) => {
    const now = admin.firestore.Timestamp.now();
    const yesterday = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const snap = await admin
      .firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '>=', yesterday)
      .where('currentPeriodEnd', '<', now)
      .get();

    if (snap.empty) return;

    const renewUrl = `${APP_URL}/profile#subscription`;

    await Promise.all(
      snap.docs.map(async (subDoc) => {
        const sub = subDoc.data();

        // Mark subscription as expired
        await subDoc.ref.update({ status: 'past_due' });

        const userSnap = await getDb().collection('users').doc(sub.userUid).get();
        if (!userSnap.exists) return;

        const user = userSnap.data();
        if (!user.email) return;

        try {
          const { subject, html } = templates.subscriptionExpired({
            displayName: user.displayName || 'Seller',
            planName: sub.planId || 'Pro',
            renewUrl,
          });
          await sendEmail({ to: user.email, subject, html });
        } catch (err) {
          logger.error(`Failed to send expired notice to ${user.email}`, err);
        }
      })
    );

    logger.info(`subscriptionExpiredNotice: processed ${snap.size} expired subs`);
  }
);

exports.expireListingsByDate = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
  },
  async () => {
    const now = admin.firestore.Timestamp.now();

    const snap = await getDb()
      .collection('listings')
      .where('approvalStatus', '==', 'approved')
      .where('paymentStatus', '==', 'paid')
      .where('status', '==', 'active')
      .where('expiresAt', '<=', now)
      .get();

    if (snap.empty) {
      logger.info('expireListingsByDate: no listings to expire');
      return;
    }

    const batch = getDb().batch();
    snap.docs.forEach((docSnap) => {
      batch.set(
        docSnap.ref,
        {
          status: 'pending',
          paymentStatus: 'pending',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
    logger.info(`expireListingsByDate: expired ${snap.size} listings`);
  }
);

const marketRatesCache = {
  value: null,
  fetchedAt: 0,
};

const currencyRatesCache = new Map();
const CURRENCY_RATES_TTL_MS = 60 * 60 * 1000;

async function getCurrencyRatesPayload(baseCurrency) {
  const base = String(baseCurrency || 'USD').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(base)) {
    throw new Error('Invalid base currency code');
  }

  const now = Date.now();
  const cached = currencyRatesCache.get(base);
  if (cached && now - cached.fetchedAt < CURRENCY_RATES_TTL_MS) {
    return cached.payload;
  }

  const apiKey = EXCHANGERATE_API_KEY.value();
  if (!apiKey) {
    throw new Error('Currency API key not configured');
  }

  // Primary endpoint for exchangerate-api.com paid/free v6 plans.
  const v6Url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
  let response = await fetch(v6Url, { headers: { Accept: 'application/json' } });

  if (response.ok) {
    const json = await response.json();
    if (json?.result === 'success' && json?.conversion_rates && typeof json.conversion_rates === 'object') {
      const payload = {
        base,
        asOf: json?.time_last_update_utc || new Date().toISOString(),
        source: 'exchangerate-api',
        rates: json.conversion_rates,
      };
      currencyRatesCache.set(base, { payload, fetchedAt: now });
      return payload;
    }
  }

  // Fallback endpoint shape used by some exchangerate-api deployments.
  const fallbackUrl = `https://api.exchangerate-api.com/v4/latest/${base}?apikey=${apiKey}`;
  response = await fetch(fallbackUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Currency API request failed with ${response.status}`);
  }

  const fallbackJson = await response.json();
  if (!fallbackJson?.rates || typeof fallbackJson.rates !== 'object') {
    throw new Error('Currency API payload missing rates');
  }

  const payload = {
    base,
    asOf: fallbackJson?.date || new Date().toISOString(),
    source: 'exchangerate-api',
    rates: fallbackJson.rates,
  };

  currencyRatesCache.set(base, { payload, fetchedAt: now });
  return payload;
}

async function fredLatest(seriesId) {
  const key = FRED_API_KEY.value();
  if (!key) return null;

  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', key);
  url.searchParams.set('limit', '1');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('file_type', 'json');

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const json = await response.json();
  const obs = json?.observations?.[0];
  if (!obs || obs.value === '.') return null;
  const value = parseFloat(obs.value);
  if (!Number.isFinite(value)) return null;
  return { value, date: obs.date };
}

async function fetchSofr() {
  const response = await fetch('https://www.newyorkfed.org/api/rss/seriesRate.rss?serieskeyids=SOFR');
  if (!response.ok) return null;
  const text = await response.text();
  const valueMatch = text.match(/<fr:value>([\d.]+)<\/fr:value>/);
  const dateMatch = text.match(/<pubDate>([^<]+)<\/pubDate>/);
  if (!valueMatch) return null;
  const value = parseFloat(valueMatch[1]);
  if (!Number.isFinite(value)) return null;
  const date = dateMatch ? new Date(dateMatch[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  return { value, date };
}

async function fetchTreasuryRates() {
  const today = new Date();
  const yyyymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${yyyymm}`;
  const response = await fetch(url, { headers: { Accept: 'application/xml, text/xml' } });
  if (!response.ok) return null;
  const text = await response.text();
  const entries = text.split('<entry>');
  const last = entries[entries.length - 1] || '';

  const extract = (tag) => {
    const match = last.match(new RegExp(`<d:${tag}[^>]*>([\\d.]+)<`));
    return match ? parseFloat(match[1]) : undefined;
  };

  const dateMatch = last.match(/<d:NEW_DATE[^>]*>([\d-]+)/);
  return {
    bc5: extract('BC_5YEAR'),
    bc10: extract('BC_10YEAR'),
    date: dateMatch ? dateMatch[1].split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

async function getMarketRatesPayload() {
  const now = Date.now();
  if (marketRatesCache.value && now - marketRatesCache.fetchedAt < 4 * 60 * 60 * 1000) {
    return marketRatesCache.value;
  }

  const fallback = {
    primeRate: { value: 7.5, asOf: '2026-01-15', source: 'fallback' },
    sofr: { value: 4.33, asOf: '2026-01-15', source: 'fallback' },
    treasury5y: { value: 4.2, asOf: '2026-01-15', source: 'fallback' },
    treasury10y: { value: 4.5, asOf: '2026-01-15', source: 'fallback' },
    equipmentLendingEst: { value: 9.0, asOf: '2026-01-15', source: 'fallback' },
  };

  try {
    const [prime, dgs5, dgs10, sofr, treasury] = await Promise.all([
      fredLatest('DPRIME').catch(() => null),
      fredLatest('DGS5').catch(() => null),
      fredLatest('DGS10').catch(() => null),
      fetchSofr().catch(() => null),
      fetchTreasuryRates().catch(() => null),
    ]);

    const primeValue = prime?.value ?? fallback.primeRate.value;
    const payload = {
      primeRate: {
        value: primeValue,
        asOf: prime?.date ?? fallback.primeRate.asOf,
        source: prime ? 'fred' : 'fallback',
      },
      sofr: {
        value: sofr?.value ?? fallback.sofr.value,
        asOf: sofr?.date ?? fallback.sofr.asOf,
        source: sofr ? 'nyfed' : 'fallback',
      },
      treasury5y: {
        value: dgs5?.value ?? treasury?.bc5 ?? fallback.treasury5y.value,
        asOf: dgs5?.date ?? treasury?.date ?? fallback.treasury5y.asOf,
        source: dgs5 ? 'fred' : treasury?.bc5 ? 'treasury' : 'fallback',
      },
      treasury10y: {
        value: dgs10?.value ?? treasury?.bc10 ?? fallback.treasury10y.value,
        asOf: dgs10?.date ?? treasury?.date ?? fallback.treasury10y.asOf,
        source: dgs10 ? 'fred' : treasury?.bc10 ? 'treasury' : 'fallback',
      },
      equipmentLendingEst: {
        value: Number((primeValue + 1.5).toFixed(2)),
        asOf: new Date().toISOString().split('T')[0],
        source: prime ? 'fred' : 'fallback',
      },
    };

    marketRatesCache.value = payload;
    marketRatesCache.fetchedAt = now;
    return payload;
  } catch (error) {
    logger.error('Market rates API failed', error);
    return fallback;
  }
}

let marketplaceStatsCache = null;
const MARKETPLACE_STATS_TTL_MS = 10 * 60 * 1000;

function parseCreatedAt(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6));
  }
  return null;
}

function getCountryFromLocation(location) {
  if (typeof location !== 'string') return null;
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

async function getMarketplaceStatsPayload() {
  const now = Date.now();
  if (marketplaceStatsCache && now - marketplaceStatsCache.fetchedAt < MARKETPLACE_STATS_TTL_MS) {
    return marketplaceStatsCache.value;
  }

  const [listingsSnap, inquiriesSnap] = await Promise.all([
    getDb().collection('listings').where('approvalStatus', '==', 'approved').get(),
    getDb().collection('inquiries').get(),
  ]);

  let priceSum = 0;
  let pricedListingCount = 0;
  let totalViews = 0;
  let totalLeads = 0;
  const countries = new Set();

  listingsSnap.docs.forEach((doc) => {
    const data = doc.data() || {};
    const status = String(data.status || 'active').toLowerCase();
    if (status === 'sold') return;

    const price = typeof data.price === 'number' ? data.price : Number(data.price || 0);
    if (Number.isFinite(price) && price > 0) {
      priceSum += price;
      pricedListingCount += 1;
    }

    const views = typeof data.views === 'number' ? data.views : Number(data.views || 0);
    const leads = typeof data.leads === 'number' ? data.leads : Number(data.leads || 0);
    if (Number.isFinite(views) && views > 0) totalViews += views;
    if (Number.isFinite(leads) && leads > 0) totalLeads += leads;

    const country = getCountryFromLocation(data.location);
    if (country) countries.add(country);
  });

  const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const activeBuyerKeys = new Set();

  inquiriesSnap.docs.forEach((doc) => {
    const data = doc.data() || {};
    const createdAt = parseCreatedAt(data.createdAt);
    if (!createdAt || createdAt < cutoff) return;

    const buyerKey = data.buyerUid || (data.buyerEmail ? String(data.buyerEmail).toLowerCase() : null) || data.buyerPhone || null;
    if (buyerKey) activeBuyerKeys.add(String(buyerKey));
  });

  const payload = {
    monthlyActiveBuyers: activeBuyerKeys.size,
    avgEquipmentValue: pricedListingCount > 0 ? Math.round(priceSum / pricedListingCount) : 0,
    globalReachCountries: countries.size,
    conversionRate: totalViews > 0 ? Number(((totalLeads / totalViews) * 100).toFixed(1)) : 0,
    asOf: new Date(now).toISOString(),
  };

  marketplaceStatsCache = { value: payload, fetchedAt: now };
  return payload;
}

async function assessRecaptchaToken(token, action) {
  const client = new RecaptchaEnterpriseServiceClient();
  const projectPath = client.projectPath(RECAPTCHA_PROJECT_ID);
  const request = {
    assessment: {
      event: { token, siteKey: RECAPTCHA_SITE_KEY },
    },
    parent: projectPath,
  };
  const [response] = await client.createAssessment(request);
  if (!response.tokenProperties.valid) {
    logger.warn('reCAPTCHA token invalid:', response.tokenProperties.invalidReason);
    return { valid: false, score: 0 };
  }
  if (response.tokenProperties.action !== action) {
    logger.warn('reCAPTCHA action mismatch', { expected: action, got: response.tokenProperties.action });
    return { valid: false, score: 0 };
  }
  return { valid: true, score: response.riskAnalysis.score };
}

const LISTING_CHECKOUT_PLANS = {
  individual_seller: {
    id: 'individual_seller',
    name: 'Individual Seller Plan',
    amountUsd: 20,
    listingCap: 1,
    productId: 'prod_UBpeOgS2Xbot2e',
  },
  dealer: {
    id: 'dealer',
    name: 'Dealer Plan',
    amountUsd: 250,
    listingCap: 50,
    productId: 'prod_UBpeHg3FydOSdD',
  },
  fleet_dealer: {
    id: 'fleet_dealer',
    name: 'Fleet Dealer Plan',
    amountUsd: 500,
    listingCap: 150,
    productId: 'prod_UBpek9mEeZPlyC',
  },
};

const DEALER_MANAGED_ACCOUNT_LIMIT = 3;
const MANAGED_ACCOUNT_PLAN_IDS = ['dealer', 'fleet_dealer'];

function getListingCheckoutPlan(rawPlanId) {
  const planId = String(rawPlanId || '').trim();
  if (!planId || !Object.prototype.hasOwnProperty.call(LISTING_CHECKOUT_PLANS, planId)) {
    return null;
  }
  return LISTING_CHECKOUT_PLANS[planId];
}

async function getManagedAccountSeatContext(ownerUid) {
  const normalizedOwnerUid = String(ownerUid || '').trim();
  if (!normalizedOwnerUid) {
    return {
      ownerUid: '',
      seatLimit: 0,
      seatCount: 0,
      activePlanIds: [],
    };
  }

  const [subscriptionsSnap, managedAccountsSnap] = await Promise.all([
    getDb()
      .collection('subscriptions')
      .where('userUid', '==', normalizedOwnerUid)
      .where('status', '==', 'active')
      .get(),
    getDb()
      .collection('users')
      .where('parentAccountUid', '==', normalizedOwnerUid)
      .get(),
  ]);

  const activePlanIds = Array.from(
    new Set(
      subscriptionsSnap.docs
        .map((doc) => String(doc.data()?.planId || '').trim())
        .filter((planId) => MANAGED_ACCOUNT_PLAN_IDS.includes(planId))
    )
  );

  const seatCount = managedAccountsSnap.docs.filter((doc) => {
    const status = String(doc.data()?.accountStatus || 'active').trim().toLowerCase();
    return status !== 'suspended';
  }).length;

  return {
    ownerUid: normalizedOwnerUid,
    seatLimit: activePlanIds.length > 0 ? DEALER_MANAGED_ACCOUNT_LIMIT : 0,
    seatCount,
    activePlanIds,
  };
}

function createStripeClient() {
  const secret = STRIPE_SECRET_KEY.value();
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: '2026-02-25.clover' });
}

function getRequestBaseUrl(req) {
  const forwardedProtoRaw = req.headers['x-forwarded-proto'];
  const forwardedProto = Array.isArray(forwardedProtoRaw) ? forwardedProtoRaw[0] : forwardedProtoRaw;
  const proto = String(forwardedProto || '').split(',')[0].trim() || 'https';

  const forwardedHostRaw = req.headers['x-forwarded-host'];
  const forwardedHost = Array.isArray(forwardedHostRaw) ? forwardedHostRaw[0] : forwardedHostRaw;
  const host = String(forwardedHost || req.get('host') || '').split(',')[0].trim();

  if (host) {
    return `${proto}://${host}`;
  }
  return APP_URL;
}

async function getDecodedUserFromBearer(req) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return null;
  return admin.auth().verifyIdToken(idToken);
}

async function resolveStripePriceIdForPlan(stripe, plan) {
  const product = await stripe.products.retrieve(plan.productId, {
    expand: ['default_price'],
  });

  let priceId = '';
  if (typeof product.default_price === 'string') {
    priceId = product.default_price;
  } else if (product.default_price?.id) {
    priceId = product.default_price.id;
  }

  if (!priceId) {
    const prices = await stripe.prices.list({
      product: plan.productId,
      active: true,
      limit: 20,
    });
    const preferred = prices.data.find((p) => p.type === 'recurring' && p.recurring?.interval === 'month') || prices.data[0];
    if (!preferred?.id) {
      throw new Error(`No active Stripe price found for product ${plan.productId}.`);
    }
    priceId = preferred.id;
  }

  return priceId;
}

async function getOrCreateStripeCustomer(stripe, userUid, email, name) {
  const userRef = getDb().collection('users').doc(userUid);
  const userSnap = await userRef.get();
  const existingCustomerId = String(userSnap.data()?.stripeCustomerId || '');

  if (existingCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(existingCustomerId);
      if (existingCustomer && !existingCustomer.deleted) {
        return existingCustomerId;
      }
    } catch {
      // If Stripe customer cannot be retrieved, a new one will be created.
    }
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userUid },
  });

  await userRef.set(
    {
      stripeCustomerId: customer.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return customer.id;
}

async function finalizeListingPaymentFromCheckoutSession(session, source) {
  const listingId = String(session.metadata?.listingId || '');
  const planId = String(session.metadata?.planId || '');
  const userUid = String(session.metadata?.userUid || '');
  const paid = session.payment_status === 'paid';

  if (!listingId || !planId || !userUid || !paid) {
    return { paid: false, listingId: listingId || null, planId: planId || null };
  }

  const plan = getListingCheckoutPlan(planId);
  const amountUsd = typeof session.amount_total === 'number' ? session.amount_total / 100 : plan?.amountUsd || 0;
  const fallbackPeriodEndDate = new Date();
  fallbackPeriodEndDate.setMonth(fallbackPeriodEndDate.getMonth() + 1);
  let listingExpiresAt = admin.firestore.Timestamp.fromDate(fallbackPeriodEndDate);

  await getDb().collection('invoices').doc(session.id).set(
    {
      userUid,
      listingId,
      stripeInvoiceId: session.invoice || null,
      stripeCheckoutSessionId: session.id,
      amount: amountUsd,
      currency: session.currency || 'usd',
      status: 'paid',
      items: [`${plan?.name || planId} monthly listing plan`],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      source,
    },
    { merge: true }
  );

  const subscriptionObject = typeof session.subscription === 'object' && session.subscription ? session.subscription : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;
  if (subscriptionId) {
    const periodEnd = subscriptionObject?.current_period_end;
    const currentPeriodEnd = typeof periodEnd === 'number'
      ? admin.firestore.Timestamp.fromMillis(periodEnd * 1000)
      : null;

    if (currentPeriodEnd) {
      listingExpiresAt = currentPeriodEnd;
    }

    await getDb().collection('subscriptions').doc(subscriptionId).set(
      {
        userUid,
        listingId,
        planId,
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await getDb().collection('listings').doc(listingId).set(
    {
      paymentStatus: 'paid',
      subscriptionPlanId: planId,
      subscriptionAmount: amountUsd,
      listingCap: plan?.listingCap || null,
      status: 'active',
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: listingExpiresAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await getDb().collection('billingAuditLogs').add({
    action: 'CHECKOUT_SESSION_PAID',
    userUid,
    listingId,
    details: `Checkout ${session.id} marked listing ${listingId} paid via ${source}.`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { paid: true, listingId, planId };
}

function normalizeStripeSubscriptionStatus(rawStatus) {
  const status = String(rawStatus || '').toLowerCase();
  if (status === 'active' || status === 'trialing' || status === 'canceled' || status === 'past_due') {
    return status;
  }
  if (status === 'unpaid' || status === 'incomplete' || status === 'incomplete_expired') {
    return 'past_due';
  }
  return 'past_due';
}

function stripeUnixToTimestamp(rawUnixSeconds) {
  if (typeof rawUnixSeconds !== 'number' || !Number.isFinite(rawUnixSeconds) || rawUnixSeconds <= 0) {
    return null;
  }
  return admin.firestore.Timestamp.fromMillis(Math.floor(rawUnixSeconds) * 1000);
}

async function resolveUserUidFromStripeCustomerId(stripeCustomerId) {
  const normalizedCustomerId = String(stripeCustomerId || '').trim();
  if (!normalizedCustomerId) return '';

  const usersSnap = await getDb()
    .collection('users')
    .where('stripeCustomerId', '==', normalizedCustomerId)
    .limit(1)
    .get();

  if (usersSnap.empty) return '';
  return usersSnap.docs[0].id;
}

async function syncSubscriptionStateFromStripeObject(rawSubscription, source) {
  const stripeSubscriptionId = String(rawSubscription?.id || '').trim();
  if (!stripeSubscriptionId) return;

  const metadata = rawSubscription?.metadata || {};
  const subscriptionStatus = normalizeStripeSubscriptionStatus(rawSubscription?.status);
  const cancelAtPeriodEnd = Boolean(rawSubscription?.cancel_at_period_end);
  const currentPeriodEnd = stripeUnixToTimestamp(rawSubscription?.current_period_end);
  const nowUnix = Math.floor(Date.now() / 1000);
  const rawPeriodEndUnix = typeof rawSubscription?.current_period_end === 'number' ? rawSubscription.current_period_end : 0;
  const hasRemainingPeriod = rawPeriodEndUnix > nowUnix;

  let userUid = String(metadata.userUid || '').trim();
  if (!userUid) {
    userUid = await resolveUserUidFromStripeCustomerId(rawSubscription?.customer);
  }

  const listingId = String(metadata.listingId || '').trim();
  const planId = String(metadata.planId || '').trim();

  await getDb().collection('subscriptions').doc(stripeSubscriptionId).set(
    {
      userUid: userUid || null,
      listingId: listingId || null,
      planId: planId || null,
      stripeSubscriptionId,
      status: subscriptionStatus,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source,
    },
    { merge: true }
  );

  const shouldRetainListingAccess =
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing' ||
    ((subscriptionStatus === 'past_due' || cancelAtPeriodEnd) && hasRemainingPeriod);

  if (listingId) {
    const listingRef = getDb().collection('listings').doc(listingId);
    const listingSnap = await listingRef.get();
    if (listingSnap.exists) {
      const listingData = listingSnap.data() || {};
      const listingStatus = String(listingData.status || '').toLowerCase();
      const listingUpdate = {
        subscriptionPlanId: planId || null,
        paymentStatus: shouldRetainListingAccess ? 'paid' : 'pending',
        expiresAt: currentPeriodEnd || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (listingStatus !== 'sold') {
        listingUpdate.status = shouldRetainListingAccess ? 'active' : 'pending';
      }

      if (shouldRetainListingAccess && !listingData.publishedAt) {
        listingUpdate.publishedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await listingRef.set(listingUpdate, { merge: true });
    }
  }

  if (userUid) {
    await getDb().collection('billingAuditLogs').add({
      action: 'STRIPE_SUBSCRIPTION_SYNC',
      userUid,
      listingId: listingId || null,
      details: `Synced ${stripeSubscriptionId} as ${subscriptionStatus} via ${source}.`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

function canAdministrateAccount(role) {
  return ['super_admin', 'admin', 'developer'].includes(role);
}

function isDealerManagedRole(role) {
  return ['dealer', 'dealer_manager'].includes(role);
}

exports.apiProxy = onRequest(
  {
    region: 'us-central1',
    cors: true,
    secrets: [
      FRED_API_KEY,
      GOOGLE_TRANSLATE_API_KEY,
      EXCHANGERATE_API_KEY,
      STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET,
    ],
  },
  async (req, res) => {
    try {
      const path = (req.path || '/').replace(/^\/api/, '') || '/';
      const stripe = createStripeClient();

      if (req.method === 'POST' && (path === '/billing/webhook' || path === '/webhooks/stripe')) {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const webhookSecret = STRIPE_WEBHOOK_SECRET.value();
        const signature = req.headers['stripe-signature'];
        if (!webhookSecret || !signature) {
          return res.status(400).json({ error: 'Missing Stripe webhook signature or secret.' });
        }

        let event;
        try {
          event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
        } catch (error) {
          logger.error('Stripe webhook signature verification failed', error);
          return res.status(400).send('Invalid signature');
        }

        const eventRef = getDb().collection('webhook_events').doc(event.id);

        try {
          await eventRef.create({
            type: event.type,
            status: 'processing',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (lockError) {
          const lockMessage = String(lockError?.message || '').toLowerCase();
          const lockCode = lockError?.code;
          const alreadyExists =
            lockCode === 6 ||
            lockCode === 'already-exists' ||
            lockMessage.includes('already exists');

          if (alreadyExists) {
            return res.status(200).json({ received: true, duplicate: true });
          }

          throw lockError;
        }

        try {
          if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            await finalizeListingPaymentFromCheckoutSession(event.data.object, 'webhook');
          }

          if (
            event.type === 'customer.subscription.created' ||
            event.type === 'customer.subscription.updated' ||
            event.type === 'customer.subscription.deleted'
          ) {
            await syncSubscriptionStateFromStripeObject(event.data.object, `webhook:${event.type}`);
          }

          if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
            const invoiceObject = event.data.object || {};
            const rawSubscriptionId = typeof invoiceObject.subscription === 'string'
              ? invoiceObject.subscription
              : invoiceObject.subscription?.id;

            if (rawSubscriptionId) {
              const latestSubscription = await stripe.subscriptions.retrieve(rawSubscriptionId);
              await syncSubscriptionStateFromStripeObject(latestSubscription, `webhook:${event.type}`);
            }
          }

          await eventRef.set(
            {
              status: 'processed',
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          return res.status(200).json({ received: true });
        } catch (processingError) {
          logger.error('Stripe webhook processing failed', processingError);
          await eventRef.delete().catch((cleanupError) => {
            logger.error('Failed to release webhook processing lock', cleanupError);
          });
          return res.status(500).json({ error: 'Webhook processing failed. Retry expected.' });
        }
      }

      if (req.method === 'POST' && path === '/billing/create-checkout-session') {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const uid = decodedToken.uid;
        const plan = getListingCheckoutPlan(req.body?.planId);
        const listingId = String(req.body?.listingId || '').trim();

        if (!plan) {
          return res.status(400).json({ error: 'Invalid listing plan.' });
        }
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        const listingRef = getDb().collection('listings').doc(listingId);
        const listingSnap = await listingRef.get();
        if (!listingSnap.exists) {
          return res.status(404).json({ error: 'Listing not found.' });
        }

        const listing = listingSnap.data() || {};
        const ownerUid = String(listing.sellerUid || listing.sellerId || '');
        if (!ownerUid || ownerUid !== uid) {
          return res.status(403).json({ error: 'You can only pay for your own listing.' });
        }

        if (String(listing.paymentStatus || '') === 'paid') {
          return res.status(409).json({ error: 'Listing is already paid.' });
        }

        const paidListingsSnap = await getDb()
          .collection('listings')
          .where('sellerUid', '==', uid)
          .where('paymentStatus', '==', 'paid')
          .get();

        const activePaidListingsCount = paidListingsSnap.docs.filter((doc) => {
          if (doc.id === listingId) return false;
          const listingData = doc.data() || {};
          return String(listingData.status || 'active').toLowerCase() !== 'sold';
        }).length;

        if (activePaidListingsCount >= plan.listingCap) {
          return res.status(409).json({
            error: `Your ${plan.name} includes up to ${plan.listingCap} active ${plan.listingCap === 1 ? 'listing' : 'listings'}. Upgrade or mark one as sold before posting another.`,
          });
        }

        const priceId = await resolveStripePriceIdForPlan(stripe, plan);
        const customerId = await getOrCreateStripeCustomer(stripe, uid, decodedToken.email, decodedToken.name);
        const baseUrl = getRequestBaseUrl(req);

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: customerId,
          success_url: `${baseUrl}/sell?checkout=success&session_id={CHECKOUT_SESSION_ID}&listingId=${encodeURIComponent(listingId)}`,
          cancel_url: `${baseUrl}/sell?checkout=canceled&listingId=${encodeURIComponent(listingId)}`,
          line_items: [{ price: priceId, quantity: 1 }],
          client_reference_id: listingId,
          allow_promotion_codes: true,
          metadata: {
            userUid: uid,
            listingId,
            planId: plan.id,
            listingCap: String(plan.listingCap),
          },
          subscription_data: {
            metadata: {
              userUid: uid,
              listingId,
              planId: plan.id,
              listingCap: String(plan.listingCap),
            },
          },
        });

        if (!session.url) {
          return res.status(500).json({ error: 'Stripe checkout URL was not returned.' });
        }

        return res.status(200).json({
          sessionId: session.id,
          url: session.url,
        });
      }

      if (req.method === 'GET' && path.startsWith('/billing/checkout-session/')) {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const sessionId = path.replace('/billing/checkout-session/', '').trim();
        if (!sessionId) {
          return res.status(400).json({ error: 'Session id is required.' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription'],
        });

        if (String(session.metadata?.userUid || '') !== decodedToken.uid) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const finalized = await finalizeListingPaymentFromCheckoutSession(session, 'confirm');

        return res.status(200).json({
          sessionId: session.id,
          status: session.status,
          paid: finalized.paid,
          listingId: finalized.listingId,
          planId: finalized.planId,
        });
      }

      if (req.method === 'GET' && path === '/market-rates') {
        const payload = await getMarketRatesPayload();
        res.set('Cache-Control', 'public, max-age=900');
        return res.status(200).json(payload);
      }

      if (req.method === 'GET' && path === '/marketplace-stats') {
        const payload = await getMarketplaceStatsPayload();
        res.set('Cache-Control', 'public, max-age=600');
        return res.status(200).json(payload);
      }

      if (req.method === 'POST' && path === '/admin/users/create-managed-account') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = decodedToken.uid;
        const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
        const actorDoc = await getDb().collection('users').doc(actorUid).get();
        const actorRole = normalize(String(actorDoc.data()?.role || ''));
        const actorCanAdminister = isPrivilegedAdminEmail(actorEmail) || canAdministrateAccount(actorRole);
        const actorIsDealer = isDealerManagedRole(actorRole);

        if (!actorCanAdminister && !actorIsDealer) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const displayName = String(req.body?.displayName || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const role = normalize(String(req.body?.role || ''));
        const company = String(req.body?.company || '').trim();
        const phoneNumber = String(req.body?.phoneNumber || '').trim();
        const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
        const parentRole = actorCanAdminister && actorRole === 'buyer' ? 'super_admin' : actorRole;

        if (!displayName || !email) {
          return res.status(400).json({ error: 'Display name and email are required.' });
        }

        if (!canCreateManagedRole(parentRole, role)) {
          return res.status(403).json({ error: 'You do not have permission to create this account role.' });
        }

        if (actorIsDealer) {
          const seatContext = await getManagedAccountSeatContext(ownerUid);
          if (seatContext.seatLimit < 1) {
            return res.status(403).json({
              error: 'An active Dealer or Fleet Dealer subscription is required before adding managed accounts.',
            });
          }
          if (seatContext.seatCount >= seatContext.seatLimit) {
            return res.status(409).json({
              error: `Your current subscription includes up to ${seatContext.seatLimit} managed accounts. Remove one before adding another.`,
            });
          }
        }

        const existingUserByEmail = await getDb()
          .collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();

        if (!existingUserByEmail.empty) {
          return res.status(409).json({ error: 'An account with that email already exists.' });
        }

        const newUserRef = getDb().collection('users').doc();
        await newUserRef.set({
          uid: newUserRef.id,
          email,
          displayName,
          role,
          phoneNumber,
          company: company || String(actorDoc.data()?.company || '').trim(),
          parentAccountUid: ownerUid,
          accountStatus: 'pending',
          favorites: [],
          emailVerified: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdByUid: actorUid,
          managedByRole: parentRole,
        });

        return res.status(201).json({
          id: newUserRef.id,
          seatLimit: actorIsDealer ? DEALER_MANAGED_ACCOUNT_LIMIT : null,
        });
      }

      if (req.method === 'POST' && path === '/admin/dealer-feeds/ingest') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = decodedToken.uid;
        const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
        const actorDoc = await getDb().collection('users').doc(actorUid).get();
        const actorRole = normalize(String(actorDoc.data()?.role || ''));
        const actorCanAdminister = isPrivilegedAdminEmail(actorEmail) || canAdministrateAccount(actorRole);
        const actorIsDealer = isDealerManagedRole(actorRole);

        if (!actorCanAdminister && !actorIsDealer) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const sourceName = normalizeNonEmptyString(req.body?.sourceName, 'dealer_feed');
        const explicitDealerId = normalizeNonEmptyString(req.body?.dealerId);
        const sellerUid = explicitDealerId || String(actorDoc.data()?.parentAccountUid || actorUid).trim();
        const dryRun = Boolean(req.body?.dryRun);
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        if (!sellerUid) {
          return res.status(400).json({ error: 'dealerId could not be resolved.' });
        }
        if (items.length === 0) {
          return res.status(400).json({ error: 'items[] is required.' });
        }
        if (items.length > 1000) {
          return res.status(400).json({ error: 'Maximum 1000 items per ingest request.' });
        }

        if (actorIsDealer && !actorCanAdminister) {
          const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
          if (explicitDealerId && explicitDealerId !== ownerUid && explicitDealerId !== actorUid) {
            return res.status(403).json({ error: 'Dealers can only ingest to their own account scope.' });
          }
        }

        let created = 0;
        let updated = 0;
        let skipped = 0;
        const errors = [];

        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          try {
            const normalized = normalizeDealerFeedListing(item, sellerUid, sourceName);
            if (!normalized.externalSource.externalId) {
              skipped += 1;
              continue;
            }

            const existing = await getDb()
              .collection('listings')
              .where('sellerUid', '==', sellerUid)
              .where('externalSource.externalId', '==', normalized.externalSource.externalId)
              .limit(1)
              .get();

            if (dryRun) {
              if (existing.empty) created += 1;
              else updated += 1;
              continue;
            }

            if (existing.empty) {
              await getDb().collection('listings').add({
                ...normalized,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              created += 1;
            } else {
              await existing.docs[0].ref.set(normalized, { merge: true });
              updated += 1;
            }
          } catch (err) {
            errors.push({ index, reason: err?.message || 'Unknown ingest error' });
          }
        }

        const logPayload = {
          actorUid,
          actorRole,
          sellerUid,
          sourceName,
          dryRun,
          totalReceived: items.length,
          created,
          updated,
          skipped,
          errorCount: errors.length,
          errors: errors.slice(0, 100),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (!dryRun) {
          await getDb().collection('dealerFeedIngestLogs').add(logPayload);
        }

        return res.status(200).json({
          ok: true,
          ...logPayload,
        });
      }

      if (req.method === 'POST' && path === '/translate') {
        const apiKey = GOOGLE_TRANSLATE_API_KEY.value();
        if (!apiKey) {
          return res.status(503).json({ error: 'Translation API key not configured' });
        }

        const q = req.body?.q;
        const target = req.body?.target || 'en';
        const source = req.body?.source || 'en';

        const texts = Array.isArray(q) ? q : [q];
        const cleaned = texts.map((text) => String(text || '').trim()).filter(Boolean).slice(0, 40);

        if (cleaned.length === 0) {
          return res.status(400).json({ error: 'No text to translate' });
        }

        const outboundReferrer = APP_URL;

        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: outboundReferrer,
            Referer: outboundReferrer,
          },
          body: JSON.stringify({
            q: cleaned,
            target,
            source,
            format: 'text',
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          logger.error('Google translate API error', detail);
          return res.status(502).json({ error: 'Translation provider failed' });
        }

        const json = await response.json();
        const translated = (json?.data?.translations || []).map((item) => item?.translatedText || '');
        return res.status(200).json({ translations: translated });
      }

      if (req.method === 'GET' && path === '/currency-rates') {
        const base = String(req.query?.base || 'USD').toUpperCase();
        if (!/^[A-Z]{3}$/.test(base)) {
          return res.status(400).json({ error: 'Invalid base currency code' });
        }

        const payload = await getCurrencyRatesPayload(base);
        res.set('Cache-Control', 'public, max-age=1800');
        return res.status(200).json(payload);
      }

      if (req.method === 'POST' && path === '/recaptcha-assess') {
        const { token, action } = req.body || {};
        if (!token || !action) {
          return res.status(400).json({ error: 'token and action required' });
        }
        try {
          const result = await assessRecaptchaToken(token, action);
          const pass = result.valid && result.score >= 0.5;
          return res.status(200).json({ pass, score: result.score });
        } catch (err) {
          logger.error('reCAPTCHA assessment error', err);
          return res.status(200).json({ pass: true, score: null });
        }
      }

      return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      logger.error('apiProxy failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

