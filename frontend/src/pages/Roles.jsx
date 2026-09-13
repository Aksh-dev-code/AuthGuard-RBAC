import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  RefreshCw,
} from "lucide-react";

import api from "../api/client";

import PageHeader
  from "../components/PageHeader";


export default function Roles() {

  const [roles, setRoles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  async function loadRoles() {

    setLoading(true);


    try {

      const response =
        await api.get("/roles");


      const rows =
        response.data.roles ||
        response.data.data ||
        response.data;


      setRoles(
        Array.isArray(rows)
          ? rows
          : []
      );

    } catch {

      setRoles([]);

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {

    loadRoles();

  }, []);


  return (
    <>

      <PageHeader
        title="Roles"
        description="Define what different types of users can access."
        action={
          <button className="primary-button">

            <Plus size={18} />

            Create role

          </button>
        }
      />


      <div className="toolbar">

        <div />


        <button
          className="secondary-button"
          onClick={loadRoles}
        >

          <RefreshCw size={17} />

          Refresh

        </button>

      </div>


      <div className="cards-grid">

        {loading ? (

          <div className="panel empty">
            Loading roles...
          </div>

        ) : roles.length === 0 ? (

          <div className="panel empty">
            No roles found.
          </div>

        ) : (

          roles.map((role) => (

            <div
              className="role-card"
              key={role.id}
            >

              <div className="role-card-icon">
                <span className="shield-small">
                  ✓
                </span>
              </div>


              <h3>
                {role.name}
              </h3>


              <p>
                {
                  role.description ||
                  "Application access role"
                }
              </p>


              <span className="badge">

                {
                  role.permissions?.length ||
                  0
                }

                {" "}
                permissions

              </span>

            </div>

          ))

        )}

      </div>

    </>
  );
}