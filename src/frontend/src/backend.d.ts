import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Coordinate {
    latitude: number;
    longitude: number;
}
export interface SearchEntry {
    term: string;
    timestamp: Time;
    coordinates: Coordinate;
    zoomLevel: bigint;
}
export type Time = bigint;
export interface backendInterface {
    addFavoritePlace(placeId: string, name: string): Promise<void>;
    addSearchTerm(term: string, lat: number, long: number, zoom: bigint): Promise<void>;
    clearSearchHistory(): Promise<void>;
    getFavoritePlaces(): Promise<Array<[string, string]>>;
    getSearchHistory(): Promise<Array<[string, SearchEntry]>>;
    removeFavoritePlace(placeId: string): Promise<void>;
}
