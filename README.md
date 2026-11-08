# SEABLING Cultural Atlas & 3D Model Studio

A Next.js application with an interactive Southeast Asia map and a 3D GLB model
viewer. The viewer supports orbit, zoom, pan, lighting, shadows, auto-centering,
and live position, rotation, and scale controls.

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

SVG strokes use `vector-effect: non-scaling-stroke`, and the source viewBox
matches its intrinsic `2400 × 1792` dimensions so the browser can render the map
as a vector at each device pixel ratio.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/model-viewer](http://localhost:3000/model-viewer) to
view the 3D model, or [http://localhost:3000](http://localhost:3000) for the
interactive map. The map and viewer link to each other.

## Add or replace the model

1. Install the viewer dependencies (already declared in this project's
   `package.json`):

   ```bash
   npm install @react-three/fiber @react-three/drei three
   ```

2. Create `public/models/` if it does not exist.
3. Copy a GLB 2.0 model to `public/models/model.glb`. For example:

   ```bash
   mkdir -p public/models
   cp "/path/to/your/model.glb" public/models/model.glb
   ```

4. Run `npm run dev` and open `/model-viewer`.

The app loads the file locally from `/models/model.glb`; no external hosting or
access token is required. To use a differently named model, update `MODEL_URL`
in `components/model-viewer/ModelCanvas.tsx`.

```text
app/
  model-viewer/page.tsx
components/model-viewer/
  ModelCanvas.tsx
  ModelViewer.tsx
  ModelViewer.module.css
  types.ts
public/
  models/
    model.glb
```

## Dependencies

The viewer uses React Three Fiber, Drei, and Three.js. They are declared in
`package.json` and installed by `npm install`. To add the viewer to a fresh
Next.js project, install them with:

```bash
npm install @react-three/fiber @react-three/drei three
```

The route and component files in the tree are included in this repository. A
loading progress indicator and retryable error state are shown if the model is
missing or invalid.
