import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

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
    onError
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
    onError
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
    onError
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
    onError
  );
}

export async function createEvent(payload) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  return addDoc(collection(db, "events"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function registerForEvent(payload) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  const existingRegistrationQuery = query(
    collection(db, "registrations"),
    where("attendeeId", "==", payload.attendeeId),
    where("eventId", "==", payload.eventId)
  );
  const existingRegistration = await getDocs(existingRegistrationQuery);

  // This keeps the QR pass unique even if the attendee retries from another session.
  if (!existingRegistration.empty) {
    throw new Error("You are already registered for this event.");
  }

  return addDoc(collection(db, "registrations"), {
    ...payload,
    checkedIn: false,
    registeredAt: serverTimestamp(),
  });
}

export async function markRegistrationCheckedIn(registrationId) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  const registrationRef = doc(db, "registrations", registrationId);

  return runTransaction(db, async (transaction) => {
    const registrationSnapshot = await transaction.get(registrationRef);

    if (!registrationSnapshot.exists()) {
      throw new Error("Registration not found.");
    }

    const registration = registrationSnapshot.data();

    // Transactions ensure two scanners cannot check in the same attendee twice.
    if (registration.checkedIn) {
      throw new Error("This attendee has already checked in.");
    }

    transaction.update(registrationRef, {
      checkedIn: true,
      checkedInAt: serverTimestamp(),
    });
  });
}

export async function updateRegistrationQr(registrationId, qrCode) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  return updateDoc(doc(db, "registrations", registrationId), { qrCode });
}

export async function getRegistrationById(registrationId) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  const snapshot = await getDoc(doc(db, "registrations", registrationId));

  if (!snapshot.exists()) {
    throw new Error("Registration not found.");
  }

  return { id: snapshot.id, ...snapshot.data() };
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
