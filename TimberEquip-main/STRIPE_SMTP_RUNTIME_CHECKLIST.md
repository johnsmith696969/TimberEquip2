# Stripe And SendGrid Runtime Checklist

Audit date: 2026-03-25

This checklist is for the live Firebase Functions deployment used by TimberEquip.

## Scope

Runtime systems covered here:

- Stripe checkout and webhook handling in `functions/index.js`
- SendGrid API email delivery for inquiry, financing, media kit, contact, welcome, and billing notifications
- Firestore rules deploy targeting for the named Firestore database used by the app

## Active Runtime Assumptions

- Functions are deployed from `functions/index.js`
- The app uses the named Firestore database `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c`
- The primary backend entrypoint is the Gen 2 HTTPS function `apiProxy`

## Required Firebase Function Secrets

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Expected values:

- `STRIPE_SECRET_KEY`: live or test secret key starting with `sk_`
- `STRIPE_WEBHOOK_SECRET`: webhook signing secret starting with `whsec_`

Rules:

- Do not wrap values in quotes
- Do not paste leading or trailing spaces
- Use the secret that matches the same Stripe mode as the checkout price IDs

### SendGrid

- `SENDGRID_API_KEY`
- `EMAIL_FROM`
- `ADMIN_EMAILS`

Recommended values:

- `SENDGRID_API_KEY`: SendGrid API key with Mail Send permission
- `EMAIL_FROM`: verified SendGrid sender identity such as `TimberEquip <support@timberequip.com>`
- `ADMIN_EMAILS`: comma-separated admin inboxes such as `support@timberequip.com,calebhappy@gmail.com`

Rules:

- Do not wrap values in quotes
- Do not add spaces before or after the full secret value
- `EMAIL_FROM` must be a verified sender identity in SendGrid
- The SendGrid API key ID is not used by the codebase; only the actual API key value is needed

## Commands To Set Or Rotate Secrets

Run from the repo root.

There is also a placeholder-safe template script in [scripts/set-runtime-secrets.example.sh](/workspaces/TimberEquip2/TimberEquip-main/scripts/set-runtime-secrets.example.sh).

```bash
npx firebase-tools functions:secrets:set STRIPE_SECRET_KEY
npx firebase-tools functions:secrets:set STRIPE_WEBHOOK_SECRET

npx firebase-tools functions:secrets:set SENDGRID_API_KEY
npx firebase-tools functions:secrets:set EMAIL_FROM
npx firebase-tools functions:secrets:set ADMIN_EMAILS
```

To verify what secrets exist:

```bash
npx firebase-tools functions:secrets:access STRIPE_SECRET_KEY
npx firebase-tools functions:secrets:access STRIPE_WEBHOOK_SECRET
npx firebase-tools functions:secrets:access SENDGRID_API_KEY
npx firebase-tools functions:secrets:access EMAIL_FROM
npx firebase-tools functions:secrets:access ADMIN_EMAILS
```

Do not print sensitive values into shared logs or screenshots.

## Deploy Order

### 1. Deploy Firestore To The Named Database

The frontend and backend both use the named database `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c`.

Deploy Firestore rules and indexes after any rules change:

```bash
npx firebase-tools deploy --only firestore
```

### 2. Deploy Functions After Secret Rotation

Any time Stripe or SendGrid secrets are changed, redeploy Functions so the live revisions pick them up cleanly:

```bash
npx firebase-tools deploy --only functions
```

### 3. Deploy Hosting If Frontend Changed

```bash
npx firebase-tools deploy --only hosting
```

### 4. Safe Combined Deploy

```bash
npx firebase-tools deploy --only firestore,functions,hosting
```

## Code Paths That Consume These Secrets

### Stripe

- `createStripeClient()` in `functions/index.js`
- Webhook verification in `apiProxy` for:
  - `/api/billing/webhook`
  - `/api/webhooks/stripe`

Implementation details:

- `STRIPE_SECRET_KEY` is trimmed before Stripe client creation
- `STRIPE_WEBHOOK_SECRET` is trimmed before webhook signature verification

### SendGrid

- `sendEmail()` in `functions/index.js`
- Firestore triggers for inquiries, financing, media kit requests, contact requests, welcome emails, and saved-search notifications

Implementation details:

- `SENDGRID_API_KEY` and `EMAIL_FROM` are trimmed before use
- The backend sends through the SendGrid Web API via `@sendgrid/mail`

## Most Likely Failure Modes

### Stripe Checkout Returns 500 Or StripeConnectionError

Check:

- `STRIPE_SECRET_KEY` has no stray whitespace or quotes
- The key mode matches the configured product and price IDs
- The active deployed Functions revision includes the latest secret value

### Stripe Webhook Returns 400 Invalid Signature

Check:

- `STRIPE_WEBHOOK_SECRET` matches the exact webhook endpoint configured in Stripe
- Stripe is posting to the correct live endpoint
- The live function revision was redeployed after secret rotation

### SendGrid 401 Or 403 Delivery Errors

Check:

- `SENDGRID_API_KEY` is the actual API key value, not the key ID
- The API key has Mail Send permission
- `EMAIL_FROM` matches a verified sender identity in SendGrid
- The live function revision was redeployed after secret rotation

### Media Kit / Contact / Inquiry Writes Succeed But No Email Arrives

Check:

- Firestore writes are landing in the named database
- Function triggers are deployed and healthy
- `ADMIN_EMAILS` includes the intended inboxes
- SendGrid sender verification is valid for the configured `EMAIL_FROM`

## Post-Deploy Smoke Tests

Run these in production after deploying.

### Stripe

1. Start seller checkout from Ad Programs
2. Complete checkout in Stripe
3. Confirm redirect back to TimberEquip succeeds
4. Confirm account or listing payment state updates in Firestore
5. Confirm webhook event record is written to `webhook_events`

### SendGrid

1. Submit a listing inquiry
2. Submit a financing request
3. Submit a media kit request
4. Submit a contact request
5. Confirm seller, buyer, and admin mailboxes receive the expected messages

## Production Notes

- The backend uses Firebase Functions secrets, not `.env.local`, for live Stripe and SendGrid credentials.
- The local `server.ts` file also references Stripe env vars, but production behavior is driven by `functions/index.js` and deployed Firebase secrets.