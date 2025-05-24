import { useCallback, useEffect, useRef, useState } from 'react';
import { makeHTMLMarkerClass } from '../models/HTMLMarker';
import { useMap } from './useMap';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useNotes } from './useNotes';
import { useLocationNumbers } from './useLocationNumbers';
import type { Coordinates, Note } from '../models/mapInterfaces';
import { numberCountFormmatter } from '../utils/globalUtils';

// // 1) Grab the constructor the first time
// const HTMLMarkerClass = makeHTMLMarkerClass();

// // 2) Tell TypeScript “HTMLMarkerType is an instance of that constructor”
// type HTMLMarkerType = InstanceType<typeof HTMLMarkerClass>;

export function useMapMarkers() {
    // will hold your subclass once google.maps is ready
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const HTMLMarkerClassRef = useRef<null | (new (...args: any[]) => any)>(null);

    // now your refs can still be typed to the right instance
    type HTMLMarkerType = InstanceType<NonNullable<typeof HTMLMarkerClassRef.current>>;

    const mapRef = useRef<google.maps.Map | null>(null);
    const noteMarkers = useRef<HTMLMarkerType[]>([]);
    const cityTownMarkers = useRef<HTMLMarkerType[]>([]);
    const stateProvinceMarkers = useRef<HTMLMarkerType[]>([]);
    const countryMarkers = useRef<HTMLMarkerType[]>([]);
    const loadingMarker = useRef<HTMLMarkerType[]>([]);

    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    const [loadingSaveNote, setLoadingSaveNote] = useState<boolean>(false);
    const [loadingCoordinates, setLoadingCoordinates] = useState<Coordinates[]>([]);

    const { notesVisible, cityTownsVisible, stateProvincesVisible, countriesVisible, setMap } = useMap();
    const { notes } = useNotes();
    const { cityTowns, stateProvinces, countries } = useLocationNumbers();

    // Initialize clustering
    const onMapLoad = useCallback(
        (mapInstance: google.maps.Map) => {
            mapRef.current = mapInstance;
            HTMLMarkerClassRef.current = makeHTMLMarkerClass();
            setMap(mapInstance);
            new MarkerClusterer({ map: mapInstance });
        },
        [setMap]
    );

    const onMarkerClick = useCallback(
        (clickedId: string, type: string) => {
            // reset z-index on all markers
            if (type === 'note') {
                noteMarkers.current.forEach((m) => m.setZIndex(0));

                const foundMarker = noteMarkers.current.find((m) => m.id === clickedId);
                if (foundMarker) {
                    foundMarker.setZIndex(9999);

                    const foundNote = notes.find((n) => String(n.id) === clickedId) || null;
                    setSelectedNote(foundNote);
                }
            } else if (type === 'cityTown') {
                cityTownMarkers.current.forEach((m) => m.setZIndex(0));

                const foundMarker = cityTownMarkers.current.find((m) => m.id === clickedId);
                if (foundMarker) {
                    foundMarker.setZIndex(9999);
                    // const foundCityTown = cityTowns.find((cityTown) => JSON.stringify(cityTown[1]) === clickedId) || null;
                }
            } else if (type === 'stateProvince') {
                stateProvinceMarkers.current.forEach((m) => m.setZIndex(0));

                const foundMarker = stateProvinceMarkers.current.find((m) => m.id === clickedId);
                if (foundMarker) {
                    foundMarker.setZIndex(9999);
                    // const foundStateProvince = stateProvinces.find((stateProvince) => JSON.stringify(stateProvince[1]) === clickedId) || null;
                }
            } else if (type === 'country') {
                countryMarkers.current.forEach((m) => m.setZIndex(0));

                const foundMarker = countryMarkers.current.find((m) => m.id === clickedId);
                if (foundMarker) {
                    foundMarker.setZIndex(9999);
                    // const foundCountry = countries.find((country) => JSON.stringify(country[1]) === clickedId) || null;
                }
            }
        },
        [notes]
    );

    // Display Markers
    useEffect(() => {
        if (!mapRef.current || !HTMLMarkerClassRef.current) return;
        const HTMLMarkerClass = HTMLMarkerClassRef.current;

        loadingMarker.current.forEach((m) => m.setMap(null));
        loadingMarker.current = [];
        if (loadingSaveNote) {
            loadingMarker.current = loadingCoordinates.map((coordinates) => {
                return new HTMLMarkerClass(
                    mapRef.current!,
                    {
                        lat: coordinates.latitude,
                        lng: coordinates.longitude,
                    },
                    'Loading...',
                    'loading',
                    'loading',
                    onMarkerClick
                );
            });
        }

        noteMarkers.current.forEach((m) => m.setMap(null));
        noteMarkers.current = [];
        if (notesVisible) {
            noteMarkers.current = notes.map((note) => {
                return new HTMLMarkerClass(
                    mapRef.current!,
                    { lat: note.location.coordinates.latitude, lng: note.location.coordinates.longitude },
                    note.text,
                    'note',
                    String(note.id),
                    onMarkerClick
                );
            });
        }

        cityTownMarkers.current.forEach((m) => m.setMap(null));
        cityTownMarkers.current = [];
        if (cityTownsVisible) {
            cityTownMarkers.current = cityTowns.map((cityTown) => {
                return new HTMLMarkerClass(
                    mapRef.current!,
                    { lat: cityTown[1].latitude, lng: cityTown[1].longitude },
                    numberCountFormmatter.format(cityTown[0]),
                    'cityTown',
                    JSON.stringify(cityTown[1]),
                    onMarkerClick
                );
            });
        }

        stateProvinceMarkers.current.forEach((m) => m.setMap(null));
        stateProvinceMarkers.current = [];
        if (stateProvincesVisible) {
            stateProvinceMarkers.current = stateProvinces.map((stateProvince) => {
                return new HTMLMarkerClass(
                    mapRef.current!,
                    { lat: stateProvince[1].latitude, lng: stateProvince[1].longitude },
                    numberCountFormmatter.format(stateProvince[0]),
                    'stateProvince',
                    JSON.stringify(stateProvince[1]),
                    onMarkerClick
                );
            });
        }

        countryMarkers.current.forEach((m) => m.setMap(null));
        countryMarkers.current = [];
        if (countriesVisible) {
            countryMarkers.current = countries.map((country) => {
                return new HTMLMarkerClass(
                    mapRef.current!,
                    { lat: country[1].latitude, lng: country[1].longitude },
                    numberCountFormmatter.format(country[0]),
                    'country',
                    JSON.stringify(country[1]),
                    onMarkerClick
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
        onMarkerClick,
    ]);

    return { onMapLoad, selectedNote, setSelectedNote, loadingSaveNote, setLoadingSaveNote, setLoadingCoordinates };
}
