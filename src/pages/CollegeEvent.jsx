import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import EventCard from "../components/EventCard";
import QrScanner from "../components/QrScanner";
import { useAuth } from "../context/AuthContext";
import {
  createEvent,
  deleteEvent,
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
import { normalizeUserRole } from "../utils/userRole";

const MapPicker = lazy(() => import("../components/MapPicker"));
const MapModal = lazy(() => import("../components/MapModal"));

const emptyEvent = {
  name: "",
  date: "",
  venue: "",
  latitude: "",
  longitude: "",
  imageUrl: "",
  imageName: "",
};

const hasCoordinates = (event) =>
  Number.isFinite(Number.parseFloat(event.latitude)) &&
  Number.isFinite(Number.parseFloat(event.longitude));

const parseQrPayload = (rawPayload) => {
  const registrationId = rawPayload?.trim();

  if (!registrationId) {
    throw new Error("Invalid QR Code");
  }

  return registrationId;
};

const readEventImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to prepare the selected picture."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      image.onerror = () => reject(new Error("Selected file is not a valid image."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Unable to read the selected picture."));
    reader.readAsDataURL(file);
  });

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
  const [scanned, setScanned] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedMapEventId, setSelectedMapEventId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const refreshedQrRegistrationIdRef = useRef("");
  const normalizedRole = normalizeUserRole(role);

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

    if (normalizedRole === "Organizer") {
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

    if (normalizedRole === "Attendee") {
      unsubscribers.push(
        subscribeToRegistrationsByUser(user.uid, setMyRegistrations, (snapshotError) =>
          setError(snapshotError.message)
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
      normalizedRole !== "Attendee" ||
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
  }, [activeQr, isFirebaseConfigured, normalizedRole]);

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

  const handleImageChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const imageUrl = await readEventImage(selectedFile);
      setEventForm((current) => ({
        ...current,
        imageUrl,
        imageName: selectedFile.name,
      }));
      setFeedback("Event picture added successfully.");
    } catch (imageError) {
      setError(imageError.message || "Unable to add the event picture.");
    } finally {
      event.target.value = "";
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setEventForm((current) => ({
      ...current,
      imageUrl: "",
      imageName: "",
    }));
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      if (!user?.uid) {
        throw new Error("You must be logged in to create an event.");
      }

      if (normalizedRole !== "Organizer") {
        throw new Error("Only organizer accounts can create events.");
      }

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
        organizerRole: normalizedRole,
      });
      setEventForm(emptyEvent);
      setFeedback("College event created successfully.");
    } catch (submitError) {
      console.error("[CollegeEvent] Failed to create event.", submitError);
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
      if (!user?.uid || !user?.email) {
        throw new Error("You must be logged in to register for an event.");
      }

      if (normalizedRole !== "Attendee") {
        throw new Error("Only attendee accounts can register for events.");
      }

      const registrationPayload = {
        name: user.email.split("@")[0],
        email: user.email,
        attendeeId: user.uid,
        attendeeRole: normalizedRole,
        eventId: eventRecord.id,
        eventName: eventRecord.name,
        organizerId: eventRecord.organizerId || "",
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
      console.error("[CollegeEvent] Failed to register for event.", submitError);
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventRecord) => {
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      if (!user?.uid) {
        throw new Error("You must be logged in to delete an event.");
      }

      if (normalizedRole !== "Organizer") {
        throw new Error("Only organizer accounts can delete events.");
      }

      const shouldDelete = window.confirm(
        `Delete "${eventRecord.name}"? This will also remove all registrations for this event.`
      );

      if (!shouldDelete) {
        return;
      }

      await deleteEvent({
        eventId: eventRecord.id,
        organizerId: user.uid,
      });
      setFeedback("Event deleted successfully.");
    } catch (deleteError) {
      console.error("[CollegeEvent] Failed to delete event.", deleteError);
      setError(deleteError.message || "Unable to delete the event.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistration = async (registrationId) => {
    try {
      const registration = await getRegistrationById(registrationId);

      if (!registration?.eventId) {
        throw new Error("Registration is missing its event details.");
      }

      if (registration.checkedIn) {
        throw new Error("Already checked in");
      }

      return registration;
    } catch (fetchError) {
      if (fetchError.message === "Registration not found.") {
        throw new Error("Invalid QR Code");
      }

      throw fetchError;
    }
  };

  const markCheckIn = async (registration) => {
    const organizerEvent = myEvents.find((event) => event.id === registration.eventId);

    if (!organizerEvent) {
      throw new Error("This registration does not belong to one of your events.");
    }

    return markRegistrationCheckedIn({
      registrationId: registration.id,
      eventId: organizerEvent.id,
      organizerId: user.uid,
    });
  };

  const handleScan = async (scanResult) => {
    if (!scanResult?.text || scanned) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      if (!user?.uid) {
        throw new Error("You must be logged in as an organizer to scan entries.");
      }

      if (normalizedRole !== "Organizer") {
        throw new Error("Only organizer accounts can scan attendee QR codes.");
      }

      const registrationId = parseQrPayload(scanResult.text);
      const registration = await fetchRegistration(registrationId);
      await markCheckIn(registration);
      setScanned(true);
      setFeedback(`${registration.name} checked in successfully.`);
    } catch (scanError) {
      console.error("[CollegeEvent] Failed to process QR scan.", {
        code: scanError?.code || "unknown",
        message: scanError?.message || "Unknown scan error.",
        organizerId: user?.uid || "",
      });
      setError(scanError.message || "Unable to process QR code.");
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setError("");
    setFeedback("");
  };

  const attendeeRegistrations = myRegistrations.filter((item) =>
    events.some((event) => event.id === item.eventId)
  );
  const mapEvents = normalizedRole === "Organizer" ? myEvents : events;

  const openEventMap = (eventRecord) => {
    setSelectedMapEventId(eventRecord.id);
    setMapModalOpen(true);
  };

  return (
    <section className="page">
      <div className="section">
        <p className="eyebrow">College Event Module</p>
        <h1 className="page-title">
          {normalizedRole === "Organizer"
            ? "Create, manage, and verify college event attendance."
            : "Reserve your spot and keep your campus event pass ready."}
        </h1>
        <p className="page-subtitle">
          This workflow handles Firestore event storage, attendee registration, QR pass
          generation, and duplicate-safe check-ins.
        </p>
        {feedback ? <p className="alert alert--success">{feedback}</p> : null}
        {error ? <p className="alert alert--danger">{error}</p> : null}
        {!isFirebaseConfigured ? (
          <p className="alert alert--warning">
            Add Firebase configuration in `.env` to activate event creation, registration,
            and check-in persistence.
          </p>
        ) : null}
      </div>

      {normalizedRole === "Organizer" ? (
        <div className="planner-layout">
          <div className="section">
            <div className="card section">
              <p className="card-kicker">Organizer Tools</p>
              <h2 className="section-heading">
                {createMode ? "Create College Event" : "New College Event"}
              </h2>

              <form className="auth-form" onSubmit={handleCreateEvent}>
                <input
                  className="input"
                  name="name"
                  placeholder="Event name"
                  value={eventForm.name}
                  onChange={handleEventChange}
                  required
                />
                <input
                  className="input"
                  name="date"
                  type="date"
                  value={eventForm.date}
                  onChange={handleEventChange}
                  required
                />
                <input
                  className="input"
                  name="venue"
                  placeholder="Venue"
                  value={eventForm.venue}
                  onChange={handleEventChange}
                  required
                />
                <div className="section" style={{ gap: "12px" }}>
                  <label className="meta-label" htmlFor="event-picture">
                    Event Picture
                  </label>
                  <input
                    id="event-picture"
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading || !isFirebaseConfigured}
                  />
                  {eventForm.imageUrl ? (
                    <div className="soft-panel">
                      <div className="event-card__image-frame">
                        <img
                          src={eventForm.imageUrl}
                          alt="Event preview"
                          className="event-card__image"
                        />
                      </div>
                      <div className="list-card__row">
                        <p className="helper-text">
                          {eventForm.imageName || "Selected event picture"}
                        </p>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={handleRemoveImage}
                        >
                          Remove Picture
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="helper-text">
                      Add an optional picture to make the event card more visual.
                    </p>
                  )}
                </div>
                <Suspense
                  fallback={
                    <div className="card empty-state">
                      <p className="empty-state__title">Loading map picker...</p>
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
                  className="button button--primary"
                  disabled={loading || !isFirebaseConfigured}
                >
                  {loading ? "Saving..." : "Create Event"}
                </button>
              </form>
            </div>

            <div className="card section">
              <div className="section-header">
                <div>
                  <p className="card-kicker">QR Entry System</p>
                  <h2 className="section-heading">Live Check-In Scanner</h2>
                </div>
                <div className="filter-bar">
                  {scannerEnabled && scanned ? (
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={handleScanAgain}
                      disabled={!isFirebaseConfigured}
                    >
                      Scan Again
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      setScannerEnabled((current) => !current);
                      setScanned(false);
                      setError("");
                      setFeedback("");
                    }}
                    disabled={!isFirebaseConfigured}
                  >
                    {scannerEnabled ? "Stop Scanner" : "Start Scanner"}
                  </button>
                </div>
              </div>
              <p className="helper-text">
                Each QR code contains only the registration ID. The scanner fetches the
                Firestore registration, validates it, and records the check-in.
              </p>
              {scannerEnabled ? (
                <QrScanner onResult={handleScan} paused={scanned} />
              ) : (
                <div className="card empty-state">
                  <p className="empty-state__title">Scanner is paused.</p>
                  <p className="empty-state__text">
                    Enable the scanner to validate attendee entry at the venue gate.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <h2 className="section-heading">Your College Events</h2>
            {myEvents.length ? (
              <div className="card-grid">
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
                      secondaryActionLabel="Delete Event"
                      onSecondaryAction={() => handleDeleteEvent(event)}
                      secondaryActionDisabled={loading || !isFirebaseConfigured}
                      secondaryActionTone="danger"
                      footer={
                        <div className="stat-grid">
                          <div className="stat-block">
                            <p className="meta-label">Registrations</p>
                            <p className="stat-block__value">{registrationsForEvent.length}</p>
                          </div>
                          <div className="stat-block">
                            <p className="meta-label">Checked In</p>
                            <p className="stat-block__value">
                              {
                                registrationsForEvent.filter(
                                  (registration) => registration.checkedIn
                                ).length
                              }
                            </p>
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="card empty-state">
                <p className="empty-state__title">No college events yet.</p>
                <p className="empty-state__text">
                  Create your first one to open registrations.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : normalizedRole === "Attendee" ? (
        <div className="planner-layout">
          <div className="section">
            <h2 className="section-heading">Available College Events</h2>
            {events.length ? (
              <div className="card-grid">
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
                        <div className="soft-panel soft-panel--success">
                          Your pass has already been generated for this event.
                        </div>
                      ) : (
                        <div className="soft-panel">
                          Join now to generate a personal QR pass for entry.
                        </div>
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="card empty-state">
                <p className="empty-state__title">No college events are available yet.</p>
              </div>
            )}
          </div>

          <div className="section">
            <div className="card section">
              <p className="card-kicker">QR Pass</p>
              <h2 className="section-heading">
                {activeQr ? "Latest Registration Pass" : "Select an Event to Generate a Pass"}
              </h2>
              {activeQr ? (
                <div className="section">
                  <div className="map-frame">
                    <img
                      src={activeQr.qrCode}
                      alt="Registration QR Code"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="soft-panel">
                    <p className="empty-state__title">{activeQr.eventName}</p>
                    <p>{activeQr.email}</p>
                  </div>
                </div>
              ) : (
                <p className="empty-state__text">
                  Your most recent college event registration will appear here for quick
                  access.
                </p>
              )}
            </div>

            <div className="card section">
              <p className="card-kicker">My College Registrations</p>
              <h2 className="section-heading">Registration Status</h2>
              <div className="nearby-list">
                {attendeeRegistrations.length ? (
                  attendeeRegistrations.map((registration) => (
                    <div key={registration.id} className="card list-card">
                      <div className="list-card__row">
                        <div>
                          <p className="empty-state__title">{registration.eventName}</p>
                          <p className="helper-text">{registration.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveQr(registration)}
                          className="button button--secondary"
                        >
                          View QR
                        </button>
                      </div>
                      <p
                        className={`status-badge ${
                          registration.checkedIn
                            ? "status-badge--success"
                            : "status-badge--warning"
                        }`}
                      >
                        {registration.checkedIn ? "Checked In" : "Pending Check-In"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="empty-state__text">
                    You have not registered for a college event yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card empty-state">
          <p className="empty-state__title">Your account role is missing or invalid.</p>
          <p className="empty-state__text">
            Sign out and sign back in to repair the profile before using event workflows.
          </p>
        </div>
      )}

      {mapModalOpen ? (
        <Suspense
          fallback={
            <div className="map-modal">
              <div className="card modal-loading">
                <p className="empty-state__title">Loading event map...</p>
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
