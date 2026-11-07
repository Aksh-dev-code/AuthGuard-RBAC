import { useCallback, useEffect, useState } from "react";
import { Search, UserMinus, UserPlus, Users } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { initials } from "../utils/labels";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

export default function ClassStudentsPanel({ classId }) {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canEnroll = hasPermission("enrollment:CREATE");
  const canRemove = hasPermission("enrollment:DELETE");

  const [students, setStudents] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [adding, setAdding] = useState(false);
  const [unenrolled, setUnenrolled] = useState([]);
  const [picked, setPicked] = useState([]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api.get(`/classes/${classId}/students`);
      setStudents(res.data.students);
      setState("ready");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load students."));
      setState("error");
    }
  }, [classId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when class changes
    load();
  }, [load]);

  async function openAdd() {
    setAdding(true);
    setPicked([]);
    try {
      const res = await api.get("/enrollments");
      setUnenrolled(res.data.students.filter((s) => !s.class));
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load students without a class."));
    }
  }

  async function addPicked() {
    try {
      await Promise.all(picked.map((studentId) => api.post("/enrollments", { classId, studentId })));
      toast.success(`${picked.length} student${picked.length === 1 ? "" : "s"} added`);
      setAdding(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add the students."));
    }
  }

  async function remove(student) {
    try {
      await api.delete(`/enrollments/${student.id}`);
      await load();
      toast.show({
        message: `${student.name} removed from the class`,
        actionLabel: "Undo",
        onAction: async () => {
          await api.put(`/enrollments/${student.id}`, { classId }).catch(() => toast.error("Could not undo."));
          load();
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not remove the student."));
    }
  }

  const shown = students.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (state === "loading") return <SkeletonList rows={5} height={56} />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="roster-controls">
        <div className="roster-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Search students" aria-label="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {canEnroll && (
          <button className="primary-button" onClick={openAdd}>
            <UserPlus size={16} aria-hidden="true" /> Add students
          </button>
        )}
      </div>

      {adding && (
        <div className="panel add-panel">
          <strong>Students without a class</strong>
          {unenrolled.length === 0 ? (
            <p className="muted">Everyone is already in a class.</p>
          ) : (
            <ul className="pick-list">
              {unenrolled.map((s) => (
                <li key={s.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={picked.includes(s.id)}
                      onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))}
                    />
                    <span>{s.name} <span className="muted">{s.email}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="modal-actions">
            <button className="secondary-button" onClick={() => setAdding(false)}>Cancel</button>
            <button className="primary-button" disabled={picked.length === 0} onClick={addPicked}>
              Add {picked.length || ""}
            </button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "No student matches" : "No students in this class yet"}
          text={!query && canEnroll ? "Use Add students to enrol them." : undefined}
        />
      ) : (
        <ul className="roster-list">
          {shown.map((s) => (
            <li key={s.id} className="roster-row simple">
              <div className="avatar" aria-hidden="true">{initials(s.name)}</div>
              <div className="roster-main">
                <strong>{s.name}</strong>
                <span className="roster-meta">{s.email}</span>
              </div>
              {canRemove && (
                <button className="icon-btn danger" aria-label={`Remove ${s.name} from the class`} onClick={() => remove(s)}>
                  <UserMinus size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}