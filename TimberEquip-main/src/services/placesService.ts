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

const BROWSER_GOOGLE_MAPS_API_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

function buildApiPath(path: string) {
  return path.startsWith('/api/') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
}

function getAddressComponent(
  components: Array<{ longText?: string; shortText?: string; types?: string[] }> | undefined,
  type: string
) {
  return Array.isArray(components)
    ? components.find((component) => Array.isArray(component.types) && component.types.includes(type))
    : undefined;
}

function parseBrowserPlaceDetails(
  payload: {
    id?: string;
    formattedAddress?: string;
    addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
    location?: { latitude?: number; longitude?: number };
  } | null | undefined,
  fallbackPlaceId: string
): GooglePlaceSelection | null {
  if (!payload?.formattedAddress) {
    return null;
  }

  const streetNumber = getAddressComponent(payload.addressComponents, 'street_number')?.longText || '';
  const route =
    getAddressComponent(payload.addressComponents, 'route')?.shortText ||
    getAddressComponent(payload.addressComponents, 'route')?.longText ||
    '';
  const street1 = [streetNumber, route].filter(Boolean).join(' ').trim();

  return {
    placeId: String(payload.id || fallbackPlaceId || '').trim(),
    formattedAddress: payload.formattedAddress,
    latitude: typeof payload.location?.latitude === 'number' ? payload.location.latitude : null,
    longitude: typeof payload.location?.longitude === 'number' ? payload.location.longitude : null,
    street1: street1 || undefined,
    city:
      getAddressComponent(payload.addressComponents, 'locality')?.longText ||
      getAddressComponent(payload.addressComponents, 'postal_town')?.longText ||
      undefined,
    state: getAddressComponent(payload.addressComponents, 'administrative_area_level_1')?.shortText || undefined,
    county: getAddressComponent(payload.addressComponents, 'administrative_area_level_2')?.longText || undefined,
    postalCode: getAddressComponent(payload.addressComponents, 'postal_code')?.shortText || undefined,
    country: getAddressComponent(payload.addressComponents, 'country')?.longText || undefined,
  };
}

async function getBrowserPlacePredictions(
  normalizedInput: string,
  mode: GooglePlacesMode
): Promise<GooglePlacePrediction[]> {
  if (!BROWSER_GOOGLE_MAPS_API_KEY) {
    throw new Error('Missing browser Google Maps API key.');
  }

  const requestBody: Record<string, unknown> = {
    input: normalizedInput,
  };

  if (mode === 'city') {
    requestBody.includedPrimaryTypes = ['locality'];
  }

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': BROWSER_GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Google Places browser autocomplete failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];

  return suggestions
    .map((suggestion) => {
      const prediction = suggestion?.placePrediction;
      const placeId = String(prediction?.placeId || '').trim();
      const description = String(prediction?.text?.text || '').trim();
      if (!placeId || !description) {
        return null;
      }

      return {
        description,
        placeId,
        mainText: String(prediction?.structuredFormat?.mainText?.text || '').trim() || undefined,
        secondaryText: String(prediction?.structuredFormat?.secondaryText?.text || '').trim() || undefined,
      } satisfies GooglePlacePrediction;
    })
    .filter((prediction): prediction is GooglePlacePrediction => Boolean(prediction))
    .slice(0, 5);
}

async function getBrowserPlaceDetails(placeId: string): Promise<GooglePlaceSelection | null> {
  if (!BROWSER_GOOGLE_MAPS_API_KEY) {
    throw new Error('Missing browser Google Maps API key.');
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=id,formattedAddress,addressComponents,location`,
    {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': BROWSER_GOOGLE_MAPS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Places browser details failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return parseBrowserPlaceDetails(payload, placeId);
}

export async function getPlacePredictions(input: string, mode: GooglePlacesMode = 'city'): Promise<GooglePlacePrediction[]> {
  const normalizedInput = String(input || '').trim();
  if (normalizedInput.length < 3) {
    return [];
  }

  if (BROWSER_GOOGLE_MAPS_API_KEY) {
    try {
      return await getBrowserPlacePredictions(normalizedInput, mode);
    } catch {
      // Fall back to the server proxy when the browser key is unavailable or temporarily rejected.
    }
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

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  if (!BROWSER_GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=locality|administrative_area_level_1&key=${BROWSER_GOOGLE_MAPS_API_KEY}`
    );
    if (!response.ok) return null;

    const payload = await response.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];
    if (results.length === 0) return null;

    const components = Array.isArray(results[0].address_components) ? results[0].address_components : [];
    const city = components.find((c: { types?: string[] }) => c.types?.includes('locality'))?.long_name || '';
    const state = components.find((c: { types?: string[] }) => c.types?.includes('administrative_area_level_1'))?.short_name || '';
    const country = components.find((c: { types?: string[] }) => c.types?.includes('country'))?.long_name || '';

    return [city, state, country].filter(Boolean).join(', ') || results[0].formatted_address || null;
  } catch {
    return null;
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceSelection | null> {
  const normalizedPlaceId = String(placeId || '').trim();
  if (!normalizedPlaceId) {
    return null;
  }

  if (BROWSER_GOOGLE_MAPS_API_KEY) {
    try {
      return await getBrowserPlaceDetails(normalizedPlaceId);
    } catch {
      // Fall back to the server proxy when the browser key is unavailable or temporarily rejected.
    }
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
