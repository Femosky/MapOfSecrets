import { createContext, useEffect, useState } from 'react';
import type { ChildrenProps, Coordinates, PlaceData, RawLocationCountData } from '../models/mapInterfaces';
import { API_URL } from '../constants/apiUrls';
import { useError } from '../hooks/useError';

const LocationNumbersContext = createContext<
    | {
          cityTowns: PlaceData[];
          stateProvinces: PlaceData[];
          countries: PlaceData[];
          fetchLocationNumbers: () => Promise<void>;
      }
    | undefined
>(undefined);

export function LocationNumbersProviders({ children }: ChildrenProps) {
    const [cityTowns, setCityTowns] = useState<PlaceData[]>([]);
    const [stateProvinces, setStateProvinces] = useState<PlaceData[]>([]);
    const [countries, setCountries] = useState<PlaceData[]>([]);

    const { setError } = useError();

    async function fetchCityTownNumbers() {
        try {
            const url = `${API_URL}/locations/cities`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const jsonListOfCities = await response.json();

            const cities: PlaceData[] = Object.values(jsonListOfCities).map((city) => {
                const typedCity = city as RawLocationCountData;

                const coords: Coordinates = {
                    latitude: typedCity.latitude,
                    longitude: typedCity.longitude,
                };
                const locationCountData: PlaceData = [typedCity.count, coords];
                return locationCountData;
            });

            setCityTowns(cities);
        } catch (e) {
            console.log(e);
            setError(String(e));
        }
    }
    async function fetchStateProvinceNumbers() {
        try {
            const url = `${API_URL}/locations/states`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const jsonListOfStates = await response.json();

            const states: PlaceData[] = Object.values(jsonListOfStates).map((state) => {
                const typedState = state as RawLocationCountData;

                const coords: Coordinates = {
                    latitude: typedState.latitude,
                    longitude: typedState.longitude,
                };
                const locationCountData: PlaceData = [typedState.count, coords];
                return locationCountData;
            });

            setStateProvinces(states);
        } catch (e) {
            console.log(e);
            setError(String(e));
        }
    }
    async function fetchCountryNumbers() {
        try {
            const url = `${API_URL}/locations/countries`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const jsonListOfCountries = await response.json();

            const countries: PlaceData[] = Object.values(jsonListOfCountries).map((country) => {
                const typedCountry = country as RawLocationCountData;

                const coords: Coordinates = {
                    latitude: typedCountry.latitude,
                    longitude: typedCountry.longitude,
                };
                const locationCountData: PlaceData = [typedCountry.count, coords];
                return locationCountData;
            });

            setCountries(countries);
        } catch (e) {
            console.log(e);
            setError(String(e));
        }
    }

    async function fetchLocationNumbers() {
        await fetchCountryNumbers();
        await fetchStateProvinceNumbers();
        await fetchCityTownNumbers();
    }

    useEffect(() => {
        fetchCountryNumbers();
        fetchStateProvinceNumbers();
        fetchCityTownNumbers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <LocationNumbersContext.Provider value={{ cityTowns, stateProvinces, countries, fetchLocationNumbers }}>
            {children}
        </LocationNumbersContext.Provider>
    );
}

export { LocationNumbersContext };
