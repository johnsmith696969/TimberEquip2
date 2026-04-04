const ASSET_RECOVERY_KEY = 'forestryequipmentsales.asset-recovery-attempted';
const ASSET_RECOVERY_PARAM = '__asset_recovery';
const SHELL_CHECK_INTERVAL_MS = 60_000;

export function getCurrentShellAssetSignature(doc: Document = document): string {
  const script = doc.querySelector('script[type="module"][src*="/assets/index-"]') as HTMLScriptElement | null;
  return script?.getAttribute('src') || '';
}

export function extractShellAssetSignatureFromHtml(html: string): string {
  const match = String(html || '').match(/<script[^>]+type="module"[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/i);
  return match?.[1] || '';
}

export function getErrorMessage(input: unknown): string {
  if (input instanceof Error) return input.message;
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object' && 'message' in input && typeof (input as { message?: unknown }).message === 'string') {
    return (input as { message: string }).message;
  }
  return '';
}

export function shouldRecoverFromAssetError(message: string): boolean {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('failed to fetch dynamically imported module')
    || normalized.includes('failed to load module script')
    || normalized.includes('expected a javascript module script')
    || normalized.includes('mime type of "text/html"')
    || normalized.includes('importing a module script failed')
    || normalized.includes('error loading dynamically imported module')
    || normalized.includes('loading css chunk');
}

export function normalizeAssetRecoveryUrl(href: string): string {
  const url = new URL(href, window.location.origin);
  if (!url.searchParams.has(ASSET_RECOVERY_PARAM)) {
    return url.toString();
  }
  url.searchParams.delete(ASSET_RECOVERY_PARAM);
  return url.toString();
}

export function recoverFromStaleAssets(reason: string): void {
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

async function checkForNewShellVersion(): Promise<void> {
  if (typeof window === 'undefined') return;

  const currentSignature = getCurrentShellAssetSignature();
  if (!currentSignature) return;

  try {
    const probeUrl = new URL('/index.html', window.location.origin);
    probeUrl.searchParams.set('__shell_probe', String(Date.now()));

    const response = await window.fetch(probeUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Accept: 'text/html',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) return;

    const latestHtml = await response.text();
    const latestSignature = extractShellAssetSignatureFromHtml(latestHtml);
    if (latestSignature && latestSignature !== currentSignature) {
      recoverFromStaleAssets(`shell-version-mismatch:${currentSignature}->${latestSignature}`);
    }
  } catch (error) {
    console.warn('Shell version probe failed:', error);
  }
}

export function installAssetRecoveryGuards(): void {
  if (typeof window === 'undefined') return;

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

  let shellCheckTimer: number | null = null;
  const scheduleShellCheck = (delayMs = 2500) => {
    if (shellCheckTimer !== null) {
      window.clearTimeout(shellCheckTimer);
    }
    shellCheckTimer = window.setTimeout(() => {
      void checkForNewShellVersion();
    }, delayMs);
  };

  scheduleShellCheck();

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleShellCheck(500);
    }
  });

  window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void checkForNewShellVersion();
    }
  }, SHELL_CHECK_INTERVAL_MS);
}
