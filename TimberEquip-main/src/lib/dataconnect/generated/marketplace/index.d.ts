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

interface GetUserByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserByIdVariables): QueryRef<GetUserByIdData, GetUserByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserByIdVariables): QueryRef<GetUserByIdData, GetUserByIdVariables>;
  operationName: string;
}
export const getUserByIdRef: GetUserByIdRef;

export function getUserById(vars: GetUserByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByIdData, GetUserByIdVariables>;
export function getUserById(dc: DataConnect, vars: GetUserByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByIdData, GetUserByIdVariables>;

interface GetUserByEmailRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserByEmailVariables): QueryRef<GetUserByEmailData, GetUserByEmailVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserByEmailVariables): QueryRef<GetUserByEmailData, GetUserByEmailVariables>;
  operationName: string;
}
export const getUserByEmailRef: GetUserByEmailRef;

export function getUserByEmail(vars: GetUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByEmailData, GetUserByEmailVariables>;
export function getUserByEmail(dc: DataConnect, vars: GetUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByEmailData, GetUserByEmailVariables>;

interface ListUsersByRoleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListUsersByRoleVariables): QueryRef<ListUsersByRoleData, ListUsersByRoleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListUsersByRoleVariables): QueryRef<ListUsersByRoleData, ListUsersByRoleVariables>;
  operationName: string;
}
export const listUsersByRoleRef: ListUsersByRoleRef;

export function listUsersByRole(vars: ListUsersByRoleVariables, options?: ExecuteQueryOptions): QueryPromise<ListUsersByRoleData, ListUsersByRoleVariables>;
export function listUsersByRole(dc: DataConnect, vars: ListUsersByRoleVariables, options?: ExecuteQueryOptions): QueryPromise<ListUsersByRoleData, ListUsersByRoleVariables>;

interface GetStorefrontBySlugRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStorefrontBySlugVariables): QueryRef<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetStorefrontBySlugVariables): QueryRef<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
  operationName: string;
}
export const getStorefrontBySlugRef: GetStorefrontBySlugRef;

export function getStorefrontBySlug(vars: GetStorefrontBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
export function getStorefrontBySlug(dc: DataConnect, vars: GetStorefrontBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;

interface GetStorefrontByUserIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStorefrontByUserIdVariables): QueryRef<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetStorefrontByUserIdVariables): QueryRef<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
  operationName: string;
}
export const getStorefrontByUserIdRef: GetStorefrontByUserIdRef;

export function getStorefrontByUserId(vars: GetStorefrontByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
export function getStorefrontByUserId(dc: DataConnect, vars: GetStorefrontByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;

interface ListActiveStorefrontsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListActiveStorefrontsVariables): QueryRef<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListActiveStorefrontsVariables): QueryRef<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
  operationName: string;
}
export const listActiveStorefrontsRef: ListActiveStorefrontsRef;

export function listActiveStorefronts(vars?: ListActiveStorefrontsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
export function listActiveStorefronts(dc: DataConnect, vars?: ListActiveStorefrontsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;

interface UpsertUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  operationName: string;
}
export const upsertUserRef: UpsertUserRef;

export function upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;
export function upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertStorefrontRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertStorefrontVariables): MutationRef<UpsertStorefrontData, UpsertStorefrontVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertStorefrontVariables): MutationRef<UpsertStorefrontData, UpsertStorefrontVariables>;
  operationName: string;
}
export const upsertStorefrontRef: UpsertStorefrontRef;

export function upsertStorefront(vars: UpsertStorefrontVariables): MutationPromise<UpsertStorefrontData, UpsertStorefrontVariables>;
export function upsertStorefront(dc: DataConnect, vars: UpsertStorefrontVariables): MutationPromise<UpsertStorefrontData, UpsertStorefrontVariables>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;
export function deleteUser(dc: DataConnect, vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;

