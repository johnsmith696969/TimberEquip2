import { describe, it, expect } from 'vitest';
import {
  isWithinPercentRange,
  AMV_MATCH_PRICE_PERCENT,
  AMV_MATCH_HOURS_PERCENT,
  AMV_MATCH_YEAR_RANGE,
  AMV_MIN_COMPARABLES,
  getAmvMatchRulesSummary,
  getAmvInsufficientComparableMessage,
} from '../utils/amvMatching';

describe('isWithinPercentRange', () => {
  it('returns true when value is within range', () => {
    expect(isWithinPercentRange(100, 100, 10)).toBe(true);
    expect(isWithinPercentRange(105, 100, 10)).toBe(true);
    expect(isWithinPercentRange(95, 100, 10)).toBe(true);
    expect(isWithinPercentRange(110, 100, 10)).toBe(true);
  });

  it('returns false when value is outside range', () => {
    expect(isWithinPercentRange(111, 100, 10)).toBe(false);
    expect(isWithinPercentRange(89, 100, 10)).toBe(false);
  });

  it('returns true when value equals target', () => {
    expect(isWithinPercentRange(50000, 50000, 10)).toBe(true);
  });

  it('returns false for NaN', () => {
    expect(isWithinPercentRange(NaN, 100, 10)).toBe(false);
    expect(isWithinPercentRange(100, NaN, 10)).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(isWithinPercentRange(Infinity, 100, 10)).toBe(false);
    expect(isWithinPercentRange(100, Infinity, 10)).toBe(false);
  });

  it('handles zero target (only zero matches)', () => {
    expect(isWithinPercentRange(0, 0, 10)).toBe(true);
    expect(isWithinPercentRange(1, 0, 10)).toBe(false);
  });

  it('handles negative targets', () => {
    expect(isWithinPercentRange(-95, -100, 10)).toBe(true);
    expect(isWithinPercentRange(-120, -100, 10)).toBe(false);
  });
});

describe('constants', () => {
  it('exports correct price percent', () => {
    expect(AMV_MATCH_PRICE_PERCENT).toBe(10);
  });

  it('exports correct hours percent', () => {
    expect(AMV_MATCH_HOURS_PERCENT).toBe(10);
  });

  it('exports correct year range', () => {
    expect(AMV_MATCH_YEAR_RANGE).toBe(2);
  });

  it('exports correct min comparables', () => {
    expect(AMV_MIN_COMPARABLES).toBe(2);
  });
});

describe('getAmvMatchRulesSummary', () => {
  it('returns a non-empty summary string', () => {
    const summary = getAmvMatchRulesSummary();
    expect(summary.length).toBeGreaterThan(0);
    expect(summary).toContain('2 years');
    expect(summary).toContain('10%');
  });
});

describe('getAmvInsufficientComparableMessage', () => {
  it('returns a message mentioning min comparables', () => {
    const message = getAmvInsufficientComparableMessage();
    expect(message).toContain('2');
    expect(message).toContain('N/A');
  });
});
