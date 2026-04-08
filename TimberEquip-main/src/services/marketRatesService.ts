export interface RatePoint {
  value: number;
  asOf: string;
  source: 'fred' | 'nyfed' | 'treasury' | 'firebase' | 'fallback';
}

export interface MarketRates {
  primeRate: RatePoint;
  sofr: RatePoint;
  treasury5y: RatePoint;
  treasury10y: RatePoint;
  equipmentLendingEst: RatePoint;
}

const FALLBACKS: MarketRates = {
  primeRate: { value: 7.5, asOf: '2026-01-15', source: 'fallback' },
  sofr: { value: 4.33, asOf: '2026-01-15', source: 'fallback' },
  treasury5y: { value: 4.2, asOf: '2026-01-15', source: 'fallback' },
  treasury10y: { value: 4.5, asOf: '2026-01-15', source: 'fallback' },
  equipmentLendingEst: { value: 9.0, asOf: '2026-01-15', source: 'fallback' },
};

let cache: { rates: MarketRates; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

function isRatePoint(value: unknown): value is RatePoint {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.value === 'number' && typeof v.asOf === 'string' && typeof v.source === 'string';
}

function isMarketRates(value: unknown): value is MarketRates {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isRatePoint(v.primeRate) &&
    isRatePoint(v.sofr) &&
    isRatePoint(v.treasury5y) &&
    isRatePoint(v.treasury10y) &&
    isRatePoint(v.equipmentLendingEst)
  );
}

export const marketRatesService = {
  async getRates(): Promise<MarketRates> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return cache.rates;
    }

    try {
      const response = await fetch('/api/market-rates', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Market rates API failed with ${response.status}`);
      }

      const json = await response.json();
      if (!isMarketRates(json)) {
        throw new Error('Invalid market rates payload');
      }

      cache = { rates: json, fetchedAt: Date.now() };
      return json;
    } catch (error) {
      console.error('Failed to load market rates:', error);
      cache = { rates: FALLBACKS, fetchedAt: Date.now() };
      return FALLBACKS;
    }
  },

  async getEquipmentApr(): Promise<{ rate: number; source: string }> {
    try {
      const rates = await this.getRates();
      return {
        rate: rates.equipmentLendingEst.value,
        source: rates.equipmentLendingEst.source === 'fallback' ? 'fallback' : 'live',
      };
    } catch (err) {
      console.warn('Market rates fetch failed, using fallback:', err);
      return { rate: FALLBACKS.equipmentLendingEst.value, source: 'fallback' };
    }
  },
};
