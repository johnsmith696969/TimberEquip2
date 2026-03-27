import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, AlertTriangle, Scale, FileCheck, CheckCircle2, XCircle } from 'lucide-react';

export function Terms() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
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
              Last Updated: March 21, 2026 | Version 1.5.0
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
                We enforce strict rules for equipment listing and buyer-seller interactions.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <AlertTriangle className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Liability</h3>
              <p className="text-sm text-muted leading-relaxed">
                Forestry Equipment Sales is a marketplace and is not liable for the condition of equipment.
              </p>
            </div>
          </div>

          <div className="space-y-12 text-muted leading-loose font-medium">
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">1. Marketplace Usage</h2>
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
                      <li>Listing verified logging equipment.</li>
                      <li>Inquiring about available assets.</li>
                      <li>Applying for institutional financing.</li>
                      <li>Operating an approved seller subscription or dealer storefront.</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <XCircle className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Prohibited Actions</span>
                    <ul className="text-[10px] uppercase space-y-1">
                      <li>Listing fraudulent or non-existent assets.</li>
                      <li>Circumventing the inquiry system.</li>
                      <li>Spamming sellers or buyers.</li>
                      <li>Using the platform in violation of sanctions, export, tax, or consumer protection laws.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">2. Listing Accuracy</h2>
              <p>
                Sellers are responsible for the accuracy of their listings. 
                All specifications, including hours, year, and condition, must be verified. 
                Sellers must also have the legal right to market the equipment, related media, and any branded business assets uploaded to the platform.
                Forestry Equipment Sales reserves the right to reject, unpublish, suspend, or remove any listing that fails our verification process or violates marketplace policy.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Seller Subscriptions, Billing, and Invoices</h2>
              <p>
                Paid seller programs, including Owner-Operator, Dealer, and Pro Dealer subscriptions, are billed through our secure payment system.
                Unless otherwise stated in writing, subscriptions renew automatically on a recurring monthly basis until canceled.
                Invoices, receipts, and subscription records may be issued through Stripe or other approved payment processors.
                Failure to pay, chargeback activity, suspected fraud, or material billing disputes may result in suspension of seller access and public listing visibility.
                Listings are not necessarily deleted when billing lapses, but Forestry Equipment Sales may hide them from public display until the account is restored to good standing.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. Dealer Services and Seller Operations</h2>
              <p>
                DealerOS, dealer storefronts, managed seats, advertising programs, lead routing, inspection routing, and related workflow tools are platform services
                provided to approved accounts. Access to these services depends on active entitlement, compliance with platform rules, and availability of supporting systems.
                Forestry Equipment Sales may limit, suspend, or modify these services to protect the marketplace, comply with law, or maintain platform performance.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">5. Data, Leads, and Platform Records</h2>
              <p>
                By using the platform, you authorize Forestry Equipment Sales to store operational records related to account setup, consent, billing status, leads,
                inspection requests, listing lifecycle actions, fraud prevention, and support activity. These records may be used to maintain the platform, investigate abuse,
                support audits, and verify account entitlement or legal acceptance.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">6. Global Compliance</h2>
              <p>
                Users are responsible for complying with all laws that apply to their activity, including sanctions, export controls, tax obligations, privacy law,
                consumer protection, and advertising rules in the jurisdictions where they operate. Forestry Equipment Sales may refuse service, block transactions,
                or restrict access where compliance risk exists.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">7. Dispute Resolution and Liability</h2>
              <p>
                Any disputes between buyers and sellers must be resolved through the parties directly unless otherwise required by law. Forestry Equipment Sales provides
                the platform for communication and billing infrastructure, but does not guarantee the outcome of any transaction, inspection, financing outcome, transport result,
                or equipment condition. To the fullest extent permitted by law, platform liability is limited to fees actually paid for the affected service during the immediately prior billing period.
              </p>
            </section>

            <section className="bg-surface border border-line p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">Legal Department</h2>
              <p className="text-muted">
                For legal inquiries or to report a violation of these terms, contact our 
                Legal Department:
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight text-ink">
                <span>legal@timberequip.com</span>
                <span>+1 (800) 846-2373</span>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
