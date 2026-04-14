import type { Firestore } from 'firebase-admin/firestore';

type CloseLotCallback = (auctionId: string, lotId: string) => Promise<void>;

const MAX_TIMEOUT = 2_147_483_647; // ~24.8 days — Node.js setTimeout limit

export class AuctionTimerManager {
  private timers = new Map<string, NodeJS.Timeout>();

  private key(auctionId: string, lotId: string): string {
    return `${auctionId}:${lotId}`;
  }

  /** Schedule lot closure at the exact endTime. */
  scheduleLotClosure(
    auctionId: string,
    lotId: string,
    endTimeIso: string,
    onClose: CloseLotCallback,
  ): void {
    const k = this.key(auctionId, lotId);
    this.cancelLotTimer(auctionId, lotId);

    const delay = new Date(endTimeIso).getTime() - Date.now();

    if (delay <= 0) {
      // Already past endTime — close immediately
      onClose(auctionId, lotId).catch((err) =>
        console.error(`[TimerManager] Immediate close failed ${k}:`, err),
      );
      return;
    }

    if (delay > MAX_TIMEOUT) {
      // Chain: wait MAX_TIMEOUT, then re-schedule the remainder
      this.timers.set(
        k,
        setTimeout(() => {
          this.timers.delete(k);
          this.scheduleLotClosure(auctionId, lotId, endTimeIso, onClose);
        }, MAX_TIMEOUT),
      );
      return;
    }

    this.timers.set(
      k,
      setTimeout(() => {
        this.timers.delete(k);
        onClose(auctionId, lotId).catch((err) =>
          console.error(`[TimerManager] Scheduled close failed ${k}:`, err),
        );
      }, delay),
    );
  }

  /** Cancel + reschedule (used after soft-close extension). */
  rescheduleLotClosure(
    auctionId: string,
    lotId: string,
    newEndTimeIso: string,
    onClose: CloseLotCallback,
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

  /**
   * On server startup, query all active auctions and schedule timers
   * for every active/extended lot. Returns the number of timers scheduled.
   */
  async loadActiveAuctions(
    db: Firestore,
    onClose: CloseLotCallback,
  ): Promise<number> {
    let count = 0;

    const auctionsSnap = await db
      .collection('auctions')
      .where('status', 'in', ['active', 'closed', 'settling'])
      .get();

    for (const auctionDoc of auctionsSnap.docs) {
      const auctionId = auctionDoc.id;
      const lotsSnap = await db
        .collection('auctions')
        .doc(auctionId)
        .collection('lots')
        .where('status', 'in', ['active', 'extended'])
        .get();

      for (const lotDoc of lotsSnap.docs) {
        const lotData = lotDoc.data();
        const endTime = lotData.endTime as string | undefined;
        if (!endTime) continue;

        this.scheduleLotClosure(auctionId, lotDoc.id, endTime, onClose);
        count++;
      }
    }

    console.log(`[TimerManager] Loaded ${count} active lot timers from ${auctionsSnap.size} auctions`);
    return count;
  }
}
