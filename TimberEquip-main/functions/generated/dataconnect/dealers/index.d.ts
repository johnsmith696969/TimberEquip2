import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

/** Generated Node Admin SDK operation action function for the 'GetDealerFeedProfileById' Query. Allow users to execute without passing in DataConnect. */
export function getDealerFeedProfileById(dc: DataConnect, vars: GetDealerFeedProfileByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetDealerFeedProfileByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetDealerFeedProfileById' Query. Allow users to pass in custom DataConnect instances. */
export function getDealerFeedProfileById(vars: GetDealerFeedProfileByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetDealerFeedProfileByIdData>>;

/** Generated Node Admin SDK operation action function for the 'ListDealerFeedProfilesBySeller' Query. Allow users to execute without passing in DataConnect. */
export function listDealerFeedProfilesBySeller(dc: DataConnect, vars: ListDealerFeedProfilesBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerFeedProfilesBySellerData>>;
/** Generated Node Admin SDK operation action function for the 'ListDealerFeedProfilesBySeller' Query. Allow users to pass in custom DataConnect instances. */
export function listDealerFeedProfilesBySeller(vars: ListDealerFeedProfilesBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerFeedProfilesBySellerData>>;

/** Generated Node Admin SDK operation action function for the 'ListDealerFeedProfilesByStatus' Query. Allow users to execute without passing in DataConnect. */
export function listDealerFeedProfilesByStatus(dc: DataConnect, vars: ListDealerFeedProfilesByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerFeedProfilesByStatusData>>;
/** Generated Node Admin SDK operation action function for the 'ListDealerFeedProfilesByStatus' Query. Allow users to pass in custom DataConnect instances. */
export function listDealerFeedProfilesByStatus(vars: ListDealerFeedProfilesByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerFeedProfilesByStatusData>>;

/** Generated Node Admin SDK operation action function for the 'ListDealerListingsByFeed' Query. Allow users to execute without passing in DataConnect. */
export function listDealerListingsByFeed(dc: DataConnect, vars: ListDealerListingsByFeedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerListingsByFeedData>>;
/** Generated Node Admin SDK operation action function for the 'ListDealerListingsByFeed' Query. Allow users to pass in custom DataConnect instances. */
export function listDealerListingsByFeed(vars: ListDealerListingsByFeedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerListingsByFeedData>>;

/** Generated Node Admin SDK operation action function for the 'ListDealerListingsBySeller' Query. Allow users to execute without passing in DataConnect. */
export function listDealerListingsBySeller(dc: DataConnect, vars: ListDealerListingsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerListingsBySellerData>>;
/** Generated Node Admin SDK operation action function for the 'ListDealerListingsBySeller' Query. Allow users to pass in custom DataConnect instances. */
export function listDealerListingsBySeller(vars: ListDealerListingsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealerListingsBySellerData>>;

/** Generated Node Admin SDK operation action function for the 'GetDealerListingByHash' Query. Allow users to execute without passing in DataConnect. */
export function getDealerListingByHash(dc: DataConnect, vars: GetDealerListingByHashVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetDealerListingByHashData>>;
/** Generated Node Admin SDK operation action function for the 'GetDealerListingByHash' Query. Allow users to pass in custom DataConnect instances. */
export function getDealerListingByHash(vars: GetDealerListingByHashVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetDealerListingByHashData>>;

/** Generated Node Admin SDK operation action function for the 'ListIngestLogsByFeed' Query. Allow users to execute without passing in DataConnect. */
export function listIngestLogsByFeed(dc: DataConnect, vars: ListIngestLogsByFeedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListIngestLogsByFeedData>>;
/** Generated Node Admin SDK operation action function for the 'ListIngestLogsByFeed' Query. Allow users to pass in custom DataConnect instances. */
export function listIngestLogsByFeed(vars: ListIngestLogsByFeedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListIngestLogsByFeedData>>;

/** Generated Node Admin SDK operation action function for the 'ListIngestLogsBySeller' Query. Allow users to execute without passing in DataConnect. */
export function listIngestLogsBySeller(dc: DataConnect, vars: ListIngestLogsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListIngestLogsBySellerData>>;
/** Generated Node Admin SDK operation action function for the 'ListIngestLogsBySeller' Query. Allow users to pass in custom DataConnect instances. */
export function listIngestLogsBySeller(vars: ListIngestLogsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListIngestLogsBySellerData>>;

/** Generated Node Admin SDK operation action function for the 'ListAuditLogsByFeed' Query. Allow users to execute without passing in DataConnect. */
export function listAuditLogsByFeed(dc: DataConnect, vars: ListAuditLogsByFeedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAuditLogsByFeedData>>;
/** Generated Node Admin SDK operation action function for the 'ListAuditLogsByFeed' Query. Allow users to pass in custom DataConnect instances. */
export function listAuditLogsByFeed(vars: ListAuditLogsByFeedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAuditLogsByFeedData>>;

/** Generated Node Admin SDK operation action function for the 'ListWebhooksByDealer' Query. Allow users to execute without passing in DataConnect. */
export function listWebhooksByDealer(dc: DataConnect, vars: ListWebhooksByDealerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListWebhooksByDealerData>>;
/** Generated Node Admin SDK operation action function for the 'ListWebhooksByDealer' Query. Allow users to pass in custom DataConnect instances. */
export function listWebhooksByDealer(vars: ListWebhooksByDealerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListWebhooksByDealerData>>;

/** Generated Node Admin SDK operation action function for the 'GetWidgetConfig' Query. Allow users to execute without passing in DataConnect. */
export function getWidgetConfig(dc: DataConnect, vars: GetWidgetConfigVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWidgetConfigData>>;
/** Generated Node Admin SDK operation action function for the 'GetWidgetConfig' Query. Allow users to pass in custom DataConnect instances. */
export function getWidgetConfig(vars: GetWidgetConfigVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWidgetConfigData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertDealerFeedProfile' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertDealerFeedProfile(dc: DataConnect, vars: UpsertDealerFeedProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerFeedProfileData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertDealerFeedProfile' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertDealerFeedProfile(vars: UpsertDealerFeedProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerFeedProfileData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateDealerFeedProfileSyncStats' Mutation. Allow users to execute without passing in DataConnect. */
export function updateDealerFeedProfileSyncStats(dc: DataConnect, vars: UpdateDealerFeedProfileSyncStatsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateDealerFeedProfileSyncStatsData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateDealerFeedProfileSyncStats' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateDealerFeedProfileSyncStats(vars: UpdateDealerFeedProfileSyncStatsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateDealerFeedProfileSyncStatsData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertDealerListing' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertDealerListing(dc: DataConnect, vars: UpsertDealerListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerListingData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertDealerListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertDealerListing(vars: UpsertDealerListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerListingData>>;

/** Generated Node Admin SDK operation action function for the 'InsertDealerFeedIngestLog' Mutation. Allow users to execute without passing in DataConnect. */
export function insertDealerFeedIngestLog(dc: DataConnect, vars: InsertDealerFeedIngestLogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertDealerFeedIngestLogData>>;
/** Generated Node Admin SDK operation action function for the 'InsertDealerFeedIngestLog' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertDealerFeedIngestLog(vars: InsertDealerFeedIngestLogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertDealerFeedIngestLogData>>;

/** Generated Node Admin SDK operation action function for the 'InsertDealerAuditLog' Mutation. Allow users to execute without passing in DataConnect. */
export function insertDealerAuditLog(dc: DataConnect, vars: InsertDealerAuditLogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertDealerAuditLogData>>;
/** Generated Node Admin SDK operation action function for the 'InsertDealerAuditLog' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertDealerAuditLog(vars: InsertDealerAuditLogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertDealerAuditLogData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertDealerWebhookSubscription' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertDealerWebhookSubscription(dc: DataConnect, vars: UpsertDealerWebhookSubscriptionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerWebhookSubscriptionData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertDealerWebhookSubscription' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertDealerWebhookSubscription(vars: UpsertDealerWebhookSubscriptionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerWebhookSubscriptionData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertDealerWidgetConfig' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertDealerWidgetConfig(dc: DataConnect, vars: UpsertDealerWidgetConfigVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerWidgetConfigData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertDealerWidgetConfig' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertDealerWidgetConfig(vars: UpsertDealerWidgetConfigVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertDealerWidgetConfigData>>;

