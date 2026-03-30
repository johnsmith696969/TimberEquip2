import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useAuthMock, useThemeMock, submitFinancingRequestMock, getRecaptchaTokenMock, assessRecaptchaMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useThemeMock: vi.fn(),
  submitFinancingRequestMock: vi.fn(),
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

vi.mock('../components/AuthContext', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../components/ThemeContext', () => ({
  useTheme: useThemeMock,
}));

vi.mock('../services/equipmentService', () => ({
  equipmentService: {
    submitFinancingRequest: submitFinancingRequestMock,
  },
}));

vi.mock('../services/recaptchaService', () => ({
  getRecaptchaToken: getRecaptchaTokenMock,
  assessRecaptcha: assessRecaptchaMock,
}));

import { Financing } from '../pages/Financing';

describe('Financing component', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useThemeMock.mockReset();
    submitFinancingRequestMock.mockReset();
    getRecaptchaTokenMock.mockReset();
    assessRecaptchaMock.mockReset();

    useAuthMock.mockReturnValue({
      user: {
        displayName: 'Caleb H',
        email: 'calebhappy@gmail.com',
        phoneNumber: '+16126008268',
      },
    });
    useThemeMock.mockReturnValue({ theme: 'light' });
    getRecaptchaTokenMock.mockResolvedValue(null);
    assessRecaptchaMock.mockResolvedValue(true);
  });

  function renderFinancing() {
    return render(
      <MemoryRouter>
        <Financing />
      </MemoryRouter>
    );
  }

  async function advanceToVerificationStep() {
    fireEvent.click(screen.getByRole('button', { name: /continue to equipment details/i }));
    await screen.findByRole('heading', { name: /equipment & credit requirements/i });
    fireEvent.click(screen.getByRole('button', { name: /continue to verification/i }));
    await screen.findByRole('heading', { name: /identity verification/i });
  }

  it('progresses through the financing wizard steps', async () => {
    renderFinancing();

    expect(screen.getByRole('heading', { name: /institutional financing/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue to equipment details/i }));
    expect(await screen.findByRole('heading', { name: /equipment & credit requirements/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue to verification/i }));
    expect(await screen.findByRole('heading', { name: /identity verification/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
  });

  it('requires the financing contact consent before submission', async () => {
    renderFinancing();
    await advanceToVerificationStep();

    fireEvent.click(screen.getByRole('button', { name: /submit application/i }));

    expect(await screen.findByText(/review and accept the financing contact consent notice/i)).toBeInTheDocument();
    expect(submitFinancingRequestMock).not.toHaveBeenCalled();
  });

  it('submits and shows the success state after consent is accepted', async () => {
    submitFinancingRequestMock.mockResolvedValue(undefined);

    renderFinancing();
    await advanceToVerificationStep();

    fireEvent.click(screen.getByLabelText(/i authorize forestry equipment sales financing/i));
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }));

    await waitFor(() => {
      expect(submitFinancingRequestMock).toHaveBeenCalledWith(expect.objectContaining({
        applicantName: 'Caleb H',
        applicantEmail: 'calebhappy@gmail.com',
        contactConsentAccepted: true,
        contactConsentScope: 'financing_request_specific',
      }));
    });

    expect(await screen.findByRole('heading', { name: /application submitted/i })).toBeInTheDocument();
  });
});
