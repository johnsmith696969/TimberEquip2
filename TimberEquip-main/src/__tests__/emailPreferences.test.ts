import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  mergeEmailPreferenceMetadata,
  normalizeOptionalEmailPreferenceState,
} = require('../../functions/email-preferences.js');

describe('email preference helpers', () => {
  it('disables optional emails when either the user or recipient record is opted out', () => {
    expect(
      normalizeOptionalEmailPreferenceState({
        userData: { emailNotificationsEnabled: true },
        recipientData: { emailNotificationsEnabled: false },
      }).emailNotificationsEnabled
    ).toBe(false);

    expect(
      normalizeOptionalEmailPreferenceState({
        userData: { emailNotificationsEnabled: false },
        recipientData: { emailNotificationsEnabled: true },
      }).emailNotificationsEnabled
    ).toBe(false);
  });

  it('merges Forestry Equipment Sales email preference metadata into the postgres shadow payload', () => {
    const metadata = mergeEmailPreferenceMetadata(
      { source: 'existing' },
      {
        emailNotificationsEnabled: false,
        emailOptOutAt: '2026-04-06T12:00:00.000Z',
        emailOptOutSource: 'unsubscribe_link',
        updatedAt: '2026-04-06T12:00:30.000Z',
      }
    );

    expect(metadata).toMatchObject({
      source: 'existing',
      emailPreferences: {
        emailNotificationsEnabled: false,
        emailOptOutAt: '2026-04-06T12:00:00.000Z',
        emailOptOutSource: 'unsubscribe_link',
        updatedAt: '2026-04-06T12:00:30.000Z',
      },
    });
  });
});
