// Helpers for drawing and clearing a calculated route on the MapLibre map.
// Layer/source IDs are fixed so we can reliably add and remove them.

const ROUTE_SOURCE = "route-source";
const ROUTE_LINE = "route-line";
const ROUTE_CASING = "route-casing";

function makeEndpointEl(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.borderRadius = "9999px";
  el.style.background = color;
  el.style.border = "3px solid white";
  el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
  return el;
}

export function clearRoute(map: any): void {
  if (!map) return;

  // Remove endpoint markers stored on the map instance.
  if (map.__routeMarkers) {
    for (const marker of map.__routeMarkers) {
      marker.remove();
    }
    map.__routeMarkers = [];
  }

  if (map.getLayer(ROUTE_LINE)) map.removeLayer(ROUTE_LINE);
  if (map.getLayer(ROUTE_CASING)) map.removeLayer(ROUTE_CASING);
  if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
}

export function drawRoute(
  map: any,
  geometry: any,
  start: [number, number],
  end: [number, number],
  bbox: number[] | undefined,
): void {
  if (!map) return;
  const maplibregl = (window as any).maplibregl;
  if (!maplibregl) return;

  clearRoute(map);

  map.addSource(ROUTE_SOURCE, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry,
    },
  });

  // Wider darker casing underneath for contrast.
  map.addLayer({
    id: ROUTE_CASING,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#1e3a8a",
      "line-width": 10,
      "line-opacity": 0.5,
    },
  });

  // Bright primary line on top.
  map.addLayer({
    id: ROUTE_LINE,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#3b82f6",
      "line-width": 6,
    },
  });

  const startMarker = new maplibregl.Marker({
    element: makeEndpointEl("#22c55e"),
    anchor: "center",
  })
    .setLngLat(start)
    .addTo(map);

  const endMarker = new maplibregl.Marker({
    element: makeEndpointEl("#ef4444"),
    anchor: "center",
  })
    .setLngLat(end)
    .addTo(map);

  map.__routeMarkers = [startMarker, endMarker];

  // ORS returns a 4-element bbox [minLng, minLat, maxLng, maxLat], or a
  // 6-element one [minLng, minLat, minEle, maxLng, maxLat, maxEle] with
  // elevation. Pick the right indices for each.
  let sw: [number, number] | null = null;
  let ne: [number, number] | null = null;
  if (bbox && bbox.length === 4) {
    sw = [bbox[0], bbox[1]];
    ne = [bbox[2], bbox[3]];
  } else if (bbox && bbox.length === 6) {
    sw = [bbox[0], bbox[1]];
    ne = [bbox[3], bbox[4]];
  }

  if (sw && ne) {
    // Padding must stay smaller than the map size, otherwise fitBounds
    // miscalculates on narrow (mobile) screens. Keep it modest and symmetric
    // on small screens; give extra room for the side panel on desktop.
    const isDesktop =
      typeof window !== "undefined" && window.innerWidth >= 768;
    const padding = isDesktop
      ? { top: 100, bottom: 100, left: 400, right: 80 }
      : { top: 240, bottom: 120, left: 40, right: 40 };

    map.fitBounds([sw, ne], {
      padding,
      pitch: 0,
      duration: 1500,
      essential: true,
    });
  }
}
