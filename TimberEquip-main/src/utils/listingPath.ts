import { Listing } from '../types';

function slugifyTitle(title: string): string {
  const normalized = String(title || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'listing';
}

export function buildListingPath(listing: Pick<Listing, 'id' | 'title'>): string {
  const safeId = String(listing?.id || '').trim();
  const safeSlug = slugifyTitle(listing?.title || '');
  return `/listing/${safeId}/${safeSlug}`;
}
