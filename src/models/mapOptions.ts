export const mapOptions: google.maps.MapOptions = {
    // mapId: import.meta.env.VITE_GOOGLE_MAP_ID_CITY,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    mapTypeControl: false,
    gestureHandling: 'greedy',
    streetViewControl: false,
    rotateControl: false,
    tilt: 0,
    restriction: {
        latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
        strictBounds: true,
    },
    draggableCursor: 'default',
};
