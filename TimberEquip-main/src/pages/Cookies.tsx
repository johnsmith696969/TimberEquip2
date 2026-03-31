import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Info, Settings, ShieldCheck, CheckCircle2, XCircle, Lock, Globe, Clock, Database, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { REOPEN_CONSENT_EVENT } from '../components/ConsentBanner';
import { Seo } from '../components/Seo';

export function Cookies() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
      <Seo
        title="Cookie Policy | Forestry Equipment Sales"
        description="Learn how Forestry Equipment Sales uses cookies, localStorage, and tracking technologies. Manage your preferences and understand your choices."
        canonicalPath="/cookies"
      />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-12"
        >
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Cookie Policy</span>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              Cookie Policy
            </h1>
            <p className="text-muted font-medium uppercase tracking-widest text-xs">
              Last Updated: March 29, 2026 | Version 2.0.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Cookie className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">What are Cookies?</h3>
              <p className="text-sm text-muted leading-relaxed">
                Small data files stored on your device to enable authentication, remember preferences,
                and improve platform performance.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <ShieldCheck className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Privacy First</h3>
              <p className="text-sm text-muted leading-relaxed">
                We only use cookies that are necessary for the marketplace to function
                or to improve your experience. Non-essential cookies require your consent.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Settings className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Your Choice</h3>
              <p className="text-sm text-muted leading-relaxed">
                You can manage, disable, or delete cookies at any time through our consent banner
                or your browser settings.
              </p>
            </div>
          </div>

          <div className="space-y-12 text-muted leading-loose font-medium">

            {/* Section 1: Introduction */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">1. Introduction</h2>
              <p>
                This Cookie Policy explains how Forestry Equipment Sales, LLC ("FES," "we," "us," or "our") uses cookies,
                web beacons, localStorage, and similar tracking technologies when you visit or interact with our website at
                forestryequipmentsales.com and related services (the "Platform"). This Policy should be read alongside our
                {' '}<Link to="/privacy" className="text-accent underline">Privacy Policy</Link>.
              </p>
              <p>
                By using the Platform and accepting cookies via our consent banner, you consent to the use of cookies as described
                in this Policy. You can change your preferences at any time by clicking the "Manage Cookies" button below or
                adjusting your browser settings.
              </p>
            </section>

            {/* Section 2: What Are Cookies */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">2. What Are Cookies &amp; Similar Technologies</h2>
              <p>
                <strong>Cookies</strong> are small text files placed on your device (computer, tablet, or mobile phone) by websites
                you visit. They are widely used to make websites work efficiently, provide information to site owners, and enable
                certain features.
              </p>
              <p>
                <strong>LocalStorage</strong> is a web browser feature that allows websites to store data locally on your device.
                Unlike cookies, localStorage data is not sent to the server with every request, but it persists until explicitly
                cleared. We use localStorage for user preferences and consent state.
              </p>
              <p>
                <strong>Web Beacons</strong> (also known as pixel tags or clear GIFs) are tiny transparent images embedded in web pages
                or emails that allow us to track whether content has been accessed. We may use web beacons in transactional emails
                to confirm delivery and engagement.
              </p>
            </section>

            {/* Section 3: Cookie Categories */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Cookie Categories</h2>

              {/* Essential Cookies */}
              <div className="border border-line rounded-sm overflow-hidden">
                <div className="bg-surface p-6 border-b border-line flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Lock className="text-data flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-ink">3.1 — Essential Cookies</h3>
                      <p className="text-[10px] uppercase text-muted mt-1">Required — Cannot be disabled</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-data border border-data/30 bg-data/10 px-2 py-1 rounded-sm">Always Active</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm">
                    These cookies are strictly necessary for the Platform to function. They enable core features like
                    user authentication, session management, security protections, and basic site navigation. Without
                    these cookies, the Platform cannot operate.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Cookie / Storage Key</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Provider</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Purpose</th>
                          <th className="text-left py-2 font-black uppercase tracking-widest text-ink">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        <tr><td className="py-2 pr-4">__session</td><td className="py-2 pr-4">Firebase</td><td className="py-2 pr-4">Firebase authentication session token</td><td className="py-2">Session</td></tr>
                        <tr><td className="py-2 pr-4">firebaseLocalStorageDb</td><td className="py-2 pr-4">Firebase Auth</td><td className="py-2 pr-4">Stores authentication state and user tokens in IndexedDB</td><td className="py-2">Persistent</td></tr>
                        <tr><td className="py-2 pr-4">_csrf</td><td className="py-2 pr-4">FES</td><td className="py-2 pr-4">CSRF protection token for form submissions</td><td className="py-2">Session</td></tr>
                        <tr><td className="py-2 pr-4">__stripe_mid</td><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Stripe fraud prevention and payment security</td><td className="py-2">1 year</td></tr>
                        <tr><td className="py-2 pr-4">__stripe_sid</td><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Stripe session identifier for checkout</td><td className="py-2">Session</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border border-line rounded-sm overflow-hidden">
                <div className="bg-surface p-6 border-b border-line flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="text-accent flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-ink">3.2 — Functional Cookies &amp; LocalStorage</h3>
                      <p className="text-[10px] uppercase text-muted mt-1">Required — Stores your preferences</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-data border border-data/30 bg-data/10 px-2 py-1 rounded-sm">Always Active</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm">
                    These storage mechanisms remember your preferences and choices to provide a personalized experience.
                    They are essential for features like theme switching, language selection, and consent state.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Storage Key</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Type</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Purpose</th>
                          <th className="text-left py-2 font-black uppercase tracking-widest text-ink">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        <tr><td className="py-2 pr-4">te-consent</td><td className="py-2 pr-4">localStorage</td><td className="py-2 pr-4">Records your cookie consent decision (accepted/declined) and version</td><td className="py-2">Persistent</td></tr>
                        <tr><td className="py-2 pr-4">te-theme</td><td className="py-2 pr-4">localStorage</td><td className="py-2 pr-4">Stores your selected theme preference (light, dark, dusk)</td><td className="py-2">Persistent</td></tr>
                        <tr><td className="py-2 pr-4">te-locale</td><td className="py-2 pr-4">localStorage</td><td className="py-2 pr-4">Stores your language and currency preferences</td><td className="py-2">Persistent</td></tr>
                        <tr><td className="py-2 pr-4">te-saved-equipment</td><td className="py-2 pr-4">localStorage</td><td className="py-2 pr-4">Stores your bookmarked/saved equipment listings</td><td className="py-2">Persistent</td></tr>
                        <tr><td className="py-2 pr-4">te-billing-cache-v1</td><td className="py-2 pr-4">localStorage</td><td className="py-2 pr-4">Caches billing data for admin dashboard performance</td><td className="py-2">Until refresh</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Performance Cookies */}
              <div className="border border-line rounded-sm overflow-hidden">
                <div className="bg-surface p-6 border-b border-line flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="text-accent flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-ink">3.3 — Performance &amp; Analytics Cookies</h3>
                      <p className="text-[10px] uppercase text-muted mt-1">Optional — Requires your consent</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted border border-line px-2 py-1 rounded-sm">Consent Required</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm">
                    These cookies help us understand how the marketplace is being used by collecting anonymous usage data.
                    They allow us to count visits, identify traffic sources, and measure which pages are most popular.
                    All data collected is aggregated and anonymous.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Cookie</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Provider</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Purpose</th>
                          <th className="text-left py-2 font-black uppercase tracking-widest text-ink">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        <tr><td className="py-2 pr-4">_ga</td><td className="py-2 pr-4">Google Analytics</td><td className="py-2 pr-4">Distinguishes unique visitors by assigning a randomly generated number</td><td className="py-2">2 years</td></tr>
                        <tr><td className="py-2 pr-4">_ga_*</td><td className="py-2 pr-4">Google Analytics</td><td className="py-2 pr-4">Maintains session state for GA4 measurement</td><td className="py-2">2 years</td></tr>
                        <tr><td className="py-2 pr-4">_gid</td><td className="py-2 pr-4">Google Analytics</td><td className="py-2 pr-4">Distinguishes users for 24-hour analytics windows</td><td className="py-2">24 hours</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-line rounded-sm overflow-hidden">
                <div className="bg-surface p-6 border-b border-line flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="text-accent flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-ink">3.4 — Marketing Cookies</h3>
                      <p className="text-[10px] uppercase text-muted mt-1">Optional — Requires your explicit consent</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted border border-line px-2 py-1 rounded-sm">Consent Required</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm">
                    Marketing cookies are used to deliver relevant equipment advertising based on your browsing interests.
                    They are also used to limit the number of times you see an ad and to measure advertising campaign effectiveness.
                    These cookies require your explicit consent and can be declined without affecting core platform functionality.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Cookie</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Provider</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Purpose</th>
                          <th className="text-left py-2 font-black uppercase tracking-widest text-ink">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        <tr><td className="py-2 pr-4">_fbp</td><td className="py-2 pr-4">Meta (Facebook)</td><td className="py-2 pr-4">Facebook Pixel — tracks conversions and enables ad targeting</td><td className="py-2">3 months</td></tr>
                        <tr><td className="py-2 pr-4">_gcl_au</td><td className="py-2 pr-4">Google Ads</td><td className="py-2 pr-4">Google Ads conversion tracking</td><td className="py-2">3 months</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Security Cookies */}
              <div className="border border-line rounded-sm overflow-hidden">
                <div className="bg-surface p-6 border-b border-line flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="text-accent flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-ink">3.5 — Security &amp; Fraud Prevention</h3>
                      <p className="text-[10px] uppercase text-muted mt-1">Required — Protects against abuse</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-data border border-data/30 bg-data/10 px-2 py-1 rounded-sm">Always Active</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm">
                    These cookies and scripts are used to detect and prevent malicious activity, bot attacks, and fraudulent
                    form submissions. They are essential for maintaining the security and integrity of the Platform.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Cookie / Script</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Provider</th>
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-widest text-ink">Purpose</th>
                          <th className="text-left py-2 font-black uppercase tracking-widest text-ink">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        <tr><td className="py-2 pr-4">_GRECAPTCHA</td><td className="py-2 pr-4">Google reCAPTCHA</td><td className="py-2 pr-4">reCAPTCHA Enterprise bot protection and risk assessment</td><td className="py-2">6 months</td></tr>
                        <tr><td className="py-2 pr-4">rc::a, rc::b, rc::c</td><td className="py-2 pr-4">Google reCAPTCHA</td><td className="py-2 pr-4">reCAPTCHA challenge state and interaction data</td><td className="py-2">Session</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: How We Use Cookies */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. How We Use Cookies</h2>
              <p>
                We use cookies and similar technologies for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication &amp; Security:</strong> Verifying your identity when you log in, maintaining your session across page loads, and protecting against cross-site request forgery (CSRF) attacks.</li>
                <li><strong>Preferences &amp; Personalization:</strong> Remembering your theme (light/dark/dusk), language, currency, and cookie consent choices.</li>
                <li><strong>Payment Processing:</strong> Enabling Stripe's fraud detection and secure checkout functionality.</li>
                <li><strong>Analytics &amp; Performance:</strong> Understanding how users navigate the Platform, which pages are most visited, and where users encounter issues (with your consent).</li>
                <li><strong>Advertising &amp; Marketing:</strong> Measuring the effectiveness of advertising campaigns and delivering relevant equipment ads (with your explicit consent).</li>
                <li><strong>Fraud Prevention:</strong> Using reCAPTCHA to distinguish human visitors from automated bots and prevent abuse of forms and authentication endpoints.</li>
              </ul>
            </section>

            {/* Section 5: Consent Mechanism */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">5. Consent Mechanism</h2>
              <p>
                When you first visit our Platform, a consent banner is displayed asking you to accept or decline non-essential cookies.
                Your consent choice is:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Stored locally on your device via <code className="text-xs bg-surface px-1 py-0.5">localStorage</code> (key: <code className="text-xs bg-surface px-1 py-0.5">te-consent</code>)</li>
                <li>If you are logged in, also recorded in our Firestore database with your user ID, timestamp, consent version, and user agent for compliance auditing</li>
                <li>Versioned — if we update our cookie categories, you will be asked to re-consent</li>
              </ul>
              <p>
                You may withdraw or change your consent at any time by clicking the "Manage Cookies" button below, which reopens
                the consent banner. Withdrawing consent does not affect the lawfulness of processing based on consent before its withdrawal.
              </p>
            </section>

            {/* Section 6: Managing Cookies in Your Browser */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">6. Managing Cookies in Your Browser</h2>
              <p>
                In addition to our consent banner, you can control cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View and delete individual cookies</li>
                <li>Block cookies from specific sites or all sites</li>
                <li>Block third-party cookies while allowing first-party cookies</li>
                <li>Clear all cookies when you close your browser</li>
                <li>Open a "private browsing" or "incognito" session that doesn't save cookies</li>
              </ul>
              <p>
                Please note that blocking essential cookies will prevent the Platform from functioning correctly. You may not be
                able to log in, make purchases, or use core features if essential cookies are blocked.
              </p>
              <p>
                For instructions on managing cookies in popular browsers, visit:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Chrome: Settings &gt; Privacy and Security &gt; Cookies</li>
                <li>Firefox: Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                <li>Safari: Preferences &gt; Privacy &gt; Manage Website Data</li>
                <li>Edge: Settings &gt; Cookies and Site Permissions</li>
              </ul>
            </section>

            {/* Section 7: Third-Party Cookies */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">7. Third-Party Cookies</h2>
              <p>
                Some cookies on our Platform are placed by third-party services that we use. We do not control these cookies
                and they are subject to the respective third party's privacy policy:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google (Firebase, reCAPTCHA, Analytics, Maps):</strong> <a href="https://policies.google.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                <li><strong>Stripe:</strong> <a href="https://stripe.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
                <li><strong>Meta (Facebook):</strong> <a href="https://www.facebook.com/privacy/policy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Meta Privacy Policy</a></li>
              </ul>
            </section>

            {/* Section 8: Legal Basis */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">8. Legal Basis for Cookie Use</h2>
              <p>
                We rely on the following legal bases for placing cookies on your device:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Strict Necessity (ePrivacy Directive Article 5(3) exemption):</strong> Essential cookies, security cookies, and functional localStorage that are strictly necessary for the service you have requested.</li>
                <li><strong>Consent (GDPR Article 6(1)(a)):</strong> Performance/analytics cookies and marketing cookies, which are only activated after you provide explicit consent via our consent banner.</li>
                <li><strong>Legitimate Interest (GDPR Article 6(1)(f)):</strong> Certain fraud prevention measures that protect both our Platform and our users from malicious activity.</li>
              </ul>
            </section>

            {/* Section 9: Cookie Retention */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">9. Cookie Retention Periods</h2>
              <p>
                Cookies are classified by their lifespan:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="border border-line p-6 space-y-2">
                  <Clock className="text-accent flex-shrink-0" size={20} />
                  <span className="text-xs font-black uppercase tracking-widest block">Session Cookies</span>
                  <p className="text-[11px] leading-relaxed">Temporary cookies that are deleted when you close your browser. Used for authentication sessions, CSRF tokens, and reCAPTCHA challenge state.</p>
                </div>
                <div className="border border-line p-6 space-y-2">
                  <Database className="text-accent flex-shrink-0" size={20} />
                  <span className="text-xs font-black uppercase tracking-widest block">Persistent Cookies</span>
                  <p className="text-[11px] leading-relaxed">Cookies that remain on your device for a set period or until you delete them. Used for consent preferences, theme settings, Stripe fraud prevention, and analytics.</p>
                </div>
              </div>
              <p>
                Specific retention periods for each cookie are listed in the tables above. LocalStorage data persists indefinitely
                until you clear your browser storage or we programmatically remove it (e.g., on logout or account deletion).
              </p>
            </section>

            {/* Section 10: Updates */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">10. Changes to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our technology, legal requirements,
                or the cookies we use. When we make material changes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We will update the "Last Updated" date and version number at the top of this page</li>
                <li>We will re-display the consent banner so you can review and accept the updated cookie categories</li>
                <li>Your previous consent will be invalidated for the new version, requiring a fresh consent decision</li>
              </ul>
            </section>

            {/* Manage Cookies Button */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">11. Managing Your Preferences</h2>
              <p>
                Click the button below to reopen the cookie consent banner and update your preferences.
                You can accept or decline non-essential cookies at any time.
              </p>
              <button
                onClick={() => window.dispatchEvent(new Event(REOPEN_CONSENT_EVENT))}
                className="btn-industrial bg-accent text-white py-4 px-10 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Manage Cookies
              </button>
            </section>

            {/* Contact Section */}
            <section className="bg-ink text-white p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-accent">Cookie Support</h2>
              <p className="text-white/60">
                If you have questions about our use of cookies or need assistance managing your
                cookie preferences, contact our Technical Support team:
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight">
                <span>support@forestryequipmentsales.com</span>
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
