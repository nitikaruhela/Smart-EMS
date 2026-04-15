import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, authError, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={from} replace />;
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
      await login(formData);
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 lg:grid-cols-[1.2fr,0.8fr]">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">
          Event Operations Platform
        </p>
        <h1 className="max-w-2xl font-display text-5xl font-bold leading-tight text-slate-950">
          Build, launch, and track smarter events from one dashboard.
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          Manage college events, venue recommendations, registrations, and QR-based
          check-ins with a streamlined role-based experience.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Live Analytics", "See registrations and check-ins update in real time."],
            ["Role-Based Access", "Organizers and attendees see only what they need."],
            ["Mobile Ready", "Responsive workflows for browsing, joining, and scanning."],
          ].map(([title, detail]) => (
            <div key={title} className="glass-panel p-5">
              <p className="font-display text-lg font-semibold text-slate-900">{title}</p>
              <p className="mt-2 text-sm text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-8">
        <div className="space-y-2 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-950">Welcome back</h2>
          <p className="text-slate-500">Log in to continue managing your event flows.</p>
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
            required
          />
          {!isFirebaseConfigured ? (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Add Firebase keys to `.env` using `.env.example` before authentication can
              work.
            </p>
          ) : null}
          {error || authError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error || authError}
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-brand-700">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
