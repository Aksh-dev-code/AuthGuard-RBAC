import { GraduationCap, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { visibleLinks } from "../utils/navLinks";

export default function Sidebar() {
  const { logout, hasAnyPermission } = useAuth();
  const links = visibleLinks(hasAnyPermission);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <GraduationCap size={20} aria-hidden="true" />
        </div>
        <div>
          <strong>Coaching Centre</strong>
          <span>Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">MAIN MENU</div>

        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-button" onClick={logout}>
        <LogOut size={18} aria-hidden="true" />
        <span>Sign out</span>
      </button>
    </aside>
  );
}