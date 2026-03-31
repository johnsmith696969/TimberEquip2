import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { applyHeadBrandAssets } from './services/brandAssetService';
import './index.css';
import './styles/input-fixes.css';

const ASSET_RECOVERY_KEY = 'timberequip.asset-recovery-attempted';
const ASSET_RECOVERY_PARAM = '__asset_recovery';

function getErrorMessage(input: unknown): string {
  if (input instanceof Error) return input.message;
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object' && 'message' in input && typeof (input as { message?: unknown }).message === 'string') {
    return (input as { message: string }).message;
  }
  return '';
}

function shouldRecoverFromAssetError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('failed to fetch dynamically imported module')
    || normalized.includes('failed to load module script')
    || normalized.includes('expected a javascript module script')
    || normalized.includes('mime type of "text/html"')
    || normalized.includes('importing a module script failed')
    || normalized.includes('error loading dynamically imported module')
    || normalized.includes('loading css chunk');
}

function recoverFromStaleAssets(reason: string): void {
  if (typeof window === 'undefined') return;

  if (window.sessionStorage.getItem(ASSET_RECOVERY_KEY) === '1') {
    console.error('Asset recovery already attempted during this session:', reason);
    return;
  }

  window.sessionStorage.setItem(ASSET_RECOVERY_KEY, '1');
  console.warn('Recovering from stale deployed assets:', reason);
  const recoveryUrl = new URL(window.location.href);
  recoveryUrl.searchParams.set(ASSET_RECOVERY_PARAM, String(Date.now()));
  window.location.replace(recoveryUrl.toString());
}

if (typeof window !== 'undefined') {
  const normalizedUrl = new URL(window.location.href);
  if (normalizedUrl.searchParams.has(ASSET_RECOVERY_PARAM)) {
    normalizedUrl.searchParams.delete(ASSET_RECOVERY_PARAM);
    window.history.replaceState({}, '', normalizedUrl.toString());
  }

  window.setTimeout(() => {
    window.sessionStorage.removeItem(ASSET_RECOVERY_KEY);
  }, 10000);

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    recoverFromStaleAssets('vite:preloadError');
  });

  window.addEventListener('error', (event) => {
    const message = getErrorMessage((event as ErrorEvent).error) || getErrorMessage((event as ErrorEvent).message);
    if (shouldRecoverFromAssetError(message)) {
      recoverFromStaleAssets(message);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = getErrorMessage(event.reason);
    if (shouldRecoverFromAssetError(message)) {
      recoverFromStaleAssets(message);
    }
  });
}

void applyHeadBrandAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
