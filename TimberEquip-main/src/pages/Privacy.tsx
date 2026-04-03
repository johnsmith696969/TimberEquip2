import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, UserCheck, Trash2, Download, Globe, Users, AlertTriangle, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export function Privacy() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
      <Seo
        title="Privacy Policy | Forestry Equipment Sales"
        description="Learn how Forestry Equipment Sales collects, uses, and protects your data. GDPR, CCPA, and COPPA compliant. Data encryption, third-party processors, and your rights explained."
        canonicalPath="/privacy"
        ogType="website"
        imagePath="/Forestry_Equipment_Sales_Logo.png?v=20260327c"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              name: 'Privacy Policy',
              description: 'Learn how Forestry Equipment Sales collects, uses, and protects your data. GDPR, CCPA, and COPPA compliant.',
              url: 'https://timberequip.com/privacy',
              lastReviewed: '2026-03-29',
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://timberequip.com' },
                { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: 'https://timberequip.com/privacy' },
              ],
            },
          ],
        }}
      />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-12"
        >
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Compliance Policy</span>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              Privacy Policy
            </h1>
            <p className="text-muted font-medium uppercase tracking-widest text-xs">
              Last Updated: March 29, 2026 | Version 4.1.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Shield className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Data Encryption</h3>
              <p className="text-sm text-muted leading-relaxed">
                All data transmitted through the Forestry Equipment Sales platform is encrypted using AES-256 encryption.
                We never store raw payment data on our servers.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Eye className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Transparency</h3>
              <p className="text-sm text-muted leading-relaxed">
                You have the right to know exactly what data we collect, why we collect it, and how it is used
                to facilitate equipment transactions.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Lock className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Your Control</h3>
              <p className="text-sm text-muted leading-relaxed">
                Export your data, delete your account, manage cookie preferences, and exercise your privacy rights at any time.
              </p>
            </div>
          </div>

          <div className="space-y-12 text-muted leading-loose font-medium">

            {/* Section 1: Introduction & Scope */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">1. Introduction &amp; Scope</h2>
              <p>
                This Privacy Policy ("Policy") describes how Forestry Equipment Sales, LLC ("FES," "we," "us," or "our")
                collects, uses, stores, shares, and protects personal information when you access or use our website at
                forestryequipmentsales.com, our mobile applications, our APIs, and any related services (collectively, the "Platform").
              </p>
              <p>
                This Policy applies to all users of the Platform, including equipment buyers, sellers, dealers, service partners,
                visitors, and any other individuals who interact with our services. By accessing or using the Platform, you acknowledge
                that you have read and understood this Policy.
              </p>
              <p>
                If you are located in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, Forestry Equipment Sales, LLC
                is the "data controller" for purposes of applicable data protection law. If you are a California resident, please see
                Section 14 for additional disclosures under the CCPA/CPRA.
              </p>
            </section>

            {/* Section 2: Data Collection */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">2. Data We Collect</h2>
              <p>
                We collect information necessary to operate the marketplace, facilitate transactions, prevent fraud,
                and improve the platform. The categories of data we collect include:
              </p>

              <div className="space-y-6">
                <div className="border border-line p-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-ink">2.1 — Identity Data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Full legal name and display name</li>
                    <li>Business name, trade name, or DBA (if applicable)</li>
                    <li>Professional credentials, certifications, and licensing information</li>
                    <li>Job title and authority to act on behalf of a business entity</li>
                    <li>Profile photograph (optional)</li>
                    <li>Tax identification number or EIN (for dealer accounts — transmitted directly to Stripe, not stored by FES)</li>
                  </ul>
                </div>

                <div className="border border-line p-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-ink">2.2 — Contact Data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Email address (primary and secondary)</li>
                    <li>Phone number (used for inquiries, SMS MFA, and seller contact)</li>
                    <li>Physical business address and mailing address</li>
                    <li>Country, state/province, and postal code</li>
                  </ul>
                </div>

                <div className="border border-line p-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-ink">2.3 — Transaction &amp; Billing Data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Subscription plan, status, start date, and renewal/expiration date</li>
                    <li>Invoice history, payment amounts, and receipt records</li>
                    <li>Equipment listings created, inquiries sent or received, and lead activity</li>
                    <li>Call-routing events for tracked dealer numbers, including calling number, called tracking number, timestamps, call duration, disposition, and recording URL when call recording is enabled</li>
                    <li>Financing applications submitted through our partners</li>
                    <li>Stripe customer ID and subscription metadata (payment card details are stored exclusively by Stripe — we never see or store full card numbers)</li>
                  </ul>
                </div>

                <div className="border border-line p-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-ink">2.4 — Technical &amp; Device Data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>IP address (may be hashed for consent logging and fraud prevention)</li>
                    <li>Browser type, version, and language preferences</li>
                    <li>Operating system and device type</li>
                    <li>Referring URL, pages viewed, time spent, and navigation paths</li>
                    <li>Firebase authentication tokens and session identifiers</li>
                    <li>Screen resolution, viewport dimensions, and timezone</li>
                  </ul>
                </div>

                <div className="border border-line p-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-ink">2.5 — User-Generated Content</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Equipment listing descriptions, specifications, condition notes, and pricing</li>
                    <li>Photographs, videos, and media files uploaded to listings</li>
                    <li>Dealer storefront branding (logos, banners, descriptions)</li>
                    <li>Messages submitted through inquiry forms and contact requests</li>
                    <li>Blog posts and content contributions (for authorized content managers)</li>
                  </ul>
                </div>

                <div className="border border-line p-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-ink">2.6 — Location Data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Equipment location as provided by the seller (city, state, country)</li>
                    <li>Geocoded coordinates derived from location text (used for map display only)</li>
                    <li>IP-based approximate location (country/region level — used for localization and compliance)</li>
                    <li>We do not collect precise GPS location from your device without explicit consent</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3: Legal Basis */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Legal Basis for Processing (GDPR)</h2>
              <p>
                Under the General Data Protection Regulation (GDPR), we process your personal data on the following legal bases:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="border border-line p-6 space-y-2">
                  <FileText className="text-accent flex-shrink-0" size={20} />
                  <span className="text-xs font-black uppercase tracking-widest block">Contractual Necessity</span>
                  <p className="text-[11px] leading-relaxed">Processing required to perform our contract with you — account creation, subscription management, listing publication, inquiry routing, and billing.</p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <Scale className="text-accent flex-shrink-0" size={20} />
                  <span className="text-xs font-black uppercase tracking-widest block">Legitimate Interest</span>
                  <p className="text-[11px] leading-relaxed">Processing in our legitimate business interests — fraud prevention, platform security, analytics, product improvement, and internal auditing. We balance these interests against your rights.</p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <UserCheck className="text-accent flex-shrink-0" size={20} />
                  <span className="text-xs font-black uppercase tracking-widest block">Consent</span>
                  <p className="text-[11px] leading-relaxed">Processing based on your freely given consent — marketing emails, non-essential cookies, and optional analytics. You may withdraw consent at any time without affecting prior processing.</p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <AlertTriangle className="text-accent flex-shrink-0" size={20} />
                  <span className="text-xs font-black uppercase tracking-widest block">Legal Obligation</span>
                  <p className="text-[11px] leading-relaxed">Processing required to comply with applicable law — tax reporting obligations, sanctions screening, responding to valid legal process, and regulatory compliance.</p>
                </div>
              </div>
            </section>

            {/* Section 4: Data Usage */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. How We Use Your Data</h2>
              <p>
                Your data is used for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Marketplace Operations:</strong> Facilitating connections between equipment buyers and sellers, routing inquiries, and managing listings.</li>
                <li><strong>Account Management:</strong> Creating and maintaining your account, authenticating your identity, and managing subscription entitlements.</li>
                <li><strong>Billing &amp; Payments:</strong> Processing subscription charges, generating invoices, managing refunds, and communicating about billing events.</li>
                <li><strong>Financing:</strong> Forwarding financing applications to approved lending partners (with your explicit consent).</li>
                <li><strong>Communication:</strong> Sending transactional emails (inquiry confirmations, payment receipts, listing status updates), forwarding calls to tracked dealer numbers, and optional marketing communications.</li>
                <li><strong>Lead Attribution &amp; Call Routing:</strong> Measuring inquiry volume, call clicks, connected calls, missed calls, and response quality for dealer reporting and platform operations.</li>
                <li><strong>Security &amp; Fraud Prevention:</strong> Detecting and preventing unauthorized access, bot activity, payment fraud, listing fraud, and abuse of the platform.</li>
                <li><strong>Platform Improvement:</strong> Analyzing usage patterns to improve search algorithms, user experience, and feature development.</li>
                <li><strong>Legal Compliance:</strong> Responding to legal requests, maintaining records required by law, and enforcing our Terms of Service.</li>
                <li><strong>Audit &amp; Accountability:</strong> Maintaining internal audit logs for consent, billing events, subscription lifecycle, and account administration.</li>
              </ul>
            </section>

            {/* Section 5: Third-Party Data Processors */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">5. Third-Party Data Processors</h2>
              <p>
                We share your data with the following third-party processors to operate the platform.
                Each processor is bound by data processing agreements (DPAs) and handles data in accordance
                with applicable privacy laws. We do not sell your personal data to any third party.
              </p>

              <div className="space-y-4">
                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Stripe, Inc.</h4>
                  <p className="text-sm">Payment processing, subscription billing, invoice management, and refund processing. Stripe acts as an independent data controller for payment data under its own privacy policy. <em>Data shared: name, email, billing address, Stripe customer ID.</em></p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Google Cloud / Firebase</h4>
                  <p className="text-sm">Cloud hosting infrastructure, user authentication (Firebase Auth with SMS MFA), Firestore database storage, Firebase Storage for listing media, and Firebase Hosting for content delivery. <em>Data shared: all account and listing data stored in Firestore; uploaded media files.</em></p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">SendGrid (Twilio)</h4>
                  <p className="text-sm">Transactional email delivery (inquiry confirmations, payment receipts, listing status notifications, subscription alerts) and optional marketing email delivery. <em>Data shared: email address, display name, email content.</em></p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Twilio, Inc. (Voice)</h4>
                  <p className="text-sm">Dealer call-tracking numbers, inbound voice routing, forwarding to seller destination phones, call-event webhooks, and optional call recordings when enabled for a tracked line. <em>Data shared: caller phone number, tracking number, destination phone number, call timestamps, duration, and recording URL when recording is enabled.</em></p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Google reCAPTCHA Enterprise</h4>
                  <p className="text-sm">Bot protection and fraud prevention on forms, authentication pages, and inquiry submissions. reCAPTCHA may collect hardware and software information, such as device and application data, to generate a risk assessment. <em>Data shared: IP address, browser data, interaction patterns.</em></p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ink">Google Maps Platform</h4>
                  <p className="text-sm">Location-based services for equipment mapping, dealer location searches, and logistics distance calculations. <em>Data shared: equipment location text (city, state), geocoded coordinates.</em></p>
                </div>
              </div>

              <p>
                We may also share data with legal advisors, auditors, and law enforcement authorities when required by law or
                to protect the rights, safety, and property of FES, our users, or the public.
              </p>
            </section>

            {/* Section 6: Your Rights (GDPR) */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">6. Your Rights (GDPR/UK GDPR)</h2>
              <p>
                If you are located in the EEA, UK, or Switzerland, you have the following rights under the General Data Protection Regulation:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="border border-line p-6 flex items-start space-x-4">
                  <Eye className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right of Access</span>
                    <p className="text-[10px] uppercase">Request a copy of all personal data we hold about you (Article 15).</p>
                  </div>
                </div>
                <div className="border border-line p-6 flex items-start space-x-4">
                  <FileText className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right to Rectification</span>
                    <p className="text-[10px] uppercase">Correct inaccurate or incomplete personal data (Article 16).</p>
                  </div>
                </div>
                <div className="border border-line p-6 flex items-start space-x-4">
                  <Trash2 className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right to Erasure</span>
                    <p className="text-[10px] uppercase">Request permanent deletion of your account and all associated data (Article 17).</p>
                  </div>
                </div>
                <div className="border border-line p-6 flex items-start space-x-4">
                  <Lock className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right to Restriction</span>
                    <p className="text-[10px] uppercase">Restrict processing of your data in certain circumstances (Article 18).</p>
                  </div>
                </div>
                <div className="border border-line p-6 flex items-start space-x-4">
                  <Download className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right to Data Portability</span>
                    <p className="text-[10px] uppercase">Receive your data in a structured, machine-readable format (Article 20).</p>
                  </div>
                </div>
                <div className="border border-line p-6 flex items-start space-x-4">
                  <AlertTriangle className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right to Object</span>
                    <p className="text-[10px] uppercase">Object to processing based on legitimate interests, including profiling (Article 21).</p>
                  </div>
                </div>
              </div>

              <p>
                To exercise these rights, visit your <Link to="/profile" className="text-accent underline">Profile &gt; Privacy &amp; Data</Link> tab
                where you can export your data or request account deletion. You may also contact our Data Protection Officer
                at privacy@forestryequipmentsales.com. We will respond to all verified requests within 30 days as required by GDPR Article 12.
                If the request is complex, we may extend this by an additional 60 days with notice.
              </p>
              <p>
                You also have the right to lodge a complaint with your local supervisory authority if you believe
                we have not adequately addressed your privacy concerns.
              </p>
            </section>

            {/* Section 7: Cookie Consent */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">7. Cookie Consent &amp; Tracking Technologies</h2>
              <p>
                When you first visit our platform, a consent banner allows you to accept or decline
                non-essential cookies. Your choice is stored locally and, if you are logged in, recorded
                in our systems for compliance auditing with a versioned consent record. You may change your cookie preferences at any time
                by visiting the <Link to="/cookies" className="text-accent underline">Cookie Policy</Link> page
                and clicking "Manage Cookies."
              </p>
              <p>
                Our cookie categories include: (1) <strong>Essential cookies</strong> required for authentication, security, and core functionality — these
                cannot be disabled; (2) <strong>Performance cookies</strong> that help us understand platform usage patterns; and
                (3) <strong>Marketing cookies</strong> that enable relevant advertising — these require your explicit consent.
              </p>
              <p>
                For a complete list of cookies we use, their purposes, and their retention periods, please see our
                {' '}<Link to="/cookies" className="text-accent underline">Cookie Policy</Link>.
              </p>
            </section>

            {/* Section 8: Data Retention */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">8. Data Retention</h2>
              <p>
                We retain your data only as long as necessary to fulfill the purposes for which it was collected,
                including for the purposes of satisfying any legal, accounting, or reporting requirements.
              </p>
              <div className="space-y-3">
                <div className="border border-line p-4 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-ink">Active Account Data</span>
                  <span className="text-xs text-muted">Duration of account + 30 days after deletion request</span>
                </div>
                <div className="border border-line p-4 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-ink">Transaction &amp; Invoice Records</span>
                  <span className="text-xs text-muted">7 years (tax and legal compliance)</span>
                </div>
                <div className="border border-line p-4 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-ink">Consent Logs</span>
                  <span className="text-xs text-muted">5 years (regulatory audit trail)</span>
                </div>
                <div className="border border-line p-4 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-ink">Billing Audit Logs</span>
                  <span className="text-xs text-muted">7 years</span>
                </div>
                <div className="border border-line p-4 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-ink">Security &amp; Fraud Logs</span>
                  <span className="text-xs text-muted">3 years</span>
                </div>
                <div className="border border-line p-4 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-ink">Marketing Preferences</span>
                  <span className="text-xs text-muted">Until withdrawn or account deleted</span>
                </div>
                <div className="border border-line p-4 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-ink">Uploaded Media (Listings)</span>
                  <span className="text-xs text-muted">Duration of listing + 90 days</span>
                </div>
              </div>
              <p>
                When data is no longer required, it is securely deleted or anonymized so that it can no longer be associated with you.
              </p>
            </section>

            {/* Section 9: Data Security */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">9. Data Security Measures</h2>
              <p>
                We implement industry-standard technical and organizational measures to protect your personal data against
                unauthorized access, alteration, disclosure, or destruction:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption in Transit:</strong> All data is transmitted over HTTPS/TLS 1.3. API communications use Bearer token authentication.</li>
                <li><strong>Encryption at Rest:</strong> Firestore and Firebase Storage use AES-256 encryption at rest by default via Google Cloud infrastructure.</li>
                <li><strong>Authentication Security:</strong> Firebase Authentication with support for SMS-based multi-factor authentication (MFA). Passwords are hashed using industry-standard algorithms by Firebase Auth (we never see or store plaintext passwords).</li>
                <li><strong>Access Control:</strong> Role-based access control (RBAC) with principle of least privilege. Admin, editor, and content manager roles have granular permissions. Firestore security rules enforce server-side access restrictions.</li>
                <li><strong>Payment Security:</strong> All payment processing is handled by Stripe, a PCI DSS Level 1 certified service provider. Card data never touches our servers.</li>
                <li><strong>Bot Protection:</strong> Google reCAPTCHA Enterprise protects against automated attacks on forms and authentication endpoints.</li>
                <li><strong>Webhook Verification:</strong> All Stripe webhook events are verified using cryptographic signatures before processing.</li>
                <li><strong>CSRF Protection:</strong> Cross-Site Request Forgery protection on all authenticated mutation endpoints.</li>
                <li><strong>Rate Limiting:</strong> API rate limiting to prevent abuse and denial-of-service attempts.</li>
              </ul>
              <p>
                While we strive to protect your data, no method of transmission over the Internet or electronic storage
                is 100% secure. We cannot guarantee absolute security but are committed to promptly addressing any
                security incidents.
              </p>
            </section>

            {/* Section 10: Data Breach Notification */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">10. Data Breach Notification</h2>
              <p>
                In the event of a personal data breach that is likely to result in a risk to your rights and freedoms,
                we will notify the relevant supervisory authority within 72 hours of becoming aware of the breach,
                as required by GDPR Article 33.
              </p>
              <p>
                If the breach is likely to result in a <strong>high risk</strong> to you, we will
                also notify you directly without undue delay via email and an in-platform notification.
                Our breach notification will include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The nature of the breach, including the categories and approximate number of affected individuals</li>
                <li>The name and contact details of our Data Protection Officer</li>
                <li>A description of the likely consequences of the breach</li>
                <li>A description of the measures taken or proposed to address the breach, including measures to mitigate its possible adverse effects</li>
              </ul>
              <p>
                We maintain an internal breach register that documents all personal data breaches, their effects,
                and the remedial actions taken, regardless of whether notification to the supervisory authority is required.
              </p>
            </section>

            {/* Section 11: Children's Privacy (COPPA) */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">11. Children's Privacy (COPPA)</h2>
              <p>
                The Forestry Equipment Sales platform is designed for use by forestry and logging professionals and is not
                intended for children under the age of 13 (or under 16 in the EEA/UK). We do not knowingly collect personal information
                from children under the applicable age threshold.
              </p>
              <p>
                If we become aware that we have collected personal data from a child
                under the applicable age, we will delete that data immediately and terminate the associated account.
                If you believe a child has provided us with personal information, please contact us at privacy@forestryequipmentsales.com.
              </p>
            </section>

            {/* Section 12: International Data Transfers */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">12. International Data Transfers</h2>
              <p>
                Forestry Equipment Sales is based in the United States. Your data may be processed in the United States
                and other countries where our service providers operate (including Google Cloud regions in the US and EU, and
                Stripe's global infrastructure).
              </p>
              <p>
                When data is transferred outside the European Economic Area (EEA) or UK, we ensure appropriate
                safeguards are in place, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Standard Contractual Clauses (SCCs):</strong> Approved by the European Commission under Article 46(2)(c) of the GDPR, incorporated into our data processing agreements with sub-processors.</li>
                <li><strong>Adequacy Decisions:</strong> Reliance on European Commission adequacy decisions where applicable.</li>
                <li><strong>EU-U.S. Data Privacy Framework:</strong> Where applicable, reliance on our processors' self-certification under the EU-U.S. Data Privacy Framework.</li>
                <li><strong>Supplementary Measures:</strong> Additional technical safeguards (encryption, pseudonymization) where transfer risk assessments indicate heightened risk.</li>
              </ul>
              <p>
                You may request a copy of the applicable safeguards by contacting our Data Protection Officer.
              </p>
            </section>

            {/* Section 13: Automated Decision Making */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">13. Automated Decision Making &amp; Profiling</h2>
              <p>
                We use automated processes in the following limited contexts:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Fraud Detection:</strong> reCAPTCHA Enterprise generates automated risk scores to detect bot activity and prevent fraudulent form submissions. Interactions flagged as high-risk may be blocked automatically.</li>
                <li><strong>Subscription Enforcement:</strong> Automated systems manage listing visibility based on subscription status. If your subscription becomes past due or is canceled, your listings may be automatically hidden from public search results.</li>
                <li><strong>Email Matching:</strong> Automated alerts notify you when new listings match your saved search criteria.</li>
              </ul>
              <p>
                We do not use automated decision-making that produces legal effects or similarly significant effects
                based solely on automated processing, including profiling, without human oversight. You have the right
                to request human review of any automated decision that significantly affects you (GDPR Article 22).
              </p>
            </section>

            {/* Section 14: California Privacy Rights (CCPA/CPRA) */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">14. California Privacy Rights (CCPA/CPRA)</h2>
              <p>
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA)
                as amended by the California Privacy Rights Act (CPRA):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Know:</strong> You may request that we disclose what personal information we have collected about you in the prior 12 months, the categories of sources, the business purpose for collecting it, and the categories of third parties with whom we share it.</li>
                <li><strong>Right to Delete:</strong> You may request deletion of your personal information, subject to certain exceptions (e.g., legal obligations, fraud prevention, completing transactions).</li>
                <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information we maintain about you.</li>
                <li><strong>Right to Opt-Out of Sale/Sharing:</strong> We do <strong>not</strong> sell personal information as defined under the CCPA. We do <strong>not</strong> share personal information for cross-context behavioral advertising. If this practice changes, we will provide a "Do Not Sell or Share My Personal Information" link.</li>
                <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> We only use sensitive personal information for purposes permitted under the CCPA (providing our services, fraud prevention, and legal compliance).</li>
                <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights — we will not deny services, charge different prices, or provide a different quality of service.</li>
              </ul>

              <div className="border border-line p-6 space-y-3 mt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-ink">CCPA Disclosures (Prior 12 Months)</h4>
                <p className="text-sm">
                  <strong>Categories of PI Collected:</strong> Identifiers, commercial information, internet/electronic activity, geolocation data, professional/employment information.
                </p>
                <p className="text-sm">
                  <strong>Categories of Sources:</strong> Directly from you, automatically through your use of the Platform, and from third-party service providers (Stripe, Firebase Auth).
                </p>
                <p className="text-sm">
                  <strong>Business Purposes:</strong> Providing and improving our services, processing transactions, security and fraud prevention, legal compliance.
                </p>
                <p className="text-sm">
                  <strong>Categories of Third Parties:</strong> Payment processors (Stripe), cloud infrastructure (Google), email delivery (SendGrid), fraud prevention (reCAPTCHA).
                </p>
                <p className="text-sm">
                  <strong>PI Sold or Shared:</strong> None.
                </p>
              </div>

              <p>
                To exercise these rights, visit your <Link to="/profile" className="text-accent underline">Profile &gt; Privacy &amp; Data</Link> tab
                or contact us at privacy@forestryequipmentsales.com. You may also designate an authorized agent to submit requests on your behalf.
                We will verify your identity before processing any request.
              </p>
            </section>

            {/* Section 15: Do Not Track */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">15. Do Not Track Signals</h2>
              <p>
                Some web browsers transmit "Do Not Track" (DNT) signals. Because there is no universally accepted standard
                for how to respond to DNT signals, we do not currently respond to DNT signals. However, you can control
                tracking through our cookie consent mechanism and browser privacy settings.
              </p>
            </section>

            {/* Section 16: Third-Party Links */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">16. Third-Party Links &amp; Services</h2>
              <p>
                Our Platform may contain links to third-party websites, services, or applications that are not operated by us
                (e.g., Stripe checkout, financing partner portals, equipment manufacturer websites). This Privacy Policy does
                not apply to third-party services. We encourage you to review the privacy policies of any third-party services
                you access through our Platform.
              </p>
            </section>

            {/* Section 17: Changes to This Policy */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">17. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technologies,
                legal requirements, or other factors. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Update the "Last Updated" date and version number at the top of this page</li>
                <li>Notify registered users by email if the changes are material</li>
                <li>Display an in-platform notification for logged-in users</li>
                <li>Where required by law (e.g., GDPR), obtain your renewed consent before applying changes to the processing of your data</li>
              </ul>
              <p>
                Your continued use of the Platform after any changes to this Policy constitutes your acceptance of the updated Policy.
                We encourage you to review this page periodically for the latest information.
              </p>
            </section>

            {/* Contact Section */}
            <section className="bg-[#1C1917] text-white p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-accent">Contact Data Protection Officer</h2>
              <p className="text-white/60">
                If you have questions about this policy, wish to exercise your rights, or want to file a
                privacy-related complaint, contact our Data Protection Center:
              </p>
              <p className="text-white/60">
                If your concern involves voice-call metadata, forwarding numbers, or telephone privacy information similar to customer proprietary network information (CPNI), you may also file a privacy complaint with the FCC through the{' '}
                <a href="https://consumercomplaints.fcc.gov/hc/en-us/articles/8824334151572-Privacy-Complaints" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  FCC Privacy Complaints Center
                </a>.
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight">
                <span>privacy@forestryequipmentsales.com</span>
                <span>+1 (800) 846-2373</span>
                <span className="text-white/40 text-sm font-medium mt-2">Forestry Equipment Sales, LLC — Duluth, Minnesota, United States</span>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
