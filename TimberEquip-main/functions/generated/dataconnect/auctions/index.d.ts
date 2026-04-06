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

/** Generated Node Admin SDK operation action function for the 'GetAuctionById' Query. Allow users to execute without passing in DataConnect. */
export function getAuctionById(dc: DataConnect, vars: GetAuctionByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetAuctionById' Query. Allow users to pass in custom DataConnect instances. */
export function getAuctionById(vars: GetAuctionByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionByIdData>>;

/** Generated Node Admin SDK operation action function for the 'GetAuctionBySlug' Query. Allow users to execute without passing in DataConnect. */
export function getAuctionBySlug(dc: DataConnect, vars: GetAuctionBySlugVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionBySlugData>>;
/** Generated Node Admin SDK operation action function for the 'GetAuctionBySlug' Query. Allow users to pass in custom DataConnect instances. */
export function getAuctionBySlug(vars: GetAuctionBySlugVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionBySlugData>>;

/** Generated Node Admin SDK operation action function for the 'ListActiveAuctions' Query. Allow users to execute without passing in DataConnect. */
export function listActiveAuctions(dc: DataConnect, vars?: ListActiveAuctionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListActiveAuctionsData>>;
/** Generated Node Admin SDK operation action function for the 'ListActiveAuctions' Query. Allow users to pass in custom DataConnect instances. */
export function listActiveAuctions(vars?: ListActiveAuctionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListActiveAuctionsData>>;

/** Generated Node Admin SDK operation action function for the 'ListAuctionsByStatus' Query. Allow users to execute without passing in DataConnect. */
export function listAuctionsByStatus(dc: DataConnect, vars: ListAuctionsByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAuctionsByStatusData>>;
/** Generated Node Admin SDK operation action function for the 'ListAuctionsByStatus' Query. Allow users to pass in custom DataConnect instances. */
export function listAuctionsByStatus(vars: ListAuctionsByStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAuctionsByStatusData>>;

/** Generated Node Admin SDK operation action function for the 'GetLotsByAuction' Query. Allow users to execute without passing in DataConnect. */
export function getLotsByAuction(dc: DataConnect, vars: GetLotsByAuctionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetLotsByAuctionData>>;
/** Generated Node Admin SDK operation action function for the 'GetLotsByAuction' Query. Allow users to pass in custom DataConnect instances. */
export function getLotsByAuction(vars: GetLotsByAuctionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetLotsByAuctionData>>;

/** Generated Node Admin SDK operation action function for the 'GetLotById' Query. Allow users to execute without passing in DataConnect. */
export function getLotById(dc: DataConnect, vars: GetLotByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetLotByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetLotById' Query. Allow users to pass in custom DataConnect instances. */
export function getLotById(vars: GetLotByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetLotByIdData>>;

/** Generated Node Admin SDK operation action function for the 'GetPromotedLots' Query. Allow users to execute without passing in DataConnect. */
export function getPromotedLots(dc: DataConnect, vars: GetPromotedLotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetPromotedLotsData>>;
/** Generated Node Admin SDK operation action function for the 'GetPromotedLots' Query. Allow users to pass in custom DataConnect instances. */
export function getPromotedLots(vars: GetPromotedLotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetPromotedLotsData>>;

/** Generated Node Admin SDK operation action function for the 'GetBidsByLot' Query. Allow users to execute without passing in DataConnect. */
export function getBidsByLot(dc: DataConnect, vars: GetBidsByLotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetBidsByLotData>>;
/** Generated Node Admin SDK operation action function for the 'GetBidsByLot' Query. Allow users to pass in custom DataConnect instances. */
export function getBidsByLot(vars: GetBidsByLotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetBidsByLotData>>;

/** Generated Node Admin SDK operation action function for the 'GetBidsByBidder' Query. Allow users to execute without passing in DataConnect. */
export function getBidsByBidder(dc: DataConnect, vars: GetBidsByBidderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetBidsByBidderData>>;
/** Generated Node Admin SDK operation action function for the 'GetBidsByBidder' Query. Allow users to pass in custom DataConnect instances. */
export function getBidsByBidder(vars: GetBidsByBidderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetBidsByBidderData>>;

/** Generated Node Admin SDK operation action function for the 'GetAuctionInvoicesByBuyer' Query. Allow users to execute without passing in DataConnect. */
export function getAuctionInvoicesByBuyer(dc: DataConnect, vars: GetAuctionInvoicesByBuyerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionInvoicesByBuyerData>>;
/** Generated Node Admin SDK operation action function for the 'GetAuctionInvoicesByBuyer' Query. Allow users to pass in custom DataConnect instances. */
export function getAuctionInvoicesByBuyer(vars: GetAuctionInvoicesByBuyerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionInvoicesByBuyerData>>;

/** Generated Node Admin SDK operation action function for the 'GetAuctionInvoicesByAuction' Query. Allow users to execute without passing in DataConnect. */
export function getAuctionInvoicesByAuction(dc: DataConnect, vars: GetAuctionInvoicesByAuctionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionInvoicesByAuctionData>>;
/** Generated Node Admin SDK operation action function for the 'GetAuctionInvoicesByAuction' Query. Allow users to pass in custom DataConnect instances. */
export function getAuctionInvoicesByAuction(vars: GetAuctionInvoicesByAuctionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionInvoicesByAuctionData>>;

/** Generated Node Admin SDK operation action function for the 'GetAuctionInvoiceById' Query. Allow users to execute without passing in DataConnect. */
export function getAuctionInvoiceById(dc: DataConnect, vars: GetAuctionInvoiceByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionInvoiceByIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetAuctionInvoiceById' Query. Allow users to pass in custom DataConnect instances. */
export function getAuctionInvoiceById(vars: GetAuctionInvoiceByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAuctionInvoiceByIdData>>;

/** Generated Node Admin SDK operation action function for the 'GetBidderProfileByUserId' Query. Allow users to execute without passing in DataConnect. */
export function getBidderProfileByUserId(dc: DataConnect, vars: GetBidderProfileByUserIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetBidderProfileByUserIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetBidderProfileByUserId' Query. Allow users to pass in custom DataConnect instances. */
export function getBidderProfileByUserId(vars: GetBidderProfileByUserIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetBidderProfileByUserIdData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertAuction' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertAuction(dc: DataConnect, vars: UpsertAuctionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertAuctionData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertAuction' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertAuction(vars: UpsertAuctionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertAuctionData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertAuctionLot' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertAuctionLot(dc: DataConnect, vars: UpsertAuctionLotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertAuctionLotData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertAuctionLot' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertAuctionLot(vars: UpsertAuctionLotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertAuctionLotData>>;

/** Generated Node Admin SDK operation action function for the 'InsertAuctionBid' Mutation. Allow users to execute without passing in DataConnect. */
export function insertAuctionBid(dc: DataConnect, vars: InsertAuctionBidVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertAuctionBidData>>;
/** Generated Node Admin SDK operation action function for the 'InsertAuctionBid' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertAuctionBid(vars: InsertAuctionBidVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertAuctionBidData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateBidStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateBidStatus(dc: DataConnect, vars: UpdateBidStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateBidStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateBidStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateBidStatus(vars: UpdateBidStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateBidStatusData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertAuctionInvoice' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertAuctionInvoice(dc: DataConnect, vars: UpsertAuctionInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertAuctionInvoiceData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertAuctionInvoice' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertAuctionInvoice(vars: UpsertAuctionInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertAuctionInvoiceData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateAuctionInvoiceStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateAuctionInvoiceStatus(dc: DataConnect, vars: UpdateAuctionInvoiceStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionInvoiceStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateAuctionInvoiceStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateAuctionInvoiceStatus(vars: UpdateAuctionInvoiceStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionInvoiceStatusData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateAuctionLotBidState' Mutation. Allow users to execute without passing in DataConnect. */
export function updateAuctionLotBidState(dc: DataConnect, vars: UpdateAuctionLotBidStateVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionLotBidStateData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateAuctionLotBidState' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateAuctionLotBidState(vars: UpdateAuctionLotBidStateVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionLotBidStateData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateAuctionLotStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateAuctionLotStatus(dc: DataConnect, vars: UpdateAuctionLotStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionLotStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateAuctionLotStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateAuctionLotStatus(vars: UpdateAuctionLotStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionLotStatusData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertBidderProfile' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertBidderProfile(dc: DataConnect, vars: UpsertBidderProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertBidderProfileData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertBidderProfile' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertBidderProfile(vars: UpsertBidderProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertBidderProfileData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateAuctionStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateAuctionStatus(dc: DataConnect, vars: UpdateAuctionStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateAuctionStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateAuctionStatus(vars: UpdateAuctionStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionStatusData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateAuctionStats' Mutation. Allow users to execute without passing in DataConnect. */
export function updateAuctionStats(dc: DataConnect, vars: UpdateAuctionStatsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionStatsData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateAuctionStats' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateAuctionStats(vars: UpdateAuctionStatsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAuctionStatsData>>;

