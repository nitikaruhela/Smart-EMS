// Sample event data stored as an array of objects.
const events = [
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

const eventList = document.getElementById("event-list");
const eventCount = document.getElementById("event-count");
const detailTitle = document.getElementById("detail-title");
const detailDate = document.getElementById("detail-date");
const detailLocation = document.getElementById("detail-location");
const detailDescription = document.getElementById("detail-description");
const openModalButton = document.getElementById("open-modal-button");

const modal = document.getElementById("event-modal");
const modalTitle = document.getElementById("modal-title");
const modalDate = document.getElementById("modal-date");
const modalLocation = document.getElementById("modal-location");
const modalDescription = document.getElementById("modal-description");
const closeModalButton = document.getElementById("close-modal-button");
const modalBackdrop = document.getElementById("modal-backdrop");

let selectedEvent = null;

// Render all event cards into the page.
function renderEvents() {
  eventList.innerHTML = "";
  eventCount.textContent = `${events.length} Events`;

  events.forEach((eventItem) => {
    const card = document.createElement("article");
    card.className = "event-card";
    card.tabIndex = 0;
    card.dataset.eventId = eventItem.id;
    card.innerHTML = `
      <div class="event-card__top">
        <div>
          <h3 class="event-card__title">${eventItem.title}</h3>
          <p class="event-card__date">${eventItem.date}</p>
        </div>
        <span class="event-card__pill">${eventItem.type}</span>
      </div>
      <p class="event-card__copy">${eventItem.description}</p>
    `;

    // Use addEventListener("click") to open event details.
    card.addEventListener("click", function () {
      showEventDetails(eventItem);
    });

    card.addEventListener("keydown", function (keyboardEvent) {
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        showEventDetails(eventItem);
      }
    });

    eventList.appendChild(card);
  });
}

// Update the side detail panel with the selected event.
function showEventDetails(eventItem) {
  selectedEvent = eventItem;

  detailTitle.textContent = eventItem.title;
  detailDate.textContent = eventItem.date;
  detailLocation.textContent = eventItem.location;
  detailDescription.textContent = eventItem.description;
  openModalButton.disabled = false;

  document.querySelectorAll(".event-card").forEach((card) => {
    const isActive = Number(card.dataset.eventId) === eventItem.id;
    card.classList.toggle("event-card--active", isActive);
  });
}

// Populate and open the modal with the current event.
function openModal() {
  if (!selectedEvent) {
    return;
  }

  modalTitle.textContent = selectedEvent.title;
  modalDate.textContent = selectedEvent.date;
  modalLocation.textContent = selectedEvent.location;
  modalDescription.textContent = selectedEvent.description;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

openModalButton.addEventListener("click", openModal);
closeModalButton.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", function (keyboardEvent) {
  if (keyboardEvent.key === "Escape") {
    closeModal();
  }
});

renderEvents();
