import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingRoleByUser, setPendingRoleByUser] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canUpdate = hasPermission("users:UPDATE");
  const canDelete = hasPermission("users:DELETE");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);
      const userRows = usersRes.data.users || usersRes.data.data || usersRes.data;
      const roleRows = rolesRes.data.roles || rolesRes.data.data || rolesRes.data;
      setUsers(Array.isArray(userRows) ? userRows : []);
      setRoles(Array.isArray(roleRows) ? roleRows : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load users."));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const text = `${user.name || ""} ${user.email || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  async function handleAssignRole(userId) {
    const roleId = pendingRoleByUser[userId];
    if (!roleId) return;
    setError("");
    try {
      await api.post("/assign/user-role", { userId, roleId: Number(roleId) });
      setSuccess("Role assigned successfully.");
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to assign role."));
    }
  }

  async function handleRemoveRole(userId, roleId) {
    setError("");
    try {
      await api.delete("/assign/user-role", { data: { userId, roleId } });
      setSuccess("Role removed successfully.");
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove role."));
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setError("");
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setSuccess("User deleted successfully.");
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete user."));
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="View and manage application users."
      />

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="toolbar">
        <div className="table-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users..."
          />
        </div>

        <button className="secondary-button" onClick={loadUsers}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Roles</th>
              {canUpdate && <th>Assign role</th>}
              {canDelete && <th></th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name || "Unnamed user"}</strong>
                  </td>

                  <td>{user.email || "—"}</td>

                  <td>
                    <span
                      className={`status ${user.status === "ACTIVE" ? "active-status" : ""}`}
                    >
                      {user.status || "ACTIVE"}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(user.roles || []).map((role) => (
                        <span key={role.id} className="badge" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {role.name}
                          {canUpdate && (
                            <button
                              onClick={() => handleRemoveRole(user.id, role.id)}
                              title="Remove role"
                              style={{ display: "inline-flex", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>

                  {canUpdate && (
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <select
                          value={pendingRoleByUser[user.id] || ""}
                          onChange={(e) =>
                            setPendingRoleByUser((prev) => ({ ...prev, [user.id]: e.target.value }))
                          }
                          style={{ fontSize: 12, padding: "4px 6px", borderRadius: 6 }}
                        >
                          <option value="">Select role</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <button className="icon-button" onClick={() => handleAssignRole(user.id)}>
                          <Plus size={16} />
                        </button>
                      </div>
                    </td>
                  )}

                  {canDelete && (
                    <td>
                      <button className="icon-button" onClick={() => setDeleteTarget(user)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Delete user</h3>
            <p>Are you sure you want to delete &quot;{deleteTarget.name}&quot;? This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleDeleteUser}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}