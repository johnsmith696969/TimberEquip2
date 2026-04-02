/**
 * @deprecated Admin detection is now server-side only via Firebase custom claims.
 * Do not add client-side email checks. All callers should use user.role from AuthContext.
 */
export const PRIVILEGED_ADMIN_EMAILS = [] as const;

export const SUPERADMIN_EMAIL: string = 'caleb@forestryequipmentsales.com';

/** @deprecated Always returns false. Admin status comes from server-side custom claims. */
export function isPrivilegedAdminEmail(_email?: string | null): boolean {
  return false;
}
