# SEABLING Cultural Atlas

A Next.js application with an interactive Southeast Asia map.

The map uses the vector site plan at `public/images/venue-map.svg`. Replace that
file to update the map artwork while keeping the existing zone markers and
interactions. The collapsible **Map Editor** panel adjusts the artwork and
markers together; use **Copy config** to copy a ready-to-paste
`venueMapTransform` object from `data/venueZones.ts`.

The map component owns and wires the transform panel:

```tsx
import AseanMap from "@/components/AseanMap";
import { venueZones } from "@/data/venueZones";

<AseanMap
  zones={venueZones}
  selectedZoneId={selectedZoneId}
  onZoneSelect={setSelectedZoneId}
/>;
```

The map asset is parsed into inline SVG paths at runtime. Pan and zoom update the
SVG `viewBox` directly rather than scaling a rasterized image or CSS-transformed
layer, preserving vector sharpness across device pixel ratios. SVG strokes use
`vector-effect: non-scaling-stroke`, and the source `viewBox` is `2400 × 1792`.
Drag to pan, use the mouse wheel or pinch to zoom, or use the on-screen controls.
The map asset is fetched from `public/images/venue-map.svg` and only its SVG
`viewBox` and path geometry/style attributes are used to create the inline SVG.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the map.
