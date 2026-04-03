export type GooglePlacesMode = 'city' | 'address';

export interface GooglePlacePrediction {
  description: string;
  placeId: string;
  mainText?: string;
  secondaryText?: string;
}

export interface GooglePlaceSelection {
  placeId: string;
  formattedAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  street1?: string;
  city?: string;
  state?: string;
  county?: string;
  postalCode?: string;
  country?: string;
}

function buildApiPath(path: string) {
  return path.startsWith('/api/') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getPlacePredictions(input: string, mode: GooglePlacesMode = 'city'): Promise<GooglePlacePrediction[]> {
  const normalizedInput = String(input || '').trim();
  if (normalizedInput.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `${buildApiPath('/public/places-autocomplete')}?input=${encodeURIComponent(normalizedInput)}&mode=${encodeURIComponent(mode)}`
    );
    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload?.predictions) ? payload.predictions : [];
  } catch {
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceSelection | null> {
  const normalizedPlaceId = String(placeId || '').trim();
  if (!normalizedPlaceId) {
    return null;
  }

  try {
    const response = await fetch(
      `${buildApiPath('/public/place-details')}?placeId=${encodeURIComponent(normalizedPlaceId)}`
    );
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.place && typeof payload.place === 'object' ? payload.place : null;
  } catch {
    return null;
  }
}
