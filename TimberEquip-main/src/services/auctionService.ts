import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, addDoc, onSnapshot, serverTimestamp, Timestamp, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase';
import type { Auction, AuctionLot, AuctionBid, AuctionStatus, AuctionLotStatus, AuctionInvoice } from '../types';

function normalizeSeoSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const auctionService = {

  // ─── Auction CRUD ───

  async getAuctions(): Promise<Auction[]> {
    const q = query(collection(db, 'auctions'), orderBy('startTime', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Auction));
  },

  async getAuctionsByStatus(status: AuctionStatus): Promise<Auction[]> {
    const q = query(collection(db, 'auctions'), where('status', '==', status), orderBy('startTime', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Auction));
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
    await updateDoc(doc(db, 'auctions', id), { status, updatedAt: new Date().toISOString() });
  },

  async deleteAuction(id: string): Promise<void> {
    // Delete all lots first
    const lotsSnap = await getDocs(collection(db, 'auctions', id, 'lots'));
    const batch = writeBatch(db);
    lotsSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'auctions', id));
    await batch.commit();
  },

  // ─── Lot Management ───

  async getLots(auctionId: string): Promise<AuctionLot[]> {
    const q = query(collection(db, 'auctions', auctionId, 'lots'), orderBy('closeOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuctionLot));
  },

  async getLot(auctionId: string, lotId: string): Promise<AuctionLot | null> {
    const d = await getDoc(doc(db, 'auctions', auctionId, 'lots', lotId));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as AuctionLot;
  },

  async getLotByNumber(auctionId: string, lotNumber: string): Promise<AuctionLot | null> {
    const q = query(collection(db, 'auctions', auctionId, 'lots'), where('lotNumber', '==', lotNumber));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as AuctionLot;
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
    // Increment auction lot count
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

  // ─── Bids ───

  async getBids(auctionId: string, lotId: string): Promise<AuctionBid[]> {
    const q = query(
      collection(db, 'auctions', auctionId, 'lots', lotId, 'bids'),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuctionBid));
  },

  // ─── Real-time Listeners ───

  onAuctionChange(auctionId: string, callback: (auction: Auction | null) => void): () => void {
    return onSnapshot(doc(db, 'auctions', auctionId), (snap) => {
      if (!snap.exists()) { callback(null); return; }
      callback({ id: snap.id, ...snap.data() } as Auction);
    });
  },

  onLotsChange(auctionId: string, callback: (lots: AuctionLot[]) => void): () => void {
    const q = query(collection(db, 'auctions', auctionId, 'lots'), orderBy('closeOrder', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuctionLot)));
    });
  },

  onLotChange(auctionId: string, lotId: string, callback: (lot: AuctionLot | null) => void): () => void {
    return onSnapshot(doc(db, 'auctions', auctionId, 'lots', lotId), (snap) => {
      if (!snap.exists()) { callback(null); return; }
      callback({ id: snap.id, ...snap.data() } as AuctionLot);
    });
  },

  onBidsChange(auctionId: string, lotId: string, callback: (bids: AuctionBid[]) => void): () => void {
    const q = query(
      collection(db, 'auctions', auctionId, 'lots', lotId, 'bids'),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuctionBid)));
    });
  },

  // ─── Invoices ───

  async getInvoicesForAuction(auctionId: string): Promise<AuctionInvoice[]> {
    const q = query(collection(db, 'invoices'), where('auctionId', '==', auctionId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuctionInvoice));
  },

  async getInvoicesForUser(userId: string): Promise<AuctionInvoice[]> {
    const q = query(collection(db, 'invoices'), where('buyerId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuctionInvoice));
  },

  async updateInvoice(invoiceId: string, data: Partial<AuctionInvoice>): Promise<void> {
    await updateDoc(doc(db, 'invoices', invoiceId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  // ─── Bidder Profiles ───

  async getBidderProfile(userId: string): Promise<import('../types').BidderProfile | null> {
    const d = await getDoc(doc(db, 'users', userId, 'bidderProfile', 'profile'));
    if (!d.exists()) return null;
    return d.data() as import('../types').BidderProfile;
  },

  async saveBidderProfile(userId: string, data: Partial<import('../types').BidderProfile>): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'bidderProfile', 'profile'), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  // ─── Helpers ───

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

  getBuyerPremium(amount: number, defaultPercent: number = 10): number {
    // Tiered: 10% under $10K, 7% $10K-$75K, 5% $75K-$250K, 3% $250K+
    if (amount < 10000) return amount * 0.10;
    if (amount < 75000) return 1000 + (amount - 10000) * 0.07;
    if (amount < 250000) return 1000 + 4550 + (amount - 75000) * 0.05;
    return 1000 + 4550 + 8750 + (amount - 250000) * 0.03;
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
