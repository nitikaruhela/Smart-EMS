import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import EventCard from "../components/EventCard";
import QrScanner from "../components/QrScanner";
import { useAuth } from "../context/AuthContext";
import {
  createEvent,
  getRegistrationById,
  markRegistrationCheckedIn,
  registerForEvent,
  subscribeToEvents,
  subscribeToEventsByOrganizer,
  subscribeToRegistrationsByUser,
  subscribeToRegistrationsForEvents,
  updateRegistrationQr,
} from "../services/eventService";
import { generateRegistrationQrCode } from "../utils/qrGenerator";

const MapPicker = lazy(() => import("../components/MapPicker"));
const MapModal = lazy(() => import("../components/MapModal"));

const emptyEvent = {
  name: "",
  date: "",
  venue: "",
  latitude: "",
  longitude: "",
};

const hasCoordinates = (event) =>
  Number.isFinite(Number.parseFloat(event.latitude)) &&
  Number.isFinite(Number.parseFloat(event.longitude));

const getRegistrationIdFromQrPayload = (rawPayload) => {
  const payload = JSON.parse(rawPayload);

  if (payload?.registrationId) {
    return payload.registrationId;
  }

  if (payload?.r) {
    return payload.r;
  }

  throw new Error("Invalid QR code. Registration ID is missing.");
};

export default function CollegeEvent({ createMode = false }) {
  const { user, role, isFirebaseConfigured } = useAuth();
  const location = useLocation();
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [activeQr, setActiveQr] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedMapEventId, setSelectedMapEventId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const refreshedQrRegistrationIdRef = useRef("");

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const unsubscribers = [
      subscribeToEvents(
        (allEvents) =>
          setEvents(allEvents.filter((event) => event.eventType === "College Event")),
        (snapshotError) => setError(snapshotError.message)
      ),
    ];

    if (role === "Organizer") {
      unsubscribers.push(
        subscribeToEventsByOrganizer(
          user.uid,
          (organizerEvents) =>
            setMyEvents(
              organizerEvents.filter((event) => event.eventType === "College Event")
            ),
          (snapshotError) => setError(snapshotError.message)
        )
      );
    }

    if (role === "Attendee") {
      unsubscribers.push(
        subscribeToRegistrationsByUser(user.uid, setMyRegistrations, (snapshotError) =>
          setError(snapshotError.message)
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
    if (!location.state?.registrationId) {
      return;
    }

    const matchedRegistration = myRegistrations.find(
      (registration) => registration.id === location.state.registrationId
    );

    if (matchedRegistration) {
      setActiveQr(matchedRegistration);
    }
  }, [location.state, myRegistrations]);

  useEffect(() => {
    if (
      role !== "Attendee" ||
      !isFirebaseConfigured ||
      !activeQr?.id ||
      !activeQr.attendeeId ||
      refreshedQrRegistrationIdRef.current === activeQr.id
    ) {
      return;
    }

    let isMounted = true;

    const refreshQrCode = async () => {
      try {
        const refreshedQrCode = await generateRegistrationQrCode({
          registrationId: activeQr.id,
          attendeeId: activeQr.attendeeId,
          eventId: activeQr.eventId,
        });

        refreshedQrRegistrationIdRef.current = activeQr.id;

        if (activeQr.qrCode !== refreshedQrCode) {
          await updateRegistrationQr(activeQr.id, refreshedQrCode);
        }

        if (isMounted) {
          setActiveQr((current) =>
            current?.id === activeQr.id ? { ...current, qrCode: refreshedQrCode } : current
          );
        }
      } catch (refreshError) {
        if (isMounted) {
          setError(refreshError.message || "Unable to refresh the QR code.");
        }
      }
    };

    refreshQrCode();

    return () => {
      isMounted = false;
    };
  }, [activeQr, isFirebaseConfigured, role]);

  const registrationMap = useMemo(() => {
    return myRegistrations.reduce((accumulator, registration) => {
      accumulator[registration.eventId] = registration;
      return accumulator;
    }, {});
  }, [myRegistrations]);

  const handleEventChange = (event) => {
    setEventForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const latitude = Number.parseFloat(eventForm.latitude);
      const longitude = Number.parseFloat(eventForm.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Please provide valid latitude and longitude values.");
      }

      await createEvent({
        ...eventForm,
        latitude,
        longitude,
        category: "Campus Experience",
        eventType: "College Event",
        organizerId: user.uid,
        organizerEmail: user.email,
      });
      setEventForm(emptyEvent);
      setFeedback("College event created successfully.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (latitude, longitude) => {
    setEventForm((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  };

  const handleRegister = async (eventRecord) => {
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const registrationPayload = {
        name: user.email.split("@")[0],
        email: user.email,
        attendeeId: user.uid,
        eventId: eventRecord.id,
        eventName: eventRecord.name,
      };

      const registrationRef = await registerForEvent(registrationPayload);
      const qrCode = await generateRegistrationQrCode({
        registrationId: registrationRef.id,
        attendeeId: user.uid,
        eventId: eventRecord.id,
      });
      await updateRegistrationQr(registrationRef.id, qrCode);
      setActiveQr({
        ...registrationPayload,
        id: registrationRef.id,
        qrCode,
        checkedIn: false,
      });
      setFeedback("Registration completed. Your QR pass is ready.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (scanResult) => {
    if (!scanResult?.text) {
      return;
    }

    setScannerEnabled(false);
    setError("");
    setFeedback("");

    try {
      const registrationId = getRegistrationIdFromQrPayload(scanResult.text);
      const registration = await getRegistrationById(registrationId);
      await markRegistrationCheckedIn(registration.id);
      setFeedback(`${registration.name} checked in successfully.`);
    } catch (scanError) {
      setError(scanError.message || "Unable to process QR code.");
    }
  };

  const attendeeRegistrations = myRegistrations.filter((item) =>
    events.some((event) => event.id === item.eventId)
  );
  const mapEvents = role === "Organizer" ? myEvents : events;

  const openEventMap = (eventRecord) => {
    setSelectedMapEventId(eventRecord.id);
    setMapModalOpen(true);
  };

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">
          College Event Module
        </p>
        <h1 className="font-display text-4xl font-bold text-slate-950">
          {role === "Organizer"
            ? "Create, manage, and verify college event attendance."
            : "Reserve your spot and keep your campus event pass ready."}
        </h1>
        <p className="text-lg text-slate-600">
          This workflow handles Firestore event storage, attendee registration, QR pass
          generation, and duplicate-safe check-ins.
        </p>
        {feedback ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {feedback}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
        ) : null}
        {!isFirebaseConfigured ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Add Firebase configuration in `.env` to activate event creation, registration,
            and check-in persistence.
          </p>
        ) : null}
      </div>

      {role === "Organizer" ? (
        <div className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                Organizer Tools
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                {createMode ? "Create College Event" : "New College Event"}
              </h2>

              <form className="mt-6 space-y-4" onSubmit={handleCreateEvent}>
                <input
                  className="input-field"
                  name="name"
                  placeholder="Event name"
                  value={eventForm.name}
                  onChange={handleEventChange}
                  required
                />
                <input
                  className="input-field"
                  name="date"
                  type="date"
                  value={eventForm.date}
                  onChange={handleEventChange}
                  required
                />
                <input
                  className="input-field"
                  name="venue"
                  placeholder="Venue"
                  value={eventForm.venue}
                  onChange={handleEventChange}
                  required
                />
                <Suspense
                  fallback={
                    <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      Loading map picker...
                    </div>
                  }
                >
                  <MapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={
                      eventForm.latitude && eventForm.longitude
                        ? [eventForm.latitude, eventForm.longitude]
                        : null
                    }
                  />
                </Suspense>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || !isFirebaseConfigured}
                >
                  {loading ? "Saving..." : "Create Event"}
                </button>
              </form>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                    QR Entry System
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                    Live Check-In Scanner
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setScannerEnabled((current) => !current)}
                  disabled={!isFirebaseConfigured}
                >
                  {scannerEnabled ? "Stop Scanner" : "Start Scanner"}
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Each QR payload carries a registration ID. Firestore transactions prevent
                duplicate check-ins automatically.
              </p>
              {scannerEnabled ? (
                <div className="mt-6 overflow-hidden rounded-3xl">
                  <QrScanner onResult={handleScan} />
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  Enable the scanner to validate attendee entry at the venue gate.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Your College Events
            </h2>
            {myEvents.length ? (
              <div className="grid gap-6">
                {myEvents.map((event) => {
                  const registrationsForEvent = eventRegistrations.filter(
                    (registration) => registration.eventId === event.id
                  );

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      onViewMap={() => openEventMap(event)}
                      mapDisabled={!hasCoordinates(event)}
                      footer={
                        <div className="space-y-3">
                          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            Registrations: {registrationsForEvent.length}
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            Checked-in:{" "}
                            {
                              registrationsForEvent.filter(
                                (registration) => registration.checkedIn
                              ).length
                            }
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel p-6 text-slate-500">
                No college events yet. Create your first one to open registrations.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Available College Events
            </h2>
            {events.length ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onViewMap={() => openEventMap(event)}
                    mapDisabled={!hasCoordinates(event)}
                    actionLabel={
                      registrationMap[event.id] ? "Already Registered" : "Register Now"
                    }
                    actionDisabled={
                      loading || !isFirebaseConfigured || Boolean(registrationMap[event.id])
                    }
                    onAction={() => handleRegister(event)}
                    footer={
                      registrationMap[event.id] ? (
                        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          Your pass has already been generated for this event.
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          Join now to generate a personal QR pass for entry.
                        </div>
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-6 text-slate-500">
                No college events are available yet.
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">QR Pass</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                {activeQr ? "Latest Registration Pass" : "Select an Event to Generate a Pass"}
              </h2>
              {activeQr ? (
                <div className="mt-6 space-y-4">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
                    <img
                      src={activeQr.qrCode}
                      alt="Registration QR Code"
                      className="mx-auto w-full max-w-sm"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">{activeQr.eventName}</p>
                    <p>{activeQr.email}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Your most recent college event registration will appear here for quick
                  access.
                </p>
              )}
            </div>

            <div className="glass-panel p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                My College Registrations
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                Registration Status
              </h2>
              <div className="mt-6 space-y-3">
                {attendeeRegistrations.length ? (
                  attendeeRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{registration.eventName}</p>
                          <p className="mt-1 text-sm text-slate-500">{registration.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveQr(registration)}
                          className="btn-secondary px-4 py-2"
                        >
                          View QR
                        </button>
                      </div>
                      <p
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          registration.checkedIn
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {registration.checkedIn ? "Checked In" : "Pending Check-In"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    You have not registered for a college event yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mapModalOpen ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
              <div className="glass-panel w-full max-w-xl p-6 text-center text-slate-600">
                Loading event map...
              </div>
            </div>
          }
        >
          <MapModal
            isOpen={mapModalOpen}
            onClose={() => setMapModalOpen(false)}
            events={mapEvents}
            selectedEventId={selectedMapEventId}
            title="College Event Locations"
          />
        </Suspense>
      ) : null}
    </section>
  );
}
