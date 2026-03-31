export function normalizeListingId(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeListingIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const uniqueIds = new Set<string>();
  for (const value of values) {
    const normalized = normalizeListingId(value);
    if (normalized) {
      uniqueIds.add(normalized);
    }
  }

  return Array.from(uniqueIds);
}

export function getListingIdRemovalCandidates(value: unknown): Array<string | number> {
  const normalized = normalizeListingId(value);
  if (!normalized) return [];

  const candidates: Array<string | number> = [normalized];
  if (/^\d+$/.test(normalized)) {
    const numericId = Number(normalized);
    if (Number.isSafeInteger(numericId)) {
      candidates.push(numericId);
    }
  }

  return candidates;
}
