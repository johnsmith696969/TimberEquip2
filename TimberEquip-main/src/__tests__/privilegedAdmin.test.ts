import { describe, it, expect } from 'vitest';
import { isPrivilegedAdminEmail, SUPERADMIN_EMAIL, PRIVILEGED_ADMIN_EMAILS } from '../utils/privilegedAdmin';

describe('isPrivilegedAdminEmail', () => {
  // After security hardening, isPrivilegedAdminEmail always returns false.
  // Admin detection is now server-side only via Firebase custom claims.

  it('returns false for any email (deprecated - admin detection is server-side)', () => {
    expect(isPrivilegedAdminEmail('caleb@timberequip.com')).toBe(false);
    expect(isPrivilegedAdminEmail('admin@example.com')).toBe(false);
    expect(isPrivilegedAdminEmail('random@example.com')).toBe(false);
  });

  it('returns false for empty/null/undefined', () => {
    expect(isPrivilegedAdminEmail('')).toBe(false);
    expect(isPrivilegedAdminEmail(null)).toBe(false);
    expect(isPrivilegedAdminEmail(undefined)).toBe(false);
  });
});

describe('SUPERADMIN_EMAIL', () => {
  it('is a string sourced from environment (empty in test context)', () => {
    expect(typeof SUPERADMIN_EMAIL).toBe('string');
  });
});

describe('PRIVILEGED_ADMIN_EMAILS', () => {
  it('is an empty array (admin emails are no longer exposed client-side)', () => {
    expect(PRIVILEGED_ADMIN_EMAILS).toEqual([]);
  });
});
