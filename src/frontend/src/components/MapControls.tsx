import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/mapStore";
import { Locate, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function MapControls() {
  const { map, currentMarker, setCurrentMarker } = useMapStore();
  const { resolvedTheme, setTheme } = useTheme();

  const handleLocate = () => {
    if (!map) {
      toast.error("Karte ist noch nicht bereit");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Standortbestimmung wird nicht unterstützt");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        map.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          pitch: 60,
          duration: 2000,
          essential: true,
        });

        const maplibregl = (window as any).maplibregl;
        if (maplibregl) {
          if (currentMarker) currentMarker.remove();

          const el = document.createElement("div");
          el.style.width = "18px";
          el.style.height = "18px";
          el.style.borderRadius = "9999px";
          el.style.background = "#3b82f6";
          el.style.border = "3px solid white";
          el.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.3)";

          const marker = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat([longitude, latitude])
            .addTo(map);
          setCurrentMarker(marker);
        }

        toast.success("Standort gefunden");
      },
      () => {
        toast.error("Standort konnte nicht ermittelt werden");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={handleLocate}
        aria-label="Mein Standort"
        className="glass-card rounded-full border border-border/50 shadow-soft transition-smooth hover:shadow-glow"
      >
        <Locate className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={toggleTheme}
        aria-label="Tag-/Nachtmodus umschalten"
        className="glass-card rounded-full border border-border/50 shadow-soft transition-smooth hover:shadow-glow"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
