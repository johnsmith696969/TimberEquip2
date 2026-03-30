import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  useAuthMock,
  confirmCheckoutSessionMock,
  navigateMock,
  getIdTokenMock,
  canUserPostListingsMock,
  hasActiveSellerSubscriptionMock,
  hasAdminPublishingAccessMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  confirmCheckoutSessionMock: vi.fn(),
  navigateMock: vi.fn(),
  getIdTokenMock: vi.fn(),
  canUserPostListingsMock: vi.fn(),
  hasActiveSellerSubscriptionMock: vi.fn(),
  hasAdminPublishingAccessMock: vi.fn(),
}));

vi.mock('../components/Seo', () => ({
  Seo: () => null,
}));

vi.mock('../components/admin/ListingModal', () => ({
  ListingModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Listing Modal</div> : null),
}));

vi.mock('../components/LoginPromptModal', () => ({
  LoginPromptModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Login Prompt Modal</div> : null),
}));

vi.mock('../components/SubscriptionPaymentModal', () => ({
  SubscriptionPaymentModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Subscription Payment Modal</div> : null),
}));

vi.mock('../components/AuthContext', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../components/LocaleContext', () => ({
  useLocale: () => ({
    t: (_key: string, fallback?: string) => fallback || '',
  }),
}));

vi.mock('../services/equipmentService', () => ({
  equipmentService: {
    getSellerListingUsage: vi.fn(),
    addListing: vi.fn(),
  },
}));

vi.mock('../services/billingService', () => ({
  billingService: {
    confirmCheckoutSession: confirmCheckoutSessionMock,
  },
}));

vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: getIdTokenMock,
    },
  },
}));

vi.mock('../utils/sellerAccess', () => ({
  canUserPostListings: canUserPostListingsMock,
  hasActiveSellerSubscription: hasActiveSellerSubscriptionMock,
  hasAdminPublishingAccess: hasAdminPublishingAccessMock,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { Sell } from '../pages/Sell';

describe('Sell component', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    confirmCheckoutSessionMock.mockReset();
    navigateMock.mockReset();
    getIdTokenMock.mockReset();
    canUserPostListingsMock.mockReset();
    hasActiveSellerSubscriptionMock.mockReset();
    hasAdminPublishingAccessMock.mockReset();

    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      user: {
        uid: 'seller-123',
        activeSubscriptionPlanId: 'dealer',
        listingCap: 3,
        accountAccessSource: 'subscription',
      },
    });
    canUserPostListingsMock.mockReturnValue(true);
    hasActiveSellerSubscriptionMock.mockReturnValue(true);
    hasAdminPublishingAccessMock.mockReturnValue(false);
    getIdTokenMock.mockResolvedValue('token');
  });

  function renderSell(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/sell" element={<Sell />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('shows the account-checkout canceled notice', async () => {
    renderSell('/sell?accountCheckout=canceled');

    expect(await screen.findByText('Seller plan checkout was canceled. Choose a plan to activate posting when you are ready.')).toBeInTheDocument();
    expect(confirmCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it('shows the listing payment-needed state when checkout is canceled after saving', async () => {
    renderSell('/sell?checkout=canceled&listingId=listing-123');

    expect(await screen.findByText('Checkout was canceled. Your listing is saved, and you can finish payment when you are ready.')).toBeInTheDocument();
    expect(screen.getByText('Payment Needed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Payment/i })).toBeInTheDocument();
  });

  it('confirms successful listing checkout and shows the review-queue state', async () => {
    confirmCheckoutSessionMock.mockResolvedValue({
      sessionId: 'sess_listing',
      status: 'complete',
      paid: true,
      listingId: 'listing-123',
      planId: 'dealer',
      scope: 'listing',
    });

    renderSell('/sell?checkout=success&session_id=sess_listing&listingId=listing-123');

    await waitFor(() => {
      expect(confirmCheckoutSessionMock).toHaveBeenCalledWith('sess_listing');
    });
    await waitFor(() => {
      expect(getIdTokenMock).toHaveBeenCalled();
    });

    expect(await screen.findByText('Payment received. Your listing is now in the review queue.')).toBeInTheDocument();
    expect(screen.getByText('Listing Submitted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Profile/i })).toBeInTheDocument();
  });
});
