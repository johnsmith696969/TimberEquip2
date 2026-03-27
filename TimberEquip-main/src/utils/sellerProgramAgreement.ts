import type { ListingPlanId } from '../services/billingService';

export const SELLER_PROGRAM_AGREEMENT_VERSION = 'seller-program-global-v2026-03-26';
export const SELLER_PROGRAM_TERMS_PATH = '/terms';
export const SELLER_PROGRAM_PRIVACY_PATH = '/privacy';

export interface SellerProgramEnrollmentFormData {
  planId: ListingPlanId | '';
  legalFullName: string;
  legalTitle: string;
  companyName: string;
  billingEmail: string;
  phoneNumber: string;
  website: string;
  country: string;
  taxIdOrVat: string;
  notes: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedRecurringBilling: boolean;
  acceptedVisibilityPolicy: boolean;
  acceptedAuthority: boolean;
}

export interface SellerProgramEnrollmentSeed {
  planId?: ListingPlanId | '';
  displayName?: string | null;
  company?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
}

export function createDefaultSellerProgramEnrollmentForm(
  seed: SellerProgramEnrollmentSeed = {}
): SellerProgramEnrollmentFormData {
  return {
    planId: seed.planId || '',
    legalFullName: String(seed.displayName || '').trim(),
    legalTitle: '',
    companyName: String(seed.company || '').trim(),
    billingEmail: String(seed.email || '').trim(),
    phoneNumber: String(seed.phoneNumber || '').trim(),
    website: String(seed.website || '').trim(),
    country: '',
    taxIdOrVat: '',
    notes: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedRecurringBilling: false,
    acceptedVisibilityPolicy: false,
    acceptedAuthority: false,
  };
}

export function getSellerProgramStatementLabel(planId?: ListingPlanId | string | null): string {
  return planId === 'dealer' || planId === 'fleet_dealer'
    ? 'FES-DealerOS'
    : 'Forestry Equipment Sales';
}

export function getSellerProgramScopeLabel(planId?: ListingPlanId | string | null): string {
  return planId === 'dealer' || planId === 'fleet_dealer'
    ? 'DealerOS'
    : 'Owner-Operator';
}
