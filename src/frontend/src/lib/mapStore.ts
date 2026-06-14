import { create } from "zustand";

interface Place {
  place_id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  address?: any;
  type?: string;
  category?: string;
  opening_hours?: string;
  extratags?: any;
}

interface MapStore {
  map: any | null;
  selectedPlace: Place | null;
  detailsLoading: boolean;
  searchResults: Place[];
  categoryFilter: string | null;
  currentMarker: any | null;
  routeDestination: string | null;

  setMap: (map: any) => void;
  setSelectedPlace: (place: Place | null) => void;
  setDetailsLoading: (loading: boolean) => void;
  setSearchResults: (results: Place[]) => void;
  setCategoryFilter: (filter: string | null) => void;
  setCurrentMarker: (marker: any | null) => void;
  setRouteDestination: (destination: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  map: null,
  selectedPlace: null,
  detailsLoading: false,
  searchResults: [],
  categoryFilter: null,
  currentMarker: null,
  routeDestination: null,

  setMap: (map) => set({ map }),
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  setDetailsLoading: (loading) => set({ detailsLoading: loading }),
  setSearchResults: (results) => set({ searchResults: results }),
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setCurrentMarker: (marker) => set({ currentMarker: marker }),
  setRouteDestination: (destination) => set({ routeDestination: destination }),
}));
