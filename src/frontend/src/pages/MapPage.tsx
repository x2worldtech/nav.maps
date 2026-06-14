import CategoryBar from "@/components/CategoryBar";
import MapContainer from "@/components/MapContainer";
import MapControls from "@/components/MapControls";
import PlaceDetailsSheet from "@/components/PlaceDetailsSheet";
import RoutePanel from "@/components/RoutePanel";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/mapStore";
import { Navigation } from "lucide-react";
import { useEffect, useState } from "react";

export default function MapPage() {
  const [routeOpen, setRouteOpen] = useState(false);
  const routeDestination = useMapStore((s) => s.routeDestination);

  // "Route hierher" sets a destination; open the route panel when it appears.
  useEffect(() => {
    if (routeDestination) setRouteOpen(true);
  }, [routeDestination]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <MapContainer />

      {/* Search + categories - Top Center */}
      <div className="absolute top-4 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 space-y-3 px-4 scale-in">
        <SearchBar />
        <CategoryBar />
      </div>

      {/* Map controls (locate + theme) - Right */}
      <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2 scale-in">
        <MapControls />
      </div>

      {/* Route toggle - Left */}
      {!routeOpen && (
        <div className="absolute left-4 top-1/2 z-20 -translate-y-1/2 scale-in">
          <Button
            onClick={() => setRouteOpen(true)}
            aria-label="Route planen"
            className="gap-2 rounded-full shadow-soft transition-smooth hover:shadow-glow"
          >
            <Navigation className="h-4 w-4" />
            Route
          </Button>
        </div>
      )}

      {/* Route panel - Top Left */}
      {routeOpen && (
        <div className="absolute left-4 top-4 z-30 w-[360px] max-w-[calc(100vw-2rem)]">
          <RoutePanel onClose={() => setRouteOpen(false)} />
        </div>
      )}

      {/* Place details - Bottom sheet */}
      <PlaceDetailsSheet />
    </div>
  );
}
