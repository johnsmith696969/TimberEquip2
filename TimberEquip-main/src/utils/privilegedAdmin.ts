const PRIVILEGED_ADMIN_EMAILS = [
  'caleb@forestryequipmentsales.com',
  'calebhappy@gmail.com',
] as const;

const PRIVILEGED_ADMIN_EMAIL_SET = new Set(
  PRIVILEGED_ADMIN_EMAILS.map((email) => email.trim().toLowerCase())
);

export { PRIVILEGED_ADMIN_EMAILS };

export const SUPERADMIN_EMAIL: string = PRIVILEGED_ADMIN_EMAILS[0];

export function isPrivilegedAdminEmail(email?: string | null): boolean {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.length > 0 && PRIVILEGED_ADMIN_EMAIL_SET.has(normalized);
}
