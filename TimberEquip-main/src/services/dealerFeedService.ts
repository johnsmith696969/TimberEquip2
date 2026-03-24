import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export interface DealerFeedItem {
  externalId: string;
  title: string;
  price?: number;
  currency?: string;
  year?: number;
  manufacturer?: string;
  model?: string;
  category?: string;
  condition?: string;
  location?: string;
  imageUrls?: string[];
  description?: string;
  hours?: number;
  [key: string]: unknown;
}

export interface DealerFeedIngestResult {
  processed: number;
  upserted: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
  preview?: Array<{ externalId: string; title: string; action: 'insert' | 'update' | 'skip' }>;
}

export interface DealerFeedLog {
  id: string;
  sourceName: string;
  dealerId: string;
  processedAt: { toDate?: () => Date } | string | number;
  processed: number;
  upserted: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
}

export const dealerFeedService = {
  async ingest(params: {
    sourceName: string;
    dealerId: string;
    dryRun: boolean;
    items: DealerFeedItem[];
  }): Promise<DealerFeedIngestResult> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthorized');

    const token = await user.getIdToken();
    const response = await fetch('/api/admin/dealer-feeds/ingest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error || 'Ingest request failed');
    }

    return payload as DealerFeedIngestResult;
  },

  async getRecentLogs(limitCount = 20): Promise<DealerFeedLog[]> {
    const snap = await getDocs(
      query(
        collection(db, 'dealerFeedIngestLogs'),
        orderBy('processedAt', 'desc'),
        limit(limitCount),
      )
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DealerFeedLog));
  },
};
