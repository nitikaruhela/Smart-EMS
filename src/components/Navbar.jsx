import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Event Types", to: "/events/select" },
  { label: "College Events", to: "/events/college" },
  { label: "Cultural Planner", to: "/events/cultural" },
];

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold text-slate-950">
              Smart Event Management
            </p>
            <p className="text-sm text-slate-500">
              Orchestrate registrations, check-ins, and venue planning.
            </p>
          </div>
        </div>

        {user ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3 self-end lg:self-auto">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  {role || "User"}
                </p>
                <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
                  {user.email}
                </p>
              </div>
              <button type="button" onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
