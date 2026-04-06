import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  navigateMock,
  registerMock,
  loginMock,
  getRecaptchaTokenMock,
  assessRecaptchaMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  registerMock: vi.fn(),
  loginMock: vi.fn(),
  getRecaptchaTokenMock: vi.fn(),
  assessRecaptchaMock: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const MockDiv = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;
  return {
    motion: { div: MockDiv },
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../components/Seo', () => ({
  Seo: () => null,
}));

vi.mock('../components/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../components/AuthContext', () => ({
  useAuth: () => ({
    register: registerMock,
    login: loginMock,
  }),
}));

vi.mock('../services/recaptchaService', () => ({
  getRecaptchaToken: getRecaptchaTokenMock,
  assessRecaptcha: assessRecaptchaMock,
}));

vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

import { Register } from '../pages/Register';

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

function getStepTwoInputs() {
  const emailInput = screen.getByPlaceholderText('YOUR@EMAIL.COM');
  const passwordInput = screen.getByPlaceholderText('••••••••••••');
  return { emailInput, passwordInput };
}

describe('Register component', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    registerMock.mockReset();
    loginMock.mockReset();
    getRecaptchaTokenMock.mockReset();
    assessRecaptchaMock.mockReset();
    getRecaptchaTokenMock.mockResolvedValue(null);
    assessRecaptchaMock.mockResolvedValue(true);
  });

  it('requires a full name before continuing and preserves the selected account type', async () => {
    renderRegister();

    const continueButton = screen.getByRole('button', { name: /continue to credentials/i });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /owner-operator/i }));

    const fullNameInput = screen.getByPlaceholderText('OPERATOR NAME');
    fireEvent.change(fullNameInput, { target: { value: 'Caleb Happy' } });

    expect(continueButton).not.toBeDisabled();
    fireEvent.click(continueButton);

    expect(await screen.findByText(/selected account/i)).toBeInTheDocument();
    expect(screen.getByText('Owner-Operator')).toBeInTheDocument();
  });

  it('routes verified free-member registrations to the profile', async () => {
    registerMock.mockResolvedValue({
      emailVerified: true,
      verificationEmailSent: false,
    });

    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('OPERATOR NAME'), { target: { value: 'Caleb Happy' } });
    fireEvent.click(screen.getByRole('button', { name: /continue to credentials/i }));

    const { emailInput, passwordInput } = getStepTwoInputs();
    fireEvent.change(emailInput, { target: { value: 'buyer@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByLabelText(/i accept the timberequip/i));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({
        displayName: 'Caleb Happy',
        email: 'buyer@example.com',
        onboardingIntent: 'free_member',
      }));
    });

    expect(navigateMock).toHaveBeenCalledWith('/profile', { replace: true });
  });

  it('routes verified paid-seller registrations to the checkout-start plan URL', async () => {
    registerMock.mockResolvedValue({
      emailVerified: true,
      verificationEmailSent: false,
    });

    renderRegister();

    fireEvent.click(screen.getByText('Dealer Ad Package').closest('button')!);
    fireEvent.change(screen.getByPlaceholderText('OPERATOR NAME'), { target: { value: 'Caleb Happy' } });
    fireEvent.click(screen.getByRole('button', { name: /continue to credentials/i }));

    const { emailInput, passwordInput } = getStepTwoInputs();
    fireEvent.change(emailInput, { target: { value: 'seller@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByLabelText(/i accept the timberequip/i));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({
        displayName: 'Caleb Happy',
        email: 'seller@example.com',
        onboardingIntent: 'dealer',
      }));
    });

    expect(navigateMock).toHaveBeenCalledWith('/ad-programs?plan=dealer&startCheckout=1', { replace: true });
  });
});
