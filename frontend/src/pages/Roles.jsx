import { useEffect, useState } from "react";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const emptyForm = { id: null, name: "", permissions: [] };

export default function Roles() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission("roles:CREATE");
  const canUpdate = hasPermission("roles:UPDATE");
  const canDelete = hasPermission("roles:DELETE");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/roles"),
        api.get("/permission"),
      ]);
      const roleRows = rolesRes.data.roles || rolesRes.data.data || rolesRes.data;
      const permRows = permsRes.data.permissions || permsRes.data.data || permsRes.data;
      setRoles(Array.isArray(roleRows) ? roleRows : []);
      setPermissions(Array.isArray(permRows) ? permRows : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load roles."));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadData();
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setShowForm(true);
    setSuccess("");
  }

  function openEditForm(role) {
    setForm({
      id: role.id,
      name: role.name,
      permissions: (role.permissions || []).map((rp) => rp.permission.name),
    });
    setShowForm(true);
    setSuccess("");
  }

  function togglePermission(name) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(name)
        ? prev.permissions.filter((p) => p !== name)
        : [...prev.permissions, name],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name || form.permissions.length === 0) {
      setError("Role name and at least one permission are required.");
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/roles/${form.id}`, { name: form.name, permissions: form.permissions });
        setSuccess("Role updated successfully.");
      } else {
        await api.post("/roles", { name: form.name, permissions: form.permissions });
        setSuccess("Role created successfully.");
      }
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save role."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setError("");
    try {
      await api.delete(`/roles/${deleteTarget.id}`);
      setSuccess("Role deleted successfully.");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete role."));
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Roles"
        description="Define what different types of users can access."
        action={
          canCreate && (
            <button className="primary-button" onClick={openCreateForm}>
              <Plus size={18} />
              Create role
            </button>
          )
        }
      />

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="panel" style={{ marginBottom: 16, padding: 20 }}>
          <label>Role name</label>
          <div className="input-icon" style={{ marginBottom: 14, maxWidth: 320 }}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <label>Permissions</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 8,
              maxHeight: 220,
              overflowY: "auto",
              margin: "8px 0 16px",
            }}
          >
            {permissions.map((perm) => (
              <label key={perm.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.permissions.includes(perm.name)}
                  onChange={() => togglePermission(perm.name)}
                />
                {perm.name}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Save role"}
            </button>
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div />
        <button className="secondary-button" onClick={loadData}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="cards-grid">
        {loading ? (
          <div className="panel empty">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="panel empty">No roles found.</div>
        ) : (
          roles.map((role) => (
            <div className="role-card" key={role.id}>
              <div className="role-card-icon">
                <span className="shield-small">✓</span>
              </div>

              <h3>{role.name}</h3>

              <p>{role.permissions?.length || 0} permissions</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
                {(role.permissions || []).map((rp) => (
                  <span key={rp.permission.id} className="badge">
                    {rp.permission.name}
                  </span>
                ))}
              </div>

              {(canUpdate || canDelete) && (
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  {canUpdate && (
                    <button className="icon-button" onClick={() => openEditForm(role)}>
                      <Pencil size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button className="icon-button" onClick={() => setDeleteTarget(role)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Delete role</h3>
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