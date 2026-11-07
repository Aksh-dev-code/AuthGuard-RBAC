import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import ClassDetail from "./pages/ClassDetail";
import Attendance from "./pages/Attendance";
import Questions from "./pages/Questions";
import Subjects from "./pages/Subjects";
import Enrollment from "./pages/Enrollment";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      {/* Protected application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Each guard lists the permissions that unlock the page (any one is enough).
              The server re-checks everything: these guards only save a pointless round trip. */}
          <Route element={<ProtectedRoute permission={["classes:READ", "classes:READ_ASSIGNED", "classes:READ_OWN"]} />}>
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:classId" element={<ClassDetail />} />
          </Route>

          <Route element={<ProtectedRoute permission={["attendance:READ", "attendance:READ_ASSIGNED", "attendance:READ_OWN"]} />}>
            <Route path="/attendance" element={<Attendance />} />
          </Route>

          <Route element={<ProtectedRoute permission={["questions:READ", "questions:READ_ASSIGNED", "questions:READ_OWN_CLASS"]} />}>
            <Route path="/questions" element={<Questions />} />
          </Route>

          <Route element={<ProtectedRoute permission="subjects:UPDATE" />}>
            <Route path="/subjects" element={<Subjects />} />
          </Route>

          <Route element={<ProtectedRoute permission="enrollment:READ" />}>
            <Route path="/enrollment" element={<Enrollment />} />
          </Route>

          <Route element={<ProtectedRoute permission="users:READ" />}>
            <Route path="/users" element={<Users />} />
          </Route>

          <Route element={<ProtectedRoute permission="roles:READ" />}>
            <Route path="/roles" element={<Roles />} />
          </Route>

          <Route element={<ProtectedRoute permission="permissions:READ" />}>
            <Route path="/permissions" element={<Permissions />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}