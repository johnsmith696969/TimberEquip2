import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { templates, withEmailPreferenceFooter } = require('../../functions/email-templates/index.js');

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

  it('injects unsubscribe links into the shared email footer', () => {
    const { html } = templates.newMatchingListing({
      displayName: '{{displayName}}',
      searchName: '{{searchName}}',
      listingTitle: '{{listingTitle}}',
      listingUrl: '{{listingUrl}}',
      listingPrice: '{{listingPrice}}',
      location: '{{location}}',
    });
    const finalHtml = withEmailPreferenceFooter(html, {
      unsubscribeUrl: '{{unsubscribeUrl}}',
    });

    expect(finalHtml).toContain('{{unsubscribeUrl}}');
    expect(finalHtml).toContain('Manage email preferences or unsubscribe from optional automated emails');
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

  it('renders password reset success emails with security actions', () => {
    const { subject, html } = templates.passwordResetSuccess({
      displayName: 'Dealer Admin',
      changedAt: 'April 2, 2026 at 2:10 AM',
      loginUrl: 'https://timberequip.com/login',
      supportUrl: 'https://timberequip.com/contact',
    });

    expect(subject).toContain('password was changed');
    expect(html).toContain('Password Changed Successfully');
    expect(html).toContain('April 2, 2026 at 2:10 AM');
    expect(html).toContain('Contact Support');
  });

  it('renders billing recovery actions for failed payment emails', () => {
    const { subject, html } = templates.paymentFailedPastDue({
      displayName: 'Dealer Admin',
      planName: 'Dealer Ad Package',
      amountDue: '$299.00',
      invoiceNumber: 'INV-10024',
      retryDate: 'April 5, 2026',
      billingUrl: 'https://timberequip.com/profile?tab=Account%20Settings',
      hostedInvoiceUrl: 'https://billing.example.com/invoice/10024',
    });

    expect(subject).toContain('Payment issue');
    expect(html).toContain('Update Billing');
    expect(html).toContain('INV-10024');
    expect(html).toContain('https://billing.example.com/invoice/10024');
  });

  it('renders account unlock emails with sign-in and support actions', () => {
    const { subject, html } = templates.accountUnlocked({
      displayName: 'Dealer Admin',
      actorName: 'Forestry Equipment Sales Admin',
      loginUrl: 'https://timberequip.com/login',
      supportUrl: 'https://timberequip.com/contact',
    });

    expect(subject).toContain('account has been unlocked');
    expect(html).toContain('Sign In');
    expect(html).toContain('https://timberequip.com/contact');
  });
});
