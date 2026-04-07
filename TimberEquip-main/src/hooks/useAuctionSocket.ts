import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getAuctionSocket,
  joinLotRoom,
  leaveLotRoom,
  joinAuctionRoom,
  leaveAuctionRoom,
  requestTimeSync,
  type BidPlacedPayload,
  type LotExtendedPayload,
  type LotClosedPayload,
  type PresenceUpdatePayload,
  type ServerTimeTickPayload,
} from '../services/auctionSocketClient';

export interface UseAuctionSocketOptions {
  auctionId: string;
  lotId?: string;
  onBidPlaced?: (payload: BidPlacedPayload) => void;
  onLotExtended?: (payload: LotExtendedPayload) => void;
  onLotClosed?: (payload: LotClosedPayload) => void;
  onTimeTick?: (payload: ServerTimeTickPayload) => void;
}

export interface UseAuctionSocketResult {
  isConnected: boolean;
  watcherCount: number;
  /** serverTime - Date.now() in ms — add to Date.now() for server-corrected time */
  serverTimeOffset: number;
}

/**
 * React hook for real-time auction Socket.IO integration.
 *
 * Joins the auction room (and optionally a lot room), subscribes to events,
 * and provides connection state, watcher count, and server time offset.
 *
 * Event callbacks are stored in refs to avoid unnecessary re-subscriptions.
 */
export function useAuctionSocket(options: UseAuctionSocketOptions): UseAuctionSocketResult {
  const { auctionId, lotId } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [watcherCount, setWatcherCount] = useState(0);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  // Store callbacks in refs to avoid re-subscription on every render
  const onBidPlacedRef = useRef(options.onBidPlaced);
  const onLotExtendedRef = useRef(options.onLotExtended);
  const onLotClosedRef = useRef(options.onLotClosed);
  const onTimeTickRef = useRef(options.onTimeTick);

  onBidPlacedRef.current = options.onBidPlaced;
  onLotExtendedRef.current = options.onLotExtended;
  onLotClosedRef.current = options.onLotClosed;
  onTimeTickRef.current = options.onTimeTick;

  // Perform initial time sync
  const syncTime = useCallback(async () => {
    try {
      const serverTime = await requestTimeSync();
      setServerTimeOffset(serverTime - Date.now());
    } catch {
      // Ignore — offset stays at 0
    }
  }, []);

  useEffect(() => {
    if (!auctionId) return; // No-op until auction ID is available

    const socket = getAuctionSocket();

    // Connection state tracking
    const handleConnect = () => {
      setIsConnected(true);
      syncTime();
    };
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial state
    setIsConnected(socket.connected);
    if (socket.connected) {
      syncTime();
    }

    // Join rooms
    if (lotId) {
      joinLotRoom(auctionId, lotId);
    } else {
      joinAuctionRoom(auctionId);
    }

    // Event handlers
    const handleBidPlaced = (payload: BidPlacedPayload) => {
      onBidPlacedRef.current?.(payload);
    };

    const handleLotExtended = (payload: LotExtendedPayload) => {
      onLotExtendedRef.current?.(payload);
    };

    const handleLotClosed = (payload: LotClosedPayload) => {
      onLotClosedRef.current?.(payload);
    };

    const handlePresenceUpdate = (payload: PresenceUpdatePayload) => {
      if (lotId && payload.lotId === lotId && payload.auctionId === auctionId) {
        setWatcherCount(payload.watcherCount);
      }
    };

    const handleTimeTick = (payload: ServerTimeTickPayload) => {
      setServerTimeOffset(payload.serverTime - Date.now());
      onTimeTickRef.current?.(payload);
    };

    socket.on('bid_placed', handleBidPlaced);
    socket.on('lot_extended', handleLotExtended);
    socket.on('lot_closed', handleLotClosed);
    socket.on('presence_update', handlePresenceUpdate);
    socket.on('server_time_tick', handleTimeTick);

    return () => {
      // Leave rooms
      if (lotId) {
        leaveLotRoom(auctionId, lotId);
      } else {
        leaveAuctionRoom(auctionId);
      }

      // Remove listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('bid_placed', handleBidPlaced);
      socket.off('lot_extended', handleLotExtended);
      socket.off('lot_closed', handleLotClosed);
      socket.off('presence_update', handlePresenceUpdate);
      socket.off('server_time_tick', handleTimeTick);
    };
  }, [auctionId, lotId, syncTime]);

  return { isConnected, watcherCount, serverTimeOffset };
}
