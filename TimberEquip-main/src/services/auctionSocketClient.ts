import { io, type Socket } from 'socket.io-client';
import { auth } from '../firebase';

// ── Types for server → client events ─────────────────────────────────────────

export interface BidPlacedPayload {
  lotId: string;
  auctionId: string;
  bidId: string;
  amount: number;
  bidderAnonymousId: string;
  bidCount: number;
  currentBid: number;
  timestamp: string;
  triggeredExtension: boolean;
  newEndTime: string;
}

export interface LotExtendedPayload {
  lotId: string;
  auctionId: string;
  newEndTime: string;
  extensionCount: number;
  status: 'extended';
}

export interface LotClosedPayload {
  lotId: string;
  auctionId: string;
  finalStatus: 'sold' | 'unsold';
  winningBid: number | null;
  winningBidderAnonymousId: string | null;
}

export interface PresenceUpdatePayload {
  lotId: string;
  auctionId: string;
  watcherCount: number;
}

export interface ServerTimeTickPayload {
  serverTime: number;
  lots: Array<{ lotId: string; endTime: string; status: string }>;
}

// ── Singleton Socket.IO client ───────────────────────────────────────────────

let socket: Socket | null = null;
const joinedRooms = new Set<string>();

async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Returns (and lazily creates) the singleton Socket.IO connection.
 * Authenticated users send their Firebase ID token in the handshake.
 * Anonymous users connect without a token (watch-only).
 */
export function getAuctionSocket(): Socket {
  if (socket) return socket;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  socket = io(origin, {
    path: '/ws',
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    auth: async (cb) => {
      const token = await getAuthToken();
      cb(token ? { token } : {});
    },
  });

  // Auto-rejoin tracked rooms on reconnect
  socket.on('connect', () => {
    for (const room of joinedRooms) {
      const parts = room.split(':');
      if (parts[0] === 'lot' && parts.length === 3) {
        socket!.emit('join_lot', { auctionId: parts[1], lotId: parts[2] });
      } else if (parts[0] === 'auction' && parts.length === 2) {
        socket!.emit('join_auction', { auctionId: parts[1] });
      }
    }
  });

  socket.connect();
  return socket;
}

// ── Room management ──────────────────────────────────────────────────────────

export function joinLotRoom(auctionId: string, lotId: string): void {
  const s = getAuctionSocket();
  const key = `lot:${auctionId}:${lotId}`;
  if (!joinedRooms.has(key)) {
    joinedRooms.add(key);
    s.emit('join_lot', { auctionId, lotId });
  }
  // Also track auction-level room
  const aKey = `auction:${auctionId}`;
  if (!joinedRooms.has(aKey)) {
    joinedRooms.add(aKey);
    // Server auto-joins auction room on join_lot, but track locally
  }
}

export function leaveLotRoom(auctionId: string, lotId: string): void {
  const s = getAuctionSocket();
  const key = `lot:${auctionId}:${lotId}`;
  joinedRooms.delete(key);
  s.emit('leave_lot', { auctionId, lotId });
}

export function joinAuctionRoom(auctionId: string): void {
  const s = getAuctionSocket();
  const key = `auction:${auctionId}`;
  if (!joinedRooms.has(key)) {
    joinedRooms.add(key);
    s.emit('join_auction', { auctionId });
  }
}

export function leaveAuctionRoom(auctionId: string): void {
  const s = getAuctionSocket();
  const key = `auction:${auctionId}`;
  joinedRooms.delete(key);
  s.emit('leave_auction', { auctionId });
}

/**
 * Request a server time sync. Returns a promise that resolves with the
 * server timestamp. Falls back to Date.now() on error/timeout.
 */
export function requestTimeSync(): Promise<number> {
  const s = getAuctionSocket();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(Date.now()), 3000);
    s.emit('request_time_sync', {}, (response: { serverTime: number }) => {
      clearTimeout(timeout);
      resolve(response.serverTime);
    });
  });
}

/**
 * Disconnect and cleanup the singleton socket.
 * Call when the user navigates away from all auction pages.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    joinedRooms.clear();
  }
}
