export const containerStyle = {
    width: '100%',
    height: '100%',
};

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
        stylers: [{ color: '#A0A3A0' }],
    },
    {
        featureType: 'administrative.province',
        elementType: 'geometry.stroke',
        // stylers: [{ color: '#DFE2DF' }],
        stylers: [{ color: '#000000' }],
    },
    {
        featureType: 'all',
        elementType: 'labels.text',
        stylers: [{ visibility: 'on' }],
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
        featureType: 'administrative.locality',
        elementType: 'labels.icon',
        stylers: [{ color: '#FFFFFF' }],
    },
    {
        featureType: 'road',
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
    {
        featureType: 'all',
        elementType: 'labels.text',
        stylers: [{ color: '#949E94' }],
    },
];

export const cityLevelStyles: google.maps.MapTypeStyle[] = [
    ...neighborhoodLevelStyles,
    {
        featureType: 'administrative.neighborhood',
        elementType: 'all',
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
        featureType: 'administrative.province',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#000000' }],
    },
];

export const countryLevelStyles: google.maps.MapTypeStyle[] = [
    ...stateLevelStyles,
    {
        featureType: 'administrative.province',
        elementType: 'all',
        stylers: [{ visibility: 'off' }],
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#DFE2DF' }],
    },
    {
        featureType: 'administrative',
        elementType: 'geometry.fill',
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

export const equalTo9Styles: google.maps.MapTypeStyle[] = [
    ...stateLevelStyles,
    {
        featureType: 'all',
        elementType: 'labels.text',
        stylers: [{ visibility: 'off' }],
    },
];
