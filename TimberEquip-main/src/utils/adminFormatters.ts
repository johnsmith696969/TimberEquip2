/**
 * Shared formatting utilities for admin dashboard tabs.
 */

export function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'string') return new Date(value).getTime() || 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const ts = value as { seconds?: number; toDate?: () => Date };
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  return 0;
}

export function formatTimestamp(value: unknown): string {
  const ms = toMillis(value);
  if (!ms) return 'Unknown';
  return new Date(ms).toLocaleString();
}

export function formatLifecycleLabel(value: string): string {
  return String(value || '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Unknown';
}
