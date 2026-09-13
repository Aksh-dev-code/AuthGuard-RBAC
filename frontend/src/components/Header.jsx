import {
  Bell,
  Search,
  UserCircle,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";


export default function Header() {

  const { user } =
    useAuth();


  return (
    <header className="topbar">

      <div className="search-box">

        <Search size={18} />

        <input
          placeholder="Search..."
        />

      </div>


      <div className="topbar-actions">

        <button
          className="icon-button"
        >
          <Bell size={19} />
        </button>


        <div className="profile">

          <UserCircle size={34} />

          <div>

            <strong>
              {
                user?.name ||
                user?.email ||
                "Administrator"
              }
            </strong>

            <span>
              {
                user?.role?.name ||
                user?.role ||
                "Admin"
              }
            </span>

          </div>

        </div>

      </div>

    </header>
  );
}   