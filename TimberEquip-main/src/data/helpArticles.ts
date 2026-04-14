export interface HelpArticle {
  slug: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export const HELP_CATEGORIES = [
  'Getting Started',
  'Buying Equipment',
  'Selling Equipment',
  'Auctions',
  'Billing & Subscriptions',
  'Account Management',
  'Dealer Tools',
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export const helpArticles: readonly HelpArticle[] = [
  // ── Getting Started ──────────────────────────────────────────────
  {
    slug: 'how-to-create-an-account',
    title: 'How to Create an Account',
    category: 'Getting Started',
    content:
      'Click Sign Up and register with your email or Google account. ' +
      'Once registered you can browse listings as a member, save bookmarks, set up search alerts, and contact sellers. ' +
      'If you plan to sell equipment, choose a seller plan from the Ad Programs page after signing up. ' +
      'Your account dashboard gives you access to your listings, inquiries, bookmarks, and profile settings.',
    tags: ['account', 'sign up', 'register', 'new user', 'getting started'],
  },
  {
    slug: 'how-to-search-for-equipment',
    title: 'How to Search for Equipment',
    category: 'Getting Started',
    content:
      'Use the Browse Inventory page to filter by category, manufacturer, model, year, hours, price, and location. ' +
      'You can save searches and set up alerts to be notified when matching equipment is listed. ' +
      'Results can be sorted by newest, price, or hours. ' +
      'Use the Compare feature to evaluate multiple listings side by side.',
    tags: ['search', 'browse', 'filter', 'inventory', 'find equipment'],
  },
  {
    slug: 'understanding-approximate-market-value',
    title: 'What Is Approximate Market Value (AMV)?',
    category: 'Getting Started',
    content:
      'AMV is a real-time estimate of equipment value based on comparable listings with similar year, hours, and price. ' +
      'It helps buyers and sellers understand fair market pricing. ' +
      'AMV requires at least two comparable listings to calculate. ' +
      'You will see the AMV badge on listing cards and detail pages when enough data is available.',
    tags: ['amv', 'market value', 'pricing', 'valuation', 'appraisal'],
  },
  {
    slug: 'comparing-equipment-side-by-side',
    title: 'How to Compare Equipment Side by Side',
    category: 'Getting Started',
    content:
      'Add listings to your compare list from search results by clicking the compare icon, then open the Compare page to view them side by side. ' +
      'The comparison table shows specs, pricing, condition, and photos for each unit so you can make an informed decision.',
    tags: ['compare', 'side by side', 'evaluate', 'specs'],
  },

  // ── Buying Equipment ─────────────────────────────────────────────
  {
    slug: 'contacting-a-seller',
    title: 'How to Contact a Seller',
    category: 'Buying Equipment',
    content:
      'Click "Send Inquiry" on any listing to message the seller directly. ' +
      'You can also call the phone number shown on the listing or request financing and logistics quotes from the listing page. ' +
      'Sellers are notified by email when they receive an inquiry.',
    tags: ['contact', 'inquiry', 'message', 'seller', 'phone', 'email'],
  },
  {
    slug: 'financing-options',
    title: 'Financing Options for Equipment Purchases',
    category: 'Buying Equipment',
    content:
      'We work with financing partners who specialize in forestry and heavy equipment. ' +
      'Start on the Financing page or click the Financing button on any listing to submit an application. ' +
      'Common terms range from 36 to 84 months depending on lender, equipment value, and buyer qualifications. ' +
      'Use the payment calculator on any listing to estimate monthly payments.',
    tags: ['financing', 'loans', 'payments', 'credit', 'calculator'],
  },
  {
    slug: 'transport-and-logistics',
    title: 'Transport and Logistics Quotes',
    category: 'Buying Equipment',
    content:
      'Use the logistics request form on any listing to tell us what needs to move and where. ' +
      'Our team can help coordinate domestic and international transport options and provide quotes. ' +
      'Contact our logistics team for specific requirements and pricing.',
    tags: ['transport', 'shipping', 'logistics', 'delivery', 'freight'],
  },

  // ── Selling Equipment ────────────────────────────────────────────
  {
    slug: 'how-to-list-equipment-for-sale',
    title: 'How to List Equipment for Sale',
    category: 'Selling Equipment',
    content:
      'Create an account and choose List Equipment from your dashboard. ' +
      'Add clear photos, a detailed description, and your contact information. ' +
      'Listings are active for 30 days and can be renewed, edited, or removed any time from your account dashboard. ' +
      'High-quality photos and accurate descriptions lead to faster sales.',
    tags: ['list', 'sell', 'create listing', 'post equipment'],
  },
  {
    slug: 'photos-and-watermarks',
    title: 'How Photos and Watermarks Work',
    category: 'Selling Equipment',
    content:
      'Upload high-quality photos of your equipment when creating or editing a listing. ' +
      'Images are automatically processed into optimized formats for fast loading. ' +
      'A subtle watermark is applied to protect your images from unauthorized use on other platforms.',
    tags: ['photos', 'images', 'watermark', 'upload', 'pictures'],
  },
  {
    slug: 'after-your-item-sells',
    title: 'What to Do After Your Item Sells',
    category: 'Selling Equipment',
    content:
      'Log in and update the listing status to sold or remove the machine so buyers see accurate inventory. ' +
      'Keeping listings up to date maintains trust with buyers and helps your future listings rank higher. ' +
      'If you need help, the support team can assist.',
    tags: ['sold', 'remove listing', 'update status', 'after sale'],
  },

  // ── Auctions ─────────────────────────────────────────────────────
  {
    slug: 'how-auctions-work',
    title: 'How Auctions Work',
    category: 'Auctions',
    content:
      'Auctions allow buyers to bid on equipment in timed online events. ' +
      'Each auction has a start date, end date, and individual lots with their own bidding windows. ' +
      'Bids are placed in real time and the highest bidder at close wins the lot. ' +
      'You can browse upcoming and active auctions on the Auctions page.',
    tags: ['auction', 'bidding', 'lots', 'timed auction', 'online auction'],
  },
  {
    slug: 'bidder-registration-and-pre-auth',
    title: 'Bidder Registration and Pre-Authorization',
    category: 'Auctions',
    content:
      'Before placing bids you must complete bidder registration for the auction. ' +
      'Registration may include identity verification and a credit-card pre-authorization hold to confirm you can cover your bids. ' +
      'The pre-auth hold is released after the auction closes if you do not win. ' +
      'You will receive a confirmation email once your registration is approved.',
    tags: ['bidder', 'registration', 'pre-auth', 'identity', 'verification', 'credit card'],
  },
  {
    slug: 'auction-identity-verification',
    title: 'Auction Identity Verification',
    category: 'Auctions',
    content:
      'Some auctions require identity verification to ensure serious bidders and prevent fraud. ' +
      'You may be asked to provide a government-issued ID and confirm your contact information. ' +
      'Verification is handled securely and your documents are not shared with sellers.',
    tags: ['identity', 'verification', 'id', 'fraud prevention', 'kyc'],
  },

  // ── Billing & Subscriptions ──────────────────────────────────────
  {
    slug: 'subscription-plans-and-pricing',
    title: 'Subscription Plans and Pricing',
    category: 'Billing & Subscriptions',
    content:
      'We offer Owner-Operator, Dealer, and Pro Dealer plans. ' +
      'Each tier includes different listing caps, featured listing slots, and storefront features. ' +
      'Owner-Operator accounts get 1 featured slot, Dealers get 3, and Pro Dealers get 6. ' +
      'Visit the Ad Programs page for full plan details and current pricing.',
    tags: ['subscription', 'plans', 'pricing', 'tiers', 'owner-operator', 'dealer', 'pro dealer'],
  },
  {
    slug: 'featured-listings-explained',
    title: 'What Are Featured Listings?',
    category: 'Billing & Subscriptions',
    content:
      'Featured listings appear at the top of search results and on the home page, giving your equipment maximum visibility. ' +
      'The number of featured slots depends on your plan: Owner-Operator gets 1, Dealer gets 3, Pro Dealer gets 6. ' +
      'You can toggle featured status on and off from your account dashboard.',
    tags: ['featured', 'promoted', 'top listing', 'visibility', 'boost'],
  },
  {
    slug: 'cancel-or-change-subscription',
    title: 'How to Cancel or Change Your Subscription',
    category: 'Billing & Subscriptions',
    content:
      'Manage your subscription from your account profile page. ' +
      'You can upgrade, downgrade, or cancel at any time. ' +
      'If you downgrade, your current plan features remain active until the end of the billing cycle. ' +
      'Contact support if you need assistance with billing changes.',
    tags: ['cancel', 'downgrade', 'upgrade', 'change plan', 'billing'],
  },
  {
    slug: 'payment-and-billing-faq',
    title: 'Payment and Billing FAQ',
    category: 'Billing & Subscriptions',
    content:
      'Subscriptions are billed monthly via credit card. You will receive an email receipt for each payment. ' +
      'If a payment fails, your account enters a grace period and you will be notified to update your card. ' +
      'Refunds are handled on a case-by-case basis — contact support for billing disputes.',
    tags: ['payment', 'billing', 'invoice', 'receipt', 'refund', 'credit card'],
  },

  // ── Account Management ───────────────────────────────────────────
  {
    slug: 'account-security-and-2fa',
    title: 'Account Security and Two-Factor Authentication',
    category: 'Account Management',
    content:
      'We use Firebase Authentication with TLS encryption and reCAPTCHA Enterprise for bot protection. ' +
      'Enable two-factor authentication (2FA) from your profile settings for an extra layer of security. ' +
      'Always use a strong, unique password and never share your login credentials.',
    tags: ['security', '2fa', 'two-factor', 'password', 'authentication', 'protection'],
  },
  {
    slug: 'managing-team-members',
    title: 'Managed Roles and Team Members',
    category: 'Account Management',
    content:
      'Dealer and Pro Dealer accounts can invite team members with managed roles. ' +
      'Each team member gets their own login and can manage listings, respond to inquiries, and access the dealer dashboard. ' +
      'Account owners control which permissions each role has. ' +
      'Manage your team from the account settings page.',
    tags: ['team', 'roles', 'managed', 'permissions', 'invite', 'members', 'staff'],
  },
  {
    slug: 'how-to-contact-support',
    title: 'How to Contact Support',
    category: 'Account Management',
    content:
      'Use the Contact page to send a message, call (218) 720-0933 Monday through Friday 8am-5pm CST, ' +
      'or email support@forestryequipmentsales.com (available 8am-10pm CST). ' +
      'For listing issues, include your listing ID so we can help faster.',
    tags: ['support', 'contact', 'help', 'phone', 'email', 'customer service'],
  },

  // ── Dealer Tools ─────────────────────────────────────────────────
  {
    slug: 'managing-your-storefront',
    title: 'Managing Your Dealer Storefront',
    category: 'Dealer Tools',
    content:
      'Dealer and Pro Dealer accounts get a dedicated storefront page showcasing all their listings, company information, and branding. ' +
      'Storefronts are discoverable in the dealer network and linked from every one of your listings. ' +
      'Customize your storefront with your logo, description, and contact details from the dealer dashboard.',
    tags: ['storefront', 'dealer page', 'branding', 'dealer profile', 'customize'],
  },
  {
    slug: 'bulk-inventory-upload',
    title: 'Bulk Inventory Upload for Dealers',
    category: 'Dealer Tools',
    content:
      'Dealer and Pro Dealer accounts include inventory tools built for larger seller catalogs. ' +
      'You can upload multiple listings at once using the bulk import feature in the dealer dashboard. ' +
      'Contact support if you want help getting your storefront and inventory set up.',
    tags: ['bulk upload', 'import', 'inventory', 'catalog', 'csv'],
  },
  {
    slug: 'becoming-a-verified-dealer',
    title: 'How to Become a Verified Dealer',
    category: 'Dealer Tools',
    content:
      'Dealer verification is based on your account role and subscription. ' +
      'Dealers and Pro Dealers are automatically verified and receive a verification badge on their profile and listings. ' +
      'Individual sellers can be manually verified by the admin team upon request.',
    tags: ['verified', 'verification', 'badge', 'trust', 'dealer status'],
  },
] as const;
