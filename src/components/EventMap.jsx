import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultCenter = [20.5937, 78.9629];
const defaultZoom = 5;

const baseMarkerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedMarkerIcon = L.divIcon({
  className: "event-marker-selected-wrapper",
  html: '<span class="event-marker-selected"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function MapAutoCenter({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

export default function EventMap({
  events = [],
  selectedEventId = null,
  centerEventId = null,
  heightClass = "map-height-default",
  className = "",
  showUserLocation = false,
  userLocation = null,
  userLocationError = "",
}) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [localUserLocation, setLocalUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    setIsMapReady(true);
  }, []);

  const mapEvents = useMemo(() => {
    return events
      .map((event) => ({
        ...event,
        latitude: Number.parseFloat(event.latitude),
        longitude: Number.parseFloat(event.longitude),
      }))
      .filter(
        (event) => Number.isFinite(event.latitude) && Number.isFinite(event.longitude)
      );
  }, [events]);

  const activeUserLocation = userLocation || localUserLocation;

  const focusEvent = useMemo(() => {
    const lookupId = centerEventId || selectedEventId;

    if (!lookupId) {
      return mapEvents[0];
    }

    return mapEvents.find((event) => event.id === lookupId) || mapEvents[0];
  }, [centerEventId, mapEvents, selectedEventId]);

  const center = focusEvent
    ? [focusEvent.latitude, focusEvent.longitude]
    : defaultCenter;
  const zoom = focusEvent ? 13 : defaultZoom;

  useEffect(() => {
    if (userLocation || !showUserLocation) {
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocalUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error("[EventMap] Unable to read current location.", error);
        setLocationError("Current location unavailable. Please check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showUserLocation, userLocation]);

  if (!mapEvents.length) {
    return (
      <div className={`card map-state ${heightClass} ${className}`.trim()}>
        No mappable event coordinates found. Add latitude and longitude to events to display
        markers.
      </div>
    );
  }

  if (!isMapReady) {
    return (
      <div className={`card map-state ${heightClass} ${className}`.trim()}>
        Preparing map...
      </div>
    );
  }

  return (
    <div className={`map-shell ${className}`.trim()}>
      <div className={`map-frame ${heightClass}`.trim()}>
        <MapContainer center={center} zoom={zoom} scrollWheelZoom className="map-height-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapAutoCenter center={center} zoom={zoom} />
          {mapEvents.map((event) => {
            const isSelected = selectedEventId === event.id;

            return (
              <Marker
                key={event.id}
                position={[event.latitude, event.longitude]}
                icon={isSelected ? selectedMarkerIcon : baseMarkerIcon}
              >
                <Popup>
                  <div>
                    <p><strong>{event.name}</strong></p>
                    <p>Venue: {event.venue}</p>
                    <p>Date: {event.date}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {showUserLocation && activeUserLocation ? (
            <CircleMarker
              center={activeUserLocation}
              radius={8}
              pathOptions={{ color: "#2563eb" }}
            >
              <Popup>Your current location</Popup>
            </CircleMarker>
          ) : null}
        </MapContainer>
      </div>
      {userLocationError || locationError ? (
        <p className="alert alert--warning">{userLocationError || locationError}</p>
      ) : null}
    </div>
  );
}
