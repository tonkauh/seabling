"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import styles from "./ModelViewer.module.css";
import type { ModelTransform } from "./types";

const ModelCanvas = dynamic(() => import("./ModelCanvas"), {
  ssr: false,
  loading: () => (
    <div className={styles.canvasLoading} role="status">
      Preparing 3D viewer…
    </div>
  ),
});

const initialTransform: ModelTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

type Axis = "x" | "y" | "z";
type TransformKey = "position" | "rotation" | "scale";

const axisNames: Record<Axis, string> = { x: "X", y: "Y", z: "Z" };

function AxisControl({
  group,
  axis,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  group: TransformKey;
  axis: Axis;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const id = `${group}-${axis}`;

  function updateValue(rawValue: string) {
    if (rawValue.trim() === "") return;
    const nextValue = Number(rawValue);
    if (Number.isFinite(nextValue)) {
      onChange(Math.min(max, Math.max(min, nextValue)));
    }
  }

  return (
    <div className={styles.axisControl}>
      <label className={styles.axisLabel} htmlFor={`${id}-number`}>
        {axisNames[axis]}
      </label>
      <input
        id={`${id}-range`}
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => updateValue(event.currentTarget.value)}
        aria-label={`${group} ${axisNames[axis]}`}
      />
      <div className={styles.numberField}>
        <input
          id={`${id}-number`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => updateValue(event.currentTarget.value)}
          inputMode="decimal"
        />
        {unit && <span>{unit}</span>}
      </div>
    </div>
  );
}

export default function ModelViewer() {
  const [transform, setTransform] = useState<ModelTransform>(initialTransform);
  const [uniformScale, setUniformScale] = useState(true);

  function updateAxis(group: TransformKey, axis: Axis, value: number) {
    setTransform((current) => {
      if (group === "scale" && uniformScale) {
        return {
          ...current,
          scale: { x: value, y: value, z: value },
        };
      }

      return {
        ...current,
        [group]: { ...current[group], [axis]: value },
      };
    });
  }

  function toggleUniformScale(enabled: boolean) {
    setUniformScale(enabled);
    if (enabled) {
      setTransform((current) => ({
        ...current,
        scale: {
          x: current.scale.x,
          y: current.scale.x,
          z: current.scale.x,
        },
      }));
    }
  }

  function resetTransforms() {
    setTransform(initialTransform);
    setUniformScale(true);
  }

  return (
    <main className={styles.viewer}>
      <ModelCanvas transform={transform} />

      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="SEABLING home">
          <span className={styles.brandMark} aria-hidden="true">
            S
          </span>
          <span>
            <strong>SEABLING</strong>
            <small>3D MODEL STUDIO</small>
          </span>
        </Link>
        <div className={styles.topbarActions}>
          <span className={styles.fileBadge}>
            <span className={styles.statusDot} />
            MODEL.GLB
          </span>
          <Link className={styles.mapLink} href="/">
            Back to map <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <section className={styles.instructions} aria-label="Viewer controls">
        <span className={styles.dragIcon} aria-hidden="true">
          ⤧
        </span>
        <span>
          <strong>Orbit</strong> drag
        </span>
        <span className={styles.instructionDivider} />
        <span>
          <strong>Zoom</strong> scroll / pinch
        </span>
        <span className={styles.instructionDivider} />
        <span>
          <strong>Pan</strong> right-drag
        </span>
      </section>

      <aside className={styles.panel} aria-labelledby="panel-title">
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>SCENE EDITOR</p>
            <h1 id="panel-title">Transform</h1>
          </div>
          <span className={styles.panelIcon} aria-hidden="true">
            ⊞
          </span>
        </div>

        <TransformSection
          group="position"
          title="Position"
          description="Move the model in 3D space"
          values={transform.position}
          min={-10}
          max={10}
          step={0.1}
          onChange={(axis, value) => updateAxis("position", axis, value)}
        />

        <TransformSection
          group="rotation"
          title="Rotation"
          description="Rotate around each axis"
          values={transform.rotation}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(axis, value) => updateAxis("rotation", axis, value)}
        />

        <section className={styles.transformSection}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Scale</h2>
              <p>Resize the model</p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={uniformScale}
                onChange={(event) =>
                  toggleUniformScale(event.currentTarget.checked)
                }
              />
              <span className={styles.toggleTrack} aria-hidden="true" />
              <span>Uniform</span>
            </label>
          </div>
          {(uniformScale ? (["x"] as const) : (["x", "y", "z"] as const)).map(
            (axis) => (
              <AxisControl
                key={axis}
                group="scale"
                axis={axis}
                value={transform.scale[axis]}
                min={0.1}
                max={5}
                step={0.1}
                onChange={(value) => updateAxis("scale", axis, value)}
              />
            ),
          )}
        </section>

        <button
          className={styles.resetButton}
          type="button"
          onClick={resetTransforms}
        >
          <span aria-hidden="true">↺</span>
          Reset transforms
        </button>

        <p className={styles.panelFootnote}>
          Drag on the canvas to orbit. Use two fingers to zoom and pan on touch
          screens.
        </p>
      </aside>

      <div className={styles.modelCaption}>
        <span className={styles.captionLine} />
        <span>BLOCKY CASTLE</span>
        <span className={styles.captionMeta}>GLTF 2.0</span>
      </div>
    </main>
  );
}

function TransformSection({
  group,
  title,
  description,
  values,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  group: "position" | "rotation";
  title: string;
  description: string;
  values: ModelTransform["position"];
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (axis: Axis, value: number) => void;
}) {
  return (
    <section className={styles.transformSection}>
      <div className={styles.sectionHeading}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {(["x", "y", "z"] as const).map((axis) => (
        <AxisControl
          key={axis}
          group={group}
          axis={axis}
          value={values[axis]}
          min={min}
          max={max}
          step={step}
          unit={unit}
          onChange={(value) => onChange(axis, value)}
        />
      ))}
    </section>
  );
}
