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
  | 'member'
  | 'buyer';

export interface Seller {
  id: string;
  uid?: string;
  name: string;
  type: 'Dealer' | 'Private';
  role?: UserRole;
  storefrontSlug?: string;
  location: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  coverPhotoUrl?: string;
  storefrontName?: string;
  storefrontTagline?: string;
  storefrontDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  rating: number;
  totalListings: number;
  memberSince: string;
  verified: boolean;
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
  imageVariants?: Array<{
    thumbnailUrl: string;
    detailUrl: string;
    format?: 'image/avif' | 'image/webp' | 'image/jpeg';
  }>;
  location: string;
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
  responseTimeMinutes?: number | null;
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

export type InspectionRequestStatus = 'New' | 'Quoted' | 'Accepted' | 'Declined' | 'Completed';

export interface InspectionRequest {
  id: string;
  listingId?: string;
  listingTitle?: string;
  listingUrl?: string;
  reference?: string;
  requesterUid?: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  requesterCompany?: string;
  equipment: string;
  inspectionLocation: string;
  timeline?: string;
  notes?: string;
  matchedDealerUid?: string | null;
  matchedDealerName?: string;
  matchedDealerLocation?: string;
  matchedDealerDistanceMiles?: number | null;
  assignedToUid?: string | null;
  assignedToName?: string | null;
  quotedPrice?: number | null;
  status: InspectionRequestStatus;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  respondedAt?: string | null;
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
  source?: 'listing_detail' | 'listing_detail_twilio' | 'twilio_inbound' | 'seller_profile' | 'unknown';
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
  parentAccountUid?: string;
  accountAccessSource?: 'free_member' | 'pending_checkout' | 'subscription' | 'admin_override' | 'managed_account' | null;
  activeSubscriptionPlanId?: 'individual_seller' | 'dealer' | 'fleet_dealer' | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'pending' | null;
  listingCap?: number | null;
  managedAccountCap?: number | null;
  currentSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  entitlement?: AccountEntitlement | null;
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

export interface Auction {
  id: string;
  title: string;
  date: string;
  location: string;
  type: 'Live' | 'Online' | 'Timed';
  status: 'Upcoming' | 'Active' | 'Closed';
  itemCount: number;
  image: string;
  featured?: boolean;
}

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
  storefrontEnabled?: boolean;
  storefrontSlug?: string;
  storefrontName?: string;
  storefrontTagline?: string;
  storefrontDescription?: string;
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
  effectiveSellerCapability: 'none' | 'owner_operator' | 'dealer' | 'pro_dealer' | 'admin';
  sellerAccessMode: 'none' | 'subscription' | 'admin_override' | 'admin';
  sellerWorkspaceAccess: boolean;
  canPostListings: boolean;
  dealerOsAccess: boolean;
  publicListingVisibility: 'publicly_eligible' | 'hidden_due_to_billing' | 'admin_override' | 'not_applicable';
  visibilityReason: 'active_subscription' | 'inactive_subscription' | 'admin_override' | 'admin_role' | 'non_seller_role' | 'suspended_account';
  billingLabel: string;
  overrideSource?: 'admin_override' | 'admin_role' | null;
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
