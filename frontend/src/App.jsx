import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";
import TeacherAssignments from "./pages/TeacherAssignments";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        Loading...
      </div>
    );
  }

  return (
    <Routes>

      {/* Login */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Register */}
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Protected application */}
      <Route element={<ProtectedRoute />}>

        <Route element={<Layout />}>

          <Route
            path="/"
            element={<Dashboard />}
          />
          <Route path="/attendance" element={<Attendance />} />

          <Route element={<ProtectedRoute permission="teachers:MANAGE" />}>
            <Route path="/teacher-assignments" element={<TeacherAssignments />} />
            </Route>

          <Route element={<ProtectedRoute permission="users:READ" />}>
            <Route
              path="/users"
              element={<Users />}
            />
          </Route>

          <Route element={<ProtectedRoute permission="roles:READ" />}>
            <Route
              path="/roles"
              element={<Roles />}
            />
          </Route>

          <Route element={<ProtectedRoute permission="permissions:READ" />}>
            <Route
              path="/permissions"
              element={<Permissions />}
            />
          </Route>

        </Route>

      </Route>

      {/* Unknown route */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? "/" : "/login"}
            replace
          />
        }
      />

    </Routes>
  );
}