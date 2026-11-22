# Innova Front — Ayudas y Emergencias

Municipal aid and emergency operations dashboard, wired to the Innova-Back
API. It follows the visual system in [`DESIGN.md`](./DESIGN.md) and the
process context in [`proceso-interno-municipalidad.md`](./proceso-interno-municipalidad.md).
The backend contract is documented separately with the backend
(`InnovaBackApp::router` in `src/main.rs`).

## Routes

- `/` — Public landing page (hero, aid types, transparency).
- `/seguimiento` — Public code lookup, no login required.
- `/login` — Institutional login and account creation (backend auth).
- `/panel` — Full-screen operations dashboard (map workspace + inspector, admin only).

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

Production build:

```bash
npm run build
npm start
```

## Included

- Landing page with live-map hero, aid timeline, public code lookup (no login), and transparency section.
- Login page with real authentication and account creation; token session with wired logout.
- Full viewport panel: no outer frame or padding, map fills the screen. Requires login; emergencies and stock require an administrator role.
- Emergencies: live list with search, detail drawer (state transitions, edit, delivery recording with atomic stock decrement), and creation form (title, category, help type, address, required GPS with automatic macrosector lookup, initial state).
- Interactive map (Leaflet): drag to pan, scroll to zoom, click an official macrosector polygon to select it; map/satellite toggle, zoom buttons, recenter, and fullscreen. Choropleth colors come from live per-sector counts.
  - Base layers: CARTO light (`light_all`, © OpenStreetMap contributors, © CARTO) and Esri World Imagery for satellite.
- Territory inspector with live event counts, in-process counts, delivered units, and help-type mix per macrosector.
- Operational alerts derived from live data (low stock, unattended recibido cases) with matching notifications.
- Bodega modal: stock list with low-stock flags, new items, and purchase movements.
- GPS capture in the Nuevo caso form via the browser Geolocation API (requires HTTPS in production, or localhost in development, plus OS/browser permission). On submit the map flies to the exact point.
- Desktop, tablet, and mobile layouts. On mobile the inspector becomes a bottom sheet.

## Notes

- Territorial boundaries are the official municipal polygons, vendored at `public/data/macrosectores.geojson` (Servicio de Macrosectores, IDE Temuco; public query and download, attribution required). The rural entry has no published geometry yet and is list-only until the municipality confirms it.
- The backend stores no personal data: the intake form collects event data only (title, category, help type, address, coordinates, state).
- The project uses Next.js 16, React 19, TypeScript, Leaflet, and Lucide icons.

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
  interactive-territory-map.tsx  Leaflet map: tiles, choropleth polygons
  landing-hero-map.tsx           Hero wrapper (map + territory caption)
  emergency-lookup.tsx           Public code lookup (no login)
  login-form.tsx     Login and registration form (backend auth)
  login-territories.tsx  Real-polygon backdrop for login
lib/
  api.ts             Typed Innova-Back client (NEXT_PUBLIC_API_URL)
  data.ts          Sector reference data (labels, colors)
  macrosectores.ts   GeoJSON loader, official-name join, centroids
public/
  data/
    macrosectores.geojson  Official boundaries (IDE Temuco, WGS84)
```
