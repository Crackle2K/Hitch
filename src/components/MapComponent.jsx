import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapComponent({
  locations,
  selectedLocation,
  onSelectLocation,
  onLocationChange,
  otherUsers,
  carpoolRequests,
  userId,
}) {
  const mapRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [hasCentred, setHasCentred] = useState(false);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => { onLocationChangeRef.current = onLocationChange; }, [onLocationChange]);

  // High-accuracy continuous location tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        onLocationChangeRef.current?.(loc);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fly to user's precise location on first fix
  useEffect(() => {
    if (userLocation && mapRef.current && !hasCentred) {
      setHasCentred(true);
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        duration: 1500,
      });
    }
  }, [userLocation, hasCentred]);

  // Fly to selected school
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedLocation]);

  const initialView = { longitude: -79.4, latitude: 43.93, zoom: 9 };

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={initialView}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {/* School markers */}
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

      {/* Carpool request pickup markers */}
      {carpoolRequests.map(req => (
        <Marker key={`cp-${req.id}`} longitude={req.lng} latitude={req.lat}>
          <div
            className={`carpool-marker${req.user_id === userId ? ' mine' : ''}`}
            title={`${req.name} → ${req.school_name}${req.message ? `\n"${req.message}"` : ''}`}
          />
        </Marker>
      ))}

      {/* Other users */}
      {otherUsers.map(user => (
        <Marker key={user.user_id} longitude={user.lng} latitude={user.lat}>
          <div className="peer-marker" title={user.name}>
            {user.name[0].toUpperCase()}
          </div>
        </Marker>
      ))}

      {/* Current user */}
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
