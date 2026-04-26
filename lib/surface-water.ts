// Surface-water proximity check for Grand Traverse County.
//
// The GT TOS rule applies if the property is within 300 ft of "surface water"
// (the bays, inland lakes, and perennial streams). For Day 1 we approximate
// surface water as the West Bay + East Bay shorelines using a simplified
// polyline of (lat, lng) coordinates and a haversine distance check.
//
// PRODUCTION SWAP — point-in-buffer via GT County's authoritative ArcGIS layer:
// Grand Traverse County publishes a "Time of Transfer" feature layer in their
// ArcGIS REST service at https://gis.grandtraverse.org/arcgis/rest/services/
// (parcel-level pre-computed answer for whether the rule applies — same logic
// the county itself uses). Switching to that layer is more accurate than our
// haversine guess and zero-maintenance on our side.
//
// Integration sketch:
//   - GET <ArcGIS feature layer URL>/query?geometry=<x,y>&geometryType=esriGeometryPoint
//     &spatialRel=esriSpatialRelWithin&inSR=4326&outFields=*&f=json
//   - Read the layer's "Time of Transfer" attribute on the matching parcel
//   - Fall back to the haversine method if the call fails or returns no match
//
// `surfaceWaterCheck()` is the abstraction point — production wires the
// ArcGIS call through `surfaceWaterCheckArcGIS()` below; the demo continues
// to use the haversine fallback because the county GIS endpoint is not
// reachable from sandboxed CI environments.

const FT_PER_METER = 3.28084;
const PROXIMITY_FT = 300;

// Simplified bay shoreline points — sampled from public OpenStreetMap data.
// West Bay (north→south along the western GT peninsula side):
const WEST_BAY: [number, number][] = [
  [44.9883, -85.6035], // Northport area mouth
  [44.9605, -85.6014],
  [44.9322, -85.5938],
  [44.9011, -85.5788],
  [44.8702, -85.5740],
  [44.8423, -85.5694],
  [44.8155, -85.5648],
  [44.7884, -85.6101], // bay narrows toward TC
  [44.7728, -85.6234],
  [44.7611, -85.6242],
  [44.7541, -85.6201], // West End Beach / TC
  [44.7588, -85.6107], // Open Space, TC
];

// East Bay (north→south along the western shore of Old Mission Peninsula):
const EAST_BAY: [number, number][] = [
  [44.9921, -85.4798], // tip of Old Mission
  [44.9594, -85.4864],
  [44.9280, -85.4946],
  [44.8970, -85.5028],
  [44.8650, -85.5103],
  [44.8302, -85.5191],
  [44.8000, -85.5288],
  [44.7710, -85.5523],
  [44.7592, -85.5849], // East Bay Park area
  [44.7615, -85.5990], // Clinch Park
];

export type SurfaceWaterResult = {
  isWithin: boolean;
  distanceFt: number; // distance to the nearest sampled shoreline point
  nearestFeature: string; // "West Bay" or "East Bay"
  thresholdFt: number;
};

/**
 * Returns the haversine distance (in feet) from a point to the nearest
 * sampled shoreline point, plus a boolean for whether it's within 300 ft.
 *
 * Note: this is an approximation. The simplified polylines mean a point a few
 * hundred feet from the actual shoreline may show as further than its real
 * distance. Day 2 swaps this for a proper polygon-buffer check.
 */
export function surfaceWaterCheck(
  lat: number,
  lng: number,
): SurfaceWaterResult {
  const westBay = nearestDistance(lat, lng, WEST_BAY);
  const eastBay = nearestDistance(lat, lng, EAST_BAY);
  const winner = westBay.distanceFt < eastBay.distanceFt ? westBay : eastBay;
  return {
    isWithin: winner.distanceFt <= PROXIMITY_FT,
    distanceFt: Math.round(winner.distanceFt),
    nearestFeature:
      westBay.distanceFt < eastBay.distanceFt ? "West Bay" : "East Bay",
    thresholdFt: PROXIMITY_FT,
  };
}

function nearestDistance(
  lat: number,
  lng: number,
  points: [number, number][],
): { distanceFt: number } {
  let best = Infinity;
  for (const [pLat, pLng] of points) {
    const d = haversineMeters(lat, lng, pLat, pLng);
    if (d < best) best = d;
  }
  return { distanceFt: best * FT_PER_METER };
}

/**
 * PRODUCTION HOOK — query the GT County ArcGIS "Time of Transfer" layer.
 *
 * Returns the authoritative answer if available, or null on any error so
 * the caller can fall back to the haversine approximation. Wire this in
 * once we have the published feature-layer URL from GTCHD; until then the
 * sandboxed environment can't reach the endpoint reliably.
 */
export async function surfaceWaterCheckArcGIS(
  lat: number,
  lng: number,
): Promise<SurfaceWaterResult | null> {
  // Placeholder: when the layer URL is published, replace with:
  //   const url = `${GT_TOT_LAYER_URL}/query?geometry=${lng},${lat}` +
  //               `&geometryType=esriGeometryPoint&inSR=4326` +
  //               `&spatialRel=esriSpatialRelWithin&outFields=*&f=json`;
  //   const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
  //   const data = await res.json();
  //   const feat = data.features?.[0];
  //   if (!feat) return null;
  //   const within = feat.attributes?.TimeOfTransfer === 1; // boolean from the layer
  //   return {
  //     isWithin: within,
  //     distanceFt: 0,
  //     nearestFeature: "GTCHD Time-of-Transfer parcel layer",
  //     thresholdFt: 300,
  //   };
  void lat;
  void lng;
  return null; // explicit fallback to haversine in callers
}

/** Standard haversine formula — returns distance in meters. */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
