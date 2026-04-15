/**
 * Cloud Storage trigger: convert uploaded listing images to AVIF variants.
 * Extracted from index.js for modularity.
 */
'use strict';

const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const sharp = require('sharp');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const { getDb, resolveStorageBucketName, buildFirebaseDownloadUrl } = require('./shared.js');
const { moderateImage } = require('./content-moderation.js');

// ── Image compression constants ──────────────────────────────────────────────

const THUMB_MAX_BYTES = 50 * 1024;       // 50KB thumbnails (card grids)
const DETAIL_MAX_BYTES = 120 * 1024;     // 120KB detail images (listing pages)
const THUMB_MAX_WIDTH = 480;
const DETAIL_MAX_WIDTH = 1600;
const AVIF_QUALITIES = [60, 55, 50, 45, 40, 35, 30, 25];

// ── Watermark compositing ────────────────────────────────────────────────────

const WATERMARK_PATH = path.join(__dirname, 'watermark.avif');
const WATERMARK_ALPHA_SCALE = 0.19;
let _watermarkBuffer = null;

async function getWatermarkBuffer() {
  if (!_watermarkBuffer) {
    try {
      _watermarkBuffer = fs.readFileSync(WATERMARK_PATH);
    } catch (err) {
      logger.warn('Watermark file not found – images will not be watermarked.', err.message);
    }
  }
  return _watermarkBuffer;
}

async function applyWatermark(imageBuffer) {
  const wmSource = await getWatermarkBuffer();
  if (!wmSource) return imageBuffer;

  try {
    const meta = await sharp(imageBuffer).metadata();
    const imgWidth = meta.width || 800;
    const imgHeight = meta.height || 600;

    const wmWidth = Math.max(Math.round(imgWidth * 0.09), 24);
    const margin = Math.round(imgWidth * 0.04);

    const resizedWatermark = await sharp(wmSource)
      .resize({ width: wmWidth, fit: 'inside', withoutEnlargement: false })
      .ensureAlpha()
      .png()
      .toBuffer();

    const wmMeta = await sharp(resizedWatermark).metadata();
    const wmH = wmMeta.height || wmWidth;
    const softenedWatermark = await sharp(resizedWatermark)
      .ensureAlpha()
      .raw()
      .toBuffer()
      .then((rawBuf) => {
        for (let i = 3; i < rawBuf.length; i += 4) {
          rawBuf[i] = Math.round(rawBuf[i] * WATERMARK_ALPHA_SCALE);
        }
        return sharp(rawBuf, {
          raw: {
            width: wmMeta.width || wmWidth,
            height: wmH,
            channels: 4,
          },
        })
          .png()
          .toBuffer();
      });

    const left = Math.max(imgWidth - wmWidth - margin, 0);
    const top = Math.max(imgHeight - wmH - margin, 0);

    return sharp(imageBuffer)
      .composite([{ input: softenedWatermark, left, top }])
      .toBuffer();
  } catch (err) {
    logger.warn('Watermark compositing failed – returning unwatermarked image.', err.message);
    return imageBuffer;
  }
}

// ── AVIF compression ─────────────────────────────────────────────────────────

async function compressToAvifTarget(inputBuffer, width, targetBytes) {
  const widthSteps = [width, Math.round(width * 0.85), Math.round(width * 0.72), Math.round(width * 0.6), Math.round(width * 0.5), Math.round(width * 0.4)]
    .filter((candidate, index, array) => candidate > 0 && array.indexOf(candidate) === index);
  let best = null;

  for (const targetWidth of widthSteps) {
    for (const quality of AVIF_QUALITIES) {
      const resized = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: targetWidth,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();

      const watermarked = await applyWatermark(resized);

      const output = await sharp(watermarked)
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

// ── Cloud Storage trigger ────────────────────────────────────────────────────

exports.generateListingImageVariants = onObjectFinalized(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 120,
    bucket: resolveStorageBucketName(),
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

    // ── Content moderation gate ───────────────────────────────────────────────
    const moderation = await moderateImage(sourceBuffer);
    if (!moderation.safe) {
      logger.warn(`Content moderation BLOCKED listing image: ${filePath} — ${moderation.reason}`);
      // Delete the offending source image
      try { await sourceFile.delete(); } catch (delErr) {
        logger.error(`Failed to delete blocked image ${filePath}:`, delErr.message);
      }
      // Flag the listing in Firestore for admin review
      const listingRef = getDb().collection('listings').doc(listingId);
      await listingRef.set(
        {
          contentModerationFlag: {
            flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
            reason: moderation.reason,
            annotations: moderation.annotations,
            filePath,
          },
        },
        { merge: true },
      );
      return; // Do not generate variants for blocked images
    }

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
      { merge: true },
    );

    logger.info(`Finished variants for listing ${listingId}`);
  },
);
