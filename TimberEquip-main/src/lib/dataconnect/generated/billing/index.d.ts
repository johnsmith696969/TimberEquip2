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

interface GetSubscriptionsByUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSubscriptionsByUserVariables): QueryRef<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSubscriptionsByUserVariables): QueryRef<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;
  operationName: string;
}
export const getSubscriptionsByUserRef: GetSubscriptionsByUserRef;

export function getSubscriptionsByUser(vars: GetSubscriptionsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;
export function getSubscriptionsByUser(dc: DataConnect, vars: GetSubscriptionsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;

interface GetActiveSubscriptionForListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetActiveSubscriptionForListingVariables): QueryRef<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetActiveSubscriptionForListingVariables): QueryRef<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;
  operationName: string;
}
export const getActiveSubscriptionForListingRef: GetActiveSubscriptionForListingRef;

export function getActiveSubscriptionForListing(vars: GetActiveSubscriptionForListingVariables, options?: ExecuteQueryOptions): QueryPromise<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;
export function getActiveSubscriptionForListing(dc: DataConnect, vars: GetActiveSubscriptionForListingVariables, options?: ExecuteQueryOptions): QueryPromise<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;

interface GetSubscriptionByStripeIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSubscriptionByStripeIdVariables): QueryRef<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSubscriptionByStripeIdVariables): QueryRef<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;
  operationName: string;
}
export const getSubscriptionByStripeIdRef: GetSubscriptionByStripeIdRef;

export function getSubscriptionByStripeId(vars: GetSubscriptionByStripeIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;
export function getSubscriptionByStripeId(dc: DataConnect, vars: GetSubscriptionByStripeIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;

interface GetInvoicesByUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetInvoicesByUserVariables): QueryRef<GetInvoicesByUserData, GetInvoicesByUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetInvoicesByUserVariables): QueryRef<GetInvoicesByUserData, GetInvoicesByUserVariables>;
  operationName: string;
}
export const getInvoicesByUserRef: GetInvoicesByUserRef;

export function getInvoicesByUser(vars: GetInvoicesByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetInvoicesByUserData, GetInvoicesByUserVariables>;
export function getInvoicesByUser(dc: DataConnect, vars: GetInvoicesByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetInvoicesByUserData, GetInvoicesByUserVariables>;

interface GetSellerApplicationsByUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSellerApplicationsByUserVariables): QueryRef<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSellerApplicationsByUserVariables): QueryRef<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;
  operationName: string;
}
export const getSellerApplicationsByUserRef: GetSellerApplicationsByUserRef;

export function getSellerApplicationsByUser(vars: GetSellerApplicationsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;
export function getSellerApplicationsByUser(dc: DataConnect, vars: GetSellerApplicationsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;

interface UpsertSubscriptionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertSubscriptionVariables): MutationRef<UpsertSubscriptionData, UpsertSubscriptionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertSubscriptionVariables): MutationRef<UpsertSubscriptionData, UpsertSubscriptionVariables>;
  operationName: string;
}
export const upsertSubscriptionRef: UpsertSubscriptionRef;

export function upsertSubscription(vars: UpsertSubscriptionVariables): MutationPromise<UpsertSubscriptionData, UpsertSubscriptionVariables>;
export function upsertSubscription(dc: DataConnect, vars: UpsertSubscriptionVariables): MutationPromise<UpsertSubscriptionData, UpsertSubscriptionVariables>;

interface UpsertInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertInvoiceVariables): MutationRef<UpsertInvoiceData, UpsertInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertInvoiceVariables): MutationRef<UpsertInvoiceData, UpsertInvoiceVariables>;
  operationName: string;
}
export const upsertInvoiceRef: UpsertInvoiceRef;

export function upsertInvoice(vars: UpsertInvoiceVariables): MutationPromise<UpsertInvoiceData, UpsertInvoiceVariables>;
export function upsertInvoice(dc: DataConnect, vars: UpsertInvoiceVariables): MutationPromise<UpsertInvoiceData, UpsertInvoiceVariables>;

interface UpsertSellerApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertSellerApplicationVariables): MutationRef<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertSellerApplicationVariables): MutationRef<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;
  operationName: string;
}
export const upsertSellerApplicationRef: UpsertSellerApplicationRef;

export function upsertSellerApplication(vars: UpsertSellerApplicationVariables): MutationPromise<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;
export function upsertSellerApplication(dc: DataConnect, vars: UpsertSellerApplicationVariables): MutationPromise<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;

interface UpdateSubscriptionStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSubscriptionStatusVariables): MutationRef<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSubscriptionStatusVariables): MutationRef<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;
  operationName: string;
}
export const updateSubscriptionStatusRef: UpdateSubscriptionStatusRef;

export function updateSubscriptionStatus(vars: UpdateSubscriptionStatusVariables): MutationPromise<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;
export function updateSubscriptionStatus(dc: DataConnect, vars: UpdateSubscriptionStatusVariables): MutationPromise<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;

interface UpdateInvoiceStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInvoiceStatusVariables): MutationRef<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateInvoiceStatusVariables): MutationRef<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;
  operationName: string;
}
export const updateInvoiceStatusRef: UpdateInvoiceStatusRef;

export function updateInvoiceStatus(vars: UpdateInvoiceStatusVariables): MutationPromise<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;
export function updateInvoiceStatus(dc: DataConnect, vars: UpdateInvoiceStatusVariables): MutationPromise<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;

