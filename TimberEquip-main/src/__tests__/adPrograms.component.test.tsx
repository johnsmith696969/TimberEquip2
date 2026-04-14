import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  useAuthMock,
  useLocaleMock,
  createAccountCheckoutSessionMock,
  getRecaptchaTokenMock,
  assessRecaptchaMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useLocaleMock: vi.fn(),
  createAccountCheckoutSessionMock: vi.fn(),
  getRecaptchaTokenMock: vi.fn(),
  assessRecaptchaMock: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const MockDiv = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MockDiv },
  };
});

vi.mock('../components/Seo', () => ({
  Seo: () => null,
}));

vi.mock('../components/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('../components/AuthContext', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../components/LocaleContext', () => ({
  useLocale: useLocaleMock,
}));

vi.mock('../services/recaptchaService', () => ({
  getRecaptchaToken: getRecaptchaTokenMock,
  assessRecaptcha: assessRecaptchaMock,
}));

vi.mock('../services/billingService', () => ({
  billingService: {
    createAccountCheckoutSession: createAccountCheckoutSessionMock,
  },
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('../utils/sellerAccess', () => ({
  hasActiveSellerSubscription: (user: any) => Boolean(user?.activeSubscriptionPlanId),
}));

vi.mock('../utils/sellerProgramAgreement', () => ({
  SELLER_PROGRAM_AGREEMENT_VERSION: 'seller-program-v1',
  SELLER_PROGRAM_PRIVACY_PATH: '/privacy',
  SELLER_PROGRAM_TERMS_PATH: '/terms',
  createDefaultSellerProgramEnrollmentForm: ({ planId = '', displayName = '', company = '', email = '', phoneNumber = '', website = '' }: any = {}) => ({
    planId,
    legalFullName: displayName,
    legalTitle: '',
    companyName: company,
    billingEmail: email,
    phoneNumber,
    country: '',
    website,
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedRecurringBilling: false,
    acceptedVisibilityPolicy: false,
    acceptedAuthority: false,
  }),
  getSellerProgramScopeLabel: (planId?: string | null) => (planId ? `Scope:${planId}` : 'Scope:pending'),
  getSellerProgramStatementLabel: (planId?: string | null) => (planId ? `Billing:${planId}` : 'Billing:pending'),
}));

vi.mock('../utils/sellerPlans', () => ({
  getSellerPlanChangeDirection: (current: string | null, next: string | null) => {
    if (!current || !next || current === next) return 'same';
    const order = ['individual_seller', 'dealer', 'fleet_dealer'];
    return order.indexOf(next) > order.indexOf(current) ? 'upgrade' : 'downgrade';
  },
  getSellerPlanMarketingLabel: (planId?: string | null) => {
    if (planId === 'individual_seller') return 'Owner-Operator Ad Program';
    if (planId === 'dealer') return 'Dealer';
    if (planId === 'fleet_dealer') return 'Pro Dealer';
    return 'Member';
  },
  getSellerPlanPurchaseLabel: (planId?: string | null) => {
    if (planId === 'individual_seller') return 'Owner-Operator Ad Program';
    if (planId === 'dealer') return 'Dealer';
    if (planId === 'fleet_dealer') return 'Pro Dealer';
    return 'Member';
  },
}));

import { AdPrograms } from '../pages/AdPrograms';

describe('AdPrograms component', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    useAuthMock.mockReset();
    useLocaleMock.mockReset();
    createAccountCheckoutSessionMock.mockReset();
    getRecaptchaTokenMock.mockReset();
    assessRecaptchaMock.mockReset();
    fetchMock.mockReset();

    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        monthlyActiveBuyers: 1234,
        avgEquipmentValue: 345000,
        globalReachCountries: 12,
        conversionRate: 4.2,
        asOf: '2026-03-30T00:00:00.000Z',
      }),
    });

    useLocaleMock.mockReturnValue({
      formatNumber: (value: number) => value.toLocaleString('en-US'),
      formatPrice: (value: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value),
    });

    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
  });

  function renderAdPrograms(initialEntry = '/ad-programs') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/ad-programs" element={<AdPrograms />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('shows the unauthenticated enrollment CTA for a selected dealer plan', async () => {
    renderAdPrograms('/ad-programs?plan=dealer');

    expect(await screen.findByText(/new seller subscription/i)).toBeInTheDocument();
    expect(screen.getByText('$250/MO')).toBeInTheDocument();
    expect(screen.getByText('$500/MO')).toBeInTheDocument();
    expect(screen.getByText(/up to 50 active machine listings/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 150 active machine listings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in and continue/i })).toBeInTheDocument();
    expect(screen.getByText(/completing checkout will activate the selected plan/i)).toBeInTheDocument();
  });

  it('switches owner-operator quantity controls on when that plan is selected', async () => {
    renderAdPrograms('/ad-programs');

    const selectPlanButton = await screen.findByRole('button', { name: /select owner-operator ad program/i });
    fireEvent.click(selectPlanButton);

    expect(await screen.findByText(/owner-operator quantity/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText(/total: \$39\/month for 1 active listing slot/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in and continue/i })).toBeInTheDocument();
  });

  it('marks the current seller plan as active for subscribed accounts', async () => {
    useAuthMock.mockReturnValue({
      user: {
        activeSubscriptionPlanId: 'dealer',
        subscriptionStatus: 'active',
      },
      isAuthenticated: true,
    });

    renderAdPrograms('/ad-programs?plan=dealer');

    await waitFor(() => {
      expect(screen.getAllByText(/current active plan/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/this account is already on dealer/i)).toBeInTheDocument();
  });
});
