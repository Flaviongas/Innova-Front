"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMacrosector, territoryFill } from "@/lib/data";
import {
  OFFICIAL_TO_ID,
  loadMacrosectores,
  polygonCenter,
  type GeoPolygon,
} from "@/lib/macrosectores";

export const TEMUCO_CENTER: [number, number] = [-38.7359, -72.5904];
export const TEMUCO_ZOOM = 13;

const DEFAULT_MAP_TILES = {
  url: "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution/">CARTO</a>',
  subdomains: "abcd",
};

const DEFAULT_SATELLITE_TILES = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
  subdomains: "abc",
};

type TileConfig = { url: string; attribution: string; subdomains: string };

// Tile layers. CARTO basemaps require an API key (?key=): without it the
// server returns an "API key required" watermark tile and the map looks
// empty. To use a key-based provider, create `.env.local` in the project
// root (it is gitignored — you create it yourself) with:
//
//   NEXT_PUBLIC_MAP_TILE_KEY="pega-tu-clave-aqui"
//
// That is enough for the default CARTO layer: the key is appended as
// `?key=` automatically. To use a different provider or style instead,
// override the full URL (use {key} where the provider expects the key):
//
//   NEXT_PUBLIC_MAP_TILE_URL="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key={key}"
//   NEXT_PUBLIC_MAP_TILE_KEY="tu-clave-aqui"
//   NEXT_PUBLIC_MAP_TILE_ATTRIBUTION="&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap"
//   NEXT_PUBLIC_MAP_TILE_SUBDOMAINS="abc"
//
// Same pattern with the SATELLITE_ infix overrides the satellite layer.
// Restart the dev server after creating or editing `.env.local` —
// Next.js loads env vars at startup.
function resolveTiles(kind: "MAP" | "SATELLITE"): TileConfig {
  const template = (
    kind === "MAP"
      ? process.env.NEXT_PUBLIC_MAP_TILE_URL
      : process.env.NEXT_PUBLIC_SATELLITE_TILE_URL
  )?.trim();
  const key = (
    kind === "MAP"
      ? process.env.NEXT_PUBLIC_MAP_TILE_KEY
      : process.env.NEXT_PUBLIC_SATELLITE_TILE_KEY
  )?.trim();
  const attribution =
    kind === "MAP"
      ? process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION
      : process.env.NEXT_PUBLIC_SATELLITE_TILE_ATTRIBUTION;
  const subdomains =
    kind === "MAP"
      ? process.env.NEXT_PUBLIC_MAP_TILE_SUBDOMAINS
      : process.env.NEXT_PUBLIC_SATELLITE_TILE_SUBDOMAINS;
  const fallback =
    kind === "MAP" ? DEFAULT_MAP_TILES : DEFAULT_SATELLITE_TILES;

  if (!template) {
    if (!key) return fallback;
    // Default URL + key from env: append ?key= (CARTO format).
    const separator = fallback.url.includes("?") ? "&" : "?";
    return { ...fallback, url: `${fallback.url}${separator}key=${key}` };
  }
  if (template.includes("{key}") && !key) {
    console.warn(
      `[map] ${kind}_TILE_URL contains {key} but no ${kind}_TILE_KEY is set. Using default tiles.`,
    );
    return fallback;
  }

  return {
    url: key ? template.replaceAll("{key}", key) : template,
    attribution: attribution?.trim() || fallback.attribution,
    subdomains: subdomains?.trim() || fallback.subdomains,
  };
}

type InteractiveTerritoryMapProps = {
  selectedId: string;
  onSelect: (id: string) => void;
  mapMode: "map" | "satellite";
  onMapReady?: (map: L.Map) => void;
  scrollWheelZoom?: boolean;
  /** Real per-sector case counts; falls back to reference data when absent. */
  counts?: Record<string, number>;
};

function featureName(feature: GeoJSON.Feature): string | undefined {
  const raw = (feature as { properties?: { macrosect?: unknown } })
    ?.properties?.macrosect;
  return typeof raw === "string" ? raw : undefined;
}

/** Read a CSS token at runtime so Leaflet canvas colors stay in sync. */
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = window
    .getComputedStyle(window.document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function polygonStyle(
  name: string | undefined,
  selected: boolean,
  counts?: Record<string, number>,
): L.PathOptions {
  const id = name ? OFFICIAL_TO_ID[name] : undefined;
  const cases = id ? (counts?.[id] ?? getMacrosector(id).cases) : 0;

  return {
    color: cssVar("--color-primary", "#125742"),
    weight: selected ? 2.5 : 1.2,
    opacity: selected ? 0.9 : 0.45,
    fillColor: territoryFill(cases),
    fillOpacity: selected ? 0.6 : 0.42,
  };
}

function tooltipFor(id: string, counts?: Record<string, number>): string {
  const sector = getMacrosector(id);
  const cases = counts?.[id] ?? sector.cases;
  return `<strong>${sector.label}</strong><br/>${cases} casos activos`;
}

function restyleLayer(
  layer: L.GeoJSON,
  selectedId: string,
  counts?: Record<string, number>,
): void {
  layer.eachLayer((sublayer) => {
    const feature = (sublayer as L.GeoJSON).feature as
      | GeoJSON.Feature
      | undefined;
    const name = feature ? featureName(feature) : undefined;
    const sid = name ? OFFICIAL_TO_ID[name] : undefined;
    (sublayer as L.Path).setStyle(
      polygonStyle(name, !!sid && sid === selectedId, counts),
    );
    if (sid) {
      sublayer.bindTooltip(tooltipFor(sid, counts), {
        sticky: true,
        opacity: 1,
      });
    }
  });
}

export function InteractiveTerritoryMap({
  selectedId,
  onSelect,
  mapMode,
  onMapReady,
  scrollWheelZoom = true,
  counts,
}: InteractiveTerritoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const centroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const onSelectRef = useRef(onSelect);
  const onMapReadyRef = useRef(onMapReady);
  const selectedRef = useRef(selectedId);
  const modeRef = useRef(mapMode);
  const scrollRef = useRef(scrollWheelZoom);
  const countsRef = useRef(counts);
  const [status, setStatus] = useState("iniciando");

  onSelectRef.current = onSelect;
  onMapReadyRef.current = onMapReady;
  selectedRef.current = selectedId;
  modeRef.current = mapMode;
  scrollRef.current = scrollWheelZoom;
  countsRef.current = counts;

  // Create the map once, loading Leaflet only in the browser.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;

      try {
        const leaflet = (await import("leaflet")).default;
        if (cancelled) return;
        leafletRef.current = leaflet;

        const map = leaflet.map(containerRef.current, {
          center: TEMUCO_CENTER,
          zoom: TEMUCO_ZOOM,
          zoomControl: false,
          scrollWheelZoom: scrollRef.current,
        });
        mapRef.current = map;

        const tiles =
          modeRef.current === "map"
            ? resolveTiles("MAP")
            : resolveTiles("SATELLITE");
        tileRef.current = leaflet
          .tileLayer(tiles.url, {
            attribution: tiles.attribution,
            subdomains: tiles.subdomains,
            maxZoom: 20,
          })
          .addTo(map);

        try {
          const collection = await loadMacrosectores();
          if (cancelled) return;

          const layer = leaflet.geoJSON(
            collection as unknown as GeoJSON.GeoJsonObject,
            {
              style: (feature) =>
                polygonStyle(
                  feature ? featureName(feature) : undefined,
                  false,
                  countsRef.current,
                ),
              onEachFeature: (feature, sublayer) => {
                const name = featureName(feature);
                const id = name ? OFFICIAL_TO_ID[name] : undefined;
                if (!id) return;

                centroidsRef.current.set(
                  id,
                  polygonCenter(
                    (feature.geometry as unknown as { coordinates: GeoPolygon })
                      .coordinates,
                  ),
                );
                sublayer.bindTooltip(tooltipFor(id, countsRef.current), {
                  sticky: true,
                  opacity: 1,
                });
                sublayer.on("click", () => onSelectRef.current(id));
              },
            },
          ).addTo(map);
          geoLayerRef.current = layer;
          applySelection(selectedRef.current);
        } catch {
          if (!cancelled) {
            setStatus(
              "error: no se pudieron cargar los límites territoriales.",
            );
          }
        }

        onMapReadyRef.current?.(map);
        setStatus("listo");
      } catch (error) {
        setStatus(
          `error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    function applySelection(id: string) {
      const layer = geoLayerRef.current;
      if (!layer) return;
      restyleLayer(layer, id, countsRef.current);
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      geoLayerRef.current = null;
      centroidsRef.current.clear();
      tileRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap base tiles when the mode changes.
  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map || !tileRef.current) return;

    const tiles =
      mapMode === "map" ? resolveTiles("MAP") : resolveTiles("SATELLITE");
    tileRef.current.remove();
    tileRef.current = leaflet
      .tileLayer(tiles.url, {
        attribution: tiles.attribution,
        subdomains: tiles.subdomains,
        maxZoom: 20,
      })
      .addTo(map);
  }, [mapMode]);

  // Highlight selection and fly to it.
  useEffect(() => {
    const map = mapRef.current;
    const layer = geoLayerRef.current;
    if (!map || !layer) return;

    restyleLayer(layer, selectedId, countsRef.current);

    const coords = centroidsRef.current.get(selectedId);
    if (coords) {
      map.flyTo(coords, Math.max(map.getZoom(), 13), { duration: 0.8 });
    } else {
      map.flyTo(TEMUCO_CENTER, Math.max(map.getZoom(), 12), {
        duration: 0.8,
      });
    }
  }, [selectedId]);

  // Refresh fills and tooltips when real counts arrive or change.
  useEffect(() => {
    const layer = geoLayerRef.current;
    if (!layer) return;
    restyleLayer(layer, selectedRef.current, counts);
  }, [counts]);

  return (
    <div className="interactive-map-wrap">
      <div ref={containerRef} className="interactive-territory-map" />
      {status !== "listo" && (
        <div className="map-loading-overlay" role="status" aria-live="polite">
          {status.startsWith("error") ? status : "Cargando mapa interactivo…"}
        </div>
      )}
    </div>
  );
}
