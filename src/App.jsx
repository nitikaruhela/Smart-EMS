import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const EventSelection = lazy(() => import("./pages/EventSelection"));
const CollegeEvent = lazy(() => import("./pages/CollegeEvent"));
const CulturalEvent = lazy(() => import("./pages/CulturalEvent"));
const MapView = lazy(() => import("./pages/MapView"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

function AppShell() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container app-main">
        <AppErrorBoundary>
          <Suspense
            fallback={
              <div className="card empty-state">
                <p className="empty-state__title">Loading experience...</p>
                <p className="empty-state__text">
                  Preparing your workspace and event data.
                </p>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/select"
                element={
                  <ProtectedRoute>
                    <EventSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/college"
                element={
                  <ProtectedRoute>
                    <CollegeEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/cultural"
                element={
                  <ProtectedRoute>
                    <CulturalEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/map"
                element={
                  <ProtectedRoute>
                    <MapView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/create"
                element={
                  <ProtectedRoute allowedRoles={["Organizer"]}>
                    <CollegeEvent createMode />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <main className="container app-main">
          <div className="card empty-state">
            <p className="empty-state__title">Loading Smart Event Management...</p>
            <p className="empty-state__text">
              Syncing your account, permissions, and live event data.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return <AppShell />;
}
