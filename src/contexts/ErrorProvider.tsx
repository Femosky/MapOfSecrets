import { createContext, useEffect, useRef, useState } from 'react';
import type { ChildrenProps } from '../models/mapInterfaces';
import { errorToastTime } from '../constants/noteConstant';

const ErrorContext = createContext<{
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
} | null>(null);

export function ErrorProvider({ children }: ChildrenProps) {
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (error) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                setError(null);
                timeoutRef.current = null;
            }, errorToastTime);
        }
    }, [error]);

    return <ErrorContext.Provider value={{ error, setError }}>{children}</ErrorContext.Provider>;
}

export { ErrorContext };
