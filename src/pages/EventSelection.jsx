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
    <section className="section">
      <div className="section">
        <p className="eyebrow">Dynamic Workflows</p>
        <h1 className="page-title">Choose an event type and move into the workflow built for it.</h1>
        <p className="page-subtitle">
          College events unlock registration and QR check-ins. Cultural events open the
          venue recommendation planner. Other event types are ready for future workflow
          expansion inside the shared dashboard foundation.
        </p>
      </div>

      <Link to="/events/browser" className="card card--interactive workflow-card">
        <div>
          <p className="eyebrow">Interactive Demo</p>
          <h2 className="workflow-card__title">Event Browser</h2>
          <p className="workflow-card__text">
            Open a responsive event list with clickable cards, a detail panel, and modal
            event previews inside the existing app.
          </p>
        </div>
        <span className="workflow-card__link">Open browser</span>
      </Link>

      <div className="workflow-grid">
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
              className="card card--interactive workflow-card"
            >
              <div>
                <p className="eyebrow">
                  {isReady ? "Ready Workflow" : "Foundation Ready"}
                </p>
                <h2 className="workflow-card__title">{eventType}</h2>
                <p className="workflow-card__text">
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
              <span className="workflow-card__link">{isReady ? "Open workflow" : "Explore dashboard"}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
