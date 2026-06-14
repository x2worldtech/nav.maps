import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMapStore } from "@/lib/mapStore";
import {
  type RouteResult,
  type TravelMode,
  calculateRoute,
  reverseNominatim,
} from "@/lib/osmApi";
import { clearRoute, drawRoute } from "@/lib/routeLayer";
import {
  Bike,
  Car,
  CornerUpRight,
  Footprints,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Route as RouteIcon,
  ArrowUpDown,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RoutePanelProps {
  onClose: () => void;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} h ${minutes} min`;
  }
  return `${totalMinutes} min`;
}

const MODES: { value: TravelMode; label: string; icon: typeof Car }[] = [
  { value: "driving", label: "Auto", icon: Car },
  { value: "cycling", label: "Fahrrad", icon: Bike },
  { value: "walking", label: "Zu Fuß", icon: Footprints },
];

export default function RoutePanel({ onClose }: RoutePanelProps) {
  const { map, routeDestination, setRouteDestination } = useMapStore();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<TravelMode>("driving");
  const [isLoading, setIsLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);

  // Consume a prefilled destination from "Route hierher" (one-shot), whether
  // the panel was just opened or is already open.
  useEffect(() => {
    if (routeDestination) {
      setTo(routeDestination);
      setRouteDestination(null);
    }
  }, [routeDestination, setRouteDestination]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Standortbestimmung wird nicht unterstützt");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await reverseNominatim(latitude, longitude);
          setFrom(res.display_name || `${latitude}, ${longitude}`);
        } catch {
          setFrom(`${latitude}, ${longitude}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Standort konnte nicht ermittelt werden");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleCalculate = async () => {
    if (!from.trim() || !to.trim()) {
      toast.error("Bitte Start und Ziel eingeben");
      return;
    }
    if (!map) {
      toast.error("Karte ist noch nicht bereit");
      return;
    }

    setIsLoading(true);
    try {
      const route = await calculateRoute(from, to, mode);
      if (!route) {
        toast.error("Keine Route gefunden");
        return;
      }
      setResult(route);
      drawRoute(map, route.geometry, route.start, route.end, route.bbox);
      toast.success("Route berechnet");
    } catch (error) {
      console.error("Route error:", error);
      toast.error(
        error instanceof Error ? error.message : "Routenberechnung fehlgeschlagen",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearRoute = () => {
    setResult(null);
    if (map) clearRoute(map);
  };

  return (
    <div className="glass-card flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-border/50 shadow-soft scale-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Route planen</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Inputs */}
      <div className="space-y-2 p-4">
        <LocationAutocomplete
          value={from}
          onChange={setFrom}
          placeholder="Start (oder Mein Standort)"
          icon={MapPin}
          onLocate={handleUseMyLocation}
          locating={locating}
        />

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwap}
            className="h-7 w-7 rounded-full text-muted-foreground"
            aria-label="Start und Ziel tauschen"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        <LocationAutocomplete
          value={to}
          onChange={setTo}
          placeholder="Ziel"
          icon={Navigation}
        />

        {/* Travel mode */}
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as TravelMode)}
          variant="outline"
          className="w-full pt-1"
        >
          {MODES.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="flex-1 gap-1.5 text-xs"
            >
              <Icon className="h-4 w-4" />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button
          onClick={handleCalculate}
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RouteIcon className="h-4 w-4" />
          )}
          {isLoading ? "Berechne..." : "Route berechnen"}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="flex min-h-0 flex-1 flex-col border-t border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <RouteIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {formatDistance(result.distance)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {formatDuration(result.duration)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearRoute}
              className="h-7 text-xs text-muted-foreground"
            >
              Entfernen
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1 border-t border-border/50">
            <div className="p-2">
              {result.steps.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  Keine Wegbeschreibung verfügbar
                </p>
              ) : (
                result.steps.map((step, index) => (
                  <div
                    key={`${index}-${step.instruction}`}
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-smooth hover:bg-accent/60"
                  >
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CornerUpRight className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        {step.instruction}
                      </p>
                      {(step.name || step.distance > 0) && (
                        <p className="text-xs text-muted-foreground">
                          {step.name ? `${step.name} · ` : ""}
                          {formatDistance(step.distance)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
