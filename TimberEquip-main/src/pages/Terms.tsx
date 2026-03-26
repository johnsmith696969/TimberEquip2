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
                The Forestry Equipment Sales network is designed for professional logging operations. 
                Users must provide accurate information and maintain professional conduct.
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
                Forestry Equipment Sales reserves the right to remove any listing that fails our verification process.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Billing and Invoices</h2>
              <p>
                Ad programs and listing fees are billed through our secure payment system. 
                Invoices are generated automatically and must be paid within the specified timeframe. 
                Failure to pay may result in suspension of listing privileges.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. Dispute Resolution</h2>
              <p>
                Any disputes between buyers and sellers must be resolved through our established arbitration process. 
                Forestry Equipment Sales provides the platform for communication but does not guarantee the outcome of any transaction.
              </p>
            </section>

            <section className="bg-surface border border-line p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">Legal Department</h2>
              <p className="text-muted">
                For legal inquiries or to report a violation of these terms, contact our 
                Legal Department:
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight text-ink">
                <span>legal@timberequip.run.app</span>
                <span>+1 (800) 846-2373</span>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
