import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const CONSENT_KEY = 'timber_consent';
const CONSENT_VERSION = '1.2.0';

/** Event name dispatched to reopen the banner (used by Cookies page "Manage Cookies" button) */
export const REOPEN_CONSENT_EVENT = 'timber:reopen-consent';

async function logConsentToFirestore(userUid: string, decision: 'accepted' | 'declined') {
  try {
    await addDoc(collection(db, 'consentLogs'), {
      userUid,
      type: 'cookie_consent',
      decision,
      version: CONSENT_VERSION,
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Failed to log consent:', error);
  }
}

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();

  const showBanner = useCallback(() => setIsVisible(true), []);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for reopen events (from "Manage Cookies" button on /cookies page)
  useEffect(() => {
    window.addEventListener(REOPEN_CONSENT_EVENT, showBanner);
    return () => window.removeEventListener(REOPEN_CONSENT_EVENT, showBanner);
  }, [showBanner]);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setIsVisible(false);
    if (user?.uid) {
      logConsentToFirestore(user.uid, 'accepted');
    }
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setIsVisible(false);
    if (user?.uid) {
      logConsentToFirestore(user.uid, 'declined');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-30"
        >
          <div
            className={`p-6 rounded-sm shadow-2xl backdrop-blur-md border ${
              theme === 'light'
                ? 'bg-white text-ink border-line'
                : 'bg-ink text-bg border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <Cookie className="text-accent" size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Cookie Policy</h3>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                aria-label="Close cookie banner"
                className={theme === 'light' ? 'text-ink/60 hover:text-ink' : 'text-white/40 hover:text-white'}
              >
                <X size={20} />
              </button>
            </div>

            <p className={`text-[11px] font-medium leading-relaxed mb-6 uppercase tracking-wider ${theme === 'light' ? 'text-muted' : 'text-white/70'}`}>
              We use cookies to enhance your marketplace experience and ensure site integrity.
              By continuing, you agree to our cookie policies.
            </p>

            <div className="flex flex-col space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 btn-industrial btn-accent py-3 text-[10px]"
                >
                  Accept All
                </button>
                <button
                  onClick={handleDecline}
                  className={`flex-1 btn-industrial py-3 text-[10px] ${
                    theme === 'light'
                      ? 'bg-surface border border-line hover:bg-line text-ink'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Essential Only
                </button>
              </div>
              <Link
                to="/cookies"
                className={`flex items-center justify-center text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  theme === 'light' ? 'text-ink/60 hover:text-ink' : 'text-white/40 hover:text-white'
                }`}
                onClick={() => setIsVisible(false)}
              >
                Review Cookie Policy <ExternalLink size={10} className="ml-2" />
              </Link>
            </div>

            <div className={`mt-6 pt-4 flex items-center space-x-2 text-[9px] font-bold text-data uppercase tracking-widest ${theme === 'light' ? 'border-t border-line' : 'border-t border-white/5'}`}>
              <ShieldCheck size={12} />
              <span>GDPR & CCPA COMPLIANT SYSTEM</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
