import { aseanCountries, type AseanCountry, type Workshop } from "@/data/aseanData";

type LabelPlacement = "left" | "right" | "top" | "bottom";

export type VenueMapTransform = {
  offsetXPercent: number;
  offsetYPercent: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export const venueMapTransform: VenueMapTransform = {
  offsetXPercent: 0,
  offsetYPercent: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
  zIndex: 0,
};

export type VenueZone = {
  id: string;
  zoneName: string;
  countryName: string;
  nativeName: string;
  flag: string;
  position: { left: number; top: number };
  labelPlacement: LabelPlacement;
  cultureOverview: string;
  artHighlights: string[];
  workshops: Workshop[];
};

function countryZone(
  countryId: string,
  zoneName: string,
  position: VenueZone["position"],
  labelPlacement: LabelPlacement,
): VenueZone {
  const country: AseanCountry | undefined = aseanCountries.find(
    (item) => item.id === countryId,
  );

  if (!country) {
    throw new Error(`Missing ASEAN country data for "${countryId}".`);
  }

  return {
    id: country.id,
    zoneName,
    countryName: country.name,
    nativeName: country.nativeName,
    flag: country.flag,
    position,
    labelPlacement,
    cultureOverview: country.cultureOverview,
    artHighlights: country.artHighlights,
    workshops: country.workshops,
  };
}

export const venueZones: VenueZone[] = [
  countryZone("thailand", "Thailand Zone", { left: 52, top: 15 }, "top"),
  {
    id: "exhibition",
    zoneName: "Exhibition Area",
    countryName: "SEABLING Festival",
    nativeName: "Main entrance",
    flag: "✦",
    position: { left: 57, top: 47 },
    labelPlacement: "right",
    cultureOverview:
      "Begin your journey here. Explore collaborative installations, meet the makers, and find a new perspective on Southeast Asia's many living cultures.",
    artHighlights: [
      "Regional art installations",
      "Meet the makers",
      "Festival information",
    ],
    workshops: [
      {
        id: "seabling-art-tour",
        title: "Stories of Southeast Asia",
        time: "11:00 AM · 30 min",
        location: "Main Exhibition",
        description:
          "Join a guided introduction to the artists, materials, and shared stories behind this year's regional exhibition.",
      },
    ],
  },
  countryZone("indonesia", "Indonesia Zone", { left: 41, top: 74 }, "right"),
  countryZone("philippines", "Philippines Zone", { left: 85, top: 44 }, "top"),
  countryZone("vietnam", "Vietnam Zone", { left: 71, top: 22 }, "right"),
];
