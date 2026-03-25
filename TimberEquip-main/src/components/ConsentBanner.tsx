import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from './ThemeContext';

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const consent = localStorage.getItem('timber_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('timber_consent', 'accepted');
    setIsVisible(false);
    // Log consent to Firestore if user is logged in
  };

  const handleDecline = () => {
    localStorage.setItem('timber_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[1000]"
        >
          <div
            className={`p-6 rounded-sm shadow-2xl backdrop-blur-md border ${
              theme === 'light'
                ? 'bg-white text-[#1C1917] border-[#E7E5E4]'
                : 'bg-[#1C1917] text-[#FAFAF9] border-white/10'
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
                className={theme === 'light' ? 'text-[#1C1917]/60 hover:text-[#1C1917]' : 'text-white/40 hover:text-white'}
              >
                <X size={20} />
              </button>
            </div>

            <p className={`text-[11px] font-medium leading-relaxed mb-6 uppercase tracking-wider ${theme === 'light' ? 'text-[#1C1917]/75' : 'text-white/60'}`}>
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
                      ? 'bg-[#F5F5F4] border border-[#E7E5E4] hover:bg-[#E7E5E4] text-[#1C1917]'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Essential Only
                </button>
              </div>
              <Link 
                to="/cookies" 
                className={`flex items-center justify-center text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  theme === 'light' ? 'text-[#1C1917]/60 hover:text-[#1C1917]' : 'text-white/40 hover:text-white'
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
