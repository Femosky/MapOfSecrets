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

interface Coordinates {
    latitude: number;
    longitude: number;
}

type CityData = [number, Coordinates];

interface RawLocationCountData {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    count: number;
}

interface GeneralCoordinates {
    cityTown: Coordinates;
    stateProvince: Coordinates;
    country: Coordinates;
}

interface PlaceInfo {
    placeId: string;
    name: string;
}

interface GeneralLocation {
    cityTown: PlaceInfo;
    stateProvince: PlaceInfo;
    country: PlaceInfo;
}

interface Location {
    id: number;
    coordinates: Coordinates;
    generalCoordinates: GeneralCoordinates;
    generalLocation: GeneralLocation;
    cityTown: string;
    stateProvince: string;
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

function trimAndToLowerCase(value: string): string {
    return value.trim().toLowerCase();
}

function formatCoordinateTo6DecimalPlaces(n: number): number {
    return Math.trunc(n * 1e6) / 1e6;
}

// const stockCoordinates: Coordinates = {
//     latitude: 43.526646,
//     longitude: -79.891205,
// };
// const defaultCenter: google.maps.LatLngLiteral = { lat: 40.7128, lng: -74.006 };
const defaultCenter: google.maps.LatLngLiteral = { lat: 43.526646, lng: -79.891205 };

// const GOOGLE_LIBRARIES: ('marker' | 'geometry' | 'places')[] = ['marker'];

const API_URL = 'http://ec2-18-119-114-112.us-east-2.compute.amazonaws.com:3001';
// const API_URL = 'http://localhost:3001';

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

    const [seenNoteIds, setSeenNoteIds] = useState<Set<number>>(new Set());
    const [seenCities, setSeenCities] = useState<Set<string>>(new Set());

    const [loadingSaveNote, setLoadingSaveNote] = useState<boolean>(false);
    const [loadingCoordinates, setLoadingCoordinates] = useState<Coordinates[]>([]);

    const [isFetchingNotes, setIsFetchingNotes] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [notes, setNotes] = useState<Note[]>([]);

    async function getCoordinatesFromLocation(query: string): Promise<Coordinates | null> {
        const url = `https://nominatim.openstreetmap.org/search.php?q=${query}&format=jsonv2`;

        try {
            const result = await fetch(url).then((res) => res.json());

            if (!result) {
                throw new Error(`No geocoding result for "${query}"`);
            }
            console.log('cannot', result);
            const coordinates: Coordinates = {
                latitude: parseFloat(result[0].lat),
                longitude: parseFloat(result[0].lon),
            };

            console.log(coordinates);

            return coordinates;
        } catch (err) {
            console.log(err);
            setError(String(err));
            return null;
        }
    }

    async function getGeneralCoordinates(generalLocation: GeneralLocation): Promise<GeneralCoordinates | null> {
        try {
            const cityTown = `${generalLocation.cityTown.name}, ${generalLocation.stateProvince.name}, ${generalLocation.country.name}`;
            const stateProvince = `${generalLocation.stateProvince.name}, ${generalLocation.country.name}`;
            const country = generalLocation.country.name;

            const cityTownCoordinates: Coordinates | null = await getCoordinatesFromLocation(cityTown);
            const stateProvinceCoordinates: Coordinates | null = await getCoordinatesFromLocation(stateProvince);
            const countryCoordinates: Coordinates | null = await getCoordinatesFromLocation(country);

            console.log('THE THREE', cityTown);
            if (!cityTownCoordinates || !stateProvinceCoordinates || !countryCoordinates) {
                throw new Error('Failed to get general coordinates');
            }
            const generalCoordinates: GeneralCoordinates = {
                cityTown: cityTownCoordinates,
                stateProvince: stateProvinceCoordinates,
                country: countryCoordinates,
            };
            console.log('general locay', generalCoordinates);
            return generalCoordinates;
        } catch (err) {
            console.error("Couldn't get general coordinates", err);
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

    // FETCH MESSAGES BASED ON CITY ON VIEWPORT
    useEffect(() => {
        console.log('LAST', lastFocusedLocation);
        console.log('CURRENT', currentFocusedLocation);

        async function fetchNotesByCity() {
            if (isFetchingNotes || !currentFocusedLocation) return;

            setIsFetchingNotes(true);
            console.log('the location', JSON.stringify(currentFocusedLocation));
            try {
                const url = `${API_URL}/notes/city`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentFocusedLocation),
                });
                const { notes, error } = await response.json();

                if (error) {
                    console.log(error);
                    setSeenCities((prev) =>
                        new Set(prev).add(
                            `${currentFocusedLocation.cityTown}, ${currentFocusedLocation.stateProvince}, ${currentFocusedLocation.country}`
                        )
                    );
                    return;
                }
                if (!notes) {
                    // throw Error('No response data.');
                    setSeenCities((prev) =>
                        new Set(prev).add(
                            `${currentFocusedLocation.cityTown}, ${currentFocusedLocation.stateProvince}, ${currentFocusedLocation.country}`
                        )
                    );
                    console.log('No response data.');
                    return;
                }

                // eslint-disable-next-line prefer-const
                let preparedNotes: Note[] = [];

                for (let i = 0; i < notes.length; i++) {
                    const note = notes[i];
                    const parsedNote: Note = note as Note;
                    if (seenNoteIds.has(parsedNote.id)) continue;

                    setSeenNoteIds((prev) => new Set(prev).add(i));
                    preparedNotes.push(parsedNote);
                }

                setSeenCities((prev) =>
                    new Set(prev).add(
                        `${currentFocusedLocation.cityTown}, ${currentFocusedLocation.stateProvince}, ${currentFocusedLocation.country}`
                    )
                );
                setNotes((prev) => [...prev, ...preparedNotes]);
                console.log('RECEIVED NOTES', preparedNotes);
            } catch (e) {
                console.log(e);
                // setError(String(e));
            } finally {
                setIsFetchingNotes(false);
            }
        }

        if (!currentFocusedLocation) return;
        const city = `${currentFocusedLocation.cityTown}, ${currentFocusedLocation.stateProvince}, ${currentFocusedLocation.country}`;
        if (seenCities.has(city)) return;

        if (JSON.stringify(currentFocusedLocation) === JSON.stringify(lastFocusedLocation)) {
            // TODO: FETCH FOR ONLY THAT CITY
            console.log(lastFocusedLocation?.cityTown, currentFocusedLocation?.cityTown);
            fetchNotesByCity();
        } else {
            fetchNotesByCity();
        }

        setLastFocusedLocation(currentFocusedLocation);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFocusedLocation]);

    useEffect(() => {
        async function fetchCityTownNumbers() {
            try {
                const url = `${API_URL}/locations/cities`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const jsonListOfCities = await response.json();
                console.log('notes areeeee', jsonListOfCities);

                const cities: CityData[] = Object.values(jsonListOfCities).map((city) => {
                    const typedCity = city as RawLocationCountData;

                    const coords: Coordinates = {
                        latitude: typedCity.latitude,
                        longitude: typedCity.longitude,
                    };
                    const locationCountData: CityData = [typedCity.count, coords];
                    return locationCountData;
                });

                setCityTowns(cities);
            } catch (e) {
                console.log(e);
                setError(String(e));
            }
        }
        async function fetchStateProvinceNumbers() {
            try {
                const url = `${API_URL}/locations/states`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const jsonListOfStates = await response.json();

                const states: CityData[] = Object.values(jsonListOfStates).map((state) => {
                    const typedState = state as RawLocationCountData;

                    const coords: Coordinates = {
                        latitude: typedState.latitude,
                        longitude: typedState.longitude,
                    };
                    const locationCountData: CityData = [typedState.count, coords];
                    return locationCountData;
                });

                setStateProvinces(states);
            } catch (e) {
                console.log(e);
                setError(String(e));
            }
        }
        async function fetchCountryNumbers() {
            try {
                const url = `${API_URL}/locations/countries`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const jsonListOfCountries = await response.json();

                const countries: CityData[] = Object.values(jsonListOfCountries).map((country) => {
                    const typedCountry = country as RawLocationCountData;

                    const coords: Coordinates = {
                        latitude: typedCountry.latitude,
                        longitude: typedCountry.longitude,
                    };
                    const locationCountData: CityData = [typedCountry.count, coords];
                    return locationCountData;
                });

                setCountries(countries);
            } catch (e) {
                console.log(e);
                setError(String(e));
            }
        }

        fetchCityTownNumbers();
        fetchStateProvinceNumbers();
        fetchCountryNumbers();
    }, []);

    function findResultByType(type: string, results: google.maps.GeocoderResult[]) {
        return results.find((result) => result.types.includes(type));
    }

    async function getGeneralLocation(coordinates: google.maps.LatLngLiteral | null): Promise<GeneralLocation | null> {
        const geocoder = new google.maps.Geocoder();

        const coords = coordinates ? coordinates : map?.getCenter();
        if (!coords) {
            console.log('stippepp');
            return null;
        }

        console.log('sfoiwsnoin');

        return new Promise((resolve) => {
            geocoder.geocode({ location: coords }, (results, status) => {
                if (status !== 'OK' || !results || !results?.length) {
                    resolve(null);
                    return;
                }

                console.log('RESULTS', results);

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

                    console.log('LRTRFJKNS', currentLocation);
                    resolve(currentLocation);
                } else {
                    resolve(null);
                }
            });
        });
    }

    async function getLocation(lat: number, lng: number) {
        try {
            const generalLocation: GeneralLocation | null = await getGeneralLocation({ lat, lng });

            if (!generalLocation) throw Error('Failed to get location names.');

            const generalCoordinates: GeneralCoordinates | null = await getGeneralCoordinates(generalLocation);

            if (!generalCoordinates) throw Error('Failed to get general location coordinates.');

            return {
                id: Date.now(),
                coordinates: { latitude: lat, longitude: lng },
                generalCoordinates,
                generalLocation,
                cityTown: generalLocation.cityTown.name,
                stateProvince: generalLocation.stateProvince.name,
                country: generalLocation.country.name,
            };
        } catch (err) {
            console.error('', err);
            setError(String(err));
            return null;
        }
    }

    // Determine coordinates of city on the viewport
    useEffect(() => {
        if (!map) return;

        const onIdle = async () => {
            const center = map.getCenter();
            const zoomLevel = map.getZoom() ?? 0;
            if (!center) return;

            if (zoomLevel > 9) {
                const currentLocation: GeneralLocation | null = await getGeneralLocation(null);
                console.log('Viewport Location', currentLocation);
                if (currentLocation) {
                    setCurrentFocusedLocation(currentLocation);
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
            } else if (zoomLevel > 5 && zoomLevel <= 9) {
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
    }, [map]);

    // Persist notes to localStorage
    useEffect(() => {
        // localStorage.setItem('notes', JSON.stringify(notes));
        console.log('YEPPIE');
    }, [notes]);

    // Center map on user's location
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

    function toggleIsWriting() {
        if (!map) return;

        if (isInWritingRange) {
            setIsWriting(!isWriting);
            map.setOptions({ draggableCursor: 'text' });
        } else {
            map.setOptions({ draggableCursor: 'default' });
        }
    }

    async function createNotInDatabase(text: string, location: Location): Promise<[boolean, string]> {
        try {
            const url = `${API_URL}/notes`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, location }),
            });
            const { message, noteId, error } = await response.json();

            if (error) {
                console.log(error);
                setError(String(error));
                return [false, ''];
            }

            console.log(message);

            return [true, noteId];
        } catch (e) {
            console.log(e);
            setError(String(e));
            return [false, ''];
        }
    }

    // Handle map clicks to add notes
    const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
        let lat = e.latLng?.lat();
        let lng = e.latLng?.lng();
        if (lat == null || lng == null) {
            return;
        } else {
            lat = formatCoordinateTo6DecimalPlaces(lat);
            lng = formatCoordinateTo6DecimalPlaces(lng);
        }

        const text = prompt('Enter your note:');
        if (!text) return;

        setLoadingSaveNote(true);
        setLoadingCoordinates([{ latitude: lat, longitude: lng }]);
        console.log({ latitude: lat, longitude: lng });

        try {
            const location: Location | null = await getLocation(lat, lng);
            if (!location) return;

            // console.log(text, JSON.stringify(location));
            // return;

            const response = await createNotInDatabase(text, location);

            if (response[0]) {
                setNotes((current) => [...current, { id: Number(response[1]), timestamp: new Date(), location, text }]);

                // Fetch Location Counts
            }
        } catch (err) {
            console.error('Reverse geocode failed:', err);
        } finally {
            setLoadingSaveNote(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // MARKERS
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
                onClick={isWriting && isInWritingRange ? handleMapClick : undefined}
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
