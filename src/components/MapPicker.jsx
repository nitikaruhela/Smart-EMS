import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultCenter = [20.5937, 78.9629];
const defaultZoom = 5;

const pickerMarkerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function PickerMapEvents({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapController({ targetPosition }) {
  const map = useMap();
  const latitude = targetPosition?.[0];
  const longitude = targetPosition?.[1];

  useEffect(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    map.setView([latitude, longitude], 14, { animate: true });
  }, [latitude, longitude, map]);

  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation = null }) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [initialLatitude, initialLongitude] = initialLocation || [];
  const parsedInitialLatitude = Number.parseFloat(initialLatitude);
  const parsedInitialLongitude = Number.parseFloat(initialLongitude);
  const hasInitialLocation =
    Number.isFinite(parsedInitialLatitude) && Number.isFinite(parsedInitialLongitude);

  const normalizedInitialPosition = useMemo(
    () => (hasInitialLocation ? [parsedInitialLatitude, parsedInitialLongitude] : null),
    [hasInitialLocation, parsedInitialLatitude, parsedInitialLongitude]
  );

  useEffect(() => {
    setIsMapReady(true);
  }, []);

  useEffect(() => {
    if (!hasInitialLocation) {
      setSelectedPosition((current) => (current ? null : current));
      return;
    }

    setSelectedPosition((current) => {
      if (
        current &&
        current[0] === parsedInitialLatitude &&
        current[1] === parsedInitialLongitude
      ) {
        return current;
      }

      return [parsedInitialLatitude, parsedInitialLongitude];
    });
  }, [hasInitialLocation, parsedInitialLatitude, parsedInitialLongitude]);

  const commitLocation = (latitude, longitude) => {
    setSelectedPosition([latitude, longitude]);
    onLocationSelect(latitude, longitude);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        commitLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationError("Unable to fetch your location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const latitudeText = selectedPosition ? selectedPosition[0].toFixed(6) : "--";
  const longitudeText = selectedPosition ? selectedPosition[1].toFixed(6) : "--";

  return (
    <div className="map-picker">
      <div className="map-picker__bar">
        <p className="helper-text">Click on map to select event location</p>
        <button
          type="button"
          className="button button--secondary"
          onClick={handleUseMyLocation}
        >
          Use My Location
        </button>
      </div>

      <div className="map-frame map-height-default">
        {isMapReady ? (
          <MapContainer
            center={normalizedInitialPosition || defaultCenter}
            zoom={normalizedInitialPosition ? 13 : defaultZoom}
            scrollWheelZoom
            className="map-height-default"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PickerMapEvents onMapClick={commitLocation} />
            <MapController targetPosition={selectedPosition} />
            {selectedPosition ? (
              <Marker position={selectedPosition} icon={pickerMarkerIcon} />
            ) : null}
          </MapContainer>
        ) : (
          <div className="map-state map-height-default">
            Preparing map...
          </div>
        )}
      </div>

      <div className="coordinate-grid">
        <div className="stat-block">
          <p className="meta-label">Latitude</p>
          <p className="stat-block__value">{latitudeText}</p>
        </div>
        <div className="stat-block">
          <p className="meta-label">Longitude</p>
          <p className="stat-block__value">{longitudeText}</p>
        </div>
      </div>

      {locationError ? <p className="alert alert--warning">{locationError}</p> : null}
    </div>
  );
}
