import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import {
  joinLotSchema,
  leaveLotSchema,
  joinAuctionSchema,
  leaveAuctionSchema,
  lotRoom,
  auctionRoom,
  type BidPlacedPayload,
  type LotExtendedPayload,
  type LotClosedPayload,
  type PresenceUpdatePayload,
  type ServerTimeTickPayload,
} from './socketEventSchemas.js';
import { AuctionTimerManager } from './auctionTimerManager.js';

// ── Allowed origins (must match server.ts CORS config) ──────────────────

const ALLOWED_ORIGINS: string[] = [
  'https://timberequip.com',
  'https://www.timberequip.com',
  'https://mobile-app-equipment-sales.web.app',
  'https://mobile-app-equipment-sales.firebaseapp.com',
  'https://timberequip-staging.web.app',
];
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5173');
}

// ── Track which auction rooms have active watchers ──────────────────────

const activeAuctionRooms = new Set<string>();

// ── Setup ───────────────────────────────────────────────────────────────

export function setupAuctionSockets(
  httpServer: HttpServer,
  db: Firestore,
  auth: Auth,
): { io: SocketIOServer; timerManager: AuctionTimerManager } {
  const io = new SocketIOServer(httpServer, {
    path: '/ws',
    transports: ['websocket', 'polling'],
    cors: {
      origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ── Auth middleware ──────────────────────────────────────────────────

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (token) {
      try {
        const decoded = await auth.verifyIdToken(token);
        socket.data.uid = decoded.uid;
        socket.data.email = decoded.email || null;
        socket.data.authenticated = true;
      } catch {
        // Invalid token — allow as anonymous watcher
        socket.data.uid = null;
        socket.data.email = null;
        socket.data.authenticated = false;
      }
    } else {
      socket.data.uid = null;
      socket.data.email = null;
      socket.data.authenticated = false;
    }

    next();
  });

  // ── Connection handler ──────────────────────────────────────────────

  io.on('connection', (socket) => {
    // ── join_lot ────────────────────────────────────────────────────
    socket.on('join_lot', (data: unknown) => {
      const parsed = joinLotSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid join_lot payload', code: 'VALIDATION_ERROR' });
        return;
      }
      const { auctionId, lotId } = parsed.data;
      const room = lotRoom(auctionId, lotId);
      socket.join(room);

      // Also join the auction-level room
      const aRoom = auctionRoom(auctionId);
      socket.join(aRoom);
      activeAuctionRooms.add(aRoom);

      emitPresenceUpdate(io, auctionId, lotId);
    });

    // ── leave_lot ──────────────────────────────────────────────────
    socket.on('leave_lot', (data: unknown) => {
      const parsed = leaveLotSchema.safeParse(data);
      if (!parsed.success) return;
      const { auctionId, lotId } = parsed.data;
      socket.leave(lotRoom(auctionId, lotId));
      emitPresenceUpdate(io, auctionId, lotId);
    });

    // ── join_auction ───────────────────────────────────────────────
    socket.on('join_auction', (data: unknown) => {
      const parsed = joinAuctionSchema.safeParse(data);
      if (!parsed.success) return;
      const { auctionId } = parsed.data;
      const room = auctionRoom(auctionId);
      socket.join(room);
      activeAuctionRooms.add(room);
    });

    // ── leave_auction ──────────────────────────────────────────────
    socket.on('leave_auction', (data: unknown) => {
      const parsed = leaveAuctionSchema.safeParse(data);
      if (!parsed.success) return;
      socket.leave(auctionRoom(parsed.data.auctionId));
    });

    // ── request_time_sync ──────────────────────────────────────────
    socket.on('request_time_sync', (_data: unknown, ack?: (response: { serverTime: number }) => void) => {
      const payload = { serverTime: Date.now() };
      if (typeof ack === 'function') {
        ack(payload);
      } else {
        socket.emit('time_sync', payload);
      }
    });

    // ── disconnect — update presence for rooms this socket was in ──
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('lot:')) {
          const parts = room.split(':');
          if (parts.length === 3) {
            // Defer presence update so the leave completes first
            setTimeout(() => emitPresenceUpdate(io, parts[1], parts[2]), 100);
          }
        }
      }
    });
  });

  // ── Periodic server time broadcast (every 10s) ─────────────────────

  const timeTickInterval = setInterval(async () => {
    for (const room of activeAuctionRooms) {
      const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;
      if (roomSize === 0) {
        activeAuctionRooms.delete(room);
        continue;
      }

      const auctionId = room.replace('auction:', '');
      try {
        const lotsSnap = await db
          .collection('auctions')
          .doc(auctionId)
          .collection('lots')
          .where('status', 'in', ['active', 'extended'])
          .get();

        const lots = lotsSnap.docs.map((d) => ({
          lotId: d.id,
          endTime: String(d.data().endTime || ''),
          status: String(d.data().status || ''),
        }));

        const payload: ServerTimeTickPayload = {
          serverTime: Date.now(),
          lots,
        };

        io.to(room).emit('server_time_tick', payload);
      } catch {
        // Silently skip on error — this is a best-effort broadcast
      }
    }
  }, 10_000);

  // ── Timer manager ──────────────────────────────────────────────────

  const timerManager = new AuctionTimerManager();

  // Cleanup on process exit
  const cleanup = () => {
    clearInterval(timeTickInterval);
    timerManager.cancelAllTimers();
  };
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  return { io, timerManager };
}

// ── Emit helpers (called from server.ts after bid/close/activate) ────────

function emitPresenceUpdate(io: SocketIOServer, auctionId: string, lotId: string): void {
  const room = lotRoom(auctionId, lotId);
  const watcherCount = io.sockets.adapter.rooms.get(room)?.size ?? 0;
  const payload: PresenceUpdatePayload = { lotId, auctionId, watcherCount };
  io.to(room).emit('presence_update', payload);
}

export function emitBidPlaced(io: SocketIOServer, payload: BidPlacedPayload): void {
  const room = lotRoom(payload.auctionId, payload.lotId);
  io.to(room).emit('bid_placed', payload);
  io.to(auctionRoom(payload.auctionId)).emit('bid_placed', payload);
}

export function emitLotExtended(io: SocketIOServer, payload: LotExtendedPayload): void {
  const room = lotRoom(payload.auctionId, payload.lotId);
  io.to(room).emit('lot_extended', payload);
  io.to(auctionRoom(payload.auctionId)).emit('lot_extended', payload);
}

export function emitLotClosed(io: SocketIOServer, payload: LotClosedPayload): void {
  const room = lotRoom(payload.auctionId, payload.lotId);
  io.to(room).emit('lot_closed', payload);
  io.to(auctionRoom(payload.auctionId)).emit('lot_closed', payload);
}
