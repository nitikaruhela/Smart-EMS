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
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <AppErrorBoundary>
          <Suspense
            fallback={
              <div className="glass-panel mt-6 px-8 py-6 text-center">
                <p className="font-display text-xl font-semibold text-slate-900">
                  Loading experience...
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-panel px-8 py-6 text-center">
          <p className="font-display text-xl font-semibold text-slate-900">
            Loading Smart Event Management...
          </p>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
