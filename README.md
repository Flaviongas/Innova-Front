# Innova Front — Ayudas y Emergencias

Municipal aid and emergency operations prototype. It follows the visual system in [`DESIGN.md`](./DESIGN.md) and the process context in [`proceso-interno-municipalidad.md`](./proceso-interno-municipalidad.md).

## Routes

- `/` — Public landing page (process, aid types, transparency, CTA).
- `/login` — Institutional login. The form and demo link go to `/panel`; nothing is authenticated yet.
- `/panel` — Full-screen operations dashboard (map workspace + inspector).

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

## Included

- Landing page with hero, referential territory map, process steps, aid types, transparency section, and CTA.
- Login page with institutional form (non-functional), demo entry, and show/hide password.
- Full viewport panel: no outer frame or padding, map fills the screen.
- Interactive map (Leaflet): drag to pan, scroll to zoom, click a macrosector marker to select it; map/satellite toggle, zoom buttons, recenter, and fullscreen.
  - Base layers: CARTO light (`light_all`, © OpenStreetMap contributors, © CARTO) and Esri World Imagery for satellite.
  - CARTO requires an API key: without one it serves an "API key required" watermark and the map looks empty. Create `.env.local` in the project root (gitignored, you create it yourself) with `NEXT_PUBLIC_MAP_TILE_KEY="tu-clave"`, then restart the dev server. No other change needed — the key is appended as `?key=` automatically.
  - Markers use approximate reference coordinates for each macrosector; replace with official macrosector GeoJSON when available.
- Map-first workspace with referential macrosector geography and selectable markers.
- Territory inspector with cases, people, attentions, aid distribution, and month-over-month variation.
- Recent cases with filtering, status badges, and urgent markers.
- Operational alerts for pending regularization, stock minimums, and observed documents.
- Map/satellite mode, zoom, fullscreen, layer notice, locate, collapsible panels, and a responsive inspector.
- New-case modal, notification popover, account menu, and action toasts.
- GPS capture in the Nuevo caso form via the browser Geolocation API (requires HTTPS in production, or localhost in development, plus OS/browser permission). On submit with coordinates, the map flies to the exact point.
- Desktop, tablet, and mobile layouts. On mobile the inspector becomes a bottom sheet and the map is cropped around the selected territory.

## Notes

- All case, person, and territory data is synthetic and for interface prototyping only.
- Forms, filters, and actions are local UI interactions; there is no backend or persistence yet.
- Territorial boundaries are the official municipal polygons, vendored at `public/data/macrosectores.geojson` (Servicio de Macrosectores, IDE Temuco; public query and download, attribution required). Per-sector case counts remain synthetic. The rural entry has no published geometry yet and is list-only until the municipality confirms it.
- Workflow rules that are not confirmed in the source document are not hard-coded in this frontpage. The prototype intentionally keeps the UI flexible.
- The project uses Next.js 16, React 19, TypeScript, and Lucide icons.

## Structure

```text
app/
  globals.css      Design tokens and panel styles
  marketing.css    Landing and login styles
  layout.tsx       Metadata and font setup
  page.tsx         Landing page (/)
  login/
    page.tsx       Login page (/login)
  panel/
    page.tsx       Dashboard shell and interactions (/panel)
    layout.tsx     Panel metadata
components/
  territory-map.tsx  Referential macrosector map (panel)
  landing-map.tsx    Referential macrosector map (landing)
  login-form.tsx     Login form (non-functional)
lib/
  data.ts          Synthetic macrosectors, cases, and alerts
```
