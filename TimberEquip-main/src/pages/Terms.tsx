import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, AlertTriangle, Scale, FileCheck, CheckCircle2, XCircle, Shield, Clock, Users, CreditCard, Ban, FileText, Globe, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export function Terms() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
      <Seo
        title="Terms of Service | Forestry Equipment Sales"
        description="Terms of service governing the use of the Forestry Equipment Sales marketplace, including listing rules, billing, dispute resolution, and governing law."
        canonicalPath="/terms"
      />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-12"
        >
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Legal Policy</span>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              Terms of Service
            </h1>
            <p className="text-muted font-medium uppercase tracking-widest text-xs">
              Last Updated: March 29, 2026 | Version 3.1.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Gavel className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Binding Agreement</h3>
              <p className="text-sm text-muted leading-relaxed">
                By accessing the Forestry Equipment Sales network, you agree to be bound by these terms.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Scale className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Fair Trading</h3>
              <p className="text-sm text-muted leading-relaxed">
                We enforce strict rules for equipment listing accuracy and buyer-seller interactions.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <AlertTriangle className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Liability</h3>
              <p className="text-sm text-muted leading-relaxed">
                Forestry Equipment Sales is a marketplace platform and is not liable for the condition of equipment listed by sellers.
              </p>
            </div>
          </div>

          <div className="space-y-12 text-muted leading-loose font-medium">

            {/* Section 1: Acceptance of Terms */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">1. Acceptance of Terms</h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you and Forestry Equipment Sales, LLC
                ("FES," "we," "us," or "our"), governing your access to and use of the forestryequipmentsales.com website, mobile applications,
                APIs, and all related services (collectively, the "Platform"). By creating an account, accessing, or using any part of the Platform,
                you agree to be bound by these Terms, our <Link to="/privacy" className="text-accent underline">Privacy Policy</Link>,
                our <Link to="/cookies" className="text-accent underline">Cookie Policy</Link>,
                and our <Link to="/dmca" className="text-accent underline">DMCA Policy</Link>, each incorporated herein by reference.
              </p>
              <p>
                If you do not agree to these Terms, you must not access or use the Platform. If you are using the Platform on behalf
                of a business entity, you represent and warrant that you have the authority to bind that entity to these Terms.
              </p>
            </section>

            {/* Section 2: Eligibility & Account Registration */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">2. Eligibility &amp; Account Registration</h2>
              <p>
                To use the Platform, you must be at least 18 years of age (or the age of legal majority in your jurisdiction) and
                capable of forming a binding contract. By creating an account, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All information you provide during registration is accurate, current, and complete</li>
                <li>You will maintain and promptly update your account information to keep it accurate</li>
                <li>You have the legal authority to enter into these Terms and to perform your obligations hereunder</li>
                <li>Your use of the Platform does not violate any applicable law, regulation, or third-party right</li>
                <li>You have not previously been suspended or removed from the Platform</li>
              </ul>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials, including your password and any
                multi-factor authentication methods. You agree to notify us immediately of any unauthorized use of your account.
                You are liable for all activity that occurs under your account, whether or not authorized by you.
              </p>
            </section>

            {/* Section 3: Marketplace Usage */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Marketplace Usage</h2>
              <p>
                The Forestry Equipment Sales network is designed for professional equipment buyers, sellers, dealers,
                and service partners operating in a global marketplace. Users must provide accurate information,
                maintain professional conduct, and use the platform only for lawful commercial purposes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle2 className="text-data flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Allowed Actions</span>
                    <ul className="text-[10px] uppercase space-y-1">
                      <li>Listing verified logging and forestry equipment for sale.</li>
                      <li>Inquiring about available assets and contacting sellers.</li>
                      <li>Applying for institutional financing through approved partners.</li>
                      <li>Operating an approved seller subscription or dealer storefront.</li>
                      <li>Requesting equipment inspections through the platform.</li>
                      <li>Saving searches and receiving matching listing alerts.</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <XCircle className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Prohibited Actions</span>
                    <ul className="text-[10px] uppercase space-y-1">
                      <li>Listing fraudulent, stolen, or non-existent equipment.</li>
                      <li>Circumventing the inquiry system to avoid platform fees.</li>
                      <li>Spamming sellers, buyers, or platform administrators.</li>
                      <li>Scraping, crawling, or harvesting data without authorization.</li>
                      <li>Reverse engineering, decompiling, or disassembling platform software.</li>
                      <li>Using the platform in violation of sanctions, export, tax, or consumer protection laws.</li>
                      <li>Impersonating another person, business, or entity.</li>
                      <li>Uploading malicious code, viruses, or harmful content.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Listing Accuracy & Seller Obligations */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. Listing Accuracy &amp; Seller Obligations</h2>
              <p>
                Sellers are responsible for the accuracy, completeness, and legality of their listings.
                All specifications, including hours, year, serial number, and condition, must be verified and truthful.
                Sellers must also have the legal right to sell the equipment and to market the equipment, related media,
                and any branded business assets uploaded to the platform.
              </p>
              <p>
                By publishing a listing, the seller represents and warrants that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The seller has clear title or legal authority to sell the listed equipment</li>
                <li>The equipment description, specifications, hours, and condition are accurate and not misleading</li>
                <li>All photographs and media are original or licensed for use by the seller</li>
                <li>The equipment is not subject to undisclosed liens, encumbrances, or legal disputes</li>
                <li>The listed price reflects a genuine offer and is not intended to deceive or manipulate</li>
              </ul>
              <p>
                Forestry Equipment Sales reserves the right to reject, unpublish, suspend, or permanently remove any listing
                that fails our verification process, violates marketplace policy, or receives a valid complaint. We may also
                require sellers to provide additional documentation (proof of ownership, title, inspection reports) before
                publishing or reinstating a listing.
              </p>
            </section>

            {/* Section 5: Seller Subscriptions, Billing, and Invoices */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">5. Seller Subscriptions, Billing &amp; Invoices</h2>
              <p>
                Paid seller programs, including Owner-Operator, Dealer, and Pro Dealer subscriptions, are billed through our
                secure payment system powered by Stripe. Unless otherwise stated in writing, subscriptions renew automatically
                on a recurring monthly basis until canceled.
              </p>

              <div className="space-y-4">
                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Subscription Terms</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Subscriptions begin on the date of initial payment and renew on the same day each month</li>
                    <li>Each subscription tier includes a specific listing capacity (listing cap) as described on the <Link to="/ad-programs" className="text-accent underline">Ad Programs</Link> page</li>
                    <li>Prices are quoted in US Dollars unless otherwise specified</li>
                    <li>All fees are exclusive of applicable taxes, which will be calculated and charged at checkout where required by law</li>
                  </ul>
                </div>

                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Cancellation &amp; Refunds</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>You may cancel your subscription at any time from your <Link to="/profile" className="text-accent underline">Profile</Link> page or through the Stripe Customer Portal</li>
                    <li>Cancellation takes effect at the end of the current billing period — you retain access until then</li>
                    <li>No prorated refunds are issued for partial billing periods unless required by applicable law</li>
                    <li>Upon cancellation, your listings will be hidden from public search results after the billing period ends but are not permanently deleted</li>
                    <li>Refunds for billing errors or disputes may be issued at FES's sole discretion</li>
                  </ul>
                </div>

                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Payment Failure &amp; Account Suspension</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>If a payment fails, we will attempt to collect payment for up to 7 days (dunning period)</li>
                    <li>During the dunning period, your subscription status changes to "past due" and your listings may be hidden</li>
                    <li>Failure to resolve payment within the dunning period will result in subscription cancellation</li>
                    <li>Chargebacks, suspected fraud, or material billing disputes may result in immediate suspension</li>
                    <li>Listings are not necessarily deleted when billing lapses — FES may retain them in a hidden state until the account is restored</li>
                  </ul>
                </div>
              </div>

              <p>
                Invoices, receipts, and subscription records are issued through Stripe and accessible via your account's billing portal.
              </p>
            </section>

            {/* Section 6: Fees, Taxes & Payment Terms */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">6. Fees, Taxes &amp; Payment Terms</h2>
              <p>
                FES charges subscription fees for seller access as described on the <Link to="/ad-programs" className="text-accent underline">Ad Programs</Link> page.
                We reserve the right to change our pricing at any time. If we change pricing for an existing subscription, we will
                provide at least 30 days' written notice before the new price takes effect. You may cancel your subscription before
                the price change takes effect.
              </p>
              <p>
                You are responsible for all applicable taxes, duties, levies, and assessments related to your use of the Platform
                and any equipment transactions facilitated through the Platform. FES does not collect or remit sales tax, use tax,
                VAT, or any other transaction taxes on behalf of buyers or sellers. Each party is responsible for its own tax
                compliance and reporting obligations.
              </p>
            </section>

            {/* Section 7: Dealer Services */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">7. Dealer Services &amp; Seller Operations</h2>
              <p>
                DealerOS, dealer storefronts, managed seats, advertising programs, lead routing, inspection routing, and related
                workflow tools are platform services provided to approved accounts. Access to these services depends on active
                entitlement, compliance with platform rules, and availability of supporting systems.
              </p>
              <p>
                Forestry Equipment Sales may limit, suspend, or modify these services at any time to protect the marketplace,
                comply with law, maintain platform performance, or for any other reasonable business purpose. We will endeavor
                to provide reasonable notice before discontinuing any material service feature, except where immediate action
                is required for security or legal compliance.
              </p>
              <p>
                Managed seats allow dealer accounts to grant sub-accounts access to the dealer's listing inventory and
                storefront. The primary account holder is responsible for all activity performed by managed seat users
                and for ensuring that managed seat users comply with these Terms.
              </p>
              <p>
                Dealer and Pro Dealer accounts may be assigned platform-managed forwarding numbers for call tracking, lead attribution,
                and routing. These numbers may forward to the destination phone number you provide. You are responsible for keeping
                destination numbers accurate, ensuring you have authority to receive forwarded calls on those numbers, and complying with
                all laws that apply to calls, texts, telemarketing, privacy, recording, and call-disclosure requirements in the
                jurisdictions where you operate.
              </p>
              <p>
                FES requires seller-specific or lender-specific contact consent for platform-generated outreach requests and does not
                permit blanket consent language that authorizes unrelated sellers, lenders, or telemarketing campaigns to contact a user.
                Where your use of the Platform involves calls or texts, you are solely responsible for any legally required notices,
                opt-out handling, and consent records tied to that outreach.
              </p>
            </section>

            {/* Section 8: Data, Leads, and Platform Records */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">8. Data, Leads &amp; Platform Records</h2>
              <p>
                By using the platform, you authorize Forestry Equipment Sales to store operational records related to account setup,
                consent, billing status, leads, inspection requests, listing lifecycle actions, fraud prevention, and support activity.
                These records may be used to maintain the platform, investigate abuse, support audits, verify account entitlement,
                and comply with legal obligations.
              </p>
              <p>
                Lead data (inquiries, contact requests, financing applications) generated through the Platform is provided to the
                relevant seller or dealer as part of the subscription service. FES may retain aggregated, anonymized lead data for
                analytics and platform improvement purposes. Individual lead data is subject to our
                {' '}<Link to="/privacy" className="text-accent underline">Privacy Policy</Link>.
              </p>
              <p>
                When call-tracking numbers are enabled, platform records may also include call routing logs, connected or missed call
                status, timestamps, duration, and recording references when recording is enabled. These records are part of the platform's
                operational audit trail and may be used for dealer reporting, fraud review, entitlement support, and dispute resolution.
              </p>
            </section>

            {/* Section 9: Intellectual Property & Content Ownership */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">9. Intellectual Property &amp; Content Ownership</h2>
              <p>
                <strong>Your Content:</strong> Users retain ownership of all content they upload to the Platform, including listing descriptions,
                photographs, videos, and brand assets. By uploading content to Forestry Equipment Sales, you grant
                FES a non-exclusive, worldwide, royalty-free, sublicensable license to display, reproduce, distribute, modify (for formatting and
                optimization, such as image compression and resizing), and promote your content solely in connection with the operation
                and marketing of the marketplace.
              </p>
              <p>
                This license terminates when you remove the content or delete your account, except for:
                (a) content that has been shared with or cached by third parties (e.g., search engine caches);
                (b) anonymized or aggregated data derived from your content; and
                (c) copies retained as part of our standard backup procedures, which will be deleted in accordance with our
                data retention schedule.
              </p>
              <p>
                <strong>Our Content:</strong> The Platform, including its design, code, logos, trademarks, service marks, trade names, and all
                intellectual property therein, is owned by or licensed to Forestry Equipment Sales, LLC. You may not use our
                trademarks, logos, or branding without our prior written consent. Nothing in these Terms grants you any right,
                title, or interest in our intellectual property.
              </p>
              <p>
                You represent and warrant that you have all necessary rights, licenses, and permissions to upload
                content to the platform and that such content does not infringe the intellectual property rights of
                any third party. For copyright infringement claims, see our <Link to="/dmca" className="text-accent underline">DMCA Policy</Link>.
              </p>
            </section>

            {/* Section 10: User-Generated Content */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">10. User-Generated Content &amp; Moderation</h2>
              <p>
                FES does not pre-screen all user-generated content but reserves the right to review, moderate, edit, or remove
                any content at our sole discretion, including content that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violates these Terms, our policies, or applicable law</li>
                <li>Is fraudulent, misleading, or deceptive</li>
                <li>Infringes intellectual property rights of third parties</li>
                <li>Contains offensive, defamatory, or harmful material</li>
                <li>Includes personal contact information intended to circumvent the inquiry system</li>
                <li>Is unrelated to forestry or logging equipment</li>
              </ul>
              <p>
                We are not obligated to monitor all content and are not liable for any user-generated content posted on the Platform.
                If you encounter content that you believe violates these Terms, please report it to legal@timberequip.com.
              </p>
            </section>

            {/* Section 11: Global Compliance */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">11. Global Compliance</h2>
              <p>
                Users are responsible for complying with all laws that apply to their activity, including sanctions, export controls,
                tax obligations, privacy law, consumer protection, and advertising rules in the jurisdictions where they operate.
                Forestry Equipment Sales may refuse service, block transactions, or restrict access where compliance risk exists.
              </p>
              <p>
                Without limiting the foregoing, you agree not to use the Platform to facilitate transactions with individuals
                or entities subject to economic sanctions administered by the U.S. Department of the Treasury's Office of Foreign
                Assets Control (OFAC), the European Union, the United Nations Security Council, or any other applicable sanctions authority.
              </p>
            </section>

            {/* Section 12: Disclaimer of Warranties */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">12. Disclaimer of Warranties</h2>
              <p>
                THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
                IMPLIED, STATUTORY, OR OTHERWISE. TO THE FULLEST EXTENT PERMITTED BY LAW, FES DISCLAIMS ALL WARRANTIES, INCLUDING
                BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                <li>WARRANTIES THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS</li>
                <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY LISTING CONTENT, EQUIPMENT SPECIFICATIONS, OR PRICING INFORMATION</li>
                <li>WARRANTIES REGARDING THE CONDITION, QUALITY, SAFETY, OR LEGALITY OF ANY EQUIPMENT LISTED ON THE PLATFORM</li>
              </ul>
              <p>
                FES is a marketplace that connects buyers and sellers. We do not inspect, verify ownership of, or guarantee the
                condition of any equipment listed on the Platform. All transactions are between the buyer and seller. You assume
                all risk associated with equipment purchases made through the Platform.
              </p>
            </section>

            {/* Section 13: Limitation of Liability */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">13. Limitation of Liability</h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL FES, ITS OFFICERS, DIRECTORS, EMPLOYEES,
                AGENTS, AFFILIATES, OR LICENSORS BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES</li>
                <li>ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES</li>
                <li>ANY DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM</li>
                <li>ANY DAMAGES ARISING FROM UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR CONTENT OR DATA</li>
                <li>ANY DAMAGES ARISING FROM THE CONDUCT OF ANY THIRD PARTY ON THE PLATFORM</li>
              </ul>
              <p>
                IN ANY EVENT, FES'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS
                OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE TOTAL FEES ACTUALLY PAID BY YOU TO FES
                DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED
                US DOLLARS ($100.00).
              </p>
              <p>
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU,
                SOME OR ALL OF THE ABOVE EXCLUSIONS OR LIMITATIONS MAY NOT APPLY, AND YOU MAY HAVE ADDITIONAL RIGHTS.
              </p>
            </section>

            {/* Section 14: Indemnification */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">14. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Forestry Equipment Sales, LLC, its officers,
                directors, employees, agents, and affiliates from and against any and all claims, damages,
                obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees)
                arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use of the Platform or any services obtained through the Platform</li>
                <li>Your violation of these Terms or any applicable law, regulation, or third-party right</li>
                <li>Your violation of any intellectual property, privacy, publicity, or other proprietary right of any third party</li>
                <li>Any content you upload, publish, or transmit through the Platform</li>
                <li>Any equipment transaction you enter into through the Platform</li>
                <li>Any claim that your content caused damage to a third party</li>
                <li>Your negligence or willful misconduct</li>
              </ul>
              <p>
                This indemnification obligation survives the termination of your account and these Terms.
              </p>
            </section>

            {/* Section 15: Termination & Suspension */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">15. Termination &amp; Suspension</h2>
              <p>
                <strong>By You:</strong> You may terminate your account at any time by contacting us or using the account deletion
                feature in your <Link to="/profile" className="text-accent underline">Profile &gt; Privacy &amp; Data</Link> tab.
                Active subscriptions should be canceled before account deletion to avoid further charges.
              </p>
              <p>
                <strong>By FES:</strong> We may suspend or terminate your access to the Platform, in whole or in part, at any time
                and for any reason, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these Terms or any FES policy</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Non-payment or chargeback activity</li>
                <li>Repeated intellectual property infringement (see our <Link to="/dmca" className="text-accent underline">DMCA Policy</Link>)</li>
                <li>Inactivity for more than 12 consecutive months</li>
                <li>Request from law enforcement or government agency</li>
                <li>Discontinuation of the Platform or any part thereof</li>
              </ul>
              <p>
                Upon termination: (a) your right to use the Platform ceases immediately; (b) your listings will be removed from
                public display; (c) any outstanding fees remain due and payable; (d) provisions that by their nature should survive
                termination will survive, including Sections 9, 12, 13, 14, 17, and 18.
              </p>
            </section>

            {/* Section 16: Dispute Resolution */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">16. Dispute Resolution &amp; Liability</h2>
              <p>
                Any disputes between buyers and sellers must be resolved through the parties directly unless otherwise required by law.
                Forestry Equipment Sales provides the platform for communication and billing infrastructure, but does not guarantee
                the outcome of any transaction, inspection, financing outcome, transport result, or equipment condition.
              </p>
              <p>
                <strong>Informal Resolution:</strong> Before initiating formal proceedings, you agree to first contact us at
                legal@timberequip.com and attempt to resolve any dispute informally for at least 30 days.
              </p>
            </section>

            {/* Section 17: Governing Law & Jurisdiction */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">17. Governing Law &amp; Jurisdiction</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Minnesota,
                United States, without regard to its conflict of law provisions.
              </p>
              <p>
                Any dispute arising under or in connection with these Terms that cannot be resolved through good-faith
                negotiation shall be settled by binding arbitration administered by the American Arbitration Association (AAA)
                under its Commercial Arbitration Rules, held in Duluth, Minnesota. Judgment on the arbitration award may be
                entered in any court having jurisdiction. The arbitrator may award any remedy that a court of competent
                jurisdiction could award, including injunctive and declaratory relief.
              </p>
              <p>
                <strong>Class Action Waiver:</strong> You agree that any dispute resolution proceedings will be conducted only on an
                individual basis and not in a class, consolidated, or representative action. If for any reason a claim proceeds
                in court rather than in arbitration, you waive any right to a jury trial.
              </p>
              <p>
                <strong>Exception for Small Claims:</strong> Either party may bring an individual action in small claims court for
                disputes within the court's jurisdictional limits.
              </p>
            </section>

            {/* Section 18: Force Majeure */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">18. Force Majeure</h2>
              <p>
                Forestry Equipment Sales shall not be liable for any failure or delay in performing its obligations
                under these Terms where such failure or delay results from circumstances beyond its reasonable control,
                including but not limited to: acts of God, natural disasters, pandemics, epidemics, war, terrorism, riots,
                embargoes, government actions or orders, power failures, internet or telecommunications outages, cyberattacks,
                failures of third-party service providers (including cloud hosting, payment processors, and email delivery services),
                labor disputes, or supply chain disruptions.
              </p>
              <p>
                During any force majeure event, affected obligations will be suspended for the duration
                of the event, and deadlines will be extended accordingly. If a force majeure event continues for more than
                90 days, either party may terminate the affected services upon written notice.
              </p>
            </section>

            {/* Section 19: Electronic Communications */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">19. Electronic Communications Consent</h2>
              <p>
                By creating an account, you consent to receive electronic communications from FES, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transactional emails related to your account, subscriptions, listings, and inquiries</li>
                <li>Security alerts and billing notifications</li>
                <li>Legal notices, policy updates, and Terms of Service changes</li>
                <li>Optional marketing communications (which you may unsubscribe from at any time)</li>
              </ul>
              <p>
                You agree that all notices, agreements, disclosures, and other communications we provide to you
                electronically satisfy any legal requirement that such communications be in writing.
              </p>
            </section>

            {/* Section 20: Third-Party Links */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">20. Third-Party Links &amp; Services</h2>
              <p>
                The Platform may contain links to third-party websites or services (e.g., Stripe checkout, financing partner portals,
                equipment manufacturer websites, transport providers). These links are provided for convenience only. FES does not
                endorse, control, or assume responsibility for the content, privacy policies, or practices of any third-party
                services. Your interactions with third-party services are governed solely by their terms and policies.
              </p>
            </section>

            {/* Section 21: Modifications to Terms */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">21. Modifications to These Terms</h2>
              <p>
                FES reserves the right to modify these Terms at any time. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Update the "Last Updated" date and version number at the top of this page</li>
                <li>Notify registered users by email at least 30 days before the changes take effect</li>
                <li>Display an in-platform notification for active users</li>
              </ul>
              <p>
                Your continued use of the Platform after the effective date of any modification constitutes your acceptance of the
                modified Terms. If you do not agree to the modified Terms, you must stop using the Platform and close your account.
              </p>
            </section>

            {/* Section 22: General Provisions */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">22. General Provisions</h2>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, Cookie Policy, and DMCA Policy, constitute the entire agreement between you and FES regarding your use of the Platform, and supersede all prior agreements, understandings, and representations.</li>
                <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</li>
                <li><strong>Waiver:</strong> The failure of FES to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. Any waiver must be in writing and signed by an authorized representative of FES.</li>
                <li><strong>Assignment:</strong> You may not assign or transfer these Terms or any rights hereunder without our prior written consent. FES may assign these Terms freely in connection with a merger, acquisition, reorganization, or sale of assets.</li>
                <li><strong>No Agency:</strong> No agency, partnership, joint venture, or employment relationship is created by these Terms, and you have no authority to bind FES in any respect.</li>
                <li><strong>Headings:</strong> Section headings are for convenience only and do not affect the interpretation of these Terms.</li>
                <li><strong>Survival:</strong> Any provisions that by their nature should survive termination will survive, including but not limited to intellectual property provisions, disclaimers, limitations of liability, and indemnification.</li>
              </ul>
            </section>

            {/* Contact Section */}
            <section className="bg-surface border border-line p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">Legal Department</h2>
              <p className="text-muted">
                For legal inquiries, to report a violation of these terms, or to request
                a copy of these Terms in an alternative format, contact our Legal Department:
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight text-ink">
                <span>legal@timberequip.com</span>
                <span>+1 (800) 846-2373</span>
                <span className="text-muted text-sm font-medium mt-2">Forestry Equipment Sales, LLC — Duluth, Minnesota, United States</span>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
