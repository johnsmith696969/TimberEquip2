import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, UserCheck, Trash2, Download } from 'lucide-react';

export function Privacy() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
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
              Last Updated: March 21, 2026 | Version 2.1.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                You have the right to know exactly what data we collect and how it is used to facilitate 
                equipment transactions.
              </p>
            </div>
          </div>

          <div className="space-y-12 text-muted leading-loose font-medium">
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">1. Data Collection</h2>
              <p>
                We collect information necessary to facilitate the sale and financing of logging equipment. 
                This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Identity Data: Name, business name, and professional credentials.</li>
                <li>Contact Data: Email address, phone number, and physical business location.</li>
                <li>Transaction Data: Details about equipment listed, inquired about, or financed.</li>
                <li>Technical Data: IP address, browser type, and usage patterns.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">2. Data Usage</h2>
              <p>
                Your data is used strictly for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Facilitating connections between buyers and sellers.</li>
                <li>Processing financing applications through our verified partners.</li>
                <li>Improving the Forestry Equipment Sales marketplace algorithms.</li>
                <li>Ensuring the security and integrity of the global network.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Your Rights (GDPR/CCPA)</h2>
              <p>
                As a user of the Forestry Equipment Sales network, you have the following rights:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="border border-line p-6 flex items-start space-x-4">
                  <Download className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right to Export</span>
                    <p className="text-[10px] uppercase">Download a complete record of your activity and data.</p>
                  </div>
                </div>
                <div className="border border-line p-6 flex items-start space-x-4">
                  <Trash2 className="text-accent flex-shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block mb-1">Right to Erasure</span>
                    <p className="text-[10px] uppercase">Permanently delete your account and all associated data.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. Data Retention</h2>
              <p>
                We retain your data only as long as necessary to fulfill the purposes for which it was collected, 
                including for the purposes of satisfying any legal, accounting, or reporting requirements. 
                Standard retention for transaction logs is 7 years.
              </p>
            </section>

            <section className="bg-ink text-white p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-accent">Contact Data Protection Officer</h2>
              <p className="text-white/60">
                If you have questions about this policy or wish to exercise your rights, contact our 
                Data Protection Center:
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight">
                <span>privacy@timberequip.run.app</span>
                <span>+1 (800) 846-2373</span>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
