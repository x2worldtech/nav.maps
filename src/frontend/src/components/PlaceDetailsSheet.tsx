import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useMapStore } from "@/lib/mapStore";
import {
  Clock,
  Globe,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function PlaceDetailsSheet() {
  const { selectedPlace, detailsLoading, setSelectedPlace, setRouteDestination } =
    useMapStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  if (!selectedPlace) return null;

  const place = selectedPlace;
  const isLoading = detailsLoading && place.place_id === "loading";

  const favId = `geo:${place.lat.toFixed(5)},${place.lon.toFixed(5)}`;
  const fav = isFavorite(favId);
  const extra = place.extratags || {};
  const openingHours = extra.opening_hours;
  const phone = extra.phone || extra["contact:phone"];
  const website = extra.website || extra["contact:website"];
  const title =
    place.name || place.display_name.split(",")[0] || "Unbekannter Ort";

  const handleClose = () => setSelectedPlace(null);

  const handleRouteHere = () => {
    setRouteDestination(
      place.display_name || `${place.lat},${place.lon}`,
    );
    setSelectedPlace(null);
  };

  const handleFavorite = async () => {
    try {
      if (fav) {
        await removeFavorite(favId);
        toast.success("Aus Favoriten entfernt");
      } else {
        await addFavorite(favId, place.display_name || title);
        toast.success("Zu Favoriten hinzugefügt");
      }
    } catch (error) {
      console.error("Favorite toggle failed:", error);
      toast.error("Aktion fehlgeschlagen");
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-4 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2">
      <div className="glass-card scale-in rounded-2xl border border-border/50 p-4 shadow-soft">
        {isLoading ? (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Ortsdetails werden geladen...
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {title}
                  </h2>
                  {place.category && (
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {place.category.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label="Schließen"
                className="h-8 w-8 flex-shrink-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {place.display_name && (
              <p className="mt-2 text-sm text-muted-foreground">
                {place.display_name}
              </p>
            )}

            {(openingHours || phone || website) && (
              <div className="mt-3 space-y-1.5">
                {openingHours && (
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {openingHours}
                  </p>
                )}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 text-sm text-primary transition-smooth hover:text-primary/80"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {phone}
                  </a>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary transition-smooth hover:text-primary/80"
                  >
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{website}</span>
                  </a>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleRouteHere}
                className="flex-1 gap-2 rounded-full shadow-soft"
              >
                <Navigation className="h-4 w-4" />
                Route hierher
              </Button>
              <Button
                variant="secondary"
                onClick={handleFavorite}
                aria-label={
                  fav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"
                }
                className="gap-2 rounded-full"
              >
                <Star
                  className={`h-4 w-4 ${fav ? "fill-current text-primary" : ""}`}
                />
                {fav ? "Gespeichert" : "Speichern"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
