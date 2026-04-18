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
  heightClass = "h-[400px]",
  className = "",
  showUserLocation = false,
}) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
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
    if (!showUserLocation || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setLocationError("Current location unavailable. Please check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showUserLocation]);

  if (!mapEvents.length) {
    return (
      <div
        className={`glass-panel flex items-center justify-center rounded-3xl p-6 text-center text-slate-500 ${heightClass} ${className}`}
      >
        No mappable event coordinates found. Add latitude and longitude to events to
        display markers.
      </div>
    );
  }

  if (!isMapReady) {
    return (
      <div
        className={`glass-panel flex items-center justify-center rounded-3xl p-6 text-center text-slate-500 ${heightClass} ${className}`}
      >
        Preparing map...
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`overflow-hidden rounded-3xl border border-slate-200 ${heightClass}`}>
        <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
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
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{event.name}</p>
                    <p className="text-sm text-slate-600">Venue: {event.venue}</p>
                    <p className="text-sm text-slate-600">Date: {event.date}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {showUserLocation && userLocation ? (
            <CircleMarker center={userLocation} radius={8} pathOptions={{ color: "#2563eb" }}>
              <Popup>Your current location</Popup>
            </CircleMarker>
          ) : null}
        </MapContainer>
      </div>
      {locationError ? <p className="mt-3 text-sm text-amber-700">{locationError}</p> : null}
    </div>
  );
}
