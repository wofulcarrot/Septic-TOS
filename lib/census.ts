// Census Geocoding API — free, no API key required.
// Endpoint:  https://geocoding.geo.census.gov/geocoder/locations/onelineaddress
// Docs:      https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf
//
// We use the Current_Spring2024 benchmark (general-purpose, current addresses).
// To get the county FIPS we also call /geocoder/geographies/onelineaddress with
// vintage Census2020_Current — the geographies endpoint returns the County
// GEOID (5-digit FIPS).

const ONELINE_GEOGRAPHIES =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

export type GeocodeResult = {
  ok: true;
  matchedAddress: string;
  latitude: number;
  longitude: number;
  countyFips: string; // 5-digit STATE+COUNTY GEOID, e.g. "26055"
  countyName: string;
  stateAbbr: string;
};

export type GeocodeFailure = {
  ok: false;
  reason: "no_match" | "non_michigan" | "fetch_error" | "invalid_response";
  message: string;
};

type CensusMatchedAddress = {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  geographies?: {
    Counties?: Array<{
      GEOID: string;
      NAME: string;
      STATE: string;
      COUNTY: string;
      BASENAME: string;
    }>;
    States?: Array<{
      GEOID: string;
      NAME: string;
      STUSAB: string;
    }>;
  };
};

type CensusEnvelope = {
  result?: {
    addressMatches?: CensusMatchedAddress[];
  };
};

/**
 * Resolve an address string to lat/lng + county FIPS via Census Geocoding.
 * 8s timeout — the Census API is generally fast but occasionally hiccups.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | GeocodeFailure> {
  const url = new URL(ONELINE_GEOGRAPHIES);
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");
  url.searchParams.set("layers", "Counties,States");

  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      reason: "fetch_error",
      message: `Census API request failed: ${(err as Error).message}`,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: "fetch_error",
      message: `Census API returned HTTP ${res.status}`,
    };
  }

  let envelope: CensusEnvelope;
  try {
    envelope = (await res.json()) as CensusEnvelope;
  } catch {
    return {
      ok: false,
      reason: "invalid_response",
      message: "Census API returned non-JSON",
    };
  }

  const match = envelope.result?.addressMatches?.[0];
  if (!match) {
    return {
      ok: false,
      reason: "no_match",
      message:
        "We couldn't find that address. Double-check the spelling and try again — full street + city + state works best.",
    };
  }

  const county = match.geographies?.Counties?.[0];
  const state = match.geographies?.States?.[0];
  if (!county || !state) {
    return {
      ok: false,
      reason: "invalid_response",
      message:
        "Census API matched the address but didn't return county data. Try a different format.",
    };
  }

  if (state.STUSAB !== "MI") {
    return {
      ok: false,
      reason: "non_michigan",
      message: `Traverse covers Michigan properties only. ${state.NAME} addresses aren't supported yet.`,
    };
  }

  return {
    ok: true,
    matchedAddress: match.matchedAddress,
    latitude: match.coordinates.y,
    longitude: match.coordinates.x,
    countyFips: county.GEOID,
    countyName: county.BASENAME,
    stateAbbr: state.STUSAB,
  };
}
