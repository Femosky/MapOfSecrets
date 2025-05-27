import { createContext, useState } from 'react';
import type { ChildrenProps, Location, Note } from '../models/mapInterfaces';
import { API_URL } from '../constants/apiUrls';
import { useError } from '../hooks/useError';

const NotesContext = createContext<
    | {
          notes: Note[];
          setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
          createNoteInDatabase: (text: string, location: Location) => Promise<[boolean, string]>;
      }
    | undefined
>(undefined);

export function NotesProvider({ children }: ChildrenProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const { setError } = useError();

    async function createNoteInDatabase(text: string, location: Location): Promise<[boolean, string]> {
        try {
            const url = `${API_URL}/notes`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, location }),
            });

            // payload are "messages", "noteId", and "error"
            const { noteId, error } = await response.json();

            if (error) {
                console.log(error);
                setError(String(error));
                return [false, ''];
            }

            return [true, noteId];
        } catch (e) {
            console.log(e);
            setError(String(e));
            return [false, ''];
        }
    }

    return <NotesContext.Provider value={{ notes, setNotes, createNoteInDatabase }}>{children}</NotesContext.Provider>;
}

export { NotesContext };
