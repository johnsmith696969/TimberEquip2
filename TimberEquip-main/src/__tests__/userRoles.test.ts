import { describe, it, expect } from 'vitest';
import {
  normalizeEditableUserRole,
  getAssignableUserRoleOptions,
  getUserRoleDisplayLabel,
  EDITABLE_USER_ROLE_OPTIONS,
} from '../utils/userRoles';

describe('normalizeEditableUserRole', () => {
  it('returns buyer for buyer', () => {
    expect(normalizeEditableUserRole('buyer')).toBe('buyer');
  });

  it('maps dealer_staff to dealer', () => {
    expect(normalizeEditableUserRole('dealer_staff')).toBe('dealer');
  });

  it('maps dealer_manager to pro_dealer', () => {
    expect(normalizeEditableUserRole('dealer_manager')).toBe('pro_dealer');
  });

  it('returns buyer for unknown input', () => {
    expect(normalizeEditableUserRole('unknown_role' as any)).toBe('buyer');
  });

  it('returns buyer for null', () => {
    expect(normalizeEditableUserRole(null)).toBe('buyer');
  });

  it('returns buyer for undefined', () => {
    expect(normalizeEditableUserRole(undefined)).toBe('buyer');
  });

  it('passes through valid roles unchanged', () => {
    expect(normalizeEditableUserRole('super_admin')).toBe('super_admin');
    expect(normalizeEditableUserRole('admin')).toBe('admin');
    expect(normalizeEditableUserRole('developer')).toBe('developer');
    expect(normalizeEditableUserRole('dealer')).toBe('dealer');
    expect(normalizeEditableUserRole('pro_dealer')).toBe('pro_dealer');
    expect(normalizeEditableUserRole('individual_seller')).toBe('individual_seller');
    expect(normalizeEditableUserRole('member')).toBe('member');
    expect(normalizeEditableUserRole('content_manager')).toBe('content_manager');
    expect(normalizeEditableUserRole('editor')).toBe('editor');
  });
});

describe('getAssignableUserRoleOptions', () => {
  it('returns all roles for super_admin', () => {
    const options = getAssignableUserRoleOptions('super_admin');
    expect(options).toEqual(EDITABLE_USER_ROLE_OPTIONS);
  });

  it('excludes super_admin for admin actor', () => {
    const options = getAssignableUserRoleOptions('admin');
    expect(options.find((o) => o.value === 'super_admin')).toBeUndefined();
    expect(options.length).toBe(EDITABLE_USER_ROLE_OPTIONS.length - 1);
  });

  it('excludes super_admin for developer actor', () => {
    const options = getAssignableUserRoleOptions('developer');
    expect(options.find((o) => o.value === 'super_admin')).toBeUndefined();
  });

  it('returns only member and buyer for dealer actor', () => {
    const options = getAssignableUserRoleOptions('dealer');
    expect(options.every((o) => ['member', 'buyer'].includes(o.value))).toBe(true);
    expect(options.length).toBe(2);
  });

  it('returns empty array for buyer actor', () => {
    const options = getAssignableUserRoleOptions('buyer');
    expect(options).toEqual([]);
  });

  it('returns empty array for null', () => {
    const options = getAssignableUserRoleOptions(null);
    expect(options).toEqual([]);
  });
});

describe('getUserRoleDisplayLabel', () => {
  it('returns correct labels', () => {
    expect(getUserRoleDisplayLabel('buyer')).toBe('Buyer');
    expect(getUserRoleDisplayLabel('member')).toBe('Member');
    expect(getUserRoleDisplayLabel('individual_seller')).toBe('Owner-Operator');
    expect(getUserRoleDisplayLabel('dealer')).toBe('Dealer');
    expect(getUserRoleDisplayLabel('pro_dealer')).toBe('Pro Dealer');
    expect(getUserRoleDisplayLabel('super_admin')).toBe('Super Admin');
    expect(getUserRoleDisplayLabel('admin')).toBe('Admin');
    expect(getUserRoleDisplayLabel('developer')).toBe('Developer');
    expect(getUserRoleDisplayLabel('content_manager')).toBe('Content Manager');
    expect(getUserRoleDisplayLabel('editor')).toBe('Editor');
  });

  it('returns Buyer for unknown role', () => {
    expect(getUserRoleDisplayLabel('garbage' as any)).toBe('Buyer');
  });

  it('returns Buyer for null', () => {
    expect(getUserRoleDisplayLabel(null)).toBe('Buyer');
  });
});
