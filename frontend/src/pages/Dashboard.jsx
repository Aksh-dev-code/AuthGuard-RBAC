import {
  Users,
  ShieldCheck,
  KeyRound,
  Activity,
} from "lucide-react";

import PageHeader from "../components/PageHeader";


const stats = [

  {
    title: "Total Users",
    value: "—",
    icon: Users,
  },

  {
    title: "Active Roles",
    value: "—",
    icon: ShieldCheck,
  },

  {
    title: "Permissions",
    value: "—",
    icon: KeyRound,
  },

  {
    title: "System Status",
    value: "Online",
    icon: Activity,
  },

];


export default function Dashboard() {

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