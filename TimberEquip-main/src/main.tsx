import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { applyHeadBrandAssets } from './services/brandAssetService';
import './index.css';
import './styles/input-fixes.css';

const ASSET_RECOVERY_KEY = 'timberequip.asset-recovery-attempted';

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
  window.location.reload();
}

if (typeof window !== 'undefined') {
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
