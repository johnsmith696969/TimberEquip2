import React, { useState, useEffect, useRef } from 'react';
import { Suspense, lazy } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Menu, X, Sun, Moon,
  User, LogOut,
  Bookmark,
  ChevronDown,
  Facebook,
  Linkedin,
  Mail,
  Youtube,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { Currency, Language } from '../types';
import { useAuth } from './AuthContext';
import { useLocale } from './LocaleContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { appendReturnToParam, canAccessDealerOs, getDefaultAccountWorkspacePath, getListEquipmentPath, rememberSellerReturnTo } from '../utils/sellerAccess';

const ConsentBanner = lazy(() => import('./ConsentBanner').then((module) => ({ default: module.ConsentBanner })));
const BRAND_ASSET_VERSION = '20260407a';
const LIGHT_HEADER_LOGO = `/Forestry_Equipment_Sales_Light_Mode_Logo.svg?v=${BRAND_ASSET_VERSION}`;
const DARK_HEADER_LOGO = `/Forestry_Equipment_Sales_Logo_Dusk.svg?v=${BRAND_ASSET_VERSION}`;
const HEADER_LOGO_FALLBACK = `/Forestry_Equipment_Sales_Logo.png?v=${BRAND_ASSET_VERSION}`;
const FOOTER_LOGO_FALLBACK = `/Forestry_Equipment_Sales_Logo.png?v=${BRAND_ASSET_VERSION}`;
const QUICK_SEARCH_STICKY_THRESHOLD_PX = 350;

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  CAD: 'C$',
  EUR: 'EUR',
  GBP: 'GBP',
  NOK: 'NOK',
  SEK: 'SEK',
  CHF: 'CHF',
  PLN: 'PLN',
  CZK: 'CZK',
  RON: 'RON',
  DKK: 'DKK',
  HUF: 'HUF',
};

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: Language; label: string; flag: string }> = [
  { code: 'EN', label: 'English (Default)', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'FR', label: 'Francais', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'DE', label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'ES', label: 'Espanol', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'SV', label: 'Svenska', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'FI', label: 'Suomi', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'PL', label: 'Polski', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'IT', label: 'Italiano', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'CS', label: 'Cestina', flag: '\u{1F1E8}\u{1F1FF}' },
  { code: 'RO', label: 'Romana', flag: '\u{1F1F7}\u{1F1F4}' },
  { code: 'LV', label: 'Latviesu', flag: '\u{1F1F1}\u{1F1FB}' },
  { code: 'PT', label: 'Portugues', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'SK', label: 'Slovencina', flag: '\u{1F1F8}\u{1F1F0}' },
  { code: 'ET', label: 'Eesti', flag: '\u{1F1EA}\u{1F1EA}' },
  { code: 'NO', label: 'Norsk', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: 'DA', label: 'Dansk', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'HU', label: 'Magyar', flag: '\u{1F1ED}\u{1F1FA}' },
  { code: 'LT', label: 'Lietuviu', flag: '\u{1F1F1}\u{1F1F9}' },
];

const CURRENCY_OPTIONS: ReadonlyArray<{ key: string; code: Currency; label: string }> = [
  { key: 'USD', code: 'USD', label: 'US Dollar' },
  { key: 'CAD', code: 'CAD', label: 'Canadian Dollar' },
  { key: 'EUR', code: 'EUR', label: 'Euro' },
  { key: 'GBP', code: 'GBP', label: 'British Pound' },
  { key: 'SEK', code: 'SEK', label: 'Swedish Krona' },
  { key: 'NOK', code: 'NOK', label: 'Norwegian Krone' },
  { key: 'DKK', code: 'DKK', label: 'Danish Krone' },
  { key: 'CHF', code: 'CHF', label: 'Swiss Franc' },
  { key: 'PLN', code: 'PLN', label: 'Polish Zloty' },
  { key: 'CZK', code: 'CZK', label: 'Czech Koruna' },
  { key: 'RON', code: 'RON', label: 'Romanian Leu' },
  { key: 'HUF', code: 'HUF', label: 'Hungarian Forint' },
];

const updatePreferredProfile = (uid: string, updates: { preferredLanguage?: Language; preferredCurrency?: Currency }) => {
  void import('../services/userService')
    .then(({ userService }) => userService.updateProfile(uid, updates))
    .catch((error) => console.warn('Unable to save profile preference:', error));
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, currency, setCurrency, t } = useLocale();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const headerLogo = theme === 'dark' ? DARK_HEADER_LOGO : LIGHT_HEADER_LOGO;
  const footerLogo = theme === 'dark' ? DARK_HEADER_LOGO : LIGHT_HEADER_LOGO;
  const headerLogoAlt = 'Forestry Equipment Sales';
  const [headerLogoSrc, setHeaderLogoSrc] = useState(headerLogo);
  const listEquipmentPath = getListEquipmentPath(user, isAuthenticated);
  const currentReturnPath = `${location.pathname}${location.search}`;
  const listEquipmentHref = appendReturnToParam(listEquipmentPath, currentReturnPath);
  const listEquipmentState = currentReturnPath.startsWith('/') ? { returnTo: currentReturnPath } : undefined;
  const handleListEquipmentClick = () => rememberSellerReturnTo(currentReturnPath);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStickyQuickSearch, setShowStickyQuickSearch] = useState(false);

  const defaultAccountWorkspacePath = getDefaultAccountWorkspacePath(user);
  const accountRoute = isAuthenticated ? defaultAccountWorkspacePath : '/login';
  const hasAdminAccess = defaultAccountWorkspacePath === '/admin';
  const hasDealerOsAccess = canAccessDealerOs(user) && !hasAdminAccess;
  const footerSocialLinks = [
    { icon: Facebook, label: 'Facebook', url: 'https://www.facebook.com/ForestryEquipmentSales' },
    { icon: Youtube, label: 'YouTube', url: 'https://www.youtube.com/@ForestryequipmentsalesOnline' },
    { icon: Linkedin, label: 'LinkedIn', url: 'https://linkedin.com/company/forestryequipmentsales' },
    { icon: Mail, label: 'Email', url: 'mailto:info@forestryequipmentsales.com' },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let animationFrame = 0;
    const updateStickyQuickSearch = () => {
      animationFrame = 0;
      setShowStickyQuickSearch(window.scrollY >= QUICK_SEARCH_STICKY_THRESHOLD_PX);
    };
    const onScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateStickyQuickSearch);
    };

    updateStickyQuickSearch();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    setHeaderLogoSrc(headerLogo);
  }, [headerLogo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = searchQuery.trim();
    navigate(normalized ? `/search?q=${encodeURIComponent(normalized)}` : '/search');
  };

  const quickSearchTapStyle: React.CSSProperties = {
    WebkitTapHighlightColor: 'transparent',
  };

  const renderQuickSearchBar = (placement: 'inline' | 'sticky' = 'inline') => (
    <div
      className={`py-2 px-4 md:px-8 border-b border-line ${
        placement === 'sticky'
          ? 'bg-bg/95 shadow-[0_18px_40px_rgba(28,25,23,0.10)] backdrop-blur-xl'
          : 'bg-bg'
      }`}
      style={quickSearchTapStyle}
    >
      <div className="max-w-[900px] mx-auto flex items-center">
        <form
          onSubmit={handleSearch}
          className="flex-1 flex items-center bg-surface border border-line rounded-sm outline-none ring-0 transition-all duration-200 focus-within:border-accent/50 focus-within:shadow-[0_0_24px_rgba(22,163,74,0.12)] focus-within:outline-none focus-within:ring-0"
          style={{
            ...quickSearchTapStyle,
          }}
        >
          <input
            type="text"
            aria-label="Search equipment"
            placeholder={t('layout.quickSearchPlaceholder', 'Quick search equipment…')}
            className="bg-transparent border-none font-medium focus:ring-0 focus:outline-none w-full px-4 py-2.5 placeholder:text-muted/50 text-ink appearance-none"
            style={{
              ...quickSearchTapStyle,
              fontSize: '16px',
              boxShadow: 'none',
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            aria-label="Search"
            className="p-2.5 text-muted hover:text-accent transition-colors flex-shrink-0 shadow-none outline-none ring-0 focus:outline-none focus:ring-0"
            style={quickSearchTapStyle}
          >
            <Search size={16} />
          </button>
        </form>
      </div>
    </div>
  );

  const [selectedCurrencyKey, setSelectedCurrencyKey] = useState<string>(() => {
    const initial = CURRENCY_OPTIONS.find((option) => option.code === currency) || CURRENCY_OPTIONS[0];
    return initial.key;
  });
  const selectedLanguage = LANGUAGE_OPTIONS.find((option) => option.code === language) || LANGUAGE_OPTIONS[0];
  const selectedCurrency = CURRENCY_OPTIONS.find((c) => c.key === selectedCurrencyKey) || CURRENCY_OPTIONS[0];
  const selectedCurrencySymbol = CURRENCY_SYMBOLS[selectedCurrency.code] || selectedCurrency.code;
  const hydratedProfileUidRef = useRef<string | null>(null);
  const selectorButtonClass = 'flex items-center gap-2 min-h-[44px] min-w-[44px] p-2 rounded hover:bg-line/50 transition-colors text-muted text-[9px] font-bold';
  const selectorMenuClass = 'absolute top-full left-0 mt-1 bg-surface border border-line rounded shadow-lg z-50';

  useEffect(() => {
    const found = CURRENCY_OPTIONS.find((option) => option.code === currency);
    if (found && found.key !== selectedCurrencyKey) {
      setSelectedCurrencyKey(found.key);
    }
  }, [currency, selectedCurrencyKey]);

  useEffect(() => {
    if (!user?.uid) {
      hydratedProfileUidRef.current = null;
      return;
    }

    if (hydratedProfileUidRef.current === user.uid) return;
    hydratedProfileUidRef.current = user.uid;

    if (user.preferredLanguage) {
      setLanguage(user.preferredLanguage);
    }
    if (user.preferredCurrency) {
      setCurrency(user.preferredCurrency);
    }
  }, [setCurrency, setLanguage, user?.preferredCurrency, user?.preferredLanguage, user?.uid]);

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currDropdownOpen, setCurrDropdownOpen] = useState(false);
  const mobileMenuTrapRef = useFocusTrap(isMenuOpen);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:px-6 focus:py-3 focus:bg-accent focus:text-white focus:text-sm focus:font-bold focus:uppercase focus:tracking-wider">
        Skip to main content
      </a>
      {/* Top Bar */}
      <div className="bg-surface border-b border-line py-2.5 px-3 md:px-8 flex justify-between items-center gap-2 text-[11px] font-medium uppercase tracking-wider">
        <div className="flex items-center gap-1 sm:gap-4 min-w-0">
          <div className="relative" data-no-translate="true">
            <button
              onClick={() => {
                setLangDropdownOpen(!langDropdownOpen);
                setCurrDropdownOpen(false);
              }}
              className={selectorButtonClass}
              aria-label={t('layout.languageLabel', 'Language')}
              aria-expanded={langDropdownOpen}
              aria-haspopup="listbox"
              title={selectedLanguage.label}
            >
              <span className="sm:hidden">{selectedLanguage.code}</span>
              <span className="hidden sm:inline text-sm">{selectedLanguage.flag}</span>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span>{selectedLanguage.code}</span>
                <span className="text-[8px] font-normal text-muted/70">{selectedLanguage.label}</span>
              </div>
              <ChevronDown size={12} className="shrink-0" />
            </button>
            {langDropdownOpen && (
              <div role="listbox" aria-label={t('layout.languageLabel', 'Language')} className={`${selectorMenuClass} min-w-[180px]`}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={language === lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      if (user?.uid) {
                        updatePreferredProfile(user.uid, { preferredLanguage: lang.code });
                      }
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[9px] font-bold flex items-center gap-2 hover:bg-line transition-colors ${
                      language === lang.code ? 'bg-line text-accent' : 'text-muted'
                    }`}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span>{lang.code}</span>
                        <span className="text-[8px] font-normal text-muted/70">{lang.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" data-no-translate="true">
            <button
              onClick={() => {
                setCurrDropdownOpen(!currDropdownOpen);
                setLangDropdownOpen(false);
              }}
              className={selectorButtonClass}
              aria-label={t('layout.currencyLabel', 'Currency')}
              aria-expanded={currDropdownOpen}
              aria-haspopup="listbox"
              title={selectedCurrency.label}
            >
              <span className="sm:hidden">{selectedCurrencySymbol}</span>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span>{selectedCurrency.code}</span>
                <span className="text-[8px] font-normal text-muted/70">{selectedCurrency.label}</span>
              </div>
              <ChevronDown size={12} className="shrink-0" />
            </button>
            {currDropdownOpen && (
              <div role="listbox" aria-label={t('layout.currencyLabel', 'Currency')} className={`${selectorMenuClass} min-w-[150px] max-h-72 overflow-y-auto`}>
                {CURRENCY_OPTIONS.map((curr) => (
                  <button
                    key={curr.key}
                    role="option"
                    aria-selected={selectedCurrencyKey === curr.key}
                    onClick={() => {
                      setSelectedCurrencyKey(curr.key);
                      setCurrency(curr.code);
                      if (user?.uid) {
                        updatePreferredProfile(user.uid, { preferredCurrency: curr.code });
                      }
                      setCurrDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[9px] font-bold flex items-center gap-2 hover:bg-line transition-colors ${
                      selectedCurrencyKey === curr.key ? 'bg-line text-accent' : 'text-muted'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{curr.code}</span>
                      <span className="text-[8px] font-normal text-muted/70">{curr.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-1 text-muted hover:text-ink transition-colors py-1 px-1"
            aria-label={theme === 'light' ? t('layout.duskMode', 'Dusk Mode') : t('layout.lightMode', 'Light Mode')}
            title={theme === 'light' ? t('layout.duskMode', 'Dusk Mode') : t('layout.lightMode', 'Light Mode')}
          >
            {theme === 'light' ? <Moon size={14} className="sm:w-3 sm:h-3" /> : <Sun size={14} className="sm:w-3 sm:h-3" />}
            <span className="hidden sm:inline">{theme === 'light' ? t('layout.duskMode', 'Dusk Mode') : t('layout.lightMode', 'Light Mode')}</span>
          </button>
          <Link to={listEquipmentHref} state={listEquipmentState} onClick={handleListEquipmentClick} className="text-accent-link font-bold hover:underline">{t('layout.sellEquipment', 'Sell Equipment')}</Link>
          {hasDealerOsAccess ? <Link to="/dealer-os" className="text-ink font-bold hover:underline">DealerOS</Link> : null}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to={accountRoute} className="text-ink font-bold flex items-center">
                <User size={12} className="mr-1" /> {user?.displayName}
              </Link>
              <button onClick={logout} className="text-muted hover:text-ink flex items-center">
                <LogOut size={12} className="mr-1" /> {t('layout.logout', 'Logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-ink hover:text-accent font-black py-1 px-1">{t('layout.login', 'Login')}</Link>
          )}
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-bg border-b border-line py-4 px-4 md:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img
            src={headerLogoSrc}
            alt={headerLogoAlt}
            width={200}
            height={64}
            className="h-14 md:h-16 w-auto object-contain"
            onError={() => {
              setHeaderLogoSrc((current) => current === HEADER_LOGO_FALLBACK ? current : HEADER_LOGO_FALLBACK);
            }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest">
          <Link to="/search" className="hover:text-accent transition-colors">{t('layout.inventory', 'Inventory')}</Link>
          <Link to="/categories" className="hover:text-accent transition-colors">{t('layout.categories', 'Categories')}</Link>
          <Link to="/ad-programs" className="hover:text-accent transition-colors text-accent-link">{t('layout.adPrograms', 'Ad Programs')}</Link>
          <Link to="/auctions" className="hover:text-accent transition-colors">{t('layout.auctions', 'Auctions')}</Link>
          <Link to="/financing" className="hover:text-accent transition-colors">{t('layout.financing', 'Financing')}</Link>
          <Link to="/dealers" className="hover:text-accent transition-colors">{t('layout.dealerNetwork', 'Dealers')}</Link>
          <Link to="/blog" className="hover:text-accent transition-colors">{t('layout.equipmentNews', 'Equipment News')}</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link to="/bookmarks" className="p-2 text-muted hover:text-ink relative focus:ring-2 focus:ring-accent focus:ring-offset-2" aria-label="Bookmarks">
            <Bookmark size={20} />
            {isAuthenticated && (user?.favorites?.length ?? 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            )}
          </Link>
          
          <button
            className="lg:hidden p-2 text-ink focus:ring-2 focus:ring-accent focus:ring-offset-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Persistent Quick Search Bar */}
      {renderQuickSearchBar()}

      <AnimatePresence>
        {showStickyQuickSearch && !isMenuOpen && (
          <motion.div
            key="sticky-quick-search"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed left-0 right-0 top-0 z-[45]"
            aria-label="Sticky quick search"
          >
            {renderQuickSearchBar('sticky')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={mobileMenuTrapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
             className="fixed inset-0 bg-bg z-[100] overflow-y-auto flex flex-col shadow-2xl"
          >
            <button
              className="absolute top-6 right-6 p-3 bg-surface border border-line rounded-sm text-ink hover:bg-ink hover:text-bg transition-colors"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            
             <div className="flex flex-col space-y-8 text-2xl font-black tracking-tighter uppercase pt-20 px-6">
              <Link to="/search" onClick={() => setIsMenuOpen(false)}>{t('layout.inventory', 'Inventory')}</Link>
              <Link to="/categories" onClick={() => setIsMenuOpen(false)}>{t('layout.categories', 'Categories')}</Link>
              <Link to="/manufacturers" onClick={() => setIsMenuOpen(false)}>Manufacturers</Link>
              <Link to="/states" onClick={() => setIsMenuOpen(false)}>Browse by State</Link>
              <Link to="/ad-programs" onClick={() => setIsMenuOpen(false)} className="text-accent-link">{t('layout.adPrograms', 'Ad Programs')}</Link>
              <Link to="/auctions" onClick={() => setIsMenuOpen(false)}>{t('layout.auctions', 'Auctions')}</Link>
              <Link to="/financing" onClick={() => setIsMenuOpen(false)}>{t('layout.financing', 'Financing')}</Link>
              <Link to="/dealers" onClick={() => setIsMenuOpen(false)}>{t('layout.dealerNetwork', 'Dealers')}</Link>
              <Link to="/blog" onClick={() => setIsMenuOpen(false)}>{t('layout.equipmentNews', 'Equipment News')}</Link>
              <Link to={listEquipmentHref} state={listEquipmentState} onClick={() => { handleListEquipmentClick(); setIsMenuOpen(false); }} className="text-accent-link">{t('layout.sellEquipment', 'Sell Equipment')}</Link>
            </div>
            
             <div className="mt-8 pb-12 px-6 flex flex-col space-y-6">
              <div className="border-t border-line pt-6 space-y-4" data-no-translate="true">
                <div>
                  <span className="label-micro block mb-3">{t('layout.languageLabel', 'Language')}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={`mobile-lang-${lang.code}`}
                        onClick={() => {
                          setLanguage(lang.code);
                          if (user?.uid) {
                            updatePreferredProfile(user.uid, { preferredLanguage: lang.code });
                          }
                        }}
                        className={`px-2 py-2 rounded-sm border text-left text-[10px] font-bold flex items-start gap-2 transition-colors ${
                          language === lang.code ? 'border-accent text-accent bg-accent/5' : 'border-line text-muted hover:bg-surface'
                        }`}
                      >
                        <span className="text-sm">{lang.flag}</span>
                        <div className="flex flex-col leading-none">
                          <span>{lang.code}</span>
                          <span className="text-[8px] font-normal text-muted/70">{lang.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="label-micro block mb-3">{t('layout.currencyLabel', 'Currency')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {CURRENCY_OPTIONS.map((curr) => (
                      <button
                        key={`mobile-curr-${curr.key}`}
                        onClick={() => {
                          setSelectedCurrencyKey(curr.key);
                          setCurrency(curr.code);
                          if (user?.uid) {
                            updatePreferredProfile(user.uid, { preferredCurrency: curr.code });
                          }
                        }}
                        className={`px-2 py-2 rounded-sm border text-left text-[10px] font-bold transition-colors ${
                          selectedCurrencyKey === curr.key ? 'border-accent text-accent bg-accent/5' : 'border-line text-muted hover:bg-surface'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{curr.code}</span>
                          <span className="text-[8px] font-normal text-muted/70">{curr.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-6">
                <span className="label-micro">{t('layout.theme', 'Theme')}</span>
                <button onClick={toggleTheme} className="p-2 bg-surface rounded-full" aria-label={theme === 'light' ? 'Switch to dusk mode' : 'Switch to light mode'}>
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              </div>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-industrial w-full py-4 text-center">{t('layout.login', 'Login')}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main id="main" className="flex-1">
        {children}
      </main>

      <Suspense fallback={null}>
        <ConsentBanner />
      </Suspense>

      {/* Footer */}
      <footer className="bg-surface border-t border-line pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2 flex flex-col space-y-8">
              <Link to="/" className="flex items-center">
                <img
                  src={footerLogo}
                  alt="Forestry Equipment Sales"
                  width={180}
                  height={48}
                  className="h-12 w-auto max-w-[180px] object-contain"
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.src.includes('Forestry_Equipment_Sales_Favicon_512x512.png')) return;
                    target.src = FOOTER_LOGO_FALLBACK;
                  }}
                />
              </Link>
              <p className="text-sm text-muted leading-relaxed max-w-md">
                {t('layout.footerBlurb', 'The premier industrial marketplace for professional logging equipment. Connecting global forestry operations with verified assets, institutional financing, and precision logistics.')}
              </p>
              <div className="flex flex-wrap gap-4">
                {footerSocialLinks.map(({ icon: Icon, label, url }) => (
                  <a 
                    key={label} 
                    href={url}
                    aria-label={label}
                    title={label}
                    target={url.startsWith('http') ? '_blank' : undefined}
                    rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="w-10 h-10 border border-line flex items-center justify-center hover:bg-ink hover:text-bg transition-all group"
                  >
                    <Icon size={18} className="group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 text-ink">{t('layout.marketplace', 'Marketplace')}</h4>
              <ul className="flex flex-col space-y-4 text-xs font-bold text-muted uppercase tracking-widest">
                <li><Link to="/search" className="hover:text-accent transition-colors">{t('layout.browseInventory', 'Browse Inventory')}</Link></li>
                <li><Link to="/categories" className="hover:text-accent transition-colors">{t('layout.categories', 'Categories')}</Link></li>
                <li><Link to="/manufacturers" className="hover:text-accent transition-colors">Manufacturers</Link></li>
                <li><Link to="/states" className="hover:text-accent transition-colors">Browse by State</Link></li>
                <li><Link to="/auctions" className="hover:text-accent transition-colors">{t('layout.liveAuctions', 'Live Auctions')}</Link></li>
                <li><Link to={listEquipmentHref} state={listEquipmentState} onClick={handleListEquipmentClick} className="hover:text-accent transition-colors">{t('layout.sellEquipment', 'Sell Equipment')}</Link></li>
                <li><Link to="/financing" className="hover:text-accent transition-colors">{t('layout.financingCenter', 'Financing Center')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 text-ink">{t('layout.partnership', 'Partnership')}</h4>
              <ul className="flex flex-col space-y-4 text-xs font-bold text-muted uppercase tracking-widest">
                <li><Link to="/ad-programs" className="hover:text-accent transition-colors text-accent-link">{t('layout.adPrograms', 'Ad Programs')}</Link></li>
                <li><Link to="/dealers" className="hover:text-accent transition-colors">{t('layout.dealerNetwork', 'Dealer Network')}</Link></li>
                <li><Link to="/logistics" className="hover:text-accent transition-colors">{t('layout.globalLogistics', 'Global Logistics')}</Link></li>
                <li><Link to="/blog" className="hover:text-accent transition-colors">{t('layout.equipmentNews', 'Equipment News')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 text-ink">About</h4>
              <ul className="flex flex-col space-y-4 text-xs font-bold text-muted uppercase tracking-widest">
                <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
                <li><Link to="/our-team" className="hover:text-accent transition-colors">Our Team</Link></li>
                <li><Link to="/faq" className="hover:text-accent transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 text-ink">{t('layout.support', 'Support')}</h4>
              <div className="flex flex-col space-y-6">
                <div className="bg-bg border border-line p-5 rounded-sm">
                  <span className="label-micro block mb-2">{t('layout.customerSupport', 'Customer Support')}</span>
                  <a
                    href="tel:+12187200933"
                    className="text-sm font-black tracking-tight hover:text-accent transition-colors block"
                  >
                    (218) 720-0933
                  </a>
                  <a
                    href="mailto:support@forestryequipmentsales.com"
                    className="mt-2 block break-all text-xs font-semibold normal-case tracking-normal text-muted transition-colors hover:text-accent"
                  >
                    support@forestryequipmentsales.com
                  </a>
                </div>
                <div className="bg-bg border border-line p-5 rounded-sm">
                  <span className="label-micro block mb-2">{t('layout.systemStatus', 'System Status')}</span>
                  <span className="text-[10px] font-black text-data flex items-center tracking-widest">
                    <span className="w-2 h-2 bg-data rounded-full mr-2 animate-pulse"></span>
                    {t('layout.active', 'ACTIVE')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-24 pt-12 border-t border-line flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
            <div className="flex items-center space-x-4">
              <span>{t('layout.siteCopyright', '© 2026 FORESTRY EQUIPMENT SALES | LOGGING EQUIPMENT MARKETPLACE.')}</span>
              <span className="hidden md:inline text-line">|</span>
              <span className="text-ink">FORESTRY EQUIPMENT SALES</span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-6 md:mt-0">
              <Link to="/privacy" className="hover:text-ink transition-colors inline-flex items-center min-h-[44px]">{t('layout.privacyPolicy', 'Privacy Policy')}</Link>
              <Link to="/terms" className="hover:text-ink transition-colors inline-flex items-center min-h-[44px]">{t('layout.termsOfService', 'Terms of Service')}</Link>
              <Link to="/cookies" className="hover:text-ink transition-colors inline-flex items-center min-h-[44px]">{t('layout.cookiePolicy', 'Cookie Policy')}</Link>
              <Link to="/dmca" className="hover:text-ink transition-colors inline-flex items-center min-h-[44px]">{t('layout.dmcaPolicy', 'DMCA Policy')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

