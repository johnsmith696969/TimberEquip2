#!/usr/bin/env node

/**
 * Test Email System - Sends test emails through all templates
 * Requires Firebase CLI authentication
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email templates
const TEMPLATES = [
  'adminInquiryAlert',
  'contactRequestAdmin',
  'contactRequestConfirmation',
  'financingRequestAdmin',
  'financingRequestConfirmation',
  'inquiryConfirmation',
  'invoicePaidReceipt',
  'leadNotification',
  'listingApproved',
  'listingRejected',
  'listingSubmitted',
  'managedAccountInvite',
  'matchingListingPriceDrop',
  'matchingListingSold',
  'mediaKitRequest',
  'mediaKitRequestConfirmation',
  'newMatchingListing',
  'similarListingRestocked',
  'subscriptionCreated',
  'subscriptionExpired',
  'subscriptionExpiring',
  'welcomeVerification',
];

// Get test email from command line args or use default
const testEmail = process.argv[2] || 'caleb@forestryequipmentsales.com';

console.log(`\n🧪 Forestry Equipment Sales Email System Test`);
console.log(`═══════════════════════════════════════`);
console.log(`📧 Test Email: ${testEmail}`);
console.log(`📋 Templates to Test: ${TEMPLATES.length}`);
console.log(`\nLoad Firebase CLI config...`);

// Try to get Firebase CLI auth token
const cliConfigPath = path.join(
  process.env.HOME || '/home/codespace',
  '.config/configstore/firebase-tools.json'
);

let authToken = null;
try {
  if (fs.existsSync(cliConfigPath)) {
    const config = JSON.parse(fs.readFileSync(cliConfigPath, 'utf8'));
    
    // Try direct access_token (new format)
    if (config.tokens && config.tokens.access_token) {
      authToken = config.tokens.access_token;
      console.log(`✅ Found Firebase access token`);
    } 
    // Try per-account format (old format)
    else if (config.activeAccount && config.tokens && config.tokens[config.activeAccount]) {
      const userTokens = config.tokens[config.activeAccount];
      if (userTokens.idToken) {
        authToken = userTokens.idToken;
        console.log(`✅ Found Firebase CLI auth token for: ${config.activeAccount}`);
      }
    }
  }
} catch (e) {
  console.log(`⚠️  Could not read Firebase CLI config: ${e.message}`);
}

if (!authToken) {
  console.log(`\n❌ Auth Error: Firebase CLI token not found`);
  console.log(`\nPlease authenticate first:`);
  console.log(`  firebase login`);
  process.exit(1);
}

// Make test request
const requestBody = {
  templates: TEMPLATES,
  recipients: [testEmail],
};

const postData = JSON.stringify(requestBody);

const options = {
  hostname: 'apiproxy-m24w4vlfuq-uc.a.run.app',
  port: 443,
  path: '/admin/email/test-send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${authToken}`,
  },
};

console.log(`\n📤 Sending test email request...`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n✅ Response Status: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.log(`❌ Error: ${response.error}`);
        process.exit(1);
      }

      // Display results
      if (response.results && Array.isArray(response.results)) {
        const sentCount = response.results.filter(r => r.status === 'sent').length;
        const failedCount = response.results.filter(r => r.status === 'failed').length;
        const unsupportedCount = response.results.filter(r => r.status === 'unsupported').length;

        console.log(`📊 Test Results Summary`);
        console.log(`─────────────────────────────────────`);
        console.log(`✅ Sent: ${sentCount}/${TEMPLATES.length}`);
        if (failedCount > 0) console.log(`❌ Failed: ${failedCount}`);
        if (unsupportedCount > 0) console.log(`⚠️  Unsupported: ${unsupportedCount}`);

        if (sentCount > 0) {
          console.log(`\n✅ Successfully Sent Templates:`);
          response.results
            .filter(r => r.status === 'sent')
            .forEach((result, i) => {
              console.log(`   ${i + 1}. ${result.template}`);
              if (result.subject) console.log(`      → "${result.subject}"`);
            });
        }

        if (failedCount > 0) {
          console.log(`\n❌ Failed Templates:`);
          response.results
            .filter(r => r.status === 'failed')
            .forEach((result, i) => {
              console.log(`   ${i + 1}. ${result.template}: ${result.error}`);
            });
        }

        console.log(`\n${'═'.repeat(40)}`);
        console.log(`✅ Test Complete! Check ${testEmail} for emails.`);
        console.log(`   (Some may be caught by spam filters or batched)\n`);

        process.exit(sentCount === TEMPLATES.length ? 0 : 1);
      } else {
        console.log('Response:', response);
        process.exit(1);
      }
    } catch (e) {
      console.log(`Parse Error: ${e.message}`);
      console.log('Raw Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.log(`❌ Request Error: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
