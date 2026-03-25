type RateResponse = {
  rate?: number;
  apr?: number;
  value?: number;
  source?: string;
  data?: {
    rate?: number;
    apr?: number;
    value?: number;
  };
};

export interface FinancingAprResult {
  rate: number;
  source: 'api' | 'fallback';
}

const FALLBACK_APR = 6.25;

function extractRate(payload: RateResponse | RateResponse[] | null | undefined): number | null {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const rate = extractRate(entry);
      if (rate !== null) return rate;
    }
    return null;
  }

  const direct = payload.rate ?? payload.apr ?? payload.value;
  if (typeof direct === 'number' && Number.isFinite(direct)) {
    return direct;
  }

  const nested = payload.data?.rate ?? payload.data?.apr ?? payload.data?.value;
  if (typeof nested === 'number' && Number.isFinite(nested)) {
    return nested;
  }

  return null;
}

export const marketDataService = {
  async getFinancingApr(): Promise<FinancingAprResult> {
    const endpoint = import.meta.env.VITE_FINANCING_APR_API_URL;
    if (!endpoint) {
      return { rate: FALLBACK_APR, source: 'fallback' };
    }

    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch APR: ${response.status}`);
      }

      const payload = (await response.json()) as RateResponse | RateResponse[];
      const rate = extractRate(payload);
      if (rate === null) {
        throw new Error('APR payload missing numeric rate');
      }

      return { rate, source: 'api' };
    } catch (error) {
      console.warn('Falling back to baseline financing APR.', error);
      return { rate: FALLBACK_APR, source: 'fallback' };
    }
  },
};