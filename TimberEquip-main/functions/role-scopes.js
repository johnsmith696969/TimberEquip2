function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeScopedUserRole(role) {
  const normalized = normalize(role);
  if (normalized === 'dealer_staff') return 'dealer';
  if (normalized === 'dealer_manager') return 'pro_dealer';
  if (normalized === 'buyer') return 'member';
  return normalized;
}

const OPERATOR_ONLY_ROLES = new Set([
  'super_admin',
  'admin',
  'developer',
  'content_manager',
  'editor',
]);

const SELLER_ROLES = new Set([
  'individual_seller',
  'dealer',
  'pro_dealer',
]);

const DEALER_SELLER_ROLES = new Set([
  'dealer',
  'pro_dealer',
]);

function isOperatorOnlyRole(role) {
  return OPERATOR_ONLY_ROLES.has(normalizeScopedUserRole(role));
}

function isSellerRole(role) {
  return SELLER_ROLES.has(normalizeScopedUserRole(role));
}

function isDealerSellerRole(role) {
  return DEALER_SELLER_ROLES.has(normalizeScopedUserRole(role));
}

function supportsStorefrontRole(role) {
  return isSellerRole(role);
}

function supportsDealerOsRole(role) {
  return isDealerSellerRole(role);
}

module.exports = {
  normalizeScopedUserRole,
  isOperatorOnlyRole,
  isSellerRole,
  isDealerSellerRole,
  supportsStorefrontRole,
  supportsDealerOsRole,
};
