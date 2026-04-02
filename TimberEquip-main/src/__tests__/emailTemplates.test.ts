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

  it('uses the branded password reset workspace url in password reset emails', () => {
    const { subject, html } = templates.passwordReset({
      displayName: 'Dealer Admin',
      intro: 'We received a request to reset your Forestry Equipment Sales password.',
      resetUrl: 'https://timberequip.com/reset-password?oobCode=demo123&mode=resetPassword&continueUrl=%2Flogin',
      loginUrl: 'https://timberequip.com/login',
    });

    expect(subject).toContain('Reset your Forestry Equipment Sales password');
    expect(html).toContain('Open Secure Reset Page');
    expect(html).toContain('/reset-password?oobCode=demo123');
    expect(html).toContain('Back To Login');
  });
});
