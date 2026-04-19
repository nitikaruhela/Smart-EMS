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
    <section className="section auth-page split-layout">
      <div className="section">
        <p className="eyebrow">Smart Access Control</p>
        <h1 className="page-title">Start as an organizer or attendee in one guided signup flow.</h1>
        <p className="page-subtitle">
          Roles are stored in Firestore and power protected routes, dashboard actions,
          and event-specific workflows across the application.
        </p>
      </div>

      <div className="card">
        <div className="auth-form__header">
          <h2 className="auth-form__title">Create account</h2>
          <p className="auth-form__caption">Choose your role to unlock the right workflow.</p>
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
            minLength={6}
            required
          />

          <div className="role-options">
            {roles.map((role) => {
              const active = formData.role === role;

              return (
                <label
                  key={role}
                  className={`role-card ${active ? "role-card--active" : ""}`}
                >
                  <input
                    className="visually-hidden"
                    type="radio"
                    name="role"
                    value={role}
                    checked={active}
                    onChange={handleChange}
                  />
                  <div>
                    <p className="role-card__title">{role}</p>
                    <p className="role-card__text">
                      {role === "Organizer"
                        ? "Create events, review analytics, and run check-ins."
                        : "Browse, register, and track your event access."}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {!isFirebaseConfigured ? (
            <p className="alert alert--warning">
              Add Firebase keys to `.env` using `.env.example` before authentication can
              work.
            </p>
          ) : null}
          {error ? <p className="alert alert--danger">{error}</p> : null}

          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="auth-form__footer">
          Already have an account?{" "}
          <Link to="/login" className="text-link">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
