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

/** Generated Node Admin SDK operation action function for the 'GetInquiryById' Query. Allow users to execute without passing in DataConnect. */
export function getInquiryById(dc: DataConnect, vars: GetInquiryByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetInquiryByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetInquiryById' Query. Allow users to pass in custom DataConnect instances. */
export function getInquiryById(vars: GetInquiryByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetInquiryByIdData>>;

/** Generated Node Admin SDK operation action function for the 'ListInquiriesBySeller' Query. Allow users to execute without passing in DataConnect. */
export function listInquiriesBySeller(dc: DataConnect, vars: ListInquiriesBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesBySellerData>>;
/** Generated Node Admin SDK operation action function for the 'ListInquiriesBySeller' Query. Allow users to pass in custom DataConnect instances. */
export function listInquiriesBySeller(vars: ListInquiriesBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesBySellerData>>;

/** Generated Node Admin SDK operation action function for the 'ListInquiriesByBuyer' Query. Allow users to execute without passing in DataConnect. */
export function listInquiriesByBuyer(dc: DataConnect, vars: ListInquiriesByBuyerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesByBuyerData>>;
/** Generated Node Admin SDK operation action function for the 'ListInquiriesByBuyer' Query. Allow users to pass in custom DataConnect instances. */
export function listInquiriesByBuyer(vars: ListInquiriesByBuyerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesByBuyerData>>;

/** Generated Node Admin SDK operation action function for the 'ListInquiriesByListing' Query. Allow users to execute without passing in DataConnect. */
export function listInquiriesByListing(dc: DataConnect, vars: ListInquiriesByListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesByListingData>>;
/** Generated Node Admin SDK operation action function for the 'ListInquiriesByListing' Query. Allow users to pass in custom DataConnect instances. */
export function listInquiriesByListing(vars: ListInquiriesByListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesByListingData>>;

/** Generated Node Admin SDK operation action function for the 'ListInquiriesByStatus' Query. Allow users to execute without passing in DataConnect. */
export function listInquiriesByStatus(dc: DataConnect, vars: ListInquiriesByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesByStatusData>>;
/** Generated Node Admin SDK operation action function for the 'ListInquiriesByStatus' Query. Allow users to pass in custom DataConnect instances. */
export function listInquiriesByStatus(vars: ListInquiriesByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInquiriesByStatusData>>;

/** Generated Node Admin SDK operation action function for the 'GetFinancingRequestById' Query. Allow users to execute without passing in DataConnect. */
export function getFinancingRequestById(dc: DataConnect, vars: GetFinancingRequestByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetFinancingRequestByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetFinancingRequestById' Query. Allow users to pass in custom DataConnect instances. */
export function getFinancingRequestById(vars: GetFinancingRequestByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetFinancingRequestByIdData>>;

/** Generated Node Admin SDK operation action function for the 'ListFinancingRequestsBySeller' Query. Allow users to execute without passing in DataConnect. */
export function listFinancingRequestsBySeller(dc: DataConnect, vars: ListFinancingRequestsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListFinancingRequestsBySellerData>>;
/** Generated Node Admin SDK operation action function for the 'ListFinancingRequestsBySeller' Query. Allow users to pass in custom DataConnect instances. */
export function listFinancingRequestsBySeller(vars: ListFinancingRequestsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListFinancingRequestsBySellerData>>;

/** Generated Node Admin SDK operation action function for the 'ListFinancingRequestsByBuyer' Query. Allow users to execute without passing in DataConnect. */
export function listFinancingRequestsByBuyer(dc: DataConnect, vars: ListFinancingRequestsByBuyerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListFinancingRequestsByBuyerData>>;
/** Generated Node Admin SDK operation action function for the 'ListFinancingRequestsByBuyer' Query. Allow users to pass in custom DataConnect instances. */
export function listFinancingRequestsByBuyer(vars: ListFinancingRequestsByBuyerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListFinancingRequestsByBuyerData>>;

/** Generated Node Admin SDK operation action function for the 'GetCallLogById' Query. Allow users to execute without passing in DataConnect. */
export function getCallLogById(dc: DataConnect, vars: GetCallLogByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetCallLogByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetCallLogById' Query. Allow users to pass in custom DataConnect instances. */
export function getCallLogById(vars: GetCallLogByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetCallLogByIdData>>;

/** Generated Node Admin SDK operation action function for the 'ListCallLogsBySeller' Query. Allow users to execute without passing in DataConnect. */
export function listCallLogsBySeller(dc: DataConnect, vars: ListCallLogsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCallLogsBySellerData>>;
/** Generated Node Admin SDK operation action function for the 'ListCallLogsBySeller' Query. Allow users to pass in custom DataConnect instances. */
export function listCallLogsBySeller(vars: ListCallLogsBySellerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCallLogsBySellerData>>;

/** Generated Node Admin SDK operation action function for the 'ListCallLogsByListing' Query. Allow users to execute without passing in DataConnect. */
export function listCallLogsByListing(dc: DataConnect, vars: ListCallLogsByListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCallLogsByListingData>>;
/** Generated Node Admin SDK operation action function for the 'ListCallLogsByListing' Query. Allow users to pass in custom DataConnect instances. */
export function listCallLogsByListing(vars: ListCallLogsByListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCallLogsByListingData>>;

/** Generated Node Admin SDK operation action function for the 'ListContactRequestsByStatus' Query. Allow users to execute without passing in DataConnect. */
export function listContactRequestsByStatus(dc: DataConnect, vars: ListContactRequestsByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListContactRequestsByStatusData>>;
/** Generated Node Admin SDK operation action function for the 'ListContactRequestsByStatus' Query. Allow users to pass in custom DataConnect instances. */
export function listContactRequestsByStatus(vars: ListContactRequestsByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListContactRequestsByStatusData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertInquiry' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertInquiry(dc: DataConnect, vars: UpsertInquiryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertInquiryData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertInquiry' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertInquiry(vars: UpsertInquiryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertInquiryData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateInquiryStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateInquiryStatus(dc: DataConnect, vars: UpdateInquiryStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateInquiryStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateInquiryStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateInquiryStatus(vars: UpdateInquiryStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateInquiryStatusData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertFinancingRequest' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertFinancingRequest(dc: DataConnect, vars: UpsertFinancingRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertFinancingRequestData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertFinancingRequest' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertFinancingRequest(vars: UpsertFinancingRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertFinancingRequestData>>;

/** Generated Node Admin SDK operation action function for the 'InsertCallLog' Mutation. Allow users to execute without passing in DataConnect. */
export function insertCallLog(dc: DataConnect, vars: InsertCallLogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertCallLogData>>;
/** Generated Node Admin SDK operation action function for the 'InsertCallLog' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertCallLog(vars: InsertCallLogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertCallLogData>>;

/** Generated Node Admin SDK operation action function for the 'InsertContactRequest' Mutation. Allow users to execute without passing in DataConnect. */
export function insertContactRequest(dc: DataConnect, vars: InsertContactRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertContactRequestData>>;
/** Generated Node Admin SDK operation action function for the 'InsertContactRequest' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertContactRequest(vars: InsertContactRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertContactRequestData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateContactRequestStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateContactRequestStatus(dc: DataConnect, vars: UpdateContactRequestStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateContactRequestStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateContactRequestStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateContactRequestStatus(vars: UpdateContactRequestStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateContactRequestStatusData>>;

