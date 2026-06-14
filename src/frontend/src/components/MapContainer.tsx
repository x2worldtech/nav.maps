import { FRANKFURT_CENTER } from "@/lib/constants";
import { useMapStore } from "@/lib/mapStore";
import { reverseNominatim } from "@/lib/osmApi";
import { useEffect, useRef, useState } from "react";

// Dynamic import to avoid build-time issues
let maplibregl: any = null;

export default function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const { setMap } = useMapStore();

  const [isMapLibreLoaded, setIsMapLibreLoaded] = useState(false);

  // Load MapLibre GL dynamically
  useEffect(() => {
    // Load MapLibre GL from CDN
    const loadMapLibre = async () => {
      if ((window as any).maplibregl) {
        maplibregl = (window as any).maplibregl;
        setIsMapLibreLoaded(true);
        return;
      }

      // Load CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
      script.onload = () => {
        maplibregl = (window as any).maplibregl;
        setIsMapLibreLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load MapLibre GL");
      };
      document.head.appendChild(script);
    };

    loadMapLibre();
  }, []);

  // Initialize map
  useEffect(() => {
    if (
      !mapRef.current ||
      mapInstanceRef.current ||
      !isMapLibreLoaded ||
      !maplibregl
    )
      return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [FRANKFURT_CENTER.lng, FRANKFURT_CENTER.lat],
      zoom: 15,
      pitch: 60,
      bearing: 0,
      antialias: true,
      attributionControl: false,
    });

    // Add 3D buildings
    map.on("load", () => {
      const layers = map.getStyle().layers;
      let labelLayerId: string | undefined;

      for (let i = 0; i < layers.length; i++) {
        if (
          layers[i].type === "symbol" &&
          layers[i].layout &&
          "text-field" in layers[i].layout!
        ) {
          labelLayerId = layers[i].id;
          break;
        }
      }

      map.addLayer(
        {
          id: "3d-buildings",
          source: "openmaptiles",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "render_height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "render_min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId,
      );
    });

    mapInstanceRef.current = map;
    setMap(map);

    // Tap anywhere on the map to reverse-geocode and open the place details.
    map.on("click", async (e: any) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      const store = useMapStore.getState();

      store.setDetailsLoading(true);
      store.setSelectedPlace({
        place_id: "loading",
        name: "",
        display_name: "",
        lat,
        lon: lng,
      });

      // Drop a pin at the tapped location.
      const mgl = (window as any).maplibregl;
      if (mgl) {
        if (store.currentMarker) store.currentMarker.remove();
        const el = document.createElement("div");
        el.style.backgroundImage =
          "url(/assets/generated/location-pin-transparent.dim_48x48.png)";
        el.style.width = "48px";
        el.style.height = "48px";
        el.style.backgroundSize = "contain";
        el.style.backgroundRepeat = "no-repeat";
        const marker = new mgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .addTo(map);
        store.setCurrentMarker(marker);
      }

      try {
        const res = await reverseNominatim(lat, lng);
        useMapStore.getState().setSelectedPlace({
          place_id: String(res.place_id ?? `${lat},${lng}`),
          name: res.name || res.display_name?.split(",")[0] || "Unbekannter Ort",
          display_name: res.display_name || "",
          lat,
          lon: lng,
          address: res.address,
          category: res.type || res.category,
          extratags: res.extratags,
        });
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        useMapStore.getState().setSelectedPlace({
          place_id: `${lat},${lng}`,
          name: "Unbekannter Ort",
          display_name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          lat,
          lon: lng,
        });
      } finally {
        useMapStore.getState().setDetailsLoading(false);
      }
    });

    return () => {
      map.remove();
    };
  }, [setMap, isMapLibreLoaded]);

  if (!isMapLibreLoaded) {
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Karte wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
