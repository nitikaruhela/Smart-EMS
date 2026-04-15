import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roles = ["Organizer", "Attendee"];

export default function Signup() {
  const { user, signup, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Organizer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(formData);
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr,1.1fr]">
      <div className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">
          Smart Access Control
        </p>
        <h1 className="font-display text-5xl font-bold leading-tight text-slate-950">
          Start as an organizer or attendee in one guided signup flow.
        </h1>
        <p className="text-lg text-slate-600">
          Roles are stored in Firestore and power protected routes, dashboard actions,
          and event-specific workflows across the application.
        </p>
      </div>

      <div className="glass-panel p-8">
        <div className="space-y-2 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-950">Create account</h2>
          <p className="text-slate-500">Choose your role to unlock the right workflow.</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            className="input-field"
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            className="input-field"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            required
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => {
              const active = formData.role === role;

              return (
                <label
                  key={role}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    active
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white hover:border-brand-200"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="role"
                    value={role}
                    checked={active}
                    onChange={handleChange}
                  />
                  <p className="font-display text-lg font-semibold text-slate-950">{role}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {role === "Organizer"
                      ? "Create events, review analytics, and run check-ins."
                      : "Browse, register, and track your event access."}
                  </p>
                </label>
              );
            })}
          </div>

          {!isFirebaseConfigured ? (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Add Firebase keys to `.env` using `.env.example` before authentication can
              work.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
