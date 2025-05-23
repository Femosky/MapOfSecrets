import type { ReactNode } from 'react';

export type ChildrenProps = {
    children?: ReactNode;
};

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export type PlaceData = [number, Coordinates];

export interface RawLocationCountData {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    count: number;
}

export interface GeneralCoordinates {
    cityTown: Coordinates;
    stateProvince: Coordinates;
    country: Coordinates;
}

export interface PlaceInfo {
    placeId: string;
    name: string;
}

export interface GeneralLocation {
    cityTown: PlaceInfo;
    stateProvince: PlaceInfo;
    country: PlaceInfo;
}

export interface Location {
    id: number;
    coordinates: Coordinates;
    generalCoordinates: GeneralCoordinates;
    generalLocation: GeneralLocation;
    cityTown: string;
    stateProvince: string;
    country: string;
}

export interface Note {
    id: number;
    timestamp: Date;
    location: Location;
    text: string;
}

export interface LocationFetchNoteData {
    locationType: string;
    placeId: string;
}
