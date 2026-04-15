import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";
import EventCard from "../components/EventCard";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToEvents,
  subscribeToEventsByOrganizer,
  subscribeToRegistrationsByUser,
  subscribeToRegistrationsForEvents,
} from "../services/eventService";

export default function Dashboard() {
  const { user, role, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    setLoading(true);

    const unsubscribers = [
      subscribeToEvents(
        (allEvents) => {
          setEvents(allEvents);
          setLoading(false);
        },
        (snapshotError) => setError(snapshotError.message)
      ),
    ];

    if (role === "Organizer") {
      unsubscribers.push(
        subscribeToEventsByOrganizer(
          user.uid,
          (organizerEvents) => {
            setMyEvents(organizerEvents);
            setLoading(false);
          },
          (snapshotError) => setError(snapshotError.message)
        )
      );
    }

    if (role === "Attendee") {
      unsubscribers.push(
        subscribeToRegistrationsByUser(
          user.uid,
          (registrations) => {
            setMyRegistrations(registrations);
            setLoading(false);
          },
          (snapshotError) => setError(snapshotError.message)
        )
      );
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [role, user]);

  useEffect(() => {
    if (role !== "Organizer" || !myEvents.length) {
      setEventRegistrations([]);
      return undefined;
    }

    return subscribeToRegistrationsForEvents(
      myEvents.map((event) => event.id),
      setEventRegistrations,
      (snapshotError) => setError(snapshotError.message)
    );
  }, [myEvents, role]);

  useEffect(() => {
    if (role !== "Organizer" && role !== "Attendee") {
      setLoading(false);
    }
  }, [role]);

  const featuredEvents = useMemo(() => {
    let normalized = [...events];

    if (filterType !== "All") {
      normalized = normalized.filter((event) => event.eventType === filterType);
    }

    if (sortBy === "venue") {
      return normalized.sort((a, b) => a.venue.localeCompare(b.venue));
    }

    return normalized.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, filterType, sortBy]);

  const stats = useMemo(() => {
    if (role !== "Organizer") {
      return [];
    }

    return [
      {
        title: "Total Events",
        value: myEvents.length,
        detail: "Live events created by your organizer account.",
      },
      {
        title: "Registrations",
        value: eventRegistrations.length,
        detail: "Combined attendee signups across your current events.",
      },
      {
        title: "Checked-In",
        value: eventRegistrations.filter((registration) => registration.checkedIn).length,
        detail: "Guests already verified through the QR entry system.",
      },
    ];
  }, [eventRegistrations, myEvents.length, role]);

  const registrationMap = useMemo(() => {
    return myRegistrations.reduce((accumulator, registration) => {
      accumulator[registration.eventId] = registration;
      return accumulator;
    }, {});
  }, [myRegistrations]);

  return (
    <section className="space-y-8">
      <div className="glass-panel overflow-hidden">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr,0.8fr] lg:px-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">
              {role === "Organizer" ? "Organizer Command Center" : "Attendee Workspace"}
            </p>
            <h1 className="font-display text-4xl font-bold text-slate-950">
              {role === "Organizer"
                ? "Run polished event operations with real-time visibility."
                : "Find events, secure your registration, and keep your QR pass ready."}
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              The dashboard adapts to your role, highlights live event data, and keeps key
              workflows one click away.
            </p>
            {!isFirebaseConfigured ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Firebase is not configured yet. The UI is ready, but authentication and
                Firestore actions will stay disabled until `.env` is filled in.
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              to={role === "Organizer" ? "/events/create" : "/events/college"}
              className="rounded-3xl bg-slate-950 p-6 text-white shadow-soft"
            >
              <p className="text-sm uppercase tracking-[0.22em] text-slate-300">Quick Action</p>
              <h2 className="mt-3 font-display text-2xl font-bold">
                {role === "Organizer" ? "Create Event" : "Browse Events"}
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                {role === "Organizer"
                  ? "Launch a new event and start accepting registrations."
                  : "Explore available college events and reserve your seat."}
              </p>
            </Link>
            <Link to="/events/select" className="glass-panel p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Workflows</p>
              <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">
                Event Type Selection
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Jump into specialized flows for college and cultural events.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {role === "Organizer" ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-slate-950">Organizer Metrics</h2>
            <Link to="/events/create" className="btn-primary">
              Create Event
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <DashboardCard key={item.title} {...item} />
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-slate-950">Your Events</h3>
            {loading ? (
              <p className="text-slate-500">Loading your events...</p>
            ) : myEvents.length ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {myEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    footer={
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        Registrations:{" "}
                        {
                          eventRegistrations.filter(
                            (registration) => registration.eventId === event.id
                          ).length
                        }
                      </div>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-6 text-slate-500">
                You have not created any events yet.
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-slate-950">My Registrations</h2>
            <Link to="/events/college" className="btn-primary">
              Browse Events
            </Link>
          </div>
          {loading ? (
            <p className="text-slate-500">Loading your registrations...</p>
          ) : myRegistrations.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {myRegistrations.map((registration) => (
                <div key={registration.id} className="glass-panel p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-bold text-slate-950">
                        {registration.eventName}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">{registration.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        registration.checkedIn
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {registration.checkedIn ? "Checked In" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={registration.qrCode}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                    >
                      View QR Code
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/events/college", {
                          state: { registrationId: registration.id },
                        })
                      }
                      className="btn-secondary"
                    >
                      Manage Registration
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-6 text-slate-500">
              No registrations yet. Browse college events to claim your first QR pass.
            </div>
          )}
        </section>
      )}

      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">Featured Events</h2>
            <p className="text-slate-500">
              Shared event feed with filtering and sorting for faster discovery.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="input-field min-w-[180px]"
            >
              <option value="All">All Event Types</option>
              <option value="College Event">College Event</option>
              <option value="Cultural Event">Cultural Event</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="input-field min-w-[160px]"
            >
              <option value="date">Sort by Date</option>
              <option value="venue">Sort by Venue</option>
            </select>
          </div>
        </div>

        {featuredEvents.length ? (
          <div className="grid gap-6 xl:grid-cols-3">
            {featuredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                actionLabel={role === "Attendee" ? "Open Registration" : undefined}
                onAction={() => navigate("/events/college")}
                actionDisabled={role === "Attendee" && !!registrationMap[event.id]}
                footer={
                  role === "Attendee" && registrationMap[event.id] ? (
                    <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      Already registered. View your pass in My Registrations.
                    </p>
                  ) : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-6 text-slate-500">
            No featured events match your current filter.
          </div>
        )}
      </section>
    </section>
  );
}
