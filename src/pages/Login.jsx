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
    <section className="section auth-page split-layout">
      <div className="section">
        <p className="eyebrow">Event Operations Platform</p>
        <h1 className="page-title">Build, launch, and track smarter events from one dashboard.</h1>
        <p className="page-subtitle">
          Manage college events, venue recommendations, registrations, and QR-based
          check-ins with a streamlined role-based experience.
        </p>
        <div className="feature-grid">
          {[
            ["Live Analytics", "See registrations and check-ins update in real time."],
            ["Role-Based Access", "Organizers and attendees see only what they need."],
            ["Mobile Ready", "Responsive workflows for browsing, joining, and scanning."],
          ].map(([title, detail]) => (
            <div key={title} className="card feature-card">
              <p className="feature-card__title">{title}</p>
              <p className="helper-text">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="auth-form__header">
          <h2 className="auth-form__title">Welcome back</h2>
          <p className="auth-form__caption">Log in to continue managing your event flows.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            className="input"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {!isFirebaseConfigured ? (
            <p className="alert alert--warning">
              Add Firebase keys to `.env` using `.env.example` before authentication can
              work.
            </p>
          ) : null}
          {error || authError ? (
            <p className="alert alert--danger">{error || authError}</p>
          ) : null}
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="auth-form__footer">
          New here?{" "}
          <Link to="/signup" className="text-link">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
