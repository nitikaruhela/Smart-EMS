import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Event Types", to: "/events/select" },
  { label: "Event Browser", to: "/events/browser" },
  { label: "College Events", to: "/events/college" },
  { label: "Map View", to: "/events/map" },
  { label: "Cultural Planner", to: "/events/cultural" },
];

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <div className="navbar__brand">
          <div>
            <p className="navbar__title">Smart Event Management</p>
            <p className="navbar__subtitle">
              Orchestrate registrations, check-ins, and venue planning.
            </p>
          </div>
        </div>

        <div className="navbar__menu">
          <button
            type="button"
            className="navbar__toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="navbar__toggle-bar" />
            <span className="navbar__toggle-bar" />
            <span className="navbar__toggle-bar" />
          </button>

          {user ? (
            <div className={`navbar__content ${menuOpen ? "navbar__content--open" : ""}`}>
              <nav id="primary-navigation" className="navbar__nav">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `navbar__link ${isActive ? "navbar__link--active" : ""}`.trim()
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="navbar__meta">
                <div className="navbar__user">
                  <p className="navbar__role">{role || "User"}</p>
                  <p className="navbar__email">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="button button--secondary navbar__button"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`navbar__content navbar__content--public ${
                menuOpen ? "navbar__content--open" : ""
              }`}
            >
              <nav id="primary-navigation" className="navbar__nav">
                {navItems.slice(0, 3).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `navbar__link ${isActive ? "navbar__link--active" : ""}`.trim()
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
