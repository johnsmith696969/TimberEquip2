import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingModal } from '../components/admin/ListingModal';

const { getFullTaxonomy, uploadListingImageWithPublishingVariants } = vi.hoisted(() => ({
  getFullTaxonomy: vi.fn(),
  uploadListingImageWithPublishingVariants: vi.fn(),
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
  storageService: {
    uploadListingImageWithPublishingVariants,
  },
}));

describe('ListingModal component', () => {
  beforeEach(() => {
    getFullTaxonomy.mockReset();
    uploadListingImageWithPublishingVariants.mockReset();
    getFullTaxonomy.mockResolvedValue({
      'Logging Equipment': {
        Forwarders: {
          TIGERCAT: ['1075B'],
        },
      },
    });
    uploadListingImageWithPublishingVariants.mockResolvedValue({
      detailUrl: 'https://example.com/uploaded-detail.jpg',
      thumbnailUrl: 'https://example.com/uploaded-thumb.jpg',
      formatUsed: 'image/webp',
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

  it('shows image-count validation when a machine has fewer than the required 5 photos', async () => {
    render(
      <ListingModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        listing={{
          id: 'listing-2',
          title: '2020 TIGERCAT 1075B',
          category: 'Logging Equipment',
          subcategory: 'Forwarders',
          manufacturer: 'TIGERCAT',
          make: 'TIGERCAT',
          model: '1075B',
          year: 2020,
          price: 299000,
          currency: 'USD',
          condition: 'Used',
          location: 'Atlanta, Georgia',
          hours: 2800,
          stockNumber: 'QA-2',
          serialNumber: 'SERIAL-2',
          images: [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
            'https://example.com/4.jpg',
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
      expect(screen.getByDisplayValue('2020 TIGERCAT 1075B')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Update Machine' }));

    expect(await screen.findByText('Minimum 5 images required. You have 4.')).toBeInTheDocument();
  });

  it('uploads an image file and appends it to the machine photo gallery', async () => {
    const { container } = render(
      <ListingModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        listing={{
          id: 'listing-3',
          title: '2019 TIGERCAT 1075B',
          category: 'Logging Equipment',
          subcategory: 'Forwarders',
          manufacturer: 'TIGERCAT',
          make: 'TIGERCAT',
          model: '1075B',
          year: 2019,
          price: 279000,
          currency: 'USD',
          condition: 'Used',
          location: 'Atlanta, Georgia',
          hours: 4100,
          stockNumber: 'QA-3',
          serialNumber: 'SERIAL-3',
          images: [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
            'https://example.com/4.jpg',
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
      expect(screen.getByDisplayValue('2019 TIGERCAT 1075B')).toBeInTheDocument();
    });

    const imageInput = container.querySelector('input[type="file"][accept="image/jpeg,image/png,image/webp,image/avif"]') as HTMLInputElement | null;
    expect(imageInput).not.toBeNull();

    const file = new File(['photo-bytes'], 'machine.jpg', { type: 'image/jpeg' });
    fireEvent.change(imageInput!, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadListingImageWithPublishingVariants).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText(/5 \/ 40/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/need 1 more/i)).not.toBeInTheDocument();
  });

  it('lets sellers add per-photo titles', async () => {
    render(
      <ListingModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        listing={({
          id: 'listing-4',
          title: '2018 TIGERCAT 1075B',
          category: 'Logging Equipment',
          subcategory: 'Forwarders',
          manufacturer: 'TIGERCAT',
          make: 'TIGERCAT',
          model: '1075B',
          year: 2018,
          price: 239000,
          currency: 'USD',
          condition: 'Used',
          location: 'Atlanta, Georgia',
          hours: 5100,
          stockNumber: 'QA-4',
          serialNumber: 'SERIAL-4',
          images: [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
            'https://example.com/4.jpg',
            'https://example.com/5.jpg',
          ],
          imageTitles: ['', '', '', '', ''],
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
        } as any)}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('2018 TIGERCAT 1075B')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Photo 1 title'), {
      target: { value: 'Front grapple view' },
    });

    expect(screen.getByDisplayValue('Front grapple view')).toBeInTheDocument();
  });

  it('reorders photos and keeps titles aligned when updating a machine', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ListingModal
        isOpen
        onClose={vi.fn()}
        onSave={onSave}
        listing={({
          id: 'listing-5',
          title: '2017 TIGERCAT 1075B',
          category: 'Logging Equipment',
          subcategory: 'Forwarders',
          manufacturer: 'TIGERCAT',
          make: 'TIGERCAT',
          model: '1075B',
          year: 2017,
          price: 219000,
          currency: 'USD',
          condition: 'Used',
          location: 'Atlanta, Georgia',
          hours: 6200,
          stockNumber: 'QA-5',
          serialNumber: 'SERIAL-5',
          images: [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
            'https://example.com/4.jpg',
            'https://example.com/5.jpg',
          ],
          imageTitles: ['Front', 'Side', 'Cab', 'Boom', 'Rear'],
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
        } as any)}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('2017 TIGERCAT 1075B')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Move photo 2 earlier'));
    fireEvent.click(screen.getByRole('button', { name: 'Update Machine' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        images: [
          'https://example.com/2.jpg',
          'https://example.com/1.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
        ],
        imageTitles: ['Side', 'Front', 'Cab', 'Boom', 'Rear'],
      }));
    });
  });
});
