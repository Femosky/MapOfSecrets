import { useEffect, useState } from 'react';
import { API_URL, fetchNoteByPlaceIdLocationType } from '../constants/apiUrls';
import { useNotes } from './useNotes';
import type { LocationFetchNoteData, Note } from '../models/mapInterfaces';

export function useNoteFetch() {
    const [lastFocusedLocation, setLastFocusedLocation] = useState<string | null>(null);
    const [currentFocusedLocation, setCurrentFocusedLocation] = useState<string | null>(null);

    const { setNotes } = useNotes();

    const [seenNoteIds, setSeenNoteIds] = useState<Set<number>>(new Set());
    const [seenPlaceIds, setSeenPlaceIds] = useState<Set<string>>(new Set());

    const [isFetchingNotes, setIsFetchingNotes] = useState(false);

    useEffect(() => {
        async function fetchNotesByLocation() {
            if (isFetchingNotes || !currentFocusedLocation) return;

            setIsFetchingNotes(true);

            const payload: LocationFetchNoteData = {
                locationType: fetchNoteByPlaceIdLocationType,
                placeId: currentFocusedLocation,
            };

            try {
                const url = `${API_URL}/notes/location`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const { notes, error } = await response.json();

                if (error) {
                    console.log(error);
                    setSeenPlaceIds((prev) => new Set(prev).add(currentFocusedLocation));
                    return;
                }
                if (!notes) {
                    // throw Error('No response data.');
                    setSeenPlaceIds((prev) => new Set(prev).add(currentFocusedLocation));
                    console.log('No response data for fetched notes');
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

                setSeenPlaceIds((prev) => new Set(prev).add(currentFocusedLocation));
                setNotes((prev) => [...prev, ...preparedNotes]);
            } catch (e) {
                console.log(e);
                // setError(String(e));
            } finally {
                setIsFetchingNotes(false);
            }
        }

        if (!currentFocusedLocation) return;
        const statePlaceId = currentFocusedLocation;
        if (seenPlaceIds.has(statePlaceId)) return;

        if (currentFocusedLocation === lastFocusedLocation) {
            // console.log(lastFocusedLocation?.cityTown, currentFocusedLocation?.cityTown);
            fetchNotesByLocation();
        } else {
            fetchNotesByLocation();
        }

        setLastFocusedLocation(currentFocusedLocation);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFocusedLocation]);
    return {
        lastFocusedLocation,
        setLastFocusedLocation,
        currentFocusedLocation,
        setCurrentFocusedLocation,
        seenNoteIds,
        setSeenNoteIds,
        seenPlaceIds,
        setSeenPlaceIds,
        isFetchingNotes,
        setIsFetchingNotes,
    };
}
