import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ListingCard } from '../components/ListingCard';
import type { Listing } from '../types';

vi.mock('../components/LocaleContext', () => ({
  useLocale: () => ({
    t: (_key: string, fallback?: string) => fallback || '',
    formatNumber: (value: number) => new Intl.NumberFormat('en-US').format(value),
    formatPrice: (value: number, currency = 'USD', maximumFractionDigits = 0) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits,
      }).format(value),
  }),
}));

function buildListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    title: '2021 TIGERCAT 1075B',
    category: 'Logging Equipment',
    subcategory: 'Forwarders',
    make: 'Tigercat',
    model: '1075B',
    year: 2021,
    price: 349000,
    currency: 'USD',
    hours: 3150,
    condition: 'Used',
    description: 'Forwarder',
    images: ['https://example.com/listing.jpg'],
    location: 'Atlanta, Georgia',
    marketValueEstimate: 390000,
    featured: true,
    sellerVerified: true,
    views: 0,
    leads: 0,
    createdAt: new Date().toISOString(),
    specs: {},
    ...overrides,
  };
}

describe('ListingCard component', () => {
  it('renders pricing, badges, and details link', () => {
    render(
      <MemoryRouter>
        <ListingCard listing={buildListing()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Featured Equipment')).toBeInTheDocument();
    expect(screen.getAllByText('Verified Seller').length).toBeGreaterThan(0);
    expect(screen.getByText('2021 Tigercat 1075B')).toBeInTheDocument();
    expect(screen.getByText('$349,000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', expect.stringContaining('/equipment/'));
    expect(screen.getByText('10.5% BELOW AMV')).toBeInTheDocument();
  });

  it('fires inquire, favorite, and compare callbacks', () => {
    const onInquire = vi.fn();
    const onToggleFavorite = vi.fn();
    const onToggleCompare = vi.fn();

    render(
      <MemoryRouter>
        <ListingCard
          listing={buildListing()}
          isFavorite={false}
          isComparing={false}
          onInquire={onInquire}
          onToggleFavorite={onToggleFavorite}
          onToggleCompare={onToggleCompare}
        />
      </MemoryRouter>
    );

    const [favoriteButton, compareButton] = screen.getAllByRole('button').slice(0, 2);
    fireEvent.click(favoriteButton);
    fireEvent.click(compareButton);
    fireEvent.click(screen.getByRole('button', { name: 'Inquire' }));

    expect(onToggleFavorite).toHaveBeenCalledWith('listing-1');
    expect(onToggleCompare).toHaveBeenCalledWith('listing-1');
    expect(onInquire).toHaveBeenCalledWith(expect.objectContaining({ id: 'listing-1' }));
  });

  it('normalizes numeric-style listing ids before favorite and compare callbacks fire', () => {
    const onToggleFavorite = vi.fn();
    const onToggleCompare = vi.fn();

    render(
      <MemoryRouter>
        <ListingCard
          listing={buildListing({ id: 12001 as unknown as Listing['id'] })}
          onToggleFavorite={onToggleFavorite}
          onToggleCompare={onToggleCompare}
        />
      </MemoryRouter>
    );

    const [favoriteButton, compareButton] = screen.getAllByRole('button').slice(0, 2);
    fireEvent.click(favoriteButton);
    fireEvent.click(compareButton);

    expect(onToggleFavorite).toHaveBeenCalledWith('12001');
    expect(onToggleCompare).toHaveBeenCalledWith('12001');
  });
});
