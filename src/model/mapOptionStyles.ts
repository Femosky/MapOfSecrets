export const streetLevelStyles: google.maps.MapTypeStyle[] = [
    {
        featureType: 'poi',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'landscape',
        elementType: 'all',
        stylers: [{ color: '#FFFFFF' }],
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#DFE2DF' }],
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#DFE2DF' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#949E94' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }],
    },

    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#D7E0E7' }],
    },
    {
        featureType: 'road.local',
        elementType: 'labels.text',
        stylers: [{ visibility: '#D7E0E7' }],
    },
    {
        featureType: 'transit',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry.fill',
        // stylers: [{ color: '#C0C0C0' }],
        stylers: [{ color: '#C9CFCA' }],
    },
];

export const neighborhoodLevelStyles: google.maps.MapTypeStyle[] = [
    ...streetLevelStyles,
    {
        featureType: 'administrative.land_parcel',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
];

export const cityLevelStyles: google.maps.MapTypeStyle[] = [
    ...neighborhoodLevelStyles,
    {
        featureType: 'administrative.neighborhood',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.text',
        stylers: [{ visibility: 'off' }],
    },
];

export const stateLevelStyles: google.maps.MapTypeStyle[] = [
    ...cityLevelStyles,
    {
        featureType: 'road',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'administrative.locality',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.text',
        stylers: [{ visibility: 'on' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.text',
        stylers: [{ color: '#949E94' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ visibility: 'off' }],
    },
];

export const countryLevelStyles: google.maps.MapTypeStyle[] = [
    ...stateLevelStyles,
    {
        featureType: 'administrative.province',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
];

export const globeLevelStyles: google.maps.MapTypeStyle[] = [
    ...countryLevelStyles,
    {
        featureType: 'administrative.country',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'water',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
    },
];
