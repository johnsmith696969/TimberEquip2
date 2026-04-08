import { describe, it, expect } from 'vitest';
import { auctionService } from '../services/auctionService';

describe('auctionService.getBidIncrement', () => {
  it('returns $10 increment for bids under $250', () => {
    expect(auctionService.getBidIncrement(0)).toBe(10);
    expect(auctionService.getBidIncrement(100)).toBe(10);
    expect(auctionService.getBidIncrement(249)).toBe(10);
  });

  it('returns $25 increment for bids $250-$499', () => {
    expect(auctionService.getBidIncrement(250)).toBe(25);
    expect(auctionService.getBidIncrement(499)).toBe(25);
  });

  it('returns $50 increment for bids $500-$999', () => {
    expect(auctionService.getBidIncrement(500)).toBe(50);
    expect(auctionService.getBidIncrement(999)).toBe(50);
  });

  it('returns $100 increment for bids $1,000-$4,999', () => {
    expect(auctionService.getBidIncrement(1000)).toBe(100);
    expect(auctionService.getBidIncrement(4999)).toBe(100);
  });

  it('returns $250 increment for bids $5,000-$9,999', () => {
    expect(auctionService.getBidIncrement(5000)).toBe(250);
    expect(auctionService.getBidIncrement(9999)).toBe(250);
  });

  it('returns $500 increment for bids $10,000-$24,999', () => {
    expect(auctionService.getBidIncrement(10000)).toBe(500);
    expect(auctionService.getBidIncrement(24999)).toBe(500);
  });

  it('returns $1,000 increment for bids $25,000-$49,999', () => {
    expect(auctionService.getBidIncrement(25000)).toBe(1000);
    expect(auctionService.getBidIncrement(49999)).toBe(1000);
  });

  it('returns $2,500 increment for bids $50,000-$99,999', () => {
    expect(auctionService.getBidIncrement(50000)).toBe(2500);
    expect(auctionService.getBidIncrement(99999)).toBe(2500);
  });

  it('returns $5,000 increment for bids $100,000-$249,999', () => {
    expect(auctionService.getBidIncrement(100000)).toBe(5000);
    expect(auctionService.getBidIncrement(249999)).toBe(5000);
  });

  it('returns $10,000 increment for bids $250,000+', () => {
    expect(auctionService.getBidIncrement(250000)).toBe(10000);
    expect(auctionService.getBidIncrement(500000)).toBe(10000);
    expect(auctionService.getBidIncrement(1000000)).toBe(10000);
  });
});

describe('auctionService.getBuyerPremium', () => {
  it('applies 10% premium with $100 minimum for amounts up to $25,000', () => {
    expect(auctionService.getBuyerPremium(500)).toBe(100); // 500 * 0.10 = 50, min 100
    expect(auctionService.getBuyerPremium(1000)).toBe(100); // 1000 * 0.10 = 100
    expect(auctionService.getBuyerPremium(5000)).toBe(500); // 5000 * 0.10 = 500
    expect(auctionService.getBuyerPremium(25000)).toBe(2500); // 25000 * 0.10 = 2500
  });

  it('applies 5% premium with $2,500 minimum for amounts $25,001-$75,000', () => {
    expect(auctionService.getBuyerPremium(25001)).toBe(2500); // 25001 * 0.05 = 1250.05, min 2500
    expect(auctionService.getBuyerPremium(50000)).toBe(2500); // 50000 * 0.05 = 2500
    expect(auctionService.getBuyerPremium(75000)).toBe(3750); // 75000 * 0.05 = 3750
  });

  it('applies flat $3,500 cap for amounts over $75,000', () => {
    expect(auctionService.getBuyerPremium(75001)).toBe(3500);
    expect(auctionService.getBuyerPremium(100000)).toBe(3500);
    expect(auctionService.getBuyerPremium(500000)).toBe(3500);
  });

  it('returns $100 minimum for very small amounts', () => {
    expect(auctionService.getBuyerPremium(0)).toBe(100);
    expect(auctionService.getBuyerPremium(1)).toBe(100);
  });
});

describe('auctionService.formatTimeRemaining', () => {
  it('returns "Ended" for past dates', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    expect(auctionService.formatTimeRemaining(past)).toBe('Ended');
  });

  it('formats seconds correctly', () => {
    const endTime = new Date(Date.now() + 30500).toISOString(); // ~30s
    const result = auctionService.formatTimeRemaining(endTime);
    expect(result).toMatch(/^\d+s$/);
  });

  it('formats minutes + seconds', () => {
    const endTime = new Date(Date.now() + 305000).toISOString(); // ~5m 5s
    const result = auctionService.formatTimeRemaining(endTime);
    expect(result).toMatch(/^\d+m \d+s$/);
  });

  it('formats hours + minutes', () => {
    const endTime = new Date(Date.now() + 7560000).toISOString(); // ~2h 6m
    const result = auctionService.formatTimeRemaining(endTime);
    expect(result).toMatch(/^\d+h \d+m$/);
  });

  it('formats days + hours', () => {
    const endTime = new Date(Date.now() + 93600000).toISOString(); // ~26h = 1d 2h
    const result = auctionService.formatTimeRemaining(endTime);
    expect(result).toMatch(/^\d+d \d+h$/);
  });
});
