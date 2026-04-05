import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface FindListingByFirestoreIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: FindListingByFirestoreIdVariables): QueryRef<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: FindListingByFirestoreIdVariables): QueryRef<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
  operationName: string;
}
export const findListingByFirestoreIdRef: FindListingByFirestoreIdRef;

export function findListingByFirestoreId(vars: FindListingByFirestoreIdVariables, options?: ExecuteQueryOptions): QueryPromise<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
export function findListingByFirestoreId(dc: DataConnect, vars: FindListingByFirestoreIdVariables, options?: ExecuteQueryOptions): QueryPromise<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;

interface InsertListingShadowRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertListingShadowVariables): MutationRef<InsertListingShadowData, InsertListingShadowVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertListingShadowVariables): MutationRef<InsertListingShadowData, InsertListingShadowVariables>;
  operationName: string;
}
export const insertListingShadowRef: InsertListingShadowRef;

export function insertListingShadow(vars: InsertListingShadowVariables): MutationPromise<InsertListingShadowData, InsertListingShadowVariables>;
export function insertListingShadow(dc: DataConnect, vars: InsertListingShadowVariables): MutationPromise<InsertListingShadowData, InsertListingShadowVariables>;

interface UpdateListingShadowRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateListingShadowVariables): MutationRef<UpdateListingShadowData, UpdateListingShadowVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateListingShadowVariables): MutationRef<UpdateListingShadowData, UpdateListingShadowVariables>;
  operationName: string;
}
export const updateListingShadowRef: UpdateListingShadowRef;

export function updateListingShadow(vars: UpdateListingShadowVariables): MutationPromise<UpdateListingShadowData, UpdateListingShadowVariables>;
export function updateListingShadow(dc: DataConnect, vars: UpdateListingShadowVariables): MutationPromise<UpdateListingShadowData, UpdateListingShadowVariables>;

interface DeleteListingShadowRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteListingShadowVariables): MutationRef<DeleteListingShadowData, DeleteListingShadowVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteListingShadowVariables): MutationRef<DeleteListingShadowData, DeleteListingShadowVariables>;
  operationName: string;
}
export const deleteListingShadowRef: DeleteListingShadowRef;

export function deleteListingShadow(vars: DeleteListingShadowVariables): MutationPromise<DeleteListingShadowData, DeleteListingShadowVariables>;
export function deleteListingShadow(dc: DataConnect, vars: DeleteListingShadowVariables): MutationPromise<DeleteListingShadowData, DeleteListingShadowVariables>;

interface RecordListingStateTransitionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecordListingStateTransitionVariables): MutationRef<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RecordListingStateTransitionVariables): MutationRef<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
  operationName: string;
}
export const recordListingStateTransitionRef: RecordListingStateTransitionRef;

export function recordListingStateTransition(vars: RecordListingStateTransitionVariables): MutationPromise<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
export function recordListingStateTransition(dc: DataConnect, vars: RecordListingStateTransitionVariables): MutationPromise<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;

interface GetListingGovernanceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetListingGovernanceVariables): QueryRef<GetListingGovernanceData, GetListingGovernanceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetListingGovernanceVariables): QueryRef<GetListingGovernanceData, GetListingGovernanceVariables>;
  operationName: string;
}
export const getListingGovernanceRef: GetListingGovernanceRef;

export function getListingGovernance(vars: GetListingGovernanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetListingGovernanceData, GetListingGovernanceVariables>;
export function getListingGovernance(dc: DataConnect, vars: GetListingGovernanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetListingGovernanceData, GetListingGovernanceVariables>;

interface ListLifecycleQueueRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListLifecycleQueueVariables): QueryRef<ListLifecycleQueueData, ListLifecycleQueueVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListLifecycleQueueVariables): QueryRef<ListLifecycleQueueData, ListLifecycleQueueVariables>;
  operationName: string;
}
export const listLifecycleQueueRef: ListLifecycleQueueRef;

export function listLifecycleQueue(vars: ListLifecycleQueueVariables, options?: ExecuteQueryOptions): QueryPromise<ListLifecycleQueueData, ListLifecycleQueueVariables>;
export function listLifecycleQueue(dc: DataConnect, vars: ListLifecycleQueueVariables, options?: ExecuteQueryOptions): QueryPromise<ListLifecycleQueueData, ListLifecycleQueueVariables>;

interface ListListingTransitionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListListingTransitionsVariables): QueryRef<ListListingTransitionsData, ListListingTransitionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListListingTransitionsVariables): QueryRef<ListListingTransitionsData, ListListingTransitionsVariables>;
  operationName: string;
}
export const listListingTransitionsRef: ListListingTransitionsRef;

export function listListingTransitions(vars: ListListingTransitionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListListingTransitionsData, ListListingTransitionsVariables>;
export function listListingTransitions(dc: DataConnect, vars: ListListingTransitionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListListingTransitionsData, ListListingTransitionsVariables>;

interface ListOpenListingAnomaliesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListOpenListingAnomaliesVariables): QueryRef<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListOpenListingAnomaliesVariables): QueryRef<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
  operationName: string;
}
export const listOpenListingAnomaliesRef: ListOpenListingAnomaliesRef;

export function listOpenListingAnomalies(vars: ListOpenListingAnomaliesVariables, options?: ExecuteQueryOptions): QueryPromise<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
export function listOpenListingAnomalies(dc: DataConnect, vars: ListOpenListingAnomaliesVariables, options?: ExecuteQueryOptions): QueryPromise<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;

interface SubmitListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitListingVariables): MutationRef<SubmitListingData, SubmitListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SubmitListingVariables): MutationRef<SubmitListingData, SubmitListingVariables>;
  operationName: string;
}
export const submitListingRef: SubmitListingRef;

export function submitListing(vars: SubmitListingVariables): MutationPromise<SubmitListingData, SubmitListingVariables>;
export function submitListing(dc: DataConnect, vars: SubmitListingVariables): MutationPromise<SubmitListingData, SubmitListingVariables>;

interface ApproveListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApproveListingVariables): MutationRef<ApproveListingData, ApproveListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ApproveListingVariables): MutationRef<ApproveListingData, ApproveListingVariables>;
  operationName: string;
}
export const approveListingRef: ApproveListingRef;

export function approveListing(vars: ApproveListingVariables): MutationPromise<ApproveListingData, ApproveListingVariables>;
export function approveListing(dc: DataConnect, vars: ApproveListingVariables): MutationPromise<ApproveListingData, ApproveListingVariables>;

interface RejectListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RejectListingVariables): MutationRef<RejectListingData, RejectListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RejectListingVariables): MutationRef<RejectListingData, RejectListingVariables>;
  operationName: string;
}
export const rejectListingRef: RejectListingRef;

export function rejectListing(vars: RejectListingVariables): MutationPromise<RejectListingData, RejectListingVariables>;
export function rejectListing(dc: DataConnect, vars: RejectListingVariables): MutationPromise<RejectListingData, RejectListingVariables>;

interface ConfirmListingPaymentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ConfirmListingPaymentVariables): MutationRef<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ConfirmListingPaymentVariables): MutationRef<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
  operationName: string;
}
export const confirmListingPaymentRef: ConfirmListingPaymentRef;

export function confirmListingPayment(vars: ConfirmListingPaymentVariables): MutationPromise<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
export function confirmListingPayment(dc: DataConnect, vars: ConfirmListingPaymentVariables): MutationPromise<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;

interface PublishListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PublishListingVariables): MutationRef<PublishListingData, PublishListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PublishListingVariables): MutationRef<PublishListingData, PublishListingVariables>;
  operationName: string;
}
export const publishListingRef: PublishListingRef;

export function publishListing(vars: PublishListingVariables): MutationPromise<PublishListingData, PublishListingVariables>;
export function publishListing(dc: DataConnect, vars: PublishListingVariables): MutationPromise<PublishListingData, PublishListingVariables>;

interface ExpireListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ExpireListingVariables): MutationRef<ExpireListingData, ExpireListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ExpireListingVariables): MutationRef<ExpireListingData, ExpireListingVariables>;
  operationName: string;
}
export const expireListingRef: ExpireListingRef;

export function expireListing(vars: ExpireListingVariables): MutationPromise<ExpireListingData, ExpireListingVariables>;
export function expireListing(dc: DataConnect, vars: ExpireListingVariables): MutationPromise<ExpireListingData, ExpireListingVariables>;

interface RelistListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RelistListingVariables): MutationRef<RelistListingData, RelistListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RelistListingVariables): MutationRef<RelistListingData, RelistListingVariables>;
  operationName: string;
}
export const relistListingRef: RelistListingRef;

export function relistListing(vars: RelistListingVariables): MutationPromise<RelistListingData, RelistListingVariables>;
export function relistListing(dc: DataConnect, vars: RelistListingVariables): MutationPromise<RelistListingData, RelistListingVariables>;

interface MarkListingSoldRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkListingSoldVariables): MutationRef<MarkListingSoldData, MarkListingSoldVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MarkListingSoldVariables): MutationRef<MarkListingSoldData, MarkListingSoldVariables>;
  operationName: string;
}
export const markListingSoldRef: MarkListingSoldRef;

export function markListingSold(vars: MarkListingSoldVariables): MutationPromise<MarkListingSoldData, MarkListingSoldVariables>;
export function markListingSold(dc: DataConnect, vars: MarkListingSoldVariables): MutationPromise<MarkListingSoldData, MarkListingSoldVariables>;

interface ArchiveListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveListingVariables): MutationRef<ArchiveListingData, ArchiveListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ArchiveListingVariables): MutationRef<ArchiveListingData, ArchiveListingVariables>;
  operationName: string;
}
export const archiveListingRef: ArchiveListingRef;

export function archiveListing(vars: ArchiveListingVariables): MutationPromise<ArchiveListingData, ArchiveListingVariables>;
export function archiveListing(dc: DataConnect, vars: ArchiveListingVariables): MutationPromise<ArchiveListingData, ArchiveListingVariables>;

interface ResolveListingAnomalyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ResolveListingAnomalyVariables): MutationRef<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ResolveListingAnomalyVariables): MutationRef<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
  operationName: string;
}
export const resolveListingAnomalyRef: ResolveListingAnomalyRef;

export function resolveListingAnomaly(vars: ResolveListingAnomalyVariables): MutationPromise<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
export function resolveListingAnomaly(dc: DataConnect, vars: ResolveListingAnomalyVariables): MutationPromise<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;

