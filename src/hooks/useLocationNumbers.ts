import { useContext } from 'react';
import { LocationNumbersContext } from '../contexts/LocationNumbersProviders';

export function useLocationNumbers() {
    const context = useContext(LocationNumbersContext);
    if (!context) throw new Error('useLocationNumbers must be used within a LocationNumbersProvider');
    return context;
}
