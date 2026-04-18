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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="glass-panel flex h-[85vh] w-full max-w-6xl flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              Event Map
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">
            Close
          </button>
        </div>

        <EventMap
          events={events}
          selectedEventId={selectedEventId}
          centerEventId={selectedEventId}
          heightClass="h-full"
        />
      </div>
    </div>
  );
}
