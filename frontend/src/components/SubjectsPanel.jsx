import { useCallback, useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import ConfirmModal from "./ConfirmModal";

// Subjects of ONE class: add / rename / delete subjects and assign teachers.
export default function SubjectsPanel({ classId }) {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canCreate = hasPermission("subjects:CREATE");
  const canUpdate = hasPermission("subjects:UPDATE");
  const canDelete = hasPermission("subjects:DELETE");

  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null); // { id, name }
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api.get("/subjects", { params: { classId } });
      setSubjects(res.data.subjects);
      setState("ready");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load subjects."));
      setState("error");
    }
  }, [classId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when class changes
    load();
  }, [load]);

  useEffect(() => {
    if (!canUpdate) return;
    api
      .get("/users")
      .then((res) => setTeachers(res.data.users.filter((u) => (u.roles || []).some((r) => r.name === "teacher"))))
      .catch(() => setTeachers([]));
  }, [canUpdate]);

  const run = async (fn, okMessage) => {
    try {
      await fn();
      if (okMessage) toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Something went wrong."));
    }
  };

  const addSubject = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Enter a subject name (2+ letters).");
    run(() => api.post("/subjects", { classId, name }), "Subject added").then(() => setName(""));
  };

  const saveRename = (e) => {
    e.preventDefault();
    run(() => api.put(`/subjects/${editing.id}`, { name: editing.name }), "Subject renamed").then(() => setEditing(null));
  };

  const assign = (subjectId, teacherId) =>
    run(() => api.post(`/subjects/${subjectId}/teachers`, { teacherId: Number(teacherId) }), "Teacher assigned");

  const unassign = async (subject, teacher) => {
    try {
      await api.delete(`/subjects/${subject.id}/teachers/${teacher.id}`);
      await load();
      toast.show({
        message: `${teacher.name} removed from ${subject.name}`,
        actionLabel: "Undo",
        onAction: () => assign(subject.id, teacher.id),
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not remove the teacher."));
    }
  };

  const confirmDelete = () => {
    const s = toDelete;
    setToDelete(null);
    run(() => api.delete(`/subjects/${s.id}`), `${s.name} deleted`);
  };

  if (state === "loading") return <SkeletonList rows={3} height={96} />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      {canCreate && (
        <form className="inline-form" onSubmit={addSubject}>
          <input
            placeholder="New subject, e.g. Mathematics"
            aria-label="Subject name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="primary-button" type="submit">
            <Plus size={16} aria-hidden="true" /> Add subject
          </button>
        </form>
      )}

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          text={canCreate ? "Add the first subject above." : "Subjects will appear here once they are added."}
        />
      ) : (
        <ul className="card-list">
          {subjects.map((s) => {
            const free = teachers.filter((t) => !s.teachers.some((x) => x.id === t.id));
            return (
              <li key={s.id} className="card-row">
                <div className="card-row-head">
                  {editing?.id === s.id ? (
                    <form className="inline-form" onSubmit={saveRename}>
                      <input
                        aria-label="Subject name"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        autoFocus
                      />
                      <button className="primary-button" type="submit">Save</button>
                      <button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{s.name}</strong>
                        <span className="muted"> · {s.questionCount} question{s.questionCount === 1 ? "" : "s"}</span>
                      </div>
                      <div className="row-actions">
                        {canUpdate && (
                          <button className="icon-btn" aria-label={`Rename ${s.name}`} onClick={() => setEditing({ id: s.id, name: s.name })}>
                            <Pencil size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button className="icon-btn danger" aria-label={`Delete ${s.name}`} onClick={() => setToDelete(s)}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="chip-row">
                  {s.teachers.length === 0 && <span className="muted">No teacher assigned</span>}
                  {s.teachers.map((t) => (
                    <span key={t.id} className="tag">
                      {t.name}
                      {canUpdate && (
                        <button aria-label={`Remove ${t.name} from ${s.name}`} onClick={() => unassign(s, t)}>
                          <X size={14} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {canUpdate && free.length > 0 && (
                  <select
                    className="select-compact"
                    aria-label={`Assign a teacher to ${s.name}`}
                    value=""
                    onChange={(e) => e.target.value && assign(s.id, e.target.value)}
                  >
                    <option value="">+ Assign teacher</option>
                    {free.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toDelete && (
        <ConfirmModal
          title={`Delete ${toDelete.name}?`}
          message={`Its ${toDelete.questionCount} question(s) will be deleted too. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}