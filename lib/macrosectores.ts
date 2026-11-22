// Official macrosector boundaries, vendored from the Municipalidad de Temuco
// open-data Feature Service (IDE Temuco, owner rgatica_munitemuco):
// https://services5.arcgis.com/eRZzgPfrzSdIBqJq/arcgis/rest/services/Servicio_de_Macrosectores/FeatureServer
// Public query and download; editing prohibited; attribution required.
// Snapshot stored at public/data/macrosectores.geojson (WGS84, 10 polygons).

export const MACROSECTOR_GEOJSON_URL = "/data/macrosectores.geojson";

// Exact `macrosect` values in the vendored file mapped to app sector ids.
// Provisional for the synthetic case statistics: official polygons carry the
// real boundaries, the per-sector counts remain synthetic until the
// municipality confirms the reporting model.
export const OFFICIAL_TO_ID: Record<string, string> = {
  LABRANZA: "labranza",
  BOTROLHUE: "botrolhue",
  PONIENTE: "poniente",
  AMANECER: "amanecer",
  CENTRO: "centro",
  "COSTANERA DEL CAUTIN": "costanera",
  "PUEBLO NUEVO": "pueblo-nuevo",
  "PEDRO DE VALDIVIA": "pedro-de-valdivia",
  "ÑIELOL": "nielol",
  "EL CARMEN": "el-carmen",
};

export type GeoPosition = [number, number];
export type GeoRing = GeoPosition[];
export type GeoPolygon = GeoRing[];

export type MacrosectorFeature = {
  type: "Feature";
  properties: {
    macrosect: string;
    area_km2?: number;
    pob_total?: number;
    num_uveci?: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: GeoPolygon;
  };
};

export type MacrosectorCollection = {
  type: "FeatureCollection";
  features: MacrosectorFeature[];
};

let cache: Promise<MacrosectorCollection> | null = null;

export function loadMacrosectores(): Promise<MacrosectorCollection> {
  if (!cache) {
    cache = fetch(MACROSECTOR_GEOJSON_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json() as Promise<MacrosectorCollection>;
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

// Bounding-box center of a polygon, returned as Leaflet [lat, lng].
// Good enough for fly-to targets and fallback markers.
export function polygonCenter(rings: GeoPolygon): [number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  return [(minY + maxY) / 2, (minX + maxX) / 2];
}
