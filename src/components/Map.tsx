import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

import { containerStyle } from '../models/mapOptionStyles';
import type { Location, Note } from '../models/mapInterfaces';
import { formatCoordinateTo6DecimalPlaces } from '../utils/globalUtils';
import { useNotes } from '../hooks/useNotes';
import { useGeneralLocation } from '../hooks/useGenerateLocation';
import { useMap } from '../hooks/useMap';
import { useMapMarkers } from '../hooks/useMapMarkers';
import { useLocationNumbers } from '../hooks/useLocationNumbers';
import { motion, AnimatePresence } from 'framer-motion';

// const GOOGLE_LIBRARIES: ('marker' | 'geometry' | 'places')[] = ['marker'];

export default function Map() {
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    const [error, setError] = useState<string | null>(null);

    const { zoomLevel, dynamicMapOptions, notesVisible, center, isWriting, isInWritingRange, toggleIsWriting } =
        useMap();
    const { fetchLocationNumbers } = useLocationNumbers();

    const { setNotes, createNoteInDatabase } = useNotes();
    const { getLocation } = useGeneralLocation();
    const { onMapLoad, setLoadingSaveNote, setLoadingCoordinates } = useMapMarkers();

    const containerRef = useRef<HTMLDivElement>(null);
    const [modal, setModal] = useState({ x: 0, y: 0, open: false });

    // Animation variants
    const buttonVariants = {
        hidden: { y: 50, scale: 0.8, opacity: 0 },
        visible: { y: 0, scale: 1, opacity: 1 },
    };

    useEffect(() => {
        if (error) {
            alert(error);
            setError(null);
        }
    }, [error]);

    // Handle map clicks to add notes
    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        const dom = e.domEvent as MouseEvent;
        if (!containerRef.current) return;

        // translate viewport coords into the wrapper’s coordinate space
        const { left, top } = containerRef.current.getBoundingClientRect();
        setModal({
            x: dom.clientX - left + 10,
            y: dom.clientY - top + 10,
            open: true,
        });
        console.log('modal', dom.clientX, dom.clientY);
    }, []);
    // const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    //     let lat = e.latLng?.lat();
    //     let lng = e.latLng?.lng();
    //     if (lat == null || lng == null) {
    //         return;
    //     } else {
    //         lat = formatCoordinateTo6DecimalPlaces(lat);
    //         lng = formatCoordinateTo6DecimalPlaces(lng);
    //     }

    //     if (!containerRef.current) return;
    //     const dom = e.domEvent as MouseEvent;
    //     const { left, top } = containerRef.current.getBoundingClientRect();
    //     setModal({
    //         x: dom.clientX - left + 10, // +10px so it doesn’t sit *under* your cursor
    //         y: dom.clientY - top + 10,
    //         open: true,
    //     });
    //     return;
    //     const text = prompt('Enter your note:');
    //     if (!text) return;

    //     setLoadingSaveNote(true);
    //     setLoadingCoordinates([{ latitude: lat, longitude: lng }]);

    //     try {
    //         const location: Location | null = await getLocation(lat, lng);
    //         if (!location) return;

    //         const response = await createNoteInDatabase(text, location);

    //         if (response[0]) {
    //             setNotes((current) => [...current, { id: Number(response[1]), timestamp: new Date(), location, text }]);

    //             // Fetch Location Counts
    //             await fetchLocationNumbers();
    //         }
    //     } catch (err) {
    //         console.error('Reverse geocode failed:', err);
    //     } finally {
    //         setLoadingSaveNote(false);
    //     }

    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    const close = (e: React.MouseEvent) => {
        // prevent this click from re-opening it
        e.stopPropagation();
        setModal((m) => ({ ...m, open: false }));
    };

    // MARKERS

    return (
        <div ref={containerRef} className="relative w-full h-full border">
            <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={12}
                    onLoad={onMapLoad}
                    onClick={isWriting && isInWritingRange ? handleMapClick : undefined}
                    options={dynamicMapOptions}
                >
                    {/* User location marker */}
                    <Marker position={center} />

                    <AnimatePresence>
                        {modal.open && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                style={{
                                    position: 'absolute',
                                    top: modal.y,
                                    left: modal.x,
                                }}
                                className="z-50 bg-white p-4 rounded-lg shadow-lg max-w-xs"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="font-semibold mb-2">Hello from Cursor!</h3>
                                <p className="text-sm mb-4">This popped up right where you clicked.</p>
                                <button onClick={close} className="text-blue-600 hover:underline text-sm">
                                    Close
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {notesVisible && zoomLevel >= 8 && (
                            <motion.button
                                key="add-secret-btn"
                                onClick={isInWritingRange ? toggleIsWriting : undefined}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={buttonVariants}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20,
                                    mass: 1,
                                }}
                                className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 px-5 py-2 rounded-full shadow-lg shadow-black/30 text-white text-xl font-thin transition-colors duration-200 ${
                                    !isInWritingRange
                                        ? 'bg-gray-400/60'
                                        : isWriting
                                        ? 'bg-red-500/90 hover:shadow-2xl cursor-pointer'
                                        : 'bg-blue-500/90 hover:shadow-2xl cursor-pointer'
                                }`}
                            >
                                {isWriting ? 'exit' : 'add a secret'}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {zoomLevel <= 3 && (
                            <motion.div
                                key="zoom-hint"
                                layout
                                initial={{ y: -20, opacity: 0, scale: 0.9 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: -20, opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 0.7 }}
                                className="absolute top-6 left-1/2 w-11/12 max-w-sm transform -translate-x-1/2 px-2 py-1 rounded-full bg-white/50 backdrop-blur-sm shadow-[0_0px_10px_rgba(0,0,0,0.2)] text-gray-800 text-center text-sm font-light leading-tight"
                            >
                                Scroll or use the zoom controls in the bottom-right to zoom in and out.
                            </motion.div>
                        )}
                    </AnimatePresence>

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
        </div>
    );
}
