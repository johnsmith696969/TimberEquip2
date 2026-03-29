import { auth } from '../firebase';
import type { AccountEntitlement } from '../types';

export type ListingPlanId = 'individual_seller' | 'dealer' | 'fleet_dealer';
export type AccountOnboardingChoice = 'free_member' | ListingPlanId;

export interface SellerProgramCheckoutEnrollment {
  legalFullName: string;
  legalTitle: string;
  companyName: string;
  billingEmail: string;
  phoneNumber: string;
  website?: string;
  country: string;
  taxIdOrVat?: string;
  notes?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedRecurringBilling: boolean;
  acceptedVisibilityPolicy: boolean;
  acceptedAuthority: boolean;
  legalTermsVersion: string;
  source?: string;
}

export interface SellerPlanDefinition {
  id: ListingPlanId;
  name: string;
  price: number;
  period: string;
  summary: string;
  listingCap: number;
  managedAccountCap?: number;
}

export const SELLER_PLAN_DEFINITIONS: SellerPlanDefinition[] = [
  {
    id: 'individual_seller',
    name: 'Owner-Operator Ad Program',
    price: 39,
    period: 'month',
    summary: 'Best for owner-operators posting one active machine at a time.',
    listingCap: 1,
  },
  {
    id: 'dealer',
    name: 'Dealer Ad Package',
    price: 499,
    period: 'month',
    summary: 'For dealer teams with full monthly inventory management.',
    listingCap: 50,
    managedAccountCap: 3,
  },
  {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    price: 999,
    period: 'month',
    summary: 'For high-volume dealer groups with expanded inventory and visibility.',
    listingCap: 150,
    managedAccountCap: 3,
  },
];

export interface Invoice {
  id: string;
  userUid: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'overdue' | 'canceled';
  items: string[];
  createdAt: any;
  paidAt?: any;
}

export interface Subscription {
  id: string;
  userUid: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  stripeSubscriptionId: string;
  currentPeriodEnd: any;
  cancelAtPeriodEnd: boolean;
}

export interface BillingAuditLog {
  id: string;
  action: string;
  userUid: string;
  invoiceId?: string;
  details: string;
  timestamp: any;
}

export interface AccountAuditLog {
  id: string;
  eventType: string;
  actorUid?: string | null;
  targetUid: string;
  source?: string | null;
  reason?: string | null;
  previousState?: Record<string, unknown> | null;
  nextState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
}

export interface SellerProgramAgreementAcceptance {
  id: string;
  userUid: string;
  actorUid?: string | null;
  planId: string;
  statementLabel?: string | null;
  legalScope?: string | null;
  agreementVersion?: string | null;
  checkoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  source?: string | null;
  acceptedAtIso?: string | null;
  status?: string | null;
  checkoutState?: string | null;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedRecurringBilling: boolean;
  acceptedVisibilityPolicy: boolean;
  acceptedAuthority: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  finalizedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AdminBillingBootstrapResponse {
  invoices: Invoice[];
  subscriptions: Subscription[];
  auditLogs: BillingAuditLog[];
  accountAuditLogs: AccountAuditLog[];
  sellerAgreementAcceptances: SellerProgramAgreementAcceptance[];
  partial: boolean;
  degradedSections: string[];
  errors: Partial<Record<'invoices' | 'subscriptions' | 'auditLogs' | 'accountAuditLogs' | 'sellerAgreementAcceptances', string>>;
  firestoreQuotaLimited: boolean;
  fetchedAt: string;
}

export interface RefreshedAccountAccessSummary {
  stripeCustomerId: string | null;
  planId: ListingPlanId | null;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | 'pending' | null;
  listingCap: number;
  managedAccountCap: number;
  currentSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  role: string | null;
  accountAccessSource: string | null;
  accountStatus: 'active' | 'pending' | 'suspended' | null;
  entitlement?: AccountEntitlement | null;
}

const PRIVATE_BILLING_CACHE_PREFIX = 'te-billing-cache-v1';
const ACCOUNT_ACCESS_CACHE_SCOPE = 'account-access-summary';

type BillingCacheEnvelope<T> = {
  savedAt: string;
  data: T;
};

function isQuotaExceededBillingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /quota limit exceeded|free daily read units per project|quota exceeded|daily read quota is exhausted/i.test(message);
}

function getBillingCacheKey(scope: string): string {
  const uid = auth.currentUser?.uid || 'anonymous';
  return `${PRIVATE_BILLING_CACHE_PREFIX}:${uid}:${scope}`;
}

function readBillingCache<T>(scope: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getBillingCacheKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BillingCacheEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'data' in (parsed as BillingCacheEnvelope<T>)) {
      return ((parsed as BillingCacheEnvelope<T>).data ?? null) as T | null;
    }
    return parsed as T;
  } catch (error) {
    console.warn(`Unable to read billing cache for ${scope}:`, error);
    return null;
  }
}

function writeBillingCache<T>(scope: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: BillingCacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(getBillingCacheKey(scope), JSON.stringify(payload));
  } catch (error) {
    console.warn(`Unable to write billing cache for ${scope}:`, error);
  }
}

function clearBillingCache(scope: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(getBillingCacheKey(scope));
  } catch (error) {
    console.warn(`Unable to clear billing cache for ${scope}:`, error);
  }
}

function getBillingApiBaseUrls(): string[] {
  const bases = [''];
  if (typeof window === 'undefined') {
    return bases;
  }

  const hostname = window.location.hostname.trim().toLowerCase();
  const origin = window.location.origin.trim();

  if (origin && !bases.includes(origin)) {
    bases.push(origin);
  }

  if (hostname === 'www.timberequip.com') {
    bases.push('https://timberequip.com');
  }

  return Array.from(new Set(bases));
}

async function fetchBillingApi(
  path: string,
  init: RequestInit,
  options: { allowFallbackOn404?: boolean } = {}
): Promise<Response> {
  const baseUrls = getBillingApiBaseUrls();
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let index = 0; index < baseUrls.length; index += 1) {
    const baseUrl = baseUrls[index];
    const url = `${baseUrl}${path}`;

    try {
      const response = await fetch(url, init);
      if (!response.ok && options.allowFallbackOn404 && response.status === 404 && index < baseUrls.length - 1) {
        lastResponse = response;
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (index === baseUrls.length - 1) {
        throw error;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error('Billing API request failed');
}

export const billingService = {
  async createAccountCheckoutSession(
    planId: ListingPlanId,
    returnPath = '/sell',
    quantity = 1,
    enrollment?: SellerProgramCheckoutEnrollment | null
  ): Promise<{ url: string; sessionId: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    const token = await user.getIdToken();
    const response = await fetch('/api/billing/create-account-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, returnPath, quantity, enrollment }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to create account checkout session');
    }

    return {
      url: payload.url,
      sessionId: payload.sessionId,
    };
  },

  async createBillingPortalSession(
    returnPath = '/profile?tab=Account%20Settings'
  ): Promise<{ url: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    const token = await user.getIdToken(true);
    const response = await fetchBillingApi(
      '/api/billing/create-portal-session',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnPath }),
      },
      { allowFallbackOn404: true }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to create billing portal session');
    }

    return {
      url: payload.url,
    };
  },

  async createListingCheckoutSession(planId: ListingPlanId, listingId: string): Promise<{ url: string; sessionId: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');
    if (!listingId) throw new Error('Missing listing id');

    const token = await user.getIdToken();
    const response = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, listingId }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to create checkout session');
    }

    return {
      url: payload.url,
      sessionId: payload.sessionId,
    };
  },

  async confirmCheckoutSession(sessionId: string): Promise<{
    sessionId: string;
    status: string;
    paid: boolean;
    listingId?: string | null;
    planId?: string | null;
    scope?: 'listing' | 'account' | null;
  }> {
    if (!sessionId) throw new Error('Missing checkout session id');

    const headers: Record<string, string> = {};
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/billing/checkout-session/${encodeURIComponent(sessionId)}`, {
      headers,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to confirm checkout session');
    }

    if (payload?.scope === 'account' && payload?.paid) {
      const cachedAccess = readBillingCache<RefreshedAccountAccessSummary>(ACCOUNT_ACCESS_CACHE_SCOPE);
      if (cachedAccess) {
        writeBillingCache(ACCOUNT_ACCESS_CACHE_SCOPE, {
          ...cachedAccess,
          planId: typeof payload.planId === 'string' && payload.planId.trim() ? payload.planId : cachedAccess.planId,
          subscriptionStatus: 'active',
          accountStatus: cachedAccess.accountStatus || 'active',
        });
      } else {
        clearBillingCache(ACCOUNT_ACCESS_CACHE_SCOPE);
      }
    }

    return payload;
  },

  async confirmListingCheckoutSession(sessionId: string) {
    return this.confirmCheckoutSession(sessionId);
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    const token = await user.getIdToken(true);
    const response = await fetchBillingApi('/api/billing/cancel-subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to cancel subscription');
    }

    return payload;
  },

  async refreshAccountAccess(): Promise<RefreshedAccountAccessSummary> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    try {
      const token = await user.getIdToken(true);
      const response = await fetchBillingApi(
        '/api/billing/refresh-account-access',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        { allowFallbackOn404: true }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to refresh account access');
      }

      writeBillingCache(ACCOUNT_ACCESS_CACHE_SCOPE, payload);
      return payload;
    } catch (error) {
      const cached = readBillingCache<RefreshedAccountAccessSummary>(ACCOUNT_ACCESS_CACHE_SCOPE);
      if (cached) {
        console.warn(
          isQuotaExceededBillingError(error)
            ? 'Account access is temporarily unavailable because the Firestore daily read quota is exhausted.'
            : 'Using cached account access summary because the live billing request is unavailable.',
          error
        );
        return cached;
      }
      throw error;
    }
  },

  async getAdminInvoices(): Promise<Invoice[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');
    const token = await user.getIdToken();

    const response = await fetch('/api/admin/billing/invoices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const cached = readBillingCache<Invoice[]>('admin-invoices');
      if (Array.isArray(cached) && cached.length > 0) {
        console.warn('Using cached admin invoices because the live billing invoices request failed.');
        return cached;
      }
      if (isQuotaExceededBillingError(await response.text().catch(() => ''))) {
        console.warn('Admin invoices are temporarily unavailable because the Firestore daily read quota is exhausted.');
        return [];
      }
      throw new Error('Failed to fetch invoices');
    }

    const invoices = await response.json();
    if (Array.isArray(invoices)) {
      writeBillingCache('admin-invoices', invoices);
    }
    return invoices;
  },

  async getAdminBillingBootstrap(): Promise<AdminBillingBootstrapResponse> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');
    const token = await user.getIdToken();

    const response = await fetch('/api/admin/billing/bootstrap', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => ({} as Partial<AdminBillingBootstrapResponse>));
    if (!response.ok) {
      const cachedInvoices = readBillingCache<Invoice[]>('admin-invoices') || [];
      const cachedSubscriptions = readBillingCache<Subscription[]>('admin-subscriptions') || [];
      const cachedAuditLogs = readBillingCache<BillingAuditLog[]>('admin-audit-logs') || [];
      const cachedAccountAuditLogs = readBillingCache<AccountAuditLog[]>('admin-account-audit-logs') || [];
      const cachedSellerAgreementAcceptances = readBillingCache<SellerProgramAgreementAcceptance[]>('admin-seller-agreement-acceptances') || [];
      const hasCachedData =
        cachedInvoices.length > 0 ||
        cachedSubscriptions.length > 0 ||
        cachedAuditLogs.length > 0 ||
        cachedAccountAuditLogs.length > 0 ||
        cachedSellerAgreementAcceptances.length > 0;

      if (hasCachedData) {
        console.warn('Using cached admin billing bootstrap because the live request failed.');
        return {
          invoices: cachedInvoices,
          subscriptions: cachedSubscriptions,
          auditLogs: cachedAuditLogs,
          accountAuditLogs: cachedAccountAuditLogs,
          sellerAgreementAcceptances: cachedSellerAgreementAcceptances,
          partial: true,
          degradedSections: ['live_request'],
          errors: {
            invoices: 'Using cached billing data.',
            subscriptions: 'Using cached billing data.',
            auditLogs: 'Using cached billing data.',
            accountAuditLogs: 'Using cached account audit data.',
            sellerAgreementAcceptances: 'Using cached seller legal acceptance data.',
          },
          firestoreQuotaLimited: isQuotaExceededBillingError(payload?.error || ''),
          fetchedAt: new Date().toISOString(),
        };
      }

      throw new Error(String(payload?.error || 'Failed to fetch billing bootstrap'));
    }

    const normalized: AdminBillingBootstrapResponse = {
      invoices: Array.isArray(payload?.invoices) ? payload.invoices : [],
      subscriptions: Array.isArray(payload?.subscriptions) ? payload.subscriptions : [],
      auditLogs: Array.isArray(payload?.auditLogs) ? payload.auditLogs : [],
      accountAuditLogs: Array.isArray(payload?.accountAuditLogs) ? payload.accountAuditLogs : [],
      sellerAgreementAcceptances: Array.isArray(payload?.sellerAgreementAcceptances) ? payload.sellerAgreementAcceptances : [],
      partial: Boolean(payload?.partial),
      degradedSections: Array.isArray(payload?.degradedSections) ? payload.degradedSections : [],
      errors: typeof payload?.errors === 'object' && payload?.errors ? payload.errors : {},
      firestoreQuotaLimited: Boolean(payload?.firestoreQuotaLimited),
      fetchedAt: String(payload?.fetchedAt || new Date().toISOString()),
    };

    writeBillingCache('admin-invoices', normalized.invoices);
    writeBillingCache('admin-subscriptions', normalized.subscriptions);
    writeBillingCache('admin-audit-logs', normalized.auditLogs);
    writeBillingCache('admin-account-audit-logs', normalized.accountAuditLogs);
    writeBillingCache('admin-seller-agreement-acceptances', normalized.sellerAgreementAcceptances);
    return normalized;
  },

  async getAdminSubscriptions(): Promise<Subscription[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');
    const token = await user.getIdToken();

    const response = await fetch('/api/admin/billing/subscriptions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const cached = readBillingCache<Subscription[]>('admin-subscriptions');
      if (Array.isArray(cached) && cached.length > 0) {
        console.warn('Using cached admin subscriptions because the live billing subscriptions request failed.');
        return cached;
      }
      if (isQuotaExceededBillingError(await response.text().catch(() => ''))) {
        console.warn('Admin subscriptions are temporarily unavailable because the Firestore daily read quota is exhausted.');
        return [];
      }
      throw new Error('Failed to fetch subscriptions');
    }

    const subscriptions = await response.json();
    if (Array.isArray(subscriptions)) {
      writeBillingCache('admin-subscriptions', subscriptions);
    }
    return subscriptions;
  },

  async getAdminAuditLogs(): Promise<BillingAuditLog[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');
    const token = await user.getIdToken();

    const response = await fetch('/api/admin/billing/audit-logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const cached = readBillingCache<BillingAuditLog[]>('admin-audit-logs');
      if (Array.isArray(cached) && cached.length > 0) {
        console.warn('Using cached billing audit logs because the live billing audit request failed.');
        return cached;
      }
      if (isQuotaExceededBillingError(await response.text().catch(() => ''))) {
        console.warn('Billing audit logs are temporarily unavailable because the Firestore daily read quota is exhausted.');
        return [];
      }
      throw new Error('Failed to fetch audit logs');
    }

    const logs = await response.json();
    if (Array.isArray(logs)) {
      writeBillingCache('admin-audit-logs', logs);
    }
    return logs;
  },

  async deleteUserAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');
    const token = await user.getIdToken();

    const response = await fetch('/api/user/delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }
  }
};
