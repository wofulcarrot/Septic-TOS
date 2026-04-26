// Curated sample addresses used in the demo's "Try one of these" pills.
// Each one resolves through the Census Geocoder to a different jurisdiction
// so the demo flow lands in all three counties cleanly.

export type SampleAddress = {
  label: string;
  address: string;
  expectedAuthority: "GTCHD" | "BLDHD" | "HDNW";
  expectedSurfaceWater?: boolean;
  blurb: string;
};

export const SAMPLE_ADDRESSES: SampleAddress[] = [
  {
    label: "GT — near West Bay",
    address: "13319 S West Bayshore Dr, Traverse City, MI 49684",
    expectedAuthority: "GTCHD",
    expectedSurfaceWater: true,
    blurb: "Inside the GTCHD 300-ft surface-water rule",
  },
  {
    label: "GT — inland",
    address: "1234 Hammond Rd, Traverse City, MI 49686",
    expectedAuthority: "GTCHD",
    expectedSurfaceWater: false,
    blurb: "Grand Traverse County, but outside the bay buffer",
  },
  {
    label: "Leelanau — Suttons Bay",
    address: "203 Saint Joseph Ave, Suttons Bay, MI 49682",
    expectedAuthority: "BLDHD",
    blurb: "Leelanau County — countywide ordinance",
  },
  {
    label: "Antrim — Bellaire",
    address: "210 N Bridge St, Bellaire, MI 49615",
    expectedAuthority: "HDNW",
    blurb: "Antrim County — HDNW jurisdiction",
  },
];
