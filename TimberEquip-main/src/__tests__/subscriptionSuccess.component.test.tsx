import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useAuthMock, confirmCheckoutSessionMock, getSellerProgramStatementLabelMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  confirmCheckoutSessionMock: vi.fn(),
  getSellerProgramStatementLabelMock: vi.fn((planId?: string | null) => (planId ? `Label:${planId}` : 'Label:pending')),
}));

vi.mock('../components/Seo', () => ({
  Seo: () => null,
}));

vi.mock('../components/AuthContext', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../services/billingService', () => ({
  SELLER_PLAN_DEFINITIONS: [
    { id: 'individual_seller', name: 'Owner-Operator Ad Program' },
    { id: 'dealer', name: 'Dealer Ad Program' },
    { id: 'fleet_dealer', name: 'Pro Dealer Ad Program' },
  ],
  billingService: {
    confirmCheckoutSession: confirmCheckoutSessionMock,
  },
}));

vi.mock('../utils/sellerProgramAgreement', () => ({
  getSellerProgramStatementLabel: getSellerProgramStatementLabelMock,
}));

vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(),
    },
  },
}));

import { SubscriptionSuccess } from '../pages/SubscriptionSuccess';

describe('SubscriptionSuccess component', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    confirmCheckoutSessionMock.mockReset();
    getSellerProgramStatementLabelMock.mockClear();
    useAuthMock.mockReturnValue({
      user: {
        email: 'seller@example.com',
      },
    });
  });

  it('shows an error when the Stripe session id is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/subscription-success']}>
        <Routes>
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Subscription Check Needed')).toBeInTheDocument();
    expect(screen.getByText('Missing Stripe session id. Please start the subscription checkout again.')).toBeInTheDocument();
    expect(confirmCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it('renders the successful post-checkout state for a paid seller subscription', async () => {
    confirmCheckoutSessionMock.mockResolvedValue({
      sessionId: 'sess_123',
      status: 'complete',
      paid: true,
      planId: 'dealer',
      scope: 'account',
    });

    render(
      <MemoryRouter initialEntries={['/subscription-success?session_id=sess_123&intent=list-equipment&source=ad-programs']}>
        <Routes>
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Seller Subscription Active')).toBeInTheDocument();
    await waitFor(() => {
      expect(confirmCheckoutSessionMock).toHaveBeenCalledWith('sess_123');
    });
    expect(screen.getByText('Your seller subscription is active and ready to use.')).toBeInTheDocument();
    expect(screen.getByText('Dealer Ad Program')).toBeInTheDocument();
    expect(screen.getByText('Label:dealer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /List Equipment/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /My Account/i })).toBeInTheDocument();
  });
});
