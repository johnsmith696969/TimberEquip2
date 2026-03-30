import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingModal } from '../components/admin/ListingModal';

const { getFullTaxonomy } = vi.hoisted(() => ({
  getFullTaxonomy: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const MockDiv = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MockDiv },
  };
});

vi.mock('../services/taxonomyService', () => ({
  taxonomyService: {
    getFullTaxonomy,
  },
}));

vi.mock('../constants/equipmentData', () => ({
  EQUIPMENT_TAXONOMY: {
    'Logging Equipment': {
      Forwarders: ['TIGERCAT'],
    },
  },
}));

vi.mock('../constants/categorySpecs', () => ({
  getSchemaForListing: () => ({
    displayName: 'Forwarder',
    specs: [],
    checklist: [],
    attachmentOptions: [],
  }),
}));

vi.mock('../services/storageService', () => ({
  storageService: {},
}));

describe('ListingModal component', () => {
  beforeEach(() => {
    getFullTaxonomy.mockReset();
    getFullTaxonomy.mockResolvedValue({
      'Logging Equipment': {
        Forwarders: {
          TIGERCAT: ['1075B'],
        },
      },
    });
  });

  it('shows validation when required listing fields are missing', async () => {
    render(
      <ListingModal isOpen onClose={vi.fn()} onSave={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Publish Listing' }));

    expect(await screen.findByText('Listing title is required.')).toBeInTheDocument();
  });

  it('submits an existing machine when required fields are present', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ListingModal
        isOpen
        onClose={vi.fn()}
        onSave={onSave}
        listing={{
          id: 'listing-1',
          title: '2021 TIGERCAT 1075B',
          category: 'Logging Equipment',
          subcategory: 'Forwarders',
          manufacturer: 'TIGERCAT',
          make: 'TIGERCAT',
          model: '1075B',
          year: 2021,
          price: 349000,
          currency: 'USD',
          condition: 'Used',
          location: 'Atlanta, Georgia',
          hours: 3150,
          stockNumber: 'QA-1',
          serialNumber: 'SERIAL-1',
          images: [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
            'https://example.com/4.jpg',
            'https://example.com/5.jpg',
          ],
          imageVariants: [],
          videoUrls: [],
          description: 'Forwarder test listing',
          featured: false,
          sellerVerified: false,
          conditionChecklist: {
            engineChecked: false,
            undercarriageChecked: false,
            hydraulicsLeakStatus: '',
            serviceRecordsAvailable: false,
            partsManualAvailable: false,
            serviceManualAvailable: false,
          },
          specs: {},
        } as any}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('2021 TIGERCAT 1075B')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Update Machine' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        id: 'listing-1',
        title: '2021 TIGERCAT 1075B',
        make: 'TIGERCAT',
      }));
    });
  });
});
