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

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface DeleteUserVariables {
  id: string;
}

export interface FinancingRequest_Key {
  id: string;
  __typename?: 'FinancingRequest_Key';
}

export interface GetStorefrontBySlugData {
  storefronts: ({
    id: string;
    userId: string;
    storefrontSlug?: string | null;
    canonicalPath?: string | null;
    storefrontName?: string | null;
    storefrontTagline?: string | null;
    storefrontDescription?: string | null;
    logoUrl?: string | null;
    coverPhotoUrl?: string | null;
    businessName?: string | null;
    city?: string | null;
    state?: string | null;
    location?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    serviceAreaScopes?: unknown | null;
    serviceAreaStates?: unknown | null;
    servicesOfferedCategories?: unknown | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  } & Storefront_Key)[];
}

export interface GetStorefrontBySlugVariables {
  slug: string;
}

export interface GetStorefrontByUserIdData {
  storefronts: ({
    id: string;
    userId: string;
    storefrontEnabled?: boolean | null;
    storefrontSlug?: string | null;
    storefrontName?: string | null;
    storefrontTagline?: string | null;
    storefrontDescription?: string | null;
    businessName?: string | null;
    location?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Storefront_Key)[];
}

export interface GetStorefrontByUserIdVariables {
  userId: string;
}

export interface GetUserByEmailData {
  users: ({
    id: string;
    email: string;
    displayName?: string | null;
    role: string;
    accountStatus?: string | null;
    storefrontEnabled?: boolean | null;
    storefrontSlug?: string | null;
  } & User_Key)[];
}

export interface GetUserByEmailVariables {
  email: string;
}

export interface GetUserByIdData {
  user?: {
    id: string;
    email: string;
    displayName?: string | null;
    phoneNumber?: string | null;
    role: string;
    emailVerified?: boolean | null;
    photoUrl?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    company?: string | null;
    businessName?: string | null;
    accountStatus?: string | null;
    storefrontEnabled?: boolean | null;
    storefrontSlug?: string | null;
    storefrontName?: string | null;
    mfaEnabled?: boolean | null;
    favorites?: unknown | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & User_Key;
}

export interface GetUserByIdVariables {
  id: string;
}

export interface Inquiry_Key {
  id: string;
  __typename?: 'Inquiry_Key';
}

export interface Invoice_Key {
  id: string;
  __typename?: 'Invoice_Key';
}

export interface ListActiveStorefrontsData {
  storefronts: ({
    id: string;
    userId: string;
    storefrontSlug?: string | null;
    storefrontName?: string | null;
    businessName?: string | null;
    city?: string | null;
    state?: string | null;
    logoUrl?: string | null;
    servicesOfferedCategories?: unknown | null;
  } & Storefront_Key)[];
}

export interface ListActiveStorefrontsVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface ListUsersByRoleData {
  users: ({
    id: string;
    email: string;
    displayName?: string | null;
    role: string;
    accountStatus?: string | null;
    storefrontEnabled?: boolean | null;
    createdAt: TimestampString;
  } & User_Key)[];
}

export interface ListUsersByRoleVariables {
  role: string;
  limit?: number | null;
  offset?: number | null;
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

export interface UpsertStorefrontData {
  storefront_upsert: Storefront_Key;
}

export interface UpsertStorefrontVariables {
  id: string;
  userId: string;
  storefrontEnabled?: boolean | null;
  storefrontSlug?: string | null;
  canonicalPath?: string | null;
  storefrontName?: string | null;
  storefrontTagline?: string | null;
  storefrontDescription?: string | null;
  logoUrl?: string | null;
  coverPhotoUrl?: string | null;
  businessName?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  postalCode?: string | null;
  country?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  serviceAreaScopes?: unknown | null;
  serviceAreaStates?: unknown | null;
  serviceAreaCounties?: unknown | null;
  servicesOfferedCategories?: unknown | null;
  servicesOfferedSubcategories?: unknown | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: unknown | null;
}

export interface UpsertUserData {
  user_upsert: User_Key;
}

export interface UpsertUserVariables {
  id: string;
  email: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  role: string;
  emailVerified?: boolean | null;
  photoUrl?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  company?: string | null;
  businessName?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  postalCode?: string | null;
  country?: string | null;
  website?: string | null;
  accountStatus?: string | null;
  parentAccountUid?: string | null;
  accountAccessSource?: string | null;
  mfaEnabled?: boolean | null;
  mfaMethod?: string | null;
  mfaPhoneNumber?: string | null;
  mfaEnrolledAt?: TimestampString | null;
  favorites?: unknown | null;
  storefrontEnabled?: boolean | null;
  storefrontSlug?: string | null;
  storefrontName?: string | null;
  storefrontTagline?: string | null;
  storefrontDescription?: string | null;
  storefrontLogoUrl?: string | null;
  coverPhotoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: unknown | null;
  metadataJson?: unknown | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'GetUserById' Query. Allow users to execute without passing in DataConnect. */
export function getUserById(dc: DataConnect, vars: GetUserByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserById' Query. Allow users to pass in custom DataConnect instances. */
export function getUserById(vars: GetUserByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserByIdData>>;

/** Generated Node Admin SDK operation action function for the 'GetUserByEmail' Query. Allow users to execute without passing in DataConnect. */
export function getUserByEmail(dc: DataConnect, vars: GetUserByEmailVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserByEmailData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserByEmail' Query. Allow users to pass in custom DataConnect instances. */
export function getUserByEmail(vars: GetUserByEmailVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserByEmailData>>;

/** Generated Node Admin SDK operation action function for the 'ListUsersByRole' Query. Allow users to execute without passing in DataConnect. */
export function listUsersByRole(dc: DataConnect, vars: ListUsersByRoleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListUsersByRoleData>>;
/** Generated Node Admin SDK operation action function for the 'ListUsersByRole' Query. Allow users to pass in custom DataConnect instances. */
export function listUsersByRole(vars: ListUsersByRoleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListUsersByRoleData>>;

/** Generated Node Admin SDK operation action function for the 'GetStorefrontBySlug' Query. Allow users to execute without passing in DataConnect. */
export function getStorefrontBySlug(dc: DataConnect, vars: GetStorefrontBySlugVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetStorefrontBySlugData>>;
/** Generated Node Admin SDK operation action function for the 'GetStorefrontBySlug' Query. Allow users to pass in custom DataConnect instances. */
export function getStorefrontBySlug(vars: GetStorefrontBySlugVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetStorefrontBySlugData>>;

/** Generated Node Admin SDK operation action function for the 'GetStorefrontByUserId' Query. Allow users to execute without passing in DataConnect. */
export function getStorefrontByUserId(dc: DataConnect, vars: GetStorefrontByUserIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetStorefrontByUserIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetStorefrontByUserId' Query. Allow users to pass in custom DataConnect instances. */
export function getStorefrontByUserId(vars: GetStorefrontByUserIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetStorefrontByUserIdData>>;

/** Generated Node Admin SDK operation action function for the 'ListActiveStorefronts' Query. Allow users to execute without passing in DataConnect. */
export function listActiveStorefronts(dc: DataConnect, vars?: ListActiveStorefrontsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListActiveStorefrontsData>>;
/** Generated Node Admin SDK operation action function for the 'ListActiveStorefronts' Query. Allow users to pass in custom DataConnect instances. */
export function listActiveStorefronts(vars?: ListActiveStorefrontsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListActiveStorefrontsData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertUser' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertUser(dc: DataConnect, vars: UpsertUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertUserData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertUser(vars: UpsertUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertUserData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertStorefront' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertStorefront(dc: DataConnect, vars: UpsertStorefrontVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertStorefrontData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertStorefront' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertStorefront(vars: UpsertStorefrontVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertStorefrontData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteUser' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteUser(dc: DataConnect, vars: DeleteUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteUserData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteUser(vars: DeleteUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteUserData>>;

