"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import type { VenueMapTransform, VenueZone } from "@/data/venueZones";
import { venueMapTransform } from "@/data/venueZones";
import MapControls from "@/components/MapControls";
import MapTransformPanel from "@/components/MapTransformPanel";

const MAP_URL = "/images/venue-map.svg";
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

type ViewBox = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type SvgPath = {
  d: string;
  fill: string | null;
  stroke: string | null;
  strokeWidth: string | null;
  strokeMiterlimit: string | null;
};
type SvgArtwork = { viewBox: ViewBox; paths: SvgPath[] };
type Camera = { zoom: number; centerX: number; centerY: number };

function readSvgArtwork(source: string): SvgArtwork {
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;
  const viewBoxValues = root
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);

  if (
    root.localName !== "svg" ||
    document.querySelector("parsererror") ||
    !viewBoxValues ||
    viewBoxValues.length !== 4 ||
    !viewBoxValues.every(Number.isFinite) ||
    viewBoxValues[2] <= 0 ||
    viewBoxValues[3] <= 0
  ) {
    throw new Error("The map SVG is invalid or has no usable viewBox.");
  }

  const paths = Array.from(root.querySelectorAll("path"))
    .map((path) => ({
      d: path.getAttribute("d") ?? "",
      fill: path.getAttribute("fill"),
      stroke: path.getAttribute("stroke"),
      strokeWidth: path.getAttribute("stroke-width"),
      strokeMiterlimit: path.getAttribute("stroke-miterlimit"),
    }))
    .filter((path) => path.d.length > 0);

  if (paths.length === 0) {
    throw new Error("The map SVG does not contain any vector paths.");
  }

  return {
    viewBox: {
      x: viewBoxValues[0],
      y: viewBoxValues[1],
      width: viewBoxValues[2],
      height: viewBoxValues[3],
    },
    paths,
  };
}

function clampCamera(camera: Camera, base: ViewBox, map: ViewBox): Camera {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom));
  const width = base.width / zoom;
  const height = base.height / zoom;

  return {
    zoom,
    centerX: Math.min(
      map.x + map.width - width / 2,
      Math.max(map.x + width / 2, camera.centerX),
    ),
    centerY: Math.min(
      map.y + map.height - height / 2,
      Math.max(map.y + height / 2, camera.centerY),
    ),
  };
}

function getPinPosition(
  zone: VenueZone,
  map: ViewBox,
  transform: VenueMapTransform,
) {
  const centerX = map.x + map.width / 2;
  const centerY = map.y + map.height / 2;
  const originalX = map.x + (zone.position.left / 100) * map.width;
  const originalY = map.y + (zone.position.top / 100) * map.height;
  const radians = (transform.rotation * Math.PI) / 180;
  const rotatedX =
    (originalX - centerX) * Math.cos(radians) -
    (originalY - centerY) * Math.sin(radians);
  const rotatedY =
    (originalX - centerX) * Math.sin(radians) +
    (originalY - centerY) * Math.cos(radians);

  return {
    x:
      centerX +
      (transform.offsetXPercent / 100) * map.width +
      rotatedX * transform.scale,
    y:
      centerY +
      (transform.offsetYPercent / 100) * map.height +
      rotatedY * transform.scale,
  };
}

function ZonePin({
  zone,
  number,
  selected,
  onSelect,
  position,
  viewBox,
  viewportSize,
  zoom,
  transform,
}: {
  zone: VenueZone;
  number: string;
  selected: boolean;
  onSelect: () => void;
  position: Point;
  viewBox: ViewBox;
  viewportSize: Point;
  zoom: number;
  transform: VenueMapTransform;
}) {
  const x = ((position.x - viewBox.x) / viewBox.width) * viewportSize.x;
  const y = ((position.y - viewBox.y) / viewBox.height) * viewportSize.y;

  return (
    <button
      type="button"
      className={`map-pin map-pin--${zone.labelPlacement} map-pin--${zone.id}${selected ? " map-pin--selected" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: transform.zIndex + 1,
        opacity: transform.opacity,
        transform: `translate(-50%, -50%) scale(${zoom * transform.scale}) rotate(${transform.rotation}deg)`,
        transformOrigin: "center",
      }}
      onClick={onSelect}
      aria-label={`Explore ${zone.zoneName}, ${zone.countryName}`}
      aria-pressed={selected}
    >
      <span className="map-pin__marker" aria-hidden="true">
        <span className="map-pin__pulse" />
        <span className="map-pin__badge">
          <span className="map-pin__badge-number">{number}</span>
        </span>
        <span className="map-pin__shadow" />
      </span>
      <span className="map-pin__label">
        <span className="map-pin__flag" aria-hidden="true">
          {zone.flag}
        </span>
        <span className="map-pin__label-copy">
          <strong>{zone.zoneName}</strong>
          <span>Explore zone</span>
        </span>
      </span>
    </button>
  );
}

export default function AseanMap({
  zones,
  selectedZoneId,
  onZoneSelect,
}: {
  zones: VenueZone[];
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerPositions = useRef(new Map<number, Point>());
  const [artwork, setArtwork] = useState<SvgArtwork | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState<Point>({ x: 0, y: 0 });
  const [camera, setCamera] = useState<Camera>({
    zoom: MIN_ZOOM,
    centerX: 1200,
    centerY: 896,
  });
  const [mapTransform, setMapTransform] = useState<VenueMapTransform>({
    ...venueMapTransform,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadMap() {
      try {
        const response = await fetch(MAP_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Could not load map artwork (${response.status}).`);
        }
        setArtwork(readSvgArtwork(await response.text()));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not load the venue map SVG.", error);
        setLoadError(
          error instanceof Error ? error.message : "Could not load the map SVG.",
        );
      }
    }

    void loadMap();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({
        x: entry.contentRect.width,
        y: entry.contentRect.height,
      });
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!artwork) return;
    setCamera((current) =>
      current.zoom === MIN_ZOOM
        ? {
            ...current,
            centerX: artwork.viewBox.x + artwork.viewBox.width / 2,
            centerY: artwork.viewBox.y + artwork.viewBox.height / 2,
          }
        : current,
    );
  }, [artwork]);

  const baseViewBox = useMemo((): ViewBox => {
    if (!artwork) return { x: 0, y: 0, width: 2400, height: 1792 };

    const { viewBox } = artwork;
    if (viewportSize.x <= 0 || viewportSize.y <= 0) return viewBox;

    const viewportAspect = viewportSize.x / viewportSize.y;
    const mapAspect = viewBox.width / viewBox.height;
    if (viewportAspect >= mapAspect) {
      const height = viewBox.width / viewportAspect;
      return {
        x: viewBox.x,
        y: viewBox.y + (viewBox.height - height) / 2,
        width: viewBox.width,
        height,
      };
    }

    const width = viewBox.height * viewportAspect;
    return {
      x: viewBox.x + (viewBox.width - width) / 2,
      y: viewBox.y,
      width,
      height: viewBox.height,
    };
  }, [artwork, viewportSize.x, viewportSize.y]);

  const mapViewBox = useMemo(() => {
    const map = artwork?.viewBox ?? {
      x: 0,
      y: 0,
      width: 2400,
      height: 1792,
    };
    const boundedCamera = clampCamera(camera, baseViewBox, map);
    const width = baseViewBox.width / boundedCamera.zoom;
    const height = baseViewBox.height / boundedCamera.zoom;

    return {
      x: boundedCamera.centerX - width / 2,
      y: boundedCamera.centerY - height / 2,
      width,
      height,
    };
  }, [artwork, baseViewBox, camera]);

  const zoomAt = useCallback(
    (factor: number, anchor?: Point) => {
      setCamera((current) => {
        const bounded = clampCamera(
          current,
          baseViewBox,
          artwork?.viewBox ?? { x: 0, y: 0, width: 2400, height: 1792 },
        );
        const zoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, bounded.zoom * factor),
        );
        if (!anchor || viewportSize.x <= 0 || viewportSize.y <= 0) {
          return clampCamera(
            { ...bounded, zoom },
            baseViewBox,
            artwork?.viewBox ?? { x: 0, y: 0, width: 2400, height: 1792 },
          );
        }

        const mapX =
          mapViewBox.x + (anchor.x / viewportSize.x) * mapViewBox.width;
        const mapY =
          mapViewBox.y + (anchor.y / viewportSize.y) * mapViewBox.height;
        const ratio = zoom / bounded.zoom;

        return clampCamera(
          {
            zoom,
            centerX: mapX + (bounded.centerX - mapX) * ratio,
            centerY: mapY + (bounded.centerY - mapY) * ratio,
          },
          baseViewBox,
          artwork?.viewBox ?? { x: 0, y: 0, width: 2400, height: 1792 },
        );
      });
    },
    [artwork, baseViewBox, mapViewBox, viewportSize.x, viewportSize.y],
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      zoomAt(Math.exp(-event.deltaY * 0.0015), {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    },
    [zoomAt],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("button")) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerPositions.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const previous = pointerPositions.current.get(event.pointerId);
      if (!previous || viewportSize.x <= 0 || viewportSize.y <= 0) return;

      const previousPointers = Array.from(pointerPositions.current.values());
      const current = { x: event.clientX, y: event.clientY };
      pointerPositions.current.set(event.pointerId, current);
      const pointers = Array.from(pointerPositions.current.values());
      const bounds = event.currentTarget.getBoundingClientRect();
      const map = artwork?.viewBox ?? {
        x: 0,
        y: 0,
        width: 2400,
        height: 1792,
      };

      if (pointers.length >= 2) {
        const [first, second] = pointers;
        const [oldFirst, oldSecond] = previousPointers;
        const oldMid = {
          x: (oldFirst.x + oldSecond.x) / 2 - bounds.left,
          y: (oldFirst.y + oldSecond.y) / 2 - bounds.top,
        };
        const newMid = {
          x: (first.x + second.x) / 2 - bounds.left,
          y: (first.y + second.y) / 2 - bounds.top,
        };
        const oldDistance = Math.hypot(
          oldFirst.x - oldSecond.x,
          oldFirst.y - oldSecond.y,
        );
        const newDistance = Math.hypot(
          first.x - second.x,
          first.y - second.y,
        );
        if (oldDistance <= 0) return;

        setCamera((currentCamera) => {
          const bounded = clampCamera(currentCamera, baseViewBox, map);
          const zoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, bounded.zoom * (newDistance / oldDistance)),
          );
          const anchorX =
            mapViewBox.x + (oldMid.x / viewportSize.x) * mapViewBox.width;
          const anchorY =
            mapViewBox.y + (oldMid.y / viewportSize.y) * mapViewBox.height;
          const ratio = zoom / bounded.zoom;

          return clampCamera(
            {
              zoom,
              centerX:
                anchorX +
                (bounded.centerX - anchorX) * ratio -
                ((newMid.x - oldMid.x) * baseViewBox.width) /
                  (viewportSize.x * zoom),
              centerY:
                anchorY +
                (bounded.centerY - anchorY) * ratio -
                ((newMid.y - oldMid.y) * baseViewBox.height) /
                  (viewportSize.y * zoom),
            },
            baseViewBox,
            map,
          );
        });
        return;
      }

      const deltaX = current.x - previous.x;
      const deltaY = current.y - previous.y;
      setCamera((currentCamera) => {
        const bounded = clampCamera(currentCamera, baseViewBox, map);
        return clampCamera(
          {
            ...bounded,
            centerX:
              bounded.centerX -
              (deltaX * baseViewBox.width) / (viewportSize.x * bounded.zoom),
            centerY:
              bounded.centerY -
              (deltaY * baseViewBox.height) / (viewportSize.y * bounded.zoom),
          },
          baseViewBox,
          map,
        );
      });
    },
    [
      artwork,
      baseViewBox,
      mapViewBox,
      viewportSize.x,
      viewportSize.y,
    ],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      pointerPositions.current.delete(event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const resetCamera = useCallback(() => {
    const map = artwork?.viewBox ?? {
      x: 0,
      y: 0,
      width: 2400,
      height: 1792,
    };
    setCamera({
      zoom: MIN_ZOOM,
      centerX: map.x + map.width / 2,
      centerY: map.y + map.height / 2,
    });
  }, [artwork]);

  const resetMapTransform = useCallback(() => {
    setMapTransform({ ...venueMapTransform });
  }, []);

  const map = artwork?.viewBox ?? {
    x: 0,
    y: 0,
    width: 2400,
    height: 1792,
  };
  const mapCenterX = map.x + map.width / 2;
  const mapCenterY = map.y + map.height / 2;
  const offsetX = (mapTransform.offsetXPercent / 100) * map.width;
  const offsetY = (mapTransform.offsetYPercent / 100) * map.height;

  return (
    <section className="map-stage" aria-label="Interactive SEABLING venue map">
      <div
        ref={viewportRef}
        className="map-vector-viewport"
        role="region"
        aria-label="Pan and zoom the SEABLING vector venue map"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {artwork ? (
          <>
            <svg
              className="map-vector-art"
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`${mapViewBox.x} ${mapViewBox.y} ${mapViewBox.width} ${mapViewBox.height}`}
              preserveAspectRatio="none"
              shapeRendering="geometricPrecision"
              textRendering="optimizeLegibility"
              role="img"
              aria-label="Vector site plan of the SEABLING festival grounds"
              style={{
                opacity: mapTransform.opacity,
                zIndex: mapTransform.zIndex,
              }}
            >
              <g
                transform={`translate(${mapCenterX + offsetX} ${mapCenterY + offsetY}) rotate(${mapTransform.rotation}) scale(${mapTransform.scale}) translate(${-mapCenterX} ${-mapCenterY})`}
              >
                {artwork.paths.map((path, index) => (
                  <path
                    key={index}
                    d={path.d}
                    fill={path.fill ?? "none"}
                    stroke={path.stroke ?? "none"}
                    strokeWidth={path.strokeWidth ?? undefined}
                    strokeMiterlimit={path.strokeMiterlimit ?? undefined}
                    vectorEffect="non-scaling-stroke"
                    shapeRendering="geometricPrecision"
                  />
                ))}
              </g>
            </svg>
            {viewportSize.x > 0 &&
              viewportSize.y > 0 &&
              zones.map((zone, index) => (
              <ZonePin
                key={zone.id}
                zone={zone}
                number={String(index + 1).padStart(2, "0")}
                selected={selectedZoneId === zone.id}
                onSelect={() => onZoneSelect(zone.id)}
                position={getPinPosition(zone, map, mapTransform)}
                viewBox={mapViewBox}
                viewportSize={viewportSize}
                zoom={camera.zoom}
                transform={mapTransform}
              />
              ))}
          </>
        ) : (
          <div
            className="map-vector-status"
            role={loadError ? "alert" : "status"}
          >
            {loadError ?? "Loading vector map…"}
          </div>
        )}
      </div>
      <MapControls onZoom={zoomAt} onReset={resetCamera} />
      <MapTransformPanel
        value={mapTransform}
        onChange={setMapTransform}
        onReset={resetMapTransform}
      />
    </section>
  );
}
