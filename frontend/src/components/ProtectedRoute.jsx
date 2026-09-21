import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ permission }) {
  const { user, loading, isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  const token = localStorage.getItem("accessToken");

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && user && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}