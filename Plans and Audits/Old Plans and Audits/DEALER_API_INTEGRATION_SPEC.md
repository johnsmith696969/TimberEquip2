# Dealer Equipment Feed Integration - Technical Specification

**Status:** Design Phase - Not Yet Implemented  
**Priority:** Critical for Q2 Launch  
**Estimated Effort:** 10-15 days of development

---

## Executive Overview

This document outlines the architecture needed to ingest equipment listings from third-party dealer APIs and integrate them into the TimberEquip marketplace.

### Goals
1. Pull equipment data from multiple dealer sources via API
2. Normalize dealer data to TimberEquip schema
3. Handle duplicate detection (same equipment from multiple dealers)
4. Maintain audit trail of data sources
5. Allow dealers to manage their feed status
6. Provide real-time updates or scheduled syncs

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Dealer External APIs                        │
│              (Dealer A, Dealer B, Dealer C, etc.)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ (HTTP/REST/GraphQL)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              Dealer Feed Ingestion Endpoint                      │
│                   /api/dealer/ingest                            │
│         (Authentication: API Key + Rate Limiting)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│           Data Validation & Normalization Layer                 │
│   • Schema validation                                            │
│   • Field mapping (dealer fields → TimberEquip fields)          │
│   • Data quality checks                                         │
│   • Currency/unit conversion                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│         Duplicate Detection & De-duplication                    │
│   • Hash equipment by (make, model, year, engine, etc.)        │
│   • Track dealer source                                         │
│   • Merge duplicates or show as variants                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│          Firestore / TimberEquip Database                       │
│   • dealerListings collection                                  │
│   • dealerFeeds collection                                     │
│   • dealerAuditLog collection                                  │
│   • equipmentDuplicates collection                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              Search/Browse Integration                          │
│   • Filter by data source (dealer vs. private seller)          │
│   • Show all variants if duplicates                            │
│   • Price comparison across dealers                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components Needed

### 1. Dealer Feed Management Service

**File:** `src/services/dealerFeedService.ts`

```typescript
interface DealerFeed {
  id: string;
  dealerName: string;
  dealerEmail: string;
  apiKey: string; // API key for their inbound feed
  apiEndpoint?: string; // URL if we poll vs. they push
  webhookSecret?: string; // For webhook authentication
  status: 'active' | 'paused' | 'disabled';
  syncMode: 'pull' | 'push'; // Do we poll or do they send webhooks?
  syncFrequency?: 'hourly' | 'daily' | 'weekly'; // If pull mode
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  totalListingsSync: number;
  totalListingsActive: number;
  totalListingsDeleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  fieldMapping: {
    externalField: string;
    timberequipField: string;
  }[];
}

interface DealerListingSync {
  id: string;
  dealerFeedId: string;
  externalListingId: string; // Dealer's internal ID
  timberequipListingId: string; // Our listing ID
  equipmentHash: string; // Hash for duplicate detection
  status: 'active' | 'archived' | 'deleted';
  externalData: Record<string, any>; // Store original dealer data
  mappedData: any; // Our normalized schema
  syncedAt: Date;
  updatedAt: Date;
}

interface DealerAuditLog {
  id: string;
  dealerFeedId: string;
  action: 'SYNC_START' | 'SYNC_SUCCESS' | 'SYNC_FAILED' | 'LISTING_ADDED' | 'LISTING_UPDATED' | 'LISTING_DELETED' | 'DUPLICATE_DETECTED';
  details: string;
  errorMessage?: string;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  timestamp: Date;
}

export const dealerFeedService = {
  // ── Dealer Feed Management ──
  async registerDealerFeed(config: Omit<DealerFeed, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealerFeed>,
  async updateDealerFeed(feedId: string, updates: Partial<DealerFeed>): Promise<void>,
  async disableDealerFeed(feedId: string): Promise<void>,
  async getDealerFeed(feedId: string): Promise<DealerFeed | null>,
  async listDealerFeeds(): Promise<DealerFeed[]>,
  
  // ── Sync Operations ──
  async pullFromDealerAPI(feedId: string): Promise<SyncResult>,
  async processDealerListing(feedId: string, dealerData: any): Promise<{ timberequipListingId: string; isDuplicate: boolean }>,
  
  // ── Audit & Monitoring ──
  async getDealerAuditLog(feedId: string, limit: number): Promise<DealerAuditLog[]>,
  async logDealerAction(feedId: string, action: string, details: any): Promise<void>,
};
```

**Methods to implement:**

1. **`registerDealerFeed(config)`**
   - Creates new dealer feed configuration
   - Generates unique API key for webhook authentication
   - Initializes field mapping
   - Sets first sync time

2. **`updateDealerFeed(feedId, updates)`**
   - Modify dealer feed settings
   - Change sync frequency
   - Update field mapping
   - Pause/resume feeds

3. **`pullFromDealerAPI(feedId)`**
   - Fetch data from dealer endpoint (if pull mode)
   - Validate API response
   - Process each listing
   - Return sync statistics

4. **`processDealerListing(feedId, dealerData)`**
   - Normalize dealer data to Listing schema
   - Check for duplicates
   - Store mapping info
   - Create/update listing

---

### 2. Backend API Endpoints

**File:** `server.ts` - Add these routes:

```typescript
// ── DEALER FEED INGESTION ENDPOINTS ──

// POST /api/dealer/register - Register new dealer (admin only)
app.post('/api/dealer/register', requireAdminAuth, async (req, res) => {
  // Create dealer feed configuration
  // Generate API key
  // Return configuration with key
});

// POST /api/dealer/webhook/:feedId - Receive webhook from dealer
app.post('/api/dealer/webhook/:feedId', verifyDealerWebhook, async (req, res) => {
  // Parse dealer webhook payload
  // Validate equipment data
  // Process to Firestore
  // Return 200 OK
});

// GET /api/dealer/feed/:feedId - Get feed status (admin)
app.get('/api/dealer/feed/:feedId', requireAdminAuth, async (req, res) => {
  // Return feed stats and last sync info
});

// POST /api/dealer/sync/:feedId - Manually trigger sync (admin)
app.post('/api/dealer/sync/:feedId', requireAdminAuth, async (req, res) => {
  // Trigger immediate pull from dealer API
  // Return sync results
});

// GET /api/dealer/audit/:feedId - Get audit log (admin)
app.get('/api/dealer/audit/:feedId', requireAdminAuth, async (req, res) => {
  // Return recent audit log entries
});

// ── LISTING ENDPOINTS (Modified) ──

// GET /api/listings?includeDealer=true - Include dealer listings in results
app.get('/api/listings', async (req, res) => {
  // If includeDealer=true, fetch from both:
  // - listings (user/private seller)
  // - dealerListings (dealer feeds)
  // - Filter duplicates or show all variants
});
```

**Webhook Verification:**
```typescript
function verifyDealerWebhook(req: express.Request, res: express.Response, next: express.NextFunction) {
  const feedId = req.params.feedId;
  const signature = req.headers['x-dealer-signature'];
  
  // Look up dealer feed
  const feed = db.collection('dealerFeeds').doc(feedId);
  
  // Verify HMAC signature:
  // const computed = hmac('sha256', feed.webhookSecret, req.rawBody);
  // if (computed !== signature) return res.status(401).json({error: 'Unauthorized'});
  
  next();
}
```

---

### 3. Data Schema & Firestore Collections

**Collections to create:**

#### `dealerFeeds`
```firestore
dealerFeeds/
├── feedId1/
│   ├── dealerName: "John Deere Equipment Co"
│   ├── dealerEmail: "api@deere.com"
│   ├── apiKey: "sk_dealer_abc123xyz"
│   ├── status: "active"
│   ├── syncMode: "pull"
│   ├── syncFrequency: "daily"
│   ├── lastSyncAt: 2026-03-22T14:30:00Z
│   ├── totalListingsActive: 247
│   ├── fieldMapping: [
│   │   {externalField: "item_id", timberequipField: "externalId"},
│   │   {externalField: "title", timberequipField: "title"},
│   │   ...
│   │]
│   ├── createdAt: 2026-01-15T10:00:00Z
│   └── updatedAt: 2026-03-22T14:30:00Z
└── feedId2/
    └── ...
```

#### `dealerListings`
```firestore
dealerListings/
├── dealer_1_item_12345/
│   ├── dealerFeedId: "feedId1"
│   ├── externalListingId: "12345"
│   ├── timberequipListingId: "listing_abc123" # Reference to main listing
│   ├── equipmentHash: "sha256_hash_of_make_model_year"
│   ├── status: "active"
│   ├── externalData: {
│   │   "item_id": "12345",
│   │   "title": "2015 John Deere 950K Skidder",
│   │   "source_url": "https://dealer.com/item/12345",
│   │   "raw_json": {...}
│   │ }
│   ├── mappedData: {
│   │   // All fields matching Listing schema
│   │   "title": "2015 John Deere 950K Skidder",
│   │   "price": 48500,
│   │   "make": "John Deere",
│   │   "model": "950K",
│   │   "year": 2015,
│   │   ...
│   │ }
│   ├── dealerSourceUrl: "https://dealer.com/item/12345"
│   ├── dataSource: "dealer"
│   ├── syncedAt: 2026-03-22T14:30:00Z
│   └── updatedAt: 2026-03-22T14:30:00Z
└── dealer_1_item_12346/
    └── ...
```

#### `equipmentDuplicates`
```firestore
equipmentDuplicates/
├── hash_abc123/
│   ├── equipmentHash: "sha256_hash"
│   ├── make: "John Deere"
│   ├── model: "950K"
│   ├── year: 2015
│   ├── engine: "6-cyl Diesel"
│   ├── variants: [
│   │   {
│   │     listing_id: "listing_123",
│   │     source: "user",
│   │     price: 48500,
│   │     dealer: null,
│   │     syncedAt: 2026-03-22T12:00:00Z
│   │   },
│   │   {
│   │     listing_id: "dealer_1_item_12345",
│   │     source: "dealer",
│   │     price: 47900,
│   │     dealer: "feedId1",
│   │     dealerName: "John Deere Equipment Co",
│   │     dealerSourceUrl: "https://dealer.com/item/12345",
│   │     syncedAt: 2026-03-22T14:30:00Z
│   │   },
│   │   ...
│   │ ]
│   ├── primaryListing: "listing_123"
│   ├── updatedAt: 2026-03-22T14:30:00Z
└── hash_def456/
    └── ...
```

#### `dealerAuditLogs`
```firestore
dealerAuditLogs/
├── log1/
│   ├── dealerFeedId: "feedId1"
│   ├── action: "SYNC_SUCCESS"
│   ├── details: "Successfully synced 250 listings"
│   ├── itemsProcessed: 250
│   ├── itemsSucceeded: 248
│   ├── itemsFailed: 2
│   ├── errorMessage: null
│   ├── timestamp: 2026-03-22T14:30:00Z
└── log2/
    └── ...
```

---

### 4. Data Normalization Layer

**File:** `src/services/dealerDataNormalizer.ts`

```typescript
interface NormalizerConfig {
  fieldMapping: {
    externalField: string;
    timberequipField: string;
    transform?: (value: any) => any;
  }[];
  categoryMap: {
    externalCategory: string;
    timberequipCategory: string;
  }[];
  defaultValues?: Record<string, any>;
}

interface NormalizationResult {
  success: boolean;
  normalized?: Listing;
  errors: {field: string; message: string}[];
  warnings: {field: string; message: string}[];
}

export class DealerDataNormalizer {
  constructor(config: NormalizerConfig) { }
  
  normalize(dealerData: any): NormalizationResult {
    // 1. Validate required fields
    // 2. Map fields using fieldMapping
    // 3. Apply transforms (e.g., normalize price currency)
    // 4. Map categories
    // 5. Validate against Listing schema
    // 6. Return normalized object + any warnings
  }
  
  private validateRequired(data: any, required: string[]): string[] {
    // Return array of missing fields
  }
  
  private mapFields(dealerData: any): any {
    // Map external fields to TimberEquip fields
  }
  
  private applyBusinessRules(normalized: any): any {
    // Apply rules: no negative prices, default status to 'pending', etc.
  }
}
```

**Example usage:**
```typescript
const normalizer = new DealerDataNormalizer({
  fieldMapping: [
    {externalField: 'item_id', timberequipField: 'externalId'},
    {externalField: 'title', timberequipField: 'title'},
    {externalField: 'price_usd', timberequipField: 'price'},
    {externalField: 'hours_used', timberequipField: 'specs.hours'},
    {externalField: 'condition_code', timberequipField: 'condition', transform: (code) => CONDITION_MAP[code]},
  ],
  categoryMap: [
    {externalCategory: 'skidder', timberequipCategory: 'Logging Equipment/Skidders'},
  ]
});

const result = normalizer.normalize(dealerData);
// result = { success: true, normalized: {...}, errors: [], warnings: [] }
```

---

### 5. Duplicate Detection

**File:** `src/services/equipmentDeduplicator.ts`

```typescript
interface EquipmentHash {
  make: string;
  model: string;  
  year: number;
  engine?: string;
  horsepower?: number;
  transmission?: string;
}

export class EquipmentDeduplicator {
  generateHash(equipment: EquipmentHash): string {
    // Create SHA256 hash of (make + model + year + engine + hp)
    // Used to detect same equipment from multiple dealers
    const str = [
      equipment.make?.toUpperCase(),
      equipment.model?.toUpperCase(),
      equipment.year,
      equipment.engine?.toUpperCase(),
      equipment.horsepower,
      equipment.transmission?.toUpperCase()
    ].filter(Boolean).join('|');
    
    return crypto.createHash('sha256').update(str).digest('hex');
  }
  
  async findDuplicates(listing: Listing): Promise<{
    isDuplicate: boolean;
    existingVariants: Listing[];
    matchScore: number;
  }> {
    const hash = this.generateHash({...listing});
    
    // Look up in equipmentDuplicates collection
    const existing = await db.collection('equipmentDuplicates')
      .doc(hash).get();
    
    if (!existing.exists()) {
      return { isDuplicate: false, existingVariants: [], matchScore: 0 };
    }
    
    // Return existing variants
    return {
      isDuplicate: true,
      existingVariants: await this.getVariantListings(existing.data()),
      matchScore: 95 // Out of 100
    };
  }
}
```

---

### 6. Cloud Function for Scheduled Sync

**File:** `functions/dealer-feed-processor.mjs`

```javascript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import admin from 'firebase-admin';

export const processDealerFeeds = onSchedule(
  {
    schedule: 'every 6 hours', // Run every 6 hours
    memory: '1GB',
    timeoutSeconds: 540,
  },
  async (context) => {
    const db = admin.firestore();
    
    // 1. Get all active dealer feeds
    const feeds = await db.collection('dealerFeeds')
      .where('status', '==', 'active')
      .where('syncMode', '==', 'pull')
      .get();
    
    // 2. For each feed, pull data
    for (const feedDoc of feeds.docs) {
      const feed = feedDoc.data();
      
      try {
        // Call dealer API endpoint
        const response = await fetch(feed.apiEndpoint, {
          headers: {
            'Authorization': `Bearer ${feed.apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        const dealerListings = await response.json();
        
        // 3. Process each listing
        let succeeded = 0;
        let failed = 0;
        for (const dealerItem of dealerListings) {
          try {
            await processSingleDealerItem(feedDoc.id, feed, dealerItem);
            succeeded++;
          } catch (err) {
            logger.warn(`Failed to process item ${dealerItem.item_id}:`, err);
            failed++;
          }
        }
        
        // 4. Log sync results
        await db.collection('dealerAuditLogs').add({
          dealerFeedId: feedDoc.id,
          action: 'SYNC_SUCCESS',
          details: `Synced ${dealerListings.length} listings`,
          itemsProcessed: dealerListings.length,
          itemsSucceeded: succeeded,
          itemsFailed: failed,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // 5. Update feed lastSyncAt
        await feedDoc.ref.update({
          lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
          nextSyncAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // +6 hours
        });
        
      } catch (error) {
        logger.error(`Failed to sync dealer feed ${feedDoc.id}:`, error);
        await db.collection('dealerAuditLogs').add({
          dealerFeedId: feedDoc.id,
          action: 'SYNC_FAILED',
          errorMessage: error.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
);

async function processSingleDealerItem(feedId, feed, dealerItem) {
  // Normalize, de-duplicate, and save
}
```

---

### 7. Admin UI for Dealer Management

**File:** `src/pages/admin/DealerManagement.tsx`

```typescript
export function DealerManagement() {
  const [feeds, setFeeds] = useState<DealerFeed[]>([]);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<DealerFeed | null>(null);
  
  useEffect(() => {
    // Load all dealer feeds
    fetchDealerFeeds();
  }, []);
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Dealer Equipment Feeds</h1>
        <button onClick={() => setShowAddFeed(true)}>Add Dealer Feed</button>
      </div>
      
      {/* Feeds List */}
      <div className="grid gap-4">
        {feeds.map(feed => (
          <div key={feed.id} className="border p-4 rounded">
            <div className="flex justify-between">
              <div>
                <h3>{feed.dealerName}</h3>
                <p>{feed.status === 'active' ? 'Active' : 'Paused'}</p>
                <p>Last sync: {feed.lastSyncAt ? formatDate(feed.lastSyncAt) : 'Never'}</p>
                <p>Active listings: {feed.totalListingsActive}</p>
              </div>
              <div className="space-x-2">
                <button onClick={() => syncFeedNow(feed.id)}>Sync Now</button>
                <button onClick={() => setSelectedFeed(feed)}>Edit</button>
                <button onClick={() => viewAuditLog(feed.id)}>View Log</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modals for add/edit */}
      {showAddFeed && <AddDealerFeedModal onClose={() => setShowAddFeed(false)} />}
      {selectedFeed && <EditDealerFeedModal feed={selectedFeed} onClose={() => setSelectedFeed(null)} />}
    </div>
  );
}
```

---

## Implementation Phases

### Phase 1: Foundation (3-4 days)
- [ ] Create Firestore collections and security rules
- [ ] Implement `dealerFeedService.ts`
- [ ] Build API endpoints (`/api/dealer/register`, `/api/dealer/webhook`)
- [ ] Implement webhook verification
- [ ] Add Firebase security rules for dealer collections

### Phase 2: Data Pipeline (2-3 days)
- [ ] Implement `DealerDataNormalizer`
- [ ] Implement `EquipmentDeduplicator`
- [ ] Write unit tests for normalization
- [ ] Handle currency conversion if needed
- [ ] Create mapping configuration system

### Phase 3: Sync Operations (2-3 days)
- [ ] Implement `pullFromDealerAPI()`
- [ ] Build Cloud Function for scheduled syncs
- [ ] Implement audit logging
- [ ] Add error recovery and retry logic
- [ ] Test with mock dealer data

### Phase 4: Admin UI (2-3 days)
- [ ] Build `DealerManagement.tsx` component
- [ ] Add feed status dashboard
- [ ] Implement manual sync trigger
- [ ] Build audit log viewer
- [ ] Add field mapping UI

### Phase 5: Search Integration (1-2 days)
- [ ] Modify search to include dealer listings
- [ ] Handle duplicate display options
- [ ] Add data source filters
- [ ] Show dealer badge on listings
- [ ] Update comparison tool for dealer items

### Phase 6: Testing & Refinement (2-3 days)
- [ ] End-to-end testing with real dealer APIs
- [ ] Performance testing (large feeds)
- [ ] Error scenario testing
- [ ] User acceptance testing
- [ ] Documentation

---

## API Flow Examples

### Example 1: Dealer Registration (Admin)
```
POST /api/dealer/register
{
  "dealerName": "John Deere Equipment Co",
  "dealerEmail": "api@deere.com",
  "syncMode": "push",
  "webhookSecret": "secret_xyz123"
}

Response:
{
  "feedId": "dealer_feed_abc123",
  "apiKey": "sk_dealer_abc123xyz_secretkey",
  "webhookUrl": "https://timberequip.com/api/dealer/webhook/dealer_feed_abc123",
  "message": "Feed created. Send equipment to the webhook URL with header 'X-Dealer-Signature: <HMAC>'."
}
```

### Example 2: Dealer Sends Listing (Webhook)
```
POST https://timberequip.com/api/dealer/webhook/dealer_feed_abc123
X-Dealer-Signature: hmac_sha256_signature_here

{
  "action": "CREATE",
  "item_id": "DEE_12345",
  "title": "2015 John Deere 950K Skidder",
  "price": 48500,
  "hours": 2450,
  "condition": "USED",
  "category": "skidder",
  "images": ["https://dealer.com/img1.jpg"],
  "specs": {
    "engine": "6-jug Diesel",
    "horsepower": 180,
    "weight": 52000,
    "transmission": "Hydrostatic"
  }
}

Response:
{
  "success": true,
  "timberequipListingId": "listing_xyz789",
  "isDuplicate": false,
  "message": "Listing created successfully"
}
```

### Example 3: Check for Duplicates
```
GET /api/listings?makeModel=2015+John+Deere+950K

Response:
[
  {
    "id": "listing_abc",
    "title": "2015 Deere 950K Skidder - Well Maintained",
    "price": 48500,
    "source": "user",
    "seller": "Private Owner"
  },
  {
    "id": "dealer_feed_abc123_item_12345",
    "title": "2015 John Deere 950K Skidder",
    "price": 47900,
    "source": "dealer",
    "dealer": "John Deere Equipment Co"
  },
  {
    "id": "dealer_feed_xyz789_item_67890",
    "title": "2015 JD 950K Skidder - Excellent Condition",
    "price": 49200,
    "source": "dealer",
    "dealer": "Timber Equipment Solutions"
  }
]
```

---

## Security Considerations

### API Key Management
- [ ] Generate unique API key per dealer feed
- [ ] Store securely (never expose in frontend)
- [ ] Support key rotation
- [ ] Log all key usage
- [ ] Revoke compromised keys immediately

### Webhook Verification
- [ ] HMAC-SHA256 signature validation
- [ ] Replay attack prevention (timestamp validation)
- [ ] Rate limiting per dealer
- [ ] IP whitelisting (optional)

### Firestore Rules
```
match /dealerFeeds/{feedId} {
  allow read: if request.auth.token['admin'] == true;
  allow write: if request.auth.token['admin'] == true;
}

match /dealerListings/{listingId} {
  allow read: if true; // Public for search
  allow write: if false; // Only backend functions
}

match /dealerAuditLogs/{logId} {
  allow read: if request.auth.token['admin'] == true;
  allow write: if false;
}
```

---

## Monitoring & Observability

### Metrics to Track
- [ ] Total dealer listings ingested
- [ ] Duplicate detection rate
- [ ] Sync error rate
- [ ] Average sync duration
- [ ] Dealer data freshness

### Alerting
- [ ] Alert if dealer feed hasn't synced in 24 hours
- [ ] Alert if sync error rate > 5%
- [ ] Alert if duplicate rate > 30%
- [ ] Alert on API key expiration

### Logging
All operations should be audit logged:
- Dealer feed creation/updates
- Each sync operation
- Duplicate detections
- Error details
- Data transformations

---

## Future Enhancements

### Phase 2 Improvements
1. **GraphQL API** instead of REST
2. **Real-time updates** via Pub/Sub instead of polling
3. **Machine learning** for better duplicate detection
4. **Automatic field mapping** discovery
5. **Price comparison** insights dashboard
6. **Dealer rating** based on data quality
7. **Multi-source inventory** management for dealers

---

## Questions for Stakeholders

**Before building, confirm:**

1. **Dealer Participation**
   - Which dealers will participate?
   - Do you have API docs from them?
   - Are they charging for this or you paying them?
   - What's their data refresh frequency?

2. **Data Schema**
   - What fields do dealers typically provide?
   - Do you need custom fields per dealer?
   - What's minimum required data?
   - How do you handle missing fields?

3. **Duplicate Strategy**
   - Show all variants or just primary listing?
   - How to decide which variant is "primary"?
   - Should duplicates link to each other?
   - How do you handle price differences?

4. **Search Experience**
   - Should dealer listings appear in main search by default?
   - Can users filter "dealer only" vs "private seller only"?
   - Show data source badge on listings?
   - Impact on marketplace stats/trending?

5. **Business Rules**
   - Do dealer listings get same approval workflow?
   - Any commission or fees for dealer listings?
   - Data retention (how long kept after dealer removes)?
   - Competition with your own sellers?

6. **Support & Operations**
   - Who manages dealer relationships?
   - Escalation path for data issues?
   - SLA for feed availability?
   - Dispute resolution process?

---

## Success Metrics

Once implemented, you'll have:
- ✅ Real-time dealer inventory integration
- ✅ 30-50% more listings on the platform
- ✅ Automated data pipeline
- ✅ Scalable dealer onboarding
- ✅ Better price discovery for buyers
- ✅ Unique marketplace edge vs. competitors

---

**Next Steps:**
1. Get dealer API documentation
2. Collect sample data from dealers
3. Meet with stakeholders on design questions
4. Finalize implementation plan
5. Start Phase 1 development
