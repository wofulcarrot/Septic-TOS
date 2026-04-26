// Hard-coded jurisdiction map for the 3 priority counties.
// Day 1 source of truth (database table mirrors this for Day 2 persistence).
//
// Fees are PLACEHOLDER values flagged with `feeIsEstimate: true`. Andy is
// confirming actual fees with each county before launch.

export type Jurisdiction = {
  countyName: string;
  countyFips: string;
  authorityCode: string;
  authorityName: string;
  authorityShortName: string;
  formName: string;
  formCode: string;
  feeUSD: number;
  feeIsEstimate: boolean;
  submissionMethod: "PDF" | "Online portal" | "Email";
  submissionDetail: string;
  notes: string;
  surfaceWaterRule: boolean;
  ruleSummary: string;
  websiteUrl: string;
};

export const JURISDICTIONS: Record<string, Jurisdiction> = {
  "26055": {
    countyName: "Grand Traverse County",
    countyFips: "26055",
    authorityCode: "GTCHD",
    authorityName: "Grand Traverse County Health Department",
    authorityShortName: "GTCHD",
    formName: "GTCHD Form 4-B — Time-of-Sale Septic Inspection",
    formCode: "Form 4-B",
    feeUSD: 385,
    feeIsEstimate: true,
    submissionMethod: "PDF",
    submissionDetail:
      "Completed Form 4-B is submitted as a PDF to GTCHD's environmental health office along with the inspection fee.",
    notes:
      "TOS rule effective Jan 1, 2026 for any home within 300 ft of surface water. Expanding county-wide pending board action.",
    surfaceWaterRule: true,
    ruleSummary:
      "TOS inspection required if the property is within 300 ft of surface water (West Bay, East Bay, inland lakes, or perennial streams).",
    websiteUrl: "https://www.gtchd.org/206/Environmental-Health",
  },
  "26089": {
    countyName: "Leelanau County",
    countyFips: "26089",
    authorityCode: "BLDHD",
    authorityName: "Benzie-Leelanau District Health Department",
    authorityShortName: "BLDHD",
    formName: "BLDHD Septic Time-of-Sale Inspection Report",
    formCode: "TOS Inspection Report",
    feeUSD: 325,
    feeIsEstimate: true,
    submissionMethod: "Email",
    submissionDetail:
      "Inspection report is emailed to the BLDHD environmental health team; a copy is forwarded to the closing agent.",
    notes:
      "TOS ordinance is countywide. Joint district with Benzie County — same form, same fee, same review process.",
    surfaceWaterRule: false,
    ruleSummary:
      "TOS inspection required for every property transfer in Leelanau County, regardless of proximity to surface water.",
    websiteUrl: "https://bldhd.org/environmental-health/",
  },
  "26009": {
    countyName: "Antrim County",
    countyFips: "26009",
    authorityCode: "HDNW",
    authorityName: "Health Department of Northwest Michigan",
    authorityShortName: "HDNW",
    formName: "HDNW Onsite Wastewater Evaluation — Time of Sale",
    formCode: "Onsite Wastewater TOS",
    feeUSD: 350,
    feeIsEstimate: true,
    submissionMethod: "Online portal",
    submissionDetail:
      "Inspection is uploaded through the HDNW EH portal. Auto-routed to a sanitarian for review.",
    notes:
      "HDNW covers Antrim, Charlevoix, Emmet, and Otsego counties. POC focuses on Antrim — adjacent counties wired in Month 2.",
    surfaceWaterRule: false,
    ruleSummary:
      "TOS inspection required countywide for every property with an onsite septic system at the time of sale.",
    websiteUrl: "https://nwhealth.org/eh.html",
  },
};

export function jurisdictionFromFips(fips: string): Jurisdiction | null {
  return JURISDICTIONS[fips] ?? null;
}

export const SUPPORTED_FIPS = Object.keys(JURISDICTIONS);
