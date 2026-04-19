import { useMemo, useState } from "react";
import { getVenueRecommendations } from "../services/eventService";

const initialState = {
  location: "",
  attendees: "",
  budget: "",
};

export default function CulturalEvent() {
  const [formData, setFormData] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);

  const recommendations = useMemo(() => {
    if (!submitted) {
      return [];
    }

    return getVenueRecommendations(formData);
  }, [formData, submitted]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="planner-layout">
      <div className="section">
        <div className="section">
          <p className="eyebrow">Cultural Event Planner</p>
          <h1 className="page-title">Match your event brief to venues that fit the crowd and the budget.</h1>
          <p className="page-subtitle">
            The recommendation engine uses structured dummy data now, with a service layer
            ready to swap to a live venue API later.
          </p>
        </div>

        <form className="card auth-form" onSubmit={handleSubmit}>
          <input
            className="input"
            name="location"
            placeholder="Preferred city or area"
            value={formData.location}
            onChange={handleChange}
            required
          />
          <input
            className="input"
            name="attendees"
            type="number"
            min="1"
            placeholder="Number of attendees"
            value={formData.attendees}
            onChange={handleChange}
            required
          />
          <input
            className="input"
            name="budget"
            type="number"
            min="1"
            placeholder="Budget"
            value={formData.budget}
            onChange={handleChange}
            required
          />
          <button type="submit" className="button button--primary">
            Suggest Venues
          </button>
        </form>

        <div className="card">
          <p className="card-kicker">Logic Snapshot</p>
          <ul className="helper-text">
            <li>Capacity must be greater than or equal to requested attendees.</li>
            <li>Price must stay within the submitted budget.</li>
            <li>Location filtering is partial-match and easy to replace with API search.</li>
          </ul>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div>
            <p className="card-kicker">Recommendations</p>
            <h2 className="section-heading">{submitted ? "Best-fit venues" : "Submit your brief to see matches"}</h2>
          </div>
          {submitted ? (
            <span className="pill pill--brand">
              {recommendations.length} match{recommendations.length === 1 ? "" : "es"}
            </span>
          ) : null}
        </div>

        {submitted ? (
          recommendations.length ? (
            <div className="results-grid">
              {recommendations.map((venue) => (
                <article key={venue.id} className="card card--interactive">
                  <div className="split-layout">
                    <div>
                      <p className="eyebrow">{venue.city}</p>
                      <h3 className="section-heading">{venue.name}</h3>
                      <p className="card-copy">{venue.vibe}</p>
                    </div>
                    <div className="stat-grid">
                      <div className="stat-block">
                        <p className="meta-label">Capacity</p>
                        <p className="stat-block__value">{venue.capacity}</p>
                      </div>
                      <div className="stat-block">
                        <p className="meta-label">Price</p>
                        <p className="stat-block__value">
                          INR {venue.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <p className="empty-state__title">No venue matched that brief.</p>
              <p className="empty-state__text">
                Try broadening the location or increasing the budget slightly.
              </p>
            </div>
          )
        ) : (
          <div className="card empty-state">
            <p className="empty-state__title">Recommendations appear here.</p>
            <p className="empty-state__text">
              Submit a location, attendee count, and budget to see venue matches.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
