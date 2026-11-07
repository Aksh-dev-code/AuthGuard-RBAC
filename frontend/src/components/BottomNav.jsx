import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { visibleLinks } from "../utils/navLinks";

// Phones: the main sections live at the thumb, like WhatsApp / Telegram.
export default function BottomNav() {
  const { hasAnyPermission } = useAuth();
  const [open, setOpen] = useState(false);

  const links = visibleLinks(hasAnyPermission);
  const main = links.length > 5 ? links.slice(0, 4) : links;
  const more = links.length > 5 ? links.slice(4) : [];

  return (
    <>
      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" role="menu" onClick={(e) => e.stopPropagation()}>
            {more.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="sheet-link" role="menuitem" onClick={() => setOpen(false)}>
                <Icon size={20} aria-hidden="true" /> {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Main">
        {main.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        {more.length > 0 && (
          <button onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            <Menu size={22} aria-hidden="true" />
            <span>More</span>
          </button>
        )}
      </nav>
    </>
  );
}