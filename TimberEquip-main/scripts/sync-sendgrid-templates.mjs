import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { templates } = require('../functions/email-templates/index.js');

const SENDGRID_API_KEY = String(process.env.SENDGRID_API_KEY || '').trim();

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is required.');
  process.exit(1);
}

const SENDGRID_API_BASE = 'https://api.sendgrid.com/v3';
const APP_URL = 'https://timberequip.com';
const LISTING_URL = `${APP_URL}/equipment/2020-tigercat-635h-skidder`;
const DASHBOARD_URL = `${APP_URL}/profile`;
const SEARCH_URL = `${APP_URL}/search`;
const CONTACT_URL = `${APP_URL}/contact`;
const AD_PROGRAMS_URL = `${APP_URL}/ad-programs`;
const LOGIN_URL = `${APP_URL}/login`;

const SHARED_TEMPLATE_DATA = {
  sellerName: 'Caleb H',
  buyerName: 'Jordan Miller',
  buyerEmail: 'jordan.miller@example.com',
  buyerPhone: '+1 (218) 555-0183',
  listingTitle: '2020 Tigercat 635H Skidder',
  listingUrl: LISTING_URL,
  message: 'We are reviewing this machine for an April harvest contract and would like pricing plus availability.',
  displayName: 'Caleb H',
  verificationLink: `${APP_URL}/verify-email?token=sample-token`,
  planName: 'Dealer Ad Package',
  expiryDate: 'April 6, 2026',
  renewUrl: `${DASHBOARD_URL}?tab=Account%20Settings`,
  dashboardUrl: DASHBOARD_URL,
  reviewEta: 'Within 1 business day',
  reason: 'Please add at least 5 photos and include the serial number before resubmitting.',
  invoiceNumber: 'INV-2026-0042',
  amountPaid: 499,
  currency: 'usd',
  hostedInvoiceUrl: `${APP_URL}/invoices/example-hosted`,
  invoicePdfUrl: `${APP_URL}/invoices/example.pdf`,
  requesterName: 'Caleb',
  companyName: 'Happy Logging Co.',
  email: 'caleb@forestryequipmentsales.com',
  phone: '+1 (612) 600-8268',
  notes: 'Please send over the latest dealer media kit and premium placement options.',
  requestType: 'media-kit',
  supportUrl: AD_PROGRAMS_URL,
  applicantName: 'Caleb H',
  applicantEmail: 'caleb@forestryequipmentsales.com',
  applicantPhone: '+1 (612) 600-8268',
  company: 'Happy Logging Co.',
  requestedAmount: 185000,
  category: 'Partner With Us',
  searchName: 'Late Model Tigercat Skidders',
  listingPrice: '$214,500',
  location: 'Bemidji, Minnesota',
  previousPrice: '$229,000',
  currentPrice: '$214,500',
  inviterName: 'Caleb H',
  role: 'Manager',
  temporaryPassword: 'TempPassword!2026',
  loginUrl: LOGIN_URL,
  resetLink: `${APP_URL}/reset-password?token=invite-token`,
  inquiryType: 'Inquiry',
  sellerUid: 'seller-123',
  listingId: 'listing-123',
  requesterEmail: 'jordan.miller@example.com',
  requesterPhone: '+1 (320) 555-0144',
  requesterCompany: 'North Woods Timber',
  equipment: '2020 Tigercat 635H Skidder',
  inspectionLocation: 'Grand Rapids, Minnesota',
  timeline: 'Within 2 weeks',
  matchedDealerName: 'North Country Equipment',
  matchedDealerLocation: 'Grand Rapids, Minnesota',
  quotedPrice: '$3,500',
  status: 'Quoted',
  managerName: 'Caleb H',
  source: 'Contact Page',
  monthLabel: 'March 2026',
  totalListings: 18,
  leadForms: 27,
  callButtonClicks: 41,
  connectedCalls: 18,
  qualifiedCalls: 9,
  missedCalls: 6,
  topMachines: [
    { title: '2020 Tigercat 635H Skidder', leads: 9, calls: 6 },
    { title: '2021 John Deere 2154G', leads: 7, calls: 5 },
    { title: '2019 Ponsse Buffalo Forwarder', leads: 5, calls: 3 },
  ],
  sellerSummaries: [
    { sellerName: 'North Country Equipment', totalListings: 18, leadForms: 27, connectedCalls: 18, qualifiedCalls: 9, missedCalls: 6 },
    { sellerName: 'Lake States Logging Supply', totalListings: 11, leadForms: 14, connectedCalls: 7, qualifiedCalls: 4, missedCalls: 2 },
  ],
};

const TEMPLATE_SPECS = [
  {
    key: 'leadNotification',
    name: 'New Lead Notification | TimberEquip.com',
    render: () => templates.leadNotification(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'inquiryConfirmation',
    name: 'Inquiry Received | TimberEquip.com',
    render: () => templates.inquiryConfirmation({ ...SHARED_TEMPLATE_DATA, inquiryType: 'Inquiry' }),
  },
  {
    key: 'logisticsInquiryConfirmation',
    name: 'Logistics Request Submitted',
    render: () => templates.inquiryConfirmation({ ...SHARED_TEMPLATE_DATA, inquiryType: 'Shipping' }),
  },
  {
    key: 'financingInquiryConfirmation',
    name: 'Financing Inquiry Submitted | TimberEquip.com',
    render: () => templates.inquiryConfirmation({ ...SHARED_TEMPLATE_DATA, inquiryType: 'Financing' }),
  },
  {
    key: 'welcomeVerification',
    name: 'Verify your email on TimberEquip.com',
    render: () => templates.welcomeVerification(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'subscriptionExpiring',
    name: 'Subscription Expiring | TimberEquip.com',
    render: () => templates.subscriptionExpiring(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'listingApproved',
    name: 'Listing Approved | TimberEquip.com',
    render: () => templates.listingApproved(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'listingSubmitted',
    name: 'Listing Submitted | TimberEquip.com',
    render: () => templates.listingSubmitted(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'listingRejected',
    name: 'Listing Rejected | TimberEquip.com',
    render: () => templates.listingRejected({ ...SHARED_TEMPLATE_DATA, editUrl: `${DASHBOARD_URL}?tab=My%20Listings` }),
  },
  {
    key: 'invoicePaidReceipt',
    name: 'Invoice Paid Receipt | TimberEquip.com',
    render: () => templates.invoicePaidReceipt(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'subscriptionExpired',
    name: 'Subscription Expired | TimberEquip.com',
    render: () => templates.subscriptionExpired(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'mediaKitRequest',
    name: 'Media Kit Request Admin Alert | TimberEquip.com',
    render: () => templates.mediaKitRequest(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'mediaKitRequestConfirmation',
    name: 'Media Kit Download | TimberEquip.com',
    render: () => templates.mediaKitRequestConfirmation(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'partnerRequestConfirmation',
    name: 'Partner Request Submitted | TimberEquip.com',
    render: () => templates.mediaKitRequestConfirmation({ ...SHARED_TEMPLATE_DATA, requestType: 'support' }),
  },
  {
    key: 'financingRequestConfirmation',
    name: 'Financing Request Submitted',
    render: () => templates.financingRequestConfirmation(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'contactRequestConfirmation',
    name: 'Contact Request Submitted | TimberEquip.com',
    render: () => templates.contactRequestConfirmation(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'subscriptionCreated',
    name: 'Subscription Created | TimberEquip.com',
    render: () => templates.subscriptionCreated(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'newMatchingListing',
    name: 'New Matching Listing Alert | TimberEquip.com',
    render: () => templates.newMatchingListing(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'matchingListingPriceDrop',
    name: 'Matching Listing Price Drop | TimberEquip.com',
    render: () => templates.matchingListingPriceDrop(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'matchingListingSold',
    name: 'Matching Listing Sold | TimberEquip.com',
    render: () => templates.matchingListingSold(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'similarListingRestocked',
    name: 'Similar Listing Restocked | TimberEquip.com',
    render: () => templates.similarListingRestocked(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'managedAccountInvite',
    name: 'Managed Account Invite | TimberEquip.com',
    render: () => templates.managedAccountInvite(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'adminInquiryAlert',
    name: 'Admin Inquiry Alert | TimberEquip.com',
    render: () => templates.adminInquiryAlert(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'financingRequestAdmin',
    name: 'Financing Request Admin Alert | TimberEquip.com',
    render: () => templates.financingRequestAdmin(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'inspectionRequestReceived',
    name: 'Inspection Request Received | TimberEquip.com',
    render: () => templates.inspectionRequestReceived(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'inspectionRequestAdmin',
    name: 'Inspection Request Admin Alert | TimberEquip.com',
    render: () => templates.inspectionRequestAdmin(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'inspectionRequestStatusUpdated',
    name: 'Inspection Request Status Updated | TimberEquip.com',
    render: () => templates.inspectionRequestStatusUpdated(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'contactRequestAdmin',
    name: 'Contact Request Admin Alert | TimberEquip.com',
    render: () => templates.contactRequestAdmin(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'dealerMonthlyReport',
    name: 'Dealer Monthly Report | TimberEquip.com',
    render: () => templates.dealerMonthlyReport(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'dealerMonthlyReportAdminSummary',
    name: 'Dealer Monthly Report Admin Summary | TimberEquip.com',
    render: () => templates.dealerMonthlyReportAdminSummary(SHARED_TEMPLATE_DATA),
  },
];

function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendgridFetch(path, options = {}) {
  const response = await fetch(`${SENDGRID_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function listDynamicTemplates() {
  const payload = await sendgridFetch('/templates?generations=dynamic&page_size=200');
  return Array.isArray(payload?.result) ? payload.result : [];
}

async function getTemplate(templateId) {
  return sendgridFetch(`/templates/${templateId}`);
}

async function createTemplate(name) {
  return sendgridFetch('/templates', {
    method: 'POST',
    body: JSON.stringify({ name, generation: 'dynamic' }),
  });
}

async function createVersion(templateId, spec, rendered) {
  return sendgridFetch(`/templates/${templateId}/versions`, {
    method: 'POST',
    body: JSON.stringify({
      active: 1,
      editor: 'code',
      name: `${spec.key} synced from code`,
      subject: rendered.subject,
      html_content: rendered.html,
      plain_content: htmlToPlainText(rendered.html),
      generate_plain_content: false,
    }),
  });
}

async function updateVersion(templateId, versionId, spec, rendered) {
  return sendgridFetch(`/templates/${templateId}/versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      active: 1,
      editor: 'code',
      name: `${spec.key} synced from code`,
      subject: rendered.subject,
      html_content: rendered.html,
      plain_content: htmlToPlainText(rendered.html),
      generate_plain_content: false,
    }),
  });
}

async function main() {
  const existingTemplates = await listDynamicTemplates();
  const byName = new Map(existingTemplates.map((template) => [String(template.name || '').trim(), template]));
  const results = [];

  for (const spec of TEMPLATE_SPECS) {
    const rendered = spec.render();
    let template = byName.get(spec.name);
    let action = 'updated';

    if (!template) {
      template = await createTemplate(spec.name);
      byName.set(spec.name, template);
      action = 'created';
    }

    const fullTemplate = await getTemplate(template.id);
    const versions = Array.isArray(fullTemplate?.versions) ? fullTemplate.versions : [];
    const targetVersion = versions.find((version) => version.active === 1) || versions[0];

    if (targetVersion) {
      await updateVersion(template.id, targetVersion.id, spec, rendered);
    } else {
      await createVersion(template.id, spec, rendered);
      action = 'created';
    }

    results.push({
      key: spec.key,
      name: spec.name,
      templateId: template.id,
      status: action,
    });
  }

  const finalTemplates = await listDynamicTemplates();
  const finalNames = finalTemplates.map((template) => String(template.name || '').trim()).sort((a, b) => a.localeCompare(b));

  console.log(JSON.stringify({
    synced: results,
    totalDynamicTemplates: finalTemplates.length,
    timberEquipTemplateNames: TEMPLATE_SPECS.map((spec) => spec.name),
    currentDynamicTemplateNames: finalNames,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
