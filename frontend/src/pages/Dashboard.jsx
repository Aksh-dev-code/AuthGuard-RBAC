import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  KeyRound,
  Activity,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";


export default function Dashboard() {
  const { hasPermission } = useAuth();
  const [counts, setCounts] = useState({ users: null, roles: null, permissions: null });

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      const requests = [];
      requests.push(
        hasPermission("users:READ")
          ? api.get("/users").then((r) => (r.data.users || r.data.data || []).length)
          : Promise.resolve(null)
      );
      requests.push(
        hasPermission("roles:READ")
          ? api.get("/roles").then((r) => (r.data.roles || r.data.data || []).length)
          : Promise.resolve(null)
      );
      requests.push(
        hasPermission("permissions:READ")
          ? api.get("/permission").then((r) => (r.data.permissions || r.data.data || []).length)
          : Promise.resolve(null)
      );

      const [users, roles, permissions] = await Promise.all(
        requests.map((p) => p.catch(() => null))
      );

      if (!cancelled) {
        setCounts({ users, roles, permissions });
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [hasPermission]);

  const stats = [
    {
      title: "Total Users",
      value: counts.users ?? "—",
      icon: Users,
    },

    {
      title: "Active Roles",
      value: counts.roles ?? "—",
      icon: ShieldCheck,
    },

    {
      title: "Permissions",
      value: counts.permissions ?? "—",
      icon: KeyRound,
    },

    {
      title: "System Status",
      value: "Online",
      icon: Activity,
    },

  ];

  return (
    <>

      <PageHeader
        title="Dashboard"
        description="Manage authentication, users, roles and permissions."
      />


      <div className="stats-grid">

        {stats.map(
          ({
            title,
            value,
            icon: Icon,
          }) => (

            <div
              className="stat-card"
              key={title}
            >

              <div className="stat-icon">
                <Icon size={21} />
              </div>


              <div>

                <span>
                  {title}
                </span>

                <strong>
                  {value}
                </strong>

              </div>

            </div>

          )
        )}

      </div>


      <div className="dashboard-grid">

        <div className="panel">

          <h2>
            Access control
          </h2>

          <p>
            Centralised role and permission management.
          </p>


          <div className="access-list">

            <div>
              <b>
                Authentication
              </b>

              <span>
                JWT protected
              </span>
            </div>


            <div>
              <b>
                Authorisation
              </b>

              <span>
                RBAC enabled
              </span>
            </div>


            <div>
              <b>
                Database
              </b>

              <span>
                PostgreSQL
              </span>
            </div>


            <div>
              <b>
                API
              </b>

              <span>
                Express + Prisma
              </span>
            </div>

          </div>

        </div>


        <div className="panel">

          <h2>
            Quick actions
          </h2>


          <div className="quick-actions">

            <a href="/users">
              Manage users
            </a>

            <a href="/roles">
              Manage roles
            </a>

            <a href="/permissions">
              Manage permissions
            </a>

          </div>

        </div>

      </div>

    </>
  );
}