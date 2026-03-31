import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPromptModal } from '../components/LoginPromptModal';

const {
  loginMock,
  loginWithGoogleMock,
  getRecaptchaTokenMock,
  assessRecaptchaMock,
} = vi.hoisted(() => ({
  loginMock: vi.fn(),
  loginWithGoogleMock: vi.fn(),
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

vi.mock('../components/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    loginWithGoogle: loginWithGoogleMock,
  }),
}));

vi.mock('../services/recaptchaService', () => ({
  getRecaptchaToken: getRecaptchaTokenMock,
  assessRecaptcha: assessRecaptchaMock,
}));

describe('LoginPromptModal component', () => {
  beforeEach(() => {
    loginMock.mockReset();
    loginWithGoogleMock.mockReset();
    getRecaptchaTokenMock.mockReset();
    assessRecaptchaMock.mockReset();

    getRecaptchaTokenMock.mockResolvedValue(null);
    assessRecaptchaMock.mockResolvedValue(true);
  });

  it('submits email sign-in and closes on success', async () => {
    loginMock.mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <MemoryRouter>
        <LoginPromptModal isOpen onClose={onClose} onSuccess={onSuccess} message="Save this machine before continuing." />
      </MemoryRouter>
    );

    expect(screen.getByText('Save this machine before continuing.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'buyer@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password!123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('buyer@example.com', 'Password!123');
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the Google unauthorized-domain guidance', async () => {
    loginWithGoogleMock.mockRejectedValue({ code: 'auth/unauthorized-domain' });

    render(
      <MemoryRouter>
        <LoginPromptModal isOpen onClose={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(await screen.findByText(/google sign-in is not authorized for this domain in firebase auth yet/i)).toBeInTheDocument();
  });

  it('closes directly without confirm prompt', async () => {
    const onClose = vi.fn();

    const { container } = render(
      <MemoryRouter>
        <LoginPromptModal isOpen onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'buyer@example.com' } });
    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
