import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface ApproveListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface ApproveListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}

export interface ArchiveListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface ArchiveListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}

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

export interface ConfirmListingPaymentData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface ConfirmListingPaymentVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
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

export interface DeleteListingShadowData {
  listing_delete?: Listing_Key | null;
}

export interface DeleteListingShadowVariables {
  id: UUIDString;
}

export interface ExpireListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface ExpireListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
}

export interface FinancingRequest_Key {
  id: string;
  __typename?: 'FinancingRequest_Key';
}

export interface FindListingByFirestoreIdData {
  listings: ({
    id: UUIDString;
    lifecycleState: string;
    reviewState: string;
    paymentState: string;
    inventoryState: string;
    visibilityState: string;
    updatedAt: TimestampString;
  } & Listing_Key)[];
}

export interface FindListingByFirestoreIdVariables {
  legacyFirestoreId: string;
}

export interface GetListingGovernanceData {
  listing?: {
    id: UUIDString;
    legacyFirestoreId?: string | null;
    sellerPartyId: string;
    title: string;
    lifecycleState: string;
    reviewState: string;
    paymentState: string;
    inventoryState: string;
    visibilityState: string;
    publishedAt?: TimestampString | null;
    expiresAt?: TimestampString | null;
    soldAt?: TimestampString | null;
    updatedAt: TimestampString;
  } & Listing_Key;
}

export interface GetListingGovernanceVariables {
  id: UUIDString;
}

export interface Inquiry_Key {
  id: string;
  __typename?: 'Inquiry_Key';
}

export interface InsertListingShadowData {
  listing_insert: Listing_Key;
}

export interface InsertListingShadowVariables {
  legacyFirestoreId: string;
  sellerPartyId: string;
  title: string;
  categoryKey: string;
  subcategoryKey?: string | null;
  manufacturerKey?: string | null;
  modelKey?: string | null;
  locationText?: string | null;
  priceAmount?: number | null;
  currencyCode: string;
  lifecycleState: string;
  reviewState: string;
  paymentState: string;
  inventoryState: string;
  visibilityState: string;
  primaryImageUrl?: string | null;
  publishedAt?: TimestampString | null;
  expiresAt?: TimestampString | null;
  soldAt?: TimestampString | null;
  sourceSystem: string;
  externalSourceName?: string | null;
  externalSourceId?: string | null;
}

export interface Invoice_Key {
  id: string;
  __typename?: 'Invoice_Key';
}

export interface ListLifecycleQueueData {
  listings: ({
    id: UUIDString;
    title: string;
    sellerPartyId: string;
    lifecycleState: string;
    reviewState: string;
    paymentState: string;
    inventoryState: string;
    visibilityState: string;
    updatedAt: TimestampString;
  } & Listing_Key)[];
}

export interface ListLifecycleQueueVariables {
  lifecycleStates: string[];
  limit?: number;
}

export interface ListListingTransitionsData {
  listingStateTransitions: ({
    id: UUIDString;
    transitionAction: string;
    previousState?: string | null;
    nextState: string;
    previousReviewState?: string | null;
    nextReviewState?: string | null;
    previousPaymentState?: string | null;
    nextPaymentState?: string | null;
    previousInventoryState?: string | null;
    nextInventoryState?: string | null;
    previousVisibilityState?: string | null;
    nextVisibilityState?: string | null;
    actorType: string;
    actorId?: string | null;
    reasonCode?: string | null;
    reasonNote?: string | null;
    occurredAt: TimestampString;
  } & ListingStateTransition_Key)[];
}

export interface ListListingTransitionsVariables {
  listingId: UUIDString;
  limit?: number;
}

export interface ListOpenListingAnomaliesData {
  listingAnomalies: ({
    id: UUIDString;
    anomalyCode: string;
    severity: string;
    status: string;
    detectedBy: string;
    detectedAt: TimestampString;
    resolvedAt?: TimestampString | null;
    resolutionNote?: string | null;
  } & ListingAnomaly_Key)[];
}

export interface ListOpenListingAnomaliesVariables {
  listingId: UUIDString;
  limit?: number;
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

export interface MarkListingSoldData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface MarkListingSoldVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}

export interface PublishListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface PublishListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
}

export interface RecordListingStateTransitionData {
  listingStateTransition_insert: ListingStateTransition_Key;
}

export interface RecordListingStateTransitionVariables {
  listingId: UUIDString;
  transitionAction: string;
  previousState?: string | null;
  nextState: string;
  previousReviewState?: string | null;
  nextReviewState?: string | null;
  previousPaymentState?: string | null;
  nextPaymentState?: string | null;
  previousInventoryState?: string | null;
  nextInventoryState?: string | null;
  previousVisibilityState?: string | null;
  nextVisibilityState?: string | null;
  actorType: string;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}

export interface RejectListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface RejectListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode: string;
  reasonNote: string;
}

export interface RelistListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface RelistListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}

export interface ResolveListingAnomalyData {
  listingAnomaly_update?: ListingAnomaly_Key | null;
}

export interface ResolveListingAnomalyVariables {
  id: UUIDString;
  resolutionNote: string;
}

export interface SellerProgramApplication_Key {
  id: string;
  __typename?: 'SellerProgramApplication_Key';
}

export interface Storefront_Key {
  id: string;
  __typename?: 'Storefront_Key';
}

export interface SubmitListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}

export interface SubmitListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}

export interface UpdateListingShadowData {
  listing_update?: Listing_Key | null;
}

export interface UpdateListingShadowVariables {
  id: UUIDString;
  sellerPartyId: string;
  title: string;
  categoryKey: string;
  subcategoryKey?: string | null;
  manufacturerKey?: string | null;
  modelKey?: string | null;
  locationText?: string | null;
  priceAmount?: number | null;
  currencyCode: string;
  lifecycleState: string;
  reviewState: string;
  paymentState: string;
  inventoryState: string;
  visibilityState: string;
  primaryImageUrl?: string | null;
  publishedAt?: TimestampString | null;
  expiresAt?: TimestampString | null;
  soldAt?: TimestampString | null;
  externalSourceName?: string | null;
  externalSourceId?: string | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'GetListingGovernance' Query. Allow users to execute without passing in DataConnect. */
export function getListingGovernance(dc: DataConnect, vars: GetListingGovernanceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetListingGovernanceData>>;
/** Generated Node Admin SDK operation action function for the 'GetListingGovernance' Query. Allow users to pass in custom DataConnect instances. */
export function getListingGovernance(vars: GetListingGovernanceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetListingGovernanceData>>;

/** Generated Node Admin SDK operation action function for the 'ListLifecycleQueue' Query. Allow users to execute without passing in DataConnect. */
export function listLifecycleQueue(dc: DataConnect, vars: ListLifecycleQueueVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListLifecycleQueueData>>;
/** Generated Node Admin SDK operation action function for the 'ListLifecycleQueue' Query. Allow users to pass in custom DataConnect instances. */
export function listLifecycleQueue(vars: ListLifecycleQueueVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListLifecycleQueueData>>;

/** Generated Node Admin SDK operation action function for the 'ListListingTransitions' Query. Allow users to execute without passing in DataConnect. */
export function listListingTransitions(dc: DataConnect, vars: ListListingTransitionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListListingTransitionsData>>;
/** Generated Node Admin SDK operation action function for the 'ListListingTransitions' Query. Allow users to pass in custom DataConnect instances. */
export function listListingTransitions(vars: ListListingTransitionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListListingTransitionsData>>;

/** Generated Node Admin SDK operation action function for the 'ListOpenListingAnomalies' Query. Allow users to execute without passing in DataConnect. */
export function listOpenListingAnomalies(dc: DataConnect, vars: ListOpenListingAnomaliesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListOpenListingAnomaliesData>>;
/** Generated Node Admin SDK operation action function for the 'ListOpenListingAnomalies' Query. Allow users to pass in custom DataConnect instances. */
export function listOpenListingAnomalies(vars: ListOpenListingAnomaliesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListOpenListingAnomaliesData>>;

/** Generated Node Admin SDK operation action function for the 'SubmitListing' Mutation. Allow users to execute without passing in DataConnect. */
export function submitListing(dc: DataConnect, vars: SubmitListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SubmitListingData>>;
/** Generated Node Admin SDK operation action function for the 'SubmitListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function submitListing(vars: SubmitListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SubmitListingData>>;

/** Generated Node Admin SDK operation action function for the 'ApproveListing' Mutation. Allow users to execute without passing in DataConnect. */
export function approveListing(dc: DataConnect, vars: ApproveListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ApproveListingData>>;
/** Generated Node Admin SDK operation action function for the 'ApproveListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function approveListing(vars: ApproveListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ApproveListingData>>;

/** Generated Node Admin SDK operation action function for the 'RejectListing' Mutation. Allow users to execute without passing in DataConnect. */
export function rejectListing(dc: DataConnect, vars: RejectListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RejectListingData>>;
/** Generated Node Admin SDK operation action function for the 'RejectListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function rejectListing(vars: RejectListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RejectListingData>>;

/** Generated Node Admin SDK operation action function for the 'ConfirmListingPayment' Mutation. Allow users to execute without passing in DataConnect. */
export function confirmListingPayment(dc: DataConnect, vars: ConfirmListingPaymentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ConfirmListingPaymentData>>;
/** Generated Node Admin SDK operation action function for the 'ConfirmListingPayment' Mutation. Allow users to pass in custom DataConnect instances. */
export function confirmListingPayment(vars: ConfirmListingPaymentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ConfirmListingPaymentData>>;

/** Generated Node Admin SDK operation action function for the 'PublishListing' Mutation. Allow users to execute without passing in DataConnect. */
export function publishListing(dc: DataConnect, vars: PublishListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PublishListingData>>;
/** Generated Node Admin SDK operation action function for the 'PublishListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function publishListing(vars: PublishListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PublishListingData>>;

/** Generated Node Admin SDK operation action function for the 'ExpireListing' Mutation. Allow users to execute without passing in DataConnect. */
export function expireListing(dc: DataConnect, vars: ExpireListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ExpireListingData>>;
/** Generated Node Admin SDK operation action function for the 'ExpireListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function expireListing(vars: ExpireListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ExpireListingData>>;

/** Generated Node Admin SDK operation action function for the 'RelistListing' Mutation. Allow users to execute without passing in DataConnect. */
export function relistListing(dc: DataConnect, vars: RelistListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RelistListingData>>;
/** Generated Node Admin SDK operation action function for the 'RelistListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function relistListing(vars: RelistListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RelistListingData>>;

/** Generated Node Admin SDK operation action function for the 'MarkListingSold' Mutation. Allow users to execute without passing in DataConnect. */
export function markListingSold(dc: DataConnect, vars: MarkListingSoldVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkListingSoldData>>;
/** Generated Node Admin SDK operation action function for the 'MarkListingSold' Mutation. Allow users to pass in custom DataConnect instances. */
export function markListingSold(vars: MarkListingSoldVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkListingSoldData>>;

/** Generated Node Admin SDK operation action function for the 'ArchiveListing' Mutation. Allow users to execute without passing in DataConnect. */
export function archiveListing(dc: DataConnect, vars: ArchiveListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveListingData>>;
/** Generated Node Admin SDK operation action function for the 'ArchiveListing' Mutation. Allow users to pass in custom DataConnect instances. */
export function archiveListing(vars: ArchiveListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveListingData>>;

/** Generated Node Admin SDK operation action function for the 'ResolveListingAnomaly' Mutation. Allow users to execute without passing in DataConnect. */
export function resolveListingAnomaly(dc: DataConnect, vars: ResolveListingAnomalyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ResolveListingAnomalyData>>;
/** Generated Node Admin SDK operation action function for the 'ResolveListingAnomaly' Mutation. Allow users to pass in custom DataConnect instances. */
export function resolveListingAnomaly(vars: ResolveListingAnomalyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ResolveListingAnomalyData>>;

/** Generated Node Admin SDK operation action function for the 'FindListingByFirestoreId' Query. Allow users to execute without passing in DataConnect. */
export function findListingByFirestoreId(dc: DataConnect, vars: FindListingByFirestoreIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindListingByFirestoreIdData>>;
/** Generated Node Admin SDK operation action function for the 'FindListingByFirestoreId' Query. Allow users to pass in custom DataConnect instances. */
export function findListingByFirestoreId(vars: FindListingByFirestoreIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindListingByFirestoreIdData>>;

/** Generated Node Admin SDK operation action function for the 'InsertListingShadow' Mutation. Allow users to execute without passing in DataConnect. */
export function insertListingShadow(dc: DataConnect, vars: InsertListingShadowVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertListingShadowData>>;
/** Generated Node Admin SDK operation action function for the 'InsertListingShadow' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertListingShadow(vars: InsertListingShadowVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertListingShadowData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateListingShadow' Mutation. Allow users to execute without passing in DataConnect. */
export function updateListingShadow(dc: DataConnect, vars: UpdateListingShadowVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateListingShadowData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateListingShadow' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateListingShadow(vars: UpdateListingShadowVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateListingShadowData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteListingShadow' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteListingShadow(dc: DataConnect, vars: DeleteListingShadowVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteListingShadowData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteListingShadow' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteListingShadow(vars: DeleteListingShadowVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteListingShadowData>>;

/** Generated Node Admin SDK operation action function for the 'RecordListingStateTransition' Mutation. Allow users to execute without passing in DataConnect. */
export function recordListingStateTransition(dc: DataConnect, vars: RecordListingStateTransitionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RecordListingStateTransitionData>>;
/** Generated Node Admin SDK operation action function for the 'RecordListingStateTransition' Mutation. Allow users to pass in custom DataConnect instances. */
export function recordListingStateTransition(vars: RecordListingStateTransitionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RecordListingStateTransitionData>>;

