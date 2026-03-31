import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createInquiryMock, getRecaptchaTokenMock, assessRecaptchaMock } = vi.hoisted(() => ({
  createInquiryMock: vi.fn(),
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

vi.mock('../services/equipmentService', () => ({
  equipmentService: {
    createInquiry: createInquiryMock,
  },
}));

vi.mock('../services/recaptchaService', () => ({
  getRecaptchaToken: getRecaptchaTokenMock,
  assessRecaptcha: assessRecaptchaMock,
}));

import { InquiryModal } from '../components/InquiryModal';

const baseListing = {
  id: 'listing-qa-1',
  title: '2021 TIGERCAT 1075B',
  sellerUid: 'seller-qa-1',
  sellerId: 'seller-qa-1',
} as any;

describe('InquiryModal component', () => {
  beforeEach(() => {
    createInquiryMock.mockReset();
    getRecaptchaTokenMock.mockReset();
    assessRecaptchaMock.mockReset();
    vi.useRealTimers();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    getRecaptchaTokenMock.mockResolvedValue(null);
    assessRecaptchaMock.mockResolvedValue(true);
  });

  it('requires seller-specific consent before sending the inquiry', async () => {
    render(<InquiryModal isOpen onClose={vi.fn()} listing={baseListing} />);

    const [nameInput, emailInput, phoneInput] = screen.getAllByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Caleb Happy' } });
    fireEvent.change(emailInput, { target: { value: 'calebhappy@gmail.com' } });
    fireEvent.change(phoneInput, { target: { value: '+16126008268' } });
    const submitButton = screen.getByRole('button', { name: /transmit inquiry/i });
    fireEvent.submit(submitButton.closest('form')!);

    expect(await screen.findByText(/review and accept the seller-specific contact consent notice/i)).toBeInTheDocument();
    expect(createInquiryMock).not.toHaveBeenCalled();
  });

  it('submits the inquiry and shows the success state after consent is accepted', async () => {
    const onClose = vi.fn();
    const timeoutSpy = vi.spyOn(global, 'setTimeout');
    createInquiryMock.mockResolvedValue('inquiry-1');

    render(<InquiryModal isOpen onClose={onClose} listing={baseListing} />);

    const [nameInput, emailInput, phoneInput] = screen.getAllByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Caleb Happy' } });
    fireEvent.change(emailInput, { target: { value: 'calebhappy@gmail.com' } });
    fireEvent.change(phoneInput, { target: { value: '+16126008268' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /transmit inquiry/i }));

    await waitFor(() => {
      expect(createInquiryMock).toHaveBeenCalledWith(expect.objectContaining({
        listingId: 'listing-qa-1',
        sellerUid: 'seller-qa-1',
        buyerName: 'Caleb Happy',
        buyerEmail: 'calebhappy@gmail.com',
        contactConsentAccepted: true,
        contactConsentScope: 'listing_seller_specific',
      }));
    });

    expect(await screen.findByText(/inquiry transmitted/i)).toBeInTheDocument();

    const closeTimer = timeoutSpy.mock.calls.find(([, delay]) => delay === 2000)?.[0] as (() => void) | undefined;
    expect(closeTimer).toBeDefined();
    closeTimer?.();
    expect(onClose).toHaveBeenCalled();
  });

  it('prompts before closing when there are unsaved changes', async () => {
    const onClose = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

    render(<InquiryModal isOpen onClose={onClose} listing={baseListing} />);

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Caleb Happy' } });
    const closeButton = screen.getAllByRole('button').find((button) => button.querySelector('svg'));
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton!);
    expect(confirmSpy).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(closeButton!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
