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

  it('keeps placeholder-style quoted prices in inspection admin output', () => {
    const { html } = templates.inspectionRequestAdmin({
      requesterName: '{{requesterName}}',
      requesterEmail: '{{requesterEmail}}',
      requesterPhone: '{{requesterPhone}}',
      requesterCompany: '{{requesterCompany}}',
      equipment: '{{equipment}}',
      inspectionLocation: '{{inspectionLocation}}',
      timeline: '{{timeline}}',
      notes: '{{notes}}',
      matchedDealerName: '{{matchedDealerName}}',
      matchedDealerLocation: '{{matchedDealerLocation}}',
      listingUrl: '{{listingUrl}}',
      quotedPrice: '{{quotedPrice}}',
      dashboardUrl: '{{dashboardUrl}}',
    });

    expect(html).toContain('{{quotedPrice}}');
    expect(html).not.toContain('Not quoted yet');
  });

  it('keeps placeholder-style quoted prices in inspection status updates', () => {
    const { html } = templates.inspectionRequestStatusUpdated({
      requesterName: '{{requesterName}}',
      equipment: '{{equipment}}',
      status: '{{status}}',
      quotedPrice: '{{quotedPrice}}',
      managerName: '{{managerName}}',
      inspectionLocation: '{{inspectionLocation}}',
    });

    expect(html).toContain('{{quotedPrice}}');
    expect(html).not.toContain('Not provided');
  });
});
