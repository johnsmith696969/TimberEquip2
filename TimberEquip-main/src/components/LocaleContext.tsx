import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Currency, Language } from '../types';
import { translateService } from '../services/translateService';
import { API_BASE } from '../constants/api';

interface LocaleContextValue {
  language: Language;
  currency: Currency;
  locale: string;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string, fallback?: string) => string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number, currency?: string, maximumFractionDigits?: number) => string;
  formatPrice: (value: number, sourceCurrency?: string, maximumFractionDigits?: number) => string;
}

const LANGUAGE_STORAGE_KEY = 'language';
const CURRENCY_STORAGE_KEY = 'currency';
const DEFAULT_CURRENCY: Currency = 'USD';

const LOCALE_MAP: Record<Language, string> = {
  EN: 'en-US',
  FR: 'fr-FR',
  DE: 'de-DE',
  ES: 'es-ES',
  FI: 'fi-FI',
  PL: 'pl-PL',
  IT: 'it-IT',
  CS: 'cs-CZ',
  RO: 'ro-RO',
  LV: 'lv-LV',
  PT: 'pt-PT',
  SK: 'sk-SK',
  ET: 'et-EE',
  NO: 'nb-NO',
  DA: 'da-DK',
  HU: 'hu-HU',
  LT: 'lt-LT',
  SV: 'sv-SE',
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
type RatesMap = Record<string, number>;

const ATTRIBUTE_NAMES = ['placeholder', 'title', 'aria-label'] as const;
const TRANSLATION_BATCH_SIZE = 40;

type TranslatableAttribute = (typeof ATTRIBUTE_NAMES)[number];
type TextEntry = { kind: 'text'; node: Text; original: string; core: string };
type AttributeEntry = {
  kind: 'attribute';
  element: HTMLElement;
  attribute: TranslatableAttribute;
  original: string;
  core: string;
};
type OptionEntry = { kind: 'option'; option: HTMLOptionElement; original: string; core: string };
type TranslationEntry = TextEntry | AttributeEntry | OptionEntry;

function getCoreText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function hasTranslatableText(value: string): boolean {
  return /[A-Za-z\u00C0-\u024F]/.test(value);
}

function applyWhitespace(original: string, translated: string): string {
  const prefix = original.match(/^\s*/)?.[0] || '';
  const suffix = original.match(/\s*$/)?.[0] || '';
  return `${prefix}${translated}${suffix}`;
}

function isExcludedElement(element: Element | null): boolean {
  if (!element) return true;
  if (element.closest('[data-no-translate="true"], .notranslate')) return true;

  const tagName = element.tagName;
  return (
    tagName === 'SCRIPT' ||
    tagName === 'STYLE' ||
    tagName === 'NOSCRIPT' ||
    tagName === 'CODE' ||
    tagName === 'PRE' ||
    tagName === 'KBD' ||
    tagName === 'SAMP' ||
    tagName === 'TEXTAREA' ||
    tagName === 'INPUT' ||
    tagName === 'SELECT' ||
    tagName === 'OPTION' ||
    tagName === 'SVG'
  );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'EN';
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    return saved && LOCALE_MAP[saved] ? saved : 'EN';
  });
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === 'undefined') return DEFAULT_CURRENCY;
    const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
    return saved || DEFAULT_CURRENCY;
  });
  const [ratesByUsd, setRatesByUsd] = useState<RatesMap>({ USD: 1 });
  const textOriginalsRef = useRef(new WeakMap<Text, string>());
  const attributeOriginalsRef = useRef(new WeakMap<HTMLElement, Partial<Record<TranslatableAttribute, string>>>());
  const optionOriginalsRef = useRef(new WeakMap<HTMLOptionElement, string>());
  const titleOriginalRef = useRef<string>('');
  const titleInitializedRef = useRef(false);
  const translationCacheRef = useRef(new Map<string, string>());
  const scanTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const locale = LOCALE_MAP[language];

  const restoreOriginalContent = () => {
    if (typeof document === 'undefined') return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode() as Text | null;
    while (textNode) {
      const original = textOriginalsRef.current.get(textNode);
      if (original !== undefined && textNode.nodeValue !== original) {
        textNode.nodeValue = original;
      }
      textNode = walker.nextNode() as Text | null;
    }

    const elements = document.body.querySelectorAll<HTMLElement>('*');
    elements.forEach((element) => {
      const originals = attributeOriginalsRef.current.get(element);
      if (!originals) return;

      ATTRIBUTE_NAMES.forEach((attribute) => {
        const original = originals[attribute];
        if (original !== undefined) {
          element.setAttribute(attribute, original);
        }
      });
    });

    const options = document.body.querySelectorAll('option');
    options.forEach((option) => {
      const original = optionOriginalsRef.current.get(option);
      if (original !== undefined) {
        option.textContent = original;
      }
    });

    if (titleInitializedRef.current) {
      document.title = titleOriginalRef.current;
    }
  };

  const collectTranslationEntries = (): TranslationEntry[] => {
    if (typeof document === 'undefined' || !document.body) return [];

    const entries: TranslationEntry[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode() as Text | null;
    while (textNode) {
      const parent = textNode.parentElement;
      if (!parent || isExcludedElement(parent)) {
        textNode = walker.nextNode() as Text | null;
        continue;
      }

      if (!textOriginalsRef.current.has(textNode)) {
        textOriginalsRef.current.set(textNode, textNode.nodeValue || '');
      }

      const original = textOriginalsRef.current.get(textNode) || '';
      const core = getCoreText(original);
      if (core && hasTranslatableText(core)) {
        entries.push({ kind: 'text', node: textNode, original, core });
      }

      textNode = walker.nextNode() as Text | null;
    }

    const elements = document.body.querySelectorAll<HTMLElement>('*');
    elements.forEach((element) => {
      if (isExcludedElement(element)) return;

      ATTRIBUTE_NAMES.forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;

        const current = element.getAttribute(attribute) || '';
        let originals = attributeOriginalsRef.current.get(element);
        if (!originals) {
          originals = {};
          attributeOriginalsRef.current.set(element, originals);
        }
        if (originals[attribute] === undefined) {
          originals[attribute] = current;
        }

        const original = originals[attribute] || '';
        const core = getCoreText(original);
        if (core && hasTranslatableText(core)) {
          entries.push({ kind: 'attribute', element, attribute, original, core });
        }
      });
    });

    const options = document.body.querySelectorAll('option');
    options.forEach((option) => {
      if (option.closest('[data-no-translate="true"], .notranslate')) return;
      if (!optionOriginalsRef.current.has(option)) {
        optionOriginalsRef.current.set(option, option.textContent || '');
      }

      const original = optionOriginalsRef.current.get(option) || '';
      const core = getCoreText(original);
      if (core && hasTranslatableText(core)) {
        entries.push({ kind: 'option', option, original, core });
      }
    });

    return entries;
  };

  const translateEntries = async (entries: TranslationEntry[], activeRequestId: number) => {
    const uniqueTexts = Array.from(new Set(entries.map((entry) => entry.core))).filter(Boolean);
    const missingTexts = uniqueTexts.filter((text) => !translationCacheRef.current.has(`${language}::${text}`));

    for (let index = 0; index < missingTexts.length; index += TRANSLATION_BATCH_SIZE) {
      const batch = missingTexts.slice(index, index + TRANSLATION_BATCH_SIZE);
      const translations = await translateService.translateBatch(batch, language);
      batch.forEach((text, batchIndex) => {
        translationCacheRef.current.set(`${language}::${text}`, translations[batchIndex] || text);
      });
    }

    if (requestIdRef.current !== activeRequestId) return;

    entries.forEach((entry) => {
      const translated = translationCacheRef.current.get(`${language}::${entry.core}`) || entry.core;

      if (entry.kind === 'text') {
        entry.node.nodeValue = applyWhitespace(entry.original, translated);
        return;
      }

      if (entry.kind === 'attribute') {
        entry.element.setAttribute(entry.attribute, applyWhitespace(entry.original, translated));
        return;
      }

      entry.option.textContent = applyWhitespace(entry.original, translated);
    });
  };

  const scheduleDomTranslation = () => {
    if (typeof window === 'undefined') return;
    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
    }

    scanTimerRef.current = window.setTimeout(() => {
      void (async () => {
        if (language === 'EN') {
          restoreOriginalContent();
          return;
        }

        if (typeof document === 'undefined') return;
        if (!titleInitializedRef.current) {
          titleOriginalRef.current = document.title;
          titleInitializedRef.current = true;
        }

        const currentRequestId = ++requestIdRef.current;
        const entries = collectTranslationEntries();
        const titleCore = getCoreText(titleOriginalRef.current || document.title);

        try {
          if (titleCore && hasTranslatableText(titleCore)) {
            const cacheKey = `${language}::${titleCore}`;
            if (!translationCacheRef.current.has(cacheKey)) {
              const [translatedTitle] = await translateService.translateBatch([titleCore], language);
              translationCacheRef.current.set(cacheKey, translatedTitle || titleCore);
            }
            if (requestIdRef.current === currentRequestId) {
              document.title = translationCacheRef.current.get(cacheKey) || titleCore;
            }
          }

          await translateEntries(entries, currentRequestId);
        } catch (error) {
          console.error('DOM translation failed:', error);
        }
      })();
    }, 80);
  };

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = locale;
  }, [language, locale]);

  useEffect(() => {
    if (typeof window === 'undefined' || !document.body) return;

    scheduleDomTranslation();

    const observer = new MutationObserver(() => {
      scheduleDomTranslation();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => {
      observer.disconnect();
      if (scanTimerRef.current !== null) {
        window.clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }
    };
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      try {
        const response = await fetch(`${API_BASE}/currency-rates?base=USD`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`Currency rates API failed with ${response.status}`);
        }
        const json = await response.json();
        const rates = (json?.rates || {}) as RatesMap;
        if (!cancelled && rates && typeof rates === 'object' && Object.keys(rates).length > 0) {
          setRatesByUsd({ USD: 1, ...rates });
        }
      } catch (error) {
        console.error('Failed to load currency rates:', error);
      }
    };

    void loadRates();
    const intervalId = window.setInterval(() => {
      void loadRates();
    }, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const convertAmount = (value: number, fromCurrency: string, toCurrency: string): number => {
    const from = String(fromCurrency || 'USD').toUpperCase();
    const to = String(toCurrency || currency).toUpperCase();
    if (from === to) return value;

    const fromRate = ratesByUsd[from];
    const toRate = ratesByUsd[to];
    if (!fromRate || !toRate) return value;

    const inUsd = value / fromRate;
    return inUsd * toRate;
  };

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      currency,
      locale,
      setLanguage: setLanguageState,
      setCurrency: setCurrencyState,
      t: (key, fallback) => fallback || key,
      formatNumber: (raw) => new Intl.NumberFormat(locale).format(raw),
      formatCurrency: (raw, currency = 'USD', maximumFractionDigits = 0) =>
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits,
        }).format(raw),
      formatPrice: (raw, sourceCurrency = 'USD', maximumFractionDigits = 0) => {
        const converted = convertAmount(raw, sourceCurrency, currency);
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits,
        }).format(converted);
      },
    }),
    [currency, language, locale, ratesByUsd]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return context;
}
