import { useState } from 'react';
import type { Coordinates, GeneralCoordinates, GeneralLocation } from '../models/mapInterfaces';
import { useMap } from './useMap';

export function useGeneralLocation() {
    const { getGeneralLocation } = useMap();
    const [error, setError] = useState<string | null>(null);

    async function getCoordinatesFromLocation(query: string): Promise<Coordinates | null> {
        const url = `https://nominatim.openstreetmap.org/search.php?q=${query}&format=jsonv2`;

        try {
            const result = await fetch(url).then((res) => res.json());

            if (!result) {
                throw new Error(`No geocoding result for "${query}"`);
            }

            const coordinates: Coordinates = {
                latitude: parseFloat(result[0].lat),
                longitude: parseFloat(result[0].lon),
            };

            return coordinates;
        } catch (err) {
            console.log(err);
            setError(String(err));
            return null;
        }
    }

    async function getGeneralCoordinates(generalLocation: GeneralLocation): Promise<GeneralCoordinates | null> {
        try {
            const cityTown = `${generalLocation.cityTown.name}, ${generalLocation.stateProvince.name}, ${generalLocation.country.name}`;
            const stateProvince = `${generalLocation.stateProvince.name}, ${generalLocation.country.name}`;
            const country = generalLocation.country.name;

            const cityTownCoordinates: Coordinates | null = await getCoordinatesFromLocation(cityTown);
            const stateProvinceCoordinates: Coordinates | null = await getCoordinatesFromLocation(stateProvince);
            const countryCoordinates: Coordinates | null = await getCoordinatesFromLocation(country);

            if (!cityTownCoordinates || !stateProvinceCoordinates || !countryCoordinates) {
                throw new Error('Failed to get general coordinates');
            }
            const generalCoordinates: GeneralCoordinates = {
                cityTown: cityTownCoordinates,
                stateProvince: stateProvinceCoordinates,
                country: countryCoordinates,
            };

            return generalCoordinates;
        } catch (err) {
            console.error("Couldn't get general coordinates", err);
            setError(String(err));
            return null;
        }
    }

    async function getLocation(lat: number, lng: number) {
        try {
            const generalLocation: GeneralLocation | null = await getGeneralLocation({ lat, lng });

            if (!generalLocation) throw Error('Failed to get location names.');

            const generalCoordinates: GeneralCoordinates | null = await getGeneralCoordinates(generalLocation);

            if (!generalCoordinates) throw Error('Failed to get general location coordinates.');

            return {
                id: Date.now(),
                coordinates: { latitude: lat, longitude: lng },
                generalCoordinates,
                generalLocation,
                cityTown: generalLocation.cityTown.name,
                stateProvince: generalLocation.stateProvince.name,
                country: generalLocation.country.name,
            };
        } catch (err) {
            console.error('', err);
            setError(String(err));
            return null;
        }
    }
    return { getLocation, getGeneralLocation, error };
}
