import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  navigateMock,
  loginMock,
  loginWithGoogleMock,
  sendPasswordResetMock,
  sendVerificationEmailMock,
  getRecaptchaTokenMock,
  assessRecaptchaMock,
  signOutMock,
  authMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  loginMock: vi.fn(),
  loginWithGoogleMock: vi.fn(),
  sendPasswordResetMock: vi.fn(),
  sendVerificationEmailMock: vi.fn(),
  getRecaptchaTokenMock: vi.fn(),
  assessRecaptchaMock: vi.fn(),
  signOutMock: vi.fn(),
  authMock: {
    currentUser: null as null | { email?: string | null; emailVerified?: boolean },
  },
}));

vi.mock('framer-motion', () => {
  const MockDiv = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

vi.mock('../components/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('../components/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    loginWithGoogle: loginWithGoogleMock,
    sendPasswordReset: sendPasswordResetMock,
    sendVerificationEmail: sendVerificationEmailMock,
    isAuthenticated: false,
  }),
}));

vi.mock('../services/recaptchaService', () => ({
  getRecaptchaToken: getRecaptchaTokenMock,
  assessRecaptcha: assessRecaptchaMock,
}));

vi.mock('../services/mfaService', () => ({
  completeSmsMfaSignIn: vi.fn(),
  createVisibleRecaptchaVerifier: vi.fn(),
  ensureAuthRecaptchaConfig: vi.fn(),
  getPreferredSmsMfaFactor: vi.fn(),
  getSmsMultiFactorResolver: vi.fn(),
  resetRecaptchaVerifier: vi.fn(),
  startSmsMfaSignIn: vi.fn(),
}));

vi.mock('../firebase', () => ({
  auth: authMock,
}));

vi.mock('firebase/auth', () => ({
  signOut: signOutMock,
}));

import { Login } from '../pages/Login';

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Login />
    </MemoryRouter>
  );
}

describe('Login component', () => {
  beforeEach(() => {
    authMock.currentUser = null;
    navigateMock.mockReset();
    loginMock.mockReset();
    loginWithGoogleMock.mockReset();
    sendPasswordResetMock.mockReset();
    sendVerificationEmailMock.mockReset();
    getRecaptchaTokenMock.mockReset();
    assessRecaptchaMock.mockReset();
    signOutMock.mockReset();

    getRecaptchaTokenMock.mockResolvedValue(null);
    assessRecaptchaMock.mockResolvedValue(true);
    sendPasswordResetMock.mockResolvedValue(undefined);
  });

  it('shows the verification notice and prefills the email from the query string', async () => {
    renderLogin('/login?verifyEmailSent=1&email=buyer@example.com');

    expect(await screen.findByText(/verification email sent/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('EMAIL@EXAMPLE.COM')).toHaveValue('buyer@example.com');
  });

  it('sends a password reset link and shows the success state', async () => {
    renderLogin('/login');

    fireEvent.change(screen.getByPlaceholderText('EMAIL@EXAMPLE.COM'), { target: { value: 'buyer@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));

    await screen.findByRole('button', { name: /send reset link/i });
    const resetEmailInput = screen.getAllByDisplayValue('buyer@example.com').at(-1)!;
    fireEvent.change(resetEmailInput, { target: { value: 'reset@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(sendPasswordResetMock).toHaveBeenCalledWith('reset@example.com');
    });

    expect(await screen.findByText('Email Sent')).toBeInTheDocument();
    expect(screen.getByText(/a password reset link has been sent to/i)).toBeInTheDocument();
  });

  it('shows the Firebase auth domain guidance when Google sign-in is unauthorized', async () => {
    loginWithGoogleMock.mockRejectedValue({ code: 'auth/unauthorized-domain' });

    renderLogin('/login');

    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(await screen.findByText(/google sign-in is not authorized for this domain/i)).toBeInTheDocument();
  });
});
