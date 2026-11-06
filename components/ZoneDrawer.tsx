"use client";

import type { VenueZone } from "@/data/venueZones";

type ZoneDrawerProps = {
  zone: VenueZone;
  registeredWorkshopIds: string[];
  onClose: () => void;
  onToggleRegistration: (workshopId: string) => void;
};

export default function ZoneDrawer({
  zone,
  registeredWorkshopIds,
  onClose,
  onToggleRegistration,
}: ZoneDrawerProps) {
  return (
    <>
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Close zone details"
        onClick={onClose}
      />
      <aside
        className="zone-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zone-drawer-title"
      >
        <button
          type="button"
          className="zone-drawer__close transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
          onClick={onClose}
          aria-label="Close zone details"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="zone-drawer__heading">
          <span className="zone-drawer__flag" aria-hidden="true">
            {zone.flag}
          </span>
          <div>
            <p className="zone-drawer__eyebrow">SEABLING CULTURAL ATLAS</p>
            <h1 id="zone-drawer-title">{zone.zoneName}</h1>
            <p className="zone-drawer__native">
              {zone.countryName}
              {zone.nativeName !== zone.countryName
                ? ` · ${zone.nativeName}`
                : ""}
            </p>
          </div>
        </div>

        <section className="zone-drawer__section">
          <p className="zone-drawer__eyebrow">CULTURE IN FOCUS</p>
          <p className="zone-drawer__overview">{zone.cultureOverview}</p>
          <ul className="culture-tags">
            {zone.artHighlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </section>

        <section className="zone-drawer__section zone-drawer__workshops">
          <div className="zone-drawer__section-heading">
            <p className="zone-drawer__eyebrow">WORKSHOPS & EXPERIENCES</p>
            <span>
              {zone.workshops.length}{" "}
              {zone.workshops.length === 1 ? "EXPERIENCE" : "EXPERIENCES"}
            </span>
          </div>
          {zone.workshops.map((workshop) => {
            const isRegistered = registeredWorkshopIds.includes(workshop.id);

            return (
              <article className="workshop-card" key={workshop.id}>
                <div className="workshop-card__meta">
                  <span>{workshop.time}</span>
                  <span>{workshop.location}</span>
                </div>
                <h2>{workshop.title}</h2>
                <p>{workshop.description}</p>
                <button
                  type="button"
                  onClick={() => onToggleRegistration(workshop.id)}
                  aria-pressed={isRegistered}
                  className={`workshop-card__register transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900${isRegistered ? " workshop-card__register--saved" : ""}`}
                >
                  {isRegistered ? "Added to your list" : "Register"}
                  <span aria-hidden="true">{isRegistered ? "✓" : "↗"}</span>
                </button>
              </article>
            );
          })}
        </section>
      </aside>
    </>
  );
}
