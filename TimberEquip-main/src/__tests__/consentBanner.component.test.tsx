import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentBanner } from '../components/ConsentBanner';

const addDocMock = vi.fn();
const collectionMock = vi.fn();
const serverTimestampMock = vi.fn(() => 'server-timestamp');

vi.mock('../components/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../components/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

describe('ConsentBanner component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    addDocMock.mockReset();
    collectionMock.mockReset();
    serverTimestampMock.mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('appears after the initial delay and stores accepted consent', async () => {
    addDocMock.mockResolvedValue({ id: 'consent-1' });

    render(
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>
    );

    expect(screen.queryByText('Cookie Policy')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Accept All' }));

    expect(window.localStorage.getItem('timber_consent')).toBe('accepted');
    expect(addDocMock).toHaveBeenCalledTimes(1);
  });

  it('reopens when the consent event is dispatched', async () => {
    window.localStorage.setItem('timber_consent', 'accepted');

    render(
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>
    );

    expect(screen.queryByText('Cookie Policy')).not.toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event('timber:reopen-consent'));
    });

    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
  });
});
