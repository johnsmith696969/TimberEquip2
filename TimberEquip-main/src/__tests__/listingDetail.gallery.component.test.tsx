import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing, Seller } from '../types';

const {
  getListingMock,
  getSellerMock,
  getSellerListingUsageMock,
  getMarketValueMock,
  getMarketMatchRecommendationsMock,
  useAuthMock,
  useLocaleMock,
} = vi.hoisted(() => ({
  getListingMock: vi.fn(),
  getSellerMock: vi.fn(),
  getSellerListingUsageMock: vi.fn(),
  getMarketValueMock: vi.fn(),
  getMarketMatchRecommendationsMock: vi.fn(),
  useAuthMock: vi.fn(),
  useLocaleMock: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const MockDiv = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;
  const MockImg = (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />;
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MockDiv, img: MockImg },
  };
});

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: (api: { zoomIn: () => void; zoomOut: () => void; resetTransform: () => void }) => React.ReactNode }) => (
    <div>{children({ zoomIn: () => undefined, zoomOut: () => undefined, resetTransform: () => undefined })}</div>
  ),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../services/equipmentService', () => ({
  equipmentService: {
    getListing: getListingMock,
    getSeller: getSellerMock,
    getSellerListingUsage: getSellerListingUsageMock,
    getMarketValue: getMarketValueMock,
    getMarketMatchRecommendations: getMarketMatchRecommendationsMock,
    recordListingView: vi.fn().mockResolvedValue(true),
    getCachedPublicListings: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('../components/AuthContext', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../components/LocaleContext', () => ({
  useLocale: useLocaleMock,
}));

vi.mock('../components/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('../services/recaptchaService', () => ({
  getRecaptchaToken: vi.fn(),
  assessRecaptcha: vi.fn(),
}));

vi.mock('../components/Seo', () => ({
  Seo: () => null,
}));

vi.mock('../components/LoginPromptModal', () => ({
  LoginPromptModal: () => null,
}));

vi.mock('../components/PaymentCalculatorModal', () => ({
  PaymentCalculatorModal: () => null,
}));

vi.mock('../components/WatermarkOverlay', () => ({
  default: () => <div data-testid="watermark-overlay" />,
}));

vi.mock('../utils/listingPath', () => ({
  buildListingPath: () => '/equipment/test-machine--listing-1',
  decodeListingPublicKey: (value: string) => value,
  extractListingPublicKeyFromSlug: (value: string) => value.split('--').pop() || value,
  isPublicQaOrTestRecord: () => false,
  NOINDEX_ROBOTS: 'noindex, nofollow',
}));

vi.mock('../utils/seoRoutes', () => ({
  buildCategoryPath: vi.fn(() => '/categories/forwarders'),
  buildDealerPath: vi.fn(() => '/dealer/test-dealer'),
  buildManufacturerCategoryPath: vi.fn(() => '/manufacturers/tigercat/forwarders'),
  buildManufacturerModelCategoryPath: vi.fn(() => '/manufacturers/tigercat/1075b/forwarders'),
  buildManufacturerModelPath: vi.fn(() => '/manufacturers/tigercat/1075b'),
  buildManufacturerPath: vi.fn(() => '/manufacturers/tigercat'),
  buildStateCategoryPath: vi.fn(() => '/states/minnesota/forwarders'),
  getCityFromLocation: vi.fn(() => 'Bemidji'),
  getListingCategoryLabel: vi.fn(() => 'Forwarders'),
  getListingManufacturer: vi.fn(() => 'Tigercat'),
  getStateFromLocation: vi.fn(() => 'Minnesota'),
  isDealerRole: vi.fn(() => true),
}));

import { ListingDetail } from '../pages/ListingDetail';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: overrides.id || 'listing-1',
    sellerUid: overrides.sellerUid || 'seller-1',
    sellerId: overrides.sellerId || 'seller-1',
    title: overrides.title || '2021 TIGERCAT 1075B',
    category: overrides.category || 'Logging Equipment',
    subcategory: overrides.subcategory || 'Forwarders',
    make: overrides.make || 'Tigercat',
    manufacturer: overrides.manufacturer || 'Tigercat',
    model: overrides.model || '1075B',
    year: overrides.year ?? 2021,
    price: overrides.price ?? 349000,
    currency: overrides.currency || 'USD',
    hours: overrides.hours ?? 3150,
    condition: overrides.condition || 'Used',
    description: overrides.description || 'Forwarder test listing',
    images: overrides.images || [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
    ],
    imageVariants: overrides.imageVariants || [],
    videoUrls: overrides.videoUrls || [],
    location: overrides.location || 'Bemidji, Minnesota, United States',
    stockNumber: overrides.stockNumber || 'QA-1',
    serialNumber: overrides.serialNumber || 'SER-1',
    features: overrides.features || [],
    featured: overrides.featured ?? false,
    sellerVerified: overrides.sellerVerified ?? true,
    qualityValidated: overrides.qualityValidated ?? true,
    conditionChecklist: overrides.conditionChecklist || {
      engineChecked: false,
      undercarriageChecked: false,
      hydraulicsLeakStatus: '',
      serviceRecordsAvailable: false,
      partsManualAvailable: false,
      serviceManualAvailable: false,
    },
    specs: overrides.specs || {},
    views: overrides.views ?? 0,
    leads: overrides.leads ?? 0,
    status: overrides.status || 'active',
    marketValueEstimate: overrides.marketValueEstimate ?? null,
    createdAt: overrides.createdAt || '2026-03-30T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-03-30T00:00:00.000Z',
    latitude: overrides.latitude ?? 47.4736,
    longitude: overrides.longitude ?? -94.8803,
  } as Listing;
}

function makeSeller(overrides: Partial<Seller> = {}): Seller {
  return {
    id: overrides.id || 'seller-1',
    uid: overrides.uid || 'seller-1',
    name: overrides.name || 'North Woods Equipment',
    type: overrides.type || 'Dealer',
    role: overrides.role || 'dealer',
    location: overrides.location || 'Bemidji, Minnesota',
    phone: overrides.phone || '612-555-0101',
    email: overrides.email || 'dealer@example.com',
    rating: overrides.rating ?? 4.8,
    totalListings: overrides.totalListings ?? 12,
    memberSince: overrides.memberSince || '2024',
    verified: overrides.verified ?? true,
    storefrontName: overrides.storefrontName || 'North Woods Equipment',
  };
}

describe('ListingDetail gallery interactions', () => {
  beforeEach(() => {
    getListingMock.mockReset();
    getSellerMock.mockReset();
    getSellerListingUsageMock.mockReset();
    getMarketValueMock.mockReset();
    getMarketMatchRecommendationsMock.mockReset();

    useAuthMock.mockReturnValue({
      user: null,
      toggleFavorite: vi.fn(),
      isAuthenticated: false,
    });

    useLocaleMock.mockReturnValue({
      t: (_key: string, fallback: string) => fallback,
      formatNumber: (value: number) => String(value),
      formatPrice: (value: number, currency = 'USD') => `${currency} ${value}`,
    });

    getListingMock.mockResolvedValue(makeListing());
    getSellerMock.mockResolvedValue(makeSeller());
    getSellerListingUsageMock.mockResolvedValue(7);
    getMarketValueMock.mockResolvedValue(355000);
    getMarketMatchRecommendationsMock.mockResolvedValue([]);

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('supports fullscreen gallery navigation for listing images', async () => {
    render(
      <MemoryRouter initialEntries={['/equipment/test-machine--listing-1']}>
        <Routes>
          <Route path="/equipment/:slug" element={<ListingDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /2021\s+Tigercat\s+1075B/i })).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
    expect(screen.getAllByRole('button', { name: 'Next image' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Next image' })[0]);
    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close fullscreen image' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Close fullscreen image' })).not.toBeInTheDocument();
    });
  });

  it('renders technical specifications before market match recommendations', async () => {
    getMarketMatchRecommendationsMock.mockResolvedValue([
      makeListing({
        id: 'listing-2',
        title: '2020 TIGERCAT 1075B',
        price: 335000,
        hours: 3000,
      }),
    ]);

    render(
      <MemoryRouter initialEntries={['/equipment/test-machine--listing-1']}>
        <Routes>
          <Route path="/equipment/:slug" element={<ListingDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /technical specifications/i })).toBeInTheDocument();
    const technicalHeading = screen.getByRole('heading', { name: /technical specifications/i });
    const marketMatchHeading = screen.getByRole('heading', { name: /market match recommendations/i });

    const technicalPosition = technicalHeading.compareDocumentPosition(marketMatchHeading);
    expect(technicalPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
