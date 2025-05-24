import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

import { containerStyle } from '../models/mapOptionStyles';
import type { Coordinates, Location, Note } from '../models/mapInterfaces';
import { formatCoordinateTo6DecimalPlaces, formatToFullDateTime, titleCase } from '../utils/globalUtils';
import { useNotes } from '../hooks/useNotes';
import { useGeneralLocation } from '../hooks/useGenerateLocation';
import { useMap } from '../hooks/useMap';
import { useMapMarkers } from '../hooks/useMapMarkers';
import { useLocationNumbers } from '../hooks/useLocationNumbers';
import { motion, AnimatePresence } from 'framer-motion';
import { maxCharCount, minCharCount } from '../constants/noteConstant';
import { LoadingSpinner } from './LoadingSpinner';
import { X } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

// const GOOGLE_LIBRARIES: ('marker' | 'geometry' | 'places')[] = ['marker'];

export default function Map() {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    });

    const [note, setNote] = useState<string>('');
    const [lastClickedCoordinates, setLastClickedCoordinates] = useState<Coordinates | null>(null);
    const [isNoteEligible, setIsNoteEligible] = useState<boolean>(false);

    const [error, setError] = useState<string | null>(null);

    const {
        zoomLevel,
        dynamicMapOptions,
        notesVisible,
        center,
        isWriting,
        setIsWriting,
        isInWritingRange,
        toggleIsWriting,
    } = useMap();
    const { fetchLocationNumbers } = useLocationNumbers();

    const { setNotes, createNoteInDatabase } = useNotes();
    const { getLocation } = useGeneralLocation();
    const { onMapLoad, selectedNote, setSelectedNote, loadingSaveNote, setLoadingSaveNote, setLoadingCoordinates } =
        useMapMarkers();

    const containerRef = useRef<HTMLDivElement>(null);

    const [modal, setModal] = useState<boolean>(false);
    const [isLocationDetails, setIsLocationDetails] = useState<boolean>(false);
    const [isMinChar, setIsMinChar] = useState<boolean>(false);
    const [isMaxChar, setIsMaxChar] = useState<boolean>(false);

    // Animation variants
    const buttonVariants = {
        hidden: { y: 50, scale: 0.8, opacity: 0 },
        visible: { y: 0, scale: 1, opacity: 1 },
    };

    useEffect(() => {
        function calculateCharLimit() {
            if (note.trim().length > maxCharCount) {
                setIsMaxChar(true);
            } else {
                setIsMaxChar(false);
            }

            if (note.trim().length < minCharCount) {
                setIsMinChar(false);
            } else {
                setIsMinChar(true);
            }
        }

        calculateCharLimit();
    }, [note]);

    useEffect(() => {
        if (!isMinChar || !lastClickedCoordinates) {
            setIsNoteEligible(false);
        } else {
            setIsNoteEligible(true);
        }
    }, [isMinChar, lastClickedCoordinates]);

    async function handleNoteSubmit() {
        if (!isNoteEligible) return;

        await saveNote(lastClickedCoordinates!);
    }

    useEffect(() => {
        if (error) {
            alert(error);
            setError(null);
        }
    }, [error]);

    useEffect(() => {
        if (!isInWritingRange || !isWriting) {
            setModal(false);
        }
    }, [isInWritingRange, isWriting]);

    async function saveNote(coordinates: Coordinates) {
        const lat = coordinates.latitude;
        const lng = coordinates.longitude;

        setLoadingSaveNote(true);
        setLoadingCoordinates([{ latitude: lat, longitude: lng }]);

        try {
            const location: Location | null = await getLocation(lat, lng);
            if (!location) return;

            const response = await createNoteInDatabase(note.trim(), location);

            const newNote: Note = {
                id: Number(response[1]),
                timestamp: new Date(),
                location: location,
                text: note,
            };

            // If note created successfully in database
            if (response[0]) {
                setNotes((current) => [...current, newNote]);

                // Close the modal and turn off editing mode
                setModal(false);
                setIsWriting(false);
                setNote('');
                // Fetch Location Counts
                await fetchLocationNumbers();
            }
        } catch (err) {
            console.error('Reverse geocode failed:', err);
        } finally {
            setLoadingSaveNote(false);
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

        setLastClickedCoordinates({ latitude: lat, longitude: lng });
        setModal(true);
    }, []);

    const close = (e: React.MouseEvent) => {
        // prevent this click from re-opening it
        e.stopPropagation();
        setModal(false);
    };

    function closeNoteModal() {
        setSelectedNote(null);
        setIsLocationDetails(false);
    }

    // MARKERS

    if (loadError) {
        return <div>Error loading maps</div>;
    }
    if (!isLoaded) {
        return <LoadingScreen />;
    }

    return (
        <div ref={containerRef} className="relative w-full h-full">
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
                    {selectedNote && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/40 z-40"
                                onClick={closeNoteModal}
                            />

                            {/* Modal */}
                            <motion.div
                                key="modal"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="fixed z-50 top-1/2 left-1/2 w-[20rem] sm:w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between px-6 py-4 border-b ">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-lg font-medium text-gray-800">Anonymous Secret</h3>
                                        <p className="text-black/70 text-xs font-light italic">
                                            {formatToFullDateTime(selectedNote.timestamp)}
                                        </p>
                                        {isLocationDetails ? (
                                            <div className="flex">
                                                <div className="flex flex-col">
                                                    <p className="text-black/70 text-[9px] font-light italic">
                                                        {titleCase(
                                                            `${selectedNote.location.cityTown}, ${selectedNote.location.stateProvince}, ${selectedNote.location.country}`
                                                        )}
                                                    </p>
                                                    <p className="text-black/70 text-[9px] font-light italic">
                                                        {`Lat: ${selectedNote.location.coordinates.latitude}. Long: ${selectedNote.location.coordinates.longitude}`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setIsLocationDetails(false)}
                                                    className="p-2 rounded-full text-[9px] text-blue-500/70 italic cursor-pointer"
                                                >
                                                    Hide
                                                </button>
                                            </div>
                                        ) : (
                                            <p
                                                onClick={() => setIsLocationDetails(true)}
                                                className="text-blue-500/70 text-[9px] font-light italic cursor-pointer"
                                            >
                                                View location details
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={closeNoteModal}
                                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <X className="size-7" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-4 max-h-[30rem] overflow-y-auto text-gray-700 leading-relaxed">
                                    {selectedNote.text}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {modal && isInWritingRange && isWriting && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/50 z-40"
                                onClick={close}
                            />

                            {/* Modal */}
                            <motion.div
                                key="modal"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="fixed flex flex-col z-50 w-[20rem] sm:w-[40rem] bg-white px-4 py-2 rounded-lg shadow-lg top-10 left-1/2 transform -translate-x-1/2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-full flex flex-col items-center py-4 gap-1.5">
                                    <h3 className="font-light text-xl sm:text-2xl">
                                        What do you want to get off your chest?
                                    </h3>
                                    <h4 className="text-[9px] sm:text-xs italic text-red-400/70">
                                        your secret will be engraved on this map forever and cannot be removed
                                    </h4>
                                </div>

                                <div className="h-5">
                                    {isMaxChar && <p className="text-red-400/70 text-xs">Character limit reached.</p>}
                                    {!isMinChar && <p className="text-red-400/70 text-xs">Secret too short.</p>}
                                </div>

                                <textarea
                                    autoFocus
                                    className="w-full min-h-56 max-h-96 p-2 font-light text-sm border border-gray-300 focus:outline-none focus:border-gray-400 rounded-lg mb-4"
                                    onChange={(e) => setNote(e.target.value)}
                                    value={note}
                                />

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={close}
                                        className="px-3 py-1 sm:px-5 sm:py-2 rounded-full text-white bg-red-500/90  hover:bg-red-500/70 active:bg-red-600 text-base sm:text-xl font-thin transition-colors duration-200 cursor-pointer"
                                    >
                                        cancel
                                    </button>
                                    <button
                                        onClick={handleNoteSubmit}
                                        className={`flex items-center gap-1 px-3 py-1 sm:px-5 sm:py-2 rounded-full text-white text-base sm:text-xl font-thin transition-colors duration-200 ${
                                            isNoteEligible
                                                ? 'bg-blue-500/90 hover:bg-blue-500/70 active:bg-blue-600/70 cursor-pointer'
                                                : 'bg-gray-400 cursor-default'
                                        }`}
                                    >
                                        {loadingSaveNote && (
                                            <div role="status">
                                                <LoadingSpinner className="w-3 sm:w-5 fill-white" />
                                            </div>
                                        )}
                                        {loadingSaveNote ? 'engraving' : 'engrave'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
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
                            Scroll, pinch, or use the zoom controls in the bottom-right to zoom in and out.
                        </motion.div>
                    )}
                </AnimatePresence>
            </GoogleMap>
        </div>
    );
}
