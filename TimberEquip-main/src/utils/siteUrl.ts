export const PUBLIC_SITE_URL = 'https://timberequip.com';

export function buildSiteUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${PUBLIC_SITE_URL}${normalizedPath}`;
}
