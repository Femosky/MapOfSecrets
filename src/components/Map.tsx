import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
// import { nanoid } from 'nanoid';
import { makeHTMLMarkerClass } from '../model/HTMLMarker';

import {
    cityLevelStyles,
    countryLevelStyles,
    equalTo9Styles,
    globeLevelStyles,
    lessThan5Styles,
    neighborhoodLevelStyles,
    stateLevelStyles,
    streetLevelStyles,
} from '../model/mapOptionStyles';

// Define the shape of a note

interface AddressOSM {
    cityTown: string;
    stateProvince: string;
    country: string;
}

interface Coordinates {
    latitude: number;
    longitude: number;
}

type CityData = [number, Coordinates];

interface GeneralCoordinates {
    cityTown: Coordinates;
    stateProvince: Coordinates;
    country: Coordinates;
}

interface GeneralLocation {
    cityTown: string;
    statePovince: string;
    country: string;
}

interface Location {
    id: number;
    coordinates: Coordinates;
    generalCoordinates: GeneralCoordinates;
    cityTown: string;
    statePovince: string;
    country: string;
}

interface Note {
    id: number;
    timestamp: Date;
    location: Location;
    text: string;
}

const containerStyle = {
    width: '100%',
    height: '100%',
};

// Default (no override) when zoomed in

const mapOptions: google.maps.MapOptions = {
    // mapId: import.meta.env.VITE_GOOGLE_MAP_ID_CITY,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    mapTypeControl: false,
    streetViewControl: false,
    rotateControl: false,
    tilt: 0,
    restriction: {
        latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
        strictBounds: true,
    },
    draggableCursor: 'text',
    styles: cityLevelStyles,
};

// const stockCoordinates: Coordinates = {
//     latitude: 43.526646,
//     longitude: -79.891205,
// };
// const defaultCenter: google.maps.LatLngLiteral = { lat: 40.7128, lng: -74.006 };
const defaultCenter: google.maps.LatLngLiteral = { lat: 43.526646, lng: -79.891205 };

// const GOOGLE_LIBRARIES: ('marker' | 'geometry' | 'places')[] = ['marker'];

export default function Map() {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isWriting, setIsWriting] = useState<boolean>(false);
    const [isInWritingRange, setIsInWritingRange] = useState<boolean>(false);
    const [zoomLevel, setZoomLevel] = useState<number>(0);
    const [lastFocusedLocation, setLastFocusedLocation] = useState<GeneralLocation | null>(null);
    const [currentFocusedLocation, setCurrentFocusedLocation] = useState<GeneralLocation | null>(null);

    const [cityTowns, setCityTowns] = useState<CityData[]>([]);
    const [stateProvinces, setStateProvinces] = useState<CityData[]>([]);
    const [countries, setCountries] = useState<CityData[]>([]);

    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
    const [notesVisible, setNotesVisible] = useState<boolean>(false);
    const [cityTownsVisible, setCityTownsVisible] = useState<boolean>(false);
    const [stateProvincesVisible, setStateProvincesVisible] = useState<boolean>(false);
    const [countriesVisible, setCountriesVisible] = useState<boolean>(false);

    const [loadingSaveNote, setLoadingSaveNote] = useState<boolean>(false);
    const [loadingCoordinates, setLoadingCoordinates] = useState<Coordinates[]>([]);

    const [error, setError] = useState<string | null>(null);

    const [notes, setNotes] = useState<Note[]>(() => {
        try {
            const stored = localStorage.getItem('notes');
            return stored ? (JSON.parse(stored) as Note[]) : [];
        } catch {
            return [];
        }
    });
    const [locations, setLocations] = useState<Location[]>(() => {
        try {
            const stored = localStorage.getItem('locations');
            return stored ? (JSON.parse(stored) as Location[]) : [];
        } catch {
            return [];
        }
    });

    async function getCoordinatesFromLocation(query: string): Promise<Coordinates | null> {
        const url = `https://nominatim.openstreetmap.org/search.php?q=${query}&format=jsonv2`;

        try {
            const result = await fetch(url).then((res) => res.json());

            if (!result) {
                throw new Error(`No geocoding result for "${query}"`);
            }

            return {
                latitude: parseFloat(result[0].lat),
                longitude: parseFloat(result[0].lon),
            };
        } catch (err) {
            console.log(err);
            setError(String(err));
            return null;
        }
    }

    async function getGeneralCoordinates(addressOSM: AddressOSM): Promise<GeneralCoordinates | null> {
        try {
            const cityTown = `${addressOSM.cityTown}, ${addressOSM.stateProvince}, ${addressOSM.country}`;
            const stateProvince = `${addressOSM.stateProvince}, ${addressOSM.country}`;
            const country = addressOSM.country;

            const cityTownCoordinates: Coordinates | null = await getCoordinatesFromLocation(cityTown);
            const stateProvinceCoordinates: Coordinates | null = await getCoordinatesFromLocation(stateProvince);
            const countryCoordinates: Coordinates | null = await getCoordinatesFromLocation(country);

            if (!cityTownCoordinates || !stateProvinceCoordinates || !countryCoordinates) {
                throw new Error('Failed to get general coordinates');
            }

            const generalCoordinates: GeneralCoordinates = {
                cityTown: cityTownCoordinates,
                stateProvince: stateProvinceCoordinates,
                country: countryCoordinates,
            };

            return generalCoordinates;
        } catch (err) {
            console.error("Couldn't get general coordinates", err);
            setError(String(err));
            return null;
        }
    }

    async function getLocationData(lat: number, lng: number): Promise<Location | null> {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        try {
            const { address, error } = await fetch(url).then((res) => res.json());

            if (error) {
                setError(error);
                return null;
            }

            if (!address) return null;

            const parsedAddress: AddressOSM = {
                cityTown: address.city || address.town || address.county,
                stateProvince: address.state,
                country: address.country,
            };

            if (!parsedAddress) throw Error('Failed to parse address');

            const generalCoordinates: GeneralCoordinates | null = await getGeneralCoordinates(parsedAddress);

            if (!generalCoordinates) throw Error('Failed to get general location data.');

            const coordinates: Coordinates = { latitude: lat, longitude: lng };
            return {
                id: Date.now(),
                coordinates,
                generalCoordinates,
                cityTown: address.city || address.town || address.county,
                statePovince: address.state,
                country: address.country,
            };
        } catch (err) {
            console.error('', err);
            setError(String(err));
            return null;
        }
    }

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

    useEffect(() => {
        if (error) {
            alert(error);
            setError(null);
        }
    }, [error]);

    useEffect(() => {
        if (!map) return;

        const geocoder = new google.maps.Geocoder();

        const onIdle = () => {
            const center = map.getCenter();
            const zoomLevel = map.getZoom() ?? 0;
            if (!center) return;

            if (zoomLevel > 12) {
                geocoder.geocode({ location: center }, (results, status) => {
                    if (status !== 'OK' || !results || !results.length) return;

                    // results[0] is the most‐specific level (street address)
                    // later entries are higher‐order (locality, admin_area_level_1, country)
                    const components = results[0].address_components;

                    console.log('RSULTS', results);

                    const cityTown = components.find((component) => component.types.includes('locality'))?.long_name;
                    const statePovince = components.find((component) =>
                        component.types.includes('administrative_area_level_1')
                    )?.long_name;
                    const country = components.find((component) => component.types.includes('country'))?.long_name;
                    if (cityTown === undefined || statePovince === undefined || country === undefined) return;

                    const currentLocation: GeneralLocation = {
                        cityTown,
                        statePovince,
                        country,
                    };

                    setCurrentFocusedLocation(currentLocation);
                });
            }
        };

        // Idle fires once after panning or zooming finishes
        const listener = map.addListener('idle', onIdle);

        // run immediately once
        onIdle();

        return () => {
            google.maps.event.removeListener(listener);
        };
    }, [map]);

    // FETCH MESSAGES BASED ON CITY ON VIEWPORT
    useEffect(() => {
        console.log('LAST', lastFocusedLocation);
        console.log('CURRENT', currentFocusedLocation);

        if (JSON.stringify(currentFocusedLocation) === JSON.stringify(lastFocusedLocation)) {
            // TODO: FETCH FOR ONLY THAT CITY
            console.log(lastFocusedLocation?.cityTown, currentFocusedLocation?.cityTown);
        }

        setLastFocusedLocation(currentFocusedLocation);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFocusedLocation]);

    // Map Zoom
    useEffect(() => {
        if (!map) return;

        const updateStyles = () => {
            const zoomLevel = map.getZoom() ?? 0;
            setZoomLevel(zoomLevel);
            console.log('LEVEL', zoomLevel);

            let styles: google.maps.MapTypeStyle[];

            // Administrative Level Styles
            if (zoomLevel <= 3) {
                styles = globeLevelStyles;
                map.setOptions({ styles: styles });
            } else if (zoomLevel > 3 && zoomLevel <= 5) {
                styles = countryLevelStyles;
                map.setOptions({ styles: styles });
            } else if (zoomLevel > 5 && zoomLevel <= 9) {
                styles = stateLevelStyles;
                map.setOptions({ styles: styles });
            } else if (zoomLevel > 9 && zoomLevel <= 13) {
                styles = cityLevelStyles;
                map.setOptions({ styles: styles });
            } else if (zoomLevel > 13 && zoomLevel <= 16) {
                styles = neighborhoodLevelStyles;
                map.setOptions({ styles: styles });
            } else {
                styles = streetLevelStyles;
                map.setOptions({ styles: styles });
            }

            // Special Style Cases
            if (zoomLevel === 9) {
                styles = equalTo9Styles;
                map.setOptions({ styles });
            } else if (zoomLevel < 5) {
                styles = lessThan5Styles;
                map.setOptions({ styles, draggableCursor: 'default' });
            }

            // Determine Bubble Visibility States
            if (zoomLevel <= 3) {
                toggleCountriesOn();
            } else if (zoomLevel > 3 && zoomLevel <= 5) {
                toggleStateProvincesOn();
            } else if (zoomLevel > 5 && zoomLevel <= 12) {
                toggleCityTownsOn();
                map.setOptions({ draggableCursor: 'default' });
                setIsWriting(false);
                setIsInWritingRange(false);
            } else {
                toggleNotesOn();
                setIsInWritingRange(true);
            }
        };

        // run on zoom change
        const listener = map.addListener('zoom_changed', updateStyles);
        updateStyles(); // initial apply

        return () => {
            google.maps.event.removeListener(listener);
        };
    }, [map]);

    // Persist notes to localStorage
    useEffect(() => {
        localStorage.setItem('notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem('locations', JSON.stringify(locations));

        function accumulateData() {
            // let cityTowns: CityTown[] = [];
            // let stateProvinces: StateProvince[] = [];
            // let countries: Country[] = [];
            let cityTowns: Record<string, CityData> = {};
            let stateProvinces: Record<string, CityData> = {};
            let countries: Record<string, CityData> = {};

            for (let i = 0; i < locations.length; i++) {
                const location = locations[i];

                if (location.cityTown in cityTowns) {
                    cityTowns[location.cityTown][0] += 1;
                } else {
                    cityTowns[location.cityTown] = [1, location.generalCoordinates.cityTown];
                }

                if (location.statePovince in stateProvinces) {
                    stateProvinces[location.statePovince][0] += 1;
                } else {
                    stateProvinces[location.statePovince] = [1, location.generalCoordinates.stateProvince];
                }

                if (location.country in countries) {
                    countries[location.country][0] += 1;
                } else {
                    countries[location.country] = [1, location.generalCoordinates.country];
                }
            }

            console.log('IT IS 1', Object.values(cityTowns)[1]);
            console.log('IT IS 2', Object.values(stateProvinces));
            console.log('IT IS 3', Object.values(countries));

            setCityTowns(Object.values(cityTowns));
            setStateProvinces(Object.values(stateProvinces));
            setCountries(Object.values(countries));

            console.log('CITIES', cityTowns);
            // console.log('STATES', stateProvinces);
            // console.log('COUNTRIES', countries);
        }

        accumulateData();
    }, [locations]);

    // Center map on user's location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setCenter({ lat: coords.latitude, lng: coords.longitude });
            },
            () => {},
            { enableHighAccuracy: true }
        );
    }, []);

    function toggleIsWriting() {
        if (!map) return;

        if (isInWritingRange) {
            setIsWriting(!isWriting);
            map.setOptions({ draggableCursor: 'text' });
        } else {
            map.setOptions({ draggableCursor: 'default' });
        }
    }

    // Handle map clicks to add notes
    const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat == null || lng == null) return;
        const text = prompt('Enter your note:');
        if (!text) return;

        setLoadingSaveNote(true);
        setLoadingCoordinates([{ latitude: lat, longitude: lng }]);
        console.log({ latitude: lat, longitude: lng });

        try {
            const location: Location | null = await getLocationData(lat, lng);
            if (!location) return;
            console.log('LOCATION', location);

            setNotes((current) => [...current, { id: Date.now(), timestamp: new Date(), location, text }]);
            setLocations((current) => [...current, location]);
        } catch (err) {
            console.error('Reverse geocode failed:', err);
        } finally {
            setLoadingSaveNote(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Markers
    const mapRef = useRef<google.maps.Map | null>(null);
    const noteMarkers = useRef<google.maps.OverlayView[]>([]);
    const cityTownMarkers = useRef<google.maps.OverlayView[]>([]);
    const stateProvinceMarkers = useRef<google.maps.OverlayView[]>([]);
    const countryMarkers = useRef<google.maps.OverlayView[]>([]);
    const loadingMarker = useRef<google.maps.OverlayView[]>([]);

    // Initialize clustering
    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        mapRef.current = mapInstance;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef as any).HTMLMarker = makeHTMLMarkerClass();
        setMap(mapInstance);
        new MarkerClusterer({ map: mapInstance });
    }, []);

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

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
                onLoad={onMapLoad}
                onClick={isWriting && zoomLevel > 12 ? handleMapClick : undefined}
                options={mapOptions}
            >
                {/* User location marker */}
                <Marker position={center} />

                <div>
                    {isInWritingRange ? (
                        <button
                            onClick={toggleIsWriting}
                            className={`absolute top-0 right-0 p-5 hover:cursor-pointer ${
                                isWriting ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                        >
                            {isWriting ? 'Editing Secret' : 'Add Secret'}
                        </button>
                    ) : (
                        <button
                            onClick={toggleIsWriting}
                            className={'absolute top-0 right-0 p-5 hover:cursor-pointer bg-gray-500'}
                        >
                            Add Secret
                        </button>
                    )}
                </div>

                {selectedNote && (
                    <InfoWindow
                        position={{
                            lat: selectedNote.location.coordinates.latitude,
                            lng: selectedNote.location.coordinates.longitude,
                        }}
                        onCloseClick={() => setSelectedNote(null)}
                    >
                        <div>{selectedNote.text}</div>
                    </InfoWindow>
                )}

                {/* InfoWindow for selected note */}
                {selectedNote && (
                    <InfoWindow
                        position={{
                            lat: selectedNote.location.coordinates.latitude,
                            lng: selectedNote.location.coordinates.longitude,
                        }}
                        onCloseClick={() => setSelectedNote(null)}
                    >
                        <div className="p-2 text-sm">{selectedNote.text}</div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </LoadScript>
    );
}
