import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeUserRole } from "../utils/userRole";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isFirebaseConfigured } = useAuth();
  const location = useLocation();
  const normalizedRole = normalizeUserRole(role);

  if (!isFirebaseConfigured && location.pathname !== "/login") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
