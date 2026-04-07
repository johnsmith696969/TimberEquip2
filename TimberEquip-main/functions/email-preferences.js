function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTimestampLike(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return Number.isFinite(value) ? new Date(value).toISOString() : null;
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || null;
  }
  return null;
}

function normalizeOptionalEmailPreferenceState({ userData = {}, recipientData = {} } = {}) {
  const userEnabled = userData.emailNotificationsEnabled !== false;
  const recipientEnabled = recipientData.emailNotificationsEnabled !== false;

  return {
    emailNotificationsEnabled: userEnabled && recipientEnabled,
    userEnabled,
    recipientEnabled,
  };
}

function mergeEmailPreferenceMetadata(existingMetadata = {}, source = {}) {
  const nextMetadata = isPlainObject(existingMetadata) ? { ...existingMetadata } : {};

  nextMetadata.emailPreferences = {
    emailNotificationsEnabled: source.emailNotificationsEnabled !== false,
    emailOptOutAt: normalizeTimestampLike(source.emailOptOutAt),
    emailOptOutSource: typeof source.emailOptOutSource === 'string' ? source.emailOptOutSource.trim() || null : null,
    updatedAt: normalizeTimestampLike(source.updatedAt),
  };

  return nextMetadata;
}

module.exports = {
  mergeEmailPreferenceMetadata,
  normalizeOptionalEmailPreferenceState,
};
