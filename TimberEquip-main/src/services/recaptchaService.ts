import { API_BASE } from '../constants/api';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SCRIPT_SRC = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(SITE_KEY)}`;
const PRODUCTION_RECAPTCHA_HOSTS = new Set([
  'timberequip.com',
  'www.timberequip.com',
  'forestryequipmentsales.com',
  'www.forestryequipmentsales.com',
  'timberequip-staging.web.app',
  'timberequip-staging.firebaseapp.com',
  'mobile-app-equipment-sales.web.app',
  'mobile-app-equipment-sales.firebaseapp.com',
]);

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

let recaptchaEnterpriseScriptPromise: Promise<void> | null = null;

function shouldUseEnterpriseRecaptcha(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = String(window.location.hostname || '').trim().toLowerCase();
  return PRODUCTION_RECAPTCHA_HOSTS.has(hostname);
}

export function isRecaptchaProtectionEnabled(): boolean {
  return shouldUseEnterpriseRecaptcha();
}

function loadEnterpriseRecaptchaScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }

  if (!shouldUseEnterpriseRecaptcha()) {
    return Promise.resolve();
  }

  if (window.grecaptcha?.enterprise) {
    return Promise.resolve();
  }

  if (!recaptchaEnterpriseScriptPromise) {
    recaptchaEnterpriseScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-recaptcha-enterprise="true"]');

      const handleLoad = () => resolve();
      const handleError = () => {
        recaptchaEnterpriseScriptPromise = null;
        reject(new Error('Unable to load reCAPTCHA Enterprise.'));
      };

      if (existingScript) {
        existingScript.addEventListener('load', handleLoad, { once: true });
        existingScript.addEventListener('error', handleError, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.recaptchaEnterprise = 'true';
      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
      document.head.appendChild(script);
    });
  }

  return recaptchaEnterpriseScriptPromise;
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!shouldUseEnterpriseRecaptcha()) {
    return null;
  }

  if (!SITE_KEY) {
    console.warn('[reCAPTCHA] Site key is not configured; token generation is disabled.');
    return null;
  }

  try {
    await loadEnterpriseRecaptchaScript();
    if (!window.grecaptcha?.enterprise) return null;

    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.enterprise!.ready(async () => {
        try {
          const token = await window.grecaptcha!.enterprise!.execute(SITE_KEY, { action });
          resolve(token);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (err) {
    console.warn('reCAPTCHA token generation failed:', err);
    return null;
  }
}

/** Returns true if the submission should be allowed. Fails closed in production. */
export async function assessRecaptcha(token: string, action: string): Promise<boolean> {
  if (!shouldUseEnterpriseRecaptcha()) {
    return true;
  }

  try {
    const res = await fetch(`${API_BASE}/recaptcha-assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.pass === true;
  } catch (err) {
    console.warn('reCAPTCHA assessment failed (fail-closed):', err);
    return false;
  }
}

export async function verifyRecaptchaAction(action: string): Promise<boolean> {
  if (!shouldUseEnterpriseRecaptcha()) {
    return true;
  }

  if (!SITE_KEY) {
    console.warn('[reCAPTCHA] Site key is not configured; blocking protected request.');
    return false;
  }

  // Attempt token generation with one retry on failure
  let token = await getRecaptchaToken(action);
  if (!token) {
    token = await getRecaptchaToken(action);
  }
  if (!token) {
    // Token generation failed after retry (script blocked, network error, wrong key).
    // Fail closed: reject the request to prevent bot bypass.
    console.warn(`[reCAPTCHA] Token generation failed for action "${action}"; blocking request.`);
    return false;
  }

  return assessRecaptcha(token, action);
}
