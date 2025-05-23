import { createContext, useState } from 'react';
import type { ChildrenProps, Location, Note } from '../models/mapInterfaces';
import { API_URL } from '../constants/apiUrls';

const NotesContext = createContext<
    | {
          notes: Note[];
          setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
          error: string | null;
          setError: React.Dispatch<React.SetStateAction<string | null>>;
          createNoteInDatabase: (text: string, location: Location) => Promise<[boolean, string]>;
      }
    | undefined
>(undefined);

export function NotesProvider({ children }: ChildrenProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <NotesContext.Provider value={{ notes, setNotes, error, setError, createNoteInDatabase }}>
            {children}
        </NotesContext.Provider>
    );
}

export { NotesContext };
