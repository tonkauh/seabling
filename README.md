# SEABLING Cultural Atlas

A Next.js application with an interactive Southeast Asia map.

The map uses the vector site plan at `public/images/venue-map.svg`. Replace that
file to update the map artwork while keeping the existing zone markers and
interactions.

The map component owns the map navigation and zone interactions:

```tsx
import AseanMap from "@/components/AseanMap";
import { venueZones } from "@/data/venueZones";

<AseanMap
  zones={venueZones}
  selectedZoneId={selectedZoneId}
  onZoneSelect={setSelectedZoneId}
/>;
```

The map asset is parsed into inline SVG paths at runtime. Drag to pan, use the
mouse wheel or pinch to zoom, or use the on-screen zoom and reset controls. The
map asset is fetched from `public/images/venue-map.svg` and only its SVG
`viewBox` and path geometry/style attributes are used to create the inline SVG.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the map.
