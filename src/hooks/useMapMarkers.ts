import { useCallback, useEffect, useRef, useState } from 'react';
import { makeHTMLMarkerClass } from '../models/HTMLMarker';
import { useMap } from './useMap';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useNotes } from './useNotes';
import { useLocationNumbers } from './useLocationNumbers';
import type { Coordinates } from '../models/mapInterfaces';

export function useMapMarkers() {
    const mapRef = useRef<google.maps.Map | null>(null);
    const noteMarkers = useRef<google.maps.OverlayView[]>([]);
    const cityTownMarkers = useRef<google.maps.OverlayView[]>([]);
    const stateProvinceMarkers = useRef<google.maps.OverlayView[]>([]);
    const countryMarkers = useRef<google.maps.OverlayView[]>([]);
    const loadingMarker = useRef<google.maps.OverlayView[]>([]);

    const [loadingSaveNote, setLoadingSaveNote] = useState<boolean>(false);
    const [loadingCoordinates, setLoadingCoordinates] = useState<Coordinates[]>([]);

    const { notesVisible, cityTownsVisible, stateProvincesVisible, countriesVisible, setMap } = useMap();
    const { notes } = useNotes();
    const { cityTowns, stateProvinces, countries } = useLocationNumbers();

    // Initialize clustering
    const onMapLoad = useCallback(
        (mapInstance: google.maps.Map) => {
            mapRef.current = mapInstance;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mapRef as any).HTMLMarker = makeHTMLMarkerClass();
            setMap(mapInstance);
            new MarkerClusterer({ map: mapInstance });
        },
        [setMap]
    );

    // Display Markers
    useEffect(() => {
        if (!mapRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const HTMLMarker = (mapRef as any).HTMLMarker as any;

        loadingMarker.current.forEach((m) => m.setMap(null));
        loadingMarker.current = [];
        if (loadingSaveNote) {
            loadingMarker.current = loadingCoordinates.map((coordinates) => {
                return new HTMLMarker(
                    mapRef.current!,
                    {
                        lat: coordinates.latitude,
                        lng: coordinates.longitude,
                    },
                    'Loading...',
                    'loading'
                );
            });
        }

        noteMarkers.current.forEach((m) => m.setMap(null));
        noteMarkers.current = [];
        if (notesVisible) {
            noteMarkers.current = notes.map((note) => {
                return new HTMLMarker(
                    mapRef.current!,
                    { lat: note.location.coordinates.latitude, lng: note.location.coordinates.longitude },
                    note.text,
                    'note'
                );
            });
        }

        cityTownMarkers.current.forEach((m) => m.setMap(null));
        cityTownMarkers.current = [];
        if (cityTownsVisible) {
            cityTownMarkers.current = cityTowns.map((cityTown) => {
                return new HTMLMarker(
                    mapRef.current!,
                    { lat: cityTown[1].latitude, lng: cityTown[1].longitude },
                    cityTown[0],
                    'cityTown'
                );
            });
        }

        stateProvinceMarkers.current.forEach((m) => m.setMap(null));
        stateProvinceMarkers.current = [];
        if (stateProvincesVisible) {
            stateProvinceMarkers.current = stateProvinces.map((stateProvince) => {
                return new HTMLMarker(
                    mapRef.current!,
                    { lat: stateProvince[1].latitude, lng: stateProvince[1].longitude },
                    stateProvince[0],
                    'stateProvince'
                );
            });
        }

        countryMarkers.current.forEach((m) => m.setMap(null));
        countryMarkers.current = [];
        if (countriesVisible) {
            countryMarkers.current = countries.map((country) => {
                return new HTMLMarker(
                    mapRef.current!,
                    { lat: country[1].latitude, lng: country[1].longitude },
                    country[0],
                    'country'
                );
            });
        }
    }, [
        notesVisible,
        cityTownsVisible,
        stateProvincesVisible,
        countriesVisible,
        notes,
        cityTowns,
        stateProvinces,
        countries,
        loadingSaveNote,
        loadingCoordinates,
    ]);

    return { onMapLoad, setLoadingSaveNote, setLoadingCoordinates };
}
