"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MACROSECTORS } from "@/lib/data";

export const TEMUCO_CENTER: [number, number] = [-38.7359, -72.5904];
export const TEMUCO_ZOOM = 13;

// Approximate reference points for each macrosector around Temuco.
// Replace with official macrosector GeoJSON/polygons when available.
export const SECTOR_COORDS: Record<string, [number, number]> = {
  "MS-10": [-38.71, -72.625],
  "MS-01": [-38.705, -72.59],
  "MS-06": [-38.71, -72.555],
  RURAL: [-38.715, -72.49],
  "MS-05": [-38.733, -72.63],
  "MS-02": [-38.728, -72.592],
  "MS-04": [-38.742, -72.582],
  "MS-09": [-38.745, -72.535],
  "MS-08": [-38.762, -72.625],
  "MS-03": [-38.758, -72.59],
  "MS-07": [-38.762, -72.555],
};

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
};

export function InteractiveTerritoryMap({
  selectedId,
  onSelect,
  mapMode,
  onMapReady,
}: InteractiveTerritoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);  const leafletRef = useRef<typeof L | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const tileRef = useRef<L.TileLayer | null>(null);
  const onSelectRef = useRef(onSelect);
  const onMapReadyRef = useRef(onMapReady);
  const selectedRef = useRef(selectedId);
  const modeRef = useRef(mapMode);
  const [status, setStatus] = useState("iniciando");

  onSelectRef.current = onSelect;
  onMapReadyRef.current = onMapReady;
  selectedRef.current = selectedId;
  modeRef.current = mapMode;

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
        scrollWheelZoom: true,
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

      for (const sector of MACROSECTORS) {
        const coords = SECTOR_COORDS[sector.id];
        if (!coords) continue;

        const marker = leaflet.marker(coords, {
          icon: leaflet.divIcon({
            className: "sector-marker-wrap",
            html: `<div class="sector-marker${sector.id === selectedRef.current ? " sector-marker--selected" : ""}"><span>${sector.cases}</span></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
          keyboard: true,
          title: `${sector.label} · ${sector.cases} casos activos`,
        });

        marker.bindTooltip(
          `<strong>${sector.label}</strong><br/>${sector.cases} casos activos`,
          { direction: "top", offset: [0, -22], opacity: 1 },
        );

        marker.on("click", () => onSelectRef.current(sector.id));
        marker.addTo(map);
        markersRef.current.set(sector.id, marker);
      }

      onMapReadyRef.current?.(map);
      setStatus("listo");
    } catch (error) {
      setStatus(`error: ${error instanceof Error ? error.message : String(error)}`);
    }
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      tileRef.current = null;
    };
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
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map) return;

    for (const sector of MACROSECTORS) {
      const marker = markersRef.current.get(sector.id);
      if (marker) {
        marker.setIcon(
          leaflet.divIcon({
            className: "sector-marker-wrap",
            html: `<div class="sector-marker${sector.id === selectedId ? " sector-marker--selected" : ""}"><span>${sector.cases}</span></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
        );
      }
    }

    const coords = SECTOR_COORDS[selectedId];
    if (coords) {
      map.flyTo(coords, Math.max(map.getZoom(), 13), { duration: 0.8 });
    }
  }, [selectedId]);

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
