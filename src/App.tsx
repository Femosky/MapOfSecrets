import './App.css';
import Map from './components/Map';
import { LocationNumbersProviders } from './contexts/LocationNumbersProviders';
import { MapProvider } from './contexts/MapProvider';
import { NotesProvider } from './contexts/NotesProvider';

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
        </div>
    );
}

export default App;
