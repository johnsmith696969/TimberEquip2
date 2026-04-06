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

export interface GetActiveSubscriptionForListingData {
  billingSubscriptions: ({
    id: string;
    userId: string;
    planId: string;
    status: string;
    currentPeriodEnd?: TimestampString | null;
    cancelAtPeriodEnd?: boolean | null;
  } & BillingSubscription_Key)[];
}

export interface GetActiveSubscriptionForListingVariables {
  listingId: string;
}

export interface GetInvoicesByUserData {
  invoices: ({
    id: string;
    userId: string;
    listingId?: string | null;
    stripeInvoiceId?: string | null;
    amount: number;
    currency?: string | null;
    status: string;
    items?: unknown | null;
    source?: string | null;
    paidAt?: TimestampString | null;
    createdAt: TimestampString;
  } & Invoice_Key)[];
}

export interface GetInvoicesByUserVariables {
  userId: string;
  limit?: number | null;
}

export interface GetSellerApplicationsByUserData {
  sellerProgramApplications: ({
    id: string;
    userId: string;
    planId?: string | null;
    status?: string | null;
    legalFullName?: string | null;
    companyName?: string | null;
    statementLabel?: string | null;
    legalScope?: string | null;
    legalTermsVersion?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & SellerProgramApplication_Key)[];
}

export interface GetSellerApplicationsByUserVariables {
  userId: string;
}

export interface GetSubscriptionByStripeIdData {
  billingSubscriptions: ({
    id: string;
    userId: string;
    listingId?: string | null;
    planId: string;
    status: string;
    currentPeriodEnd?: TimestampString | null;
    cancelAtPeriodEnd?: boolean | null;
  } & BillingSubscription_Key)[];
}

export interface GetSubscriptionByStripeIdVariables {
  stripeId: string;
}

export interface GetSubscriptionsByUserData {
  billingSubscriptions: ({
    id: string;
    userId: string;
    listingId?: string | null;
    planId: string;
    planName?: string | null;
    listingCap?: number | null;
    status: string;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: TimestampString | null;
    cancelAtPeriodEnd?: boolean | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & BillingSubscription_Key)[];
}

export interface GetSubscriptionsByUserVariables {
  userId: string;
}

export interface Inquiry_Key {
  id: string;
  __typename?: 'Inquiry_Key';
}

export interface Invoice_Key {
  id: string;
  __typename?: 'Invoice_Key';
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

export interface UpdateInvoiceStatusData {
  invoice_update?: Invoice_Key | null;
}

export interface UpdateInvoiceStatusVariables {
  id: string;
  status: string;
  paidAt?: TimestampString | null;
}

export interface UpdateSubscriptionStatusData {
  billingSubscription_update?: BillingSubscription_Key | null;
}

export interface UpdateSubscriptionStatusVariables {
  id: string;
  status: string;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: TimestampString | null;
}

export interface UpsertInvoiceData {
  invoice_upsert: Invoice_Key;
}

export interface UpsertInvoiceVariables {
  id: string;
  userId: string;
  listingId?: string | null;
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
  amount: number;
  currency?: string | null;
  status: string;
  items?: unknown | null;
  source?: string | null;
  paidAt?: TimestampString | null;
}

export interface UpsertSellerApplicationData {
  sellerProgramApplication_upsert: SellerProgramApplication_Key;
}

export interface UpsertSellerApplicationVariables {
  id: string;
  userId: string;
  planId?: string | null;
  status?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  legalFullName?: string | null;
  legalTitle?: string | null;
  companyName?: string | null;
  billingEmail?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  country?: string | null;
  taxIdOrVat?: string | null;
  notes?: string | null;
  statementLabel?: string | null;
  legalScope?: string | null;
  legalTermsVersion?: string | null;
  legalAcceptedAtIso?: string | null;
  acceptedTerms?: boolean | null;
  acceptedPrivacy?: boolean | null;
  acceptedRecurringBilling?: boolean | null;
  acceptedVisibilityPolicy?: boolean | null;
  acceptedAuthority?: boolean | null;
  source?: string | null;
}

export interface UpsertSubscriptionData {
  billingSubscription_upsert: BillingSubscription_Key;
}

export interface UpsertSubscriptionVariables {
  id: string;
  userId: string;
  listingId?: string | null;
  planId: string;
  planName?: string | null;
  listingCap?: number | null;
  status: string;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: TimestampString | null;
  cancelAtPeriodEnd?: boolean | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'GetSubscriptionsByUser' Query. Allow users to execute without passing in DataConnect. */
export function getSubscriptionsByUser(dc: DataConnect, vars: GetSubscriptionsByUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetSubscriptionsByUserData>>;
/** Generated Node Admin SDK operation action function for the 'GetSubscriptionsByUser' Query. Allow users to pass in custom DataConnect instances. */
export function getSubscriptionsByUser(vars: GetSubscriptionsByUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetSubscriptionsByUserData>>;

/** Generated Node Admin SDK operation action function for the 'GetActiveSubscriptionForListing' Query. Allow users to execute without passing in DataConnect. */
export function getActiveSubscriptionForListing(dc: DataConnect, vars: GetActiveSubscriptionForListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetActiveSubscriptionForListingData>>;
/** Generated Node Admin SDK operation action function for the 'GetActiveSubscriptionForListing' Query. Allow users to pass in custom DataConnect instances. */
export function getActiveSubscriptionForListing(vars: GetActiveSubscriptionForListingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetActiveSubscriptionForListingData>>;

/** Generated Node Admin SDK operation action function for the 'GetSubscriptionByStripeId' Query. Allow users to execute without passing in DataConnect. */
export function getSubscriptionByStripeId(dc: DataConnect, vars: GetSubscriptionByStripeIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetSubscriptionByStripeIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetSubscriptionByStripeId' Query. Allow users to pass in custom DataConnect instances. */
export function getSubscriptionByStripeId(vars: GetSubscriptionByStripeIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetSubscriptionByStripeIdData>>;

/** Generated Node Admin SDK operation action function for the 'GetInvoicesByUser' Query. Allow users to execute without passing in DataConnect. */
export function getInvoicesByUser(dc: DataConnect, vars: GetInvoicesByUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetInvoicesByUserData>>;
/** Generated Node Admin SDK operation action function for the 'GetInvoicesByUser' Query. Allow users to pass in custom DataConnect instances. */
export function getInvoicesByUser(vars: GetInvoicesByUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetInvoicesByUserData>>;

/** Generated Node Admin SDK operation action function for the 'GetSellerApplicationsByUser' Query. Allow users to execute without passing in DataConnect. */
export function getSellerApplicationsByUser(dc: DataConnect, vars: GetSellerApplicationsByUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetSellerApplicationsByUserData>>;
/** Generated Node Admin SDK operation action function for the 'GetSellerApplicationsByUser' Query. Allow users to pass in custom DataConnect instances. */
export function getSellerApplicationsByUser(vars: GetSellerApplicationsByUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetSellerApplicationsByUserData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertSubscription' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertSubscription(dc: DataConnect, vars: UpsertSubscriptionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertSubscriptionData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertSubscription' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertSubscription(vars: UpsertSubscriptionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertSubscriptionData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertInvoice' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertInvoice(dc: DataConnect, vars: UpsertInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertInvoiceData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertInvoice' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertInvoice(vars: UpsertInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertInvoiceData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertSellerApplication' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertSellerApplication(dc: DataConnect, vars: UpsertSellerApplicationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertSellerApplicationData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertSellerApplication' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertSellerApplication(vars: UpsertSellerApplicationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertSellerApplicationData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateSubscriptionStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateSubscriptionStatus(dc: DataConnect, vars: UpdateSubscriptionStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSubscriptionStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateSubscriptionStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateSubscriptionStatus(vars: UpdateSubscriptionStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSubscriptionStatusData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateInvoiceStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateInvoiceStatus(dc: DataConnect, vars: UpdateInvoiceStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateInvoiceStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateInvoiceStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateInvoiceStatus(vars: UpdateInvoiceStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateInvoiceStatusData>>;

