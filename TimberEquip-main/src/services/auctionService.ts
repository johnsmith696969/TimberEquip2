import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { API_BASE } from '../constants/api';
import { auth, auctionDb as db } from '../firebase';
import type { Auction, AuctionBid, AuctionInvoice, AuctionLot, AuctionLotStatus, AuctionStatus, BidderProfile, Listing } from '../types';

function normalizeSeoSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Strip reservePrice from lot data — only expose hasReserve + reserveMet to public users */
function sanitizeLot(lot: AuctionLot): AuctionLot {
  const hasReserve = lot.reservePrice != null && lot.reservePrice > 0;
  const { reservePrice: _rp, ...rest } = lot as AuctionLot & { reservePrice?: unknown };
  return { ...rest, hasReserve } as AuctionLot;
}

async function getAuthorizedJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawBody = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    throw new Error(String(payload?.error || rawBody || `Auction request failed (${response.status}).`));
  }

  return payload as T;
}

export interface AuctionBidderStatusResponse {
  auction: Auction | null;
  profile: BidderProfile | null;
  registrationComplete: boolean;
  canBid: boolean;
  identityVerified: boolean;
  paymentMethodReady: boolean;
  bidderApproved: boolean;
  legalAccepted: boolean;
}

export interface AuctionAssignableListingsResponse {
  listings: Listing[];
  count: number;
}

export interface CreateAuctionLotInput {
  listingId: string;
  lotNumber?: string;
  closeOrder?: number;
  startingBid?: number;
  reservePrice?: number | null;
  buyerPremiumPercent?: number;
  promoted?: boolean;
  promotedOrder?: number;
  startTime?: string;
  endTime?: string;
  storageFeePerDay?: number;
  paymentDeadlineDays?: number;
  removalDeadlineDays?: number;
  isTitledItem?: boolean;
}

export interface PlaceAuctionBidInput {
  amount: number;
}

export interface AuctionInvoicePaymentSessionResponse {
  invoice: AuctionInvoice;
  cardEligible: boolean;
  paymentMethodOptions: Array<'wire' | 'card'>;
  url?: string;
  sessionId?: string;
}

export interface AuctionInvoiceSettlementResponse {
  invoice: AuctionInvoice;
  lot: AuctionLot;
}

export interface AuctionAdminBidderSummary {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  phone: string | null;
  verificationTier: string | null;
  idVerificationStatus: string | null;
  bidderApprovedAt: string | null;
  defaultPaymentMethodBrand: string | null;
  defaultPaymentMethodLast4: string | null;
  defaultPaymentMethodFunding: string | null;
}

export interface AuctionLotInvoiceResponse {
  invoice: AuctionInvoice;
  cardEligible: boolean;
  paymentMethodOptions: Array<'wire' | 'card'>;
  buyer?: AuctionAdminBidderSummary | null;
}

export interface AuctionTaxExemptCertificate {
  userUid: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  taxExempt: boolean;
  taxExemptState: string | null;
  taxExemptCertificateUrl: string | null;
  taxExemptCertificateUploadedAt: string | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  legalAcceptedAuctionSlug: string | null;
  legalAcceptedAuctionId: string | null;
  bidderApprovedAt: string | null;
  idVerificationStatus: string | null;
  paymentMethodReady: boolean;
}

export interface AuctionTaxExemptCertificatesResponse {
  certificates: AuctionTaxExemptCertificate[];
  count: number;
  requestedAt: string;
}

export const auctionService = {
  async getAuctions(): Promise<Auction[]> {
    const q = query(collection(db, 'auctions'), orderBy('startTime', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Auction));
  },

  async getAuctionsByStatus(status: AuctionStatus): Promise<Auction[]> {
    const q = query(collection(db, 'auctions'), where('status', '==', status), orderBy('startTime', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Auction));
  },

  async getAuctionBySlug(slug: string): Promise<Auction | null> {
    const q = query(collection(db, 'auctions'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Auction;
  },

  async getAuction(id: string): Promise<Auction | null> {
    const d = await getDoc(doc(db, 'auctions', id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as Auction;
  },

  async createAuction(data: Omit<Auction, 'id' | 'createdAt' | 'updatedAt' | 'lotCount' | 'totalBids' | 'totalGMV'>): Promise<string> {
    const slug = data.slug || normalizeSeoSlug(data.title);
    const ref = await addDoc(collection(db, 'auctions'), {
      ...data,
      slug,
      lotCount: 0,
      totalBids: 0,
      totalGMV: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return ref.id;
  },

  async updateAuction(id: string, data: Partial<Auction>): Promise<void> {
    await updateDoc(doc(db, 'auctions', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async updateAuctionStatus(id: string, status: AuctionStatus): Promise<void> {
    await updateDoc(doc(db, 'auctions', id), {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteAuction(id: string): Promise<void> {
    const lotsSnap = await getDocs(collection(db, 'auctions', id, 'lots'));
    const batch = writeBatch(db);
    lotsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'auctions', id));
    await batch.commit();
  },

  async getLots(auctionId: string): Promise<AuctionLot[]> {
    const q = query(collection(db, 'auctions', auctionId, 'lots'), orderBy('closeOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => sanitizeLot({ id: d.id, ...d.data() } as AuctionLot));
  },

  async getLot(auctionId: string, lotId: string): Promise<AuctionLot | null> {
    const d = await getDoc(doc(db, 'auctions', auctionId, 'lots', lotId));
    if (!d.exists()) return null;
    return sanitizeLot({ id: d.id, ...d.data() } as AuctionLot);
  },

  async getLotByNumber(auctionId: string, lotNumber: string): Promise<AuctionLot | null> {
    const q = query(collection(db, 'auctions', auctionId, 'lots'), where('lotNumber', '==', lotNumber));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return sanitizeLot({ id: d.id, ...d.data() } as AuctionLot);
  },

  async getAuctionWithLot(auctionSlug: string, lotNumber: string): Promise<{ auction: Auction | null; lot: AuctionLot | null }> {
    const auction = await this.getAuctionBySlug(auctionSlug);
    if (!auction?.id) {
      return { auction: null, lot: null };
    }
    const lot = await this.getLotByNumber(auction.id, lotNumber);
    return { auction, lot };
  },

  async addLot(auctionId: string, data: Omit<AuctionLot, 'id' | 'bidCount' | 'uniqueBidders' | 'lastBidTime' | 'currentBid' | 'currentBidderId' | 'currentBidderAnonymousId' | 'extensionCount' | 'reserveMet' | 'winningBidderId' | 'winningBid' | 'watcherIds' | 'watcherCount'>): Promise<string> {
    const ref = await addDoc(collection(db, 'auctions', auctionId, 'lots'), {
      ...data,
      auctionId,
      currentBid: 0,
      currentBidderId: null,
      currentBidderAnonymousId: '',
      bidCount: 0,
      uniqueBidders: 0,
      lastBidTime: null,
      extensionCount: 0,
      reserveMet: false,
      winningBidderId: null,
      winningBid: null,
      watcherIds: [],
      watcherCount: 0,
    });
    await updateDoc(doc(db, 'auctions', auctionId), {
      lotCount: increment(1),
      updatedAt: new Date().toISOString(),
    });
    return ref.id;
  },

  async updateLot(auctionId: string, lotId: string, data: Partial<AuctionLot>): Promise<void> {
    await updateDoc(doc(db, 'auctions', auctionId, 'lots', lotId), data);
  },

  async removeLot(auctionId: string, lotId: string): Promise<void> {
    await deleteDoc(doc(db, 'auctions', auctionId, 'lots', lotId));
    await updateDoc(doc(db, 'auctions', auctionId), {
      lotCount: increment(-1),
      updatedAt: new Date().toISOString(),
    });
  },

  async reorderLots(auctionId: string, lotOrders: { lotId: string; closeOrder: number }[]): Promise<void> {
    const batch = writeBatch(db);
    for (const { lotId, closeOrder } of lotOrders) {
      batch.update(doc(db, 'auctions', auctionId, 'lots', lotId), { closeOrder });
    }
    await batch.commit();
  },

  async getBids(auctionId: string, lotId: string): Promise<AuctionBid[]> {
    const q = query(collection(db, 'auctions', auctionId, 'lots', lotId, 'bids'), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuctionBid));
  },

  onAuctionChange(auctionId: string, callback: (auction: Auction | null) => void): () => void {
    return onSnapshot(doc(db, 'auctions', auctionId), (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as Auction);
    });
  },

  onLotsChange(auctionId: string, callback: (lots: AuctionLot[]) => void): () => void {
    const q = query(collection(db, 'auctions', auctionId, 'lots'), orderBy('closeOrder', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuctionLot)));
    });
  },

  onLotChange(auctionId: string, lotId: string, callback: (lot: AuctionLot | null) => void): () => void {
    return onSnapshot(doc(db, 'auctions', auctionId, 'lots', lotId), (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as AuctionLot);
    });
  },

  onBidsChange(auctionId: string, lotId: string, callback: (bids: AuctionBid[]) => void): () => void {
    const q = query(collection(db, 'auctions', auctionId, 'lots', lotId, 'bids'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuctionBid)));
    });
  },

  async getInvoicesForAuction(auctionId: string): Promise<AuctionInvoice[]> {
    const q = query(collection(db, 'invoices'), where('auctionId', '==', auctionId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuctionInvoice));
  },

  async getInvoicesForUser(userId: string): Promise<AuctionInvoice[]> {
    const q = query(collection(db, 'invoices'), where('buyerId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuctionInvoice));
  },

  async updateInvoice(invoiceId: string, data: Partial<AuctionInvoice>): Promise<void> {
    await updateDoc(doc(db, 'invoices', invoiceId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async getBidderProfile(userId: string): Promise<BidderProfile | null> {
    const d = await getDoc(doc(db, 'users', userId, 'bidderProfile', 'profile'));
    if (!d.exists()) return null;
    return d.data() as BidderProfile;
  },

  async saveBidderProfile(userId: string, data: Partial<BidderProfile>): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'bidderProfile', 'profile'), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async getBidderStatus(auctionSlug?: string | null): Promise<AuctionBidderStatusResponse> {
    const normalizedAuctionSlug = String(auctionSlug || '').trim();
    const path = normalizedAuctionSlug
      ? `${API_BASE}/auctions/${encodeURIComponent(normalizedAuctionSlug)}/bidder-status`
      : `${API_BASE}/auctions/bidder-status`;
    return getAuthorizedJson<AuctionBidderStatusResponse>(path);
  },

  async saveBidderProfileForAuction(auctionSlug: string | null | undefined, data: Partial<BidderProfile>): Promise<AuctionBidderStatusResponse> {
    const normalizedAuctionSlug = String(auctionSlug || '').trim();
    const path = normalizedAuctionSlug
      ? `${API_BASE}/auctions/${encodeURIComponent(normalizedAuctionSlug)}/bidder-profile`
      : `${API_BASE}/auctions/bidder-profile`;
    return getAuthorizedJson<AuctionBidderStatusResponse>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createBidderIdentitySession(auctionSlug?: string | null): Promise<{ url: string; sessionId: string }> {
    const normalizedAuctionSlug = String(auctionSlug || '').trim();
    const path = normalizedAuctionSlug
      ? `${API_BASE}/auctions/${encodeURIComponent(normalizedAuctionSlug)}/identity-session`
      : `${API_BASE}/auctions/bidder-identity-session`;
    return getAuthorizedJson<{ url: string; sessionId: string }>(path, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async createBidderPaymentSetupSession(auctionSlug?: string | null): Promise<{ url: string; sessionId: string }> {
    const normalizedAuctionSlug = String(auctionSlug || '').trim();
    const path = normalizedAuctionSlug
      ? `${API_BASE}/auctions/${encodeURIComponent(normalizedAuctionSlug)}/payment-setup-session`
      : `${API_BASE}/auctions/bidder-payment-setup-session`;
    return getAuthorizedJson<{ url: string; sessionId: string }>(path, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async syncBidderPaymentSetupSession(sessionId: string, auctionSlug = ''): Promise<AuctionBidderStatusResponse> {
    const params = new URLSearchParams();
    if (auctionSlug.trim()) {
      params.set('auctionSlug', auctionSlug.trim());
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return getAuthorizedJson<AuctionBidderStatusResponse>(`${API_BASE}/auctions/bidder-setup-session/${encodeURIComponent(sessionId)}${suffix}`);
  },

  async getAdminTaxExemptCertificates(): Promise<AuctionTaxExemptCertificatesResponse> {
    return getAuthorizedJson<AuctionTaxExemptCertificatesResponse>(`${API_BASE}/admin/auctions/tax-exempt-certificates`);
  },

  async getAssignableListings(auctionId: string, searchQuery = ''): Promise<AuctionAssignableListingsResponse> {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    return getAuthorizedJson<AuctionAssignableListingsResponse>(`${API_BASE}/admin/auctions/${encodeURIComponent(auctionId)}/assignable-listings?${params.toString()}`);
  },

  async createAdminAuctionLot(auctionId: string, payload: CreateAuctionLotInput): Promise<{ lot: AuctionLot }> {
    return getAuthorizedJson<{ lot: AuctionLot }>(`${API_BASE}/admin/auctions/${encodeURIComponent(auctionId)}/lots`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAdminAuctionLot(auctionId: string, lotId: string, payload: Partial<CreateAuctionLotInput>): Promise<{ lot: AuctionLot }> {
    return getAuthorizedJson<{ lot: AuctionLot }>(`${API_BASE}/admin/auctions/${encodeURIComponent(auctionId)}/lots/${encodeURIComponent(lotId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async removeAdminAuctionLot(auctionId: string, lotId: string): Promise<{ success: true }> {
    return getAuthorizedJson<{ success: true }>(`${API_BASE}/admin/auctions/${encodeURIComponent(auctionId)}/lots/${encodeURIComponent(lotId)}`, {
      method: 'DELETE',
    });
  },

  async placeBid(auctionSlug: string, lotNumber: string, payload: PlaceAuctionBidInput): Promise<{ lot: AuctionLot; bid: AuctionBid }> {
    return getAuthorizedJson<{ lot: AuctionLot; bid: AuctionBid }>(`${API_BASE}/auctions/${encodeURIComponent(auctionSlug)}/lots/${encodeURIComponent(lotNumber)}/bids`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getLotInvoice(auctionSlug: string, lotNumber: string): Promise<AuctionLotInvoiceResponse> {
    return getAuthorizedJson(`${API_BASE}/auctions/${encodeURIComponent(auctionSlug)}/lots/${encodeURIComponent(lotNumber)}/invoice`);
  },

  async getAuctionInvoice(invoiceId: string): Promise<{ invoice: AuctionInvoice; cardEligible: boolean; paymentMethodOptions: Array<'wire' | 'card'> }> {
    return getAuthorizedJson(`${API_BASE}/auctions/invoices/${encodeURIComponent(invoiceId)}`);
  },

  async createAuctionInvoicePaymentSession(invoiceId: string, paymentMethod: 'wire' | 'card'): Promise<AuctionInvoicePaymentSessionResponse> {
    return getAuthorizedJson<AuctionInvoicePaymentSessionResponse>(`${API_BASE}/auctions/invoices/${encodeURIComponent(invoiceId)}/payment-session`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  },

  async adminSettleAuctionInvoice(invoiceId: string): Promise<AuctionInvoiceSettlementResponse> {
    return getAuthorizedJson<AuctionInvoiceSettlementResponse>(`${API_BASE}/admin/auctions/invoices/${encodeURIComponent(invoiceId)}/settlement`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getBidIncrement(currentBid: number): number {
    if (currentBid < 250) return 10;
    if (currentBid < 500) return 25;
    if (currentBid < 1000) return 50;
    if (currentBid < 5000) return 100;
    if (currentBid < 10000) return 250;
    if (currentBid < 25000) return 500;
    if (currentBid < 50000) return 1000;
    if (currentBid < 100000) return 2500;
    if (currentBid < 250000) return 5000;
    return 10000;
  },

  getBuyerPremium(amount: number): number {
    if (amount <= 25000) return Math.max(amount * 0.10, 100);
    if (amount <= 75000) return Math.max(amount * 0.05, 2500);
    return 3500;
  },

  formatTimeRemaining(endTime: string): string {
    const remaining = new Date(endTime).getTime() - Date.now();
    if (remaining <= 0) return 'Ended';
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  },
};
