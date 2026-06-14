import { FRANKFURT_CENTER } from "./constants";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const OVERPASS_BASE_URL = "https://overpass-api.de/api/interpreter";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: any;
  type?: string;
}

interface OverpassResult {
  place_id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  tags?: any;
}

// Travel modes exposed in the UI, mapped to the keyless FOSSGIS OSRM
// routing servers (the same ones that power openstreetmap.org directions).
export type TravelMode = "driving" | "cycling" | "walking";

const OSRM_PROFILE: Record<TravelMode, string> = {
  driving: "routed-car",
  cycling: "routed-bike",
  walking: "routed-foot",
};

const OSRM_BASE_URL = "https://routing.openstreetmap.de";

// Build a short German turn instruction from an OSRM maneuver object.
function osrmInstruction(maneuver: any, name: string): string {
  const type = maneuver?.type as string | undefined;
  const modifier = maneuver?.modifier as string | undefined;
  const on = name ? ` auf ${name}` : "";

  if (type === "depart") return `Losfahren${on}`;
  if (type === "arrive") return "Ankunft am Ziel";
  if (type === "roundabout" || type === "rotary") {
    const exit = maneuver?.exit ? ` (${maneuver.exit}. Ausfahrt)` : "";
    return `Im Kreisverkehr${exit}${on}`;
  }

  const dirByModifier: Record<string, string> = {
    left: "Links abbiegen",
    right: "Rechts abbiegen",
    "slight left": "Leicht links halten",
    "slight right": "Leicht rechts halten",
    "sharp left": "Scharf links",
    "sharp right": "Scharf rechts",
    straight: "Geradeaus weiter",
    uturn: "Wenden",
  };

  const base = modifier ? dirByModifier[modifier] : undefined;
  if (base) return `${base}${on}`;
  if (type === "continue" || type === "new name") return `Weiter${on}`;
  return name ? `Weiter auf ${name}` : "Weiter";
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  name: string;
}

export interface RouteResult {
  geometry: any; // GeoJSON LineString
  distance: number; // meters
  duration: number; // seconds
  bbox: number[]; // [minLon, minLat, maxLon, maxLat]
  steps: RouteStep[];
  start: [number, number]; // [lon, lat]
  end: [number, number]; // [lon, lat]
  startLabel: string;
  endLabel: string;
}

export async function searchNominatim(
  query: string,
  _center?: { lat: number; lng: number },
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "10",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: {
      "User-Agent": "Frankfurt3DMaps/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Nominatim search failed");
  }

  return response.json();
}

export async function searchOverpass(
  category: string,
  center: { lat: number; lng: number },
): Promise<OverpassResult[]> {
  // Map category types to Overpass tags
  const categoryMap: Record<string, string> = {
    restaurant: "amenity=restaurant",
    museum: "tourism=museum",
    shopping_mall: "shop",
    cafe: "amenity=cafe",
    lodging: "tourism=hotel",
    bank: "amenity=bank",
  };

  const tag = categoryMap[category] || category;
  const radius = 2000; // 2km radius

  const query = `
    [out:json][timeout:25];
    (
      node[${tag}](around:${radius},${center.lat},${center.lng});
      way[${tag}](around:${radius},${center.lat},${center.lng});
    );
    out center;
  `;

  const response = await fetch(OVERPASS_BASE_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new Error("Overpass search failed");
  }

  const data = await response.json();

  return data.elements.map((element: any) => ({
    place_id: `${element.type}/${element.id}`,
    name: element.tags?.name || "Unbenannt",
    lat: element.lat || element.center?.lat,
    lon: element.lon || element.center?.lon,
    type: category,
    tags: element.tags,
  }));
}

// Detect a plain "lat, lon" string so current-location / coordinate inputs
// can skip geocoding entirely (more reliable than re-geocoding a label).
function parseCoord(query: string): [number, number] | null {
  const match = query
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number.parseFloat(match[1]);
  const lon = Number.parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return [lon, lat]; // ORS expects [lon, lat]
}

async function geocodeOne(
  query: string,
): Promise<{ coord: [number, number]; label: string }> {
  const coord = parseCoord(query);
  if (coord) {
    return { coord, label: query };
  }

  const results = await searchNominatim(query, FRANKFURT_CENTER);
  if (results.length === 0) {
    throw new Error(`Adresse nicht gefunden: ${query}`);
  }
  const first = results[0];
  return {
    coord: [Number.parseFloat(first.lon), Number.parseFloat(first.lat)],
    label: first.display_name,
  };
}

export async function calculateRoute(
  origin: string,
  destination: string,
  mode: TravelMode,
): Promise<RouteResult | null> {
  // Geocode origin and destination in parallel.
  const [originGeo, destGeo] = await Promise.all([
    geocodeOne(origin),
    geocodeOne(destination),
  ]);

  const server = OSRM_PROFILE[mode] || OSRM_PROFILE.driving;
  const coords = `${originGeo.coord[0]},${originGeo.coord[1]};${destGeo.coord[0]},${destGeo.coord[1]}`;
  const url = `${OSRM_BASE_URL}/${server}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Routing-Limit erreicht – bitte kurz warten und erneut versuchen",
      );
    }
    throw new Error(`Routenberechnung fehlgeschlagen (${response.status})`);
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    return null;
  }

  const route = data.routes[0];

  const steps: RouteStep[] = [];
  for (const leg of route.legs || []) {
    for (const step of leg.steps || []) {
      const name = step.name ? step.name : "";
      steps.push({
        instruction: osrmInstruction(step.maneuver, name),
        distance: step.distance || 0,
        duration: step.duration || 0,
        name,
      });
    }
  }

  // OSRM doesn't return a bbox; compute one from the geometry coordinates.
  const coordsList: [number, number][] = route.geometry?.coordinates || [];
  let bbox: number[] = [];
  if (coordsList.length > 0) {
    let minLon = coordsList[0][0];
    let minLat = coordsList[0][1];
    let maxLon = coordsList[0][0];
    let maxLat = coordsList[0][1];
    for (const [lon, lat] of coordsList) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
    bbox = [minLon, minLat, maxLon, maxLat];
  }

  return {
    geometry: route.geometry,
    distance: route.distance ?? 0,
    duration: route.duration ?? 0,
    bbox,
    steps,
    start: originGeo.coord,
    end: destGeo.coord,
    startLabel: originGeo.label,
    endLabel: destGeo.label,
  };
}

export interface ReverseResult {
  place_id?: number;
  display_name: string;
  name?: string;
  type?: string;
  category?: string;
  address?: any;
  extratags?: any;
  lat: string;
  lon: string;
}

// Reverse geocode a tapped coordinate into a human-readable place with
// whatever OSM metadata is available (address, opening hours, phone, ...).
export async function reverseNominatim(
  lat: number,
  lon: number,
): Promise<ReverseResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    zoom: "18",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
    headers: {
      "User-Agent": "Frankfurt3DMaps/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Reverse-Geocoding fehlgeschlagen");
  }

  return response.json();
}
