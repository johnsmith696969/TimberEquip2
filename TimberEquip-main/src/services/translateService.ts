import { API_BASE } from '../constants/api';
import { Language } from '../types';

interface TranslateBatchResponse {
  translations: string[];
}

const TARGET_LANG_MAP: Record<Language, string> = {
  EN: 'en',
  FR: 'fr',
  DE: 'de',
  ES: 'es',
  FI: 'fi',
  PL: 'pl',
  IT: 'it',
  CS: 'cs',
  RO: 'ro',
  LV: 'lv',
  PT: 'pt',
  SK: 'sk',
  ET: 'et',
  NO: 'no',
  DA: 'da',
  HU: 'hu',
  LT: 'lt',
  SV: 'sv',
};

export const translateService = {
  async translateBatch(texts: string[], language: Language): Promise<string[]> {
    const cleaned = texts.map((text) => text.trim()).filter(Boolean);
    if (cleaned.length === 0) return [];

    if (language === 'EN') {
      return cleaned;
    }

    const target = TARGET_LANG_MAP[language] || 'en';

    try {
      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: cleaned,
          target,
          source: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API failed with ${response.status}`);
      }

      const json = (await response.json()) as TranslateBatchResponse;
      if (!json || !Array.isArray(json.translations)) {
        throw new Error('Invalid translation response');
      }

      return json.translations;
    } catch (error) {
      console.warn('Falling back to source language because translation is unavailable:', error);
      return cleaned;
    }
  },
};
