export default function EventCard({
  event,
  actionLabel,
  onAction,
  actionDisabled = false,
  onViewMap,
  mapDisabled = false,
  mapLabel = "View on Map",
  footer,
}) {
  return (
    <article className="card card--interactive event-card">
      <div className="event-card__body">
        <div className="event-card__top">
          <div>
            <p className="event-card__eyebrow">{event.eventType}</p>
            <h3 className="event-card__title">{event.name}</h3>
          </div>
          <span className="event-card__tag">{event.category || "Live Event"}</span>
        </div>

        <div className="event-card__meta-grid">
          <div className="meta-card">
            <p className="meta-label">Date</p>
            <p className="meta-card__value">{event.date}</p>
          </div>
          <div className="meta-card">
            <p className="meta-label">Venue</p>
            <p className="meta-card__value">{event.venue}</p>
          </div>
        </div>
      </div>

      <div className="event-card__footer">
        {footer}
        {actionLabel || onViewMap ? (
          <div className="event-card__actions">
            {onViewMap ? (
              <button
                type="button"
                onClick={onViewMap}
                disabled={mapDisabled}
                className="button button--secondary"
              >
                {mapLabel}
              </button>
            ) : null}
            {actionLabel ? (
              <button
                type="button"
                onClick={onAction}
                disabled={actionDisabled}
                className="button button--primary"
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
