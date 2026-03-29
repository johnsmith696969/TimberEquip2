/**
 * Fetch wrapper that automatically includes CSRF tokens for mutation requests.
 *
 * Usage: Replace `fetch(url, { method: 'POST', ... })` with `fetchWithCsrf(url, { method: 'POST', ... })`
 * GET requests pass through without CSRF token attachment.
 */

let cachedCsrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  const response = await fetch('/api/csrf-token', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }

  const data = await response.json();
  cachedCsrfToken = data.csrfToken;
  return cachedCsrfToken!;
}

/** Clear cached token (call on 403 retry or logout) */
export function clearCsrfToken(): void {
  cachedCsrfToken = null;
}

/**
 * Drop-in replacement for `fetch()` that attaches the CSRF token
 * to POST, PUT, PATCH, and DELETE requests automatically.
 */
export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();

  // GET/HEAD/OPTIONS don't need CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return fetch(input, init);
  }

  const csrfToken = await getCsrfToken();

  const headers = new Headers(init?.headers);
  headers.set('CSRF-Token', csrfToken);

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });

  // If CSRF token was rejected, clear cache and retry once
  if (response.status === 403) {
    clearCsrfToken();
    const freshToken = await getCsrfToken();
    headers.set('CSRF-Token', freshToken);
    return fetch(input, {
      ...init,
      headers,
      credentials: 'include',
    });
  }

  return response;
}
