import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getErrorMessage,
  normalizeAssetRecoveryUrl,
  shouldRecoverFromAssetError,
} from '../utils/assetRecovery';

describe('asset recovery helpers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/ad-programs');
  });

  it('detects stale dynamically imported module failures', () => {
    expect(shouldRecoverFromAssetError('Failed to fetch dynamically imported module')).toBe(true);
    expect(shouldRecoverFromAssetError('Loading CSS chunk 18 failed')).toBe(true);
    expect(shouldRecoverFromAssetError('Unexpected token < in JSON at position 0')).toBe(false);
  });

  it('removes the asset recovery marker from URLs', () => {
    expect(
      normalizeAssetRecoveryUrl('https://timberequip.com/ad-programs?plan=dealer&__asset_recovery=123456')
    ).toBe('https://timberequip.com/ad-programs?plan=dealer');
  });

  it('extracts error messages from mixed inputs', () => {
    expect(getErrorMessage(new Error('module failed'))).toBe('module failed');
    expect(getErrorMessage('plain string')).toBe('plain string');
    expect(getErrorMessage({ message: 'structured failure' })).toBe('structured failure');
    expect(getErrorMessage({})).toBe('');
  });
});
