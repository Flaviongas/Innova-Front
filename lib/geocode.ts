// Browser-side forward/reverse geocoding via Nominatim (OpenStreetMap).
//
// The backend only resolves coordinates to a macrosector; it does not turn
// addresses into coordinates. These helpers run in the browser on explicit
// user action (button press, never on every keystroke) to respect the
// Nominatim usage policy. Results always show the OSM attribution note.

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  label: string;
};

// Rough bounding box around Temuco used to bias (not restrict) searches.
const TEMUCO_VIEWBOX = "-72.85,-38.62,-72.40,-38.82";

function temukumQuery(address: string): string {
  const query = address.trim();
  return /temuco/i.test(query) ? query : `${query}, Temuco, Chile`;
}

export async function forwardGeocode(address: string): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: temukumQuery(address),
    countrycodes: "cl",
    viewbox: TEMUCO_VIEWBOX,
    limit: "1",
    "accept-language": "es",
  });
  let response: Response;
  try {
    response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("Sin conexión al buscador de direcciones.");
  }
  if (!response.ok) {
    throw new Error("El buscador de direcciones no respondió.");
  }
  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  const first = results[0];
  if (!first) {
    throw new Error("No se encontró esa dirección. Prueba con calle y número.");
  }
  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    label: first.display_name,
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    "accept-language": "es",
  });
  let response: Response;
  try {
    response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("Sin conexión al buscador de direcciones.");
  }
  if (!response.ok) {
    throw new Error("El buscador de direcciones no respondió.");
  }
  const data = (await response.json()) as { display_name?: string };
  if (!data.display_name) {
    throw new Error("No se encontró una dirección para esas coordenadas.");
  }
  return data.display_name;
}
