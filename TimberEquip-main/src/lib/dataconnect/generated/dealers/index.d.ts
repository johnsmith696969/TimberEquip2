import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AuctionBid_Key {
  id: string;
  __typename?: 'AuctionBid_Key';
}

export interface AuctionInvoice_Key {
  id: string;
  __typename?: 'AuctionInvoice_Key';
}

export interface AuctionLot_Key {
  id: string;
  __typename?: 'AuctionLot_Key';
}

export interface Auction_Key {
  id: string;
  __typename?: 'Auction_Key';
}

export interface BidderProfile_Key {
  id: string;
  __typename?: 'BidderProfile_Key';
}

export interface BillingSubscription_Key {
  id: string;
  __typename?: 'BillingSubscription_Key';
}

export interface CallLog_Key {
  id: string;
  __typename?: 'CallLog_Key';
}

export interface ContactRequest_Key {
  id: string;
  __typename?: 'ContactRequest_Key';
}

export interface DealerAuditLog_Key {
  id: string;
  __typename?: 'DealerAuditLog_Key';
}

export interface DealerFeedIngestLog_Key {
  id: string;
  __typename?: 'DealerFeedIngestLog_Key';
}

export interface DealerFeedProfile_Key {
  id: string;
  __typename?: 'DealerFeedProfile_Key';
}

export interface DealerListing_Key {
  id: string;
  __typename?: 'DealerListing_Key';
}

export interface DealerWebhookSubscription_Key {
  id: string;
  __typename?: 'DealerWebhookSubscription_Key';
}

export interface DealerWidgetConfig_Key {
  id: string;
  __typename?: 'DealerWidgetConfig_Key';
}

export interface FinancingRequest_Key {
  id: string;
  __typename?: 'FinancingRequest_Key';
}

export interface GetDealerFeedProfileByIdData {
  dealerFeedProfile?: {
    id: string;
    sellerUid: string;
    dealerName?: string | null;
    dealerEmail?: string | null;
    sourceName?: string | null;
    sourceType?: string | null;
    feedUrl?: string | null;
    apiEndpoint?: string | null;
    status?: string | null;
    syncMode?: string | null;
    syncFrequency?: string | null;
    nightlySyncEnabled?: boolean | null;
    autoPublish?: boolean | null;
    fieldMapping?: unknown | null;
    apiKeyPreview?: string | null;
    totalListingsSynced?: number | null;
    totalListingsActive?: number | null;
    totalListingsCreated?: number | null;
    totalListingsUpdated?: number | null;
    totalListingsDeleted?: number | null;
    lastSyncAt?: TimestampString | null;
    nextSyncAt?: TimestampString | null;
    lastSyncStatus?: string | null;
    lastSyncMessage?: string | null;
    lastResolvedType?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & DealerFeedProfile_Key;
}

export interface GetDealerFeedProfileByIdVariables {
  id: string;
}

export interface GetDealerListingByHashData {
  dealerListings: ({
    id: string;
    dealerFeedId: string;
    externalListingId: string;
    timberequipListingId?: string | null;
    status?: string | null;
  } & DealerListing_Key)[];
}

export interface GetDealerListingByHashVariables {
  equipmentHash: string;
}

export interface GetWidgetConfigData {
  dealerWidgetConfig?: {
    id: string;
    cardStyle?: string | null;
    accentColor?: string | null;
    fontFamily?: string | null;
    darkMode?: boolean | null;
    showInquiry?: boolean | null;
    showCall?: boolean | null;
    showDetails?: boolean | null;
    pageSize?: number | null;
    customCss?: string | null;
    updatedAt?: TimestampString | null;
  } & DealerWidgetConfig_Key;
}

export interface GetWidgetConfigVariables {
  id: string;
}

export interface Inquiry_Key {
  id: string;
  __typename?: 'Inquiry_Key';
}

export interface InsertDealerAuditLogData {
  dealerAuditLog_insert: DealerAuditLog_Key;
}

export interface InsertDealerAuditLogVariables {
  id: string;
  dealerFeedId?: string | null;
  sellerUid: string;
  action: string;
  details?: string | null;
  errorMessage?: string | null;
  itemsProcessed?: number | null;
  itemsSucceeded?: number | null;
  itemsFailed?: number | null;
  metadata?: unknown | null;
}

export interface InsertDealerFeedIngestLogData {
  dealerFeedIngestLog_insert: DealerFeedIngestLog_Key;
}

export interface InsertDealerFeedIngestLogVariables {
  id: string;
  feedId?: string | null;
  sellerUid: string;
  actorUid?: string | null;
  actorRole?: string | null;
  sourceName?: string | null;
  totalReceived?: number | null;
  processed?: number | null;
  created?: number | null;
  updated?: number | null;
  upserted?: number | null;
  skipped?: number | null;
  archived?: number | null;
  errorCount?: number | null;
  errors?: unknown | null;
  dryRun?: boolean | null;
  syncContext?: unknown | null;
  processedAt?: TimestampString | null;
}

export interface Invoice_Key {
  id: string;
  __typename?: 'Invoice_Key';
}

export interface ListAuditLogsByFeedData {
  dealerAuditLogs: ({
    id: string;
    dealerFeedId?: string | null;
    sellerUid: string;
    action: string;
    details?: string | null;
    errorMessage?: string | null;
    itemsProcessed?: number | null;
    itemsSucceeded?: number | null;
    itemsFailed?: number | null;
    metadata?: unknown | null;
    createdAt: TimestampString;
  } & DealerAuditLog_Key)[];
}

export interface ListAuditLogsByFeedVariables {
  dealerFeedId: string;
  limit?: number | null;
}

export interface ListDealerFeedProfilesBySellerData {
  dealerFeedProfiles: ({
    id: string;
    dealerName?: string | null;
    sourceName?: string | null;
    sourceType?: string | null;
    status?: string | null;
    syncMode?: string | null;
    syncFrequency?: string | null;
    nightlySyncEnabled?: boolean | null;
    totalListingsSynced?: number | null;
    totalListingsActive?: number | null;
    lastSyncAt?: TimestampString | null;
    lastSyncStatus?: string | null;
    createdAt: TimestampString;
  } & DealerFeedProfile_Key)[];
}

export interface ListDealerFeedProfilesBySellerVariables {
  sellerUid: string;
}

export interface ListDealerFeedProfilesByStatusData {
  dealerFeedProfiles: ({
    id: string;
    sellerUid: string;
    dealerName?: string | null;
    sourceName?: string | null;
    status?: string | null;
    totalListingsSynced?: number | null;
    lastSyncAt?: TimestampString | null;
    lastSyncStatus?: string | null;
    createdAt: TimestampString;
  } & DealerFeedProfile_Key)[];
}

export interface ListDealerFeedProfilesByStatusVariables {
  status: string;
  limit?: number | null;
}

export interface ListDealerListingsByFeedData {
  dealerListings: ({
    id: string;
    dealerFeedId: string;
    sellerUid: string;
    externalListingId: string;
    timberequipListingId?: string | null;
    equipmentHash?: string | null;
    status?: string | null;
    dealerSourceUrl?: string | null;
    dataSource?: string | null;
    externalData?: unknown | null;
    mappedData?: unknown | null;
    syncedAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & DealerListing_Key)[];
}

export interface ListDealerListingsByFeedVariables {
  dealerFeedId: string;
  limit?: number | null;
}

export interface ListDealerListingsBySellerData {
  dealerListings: ({
    id: string;
    dealerFeedId: string;
    externalListingId: string;
    timberequipListingId?: string | null;
    status?: string | null;
    syncedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerListing_Key)[];
}

export interface ListDealerListingsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}

export interface ListIngestLogsByFeedData {
  dealerFeedIngestLogs: ({
    id: string;
    feedId?: string | null;
    sellerUid: string;
    actorUid?: string | null;
    actorRole?: string | null;
    sourceName?: string | null;
    totalReceived?: number | null;
    processed?: number | null;
    created?: number | null;
    updated?: number | null;
    upserted?: number | null;
    skipped?: number | null;
    archived?: number | null;
    errorCount?: number | null;
    errors?: unknown | null;
    dryRun?: boolean | null;
    processedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerFeedIngestLog_Key)[];
}

export interface ListIngestLogsByFeedVariables {
  feedId: string;
  limit?: number | null;
}

export interface ListIngestLogsBySellerData {
  dealerFeedIngestLogs: ({
    id: string;
    feedId?: string | null;
    sourceName?: string | null;
    totalReceived?: number | null;
    processed?: number | null;
    created?: number | null;
    updated?: number | null;
    errorCount?: number | null;
    dryRun?: boolean | null;
    processedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerFeedIngestLog_Key)[];
}

export interface ListIngestLogsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}

export interface ListWebhooksByDealerData {
  dealerWebhookSubscriptions: ({
    id: string;
    dealerUid: string;
    callbackUrl: string;
    events?: unknown | null;
    active?: boolean | null;
    secretMasked?: string | null;
    failureCount?: number | null;
    lastDeliveryAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerWebhookSubscription_Key)[];
}

export interface ListWebhooksByDealerVariables {
  dealerUid: string;
}

export interface ListingAnomaly_Key {
  id: UUIDString;
  __typename?: 'ListingAnomaly_Key';
}

export interface ListingMediaAudit_Key {
  id: UUIDString;
  __typename?: 'ListingMediaAudit_Key';
}

export interface ListingStateTransition_Key {
  id: UUIDString;
  __typename?: 'ListingStateTransition_Key';
}

export interface ListingVersion_Key {
  id: UUIDString;
  __typename?: 'ListingVersion_Key';
}

export interface ListingVisibilitySnapshot_Key {
  id: UUIDString;
  __typename?: 'ListingVisibilitySnapshot_Key';
}

export interface Listing_Key {
  id: UUIDString;
  __typename?: 'Listing_Key';
}

export interface SellerProgramApplication_Key {
  id: string;
  __typename?: 'SellerProgramApplication_Key';
}

export interface Storefront_Key {
  id: string;
  __typename?: 'Storefront_Key';
}

export interface UpdateDealerFeedProfileSyncStatsData {
  dealerFeedProfile_update?: DealerFeedProfile_Key | null;
}

export interface UpdateDealerFeedProfileSyncStatsVariables {
  id: string;
  totalListingsSynced?: number | null;
  totalListingsActive?: number | null;
  totalListingsCreated?: number | null;
  totalListingsUpdated?: number | null;
  totalListingsDeleted?: number | null;
  lastSyncAt?: TimestampString | null;
  lastSyncStatus?: string | null;
  lastSyncMessage?: string | null;
}

export interface UpsertDealerFeedProfileData {
  dealerFeedProfile_upsert: DealerFeedProfile_Key;
}

export interface UpsertDealerFeedProfileVariables {
  id: string;
  sellerUid: string;
  dealerName?: string | null;
  dealerEmail?: string | null;
  sourceName?: string | null;
  sourceType?: string | null;
  rawInput?: string | null;
  feedUrl?: string | null;
  apiEndpoint?: string | null;
  status?: string | null;
  syncMode?: string | null;
  syncFrequency?: string | null;
  nightlySyncEnabled?: boolean | null;
  autoPublish?: boolean | null;
  fieldMapping?: unknown | null;
  apiKeyPreview?: string | null;
  totalListingsSynced?: number | null;
  totalListingsActive?: number | null;
  totalListingsCreated?: number | null;
  totalListingsUpdated?: number | null;
  totalListingsDeleted?: number | null;
  lastSyncAt?: TimestampString | null;
  nextSyncAt?: TimestampString | null;
  lastSyncStatus?: string | null;
  lastSyncMessage?: string | null;
  lastResolvedType?: string | null;
}

export interface UpsertDealerListingData {
  dealerListing_upsert: DealerListing_Key;
}

export interface UpsertDealerListingVariables {
  id: string;
  dealerFeedId: string;
  sellerUid: string;
  externalListingId: string;
  timberequipListingId?: string | null;
  equipmentHash?: string | null;
  status?: string | null;
  dealerSourceUrl?: string | null;
  dataSource?: string | null;
  externalData?: unknown | null;
  mappedData?: unknown | null;
  syncedAt?: TimestampString | null;
}

export interface UpsertDealerWebhookSubscriptionData {
  dealerWebhookSubscription_upsert: DealerWebhookSubscription_Key;
}

export interface UpsertDealerWebhookSubscriptionVariables {
  id: string;
  dealerUid: string;
  callbackUrl: string;
  events?: unknown | null;
  active?: boolean | null;
  secretMasked?: string | null;
  failureCount?: number | null;
  lastDeliveryAt?: TimestampString | null;
}

export interface UpsertDealerWidgetConfigData {
  dealerWidgetConfig_upsert: DealerWidgetConfig_Key;
}

export interface UpsertDealerWidgetConfigVariables {
  id: string;
  cardStyle?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  darkMode?: boolean | null;
  showInquiry?: boolean | null;
  showCall?: boolean | null;
  showDetails?: boolean | null;
  pageSize?: number | null;
  customCss?: string | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface GetDealerFeedProfileByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDealerFeedProfileByIdVariables): QueryRef<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetDealerFeedProfileByIdVariables): QueryRef<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;
  operationName: string;
}
export const getDealerFeedProfileByIdRef: GetDealerFeedProfileByIdRef;

export function getDealerFeedProfileById(vars: GetDealerFeedProfileByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;
export function getDealerFeedProfileById(dc: DataConnect, vars: GetDealerFeedProfileByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;

interface ListDealerFeedProfilesBySellerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerFeedProfilesBySellerVariables): QueryRef<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListDealerFeedProfilesBySellerVariables): QueryRef<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;
  operationName: string;
}
export const listDealerFeedProfilesBySellerRef: ListDealerFeedProfilesBySellerRef;

export function listDealerFeedProfilesBySeller(vars: ListDealerFeedProfilesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;
export function listDealerFeedProfilesBySeller(dc: DataConnect, vars: ListDealerFeedProfilesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;

interface ListDealerFeedProfilesByStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerFeedProfilesByStatusVariables): QueryRef<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListDealerFeedProfilesByStatusVariables): QueryRef<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;
  operationName: string;
}
export const listDealerFeedProfilesByStatusRef: ListDealerFeedProfilesByStatusRef;

export function listDealerFeedProfilesByStatus(vars: ListDealerFeedProfilesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;
export function listDealerFeedProfilesByStatus(dc: DataConnect, vars: ListDealerFeedProfilesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;

interface ListDealerListingsByFeedRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerListingsByFeedVariables): QueryRef<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListDealerListingsByFeedVariables): QueryRef<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;
  operationName: string;
}
export const listDealerListingsByFeedRef: ListDealerListingsByFeedRef;

export function listDealerListingsByFeed(vars: ListDealerListingsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;
export function listDealerListingsByFeed(dc: DataConnect, vars: ListDealerListingsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;

interface ListDealerListingsBySellerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerListingsBySellerVariables): QueryRef<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListDealerListingsBySellerVariables): QueryRef<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;
  operationName: string;
}
export const listDealerListingsBySellerRef: ListDealerListingsBySellerRef;

export function listDealerListingsBySeller(vars: ListDealerListingsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;
export function listDealerListingsBySeller(dc: DataConnect, vars: ListDealerListingsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;

interface GetDealerListingByHashRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDealerListingByHashVariables): QueryRef<GetDealerListingByHashData, GetDealerListingByHashVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetDealerListingByHashVariables): QueryRef<GetDealerListingByHashData, GetDealerListingByHashVariables>;
  operationName: string;
}
export const getDealerListingByHashRef: GetDealerListingByHashRef;

export function getDealerListingByHash(vars: GetDealerListingByHashVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerListingByHashData, GetDealerListingByHashVariables>;
export function getDealerListingByHash(dc: DataConnect, vars: GetDealerListingByHashVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerListingByHashData, GetDealerListingByHashVariables>;

interface ListIngestLogsByFeedRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListIngestLogsByFeedVariables): QueryRef<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListIngestLogsByFeedVariables): QueryRef<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;
  operationName: string;
}
export const listIngestLogsByFeedRef: ListIngestLogsByFeedRef;

export function listIngestLogsByFeed(vars: ListIngestLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;
export function listIngestLogsByFeed(dc: DataConnect, vars: ListIngestLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;

interface ListIngestLogsBySellerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListIngestLogsBySellerVariables): QueryRef<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListIngestLogsBySellerVariables): QueryRef<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;
  operationName: string;
}
export const listIngestLogsBySellerRef: ListIngestLogsBySellerRef;

export function listIngestLogsBySeller(vars: ListIngestLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;
export function listIngestLogsBySeller(dc: DataConnect, vars: ListIngestLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;

interface ListAuditLogsByFeedRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListAuditLogsByFeedVariables): QueryRef<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListAuditLogsByFeedVariables): QueryRef<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;
  operationName: string;
}
export const listAuditLogsByFeedRef: ListAuditLogsByFeedRef;

export function listAuditLogsByFeed(vars: ListAuditLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;
export function listAuditLogsByFeed(dc: DataConnect, vars: ListAuditLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;

interface ListWebhooksByDealerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListWebhooksByDealerVariables): QueryRef<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListWebhooksByDealerVariables): QueryRef<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;
  operationName: string;
}
export const listWebhooksByDealerRef: ListWebhooksByDealerRef;

export function listWebhooksByDealer(vars: ListWebhooksByDealerVariables, options?: ExecuteQueryOptions): QueryPromise<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;
export function listWebhooksByDealer(dc: DataConnect, vars: ListWebhooksByDealerVariables, options?: ExecuteQueryOptions): QueryPromise<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;

interface GetWidgetConfigRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetWidgetConfigVariables): QueryRef<GetWidgetConfigData, GetWidgetConfigVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetWidgetConfigVariables): QueryRef<GetWidgetConfigData, GetWidgetConfigVariables>;
  operationName: string;
}
export const getWidgetConfigRef: GetWidgetConfigRef;

export function getWidgetConfig(vars: GetWidgetConfigVariables, options?: ExecuteQueryOptions): QueryPromise<GetWidgetConfigData, GetWidgetConfigVariables>;
export function getWidgetConfig(dc: DataConnect, vars: GetWidgetConfigVariables, options?: ExecuteQueryOptions): QueryPromise<GetWidgetConfigData, GetWidgetConfigVariables>;

interface UpsertDealerFeedProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerFeedProfileVariables): MutationRef<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertDealerFeedProfileVariables): MutationRef<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;
  operationName: string;
}
export const upsertDealerFeedProfileRef: UpsertDealerFeedProfileRef;

export function upsertDealerFeedProfile(vars: UpsertDealerFeedProfileVariables): MutationPromise<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;
export function upsertDealerFeedProfile(dc: DataConnect, vars: UpsertDealerFeedProfileVariables): MutationPromise<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;

interface UpdateDealerFeedProfileSyncStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDealerFeedProfileSyncStatsVariables): MutationRef<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateDealerFeedProfileSyncStatsVariables): MutationRef<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;
  operationName: string;
}
export const updateDealerFeedProfileSyncStatsRef: UpdateDealerFeedProfileSyncStatsRef;

export function updateDealerFeedProfileSyncStats(vars: UpdateDealerFeedProfileSyncStatsVariables): MutationPromise<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;
export function updateDealerFeedProfileSyncStats(dc: DataConnect, vars: UpdateDealerFeedProfileSyncStatsVariables): MutationPromise<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;

interface UpsertDealerListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerListingVariables): MutationRef<UpsertDealerListingData, UpsertDealerListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertDealerListingVariables): MutationRef<UpsertDealerListingData, UpsertDealerListingVariables>;
  operationName: string;
}
export const upsertDealerListingRef: UpsertDealerListingRef;

export function upsertDealerListing(vars: UpsertDealerListingVariables): MutationPromise<UpsertDealerListingData, UpsertDealerListingVariables>;
export function upsertDealerListing(dc: DataConnect, vars: UpsertDealerListingVariables): MutationPromise<UpsertDealerListingData, UpsertDealerListingVariables>;

interface InsertDealerFeedIngestLogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDealerFeedIngestLogVariables): MutationRef<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertDealerFeedIngestLogVariables): MutationRef<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;
  operationName: string;
}
export const insertDealerFeedIngestLogRef: InsertDealerFeedIngestLogRef;

export function insertDealerFeedIngestLog(vars: InsertDealerFeedIngestLogVariables): MutationPromise<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;
export function insertDealerFeedIngestLog(dc: DataConnect, vars: InsertDealerFeedIngestLogVariables): MutationPromise<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;

interface InsertDealerAuditLogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDealerAuditLogVariables): MutationRef<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertDealerAuditLogVariables): MutationRef<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;
  operationName: string;
}
export const insertDealerAuditLogRef: InsertDealerAuditLogRef;

export function insertDealerAuditLog(vars: InsertDealerAuditLogVariables): MutationPromise<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;
export function insertDealerAuditLog(dc: DataConnect, vars: InsertDealerAuditLogVariables): MutationPromise<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;

interface UpsertDealerWebhookSubscriptionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerWebhookSubscriptionVariables): MutationRef<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertDealerWebhookSubscriptionVariables): MutationRef<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;
  operationName: string;
}
export const upsertDealerWebhookSubscriptionRef: UpsertDealerWebhookSubscriptionRef;

export function upsertDealerWebhookSubscription(vars: UpsertDealerWebhookSubscriptionVariables): MutationPromise<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;
export function upsertDealerWebhookSubscription(dc: DataConnect, vars: UpsertDealerWebhookSubscriptionVariables): MutationPromise<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;

interface UpsertDealerWidgetConfigRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerWidgetConfigVariables): MutationRef<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertDealerWidgetConfigVariables): MutationRef<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;
  operationName: string;
}
export const upsertDealerWidgetConfigRef: UpsertDealerWidgetConfigRef;

export function upsertDealerWidgetConfig(vars: UpsertDealerWidgetConfigVariables): MutationPromise<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;
export function upsertDealerWidgetConfig(dc: DataConnect, vars: UpsertDealerWidgetConfigVariables): MutationPromise<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;

