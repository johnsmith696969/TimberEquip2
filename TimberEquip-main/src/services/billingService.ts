import { auth } from '../firebase';

export type ListingPlanId = 'individual_seller' | 'dealer' | 'fleet_dealer';
export type AccountOnboardingChoice = 'free_member' | ListingPlanId;

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
    summary: 'For dealer teams with included Meta ad spend and full monthly inventory.',
    listingCap: 50,
    managedAccountCap: 3,
  },
  {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    price: 999,
    period: 'month',
    summary: 'For high-volume dealer groups with expanded included Meta ad spend.',
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

export const billingService = {
  async createAccountCheckoutSession(
    planId: ListingPlanId,
    returnPath = '/sell',
    quantity = 1
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
      body: JSON.stringify({ planId, returnPath, quantity }),
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
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');
    if (!sessionId) throw new Error('Missing checkout session id');

    const token = await user.getIdToken();
    const response = await fetch(`/api/billing/checkout-session/${encodeURIComponent(sessionId)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to confirm checkout session');
    }

    return payload;
  },

  async confirmListingCheckoutSession(sessionId: string) {
    return this.confirmCheckoutSession(sessionId);
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

    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
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

    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
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

    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
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
