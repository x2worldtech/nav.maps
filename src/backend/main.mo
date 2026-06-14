import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Types "types";
import MixinViews "mo:caffeineai-data-viewer/MixinViews";

actor {
  include MixinViews();

  // Both maps are keyed by `<principal>|<id>` so different callers never
  // collide. Ownership is also stored in the value and used for filtering.
  let searchHistory = Map.empty<Text, Types.SearchEntryInternal>();
  let favoritePlaces = Map.empty<Text, Types.FavoritePlace>();

  func keyFor(owner : Principal, id : Text) : Text {
    owner.toText() # "|" # id
  };

  public shared ({ caller }) func addSearchTerm(term : Text, lat : Float, long : Float, zoom : Int) : async () {
    let entry : Types.SearchEntryInternal = {
      term;
      timestamp = Time.now();
      coordinates = { latitude = lat; longitude = long };
      zoomLevel = zoom;
      owner = ?caller;
    };
    searchHistory.add(keyFor(caller, term), entry);
  };

  public shared query ({ caller }) func getSearchHistory() : async [(Text, Types.SearchEntry)] {
    let mine = searchHistory.values().filter(func(e) { e.owner == ?caller }).toArray();
    let sorted = mine.sort(func(a, b) { Int.compare(b.timestamp, a.timestamp) });
    sorted.map<Types.SearchEntryInternal, (Text, Types.SearchEntry)>(
      func(e) {
        (e.term, { term = e.term; timestamp = e.timestamp; coordinates = e.coordinates; zoomLevel = e.zoomLevel })
      }
    )
  };

  public shared ({ caller }) func clearSearchHistory() : async () {
    let keys = searchHistory.entries().filter(func(_k, e) { e.owner == ?caller }).map<(Text, Types.SearchEntryInternal), Text>(func(k, _e) { k }).toArray();
    for (k in keys.values()) {
      searchHistory.remove(k);
    };
  };

  public shared ({ caller }) func addFavoritePlace(placeId : Text, name : Text) : async () {
    let fav : Types.FavoritePlace = { owner = ?caller; placeId; name };
    favoritePlaces.add(keyFor(caller, placeId), fav);
  };

  public shared query ({ caller }) func getFavoritePlaces() : async [(Text, Text)] {
    favoritePlaces.values().filter(func(f) { f.owner == ?caller }).map<Types.FavoritePlace, (Text, Text)>(func(f) { (f.placeId, f.name) }).toArray()
  };

  public shared ({ caller }) func removeFavoritePlace(placeId : Text) : async () {
    favoritePlaces.remove(keyFor(caller, placeId));
  };
};
