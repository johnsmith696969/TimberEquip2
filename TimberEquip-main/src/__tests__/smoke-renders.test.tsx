/**
 * Smoke tests — verify each page module can be imported and exports a component.
 * Firebase is mocked to avoid requiring API keys in the test environment.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock firebase before any page imports (all pages transitively import firebase.ts)
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null, onAuthStateChanged: vi.fn(() => vi.fn()) },
  storage: {},
}));

// Mock firebase/auth to avoid initialization errors
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null, onAuthStateChanged: vi.fn(() => vi.fn()) })),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  updateProfile: vi.fn(),
  multiFactor: vi.fn(() => ({ enrolledFactors: [] })),
  PhoneAuthProvider: vi.fn(),
  PhoneMultiFactorGenerator: { assertion: vi.fn() },
  RecaptchaVerifier: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  deleteUser: vi.fn(),
  updatePassword: vi.fn(),
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [], forEach: vi.fn() })),
  getDocFromServer: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  Timestamp: { now: vi.fn(() => ({ toDate: () => new Date() })), fromDate: vi.fn() },
  serverTimestamp: vi.fn(),
  increment: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
  writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: vi.fn() })),
  documentId: vi.fn(),
  getCountFromServer: vi.fn(() => Promise.resolve({ data: () => ({ count: 0 }) })),
}));

// Mock firebase/storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
  listAll: vi.fn(() => Promise.resolve({ items: [], prefixes: [] })),
}));

describe('Page module smoke tests', () => {
  it('Home exports a component', async () => {
    const mod = await import('../pages/Home');
    expect(typeof mod.Home).toBe('function');
  });

  it('Search exports a component', async () => {
    const mod = await import('../pages/Search');
    expect(typeof mod.Search).toBe('function');
  });

  it('About exports a component', async () => {
    const mod = await import('../pages/About');
    expect(typeof mod.About).toBe('function');
  });

  it('Contact exports a component', async () => {
    const mod = await import('../pages/Contact');
    expect(typeof mod.Contact).toBe('function');
  });

  it('NotFound exports a component', async () => {
    const mod = await import('../pages/NotFound');
    expect(typeof mod.NotFound).toBe('function');
  });

  it('Login exports a component', async () => {
    const mod = await import('../pages/Login');
    expect(typeof mod.Login).toBe('function');
  });

  it('Register exports a component', async () => {
    const mod = await import('../pages/Register');
    expect(typeof mod.Register).toBe('function');
  });

  it('Privacy exports a component', async () => {
    const mod = await import('../pages/Privacy');
    expect(typeof mod.Privacy).toBe('function');
  });

  it('Terms exports a component', async () => {
    const mod = await import('../pages/Terms');
    expect(typeof mod.Terms).toBe('function');
  });

  it('Cookies exports a component', async () => {
    const mod = await import('../pages/Cookies');
    expect(typeof mod.Cookies).toBe('function');
  });

  it('Financing exports a component', async () => {
    const mod = await import('../pages/Financing');
    expect(typeof mod.Financing).toBe('function');
  });

  it('Blog exports a component', async () => {
    const mod = await import('../pages/Blog');
    expect(typeof mod.Blog).toBe('function');
  });

  it('AdPrograms exports a component', async () => {
    const mod = await import('../pages/AdPrograms');
    expect(typeof mod.AdPrograms).toBe('function');
  });

  it('Categories exports a component', async () => {
    const mod = await import('../pages/Categories');
    expect(typeof mod.Categories).toBe('function');
  });

  it('Sell exports a component', async () => {
    const mod = await import('../pages/Sell');
    expect(typeof mod.Sell).toBe('function');
  });

  it('ListingDetail exports a component', async () => {
    const mod = await import('../pages/ListingDetail');
    expect(typeof mod.ListingDetail).toBe('function');
  });

  it('SellerProfile exports a component', async () => {
    const mod = await import('../pages/SellerProfile');
    expect(typeof mod.SellerProfile).toBe('function');
  });

  it('Profile exports a component', async () => {
    const mod = await import('../pages/Profile');
    expect(typeof mod.Profile).toBe('function');
  });

  it('AdminDashboard exports a component', async () => {
    const mod = await import('../pages/AdminDashboard');
    expect(typeof mod.AdminDashboard).toBe('function');
  });

  it('DealerOS exports a component', async () => {
    const mod = await import('../pages/DealerOS');
    expect(typeof mod.DealerOS).toBe('function');
  });

  it('Dmca exports a component', async () => {
    const mod = await import('../pages/Dmca');
    expect(typeof mod.Dmca).toBe('function');
  });

  it('Bookmarks exports a component', async () => {
    const mod = await import('../pages/Bookmarks');
    expect(typeof mod.Bookmarks).toBe('function');
  });

  it('Inspections exports a component', async () => {
    const mod = await import('../pages/Inspections');
    expect(typeof mod.Inspections).toBe('function');
  });

  it('Auctions exports a component', async () => {
    const mod = await import('../pages/Auctions');
    expect(typeof mod.Auctions).toBe('function');
  });

  it('SubscriptionSuccess exports a component', async () => {
    const mod = await import('../pages/SubscriptionSuccess');
    expect(typeof mod.SubscriptionSuccess).toBe('function');
  });

  it('Compare exports a component', async () => {
    const mod = await import('../pages/Compare');
    expect(typeof mod.Compare).toBe('function');
  });

  it('SeoLandingPages exports ForestryHubPage', async () => {
    const mod = await import('../pages/SeoLandingPages');
    expect(typeof mod.ForestryHubPage).toBe('function');
  });

  it('SeoLandingPages exports DealerDirectoryPage', async () => {
    const mod = await import('../pages/SeoLandingPages');
    expect(typeof mod.DealerDirectoryPage).toBe('function');
  });
});

describe('Core component smoke tests', () => {
  it('Seo exports a component', async () => {
    const mod = await import('../components/Seo');
    expect(typeof mod.Seo).toBe('function');
  });

  it('ErrorBoundary exports a component', async () => {
    const mod = await import('../components/ErrorBoundary');
    expect(typeof mod.ErrorBoundary).toBe('function');
  });

  it('ThemeContext exports ThemeProvider', async () => {
    const mod = await import('../components/ThemeContext');
    expect(typeof mod.ThemeProvider).toBe('function');
  });

  it('LocaleContext exports LocaleProvider', async () => {
    const mod = await import('../components/LocaleContext');
    expect(typeof mod.LocaleProvider).toBe('function');
  });
});
