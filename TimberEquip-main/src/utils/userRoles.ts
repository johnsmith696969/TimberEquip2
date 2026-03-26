import { UserRole } from '../types';

export const EDITABLE_USER_ROLE_OPTIONS: ReadonlyArray<{ value: UserRole; label: string }> = [
  { value: 'dealer', label: 'Dealer' },
  { value: 'pro_dealer', label: 'Pro Dealer' },
  { value: 'member', label: 'Free Member' },
  { value: 'editor', label: 'Editor' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function normalizeEditableUserRole(role?: UserRole | string | null): UserRole {
  switch (role) {
    case 'super_admin':
      return 'super_admin';
    case 'admin':
    case 'developer':
      return 'admin';
    case 'content_manager':
      return 'content_manager';
    case 'editor':
      return 'editor';
    case 'dealer':
    case 'dealer_staff':
      return 'dealer';
    case 'pro_dealer':
    case 'dealer_manager':
      return 'pro_dealer';
    case 'individual_seller':
    case 'member':
    case 'buyer':
    default:
      return 'member';
  }
}

export function getAssignableUserRoleOptions(actorRole?: UserRole | string | null): ReadonlyArray<{ value: UserRole; label: string }> {
  const normalizedActorRole = String(actorRole || '').trim().toLowerCase();

  if (normalizedActorRole === 'super_admin') {
    return EDITABLE_USER_ROLE_OPTIONS;
  }

  if (normalizedActorRole === 'admin' || normalizedActorRole === 'developer') {
    return EDITABLE_USER_ROLE_OPTIONS.filter((option) => option.value !== 'super_admin');
  }

  if (normalizedActorRole === 'dealer' || normalizedActorRole === 'pro_dealer' || normalizedActorRole === 'dealer_manager' || normalizedActorRole === 'dealer_staff') {
    return EDITABLE_USER_ROLE_OPTIONS.filter((option) => ['dealer', 'pro_dealer', 'member'].includes(option.value));
  }

  return [];
}

export function getUserRoleDisplayLabel(role?: UserRole | string | null): string {
  switch (normalizeEditableUserRole(role)) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'content_manager':
      return 'Content Manager';
    case 'editor':
      return 'Editor';
    case 'dealer':
      return 'Dealer';
    case 'pro_dealer':
      return 'Pro Dealer';
    case 'member':
      return 'Free Member';
    default:
      return 'Free Member';
  }
}
