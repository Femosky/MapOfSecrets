import './App.css';
import Map from './components/Map';
import { ErrorProvider } from './contexts/ErrorProvider';
import { LocationNumbersProviders } from './contexts/LocationNumbersProviders';
import { MapProvider } from './contexts/MapProvider';
import { NotesProvider } from './contexts/NotesProvider';
import { Analytics } from '@vercel/analytics/react';

function App() {
    return (
        <div className=" w-full h-dvh">
            <ErrorProvider>
                <NotesProvider>
                    <MapProvider>
                        <LocationNumbersProviders>
                            <Map />
                        </LocationNumbersProviders>
                    </MapProvider>
                </NotesProvider>
            </ErrorProvider>

            <Analytics />
        </div>
    );
}

export default App;
