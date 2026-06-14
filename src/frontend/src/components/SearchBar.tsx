import { useFavorites } from "@/hooks/useFavorites";
import { useAddSearchTerm, useSearchHistory } from "@/hooks/useQueries";
import { useMapStore } from "@/lib/mapStore";
import { searchNominatim } from "@/lib/osmApi";
import {
  ArrowLeft,
  Clock,
  Loader2,
  MapPin,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
}

function splitName(value: string): { title: string; subtitle: string } {
  const parts = value.split(",");
  return {
    title: parts[0].trim(),
    subtitle: parts.slice(1).join(",").trim(),
  };
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { map, currentMarker, setCurrentMarker } = useMapStore();
  const { data: searchHistory } = useSearchHistory();
  const addSearchTerm = useAddSearchTerm();
  const { favorites, isFavorite, addFavorite, removeFavorite } = useFavorites();

  // Focus the field as soon as the overlay opens (brings up the keyboard).
  useEffect(() => {
    if (overlayOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [overlayOpen]);

  // Debounced search while typing.
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await searchNominatim(query);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Suche fehlgeschlagen");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const closeOverlay = () => {
    setOverlayOpen(false);
    setQuery("");
    setResults([]);
  };

  const addMarkerToMap = (lon: number, lat: number) => {
    if (!map) return;
    const maplibregl = (window as any).maplibregl;
    if (!maplibregl) return;

    if (currentMarker) currentMarker.remove();

    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.backgroundImage =
      "url(/assets/generated/location-pin-transparent.dim_48x48.png)";
    el.style.width = "48px";
    el.style.height = "48px";
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    el.style.cursor = "pointer";

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lon, lat])
      .addTo(map);
    setCurrentMarker(marker);
  };

  const flyToCoords = (lon: number, lat: number, zoom: number) => {
    if (!map) {
      toast.error("Karte ist noch nicht bereit");
      return;
    }
    map.flyTo({
      center: [lon, lat],
      zoom,
      pitch: 60,
      duration: 2000,
      essential: true,
    });
    map.once("moveend", () => addMarkerToMap(lon, lat));
  };

  const handleSelectLocation = async (result: SearchResult) => {
    const lat = Number.parseFloat(result.lat);
    const lon = Number.parseFloat(result.lon);
    flyToCoords(lon, lat, 14);

    try {
      await addSearchTerm.mutateAsync({
        term: result.display_name,
        lat,
        lon,
        zoom: BigInt(14),
      });
    } catch (error) {
      console.error("Failed to save search:", error);
    }

    closeOverlay();
  };

  const handleSelectHistory = (entry: [string, any]) => {
    const [, searchEntry] = entry;
    const { coordinates, zoomLevel } = searchEntry;
    flyToCoords(coordinates.longitude, coordinates.latitude, Number(zoomLevel));
    closeOverlay();
  };

  const handleToggleFavorite = async (result: SearchResult) => {
    const placeId = `nominatim:${result.place_id}`;
    try {
      if (isFavorite(placeId)) {
        await removeFavorite(placeId);
        toast.success("Aus Favoriten entfernt");
      } else {
        await addFavorite(placeId, result.display_name);
        toast.success("Zu Favoriten hinzugefügt");
      }
    } catch (error) {
      console.error("Favorite toggle failed:", error);
      toast.error("Aktion fehlgeschlagen");
    }
  };

  const handleSelectFavorite = async (name: string) => {
    try {
      const found = await searchNominatim(name);
      if (found.length === 0) {
        toast.error("Ort nicht gefunden");
        return;
      }
      const first = found[0];
      flyToCoords(
        Number.parseFloat(first.lon),
        Number.parseFloat(first.lat),
        14,
      );
      closeOverlay();
    } catch (error) {
      console.error("Favorite navigation failed:", error);
      toast.error("Navigation fehlgeschlagen");
    }
  };

  const hasRecent = searchHistory && searchHistory.length > 0;

  return (
    <>
      {/* Collapsed trigger that sits on the map */}
      <button
        type="button"
        onClick={() => setOverlayOpen(true)}
        aria-label="Suche öffnen"
        className="glass-card flex w-full items-center gap-3 rounded-2xl border border-border/50 p-3 shadow-soft transition-smooth hover:shadow-glow"
      >
        <Search className="ml-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-left text-base text-muted-foreground md:text-sm">
          Weltweit nach Orten suchen
        </span>
      </button>

      {/* Full-screen search overlay (portaled to body so it escapes any
          transformed ancestor and truly covers the viewport) */}
      {overlayOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Header with back button + input */}
          <div
            className="flex items-center gap-2 border-b border-border/50 px-3 pb-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          >
            <button
              type="button"
              onClick={closeOverlay}
              aria-label="Zurück"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-foreground transition-smooth hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex flex-1 items-center gap-2 rounded-full bg-muted px-4 py-2.5">
              <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hier suchen"
                className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Eingabe löschen"
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {query.length >= 3 ? (
              isSearching ? (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suche läuft...
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {results.map((result) => {
                    const placeId = `nominatim:${result.place_id}`;
                    const fav = isFavorite(placeId);
                    const { title, subtitle } = splitName(result.display_name);
                    return (
                      <div
                        key={result.place_id}
                        className="flex items-center gap-3 px-4 transition-smooth hover:bg-accent/50"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectLocation(result)}
                          className="flex flex-1 items-center gap-3 py-3 text-left"
                        >
                          <MapPin className="h-5 w-5 flex-shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-medium text-foreground">
                              {result.name || title}
                            </p>
                            {subtitle && (
                              <p className="truncate text-sm text-muted-foreground">
                                {subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(result)}
                          aria-label={
                            fav
                              ? "Aus Favoriten entfernen"
                              : "Zu Favoriten hinzufügen"
                          }
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-smooth hover:bg-accent"
                        >
                          <Star
                            className={`h-5 w-5 ${fav ? "fill-current text-primary" : "text-muted-foreground"}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Keine Ergebnisse gefunden
                </div>
              )
            ) : (
              <>
                {favorites.length > 0 && (
                  <div className="pt-2">
                    <h3 className="px-4 py-2 text-sm font-semibold text-foreground">
                      Favoriten
                    </h3>
                    {favorites.map(([placeId, name]) => {
                      const { title, subtitle } = splitName(name);
                      return (
                        <div
                          key={`fav-${placeId}`}
                          className="flex items-center gap-3 px-4 transition-smooth hover:bg-accent/50"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectFavorite(name)}
                            className="flex flex-1 items-center gap-3 py-3 text-left"
                          >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Star className="h-5 w-5 fill-current text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-base font-medium text-foreground">
                                {title}
                              </p>
                              {subtitle && (
                                <p className="truncate text-sm text-muted-foreground">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFavorite(placeId)}
                            aria-label="Favorit entfernen"
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-smooth hover:bg-accent"
                          >
                            <Trash2 className="h-5 w-5 text-muted-foreground" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasRecent && (
                  <div className="pt-2">
                    <h3 className="px-4 py-2 text-sm font-semibold text-foreground">
                      Zuletzt gesucht
                    </h3>
                    {searchHistory?.map((entry) => {
                      const { title, subtitle } = splitName(entry[1].term);
                      return (
                        <button
                          type="button"
                          key={`history-${entry[0]}`}
                          onClick={() => handleSelectHistory(entry)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-smooth hover:bg-accent/50"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-medium text-foreground">
                              {title}
                            </p>
                            {subtitle && (
                              <p className="truncate text-sm text-muted-foreground">
                                {subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {favorites.length === 0 && !hasRecent && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Noch keine Suchen. Tippe oben einen Ort ein.
                  </div>
                )}
              </>
            )}
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
