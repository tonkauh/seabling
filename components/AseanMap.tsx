"use client";

import Image from "next/image";
import {
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
import type { VenueZone } from "@/data/venueZones";
import MapControls from "@/components/MapControls";

type AseanMapProps = {
  zones: VenueZone[];
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
};

function ZonePin({
  zone,
  number,
  selected,
  onSelect,
}: {
  zone: VenueZone;
  number: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`map-pin map-pin--${zone.labelPlacement} map-pin--${zone.id} group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-110 focus-visible:scale-110 motion-reduce:transition-none${selected ? " map-pin--selected" : ""}`}
      style={{
        left: `${zone.position.left}%`,
        top: `${zone.position.top}%`,
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
}: AseanMapProps) {
  return (
    <section className="map-stage" aria-label="Interactive SEABLING venue map">
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={3}
        centerOnInit
        limitToBounds
        disablePadding
        wheel={{ step: 0.12 }}
        panning={{ velocityDisabled: true, excluded: ["map-pin"] }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperClass="map-viewport"
          wrapperStyle={{ width: "100%", height: "100%" }}
          wrapperProps={{
            role: "region",
            "aria-label": "Pan and zoom the SEABLING venue map",
          }}
          contentClass="map-transform-content"
          contentStyle={{
            display: "block",
          }}
        >
          <div className="venue-map-art">
            <Image
              src="/images/venue-map.svg"
              alt="Vector site plan of the SEABLING festival grounds, showing the central venue and surrounding areas"
              fill
              priority
              unoptimized
              sizes="(max-width: 760px) 100vw, 134vh"
              className="venue-map-art__image"
              draggable={false}
            />
            {zones.map((zone, index) => (
              <ZonePin
                key={zone.id}
                zone={zone}
                number={String(index + 1).padStart(2, "0")}
                selected={selectedZoneId === zone.id}
                onSelect={() => onZoneSelect(zone.id)}
              />
            ))}
          </div>
        </TransformComponent>
        <MapControls />
      </TransformWrapper>
    </section>
  );
}
