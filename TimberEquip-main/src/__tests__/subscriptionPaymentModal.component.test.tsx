import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionPaymentModal } from '../components/SubscriptionPaymentModal';

const {
  navigateMock,
  createAccountCheckoutSession,
  createListingCheckoutSession,
  assignMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createAccountCheckoutSession: vi.fn(),
  createListingCheckoutSession: vi.fn(),
  assignMock: vi.fn(),
}));

let mockUser: { uid: string } | null = { uid: 'user-1' };

vi.mock('framer-motion', () => {
  const MockDiv = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MockDiv },
  };
});

vi.mock('../components/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../components/LocaleContext', () => ({
  useLocale: () => ({
    t: (_key: string, fallback?: string) => fallback || '',
  }),
}));

vi.mock('../services/billingService', () => ({
  billingService: {
    createAccountCheckoutSession,
    createListingCheckoutSession,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('SubscriptionPaymentModal component', () => {
  beforeEach(() => {
    mockUser = { uid: 'user-1' };
    navigateMock.mockReset();
    createAccountCheckoutSession.mockReset();
    createListingCheckoutSession.mockReset();
    assignMock.mockReset();
    vi.restoreAllMocks();
    delete (window as Window & { location?: Location }).location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: assignMock,
      },
    });
  });

  it('navigates account checkout flow with owner-operator quantity', () => {
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <SubscriptionPaymentModal
          isOpen
          onClose={onClose}
          checkoutMode="account"
          initialPlan="individual_seller"
          returnPath="/sell"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Owner-Operator Quantity')).toBeInTheDocument();
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '3' } });

    expect(screen.getByText('Total: $117/month for 3 active listings')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /activate with owner-operator ad program/i }));

    expect(onClose).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/ad-programs?plan=individual_seller&intent=list-equipment');
    expect(createAccountCheckoutSession).not.toHaveBeenCalled();
  });

  it('starts listing checkout and redirects to Stripe', async () => {
    createListingCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.test/session-1' });

    render(
      <MemoryRouter>
        <SubscriptionPaymentModal
          isOpen
          onClose={vi.fn()}
          listingId="listing-123"
          initialPlan="dealer"
          checkoutMode="listing"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /continue with dealer ad package/i }));

    await waitFor(() => {
      expect(createListingCheckoutSession).toHaveBeenCalledWith('dealer', 'listing-123');
    });
    expect(assignMock).toHaveBeenCalledWith('https://checkout.stripe.test/session-1');
  });

  it('shows a sign-in error before checkout when user is missing', () => {
    mockUser = null;

    render(
      <MemoryRouter>
        <SubscriptionPaymentModal
          isOpen
          onClose={vi.fn()}
          checkoutMode="account"
          initialPlan="dealer"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /activate with dealer ad package/i }));

    expect(screen.getByText('Sign in is required before checkout.')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
