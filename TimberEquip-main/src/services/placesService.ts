import { API_BASE } from '../constants/api';

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
  return path.startsWith(`${API_BASE}/`) ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
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
  } catch (err) {
    console.warn('Places autocomplete server proxy failed:', err);
    return [];
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  try {
    const response = await fetch(
      `${buildApiPath('/public/reverse-geocode')}?lat=${encodeURIComponent(String(latitude))}&lng=${encodeURIComponent(String(longitude))}`
    );
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return typeof payload?.location === 'string' && payload.location.trim()
      ? payload.location.trim()
      : null;
  } catch (err) {
    console.warn('Reverse geocode server proxy failed:', err);
    return null;
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
  } catch (err) {
    console.warn('Place details server proxy failed:', err);
    return null;
  }
}
