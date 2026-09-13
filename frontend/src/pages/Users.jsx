import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import api from "../api/client";

import PageHeader
  from "../components/PageHeader";


export default function Users() {

  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadUsers() {

    setLoading(true);

    setError("");


    try {

      const response =
        await api.get("/users");


      const rows =
        response.data.users ||
        response.data.data ||
        response.data;


      setUsers(
        Array.isArray(rows)
          ? rows
          : []
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Could not load users."
      );

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {

    loadUsers();

  }, []);


  const filteredUsers =
    users.filter((user) => {

      const text =
        `${user.name || ""} ${user.email || ""}`
          .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });


  return (
    <>

      <PageHeader
        title="Users"
        description="View and manage application users."
        action={
          <button className="primary-button">

            <Plus size={18} />

            Add user

          </button>
        }
      />


      <div className="toolbar">

        <div className="table-search">

          <Search size={17} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search users..."
          />

        </div>


        <button
          className="secondary-button"
          onClick={loadUsers}
        >

          <RefreshCw size={17} />

          Refresh

        </button>

      </div>


      <div className="panel table-panel">

        {error && (

          <div className="alert error">
            {error}
          </div>

        )}


        <table>

          <thead>

            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>

          </thead>


          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan="4"
                  className="empty"
                >
                  Loading users...
                </td>
              </tr>

            ) : filteredUsers.length === 0 ? (

              <tr>
                <td
                  colSpan="4"
                  className="empty"
                >
                  No users found.
                </td>
              </tr>

            ) : (

              filteredUsers.map(
                (user) => (

                  <tr key={user.id}>

                    <td>
                      <strong>
                        {
                          user.name ||
                          "Unnamed user"
                        }
                      </strong>
                    </td>


                    <td>
                      {user.email || "—"}
                    </td>


                    <td>

                      <span className="badge">
                        {
                          user.role?.name ||
                          user.role ||
                          "User"
                        }
                      </span>

                    </td>


                    <td>

                      <span className="status active-status">
                        Active
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