import { Bell, GraduationCap, LogOut, Search, UserCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { rolesLabel } from "../utils/labels";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <GraduationCap size={22} aria-hidden="true" />
        <strong>Coaching Centre</strong>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input placeholder="Search..." />
      </div>

      <div className="topbar-actions">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
        </button>

        <div className="profile">
          <UserCircle size={34} />

          <div>
            <strong>{user?.name || user?.email || "User"}</strong>
            <span>{rolesLabel(user?.roles) || "Member"}</span>
          </div>
        </div>

        <button className="icon-button topbar-logout" onClick={logout} aria-label="Sign out">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}