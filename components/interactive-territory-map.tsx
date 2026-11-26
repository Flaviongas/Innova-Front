"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMacrosector, categoryFill, territoryFill } from "@/lib/data";
import { focusMap } from "@/lib/map-focus";
import {
  OFFICIAL_TO_ID,
  loadMacrosectores,
  polygonCenter,
  polygonLabelPoint,
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
  selectedId: string | null;
  onSelect: (id: string) => void;
  mapMode: "map" | "satellite";
  onMapReady?: (map: L.Map) => void;
  scrollWheelZoom?: boolean;
  /** Live per-sector case counts. Sectors without an entry render as zero. */
  counts?: Record<string, number>;
  /** Show case counts in tooltips and use the choropleth fill. False for public views. */
  showCounts?: boolean;
  choropleth?: boolean;
  /** Individual emergencies rendered as points at their coordinates. */
  cases?: CaseMarker[];
  onCaseSelect?: (id: number) => void;
  /** Center the camera on an exact point (e.g. the looked-up case). */
  focusPoint?: [number, number];
  focusZoom?: number;
  /** Change this key to recenter on `focusPoint` again. */
  focusKey?: string;
  /** Disable polygon selection and hover tooltips (public read-only views). */
  readOnly?: boolean;
};

export type CaseMarker = {
  id: number;
  latitude: number;
  longitude: number;
  code: string;
  title: string;
  categoryLabel: string;
  category: string;
};

/** Fill for a case point: one hue per emergency category. */
function caseColor(category: string): string {
  return categoryFill(category);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

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
  choropleth = true,
): L.PathOptions {
  const id = name ? OFFICIAL_TO_ID[name] : undefined;
  // Counts are authoritative only when provided. Never fall back to the
  // synthetic reference figures: a public map must not imply live data.
  const cases = id && counts ? (counts[id] ?? 0) : 0;

  return {
    color: cssVar("--color-primary", "#3574B5"),
    weight: selected ? 3 : 1.2,
    opacity: selected ? 1 : 0.45,
    fillColor: choropleth
      ? territoryFill(cases)
      : cssVar("--color-primary-light", "#D9EDFA"),
    fillOpacity: selected ? 0.72 : 0.42,
  };
}

function tooltipFor(
  id: string,
  counts?: Record<string, number>,
  showCounts = true,
): string {
  const sector = getMacrosector(id);
  if (!showCounts) {
    return `<strong>${sector.label}</strong>`;
  }
  const cases = counts ? (counts[id] ?? 0) : 0;
  const suffix = cases === 1 ? "caso registrado" : "casos registrados";
  return `<strong>${sector.label}</strong><br/>${cases} ${suffix}`;
}

function restyleLayer(
  layer: L.GeoJSON,
  selectedId: string | null,
  counts?: Record<string, number>,
  showCounts = true,
  choropleth = true,
): void {
  layer.eachLayer((sublayer) => {
    const feature = (sublayer as L.GeoJSON).feature as
      | GeoJSON.Feature
      | undefined;
    const name = feature ? featureName(feature) : undefined;
    const sid = name ? OFFICIAL_TO_ID[name] : undefined;
    (sublayer as L.Path).setStyle(
      polygonStyle(name, !!sid && sid === selectedId, counts, choropleth),
    );
    if (sid) {
      sublayer.bindTooltip(tooltipFor(sid, counts, showCounts), {
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
  showCounts = true,
  choropleth = true,
  cases,
  onCaseSelect,
  focusPoint,
  focusZoom = 14,
  focusKey,
  readOnly = false,
}: InteractiveTerritoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const centroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const labelPointsRef = useRef<Map<string, [number, number]>>(new Map());
  const countMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const syncCountsRef = useRef<() => void>(() => {});
  const casesRef = useRef(cases);
  const onCaseSelectRef = useRef(onCaseSelect);
  const syncMarkersRef = useRef<() => void>(() => {});
  const focusPointRef = useRef(focusPoint);
  const focusZoomRef = useRef(focusZoom);
  const readOnlyRef = useRef(readOnly);
  const onSelectRef = useRef(onSelect);
  const onMapReadyRef = useRef(onMapReady);
  const selectedRef = useRef(selectedId);
  const modeRef = useRef(mapMode);
  const scrollRef = useRef(scrollWheelZoom);
  const countsRef = useRef(counts);
  const showCountsRef = useRef(showCounts);
  const choroplethRef = useRef(choropleth);
  const [status, setStatus] = useState("iniciando");

  onSelectRef.current = onSelect;
  onMapReadyRef.current = onMapReady;
  selectedRef.current = selectedId;
  modeRef.current = mapMode;
  scrollRef.current = scrollWheelZoom;
  countsRef.current = counts;
  showCountsRef.current = showCounts;
  choroplethRef.current = choropleth;
  casesRef.current = cases;
  onCaseSelectRef.current = onCaseSelect;
  focusPointRef.current = focusPoint;
  focusZoomRef.current = focusZoom;
  readOnlyRef.current = readOnly;

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
        markersRef.current = leaflet.layerGroup().addTo(map);

        // Count badges are only useful while the sectors are large enough on
        // screen; hide them when zoomed far out.
        map.on("zoomend", () => syncCountMarkers());

        // A sticky tooltip anchored to the cursor survives a drag and then
        // floats over whatever sector is under the pointer. Close it whenever
        // the map moves or a sector is selected so no stale overlay remains.
        map.on("movestart click", () => {
          geoLayerRef.current?.eachLayer((layer) => layer.closeTooltip());
        });

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
              interactive: !readOnlyRef.current,
              style: (feature) =>
                polygonStyle(
                  feature ? featureName(feature) : undefined,
                  false,
                  countsRef.current,
                  choroplethRef.current,
                ),
              onEachFeature: (feature, sublayer) => {
                const name = featureName(feature);
                const id = name ? OFFICIAL_TO_ID[name] : undefined;
                if (!id) return;

                const coordinates = (
                  feature.geometry as unknown as { coordinates: GeoPolygon }
                ).coordinates;
                centroidsRef.current.set(id, polygonCenter(coordinates));
                labelPointsRef.current.set(id, polygonLabelPoint(coordinates));
                if (readOnlyRef.current) return;
                sublayer.bindTooltip(
                  tooltipFor(id, countsRef.current, showCountsRef.current),
                  { sticky: true, opacity: 1 },
                );
                sublayer.on("click", () => {
                  onSelectRef.current(id);
                  // Clicking an SVG path gives it keyboard focus, which draws
                  // the browser's default rectangular outline over the
                  // polygon. Drop it so only our own selection style shows.
                  const path = (sublayer as L.Path).getElement() as
                    | HTMLElement
                    | null;
                  path?.blur();
                });
              },
            },
          ).addTo(map);
          geoLayerRef.current = layer;
          applySelection(selectedRef.current);
          syncCountMarkers();

          // The selection effect may have run before the async init finished;
          // center the initial view now that centroids exist.
          const exact = focusPointRef.current;
          if (exact) {
            focusMap(map, exact, Math.max(map.getZoom(), focusZoomRef.current));
          } else if (selectedRef.current) {
            const initial = centroidsRef.current.get(selectedRef.current);
            if (initial) {
              focusMap(map, initial, Math.max(map.getZoom(), 13));
            }
          } else {
            map.fitBounds(layer.getBounds(), {
              padding: [24, 24],
              animate: false,
            });
          }
        } catch {
          if (!cancelled) {
            setStatus(
              "error: no se pudieron cargar los límites territoriales.",
            );
          }
        }

        onMapReadyRef.current?.(map);
        syncMarkers();
        setStatus("listo");
      } catch (error) {
        setStatus(
          `error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    function applySelection(id: string | null) {
      const layer = geoLayerRef.current;
      if (!layer) return;
      restyleLayer(
        layer,
        id,
        countsRef.current,
        showCountsRef.current,
        choroplethRef.current,
      );
    }

    function syncCountMarkers() {
      const leaflet = leafletRef.current;
      const map = mapRef.current;
      if (!leaflet || !map) return;
      const markers = countMarkersRef.current;

      if (!showCountsRef.current) {
        for (const marker of markers.values()) marker.remove();
        markers.clear();
        return;
      }

      const visible = map.getZoom() >= 12;
      for (const [id, coords] of labelPointsRef.current) {
        const count = countsRef.current?.[id] ?? 0;
        const modifier =
          count === 0
            ? " sector-count-marker--zero"
            : count >= 4
              ? " sector-count-marker--on-dark"
              : "";
        const icon = leaflet.divIcon({
          className: `sector-count-marker${modifier}`,
          html: `<span>${count}</span>`,
          iconSize: [26, 20],
          iconAnchor: [13, 10],
        });

        let marker = markers.get(id);
        if (marker) {
          marker.setIcon(icon);
        } else {
          marker = leaflet
            .marker(coords, {
              icon,
              interactive: false,
              keyboard: false,
              zIndexOffset: 1000,
            })
            .addTo(map);
          markers.set(id, marker);
        }

        const element = marker.getElement();
        if (element) {
          element.dataset.sector = id;
          element.style.display = visible ? "" : "none";
          element.title = `${count} emergencias`;
        }
      }
    }

    function syncMarkers() {
      const leaflet = leafletRef.current;
      const group = markersRef.current;
      if (!leaflet || !group) return;
      group.clearLayers();
      for (const item of casesRef.current ?? []) {
        if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
          continue;
        }
        const marker = leaflet.circleMarker([item.latitude, item.longitude], {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: caseColor(item.category),
          fillOpacity: 1,
        });
        marker.bindTooltip(
          `<strong>${escapeHtml(item.code)}</strong><br/>${escapeHtml(item.title)} · ${escapeHtml(item.categoryLabel)}`,
          { direction: "top", offset: [0, -8], opacity: 1 },
        );
        marker.on("click", (event) => {
          leaflet.DomEvent.stopPropagation(event);
          onCaseSelectRef.current?.(item.id);
        });
        marker.addTo(group);
      }
    }

    syncMarkersRef.current = syncMarkers;
    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      geoLayerRef.current = null;
      markersRef.current = null;
      centroidsRef.current.clear();
      labelPointsRef.current.clear();
      countMarkersRef.current.clear();
      syncCountsRef.current = () => {};
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

    restyleLayer(
      layer,
      selectedId,
      countsRef.current,
      showCountsRef.current,
      choroplethRef.current,
    );

    if (!selectedId) {
      map.fitBounds(layer.getBounds(), {
        padding: [24, 24],
        animate: false,
      });
      return;
    }

    const exact = focusPointRef.current;
    if (exact) {
      focusMap(map, exact, Math.max(map.getZoom(), focusZoomRef.current));
      return;
    }

    const coords = centroidsRef.current.get(selectedId);
    focusMap(
      map,
      coords ?? TEMUCO_CENTER,
      Math.max(map.getZoom(), coords ? 13 : 12),
    );
  }, [selectedId, focusKey]);

  // Refresh fills, tooltips and count badges when data or mode changes.
  useEffect(() => {
    const layer = geoLayerRef.current;
    if (layer) {
      restyleLayer(
        layer,
        selectedRef.current,
        counts,
        showCounts,
        choropleth,
      );
    }
    syncCountsRef.current();
  }, [counts, showCounts, choropleth]);

  // Render one point per emergency at its exact coordinates. Colors follow
  // the status palette so the point reads the same as its stamp.
  useEffect(() => {
    syncMarkersRef.current();
  }, [cases]);

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
