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
    <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">
            Cultural Event Planner
          </p>
          <h1 className="font-display text-4xl font-bold text-slate-950">
            Match your event brief to venues that fit the crowd and the budget.
          </h1>
          <p className="text-lg text-slate-600">
            The recommendation engine uses structured dummy data now, with a service layer
            ready to swap to a live venue API later.
          </p>
        </div>

        <form className="glass-panel space-y-4 p-6" onSubmit={handleSubmit}>
          <input
            className="input-field"
            name="location"
            placeholder="Preferred city or area"
            value={formData.location}
            onChange={handleChange}
            required
          />
          <input
            className="input-field"
            name="attendees"
            type="number"
            min="1"
            placeholder="Number of attendees"
            value={formData.attendees}
            onChange={handleChange}
            required
          />
          <input
            className="input-field"
            name="budget"
            type="number"
            min="1"
            placeholder="Budget"
            value={formData.budget}
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn-primary w-full">
            Suggest Venues
          </button>
        </form>

        <div className="glass-panel p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Logic Snapshot</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Capacity must be greater than or equal to requested attendees.</li>
            <li>Price must stay within the submitted budget.</li>
            <li>Location filtering is partial-match and easy to replace with API search.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
              Recommendations
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
              {submitted ? "Best-fit venues" : "Submit your brief to see matches"}
            </h2>
          </div>
          {submitted ? (
            <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              {recommendations.length} match{recommendations.length === 1 ? "" : "es"}
            </span>
          ) : null}
        </div>

        {submitted ? (
          recommendations.length ? (
            <div className="grid gap-6">
              {recommendations.map((venue) => (
                <article key={venue.id} className="glass-panel p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
                        {venue.city}
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                        {venue.name}
                      </h3>
                      <p className="mt-3 max-w-2xl text-slate-600">{venue.vibe}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[280px]">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Capacity
                        </p>
                        <p className="mt-2 font-semibold text-slate-800">{venue.capacity}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Price
                        </p>
                        <p className="mt-2 font-semibold text-slate-800">
                          INR {venue.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-8 text-slate-500">
              No venue matched that combination. Try broadening the location or increasing
              the budget slightly.
            </div>
          )
        ) : (
          <div className="glass-panel p-8 text-slate-500">
            Recommendations will appear here once you submit a location, attendee count,
            and budget.
          </div>
        )}
      </div>
    </section>
  );
}
