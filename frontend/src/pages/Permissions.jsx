import { useEffect, useState } from "react";
import { Plus, RefreshCw, KeyRound, Pencil, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const emptyForm = { id: null, name: "" };

export default function Permissions() {
  const { hasPermission } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission("permissions:CREATE");
  const canUpdate = hasPermission("permissions:UPDATE");
  const canDelete = hasPermission("permissions:DELETE");

  async function loadPermissions() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/permission");
      const rows = response.data.permissions || response.data.data || response.data;
      setPermissions(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load permissions."));
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadPermissions();
  }, []);

  function splitName(name = "") {
    const [resource, action] = name.split(":");
    return { resource: resource || "—", action: action || "—" };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!/^[a-z]+:[A-Z]+$/.test(form.name)) {
      setError('Permission name must look like "resource:ACTION", e.g. "users:CREATE".');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/permission/${form.id}`, { name: form.name });
        setSuccess("Permission updated successfully.");
      } else {
        await api.post("/permission", { name: form.name });
        setSuccess("Permission created successfully.");
      }
      setShowForm(false);
      await loadPermissions();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save permission."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setError("");
    try {
      await api.delete(`/permission/${deleteTarget.id}`);
      setSuccess("Permission deleted successfully.");
      setDeleteTarget(null);
      await loadPermissions();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete permission."));
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Permissions"
        description="Control actions available for each resource."
        action={
          canCreate && (
            <button
              className="primary-button"
              onClick={() => {
                setForm(emptyForm);
                setShowForm(true);
                setSuccess("");
              }}
            >
              <Plus size={18} />
              Add permission
            </button>
          )
        }
      />

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="panel" style={{ marginBottom: 16, padding: 20 }}>
          <label>Name (resource:ACTION)</label>
          <div className="input-icon" style={{ marginBottom: 14 }}>
            <KeyRound size={18} />
            <input
              type="text"
              placeholder="users:CREATE"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div />
        <button className="secondary-button" onClick={loadPermissions}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Permission</th>
              <th>Resource</th>
              <th>Action</th>
              {(canUpdate || canDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="empty">
                  Loading permissions...
                </td>
              </tr>
            ) : permissions.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty">
                  No permissions found.
                </td>
              </tr>
            ) : (
              permissions.map((permission) => {
                const { resource, action } = splitName(permission.name);
                return (
                  <tr key={permission.id}>
                    <td>
                      <strong>
                        <KeyRound size={16} className="inline-icon" />
                        {permission.name}
                      </strong>
                    </td>
                    <td>{resource}</td>
                    <td>
                      <span className="badge">{action}</span>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td>
                        <div style={{ display: "flex", gap: 10 }}>
                          {canUpdate && (
                            <button
                              className="icon-button"
                              onClick={() => {
                                setForm({ id: permission.id, name: permission.name });
                                setShowForm(true);
                                setSuccess("");
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button className="icon-button" onClick={() => setDeleteTarget(permission)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Delete permission</h3>
            <p>Are you sure you want to delete &quot;{deleteTarget.name}&quot;? This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}