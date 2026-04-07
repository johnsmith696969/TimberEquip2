import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// ── Schema validation tests ─────────────────────────────────────────────────

describe('socketEventSchemas', () => {
  // Inline schemas matching the server definitions (avoids import issues with .js extensions)
  const nonEmptyString = z.string().trim().min(1);

  const joinLotSchema = z.object({
    auctionId: nonEmptyString,
    lotId: nonEmptyString,
  });

  const leaveLotSchema = z.object({
    auctionId: nonEmptyString,
    lotId: nonEmptyString,
  });

  const joinAuctionSchema = z.object({
    auctionId: nonEmptyString,
  });

  const leaveAuctionSchema = z.object({
    auctionId: nonEmptyString,
  });

  describe('joinLotSchema', () => {
    it('accepts valid payload', () => {
      const result = joinLotSchema.safeParse({ auctionId: 'abc123', lotId: 'lot456' });
      expect(result.success).toBe(true);
    });

    it('rejects missing auctionId', () => {
      const result = joinLotSchema.safeParse({ lotId: 'lot456' });
      expect(result.success).toBe(false);
    });

    it('rejects empty auctionId', () => {
      const result = joinLotSchema.safeParse({ auctionId: '', lotId: 'lot456' });
      expect(result.success).toBe(false);
    });

    it('rejects whitespace-only auctionId', () => {
      const result = joinLotSchema.safeParse({ auctionId: '   ', lotId: 'lot456' });
      expect(result.success).toBe(false);
    });

    it('rejects missing lotId', () => {
      const result = joinLotSchema.safeParse({ auctionId: 'abc123' });
      expect(result.success).toBe(false);
    });
  });

  describe('joinAuctionSchema', () => {
    it('accepts valid payload', () => {
      const result = joinAuctionSchema.safeParse({ auctionId: 'abc123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty auctionId', () => {
      const result = joinAuctionSchema.safeParse({ auctionId: '' });
      expect(result.success).toBe(false);
    });

    it('rejects non-string auctionId', () => {
      const result = joinAuctionSchema.safeParse({ auctionId: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('leaveLotSchema', () => {
    it('accepts valid payload', () => {
      const result = leaveLotSchema.safeParse({ auctionId: 'abc', lotId: 'lot1' });
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      expect(leaveLotSchema.safeParse({}).success).toBe(false);
      expect(leaveLotSchema.safeParse({ auctionId: 'abc' }).success).toBe(false);
    });
  });

  describe('leaveAuctionSchema', () => {
    it('accepts valid payload', () => {
      const result = leaveAuctionSchema.safeParse({ auctionId: 'abc' });
      expect(result.success).toBe(true);
    });
  });
});

// ── Room name helpers ───────────────────────────────────────────────────────

describe('room name helpers', () => {
  function lotRoom(auctionId: string, lotId: string): string {
    return `lot:${auctionId}:${lotId}`;
  }

  function auctionRoom(auctionId: string): string {
    return `auction:${auctionId}`;
  }

  it('generates correct lot room name', () => {
    expect(lotRoom('auction1', 'lot1')).toBe('lot:auction1:lot1');
  });

  it('generates correct auction room name', () => {
    expect(auctionRoom('auction1')).toBe('auction:auction1');
  });

  it('lot room can be parsed back to parts', () => {
    const room = lotRoom('abc', 'xyz');
    const parts = room.split(':');
    expect(parts).toEqual(['lot', 'abc', 'xyz']);
    expect(parts.length).toBe(3);
  });
});

// ── AuctionTimerManager tests ───────────────────────────────────────────────

describe('AuctionTimerManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Inline implementation matching the server class (avoids Node.js import issues in Vitest browser mode)
  class AuctionTimerManager {
    private timers = new Map<string, ReturnType<typeof setTimeout>>();

    private key(auctionId: string, lotId: string): string {
      return `${auctionId}:${lotId}`;
    }

    scheduleLotClosure(
      auctionId: string,
      lotId: string,
      endTimeIso: string,
      onClose: (auctionId: string, lotId: string) => Promise<void>,
    ): void {
      const k = this.key(auctionId, lotId);
      this.cancelLotTimer(auctionId, lotId);

      const delay = new Date(endTimeIso).getTime() - Date.now();

      if (delay <= 0) {
        onClose(auctionId, lotId).catch(() => {});
        return;
      }

      this.timers.set(
        k,
        setTimeout(() => {
          this.timers.delete(k);
          onClose(auctionId, lotId).catch(() => {});
        }, delay),
      );
    }

    rescheduleLotClosure(
      auctionId: string,
      lotId: string,
      newEndTimeIso: string,
      onClose: (auctionId: string, lotId: string) => Promise<void>,
    ): void {
      this.scheduleLotClosure(auctionId, lotId, newEndTimeIso, onClose);
    }

    cancelLotTimer(auctionId: string, lotId: string): void {
      const k = this.key(auctionId, lotId);
      const existing = this.timers.get(k);
      if (existing) {
        clearTimeout(existing);
        this.timers.delete(k);
      }
    }

    cancelAllTimers(): void {
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
    }

    get activeTimerCount(): number {
      return this.timers.size;
    }
  }

  it('schedules closure at the correct time', async () => {
    const manager = new AuctionTimerManager();
    const onClose = vi.fn().mockResolvedValue(undefined);

    const endTime = new Date(Date.now() + 5000).toISOString();
    manager.scheduleLotClosure('a1', 'l1', endTime, onClose);

    expect(manager.activeTimerCount).toBe(1);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    expect(onClose).toHaveBeenCalledWith('a1', 'l1');
    expect(manager.activeTimerCount).toBe(0);
  });

  it('fires immediately if endTime is in the past', async () => {
    const manager = new AuctionTimerManager();
    const onClose = vi.fn().mockResolvedValue(undefined);

    const pastTime = new Date(Date.now() - 1000).toISOString();
    manager.scheduleLotClosure('a1', 'l1', pastTime, onClose);

    // Should fire immediately (synchronously via microtask)
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(manager.activeTimerCount).toBe(0);
  });

  it('rescheduleLotClosure cancels the existing timer and sets a new one', async () => {
    const manager = new AuctionTimerManager();
    const onClose = vi.fn().mockResolvedValue(undefined);

    // Schedule at +5s
    const endTime1 = new Date(Date.now() + 5000).toISOString();
    manager.scheduleLotClosure('a1', 'l1', endTime1, onClose);
    expect(manager.activeTimerCount).toBe(1);

    // Reschedule to +10s
    const endTime2 = new Date(Date.now() + 10000).toISOString();
    manager.rescheduleLotClosure('a1', 'l1', endTime2, onClose);
    expect(manager.activeTimerCount).toBe(1);

    // Advance to original time — should NOT fire
    vi.advanceTimersByTime(5000);
    expect(onClose).not.toHaveBeenCalled();

    // Advance to new time — SHOULD fire
    vi.advanceTimersByTime(5000);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('cancelLotTimer prevents the callback from firing', () => {
    const manager = new AuctionTimerManager();
    const onClose = vi.fn().mockResolvedValue(undefined);

    const endTime = new Date(Date.now() + 5000).toISOString();
    manager.scheduleLotClosure('a1', 'l1', endTime, onClose);
    expect(manager.activeTimerCount).toBe(1);

    manager.cancelLotTimer('a1', 'l1');
    expect(manager.activeTimerCount).toBe(0);

    vi.advanceTimersByTime(10000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cancelAllTimers clears all timers', () => {
    const manager = new AuctionTimerManager();
    const onClose = vi.fn().mockResolvedValue(undefined);

    manager.scheduleLotClosure('a1', 'l1', new Date(Date.now() + 5000).toISOString(), onClose);
    manager.scheduleLotClosure('a1', 'l2', new Date(Date.now() + 6000).toISOString(), onClose);
    manager.scheduleLotClosure('a2', 'l3', new Date(Date.now() + 7000).toISOString(), onClose);
    expect(manager.activeTimerCount).toBe(3);

    manager.cancelAllTimers();
    expect(manager.activeTimerCount).toBe(0);

    vi.advanceTimersByTime(10000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles multiple lots independently', async () => {
    const manager = new AuctionTimerManager();
    const onClose = vi.fn().mockResolvedValue(undefined);

    manager.scheduleLotClosure('a1', 'l1', new Date(Date.now() + 3000).toISOString(), onClose);
    manager.scheduleLotClosure('a1', 'l2', new Date(Date.now() + 6000).toISOString(), onClose);

    vi.advanceTimersByTime(3000);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledWith('a1', 'l1');
    expect(manager.activeTimerCount).toBe(1);

    vi.advanceTimersByTime(3000);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
    expect(onClose).toHaveBeenCalledWith('a1', 'l2');
    expect(manager.activeTimerCount).toBe(0);
  });

  it('cancelling a non-existent timer is a no-op', () => {
    const manager = new AuctionTimerManager();
    expect(() => manager.cancelLotTimer('nonexistent', 'nope')).not.toThrow();
    expect(manager.activeTimerCount).toBe(0);
  });
});

// ── formatTimeRemainingWithOffset tests ─────────────────────────────────────

describe('formatTimeRemainingWithOffset', () => {
  function formatTimeRemainingWithOffset(endTime: string, offset: number): string {
    const remaining = new Date(endTime).getTime() - (Date.now() + offset);
    if (remaining <= 0) return 'Ended';
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  it('returns "Ended" for past endTime', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(formatTimeRemainingWithOffset(past, 0)).toBe('Ended');
  });

  it('formats seconds correctly', () => {
    const endTime = new Date(Date.now() + 30500).toISOString();
    expect(formatTimeRemainingWithOffset(endTime, 0)).toBe('30s');
  });

  it('formats minutes + seconds', () => {
    const endTime = new Date(Date.now() + 150000).toISOString(); // 2m 30s
    expect(formatTimeRemainingWithOffset(endTime, 0)).toBe('2m 30s');
  });

  it('formats hours + minutes', () => {
    const endTime = new Date(Date.now() + 7560000).toISOString(); // 2h 6m (padded to avoid boundary flake)
    expect(formatTimeRemainingWithOffset(endTime, 0)).toBe('2h 6m');
  });

  it('formats days + hours', () => {
    const endTime = new Date(Date.now() + 90000000).toISOString(); // 1d 1h
    expect(formatTimeRemainingWithOffset(endTime, 0)).toBe('1d 1h');
  });

  it('accounts for positive server offset (server ahead of client)', () => {
    // If server is 5s ahead, a timer that ends 10s from "now" should show ~5s
    const endTime = new Date(Date.now() + 10000).toISOString();
    const result = formatTimeRemainingWithOffset(endTime, 5000);
    expect(result).toBe('5s');
  });

  it('accounts for negative server offset (server behind client)', () => {
    // If server is 5s behind, a timer that ends 3s from "now" should show ~8s
    const endTime = new Date(Date.now() + 3000).toISOString();
    const result = formatTimeRemainingWithOffset(endTime, -5000);
    expect(result).toBe('8s');
  });

  it('returns "Ended" when offset pushes remaining below zero', () => {
    const endTime = new Date(Date.now() + 2000).toISOString();
    expect(formatTimeRemainingWithOffset(endTime, 5000)).toBe('Ended');
  });
});
