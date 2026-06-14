import { Button } from "@/components/ui/button";
import { PLACE_CATEGORIES } from "@/lib/constants";
import { useMapStore } from "@/lib/mapStore";
import { searchOverpass } from "@/lib/osmApi";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CategoryBar() {
  const { map } = useMapStore();
  const [active, setActive] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const clearMarkers = () => {
    if (map?.__categoryMarkers) {
      for (const marker of map.__categoryMarkers) {
        marker.remove();
      }
      map.__categoryMarkers = [];
    }
  };

  const handleCategory = async (type: string) => {
    if (!map) {
      toast.error("Karte ist noch nicht bereit");
      return;
    }

    // Tapping the active category again clears it.
    if (active === type) {
      clearMarkers();
      setActive(null);
      return;
    }

    const maplibregl = (window as any).maplibregl;
    if (!maplibregl) return;

    setLoadingType(type);
    try {
      const center = map.getCenter();
      const results = await searchOverpass(type, {
        lat: center.lat,
        lng: center.lng,
      });

      clearMarkers();

      const markers: any[] = [];
      for (const result of results.slice(0, 60)) {
        if (!result.lat || !result.lon) continue;

        const el = document.createElement("div");
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "9999px";
        el.style.background = "oklch(55% 0.22 260)";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([result.lon, result.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 16, closeButton: false }).setText(
              result.name,
            ),
          )
          .addTo(map);
        markers.push(marker);
      }

      map.__categoryMarkers = markers;
      setActive(type);

      if (markers.length === 0) {
        toast("Keine Orte in der Nähe gefunden");
      } else {
        toast.success(`${markers.length} Orte gefunden`);
      }
    } catch (error) {
      console.error("Category search error:", error);
      toast.error("Kategorie-Suche fehlgeschlagen");
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {PLACE_CATEGORIES.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant={active === type ? "default" : "secondary"}
          size="sm"
          onClick={() => handleCategory(type)}
          disabled={loadingType !== null}
          className="glass-card flex-shrink-0 gap-1.5 whitespace-nowrap rounded-full border border-border/50 shadow-soft transition-smooth"
        >
          {loadingType === type ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
          {label}
        </Button>
      ))}
    </div>
  );
}
