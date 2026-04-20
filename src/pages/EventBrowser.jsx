import { useState } from "react";

const sampleEvents = [
  {
    id: 1,
    title: "Tech Innovators Summit",
    date: "May 12, 2026",
    location: "Bengaluru Convention Center",
    description:
      "A full-day conference featuring startup founders, product leaders, and hands-on workshops about AI, design systems, and scaling software teams.",
    type: "Conference",
  },
  {
    id: 2,
    title: "Campus Music Night",
    date: "June 3, 2026",
    location: "North Lawn Amphitheatre",
    description:
      "An evening of live student performances, food stalls, and open-air seating with a relaxed festival atmosphere for the entire campus.",
    type: "Concert",
  },
  {
    id: 3,
    title: "Art and Culture Expo",
    date: "July 18, 2026",
    location: "City Arts Pavilion",
    description:
      "Explore gallery installations, cultural performances, and creative showcases from local artists, design students, and community groups.",
    type: "Exhibition",
  },
];

export default function EventBrowser() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (eventItem) => {
    setSelectedEvent(eventItem);
  };

  const openModal = () => {
    if (selectedEvent) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section className="page">
      <div className="card browser-hero">
        <div className="section">
          <p className="eyebrow">Interactive Event Browser</p>
          <h1 className="page-title">
            Explore multiple events and open their details in one click.
          </h1>
          <p className="page-subtitle">
            This in-app browser uses sample event data, clickable cards, and a detail panel
            with an optional modal view.
          </p>
        </div>
        <span className="pill pill--brand">
          {sampleEvents.length} event{sampleEvents.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="planner-layout">
        <div className="section">
          <div className="section-header">
            <div className="section-header__copy">
              <p className="card-kicker">Upcoming List</p>
              <h2 className="section-heading">Clickable Events</h2>
            </div>
          </div>

          <div className="card-grid">
            {sampleEvents.map((eventItem) => (
              <button
                key={eventItem.id}
                type="button"
                className={`event-browser-card ${
                  selectedEvent?.id === eventItem.id ? "event-browser-card--active" : ""
                }`}
                onClick={() => handleEventClick(eventItem)}
              >
                <div className="event-browser-card__top">
                  <div>
                    <p className="event-card__eyebrow">{eventItem.type}</p>
                    <h3 className="event-card__title">{eventItem.title}</h3>
                  </div>
                  <span className="event-card__tag">{eventItem.date}</span>
                </div>
                <p className="helper-text">{eventItem.location}</p>
                <p className="card-copy">{eventItem.description}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="card section">
          <p className="card-kicker">Event Details</p>
          <h2 className="section-heading">
            {selectedEvent ? selectedEvent.title : "Select an event"}
          </h2>
          <p className="card-copy">
            {selectedEvent
              ? selectedEvent.description
              : "Click any event card to show the title, date, location, and description here."}
          </p>

          <div className="stat-grid">
            <div className="stat-block">
              <p className="meta-label">Date</p>
              <p className="stat-block__value">{selectedEvent?.date || "--"}</p>
            </div>
            <div className="stat-block">
              <p className="meta-label">Location</p>
              <p className="stat-block__value">{selectedEvent?.location || "--"}</p>
            </div>
          </div>

          <button
            type="button"
            className="button button--primary"
            onClick={openModal}
            disabled={!selectedEvent}
          >
            Open Modal View
          </button>
        </aside>
      </div>

      {isModalOpen && selectedEvent ? (
        <div className="map-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
          <div className="card browser-modal">
            <div className="section-header">
              <div>
                <p className="card-kicker">Modal Details</p>
                <h2 className="section-heading" id="event-modal-title">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                type="button"
                className="button button--secondary"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <p className="card-copy">{selectedEvent.description}</p>
            <div className="stat-grid">
              <div className="stat-block">
                <p className="meta-label">Date</p>
                <p className="stat-block__value">{selectedEvent.date}</p>
              </div>
              <div className="stat-block">
                <p className="meta-label">Location</p>
                <p className="stat-block__value">{selectedEvent.location}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
