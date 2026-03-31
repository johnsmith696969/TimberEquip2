import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Unsubscribe } from '../pages/Unsubscribe';

describe('Unsubscribe page', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the signed unsubscribe state and shows the subscriber email', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        email: 'buyer@example.com',
        displayName: 'Buyer',
        scope: 'optional',
        emailNotificationsEnabled: true,
      }),
    });

    render(
      <MemoryRouter initialEntries={['/unsubscribe?uid=user-1&email=buyer@example.com&scope=optional&token=test-token']}>
        <Routes>
          <Route path="/unsubscribe" element={<Unsubscribe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Buyer')).toBeInTheDocument();
    expect(screen.getByText('buyer@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop Optional Emails' })).toBeInTheDocument();
  });

  it('submits the unsubscribe request and shows the success notice', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'buyer@example.com',
          displayName: 'Buyer',
          scope: 'optional',
          emailNotificationsEnabled: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          email: 'buyer@example.com',
          scope: 'optional',
          emailNotificationsEnabled: false,
        }),
      });

    render(
      <MemoryRouter initialEntries={['/unsubscribe?uid=user-1&email=buyer@example.com&scope=optional&token=test-token']}>
        <Routes>
          <Route path="/unsubscribe" element={<Unsubscribe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Stop Optional Emails' }));

    await waitFor(() => {
      expect(screen.getByText(/Optional TimberEquip emails are turned off/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/email-preferences/unsubscribe');
  });
});
