import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {
    cityLevelStyles,
    countryLevelStyles,
    globeLevelStyles,
    neighborhoodLevelStyles,
    stateLevelStyles,
    streetLevelStyles,
} from '../model/mapOptionStyles';

// Define the shape of a note
interface Note {
    id: number;
    lat: number;
    lng: number;
    text: string;
}

const containerStyle = {
    width: '100vw',
    height: '100vh',
    position: 'absolute' as const,
    top: 0,
    left: 0,
};

// Default (no override) when zoomed in

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    mapTypeControl: false,
    streetViewControl: false,
    rotateControl: false,
    tilt: 0,
    minZoom: 2,
    styles: cityLevelStyles,
};

const defaultCenter: google.maps.LatLngLiteral = { lat: 40.7128, lng: -74.006 };

export default function Map() {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [notes, setNotes] = useState<Note[]>(() => {
        try {
            const stored = localStorage.getItem('notes');
            return stored ? (JSON.parse(stored) as Note[]) : [];
        } catch {
            return [];
        }
    });
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);

    useEffect(() => {
        if (!map) return;

        const updateStyles = () => {
            const zoomLevel = map.getZoom() ?? 0;
            console.log(zoomLevel);

            let styles: google.maps.MapTypeStyle[];

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

            if (zoomLevel === 9) {
                map.setOptions({
                    styles: [
                        ...styles,
                        {
                            featureType: 'all',
                            elementType: 'labels.text',
                            stylers: [{ visibility: 'off' }],
                        },
                    ],
                });
            } else if (zoomLevel < 5) {
                map.setOptions({
                    styles: [
                        ...styles,
                        {
                            featureType: 'administrative',
                            elementType: 'geometry',
                            stylers: [{ visibility: 'off' }],
                        },
                    ],
                });
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

    // Handle map clicks to add notes
    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat == null || lng == null) return;
        const text = prompt('Enter your note:');
        if (text) {
            setNotes((current) => [...current, { id: Date.now(), lat, lng, text }]);
        }
    }, []);

    // Initialize clustering
    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
        new MarkerClusterer({ map: mapInstance });
    }, []);

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
                onLoad={onMapLoad}
                onClick={handleMapClick}
                options={mapOptions}
            >
                {/* User location marker */}
                <Marker position={center} />

                {/* Note markers */}
                {map &&
                    notes.map((note) => (
                        <Marker
                            key={note.id}
                            position={{ lat: note.lat, lng: note.lng }}
                            onClick={() => setSelectedNote(note)}
                        />
                    ))}

                {/* InfoWindow for selected note */}
                {selectedNote && (
                    <InfoWindow
                        position={{ lat: selectedNote.lat, lng: selectedNote.lng }}
                        onCloseClick={() => setSelectedNote(null)}
                    >
                        <div className="p-2 text-sm">{selectedNote.text}</div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </LoadScript>
    );
}
