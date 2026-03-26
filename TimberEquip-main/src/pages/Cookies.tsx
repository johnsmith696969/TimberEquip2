import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Info, Settings, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export function Cookies() {
  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
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
              Last Updated: March 21, 2026 | Version 1.2.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <Cookie className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">What are Cookies?</h3>
              <p className="text-sm text-muted leading-relaxed">
                Small data files stored on your device to enhance platform performance and 
                remember your preferences.
              </p>
            </div>
            <div className="bg-surface border border-line p-8 flex flex-col space-y-4">
              <ShieldCheck className="text-accent" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Privacy First</h3>
              <p className="text-sm text-muted leading-relaxed">
                We only use cookies that are necessary for the marketplace to function 
                or to improve your experience.
              </p>
            </div>
          </div>

          <div className="space-y-12 text-muted leading-loose font-medium">
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">1. Essential Cookies</h2>
              <p>
                These cookies are strictly necessary for the Forestry Equipment Sales platform to function. 
                They enable core features like authentication, security, and the inquiry system.
              </p>
              <div className="bg-surface border border-line p-6 flex items-start space-x-4">
                <CheckCircle2 className="text-data flex-shrink-0" size={20} />
                <div>
                  <span className="text-xs font-black uppercase tracking-widest block mb-1">Mandatory Usage</span>
                  <p className="text-[10px] uppercase">Cannot be disabled as they are required for platform integrity.</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">2. Performance Cookies</h2>
              <p>
                These cookies help us understand how the marketplace is being used. 
                They collect anonymous data to help us optimize the global network.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">3. Marketing Cookies</h2>
              <p>
                Used to deliver relevant ad programs and equipment news based on your interests. 
                These cookies require your explicit consent.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-ink">4. Managing Preferences</h2>
              <p>
                You can adjust your cookie settings at any time through the platform settings. 
                Most browsers also allow you to block or delete cookies through their own settings.
              </p>
              <button className="btn-industrial bg-surface py-4 px-8 text-xs font-black uppercase tracking-widest">
                Manage Cookies
              </button>
            </section>

            <section className="bg-ink text-white p-12 rounded-sm space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-accent">Cookie Support</h2>
              <p className="text-white/60">
                If you have questions about our use of cookies, contact our 
                Technical Support:
              </p>
              <div className="flex flex-col space-y-2 font-black tracking-tight">
                <span>support@timberequip.run.app</span>
                <span>+1 (800) 846-2373</span>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
