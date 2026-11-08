"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import type { VenueZone } from "@/data/venueZones";
import MapControls from "@/components/MapControls";

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

function getCameraViewBox(camera: Camera, base: ViewBox, map: ViewBox): ViewBox {
  const boundedCamera = clampCamera(camera, base, map);
  const width = base.width / boundedCamera.zoom;
  const height = base.height / boundedCamera.zoom;

  return {
    x: boundedCamera.centerX - width / 2,
    y: boundedCamera.centerY - height / 2,
    width,
    height,
  };
}

const VectorPaths = memo(function VectorPaths({
  artwork,
}: {
  artwork: SvgArtwork;
}) {
  return (
    <>
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
          textRendering="optimizeLegibility"
        />
      ))}
    </>
  );
});

function getPinPosition(zone: VenueZone, map: ViewBox) {
  return {
    x: map.x + (zone.position.left / 100) * map.width,
    y: map.y + (zone.position.top / 100) * map.height,
  };
}

function ZonePin({
  buttonRef,
  zone,
  number,
  selected,
  onSelect,
  position,
  viewBox,
  viewportSize,
  zoom,
}: {
  buttonRef: (element: HTMLButtonElement | null) => void;
  zone: VenueZone;
  number: string;
  selected: boolean;
  onSelect: () => void;
  position: Point;
  viewBox: ViewBox;
  viewportSize: Point;
  zoom: number;
}) {
  const x = ((position.x - viewBox.x) / viewBox.width) * viewportSize.x;
  const y = ((position.y - viewBox.y) / viewBox.height) * viewportSize.y;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`map-pin map-pin--${zone.labelPlacement} map-pin--${zone.id}${selected ? " map-pin--selected" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate3d(-50%, -50%, 0) scale(${zoom})`,
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
  const cameraLayerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pinElementsRef = useRef(new Map<string, HTMLButtonElement>());
  const pointerPositions = useRef(new Map<number, Point>());
  const interactivePointers = useRef(new Set<number>());
  const [artwork, setArtwork] = useState<SvgArtwork | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState<Point>({ x: 0, y: 0 });
  const cameraRef = useRef<Camera>({
    zoom: MIN_ZOOM,
    centerX: 1200,
    centerY: 896,
  });
  const committedCameraRef = useRef(cameraRef.current);
  const cameraFrameRef = useRef<number | null>(null);
  const cameraRenderPreviewRef = useRef(false);
  const zoomCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const map = useMemo(
    () =>
      artwork?.viewBox ?? {
        x: 0,
        y: 0,
        width: 2400,
        height: 1792,
      },
    [artwork],
  );
  const mapViewBox = getCameraViewBox(
    cameraRef.current,
    baseViewBox,
    map,
  );

  const renderCamera = useCallback(
    (nextCamera: Camera) => {
      const currentMap = artwork?.viewBox ?? {
        x: 0,
        y: 0,
        width: 2400,
        height: 1792,
      };
      const viewBox = getCameraViewBox(nextCamera, baseViewBox, currentMap);

      // Mutate SVG and pins directly so camera frames never reconcile the React tree.
      committedCameraRef.current = nextCamera;
      if (cameraLayerRef.current) cameraLayerRef.current.style.transform = "";
      svgRef.current?.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
      );

      if (viewportSize.x <= 0 || viewportSize.y <= 0) return;
      zones.forEach((zone) => {
        const element = pinElementsRef.current.get(zone.id);
        if (!element) return;

        const position = getPinPosition(zone, currentMap);
        const x = ((position.x - viewBox.x) / viewBox.width) * viewportSize.x;
        const y = ((position.y - viewBox.y) / viewBox.height) * viewportSize.y;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.transform = `translate3d(-50%, -50%, 0) scale(${nextCamera.zoom})`;
      });
    },
    [artwork, baseViewBox, viewportSize.x, viewportSize.y, zones],
  );

  const renderZoomPreview = useCallback(
    (nextCamera: Camera) => {
      if (!cameraLayerRef.current || viewportSize.x <= 0 || viewportSize.y <= 0) {
        return;
      }

      const currentMap = artwork?.viewBox ?? {
        x: 0,
        y: 0,
        width: 2400,
        height: 1792,
      };
      const committedViewBox = getCameraViewBox(
        committedCameraRef.current,
        baseViewBox,
        currentMap,
      );
      const previewViewBox = getCameraViewBox(
        nextCamera,
        baseViewBox,
        currentMap,
      );
      const scale = committedViewBox.width / previewViewBox.width;
      const translateX =
        ((committedViewBox.x - previewViewBox.x) / previewViewBox.width) *
        viewportSize.x;
      const translateY =
        ((committedViewBox.y - previewViewBox.y) / previewViewBox.height) *
        viewportSize.y;

      cameraLayerRef.current.style.transformOrigin = "0 0";
      cameraLayerRef.current.style.transform =
        `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    },
    [artwork, baseViewBox, viewportSize.x, viewportSize.y],
  );

  const scheduleCameraRender = useCallback((preview = false) => {
    cameraRenderPreviewRef.current = preview;
    if (cameraFrameRef.current !== null) return;

    // Keep active zoom on the compositor; rebuild the SVG viewBox after zoom settles.
    cameraFrameRef.current = requestAnimationFrame(() => {
      cameraFrameRef.current = null;
      if (cameraRenderPreviewRef.current) renderZoomPreview(cameraRef.current);
      else renderCamera(cameraRef.current);
    });
  }, [renderCamera, renderZoomPreview]);

  const updateCamera = useCallback(
    (update: (current: Camera) => Camera, preview = false) => {
      cameraRef.current = update(cameraRef.current);
      if (preview) {
        if (zoomCommitTimerRef.current !== null) {
          clearTimeout(zoomCommitTimerRef.current);
        }
        scheduleCameraRender(true);
        zoomCommitTimerRef.current = setTimeout(() => {
          zoomCommitTimerRef.current = null;
          scheduleCameraRender();
        }, 120);
      } else {
        if (zoomCommitTimerRef.current !== null) {
          clearTimeout(zoomCommitTimerRef.current);
          zoomCommitTimerRef.current = null;
        }
        scheduleCameraRender();
      }
    },
    [scheduleCameraRender],
  );

  useEffect(() => {
    if (!artwork) return;
    if (cameraRef.current.zoom === MIN_ZOOM) {
      cameraRef.current = {
        ...cameraRef.current,
        centerX: artwork.viewBox.x + artwork.viewBox.width / 2,
        centerY: artwork.viewBox.y + artwork.viewBox.height / 2,
      };
    }
    renderCamera(cameraRef.current);
  }, [artwork, renderCamera]);

  useEffect(() => {
    cameraRef.current = clampCamera(
      cameraRef.current,
      baseViewBox,
      map,
    );
    renderCamera(cameraRef.current);
  }, [baseViewBox, map, renderCamera]);

  useEffect(
    () => () => {
      if (cameraFrameRef.current !== null) {
        cancelAnimationFrame(cameraFrameRef.current);
      }
      if (zoomCommitTimerRef.current !== null) {
        clearTimeout(zoomCommitTimerRef.current);
      }
    },
    [],
  );

  const zoomAt = useCallback(
    (factor: number, anchor?: Point, preview = false) => {
      updateCamera((current) => {
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

        const currentViewBox = getCameraViewBox(
          bounded,
          baseViewBox,
          artwork?.viewBox ?? { x: 0, y: 0, width: 2400, height: 1792 },
        );
        const mapX =
          currentViewBox.x +
          (anchor.x / viewportSize.x) * currentViewBox.width;
        const mapY =
          currentViewBox.y +
          (anchor.y / viewportSize.y) * currentViewBox.height;
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
      }, preview);
    },
    [artwork, baseViewBox, updateCamera, viewportSize.x, viewportSize.y],
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      zoomAt(Math.exp(-event.deltaY * 0.0015), {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }, true);
    },
    [zoomAt],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const startedOnButton = Boolean(
        (event.target as HTMLElement).closest("button"),
      );
      if (startedOnButton) interactivePointers.current.add(event.pointerId);
      else event.currentTarget.setPointerCapture(event.pointerId);

      // Include pointers on pins in pinch gestures without making pin taps pan the map.
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
      const mapBounds = artwork?.viewBox ?? {
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

        updateCamera((currentCamera) => {
          const bounded = clampCamera(currentCamera, baseViewBox, mapBounds);
          const zoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, bounded.zoom * (newDistance / oldDistance)),
          );
          const currentViewBox = getCameraViewBox(
            bounded,
            baseViewBox,
            mapBounds,
          );
          const anchorX =
            currentViewBox.x +
            (oldMid.x / viewportSize.x) * currentViewBox.width;
          const anchorY =
            currentViewBox.y +
            (oldMid.y / viewportSize.y) * currentViewBox.height;
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
            mapBounds,
          );
        }, true);
        return;
      }

      if (interactivePointers.current.has(event.pointerId)) return;

      const deltaX = current.x - previous.x;
      const deltaY = current.y - previous.y;
      updateCamera((currentCamera) => {
        const bounded = clampCamera(currentCamera, baseViewBox, mapBounds);
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
          mapBounds,
        );
      });
    },
    [
      artwork,
      baseViewBox,
      updateCamera,
      viewportSize.x,
      viewportSize.y,
    ],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      pointerPositions.current.delete(event.pointerId);
      interactivePointers.current.delete(event.pointerId);
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
    cameraRef.current = {
      zoom: MIN_ZOOM,
      centerX: map.x + map.width / 2,
      centerY: map.y + map.height / 2,
    };
    if (zoomCommitTimerRef.current !== null) {
      clearTimeout(zoomCommitTimerRef.current);
      zoomCommitTimerRef.current = null;
    }
    scheduleCameraRender();
  }, [artwork, scheduleCameraRender]);

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
          <div ref={cameraLayerRef} className="map-camera-layer">
            <svg
              ref={svgRef}
              className="map-vector-art"
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`${mapViewBox.x} ${mapViewBox.y} ${mapViewBox.width} ${mapViewBox.height}`}
              preserveAspectRatio="none"
              shapeRendering="geometricPrecision"
              textRendering="optimizeLegibility"
              role="img"
              aria-label="Vector site plan of the SEABLING festival grounds"
            >
              <VectorPaths artwork={artwork} />
            </svg>
            {viewportSize.x > 0 &&
              viewportSize.y > 0 &&
              zones.map((zone, index) => (
                <ZonePin
                  key={zone.id}
                  buttonRef={(element) => {
                    if (element) pinElementsRef.current.set(zone.id, element);
                    else pinElementsRef.current.delete(zone.id);
                  }}
                  zone={zone}
                  number={String(index + 1).padStart(2, "0")}
                  selected={selectedZoneId === zone.id}
                  onSelect={() => onZoneSelect(zone.id)}
                  position={getPinPosition(zone, map)}
                  viewBox={mapViewBox}
                  viewportSize={viewportSize}
                  zoom={cameraRef.current.zoom}
                />
              ))}
          </div>
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
    </section>
  );
}
