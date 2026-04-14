export const AMV_MATCH_PRICE_PERCENT = 10;
export const AMV_MATCH_HOURS_PERCENT = 10;
export const AMV_MATCH_YEAR_RANGE = 2;
export const AMV_MIN_COMPARABLES = 1;

export function isWithinPercentRange(value: number, target: number, percent: number): boolean {
  if (!Number.isFinite(value) || !Number.isFinite(target)) {
    return false;
  }

  if (target === 0) {
    return value === 0;
  }

  return Math.abs(value - target) <= Math.abs(target) * (percent / 100);
}

export function getAmvMatchRulesSummary(): string {
  return `Same manufacturer and model, within ${AMV_MATCH_YEAR_RANGE} years, within ${AMV_MATCH_PRICE_PERCENT}% price, and within ${AMV_MATCH_HOURS_PERCENT}% hours.`;
}

export function getAmvInsufficientComparableMessage(): string {
  return `AMV is N/A for this machine because there are fewer than ${AMV_MIN_COMPARABLES} comparable listings that match ${getAmvMatchRulesSummary().toLowerCase()}`;
}
