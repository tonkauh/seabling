"use client";

import { useControls, useTransformContext } from "react-zoom-pan-pinch";

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3.5 8a6.6 6.6 0 1 1 .3 4.2M3.5 3.8v4.6h4.6" />
    </svg>
  );
}

export default function MapControls() {
  const { zoomIn, zoomOut, setTransform } = useControls();
  const transformContext = useTransformContext();

  function resetMapView() {
    const { wrapperComponent, contentComponent } = transformContext;
    if (!wrapperComponent || !contentComponent) return;

    const positionX =
      (wrapperComponent.clientWidth - contentComponent.offsetWidth) / 2;
    const positionY =
      (wrapperComponent.clientHeight - contentComponent.offsetHeight) / 2;

    void setTransform(positionX, positionY, 1);
  }

  return (
    <div className="map-controls" role="group" aria-label="Map controls">
      <button
        type="button"
        onClick={() => void zoomIn()}
        aria-label="Zoom in"
        title="Zoom in"
        className="transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
      >
        <ZoomInIcon />
      </button>
      <button
        type="button"
        onClick={() => void zoomOut()}
        aria-label="Zoom out"
        title="Zoom out"
        className="transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
      >
        <ZoomOutIcon />
      </button>
      <span className="map-controls__divider" aria-hidden="true" />
      <button
        type="button"
        onClick={resetMapView}
        aria-label="Reset map view"
        title="Reset map view"
        className="map-controls__reset transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
      >
        <ResetIcon />
      </button>
    </div>
  );
}
