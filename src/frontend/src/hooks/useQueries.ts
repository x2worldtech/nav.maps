import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackendActor } from "./useBackendActor";

// Search History
export function useSearchHistory() {
  const { actor, isFetching } = useBackendActor();

  return useQuery({
    queryKey: ["searchHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSearchHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSearchTerm() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      term,
      lat,
      lon,
      zoom,
    }: {
      term: string;
      lat: number;
      lon: number;
      zoom: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addSearchTerm(term, lat, lon, zoom);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
    },
  });
}

export function useClearSearchHistory() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.clearSearchHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
    },
  });
}

// Favorite Places
export function useFavoritePlaces() {
  const { actor, isFetching } = useBackendActor();

  return useQuery({
    queryKey: ["favoritePlaces"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFavoritePlaces();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFavoritePlace() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      placeId,
      name,
    }: { placeId: string; name: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addFavoritePlace(placeId, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoritePlaces"] });
    },
  });
}

export function useRemoveFavoritePlace() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (placeId: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.removeFavoritePlace(placeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoritePlaces"] });
    },
  });
}
