"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import type { VenueMapTransform } from "@/data/venueZones";
import styles from "./MapTransformPanel.module.css";

type TransformKey = keyof VenueMapTransform;

const controls: {
  key: TransformKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}[] = [
  { key: "offsetXPercent", label: "Position X", min: -30, max: 30, step: 1, unit: "%" },
  { key: "offsetYPercent", label: "Position Y", min: -30, max: 30, step: 1, unit: "%" },
  { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.01, unit: "×" },
  { key: "rotation", label: "Rotation", min: -180, max: 180, step: 1, unit: "°" },
  { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
  { key: "zIndex", label: "Z-index", min: 0, max: 5, step: 1 },
];

export default function MapTransformPanel({
  value,
  onChange,
  onReset,
}: {
  value: VenueMapTransform;
  onChange: (value: VenueMapTransform) => void;
  onReset: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  function updateValue(key: TransformKey, rawValue: string) {
    if (rawValue.trim() === "") return;

    const control = controls.find((item) => item.key === key);
    const parsedValue = Number(rawValue);
    if (!control || !Number.isFinite(parsedValue)) return;

    onChange({
      ...value,
      [key]: Math.min(control.max, Math.max(control.min, parsedValue)),
    });
  }

  async function copyCoordinates() {
    const config = `export const venueMapTransform = ${JSON.stringify(value, null, 2)};`;

    try {
      await navigator.clipboard.writeText(config);
      setCopyStatus("Config copied.");
    } catch (error) {
      console.error("Could not copy the map transform config.", error);
      setCopyStatus("Copy failed. Check clipboard permissions and try again.");
    }
  }

  function handleNumberChange(
    key: TransformKey,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    updateValue(key, event.currentTarget.value);
  }

  function reset() {
    onReset();
    setCopyStatus("");
  }

  return (
    <aside
      className={`map-transform-panel ${styles.panel}`}
      aria-label="Map artwork transform controls"
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MAP EDITOR</p>
          <h2>Artwork transform</h2>
        </div>
        <button
          className={styles.collapseButton}
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand map controls" : "Collapse map controls"}
        >
          <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
        </button>
      </div>

      {!collapsed && (
        <div className={styles.body}>
          <p className={styles.hint}>
            Adjust the map and its pins together. Position uses percentage
            offsets from center.
          </p>
          <div className={styles.controls}>
            {controls.map(({ key, label, min, max, step, unit }) => (
              <div className={styles.control} key={key}>
                <label className={styles.label} htmlFor={`map-${key}`}>
                  {label}
                </label>
                <input
                  className={styles.range}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value[key]}
                  onChange={(event) => updateValue(key, event.currentTarget.value)}
                  aria-label={`${label} slider`}
                />
                <div className={styles.numberField}>
                  <input
                    id={`map-${key}`}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value[key]}
                    onChange={(event) => handleNumberChange(key, event)}
                    inputMode="decimal"
                  />
                  {unit && <span>{unit}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.resetButton} onClick={reset}>
              Reset
            </button>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => void copyCoordinates()}
            >
              Copy config
            </button>
          </div>
          <p className={styles.status} aria-live="polite">
            {copyStatus || "Copy exports venueMapTransform as TypeScript."}
          </p>
        </div>
      )}
    </aside>
  );
}
