import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EventMap from "../components/EventMap";
import { subscribeToEvents } from "../services/eventService";
import { haversineDistanceKm } from "../utils/location";

const radiusOptions = [5, 10, 25, 50];

export default function MapView() {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(location.state?.eventId || null);
  const [viewMode, setViewMode] = useState("map");
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return subscribeToEvents(
      (allEvents) => {
        setEvents(allEvents);
      },
      (snapshotError) => setError(snapshotError.message)
    );
  }, []);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (geolocationError) => {
        console.error("[MapView] Unable to fetch current location.", geolocationError);
        setLocationLoading(false);

        if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
          setLocationError("Location access was denied. Allow permission to discover nearby events.");
          return;
        }

        if (geolocationError.code === geolocationError.TIMEOUT) {
          setLocationError("Location request timed out. Try again in a moment.");
          return;
        }

        setLocationError("Unable to fetch your current location. Check browser location access.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    requestUserLocation();
  }, []);

  const mapEvents = useMemo(() => {
    return events.filter(
      (event) =>
        Number.isFinite(Number.parseFloat(event.latitude)) &&
        Number.isFinite(Number.parseFloat(event.longitude))
    );
  }, [events]);

  const nearbyEvents = useMemo(() => {
    if (!userLocation) {
      return mapEvents.map((event) => ({ ...event, distanceKm: null }));
    }

    return mapEvents
      .map((event) => {
        const distanceKm = haversineDistanceKm(userLocation, {
          latitude: event.latitude,
          longitude: event.longitude,
        });

        return {
          ...event,
          distanceKm,
        };
      })
      .filter((event) => event.distanceKm !== null && event.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [mapEvents, radiusKm, userLocation]);

  useEffect(() => {
    if (selectedEventId || !nearbyEvents.length) {
      return;
    }

    setSelectedEventId(nearbyEvents[0].id);
  }, [nearbyEvents, selectedEventId]);

  useEffect(() => {
    if (!nearbyEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(nearbyEvents[0]?.id || null);
    }
  }, [nearbyEvents, selectedEventId]);

  return (
    <section className="page">
      <div className="section">
        <p className="eyebrow">Nearby Event Discovery</p>
        <h1 className="page-title">Discover events around you in real time with map and list views.</h1>
        <p className="page-subtitle">
          Use your current location, choose a search radius, and compare nearby events by
          distance.
        </p>
        {error ? <p className="alert alert--danger">{error}</p> : null}
        {locationError ? (
          <p className="alert alert--warning">{locationError}</p>
        ) : null}
      </div>

      <div className="card section">
        <div className="section-header">
          <div>
            <p className="card-kicker">Nearby Filters</p>
            <h2 className="section-heading">
              {userLocation ? "Events near your location" : "Waiting for your location"}
            </h2>
          </div>
          <div className="filter-bar">
            <select
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="select"
            >
              {radiusOptions.map((option) => (
                <option key={option} value={option}>
                  Within {option} km
                </option>
              ))}
            </select>
            <div className="toggle">
              <button
                type="button"
                className={`toggle__button ${viewMode === "map" ? "toggle__button--active" : ""}`}
                onClick={() => setViewMode("map")}
              >
                Map View
              </button>
              <button
                type="button"
                className={`toggle__button ${viewMode === "list" ? "toggle__button--active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                List View
              </button>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={requestUserLocation}
              disabled={locationLoading}
            >
              {locationLoading ? "Locating..." : "Refresh Location"}
            </button>
          </div>
        </div>

        <div className="nearby-stats">
          <div className="stat-block">
            <p className="meta-label">Search Radius</p>
            <p className="stat-block__value">{radiusKm} km</p>
          </div>
          <div className="stat-block">
            <p className="meta-label">Nearby Events</p>
            <p className="stat-block__value">{userLocation ? nearbyEvents.length : 0}</p>
          </div>
          <div className="stat-block">
            <p className="meta-label">Location Status</p>
            <p className="stat-block__value">
              {locationLoading
                ? "Fetching your location..."
                : userLocation
                  ? "Live location ready"
                  : "Location not available"}
            </p>
          </div>
        </div>
      </div>

      <div className="planner-layout">
        {viewMode === "map" ? (
          <EventMap
            events={nearbyEvents}
            selectedEventId={selectedEventId}
            centerEventId={selectedEventId}
            showUserLocation={Boolean(userLocation)}
            userLocation={
              userLocation ? [userLocation.latitude, userLocation.longitude] : null
            }
            userLocationError={locationError}
            heightClass="map-height-large"
          />
        ) : (
          <div className="card section">
            <div className="section-header">
              <div>
                <p className="card-kicker">Nearby Results</p>
                <h2 className="section-heading">List View</h2>
              </div>
            </div>

            <div className="nearby-list">
              {locationLoading ? (
                <p className="helper-text">Fetching your location...</p>
              ) : nearbyEvents.length ? (
                nearbyEvents.map((event) => {
                  const isSelected = selectedEventId === event.id;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className={`nearby-item ${isSelected ? "nearby-item--active" : ""}`}
                    >
                      <div className="nearby-item__row">
                        <div>
                          <p className="event-card__title">{event.name}</p>
                          <p className="helper-text">{event.venue}</p>
                          <p className="helper-text">{event.date}</p>
                        </div>
                        <span className="nearby-distance">
                          {event.distanceKm.toFixed(1)} km
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="empty-state__text">
                  No events were found within {radiusKm} km of your current location.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="card section">
          <div className="section-header">
            <div>
              <p className="card-kicker">Nearby</p>
              <h2 className="section-heading">
                {nearbyEvents.length} event{nearbyEvents.length === 1 ? "" : "s"}
              </h2>
            </div>
            {selectedEventId ? (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setSelectedEventId(null)}
              >
                Reset Focus
              </button>
            ) : null}
          </div>

          <div className="nearby-list">
            {locationLoading ? (
              <p className="helper-text">Finding events near you...</p>
            ) : nearbyEvents.length ? (
              nearbyEvents.map((event) => {
                const isSelected = selectedEventId === event.id;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className={`nearby-item ${isSelected ? "nearby-item--active" : ""}`}
                  >
                    <div className="nearby-item__row">
                      <div>
                        <p className="event-card__title">{event.name}</p>
                        <p className="helper-text">{event.venue}</p>
                        <p className="helper-text">{event.date}</p>
                      </div>
                      <span className="nearby-distance">
                        {event.distanceKm?.toFixed(1)} km
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="empty-state__text">
                {userLocation
                  ? `No events with coordinates are available within ${radiusKm} km yet.`
                  : "Enable location access to discover nearby events in your area."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
