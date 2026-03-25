const SITE_KEY = '6LdxzpIsAAAAADS0ws0EJT-ulSMBH5yO9uAWOqX0';

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  try {
    if (!window.grecaptcha?.enterprise) return null;
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha.enterprise.ready(async () => {
        try {
          const token = await window.grecaptcha.enterprise.execute(SITE_KEY, { action });
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
    return true; // graceful degradation
  }
}
