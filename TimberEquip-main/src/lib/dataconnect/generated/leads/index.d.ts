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

export interface GetCallLogByIdData {
  callLog?: {
    id: string;
    listingId?: string | null;
    listingTitle?: string | null;
    sellerUid?: string | null;
    sellerName?: string | null;
    sellerPhone?: string | null;
    callerUid?: string | null;
    callerName?: string | null;
    callerEmail?: string | null;
    callerPhone?: string | null;
    duration?: number | null;
    status: string;
    source?: string | null;
    isAuthenticated?: boolean | null;
    recordingUrl?: string | null;
    twilioCallSid?: string | null;
    completedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & CallLog_Key;
}

export interface GetCallLogByIdVariables {
  id: string;
}

export interface GetFinancingRequestByIdData {
  financingRequest?: {
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    buyerUid?: string | null;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string | null;
    company?: string | null;
    requestedAmount?: number | null;
    message?: string | null;
    status: string;
    contactConsentAccepted?: boolean | null;
    contactConsentVersion?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & FinancingRequest_Key;
}

export interface GetFinancingRequestByIdVariables {
  id: string;
}

export interface GetInquiryByIdData {
  inquiry?: {
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    buyerUid?: string | null;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    message?: string | null;
    type: string;
    status: string;
    assignedToUid?: string | null;
    assignedToName?: string | null;
    internalNotes?: unknown | null;
    firstResponseAt?: TimestampString | null;
    responseTimeMinutes?: number | null;
    spamScore?: number | null;
    spamFlags?: unknown | null;
    contactConsentAccepted?: boolean | null;
    contactConsentVersion?: string | null;
    contactConsentScope?: string | null;
    contactConsentAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Inquiry_Key;
}

export interface GetInquiryByIdVariables {
  id: string;
}

export interface Inquiry_Key {
  id: string;
  __typename?: 'Inquiry_Key';
}

export interface InsertCallLogData {
  callLog_insert: CallLog_Key;
}

export interface InsertCallLogVariables {
  id: string;
  listingId?: string | null;
  listingTitle?: string | null;
  sellerUid?: string | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  callerUid?: string | null;
  callerName?: string | null;
  callerEmail?: string | null;
  callerPhone?: string | null;
  duration?: number | null;
  status: string;
  source?: string | null;
  isAuthenticated?: boolean | null;
  recordingUrl?: string | null;
  twilioCallSid?: string | null;
  completedAt?: TimestampString | null;
}

export interface InsertContactRequestData {
  contactRequest_insert: ContactRequest_Key;
}

export interface InsertContactRequestVariables {
  id: string;
  name?: string | null;
  email: string;
  category?: string | null;
  message?: string | null;
  source?: string | null;
  status?: string | null;
}

export interface Invoice_Key {
  id: string;
  __typename?: 'Invoice_Key';
}

export interface ListCallLogsByListingData {
  callLogs: ({
    id: string;
    callerName?: string | null;
    callerPhone?: string | null;
    duration?: number | null;
    status: string;
    createdAt: TimestampString;
  } & CallLog_Key)[];
}

export interface ListCallLogsByListingVariables {
  listingId: string;
  limit?: number | null;
}

export interface ListCallLogsBySellerData {
  callLogs: ({
    id: string;
    listingId?: string | null;
    listingTitle?: string | null;
    callerName?: string | null;
    callerPhone?: string | null;
    duration?: number | null;
    status: string;
    source?: string | null;
    createdAt: TimestampString;
  } & CallLog_Key)[];
}

export interface ListCallLogsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}

export interface ListContactRequestsByStatusData {
  contactRequests: ({
    id: string;
    name?: string | null;
    email: string;
    category?: string | null;
    message?: string | null;
    source?: string | null;
    status?: string | null;
    createdAt: TimestampString;
  } & ContactRequest_Key)[];
}

export interface ListContactRequestsByStatusVariables {
  status: string;
  limit?: number | null;
}

export interface ListFinancingRequestsByBuyerData {
  financingRequests: ({
    id: string;
    listingId?: string | null;
    requestedAmount?: number | null;
    status: string;
    createdAt: TimestampString;
  } & FinancingRequest_Key)[];
}

export interface ListFinancingRequestsByBuyerVariables {
  buyerUid: string;
  limit?: number | null;
}

export interface ListFinancingRequestsBySellerData {
  financingRequests: ({
    id: string;
    listingId?: string | null;
    applicantName: string;
    applicantEmail: string;
    requestedAmount?: number | null;
    status: string;
    createdAt: TimestampString;
  } & FinancingRequest_Key)[];
}

export interface ListFinancingRequestsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}

export interface ListInquiriesByBuyerData {
  inquiries: ({
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    message?: string | null;
    type: string;
    status: string;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}

export interface ListInquiriesByBuyerVariables {
  buyerUid: string;
  limit?: number | null;
}

export interface ListInquiriesByListingData {
  inquiries: ({
    id: string;
    buyerName: string;
    buyerEmail: string;
    message?: string | null;
    type: string;
    status: string;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}

export interface ListInquiriesByListingVariables {
  listingId: string;
  limit?: number | null;
}

export interface ListInquiriesBySellerData {
  inquiries: ({
    id: string;
    listingId?: string | null;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    message?: string | null;
    type: string;
    status: string;
    assignedToName?: string | null;
    firstResponseAt?: TimestampString | null;
    responseTimeMinutes?: number | null;
    spamScore?: number | null;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}

export interface ListInquiriesBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}

export interface ListInquiriesByStatusData {
  inquiries: ({
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    buyerName: string;
    buyerEmail: string;
    type: string;
    status: string;
    spamScore?: number | null;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}

export interface ListInquiriesByStatusVariables {
  status: string;
  limit?: number | null;
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

export interface UpdateContactRequestStatusData {
  contactRequest_update?: ContactRequest_Key | null;
}

export interface UpdateContactRequestStatusVariables {
  id: string;
  status: string;
}

export interface UpdateInquiryStatusData {
  inquiry_update?: Inquiry_Key | null;
}

export interface UpdateInquiryStatusVariables {
  id: string;
  status: string;
  assignedToUid?: string | null;
  assignedToName?: string | null;
  firstResponseAt?: TimestampString | null;
  responseTimeMinutes?: number | null;
}

export interface UpsertFinancingRequestData {
  financingRequest_upsert: FinancingRequest_Key;
}

export interface UpsertFinancingRequestVariables {
  id: string;
  listingId?: string | null;
  sellerUid?: string | null;
  buyerUid?: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  company?: string | null;
  requestedAmount?: number | null;
  message?: string | null;
  status: string;
  contactConsentAccepted?: boolean | null;
  contactConsentVersion?: string | null;
  contactConsentScope?: string | null;
  contactConsentAt?: TimestampString | null;
}

export interface UpsertInquiryData {
  inquiry_upsert: Inquiry_Key;
}

export interface UpsertInquiryVariables {
  id: string;
  listingId?: string | null;
  sellerUid?: string | null;
  buyerUid?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  message?: string | null;
  type: string;
  status: string;
  assignedToUid?: string | null;
  assignedToName?: string | null;
  internalNotes?: unknown | null;
  firstResponseAt?: TimestampString | null;
  responseTimeMinutes?: number | null;
  spamScore?: number | null;
  spamFlags?: unknown | null;
  contactConsentAccepted?: boolean | null;
  contactConsentVersion?: string | null;
  contactConsentScope?: string | null;
  contactConsentAt?: TimestampString | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface GetInquiryByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetInquiryByIdVariables): QueryRef<GetInquiryByIdData, GetInquiryByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetInquiryByIdVariables): QueryRef<GetInquiryByIdData, GetInquiryByIdVariables>;
  operationName: string;
}
export const getInquiryByIdRef: GetInquiryByIdRef;

export function getInquiryById(vars: GetInquiryByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetInquiryByIdData, GetInquiryByIdVariables>;
export function getInquiryById(dc: DataConnect, vars: GetInquiryByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetInquiryByIdData, GetInquiryByIdVariables>;

interface ListInquiriesBySellerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesBySellerVariables): QueryRef<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListInquiriesBySellerVariables): QueryRef<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;
  operationName: string;
}
export const listInquiriesBySellerRef: ListInquiriesBySellerRef;

export function listInquiriesBySeller(vars: ListInquiriesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;
export function listInquiriesBySeller(dc: DataConnect, vars: ListInquiriesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;

interface ListInquiriesByBuyerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesByBuyerVariables): QueryRef<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListInquiriesByBuyerVariables): QueryRef<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;
  operationName: string;
}
export const listInquiriesByBuyerRef: ListInquiriesByBuyerRef;

export function listInquiriesByBuyer(vars: ListInquiriesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;
export function listInquiriesByBuyer(dc: DataConnect, vars: ListInquiriesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;

interface ListInquiriesByListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesByListingVariables): QueryRef<ListInquiriesByListingData, ListInquiriesByListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListInquiriesByListingVariables): QueryRef<ListInquiriesByListingData, ListInquiriesByListingVariables>;
  operationName: string;
}
export const listInquiriesByListingRef: ListInquiriesByListingRef;

export function listInquiriesByListing(vars: ListInquiriesByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByListingData, ListInquiriesByListingVariables>;
export function listInquiriesByListing(dc: DataConnect, vars: ListInquiriesByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByListingData, ListInquiriesByListingVariables>;

interface ListInquiriesByStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesByStatusVariables): QueryRef<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListInquiriesByStatusVariables): QueryRef<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;
  operationName: string;
}
export const listInquiriesByStatusRef: ListInquiriesByStatusRef;

export function listInquiriesByStatus(vars: ListInquiriesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;
export function listInquiriesByStatus(dc: DataConnect, vars: ListInquiriesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;

interface GetFinancingRequestByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetFinancingRequestByIdVariables): QueryRef<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetFinancingRequestByIdVariables): QueryRef<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;
  operationName: string;
}
export const getFinancingRequestByIdRef: GetFinancingRequestByIdRef;

export function getFinancingRequestById(vars: GetFinancingRequestByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;
export function getFinancingRequestById(dc: DataConnect, vars: GetFinancingRequestByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;

interface ListFinancingRequestsBySellerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListFinancingRequestsBySellerVariables): QueryRef<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListFinancingRequestsBySellerVariables): QueryRef<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;
  operationName: string;
}
export const listFinancingRequestsBySellerRef: ListFinancingRequestsBySellerRef;

export function listFinancingRequestsBySeller(vars: ListFinancingRequestsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;
export function listFinancingRequestsBySeller(dc: DataConnect, vars: ListFinancingRequestsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;

interface ListFinancingRequestsByBuyerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListFinancingRequestsByBuyerVariables): QueryRef<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListFinancingRequestsByBuyerVariables): QueryRef<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;
  operationName: string;
}
export const listFinancingRequestsByBuyerRef: ListFinancingRequestsByBuyerRef;

export function listFinancingRequestsByBuyer(vars: ListFinancingRequestsByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;
export function listFinancingRequestsByBuyer(dc: DataConnect, vars: ListFinancingRequestsByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;

interface GetCallLogByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCallLogByIdVariables): QueryRef<GetCallLogByIdData, GetCallLogByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCallLogByIdVariables): QueryRef<GetCallLogByIdData, GetCallLogByIdVariables>;
  operationName: string;
}
export const getCallLogByIdRef: GetCallLogByIdRef;

export function getCallLogById(vars: GetCallLogByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetCallLogByIdData, GetCallLogByIdVariables>;
export function getCallLogById(dc: DataConnect, vars: GetCallLogByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetCallLogByIdData, GetCallLogByIdVariables>;

interface ListCallLogsBySellerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCallLogsBySellerVariables): QueryRef<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListCallLogsBySellerVariables): QueryRef<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;
  operationName: string;
}
export const listCallLogsBySellerRef: ListCallLogsBySellerRef;

export function listCallLogsBySeller(vars: ListCallLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;
export function listCallLogsBySeller(dc: DataConnect, vars: ListCallLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;

interface ListCallLogsByListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCallLogsByListingVariables): QueryRef<ListCallLogsByListingData, ListCallLogsByListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListCallLogsByListingVariables): QueryRef<ListCallLogsByListingData, ListCallLogsByListingVariables>;
  operationName: string;
}
export const listCallLogsByListingRef: ListCallLogsByListingRef;

export function listCallLogsByListing(vars: ListCallLogsByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsByListingData, ListCallLogsByListingVariables>;
export function listCallLogsByListing(dc: DataConnect, vars: ListCallLogsByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsByListingData, ListCallLogsByListingVariables>;

interface ListContactRequestsByStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListContactRequestsByStatusVariables): QueryRef<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListContactRequestsByStatusVariables): QueryRef<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;
  operationName: string;
}
export const listContactRequestsByStatusRef: ListContactRequestsByStatusRef;

export function listContactRequestsByStatus(vars: ListContactRequestsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;
export function listContactRequestsByStatus(dc: DataConnect, vars: ListContactRequestsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;

interface UpsertInquiryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertInquiryVariables): MutationRef<UpsertInquiryData, UpsertInquiryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertInquiryVariables): MutationRef<UpsertInquiryData, UpsertInquiryVariables>;
  operationName: string;
}
export const upsertInquiryRef: UpsertInquiryRef;

export function upsertInquiry(vars: UpsertInquiryVariables): MutationPromise<UpsertInquiryData, UpsertInquiryVariables>;
export function upsertInquiry(dc: DataConnect, vars: UpsertInquiryVariables): MutationPromise<UpsertInquiryData, UpsertInquiryVariables>;

interface UpdateInquiryStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInquiryStatusVariables): MutationRef<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateInquiryStatusVariables): MutationRef<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;
  operationName: string;
}
export const updateInquiryStatusRef: UpdateInquiryStatusRef;

export function updateInquiryStatus(vars: UpdateInquiryStatusVariables): MutationPromise<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;
export function updateInquiryStatus(dc: DataConnect, vars: UpdateInquiryStatusVariables): MutationPromise<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;

interface UpsertFinancingRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertFinancingRequestVariables): MutationRef<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertFinancingRequestVariables): MutationRef<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;
  operationName: string;
}
export const upsertFinancingRequestRef: UpsertFinancingRequestRef;

export function upsertFinancingRequest(vars: UpsertFinancingRequestVariables): MutationPromise<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;
export function upsertFinancingRequest(dc: DataConnect, vars: UpsertFinancingRequestVariables): MutationPromise<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;

interface InsertCallLogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertCallLogVariables): MutationRef<InsertCallLogData, InsertCallLogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertCallLogVariables): MutationRef<InsertCallLogData, InsertCallLogVariables>;
  operationName: string;
}
export const insertCallLogRef: InsertCallLogRef;

export function insertCallLog(vars: InsertCallLogVariables): MutationPromise<InsertCallLogData, InsertCallLogVariables>;
export function insertCallLog(dc: DataConnect, vars: InsertCallLogVariables): MutationPromise<InsertCallLogData, InsertCallLogVariables>;

interface InsertContactRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertContactRequestVariables): MutationRef<InsertContactRequestData, InsertContactRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertContactRequestVariables): MutationRef<InsertContactRequestData, InsertContactRequestVariables>;
  operationName: string;
}
export const insertContactRequestRef: InsertContactRequestRef;

export function insertContactRequest(vars: InsertContactRequestVariables): MutationPromise<InsertContactRequestData, InsertContactRequestVariables>;
export function insertContactRequest(dc: DataConnect, vars: InsertContactRequestVariables): MutationPromise<InsertContactRequestData, InsertContactRequestVariables>;

interface UpdateContactRequestStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateContactRequestStatusVariables): MutationRef<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateContactRequestStatusVariables): MutationRef<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;
  operationName: string;
}
export const updateContactRequestStatusRef: UpdateContactRequestStatusRef;

export function updateContactRequestStatus(vars: UpdateContactRequestStatusVariables): MutationPromise<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;
export function updateContactRequestStatus(dc: DataConnect, vars: UpdateContactRequestStatusVariables): MutationPromise<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;

