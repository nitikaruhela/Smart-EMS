export default function EventCard({
  event,
  actionLabel,
  onAction,
  actionDisabled = false,
  footer,
}) {
  return (
    <article className="glass-panel flex h-full flex-col justify-between p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              {event.eventType}
            </p>
            <h3 className="mt-2 font-display text-xl font-bold text-slate-950">
              {event.name}
            </h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {event.category || "Live Event"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Date</p>
            <p className="mt-2 font-semibold text-slate-800">{event.date}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Venue</p>
            <p className="mt-2 font-semibold text-slate-800">{event.venue}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {footer}
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="btn-primary w-full"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
