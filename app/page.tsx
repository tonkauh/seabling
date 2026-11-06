"use client";

import { useEffect, useState } from "react";
import AseanMap from "@/components/AseanMap";
import ZoneDrawer from "@/components/ZoneDrawer";
import { venueZones } from "@/data/venueZones";

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState<string[]>(
    [],
  );
  const selectedZone =
    venueZones.find((zone) => zone.id === selectedZoneId) ?? null;

  useEffect(() => {
    if (!selectedZone) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedZoneId(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedZone]);

  function toggleRegistration(workshopId: string) {
    setRegisteredWorkshopIds((registeredIds) =>
      registeredIds.includes(workshopId)
        ? registeredIds.filter((id) => id !== workshopId)
        : [...registeredIds, workshopId],
    );
  }

  return (
    <main className="seabling-map relative h-dvh w-full overflow-hidden">
      <AseanMap
        zones={venueZones}
        selectedZoneId={selectedZoneId}
        onZoneSelect={setSelectedZoneId}
      />

      <header className="map-brand" aria-label="SEABLING Cultural Atlas">
        <span className="map-brand__mark" aria-hidden="true">
          S
        </span>
        <span className="map-brand__copy">
          <strong>SEABLING</strong>
          <span>CULTURAL ATLAS</span>
        </span>
        <span className="map-brand__divider" aria-hidden="true" />
        <span className="map-brand__edition">FIVE CULTURAL STOPS</span>
      </header>

      <div className="map-caption">
        <span className="map-caption__dot" />
        <span>DRAG TO EXPLORE</span>
        <span className="map-caption__separator" aria-hidden="true">
          ·
        </span>
        <span>SCROLL TO ZOOM</span>
      </div>

      {selectedZone && (
        <ZoneDrawer
          zone={selectedZone}
          registeredWorkshopIds={registeredWorkshopIds}
          onClose={() => setSelectedZoneId(null)}
          onToggleRegistration={toggleRegistration}
        />
      )}
    </main>
  );
}
