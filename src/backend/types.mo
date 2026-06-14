import Time "mo:core/Time";

module {
  public type Coordinate = {
    latitude : Float;
    longitude : Float;
  };

  // Public shape returned to the frontend. Kept identical to the original
  // SearchEntry so the existing Candid bindings keep working unchanged.
  public type SearchEntry = {
    term : Text;
    timestamp : Time.Time;
    coordinates : Coordinate;
    zoomLevel : Int;
  };

  // Internal shape: adds the owning principal so each caller only ever
  // sees their own data. `owner` is optional so pre-existing (pre-upgrade)
  // entries can be migrated with `null` and stay hidden from real callers.
  public type SearchEntryInternal = {
    term : Text;
    timestamp : Time.Time;
    coordinates : Coordinate;
    zoomLevel : Int;
    owner : ?Principal;
  };

  public type FavoritePlace = {
    owner : ?Principal;
    placeId : Text;
    name : Text;
  };
};
