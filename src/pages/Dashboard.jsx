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
import { normalizeUserRole } from "../utils/userRole";

const hasCoordinates = (event) =>
  Number.isFinite(Number.parseFloat(event.latitude)) &&
  Number.isFinite(Number.parseFloat(event.longitude));

export default function Dashboard() {
  const { user, role, isFirebaseConfigured } = useAuth();
  const normalizedRole = normalizeUserRole(role);
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

    if (normalizedRole === "Organizer") {
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

    if (normalizedRole === "Attendee") {
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
  }, [normalizedRole, user]);

  useEffect(() => {
    if (normalizedRole !== "Organizer" || !myEvents.length) {
      setEventRegistrations([]);
      return undefined;
    }

    return subscribeToRegistrationsForEvents(
      myEvents.map((event) => event.id),
      setEventRegistrations,
      (snapshotError) => setError(snapshotError.message)
    );
  }, [myEvents, normalizedRole]);

  useEffect(() => {
    if (normalizedRole !== "Organizer" && normalizedRole !== "Attendee") {
      setLoading(false);
    }
  }, [normalizedRole]);

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
    if (normalizedRole !== "Organizer") {
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
  }, [eventRegistrations, myEvents.length, normalizedRole]);

  const registrationMap = useMemo(() => {
    return myRegistrations.reduce((accumulator, registration) => {
      accumulator[registration.eventId] = registration;
      return accumulator;
    }, {});
  }, [myRegistrations]);

  const registrationsByEventId = useMemo(() => {
    return eventRegistrations.reduce((accumulator, registration) => {
      accumulator[registration.eventId] = accumulator[registration.eventId] || [];
      accumulator[registration.eventId].push(registration);
      return accumulator;
    }, {});
  }, [eventRegistrations]);

  const checkedInCount = useMemo(() => {
    return eventRegistrations.filter((registration) => registration.checkedIn).length;
  }, [eventRegistrations]);

  const recentOrganizerEvents = useMemo(() => {
    return [...myEvents]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
  }, [myEvents]);

  const organizerHighlights = useMemo(() => {
    if (normalizedRole !== "Organizer") {
      return [];
    }

    const nextEvent = [...myEvents].sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    return [
      {
        label: "Next Event",
        value: nextEvent?.name || "No events scheduled",
        detail: nextEvent?.date || "Create your first event to start tracking activity.",
      },
      {
        label: "Live Registrations",
        value: `${eventRegistrations.length}`,
        detail: checkedInCount
          ? `${checkedInCount} attendees already checked in.`
          : "No attendees checked in yet.",
      },
    ];
  }, [checkedInCount, eventRegistrations.length, myEvents, normalizedRole]);

  return (
    <section className="page">
      <div className="card dashboard-hero">
        <div className="section">
          <p className="eyebrow">
            {normalizedRole === "Organizer" ? "Organizer Command Center" : "Attendee Workspace"}
          </p>
          <h1 className="page-title">
              {normalizedRole === "Organizer"
                ? "Run polished event operations with real-time visibility."
                : "Find events, secure your registration, and keep your QR pass ready."}
          </h1>
          <p className="page-subtitle">
            The dashboard adapts to your role, highlights live event data, and keeps key
            workflows one click away.
          </p>
          {!isFirebaseConfigured ? (
            <p className="alert alert--warning">
              Firebase is not configured yet. The UI is ready, but authentication and
              Firestore actions will stay disabled until `.env` is filled in.
            </p>
          ) : null}
          {error ? <p className="alert alert--danger">{error}</p> : null}
        </div>
        <div className="action-stack">
            <Link
              to={normalizedRole === "Organizer" ? "/events/create" : "/events/college"}
              className="card card--hero card--interactive"
            >
              <p className="card-kicker card-kicker--light">Quick Action</p>
              <h2 className="action-card__title">
                {normalizedRole === "Organizer" ? "Create Event" : "Browse Events"}
              </h2>
              <p className="card-copy">
                {normalizedRole === "Organizer"
                  ? "Launch a new event and start accepting registrations."
                  : "Explore available college events and reserve your seat."}
              </p>
            </Link>
            <Link to="/events/select" className="card card--interactive">
              <p className="card-kicker">Workflows</p>
              <h2 className="card-title">Event Type Selection</h2>
              <p className="card-copy">
                Jump into specialized flows for college and cultural events.
              </p>
            </Link>
            <Link to="/events/map" className="card card--interactive">
              <p className="card-kicker">Visual View</p>
              <h2 className="card-title">Event Map</h2>
              <p className="card-copy">
                Explore every mapped event location in one interactive view.
              </p>
            </Link>
        </div>
      </div>

      {normalizedRole === "Organizer" ? (
        <section className="section">
          <div className="section-header">
            <div className="section-header__copy">
              <h2 className="section-heading">Organizer Metrics</h2>
              <p className="section-subtitle">Live counts from your Firestore event activity.</p>
            </div>
            <Link to="/events/create" className="button button--primary">
              Create Event
            </Link>
          </div>
          <div className="metric-grid">
            {stats.map((item, index) => (
              <DashboardCard
                key={item.title}
                {...item}
                loading={loading}
                icon={["Events", "Signups", "Checked In"][index]}
                tone={["brand", "amber", "emerald"][index]}
              />
            ))}
          </div>
          <div className="highlight-grid">
            {organizerHighlights.map((item) => (
              <div key={item.label} className="card highlight-card">
                <p className="card-kicker">{item.label}</p>
                <p className="highlight-card__value">{loading ? "Loading..." : item.value}</p>
                <p className="helper-text">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="section">
            <div className="section-header">
              <div className="section-header__copy">
                <h3 className="section-heading">Recent Events</h3>
                <p className="section-subtitle">
                  Your latest organizer activity with live registration counts.
                </p>
              </div>
              {!loading && myEvents.length ? (
                <span className="pill">
                  {myEvents.length} total event{myEvents.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            {loading ? (
              <div className="placeholder-grid">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="card placeholder-card">
                    <div className="skeleton skeleton--title" />
                    <div className="skeleton skeleton--headline" />
                    <div className="stat-grid">
                      <div className="skeleton skeleton--panel" />
                      <div className="skeleton skeleton--panel" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrganizerEvents.length ? (
              <div className="card-grid">
                {recentOrganizerEvents.map((event) => {
                  const registrationsForEvent = registrationsByEventId[event.id] || [];
                  const checkedInForEvent = registrationsForEvent.filter(
                    (registration) => registration.checkedIn
                  ).length;

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      onViewMap={() =>
                        navigate("/events/map", {
                          state: { eventId: event.id },
                        })
                      }
                      mapDisabled={!hasCoordinates(event)}
                      footer={
                        <div className="stat-grid">
                          <div className="stat-block">
                            <p className="meta-label">Registrations</p>
                            <p className="stat-block__value">{registrationsForEvent.length}</p>
                          </div>
                          <div className="soft-panel soft-panel--success">
                            <p className="meta-label">Checked In</p>
                            <p className="stat-block__value">{checkedInForEvent}</p>
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="card empty-state">
                <p className="empty-state__title">No organizer data yet.</p>
                <p className="empty-state__text">
                  Create your first event to start tracking registrations and live check-ins
                  here.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : normalizedRole === "Attendee" ? (
        <section className="section">
          <div className="section-header">
            <div className="section-header__copy">
              <h2 className="section-heading">My Registrations</h2>
              <p className="section-subtitle">Keep your latest event passes and statuses close.</p>
            </div>
            <Link to="/events/college" className="button button--primary">
              Browse Events
            </Link>
          </div>
          {loading ? (
            <div className="card empty-state">
              <p className="empty-state__title">Loading your registrations...</p>
            </div>
          ) : myRegistrations.length ? (
            <div className="card-grid">
              {myRegistrations.map((registration) => (
                <div key={registration.id} className="card list-card">
                  <div className="list-card__row">
                    <div>
                      <p className="section-heading">{registration.eventName}</p>
                      <p className="helper-text">{registration.email}</p>
                    </div>
                    <span
                      className={`status-badge ${
                        registration.checkedIn
                          ? "status-badge--success"
                          : "status-badge--warning"
                      }`}
                    >
                      {registration.checkedIn ? "Checked In" : "Pending"}
                    </span>
                  </div>
                  <div className="filter-bar">
                    <a
                      href={registration.qrCode}
                      target="_blank"
                      rel="noreferrer"
                      className="button button--secondary"
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
                      className="button button--secondary"
                    >
                      Manage Registration
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <p className="empty-state__title">No registrations yet.</p>
              <p className="empty-state__text">
                Browse college events to claim your first QR pass.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="card empty-state">
          <p className="empty-state__title">Your profile is still syncing.</p>
          <p className="empty-state__text">
            Sign out and sign back in if your role does not appear after a moment.
          </p>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <div className="section-header__copy">
            <h2 className="section-heading">Featured Events</h2>
            <p className="section-subtitle">
              Shared event feed with filtering and sorting for faster discovery.
            </p>
          </div>
          <div className="filter-bar">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="select"
            >
              <option value="All">All Event Types</option>
              <option value="College Event">College Event</option>
              <option value="Cultural Event">Cultural Event</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="select"
            >
              <option value="date">Sort by Date</option>
              <option value="venue">Sort by Venue</option>
            </select>
          </div>
        </div>

        {featuredEvents.length ? (
          <div className="workflow-grid">
            {featuredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewMap={() =>
                  navigate("/events/map", {
                    state: { eventId: event.id },
                  })
                }
                mapDisabled={!hasCoordinates(event)}
                actionLabel={normalizedRole === "Attendee" ? "Open Registration" : undefined}
                onAction={() => navigate("/events/college")}
                actionDisabled={
                  normalizedRole === "Attendee" && !!registrationMap[event.id]
                }
                footer={
                  normalizedRole === "Attendee" && registrationMap[event.id] ? (
                    <p className="soft-panel soft-panel--success">
                      Already registered. View your pass in My Registrations.
                    </p>
                  ) : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <p className="empty-state__title">No featured events match your filter.</p>
            <p className="empty-state__text">
              Adjust the event type or sort order to explore more options.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
