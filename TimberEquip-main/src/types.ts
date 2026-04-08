export type Condition = 'New' | 'Used' | 'Rebuilt';
export type Currency =
  | 'USD'
  | 'CAD'
  | 'EUR'
  | 'GBP'
  | 'NOK'
  | 'SEK'
  | 'CHF'
  | 'PLN'
  | 'CZK'
  | 'RON'
  | 'DKK'
  | 'HUF';
export type Language =
  | 'EN'
  | 'FR'
  | 'DE'
  | 'FI'
  | 'PL'
  | 'IT'
  | 'CS'
  | 'ES'
  | 'RO'
  | 'LV'
  | 'PT'
  | 'SK'
  | 'ET'
  | 'NO'
  | 'DA'
  | 'HU'
  | 'LT'
  | 'SV';
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'developer'
  | 'content_manager'
  | 'editor'
  | 'dealer'
  | 'pro_dealer'
  | 'individual_seller'
  | 'member';

export interface Seller {
  id: string;
  uid?: string;
  name: string;
  type: 'Dealer' | 'Private';
  role?: UserRole;
  storefrontSlug?: string;
  canonicalPath?: string;
  businessName?: string;
  location: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  county?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  coverPhotoUrl?: string;
  storefrontName?: string;
  storefrontTagline?: string;
  storefrontDescription?: string;
  serviceAreaScopes?: string[];
  serviceAreaStates?: string[];
  serviceAreaCounties?: string[];
  servicesOfferedCategories?: string[];
  servicesOfferedSubcategories?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  rating: number;
  totalListings: number;
  memberSince: string;
  verified: boolean;
  manuallyVerified?: boolean;
  twilioPhoneNumber?: string;
}

export interface ListingSpecs {
  // ── Core / common ──────────────────────────────────────────
  hours?: number;
  engine?: string;
  horsepower?: number;
  weight?: number;
  transmission?: string;
  driveType?: string;
  tireSize?: string;
  cabType?: string;
  attachments?: string[];
  // ── Skidder ────────────────────────────────────────────────
  grappleType?: string;
  grappleOpeningIn?: number;
  archHeight?: number;
  winchCapacityLbs?: number;
  frameArticulation?: boolean;
  // ── Feller Buncher / Harvester (shared head fields) ────────
  headType?: string;
  headMake?: string;
  headModel?: string;
  headSerialNumber?: string;
  maxFellingDiameterIn?: number;
  sawDiameterIn?: number;
  accumulating?: boolean;
  // ── Harvester ──────────────────────────────────────────────
  maxFeedSpeedFtPerSec?: number;
  delimbbingKnifeCount?: number;
  barLengthIn?: number;
  sawChain?: string;
  tiltingCab?: boolean;
  // ── Forwarder ──────────────────────────────────────────────
  loadCapacityLbs?: number;
  maxBoomReachFt?: number;
  bunkWidthIn?: number;
  bunkHeightIn?: number;
  axleCount?: number;
  boomMake?: string;
  // ── Log Loader ─────────────────────────────────────────────
  loaderType?: string;
  carrierType?: string;
  maxLiftCapacityLbs?: number;
  swingDegrees?: number;
  reachFt?: number;
  // ── Firewood Processor ─────────────────────────────────────
  engineType?: string;
  maxLogDiameterIn?: number;
  maxLogLengthIn?: number;
  minLogLengthIn?: number;
  splittingForceTons?: number;
  wedgePattern?: string;
  cycleTimeSec?: number;
  sawBladeSizeIn?: number;
  conveyorLengthFt?: number;
  infeedType?: string;
  conveyorType?: string;
  selfPropelled?: boolean;
  bulkBagSystem?: boolean;
  productionRateCordsPerHr?: number;
  // ── Catch-all for any additional fields ────────────────────
  [key: string]: any;
}

export interface ListingConditionChecklist {
  // ── Core condition notes shown in the listing form ──────────────────
  engineChecked?: boolean;
  undercarriageChecked?: boolean;
  hydraulicsLeakStatus?: 'yes' | 'no' | '';
  // ── Records & manuals ───────────────────────────────────────────────
  serviceRecordsAvailable?: boolean;
  partsManualAvailable?: boolean;
  serviceManualAvailable?: boolean;
  // ── Legacy keys preserved for older listing documents ───────────────
  hydraulicsChecked?: boolean;
  leaksChecked?: boolean;
  // ── Skidder-specific ────────────────────────────────────────────────
  grappleChecked?: boolean;
  tiresChecked?: boolean;
  // ── Feller Buncher / Harvester-specific ─────────────────────────────
  headChecked?: boolean;
  // ── Forwarder-specific ──────────────────────────────────────────────
  bunkChecked?: boolean;
  // ── Log Loader-specific ─────────────────────────────────────────────
  boomChecked?: boolean;
  // ── Firewood Processor-specific ─────────────────────────────────────
  sawChecked?: boolean;
  conveyorChecked?: boolean;
  splitterChecked?: boolean;
}

export interface Listing {
  id: string;
  sellerUid?: string;
  title: string;
  category: string;
  subcategory?: string;
  make?: string;
  brand?: string;
  model: string;
  year: number;
  price: number;
  currency: Currency;
  hours: number;
  condition: string;
  description: string;
  images: string[];
  imageTitles?: string[];
  imageVariants?: Array<{
    thumbnailUrl: string;
    detailUrl: string;
    format?: 'image/avif' | 'image/webp' | 'image/jpeg';
  }>;
  location: string;
  city?: string;
  state?: string;
  sellerName?: string;
  sellerPhone?: string;
  stockNumber?: string;
  serialNumber?: string;
  latitude?: number;
  longitude?: number;
  features?: string[];
  videoUrls?: string[];
  conditionChecklist?: ListingConditionChecklist;
  sellerVerified?: boolean;
  qualityValidated?: boolean;
  status?: 'active' | 'sold' | 'pending' | 'expired' | 'archived';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  subscriptionPlanId?: string;
  subscriptionAmount?: number;
  publishedAt?: string;
  expiresAt?: string;
  soldAt?: string;
  archivedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  lastLifecycleAction?: ListingLifecycleAction;
  lastLifecycleAt?: string;
  marketValueEstimate: number | null;
  featured: boolean;
  views: number;
  leads: number;
  createdAt: string;
  updatedAt?: string;
  specs: ListingSpecs;
  externalSource?: {
    sourceName?: string;
    externalId?: string;
    importedAt?: string | { seconds?: number; nanoseconds?: number } | { toDate?: () => Date };
  };
  // Legacy fields for compatibility if needed
  manufacturer?: string;
  sellerId?: string;
  // Auction fields (set when listing is assigned to an auction lot)
  auctionId?: string;
  auctionSlug?: string;
  auctionStatus?: AuctionLotStatus;
  auctionEndTime?: string;
  currentBid?: number;
  bidCount?: number;
  lotNumber?: string;
}

export interface ListingFilters {
  q?: string;
  featured?: boolean;
  inStockOnly?: boolean;
  category?: string;
  subcategory?: string;
  manufacturer?: string;
  state?: string;
  country?: string;
  sellerUid?: string;
  model?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  minYear?: number | string;
  maxYear?: number | string;
  minHours?: number | string;
  maxHours?: number | string;
  condition?: string;
  location?: string;
  locationRadius?: number | string;
  locationCenterLat?: number | string;
  locationCenterLng?: number | string;
  attachment?: string;
  feature?: string;
  stockNumber?: string;
  serialNumber?: string;
  includeUnapproved?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'relevance' | 'popular';
}

export interface AlertPreferences {
  newListingAlerts: boolean;
  priceDropAlerts: boolean;
  soldStatusAlerts: boolean;
  restockSimilarAlerts: boolean;
}

export interface SavedSearch {
  id: string;
  userUid: string;
  name: string;
  filters: Record<string, string>;
  alertEmail: string;
  alertPreferences: AlertPreferences;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt?: string;
}

export interface NewsPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  seoSlug?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Inquiry {
  id: string;
  listingId?: string;
  sellerUid?: string;
  sellerId?: string;
  buyerUid?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
  type: 'Inquiry' | 'Financing' | 'Shipping' | 'Call';
  status: 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost' | 'Closed';
  assignedToUid?: string | null;
  assignedToName?: string | null;
  internalNotes?: Array<{
    id: string;
    text: string;
    authorUid?: string;
    authorName?: string;
    createdAt: string;
  }>;
  firstResponseAt?: string;
  spamScore?: number;
  spamFlags?: string[];
  contactConsentAccepted?: boolean;
  contactConsentVersion?: string;
  contactConsentScope?: string;
  contactConsentAt?: string;
  updatedAt?: string;
  duration?: number; // For calls
  recordingUrl?: string; // For calls
  createdAt: string;
}

export interface FinancingRequest {
  id: string;
  listingId?: string;
  sellerUid?: string;
  buyerUid?: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  company?: string;
  requestedAmount?: number;
  message?: string;
  contactConsentAccepted?: boolean;
  contactConsentVersion?: string;
  contactConsentScope?: string;
  contactConsentAt?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost' | 'Closed';
  createdAt: string;
  updatedAt?: string;
}

export interface CallLog {
  id: string;
  listingId: string;
  listingTitle?: string;
  sellerId: string;
  sellerUid?: string;
  sellerName?: string;
  sellerPhone?: string;
  callerUid?: string | null;
  callerName: string;
  callerEmail?: string;
  callerPhone: string;
  duration: number; // in seconds
  status: 'Initiated' | 'Completed' | 'Missed' | 'Voicemail';
  source?: 'listing_detail' | 'listing_detail_twilio' | 'twilio_inbound' | 'seller_profile' | 'listing_card' | 'unknown';
  isAuthenticated?: boolean;
  recordingUrl?: string;
  twilioCallSid?: string;
  twilioFromNumber?: string;
  twilioToNumber?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  company: string;
  role: UserRole;
  status: 'Active' | 'Suspended' | 'Pending';
  accountStatus?: 'active' | 'pending' | 'suspended';
  authDisabled?: boolean;
  emailVerified?: boolean;
  lastLogin: string;
  lastActive?: string;
  memberSince: string;
  createdAt?: string;
  updatedAt?: string;
  totalListings: number;
  totalLeads: number;
  storefrontViews?: number;
  parentAccountUid?: string;
  accountAccessSource?: 'free_member' | 'pending_checkout' | 'subscription' | 'admin_override' | 'managed_account' | null;
  activeSubscriptionPlanId?: 'individual_seller' | 'dealer' | 'fleet_dealer' | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'pending' | null;
  listingCap?: number | null;
  managedAccountCap?: number | null;
  currentSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  subscriptionStartDate?: string | null;
  entitlement?: AccountEntitlement | null;
  manuallyVerified?: boolean;
}

export type ListingLifecycleAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'payment_confirmed'
  | 'publish'
  | 'expire'
  | 'relist'
  | 'mark_sold'
  | 'archive';

export interface ListingLifecycleStateSnapshot {
  lifecycleState?: string;
  reviewState?: string;
  paymentState?: string;
  inventoryState?: string;
  visibilityState?: string;
  isPublic?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  soldAt?: string | null;
  rawStatus?: string;
  rawApprovalStatus?: string;
  rawPaymentStatus?: string;
}

export interface ListingLifecycleAuditReport {
  listingId: string;
  status: string;
  summary: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  actorUid?: string;
  anomalyCodes: string[];
  anomalyCount?: number;
  shadowState?: ListingLifecycleStateSnapshot | null;
  rawState?: Record<string, unknown> | null;
  governanceSnapshot?: Record<string, unknown> | null;
}

export interface ListingMediaAuditRecord {
  listingId: string;
  status: string;
  summary: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  imageCount?: number;
  primaryImagePresent?: boolean;
  validationErrors: string[];
}

export interface ListingLifecycleTransitionRecord {
  id: string;
  listingId: string;
  transitionType: string;
  actorUid?: string;
  createdAt?: string | null;
  artifactSource?: string;
  anomalyCodes: string[];
  fromState?: ListingLifecycleStateSnapshot | null;
  toState?: ListingLifecycleStateSnapshot | null;
}

export interface ListingLifecycleAuditView {
  listingId: string;
  listing?: Partial<Listing> & { id: string };
  report: ListingLifecycleAuditReport | null;
  mediaAudit: ListingMediaAuditRecord | null;
  transitions: ListingLifecycleTransitionRecord[];
}

export type AuctionStatus = 'draft' | 'preview' | 'active' | 'closed' | 'settling' | 'settled' | 'cancelled';
export type AuctionLotStatus = 'upcoming' | 'preview' | 'active' | 'extended' | 'closed' | 'sold' | 'unsold' | 'cancelled';
export type BidType = 'manual' | 'proxy' | 'auto_increment';
export type BidStatus = 'active' | 'outbid' | 'retracted' | 'winning';
export type BidderTier = 'basic' | 'verified' | 'approved';

export interface Auction {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  startTime: string;
  endTime: string;
  previewStartTime: string;
  status: AuctionStatus;
  lotCount: number;
  totalBids: number;
  totalGMV: number;
  defaultBuyerPremiumPercent: number;
  termsAndConditionsUrl: string;
  featured: boolean;
  bannerEnabled: boolean;
  bannerImageUrl: string;
  softCloseThresholdMin: number;
  softCloseExtensionMin: number;
  staggerIntervalMin: number;
  defaultPaymentDeadlineDays: number;
  defaultRemovalDeadlineDays: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Legacy compat
  date?: string;
  location?: string;
  type?: 'Live' | 'Online' | 'Timed';
  itemCount?: number;
  image?: string;
}

export interface AuctionLot {
  id: string;
  auctionId: string;
  listingId: string;
  lotNumber: string;
  closeOrder: number;
  startingBid: number;
  reservePrice: number | null;
  reserveMet: boolean;
  hasReserve?: boolean;
  buyerPremiumPercent: number;
  startTime: string;
  endTime: string;
  originalEndTime: string;
  softCloseThresholdMin: number;
  softCloseExtensionMin: number;
  softCloseGroupId: string | null;
  extensionCount: number;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderAnonymousId: string;
  bidCount: number;
  uniqueBidders: number;
  lastBidTime: string | null;
  status: AuctionLotStatus;
  promoted: boolean;
  promotedOrder: number;
  winningBidderId: string | null;
  winningBid: number | null;
  watcherIds: string[];
  watcherCount: number;
  // Denormalized from listing for fast reads
  title: string;
  manufacturer: string;
  model: string;
  year: number;
  thumbnailUrl: string;
  pickupLocation: string;
  paymentDeadlineDays: number;
  removalDeadlineDays: number;
  storageFeePerDay: number;
  isTitledItem?: boolean;
  titleDocumentFee?: number;
  releasedAt?: string | null;
  releasedBy?: string | null;
  releaseAuthorizedAt?: string | null;
  releaseAuthorizedBy?: string | null;
}

export interface AuctionBid {
  id: string;
  lotId: string;
  auctionId: string;
  bidderId: string;
  bidderAnonymousId: string;
  amount: number;
  maxBid: number | null;
  type: BidType;
  status: BidStatus;
  timestamp: string;
  triggeredExtension: boolean;
}

export interface BidderProfile {
  verificationTier: BidderTier;
  fullName: string;
  email?: string;
  phone: string;
  phoneVerified: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  companyName: string | null;
  stripeCustomerId: string;
  stripeIdentityVerificationSessionId?: string | null;
  stripeIdentityVerificationUrl?: string | null;
  stripeIdentityLastError?: string | null;
  stripeSetupSessionId?: string | null;
  stripeSetupSessionStatus?: 'pending' | 'completed' | 'expired' | 'cancelled' | null;
  stripeSetupIntentId?: string | null;
  defaultPaymentMethodId?: string | null;
  defaultPaymentMethodBrand?: string | null;
  defaultPaymentMethodLast4?: string | null;
  defaultPaymentMethodFunding?: 'credit' | 'debit' | 'prepaid' | 'unknown' | null;
  preAuthPaymentIntentId: string | null;
  preAuthAmount: number;
  preAuthStatus: 'pending' | 'held' | 'captured' | 'released';
  idVerificationStatus: 'not_started' | 'pending' | 'verified' | 'failed';
  idVerifiedAt: string | null;
  bidderApprovedAt?: string | null;
  bidderApprovedBy?: string | null;
  lastAuctionRegistrationAt?: string | null;
  legalAcceptedAuctionSlug?: string | null;
  legalAcceptedAuctionId?: string | null;
  totalAuctionsParticipated: number;
  totalItemsWon: number;
  totalSpent: number;
  nonPaymentCount: number;
  taxExempt?: boolean;
  taxExemptState?: string;
  taxExemptCertificateUrl?: string;
  taxExemptCertificateUploadedAt?: string;
  termsAcceptedAt: string;
  termsVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionInvoice {
  id: string;
  auctionId: string;
  lotId: string;
  buyerId: string;
  sellerId: string;
  winningBid: number;
  buyerPremium: number;
  documentationFee: number;
  cardProcessingFee?: number;
  isTitledItem?: boolean;
  salesTax: number;
  salesTaxRate: number;
  salesTaxState?: string;
  taxExempt: boolean;
  taxExemptCertificateId?: string;
  totalDue: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  paymentMethod: 'wire' | 'ach' | 'card' | 'financing' | null;
  paymentMethodFunding?: 'credit' | 'debit' | 'prepaid' | 'unknown' | null;
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  paymentTermsVersion?: string | null;
  paidAt: string | null;
  wireReceivedAt?: string | null;
  wireReceivedBy?: string | null;
  releaseAuthorizedAt?: string | null;
  releaseAuthorizedBy?: string | null;
  dueDate: string;
  sellerCommission: number;
  sellerPayout: number;
  sellerPayoutTransferId?: string;
  sellerPaidAt: string | null;
  removalConfirmedAt?: string;
  storageFeesAccrued?: number;
  createdAt: string;
  updatedAt: string;
}

// State sales tax rates for marketplace facilitator compliance (MN, WI, MI)
export const STATE_SALES_TAX_RATES: Record<string, { rate: number; name: string; notes: string }> = {
  MN: { rate: 0.06875, name: 'Minnesota', notes: 'Marketplace facilitator: collect on all taxable sales. Heavy equipment >$1K always taxable. Farm equipment at farm auctions may be exempt.' },
  WI: { rate: 0.05, name: 'Wisconsin', notes: 'Marketplace facilitator: $100K threshold. County surtax 0.1-0.6% may apply. Farm machinery exempt if used in farming.' },
  MI: { rate: 0.06, name: 'Michigan', notes: 'Marketplace facilitator: $100K or 200 transactions. Industrial processing equipment may qualify for exemption.' },
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailNotificationsEnabled?: boolean;
  preferredLanguage?: Language;
  preferredCurrency?: Currency;
  photoURL?: string;
  coverPhotoUrl?: string;
  phoneNumber?: string;
  company?: string;
  website?: string;
  about?: string;
  bio?: string;
  location?: string;
  storefrontLogoUrl?: string;
  businessName?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  county?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  storefrontEnabled?: boolean;
  storefrontSlug?: string;
  storefrontName?: string;
  storefrontTagline?: string;
  storefrontDescription?: string;
  serviceAreaScopes?: string[];
  serviceAreaStates?: string[];
  serviceAreaCounties?: string[];
  servicesOfferedCategories?: string[];
  servicesOfferedSubcategories?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  parentAccountUid?: string;
  accountStatus?: 'active' | 'pending' | 'suspended';
  accountAccessSource?: 'free_member' | 'pending_checkout' | 'subscription' | 'admin_override' | 'managed_account' | null;
  onboardingIntent?: 'free_member' | 'individual_seller' | 'dealer' | 'fleet_dealer';
  activeSubscriptionPlanId?: 'individual_seller' | 'dealer' | 'fleet_dealer' | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'pending' | null;
  listingCap?: number | null;
  managedAccountCap?: number | null;
  currentSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  subscriptionStartDate?: string | null;
  entitlement?: AccountEntitlement | null;
  stripeCustomerId?: string;
  mfaEnabled?: boolean;
  mfaMethod?: 'sms' | null;
  mfaPhoneNumber?: string | null;
  mfaDisplayName?: string | null;
  mfaEnrolledAt?: string | null;
  favorites?: string[];
  emailVerified: boolean;
  createdAt: string;
}

export interface AccountEntitlement {
  subscriptionState: 'active' | 'canceled' | 'past_due' | 'trialing' | 'pending' | 'none';
  effectiveSellerCapability: 'none' | 'owner_operator' | 'dealer' | 'pro_dealer';
  sellerAccessMode: 'none' | 'subscription' | 'admin_override';
  sellerWorkspaceAccess: boolean;
  adminWorkspaceAccess: boolean;
  canPostListings: boolean;
  dealerOsAccess: boolean;
  publicListingVisibility: 'publicly_eligible' | 'hidden_due_to_billing' | 'admin_override' | 'not_applicable';
  visibilityReason: 'active_subscription' | 'inactive_subscription' | 'admin_override' | 'non_seller_role' | 'suspended_account';
  billingLabel: string;
  overrideSource?: 'admin_override' | null;
}

export interface ManagedAccountSeatContext {
  ownerUid?: string;
  seatLimit: number;
  seatCount: number;
  activePlanIds: string[];
}

export interface AccountBootstrapResponse {
  profile?: UserProfile | null;
  source?: string;
  profileDocExists?: boolean;
  firestoreQuotaLimited?: boolean;
  seatContext?: ManagedAccountSeatContext | null;
  seatContextSource?: 'firestore' | 'profile_fallback' | 'not_applicable' | 'unavailable';
  fetchedAt?: string;
}

export interface ManagedSubAccountInput {
  displayName: string;
  email: string;
  role: UserRole;
  company?: string;
  phoneNumber?: string;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'quote' | 'callout' | 'html';
  content: string;
  caption?: string;
  title?: string;
  label?: string;
  order: number;
}

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
  altText?: string;
  tags: string[];
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  authorUid: string;
  authorName: string;
  category: string;
  tags?: string[];
  image?: string;
  status: 'draft' | 'published';
  reviewStatus?: 'draft' | 'in_review' | 'scheduled' | 'published';
  scheduledAt?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  seoSlug?: string;
  blocks?: ContentBlock[];
  revisions?: Array<{
    id: string;
    title: string;
    content: string;
    authorUid: string;
    authorName: string;
    savedAt: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string;
  timestamp: string;
}

export interface MediaMetadata {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: 'product' | 'brand' | 'user' | 'listing' | 'other';
  listingId?: string;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  usageCount: number;
  isPublic: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnail?: string;
    [key: string]: any;
  };
}

export interface UserStorageUsage {
  userId: string;
  totalUsageBytes: number;
  quotaBytes: number;
  filesCount: number;
  imagesCount: number;
  videosCount: number;
  lastUpdated: string;
}

export interface BrandAsset {
  id: string;
  type: 'logo' | 'favicon' | 'social' | 'banner' | 'hero';
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  tags?: string[];
}

export type DealerWidgetCardStyle = 'fes-native' | 'grid' | 'list' | 'compact';

export interface DealerWidgetConfig {
  cardStyle: DealerWidgetCardStyle;
  accentColor: string;
  fontFamily: string;
  darkMode: boolean;
  showInquiry: boolean;
  showCall: boolean;
  showDetails: boolean;
  pageSize: number;
  customCss?: string;
  updatedAt?: string;
}

export interface WebhookSubscription {
  id: string;
  dealerUid: string;
  callbackUrl: string;
  secret?: string;
  events: ('listing.created' | 'listing.updated' | 'listing.sold' | 'listing.deleted')[];
  active: boolean;
  createdAt: string;
  lastDeliveryAt?: string | null;
  failureCount: number;
}
