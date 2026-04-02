import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { templates } = require('../functions/email-templates/index.js');

const SENDGRID_API_KEY = String(process.env.SENDGRID_API_KEY || '').trim();
const SENDGRID_AUTH_HEADER = String(process.env.SENDGRID_AUTH_HEADER || '').trim();
const AUTHORIZATION_HEADER = SENDGRID_AUTH_HEADER || (SENDGRID_API_KEY ? `Bearer ${SENDGRID_API_KEY}` : '');

const SENDGRID_API_BASE = 'https://api.sendgrid.com/v3';
const APP_URL = String(process.env.SENDGRID_APP_URL || process.env.APP_URL || 'https://timberequip.com').trim().replace(/\/+$/, '');
const LISTING_URL = `${APP_URL}/equipment/2020-tigercat-635h-skidder`;
const DASHBOARD_URL = `${APP_URL}/profile`;
const SEARCH_URL = `${APP_URL}/search`;
const CONTACT_URL = `${APP_URL}/contact`;
const AD_PROGRAMS_URL = `${APP_URL}/ad-programs`;
const LOGIN_URL = `${APP_URL}/login`;
const MANIFEST_PATH = path.resolve(process.cwd(), process.env.SENDGRID_TEMPLATE_MANIFEST_PATH || 'sendgrid-template-manifest.json');

function templateName(label) {
  return `${label} | Forestry Equipment Sales`;
}

function token(name) {
  return `{{${name}}}`;
}

function buildSharedTemplateData() {
  return {
  sellerName: token('sellerName'),
  buyerName: token('buyerName'),
  buyerEmail: token('buyerEmail'),
  buyerPhone: token('buyerPhone'),
  listingTitle: token('listingTitle'),
  listingUrl: token('listingUrl'),
  message: token('message'),
  displayName: token('displayName'),
  verificationLink: token('verificationLink'),
  intro: token('intro'),
  resetUrl: token('resetUrl'),
  planName: token('planName'),
  expiryDate: token('expiryDate'),
  renewUrl: token('renewUrl'),
  dashboardUrl: token('dashboardUrl'),
  callerNumber: token('callerNumber'),
  callTimestamp: token('callTimestamp'),
  reviewEta: token('reviewEta'),
  reason: token('reason'),
  invoiceNumber: token('invoiceNumber'),
  amountPaid: token('amountPaid'),
  amountDue: token('amountDue'),
  currency: token('currency'),
  hostedInvoiceUrl: token('hostedInvoiceUrl'),
  invoicePdfUrl: token('invoicePdfUrl'),
  requesterName: token('requesterName'),
  companyName: token('companyName'),
  email: token('email'),
  phone: token('phone'),
  notes: token('notes'),
  requestType: 'media-kit',
  supportUrl: token('supportUrl'),
  applicantName: token('applicantName'),
  applicantEmail: token('applicantEmail'),
  applicantPhone: token('applicantPhone'),
  company: token('company'),
  requestedAmount: token('requestedAmount'),
  category: token('category'),
  searchName: token('searchName'),
  listingPrice: token('listingPrice'),
  location: token('location'),
  previousPrice: token('previousPrice'),
  currentPrice: token('currentPrice'),
  inviterName: token('inviterName'),
  role: token('role'),
  temporaryPassword: token('temporaryPassword'),
  loginUrl: token('loginUrl'),
  resetLink: token('resetLink'),
  retryDate: token('retryDate'),
  actorName: token('actorName'),
  dealerName: token('dealerName'),
  billingUrl: token('billingUrl'),
  inquiryType: 'Inquiry',
  sellerUid: token('sellerUid'),
  listingId: token('listingId'),
  source: token('source'),
  monthLabel: token('monthLabel'),
  totalListings: token('totalListings'),
  leadForms: token('leadForms'),
  callButtonClicks: token('callButtonClicks'),
  connectedCalls: token('connectedCalls'),
  qualifiedCalls: token('qualifiedCalls'),
  missedCalls: token('missedCalls'),
  topMachines: [
    { title: token('topMachine1Title'), count: token('topMachine1Count') },
    { title: token('topMachine2Title'), count: token('topMachine2Count') },
    { title: token('topMachine3Title'), count: token('topMachine3Count') },
  ],
  sellerSummaries: [
    { name: token('sellerSummary1Name'), listings: token('sellerSummary1Listings'), leads: token('sellerSummary1Leads'), calls: token('sellerSummary1Calls'), qualifiedCalls: token('sellerSummary1QualifiedCalls') },
    { name: token('sellerSummary2Name'), listings: token('sellerSummary2Listings'), leads: token('sellerSummary2Leads'), calls: token('sellerSummary2Calls'), qualifiedCalls: token('sellerSummary2QualifiedCalls') },
  ],
  };
}

function buildTemplateSpecs() {
  const SHARED_TEMPLATE_DATA = buildSharedTemplateData();
  return [
  {
    key: 'leadNotification',
    name: templateName('New Lead Notification'),
    render: () => templates.leadNotification(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'inquiryConfirmation',
    name: templateName('Inquiry Received'),
    render: () => templates.inquiryConfirmation({ ...SHARED_TEMPLATE_DATA, inquiryType: 'Inquiry' }),
  },
  {
    key: 'logisticsInquiryConfirmation',
    name: 'Logistics Request Submitted',
    render: () => templates.inquiryConfirmation({ ...SHARED_TEMPLATE_DATA, inquiryType: 'Shipping' }),
  },
  {
    key: 'financingInquiryConfirmation',
    name: templateName('Financing Inquiry Submitted'),
    render: () => templates.inquiryConfirmation({ ...SHARED_TEMPLATE_DATA, inquiryType: 'Financing' }),
  },
  {
    key: 'welcomeVerification',
    name: templateName('Verify Your Email'),
    render: () => templates.welcomeVerification(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'passwordReset',
    name: templateName('Password Reset'),
    render: () => templates.passwordReset(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'subscriptionExpiring',
    name: templateName('Subscription Expiring'),
    render: () => templates.subscriptionExpiring(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'voicemailNotification',
    name: templateName('Voicemail Notification'),
    render: () => templates.voicemailNotification(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'dealerWidgetInquiryNotification',
    name: templateName('Dealer Widget Inquiry Notification'),
    render: () => templates.dealerWidgetInquiryNotification(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'listingApproved',
    name: templateName('Listing Approved'),
    render: () => templates.listingApproved(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'listingSubmitted',
    name: templateName('Listing Submitted'),
    render: () => templates.listingSubmitted(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'listingRejected',
    name: templateName('Listing Rejected'),
    render: () => templates.listingRejected({ ...SHARED_TEMPLATE_DATA, editUrl: `${DASHBOARD_URL}?tab=My%20Listings` }),
  },
  {
    key: 'invoicePaidReceipt',
    name: templateName('Invoice Paid Receipt'),
    render: () => templates.invoicePaidReceipt(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'subscriptionExpired',
    name: templateName('Subscription Expired'),
    render: () => templates.subscriptionExpired(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'paymentFailedPastDue',
    name: templateName('Payment Failed Past Due'),
    render: () => templates.paymentFailedPastDue(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'mediaKitRequest',
    name: templateName('Media Kit Request Admin Alert'),
    render: () => templates.mediaKitRequest(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'mediaKitRequestConfirmation',
    name: templateName('Media Kit Download'),
    render: () => templates.mediaKitRequestConfirmation(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'partnerRequestConfirmation',
    name: templateName('Partner Request Submitted'),
    render: () => templates.mediaKitRequestConfirmation({ ...SHARED_TEMPLATE_DATA, requestType: 'support' }),
  },
  {
    key: 'financingRequestConfirmation',
    name: 'Financing Request Submitted',
    render: () => templates.financingRequestConfirmation(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'contactRequestConfirmation',
    name: templateName('Contact Request Submitted'),
    render: () => templates.contactRequestConfirmation(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'subscriptionCreated',
    name: templateName('Subscription Created'),
    render: () => templates.subscriptionCreated(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'newMatchingListing',
    name: templateName('New Matching Listing Alert'),
    render: () => templates.newMatchingListing(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'matchingListingPriceDrop',
    name: templateName('Matching Listing Price Drop'),
    render: () => templates.matchingListingPriceDrop(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'matchingListingSold',
    name: templateName('Matching Listing Sold'),
    render: () => templates.matchingListingSold(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'similarListingRestocked',
    name: templateName('Similar Listing Restocked'),
    render: () => templates.similarListingRestocked(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'managedAccountInvite',
    name: templateName('Managed Account Invite'),
    render: () => templates.managedAccountInvite(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'accountLocked',
    name: templateName('Account Locked'),
    render: () => templates.accountLocked(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'accountUnlocked',
    name: templateName('Account Unlocked'),
    render: () => templates.accountUnlocked(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'adminInquiryAlert',
    name: templateName('Admin Inquiry Alert'),
    render: () => templates.adminInquiryAlert(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'financingRequestAdmin',
    name: templateName('Financing Request Admin Alert'),
    render: () => templates.financingRequestAdmin(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'contactRequestAdmin',
    name: templateName('Contact Request Admin Alert'),
    render: () => templates.contactRequestAdmin(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'dealerMonthlyReport',
    name: templateName('Dealer Monthly Report'),
    render: () => templates.dealerMonthlyReport(SHARED_TEMPLATE_DATA),
  },
  {
    key: 'dealerMonthlyReportAdminSummary',
    name: templateName('Dealer Monthly Report Admin Summary'),
    render: () => templates.dealerMonthlyReportAdminSummary(SHARED_TEMPLATE_DATA),
  },
  ];
}

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
      Authorization: AUTHORIZATION_HEADER,
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
      name: `${spec.key} synced from code`,
      subject: rendered.subject,
      html_content: rendered.html,
      plain_content: htmlToPlainText(rendered.html),
      generate_plain_content: false,
    }),
  });
}

async function main() {
  const TEMPLATE_SPECS = buildTemplateSpecs();
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
  const manifest = {
    syncedAt: new Date().toISOString(),
    appUrl: APP_URL,
    totalDynamicTemplates: finalTemplates.length,
    templates: results,
  };

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    synced: results,
    totalDynamicTemplates: finalTemplates.length,
    templateNames: TEMPLATE_SPECS.map((spec) => spec.name),
    currentDynamicTemplateNames: finalNames,
    manifestPath: MANIFEST_PATH,
  }, null, 2));
}

if (process.env.PRINT_SENDGRID_TEMPLATE_SPECS === '1') {
  const printable = buildTemplateSpecs().map((spec) => {
    const rendered = spec.render();
    return {
      key: spec.key,
      name: spec.name,
      subject: rendered.subject,
      html: rendered.html,
    };
  });
  console.log(JSON.stringify(printable, null, 2));
  process.exit(0);
}

if (!AUTHORIZATION_HEADER) {
  console.error('Either SENDGRID_API_KEY or SENDGRID_AUTH_HEADER is required.');
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
