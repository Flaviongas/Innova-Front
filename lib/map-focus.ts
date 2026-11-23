import type L from "leaflet";

/**
 * Center the map on a point without an animated zoom.
 *
 * Leaflet's `flyTo` animates through fractional zoom levels. If the user
 * starts dragging or wheel-zooming during that animation, the map can be
 * left at a fractional zoom while the SVG overlay keeps the previous
 * projection, so every polygon shifts relative to the basemap.
 *
 * Panning at a fixed zoom is safe: the vector layer and the tiles share the
 * same transform. When the zoom must change, apply it instantly and only
 * animate the pan.
 */
export function focusMap(
  map: L.Map,
  center: L.LatLngExpression,
  targetZoom: number,
): void {
  // Zoom changes are instant; only the recenter is animated. `panTo` never
  // changes the zoom, so tiles and vectors always share the same transform.
  if (map.getZoom() !== targetZoom) {
    map.setZoom(targetZoom, { animate: false });
  }
  map.panTo(center, { animate: true, duration: 0.6 });
}
