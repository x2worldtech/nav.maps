import {
  useAddFavoritePlace,
  useFavoritePlaces,
  useRemoveFavoritePlace,
} from "./useQueries";

export function useFavorites() {
  const { data: favorites = [] } = useFavoritePlaces();
  const { mutateAsync: addFavoriteMutation } = useAddFavoritePlace();
  const { mutateAsync: removeFavoriteMutation } = useRemoveFavoritePlace();

  const isFavorite = (placeId: string) => {
    return favorites.some(([id]) => id === placeId);
  };

  const addFavorite = async (placeId: string, name: string) => {
    await addFavoriteMutation({ placeId, name });
  };

  const removeFavorite = async (placeId: string) => {
    await removeFavoriteMutation(placeId);
  };

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
  };
}
