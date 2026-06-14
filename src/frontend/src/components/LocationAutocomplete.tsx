import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchNominatim } from "@/lib/osmApi";
import { Loader2, Locate, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Suggestion {
  place_id: number;
  display_name: string;
  name?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  onLocate?: () => void;
  locating?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  icon: Icon = MapPin,
  onLocate,
  locating = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  // Skip the next debounced search after the user picks a suggestion.
  const skipNextRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchNominatim(value);
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (suggestion: Suggestion) => {
    skipNextRef.current = true;
    onChange(suggestion.display_name);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-1">
        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          className="border-0 bg-transparent px-0 text-base md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {onLocate && (
          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            aria-label="Mein Standort verwenden"
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-primary transition-smooth hover:bg-accent"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {isOpen && (isSearching || suggestions.length > 0) && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-border/50 bg-popover shadow-soft scale-in">
          <ScrollArea className="max-h-60">
            {isSearching ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Suche...
              </div>
            ) : (
              <div className="p-1">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.place_id}
                    onClick={() => handleSelect(suggestion)}
                    className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition-smooth hover:bg-accent"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="line-clamp-2 text-xs text-foreground">
                      {suggestion.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
