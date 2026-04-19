import { useEffect } from "react";
import EventMap from "./EventMap";

export default function MapModal({
  isOpen,
  onClose,
  events = [],
  selectedEventId = null,
  title = "Event Locations",
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="map-modal">
      <div className="card map-modal__dialog">
        <div className="map-modal__header">
          <div>
            <p className="eyebrow">Event Map</p>
            <h2 className="section-heading">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="button button--secondary">
            Close
          </button>
        </div>

        <EventMap
          events={events}
          selectedEventId={selectedEventId}
          centerEventId={selectedEventId}
          heightClass="map-height-full"
        />
      </div>
    </div>
  );
}
