import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// permission can be one name or a list (any of them is enough).
export default function ProtectedRoute({ permission }) {
  const { user, loading, isAuthenticated, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  const token = localStorage.getItem("accessToken");

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && user && !hasAnyPermission([].concat(permission))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}