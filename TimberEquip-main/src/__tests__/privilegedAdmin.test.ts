import { describe, it, expect } from 'vitest';
import { isPrivilegedAdminEmail, SUPERADMIN_EMAIL, PRIVILEGED_ADMIN_EMAILS } from '../utils/privilegedAdmin';

describe('isPrivilegedAdminEmail', () => {
  it('returns true for known admin email', () => {
    expect(isPrivilegedAdminEmail('caleb@forestryequipmentsales.com')).toBe(true);
  });

  it('returns true for second known admin email', () => {
    expect(isPrivilegedAdminEmail('calebhappy@gmail.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isPrivilegedAdminEmail('CALEB@FORESTRYEQUIPMENTSALES.COM')).toBe(true);
    expect(isPrivilegedAdminEmail('CalebHappy@Gmail.com')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(isPrivilegedAdminEmail('  caleb@forestryequipmentsales.com  ')).toBe(true);
  });

  it('returns false for unknown email', () => {
    expect(isPrivilegedAdminEmail('random@example.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isPrivilegedAdminEmail('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPrivilegedAdminEmail(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPrivilegedAdminEmail(undefined)).toBe(false);
  });
});

describe('SUPERADMIN_EMAIL', () => {
  it('is defined', () => {
    expect(SUPERADMIN_EMAIL).toBeDefined();
  });

  it('matches first privileged email', () => {
    expect(SUPERADMIN_EMAIL).toBe(PRIVILEGED_ADMIN_EMAILS[0]);
  });

  it('is a non-empty string', () => {
    expect(typeof SUPERADMIN_EMAIL).toBe('string');
    expect(SUPERADMIN_EMAIL.length).toBeGreaterThan(0);
  });
});
