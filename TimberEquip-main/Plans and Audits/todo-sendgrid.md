# SendGrid Cutover Todo

This file captures what is already finished for TimberEquip, plus the exact remaining steps to finalize SendGrid tomorrow when the permanent API key and sender identity are ready.

## Completed Today

- Synced all dynamic transactional templates into SendGrid from code.
- Created `30` dynamic templates in the SendGrid account.
- Saved the SendGrid template ID manifest in [sendgrid-template-manifest.json](./sendgrid-template-manifest.json).
- Updated the email template code and sync script to use TimberEquip branding and the new domain path by default.
- Added a reusable sync command: `npm run sendgrid:templates:sync`.
- Updated SendGrid secret examples to TimberEquip defaults.

## Remaining Tomorrow

1. Finalize sender identity or sender authentication in SendGrid.
For staging now, use `caleb@timberequip.com`.
Later, once inboxes are live, switch production sending/reply addresses to `info@timberequip.com`, `support@timberequip.com`, and `legal@timberequip.com` as appropriate.

2. Create the SendGrid API key.
Recommended name: `forestry-equipment-sales-mailer`.

3. Choose API key scope strategy.
If this key is only for app sending, `Mail Send` is enough.
If you also want to rerun template syncs with the same key, give it `Mail Send` plus `Templates` read/write access.

4. Set Firebase Functions secrets.
Use these staging-safe values first:

```bash
printf '%s' 'REPLACE_WITH_SENDGRID_API_KEY' | npx firebase-tools functions:secrets:set SENDGRID_API_KEY --project mobile-app-equipment-sales
printf '%s' 'TimberEquip <caleb@timberequip.com>' | npx firebase-tools functions:secrets:set EMAIL_FROM --project mobile-app-equipment-sales
printf '%s' 'calebhappy@gmail.com,caleb@timberequip.com' | npx firebase-tools functions:secrets:set ADMIN_EMAILS --project mobile-app-equipment-sales
```

5. Deploy functions after secrets are updated.

```bash
npx firebase-tools deploy --only functions --project mobile-app-equipment-sales
```

6. Optional but recommended: rerun template sync once with the permanent API key.

```bash
$env:SENDGRID_API_KEY='REPLACE_WITH_SENDGRID_API_KEY'
$env:SENDGRID_APP_URL='https://www.timberequip.com'
npm run sendgrid:templates:sync
```

## Important Notes

- SendGrid still shows the account banner saying a sender identity must be created before sending the first email. That was not finalized today because sender verification and business address details should be confirmed deliberately.
- The dynamic template IDs are already saved in [sendgrid-template-manifest.json](./sendgrid-template-manifest.json).
- The sync script now supports either:
  - `SENDGRID_API_KEY` for normal long-term use
  - `SENDGRID_AUTH_HEADER` for an authenticated browser-session sync
- The email code now defaults to TimberEquip branding and `caleb@timberequip.com` as the temporary sender/reply fallback.

## Files Updated

- [functions/email-templates/index.js](./functions/email-templates/index.js)
- [functions/index.js](./functions/index.js)
- [scripts/sync-sendgrid-templates.mjs](./scripts/sync-sendgrid-templates.mjs)
- [scripts/set-runtime-secrets.example.sh](./scripts/set-runtime-secrets.example.sh)
- [package.json](./package.json)
