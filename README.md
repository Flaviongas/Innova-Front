# Innova Front — Ayudas y Emergencias

Municipal aid and emergency operations dashboard, wired to the Innova-Back
API. It follows the visual system in [`DESIGN.md`](./DESIGN.md) and the
process context in [`proceso-interno-municipalidad.md`](./proceso-interno-municipalidad.md).
The backend contract is documented separately with the backend
(`InnovaBackApp::router` in `src/main.rs`).

## Routes

- `/` — Public landing page (hero, aid types, transparency).
- `/seguimiento` — Public code lookup (state tracker, case facts, deliveries and a read-only map with the macrosector highlighted), no login required.
- `/login` — Institutional login and account creation (backend auth).
- `/panel` — Full-screen operations dashboard (map workspace + inspector, admin only).
- `/panel?vista=casos` — Deep link to the full cases queue inside the panel.
- `/panel?vista=indicadores` — Analytical dashboard (KPIs, trends, territorial ranking and frequency heatmap).

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI talks to the backend directly in the browser. Set the backend URL in
`.env.local` (gitignored, you create it yourself) and restart the dev server
— Next.js reads env files once at startup:

```bash
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
NEXT_PUBLIC_MAP_TILE_KEY="tu-clave-carto"
```

Without `NEXT_PUBLIC_API_URL` it defaults to `http://127.0.0.1:8000`.
Without the tile key, CARTO serves an "API key required" watermark and the
map looks empty.

## Troubleshooting connectivity

The login and the panel show the exact cause when the backend is
unreachable. Work through this list:

1. **Is the backend running?** In a terminal:
   ```bash
   curl http://127.0.0.1:8000/api/health
   ```
   It must answer `{"status":"ok"}`. If not, start the backend first.
2. **Did the frontend load the URL?** `NEXT_PUBLIC_*` variables are baked
   in at build/dev-server start. After creating or editing `.env.local`,
   restart `npm run dev` (or rebuild for `npm start`).
3. **Testing from a phone?** `127.0.0.1` on the phone means the phone
   itself, not your PC. Point the variable at your PC's LAN address
   instead, e.g. `NEXT_PUBLIC_API_URL="http://192.168.1.6:8000"`, make
   sure the backend listens on all interfaces, and restart the dev
   server. The phone and the PC must share the same Wi-Fi.
4. **CORS message?** The browser reached the backend but was refused.
   The backend must allow the frontend origin (e.g.
   `http://localhost:3000`, or the LAN URL when testing from mobile).

Production build:

```bash
npm run build
npm start
```

## Included

- Landing page with live-map hero, aid timeline, public code lookup (no login), and transparency section.
- Login page with real authentication and account creation; token session with wired logout.
- Full viewport panel: no outer frame or padding, map fills the screen. Requires login; emergencies and stock require an administrator role.
- Casos queue: full-width operational view with totals per state, text search, state/category/help filters, and a sortable-by-recency table that opens the detail drawer. Every count comes from the API; territories without cases stay at zero.
- Indicadores: global territory selector (Ciudad + macrosectors) shared with the map, inspector and queue; 1–12 month period; a report-style lead summary with one dominant figure and a compact ledger; monthly bars; flat horizontal bar breakdowns for needs, event types and deliveries; citywide territorial ranking with the selected sector highlighted; current-state bar; GitHub-style daily contribution calendar; and DOCX export with scope (current period or last month) plus per-section selection. Fed by `GET /api/admin/dashboard`; the daily calendar renders once the backend serves the per-day series.
- Aid deliveries are recorded from the case drawer; delivery totals per case appear in the inspector help-type mix.
- Emergencies: live list with search, detail drawer (state transitions, edit, delivery recording with atomic stock decrement), and creation form (title, category, help type, address, GPS **or** manual latitude/longitude with automatic macrosector lookup, initial state).
- Interactive map (Leaflet): drag to pan, scroll to zoom, click an official macrosector polygon to select it; map/satellite toggle, zoom buttons, recenter, and fullscreen. Choropleth colors map each exact count (0, 1, 2, 3, 4, 5+) to a distinct blue, and each sector shows its count as a map label inside the polygon.
  - Base layers: CARTO light (`light_all`, © OpenStreetMap contributors, © CARTO) and Esri World Imagery for satellite.
- Territory inspector with live event counts, in-process counts, delivered units, and help-type mix per macrosector.
- Operational alerts derived from live data (low stock, unattended recibido cases) in the notification popover.
- Bodega modal: stock list with low-stock flags. “Registrar compra” and “Nuevo artículo” open as nested modals from two buttons.
- Location capture in the Nuevo caso form: GPS via the browser Geolocation API (requires HTTPS in production, or localhost in development, plus OS/browser permission) or manual latitude/longitude entry, with two-way address lookup (address → coordinates and back, via OpenStreetMap Nominatim). The edit form accepts manual coordinates too. On submit the map flies to the exact point.
- Demo OCR in the Nuevo caso form: uploading a photo autocompletes title, type, address and coordinates with simulated data. The image stays in the browser and no OCR service is called.
- Interactive map (Leaflet): drag to pan, scroll to zoom, click an official macrosector polygon to select it; map/satellite toggle, zoom buttons, recenter, and fullscreen. Choropleth colors map each exact count (0, 1, 2, 3, 4, 5+) to a distinct blue, each sector shows its count as a map label at the centroid, and every emergency renders as a point at its exact coordinates (colored by category — red incendio, orange terremoto, blue inundación, green temporal, gray otro; click to open). Ciudad mode removes the highlight and fits all sectors.
- Desktop, tablet, and mobile layouts. On mobile the inspector becomes a bottom sheet.

## Notes

- Territorial boundaries are the official municipal polygons, vendored at `public/data/macrosectores.geojson` (Servicio de Macrosectores, IDE Temuco; public query and download, attribution required). The rural entry has no published geometry yet and is list-only until the municipality confirms it.
- The backend stores no personal data: the intake form collects event data only (title, category, help type, address, coordinates, state).
- The project uses Next.js 16, React 19, TypeScript, Leaflet, Lucide icons, and `docx` for client-side report generation.

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
  casos-view.tsx                 Cases queue: totals, filters, table
  indicadores-view.tsx           Dashboard: KPIs, bars, daily calendar
  sector-picker.tsx              Global Ciudad + macrosector selector
  status-badge.tsx               Shared outline status stamp
  interactive-territory-map.tsx  Leaflet map: tiles, choropleth polygons
  landing-hero-map.tsx           Hero wrapper (map + territory caption)
  emergency-lookup.tsx           Public code lookup (no login)
  login-form.tsx     Login and registration form (backend auth)
  login-territories.tsx  Real-polygon backdrop for login
lib/
  api.ts             Typed Innova-Back client (NEXT_PUBLIC_API_URL)
  geocode.ts         Browser address lookup via Nominatim (OSM, no key)
  data.ts          Sector reference data (labels, colors)
  macrosectores.ts   GeoJSON loader, official-name join, centroids
  map-focus.ts       Safe recenter: instant zoom, animated pan only
  dashboard.ts       Dashboard types, palette and API adapter
  dashboard-docx.ts  Client-side DOCX report builder
public/
  data/
    macrosectores.geojson  Official boundaries (IDE Temuco, WGS84)
```
