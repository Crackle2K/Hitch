import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapComponent({ locations, selectedLocation, onSelectLocation }) {
  const mapRef = useRef();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedLocation]);

  const initialView = userLocation
    ? { longitude: userLocation.lng, latitude: userLocation.lat, zoom: 10 }
    : { longitude: -79.4, latitude: 43.93, zoom: 9 };

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={initialView}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {locations.map(loc => (
        <Marker
          key={loc.id}
          longitude={loc.lng}
          latitude={loc.lat}
          onClick={() => onSelectLocation(prev => prev?.id === loc.id ? null : loc)}
        >
          <div className={`school-marker ${selectedLocation?.id === loc.id ? 'active' : ''}`} />
        </Marker>
      ))}

      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
          <div className="user-marker" title="Your location" />
        </Marker>
      )}

      {selectedLocation && (
        <Popup
          longitude={selectedLocation.lng}
          latitude={selectedLocation.lat}
          onClose={() => onSelectLocation(null)}
          closeOnClick={false}
          anchor="bottom"
          offset={14}
        >
          <p className="popup-name">{selectedLocation.name}</p>
        </Popup>
      )}
    </Map>
  );
}
