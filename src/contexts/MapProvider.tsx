import { createContext, useEffect, useState } from 'react';
import type { ChildrenProps, GeneralLocation } from '../models/mapInterfaces';
import { useNoteFetch } from '../hooks/useNoteFetch';
import { formatCoordinateTo6DecimalPlaces } from '../utils/globalUtils';
import {
    cityLevelStyles,
    countryLevelStyles,
    globeLevelStyles,
    neighborhoodLevelStyles,
    stateLevelStyles,
    streetLevelStyles,
} from '../models/mapOptionStyles';
import { mapOptions } from '../models/mapOptions';

const MapContext = createContext<
    | {
          map: google.maps.Map | null;
          setMap: React.Dispatch<React.SetStateAction<google.maps.Map | null>>;
          dynamicMapOptions: google.maps.MapOptions;
          center: google.maps.LatLngLiteral;
          zoomLevel: number;
          notesVisible: boolean;
          cityTownsVisible: boolean;
          stateProvincesVisible: boolean;
          countriesVisible: boolean;
          toggleIsWriting: () => void;
          isWriting: boolean;
          isInWritingRange: boolean;
          getGeneralLocation: (coordinates: google.maps.LatLngLiteral | null) => Promise<GeneralLocation | null>;
      }
    | undefined
>(undefined);

// const defaultCenter: google.maps.LatLngLiteral = { lat: 40.7128, lng: -74.006 };
const defaultCenter: google.maps.LatLngLiteral = { lat: 43.526646, lng: -79.891205 };

export function MapProvider({ children }: ChildrenProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
    const [zoomLevel, setZoomLevel] = useState<number>(0);
    const [dynamicMapOptions, setDynamicMapOptions] = useState<google.maps.MapOptions>(mapOptions);

    const [isWriting, setIsWriting] = useState<boolean>(false);
    const [isInWritingRange, setIsInWritingRange] = useState<boolean>(false);

    const [notesVisible, setNotesVisible] = useState<boolean>(false);
    const [cityTownsVisible, setCityTownsVisible] = useState<boolean>(false);
    const [stateProvincesVisible, setStateProvincesVisible] = useState<boolean>(false);
    const [countriesVisible, setCountriesVisible] = useState<boolean>(false);

    const { setCurrentFocusedLocation } = useNoteFetch();

    function toggleIsWriting() {
        setIsWriting(!isWriting);
    }
    useEffect(() => {
        if (!map) return;
        if (isWriting) {
            map.setOptions({ draggableCursor: 'text' });
        } else {
            map.setOptions({ draggableCursor: 'default' });
        }
    }, [isWriting, map]);
    function toggleNotesOn() {
        setNotesVisible(true);
        setCityTownsVisible(false);
        setStateProvincesVisible(false);
        setCountriesVisible(false);
    }
    function toggleCityTownsOn() {
        setNotesVisible(false);
        setCityTownsVisible(true);
        setStateProvincesVisible(false);
        setCountriesVisible(false);
    }
    function toggleStateProvincesOn() {
        setNotesVisible(false);
        setCityTownsVisible(false);
        setStateProvincesVisible(true);
        setCountriesVisible(false);
    }
    function toggleCountriesOn() {
        setNotesVisible(false);
        setCityTownsVisible(false);
        setStateProvincesVisible(false);
        setCountriesVisible(true);
    }

    // Get user's position
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setCenter({
                    lat: formatCoordinateTo6DecimalPlaces(coords.latitude),
                    lng: formatCoordinateTo6DecimalPlaces(coords.longitude),
                });
            },
            () => {},
            { enableHighAccuracy: true }
        );
    }, []);

    // Determine coordinates of city on the viewport
    useEffect(() => {
        if (!map) return;

        const onIdle = async () => {
            const center = map.getCenter();
            const zoomLevel = map.getZoom() ?? 0;
            if (!center) return;

            if (zoomLevel > 9) {
                const currentLocation: GeneralLocation | null = await getGeneralLocation(null);

                if (currentLocation) {
                    // Used to fetch notes based on state visible
                    setCurrentFocusedLocation(currentLocation.stateProvince.placeId);
                }
            }
        };

        // Idle fires once after panning or zooming finishes
        const listener = map.addListener('idle', onIdle);

        // run immediately once
        onIdle();

        return () => {
            google.maps.event.removeListener(listener);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    // Map Zoom
    useEffect(() => {
        if (!map) return;

        const updateStyles = () => {
            const zoomLevel = map.getZoom() ?? 0;
            setZoomLevel(zoomLevel);
            console.log('LEVEL', zoomLevel);

            // Adjust styles based on zoom level
            const dynamicOptions: google.maps.MapOptions = {
                ...dynamicMapOptions,
                styles:
                    zoomLevel <= 3
                        ? globeLevelStyles
                        : zoomLevel <= 4
                        ? countryLevelStyles
                        : zoomLevel <= 6
                        ? stateLevelStyles
                        : zoomLevel <= 10
                        ? cityLevelStyles
                        : zoomLevel <= 12
                        ? neighborhoodLevelStyles
                        : streetLevelStyles,
            };

            setDynamicMapOptions(dynamicOptions);

            // Determine Bubble Visibility States
            if (zoomLevel <= 3) {
                toggleCountriesOn();
            } else if (zoomLevel > 3 && zoomLevel <= 4) {
                toggleStateProvincesOn();
            } else if (zoomLevel > 4 && zoomLevel <= 9) {
                toggleCityTownsOn();
            } else {
                toggleNotesOn();
            }

            // Determine writing range
            if (zoomLevel <= 13) {
                setIsWriting(false);
                setIsInWritingRange(false);
                map.setOptions({ draggableCursor: 'default' });
            } else {
                setIsInWritingRange(true);
            }
        };

        // run on zoom change
        const listener = map.addListener('zoom_changed', updateStyles);
        updateStyles(); // initial apply

        return () => {
            google.maps.event.removeListener(listener);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    function findResultByType(type: string, results: google.maps.GeocoderResult[]) {
        return results.find((result) => result.types.includes(type));
    }

    async function getGeneralLocation(coordinates: google.maps.LatLngLiteral | null): Promise<GeneralLocation | null> {
        const geocoder = new google.maps.Geocoder();

        const coords = coordinates ? coordinates : map?.getCenter();
        if (!coords) {
            return null;
        }

        return new Promise((resolve) => {
            geocoder.geocode({ location: coords }, (results, status) => {
                if (status !== 'OK' || !results || !results?.length) {
                    resolve(null);
                    return;
                }

                const cityResult =
                    findResultByType('locality', results) ||
                    findResultByType('administrative_area_level_2', results) ||
                    findResultByType('administrative_area_level_3', results);
                const stateResult = findResultByType('administrative_area_level_1', results);
                const countryResult = findResultByType('country', results);

                if (cityResult && stateResult && countryResult) {
                    const currentLocation: GeneralLocation = {
                        cityTown: {
                            placeId: cityResult.place_id,
                            name: cityResult.formatted_address.split(',')[0].trim(),
                        },
                        stateProvince: {
                            placeId: stateResult.place_id,
                            name: stateResult.formatted_address.split(',')[0].trim(),
                        },
                        country: {
                            placeId: countryResult.place_id,
                            name: countryResult.formatted_address.split(',')[0].trim(),
                        },
                    };

                    resolve(currentLocation);
                } else {
                    resolve(null);
                }
            });
        });
    }

    return (
        <MapContext.Provider
            value={{
                map,
                setMap,
                dynamicMapOptions,
                center,
                zoomLevel,
                notesVisible,
                cityTownsVisible,
                stateProvincesVisible,
                countriesVisible,
                toggleIsWriting,
                isWriting,
                isInWritingRange,
                getGeneralLocation,
            }}
        >
            {children}
        </MapContext.Provider>
    );
}

export { MapContext };
