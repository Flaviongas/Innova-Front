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

function pointInPolygon(x: number, y: number, rings: GeoPolygon): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (
        (yi > y) !== (yj > y) &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/** Squared distance from a point to the nearest polygon edge. */
function squaredDistanceToEdges(
  x: number,
  y: number,
  rings: GeoPolygon,
): number {
  let nearest = Infinity;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [x1, y1] = ring[j];
      const [x2, y2] = ring[i];
      const dx = x2 - x1;
      const dy = y2 - y1;
      let t = 0;
      if (dx !== 0 || dy !== 0) {
        t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
        t = Math.max(0, Math.min(1, t));
      }
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const distance = (x - px) ** 2 + (y - py) ** 2;
      if (distance < nearest) nearest = distance;
    }
  }
  return nearest;
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

/**
 * Interior point farthest from the polygon edges (approximate pole of
 * inaccessibility), returned as Leaflet [lat, lng]. Used for count labels:
 * on a concave sector such as Ñielol the bounding-box center sits near an
 * inner corner, while this point lands in the widest lobe.
 */
export function polygonLabelPoint(rings: GeoPolygon): [number, number] {
  const outer = rings[0];
  if (!outer || outer.length < 3) return polygonCenter(rings);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of outer) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  let bestX = (minX + maxX) / 2;
  let bestY = (minY + maxY) / 2;
  let bestDistance = -1;

  function consider(x: number, y: number): void {
    if (!pointInPolygon(x, y, rings)) return;
    const distance = squaredDistanceToEdges(x, y, rings);
    if (distance > bestDistance) {
      bestDistance = distance;
      bestX = x;
      bestY = y;
    }
  }

  const steps = 32;
  let stepX = (maxX - minX) / steps;
  let stepY = (maxY - minY) / steps;
  for (let i = 0; i <= steps; i += 1) {
    for (let j = 0; j <= steps; j += 1) {
      consider(minX + i * stepX, minY + j * stepY);
    }
  }

  // Refine locally around the best coarse point.
  for (let round = 0; round < 3; round += 1) {
    const centerX = bestX;
    const centerY = bestY;
    stepX /= 2;
    stepY /= 2;
    for (let i = -2; i <= 2; i += 1) {
      for (let j = -2; j <= 2; j += 1) {
        consider(centerX + i * stepX, centerY + j * stepY);
      }
    }
  }

  if (bestDistance < 0) return polygonCenter(rings);
  return [bestY, bestX];
}
