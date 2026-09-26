import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  CalendarCheck,
  UsersRound,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout, hasPermission } = useAuth();

  // Each link is shown only if the current user holds the permission
  // that its page is actually gated by (see App.jsx's ProtectedRoute usage).
  // "null" means always show (no permission required, e.g. Dashboard/Attendance).
  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, permission: null },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck, permission: null },
    { to: "/users", label: "Users", icon: Users, permission: "users:READ" },
    { to: "/roles", label: "Roles", icon: ShieldCheck, permission: "roles:READ" },
    { to: "/permissions", label: "Permissions", icon: KeyRound, permission: "permissions:READ" },
    { to: "/teacher-assignments", label: "Teacher Assignments", icon: UsersRound, permission: "teachers:MANAGE" },
  ];

  const visibleLinks = links.filter(
    (link) => !link.permission || hasPermission(link.permission)
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">A</div>
        <div>
          <strong>AuthGuard</strong>
          <span>RBAC Console</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">MAIN MENU</div>

        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-button" onClick={logout}>
        <LogOut size={18} />
        <span>Sign out</span>
      </button>
    </aside>
  );
}