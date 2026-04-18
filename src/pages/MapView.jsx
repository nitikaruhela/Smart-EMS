import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EventMap from "../components/EventMap";
import { subscribeToEvents } from "../services/eventService";

export default function MapView() {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(location.state?.eventId || null);
  const [error, setError] = useState("");

  useEffect(() => {
    return subscribeToEvents(
      (allEvents) => {
        setEvents(allEvents);
      },
      (snapshotError) => setError(snapshotError.message)
    );
  }, []);

  const mapEvents = useMemo(() => {
    return events.filter(
      (event) =>
        Number.isFinite(Number.parseFloat(event.latitude)) &&
        Number.isFinite(Number.parseFloat(event.longitude))
    );
  }, [events]);

  useEffect(() => {
    if (selectedEventId || !mapEvents.length) {
      return;
    }

    setSelectedEventId(mapEvents[0].id);
  }, [mapEvents, selectedEventId]);

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">
          Map Explorer
        </p>
        <h1 className="font-display text-4xl font-bold text-slate-950">
          Explore all event locations visually on OpenStreetMap.
        </h1>
        <p className="text-lg text-slate-600">
          Select any event to focus the map and inspect venue details quickly.
        </p>
        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <EventMap
          events={mapEvents}
          selectedEventId={selectedEventId}
          centerEventId={selectedEventId}
          showUserLocation
          heightClass="h-[65vh] min-h-[420px]"
        />

        <div className="glass-panel p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Mappable</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                {mapEvents.length} event{mapEvents.length === 1 ? "" : "s"}
              </h2>
            </div>
            {selectedEventId ? (
              <button
                type="button"
                className="btn-secondary px-4 py-2"
                onClick={() => setSelectedEventId(null)}
              >
                Reset Focus
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-3">
            {mapEvents.length ? (
              mapEvents.map((event) => {
                const isSelected = selectedEventId === event.id;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-brand-200 bg-brand-50"
                        : "border-slate-200 bg-white hover:border-brand-100"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{event.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{event.venue}</p>
                    <p className="mt-1 text-sm text-slate-500">{event.date}</p>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                No events with coordinates are available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
