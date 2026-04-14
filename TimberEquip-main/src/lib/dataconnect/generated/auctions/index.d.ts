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

export interface GetAuctionByIdData {
  auction?: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverImageUrl?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    previewStartTime?: TimestampString | null;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    totalGmv?: number | null;
    defaultBuyerPremiumPercent?: number | null;
    softCloseThresholdMin?: number | null;
    softCloseExtensionMin?: number | null;
    staggerIntervalMin?: number | null;
    defaultPaymentDeadlineDays?: number | null;
    defaultRemovalDeadlineDays?: number | null;
    termsAndConditionsUrl?: string | null;
    featured?: boolean | null;
    bannerEnabled?: boolean | null;
    bannerImageUrl?: string | null;
    createdBy: string;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Auction_Key;
}

export interface GetAuctionByIdVariables {
  id: string;
}

export interface GetAuctionBySlugData {
  auctions: ({
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverImageUrl?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    previewStartTime?: TimestampString | null;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    featured?: boolean | null;
    createdAt: TimestampString;
  } & Auction_Key)[];
}

export interface GetAuctionBySlugVariables {
  slug: string;
}

export interface GetAuctionInvoiceByIdData {
  auctionInvoice?: {
    id: string;
    auctionId: string;
    lotId: string;
    buyerId: string;
    sellerId: string;
    hammerPrice: number;
    buyerPremium: number;
    documentationFee?: number | null;
    cardProcessingFee?: number | null;
    salesTaxRate?: number | null;
    salesTaxAmount?: number | null;
    salesTaxState?: string | null;
    totalDue: number;
    currency?: string | null;
    status: string;
    paymentMethod?: string | null;
    stripeInvoiceId?: string | null;
    stripePaymentIntentId?: string | null;
    buyerTaxExempt?: boolean | null;
    buyerTaxExemptState?: string | null;
    dueDate: TimestampString;
    paidAt?: TimestampString | null;
    sellerCommission?: number | null;
    sellerPayout?: number | null;
    sellerPaidAt?: TimestampString | null;
    removalConfirmedAt?: TimestampString | null;
    storageFeesAccrued?: number | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & AuctionInvoice_Key;
}

export interface GetAuctionInvoiceByIdVariables {
  id: string;
}

export interface GetAuctionInvoicesByAuctionData {
  auctionInvoices: ({
    id: string;
    lotId: string;
    buyerId: string;
    sellerId: string;
    hammerPrice: number;
    buyerPremium: number;
    totalDue: number;
    status: string;
    paymentMethod?: string | null;
    dueDate: TimestampString;
    paidAt?: TimestampString | null;
    sellerPayout?: number | null;
    sellerPaidAt?: TimestampString | null;
    createdAt: TimestampString;
  } & AuctionInvoice_Key)[];
}

export interface GetAuctionInvoicesByAuctionVariables {
  auctionId: string;
}

export interface GetAuctionInvoicesByBuyerData {
  auctionInvoices: ({
    id: string;
    auctionId: string;
    lotId: string;
    sellerId: string;
    hammerPrice: number;
    buyerPremium: number;
    documentationFee?: number | null;
    salesTaxAmount?: number | null;
    totalDue: number;
    status: string;
    paymentMethod?: string | null;
    dueDate: TimestampString;
    paidAt?: TimestampString | null;
    createdAt: TimestampString;
  } & AuctionInvoice_Key)[];
}

export interface GetAuctionInvoicesByBuyerVariables {
  buyerId: string;
  limit?: number | null;
}

export interface GetBidderProfileByUserIdData {
  bidderProfiles: ({
    id: string;
    userId: string;
    verificationTier: string;
    fullName?: string | null;
    phone?: string | null;
    phoneVerified?: boolean | null;
    addressCity?: string | null;
    addressState?: string | null;
    companyName?: string | null;
    stripeCustomerId?: string | null;
    idVerificationStatus?: string | null;
    bidderApprovedAt?: TimestampString | null;
    totalAuctionsParticipated?: number | null;
    totalItemsWon?: number | null;
    totalSpent?: number | null;
    nonPaymentCount?: number | null;
    taxExempt?: boolean | null;
    taxExemptState?: string | null;
    termsAcceptedAt?: TimestampString | null;
    termsVersion?: string | null;
    createdAt: TimestampString;
  } & BidderProfile_Key)[];
}

export interface GetBidderProfileByUserIdVariables {
  userId: string;
}

export interface GetBidsByBidderData {
  auctionBids: ({
    id: string;
    auctionId: string;
    lotId: string;
    amount: number;
    status: string;
    bidTime: TimestampString;
  } & AuctionBid_Key)[];
}

export interface GetBidsByBidderVariables {
  bidderId: string;
  limit?: number | null;
}

export interface GetBidsByLotData {
  auctionBids: ({
    id: string;
    bidderId: string;
    bidderAnonymousId: string;
    amount: number;
    maxBid?: number | null;
    type: string;
    status: string;
    triggeredExtension?: boolean | null;
    bidTime: TimestampString;
  } & AuctionBid_Key)[];
}

export interface GetBidsByLotVariables {
  auctionId: string;
  lotId: string;
  limit?: number | null;
}

export interface GetLotByIdData {
  auctionLot?: {
    id: string;
    auctionId: string;
    listingId?: string | null;
    lotNumber: string;
    closeOrder: number;
    startingBid?: number | null;
    reservePrice?: number | null;
    reserveMet?: boolean | null;
    buyerPremiumPercent?: number | null;
    startTime?: TimestampString | null;
    endTime?: TimestampString | null;
    originalEndTime?: TimestampString | null;
    extensionCount?: number | null;
    currentBid?: number | null;
    currentBidderId?: string | null;
    currentBidderAnonymousId?: string | null;
    bidCount?: number | null;
    uniqueBidders?: number | null;
    lastBidTime?: TimestampString | null;
    status: string;
    promoted?: boolean | null;
    winningBidderId?: string | null;
    winningBid?: number | null;
    watcherCount?: number | null;
    title?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    year?: number | null;
    thumbnailUrl?: string | null;
    pickupLocation?: string | null;
    paymentDeadlineDays?: number | null;
    removalDeadlineDays?: number | null;
    storageFeePerDay?: number | null;
    isTitledItem?: boolean | null;
    titleDocumentFee?: number | null;
  } & AuctionLot_Key;
}

export interface GetLotByIdVariables {
  id: string;
}

export interface GetLotsByAuctionData {
  auctionLots: ({
    id: string;
    auctionId: string;
    listingId?: string | null;
    lotNumber: string;
    closeOrder: number;
    startingBid?: number | null;
    reserveMet?: boolean | null;
    buyerPremiumPercent?: number | null;
    startTime?: TimestampString | null;
    endTime?: TimestampString | null;
    currentBid?: number | null;
    currentBidderAnonymousId?: string | null;
    bidCount?: number | null;
    uniqueBidders?: number | null;
    status: string;
    promoted?: boolean | null;
    promotedOrder?: number | null;
    winningBidderId?: string | null;
    winningBid?: number | null;
    title?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    year?: number | null;
    thumbnailUrl?: string | null;
    pickupLocation?: string | null;
    isTitledItem?: boolean | null;
  } & AuctionLot_Key)[];
}

export interface GetLotsByAuctionVariables {
  auctionId: string;
}

export interface GetPromotedLotsData {
  auctionLots: ({
    id: string;
    lotNumber: string;
    currentBid?: number | null;
    bidCount?: number | null;
    status: string;
    title?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    year?: number | null;
    thumbnailUrl?: string | null;
  } & AuctionLot_Key)[];
}

export interface GetPromotedLotsVariables {
  auctionId: string;
}

export interface Inquiry_Key {
  id: string;
  __typename?: 'Inquiry_Key';
}

export interface InsertAuctionBidData {
  auctionBid_insert: AuctionBid_Key;
}

export interface InsertAuctionBidVariables {
  id: string;
  auctionId: string;
  lotId: string;
  bidderId: string;
  bidderAnonymousId: string;
  amount: number;
  maxBid?: number | null;
  type: string;
  status: string;
  triggeredExtension?: boolean | null;
  bidTime: TimestampString;
}

export interface Invoice_Key {
  id: string;
  __typename?: 'Invoice_Key';
}

export interface ListActiveAuctionsData {
  auctions: ({
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    featured?: boolean | null;
  } & Auction_Key)[];
}

export interface ListActiveAuctionsVariables {
  limit?: number | null;
}

export interface ListAuctionsByStatusData {
  auctions: ({
    id: string;
    title: string;
    slug: string;
    startTime: TimestampString;
    endTime: TimestampString;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    totalGmv?: number | null;
    createdAt: TimestampString;
  } & Auction_Key)[];
}

export interface ListAuctionsByStatusVariables {
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

export interface UpdateAuctionInvoiceStatusData {
  auctionInvoice_update?: AuctionInvoice_Key | null;
}

export interface UpdateAuctionInvoiceStatusVariables {
  id: string;
  status: string;
  paidAt?: TimestampString | null;
  paymentMethod?: string | null;
}

export interface UpdateAuctionLotBidStateData {
  auctionLot_update?: AuctionLot_Key | null;
}

export interface UpdateAuctionLotBidStateVariables {
  id: string;
  currentBid: number;
  currentBidderId?: string | null;
  currentBidderAnonymousId?: string | null;
  bidCount: number;
  uniqueBidders?: number | null;
  lastBidTime?: TimestampString | null;
  reserveMet?: boolean | null;
}

export interface UpdateAuctionLotStatusData {
  auctionLot_update?: AuctionLot_Key | null;
}

export interface UpdateAuctionLotStatusVariables {
  id: string;
  status: string;
  winningBidderId?: string | null;
  winningBid?: number | null;
}

export interface UpdateAuctionStatsData {
  auction_update?: Auction_Key | null;
}

export interface UpdateAuctionStatsVariables {
  id: string;
  lotCount?: number | null;
  totalBids?: number | null;
  totalGmv?: number | null;
}

export interface UpdateAuctionStatusData {
  auction_update?: Auction_Key | null;
}

export interface UpdateAuctionStatusVariables {
  id: string;
  status: string;
}

export interface UpdateBidStatusData {
  auctionBid_update?: AuctionBid_Key | null;
}

export interface UpdateBidStatusVariables {
  id: string;
  status: string;
}

export interface UpsertAuctionData {
  auction_upsert: Auction_Key;
}

export interface UpsertAuctionInvoiceData {
  auctionInvoice_upsert: AuctionInvoice_Key;
}

export interface UpsertAuctionInvoiceVariables {
  id: string;
  auctionId: string;
  lotId: string;
  buyerId: string;
  sellerId: string;
  hammerPrice: number;
  buyerPremium: number;
  documentationFee?: number | null;
  cardProcessingFee?: number | null;
  salesTaxRate?: number | null;
  salesTaxAmount?: number | null;
  salesTaxState?: string | null;
  totalDue: number;
  currency?: string | null;
  status: string;
  paymentMethod?: string | null;
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  buyerTaxExempt?: boolean | null;
  buyerTaxExemptState?: string | null;
  buyerTaxExemptCertificateUrl?: string | null;
  dueDate: TimestampString;
  paidAt?: TimestampString | null;
  sellerCommission?: number | null;
  sellerPayout?: number | null;
  sellerPaidAt?: TimestampString | null;
}

export interface UpsertAuctionLotData {
  auctionLot_upsert: AuctionLot_Key;
}

export interface UpsertAuctionLotVariables {
  id: string;
  auctionId: string;
  listingId?: string | null;
  lotNumber: string;
  closeOrder: number;
  startingBid?: number | null;
  reservePrice?: number | null;
  reserveMet?: boolean | null;
  buyerPremiumPercent?: number | null;
  startTime?: TimestampString | null;
  endTime?: TimestampString | null;
  originalEndTime?: TimestampString | null;
  extensionCount?: number | null;
  currentBid?: number | null;
  currentBidderId?: string | null;
  currentBidderAnonymousId?: string | null;
  bidCount?: number | null;
  uniqueBidders?: number | null;
  lastBidTime?: TimestampString | null;
  status: string;
  promoted?: boolean | null;
  promotedOrder?: number | null;
  winningBidderId?: string | null;
  winningBid?: number | null;
  watcherCount?: number | null;
  title?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
  thumbnailUrl?: string | null;
  pickupLocation?: string | null;
  paymentDeadlineDays?: number | null;
  removalDeadlineDays?: number | null;
  storageFeePerDay?: number | null;
  isTitledItem?: boolean | null;
  titleDocumentFee?: number | null;
}

export interface UpsertAuctionVariables {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  startTime: TimestampString;
  endTime: TimestampString;
  previewStartTime?: TimestampString | null;
  status: string;
  lotCount?: number | null;
  totalBids?: number | null;
  totalGmv?: number | null;
  defaultBuyerPremiumPercent?: number | null;
  softCloseThresholdMin?: number | null;
  softCloseExtensionMin?: number | null;
  staggerIntervalMin?: number | null;
  defaultPaymentDeadlineDays?: number | null;
  defaultRemovalDeadlineDays?: number | null;
  termsAndConditionsUrl?: string | null;
  featured?: boolean | null;
  bannerEnabled?: boolean | null;
  bannerImageUrl?: string | null;
  createdBy: string;
}

export interface UpsertBidderProfileData {
  bidderProfile_upsert: BidderProfile_Key;
}

export interface UpsertBidderProfileVariables {
  id: string;
  userId: string;
  verificationTier: string;
  fullName?: string | null;
  phone?: string | null;
  phoneVerified?: boolean | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  addressCountry?: string | null;
  companyName?: string | null;
  stripeCustomerId?: string | null;
  idVerificationStatus?: string | null;
  idVerifiedAt?: TimestampString | null;
  bidderApprovedAt?: TimestampString | null;
  bidderApprovedBy?: string | null;
  totalAuctionsParticipated?: number | null;
  totalItemsWon?: number | null;
  totalSpent?: number | null;
  nonPaymentCount?: number | null;
  taxExempt?: boolean | null;
  taxExemptState?: string | null;
  taxExemptCertificateUrl?: string | null;
  defaultPaymentMethodId?: string | null;
  defaultPaymentMethodBrand?: string | null;
  defaultPaymentMethodLast4?: string | null;
  termsAcceptedAt?: TimestampString | null;
  termsVersion?: string | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface GetAuctionByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionByIdVariables): QueryRef<GetAuctionByIdData, GetAuctionByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAuctionByIdVariables): QueryRef<GetAuctionByIdData, GetAuctionByIdVariables>;
  operationName: string;
}
export const getAuctionByIdRef: GetAuctionByIdRef;

export function getAuctionById(vars: GetAuctionByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionByIdData, GetAuctionByIdVariables>;
export function getAuctionById(dc: DataConnect, vars: GetAuctionByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionByIdData, GetAuctionByIdVariables>;

interface GetAuctionBySlugRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionBySlugVariables): QueryRef<GetAuctionBySlugData, GetAuctionBySlugVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAuctionBySlugVariables): QueryRef<GetAuctionBySlugData, GetAuctionBySlugVariables>;
  operationName: string;
}
export const getAuctionBySlugRef: GetAuctionBySlugRef;

export function getAuctionBySlug(vars: GetAuctionBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionBySlugData, GetAuctionBySlugVariables>;
export function getAuctionBySlug(dc: DataConnect, vars: GetAuctionBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionBySlugData, GetAuctionBySlugVariables>;

interface ListActiveAuctionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListActiveAuctionsVariables): QueryRef<ListActiveAuctionsData, ListActiveAuctionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListActiveAuctionsVariables): QueryRef<ListActiveAuctionsData, ListActiveAuctionsVariables>;
  operationName: string;
}
export const listActiveAuctionsRef: ListActiveAuctionsRef;

export function listActiveAuctions(vars?: ListActiveAuctionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveAuctionsData, ListActiveAuctionsVariables>;
export function listActiveAuctions(dc: DataConnect, vars?: ListActiveAuctionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveAuctionsData, ListActiveAuctionsVariables>;

interface ListAuctionsByStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListAuctionsByStatusVariables): QueryRef<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListAuctionsByStatusVariables): QueryRef<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
  operationName: string;
}
export const listAuctionsByStatusRef: ListAuctionsByStatusRef;

export function listAuctionsByStatus(vars: ListAuctionsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
export function listAuctionsByStatus(dc: DataConnect, vars: ListAuctionsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;

interface GetLotsByAuctionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLotsByAuctionVariables): QueryRef<GetLotsByAuctionData, GetLotsByAuctionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLotsByAuctionVariables): QueryRef<GetLotsByAuctionData, GetLotsByAuctionVariables>;
  operationName: string;
}
export const getLotsByAuctionRef: GetLotsByAuctionRef;

export function getLotsByAuction(vars: GetLotsByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotsByAuctionData, GetLotsByAuctionVariables>;
export function getLotsByAuction(dc: DataConnect, vars: GetLotsByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotsByAuctionData, GetLotsByAuctionVariables>;

interface GetLotByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLotByIdVariables): QueryRef<GetLotByIdData, GetLotByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLotByIdVariables): QueryRef<GetLotByIdData, GetLotByIdVariables>;
  operationName: string;
}
export const getLotByIdRef: GetLotByIdRef;

export function getLotById(vars: GetLotByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotByIdData, GetLotByIdVariables>;
export function getLotById(dc: DataConnect, vars: GetLotByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotByIdData, GetLotByIdVariables>;

interface GetPromotedLotsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPromotedLotsVariables): QueryRef<GetPromotedLotsData, GetPromotedLotsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetPromotedLotsVariables): QueryRef<GetPromotedLotsData, GetPromotedLotsVariables>;
  operationName: string;
}
export const getPromotedLotsRef: GetPromotedLotsRef;

export function getPromotedLots(vars: GetPromotedLotsVariables, options?: ExecuteQueryOptions): QueryPromise<GetPromotedLotsData, GetPromotedLotsVariables>;
export function getPromotedLots(dc: DataConnect, vars: GetPromotedLotsVariables, options?: ExecuteQueryOptions): QueryPromise<GetPromotedLotsData, GetPromotedLotsVariables>;

interface GetBidsByLotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBidsByLotVariables): QueryRef<GetBidsByLotData, GetBidsByLotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBidsByLotVariables): QueryRef<GetBidsByLotData, GetBidsByLotVariables>;
  operationName: string;
}
export const getBidsByLotRef: GetBidsByLotRef;

export function getBidsByLot(vars: GetBidsByLotVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByLotData, GetBidsByLotVariables>;
export function getBidsByLot(dc: DataConnect, vars: GetBidsByLotVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByLotData, GetBidsByLotVariables>;

interface GetBidsByBidderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBidsByBidderVariables): QueryRef<GetBidsByBidderData, GetBidsByBidderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBidsByBidderVariables): QueryRef<GetBidsByBidderData, GetBidsByBidderVariables>;
  operationName: string;
}
export const getBidsByBidderRef: GetBidsByBidderRef;

export function getBidsByBidder(vars: GetBidsByBidderVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByBidderData, GetBidsByBidderVariables>;
export function getBidsByBidder(dc: DataConnect, vars: GetBidsByBidderVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByBidderData, GetBidsByBidderVariables>;

interface GetAuctionInvoicesByBuyerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionInvoicesByBuyerVariables): QueryRef<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAuctionInvoicesByBuyerVariables): QueryRef<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
  operationName: string;
}
export const getAuctionInvoicesByBuyerRef: GetAuctionInvoicesByBuyerRef;

export function getAuctionInvoicesByBuyer(vars: GetAuctionInvoicesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
export function getAuctionInvoicesByBuyer(dc: DataConnect, vars: GetAuctionInvoicesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;

interface GetAuctionInvoicesByAuctionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionInvoicesByAuctionVariables): QueryRef<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAuctionInvoicesByAuctionVariables): QueryRef<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
  operationName: string;
}
export const getAuctionInvoicesByAuctionRef: GetAuctionInvoicesByAuctionRef;

export function getAuctionInvoicesByAuction(vars: GetAuctionInvoicesByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
export function getAuctionInvoicesByAuction(dc: DataConnect, vars: GetAuctionInvoicesByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;

interface GetAuctionInvoiceByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionInvoiceByIdVariables): QueryRef<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAuctionInvoiceByIdVariables): QueryRef<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
  operationName: string;
}
export const getAuctionInvoiceByIdRef: GetAuctionInvoiceByIdRef;

export function getAuctionInvoiceById(vars: GetAuctionInvoiceByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
export function getAuctionInvoiceById(dc: DataConnect, vars: GetAuctionInvoiceByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;

interface GetBidderProfileByUserIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBidderProfileByUserIdVariables): QueryRef<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBidderProfileByUserIdVariables): QueryRef<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
  operationName: string;
}
export const getBidderProfileByUserIdRef: GetBidderProfileByUserIdRef;

export function getBidderProfileByUserId(vars: GetBidderProfileByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
export function getBidderProfileByUserId(dc: DataConnect, vars: GetBidderProfileByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;

interface UpsertAuctionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertAuctionVariables): MutationRef<UpsertAuctionData, UpsertAuctionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertAuctionVariables): MutationRef<UpsertAuctionData, UpsertAuctionVariables>;
  operationName: string;
}
export const upsertAuctionRef: UpsertAuctionRef;

export function upsertAuction(vars: UpsertAuctionVariables): MutationPromise<UpsertAuctionData, UpsertAuctionVariables>;
export function upsertAuction(dc: DataConnect, vars: UpsertAuctionVariables): MutationPromise<UpsertAuctionData, UpsertAuctionVariables>;

interface UpsertAuctionLotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertAuctionLotVariables): MutationRef<UpsertAuctionLotData, UpsertAuctionLotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertAuctionLotVariables): MutationRef<UpsertAuctionLotData, UpsertAuctionLotVariables>;
  operationName: string;
}
export const upsertAuctionLotRef: UpsertAuctionLotRef;

export function upsertAuctionLot(vars: UpsertAuctionLotVariables): MutationPromise<UpsertAuctionLotData, UpsertAuctionLotVariables>;
export function upsertAuctionLot(dc: DataConnect, vars: UpsertAuctionLotVariables): MutationPromise<UpsertAuctionLotData, UpsertAuctionLotVariables>;

interface InsertAuctionBidRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertAuctionBidVariables): MutationRef<InsertAuctionBidData, InsertAuctionBidVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertAuctionBidVariables): MutationRef<InsertAuctionBidData, InsertAuctionBidVariables>;
  operationName: string;
}
export const insertAuctionBidRef: InsertAuctionBidRef;

export function insertAuctionBid(vars: InsertAuctionBidVariables): MutationPromise<InsertAuctionBidData, InsertAuctionBidVariables>;
export function insertAuctionBid(dc: DataConnect, vars: InsertAuctionBidVariables): MutationPromise<InsertAuctionBidData, InsertAuctionBidVariables>;

interface UpdateBidStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBidStatusVariables): MutationRef<UpdateBidStatusData, UpdateBidStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateBidStatusVariables): MutationRef<UpdateBidStatusData, UpdateBidStatusVariables>;
  operationName: string;
}
export const updateBidStatusRef: UpdateBidStatusRef;

export function updateBidStatus(vars: UpdateBidStatusVariables): MutationPromise<UpdateBidStatusData, UpdateBidStatusVariables>;
export function updateBidStatus(dc: DataConnect, vars: UpdateBidStatusVariables): MutationPromise<UpdateBidStatusData, UpdateBidStatusVariables>;

interface UpsertAuctionInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertAuctionInvoiceVariables): MutationRef<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertAuctionInvoiceVariables): MutationRef<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
  operationName: string;
}
export const upsertAuctionInvoiceRef: UpsertAuctionInvoiceRef;

export function upsertAuctionInvoice(vars: UpsertAuctionInvoiceVariables): MutationPromise<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
export function upsertAuctionInvoice(dc: DataConnect, vars: UpsertAuctionInvoiceVariables): MutationPromise<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;

interface UpdateAuctionInvoiceStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionInvoiceStatusVariables): MutationRef<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateAuctionInvoiceStatusVariables): MutationRef<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
  operationName: string;
}
export const updateAuctionInvoiceStatusRef: UpdateAuctionInvoiceStatusRef;

export function updateAuctionInvoiceStatus(vars: UpdateAuctionInvoiceStatusVariables): MutationPromise<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
export function updateAuctionInvoiceStatus(dc: DataConnect, vars: UpdateAuctionInvoiceStatusVariables): MutationPromise<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;

interface UpdateAuctionLotBidStateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionLotBidStateVariables): MutationRef<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateAuctionLotBidStateVariables): MutationRef<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
  operationName: string;
}
export const updateAuctionLotBidStateRef: UpdateAuctionLotBidStateRef;

export function updateAuctionLotBidState(vars: UpdateAuctionLotBidStateVariables): MutationPromise<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
export function updateAuctionLotBidState(dc: DataConnect, vars: UpdateAuctionLotBidStateVariables): MutationPromise<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;

interface UpdateAuctionLotStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionLotStatusVariables): MutationRef<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateAuctionLotStatusVariables): MutationRef<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
  operationName: string;
}
export const updateAuctionLotStatusRef: UpdateAuctionLotStatusRef;

export function updateAuctionLotStatus(vars: UpdateAuctionLotStatusVariables): MutationPromise<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
export function updateAuctionLotStatus(dc: DataConnect, vars: UpdateAuctionLotStatusVariables): MutationPromise<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;

interface UpsertBidderProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertBidderProfileVariables): MutationRef<UpsertBidderProfileData, UpsertBidderProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertBidderProfileVariables): MutationRef<UpsertBidderProfileData, UpsertBidderProfileVariables>;
  operationName: string;
}
export const upsertBidderProfileRef: UpsertBidderProfileRef;

export function upsertBidderProfile(vars: UpsertBidderProfileVariables): MutationPromise<UpsertBidderProfileData, UpsertBidderProfileVariables>;
export function upsertBidderProfile(dc: DataConnect, vars: UpsertBidderProfileVariables): MutationPromise<UpsertBidderProfileData, UpsertBidderProfileVariables>;

interface UpdateAuctionStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionStatusVariables): MutationRef<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateAuctionStatusVariables): MutationRef<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
  operationName: string;
}
export const updateAuctionStatusRef: UpdateAuctionStatusRef;

export function updateAuctionStatus(vars: UpdateAuctionStatusVariables): MutationPromise<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
export function updateAuctionStatus(dc: DataConnect, vars: UpdateAuctionStatusVariables): MutationPromise<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;

interface UpdateAuctionStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionStatsVariables): MutationRef<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateAuctionStatsVariables): MutationRef<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
  operationName: string;
}
export const updateAuctionStatsRef: UpdateAuctionStatsRef;

export function updateAuctionStats(vars: UpdateAuctionStatsVariables): MutationPromise<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
export function updateAuctionStats(dc: DataConnect, vars: UpdateAuctionStatsVariables): MutationPromise<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;

