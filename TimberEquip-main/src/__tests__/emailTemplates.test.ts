import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { templates } = require('../../functions/email-templates/index.js');

describe('email templates', () => {
  it('keeps placeholder-style requested amounts in financing confirmation output', () => {
    const { html } = templates.financingRequestConfirmation({
      applicantName: '{{applicantName}}',
      requestedAmount: '{{requestedAmount}}',
      company: '{{company}}',
      dashboardUrl: '{{dashboardUrl}}',
    });

    expect(html).toContain('{{requestedAmount}}');
    expect(html).not.toContain('Not provided');
  });

  it('preserves unsubscribe links in optional email templates', () => {
    const { html } = templates.newMatchingListing({
      displayName: '{{displayName}}',
      searchName: '{{searchName}}',
      listingTitle: '{{listingTitle}}',
      listingUrl: '{{listingUrl}}',
      listingPrice: '{{listingPrice}}',
      location: '{{location}}',
      unsubscribeUrl: '{{unsubscribeUrl}}',
    });

    expect(html).toContain('{{unsubscribeUrl}}');
    expect(html).toContain('Unsubscribe from saved-search emails');
  });
});
