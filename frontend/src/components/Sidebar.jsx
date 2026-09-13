import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  LogOut,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";


const links = [

  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },

  {
    to: "/users",
    label: "Users",
    icon: Users,
  },

  {
    to: "/roles",
    label: "Roles",
    icon: ShieldCheck,
  },

  {
    to: "/permissions",
    label: "Permissions",
    icon: KeyRound,
  },

];


export default function Sidebar() {

  const { logout } =
    useAuth();


  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="brand">

        <div className="brand-mark">
          A
        </div>

        <div>

          <strong>
            AuthGuard
          </strong>

          <span>
            RBAC Console
          </span>

        </div>

      </div>


      {/* Navigation */}

      <nav className="sidebar-nav">

        <div className="nav-label">
          MAIN MENU
        </div>


        {links.map(
          ({
            to,
            label,
            icon: Icon,
          }) => (

            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <Icon size={19} />

              <span>
                {label}
              </span>

            </NavLink>

          )
        )}

      </nav>


      {/* Logout */}

      <button
        className="logout-button"
        onClick={logout}
      >

        <LogOut size={18} />

        <span>
          Sign out
        </span>

      </button>

    </aside>
  );
}