import './App.css';
import Map from './components/Map';
import { LocationNumbersProviders } from './contexts/LocationNumbersProviders';
import { MapProvider } from './contexts/MapProvider';
import { NotesProvider } from './contexts/NotesProvider';
import { Analytics } from '@vercel/analytics/react';

function App() {
    return (
        <div className=" w-full h-screen overflow-hidden">
            <NotesProvider>
                <MapProvider>
                    <LocationNumbersProviders>
                        <Map />
                    </LocationNumbersProviders>
                </MapProvider>
            </NotesProvider>
            <Analytics />
        </div>
    );
}

export default App;
