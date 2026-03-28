const SITE_KEY = '6LdxzpIsAAAAADS0ws0EJT-ulSMBH5yO9uAWOqX0';
const SCRIPT_SRC = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(SITE_KEY)}`;

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

function loadEnterpriseRecaptchaScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
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
  } catch {
    return null;
  }
}

/** Returns true if the submission should be allowed. Fails open on any error. */
export async function assessRecaptcha(token: string, action: string): Promise<boolean> {
  try {
    const res = await fetch('/api/recaptcha-assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });
    if (!res.ok) return true;
    const data = await res.json();
    return data.pass !== false;
  } catch {
    return true;
  }
}
