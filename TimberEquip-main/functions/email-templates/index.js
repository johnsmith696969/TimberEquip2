/**
 * Forestry Equipment Sales Email Templates
 *
 * Usage:
 *   const { subject, html } = templates.leadNotification({ sellerName, buyerName, listingTitle, listingUrl, message });
 *
 * Configure SendGrid + sender identity via Firebase Functions secrets:
 *   firebase functions:secrets:set SENDGRID_API_KEY EMAIL_FROM ADMIN_EMAILS
 */

const DEFAULT_MARKETPLACE_URL = 'https://timberequip.com';

function normalizeMarketplaceUrl(url) {
  return String(url || DEFAULT_MARKETPLACE_URL).trim().replace(/\/+$/, '') || DEFAULT_MARKETPLACE_URL;
}

const MARKETPLACE_URL = normalizeMarketplaceUrl(process.env.EMAIL_MARKETPLACE_URL || process.env.APP_URL);
const SEARCH_URL = `${MARKETPLACE_URL}/search`;
const PROFILE_URL = `${MARKETPLACE_URL}/profile`;
const ADMIN_URL = `${MARKETPLACE_URL}/admin`;
const CONTACT_URL = `${MARKETPLACE_URL}/contact`;
const PRIVACY_URL = `${MARKETPLACE_URL}/privacy`;
const TERMS_URL = `${MARKETPLACE_URL}/terms`;
const EMAIL_HEADER_ASSET_URL = `${MARKETPLACE_URL}/Forestry_Equipment_Sales_Twilio_Email_Header.png?v=20260403a`;
const EMAIL_FOOTER_ASSET_URL = `${MARKETPLACE_URL}/Forestry_Equipment_Sales_Email_Footer.png?v=20260403a`;

const EMAIL_PREFERENCE_FOOTER_MARKER = '<!--EMAIL_PREFERENCE_FOOTER-->';

const BASE_STYLES = `
  :root { color-scheme: light only; supported-color-schemes: light only; }
  .brand-green { color: #16A34A !important; }
  body { margin: 0; padding: 0; background: #f3f4f6 !important; font-family: 'Avenir Next', 'Segoe UI', sans-serif; color: #111827 !important; }
  .shell { background: linear-gradient(180deg, #111827 0%, #111827 180px, #f3f4f6 180px, #f3f4f6 100%); padding: 28px 14px; }
  .wrapper { max-width: 640px; margin: 0 auto; background: #ffffff !important; border: 1px solid #d1d5db; box-shadow: 0 26px 60px rgba(17, 24, 39, 0.16), 0 10px 22px rgba(17, 24, 39, 0.10); }
  .header { background: linear-gradient(180deg, #0f172a 0%, #111827 100%) !important; padding: 28px 40px 24px; box-shadow: inset 0 -1px 0 rgba(255,255,255,0.06); }
  .eyebrow { color: #4ADE80; font-size: 10px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; margin: 0 0 14px; text-shadow: 0 0 18px rgba(34, 197, 94, 0.18); }
  .header-logo-wrap { text-align: left; }
  .header-logo-img { display: block; width: 220px; max-width: 100%; height: auto; }
  .hero-title { color: #ffffff !important; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; margin: 20px 0 8px; }
  .hero-copy { color: rgba(255,255,255,0.72) !important; font-size: 13px; line-height: 1.6; margin: 0; max-width: 460px; }
  .header-divider { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 22px 0 0; }
  .body { padding: 40px; }
  .context-title { color: #111827 !important; font-size: 24px; font-weight: 900; margin: 0 0 20px; text-transform: uppercase; letter-spacing: -0.02em; }
  .label { color: #15803D; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 6px; }
  .body h2 { color: #111827 !important; font-size: 20px; font-weight: 900; margin: 0 0 16px; text-transform: uppercase; letter-spacing: -0.02em; }
  .body p { color: #4b5563 !important; font-size: 14px; line-height: 1.65; margin: 0 0 16px; }
  .body p strong { color: #111827 !important; }
  .panel { background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important; border: 1px solid #e5e7eb; border-radius: 3px; padding: 20px; margin: 20px 0; box-shadow: 0 12px 28px rgba(17, 24, 39, 0.08); }
  .message-box { background: #eefbf2 !important; border-left: 3px solid #16A34A; padding: 16px 20px; margin: 20px 0; border-radius: 2px; box-shadow: 0 8px 18px rgba(22, 163, 74, 0.10); }
  .message-box p { color: #224b22 !important; font-size: 14px; margin: 0; font-style: italic; }
  .cta { display: inline-block; background: #16A34A; color: #ffffff !important; font-size: 11px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 28px; text-decoration: none; border-radius: 2px; margin: 8px 8px 8px 0; box-shadow: 0 10px 22px rgba(22, 163, 74, 0.22); }
  .cta-secondary { background: #ffffff !important; border: 1px solid #15803D; color: #15803D !important; box-shadow: 0 8px 18px rgba(21, 128, 61, 0.10); }
  .info-row { display: flex; gap: 8px; margin-bottom: 8px; }
  .info-label { color: #6b7280 !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; min-width: 120px; }
  .info-value { color: #111827 !important; font-size: 11px; font-weight: 600; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
  .footer { background: #ffffff !important; padding: 24px 40px 32px; border-top: 1px solid #e5e7eb; }
  .footer-logo-wrap { margin: 0 0 18px; }
  .footer-logo-frame { display: inline-flex; align-items: center; justify-content: center; width: 88px; height: 88px; border-radius: 999px; background: linear-gradient(180deg, #ecfdf5 0%, #dcfce7 100%); border: 1px solid rgba(22, 163, 74, 0.18); box-shadow: 0 12px 24px rgba(22, 163, 74, 0.14); }
  .footer-logo-img { display: block; width: 58px; max-width: 100%; height: auto; }
  .footer-grid { background: #f8fafc; border: 1px solid #e5e7eb; padding: 16px 18px; margin-bottom: 18px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06); }
  .footer-title { color: #111827; font-size: 11px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 8px; }
  .footer p { color: #6b7280 !important; font-size: 11px; margin: 0; line-height: 1.5; }
  .footer a { color: #15803D; text-decoration: none; font-weight: 700; }
  .badge { display: inline-block; background: rgba(22, 163, 74, 0.12); border: 1px solid rgba(22, 163, 74, 0.28); color: #15803D; font-size: 10px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px; }
  .success-badge { background: rgba(22, 163, 74, 0.12); border-color: rgba(22, 163, 74, 0.28); color: #15803D; }
  .warning-badge { background: rgba(22, 163, 74, 0.12); border-color: rgba(22, 163, 74, 0.28); color: #15803D; }
  @media (max-width: 640px) {
    .shell { padding: 0; background: #111827; }
    .wrapper { border-left: none; border-right: none; }
    .header, .body, .footer { padding-left: 22px; padding-right: 22px; }
    .hero-title { font-size: 24px; }
    .info-row { display: block; }
    .info-label { display: block; margin-bottom: 4px; }
  }
  @media (prefers-color-scheme: dark) {
    body, .shell, .wrapper, .header, .body, .footer, .panel { color: #111827 !important; }
    .body h2, .context-title, .info-value, .body p strong, .hero-title { color: inherit !important; }
    .body p, .footer p, .info-label, .hero-copy { color: #4b5563 !important; }
  }
`;

function baseLayout(title, headerSubtitle, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="shell">
    <div class="wrapper">
      <div class="header">
        <p class="eyebrow">Forestry Equipment Sales Marketplace</p>
        <div class="header-logo-wrap">
          <img class="header-logo-img" src="${EMAIL_HEADER_ASSET_URL}" alt="Forestry Equipment Sales" />
        </div>
        <h1 class="hero-title">${headerSubtitle}</h1>
        <p class="hero-copy">Industrial forestry equipment leads, listings, financing, and marketplace updates from the Forestry Equipment Sales network.</p>
        <hr class="header-divider" />
      </div>
      <div class="body">
        <h1 class="context-title">${headerSubtitle}</h1>
        ${content}
      </div>
      <div class="footer">
        <div class="footer-logo-wrap">
          <div class="footer-logo-frame">
            <img class="footer-logo-img" src="${EMAIL_FOOTER_ASSET_URL}" alt="Forestry Equipment Sales tree mark" />
          </div>
        </div>
        <div class="footer-grid">
          <p class="footer-title">Built For Forestry Equipment</p>
          <p>Forestry Equipment Sales connects buyers, sellers, and partners across used and new logging equipment, financing workflows, and industrial inventory marketing.</p>
        </div>
        ${EMAIL_PREFERENCE_FOOTER_MARKER}
        <p>
          &copy; ${new Date().getFullYear()} Forestry Equipment Sales &mdash; The Forestry Equipment Marketplace<br />
          <a href="${MARKETPLACE_URL}">Forestry Equipment Sales</a> &middot;
          <a href="${PRIVACY_URL}">Privacy Policy</a> &middot;
          <a href="${TERMS_URL}">Terms</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderEmailPreferenceFooter(unsubscribeUrl, label = 'Manage email preferences or unsubscribe from optional automated emails') {
  if (!unsubscribeUrl) return '';

  return `
    <hr class="divider" />
    <p style="font-size:11px; color:#6b7280 !important;">
      Prefer fewer emails? <a href="${unsubscribeUrl}">${label}</a>.<br />
      This link turns off optional automated marketplace emails for this address. Required security, billing, listing, and account-service emails may still be sent.
    </p>
  `;
}

function withEmailPreferenceFooter(html, options = {}) {
  const footerHtml = renderEmailPreferenceFooter(options.unsubscribeUrl, options.label);
  return String(html || '').replace(EMAIL_PREFERENCE_FOOTER_MARKER, footerHtml);
}

function renderInfoPanel(rows) {
  return `
    <div class="panel">
      ${rows.filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '').map((row) => `
        <div class="info-row">
          <span class="info-label">${row.label}</span>
          <span class="info-value">${row.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

const templates = {
  /**
   * Sent to the seller when a buyer submits an inquiry on their listing.
   */
  leadNotification({ sellerName, buyerName, buyerEmail, buyerPhone, listingTitle, listingUrl, message }) {
    const subject = `New Lead: "${listingTitle}"`;
    const html = baseLayout(subject, 'New Inquiry Received', `
      <p class="label">Buyer Lead</p>
      <h2>Someone is interested in your listing</h2>
      <p>Hi <strong>${sellerName}</strong>,</p>
      <p>
        A potential buyer has submitted an inquiry for
        <strong>${listingTitle}</strong>. Respond quickly to close the sale—buyers
        who receive responses within an hour are significantly more likely to purchase.
      </p>

      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row">
          <span class="info-label">Buyer Name</span>
          <span class="info-value">${buyerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value"><a href="mailto:${buyerEmail}" style="color:#2f6f2d;">${buyerEmail}</a></span>
        </div>
        ${buyerPhone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${buyerPhone}</span></div>` : ''}
        <div class="info-row">
          <span class="info-label">Listing</span>
          <span class="info-value">${listingTitle}</span>
        </div>
      </div>

      ${message ? `<div class="message-box"><p>"${message}"</p></div>` : ''}

      <a href="${listingUrl}" class="cta">View Listing &amp; Respond</a>
    `);
    return { subject, html };
  },

  /**
   * Sent to the buyer confirming their inquiry was received.
   */
  inquiryConfirmation({ buyerName, listingTitle, listingUrl, sellerName, inquiryType }) {
    const normalizedType = String(inquiryType || 'Inquiry').trim();
    const subject = normalizedType === 'Shipping'
      ? `Your logistics request for "${listingTitle}" has been received`
      : normalizedType === 'Financing'
        ? `Your financing request for "${listingTitle}" has been received`
        : `Your inquiry for "${listingTitle}" has been received`;
    const heading = normalizedType === 'Shipping'
      ? 'We received your logistics request'
      : normalizedType === 'Financing'
        ? 'We received your financing request'
        : 'We\'ve notified the seller';
    const description = normalizedType === 'Shipping'
      ? `Your logistics request for <strong>${listingTitle}</strong> has been sent to <strong>${sellerName}</strong> and the Forestry Equipment Sales team for follow-up.`
      : normalizedType === 'Financing'
        ? `Your financing request for <strong>${listingTitle}</strong> has been logged. The seller and Forestry Equipment Sales team have been notified so they can review the deal details.`
        : `Your inquiry for <strong>${listingTitle}</strong> has been sent to <strong>${sellerName}</strong>. They typically respond within 24 hours.`;
    const html = baseLayout(subject, 'Inquiry Confirmed', `
      <p class="label">${normalizedType} Confirmation</p>
      <h2>${heading}</h2>
      <p>Hi <strong>${buyerName}</strong>,</p>
      <p>${description}</p>
      <p>
        While you wait, browse more equipment or save additional listings to your bookmarks.
      </p>
      ${renderInfoPanel([
        { label: 'Request Type', value: normalizedType },
        { label: 'Listing', value: listingTitle },
        { label: 'Seller', value: sellerName },
      ])}
      <a href="${listingUrl}" class="cta">View Listing</a>
      <a href="${SEARCH_URL}" class="cta cta-secondary">Browse More</a>
    `);
    return { subject, html };
  },

  /**
   * Sent to new users after sign-up to welcome and prompt email verification.
   */
  welcomeVerification({ displayName, verificationLink }) {
    const subject = 'Welcome to Forestry Equipment Sales — Verify Your Email';
    const html = baseLayout(subject, 'Welcome to Forestry Equipment Sales', `
      <p class="label">Account Verification</p>
      <h2>Verify your email to get started</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>
        Thanks for joining Forestry Equipment Sales — the marketplace built specifically for
        forestry and logging equipment professionals. Your account is ready, but
        we need you to verify your email address first.
      </p>
      <a href="${verificationLink}" class="cta">Verify Email Address</a>
      <hr class="divider" />
      <p style="font-size:12px; color:#666;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    `);
    return { subject, html };
  },

  passwordReset({ displayName, intro, resetUrl, loginUrl }) {
    const subject = 'Reset your Forestry Equipment Sales password';
    const html = baseLayout(subject, 'Reset Your Password', `
      <p class="label">Account Recovery</p>
      <h2>Choose a new password</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>${intro}</p>
      <p>Use the secure password reset page below to choose a new password for your Forestry Equipment Sales account.</p>
      ${renderInfoPanel([
        { label: 'Destination', value: 'Forestry Equipment Sales password recovery workspace' },
        { label: 'Security', value: 'Single-use link that expires automatically' },
      ])}
      <a href="${resetUrl}" class="cta">Open Secure Reset Page</a>
      <a href="${loginUrl}" class="cta cta-secondary">Back To Login</a>
      <hr class="divider" />
      <p style="font-size:12px; color:#6b7280 !important;">
        If the button does not work, copy and paste this secure link into your browser:<br />
        <a href="${resetUrl}" style="word-break:break-word;">${resetUrl}</a>
      </p>
      <p>If you did not request this change, you can safely ignore this email and your password will stay the same.</p>
    `);
    return { subject, html };
  },

  passwordResetSuccess({ displayName, changedAt, loginUrl, supportUrl }) {
    const subject = 'Your Forestry Equipment Sales password was changed';
    const html = baseLayout(subject, 'Password Changed Successfully', `
      <p class="label">Security Confirmation</p>
      <h2>Your password has been updated</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>This is a confirmation that the password for your Forestry Equipment Sales account was changed successfully.</p>
      ${renderInfoPanel([
        { label: 'Changed', value: changedAt || 'Just now' },
        { label: 'Account Access', value: 'Your new password is now required the next time you sign in.' },
      ])}
      <p>If you made this change, no further action is needed.</p>
      <p>If you did <strong>not</strong> change your password, secure your account immediately and contact Forestry Equipment Sales support so we can help lock down access.</p>
      <a href="${loginUrl}" class="cta">Sign In</a>
      <a href="${supportUrl || CONTACT_URL}" class="cta cta-secondary">Contact Support</a>
    `);
    return { subject, html };
  },

  voicemailNotification({ sellerName, callerNumber, callTimestamp, dashboardUrl }) {
    const subject = 'New voicemail on Forestry Equipment Sales';
    const html = baseLayout(subject, 'Voicemail Received', `
      <p class="label">Call Tracking</p>
      <h2>A buyer left you a voicemail</h2>
      <p>Hi <strong>${sellerName}</strong>,</p>
      <p>A caller was unable to reach you live and left a voicemail through your Forestry Equipment Sales call tracking line.</p>
      ${renderInfoPanel([
        { label: 'Caller', value: callerNumber || 'Unknown caller' },
        { label: 'Received', value: callTimestamp || 'Just now' },
        { label: 'Next Step', value: 'Open your Calls tab to review the voicemail and return the lead quickly.' },
      ])}
      <a href="${dashboardUrl}" class="cta">Review Voicemail</a>
    `);
    return { subject, html };
  },

  dealerWidgetInquiryNotification({ sellerName, dealerName, buyerName, buyerEmail, buyerPhone, listingId, message, dashboardUrl }) {
    const subject = `New dealer widget inquiry${dealerName ? ` for ${dealerName}` : ''}`;
    const html = baseLayout(subject, 'Dealer Widget Inquiry', `
      <p class="label">Dealer Widget Lead</p>
      <h2>A buyer submitted an inquiry from your embedded storefront</h2>
      <p>Hi <strong>${sellerName}</strong>,</p>
      <p>A new inquiry was submitted through your Forestry Equipment Sales dealer widget${dealerName ? ` for <strong>${dealerName}</strong>` : ''}.</p>
      ${renderInfoPanel([
        { label: 'Buyer Name', value: buyerName || 'N/A' },
        { label: 'Buyer Email', value: buyerEmail || 'N/A' },
        { label: 'Buyer Phone', value: buyerPhone || 'Not provided' },
        { label: 'Dealer', value: dealerName || 'Embedded storefront' },
        { label: 'Listing ID', value: listingId || 'General storefront inquiry' },
      ])}
      ${message ? `<div class="message-box"><p>${message}</p></div>` : ''}
      <a href="${dashboardUrl}" class="cta">Open DealerOS</a>
    `);
    return { subject, html };
  },

  paymentFailedPastDue({ displayName, planName, amountDue, invoiceNumber, retryDate, billingUrl, hostedInvoiceUrl }) {
    const subject = `Payment issue for your ${planName} plan`;
    const html = baseLayout(subject, 'Billing Action Required', `
      <p class="label">Billing Notice</p>
      <h2>We could not process your latest payment</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>We were unable to process the latest payment for your <span class="badge">${planName}</span> plan. Update your billing details to keep your Forestry Equipment Sales account and listings active.</p>
      ${renderInfoPanel([
        { label: 'Plan', value: planName || 'Marketplace subscription' },
        { label: 'Amount Due', value: amountDue || 'Balance due' },
        { label: 'Invoice', value: invoiceNumber || 'N/A' },
        { label: 'Next Retry', value: retryDate || 'Stripe will retry automatically based on your billing schedule' },
      ])}
      <p>If the payment issue is not resolved, your subscription may move to past due status and your listings can be hidden from the marketplace until billing is restored.</p>
      <a href="${billingUrl}" class="cta">Update Billing</a>
      ${hostedInvoiceUrl ? `<a href="${hostedInvoiceUrl}" class="cta cta-secondary">View Invoice</a>` : ''}
    `);
    return { subject, html };
  },

  accountLocked({ displayName, actorName, supportUrl }) {
    const subject = 'Your Forestry Equipment Sales account has been locked';
    const html = baseLayout(subject, 'Account Locked', `
      <p class="label">Account Status</p>
      <h2>Your account is currently suspended</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Your Forestry Equipment Sales account has been locked${actorName ? ` by <strong>${actorName}</strong>` : ''}. While this status is active, you may not be able to sign in or manage your listings.</p>
      ${renderInfoPanel([
        { label: 'Status', value: 'Locked' },
        { label: 'Support', value: 'Contact the Forestry Equipment Sales team if you believe this was done in error.' },
      ])}
      <a href="${supportUrl || CONTACT_URL}" class="cta">Contact Support</a>
    `);
    return { subject, html };
  },

  accountUnlocked({ displayName, actorName, loginUrl, supportUrl }) {
    const subject = 'Your Forestry Equipment Sales account has been unlocked';
    const html = baseLayout(subject, 'Account Restored', `
      <p class="label">Account Status</p>
      <h2>Your account has been restored</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Your Forestry Equipment Sales account has been unlocked${actorName ? ` by <strong>${actorName}</strong>` : ''}. You can sign in again and return to your account workspace.</p>
      ${renderInfoPanel([
        { label: 'Status', value: 'Active' },
        { label: 'Next Step', value: 'Sign in and confirm your account details, listings, and billing status.' },
      ])}
      <a href="${loginUrl}" class="cta">Sign In</a>
      <a href="${supportUrl || CONTACT_URL}" class="cta cta-secondary">Contact Support</a>
    `);
    return { subject, html };
  },

  /**
   * Sent 7 days before a subscription expires.
   */
  subscriptionExpiring({ displayName, planName, expiryDate, renewUrl }) {
    const subject = `Your ${planName} subscription expires ${expiryDate}`;
    const html = baseLayout(subject, 'Subscription Expiring Soon', `
      <p class="label">Subscription Notice</p>
      <h2>Your plan expires in 7 days</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>
        Your <span class="badge warning-badge">${planName}</span> subscription is set to expire on
        <strong>${expiryDate}</strong>. Renew now to keep your listings visible and maintain your seller status.
      </p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row">
          <span class="info-label">Current Plan</span><span class="info-value">${planName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expiry Date</span><span class="info-value">${expiryDate}</span>
        </div>
      </div>
      <p>After expiry, your listings will be paused and won't appear in search results.</p>
      <a href="${renewUrl}" class="cta">Renew Subscription</a>
    `);
    return { subject, html };
  },

  /**
   * Sent when a listing is approved.
   */
  listingApproved({ sellerName, listingTitle, listingUrl }) {
    const subject = `Your listing "${listingTitle}" is now live`;
    const html = baseLayout(subject, 'Listing Approved', `
      <p class="label">Listing Status</p>
      <h2>Your listing is live</h2>
      <p>Hi <strong>${sellerName}</strong>,</p>
      <p>
        Great news — <strong>${listingTitle}</strong> has been reviewed and approved.
        It is now publicly visible to buyers across Forestry Equipment Sales.
      </p>
      <span class="badge success-badge">Active &amp; Visible</span>
      <br /><br />
      <a href="${listingUrl}" class="cta">View Your Listing</a>
      <hr class="divider" />
      <p>
        Share your listing to reach more buyers faster. You'll receive email notifications
        whenever a buyer submits an inquiry.
      </p>
    `);
    return { subject, html };
  },

  listingSubmitted({ sellerName, listingTitle, dashboardUrl, reviewEta }) {
    const subject = `Listing received: ${listingTitle}`;
    const html = baseLayout(subject, 'Listing Submitted', `
      <p class="label">Listing Intake</p>
      <h2>Your listing is now in review</h2>
      <p>Hi <strong>${sellerName}</strong>,</p>
      <p>We received your listing for <strong>${listingTitle}</strong>. It is now queued for review by the Forestry Equipment Sales team before it goes live in search results.</p>
      ${renderInfoPanel([
        { label: 'Listing', value: listingTitle },
        { label: 'Status', value: 'Pending Review' },
        { label: 'Review Window', value: reviewEta || 'Typically within 1 business day' },
      ])}
      <p>You can review or update the listing from your seller dashboard while it is pending.</p>
      <a href="${dashboardUrl}" class="cta">Open Seller Dashboard</a>
    `);
    return { subject, html };
  },

  /**
   * Sent when a listing is rejected, with optional reason.
   */
  listingRejected({ sellerName, listingTitle, reason, editUrl }) {
    const subject = `Action required: "${listingTitle}" needs updates`;
    const html = baseLayout(subject, 'Listing Needs Updates', `
      <p class="label">Listing Review</p>
      <h2>Updates required before approval</h2>
      <p>Hi <strong>${sellerName}</strong>,</p>
      <p>
        Your listing <strong>${listingTitle}</strong> could not be approved in its current state.
        Please review the feedback below and resubmit.
      </p>
      ${reason ? `<div class="message-box"><p>${reason}</p></div>` : ''}
      <p>Common reasons for rejection include insufficient photos (minimum 5 required), missing
      required specifications for the equipment category, or incomplete condition checklist.</p>
      <a href="${editUrl}" class="cta">Edit &amp; Resubmit</a>
    `);
    return { subject, html };
  },

  invoicePaidReceipt({ displayName, invoiceNumber, amountPaid, currency, planName, hostedInvoiceUrl, invoicePdfUrl }) {
    const subject = `Payment received for ${planName}`;
    const normalizedAmount = typeof amountPaid === 'number'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(amountPaid)
      : String(amountPaid || 'Paid');
    const html = baseLayout(subject, 'Invoice Payment Received', `
      <p class="label">Billing Receipt</p>
      <h2>Your Forestry Equipment Sales payment was received</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>We received your payment for <span class="badge success-badge">${planName}</span>.</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Invoice</span><span class="info-value">${invoiceNumber || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value">${normalizedAmount}</span></div>
        <div class="info-row"><span class="info-label">Plan</span><span class="info-value">${planName}</span></div>
      </div>
      ${hostedInvoiceUrl ? `<a href="${hostedInvoiceUrl}" class="cta">View Invoice</a>` : ''}
      ${invoicePdfUrl ? `<a href="${invoicePdfUrl}" class="cta" style="background:#ffffff; border:1px solid #4f8f3a; color:#2f6f2d; margin-left:12px;">Download PDF</a>` : ''}
    `);
    return { subject, html };
  },

  /**
   * Sent when a subscription has expired (day-of).
   */
  subscriptionExpired({ displayName, planName, renewUrl }) {
    const subject = `Your ${planName} subscription has expired`;
    const html = baseLayout(subject, 'Subscription Expired', `
      <p class="label">Subscription Notice</p>
      <h2>Your listings are now paused</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>
        Your <span class="badge">${planName}</span> subscription has expired. Your active listings
        have been paused and are no longer visible to buyers.
      </p>
      <p>Renew your subscription to reactivate your listings immediately.</p>
      <a href="${renewUrl}" class="cta">Renew Now</a>
    `);
    return { subject, html };
  },

  mediaKitRequest({ requesterName, companyName, email, phone, notes }) {
    const subject = `[${requesterName || companyName} has requested a media kit]`;
    const html = baseLayout(subject, 'Media Kit Request', `
      <p class="label">Ad Programs Lead</p>
      <h2>A new media kit request has been submitted</h2>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">First Name</span><span class="info-value">${requesterName || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Company</span><span class="info-value">${companyName || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${email}</span></div>
        ${phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${phone}</span></div>` : ''}
      </div>
      ${notes ? `<div class="message-box"><p>${notes}</p></div>` : ''}
    `);
    return { subject, html };
  },

  mediaKitRequestConfirmation({ requesterName, requestType, companyName, supportUrl }) {
    const normalizedType = requestType === 'support' ? 'Partner / Support' : 'Media Kit';
    const subject = `Forestry Equipment Sales ${normalizedType} request received`;
    const html = baseLayout(subject, 'Request Received', `
      <p class="label">Ad Programs</p>
      <h2>We received your ${normalizedType.toLowerCase()} request</h2>
      <p>Hi <strong>${requesterName}</strong>,</p>
      <p>Thanks for reaching out to Forestry Equipment Sales. Our team has your ${normalizedType.toLowerCase()} request and will follow up with the right next step.</p>
      ${renderInfoPanel([
        { label: 'Request Type', value: normalizedType },
        { label: 'Company', value: companyName || 'Not provided' },
        { label: 'Response Window', value: 'Typically within 1 business day' },
      ])}
      <a href="${supportUrl}" class="cta">View Ad Programs</a>
    `);
    return { subject, html };
  },

  financingRequestConfirmation({ applicantName, requestedAmount, company, dashboardUrl }) {
    const normalizedAmount = typeof requestedAmount === 'number'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(requestedAmount)
      : String(requestedAmount || 'Not provided');
    const subject = 'Forestry Equipment Sales financing request received';
    const html = baseLayout(subject, 'Financing Request Received', `
      <p class="label">Financing Center</p>
      <h2>Your financing request is in review</h2>
      <p>Hi <strong>${applicantName}</strong>,</p>
      <p>We received your financing request and routed it to the Forestry Equipment Sales financing team for review.</p>
      ${renderInfoPanel([
        { label: 'Requested Amount', value: normalizedAmount },
        { label: 'Company', value: company || 'Not provided' },
        { label: 'Status', value: 'Received' },
      ])}
      <p>A specialist will contact you after the initial review.</p>
      <a href="${dashboardUrl}" class="cta">View Financing Dashboard</a>
    `);
    return { subject, html };
  },

  contactRequestConfirmation({ name, category, supportUrl }) {
    const subject = 'Forestry Equipment Sales contact request received';
    const html = baseLayout(subject, 'Contact Request Received', `
      <p class="label">Contact Center</p>
      <h2>Your message is with our team</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thanks for contacting Forestry Equipment Sales. We received your message and routed it to the correct team.</p>
      ${renderInfoPanel([
        { label: 'Category', value: category || 'General Support' },
        { label: 'Status', value: 'Received' },
        { label: 'Response Window', value: 'Typically within 24 hours' },
      ])}
      <a href="${supportUrl}" class="cta">Visit Forestry Equipment Sales</a>
    `);
    return { subject, html };
  },

  subscriptionCreated({ displayName, planName }) {
    const subject = 'You\'ve Subscribed to Forestry Equipment Sales';
    const html = baseLayout(subject, 'Subscription Confirmed', `
      <p class="label">Seller Plan</p>
      <h2>Welcome to Forestry Equipment Sales subscriptions</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Your <span class="badge success-badge">${planName}</span> plan has been created successfully. Your account is now set up to publish and manage seller listings inside Forestry Equipment Sales.</p>
      <a href="${PROFILE_URL}" class="cta">Manage Subscription</a>
    `);
    return { subject, html };
  },

  newMatchingListing({ displayName, searchName, listingTitle, listingUrl, listingPrice, location }) {
    const subject = `New Forestry Equipment Sales Match: ${listingTitle}`;
    const html = baseLayout(subject, 'New Matching Equipment', `
      <p class="label">Saved Search Match</p>
      <h2>A new listing matches your saved search</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>We found a new listing that matches your saved search <span class="badge">${searchName}</span>.</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Listing</span><span class="info-value">${listingTitle}</span></div>
        <div class="info-row"><span class="info-label">Price</span><span class="info-value">${listingPrice}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">${location}</span></div>
      </div>
      <a href="${listingUrl}" class="cta">View Matching Listing</a>
    `);
    return { subject, html };
  },

  matchingListingPriceDrop({ displayName, searchName, listingTitle, listingUrl, previousPrice, currentPrice, location }) {
    const subject = `Price Drop Alert: ${listingTitle}`;
    const html = baseLayout(subject, 'Price Drop Alert', `
      <p class="label">Saved Search Match</p>
      <h2>A listing in your saved search just dropped in price</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p><strong>${listingTitle}</strong> matched your saved search <span class="badge">${searchName}</span> and now has a lower asking price.</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Listing</span><span class="info-value">${listingTitle}</span></div>
        <div class="info-row"><span class="info-label">Previous Price</span><span class="info-value">${previousPrice}</span></div>
        <div class="info-row"><span class="info-label">Current Price</span><span class="info-value">${currentPrice}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">${location}</span></div>
      </div>
      <a href="${listingUrl}" class="cta">Review Price Drop</a>
    `);
    return { subject, html };
  },

  matchingListingSold({ displayName, searchName, listingTitle, listingUrl, location }) {
    const subject = `Sold Alert: ${listingTitle}`;
    const html = baseLayout(subject, 'Listing Sold Alert', `
      <p class="label">Saved Search Match</p>
      <h2>A listing in your saved search has sold</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p><strong>${listingTitle}</strong>, which matched your saved search <span class="badge">${searchName}</span>, has been marked sold.</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Listing</span><span class="info-value">${listingTitle}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">${location}</span></div>
      </div>
      <a href="${listingUrl}" class="cta">View Listing</a>
    `);
    return { subject, html };
  },

  similarListingRestocked({ displayName, searchName, listingTitle, listingUrl, listingPrice, location }) {
    const subject = `Similar Equipment Back In Stock: ${listingTitle}`;
    const html = baseLayout(subject, 'Similar Equipment Restocked', `
      <p class="label">Saved Search Match</p>
      <h2>Similar equipment is back in stock</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>We found a new listing similar to your saved search <span class="badge">${searchName}</span>. It did not qualify as an exact match, but it is close enough that you may want to review it.</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Listing</span><span class="info-value">${listingTitle}</span></div>
        <div class="info-row"><span class="info-label">Price</span><span class="info-value">${listingPrice}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">${location}</span></div>
      </div>
      <a href="${listingUrl}" class="cta">View Similar Listing</a>
    `);
    return { subject, html };
  },

  managedAccountInvite({ displayName, inviterName, email, role, company, temporaryPassword, loginUrl, resetLink }) {
    const formattedRole = String(role || 'buyer')
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    const subject = 'Your Forestry Equipment Sales team account is ready';
    const html = baseLayout(subject, 'Team Account Invitation', `
      <p class="label">Managed Account</p>
      <h2>Your Forestry Equipment Sales seat has been created</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p><strong>${inviterName}</strong> created a Forestry Equipment Sales team account for you${company ? ` under <strong>${company}</strong>` : ''}.</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${email}</span></div>
        <div class="info-row"><span class="info-label">Role</span><span class="info-value">${formattedRole || 'Buyer'}</span></div>
        <div class="info-row"><span class="info-label">Temporary Password</span><span class="info-value">${temporaryPassword}</span></div>
      </div>
      <p>Click the login link below, sign in with the temporary password, then reset your password from the reset link or the "Forgot Password" flow on the login screen.</p>
      <a href="${loginUrl}" class="cta">Open Login</a>
      <a href="${resetLink}" class="cta" style="background:#ffffff; border:1px solid #4f8f3a; color:#2f6f2d; margin-left:12px;">Reset Password</a>
      <hr class="divider" />
      <p style="font-size:12px; color:#666;">For security, change the temporary password as soon as you sign in.</p>
    `);
    return { subject, html };
  },

  adminInquiryAlert({ inquiryType, buyerName, buyerEmail, buyerPhone, listingTitle, listingUrl, message, sellerUid }) {
    const subject = `New ${inquiryType || 'Inquiry'} Lead: ${listingTitle}`;
    const html = baseLayout(subject, 'New Lead For Admin', `
      <p class="label">Lead Intake</p>
      <h2>A buyer submitted a new ${inquiryType || 'inquiry'} request</h2>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Type</span><span class="info-value">${inquiryType || 'Inquiry'}</span></div>
        <div class="info-row"><span class="info-label">Buyer Name</span><span class="info-value">${buyerName || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Buyer Email</span><span class="info-value">${buyerEmail || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Buyer Phone</span><span class="info-value">${buyerPhone || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Listing</span><span class="info-value">${listingTitle || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Seller UID</span><span class="info-value">${sellerUid || 'N/A'}</span></div>
      </div>
      ${message ? `<div class="message-box"><p>${message}</p></div>` : ''}
      <a href="${listingUrl}" class="cta">Open Listing</a>
    `);
    return { subject, html };
  },

  financingRequestAdmin({ applicantName, applicantEmail, applicantPhone, company, requestedAmount, listingId, message }) {
    const subject = `New Financing Request: ${applicantName || applicantEmail || 'Unknown applicant'}`;
    const html = baseLayout(subject, 'Financing Request', `
      <p class="label">Financing Lead</p>
      <h2>A financing request has been submitted</h2>
      ${renderInfoPanel([
        { label: 'Name', value: applicantName || 'N/A' },
        { label: 'Email', value: applicantEmail || 'N/A' },
        { label: 'Phone', value: applicantPhone || 'N/A' },
        { label: 'Company', value: company || 'N/A' },
        { label: 'Requested Amount', value: requestedAmount ? requestedAmount.toLocaleString() : 'N/A' },
        { label: 'Listing ID', value: listingId || 'N/A' },
      ])}
      ${message ? `<div class="message-box"><p>${message}</p></div>` : ''}
    `);
    return { subject, html };
  },

  contactRequestAdmin({ name, email, category, message, source }) {
    const subject = `New Contact Request: ${name || email || 'Unknown contact'}`;
    const html = baseLayout(subject, 'Contact Request', `
      <p class="label">Website Contact Form</p>
      <h2>A new contact form submission was received</h2>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Name</span><span class="info-value">${name || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${email || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Category</span><span class="info-value">${category || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Source</span><span class="info-value">${source || 'contact-page'}</span></div>
      </div>
      ${message ? `<div class="message-box"><p>${message}</p></div>` : ''}
    `);
    return { subject, html };
  },

  dealerMonthlyReport({ sellerName, monthLabel, totalListings, leadForms, callButtonClicks, connectedCalls, qualifiedCalls, missedCalls, totalViews, topMachines, dashboardUrl }) {
    const subject = `Your ${monthLabel} Forestry Equipment Sales Performance Report`;
    const topMachinesHtml = Array.isArray(topMachines) && topMachines.length > 0
      ? `<table style="width:100%; border-collapse:collapse; margin:16px 0;">
          <tr style="background:#f8fafc;">
            <th style="text-align:left; padding:8px 12px; font-size:11px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Machine</th>
            <th style="text-align:right; padding:8px 12px; font-size:11px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Inquiries</th>
            <th style="text-align:right; padding:8px 12px; font-size:11px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Calls</th>
            <th style="text-align:right; padding:8px 12px; font-size:11px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Views</th>
          </tr>
          ${topMachines.map((m) => `<tr><td style="padding:8px 12px; font-size:13px; color:#111827; border-bottom:1px solid #f3f4f6;">${m.title || 'Untitled'}</td><td style="text-align:right; padding:8px 12px; font-size:13px; font-weight:700; color:#2f6f2d; border-bottom:1px solid #f3f4f6;">${m.inquiryCount ?? m.count ?? 0}</td><td style="text-align:right; padding:8px 12px; font-size:13px; font-weight:700; color:#111827; border-bottom:1px solid #f3f4f6;">${m.callCount ?? 0}</td><td style="text-align:right; padding:8px 12px; font-size:13px; font-weight:700; color:#111827; border-bottom:1px solid #f3f4f6;">${m.viewCount ?? 0}</td></tr>`).join('')}
        </table>`
      : '<p style="color:#6b7280; font-size:13px;">No inquiries recorded this period.</p>';

    const html = baseLayout(subject, `${monthLabel} Performance Report`, `
      <p class="label">Monthly Dealer Report</p>
      <h2>Here's how your listings performed</h2>
      <p>Hi <strong>${sellerName}</strong>,</p>
      <p>Below is your performance summary for <strong>${monthLabel}</strong> on Forestry Equipment Sales.</p>

      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:2px; padding:20px; margin:20px 0;">
        <div class="info-row"><span class="info-label">Active Listings</span><span class="info-value">${totalListings}</span></div>
        <div class="info-row"><span class="info-label">Lead Forms</span><span class="info-value">${leadForms}</span></div>
        <div class="info-row"><span class="info-label">Call Button Clicks</span><span class="info-value">${callButtonClicks}</span></div>
        <div class="info-row"><span class="info-label">Connected Calls</span><span class="info-value">${connectedCalls}</span></div>
        <div class="info-row"><span class="info-label">Qualified Calls (60s+)</span><span class="info-value">${qualifiedCalls}</span></div>
        <div class="info-row"><span class="info-label">Missed Calls</span><span class="info-value">${missedCalls}</span></div>
        <div class="info-row"><span class="info-label">Listing Views</span><span class="info-value">${totalViews || 0}</span></div>
      </div>

      <h2>Top Machines by Inquiry Volume</h2>
      ${topMachinesHtml}

      <hr class="divider" />
      <p>These rolling 30-day totals combine listing views, inquiry submissions, and tracked calls. For questions about your report, contact the Forestry Equipment Sales team.</p>
      <a href="${dashboardUrl || PROFILE_URL}" class="cta">Open Seller Dashboard</a>
    `);
    return { subject, html };
  },

  dealerMonthlyReportAdminSummary({ monthLabel, sellerSummaries, dashboardUrl }) {
    const tableRows = Array.isArray(sellerSummaries)
      ? sellerSummaries.map((s) => `<tr>
          <td style="padding:6px 10px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6;">${s.name}</td>
          <td style="text-align:right; padding:6px 10px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6;">${s.listings}</td>
          <td style="text-align:right; padding:6px 10px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6;">${s.leads}</td>
          <td style="text-align:right; padding:6px 10px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6;">${s.calls}</td>
          <td style="text-align:right; padding:6px 10px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6;">${s.qualifiedCalls}</td>
          <td style="text-align:right; padding:6px 10px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6;">${s.totalViews ?? 0}</td>
        </tr>`).join('')
      : '';

    const subject = `${monthLabel} Marketplace Performance Summary`;
    const html = baseLayout(subject, `${monthLabel} Admin Summary`, `
      <p class="label">Monthly Admin Report</p>
      <h2>Consolidated seller performance for ${monthLabel}</h2>
      <p>This report summarizes all seller activity across the Forestry Equipment Sales marketplace.</p>

      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr style="background:#f8fafc;">
          <th style="text-align:left; padding:8px 10px; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Seller</th>
          <th style="text-align:right; padding:8px 10px; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Listings</th>
          <th style="text-align:right; padding:8px 10px; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Leads</th>
          <th style="text-align:right; padding:8px 10px; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Calls</th>
          <th style="text-align:right; padding:8px 10px; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Qualified</th>
          <th style="text-align:right; padding:8px 10px; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb;">Views</th>
        </tr>
        ${tableRows}
      </table>

      <a href="${dashboardUrl || ADMIN_URL}" class="cta">Open Admin Dashboard</a>
    `);
    return { subject, html };
  },

  auctionBidderRegistered({ displayName, auctionTitle, auctionUrl }) {
    const subject = `You are registered for ${auctionTitle}`;
    const html = baseLayout(subject, 'Auction Registration Confirmed', `
      <p class="label">Auction Registration</p>
      <h2>Your bidder profile is saved</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Your bidder profile has been saved for <strong>${auctionTitle}</strong>. Complete identity verification and add a payment method to unlock live bidding.</p>
      ${renderInfoPanel([
        { label: 'Auction', value: auctionTitle },
        { label: 'Next Step', value: 'Verify ID and add payment method' },
      ])}
      <a href="${auctionUrl}" class="cta">Open Auction</a>
    `);
    return { subject, html };
  },

  auctionIdentitySubmitted({ displayName, auctionTitle, auctionUrl }) {
    const subject = `ID verification received for ${auctionTitle}`;
    const html = baseLayout(subject, 'Identity Verification Received', `
      <p class="label">Auction Verification</p>
      <h2>Your identity review is in progress</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>We received your identity submission for <strong>${auctionTitle}</strong>. Once Stripe finishes verification and your payment method is on file, your bidder profile will be approved automatically.</p>
      <a href="${auctionUrl}" class="cta">Return to Auction</a>
    `);
    return { subject, html };
  },

  auctionBidderApproved({ displayName, auctionTitle, auctionUrl }) {
    const subject = `You are approved to bid in ${auctionTitle}`;
    const html = baseLayout(subject, 'Approved To Bid', `
      <p class="label">Bidder Approved</p>
      <h2>Your auction access is active</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Your bidder profile is approved for <strong>${auctionTitle}</strong>. You can now place bids on active lots.</p>
      <a href="${auctionUrl}" class="cta">Start Bidding</a>
    `);
    return { subject, html };
  },

  auctionOutbid({ displayName, auctionTitle, lotTitle, bidAmount, lotUrl }) {
    const subject = `You were outbid on ${lotTitle}`;
    const html = baseLayout(subject, 'You Were Outbid', `
      <p class="label">Auction Alert</p>
      <h2>Your lead bid has been surpassed</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Another bidder has placed a higher bid on <strong>${lotTitle}</strong> in <strong>${auctionTitle}</strong>.</p>
      ${renderInfoPanel([
        { label: 'Lot', value: lotTitle },
        { label: 'Latest Bid', value: bidAmount },
      ])}
      <a href="${lotUrl}" class="cta">Review Lot</a>
    `);
    return { subject, html };
  },

  auctionWinningBid({ displayName, auctionTitle, lotTitle, hammerPrice, invoiceUrl }) {
    const subject = `Winning bid confirmed for ${lotTitle}`;
    const html = baseLayout(subject, 'Winning Bid Confirmed', `
      <p class="label">Auction Winner</p>
      <h2>You won the lot</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Your bid won <strong>${lotTitle}</strong> in <strong>${auctionTitle}</strong>.</p>
      ${renderInfoPanel([
        { label: 'Hammer Price', value: hammerPrice },
        { label: 'Payment Terms', value: 'Payment due within 7 calendar days' },
      ])}
      <div class="panel">
        <p><strong>Important:</strong> Buyer’s fees, titled document fees, card fees, tax, wire instructions, storage, and removal deadlines are listed with your invoice and auction terms.</p>
      </div>
      <a href="${invoiceUrl}" class="cta">View Invoice Details</a>
    `);
    return { subject, html };
  },

  auctionDownPaymentReceipt({ displayName, invoiceNumber, amountPaid, invoiceUrl }) {
    const subject = `Auction payment receipt ${invoiceNumber}`;
    const html = baseLayout(subject, 'Auction Payment Receipt', `
      <p class="label">Payment Receipt</p>
      <h2>Your payment was received</h2>
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>We received your auction payment and updated your invoice record.</p>
      ${renderInfoPanel([
        { label: 'Invoice', value: invoiceNumber },
        { label: 'Amount Paid', value: amountPaid },
      ])}
      <a href="${invoiceUrl}" class="cta">Review Auction Purchase</a>
    `);
    return { subject, html };
  },
};

module.exports = {
  EMAIL_PREFERENCE_FOOTER_MARKER,
  renderEmailPreferenceFooter,
  templates,
  withEmailPreferenceFooter,
};
