# Firebase Form Email Forwarding Setup (Google Workspace)

This project now forwards these Firestore form collections to admin email:

- `inquiries` (seller + buyer + admin copy)
- `financingRequests` (admin email)
- `mediaKitRequests` (admin email)
- `contactRequests` (admin email)

## 1) Set SMTP secrets in Firebase (Google Workspace)

Recommended: Google Workspace SMTP with an app password account.

```bash
firebase functions:secrets:set SMTP_HOST
# value: smtp.gmail.com

firebase functions:secrets:set SMTP_PORT
# value: 587

firebase functions:secrets:set SMTP_USER
# value: support@timberequip.com

firebase functions:secrets:set SMTP_PASS
# value: <google-app-password>

firebase functions:secrets:set EMAIL_FROM
# value: TimberEquip <support@timberequip.com>

firebase functions:secrets:set ADMIN_EMAILS
# value: support@timberequip.com,calebhappy@gmail.com
```

Notes:
- Use an account in your Google Workspace domain.
- For SMTP auth with Google, create an App Password on that account.
- If your Workspace policy blocks app passwords, use SMTP relay and adjust code auth strategy.
- Do not paste surrounding quotes into secrets.
- Do not leave leading or trailing spaces in any secret value.

## 2) Deploy backend updates

```bash
npx firebase-tools deploy --only functions
```

## 3) Deploy Firestore rules (already required for `contactRequests` public create)

```bash
npx firebase-tools deploy --only firestore
```

## 4) Verify end-to-end

Submit each form once and confirm admin inbox receives mail:

- Listing inquiry form
- Listing financing form
- Ad Programs media kit/support form
- Contact page form
- Financing page form

## Current admin recipient list

Currently defined in code at `functions/index.js` as the Firebase Functions secret `ADMIN_EMAILS`.
Update that secret to your Google Workspace addresses or distribution list if needed.
