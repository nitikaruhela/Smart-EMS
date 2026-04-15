import { Link } from "react-router-dom";
import { eventTypes } from "../services/eventService";

const eventRoutes = {
  "College Event": "/events/college",
  "Cultural Event": "/events/cultural",
  Wedding: "/dashboard",
  Birthday: "/dashboard",
  Anniversary: "/dashboard",
};

export default function EventSelection() {
  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">
          Dynamic Workflows
        </p>
        <h1 className="font-display text-4xl font-bold text-slate-950">
          Choose an event type and move into the workflow built for it.
        </h1>
        <p className="text-lg text-slate-600">
          College events unlock registration and QR check-ins. Cultural events open the
          venue recommendation planner. Other event types are ready for future workflow
          expansion inside the shared dashboard foundation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {eventTypes.map((eventType) => {
          const route = eventRoutes[eventType];
          const isReady =
            route !== "/dashboard" ||
            eventType === "College Event" ||
            eventType === "Cultural Event";

          return (
            <Link
              key={eventType}
              to={route}
              className="glass-panel group flex min-h-[220px] flex-col justify-between p-6 transition hover:-translate-y-1"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
                  {isReady ? "Ready Workflow" : "Foundation Ready"}
                </p>
                <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">
                  {eventType}
                </h2>
                <p className="mt-4 text-slate-600">
                  {eventType === "College Event" &&
                    "Create campus events, register attendees, and run QR-powered entry."}
                  {eventType === "Cultural Event" &&
                    "Match budgets and crowd size to venue recommendations instantly."}
                  {eventType === "Wedding" &&
                    "Use the shared event foundation today, with room for custom workflows."}
                  {eventType === "Birthday" &&
                    "Launch simple event records now and extend later with tailored flows."}
                  {eventType === "Anniversary" &&
                    "Track events on the dashboard while preparing richer lifecycle modules."}
                </p>
              </div>
              <span className="mt-8 inline-flex items-center text-sm font-semibold text-slate-950 group-hover:text-brand-700">
                {isReady ? "Open workflow" : "Explore dashboard"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
