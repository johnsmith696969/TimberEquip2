#!/usr/bin/env bash

set -euo pipefail

# TimberEquip runtime secrets bootstrap template.
#
# Usage:
# 1. Copy this file to a local private file that is NOT committed.
# 2. Replace every placeholder value below.
# 3. Run it from the repo root:
#    bash ./scripts/set-runtime-secrets.local.sh

PROJECT_ID="mobile-app-equipment-sales"

# Stripe
STRIPE_SECRET_KEY_VALUE="REPLACE_WITH_STRIPE_SECRET_KEY"
STRIPE_WEBHOOK_SECRET_VALUE="REPLACE_WITH_STRIPE_WEBHOOK_SECRET"

# SendGrid / email
SENDGRID_API_KEY_VALUE="REPLACE_WITH_SENDGRID_API_KEY"
EMAIL_FROM_VALUE="REPLACE_WITH_SENDER_EMAIL"
ADMIN_EMAILS_VALUE="REPLACE_WITH_ADMIN_EMAILS"

set_secret() {
  local name="$1"
  local value="$2"

  if [[ -z "$value" || "$value" == REPLACE_WITH_* ]]; then
    echo "Secret $name is still using a placeholder value." >&2
    exit 1
  fi

  printf '%s' "$value" | npx firebase-tools functions:secrets:set "$name" --project "$PROJECT_ID"
}

set_secret "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY_VALUE"
set_secret "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET_VALUE"
set_secret "SENDGRID_API_KEY" "$SENDGRID_API_KEY_VALUE"
set_secret "EMAIL_FROM" "$EMAIL_FROM_VALUE"
set_secret "ADMIN_EMAILS" "$ADMIN_EMAILS_VALUE"

echo
echo "Secrets updated. Next steps:"
echo "  1. npx firebase-tools deploy --only firestore --project $PROJECT_ID"
echo "  2. npx firebase-tools deploy --only functions --project $PROJECT_ID"
echo "  3. npx firebase-tools deploy --only hosting --project $PROJECT_ID"
