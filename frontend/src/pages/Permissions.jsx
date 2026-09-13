import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  RefreshCw,
  KeyRound,
} from "lucide-react";

import api from "../api/client";

import PageHeader
  from "../components/PageHeader";


export default function Permissions() {

  const [
    permissions,
    setPermissions,
  ] = useState([]);


  const [loading, setLoading] =
    useState(true);


  async function loadPermissions() {

    setLoading(true);


    try {

      const response =
        await api.get(
          "/permissions"
        );


      const rows =
        response.data.permissions ||
        response.data.data ||
        response.data;


      setPermissions(
        Array.isArray(rows)
          ? rows
          : []
      );

    } catch {

      setPermissions([]);

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {

    loadPermissions();

  }, []);


  return (
    <>

      <PageHeader
        title="Permissions"
        description="Control actions available for each resource."
        action={
          <button className="primary-button">

            <Plus size={18} />

            Add permission

          </button>
        }
      />


      <div className="toolbar">

        <div />


        <button
          className="secondary-button"
          onClick={loadPermissions}
        >

          <RefreshCw size={17} />

          Refresh

        </button>

      </div>


      <div className="panel table-panel">

        <table>

          <thead>

            <tr>

              <th>
                Permission
              </th>

              <th>
                Resource
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan="3"
                  className="empty"
                >
                  Loading permissions...
                </td>

              </tr>

            ) : permissions.length === 0 ? (

              <tr>

                <td
                  colSpan="3"
                  className="empty"
                >
                  No permissions found.
                </td>

              </tr>

            ) : (

              permissions.map(
                (permission) => (

                  <tr
                    key={permission.id}
                  >

                    <td>

                      <strong>

                        <KeyRound
                          size={16}
                          className="inline-icon"
                        />

                        {
                          permission.name ||
                          `${permission.action}:${permission.resource}`
                        }

                      </strong>

                    </td>


                    <td>
                      {
                        permission.resource ||
                        "—"
                      }
                    </td>


                    <td>

                      <span className="badge">

                        {
                          permission.action ||
                          "—"
                        }

                      </span>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </>
  );
}