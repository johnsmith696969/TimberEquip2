import { z } from 'zod';

// ── Client → Server event schemas (validated at runtime) ────────────────

const nonEmptyString = z.string().trim().min(1);

export const joinLotSchema = z.object({
  auctionId: nonEmptyString,
  lotId: nonEmptyString,
});

export const leaveLotSchema = z.object({
  auctionId: nonEmptyString,
  lotId: nonEmptyString,
});

export const joinAuctionSchema = z.object({
  auctionId: nonEmptyString,
});

export const leaveAuctionSchema = z.object({
  auctionId: nonEmptyString,
});

// ── Server → Client event payload types ─────────────────────────────────

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

export interface TimeSyncPayload {
  serverTime: number;
}

export interface ServerTimeTickPayload {
  serverTime: number;
  lots: Array<{ lotId: string; endTime: string; status: string }>;
}

// ── Room naming helpers ─────────────────────────────────────────────────

export function lotRoom(auctionId: string, lotId: string): string {
  return `lot:${auctionId}:${lotId}`;
}

export function auctionRoom(auctionId: string): string {
  return `auction:${auctionId}`;
}
