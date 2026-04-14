export const OPERATOR_ONLY_ROLES = new Set([
  'super_admin',
  'admin',
  'developer',
  'content_manager',
  'editor',
]);

export const SELLER_ROLES = new Set([
  'individual_seller',
  'dealer',
  'pro_dealer',
]);

export const DEALER_SELLER_ROLES = new Set([
  'dealer',
  'pro_dealer',
]);

export function normalizeScopedUserRole(role?: string | null): string {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'dealer_staff') return 'dealer';
  if (normalized === 'dealer_manager') return 'pro_dealer';
  if (normalized === 'buyer') return 'member';
  return normalized;
}

export function isOperatorOnlyRole(role?: string | null): boolean {
  return OPERATOR_ONLY_ROLES.has(normalizeScopedUserRole(role));
}

export function isSellerRole(role?: string | null): boolean {
  return SELLER_ROLES.has(normalizeScopedUserRole(role));
}

export function isDealerSellerRole(role?: string | null): boolean {
  return DEALER_SELLER_ROLES.has(normalizeScopedUserRole(role));
}

export function supportsStorefrontRole(role?: string | null): boolean {
  return isSellerRole(role);
}

export function supportsDealerOsRole(role?: string | null): boolean {
  return isDealerSellerRole(role);
}
