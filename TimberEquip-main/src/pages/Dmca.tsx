import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileWarning, AlertTriangle, Scale, Mail, FileText, Ban, Clock, CheckCircle2, XCircle, Users, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export function Dmca() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
      <Seo
        title="DMCA Policy | Forestry Equipment Sales"
        description="Digital Millennium Copyright Act (DMCA) policy for Forestry Equipment Sales. Takedown procedures, counter-notifications, designated agent, and repeat infringer policy."
        canonicalPath="/dmca"
      />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-12"
        >
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Legal</span>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              DMCA Policy
            </h1>
            <p className="text-muted font-medium uppercase tracking-widest text-xs">
              Last Updated: March 29, 2026 | Version 2.0.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Shield className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Copyright Protection</h3>
              <p className="text-sm text-muted leading-relaxed">
                Forestry Equipment Sales respects intellectual property rights and complies
                with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. Section 512.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Scale className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Fair Process</h3>
              <p className="text-sm text-muted leading-relaxed">
                We provide a clear, transparent process for copyright holders to report infringement
                and for users to submit counter-notifications.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Gavel className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Enforcement</h3>
              <p className="text-sm text-muted leading-relaxed">
                We maintain a repeat infringer policy and will terminate accounts of users who
                repeatedly violate copyright protections.
              </p>
            </div>
          </div>

          <div className="space-y-12 text-muted leading-loose font-medium">

            {/* Section 1: Overview */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">1. Overview &amp; Safe Harbor</h2>
              <p>
                Forestry Equipment Sales, LLC ("FES," "we," "us," or "our") operates a marketplace platform where users upload
                content including equipment listings, photographs, videos, and descriptions. As a provider of an interactive
                computer service that hosts user-generated content, we qualify as a "service provider" under the Digital Millennium
                Copyright Act (DMCA), 17 U.S.C. Section 512, and claim safe harbor protection under Section 512(c) for content
                stored at the direction of our users.
              </p>
              <p>
                We respect the intellectual property rights of others and expect our users to do the same. It is our policy to
                respond expeditiously to valid DMCA takedown notices and to disable access to or remove material that is claimed
                to be infringing. We also provide a counter-notification process for users who believe their content was wrongly removed.
              </p>
              <p>
                This policy applies to all content hosted on the Forestry Equipment Sales platform, including but not limited to:
                equipment listing photographs, listing descriptions, dealer storefront branding, blog content, and any other
                user-uploaded media.
              </p>
            </section>

            {/* Section 2: Designated Agent */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">2. Designated DMCA Agent</h2>
              <p>
                In accordance with the DMCA, FES has designated the following agent to receive
                notifications of claimed copyright infringement. This agent's contact information has been
                registered with the U.S. Copyright Office's DMCA Designated Agent Directory.
              </p>
              <div className="bg-surface border border-line p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent block">Name</span>
                    <span className="text-sm text-ink font-bold">Aaron Blake</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent block">Title</span>
                    <span className="text-sm text-ink font-bold">DMCA Designated Agent</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent block">Email</span>
                    <span className="text-sm text-ink font-bold">info@forestryequipmentsales.com</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent block">Phone</span>
                    <span className="text-sm text-ink font-bold">+1 (218) 720-0933</span>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent block">Mailing Address</span>
                    <span className="text-sm text-ink font-bold">Forestry Equipment Sales, LLC, Attention: DMCA Agent, Duluth, Minnesota, United States</span>
                  </div>
                </div>
              </div>
              <p>
                Please direct all DMCA notices and counter-notifications to the designated agent listed above.
                Notices sent to other contacts or departments may not receive a timely response.
              </p>
            </section>

            {/* Section 3: Filing a Takedown Notice */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Filing a DMCA Takedown Notice</h2>
              <p>
                If you believe that content hosted on our platform infringes your copyright, you may submit a
                written takedown notice to our Designated Agent. To be effective under 17 U.S.C. Section 512(c)(3),
                your notice must include <strong>all</strong> of the following:
              </p>
              <div className="space-y-4">
                {[
                  {
                    letter: 'a',
                    title: 'Signature',
                    text: 'A physical or electronic signature of the copyright owner or a person authorized to act on the owner\'s behalf.',
                  },
                  {
                    letter: 'b',
                    title: 'Identification of Copyrighted Work',
                    text: 'Identification of the copyrighted work(s) claimed to have been infringed. If multiple works are covered by a single notification, provide a representative list.',
                  },
                  {
                    letter: 'c',
                    title: 'Identification of Infringing Material',
                    text: 'Identification of the material claimed to be infringing, including the specific URL(s) or other information reasonably sufficient to permit FES to locate the material on the Platform.',
                  },
                  {
                    letter: 'd',
                    title: 'Contact Information',
                    text: 'Your full name, mailing address, telephone number, and email address so that FES may contact you regarding your notice.',
                  },
                  {
                    letter: 'e',
                    title: 'Good Faith Statement',
                    text: 'A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.',
                  },
                  {
                    letter: 'f',
                    title: 'Accuracy &amp; Authority Statement',
                    text: 'A statement, made under penalty of perjury, that the information in the notification is accurate and that you are the copyright owner or authorized to act on the owner\'s behalf.',
                  },
                ].map((item) => (
                  <div key={item.letter} className="flex items-start space-x-4 border border-line p-5">
                    <span className="text-accent font-black text-sm mt-0.5 flex-shrink-0">{item.letter}.</span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-ink block mb-1">{item.title}</span>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface border border-line p-6 flex items-start space-x-4 mt-4">
                <Mail className="text-accent flex-shrink-0" size={20} />
                <div>
                  <span className="text-xs font-black uppercase tracking-widest block mb-1">Send Notices To</span>
                  <p className="text-sm">info@forestryequipmentsales.com — Subject line: "DMCA Takedown Notice"</p>
                  <p className="text-[10px] uppercase text-muted mt-2">
                    You may also send notices by mail to our Designated Agent address listed above.
                  </p>
                </div>
              </div>

              <div className="bg-surface border border-caution/30 p-6 flex items-start space-x-4">
                <AlertTriangle className="text-caution flex-shrink-0" size={20} />
                <div>
                  <span className="text-xs font-black uppercase tracking-widest block mb-1">Incomplete Notices</span>
                  <p className="text-sm">
                    Notices that do not contain all required elements may not be actionable. If your notice is incomplete,
                    we will make a reasonable effort to contact you for additional information, but we are not obligated to
                    act on incomplete notices.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Our Response Process */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. Our Response to Takedown Notices</h2>
              <p>
                Upon receipt of a valid DMCA takedown notice, FES will take the following actions:
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-4">
                  <span className="text-accent font-black text-sm mt-0.5 flex-shrink-0">1.</span>
                  <p><strong>Expedited Removal:</strong> We will remove or disable access to the identified material promptly, typically within 1–3 business days of receiving a complete and valid notice.</p>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="text-accent font-black text-sm mt-0.5 flex-shrink-0">2.</span>
                  <p><strong>Notification to User:</strong> We will notify the user who uploaded the allegedly infringing material that it has been removed or disabled, and provide a copy of the takedown notice (with your personal contact information redacted, if requested).</p>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="text-accent font-black text-sm mt-0.5 flex-shrink-0">3.</span>
                  <p><strong>Record Keeping:</strong> We will maintain a record of all takedown notices received, actions taken, and any counter-notifications filed, in accordance with our legal obligations.</p>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="text-accent font-black text-sm mt-0.5 flex-shrink-0">4.</span>
                  <p><strong>Account Review:</strong> We will review the user's account for patterns of infringement. Multiple valid takedown notices may trigger account-level enforcement under our Repeat Infringer Policy (Section 6).</p>
                </div>
              </div>
            </section>

            {/* Section 5: Counter-Notification */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">5. Counter-Notification Procedure</h2>
              <p>
                If you believe that material you posted was removed or disabled by mistake or misidentification,
                you may file a counter-notification with our Designated Agent. Your counter-notification must include
                <strong> all</strong> of the following:
              </p>
              <div className="space-y-4">
                {[
                  {
                    letter: 'a',
                    title: 'Signature',
                    text: 'Your physical or electronic signature.',
                  },
                  {
                    letter: 'b',
                    title: 'Identification of Removed Material',
                    text: 'Identification of the material that has been removed or disabled, and the location where it appeared on the Platform before removal (include the listing URL or content ID).',
                  },
                  {
                    letter: 'c',
                    title: 'Statement Under Penalty of Perjury',
                    text: 'A statement under penalty of perjury that you have a good faith belief the material was removed or disabled as a result of mistake or misidentification of the material.',
                  },
                  {
                    letter: 'd',
                    title: 'Consent to Jurisdiction',
                    text: 'Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located (or, if outside the United States, the District of Minnesota), and that you will accept service of process from the person who submitted the takedown notice or an agent of such person.',
                  },
                ].map((item) => (
                  <div key={item.letter} className="flex items-start space-x-4 border border-line p-5">
                    <span className="text-accent font-black text-sm mt-0.5 flex-shrink-0">{item.letter}.</span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-ink block mb-1">{item.title}</span>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-ink">Counter-Notification Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-4">
                    <Clock className="text-accent flex-shrink-0" size={16} />
                    <p className="text-sm"><strong>Day 0:</strong> FES receives a valid counter-notification and forwards it to the original complainant.</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="text-accent flex-shrink-0" size={16} />
                    <p className="text-sm"><strong>Days 1–10:</strong> The original complainant has 10 business days to file a court action seeking to restrain the alleged infringer.</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="text-accent flex-shrink-0" size={16} />
                    <p className="text-sm"><strong>Days 10–14:</strong> If no court action is filed, FES will restore the removed material within 10–14 business days from receipt of the counter-notification.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Repeat Infringer Policy */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">6. Repeat Infringer Policy</h2>
              <p>
                In accordance with the DMCA and as a condition of maintaining our safe harbor protection, FES maintains
                a policy to terminate, in appropriate circumstances, the accounts of users who are repeat infringers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-line p-6 space-y-3 text-center">
                  <span className="text-3xl font-black text-accent">1st</span>
                  <span className="text-xs font-black uppercase tracking-widest block text-ink">First Notice</span>
                  <p className="text-[11px]">Content removed. Written warning issued to account holder. Account remains active.</p>
                </div>
                <div className="border border-caution/30 bg-caution/5 p-6 space-y-3 text-center">
                  <span className="text-3xl font-black text-caution">2nd</span>
                  <span className="text-xs font-black uppercase tracking-widest block text-ink">Second Notice</span>
                  <p className="text-[11px]">Content removed. Final warning issued. Account placed on probation. Listing privileges may be restricted.</p>
                </div>
                <div className="border border-accent/30 bg-accent/5 p-6 space-y-3 text-center">
                  <span className="text-3xl font-black text-accent">3rd</span>
                  <span className="text-xs font-black uppercase tracking-widest block text-ink">Third Notice</span>
                  <p className="text-[11px]">Account terminated. All associated listings permanently removed. User barred from creating new accounts.</p>
                </div>
              </div>

              <p>
                FES reserves the right to terminate an account after fewer than three notices if the infringement
                is egregious, willful, or conducted on a commercial scale. Conversely, notices that are withdrawn,
                successfully counter-notified, or determined to be frivolous will not count toward this threshold.
              </p>
            </section>

            {/* Section 7: Good Faith Requirement */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">7. Good Faith &amp; Misrepresentation</h2>
              <p>
                The DMCA provides that any person who <strong>knowingly materially misrepresents</strong> that material is
                infringing, or that material was removed or disabled by mistake or misidentification, may be
                subject to liability for damages, including costs and attorneys' fees, under 17 U.S.C. Section 512(f).
              </p>
              <p>
                Before filing a takedown notice, please carefully consider whether the use of the copyrighted material
                constitutes fair use under 17 U.S.C. Section 107. Fair use factors include: (1) the purpose and character
                of the use; (2) the nature of the copyrighted work; (3) the amount used in relation to the whole; and
                (4) the effect on the market for the original work.
              </p>
              <p>
                Please ensure that any takedown notice or counter-notification you submit
                is accurate, complete, and made in good faith. FES may forward incomplete or potentially abusive
                notices to the affected user and may choose not to act on notices that appear fraudulent or harassing.
              </p>
            </section>

            {/* Section 8: User-Generated Content */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">8. User-Generated Content Notice</h2>
              <p>
                Forestry Equipment Sales is a marketplace platform that hosts user-generated content. We do not pre-screen
                all content uploaded to the Platform. While we make reasonable efforts to prevent infringing content from
                appearing on the Platform (including reviewing listings during the approval process), we cannot guarantee
                that all content is free from copyright infringement.
              </p>
              <p>
                When users upload content (photographs, descriptions, videos, brand assets) to the Platform, they represent
                and warrant that they have all necessary rights and permissions to do so, as described in our
                {' '}<Link to="/terms" className="text-accent underline">Terms of Service</Link>. Users who upload
                infringing content are solely responsible for any resulting liability.
              </p>
            </section>

            {/* Section 9: Relationship to Terms */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">9. Relationship to Other Policies</h2>
              <p>
                This DMCA Policy is part of and incorporated into our <Link to="/terms" className="text-accent underline">Terms of Service</Link>.
                Users who violate this policy may also be subject to enforcement actions under our Terms, including account suspension
                or termination, listing removal, and forfeiture of subscription fees.
              </p>
              <p>
                For non-copyright intellectual property concerns (e.g., trademark infringement, trade secret misappropriation),
                please contact our Legal Department at legal@timberequip.com. These matters are not governed by the DMCA but
                will be addressed under our Terms of Service and applicable law.
              </p>
            </section>

            {/* Section 10: Modifications */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">10. Modifications to This Policy</h2>
              <p>
                FES reserves the right to modify this DMCA Policy at any time. Changes will be reflected by updating the
                "Last Updated" date and version number at the top of this page. Material changes will be communicated to
                registered users via email or in-platform notification. Your continued use of the Platform after changes
                constitutes acceptance of the modified policy.
              </p>
            </section>

            {/* Contact Section */}
            <section className="bg-ink text-white p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-accent">DMCA Support</h2>
              <p className="text-white/60">
                For questions about this policy, to report copyright infringement, or to submit
                a counter-notification, contact our Designated Agent:
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight">
                <span>info@forestryequipmentsales.com</span>
                <span>+1 (218) 720-0933</span>
                <span className="text-white/40 text-sm font-medium mt-2">Forestry Equipment Sales, LLC — Duluth, Minnesota, United States</span>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
