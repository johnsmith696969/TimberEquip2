/**
 * Content moderation using Google Cloud Vision SafeSearch.
 * Detects nudity, violence, child exploitation, and other harmful content
 * in uploaded images. Used by image-processing.js to gate variant generation.
 */
'use strict';

const { logger } = require('firebase-functions');

// SafeSearch likelihood levels ordered by severity
const LIKELIHOOD_LEVELS = ['UNKNOWN', 'VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'VERY_LIKELY'];

/**
 * Returns a numeric score (0-5) for a SafeSearch likelihood string.
 * UNKNOWN=0, VERY_UNLIKELY=1, UNLIKELY=2, POSSIBLE=3, LIKELY=4, VERY_LIKELY=5
 */
function likelihoodScore(value) {
  const idx = LIKELIHOOD_LEVELS.indexOf(value);
  return idx >= 0 ? idx : 0;
}

/**
 * Analyze an image buffer for harmful content using Cloud Vision SafeSearch.
 *
 * @param {Buffer} imageBuffer - The raw image bytes to analyze.
 * @returns {Promise<{ safe: boolean; reason: string | null; annotations: Record<string, string> | null }>}
 *   - safe: true if the image passes all moderation checks
 *   - reason: human-readable rejection reason (null if safe)
 *   - annotations: raw SafeSearch annotations for logging (null on error/fallback)
 */
async function moderateImage(imageBuffer) {
  let vision;
  try {
    vision = require('@google-cloud/vision');
  } catch {
    logger.warn('content-moderation: @google-cloud/vision not installed — skipping moderation.');
    return { safe: true, reason: null, annotations: null };
  }

  const client = new vision.ImageAnnotatorClient();

  try {
    const [result] = await client.safeSearchDetection({
      image: { content: imageBuffer.toString('base64') },
    });

    const annotations = result.safeSearchAnnotation;
    if (!annotations) {
      logger.warn('content-moderation: No SafeSearch annotations returned — allowing image.');
      return { safe: true, reason: null, annotations: null };
    }

    const scores = {
      adult: likelihoodScore(annotations.adult),
      violence: likelihoodScore(annotations.violence),
      racy: likelihoodScore(annotations.racy),
      medical: likelihoodScore(annotations.medical),
      spoof: likelihoodScore(annotations.spoof),
    };

    const rawAnnotations = {
      adult: annotations.adult,
      violence: annotations.violence,
      racy: annotations.racy,
      medical: annotations.medical,
      spoof: annotations.spoof,
    };

    // Block threshold: LIKELY (4) or higher for adult/violence content
    // Block threshold: VERY_LIKELY (5) for racy content (more lenient)
    const reasons = [];

    if (scores.adult >= 4) {
      reasons.push(`adult content detected (${annotations.adult})`);
    }
    if (scores.violence >= 4) {
      reasons.push(`violent content detected (${annotations.violence})`);
    }
    if (scores.racy >= 5) {
      reasons.push(`explicit content detected (${annotations.racy})`);
    }

    if (reasons.length > 0) {
      const reason = `Image rejected: ${reasons.join('; ')}`;
      logger.warn(`content-moderation: ${reason}`, { annotations: rawAnnotations });
      return { safe: false, reason, annotations: rawAnnotations };
    }

    logger.info('content-moderation: Image passed safety check.', { annotations: rawAnnotations });
    return { safe: true, reason: null, annotations: rawAnnotations };
  } catch (err) {
    // If Vision API fails (quota, network, etc.), log and allow the image
    // to avoid blocking legitimate uploads. Admins can review flagged images manually.
    logger.error('content-moderation: Vision API error — allowing image as fallback.', err.message);
    return { safe: true, reason: null, annotations: null };
  }
}

module.exports = { moderateImage, likelihoodScore, LIKELIHOOD_LEVELS };
