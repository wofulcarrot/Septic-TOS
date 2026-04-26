// The orchestrator behind the realtor's "Check" button.
// Glue: address → Census → jurisdiction → surface-water rule → inspectors
//        → closing-risk → typed result the UI renders.

import { geocodeAddress } from "./census";
import {
  type Jurisdiction,
  jurisdictionFromFips,
  SUPPORTED_FIPS,
} from "./jurisdictions";
import { type InspectorWithSlot, inspectorsForFips } from "./inspectors";
import {
  type SurfaceWaterResult,
  surfaceWaterCheck,
} from "./surface-water";
import { type ClosingRisk, computeClosingRisk } from "./closing-risk";

export type LookupSuccess = {
  ok: true;
  matchedAddress: string;
  latitude: number;
  longitude: number;
  countyFips: string;
  countyName: string;
  jurisdiction: Jurisdiction;
  inspectors: InspectorWithSlot[];
  surfaceWater: SurfaceWaterResult | null;
  // Whether a TOS inspection is required at all. For non-GT counties this
  // is always true (county-wide ordinance); for GT it depends on the
  // 300-ft surface-water rule.
  tosRequired: boolean;
  tosReason: string;
  closingRisk: ClosingRisk | null;
};

export type LookupFailure = {
  ok: false;
  reason:
    | "no_match"
    | "non_michigan"
    | "fetch_error"
    | "invalid_response"
    | "unsupported_county"
    | "validation";
  message: string;
  // For unsupported_county we still include what we matched, so the
  // realtor can see "we found this address but don't cover it yet."
  matchedAddress?: string;
  countyName?: string;
};

export type LookupResult = LookupSuccess | LookupFailure;

export type LookupInput = {
  address: string;
  closingDate?: string; // ISO yyyy-mm-dd from a <input type="date" />
};

export async function runLookup(input: LookupInput): Promise<LookupResult> {
  const address = (input.address ?? "").trim();
  if (address.length < 6) {
    return {
      ok: false,
      reason: "validation",
      message: "Please enter a full street address.",
    };
  }

  const geo = await geocodeAddress(address);
  if (!geo.ok) return geo;

  const jurisdiction = jurisdictionFromFips(geo.countyFips);
  if (!jurisdiction) {
    return {
      ok: false,
      reason: "unsupported_county",
      message: `Coming soon — Traverse currently covers Grand Traverse, Leelanau, and Antrim counties. ${geo.countyName} County, MI isn't live yet.`,
      matchedAddress: geo.matchedAddress,
      countyName: geo.countyName,
    };
  }

  // Surface-water rule: only meaningful for GT (the 300-ft rule).
  // For other counties the ordinance is countywide so we skip the spatial
  // check entirely — but we still surface lat/lng so Day 2 can use them.
  let surfaceWater: SurfaceWaterResult | null = null;
  let tosRequired = true;
  let tosReason = jurisdiction.ruleSummary;

  if (jurisdiction.surfaceWaterRule) {
    surfaceWater = surfaceWaterCheck(geo.latitude, geo.longitude);
    tosRequired = surfaceWater.isWithin;
    tosReason = tosRequired
      ? `Within ${surfaceWater.distanceFt} ft of ${surfaceWater.nearestFeature} — TOS inspection required under the GTCHD 300-ft rule.`
      : `Approximately ${surfaceWater.distanceFt.toLocaleString()} ft from ${surfaceWater.nearestFeature} — outside the GTCHD 300-ft surface-water boundary, so the TOS rule does not currently apply.`;
  }

  const inspectors = inspectorsForFips(geo.countyFips);

  let closingRisk: ClosingRisk | null = null;
  if (input.closingDate && inspectors.length > 0) {
    const parsed = parseClosingDate(input.closingDate);
    if (parsed) {
      closingRisk = computeClosingRisk(
        inspectors[0].earliestAvailable,
        parsed,
      );
    }
  }

  return {
    ok: true,
    matchedAddress: geo.matchedAddress,
    latitude: geo.latitude,
    longitude: geo.longitude,
    countyFips: geo.countyFips,
    countyName: geo.countyName,
    jurisdiction,
    inspectors,
    surfaceWater,
    tosRequired,
    tosReason,
    closingRisk,
  };
}

function parseClosingDate(iso: string): Date | null {
  // Accepts yyyy-mm-dd; returns Date at local midnight or null on parse fail.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(dt.getTime()) ? null : dt;
}

export { SUPPORTED_FIPS };
