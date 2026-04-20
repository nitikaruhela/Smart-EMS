import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { normalizeUserRole } from "../utils/userRole";

const venueRecommendations = [
  {
    id: "venue-1",
    name: "Riverfront Cultural Hall",
    city: "Mumbai",
    capacity: 150,
    price: 35000,
    vibe: "Modern indoor venue with stage lighting and easy transit access.",
  },
  {
    id: "venue-2",
    name: "Palm Grove Pavilion",
    city: "Bengaluru",
    capacity: 300,
    price: 60000,
    vibe: "Open-air pavilion ideal for performances and food stalls.",
  },
  {
    id: "venue-3",
    name: "Heritage Courtyard",
    city: "Jaipur",
    capacity: 120,
    price: 28000,
    vibe: "Traditional courtyard with decor-friendly architecture.",
  },
  {
    id: "venue-4",
    name: "City Arts Forum",
    city: "Delhi",
    capacity: 220,
    price: 50000,
    vibe: "Premium auditorium with breakout rooms and AV support.",
  },
];

export const eventTypes = [
  "College Event",
  "Cultural Event",
  "Wedding",
  "Birthday",
  "Anniversary",
];

function logFirestoreError(scope, error, metadata) {
  console.error(`[Firestore] ${scope} failed.`, {
    code: error?.code || "unknown",
    message: error?.message || "Unknown Firestore error.",
    ...(metadata || {}),
  });
}

function createFriendlyFirestoreError(error, fallbackMessage) {
  if (error?.code === "permission-denied") {
    return new Error(
      `${fallbackMessage} Firestore denied the request. Confirm the signed-in account, organizer ownership, and your current rules.`
    );
  }

  return new Error(error?.message || fallbackMessage);
}

function normalizeEventPayload(payload) {
  return {
    name: payload.name?.trim() || "",
    date: payload.date || "",
    venue: payload.venue?.trim() || "",
    latitude: Number.parseFloat(payload.latitude),
    longitude: Number.parseFloat(payload.longitude),
    category: payload.category?.trim() || "",
    eventType: payload.eventType?.trim() || "",
    organizerId: payload.organizerId?.trim() || "",
    organizerEmail: payload.organizerEmail?.trim() || "",
    organizerRole: normalizeUserRole(payload.organizerRole, "Organizer"),
    imageUrl: payload.imageUrl || "",
  };
}

function normalizeRegistrationPayload(payload) {
  return {
    name: payload.name?.trim() || "",
    email: payload.email?.trim() || "",
    attendeeId: payload.attendeeId?.trim() || "",
    attendeeRole: normalizeUserRole(payload.attendeeRole, "Attendee"),
    eventId: payload.eventId?.trim() || "",
    eventName: payload.eventName?.trim() || "",
    organizerId: payload.organizerId?.trim() || "",
  };
}

function normalizeRegistrationCheckInPayload(payload) {
  return {
    registrationId: payload?.registrationId?.trim() || "",
    eventId: payload?.eventId?.trim() || "",
    organizerId: payload?.organizerId?.trim() || "",
  };
}

function validateEventPayload(payload) {
  if (!payload.name || !payload.date || !payload.venue) {
    throw new Error("Event name, date, and venue are required.");
  }

  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
    throw new Error("Event location is invalid.");
  }

  if (!payload.organizerId || !payload.organizerEmail) {
    throw new Error("Organizer details are missing.");
  }

  if (payload.organizerRole !== "Organizer") {
    throw new Error("Only organizer accounts can create events.");
  }
}

function validateRegistrationPayload(payload) {
  if (!payload.name || !payload.email || !payload.attendeeId) {
    throw new Error("Attendee details are missing.");
  }

  if (!payload.eventId || !payload.eventName) {
    throw new Error("Event details are missing.");
  }

  if (payload.attendeeRole !== "Attendee") {
    throw new Error("Only attendee accounts can register for events.");
  }
}

function validateRegistrationCheckInPayload(payload) {
  if (!payload.registrationId) {
    throw new Error("Registration ID is missing.");
  }

  if (!payload.eventId) {
    throw new Error("Event ID is missing.");
  }

  if (!payload.organizerId) {
    throw new Error("Organizer ID is missing.");
  }
}

export function subscribeToEvents(callback, onError) {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));
  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(events);
    },
    (error) => {
      logFirestoreError("subscribeToEvents", error);
      onError?.(error);
    }
  );
}

export function subscribeToEventsByOrganizer(organizerId, callback, onError) {
  if (!isFirebaseConfigured || !organizerId) {
    callback([]);
    return () => {};
  }

  const eventsQuery = query(
    collection(db, "events"),
    where("organizerId", "==", organizerId)
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      callback(events);
    },
    (error) => {
      logFirestoreError("subscribeToEventsByOrganizer", error, { organizerId });
      onError?.(error);
    }
  );
}

export function subscribeToRegistrationsByUser(userId, callback, onError) {
  if (!isFirebaseConfigured || !userId) {
    callback([]);
    return () => {};
  }

  const registrationsQuery = query(
    collection(db, "registrations"),
    where("attendeeId", "==", userId)
  );

  return onSnapshot(
    registrationsQuery,
    (snapshot) => {
      const registrations = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(registrations);
    },
    (error) => {
      logFirestoreError("subscribeToRegistrationsByUser", error, { userId });
      onError?.(error);
    }
  );
}

export function subscribeToRegistrationsForEvents(eventIds, callback, onError) {
  if (!isFirebaseConfigured || !eventIds?.length) {
    callback([]);
    return () => {};
  }

  const registrationsQuery = query(
    collection(db, "registrations"),
    where("eventId", "in", eventIds.slice(0, 10))
  );

  return onSnapshot(
    registrationsQuery,
    (snapshot) => {
      const registrations = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(registrations);
    },
    (error) => {
      logFirestoreError("subscribeToRegistrationsForEvents", error, { eventIds });
      onError?.(error);
    }
  );
}

export async function createEvent(payload) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  try {
    const normalizedPayload = normalizeEventPayload(payload);
    validateEventPayload(normalizedPayload);

    return await addDoc(collection(db, "events"), {
      ...normalizedPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logFirestoreError("createEvent", error, {
      organizerId: payload?.organizerId,
      eventType: payload?.eventType,
    });
    throw createFriendlyFirestoreError(error, "Unable to create the event.");
  }
}

export async function deleteEvent({ eventId, organizerId }) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  if (!eventId) {
    throw new Error("Event ID is missing.");
  }

  if (!organizerId) {
    throw new Error("Organizer details are missing.");
  }

  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnapshot = await getDoc(eventRef);

    if (!eventSnapshot.exists()) {
      throw new Error("Event not found.");
    }

    const eventData = eventSnapshot.data();

    if (eventData.organizerId !== organizerId) {
      throw new Error("You can only delete your own events.");
    }

    const registrationsQuery = query(
      collection(db, "registrations"),
      where("eventId", "==", eventId)
    );
    const registrationsSnapshot = await getDocs(registrationsQuery);
    const batch = writeBatch(db);

    registrationsSnapshot.forEach((registrationDoc) => {
      batch.delete(registrationDoc.ref);
    });
    batch.delete(eventRef);

    await batch.commit();
  } catch (error) {
    logFirestoreError("deleteEvent", error, { eventId, organizerId });
    throw createFriendlyFirestoreError(error, "Unable to delete the event.");
  }
}

export async function registerForEvent(payload) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  try {
    const normalizedPayload = normalizeRegistrationPayload(payload);
    validateRegistrationPayload(normalizedPayload);

    const existingRegistrationQuery = query(
      collection(db, "registrations"),
      where("attendeeId", "==", normalizedPayload.attendeeId),
      where("eventId", "==", normalizedPayload.eventId)
    );
    const existingRegistration = await getDocs(existingRegistrationQuery);

    // This keeps the QR pass unique even if the attendee retries from another session.
    if (!existingRegistration.empty) {
      throw new Error("You are already registered for this event.");
    }

    return await addDoc(collection(db, "registrations"), {
      ...normalizedPayload,
      checkedIn: false,
      registeredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logFirestoreError("registerForEvent", error, {
      attendeeId: payload?.attendeeId,
      eventId: payload?.eventId,
    });
    throw createFriendlyFirestoreError(error, "Unable to register for this event.");
  }
}

export async function markRegistrationCheckedIn(payload) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  const normalizedPayload = normalizeRegistrationCheckInPayload(payload);
  validateRegistrationCheckInPayload(normalizedPayload);
  const registrationRef = doc(db, "registrations", normalizedPayload.registrationId);

  try {
    const registrationSnapshot = await getDoc(registrationRef);

    if (!registrationSnapshot.exists()) {
      throw new Error("Invalid QR Code");
    }

    const registration = registrationSnapshot.data();

    if (!registration.eventId) {
      throw new Error("Registration is missing its event details.");
    }

    if (registration.eventId !== normalizedPayload.eventId) {
      throw new Error("Scanned registration does not belong to this event.");
    }

    if (
      registration.organizerId &&
      registration.organizerId !== normalizedPayload.organizerId
    ) {
      throw new Error("You can only check in registrations for your own event.");
    }

    if (registration.checkedIn) {
      throw new Error("Already checked in");
    }

    await updateDoc(registrationRef, {
      checkedIn: true,
      checkedInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: registrationSnapshot.id, ...registration, checkedIn: true };
  } catch (error) {
    logFirestoreError("markRegistrationCheckedIn", error, normalizedPayload);
    throw createFriendlyFirestoreError(error, "Unable to check in this registration.");
  }
}

export async function updateRegistrationQr(registrationId, qrCode) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  try {
    return await updateDoc(doc(db, "registrations", registrationId), {
      qrCode,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logFirestoreError("updateRegistrationQr", error, { registrationId });
    throw createFriendlyFirestoreError(error, "Unable to update the registration QR code.");
  }
}

export async function getRegistrationById(registrationId) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  try {
    const snapshot = await getDoc(doc(db, "registrations", registrationId));

    if (!snapshot.exists()) {
      throw new Error("Registration not found.");
    }

    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    logFirestoreError("getRegistrationById", error, { registrationId });
    throw createFriendlyFirestoreError(error, "Unable to fetch the registration.");
  }
}

export function getVenueRecommendations({ location, attendees, budget }) {
  return venueRecommendations.filter((venue) => {
    const normalizedLocation = location.trim().toLowerCase();
    const locationMatch = normalizedLocation
      ? venue.city.toLowerCase().includes(normalizedLocation)
      : true;

    return (
      locationMatch &&
      venue.capacity >= Number(attendees || 0) &&
      venue.price <= Number(budget || 0)
    );
  });
}
